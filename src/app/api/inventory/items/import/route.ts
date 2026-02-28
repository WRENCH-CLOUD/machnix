import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { BulkImportItemsUseCase } from '@/modules/inventory/application/bulk-import-items.use-case'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'
import { CreateItemInput } from '@/modules/inventory/domain/inventory.entity'
import Papa from 'papaparse'

// ============================================================================
// Column mapping — maps common CSV header names to CreateItemInput fields
// ============================================================================

const COLUMN_MAP: Partial<Record<keyof CreateItemInput, string[]>> = {
  name: ['name', 'item', 'item_name', 'part', 'part_name', 'description'],
  stockKeepingUnit: ['sku', 'stock_keeping_unit', 'part_number', 'part_no', 'item_code', 'code'],
  unitCost: ['unit_cost', 'cost', 'purchase_price', 'buy_price', 'cost_price'],
  sellPrice: ['sell_price', 'price', 'selling_price', 'mrp', 'retail_price', 'sale_price'],
  stockOnHand: ['stock', 'quantity', 'qty', 'stock_on_hand', 'on_hand', 'opening_stock'],
  reorderLevel: ['reorder_level', 'reorder', 'min_stock', 'minimum_stock', 'reorder_point'],
}

function resolveColumn(header: string): keyof CreateItemInput | null {
  const normalized = header.toLowerCase().trim().replace(/[\s-]+/g, '_')
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    if (aliases.includes(normalized)) {
      return field as keyof CreateItemInput
    }
  }
  return null
}

function mapRowToInput(row: Record<string, string>, headerMap: Map<string, keyof CreateItemInput>, rowIndex: number): (CreateItemInput & { _row: number }) | null {
  const input: Partial<CreateItemInput> & { _row: number } = { _row: rowIndex }

  for (const [csvHeader, field] of headerMap.entries()) {
    const rawValue = row[csvHeader]
    // Treat null, undefined, empty, and whitespace-only as missing
    const value = rawValue?.trim()
    if (!value) continue

    switch (field) {
      case 'name':
        input.name = value
        break
      case 'stockKeepingUnit':
        // Only set SKU if it's a non-empty meaningful string
        if (value.toLowerCase() !== 'null' && value !== '-' && value !== 'n/a') {
          input.stockKeepingUnit = value
        }
        break
      case 'unitCost':
      case 'sellPrice': {
        const num = parseFloat(value.replace(/[₹$,]/g, ''))
        // Default to 0 for NaN or negative values
        input[field] = (!isNaN(num) && num >= 0) ? num : 0
        break
      }
      case 'stockOnHand':
      case 'reorderLevel': {
        const int = parseInt(value.replace(/,/g, ''), 10)
        // Default to 0 for NaN or negative values
        input[field] = (!isNaN(int) && int >= 0) ? int : 0
        break
      }
    }
  }

  // Skip rows where name is empty, whitespace-only, or a null-like placeholder
  const name = input.name?.trim()
  if (!name || name.toLowerCase() === 'null' || name === '-' || name.toLowerCase() === 'n/a') {
    return null
  }

  return {
    name,
    stockKeepingUnit: input.stockKeepingUnit,
    unitCost: input.unitCost ?? 0,
    sellPrice: input.sellPrice ?? 0,
    stockOnHand: input.stockOnHand ?? 0,
    reorderLevel: input.reorderLevel ?? 0,
    _row: input._row,
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv') {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
    }

    const text = await file.text()

    // Parse CSV
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    })

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV', details: parsed.errors }, { status: 400 })
    }

    // Build header mapping
    const headers = parsed.meta.fields || []
    const headerMap = new Map<string, keyof CreateItemInput>()
    for (const h of headers) {
      const field = resolveColumn(h)
      if (field) headerMap.set(h, field)
    }

    if (!headerMap.size) {
      return NextResponse.json({
        error: 'Could not match any CSV columns to inventory fields',
        hint: 'Expected columns like: name, sku, unit_cost, sell_price, stock, reorder_level',
        foundHeaders: headers,
      }, { status: 400 })
    }

    // Map rows to CreateItemInput
    const items = parsed.data
      .map((row, i) => mapRowToInput(row, headerMap, i + 1))
      .filter((item): item is (CreateItemInput & { _row: number }) => item !== null)

    if (items.length === 0) {
      return NextResponse.json({
        error: 'No valid rows found in CSV',
        hint: 'Make sure at least the "name" column is present and rows are not empty',
      }, { status: 400 })
    }

    // Execute bulk import
    const supabase = await createClient()
    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const useCase = new BulkImportItemsUseCase(repository)
    const result = await useCase.execute(items)

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error importing inventory:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
