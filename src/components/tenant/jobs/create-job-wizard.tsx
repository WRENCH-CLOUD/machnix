"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Car, 
  ClipboardList, 
  CheckCircle2, 
  Search, 
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { InlineTodos, type TodoItem } from "./job-todos";

interface CreateJobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "customer" | "vehicle" | "details" | "review";

export function CreateJobWizard({ isOpen, onClose, onSuccess }: CreateJobWizardProps) {
  const [step, setStep] = useState<Step>("customer");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [jobDetails, setJobDetails] = useState({
    serviceType: "repair",
    description: "",
    priority: "medium",
    estimatedCompletion: "",
  });

  // Search/Data State
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // New Entity States
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ makeId: "", modelId: "", reg_no: "", vin: "" });
  
  // Vehicle makes/models for dropdowns
  const [makes, setMakes] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);

  // Duplicate customer dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);

  // Todos state for job creation
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const handleAddCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });

      // Handle duplicate phone number (409 Conflict)
      if (res.status === 409) {
        const data = await res.json();
        if (data.duplicatePhone && data.existingCustomer) {
          setExistingCustomer(data.existingCustomer);
          setShowDuplicateDialog(true);
          return;
        }
      }

      if (res.ok) {
        const customer = await res.json();
        setSelectedCustomer(customer);
        setShowAddCustomer(false);
        setStep("vehicle");
        toast({ title: "Customer Created", description: "New customer added successfully." });
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create customer");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUseExistingCustomer = () => {
    if (existingCustomer) {
      setSelectedCustomer(existingCustomer);
      setShowDuplicateDialog(false);
      setShowAddCustomer(false);
      setExistingCustomer(null);
      setNewCustomer({ name: "", phone: "", email: "" });
      setStep("vehicle");
      toast({ title: "Customer Selected", description: `Using existing customer: ${existingCustomer.name}` });
    }
  };

  const handleAddVehicle = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vehicles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          makeId: newVehicle.makeId,
          modelId: newVehicle.modelId,
          regNo: newVehicle.reg_no,
          vin: newVehicle.vin,
          customerId: selectedCustomer.id 
        }),
      });

      if (res.ok) {
        const vehicle = await res.json();
        setSelectedVehicle(vehicle);
        setShowAddVehicle(false);
        setStep("details");
        toast({ title: "Vehicle Created", description: "New vehicle added successfully." });
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create vehicle");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Load customers on search
  useEffect(() => {
    if (step === "customer" && !showAddCustomer) {
      const delayDebounceFn = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, step, showAddCustomer]);

  // Load vehicles when customer is selected
  useEffect(() => {
    if (selectedCustomer && !showAddVehicle) {
      loadCustomerVehicles();
    }
  }, [selectedCustomer, showAddVehicle]);

  // Load makes when vehicle form is shown
  useEffect(() => {
    if (showAddVehicle && makes.length === 0) {
      loadMakes();
    }
  }, [showAddVehicle]);

  // Load models when make is selected
  useEffect(() => {
    if (newVehicle.makeId) {
      loadModels(newVehicle.makeId);
    } else {
      setModels([]);
    }
  }, [newVehicle.makeId]);

  const loadMakes = async () => {
    try {
      const res = await fetch("/api/vehicle-makes");
      if (res.ok) {
        const data = await res.json();
        setMakes(data);
      }
    } catch (err) {
      console.error("Error loading makes:", err);
    }
  };

  const loadModels = async (makeId: string) => {
    try {
      const res = await fetch(`/api/vehicle-models?makeId=${makeId}`);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error("Error loading models:", err);
    }
  };

  const searchCustomers = async () => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/customers/search?q=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Error searching customers:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const loadCustomerVehicles = async () => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/vehicles?customerId=${selectedCustomer.id}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateJob = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          vehicleId: selectedVehicle.id,
          ...jobDetails,
          todos: todos.length > 0 ? todos : undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Job Created",
          description: "New job card has been created successfully.",
        });
        onSuccess();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "customer":
        if (showAddCustomer) {
          return (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddCustomer(false)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back to Search
                </Button>
                <h3 className="text-sm font-medium">New Customer Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="e.g. Rahul Sharma" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    placeholder="e.g. +91 9876543210" 
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input 
                  placeholder="e.g. rahul@example.com" 
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <Button className="w-full mt-4" onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Customer & Continue
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 mr-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name or phone..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowAddCustomer(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : customers.length > 0 ? (
                <div className="space-y-2">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCustomer?.id === c.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.phone}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <User className="h-8 w-8 opacity-20" />
                  <p>No customers found</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddCustomer(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add New Customer
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
        );

      case "vehicle":
        if (showAddVehicle) {
          return (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddVehicle(false)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back to List
                </Button>
                <h3 className="text-sm font-medium">New Vehicle for {selectedCustomer?.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Select
                    value={newVehicle.makeId}
                    onValueChange={(val) => setNewVehicle({ ...newVehicle, makeId: val, modelId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make.id} value={make.id}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={newVehicle.modelId}
                    onValueChange={(val) => setNewVehicle({ ...newVehicle, modelId: val })}
                    disabled={!newVehicle.makeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={newVehicle.makeId ? "Select model" : "Select make first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input 
                    placeholder="e.g. MH12AB1234" 
                    value={newVehicle.reg_no}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNewVehicle({ ...newVehicle, reg_no: val });
                    }}
                    className={newVehicle.reg_no && !/^[A-Z]{2}[ \-]{0,1}[0-9]{2}[ \-]{0,1}[A-Z]{1,2}[ \-]{0,1}[0-9]{4}$/.test(newVehicle.reg_no) ? "border-destructive" : ""}
                  />
                  {newVehicle.reg_no && !/^[A-Z]{2}[ \-]{0,1}[0-9]{2}[ \-]{0,1}[A-Z]{1,2}[ \-]{0,1}[0-9]{4}$/.test(newVehicle.reg_no) && (
                    <p className="text-[10px] text-destructive">Invalid Indian vehicle registration format (e.g. MH12AB1234)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>VIN / Chassis No (Optional)</Label>
                  <Input 
                    placeholder="17 digit number" 
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={handleAddVehicle} 
                disabled={
                  !newVehicle.makeId || 
                  !newVehicle.modelId || 
                  !newVehicle.reg_no || 
                  !/^[A-Z]{2}[ \-]{0,1}[0-9]{2}[ \-]{0,1}[A-Z]{1,2}[ \-]{0,1}[0-9]{4}$/.test(newVehicle.reg_no) ||
                  loading
                }
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Vehicle & Continue
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Select vehicle for {selectedCustomer?.name}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAddVehicle(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add New Vehicle
              </Button>
            </div>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : vehicles.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVehicle?.id === v.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedVehicle(v)}
                    >
                      <div className="font-medium">{v.make} {v.model}</div>
                      <div className="text-sm text-muted-foreground">{v.reg_no || v.license_plate}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Car className="h-8 w-8 opacity-20" />
                  <p>No vehicles found for this customer</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddVehicle(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add New Vehicle
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
        );

      case "details":
        return (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select
                  value={jobDetails.serviceType}
                  onValueChange={(v) => setJobDetails({ ...jobDetails, serviceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="bodywork">Body Work</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={jobDetails.priority}
                  onValueChange={(v) => setJobDetails({ ...jobDetails, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description of Work</Label>
              <Textarea
                placeholder="Describe the issues or services required..."
                rows={4}
                value={jobDetails.description}
                onChange={(e) => setJobDetails({ ...jobDetails, description: e.target.value })}
              />
            </div>
            
            {/* Optional Task List */}
            <InlineTodos
              todos={todos}
              onChange={setTodos}
              className="border-dashed"
            />
          </div>
        );

      case "review":
        return (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Customer</Label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{selectedCustomer?.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedCustomer?.phone}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Vehicle</Label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{selectedVehicle?.make} {selectedVehicle?.model}</div>
                  <div className="text-sm text-muted-foreground">{selectedVehicle?.reg_no}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Job Details</Label>
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="capitalize">{jobDetails.serviceType}</Badge>
                  <Badge className={
                    jobDetails.priority === 'high' ? 'bg-red-500' : 
                    jobDetails.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }>
                    {jobDetails.priority} Priority
                  </Badge>
                </div>
                <p className="text-sm italic">"{jobDetails.description || 'No description provided'}"</p>
              </div>
            </div>
            {todos.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tasks ({todos.length})</Label>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  {todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{todo.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "customer", label: "Customer", icon: User },
    { id: "vehicle", label: "Vehicle", icon: Car },
    { id: "details", label: "Details", icon: ClipboardList },
    { id: "review", label: "Review", icon: CheckCircle2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Job Card
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex items-center justify-between px-2 mb-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = steps.findIndex(x => x.id === step) > i;

            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? "border-primary bg-primary text-white" : 
                    isCompleted ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-[2px] mx-2 mb-4 ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {renderStepContent()}

        <DialogFooter className="flex justify-between sm:justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => {
              if (step === "vehicle") setStep("customer");
              if (step === "details") setStep("vehicle");
              if (step === "review") setStep("details");
            }}
            disabled={step === "customer" || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step === "review" ? (
            <Button onClick={handleCreateJob} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Create Job
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (step === "customer") setStep("vehicle");
                if (step === "vehicle") setStep("details");
                if (step === "details") setStep("review");
              }}
              disabled={
                (step === "customer" && !selectedCustomer) ||
                (step === "vehicle" && !selectedVehicle)
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Duplicate Customer Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Customer Already Exists
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              A customer with this phone number already exists in the system:
            </p>
            {existingCustomer && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="font-medium">{existingCustomer.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {existingCustomer.phone && <div>📞 {existingCustomer.phone}</div>}
                  {existingCustomer.email && <div>✉️ {existingCustomer.email}</div>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseExistingCustomer}>
              Use This Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
