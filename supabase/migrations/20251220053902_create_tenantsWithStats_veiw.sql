create or replace view tenant.admin_tenant_overview as
select
  t.id,
  t.name,
  t.status,
  t.created_at,

  -- customers
  (
    select count(*)
    from tenant.customers c
    where c.tenant_id = t.id
  ) as customer_count,

  -- active jobs
  (
    select count(*)
    from tenant.jobcards j
    where j.tenant_id = t.id
      and j.status in ('pending', 'in_progress', 'on_hold')
  ) as active_jobs,

  -- completed jobs
  (
    select count(*)
    from tenant.jobcards j
    where j.tenant_id = t.id
      and j.status = 'completed'
  ) as completed_jobs,

  -- mechanics
  (
    select count(*)
    from tenant.mechanics m
    where m.tenant_id = t.id
  ) as mechanic_count,

  -- revenue
  coalesce(
    (
      select sum(i.total_amount)
      from tenant.invoices i
      where i.tenant_id = t.id
        and i.status = 'paid'
    ),
    0
  ) as total_revenue

from tenant.tenants t
order by t.created_at desc;
