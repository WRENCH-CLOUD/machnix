import { TenantRepository } from '../infrastructure/tenant.repository'
import { AuthRepository } from '../../access/infrastructure/auth.repository'
import { JwtClaimsService } from '../../access/application/jwt-claim.service'
import { TenantUserRepository } from '../../access/infrastructure/tenant-user.repository'
import { SupabaseClient } from '@supabase/supabase-js'

interface CreateTenantWithOwnerInput {
  tenantName: string
  tenantSlug: string
  adminName: string
  adminEmail: string
  adminPhone?: string
  subscription: 'starter' | 'pro' | 'enterprise'
  notes?: string
}

export class CreateTenantWithOwnerUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly authRepo: AuthRepository,
    private readonly jwtClaims: JwtClaimsService,
    private readonly tenantUserRepo: TenantUserRepository,
    private readonly supabaseAdmin: SupabaseClient
  ) {}

  async execute(input: CreateTenantWithOwnerInput) {
    const {
      tenantName,
      tenantSlug,
      adminName,
      adminEmail,
      adminPhone,
      subscription,
    } = input;

    // 1. Validate
    if (!tenantName || !tenantSlug || !adminEmail || !adminName) {
      throw new Error('Missing required fields')
    }

    // 2. Slug uniqueness
    const slugAvailable = await this.tenantRepo.isSlugAvailable(tenantSlug)
    if (!slugAvailable) {
      throw new Error('Tenant slug already exists')
    }

    // 3. Email uniqueness
    const emailExists = await this.authRepo.emailExists(adminEmail)
    if (emailExists) {
      throw new Error('Admin email already registered')
    }

    // Rollback handles
    let tenantId: string | null = null
    let authUserId: string | null = null

    try {
      // 4. Create tenant
      const tenant = await this.tenantRepo.create({
        name: tenantName,
        slug: tenantSlug,
        subscription,
        status: 'active',
      })
      tenantId = tenant.id

      // 5. Create auth user
      const authUser = await this.authRepo.createUser({
        email: adminEmail,
        emailVerified: false,
        phone: adminPhone,
        password: Math.random().toString(36).slice(-8), // temp password
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
      await this.jwtClaims.setTenantUserClaims(
        this.supabaseAdmin,
        authUser.id,
        'tenant_owner',
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

