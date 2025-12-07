"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Plus, Check, User, Car, Clipboard, ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CustomerService } from "@/lib/supabase/services/customer.service"
import { VehicleService } from "@/lib/supabase/services/vehicle.service"
import { MechanicService } from "@/lib/supabase/services/mechanic.service"
import { JobService } from "@/lib/supabase/services/job.service"
import { DVIService } from "@/lib/supabase/services/dvi.service"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import type { Database } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"


type Customer = Database['tenant']['Tables']['customers']['Row']
type Vehicle = Database['tenant']['Tables']['vehicles']['Row']
type Mechanic = Database['tenant']['Tables']['mechanics']['Row']
type VehicleMake = Database['public']['Tables']['vehicle_make']['Row']
type VehicleModel = Database['public']['Tables']['vehicle_model']['Row']
type DVITemplate = Database['tenant']['Tables']['dvi_templates']['Row']

interface CreateJobWizardProps {
  onClose: () => void
  onSubmit: (data: unknown) => void
}

const steps = [
  { id: 1, title: "Customer", icon: User },
  { id: 2, title: "Vehicle", icon: Car },
  { id: 3, title: "Create Job", icon: Clipboard },
]

export function CreateJobWizard({ onClose, onSubmit }: CreateJobWizardProps) {
  const { tenantId } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [customerFound, setCustomerFound] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [showVehicleCreate, setShowVehicleCreate] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [phoneSearch, setPhoneSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  
  // Data from Supabase
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null)
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [vehicleMakes, setVehicleMakes] = useState<VehicleMake[]>([])
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [dviTemplates, setDviTemplates] = useState<DVITemplate[]>([])
  const [selectedMake, setSelectedMake] = useState<string>("")

  const [formData, setFormData] = useState({
    customer: {
      id: "",
      name: "",
      phone: "",
      email: "",
    },
    vehicle: {
      id: "",
      make: "",
      model: "",
      year: "",
      regNo: "",
      color: "",
      odometer: "",
    },
    job: {
      mechanic: "",
      complaints: "",
      estimatedCompletion: "",
      dviTemplate: "",
    },
  })

  // Load mechanics and vehicle makes on mount
  useEffect(() => {
    loadMechanics()
    loadVehicleMakes()
    loadDviTemplates()
  }, [])

  // Load vehicle models when make is selected
  useEffect(() => {
    if (selectedMake) {
      loadVehicleModels(selectedMake)
    }
  }, [selectedMake])

  const loadMechanics = async () => {
    try {
      const data = await MechanicService.getActive()
      setMechanics(data)
    } catch (error) {
      console.error('Error loading mechanics:', error)
    }
  }

  const loadVehicleMakes = async () => {
    try {
      const data = await VehicleService.getMakes()
      setVehicleMakes(data)
    } catch (error) {
      console.error('Error loading makes:', error)
    }
  }

  const loadVehicleModels = async (makeId: string) => {
    try {
      const data = await VehicleService.getModelsByMakeId(makeId)
      setVehicleModels(data)
    } catch (error) {
      console.error('Error loading models:', error)
    }
  }

  const loadDviTemplates = async () => {
    if (!tenantId) return
    
    try {
      const { data, error } = await supabase
        .schema('tenant')
        .from('dvi_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name')
      
      if (error) {
        console.warn('DVI templates table may not exist:', error.message)
        setDviTemplates([])
        return
      }
      setDviTemplates(data || [])
    } catch (error) {
      console.error('Error loading DVI templates:', error)
      setDviTemplates([])
    }
  }

  const handlePhoneSearch = async () => {
    if (!phoneSearch || phoneSearch.length < 10) return
    
    setSearching(true)
    try {
      const customer = await CustomerService.searchByPhone(phoneSearch)
      
      if (customer) {
        // Customer found
        setFoundCustomer(customer)
        setFormData((prev) => ({
          ...prev,
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
          },
        }))
        setCustomerFound(true)
        setShowQuickCreate(false)
        
        // Load customer's vehicles
        const vehicles = await VehicleService.getByCustomerId(customer.id)
        setCustomerVehicles(vehicles)
        
        // If customer has no vehicles, show create form
        if (vehicles.length === 0) {
          setShowVehicleCreate(true)
        }
      } else {
        // Customer not found
        setFormData((prev) => ({
          ...prev,
          customer: {
            ...prev.customer,
            phone: phoneSearch,
          },
        }))
        setFoundCustomer(null)
        setCustomerFound(false)
        setCustomerVehicles([])
        setShowQuickCreate(true)
      }
    } catch (error) {
      console.error('Error searching customer:', error)
      alert('Error searching for customer')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleCreate(false)
    
    // Populate form with selected vehicle data
    setFormData((prev) => ({
      ...prev,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make_id || "",
        model: vehicle.model_id || "",
        year: vehicle.year?.toString() || "",
        regNo: vehicle.reg_no,
        color: "", // TODO: add color field to vehicle table
        odometer: vehicle.odometer?.toString() || "",
      },
    }))
    
    // Load models for the selected make
    if (vehicle.make_id) {
      loadVehicleModels(vehicle.make_id)
    }
  }

  const handleAddNewVehicle = () => {
    setSelectedVehicle(null)
    setShowVehicleCreate(true)
    
    // Clear vehicle form
    setFormData((prev) => ({
      ...prev,
      vehicle: {
        id: "",
        make: "",
        model: "",
        year: "",
        regNo: "",
        color: "",
        odometer: "",
      },
    }))
  }

  const handleNext = async () => {
    if (currentStep < 3) {
      console.log(`[WIZARD] Moving to step ${currentStep + 1}`, { formData })
      setCurrentStep(currentStep + 1)
    } else {
      // Submit the job
      console.log('[WIZARD] Final submit triggered')
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!tenantId) {
      alert('No tenant selected')
      return
    }

    setLoading(true)
    try {
      let customerId = formData.customer.id
      let vehicleId = formData.vehicle.id

      // Create customer if new
      if (!customerId) {
        console.log('Creating new customer:', {
          tenant_id: tenantId,
          name: formData.customer.name,
          phone: formData.customer.phone,
          email: formData.customer.email || null,
        })
        const newCustomer = await CustomerService.create({
          tenant_id: tenantId,
          name: formData.customer.name,
          phone: formData.customer.phone,
          email: formData.customer.email || null,
        })
        console.log('Customer created successfully:', newCustomer)
        customerId = newCustomer.id
      }

      // Create vehicle if new
      if (!vehicleId) {
        const newVehicle = await VehicleService.create({
          tenant_id: tenantId,
          customer_id: customerId,
          reg_no: formData.vehicle.regNo,
          make_id: formData.vehicle.make || null,
          model_id: formData.vehicle.model || null,
          year: formData.vehicle.year ? parseInt(formData.vehicle.year) : null,
          odometer: formData.vehicle.odometer ? parseInt(formData.vehicle.odometer) : null,
        })
        vehicleId = newVehicle.id
      }

      // Create job
      const newJob = await JobService.createJob({
        job_number: '', // Will be auto-generated by trigger
        customer_id: customerId,
        vehicle_id: vehicleId,
        assigned_mechanic_id: formData.job.mechanic || null,
        status: 'received',
      })

      // Initialize DVI items if template selected
      if (formData.job.dviTemplate) {
        await DVIService.initializeJobDVI(newJob.id, formData.job.dviTemplate)
      }

      onSubmit(newJob)
      onClose()
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Error creating job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (customerFound || showQuickCreate) && formData.customer.name && formData.customer.phone
      case 2:
        // Either a vehicle is selected OR all new vehicle fields are filled
        return (selectedVehicle !== null) || 
               (formData.vehicle.make && formData.vehicle.model && formData.vehicle.regNo)
      case 3:
        return formData.job.complaints
      default:
        return false
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-card rounded-xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create New Job</h2>
            <p className="text-sm text-muted-foreground">Step {currentStep} of 3</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isCompleted && "bg-primary text-primary-foreground",
                        isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                        !isActive && !isCompleted && "bg-secondary text-muted-foreground",
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={cn(
                        "font-medium",
                        isActive || isCompleted ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && <ChevronRight className="w-5 h-5 mx-4 text-muted-foreground" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Customer Lookup */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-base font-semibold">Customer Lookup</Label>
                  <p className="text-sm text-muted-foreground mb-4">Search by phone number to find existing customer</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter phone number..."
                        className="pl-10"
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                        disabled={searching}
                      />
                    </div>
                    <Button onClick={handlePhoneSearch} disabled={searching || !phoneSearch}>
                      {searching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>
                </div>

                {customerFound && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {formData.customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{formData.customer.name}</p>
                            <p className="text-sm text-muted-foreground">{formData.customer.phone}</p>
                            <p className="text-sm text-muted-foreground">{formData.customer.email}</p>
                          </div>
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {showQuickCreate && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Customer not found. Create new customer:</span>
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input
                          placeholder="Enter customer name"
                          value={formData.customer.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              customer: { ...prev.customer, name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          value={phoneSearch}
                          onChange={(e) => {
                            setPhoneSearch(e.target.value)
                            setFormData((prev) => ({
                              ...prev,
                              customer: { ...prev.customer, phone: e.target.value },
                            }))
                          }}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="customer@email.com"
                          value={formData.customer.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              customer: { ...prev.customer, email: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Vehicle Entry */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-base font-semibold">Vehicle Information</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    {customerVehicles.length > 0 
                      ? "Select an existing vehicle or add a new one" 
                      : "Enter the vehicle details for this job"}
                  </p>
                </div>

                {/* Show existing vehicles if customer has any */}
                {customerVehicles.length > 0 && !showVehicleCreate && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="grid gap-3">
                      {customerVehicles.map((vehicle) => (
                        <Card
                          key={vehicle.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary/50",
                            selectedVehicle?.id === vehicle.id && "border-primary bg-primary/5",
                          )}
                          onClick={() => handleSelectVehicle(vehicle)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                                <Car className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {vehicle.year || ""} {/* TODO: lookup make/model names */}
                                </p>
                                <p className="text-sm font-mono text-muted-foreground">{vehicle.reg_no}</p>
                                {vehicle.odometer && (
                                  <p className="text-xs text-muted-foreground">{vehicle.odometer.toLocaleString()} km</p>
                                )}
                              </div>
                            </div>
                            {selectedVehicle?.id === vehicle.id && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleAddNewVehicle}
                    >
                      <Plus className="w-4 h-4" />
                      Add New Vehicle
                    </Button>
                  </motion.div>
                )}

                {/* Vehicle form - shown when creating new vehicle or no vehicles exist */}
                {(showVehicleCreate || customerVehicles.length === 0) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {customerVehicles.length > 0 && (
                      <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg mb-4">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Adding new vehicle for {formData.customer.name}</span>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Make *</Label>
                          <Select
                            value={formData.vehicle.make}
                            onValueChange={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                vehicle: { ...prev.vehicle, make: value, model: '' },
                              }))
                              loadVehicleModels(value)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select make" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleMakes.map((make) => (
                                <SelectItem key={make.id} value={make.id}>
                                  {make.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Model *</Label>
                          <Select
                            value={formData.vehicle.model}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                vehicle: { ...prev.vehicle, model: value },
                              }))
                            }
                            disabled={!formData.vehicle.make}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Year</Label>
                          <Select
                            value={formData.vehicle.year}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                vehicle: { ...prev.vehicle, year: value },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 15 }, (_, i) => 2024 - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Registration Number *</Label>
                          <Input
                            placeholder="e.g., KA 01 AB 1234"
                            className="uppercase"
                            value={formData.vehicle.regNo}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                vehicle: { ...prev.vehicle, regNo: e.target.value.toUpperCase() },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Odometer (km)</Label>
                          <Input
                            type="number"
                            placeholder="Current reading"
                            value={formData.vehicle.odometer}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                vehicle: { ...prev.vehicle, odometer: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                      
                      {customerVehicles.length > 0 && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setShowVehicleCreate(false)
                            setFormData((prev) => ({
                              ...prev,
                              vehicle: {
                                id: "",
                                make: "",
                                model: "",
                                year: "",
                                regNo: "",
                                color: "",
                                odometer: "",
                              },
                            }))
                          }}
                        >
                          Cancel - Back to Vehicle List
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: Job Setup */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-base font-semibold">Job Setup</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure inspection template and assign mechanic
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Customer Complaint / Job Description *</Label>
                    <Textarea
                      placeholder="Describe the issue or service required..."
                      className="min-h-[100px]"
                      value={formData.job.complaints}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          job: { ...prev.job, complaints: e.target.value },
                        }))
                      }
                    />
                  </div>

                  {/* <div>
                    <Label>DVI Template</Label>
                    <Select
                      value={formData.job.dviTemplate}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          job: { ...prev.job, dviTemplate: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select inspection template" />
                      </SelectTrigger>
                      <SelectContent>
                        {dviTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                  <div>
                    <Label>Assign Mechanic</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {mechanics.length === 0 ? (
                        <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                          No mechanics available. Job can be assigned later.
                        </p>
                      ) : (
                        mechanics.map((mechanic) => (
                          <Card
                            key={mechanic.id}
                            className={cn(
                              "cursor-pointer transition-all hover:border-primary/50",
                              formData.job.mechanic === mechanic.id && "border-primary bg-primary/5",
                            )}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                job: { ...prev.job, mechanic: mechanic.id },
                              }))
                            }
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {mechanic.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{mechanic.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {mechanic.phone || "No phone"}
                                </p>
                              </div>
                              {formData.job.mechanic === mechanic.id && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1 || loading} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentStep === 3 ? "Create Job" : "Continue"}
            {currentStep < 3 && !loading && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
