import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { RecordTransactionUseCase } from '@/modules/inventory/application/record-transaction.use-case'
import { ReferenceType, TransactionType } from '@/modules/inventory/domain/inventory.entity'

const transactionSchema = z.object({
  itemId: z.string().uuid(),
  transactionType: z.enum(['purchase', 'sale', 'adjustment_in', 'adjustment_out', 'return', 'usage']),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0).optional(),
  referenceType: z.enum(['jobcard', 'invoice', 'purchase_order', 'manual']).optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().optional()
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const referenceType = searchParams.get('referenceType')
    const referenceId = searchParams.get('referenceId')

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

    if (itemId) {
      const transactions = await repository.findTransactionsByItem(itemId)
      return NextResponse.json(transactions)
    }

    if (referenceType && referenceId) {
        const validRefTypes = ['jobcard', 'invoice', 'purchase_order', 'manual']
        if (!validRefTypes.includes(referenceType)) {
             return NextResponse.json({ error: 'Invalid referenceType' }, { status: 400 })
        }
        const transactions = await repository.findTransactionsByReference(referenceType as ReferenceType, referenceId)
        return NextResponse.json(transactions)
    }

    return NextResponse.json([])

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
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
    const result = transactionSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new RecordTransactionUseCase(repository)

    const input = {
        itemId: result.data.itemId,
        transactionType: result.data.transactionType as TransactionType,
        quantity: result.data.quantity,
        unitCost: result.data.unitCost,
        referenceType: result.data.referenceType as ReferenceType | undefined,
        referenceId: result.data.referenceId,
        notes: result.data.notes,
        createdBy: user.id
    }

    const transaction = await useCase.execute(input)

    return NextResponse.json(transaction)
  } catch (error: any) {
    console.error('Error recording transaction:', error)
    if (error.message === 'Item not found') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
