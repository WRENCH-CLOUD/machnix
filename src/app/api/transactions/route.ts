import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, TENANT_MANAGER_ROLES } from '@/lib/auth/api-guard'

/**
 * GET /api/transactions
 * List all payment transactions for the current tenant with related data
 */
export async function GET(request: NextRequest) {
    try {
        const guard = await apiGuard(request, { requiredRoles: TENANT_MANAGER_ROLES })
        if (!guard.ok) return guard.response
        const { supabase, tenantId } = guard

        // Fetch transactions with related invoice, customer, vehicle, jobcard data
        const { data: transactions, error } = await supabase
            .schema('tenant')
            .from('payment_transactions')
            .select(`
        id,
        amount,
        mode,
        status,
        created_at,
        paid_at,
        invoice_id,
        invoices!inner (
          id,
          invoice_number,
          customer_id,
          jobcard_id,
          customers (
            id,
            name,
            phone
          ),
          jobcards (
            id,
            job_number,
            vehicle_id,
            vehicles (
              id,
              reg_no,
              make,
              model
            )
          )
        )
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching transactions:', error)
            throw error
        }

        // Transform data for frontend
        const transformedData = (transactions || []).map((tx: any) => ({
            id: tx.id,
            amount: tx.amount,
            mode: tx.mode,
            status: tx.status,
            createdAt: tx.created_at,
            paidAt: tx.paid_at,
            invoice: {
                id: tx.invoices?.id,
                invoiceNumber: tx.invoices?.invoice_number,
            },
            customer: tx.invoices?.customers ? {
                id: tx.invoices.customers.id,
                name: tx.invoices.customers.name,
                phone: tx.invoices.customers.phone,
            } : null,
            jobcard: tx.invoices?.jobcards ? {
                id: tx.invoices.jobcards.id,
                jobNumber: tx.invoices.jobcards.job_number,
            } : null,
            vehicle: tx.invoices?.jobcards?.vehicles ? {
                id: tx.invoices.jobcards.vehicles.id,
                regNo: tx.invoices.jobcards.vehicles.reg_no,
                make: tx.invoices.jobcards.vehicles.make,
                model: tx.invoices.jobcards.vehicles.model,
            } : null,
        }))

        return NextResponse.json(transformedData)
    } catch (error: any) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}
