import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

const FEEDBACK_TABS = [
  { label: 'All Feedback', key: 'all', count: '12,842' },
  { label: 'My Feedback', key: 'my', count: '156' },
  { label: 'Unresolved', key: 'unresolved', count: '6,842' },
  { label: 'Resolved', key: 'resolved', count: '4,531' },
  { label: 'Snoozed', key: 'snoozed', count: '231' },
];

const COLORS = {
  purple: '#8b5cf6',
  violet: '#a78bfa',
  green: '#22c55e', 
  amber: '#eab308', 
  red: '#ef4444',    
  blue: '#3b82f6',
  orange: '#f97316',
};

const TREND_DATA = [
  { name: 'Jul 1', total: 1000, resolved: 400, open: 500 },
  { name: 'Jul 15', total: 1800, resolved: 700, open: 900 },
  { name: 'Jul 29', total: 1400, resolved: 950, open: 950 },
  { name: 'Aug 12', total: 2200, resolved: 1100, open: 1100 },
  { name: 'Aug 31', total: 2450, resolved: 1300, open: 1150 },
];

const SOURCE_DATA = [
  { name: 'In-App Feedback', value: 44, color: COLORS.purple },
  { name: 'Support Tickets', value: 17, color: COLORS.blue },
  { name: 'Email', value: 39, color: COLORS.green },
];

const PRIORITY_DATA = [
  { name: 'Critical', value: 39, color: COLORS.red },
  { name: 'High', value: 22, color: COLORS.orange },
  { name: 'Medium', value: 39, color: COLORS.amber },
];

const FEEDBACK_ROWS = [
  { id: 1, text: 'Checkout process is too slow and payment fails frequently.', source: 'In-App Feedback', category: 'Checkout & Payments', priority: 'Critical', status: 'Open', user: 'user_123', date: 'Aug 31, 2025 02:45 PM', platform: 'iOS App • iPhone 14', appVersion: 'v2.4.1 (245)', desc: 'The checkout process takes too long and sometimes the payment fails without any error message.', tags: ['checkout', 'payment', 'slow'], history: [{ date: 'Aug 31, 2025 02:45 PM', text: 'Feedback created' }] },
  { id: 2, text: 'Add more payment options like UPI and digital wallets.', source: 'Support Ticket', category: 'Payments', priority: 'High', status: 'Open', user: 'user_456', date: 'Aug 31, 2025 11:20 AM', platform: 'Web • Chrome', appVersion: 'v2.4.0', desc: 'Requesting regional payment gateways like UPI and Paytm.', tags: ['payments', 'upi'], history: [{ date: 'Aug 31, 2025 11:20 AM', text: 'Ticket logged' }] },
  { id: 3, text: 'Love the new UI! It’s much cleaner and easier to use.', source: 'App Store Review', category: 'UI / UX', priority: 'Low', status: 'Resolved', user: 'user_789', date: 'Aug 30, 2025 09:15 PM', platform: 'Android • Pixel 7', appVersion: 'v2.4.1', desc: 'Appreciation review from active beta tester.', tags: ['ui', 'ux'], history: [{ date: 'Aug 30, 2025 09:15 PM', text: 'Marked resolved' }] },
  { id: 4, text: 'App crashes when applying coupon codes at checkout.', source: 'In-App Feedback', category: 'Bug', priority: 'High', status: 'Open', user: 'user_321', date: 'Aug 30, 2025 06:30 PM', platform: 'iOS • iPhone 15', appVersion: 'v2.4.1', desc: 'Reproducible crash whenever a promo code is applied.', tags: ['bug', 'crash'], history: [{ date: 'Aug 30, 2025 06:30 PM', text: 'Reported' }] },
  { id: 5, text: 'Need dark mode option in the app.', source: 'Email', category: 'Feature Request', priority: 'Medium', status: 'Snoozed', user: 'user_654', date: 'Aug 30, 2025 03:10 PM', platform: 'Web • Safari', appVersion: 'v2.4.0', desc: 'User requested dark mode support.', tags: ['darkmode'], history: [{ date: 'Aug 30, 2025 03:10 PM', text: 'Snoozed' }] }
];

function cn(...classes) {
  return classes.filter(Boolean).join(';');
}

function LegendRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5 text-[10px]">
      <span className="flex items-center gap-1.5 text-slate-300">
        <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />
        {label}
      </span>
      <span className="font-bold text-slate-200">{value}</span>
    </div>
  );
}

