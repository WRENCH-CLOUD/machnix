function CTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#22c55e]/10"></div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your workshop?</h2>
        <p className="text-xl text-gray-300 mb-10">Join 500+ garages using Wrench Cloud to streamline operations and boost profits.</p>
        <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Enter your email address" className="flex-1 px-6 py-4 rounded-xl bg-[#050505] border border-white/10 text-white focus:outline-none focus:border-[#22c55e] transition-colors" />
          <button className="px-8 py-4 bg-[#22c55e] text-black font-bold rounded-xl hover:bg-[#4ade80] shadow-lg shadow-green-500/20 transition-all whitespace-nowrap">
            Get Started Free
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500">No credit card required • 14-day free trial</p>
      </div>
    </section>
  );
}

export default CTA;