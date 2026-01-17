import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { CompleteOnboardingUseCase } from '@/modules/tenant/application/complete-onboarding.usecase'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for onboarding data
const onboardingSchema = z.object({
  garageName: z.string().min(1, 'Garage name is required'),
  legalName: z.string().optional(),
  gstNumber: z.string().min(1, 'GST Number is required'),
  panNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().optional(),
  businessPhone: z.string().min(1, 'Phone number is required'),
  businessEmail: z.string().email().optional().or(z.literal('')),
  taxRate: z.number().optional(),
  currency: z.string().optional(),
  invoicePrefix: z.string().optional(),
  jobPrefix: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
})

// GET /api/tenant/onboarding - Get onboarding status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const repository = new SupabaseTenantRepository(supabase)
    const tenant = await repository.findById(tenantId)

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Also fetch current settings for pre-filling the form
    const settings = await repository.getSettings(tenantId)

    return NextResponse.json({
      isOnboarded: tenant.isOnboarded,
      tenantName: tenant.name,
      settings: settings
    })
  } catch (error: unknown) {
    console.error('Error fetching onboarding status:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch onboarding status'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// POST /api/tenant/onboarding - Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = onboardingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { newPassword, ...onboardingData } = validationResult.data

    // Update password if provided
    if (newPassword && newPassword.length > 0) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (passwordError) {
        console.error('Error updating password:', passwordError)
        return NextResponse.json(
          { error: `Failed to update password: ${passwordError.message}` },
          { status: 400 }
        )
      }
    }

    const repository = new SupabaseTenantRepository(supabase)
    const useCase = new CompleteOnboardingUseCase(repository)
    
    const result = await useCase.execute({
      tenantId,
      ...onboardingData
    })
    
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error completing onboarding:', error)
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
