import { MapPin, ArrowUpRight } from "lucide-react"

export default function MultiShop() {
  return (
    <div className="w-full h-full p-5 flex flex-col gap-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">Location Overview</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">All Systems Go</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Shop 1 */}
        <div className="bg-card border border-border/50 p-2 rounded-lg flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold">Downtown</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Active Jobs: 12</div>
          <div className="flex items-center text-[9px] text-green-500 font-medium">
            <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> +15% Rev
          </div>
        </div>

        {/* Shop 2 */}
        <div className="bg-card border border-border/50 p-2 rounded-lg flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold">Westside</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Active Jobs: 8</div>
          <div className="flex items-center text-[9px] text-green-500 font-medium">
            <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> +5% Rev
          </div>
        </div>

        {/* Shop 3 */}
        <div className="bg-card border border-border/50 p-2 rounded-lg flex flex-col gap-1 col-span-2 opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-bold">North Bay</span>
            </div>
            <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground">Closing Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
