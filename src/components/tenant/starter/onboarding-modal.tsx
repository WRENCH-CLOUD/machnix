'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { PhoneInput } from '@/components/ui/phone-input'
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

const INDIAN_CITIES_BY_STATE: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Ongole', 'Eluru', 'Machilipatnam', 'Vizianagaram', 'Chittoor'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Along'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'Karimganj'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Hajipur', 'Samastipur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari'],
  'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Canacona'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar', 'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Gondal'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar'],
  'Himachal Pradesh': ['Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundernagar', 'Chamba'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chaibasa', 'Chatra'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Davanagere', 'Bidar', 'Raichur', 'Hassan', 'Dharwad', 'Udupi', 'Chitradurga', 'Kolar', 'Mandya', 'Chikkamagaluru'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kottayam', 'Kayamkulam', 'Thalassery', 'Kasaragod', 'Ponnani'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Navi Mumbai', 'Thane', 'Kolhapur', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Ambarnath', 'Nanded', 'Bhiwandi', 'Panvel', 'Satara'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati', 'Ukhrul'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Rayagada', 'Jeypore', 'Barbil', 'Koraput'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Firozpur', 'Phagwara', 'Muktsar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Bharatpur', 'Alwar', 'Barmer', 'Sikar', 'Sri Ganganagar', 'Pali', 'Beawar', 'Hanumangarh', 'Chittorgarh', 'Nagaur', 'Tonk'],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Ravangla'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karunagappalli', 'Kanchipuram', 'Hosur', 'Nagercoil', 'Kumbakonam', 'Tiruppur', 'Karaikudi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Zahirabad', 'Mancherial'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia', 'Khowai'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Shahjahanpur', 'Rampur', 'Hapur', 'Etawah', 'Faizabad', 'Mau', 'Mirzapur', 'Bulandshahr'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Ramnagar', 'Kotdwar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar'],
  'Delhi': ['New Delhi', 'Delhi', 'Noida (Delhi NCR)', 'Dwarka', 'Rohini', 'Pitampura', 'Janakpuri', 'Shahdara', 'Laxmi Nagar', 'Saket', 'Vasant Kunj', 'Patel Nagar', 'Karol Bagh'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Poonch', 'Rajouri'],
  'Ladakh': ['Leh', 'Kargil'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Chandigarh': ['Chandigarh'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat', 'Mayabunder'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy', 'Andrott'],
}

const onboardingSchema = z.object({
  garageName: z.string().min(1, 'Garage name is required'),
  legalName: z.string().optional(),
  gstNumber: z.string().min(1, 'GST Number is required'),
  panNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().optional(),
  businessPhone: z.string().min(1, 'Phone number is required'),
  businessEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  taxRate: z.number().optional(),
  currency: z.string().optional(),
  invoicePrefix: z.string().optional(),
  jobPrefix: z.string().optional(),
  // Password fields - mandatory (API requires it)
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm Password must be at least 8 characters')
}).refine((data) => {
  return data.newPassword === data.confirmPassword
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
    watch,
    control,
    setValue,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      garageName: initialData?.tenantName || '',
      legalName: initialData?.settings?.legalName || '',
      gstNumber: initialData?.settings?.gstNumber || '',
      panNumber: initialData?.settings?.panNumber || '',
      address: initialData?.settings?.address || '',
      state: initialData?.settings?.state || '',
      city: initialData?.settings?.city || '',
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

  const selectedState = watch('state')
  const availableCities = selectedState
    ? (INDIAN_CITIES_BY_STATE[selectedState] ?? []).slice().sort()
    : []

  // Reset city when state changes
  useEffect(() => {
    setValue('city', '')
  }, [selectedState, setValue])

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setPasswordError(null)
      await completeOnboarding.mutateAsync({
        ...data,
        newPassword: data.newPassword
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
      fieldsToValidate = ['garageName', 'gstNumber']
    } else if (step === 2) {
      fieldsToValidate = ['address', 'state', 'city', 'pincode', 'businessPhone', 'businessEmail']
    } else if (step === 3) {
      // Preferences step - nothing to validate
      fieldsToValidate = []
    } else if (step === 4) {
      // Password step - always validate
      fieldsToValidate = ['newPassword', 'confirmPassword']
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
                className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-primary' : 'bg-muted'
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
                    <Label htmlFor="gstNumber">
                      GST Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="gstNumber"
                      placeholder="e.g., 22AAAAA0000A1Z5"
                      {...register('gstNumber')}
                      className={errors.gstNumber ? 'border-destructive' : ''}
                    />
                    {errors.gstNumber && (
                      <p className="text-sm text-destructive">{errors.gstNumber.message}</p>
                    )}
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
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="state"
                      {...register('state')}
                      className={`flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.state ? 'border-destructive' : ''
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
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="city"
                      {...register('city')}
                      disabled={!selectedState}
                      className={`flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.city ? 'border-destructive' : ''}`}
                    >
                      <option value="" className="bg-background text-foreground">
                        {selectedState ? 'Select city' : 'Select state first'}
                      </option>
                      {availableCities.map((city) => (
                        <option key={city} value={city} className="bg-background text-foreground">{city}</option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
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
                    <div className="relative" dir="ltr">
                      <Controller
                        name="businessPhone"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            {...field}
                            defaultCountry="IN"
                            placeholder="e.g. +91 9876543210"
                            className={errors.businessPhone ? 'border-destructive' : ''}
                          />
                        )}
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
                className="min-w-35"
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
