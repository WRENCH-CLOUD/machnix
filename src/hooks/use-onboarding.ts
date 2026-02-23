'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface OnboardingStatus {
  isOnboarded: boolean
  tenantName: string
  settings: {
    legalName?: string
    gstNumber?: string
    panNumber?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    businessPhone?: string
    businessEmail?: string
    taxRate?: number
    currency?: string
    invoicePrefix?: string
    jobPrefix?: string
  } | null
}

export interface CompleteOnboardingInput {
  garageName: string
  legalName?: string
  gstNumber?: string
  panNumber?: string
  address: string
  city: string
  state: string
  pincode?: string
  businessPhone: string
  businessEmail?: string
  taxRate?: number
  currency?: string
  invoicePrefix?: string
  jobPrefix?: string
  newPassword?: string
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await fetch('/api/tenant/onboarding')
  if (!response.ok) {
    throw new Error('Failed to fetch onboarding status')
  }
  return response.json()
}

async function completeOnboarding(data: CompleteOnboardingInput): Promise<{ success: boolean }> {
  const response = await fetch('/api/tenant/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to complete onboarding')
  }
  return response.json()
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: fetchOnboardingStatus,
    // Once onboarded, status never changes mid-session — cache indefinitely
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    retry: 1
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      // Invalidate onboarding status to refetch
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] })
      // Also invalidate tenant settings since we updated them
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
    }
  })
}
