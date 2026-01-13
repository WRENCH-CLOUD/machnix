import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CreateTenantWithOwnerUseCase } from '@/modules/tenant'
import { SupabaseAuthRepository } from '@/modules/access/infrastructure/auth.repository.supabase'
import { JwtClaimsService } from '@/modules/access/application/jwt-claim.service'
import { SupabaseTenantUserRepository } from '@/modules/access/infrastructure/tenant-user.repository.supabase'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'
import { AdminSupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || 'Forbidden' },
        { status: auth.status ?? 403 }
      )
    }

    // Initialize admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Parse request body
    const body = await request.json()

    // Create use case with all dependencies
    const usecase = new CreateTenantWithOwnerUseCase(
      new AdminSupabaseTenantRepository(supabaseAdmin),
      new SupabaseAuthRepository(),
      new JwtClaimsService(),
      new SupabaseTenantUserRepository(),
      supabaseAdmin
    )

    // Execute the use case
    const result = await usecase.execute(body)

    return NextResponse.json({
      success: true,
      message: 'Tenant created successfully',
      ...result
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tenant'
    
    // Handle known business rule errors with 400
    const businessErrors = [
      'Tenant slug already exists',
      'Owner email already registered',
      'Invalid tenant data',
    ]
    const isBusinessError = businessErrors.some(e => message.includes(e))
    
    if (isBusinessError) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }
    
    console.error('[TENANT_CREATE] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create tenant. Please try again.',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}
