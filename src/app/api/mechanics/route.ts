import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseMechanicRepository } from '@/modules/mechanic/infrastructure/mechanic.repository.supabase'
import { GetMechanicsUseCase } from '@/modules/mechanic/application/get-mechanics.use-case'
import { CreateMechanicUseCase } from '@/modules/mechanic/application/create-mechanic.use-case'
import { normalizeTier, isModuleAccessible } from '@/config/plan-features'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { EntitlementService } from '@/lib/entitlements'

/**
 * GET /api/mechanics
 * List all mechanics for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Check for activeOnly query param
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const repository = new SupabaseMechanicRepository(supabase, tenantId)
    const useCase = new GetMechanicsUseCase(repository)

    const mechanics = await useCase.execute(activeOnly)

    return NextResponse.json(mechanics)
  } catch (error: any) {
    console.error('Error fetching mechanics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mechanics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mechanics
 * Create a new mechanic
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Check module access
    const tier = normalizeTier(user.app_metadata.subscription_tier)
    if (!isModuleAccessible(tier, 'mechanics')) {
        return NextResponse.json({ 
            error: 'Mechanics module not available on your plan.',
            required_tier: 'pro'
        }, { status: 403 })
    }

    // Check staff count limit via EntitlementService
    const supabaseAdmin = getSupabaseAdmin()
    const entitlementService = new EntitlementService(supabaseAdmin)
    
    // Usage snapshot includes staff_count
    const usage = await entitlementService.getUsageSnapshot(tenantId)
    const check = await entitlementService.checkEntitlement(tenantId, tier, 'staffCount', usage.staffCount)

    if (!check.allowed) {
        return NextResponse.json({ 
            error: `Limit reached: You can only add ${check.effectiveLimit} mechanics on the ${tier} plan.`,
            code: 'LIMIT_REACHED',
            current: check.current,
            limit: check.effectiveLimit
        }, { status: 429 })
    }

    const body = await request.json()

    const repository = new SupabaseMechanicRepository(supabase, tenantId)
    const useCase = new CreateMechanicUseCase(repository)

    const mechanic = await useCase.execute({
      name: body.name,
      phone: body.phone,
      email: body.email,
    })

    return NextResponse.json(mechanic, { status: 201 })
  } catch (error: any) {
    console.error('Error creating mechanic:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create mechanic' },
      { status: 500 }
    )
  }
}
