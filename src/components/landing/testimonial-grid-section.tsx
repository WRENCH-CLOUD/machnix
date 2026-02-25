//TODO: Update the testimonials to a realsonable data
const testimonials = [
  {
    quote:
      "The job tracking system has completely transformed our workflow. We went from sticky notes and whiteboards to a fully digital system that keeps everyone on the same page.",
    name: "David Martinez",
    company: "Martinez Auto Care",
    type: "large-teal",
  },
  {
    quote:
      "Our customers love the DVI reports with photos. It builds trust and leads to more approved repairs.",
    name: "Sarah Johnson",
    company: "Johnson's Garage",
    type: "small-dark",
  },
  {
    quote:
      "Managing three locations used to be a nightmare. Now I can see everything from one dashboard.",
    name: "Robert Chen",
    company: "Chen Auto Group",
    type: "small-dark",
  },
  {
    quote:
      "The invoicing feature alone saved us hours every week. No more manual calculations.",
    name: "Maria Santos",
    company: "Santos Tire & Auto",
    type: "small-dark",
  },
  {
    quote:
      "We started with the free plan and upgraded within a week. The ROI was immediate.",
    name: "James Wilson",
    company: "Wilson's Quick Lube",
    type: "small-dark",
  },
  {
    quote:
      "Customer communication used to be our weak point. Now they get automatic updates and love it.",
    name: "Lisa Thompson",
    company: "Thompson Auto Service",
    type: "small-dark",
  },
  {
    quote:
      "The inventory tracking caught a parts shortage before it became a problem. That alone paid for the subscription.",
    name: "Michael Brown",
    company: "Brown's Auto Repair",
    type: "large-light",
  },
]

interface TestimonialCardProps {
  quote: string
  name: string
  company: string
  type: string
}

const TestimonialCard = ({ quote, name, company, type }: TestimonialCardProps) => {
  const isLargeCard = type.startsWith("large")
  const padding = isLargeCard ? "p-6" : "p-[30px]"

  let cardClasses = `flex flex-col justify-between items-start overflow-hidden rounded-[10px] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] relative ${padding}`
  let quoteClasses = ""
  let nameClasses = ""
  let companyClasses = ""
  let backgroundElements = null
  let cardHeight = ""
  const cardWidth = "w-full md:w-[384px]"

  if (type === "large-teal") {
    cardClasses += " bg-primary"
    quoteClasses += " text-primary-foreground text-2xl font-medium leading-8"
    nameClasses += " text-primary-foreground text-base font-normal leading-6"
    companyClasses += " text-primary-foreground/60 text-base font-normal leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/large-card-background.svg')", zIndex: 0 }}
      />
    )
  } else if (type === "large-light") {
    cardClasses += " bg-[rgba(231,236,235,0.12)]"
    quoteClasses += " text-foreground text-2xl font-medium leading-8"
    nameClasses += " text-foreground text-base font-normal leading-6"
    companyClasses += " text-muted-foreground text-base font-normal leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/images/large-card-background.svg')", zIndex: 0 }}
      />
    )
  } else {
    cardClasses += " bg-card outline outline-1 outline-border outline-offset-[-1px]"
    quoteClasses += " text-foreground/80 text-[17px] font-normal leading-6"
    nameClasses += " text-foreground text-sm font-normal leading-[22px]"
    companyClasses += " text-muted-foreground text-sm font-normal leading-[22px]"
    cardHeight = "h-[244px]"
  }

  // Generate initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className={`${cardClasses} ${cardWidth} ${cardHeight}`}>
      {backgroundElements}
      <div className={`relative z-10 font-normal warp-break-words ${quoteClasses}`}>{quote}</div>
      <div className="relative z-10 flex justify-start items-center gap-3">
        <div
          className={`flex items-center justify-center rounded-full font-semibold ${isLargeCard ? "w-12 h-12 text-lg" : "w-9 h-9 text-sm"} ${type === "large-teal" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/20 text-primary"}`}
        >
          {initials}
        </div>
        <div className="flex flex-col justify-start items-start gap-0.5">
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>{company}</div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialGridSection() {
  return (
    <section id="testimonials-section" className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14">
      <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-3xl md:text-4xl lg:text-[40px] font-semibold leading-tight md:leading-tight lg:leading-[40px]">
            What Shop Owners Are Saying
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm md:text-sm lg:text-base font-medium leading-[18.20px] md:leading-relaxed lg:leading-relaxed">
            Designed with real garages in mind. See what shop owners have to say.
          </p>
        </div>
      </div>
      <div className="w-full pt-0.5 pb-4 md:pb-6 lg:pb-10 flex flex-col md:flex-row justify-center items-start gap-4 md:gap-4 lg:gap-6 max-w-[1100px] mx-auto">
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  )
}
