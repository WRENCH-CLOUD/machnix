import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  stockKeepingUnit: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  unitCost: z.coerce.number().min(0, "Must be positive"),
  sellPrice: z.coerce.number().min(0, "Must be positive"),
  stockOnHand: z.coerce.number().int().min(0, "Must be positive integer"),
  reorderLevel: z.coerce.number().int().min(0, "Must be positive integer"),
});

interface ItemFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  initialData?: any;
  mode: "create" | "edit";
}

export function ItemFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ItemFormModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stockKeepingUnit: "",
      name: "",
      unitCost: 0,
      sellPrice: 0,
      stockOnHand: 0,
      reorderLevel: 0,
    },
  });

  useEffect(() => {
    if (open) {
        if (initialData) {
        form.reset({
            stockKeepingUnit: initialData.stockKeepingUnit || "",
            name: initialData.name,
            unitCost: initialData.unitCost,
            sellPrice: initialData.sellPrice,
            stockOnHand: initialData.stockOnHand,
            reorderLevel: initialData.reorderLevel,
        });
        } else {
            form.reset({
                stockKeepingUnit: "",
                name: "",
                unitCost: 0,
                sellPrice: 0,
                stockOnHand: 0,
                reorderLevel: 0,
            });
        }
    }
  }, [initialData, form, open]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Item" : "Edit Item"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new item to your inventory."
              : "Update item details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Oil Filter" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="stockKeepingUnit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock Keeping Unit</FormLabel>
                    <FormControl>
                        <Input placeholder="OF-123" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="stockOnHand"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock On Hand</FormLabel>
                    <FormControl>
                        <Input type="number" min="0" {...field} disabled={mode === "edit"} />
                    </FormControl>
                    <FormMessage />
                    {mode === 'edit' && <p className="text-xs text-muted-foreground">Use Adjust Stock to change quantity</p>}
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="sellPrice"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sell Price</FormLabel>
                    <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                        <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
