import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { Case } from '../types';

interface StatsChartsProps {
  cases: Case[];
}

// Elnusa Corporate Palette inspired
// Primary Blue, Corporate Red, Safety Green, Warning Orange
const COLORS = ['#1e3a8a', '#dc2626', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899'];

export const StatsCharts: React.FC<StatsChartsProps> = ({ cases }) => {
  
  // 1. Prepare data for Violation Type Distribution
  const violationCounts: Record<string, number> = {};
  cases.forEach(c => {
    violationCounts[c.violationName] = (violationCounts[c.violationName] || 0) + 1;
  });
  
  const violationData = Object.keys(violationCounts).map(name => ({
    name,
    value: violationCounts[name]
  })).sort((a, b) => b.value - a.value);

  // 2. Prepare data for Top Locations
  const locationCounts: Record<string, number> = {};
  cases.forEach(c => {
    locationCounts[c.amtLocation] = (locationCounts[c.amtLocation] || 0) + 1;
  });

  const locationData = Object.keys(locationCounts).map(name => ({
    name,
    count: locationCounts[name]
  })).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10

  // 3. Prepare data for Monthly Trend (Blocking History)
  const trendMap: Record<string, number> = {};
  cases.forEach(c => {
    // We care about when the BLOCK happened
    const d = new Date(c.blockDate);
    // Format Key YYYY-MM to sort correctly
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendMap[key] = (trendMap[key] || 0) + 1;
  });

  const trendData = Object.keys(trendMap).sort().map(key => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      name: date.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      shortName: date.toLocaleString('id-ID', { month: 'short' }),
      count: trendMap[key]
    };
  });

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Monthly Trend Chart (Full Width) */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Trend Pelanggaran AMT</h3>
              <p className="text-xs text-slate-500">Statistik jumlah kasus pemblokiran per bulan</p>
            </div>
            <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
              High Priority
            </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#64748b'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#64748b'}} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#dc2626" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                name="Jumlah Kasus"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#b91c1c' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Grid for Pie and Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violation Types Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Komposisi Jenis Pelanggaran</h3>
          <p className="text-xs text-slate-500 mb-6">Distribusi berdasarkan kategori kesalahan</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {violationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', color: '#475569'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Locations Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Top 10 Lokasi Kejadian</h3>
          <p className="text-xs text-slate-500 mb-6">Frekuensi pelanggaran tertinggi per lokasi</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis dataKey="name" type="category" width={120} style={{fontSize: '11px', fontWeight: 600, fill: '#334155'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={24} name="Jumlah Kasus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};