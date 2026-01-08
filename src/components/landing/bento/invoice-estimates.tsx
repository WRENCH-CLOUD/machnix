import { Receipt, Check } from "lucide-react"

export default function InvoiceEstimates() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-[200px] h-[180px] bg-background border border-border shadow-sm rounded-lg p-4 flex flex-col gap-3 relative rotate-[-2deg]">
        <div className="flex justify-between items-center border-b border-border pb-2">
           <div className="flex items-center gap-1.5">
             <div className="bg-primary/20 p-1 rounded">
               <Receipt className="w-3 h-3 text-primary" />
             </div>
             <span className="text-xs font-bold">INVOICE</span>
           </div>
           <span className="text-[10px] text-muted-foreground">#INV-2024</span>
        </div>

        <dl className="space-y-1.5" aria-label="Invoice breakdown">
           <div className="flex justify-between text-[10px]">
             <dt className="text-muted-foreground">Labor (3.5h)</dt>
             <dd>$350.00</dd>
           </div>
           <div className="flex justify-between text-[10px]">
             <dt className="text-muted-foreground">Parts</dt>
             <dd>$125.50</dd>
           </div>
           <div className="flex justify-between text-[10px] font-medium border-t border-border/50 pt-1.5 mt-1">
             <dt>Total</dt>
             <dd>$475.50</dd>
           </div>
        </dl>

        <div className="mt-auto">
           <div className="w-full py-1 bg-green-500/10 text-green-600 rounded flex items-center justify-center gap-1 text-[10px] font-medium">
             <Check className="w-2.5 h-2.5" />
             Paid via Card
           </div>
        </div>
      </div>
       {/* Decorative backdrop paper */}
       <div className="absolute w-[200px] h-[180px] bg-muted/20 border border-border/50 rounded-lg -z-10 rotate-[3deg]" />
    </div>
  )
}
