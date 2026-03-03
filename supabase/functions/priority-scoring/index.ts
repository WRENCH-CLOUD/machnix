import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

console.log("Priority Scoring Edge Function Started");

// Formula Weights
const WEIGHTS = {
  PROFITABILITY: 0.4,
  URGENCY: 0.3,
  CUSTOMER: 0.2,
  LABOR: 0.1,
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received Webhook Payload:", JSON.stringify(payload, null, 2));

    // Ensure we have a payload and it's from a table we care about
    // This function will listen to job_card_tasks and jobcards insertions/updates
    if (!payload.record || !payload.table) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
    }

    const { table, type, record, old_record } = payload;

    // Use service role key — this function is called by DB webhooks,
    // not by authenticated users, so there is no Bearer token to forward.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (table === "job_card_tasks") {
      if (type === "INSERT" || type === "UPDATE") {
        // SCORE CALCULATION
        await handleTaskUpsert(supabase, record, old_record);
      }
    } else if (table === "jobcards") {
      if (type === "UPDATE") {
        // TRICKLE DOWN PRIORITY TO ALL TASKS if urgency fields changed
        await handleJobcardUpdate(supabase, record, old_record);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error Processing Webhook:", error);
    return new Response(JSON.stringify({ error }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// ============================================================================
// Handlers
// ============================================================================

async function handleTaskUpsert(supabase, task, old_task) {
  // 1. Efficiency Loop Check: Was it just completed?
  if (
    task.task_status === "COMPLETED" &&
    (!old_task || old_task.task_status !== "COMPLETED")
  ) {
    await updateMechanicEfficiency(supabase, task);
  }

  // 2. Score Recalculation (Only for DRAFT or APPROVED tasks)
  if (task.task_status !== "COMPLETED") {
    await recalculateTaskPriority(supabase, task);
  }
}

async function handleJobcardUpdate(
  supabase,
  jobcard,
  old_jobcard,
) {
  // If urgency fields didn't change, ignore
  if (
    jobcard.is_waiting_on_site === old_jobcard?.is_waiting_on_site &&
    jobcard.hard_deadline === old_jobcard?.hard_deadline &&
    jobcard.soft_deadline === old_jobcard?.soft_deadline
  ) {
    return;
  }

  console.log(`Jobcard ${jobcard.id} urgency changed. Recalculating tasks...`);

  // Fetch all active tasks for this jobcard
  const { data: tasks, error } = await supabase
    .schema("tenant")
    .from("job_card_tasks")
    .select("*")
    .eq("jobcard_id", jobcard.id)
    .neq("task_status", "COMPLETED");

  if (error) {
    console.error("Failed to fetch tasks for jobcard update:", error);
    return;
  }

  for (const task of tasks || []) {
    await recalculateTaskPriority(supabase, task, jobcard);
  }
}

// ============================================================================
// Logic functions
// ============================================================================

async function updateMechanicEfficiency(supabase: any, task: any) {
  if (
    !task.completed_by || !task.actual_time_minutes ||
    !task.estimated_time_minutes
  ) {
    console.log("Missing data for efficiency calculation on task", task.id);
    return;
  }

  const ratio = task.estimated_time_minutes / task.actual_time_minutes;
  // Cap ratio between 0.5 (half as fast) and 1.5 (50% faster)
  const normalizedRatio = Math.max(0.5, Math.min(1.5, ratio));

  console.log(
    `Calculating Efficiency: Est=${task.estimated_time_minutes}m, Act=${task.actual_time_minutes}m, Ratio=${normalizedRatio}`,
  );

  // Fetch mechanic
  const { data: mechanic, error: fetchError } = await supabase
    .schema("tenant")
    .from("mechanics")
    .select("id, efficiency_score")
    .eq("auth_user_id", task.completed_by) // Assuming completed_by is auth_user_id
    .single();

  // fallback mapping if completed_by uses mechanics.id directly
  let targetMechanicId = mechanic?.id;
  let currentScore = mechanic?.efficiency_score || 1.0;

  if (fetchError && fetchError.code === "PGRST116") {
    // Try mechanic id directly
    const { data: directMech } = await supabase
      .schema("tenant")
      .from("mechanics")
      .select("id, efficiency_score")
      .eq("id", task.completed_by)
      .single();

    if (directMech) {
      targetMechanicId = directMech.id;
      currentScore = directMech.efficiency_score || 1.0;
    }
  }

  if (!targetMechanicId) return;

  // EMA (Exponential Moving Average) to smooth out scores
  // 80% old score, 20% new performance
  const newScore = (currentScore * 0.8) + (normalizedRatio * 0.2);
  const finalScore = parseFloat(newScore.toFixed(2));

  console.log(
    `Updating Mechanic ${targetMechanicId} Efficiency: ${currentScore} -> ${finalScore}`,
  );

  await supabase
    .schema("tenant")
    .from("mechanics")
    .update({ efficiency_score: finalScore })
    .eq("id", targetMechanicId);
}

async function recalculateTaskPriority(
  supabase: any,
  task: any,
  inLieuJobcard?: any,
) {
  let jobcard = inLieuJobcard;

  if (!jobcard) {
    // Fetch jobcard to get urgency fields
    const { data, error } = await supabase
      .schema("tenant")
      .from("jobcards")
      .select("is_waiting_on_site, hard_deadline, soft_deadline")
      .eq("id", task.jobcard_id)
      .single();

    if (error) {
      console.error("Failed to fetch jobcard for task", task.id, error);
      return;
    }
    jobcard = data;
  }

  // 1. PROFITABILITY SCORE (0-100)
  // Compare total charge vs labor cost
  let pScore = 0;
  const laborCost = task.labor_cost_snapshot || 0;
  let partsCharge = 0;
  if (task.action_type === "REPLACED" && task.unit_price_snapshot && task.qty) {
    partsCharge = task.unit_price_snapshot * task.qty;
  }
  const totalRevenue = partsCharge + laborCost;
  if (totalRevenue > 0) {
    // If revenue > 0, score based on margin. (Higher margin = higher score)
    // Let's assume a baseline 0 margin is 20 points, 50% margin is 70 points.
    // Simplified: The more absolute profit + ratio, the better.
    // For now: Cap at 100 based on absolute revenue size (demo purposes)
    pScore = Math.min(100, totalRevenue / 100);
  }

  // 2. URGENCY SCORE (0-100)
  let uScore = 0;
  const now = Date.now();
  if (jobcard.hard_deadline) {
    const hardDate = new Date(jobcard.hard_deadline).getTime();
    const msLeft = hardDate - now;
    const hoursLeft = msLeft / (1000 * 60 * 60);

    if (hoursLeft <= 0) uScore = 100; // Overdue!
    else if (hoursLeft < 2) uScore = 90;
    else if (hoursLeft < 6) uScore = 70;
    else if (hoursLeft < 24) uScore = 50;
    else uScore = 20;
  } else if (jobcard.soft_deadline) {
    const softDate = new Date(jobcard.soft_deadline).getTime();
    const msLeft = softDate - now;
    const hoursLeft = msLeft / (1000 * 60 * 60);
    if (hoursLeft <= 0) uScore = 80;
    else if (hoursLeft < 4) uScore = 50;
    else uScore = 20;
  }

  // 3. CUSTOMER SCORE (0-100)
  let cScore = 0;
  if (jobcard.is_waiting_on_site) {
    cScore = 100; // "Ticking time bomb" - Hormozi
  }

  // 4. LABOR AVAILABILITY SCORE (0-100)
  // High if the required skill is rare or the mechanic is about to leave
  // (Simplified for MVP: fixed 50, but would ideally query mechanic schedules)
  let lScore = 50;

  // CALCULATE FINAL
  const finalScore = (pScore * WEIGHTS.PROFITABILITY) +
    (uScore * WEIGHTS.URGENCY) +
    (cScore * WEIGHTS.CUSTOMER) +
    (lScore * WEIGHTS.LABOR);

  console.log(
    `Task ${task.id} Score: ${
      finalScore.toFixed(2)
    } [P:${pScore}, U:${uScore}, C:${cScore}, L:${lScore}]`,
  );

  // Update the task (only if priority changed to avoid circular webhook triggers)
  // OR we use the direct DB update bypassing webhook if we use a special service role.
  // To be safe, bypass triggers by strictly checking equality
  if (Math.abs((task.priority_score || 0) - finalScore) > 0.01) {
    await supabase
      .schema("tenant")
      .from("job_card_tasks")
      .update({ priority_score: parseFloat(finalScore.toFixed(2)) })
      .eq("id", task.id);
  }
}
