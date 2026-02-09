import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { GetItemsUseCase } from '@/modules/inventory/application/get-items.use-case'
import { CreateItemUseCase } from '@/modules/inventory/application/create-item.use-case'

const createSchema = z.object({
  stock_keeping_unit: z.string().optional(),
  name: z.string().min(1),
  unitCost: z.number().min(0),
  sellPrice: z.number().min(0),
  stockOnHand: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  metadata: z.record(z.any()).optional()
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

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
    const result = createSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new CreateItemUseCase(repository)
    const item = await useCase.execute(result.data)

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error creating inventory item:', error)
    if (error.message?.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
