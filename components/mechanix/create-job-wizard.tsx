"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Plus, Check, User, Car, Clipboard, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { mechanics, dviTemplates } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

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
  const [currentStep, setCurrentStep] = useState(1)
  const [customerFound, setCustomerFound] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [phoneSearch, setPhoneSearch] = useState("")

  const [formData, setFormData] = useState({
    customer: {
      name: "",
      phone: "",
      email: "",
    },
    vehicle: {
      make: "",
      model: "",
      year: "",
      regNo: "",
      color: "",
      odometer: "",
    },
    job: {
      dviTemplate: "",
      mechanic: "",
      complaints: "",
      estimatedCompletion: "",
    },
  })

  const handlePhoneSearch = () => {
    // Simulate customer lookup
    if (phoneSearch === "+91 99887 76543") {
      setFormData((prev) => ({
        ...prev,
        customer: {
          name: "Rajesh Verma",
          phone: phoneSearch,
          email: "rajesh.v@email.com",
        },
      }))
      setCustomerFound(true)
      setShowQuickCreate(false)
    } else if (phoneSearch.length >= 10) {
      setFormData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          phone: phoneSearch,
        },
      }))
      setCustomerFound(false)
      setShowQuickCreate(true)
    }
  }

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
    else {
      onSubmit(formData)
      onClose()
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
        return formData.vehicle.make && formData.vehicle.model && formData.vehicle.regNo
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
                      />
                    </div>
                    <Button onClick={handlePhoneSearch}>Search</Button>
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
                  <p className="text-sm text-muted-foreground mb-4">Enter the vehicle details for this job</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Make *</Label>
                    <Select
                      value={formData.vehicle.make}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: { ...prev.vehicle, make: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Toyota", "Honda", "Maruti", "Hyundai", "Tata", "Mahindra", "Kia", "MG"].map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Model *</Label>
                    <Input
                      placeholder="e.g., Camry, City, Swift"
                      value={formData.vehicle.model}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: { ...prev.vehicle, model: e.target.value },
                        }))
                      }
                    />
                  </div>
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
                    <Label>Color</Label>
                    <Input
                      placeholder="e.g., Silver, White"
                      value={formData.vehicle.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: { ...prev.vehicle, color: e.target.value },
                        }))
                      }
                    />
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

                  <div>
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
                            <div className="flex items-center justify-between w-full">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">({template.itemCount} items)</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Assign Mechanic</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {mechanics.map((mechanic) => (
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
                              <AvatarImage src={mechanic.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {mechanic.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{mechanic.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{mechanic.specialty}</p>
                            </div>
                            {formData.job.mechanic === mechanic.id && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
            {currentStep === 3 ? "Create Job" : "Continue"}
            {currentStep < 3 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
