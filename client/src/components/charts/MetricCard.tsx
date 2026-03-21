export default function MetricCard({ value, label, color = 'bg-accent' }) {
  return (
    <div className={`p-4 rounded-2xl ${color} text-white text-center`}>
      <span className="text-2xl font-extrabold">{value}</span>
      <p className="text-[11px] font-semibold text-white/70 mt-0.5">{label}</p>
    </div>
  );
}
