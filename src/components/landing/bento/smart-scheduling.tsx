import { Calendar, User } from "lucide-react"

export default function SmartScheduling() {
  return (
    <div className="w-full h-full p-4 flex flex-col">
       <div className="flex justify-between items-center mb-3">
         <div className="flex flex-col">
           <span className="text-xs font-bold">Today</span>
           <span className="text-[10px] text-muted-foreground">Today's Schedule</span>
         </div>
         <div className="p-1.5 bg-muted rounded-md">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
         </div>
       </div>

      <div className="flex-1 flex flex-col gap-2 relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border border-l border-dashed border-muted-foreground/30" />

        {/* Event 1 */}
        <div className="relative pl-8">
          <div className="absolute left-[9px] top-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-background" />
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
            <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-primary">09:00 AM</span>
                  <span className="text-[9px] text-primary/80">1h</span>
                </div>
                <div className="text-[11px] font-medium leading-tight">Oil Change & Inspection</div>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground">
                   <User className="w-2.5 h-2.5" /> Mike R.
                </div>
             </div>
          </div>

          {/* Event 2 */}
          <div className="relative pl-8 mt-1">
             <div className="absolute left-[9px] top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 ring-4 ring-background" />
             <div className="bg-card border border-border rounded-lg p-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground">11:30 AM</span>
                  <span className="text-[9px] text-muted-foreground">2h</span>
                </div>
                <div className="text-[11px] font-medium leading-tight">Brake Pad Replacement</div>
             </div>
          </div>
       </div>
    </div>
  )
}
