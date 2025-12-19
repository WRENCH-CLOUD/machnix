import { NextRequest, NextResponse } from 'next/server'
import { SupabaseUserRepository } from '@/modules/user/infrastructure/user.repository.supabase'
import { GetAllMechanicsUseCase } from '@/modules/user/application/get-all-mechanics.use-case'

export async function GET() {
  try {
    const repository = new SupabaseUserRepository()
    const useCase = new GetAllMechanicsUseCase(repository)
    
    const mechanics = await useCase.execute()
    
    return NextResponse.json(mechanics)
  } catch (error: any) {
    console.error('Error fetching mechanics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mechanics' },
      { status: 500 }
    )
  }
}
