import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

const COLORS = {
  purple: '#8b5cf6',
  violet: '#a78bfa',
  green: '#22c55e', 
  amber: '#eab308', 
  red: '#ef4444',    
  blue: '#3b82f6',
  orange: '#f97316',
};

// Recharts Trend Data
const TREND_DATA = [
  { name: 'Jul 1', total: 20, implemented: 5, inProgress: 8 },
  { name: 'Jul 15', total: 35, implemented: 8, inProgress: 12 },
  { name: 'Jul 29', total: 30, implemented: 10, inProgress: 11 },
  { name: 'Aug 12', total: 48, implemented: 12, inProgress: 14 },
  { name: 'Aug 31', total: 56, implemented: 14, inProgress: 16 },
];

const STATUS_DATA = [
  { name: 'Implemented', value: 14, color: COLORS.green },
  { name: 'In Progress', value: 16, color: COLORS.blue },
  { name: 'Planned', value: 12, color: COLORS.amber },
  { name: 'Not Started', value: 14, color: COLORS.red },
];

const PRIORITY_DATA = [
  { name: 'Critical', value: 10, color: COLORS.red },
  { name: 'High', value: 18, color: COLORS.orange },
  { name: 'Medium', value: 17, color: COLORS.amber },
  { name: 'Low', value: 7, color: COLORS.green },
];

const FEATURES_ROWS = [
  { 
    id: 1, 
    name: 'One-click checkout', 
    desc: 'Allow users to complete purchase in one click.', 
    category: 'Checkout & Payments', 
    priority: 'Critical', 
    status: 'In Progress', 
    usersImpacted: '8,542', 
    feedbackCount: '352', 
    createdOn: 'Aug 28, 2025', 
    lastUpdated: 'Aug 31, 2025',
    source: 'In-App Feedback',
    owner: 'Priya Sharma',
    longDesc: 'Users want a faster checkout experience. This feature allows them to place orders with previously saved details in a single click.',
    topFeedback: [
      'Checkout process is too slow and payment fails freq...',
      'Please add one-click purchase option',
      'Need faster checkout for returning customers'
    ]
  },
  { 
    id: 2, 
    name: 'Multiple payment options', 
    desc: 'Support more UPI and digital wallets.', 
    category: 'Payments', 
    priority: 'High', 
    status: 'Implemented', 
    usersImpacted: '6,231', 
    feedbackCount: '289', 
    createdOn: 'Aug 20, 2025', 
    lastUpdated: 'Aug 30, 2025',
    source: 'Support Tickets',
    owner: 'Arjun Mehta',
    longDesc: 'Integration with regional gateways such as PhonePe, Google Pay, and Paytm.',
    topFeedback: ['Add more payment options like UPI and digital wallets.']
  },
  { 
    id: 3, 
    name: 'Order tracking in real-time', 
    desc: 'Provide real-time updates for orders.', 
    category: 'Order Management', 
    priority: 'High', 
    status: 'In Progress', 
    usersImpacted: '5,412', 
    feedbackCount: '241', 
    createdOn: 'Aug 18, 2025', 
    lastUpdated: 'Aug 29, 2025',
    source: 'In-App Feedback',
    owner: 'Rohit Singh',
    longDesc: 'Live map tracking and carrier webhook syncing for real-time order status.',
    topFeedback: ['Delivery tracking is not updating in real-time.']
  },
  { 
    id: 4, 
    name: 'Dark mode', 
    desc: 'Add dark theme for better experience.', 
    category: 'UI / UX', 
    priority: 'Medium', 
    status: 'Planned', 
    usersImpacted: '3,842', 
    feedbackCount: '186', 
    createdOn: 'Aug 15, 2025', 
    lastUpdated: 'Aug 28, 2025',
    source: 'Email',
    owner: 'Neha Kapoor',
    longDesc: 'Full dark theme support across mobile applications and web portal.',
    topFeedback: ['Need dark mode option in the app.']
  },
  { 
    id: 5, 
    name: 'Wishlist', 
    desc: 'Save products to wishlist.', 
    category: 'Product Discovery', 
    priority: 'Medium', 
    status: 'Planned', 
    usersImpacted: '3,210', 
    feedbackCount: '153', 
    createdOn: 'Aug 10, 2025', 
    lastUpdated: 'Aug 25, 2025',
    source: 'In-App Feedback',
    owner: 'Priya Sharma',
    longDesc: 'Allow users to save items for future purchases or share lists.',
    topFeedback: ['It would be great to have a wish list for products.']
  },
  { 
    id: 6, 
    name: 'Guest checkout', 
    desc: 'Checkout without account creation.', 
    category: 'Checkout & Payments', 
    priority: 'High', 
    status: 'Implemented', 
    usersImpacted: '4,125', 
    feedbackCount: '132', 
    createdOn: 'Aug 05, 2025', 
    lastUpdated: 'Aug 22, 2025',
    source: 'Support Tickets',
    owner: 'Arjun Mehta',
    longDesc: 'Frictionless checkout experience without mandatory sign-up.',
    topFeedback: ['Allow guest checkout to reduce cart abandonment.']
  },
  { 
    id: 7, 
    name: 'Price drop alerts', 
    desc: 'Notify users when price drops.', 
    category: 'Notifications', 
    priority: 'Low', 
    status: 'Not Started', 
    usersImpacted: '2,134', 
    feedbackCount: '98', 
    createdOn: 'Jul 28, 2025', 
    lastUpdated: 'Aug 15, 2025',
    source: 'Email',
    owner: 'Rohit Singh',
    longDesc: 'Push and email notifications when items in wishlist drop in price.',
    topFeedback: ['Want notifications for price drops on saved items.']
  },
  { 
    id: 8, 
    name: 'Product size guide', 
    desc: 'Show size guide for clothing products.', 
    category: 'Product Info', 
    priority: 'Low', 
    status: 'Not Started', 
    usersImpacted: '1,316', 
    feedbackCount: '64', 
    createdOn: 'Jul 22, 2025', 
    lastUpdated: 'Aug 10, 2025',
    source: 'In-App Feedback',
    owner: 'Neha Kapoor',
    longDesc: 'Interactive size charts and measurements modal for apparel.',
    topFeedback: ['Need accurate size guide to avoid wrong fit returns.']
  }
];

