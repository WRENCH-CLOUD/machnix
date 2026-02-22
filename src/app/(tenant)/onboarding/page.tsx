'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Building2, MapPin, Phone, FileText, Lock, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useCompleteOnboarding, useOnboardingStatus } from '@/hooks/use-onboarding'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  gstNumber: z.string().min(1, 'GST Number is required'),
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
  // Password fields - MANDATORY now
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm Password must be at least 8 characters')
}).refine((data) => {
  return data.newPassword === data.confirmPassword
}, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

const fadeIn = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  
  const { data: initialData, isLoading: isLoadingStatus } = useOnboardingStatus()
  const completeOnboarding = useCompleteOnboarding()
  
  const totalSteps = 4

  // Redirect if already onboarded
  useEffect(() => {
    if (!isLoadingStatus && initialData?.isOnboarded) {
      router.replace('/dashboard')
    }
  }, [initialData, isLoadingStatus, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    reset
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      garageName: '',
      legalName: '',
      gstNumber: '',
      panNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      businessPhone: '',
      businessEmail: '',
      taxRate: 18,
      currency: 'INR',
      invoicePrefix: 'INV-',
      jobPrefix: 'JOB-',
      newPassword: '',
      confirmPassword: ''
    }
  })

  // Update default values when initialData loads
  useEffect(() => {
    if (initialData) {
      reset({
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
      })
    }
  }, [initialData, reset])



  const handleNext = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = []
    
    if (step === 1) {
      fieldsToValidate = ['garageName', 'gstNumber']
    } else if (step === 2) {
      fieldsToValidate = ['address', 'city', 'state', 'pincode', 'businessPhone', 'businessEmail']
    } else if (step === 3) {
      fieldsToValidate = []
    } else if (step === 4) {
      // Always validate password now
      fieldsToValidate = ['newPassword', 'confirmPassword']
    }

    const isStepValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate)
    if (isStepValid) {
      setStep(step + 1)
    }
  }

  const onSubmit = async (data: OnboardingFormData) => {
    // Prevent accidental submission on Enter key if not on last step
    if (step < totalSteps) {
      await handleNext()
      return
    }

    try {
      setPasswordError(null)
      await completeOnboarding.mutateAsync({
        ...data,
        newPassword: data.newPassword || undefined
      })
      toast.success('Onboarding completed successfully!')
      router.replace('/dashboard')
    } catch (error: unknown) {
      console.error('Failed to complete onboarding:', error)
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding'
      toast.error(message)
      
      if (message.toLowerCase().includes('password')) {
        setPasswordError(message)
      }
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  if (isLoadingStatus) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[10%] right-[5%] w-[40rem] h-[40rem] bg-blue-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 lg:shadow-2xl lg:shadow-black/5 lg:rounded-2xl lg:bg-card/50 lg:backdrop-blur-sm lg:border lg:border-border/50 overflow-hidden">
          
          {/* Sidebar / Progress for Desktop */}
          <div className="hidden lg:block lg:col-span-4 bg-muted/30 p-8 border-r border-border/50">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight">WrenchCloud</h1>
                <p className="text-xs text-muted-foreground font-medium">Let's get you started</p>
              </div>
            </div>

            <div className="space-y-8 relative">
              {/* Progress Line */}
              <div className="absolute left-[15px] top-[10px] bottom-[10px] w-0.5 bg-border -z-10" />
              
              {[
                { title: 'Business', desc: 'Garage details', icon: Building2 },
                { title: 'Location', desc: 'Address & contact', icon: MapPin },
                { title: 'Preferences', desc: 'Currency & tax', icon: FileText },
                { title: 'Security', desc: 'Set password', icon: Lock },
              ].map((s, i) => (
                <div key={i} className={cn("flex gap-4 group", i + 1 > step && "opacity-50")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                    i + 1 < step ? "bg-primary border-primary text-primary-foreground" :
                    i + 1 === step ? "bg-card border-primary text-primary shadow-lg shadow-primary/10 ring-4 ring-primary/10" :
                    "bg-card border-border text-muted-foreground"
                  )}>
                    {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className={cn("font-medium text-sm leading-none mb-1.5 transition-colors", i + 1 === step ? "text-foreground" : "text-muted-foreground")}>
                      {s.title}
                    </h3>
                    <p className="text-xs text-muted-foreground/80">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 bg-card p-6 sm:p-8 lg:p-10 flex flex-col justify-center min-h-[600px]">
             {/* Mobile Header */}
             <div className="lg:hidden mb-8 text-center bg-card rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex justify-center mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Setup Your Profile</h2>
                <div className="flex gap-2 justify-center max-w-[200px] mx-auto mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-500", 
                        i <= step ? "bg-primary" : "bg-muted"
                      )} 
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Step {step} of 4</p>
             </div>

             <div className="flex-1">
               <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                 <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                      >
                        <div className="space-y-1.5">
                          <h2 className="text-2xl font-semibold tracking-tight">Business Details</h2>
                          <p className="text-muted-foreground">Tell us about your workshop or garage.</p>
                        </div>
                        
                        <div className="grid gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="garageName" className="text-foreground/90">
                              Garage Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="garageName"
                              placeholder="e.g., AutoCare Service Center"
                              {...register('garageName')}
                              className={cn("h-11", errors.garageName && "border-destructive focus-visible:ring-destructive")}
                            />
                            {errors.garageName && (
                              <p className="text-sm text-destructive font-medium">{errors.garageName.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="gstNumber">
                                GST Number <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="gstNumber"
                                placeholder="e.g., 22AAAAA0000A1Z5"
                                {...register('gstNumber')}
                                className={cn("h-11", errors.gstNumber && "border-destructive focus-visible:ring-destructive")}
                              />
                               {errors.gstNumber && (
                                <p className="text-sm text-destructive font-medium">{errors.gstNumber.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="panNumber">PAN Number (optional)</Label>
                              <Input
                                id="panNumber"
                                placeholder="e.g., ABCDE1234F"
                                {...register('panNumber')}
                                className="h-11"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                       <motion.div
                       key="step2"
                       variants={fadeIn}
                       initial="hidden"
                       animate="visible"
                       exit="exit"
                       className="space-y-6"
                     >
                        <div className="space-y-1.5">
                          <h2 className="text-2xl font-semibold tracking-tight">Location & Contact</h2>
                          <p className="text-muted-foreground">Where can customers find you?</p>
                        </div>
                        
                        <div className="grid gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="address">
                              Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="address"
                              placeholder="Street address"
                              {...register('address')}
                               className={cn("h-11", errors.address && "border-destructive focus-visible:ring-destructive")}
                            />
                            {errors.address && (
                              <p className="text-sm text-destructive font-medium">{errors.address.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="city">
                                City <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="city"
                                placeholder="City"
                                {...register('city')}
                                className={cn("h-11", errors.city && "border-destructive focus-visible:ring-destructive")}
                              />
                              {errors.city && (
                                <p className="text-sm text-destructive font-medium">{errors.city.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state">
                                State <span className="text-destructive">*</span>
                              </Label>
                              <select
                                id="state"
                                {...register('state')}
                                className={cn(
                                  "flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                  errors.state && "border-destructive focus-visible:ring-destructive"
                                )}
                              >
                                <option value="" className="bg-background">Select state</option>
                                {INDIAN_STATES.map((state) => (
                                  <option key={state} value={state} className="bg-background text-foreground">{state}</option>
                                ))}
                              </select>
                              {errors.state && (
                                <p className="text-sm text-destructive font-medium">{errors.state.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="pincode">Pincode (optional)</Label>
                              <Input
                                id="pincode"
                                placeholder="e.g., 400001"
                                {...register('pincode')}
                                className="h-11"
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
                                  className={cn("pl-9 h-11", errors.businessPhone && "border-destructive focus-visible:ring-destructive")}
                                />
                              </div>
                              {errors.businessPhone && (
                                <p className="text-sm text-destructive font-medium">{errors.businessPhone.message}</p>
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
                               className={cn("h-11", errors.businessEmail && "border-destructive focus-visible:ring-destructive")}
                            />
                            {errors.businessEmail && (
                              <p className="text-sm text-destructive font-medium">{errors.businessEmail.message}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                      key="step3"
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-6"
                    >
                        <div className="space-y-1.5">
                          <h2 className="text-2xl font-semibold tracking-tight">Preferences</h2>
                          <p className="text-muted-foreground">Customize your document settings.</p>
                        </div>
                        
                        <div className="grid gap-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                              <div className="relative">
                                <Input
                                  id="invoicePrefix"
                                  placeholder="e.g., INV-"
                                  {...register('invoicePrefix')}
                                  className="h-11"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                  <span className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">001</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Example: INV-001
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="jobPrefix">Job Card Prefix</Label>
                              <div className="relative">
                                <Input
                                  id="jobPrefix"
                                  placeholder="e.g., JOB-"
                                  {...register('jobPrefix')}
                                  className="h-11"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                  <span className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">001</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Example: JOB-001
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                              <Input
                                id="taxRate"
                                type="number"
                                step="0.01"
                                {...register('taxRate', { valueAsNumber: true })}
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="currency">Currency</Label>
                              <select
                                id="currency"
                                {...register('currency')}
                                className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="INR" className="bg-background text-foreground">INR (₹)</option>
                                <option value="USD" className="bg-background text-foreground">USD ($)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div
                        key="step4"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                      >
                         <div className="space-y-1.5">
                          <h2 className="text-2xl font-semibold tracking-tight">Security</h2>
                          <p className="text-muted-foreground">Secure your account with a strong password.</p>
                        </div>
                        
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200/50 dark:border-amber-900/50 flex gap-3 text-amber-800 dark:text-amber-200">
                          <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                          <p className="text-sm">
                            Please set a secure password for your garage account to complete the setup.
                          </p>
                        </div>

                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">
                              New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password (min 8 characters)"
                                {...register('newPassword')}
                                className={cn("pl-3 pr-10 h-11", errors.newPassword && "border-destructive focus-visible:ring-destructive")}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {errors.newPassword && (
                              <p className="text-sm text-destructive font-medium">{errors.newPassword.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirm Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                {...register('confirmPassword')}
                                className={cn("pl-3 pr-10 h-11", errors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                            )}
                          </div>

                          {passwordError && (
                            <div className="rounded-lg bg-destructive/10 p-3 flex items-center gap-2 text-destructive">
                               <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                              <p className="text-sm font-medium">{passwordError}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                 </div>

                 <div className="flex justify-between items-center pt-8 mt-4 border-t border-border/50">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleBack} 
                      className={cn("gap-2 hover:bg-muted/50", step === 1 && "invisible")}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>

                    <Button 
                      type={step === totalSteps ? "submit" : "button"}
                      onClick={step < totalSteps ? handleNext : undefined}
                      disabled={completeOnboarding.isPending}
                      className="min-w-[140px] h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                      {completeOnboarding.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : step === totalSteps ? (
                        <>Complete Setup <Sparkles className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                 </div>
               </form>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
