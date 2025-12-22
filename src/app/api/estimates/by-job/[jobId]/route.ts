"use server";

import { NextRequest, NextResponse } from "next/server";
import { SupabaseEstimateRepository } from "@/app/modules/estimate-management/infrastructure/estimate.repository.supabase";
import { GetEstimateByJobIdUseCase } from "@/app/modules/estimate-management/application/get-estimate-by-job-id.use-case";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const repository = new SupabaseEstimateRepository();
    const useCase = new GetEstimateByJobIdUseCase(repository);

    const estimate = await useCase.execute(params.jobId);

    if (!estimate) {
      return NextResponse.json(
        { message: "Estimate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(estimate);
  } catch (error: any) {
    console.error("Error fetching estimate by job ID:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}
