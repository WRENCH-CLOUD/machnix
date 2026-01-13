import JobManagement from "./bento/job-management"
import CustomerPortal from "./bento/customer-portal"
import InventoryTracking from "./bento/inventory-tracking"
import InvoiceEstimates from "./bento/invoice-estimates"
import MultiShop from "./bento/multi-shop"
import SmartScheduling from "./bento/smart-scheduling"

interface BentoCardProps {
  title: string
  description: string
  graphic: React.ReactNode
}

const BentoCard = ({ title, description, graphic }: BentoCardProps) => (
  <div className="overflow-hidden rounded-2xl border border-white/20 flex flex-col justify-start items-start relative bg-card/10">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.04)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent rounded-2xl" />

    <div className="self-stretch p-6 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <p className="self-stretch text-foreground text-lg font-normal leading-7">
          {title} <br />
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
    </div>
    <div className="self-stretch h-56 relative -mt-0.5 z-10 flex items-center justify-center overflow-hidden">
      {graphic}
    </div>
  </div>
)

export function BentoSection() {
  const cards = [
    {
      title: "Job Management",
      description: "Track repairs from intake to delivery with real-time status updates.",
      graphic: <JobManagement />,
    },
    {
      title: "Smart Scheduling",
      description: "Optimize bay utilization and technician schedules effortlessly.",
      graphic: <SmartScheduling />,
    },
    {
      title: "Customer Portal",
      description: "Keep customers informed with real-time job updates and approvals.",
      graphic: <CustomerPortal />,
    },
    {
      title: "Inventory Tracking",
      description: "Manage parts and supplies effortlessly with smart stock alerts.",
      graphic: <InventoryTracking />,
    },
    {
      title: "Invoice & Estimates",
      description: "Generate professional quotes and invoices in seconds.",
      graphic: <InvoiceEstimates />,
    },
    {
      title: "Multi-Shop Support",
      description: "Manage multiple locations from one unified dashboard.",
      graphic: <MultiShop />,
    },
  ]

  return (
    <section id="features-section" className="w-full px-5 flex flex-col justify-center items-center overflow-hidden bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6 overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[520px] sm:top-[614px] origin-top-left rotate-[-33.39deg] bg-primary/5 sm:bg-primary/10 blur-[80px] sm:blur-[130px] z-0 w-[320px] sm:w-[547px] h-[520px] sm:h-[938px]"
          aria-hidden="true"
        />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px]">
              Everything You Need to Run Your Shop
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              From job tracking to customer management, get the tools to streamline operations and boost efficiency.
            </p>
          </div>
        </div>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {cards.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
