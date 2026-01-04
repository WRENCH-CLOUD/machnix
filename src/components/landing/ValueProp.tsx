import { 
  Wrench, Menu, X, User, Play, 
  ClipboardList, Users, MessageCircle, FileText, Percent, Box, 
  Check, Star, Wand2, Zap, Languages, Copy, ArrowRight,
  Facebook, Twitter, Instagram, Mail, Phone, ChartLine, Car
} from 'lucide-react';


export default function ValueProp() {
  return (
    <section className="py-20 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ditch the paper registers. <br />
              <span className="text-[#22c55e]">Go Cloud.</span>
            </h3>
            <div className="space-y-6">
              {[
                { title: 'Access from Anywhere', desc: 'Manage your garage from your phone, tablet, or laptop. No installation required.' },
                { title: 'Secure Data Backup', desc: 'Never lose a bill or customer phone number again. Your data is encrypted and backed up daily.' },
                { title: 'Increase Customer Retention', desc: 'Professional digital invoices and timely updates make your customers trust you more.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center mt-1 flex-shrink-0">
                    <Check size={14} className="text-black" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-lg">{item.title}</h5>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="absolute inset-0 bg-[#22c55e] blur-[100px] opacity-20"></div>
            <div className="relative bg-[#18181b] border border-white/10 rounded-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-bold">Monthly Report</h4>
                <span className="bg-[#22c55e]/20 text-[#22c55e] px-3 py-1 rounded-full text-xs font-bold">LIVE</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-gray-400">Total Services</span>
                  <span className="font-bold text-white">142 Cars</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-gray-400">Revenue</span>
                  <span className="font-bold text-[#22c55e] text-lg">₹ 4,25,000</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-gray-400">Customer Rating</span>
                  <span className="font-bold text-yellow-400 flex items-center gap-1"><Star size={16} fill="currentColor" /> 4.8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}