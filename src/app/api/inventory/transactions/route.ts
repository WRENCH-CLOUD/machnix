import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { RecordTransactionUseCase } from '@/modules/inventory/application/record-transaction.use-case'
import { InventoryTransaction, ReferenceType, TransactionType } from '@/modules/inventory/domain/inventory.entity'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

/** Strip internal DB fields before sending to client */
function toSafeTransaction({ id, tenantId, referenceId, ...rest }: InventoryTransaction & { itemName?: string }) {
  return rest
}

const transactionSchema = z.object({
  itemId: z.string().uuid(),
  transactionType: z.enum(['purchase', 'sale', 'adjustment_in', 'adjustment_out', 'return', 'usage']),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0).optional(),
  referenceType: z.enum(['jobcard', 'invoice', 'purchase_order', 'manual']).optional(),
  referenceId: z.string().uuid().optional()
})
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const referenceType = searchParams.get('referenceType')
    const referenceId = searchParams.get('referenceId')
    const limit = searchParams.get('limit')

    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()

    const repository = new SupabaseInventoryRepository(supabase, tenantId)

    if (itemId) {
      const transactions = await repository.findTransactionsByItem(itemId)
      return NextResponse.json(transactions.map(toSafeTransaction))
    }

    if (referenceType && referenceId) {
      const validRefTypes = ['jobcard', 'invoice', 'purchase_order', 'manual']
      if (!validRefTypes.includes(referenceType)) {
        return NextResponse.json({ error: 'Invalid referenceType' }, { status: 400 })
      }
      const transactions = await repository.findTransactionsByReference(referenceType as ReferenceType, referenceId)
      return NextResponse.json(transactions.map(toSafeTransaction))
    }

    // Return recent transactions with item names
    const recentLimit = limit ? parseInt(limit, 10) : 20
    const transactions = await repository.findRecentTransactions(recentLimit)
    return NextResponse.json(transactions.map(toSafeTransaction))

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

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
      createdBy: userId
    }

    const transaction = await useCase.execute(input)

    return NextResponse.json(toSafeTransaction(transaction), { status: 201 })
  } catch (error: any) {
    console.error('Error recording transaction:', error)
    if (error.message === 'Item not found') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    if (error.message === 'Quantity must be positive') {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 })
    }
    if (error.message === 'Insufficient stock') {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
