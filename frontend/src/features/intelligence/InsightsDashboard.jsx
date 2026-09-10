import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Package, DollarSign, 
  Sparkles, ArrowUpRight, ArrowDownRight, Zap 
} from 'lucide-react';

// Mock Data for UI (Backend connect hone tak)
const categoryData = [
  { name: 'Electronics', count: 420, revenue: 45000 },
  { name: 'Furniture', count: 150, revenue: 32000 },
  { name: 'Apparel', count: 380, revenue: 18000 },
  { name: 'Home & Kitchen', count: 290, revenue: 22000 },
  { name: 'Beauty', count: 110, revenue: 9000 },
];

const trendData = [
  { month: 'Jan', avgPrice: 120, demand: 85 },
  { month: 'Feb', avgPrice: 125, demand: 90 },
  { month: 'Mar', avgPrice: 115, demand: 110 },
  { month: 'Apr', avgPrice: 130, demand: 105 },
  { month: 'May', avgPrice: 140, demand: 130 },
  { month: 'Jun', avgPrice: 135, demand: 125 },
];

const InsightsDashboard = () => {
  const [timeframe, setTimeframe] = useState('6M');

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-gray-200 p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-indigo-400" />
            AI Intelligence Hub
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Real-time product analytics, market trends, and AI-generated actionable insights from your processed datasets.
          </p>
        </div>
        <div className="flex gap-2 bg-[#16191e] border border-gray-800 p-1 rounded-lg">
          {['1M', '3M', '6M', '1Y'].map((t) => (
            <button 
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeframe === t ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics (KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Active Products', value: '1,350', change: '+12.5%', isUp: true, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { title: 'Avg. Market Price', value: '$124.50', change: '+4.2%', isUp: true, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { title: 'Demand Index', value: '88.4', change: '-2.1%', isUp: false, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { title: 'Critical Stock Alerts', value: '24', change: 'Action Req', isUp: null, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((kpi, index) => (
          <div key={index} className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              {kpi.isUp !== null && (
                <span className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                  kpi.isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                }`}>
                  {kpi.isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {kpi.change}
                </span>
              )}
              {kpi.isUp === null && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full text-rose-400 bg-rose-500/10">
                  {kpi.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <h3 className="text-2xl font-semibold text-white mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution Chart */}
        <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white">Product Category Distribution</h3>
            <p className="text-sm text-gray-500">Volume vs Revenue potential per sector</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#16191e' }}
                  contentStyle={{ backgroundColor: '#0f1115', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pricing Trends Chart */}
        <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white">Market Pricing Trends</h3>
            <p className="text-sm text-gray-500">Average pricing vs Consumer demand index</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1115', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="avgPrice" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="demand" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* AI Actionable Insights */}
      <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          AI Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tag: 'Pricing', text: 'Consider lowering prices in the Furniture category by 3-5% to match emerging market competitors.', color: 'border-blue-500/30 bg-blue-500/5 text-blue-200' },
            { tag: 'Inventory', text: 'Electronics demand is spiking. Restock Wireless Mice and Keyboards before Q3 to avoid stockouts.', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' },
            { tag: 'Anomaly', text: 'Detected a 15% drop in Apparel views. Recommend reviewing product descriptions and SEO tags.', color: 'border-purple-500/30 bg-purple-500/5 text-purple-200' }
          ].map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${insight.color}`}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 block">
                {insight.tag}
              </span>
              <p className="text-sm leading-relaxed opacity-90">
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default InsightsDashboard;