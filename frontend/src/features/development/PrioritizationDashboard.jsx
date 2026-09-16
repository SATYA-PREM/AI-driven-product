import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  Star,
  Target,
  Users,
  X,
  Check,
  Ban,
  Sliders,
  MoreHorizontal,
} from 'lucide-react';

const PRIORITIZATION_TABS = ['Scoring View', 'RICE Matrix', 'Kano Model', 'MoSCoW', 'Impact vs Effort'];

const PRIORITIZATION_ROWS = [
  { 
    id: 1, 
    name: 'One-click checkout', 
    desc: 'Simply the checkout process for faster purchase', 
    category: 'Checkout & Payments', 
    priorityScore: 92, 
    priorityLevel: 'High',
    impact: 9.5, 
    effort: 3.0, 
    confidence: '92%', 
    status: 'Pending', 
    validation: 'Validate',
    usersImpacted: '8,542', 
    totalFeedback: '352',
    createdOn: 'Aug 28, 2025',
    lastUpdated: 'Aug 31, 2025',
    source: 'In-App Feedback',
    owner: 'Priya Sharma',
    longDesc: 'This feature allows users to complete their purchase in a single click using saved address and payment details.',
    topFeedback: [
      'Checkout takes too many steps.',
      'Please add one-click purchase option.',
      'Very frustrating during offers.'
    ]
  },
  { 
    id: 2, 
    name: 'Multiple payment options', 
    desc: 'Support more UPI and digital wallets.', 
    category: 'Payments', 
    priorityScore: 85, 
    priorityLevel: 'High',
    impact: 8.8, 
    effort: 3.5, 
    confidence: '88%', 
    status: 'Pending', 
    validation: 'Validate',
    usersImpacted: '6,231', 
    totalFeedback: '289',
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
    priorityScore: 78, 
    priorityLevel: 'High',
    impact: 8.2, 
    effort: 4.0, 
    confidence: '85%', 
    status: 'Validated', 
    validation: 'Approved',
    usersImpacted: '5,412', 
    totalFeedback: '241',
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
    priorityScore: 65, 
    priorityLevel: 'Medium',
    impact: 6.0, 
    effort: 3.0, 
    confidence: '70%', 
    status: 'Validated', 
    validation: 'Rejected',
    usersImpacted: '3,842', 
    totalFeedback: '186',
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
    desc: 'Save products to wishlist', 
    category: 'Product Discovery', 
    priorityScore: 62, 
    priorityLevel: 'Medium',
    impact: 6.5, 
    effort: 4.5, 
    confidence: '68%', 
    status: 'Pending', 
    validation: 'Validate',
    usersImpacted: '3,210', 
    totalFeedback: '153',
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
    desc: 'Checkout without account creation', 
    category: 'Checkout & Payments', 
    priorityScore: 58, 
    priorityLevel: 'Medium',
    impact: 6.0, 
    effort: 5.0, 
    confidence: '65%', 
    status: 'Pending', 
    validation: 'Validate',
    usersImpacted: '4,125', 
    totalFeedback: '132',
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
    priorityScore: 45, 
    priorityLevel: 'Low',
    impact: 4.5, 
    effort: 3.5, 
    confidence: '60%', 
    status: 'Validated', 
    validation: 'Approved',
    usersImpacted: '2,134', 
    totalFeedback: '98',
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
    priorityScore: 38, 
    priorityLevel: 'Low',
    impact: 3.5, 
    effort: 4.0, 
    confidence: '45%', 
    status: 'Pending', 
    validation: 'Validate',
    usersImpacted: '1,316', 
    totalFeedback: '64',
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

function StatusBadge({ value }) {
  const map = {
    'Validated': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return <span className={cn('inline-flex border rounded-md px-1.5 py-0.5 text-[9px] font-semibold', map[value] || 'bg-slate-800 text-slate-300')}>{value}</span>;
}

function ValidationBadge({ value }) {
  const map = {
    'Approved': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Validate': 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
  };
  return <span className={cn('inline-flex items-center justify-center border rounded-md px-2 py-0.5 text-[9px] font-semibold cursor-pointer transition-all', map[value] || 'bg-slate-800 text-slate-300')}>{value === 'Approved' ? '✓ Approved' : value === 'Rejected' ? '✕ Rejected' : 'Validate'}</span>;
}

export default function PrioritizationDashboard() {
  const [activeTab, setActiveTab] = useState('Scoring View');
  const [selectedFeature, setSelectedFeature] = useState(PRIORITIZATION_ROWS[0]);
  const [validationState, setValidationState] = useState('Approve');
  const [comment, setComment] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredRows = useMemo(() => {
    return PRIORITIZATION_ROWS.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
            <h1 className="text-[22px] font-bold text-white tracking-tight">Feature Prioritization</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Prioritize features based on impact, effort, and user feedback. Validate and approve changes before implementation.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => triggerToast('Exporting prioritization report...')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-purple-500 transition-all hover:scale-105">
              <Download className="w-3.5 h-3.5 text-slate-400"/> Export
            </button>
            <button onClick={() => triggerToast('Scoring configuration opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-1.5 rounded-lg text-[10px] text-slate-300 hover:border-purple-500 transition-all hover:scale-105">
              <Sliders className="w-3.5 h-3.5 text-purple-400"/> Configure Scoring
            </button>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { title: 'Total Features', val: '56', sub: '100%', icon: Layers, color: 'text-purple-400 bg-purple-500/10' },
            { title: 'Pending Validation', val: '7', sub: '12.5%', icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
            { title: 'Validated (To Do)', val: '28', sub: '50.0%', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/10' },
            { title: 'Approved (Done)', val: '14', sub: '25.0%', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10' },
            { title: 'Rejected', val: '5', sub: '8.9%', icon: X, color: 'text-red-400 bg-red-500/10' },
            { title: 'Avg. Priority Score', val: '68 / 100', sub: '↑ 6.3 vs last update', icon: Activity, color: 'text-cyan-400 bg-cyan-500/10' },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-[#111827] border border-[#263348] rounded-xl p-3.5 flex flex-col justify-between hover:border-purple-500/50 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${item.color}`}>
                    <IconComp className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="text-[10px] text-slate-400">{item.title}</p>
                  <h3 className="text-[16px] font-bold text-white mt-0.5">{item.val}</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Framework Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
          {PRIORITIZATION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 whitespace-nowrap cursor-pointer",
                activeTab === tab ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-105" : "bg-[#111827] border border-[#263348] text-slate-400 hover:text-white hover:bg-[#1a2338]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Data Table & Validation Drawer Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          
          {/* Features Table (Optimized widths to prevent horizontal overflow) */}
          <div className="bg-[#111827] border border-[#263348] rounded-xl overflow-hidden flex flex-col justify-between shadow-xl">
            <div>
              <div className="p-3 border-b border-[#263348] flex flex-wrap items-center justify-between gap-2 bg-[#0d131f]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button className="bg-[#161f31] border border-[#263348] px-2.5 py-1 rounded text-[10px] text-slate-300">Statuses ▾</button>
                  <button className="bg-[#161f31] border border-[#263348] px-2.5 py-1 rounded text-[10px] text-slate-300">Categories ▾</button>
                  <button className="bg-[#161f31] border border-[#263348] px-2.5 py-1 rounded text-[10px] text-slate-300">Sources ▾</button>
                  <button className="bg-[#161f31] border border-[#263348] px-2.5 py-1 rounded text-[10px] text-slate-300">Priorities ▾</button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search features..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#161f31] border border-[#263348] rounded-lg pl-8 pr-3 py-1 text-[10px] text-white focus:outline-none focus:border-purple-500 w-40 sm:w-48 transition-all" 
                  />
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-[11px] table-auto">
                  <thead className="bg-[#161f31] text-slate-400 border-b border-[#263348]">
                    <tr>
                      <th className="px-3 py-2.5 font-medium w-[28%]">Feature</th>
                      <th className="px-2 py-2.5 font-medium w-[18%]">Category</th>
                      <th className="px-2 py-2.5 font-medium w-[10%]">Score</th>
                      <th className="px-2 py-2.5 font-medium w-[8%]">Impact</th>
                      <th className="px-2 py-2.5 font-medium w-[8%]">Effort</th>
                      <th className="px-2 py-2.5 font-medium w-[9%]">Conf.</th>
                      <th className="px-2 py-2.5 font-medium w-[9%]">Status</th>
                      <th className="px-2 py-2.5 font-medium text-center w-[10%]">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row) => (
                        <motion.tr 
                          key={row.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => setSelectedFeature(row)} 
                          className={cn("cursor-pointer transition-colors hover:bg-[#161f31]", selectedFeature.id === row.id ? "bg-[#161f31] border-l-4 border-purple-500" : "")}
                        >
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">{row.name}</div>
                            <div className="text-[9px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">{row.desc}</div>
                          </td>
                          <td className="px-2 py-2.5 text-slate-300 truncate max-w-[110px]">{row.category}</td>
                          <td className="px-2 py-2.5 font-bold text-white">
                            {row.priorityScore}
                            <div className="text-[8px] text-purple-400 font-normal">{row.priorityLevel}</div>
                          </td>
                          <td className="px-2 py-2.5 text-slate-200">{row.impact}</td>
                          <td className="px-2 py-2.5 text-slate-200">{row.effort}</td>
                          <td className="px-2 py-2.5 text-slate-200">{row.confidence}</td>
                          <td className="px-2 py-2.5"><StatusBadge value={row.status} /></td>
                          <td className="px-2 py-2.5 text-center"><ValidationBadge value={row.validation} /></td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-6 text-slate-500 text-xs">No matching features found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-[#263348] text-[10px] text-slate-400 bg-[#0d131f] flex justify-between items-center">
              <span>Showing 1 to {filteredRows.length} of 56 features</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 bg-purple-600 text-white rounded">1</span>
                <span className="px-2 py-0.5 hover:bg-[#161f31] rounded cursor-pointer">2</span>
                <span className="px-2 py-0.5 hover:bg-[#161f31] rounded cursor-pointer">3</span>
                <span>...</span>
                <span className="px-2 py-0.5 hover:bg-[#161f31] rounded cursor-pointer">7</span>
                <span>10 / page ▾</span>
              </div>
            </div>
          </div>

          {/* Feature Details & Validation Panel (Right Sidebar) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111827] border border-[#263348] rounded-xl p-4 flex flex-col justify-between shadow-xl"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5 mb-3">
                <h3 className="text-[12px] font-bold text-white flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-purple-400"/> Feature Details
                </h3>
                <button onClick={() => triggerToast('Drawer minimized')} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5"/></button>
              </div>

              {/* Feature Title & Priority Score */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-[12px] font-bold text-white">{selectedFeature.name}</h4>
                  <p className="text-[10px] text-slate-400">{selectedFeature.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-bold text-white">{selectedFeature.priorityScore} <span className="text-[9px] text-slate-400 font-normal">/ 100</span></div>
                  <span className="text-[8px] text-green-400 font-medium">⚡ High</span>
                </div>
              </div>

              <div className="text-[10px] text-purple-400 mb-3">{selectedFeature.category}</div>

              {/* Sub-tabs in Drawer */}
              <div className="flex items-center gap-3 text-[10px] border-b border-[#1e293b] pb-2 mb-3 text-slate-400">
                <span className="text-white font-medium border-b-2 border-purple-500 pb-2 -mb-2 cursor-pointer">Overview</span>
                <span className="hover:text-white cursor-pointer">Scoring Breakdown</span>
                <span className="hover:text-white cursor-pointer">Feedback ({selectedFeature.totalFeedback})</span>
                <span className="hover:text-white cursor-pointer">History</span>
              </div>

              <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
                {selectedFeature.longDesc}
              </p>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-4 gap-2 bg-[#161f31] p-2.5 rounded-lg border border-[#263348] text-center mb-3 text-[10px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">Impact</span>
                  <strong className="text-white text-[10px]">{selectedFeature.impact}/10</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Effort</span>
                  <strong className="text-white text-[10px]">{selectedFeature.effort}/10</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Conf.</span>
                  <strong className="text-white text-[10px]">{selectedFeature.confidence}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Users</span>
                  <strong className="text-white text-[10px]">{selectedFeature.usersImpacted}</strong>
                </div>
              </div>

              {/* Top Feedback */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Top Feedback</span>
                  <span className="text-[9px] text-purple-400 cursor-pointer hover:underline">View all →</span>
                </div>
                <div className="space-y-1">
                  {selectedFeature.topFeedback.map((fb, idx) => (
                    <div key={idx} className="text-[9px] bg-[#161f31]/60 p-1.5 rounded border border-[#263348] text-slate-300 truncate">
                      💬 "{fb}"
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Section */}
              <div className="border-t border-[#1e293b] pt-2.5">
                <h5 className="text-[10px] font-bold text-white mb-0.5">Validation</h5>
                <p className="text-[9px] text-slate-400 mb-2">Review AI prioritization and feedback insights.</p>
                
                {/* 4 Validation Action Radio Cards */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {[
                    { key: 'Approve', label: 'Approve', icon: CheckCircle2, activeColor: 'border-green-500 bg-green-500/10 text-green-400' },
                    { key: 'Validate', label: 'To Do', icon: Clock, activeColor: 'border-amber-500 bg-amber-500/10 text-amber-400' },
                    { key: 'Reject', label: 'Reject', icon: Ban, activeColor: 'border-red-500 bg-red-500/10 text-red-400' },
                    { key: 'Snooze', label: 'Snooze', icon: Activity, activeColor: 'border-purple-500 bg-purple-500/10 text-purple-400' },
                  ].map((v) => {
                    const IconC = v.icon;
                    const isSelected = validationState === v.key;
                    return (
                      <div 
                        key={v.key}
                        onClick={() => setValidationState(v.key)}
                        className={cn(
                          "cursor-pointer border rounded-lg p-1.5 flex flex-col items-center text-center transition-all",
                          isSelected ? v.activeColor : "border-[#263348] bg-[#161f31] text-slate-400 hover:border-slate-500"
                        )}
                      >
                        <IconC className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-[8px] font-bold leading-tight">{v.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Add Note Input */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block font-medium">Add Note (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Add your comments..." 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[#161f31] border border-[#263348] rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-2.5 border-t border-[#1e293b]">
              <button 
                onClick={() => triggerToast('Action cancelled')}
                className="w-1/3 bg-[#161f31] hover:bg-[#263348] border border-[#263348] text-slate-300 rounded-lg py-2 text-[10px] font-medium transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => triggerToast(`Decision saved successfully as ${validationState}!`)} 
                className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-[10px] font-medium transition-all shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.01]"
              >
                <span>Save Decision</span>
              </button>
            </div>
          </motion.div>

        </div>

      </div>

      {toastMessage && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-[#111827] border border-purple-500 px-4 py-3 rounded-xl shadow-2xl"
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin"/>
          <span className="text-[11px] text-white">{toastMessage}</span>
        </motion.div>
      )}
    </motion.div>
  );
}