function ImpactBadge({ value }) {
  const map = { Critical: 'bg-red-500/10 text-red-400 border-red-500/20', High: 'bg-orange-500/10 text-orange-400 border-orange-500/20', Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  return <span className={cn('inline-flex border rounded-md px-2 py-0.5 text-[9px] font-semibold', map[value] || 'bg-slate-800 text-slate-300')}>{value}</span>;
}

function StatusBadge({ value }) {
  const map = { Open: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', Resolved: 'bg-green-500/10 text-green-400 border-green-500/20', Snoozed: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  return <span className={cn('inline-flex border rounded-md px-2 py-0.5 text-[9px] font-semibold', map[value] || 'bg-slate-800 text-slate-300')}>{value}</span>;
}

export default function FeedbackDashboard() {
  const { filter } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(filter || 'all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(FEEDBACK_ROWS[0]);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const currentFilter = filter || 'all';
    setActiveTab(currentFilter);
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const handleTabClick = (tabKey) => {
    navigate(`../intelligence/feedback/${tabKey}`);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredRows = useMemo(() => {
    if (activeTab === 'unresolved' || activeTab === 'my') return FEEDBACK_ROWS.filter(r => r.status === 'Open');
    if (activeTab === 'resolved') return FEEDBACK_ROWS.filter(r => r.status === 'Resolved');
    if (activeTab === 'snoozed') return FEEDBACK_ROWS.filter(r => r.status === 'Snoozed');
    return FEEDBACK_ROWS;
  }, [activeTab]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full bg-[#070a10] text-slate-300 font-sans flex flex-col justify-between overflow-y-auto pb-16"
    >
      <div className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Title & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight capitalize">{activeTab} Feedback</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Capture, analyze, and act on user feedback to build better products.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => triggerToast('Date range selector opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-violet-500 transition-all hover:scale-105">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400"/> Jul 1 – Aug 31, 2025 <ChevronDown className="w-3 h-3 text-slate-500"/>
            </button>
            <button onClick={() => triggerToast('Filters panel opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-violet-500 transition-all hover:scale-105">
              <Filter className="w-3.5 h-3.5 text-slate-400"/> Filters
            </button>
            <button onClick={() => triggerToast('AI Assistant analyzing...')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-violet-500 transition-all hover:scale-105">
              <Sparkles className="w-3.5 h-3.5 text-violet-400"/> AI Assistant
            </button>
            <button onClick={() => triggerToast('Feedback added')} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-lg text-[10px] font-medium text-white shadow-lg shadow-violet-950 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-3.5 h-3.5"/> Add Feedback
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
          {FEEDBACK_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 whitespace-nowrap cursor-pointer",
                activeTab === tab.key ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40 scale-105" : "bg-[#111827] border border-[#263348] text-slate-400 hover:text-white hover:bg-[#1a2338]"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-medium">Loading {activeTab} feedback metrics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top KPI Cards with Motion */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { title: 'Total Feedback', val: '12,842', icon: MessageSquare, trend: '↑ 18.6%' },
                { title: 'Resolved', val: '4,531', icon: CheckCircle2, trend: '↑ 9.4%' },
                { title: 'Open', val: '6,842', icon: Clock, trend: '↑ 12.8%' },
                { title: 'Critical / High', val: '2,156', icon: AlertTriangle, trend: '↑ 6.2%' },
                { title: 'Unique Users', val: '9,812', icon: Users, trend: '↑ 16.4%' },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-[#111827] border border-[#263348] rounded-xl p-4 flex flex-col justify-between hover:border-violet-500/50 hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
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

            {/* Charts Section with Recharts */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[12px] font-semibold text-white">Feedback Trend Over Time</h3>
                  <span className="text-[10px] text-slate-400 bg-[#161f31] px-2 py-0.5 rounded cursor-pointer">Daily ▾</span>
                </div>
                <div className="h-[170px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TREND_DATA}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 3000]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="total" stroke={COLORS.purple} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={true} />
                      <Line type="monotone" dataKey="resolved" stroke={COLORS.green} strokeWidth={2.5} dot={false} isAnimationActive={true} />
                      <Line type="monotone" dataKey="open" stroke={COLORS.amber} strokeWidth={2.5} dot={false} isAnimationActive={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between"
              >
                <h3 className="text-[12px] font-semibold text-white mb-3">Feedback by Source</h3>
                <div className="flex items-center justify-around py-1">
                  <div className="w-[110px] h-[110px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={SOURCE_DATA} innerRadius={36} outerRadius={52} dataKey="value" isAnimationActive={true}>
                          {SOURCE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[8px] text-slate-400">Total</span>
                      <span className="text-[14px] font-bold text-white">12,842</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <LegendRow label="In-App" value="5,621" color={COLORS.purple} />
                    <LegendRow label="Support" value="2,156" color={COLORS.blue} />
                    <LegendRow label="Email" value="1,982" color={COLORS.green} />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-[#111827] border border-[#263348] rounded-xl p-5 flex flex-col justify-between"
              >
                <h3 className="text-[12px] font-semibold text-white mb-3">Feedback by Priority</h3>
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
                      <span className="text-[14px] font-bold text-white">12,842</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <LegendRow label="Critical" value="5,024" color={COLORS.red} />
                    <LegendRow label="High" value="2,842" color="#f97316" />
                    <LegendRow label="Medium" value="2,156" color={COLORS.amber} />
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Data Table & Details Drawer */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
              
              <div className="bg-[#111827] border border-[#263348] rounded-xl overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="p-3 border-b border-[#263348] flex items-center justify-between gap-3 bg-[#0d131f]">
                    <div className="text-[11px] font-semibold text-white">Showing {filteredRows.length} items for <span className="text-violet-400 capitalize">{activeTab}</span></div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input type="text" placeholder="Search feedback..." className="bg-[#161f31] border border-[#263348] rounded-lg pl-8 pr-3 py-1 text-[10px] text-white focus:outline-none w-48" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#161f31] text-slate-400 border-b border-[#263348]">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Feedback</th>
                          <th className="px-3 py-2.5 font-medium">Source</th>
                          <th className="px-3 py-2.5 font-medium">Priority</th>
                          <th className="px-3 py-2.5 font-medium">Status</th>
                          <th className="px-3 py-2.5 font-medium">User</th>
                          <th className="px-3 py-2.5 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]">
                        {filteredRows.map((row) => (
                          <tr key={row.id} onClick={() => setSelectedFeedback(row)} className={cn("cursor-pointer transition-colors hover:bg-[#161f31]", selectedFeedback.id === row.id ? "bg-[#161f31] border-l-4 border-violet-500" : "")}>
                            <td className="px-4 py-3 font-semibold text-slate-100 max-w-[220px] truncate">{row.text}</td>
                            <td className="px-3 py-3 text-slate-300">{row.source}</td>
                            <td className="px-3 py-3"><ImpactBadge value={row.priority} /></td>
                            <td className="px-3 py-3"><StatusBadge value={row.status} /></td>
                            <td className="px-3 py-3 text-violet-400">{row.user}</td>
                            <td className="px-3 py-3 text-right"><Eye className="h-4 w-4 inline text-slate-400 hover:text-white transition-transform hover:scale-125" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 border-t border-[#263348] text-[10px] text-slate-400 bg-[#0d131f]">
                  Page 1 of 1
                </div>
              </div>

              {/* Details Drawer with Motion */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#111827] border border-[#263348] rounded-xl p-4 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 mb-3">
                    <h3 className="text-[12px] font-bold text-white flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-violet-400"/> Details
                    </h3>
                  </div>
                  <div className="space-y-3 text-[11px]">
                    <p className="font-semibold text-slate-100">"{selectedFeedback.text}"</p>
                    <div className="flex gap-2"><ImpactBadge value={selectedFeedback.priority} /><StatusBadge value={selectedFeedback.status} /></div>
                    <div className="space-y-1.5 text-slate-300 pt-2 border-t border-[#1e293b]">
                      <div className="flex justify-between"><span className="text-slate-400">Source:</span><span>{selectedFeedback.source}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">User:</span><span className="text-violet-400">{selectedFeedback.user}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Platform:</span><span>{selectedFeedback.platform}</span></div>
                    </div>
                    <p className="text-[10px] text-slate-400 bg-[#161f31] p-2.5 rounded border border-[#263348]">{selectedFeedback.desc}</p>
                  </div>
                </div>
                <button onClick={() => triggerToast('Opening full details')} className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2 text-[11px] font-medium transition-all shadow-lg hover:scale-[1.01]">
                  View Full Report →
                </button>
              </motion.div>

            </div>

          </div>
        )}

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