function cn(...classes) {
  return classes.filter(Boolean).join(';');
}

function PriorityBadge({ value }) {
  const map = { 
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20', 
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20', 
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };
  return <span className={cn('inline-flex border rounded-md px-2 py-0.5 text-[9px] font-semibold transition-transform hover:scale-105', map[value] || 'bg-slate-800 text-slate-300')}>{value}</span>;
}

function StatusBadge({ value }) {
  const map = {
    'Implemented': 'bg-green-500/10 text-green-400 border-green-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Planned': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Not Started': 'bg-slate-700/30 text-slate-400 border-slate-600/30'
  };
  return <span className={cn('inline-flex border rounded-md px-2 py-0.5 text-[9px] font-semibold transition-transform hover:scale-105', map[value] || 'bg-slate-800 text-slate-300')}>{value}</span>;
}

export default function FeaturesDashboard() {
  const [selectedFeature, setSelectedFeature] = useState(FEATURES_ROWS[0]);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredFeatures = useMemo(() => {
    return FEATURES_ROWS.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || f.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, statusFilter, priorityFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full bg-[#070a10] text-slate-300 font-sans flex flex-col justify-between overflow-y-auto pb-16"
    >
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">Features</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Discover, analyze, and manage product features based on user feedback.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => triggerToast('Date range selector opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-violet-500 transition-all hover:scale-105">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400"/> Jul 1 – Aug 31, 2025 <ChevronDown className="w-3 h-3 text-slate-500"/>
            </button>
            <button onClick={() => triggerToast('Advanced filters modal opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-violet-500 transition-all hover:scale-105">
              <Filter className="w-3.5 h-3.5 text-slate-400"/> Filters
            </button>
            <button onClick={() => triggerToast('Exporting report data...')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-violet-500 transition-all hover:scale-105">
              <Download className="w-3.5 h-3.5 text-slate-400"/> Export
            </button>
            <button onClick={() => triggerToast('Add Feature modal opened')} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-lg text-[10px] font-medium text-white shadow-lg shadow-violet-950 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-3.5 h-3.5"/> Add Feature
            </button>
          </div>
        </div>

        {/* Top KPI Cards Grid with Framer Motion */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { title: 'Total Features', val: '56', icon: Layers, color: 'text-violet-400 bg-violet-500/10', trend: '↑ 12.0% vs Jun' },
            { title: 'Active Features', val: '38', icon: Activity, color: 'text-blue-400 bg-blue-500/10', trend: '↑ 8.6% vs Jun' },
            { title: 'Implemented', val: '14', icon: CheckCircle2, color: 'text-green-400 bg-green-500/10', trend: '↑ 16.7% vs Jun' },
            { title: 'In Progress', val: '16', icon: Clock, color: 'text-amber-400 bg-amber-500/10', trend: '↑ 6.7% vs Jun' },
            { title: 'Planned', val: '12', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10', trend: '↓ 7.7% vs Jun' },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-[#111827] border border-[#263348] rounded-xl p-4 flex flex-col justify-between hover:border-violet-500/50 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-green-400 font-medium">{item.trend}</span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] text-slate-400">{item.title}</p>
                  <h3 className="text-[18px] font-bold text-white">{item.val}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section with Recharts Animated Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
          
          {/* Trend Line Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-semibold text-white">Feature Trend Over Time</h3>
              <span className="text-[10px] text-slate-400 bg-[#161f31] px-2 py-0.5 rounded cursor-pointer">Daily ▾</span>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 80]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="total" stroke={COLORS.purple} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={true} />
                  <Line type="monotone" dataKey="implemented" stroke={COLORS.green} strokeWidth={2.5} dot={false} isAnimationActive={true} />
                  <Line type="monotone" dataKey="inProgress" stroke={COLORS.blue} strokeWidth={2.5} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Donut Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between"
          >
            <h3 className="text-[12px] font-semibold text-white mb-3">Features by Status</h3>
            <div className="flex items-center justify-around py-1">
              <div className="w-[110px] h-[110px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={STATUS_DATA} innerRadius={36} outerRadius={52} dataKey="value" isAnimationActive={true}>
                      {STATUS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[8px] text-slate-400">Total</span>
                  <span className="text-[15px] font-bold text-white">56</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {STATUS_DATA.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-2 w-2 rounded-[2px]" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-bold text-slate-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Priority Donut Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between"
          >
            <h3 className="text-[12px] font-semibold text-white mb-3">Features by Priority</h3>
            <div className="flex items-center justify-around py-1">
              <div className="w-[110px] h-[110px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PRIORITY_DATA} innerRadius={36} outerRadius={52} dataKey="value" isAnimationActive={true}>
                      {PRIORITY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[8px] text-slate-400">Total</span>
                  <span className="text-[15px] font-bold text-white">56</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {PRIORITY_DATA.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-2 w-2 rounded-[2px]" style={{ background: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-bold text-slate-200">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Data Table & Details Drawer */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          
          <div className="bg-[#111827] border border-[#263348] rounded-xl overflow-hidden flex flex-col justify-between shadow-xl">
            <div>
              <div className="p-3 border-b border-[#263348] flex items-center justify-between gap-3 bg-[#0d131f]">
                <div className="flex items-center gap-2">
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#161f31] border border-[#263348] px-3 py-1 rounded text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Implemented">Implemented</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planned">Planned</option>
                    <option value="Not Started">Not Started</option>
                  </select>

                  <select 
                    value={priorityFilter} 
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-[#161f31] border border-[#263348] px-3 py-1 rounded text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search features..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#161f31] border border-[#263348] rounded-lg pl-8 pr-3 py-1 text-[10px] text-white focus:outline-none focus:border-violet-500 w-48 transition-all" 
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#161f31] text-slate-400 border-b border-[#263348]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Feature</th>
                      <th className="px-3 py-2.5 font-medium">Category</th>
                      <th className="px-3 py-2.5 font-medium">Priority</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Users Impacted</th>
                      <th className="px-3 py-2.5 font-medium">Feedback</th>
                      <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {filteredFeatures.length > 0 ? (
                      filteredFeatures.map((row) => (
                        <motion.tr 
                          key={row.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => setSelectedFeature(row)} 
                          className={cn("cursor-pointer transition-colors hover:bg-[#161f31]", selectedFeature.id === row.id ? "bg-[#161f31] border-l-4 border-violet-500" : "")}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{row.name}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{row.desc}</div>
                          </td>
                          <td className="px-3 py-3 text-slate-300">{row.category}</td>
                          <td className="px-3 py-3"><PriorityBadge value={row.priority} /></td>
                          <td className="px-3 py-3"><StatusBadge value={row.status} /></td>
                          <td className="px-3 py-3 text-slate-200 font-medium">{row.usersImpacted}</td>
                          <td className="px-3 py-3 text-violet-400 font-medium">{row.feedbackCount}</td>
                          <td className="px-3 py-3 text-right">
                            <Eye className="h-4 w-4 inline text-slate-400 hover:text-white transition-transform hover:scale-125" />
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-slate-500 text-xs">No matching features found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-[#263348] text-[10px] text-slate-400 bg-[#0d131f] flex justify-between items-center">
              <span>Showing 1 to {filteredFeatures.length} of 56 features</span>
              <span>10 / page</span>
            </div>
          </div>

          {/* Feature Details Drawer with Motion */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
                <h3 className="text-[12px] font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-400"/> Feature Details
                </h3>
                <button onClick={() => triggerToast('Drawer minimized')} className="text-slate-400 hover:text-white transition-transform hover:rotate-90"><X className="h-4 w-4"/></button>
              </div>

              <div className="space-y-4 text-[11px]">
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-1">{selectedFeature.name}</h4>
                  <p className="text-[10px] text-slate-400">{selectedFeature.desc}</p>
                </div>

                <div className="flex items-center gap-2">
                  <PriorityBadge value={selectedFeature.priority} />
                  <StatusBadge value={selectedFeature.status} />
                  <span className="text-[10px] text-slate-300 bg-[#161f31] px-2 py-0.5 rounded border border-[#263348]">{selectedFeature.category}</span>
                </div>

                <div className="space-y-2 py-3 border-t border-b border-[#1e293b] text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Users Impacted</span><span className="font-semibold text-white">{selectedFeature.usersImpacted}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Total Feedback</span><span className="font-semibold text-white">{selectedFeature.feedbackCount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Created On</span><span>{selectedFeature.createdOn}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Last Updated</span><span>{selectedFeature.lastUpdated}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Source</span><span>{selectedFeature.source}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Owner</span><span className="text-violet-400 font-medium">{selectedFeature.owner}</span></div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Description</span>
                  <p className="text-[10px] text-slate-300 bg-[#161f31] p-2.5 rounded border border-[#263348] leading-relaxed">
                    {selectedFeature.longDesc}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">Top Related Feedback</span>
                  <div className="space-y-1.5">
                    {selectedFeature.topFeedback.map((fb, idx) => (
                      <div key={idx} className="text-[10px] bg-[#161f31]/60 p-2 rounded border border-[#263348] text-slate-300 truncate">
                        💬 "{fb}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => triggerToast('Redirecting to full feature report...')} 
              className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 text-[11px] font-medium transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>View full details</span> →
            </button>
          </motion.div>

        </div>

      </div>

      {toastMessage && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-[#111827] border border-violet-500 px-4 py-3 rounded-xl shadow-2xl"
        >
          <Sparkles className="w-4 h-4 text-violet-400 animate-spin"/>
          <span className="text-[11px] text-white">{toastMessage}</span>
        </motion.div>
      )}
    </motion.div>
  );
}