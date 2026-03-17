import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const BAR_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308', '#EF4444', '#14B8A6', '#F59E0B', '#6366F1'];

export default function MuscleGroupChart({ data }) {
  const { t } = useTranslation();

  if (!data || data.length === 0) return null;

  const translated = data.map(d => ({
    ...d,
    label: t(`muscle.${d.muscleGroup}`) || d.muscleGroup,
  }));

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={translated} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} layout="vertical">
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: 12,
              fontSize: 12,
              color: '#fff',
            }}
            formatter={(value) => [`${value.toLocaleString()} kg·reps`, '']}
          />
          <Bar dataKey="volume" radius={[0, 6, 6, 0]} barSize={20}>
            {translated.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
