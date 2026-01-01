-- Create a view to fetch tenant stats efficiently
-- This view aggregates stats for each tenant to avoid N+1 query issues
-- WITH (security_invoker = true) ensures that RLS policies on underlying tables are respected

CREATE OR REPLACE VIEW tenant.tenant_stats_view WITH (security_invoker = true) AS
SELECT
    t.id,
    t.name,
    t.slug,
    t.created_at,
    t.metadata,
    (SELECT count(*) FROM tenant.customers c WHERE c.tenant_id = t.id) as customer_count,
    (SELECT count(*) FROM tenant.jobcards j WHERE j.tenant_id = t.id AND j.status IN ('pending', 'in_progress', 'on_hold')) as active_jobs,
    (SELECT count(*) FROM tenant.jobcards j WHERE j.tenant_id = t.id AND j.status = 'completed') as completed_jobs,
    (SELECT count(*) FROM tenant.users u WHERE u.tenant_id = t.id AND u.role = 'mechanic' AND u.is_active = true) as mechanic_count,
    COALESCE((SELECT sum(total_amount) FROM tenant.invoices i WHERE i.tenant_id = t.id AND i.status = 'paid'), 0) as total_revenue
FROM tenant.tenants t;

-- Grant permissions
GRANT SELECT ON tenant.tenant_stats_view TO authenticated;
GRANT SELECT ON tenant.tenant_stats_view TO service_role;
