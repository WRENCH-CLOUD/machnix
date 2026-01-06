import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { CreateCustomerUseCase } from '@/modules/customer/application/create-customer.use-case'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  phone: z.string().max(20, "Phone number too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email too long").optional().or(z.literal('')),
  address: z.string().max(500, "Address too long").optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit write operations
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'create-customer')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await request.json()
    const validatedBody = createCustomerSchema.parse(body)
    
    const repository = new SupabaseCustomerRepository(supabase, tenantId)
    const useCase = new CreateCustomerUseCase(repository)
    
    const result = await useCase.execute(validatedBody, tenantId)
    
    if (!result.success) {
      // Return 409 Conflict with existing customer info
      return NextResponse.json({
        duplicatePhone: true,
        existingCustomer: result.existingCustomer,
        message: `A customer with this phone number already exists: ${result.existingCustomer.name}`,
      }, { status: 409 })
    }

    return NextResponse.json(result.customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: 400 }
    )
  }
}
