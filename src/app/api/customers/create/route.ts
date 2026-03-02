import { NextRequest, NextResponse } from 'next/server'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { CreateCustomerUseCase } from '@/modules/customer/application/create-customer.use-case'
import { apiGuardWrite } from '@/lib/auth/api-guard'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  phone: z.string().max(20, "Phone number too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email too long").optional().or(z.literal('')),
  address: z.string().max(500, "Address too long").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const guard = await apiGuardWrite(request, 'create-customer')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

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
