DROP POLICY IF EXISTS inventory_allocations_select ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_select ON tenant.inventory_allocations FOR SELECT
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_allocations_insert ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_insert ON tenant.inventory_allocations FOR INSERT
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_allocations_update ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_update ON tenant.inventory_allocations FOR UPDATE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_platform_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS inventory_allocations_delete ON tenant.inventory_allocations;
CREATE POLICY inventory_allocations_delete ON tenant.inventory_allocations FOR DELETE
  USING (public.is_platform_admin() OR tenant_id = public.current_tenant_id());