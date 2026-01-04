import { 
  Wrench, 
  Facebook, Twitter, Instagram, Mail, Phone
} from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="text-[#22c55e]" size={24} />
              <span className="font-bold text-xl text-white">Wrench<span className="text-[#22c55e]">Cloud</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Simplifying automobile workshop management with smart cloud solutions.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#22c55e] transition-colors">Job Cards</a></li>
              <li><a href="#" className="hover:text-[#22c55e] transition-colors">Billing & GST</a></li>
              <li><a href="#" className="hover:text-[#22c55e] transition-colors">Inventory</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#22c55e] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#22c55e] transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-[#22c55e] transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Mail size={16} className="text-[#22c55e]" /> support@wrenchcloud.com</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-[#22c55e]" /> +91 98765 43210</li>
              <div className="flex gap-4 mt-4">
                <a href="#" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-[#22c55e] hover:text-black transition-all"><Facebook size={16} /></a>
                <a href="#" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-[#22c55e] hover:text-black transition-all"><Twitter size={16} /></a>
                <a href="#" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-[#22c55e] hover:text-black transition-all"><Instagram size={16} /></a>
              </div>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-500">
          &copy; 2023 Wrench Cloud. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
export default Footer;