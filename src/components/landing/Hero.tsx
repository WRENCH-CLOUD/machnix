import { 
  Wrench, Menu, X, User, Play, 
  ClipboardList, Users, MessageCircle, FileText, Percent, Box, 
  Check, Star, Wand2, Zap, Languages, Copy, ArrowRight,
  Facebook, Twitter, Instagram, Mail, Phone, ChartLine, Car
} from 'lucide-react';
import StatCard from './StatCard';

const WhatsAppIcon = ({ className }) => (
<svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
</svg>
);

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-40 -z-10 pointer-events-none"
           style={{ background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, rgba(0, 0, 0, 0) 70%)' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm font-semibold mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
          Now GST Compliant & WhatsApp Ready
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Run Your Garage on <br />
          <span className="bg-gradient-to-r from-white to-[#22c55e] bg-clip-text text-transparent">Autopilot</span>
        </h1>
        
        <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one cloud software for modern workshops. Manage job cards, mechanics, inventory, and invoices—seamlessly synced with WhatsApp.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <button className="px-8 py-4 bg-[#22c55e] text-black font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:bg-[#4ade80] transition-all transform hover:-translate-y-1 text-lg">
            Start Free Trial
          </button>
          <button className="px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2 group">
            <Play size={20} className="text-[#22c55e] group-hover:scale-110 transition-transform fill-current" />
            Watch Demo
          </button>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="relative max-w-5xl mx-auto mt-12">
          <div className="relative rounded-xl bg-[#18181b] border border-white/10 shadow-2xl overflow-hidden aspect-video group">
            {/* Top Bar of Mockup */}
            <div className="h-10 bg-[#0f0f0f] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="ml-4 h-4 w-32 bg-white/10 rounded-full"></div>
            </div>
            {/* Body of Mockup (Abstract UI) */}
            <div className="p-6 grid grid-cols-12 gap-6 h-full">
              {/* Sidebar */}
              <div className="hidden md:block col-span-2 space-y-3">
                <div className="h-8 w-full bg-[#22c55e]/20 rounded border border-[#22c55e]/30"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
              </div>
              {/* Main Content */}
              <div className="col-span-12 md:col-span-10 grid grid-cols-3 gap-4">
                {/* Stat Cards */}
                <StatCard title="Total Revenue" value="₹ 45,200" icon={<ChartLine size={32} />} />
                <StatCard title="Active Job Cards" value="12" icon={<Car size={32} />} />
                <StatCard title="Pending Invoices" value="3" icon={<FileText size={32} />} />
                
                {/* Table Representation */}
                <div className="col-span-3 bg-[#0f0f0f] rounded-lg border border-white/5 mt-2 h-48 p-4">
                  <div className="w-full h-8 bg-white/5 rounded mb-3"></div>
                  <div className="w-full h-8 bg-white/5 rounded mb-3 opacity-60"></div>
                  <div className="w-full h-8 bg-white/5 rounded mb-3 opacity-40"></div>
                  <div className="w-full h-8 bg-white/5 rounded mb-3 opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating Badge */}
          <div className="absolute -right-4 -bottom-4 md:right-10 md:bottom-10 bg-[#22c55e] text-black p-4 rounded-xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-default">
            <div className="flex items-center gap-3 font-bold">
              <WhatsAppIcon className="w-8 h-8" />
              <div>
                <p className="text-xs uppercase opacity-75">Status Sent</p>
                <p>Vehicle Ready!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}