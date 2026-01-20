'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Building2, MapPin, Phone, FileText, Sparkles, Lock, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useCompleteOnboarding, OnboardingStatus } from '@/hooks/use-onboarding'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
]

const onboardingSchema = z.object({
  garageName: z.string().min(1, 'Garage name is required'),
  legalName: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().optional(),
  businessPhone: z.string().min(1, 'Phone number is required'),
  businessEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  taxRate: z.number().optional(),
  currency: z.string().optional(),
  invoicePrefix: z.string().optional(),
  jobPrefix: z.string().optional(),
  // Password fields - optional since user can skip
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal(''))
}).refine((data) => {
  // If newPassword is provided, confirmPassword must match
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword === data.confirmPassword
  }
  return true
}, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface OnboardingModalProps {
  initialData?: OnboardingStatus
  onComplete: () => void
}

export function OnboardingModal({ initialData, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const totalSteps = 4
  const completeOnboarding = useCompleteOnboarding()

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      garageName: initialData?.tenantName || '',
      legalName: initialData?.settings?.legalName || '',
      gstNumber: initialData?.settings?.gstNumber || '',
      panNumber: initialData?.settings?.panNumber || '',
      address: initialData?.settings?.address || '',
      city: initialData?.settings?.city || '',
      state: initialData?.settings?.state || '',
      pincode: initialData?.settings?.pincode || '',
      businessPhone: initialData?.settings?.businessPhone || '',
      businessEmail: initialData?.settings?.businessEmail || '',
      taxRate: initialData?.settings?.taxRate ?? 18,
      currency: initialData?.settings?.currency || 'INR',
      invoicePrefix: initialData?.settings?.invoicePrefix || 'INV-',
      jobPrefix: initialData?.settings?.jobPrefix || 'JOB-',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setPasswordError(null)
      await completeOnboarding.mutateAsync({
        ...data,
        newPassword: data.newPassword || undefined
      })
      onComplete()
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error)
      if (error.message?.includes('password')) {
        setPasswordError(error.message)
      }
    }
  }

  const handleNext = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = []
    
    if (step === 1) {
      fieldsToValidate = ['garageName', 'legalName']
    } else if (step === 2) {
      fieldsToValidate = ['address', 'city', 'state', 'pincode', 'businessPhone', 'businessEmail']
    } else if (step === 3) {
      // Preferences step - nothing to validate
      fieldsToValidate = []
    } else if (step === 4) {
      // Password step - validate if password is entered
      if (newPassword && newPassword.length > 0) {
        fieldsToValidate = ['newPassword', 'confirmPassword']
      }
    }

    const isStepValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate)
    if (isStepValid) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  return (
    <Dialog open modal>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to WrenchCloud!</DialogTitle>
          </div>
          <DialogDescription>
            Let&apos;s set up your garage profile. This will only take a moment.
          </DialogDescription>
          
          {/* Progress indicator */}
          <div className="flex gap-2 pt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Step 1: Business Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Business Details</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="garageName">
                    Garage Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="garageName"
                    placeholder="e.g., AutoCare Service Center"
                    {...register('garageName')}
                    className={errors.garageName ? 'border-destructive' : ''}
                  />
                  {errors.garageName && (
                    <p className="text-sm text-destructive">{errors.garageName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal/Business Name (optional)</Label>
                  <Input
                    id="legalName"
                    placeholder="Registered business name"
                    {...register('legalName')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number (optional)</Label>
                    <Input
                      id="gstNumber"
                      placeholder="e.g., 22AAAAA0000A1Z5"
                      {...register('gstNumber')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number (optional)</Label>
                    <Input
                      id="panNumber"
                      placeholder="e.g., ABCDE1234F"
                      {...register('panNumber')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location & Contact</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    {...register('address')}
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="City"
                      {...register('city')}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="state"
                      {...register('state')}
                      className={`flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        errors.state ? 'border-destructive' : ''
                      }`}
                    >
                      <option value="" className="bg-background text-foreground">Select state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state} className="bg-background text-foreground">{state}</option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-sm text-destructive">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode (optional)</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g., 400001"
                      {...register('pincode')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">
                      Business Phone <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="businessPhone"
                        placeholder="e.g., 9876543210"
                        {...register('businessPhone')}
                        className={`pl-9 ${errors.businessPhone ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.businessPhone && (
                      <p className="text-sm text-destructive">{errors.businessPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email (optional)</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder="e.g., contact@mygarage.com"
                    {...register('businessEmail')}
                    className={errors.businessEmail ? 'border-destructive' : ''}
                  />
                  {errors.businessEmail && (
                    <p className="text-sm text-destructive">{errors.businessEmail.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Document Preferences (Optional)</span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      placeholder="e.g., INV-"
                      {...register('invoicePrefix')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Invoices will be numbered like: INV-001, INV-002...
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobPrefix">Job Card Prefix</Label>
                    <Input
                      id="jobPrefix"
                      placeholder="e.g., JOB-"
                      {...register('jobPrefix')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Job cards will be numbered like: JOB-001, JOB-002...
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      {...register('taxRate', { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Standard GST rate in India is 18%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      {...register('currency')}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="INR" className="bg-background text-foreground">INR (₹)</option>
                      <option value="USD" className="bg-background text-foreground">USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Set Password */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Set Your Password</span>
              </div>
              
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  We recommend setting a new password for your account. You can skip this step and change it later from your profile settings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min 8 characters)"
                      {...register('newPassword')}
                      className={`pl-9 pr-10 ${errors.newPassword ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      {...register('confirmPassword')}
                      className={`pl-9 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {passwordError && (
                  <div className="rounded-lg bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{passwordError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={completeOnboarding.isPending}
                className="min-w-[140px]"
              >
                {completeOnboarding.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
