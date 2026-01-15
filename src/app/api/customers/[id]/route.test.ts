import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/modules/customer/infrastructure/customer.repository.supabase', () => ({
  SupabaseCustomerRepository: vi.fn(),
}))

vi.mock('@/modules/customer/application/get-customer-by-id.use-case', () => ({
  GetCustomerByIdUseCase: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GetCustomerByIdUseCase } from '@/modules/customer/application/get-customer-by-id.use-case'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'

describe('GET /api/customers/[id]', () => {
  let mockSupabase: any
  let mockUseCase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)

    mockUseCase = {
      execute: vi.fn(),
    }
    
    // Mock the constructor to return our mockUseCase instance
    vi.mocked(GetCustomerByIdUseCase).mockImplementation(function () { return mockUseCase as any })
    vi.mocked(SupabaseCustomerRepository).mockImplementation(function () { return {} as any })
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const request = new NextRequest('http://localhost:3000/api/customers/123')
    const params = Promise.resolve({ id: '123' })
    
    const response = await GET(request, { params })
    
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('should return customer if found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          app_metadata: { tenant_id: 'tenant-1' },
          user_metadata: {},
        },
      },
    })

    const mockCustomer = { id: '123', name: 'John Doe' }
    mockUseCase.execute.mockResolvedValue(mockCustomer)

    const request = new NextRequest('http://localhost:3000/api/customers/123')
    const params = Promise.resolve({ id: '123' })
    
    const response = await GET(request, { params })
    
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual(mockCustomer)
  })
})
