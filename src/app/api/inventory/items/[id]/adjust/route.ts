import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { StockAdjustmentUseCase } from '@/modules/inventory/application/stock-adjustment.use-case'

const adjustSchema = z.object({
  quantity: z.number().int().positive(),
  type: z.enum(['in', 'out'])
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const json = await request.json()
    const result = adjustSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new StockAdjustmentUseCase(repository)

    await useCase.execute({
      itemId: id,
      quantity: result.data.quantity,
      type: result.data.type,
      createdBy: user.id
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error adjusting stock:', error)
    if (error.message === 'Item not found') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
