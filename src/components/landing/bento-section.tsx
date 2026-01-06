import { Wrench, ClipboardCheck, Users, Package, Receipt, Building2 } from "lucide-react"

interface BentoCardProps {
  title: string
  description: string
  icon: React.ReactNode
}

// TODO: Update the bento card to a realsonable data and snapshot iamges of each feature
const BentoCard = ({ title, description, icon }: BentoCardProps) => (
  <div className="overflow-hidden rounded-2xl border border-white/20 flex flex-col justify-start items-start relative">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.08)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

    <div className="self-stretch p-6 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <p className="self-stretch text-foreground text-lg font-normal leading-7">
          {title} <br />
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
    </div>
    <div className="self-stretch h-48 relative -mt-0.5 z-10 flex items-center justify-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
)

export function BentoSection() {
  const cards = [
    {
      title: "Job Management",
      description: "Track repairs from intake to delivery with real-time status updates.",
      icon: <Wrench className="w-10 h-10 text-primary" />,
    },
    {
      title: "Digital Vehicle Inspections",
      description: "Professional DVI reports with photos your customers can trust.",
      icon: <ClipboardCheck className="w-10 h-10 text-primary" />,
    },
    {
      title: "Customer Portal",
      description: "Keep customers informed with real-time job updates and approvals.",
      icon: <Users className="w-10 h-10 text-primary" />,
    },
    {
      title: "Inventory Tracking",
      description: "Manage parts and supplies effortlessly with smart stock alerts.",
      icon: <Package className="w-10 h-10 text-primary" />,
    },
    {
      title: "Invoice & Estimates",
      description: "Generate professional quotes and invoices in seconds.",
      icon: <Receipt className="w-10 h-10 text-primary" />,
    },
    {
      title: "Multi-Shop Support",
      description: "Manage multiple locations from one unified dashboard.",
      icon: <Building2 className="w-10 h-10 text-primary" />,
    },
  ]

  return (
    <section id="features-section" className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px]">
              Everything You Need to Run Your Shop
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              From job tracking to customer management, machnix gives you the tools to streamline operations and boost efficiency.
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
