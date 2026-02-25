/**
 * Admin API: Tenant Subscription Management
 * 
 * GET  — Fetch full subscription state + usage snapshot
 * PATCH — Update subscription (tier, dates, pricing)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'
import { AdminSupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.admin'
import { UpdateSubscriptionUseCase } from '@/modules/tenant/application/update-subscription.usecase'
import { EntitlementService } from '@/lib/entitlements/entitlement.service'
import { normalizeTier, TIER_LIMITS, TIER_PRICING } from '@/config/plan-features'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || 'Forbidden' },
        { status: auth.status ?? 403 }
      )
    }

    const { id: tenantId } = await params
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)

    // Fetch tenant
    const tenant = await repo.findById(tenantId)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get subscription state
    const entitlementService = new EntitlementService(supabaseAdmin)
    const subscriptionState = entitlementService.getSubscriptionState(tenant)

    // Get usage snapshot
    const usage = await repo.getUsageSnapshot(tenantId)

    // Get overrides
    const overrides = await repo.getSubscriptionOverrides(tenantId)
    const activeOverrides = overrides.filter(o => {
      const now = new Date()
      return new Date(o.validFrom) <= now && (!o.expiresAt || new Date(o.expiresAt) > now)
    })

    // Get invoices
    const invoices = await repo.getSubscriptionInvoices(tenantId)

    // Get tier limits and pricing
    const tier = normalizeTier(tenant.subscription)
    const limits = TIER_LIMITS[tier]
    const pricing = TIER_PRICING[tier]

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscriptionState,
        limits,
        pricing,
        usage,
        overrides: activeOverrides,
        allOverrides: overrides,
        invoices,
      },
    })
  } catch (error) {
    console.error('[Admin] Subscription GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || 'Forbidden' },
        { status: auth.status ?? 403 }
      )
    }

    const { id: tenantId } = await params
    const body = await request.json()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)
    const usecase = new UpdateSubscriptionUseCase(repo, supabaseAdmin)

    const result = await usecase.execute({
      tenantId,
      updates: body,
      adminEmail: auth.user?.email || undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      tenant: result.tenant,
      invoice: result.invoice,
      proration: result.proration,
    })
  } catch (error) {
    console.error('[Admin] Subscription PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
