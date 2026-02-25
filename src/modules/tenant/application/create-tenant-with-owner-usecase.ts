import { TenantRepository } from '../infrastructure/tenant.repository'
import { AuthRepository } from '../../access/infrastructure/auth.repository'
import { JwtClaimsService } from '../../access/application/jwt-claim.service'
import { TenantUserRepository } from '../../access/infrastructure/tenant-user.repository'
import { SupabaseClient } from '@supabase/supabase-js'
import { JWT_ROLES } from '../../access/application/jwt-claims'
import { type SubscriptionTier, normalizeTier } from '@/config/plan-features'

interface CreateTenantWithOwnerInput {
  tenantName: string
  tenantSlug: string
  adminName: string
  adminEmail: string
  adminPhone?: string
  subscription: SubscriptionTier | string  // accepts legacy values like 'basic'
  notes?: string
}

export class CreateTenantWithOwnerUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly authRepo: AuthRepository,
    private readonly jwtClaims: JwtClaimsService,
    private readonly tenantUserRepo: TenantUserRepository,
    private readonly supabaseAdmin: SupabaseClient
  ) { }

  async execute(input: CreateTenantWithOwnerInput) {
    const {
      tenantName,
      tenantSlug,
      adminName,
      adminEmail,
      adminPhone,
      subscription,
    } = input;

    // 1. Validate required fields
    if (!tenantName?.trim() || !tenantSlug?.trim() || !adminEmail?.trim() || !adminName?.trim()) {
      throw new Error('Missing required fields: tenantName, tenantSlug, adminEmail, and adminName are required')
    }

    // 2. Slug uniqueness
    const slugAvailable = await this.tenantRepo.isSlugAvailable(tenantSlug)
    if (!slugAvailable) {
      throw new Error(`Tenant slug "${tenantSlug}" already exists`)
    }

    // 3. Email uniqueness
    const emailExists = await this.authRepo.emailExists(adminEmail)
    if (emailExists) {
      throw new Error(`Admin email "${adminEmail}" already registered`)
    }

    // Rollback handles
    let tenantId: string | null = null
    let authUserId: string | null = null

    try {
      // 4. Create tenant
      const tenant = await this.tenantRepo.create({
        name: tenantName,
        slug: tenantSlug,
        subscription: normalizeTier(subscription), // Normalize 'basic' → 'basic'
        status: 'active',
      })
      tenantId = tenant.id

      // 5. Create auth user
      const authUser = await this.authRepo.createUser({
        email: adminEmail,
        phone: adminPhone,
        password: 'Welcome123!', // default password
        metadata: {
          name: adminName,
          tenant_id: tenant.id,
        },
      })

      if (!authUser || !authUser.id) {
        throw new Error('Failed to create auth user')
      }

      authUserId = authUser.id

      // 6. Set JWT claims (CRITICAL for RLS)
      // Use standardized JWT role value for the tenant owner
      // Import JWT_ROLES from the JWT claims config
      await this.jwtClaims.setTenantUserClaims(
        this.supabaseAdmin,
        authUser.id,
        JWT_ROLES.TENANT,
        tenant.id
      )

      // 7. Create tenant.users mapping
      await this.tenantUserRepo.create({
        tenantId: tenant.id,
        authUserId: authUser.id,
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        role: 'tenant_owner',
      })

      // 8. Success
      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        owner: {
          id: authUser.id,
          email: adminEmail,
        },
      }
    } catch (error) {
      // 9. Rollback (SAGA-style)
      if (authUserId) {
        await this.authRepo.deleteUser(authUserId)
      }

      if (tenantId) {
        await this.tenantRepo.delete(tenantId)
      }

      throw error
    }
  }
}
