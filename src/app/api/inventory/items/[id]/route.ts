import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { UpdateItemUseCase } from '@/modules/inventory/application/update-item.use-case'
import { DeleteItemUseCase } from '@/modules/inventory/application/delete-item.use-case'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

const updateSchema = z.object({
  stockKeepingUnit: z.string().optional(),
  name: z.string().optional(),
  unitCost: z.number().min(0).optional(),
  sellPrice: z.number().min(0).optional(),
  stockOnHand: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const item = await repository.findById(id)

    if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()

    const json = await request.json()
    const result = updateSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new UpdateItemUseCase(repository)
    const item = await useCase.execute(id, result.data)

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error updating inventory item:', error)
    if (error.message === 'Item not found') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    if (error.message?.includes('stockKeepingUnit already in use')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new DeleteItemUseCase(repository)
    await useCase.execute(id, userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting inventory item:', error)
    if (error.message === 'Item not found') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
