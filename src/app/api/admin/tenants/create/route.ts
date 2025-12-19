import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CreateTenantWithOwnerUseCase } from '@/modules/tenant/application/create-tenant-with-owner-usecase'
import { TenantRepository } from '@/modules/tenant/infrastructure/tenant.repository'
import { SupabaseAuthRepository } from '@/modules/access/infrastructure/auth.repository.supabase'
import { JwtClaimsService } from '@/modules/access/application/jwt-claim.service'
import { SupabaseTenantUserRepository } from '@/modules/access/infrastructure/tenant-user.repository.supabase'

export async function POST(request: NextRequest) {
  try {
    // Initialize admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Parse request body
    const body = await request.json()

    console.log(`[TENANT_CREATE] Initiating tenant creation for: ${body.tenantName} (${body.tenantSlug})`)

    // Create use case with all dependencies
    const usecase = new CreateTenantWithOwnerUseCase(
      new TenantRepository(),
      new SupabaseAuthRepository(),
      new JwtClaimsService(),
      new SupabaseTenantUserRepository(),
      supabaseAdmin
    )

    // Execute the use case
    const result = await usecase.execute(body)

    console.log(`[TENANT_CREATE] Tenant creation completed successfully for: ${body.tenantName}`)

    return NextResponse.json({
      success: true,
      message: 'Tenant created successfully',
      ...result
    })

  } catch (error) {
    console.error('[TENANT_CREATE] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create tenant',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}
