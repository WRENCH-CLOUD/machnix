import { 
  Wrench, Menu, X, User
} from 'lucide-react';

interface NavbarProps {
  isScrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Navbar({ isScrolled, mobileMenuOpen, setMobileMenuOpen }: NavbarProps) {
  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#050505]/85 backdrop-blur-md border-b border-white/5 shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-[#22c55e] rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]">
              <Wrench size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Wrench<span className="text-[#22c55e]">Cloud</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-[#22c55e] transition-colors text-sm font-medium">Features</a>
            <a href="#ai-demo" className="text-gray-300 hover:text-[#22c55e] transition-colors text-sm font-medium">AI Demo</a>
            <a href="#testimonials" className="text-gray-300 hover:text-[#22c55e] transition-colors text-sm font-medium">Testimonials</a>
            <a href="#pricing" className="text-gray-300 hover:text-[#22c55e] transition-colors text-sm font-medium">Pricing</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="/login" className="text-gray-300 hover:text-white font-medium px-4 py-2 transition-colors border border-transparent hover:border-gray-700 rounded-lg flex items-center gap-2">
              <User size={18} /> Log In
            </a>
            <button className="bg-[#22c55e] text-black px-5 py-2.5 rounded-lg font-bold hover:bg-[#4ade80] transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f0f0f] border-b border-gray-800 absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-[#22c55e] hover:bg-gray-900 rounded-md">Features</a>
            <a href="#ai-demo" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-[#22c55e] hover:bg-gray-900 rounded-md">AI Demo</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-[#22c55e] hover:bg-gray-900 rounded-md">Pricing</a>
            <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-3">
              <a href="#" className="block w-full text-center px-4 py-3 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800">
                Log In
              </a>
              <button className="block w-full text-center px-4 py-3 bg-[#22c55e] text-black rounded-lg font-bold hover:bg-[#4ade80]">
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
