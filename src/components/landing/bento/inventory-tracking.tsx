import { AlertTriangle, TrendingDown } from "lucide-react"

export default function InventoryTracking() {
  return (
    <div className="w-full h-full p-5 flex flex-col gap-3">
       <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">Inventory Alerts</span>
        <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/50 text-xs">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[8px] font-mono">OF</div>
             <div className="flex flex-col">
               <span className="font-medium">Oil Filter (Standard)</span>
               <span className="text-[10px] text-muted-foreground">SKU: FL-820S</span>
             </div>
           </div>
           <div className="text-right flex flex-col items-end">
             <span className="font-bold text-red-500">2 left</span>
             <span className="text-[9px] text-muted-foreground">Reorder: 10</span>
           </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/50 text-xs opacity-80">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[8px] font-mono">BP</div>
             <div className="flex flex-col">
               <span className="font-medium">Brake Pads (Rear)</span>
               <span className="text-[10px] text-muted-foreground">SKU: BP-R102</span>
             </div>
           </div>
           <div className="text-right flex flex-col items-end">
             <span className="font-bold text-orange-500">4 left</span>
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" /> -2 this week
              </span>
           </div>
        </div>
      </div>
    </div>
  )
}
