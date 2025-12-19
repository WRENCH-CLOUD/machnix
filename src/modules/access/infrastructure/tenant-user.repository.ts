export interface TenantUserRepository {
create(input:{
    tenantId: string
    authUserId: string
    name: string
    email: string
    phone?: string
    role: 'tenant_owner' | 'manager' | 'mechanic'
}): Promise<void>

deactivate(tenantId: string, authUserId: string): Promise<void>

findByTenantAndAuthUser(tenantId: string, authUserId: string): Promise<String | null>

findRole(
    tenantId: string,
    authUserId: string
):Promise<'tenant_owner'| 'mechanic' | null>

}
