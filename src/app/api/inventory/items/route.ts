import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { GetItemsUseCase } from '@/modules/inventory/application/get-items.use-case'
import { CreateItemUseCase } from '@/modules/inventory/application/create-item.use-case'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

const createSchema = z.object({
  stockKeepingUnit: z.string().optional(),
  name: z.string().min(1),
  unitCost: z.number().min(0),
  sellPrice: z.number().min(0),
  stockOnHand: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()
    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new GetItemsUseCase(repository)
    const items = await useCase.execute()

    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const json = await request.json()
    const result = createSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const supabase = await createClient()
    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new CreateItemUseCase(repository)
    const item = await useCase.execute(result.data)

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('Error creating inventory item:', error)
    if (error.message?.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
