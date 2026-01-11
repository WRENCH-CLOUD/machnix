import { Wrench, CheckCircle2 } from "lucide-react"

export default function JobManagement() {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-3">
      <div className="flex gap-2 items-center mb-1">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium text-muted-foreground">Active Jobs</span>
      </div>

      {/* Kanban Card 1 */}
      <div className="bg-card/50 border border-border/50 rounded-lg p-3 flex flex-col gap-2 backdrop-blur-sm">
        <div className="flex justify-between items-start">
          <span className="font-medium text-sm">2019 Ford F-150</span>
          <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded">In Progress</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Wrench className="w-3 h-3" />
          <span>Brake Service</span>
        </div>
        <div className="w-full bg-muted/50 h-1.5 rounded-full mt-1 overflow-hidden">
          <div className="bg-primary w-[60%] h-full rounded-full" />
        </div>
      </div>

      {/* Kanban Card 2 */}
      <div className="bg-card/50 border border-border/50 rounded-lg p-3 flex flex-col gap-2 backdrop-blur-sm opacity-80">
        <div className="flex justify-between items-start">
          <span className="font-medium text-sm">2021 Tesla Model 3</span>
          <span className="bg-orange-500/10 text-orange-500 text-[10px] px-1.5 py-0.5 rounded">Waiting</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>Tire Rotation</span>
        </div>
         <div className="w-full bg-muted/50 h-1.5 rounded-full mt-1 overflow-hidden">
          <div className="bg-orange-500 w-[10%] h-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
