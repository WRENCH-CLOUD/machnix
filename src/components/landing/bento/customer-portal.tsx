import { MessageSquare, CalendarCheck } from "lucide-react"

export default function CustomerPortal() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Mobile Frame */}
      <div className="w-[180px] h-[220px] bg-background border border-border rounded-xl shadow-xl overflow-hidden relative flex flex-col">
        {/* Header */}
        <div className="h-8 bg-primary/10 flex items-center px-3 gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <div className="h-2 w-20 bg-muted rounded mb-1" />
              <div className="h-1.5 w-12 bg-muted/50 rounded" />
            </div>
          </div>

          <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
             <div className="flex items-center gap-2 mb-2">
               <CalendarCheck className="w-3 h-3 text-primary" />
               <span className="text-[10px] font-medium text-primary">Ready for Pickup</span>
             </div>
             <div className="text-[9px] text-muted-foreground leading-relaxed">
               Your vehicle service is complete. Invoice #2034 is ready for review.
             </div>
          </div>

          <div className="mt-auto flex gap-2">
             <div className="h-6 flex-1 bg-primary rounded text-[8px] text-primary-foreground flex items-center justify-center font-medium">View</div>
             <div className="h-6 flex-1 bg-muted rounded text-[8px] text-muted-foreground flex items-center justify-center font-medium">Chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}
