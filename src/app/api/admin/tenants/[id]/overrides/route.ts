/**
 * Admin API: Subscription Overrides (Top-ups / Manual Extensions)
 * 
 * GET  — List all overrides for a tenant
 * POST — Create a new override (free-text feature key, quantity, reason)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'
import { AdminSupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.admin'
import { AddSubscriptionOverrideUseCase } from '@/modules/tenant/application/add-subscription-override.usecase'

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

    const overrides = await repo.getSubscriptionOverrides(tenantId)

    return NextResponse.json({
      success: true,
      overrides,
    })
  } catch (error) {
    console.error('[Admin] Overrides GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overrides' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Body expects: { featureKey, quantity, expiresAt?, reason? }
    const { featureKey, quantity, expiresAt, reason } = body

    if (!featureKey || typeof featureKey !== 'string') {
      return NextResponse.json(
        { error: 'featureKey is required (string)' },
        { status: 400 }
      )
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be a positive number' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)
    const usecase = new AddSubscriptionOverrideUseCase(repo)

    const result = await usecase.execute({
      tenantId,
      input: {
        featureKey,
        quantity,
        expiresAt: expiresAt || null,
        reason: reason || null,
        createdBy: auth.user?.email || 'admin',
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      override: result.override,
    }, { status: 201 })
  } catch (error) {
    console.error('[Admin] Overrides POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create override' },
      { status: 500 }
    )
  }
}
