import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { MessageSquare, Image, Mic, TrendingUp } from 'lucide-react';

const SOURCE_COLORS = {
  text: '#7c3aed',
  image: '#06b6d4',
  audio: '#f59e0b',
  whatsapp: '#22c55e',
};

const SOURCE_LABELS = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  whatsapp: 'WhatsApp',
};

const SOURCE_ICONS = {
  text: <MessageSquare size={14} />,
  image: <Image size={14} />,
  audio: <Mic size={14} />,
  whatsapp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.528 5.845L0 24l6.335-1.508A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.003-1.37l-.36-.214-3.732.889.918-3.636-.235-.374A9.815 9.815 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
    </svg>
  ),
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { source, count } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{SOURCE_LABELS[source]}</p>
      <p className="text-gray-500">{count} event{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function Reports() {
  const { totalThisWeek, sourceBreakdown, events } = useApp();
  const total = events.length;
  const approved = events.filter(e => e.status === 'approved').length;
  const pending = events.filter(e => e.status === 'pending').length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Jun 22 – Jun 28, 2026</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {/* Hero stat */}
        <div className="bg-violet-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="opacity-75" />
            <span className="text-xs font-semibold uppercase tracking-wider opacity-75">This week</span>
          </div>
          <p className="text-5xl font-bold leading-none mb-1">{totalThisWeek}</p>
          <p className="text-sm opacity-75">events captured</p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Total all time', value: total },
            { label: 'Approved', value: approved },
            { label: 'Pending', value: pending },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl px-3 py-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">By capture source</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sourceBreakdown} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" vertical={false} />
              <XAxis
                dataKey="source"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={s => SOURCE_LABELS[s]}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {sourceBreakdown.map(entry => (
                  <Cell key={entry.source} fill={SOURCE_COLORS[entry.source]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-50">
            {sourceBreakdown.map(({ source, count }) => (
              <div key={source} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[source] }} />
                <span className="text-xs text-gray-500">{SOURCE_LABELS[source]}</span>
                <span className="text-xs font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source breakdown cards */}
        <div className="space-y-2">
          {sourceBreakdown.map(({ source, count }) => (
            <div
              key={source}
              className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: SOURCE_COLORS[source] + '18', color: SOURCE_COLORS[source] }}
              >
                {SOURCE_ICONS[source]}
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800">{SOURCE_LABELS[source]}</span>
              <span className="text-sm font-bold text-gray-900">{count}</span>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: total > 0 ? `${(count / total) * 100}%` : '0%',
                    background: SOURCE_COLORS[source],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
