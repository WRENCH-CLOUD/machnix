export default function StatCard({ title, value, icon }) {
  return (
    <div className="h-24 bg-[#0f0f0f] rounded-lg border border-white/5 p-4 relative overflow-hidden">
      <div className="text-xs text-gray-500 mb-2">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="absolute bottom-0 right-0 p-2 text-[#22c55e]/20">{icon}</div>
    </div>
  );
}