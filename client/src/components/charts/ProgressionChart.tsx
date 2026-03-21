import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ProgressionChart({ data, dataKey, label, unit = '' }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: 12,
              fontSize: 12,
              color: '#fff',
            }}
            formatter={(value) => [`${value}${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#F97316"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#F97316' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
