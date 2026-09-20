import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Layers,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  SlidersHorizontal,
  Download,
  Plus,
  Search,
  Settings,
  X,
  CreditCard,
  Wallet,
  Truck,
  Moon,
  Heart,
  UserCheck,
  Bell,
  Ruler,
  GripVertical,
  MessageSquare,
  Info,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getActiveDatasetId, subscribeToActiveDataset } from '../../utils/workspaceAccess';
import { intelligenceApi } from '../../api/client';

const COLORS = {
  purple: '#8b5cf6',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  amber: '#eab308',
  red: '#ef4444',
  slate: '#64748b',
};

// 10-point line chart data matching screenshot (Jul 1 - Aug 31)
const TREND_DATA = [
  { name: 'Jul 1', total: 20, implemented: 5, inProgress: 8, planned: 5 },
  { name: 'Jul 8', total: 26, implemented: 7, inProgress: 10, planned: 6 },
  { name: 'Jul 15', total: 34, implemented: 8, inProgress: 12, planned: 8 },
  { name: 'Jul 22', total: 30, implemented: 8, inProgress: 11, planned: 7 },
  { name: 'Jul 29', total: 42, implemented: 10, inProgress: 14, planned: 9 },
  { name: 'Aug 5', total: 38, implemented: 10, inProgress: 13, planned: 9 },
  { name: 'Aug 12', total: 46, implemented: 11, inProgress: 15, planned: 10 },
  { name: 'Aug 19', total: 42, implemented: 12, inProgress: 14, planned: 9 },
  { name: 'Aug 26', total: 52, implemented: 13, inProgress: 15, planned: 11 },
  { name: 'Aug 31', total: 56, implemented: 14, inProgress: 16, planned: 12 },
];

const STATUS_DATA = [
  { name: 'Implemented', count: 14, percentage: '25.0%', color: COLORS.green },
  { name: 'In Progress', count: 16, percentage: '28.6%', color: COLORS.blue },
  { name: 'Planned', count: 12, percentage: '21.4%', color: COLORS.orange },
  { name: 'Not Started', count: 14, percentage: '25.0%', color: COLORS.red },
];

const PRIORITY_DATA = [
  { name: 'Critical', count: 10, percentage: '17.9%', color: COLORS.red },
  { name: 'High', count: 18, percentage: '32.1%', color: COLORS.orange },
  { name: 'Medium', count: 17, percentage: '30.4%', color: COLORS.amber },
  { name: 'Low', count: 7, percentage: '12.5%', color: COLORS.green },
  { name: 'None', count: 4, percentage: '7.1%', color: COLORS.slate },
];

// Feature rows matching media_1789923804284.jpg exactly
const INITIAL_FEATURES_ROWS = [
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
    iconType: 'card',
    longDesc: 'Users want a faster checkout experience. This feature allows them to place orders with previously saved details in a single click.',
    topFeedback: [
      { text: 'Checkout process is too slow and payment fails freq...', date: 'Aug 31, 2025' },
      { text: 'Please add one click purchase option', date: 'Aug 29, 2025' },
      { text: 'Need faster checkout for returning customers', date: 'Aug 27, 2025' },
    ],
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
    iconType: 'wallet',
    longDesc: 'Support additional local payment gateways including UPI, PhonePe, Paytm, and digital wallet integrations to streamline mobile checkout.',
    topFeedback: [
      { text: 'Need UPI and digital wallet checkout options.', date: 'Aug 30, 2025' },
      { text: 'International card gateway drops transactions occasionally.', date: 'Aug 24, 2025' },
    ],
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
    iconType: 'truck',
    longDesc: 'Live delivery courier syncing with webhook alerts and push notifications for item dispatch, in-transit milestones, and out-for-delivery states.',
    topFeedback: [
      { text: 'Order status takes hours to update after shipping.', date: 'Aug 28, 2025' },
      { text: 'Live map tracking like food delivery apps would be awesome.', date: 'Aug 22, 2025' },
    ],
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
    iconType: 'moon',
    longDesc: 'System-wide high contrast and OLED dark mode across iOS, Android, and web platforms for low-light browsing and battery saving.',
    topFeedback: [
      { text: 'The white screen at night strains my eyes. Please add dark mode.', date: 'Aug 26, 2025' },
      { text: 'Dark mode theme requested by many desktop users.', date: 'Aug 19, 2025' },
    ],
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
    iconType: 'heart',
    longDesc: 'Allow registered and guest customers to bookmark products, organize items into themed boards, and share wishlists with friends.',
    topFeedback: [
      { text: 'Wishlist button is missing on the product grid view.', date: 'Aug 21, 2025' },
      { text: 'I want to save items for future purchases during seasonal sales.', date: 'Aug 14, 2025' },
    ],
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
    iconType: 'user',
    longDesc: 'Enable quick friction-free purchasing without forcing customers to create passwords or complete account registration.',
    topFeedback: [
      { text: 'Mandatory registration before payment causes cart abandonment.', date: 'Aug 18, 2025' },
      { text: 'Guest checkout made ordering twice as fast.', date: 'Aug 09, 2025' },
    ],
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
    iconType: 'bell',
    longDesc: 'Automated email and push alerts triggered whenever a saved or wishlisted product experiences a price reduction or flash sale discount.',
    topFeedback: [
      { text: 'Notify me when items in my cart get a discount.', date: 'Aug 12, 2025' },
      { text: 'Price alert notifications help me complete planned purchases.', date: 'Jul 30, 2025' },
    ],
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
    iconType: 'ruler',
    longDesc: 'Interactive sizing charts with centimeter and inch converters, model measurement references, and fit recommendations to minimize apparel returns.',
    topFeedback: [
      { text: 'Fit varies heavily between brands; need accurate size charts.', date: 'Aug 04, 2025' },
      { text: 'Include chest and length measurements on garment pages.', date: 'Jul 26, 2025' },
    ],
  },
];

function FeatureIcon({ type, className = 'w-4 h-4' }) {
  switch (type) {
    case 'card':
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <CreditCard className={className} />
        </div>
      );
    case 'wallet':
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Wallet className={className} />
        </div>
      );
    case 'truck':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <Truck className={className} />
        </div>
      );
    case 'moon':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <Moon className={className} />
        </div>
      );
    case 'heart':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <Heart className={className} />
        </div>
      );
    case 'user':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <UserCheck className={className} />
        </div>
      );
    case 'bell':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
          <Bell className={className} />
        </div>
      );
    case 'ruler':
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <Ruler className={className} />
        </div>
      );
  }
}

function PriorityBadge({ value }) {
  const map = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    None: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
        map[value] || 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {value}
    </span>
  );
}

function StatusBadge({ value }) {
  const map = {
    'Implemented': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Planned': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Not Started': 'bg-slate-700/30 text-slate-400 border-slate-600/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
        map[value] || 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {value}
    </span>
  );
}

export default function FeaturesDashboard() {
  const { workspaceId } = useParams();
  const [featuresList, setFeaturesList] = useState(INITIAL_FEATURES_ROWS);
  const [selectedFeature, setSelectedFeature] = useState(INITIAL_FEATURES_ROWS[0]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Subscribe to active dataset
  useEffect(() => {
    return subscribeToActiveDataset(async (activeDsId) => {
      if (!workspaceId) return;
      try {
        const liveFeatures = await intelligenceApi.getFeatures(workspaceId, activeDsId);
        if (Array.isArray(liveFeatures) && liveFeatures.length > 0) {
          // Merge with mockup visual details
          const merged = liveFeatures.map((lf, idx) => ({
            id: lf.id || idx + 1,
            name: lf.feature_name || lf.name || `Feature #${idx + 1}`,
            desc: lf.summary || lf.description || 'Customer requested improvement',
            category: lf.category || 'General',
            priority: lf.priority_score > 70 ? 'Critical' : lf.priority_score > 45 ? 'High' : 'Medium',
            status: lf.status || (idx % 3 === 0 ? 'Implemented' : idx % 2 === 0 ? 'In Progress' : 'Planned'),
            usersImpacted: lf.impacted_users ? Number(lf.impacted_users).toLocaleString() : '3,450',
            feedbackCount: lf.mention_count ? String(lf.mention_count) : '124',
            createdOn: 'Aug 28, 2025',
            lastUpdated: 'Aug 31, 2025',
            source: 'In-App Feedback',
            owner: 'Priya Sharma',
            iconType: ['card', 'wallet', 'truck', 'moon', 'heart', 'user', 'bell', 'ruler'][idx % 8],
            longDesc: lf.description || 'Feature cluster generated from customer feedback evidence.',
            topFeedback: [
              { text: lf.sample_feedback || 'Customer requested this enhancement in recent surveys.', date: 'Aug 31, 2025' },
            ],
          }));
          setFeaturesList(merged);
          setSelectedFeature(merged[0]);
        }
      } catch {
        // Keep standard mock data on failure
      }
    });
  }, [workspaceId]);

  // Filtered rows
  const filteredFeatures = useMemo(() => {
    return featuresList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesSource = sourceFilter === 'All' || item.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesSource;
    });
  }, [featuresList, searchQuery, statusFilter, priorityFilter, categoryFilter, sourceFilter]);

  // Toggle selection
  const toggleRow = (id) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(filteredFeatures.map((f) => f.id)));
      setSelectAll(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080b11] text-slate-300 font-sans flex flex-col justify-between overflow-y-auto pb-16 transition-opacity duration-300">
      <div className="p-5 md:p-6 space-y-5 max-w-[1720px] w-full mx-auto">
        {/* Breadcrumbs & Header Section */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] mb-1 font-medium">
            <span className="text-[#a855f7] hover:underline cursor-pointer">Insights</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-slate-200">Features</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-white tracking-tight">Features</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Discover, analyze, and manage product features based on user feedback.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => triggerToast('Date range: Jul 1 – Aug 31, 2025')}
                className="flex items-center gap-2 bg-[#111726] border border-[#1e293b] px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:border-slate-600 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Jul 1 – Aug 31, 2025</span>
              </button>

              <button
                onClick={() => triggerToast('Filter modal toggled')}
                className="flex items-center gap-1.5 bg-[#111726] border border-[#1e293b] px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:border-slate-600 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters</span>
              </button>

              <button
                onClick={() => triggerToast('Exporting features CSV report...')}
                className="flex items-center gap-1.5 bg-[#111726] border border-[#1e293b] px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:border-slate-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </button>

              <button
                onClick={() => triggerToast('Add Feature dialog opened')}
                className="flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#5558e6] text-white px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feature</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Top KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {[
            {
              title: 'Total Features',
              val: '56',
              icon: Layers,
              iconBg: 'bg-[#2e1065]/60 border border-[#581c87]/50 text-[#c084fc]',
              trend: '↑ 12.0% vs Jun 1 – Jun 30',
              trendColor: 'text-[#4ade80]',
            },
            {
              title: 'Active Features',
              val: '38',
              icon: ListFilter,
              iconBg: 'bg-[#1e3a8a]/40 border border-[#1d4ed8]/40 text-[#60a5fa]',
              trend: '↑ 8.6% vs Jun 1 – Jun 30',
              trendColor: 'text-[#4ade80]',
            },
            {
              title: 'Implemented',
              val: '14',
              icon: CheckCircle2,
              iconBg: 'bg-[#064e3b]/50 border border-[#047857]/40 text-[#4ade80]',
              trend: '↑ 16.7% vs Jun 1 – Jun 30',
              trendColor: 'text-[#4ade80]',
            },
            {
              title: 'In Progress',
              val: '16',
              icon: Clock,
              iconBg: 'bg-[#78350f]/40 border border-[#b45309]/40 text-[#fbbf24]',
              trend: '↑ 6.7% vs Jun 1 – Jun 30',
              trendColor: 'text-[#4ade80]',
            },
            {
              title: 'Planned',
              val: '12',
              icon: AlertTriangle,
              iconBg: 'bg-[#7f1d1d]/40 border border-[#b91c1c]/40 text-[#f87171]',
              trend: '↓ 7.7% vs Jun 1 – Jun 30',
              trendColor: 'text-[#f87171]',
            },
            {
              title: 'Unique Users Impacted',
              val: '24,812',
              icon: Users,
              iconBg: 'bg-[#3b0764]/50 border border-[#6b21a8]/40 text-[#c084fc]',
              trend: '↑ 14.3% vs Jun 1 – Jun 30',
              trendColor: 'text-[#4ade80]',
            },
          ].map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-slate-400 font-normal">{card.title}</div>
                  <div className="text-[20px] font-bold text-white tracking-tight mt-0.5">{card.val}</div>
                  <div className={`text-[9.5px] font-medium mt-1 ${card.trendColor}`}>{card.trend}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Visualizations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Chart 1: Feature Trend Over Time */}
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[12px] font-semibold text-white">Feature Trend Over Time</h3>
                  <Info className="w-3 h-3 text-slate-500 cursor-pointer" />
                </div>
                <button
                  onClick={() => triggerToast('Timespan view: Daily')}
                  className="flex items-center gap-1 bg-[#162032] border border-[#1e293b] px-2 py-0.5 rounded text-[10px] text-slate-300 hover:border-slate-500"
                >
                  <span>Daily</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-[9.5px] text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-[#8b5cf6]" />
                  Total
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-[#22c55e]" />
                  Implemented
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-[#3b82f6]" />
                  In Progress
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-[2px] bg-[#f97316]" />
                  Planned
                </span>
              </div>
            </div>

            <div className="h-[155px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '6px',
                      fontSize: '10px',
                      padding: '6px 10px',
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="implemented" stroke={COLORS.green} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="inProgress" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="planned" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Features by Status */}
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-semibold text-white">Features by Status</h3>
            </div>

            <div className="flex items-center justify-around py-2">
              <div className="w-[110px] h-[110px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={STATUS_DATA}
                      innerRadius={36}
                      outerRadius={52}
                      dataKey="count"
                      stroke="#0f172a"
                      strokeWidth={2}
                    >
                      {STATUS_DATA.map((entry, index) => (
                        <Cell key={`status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[15px] font-bold text-white leading-none">56</span>
                  <span className="text-[8.5px] text-slate-400 mt-0.5">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 pl-2 text-[10px]">
                {STATUS_DATA.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-[2px]" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[9.5px]">
                      <span className="text-slate-200 font-semibold">{item.count}</span> ({item.percentage})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e293b]/70">
              <button
                onClick={() => setStatusFilter('All')}
                className="text-[10px] text-[#a855f7] hover:text-[#c084fc] font-medium flex items-center gap-1 transition-colors"
              >
                <span>View all features by status</span> &rarr;
              </button>
            </div>
          </div>

          {/* Chart 3: Features by Priority */}
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-semibold text-white">Features by Priority</h3>
            </div>

            <div className="flex items-center justify-around py-2">
              <div className="w-[110px] h-[110px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PRIORITY_DATA}
                      innerRadius={36}
                      outerRadius={52}
                      dataKey="count"
                      stroke="#0f172a"
                      strokeWidth={2}
                    >
                      {PRIORITY_DATA.map((entry, index) => (
                        <Cell key={`priority-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[15px] font-bold text-white leading-none">56</span>
                  <span className="text-[8.5px] text-slate-400 mt-0.5">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 pl-2 text-[10px]">
                {PRIORITY_DATA.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-[2px]" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[9.5px]">
                      <span className="text-slate-200 font-semibold">{item.count}</span> ({item.percentage})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e293b]/70">
              <button
                onClick={() => setPriorityFilter('All')}
                className="text-[10px] text-[#a855f7] hover:text-[#c084fc] font-medium flex items-center gap-1 transition-colors"
              >
                <span>View all features by priority</span> &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#162032] border border-[#1e293b] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
              className="bg-[#162032] border border-[#1e293b] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#162032] border border-[#1e293b] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Checkout & Payments">Checkout & Payments</option>
              <option value="Payments">Payments</option>
              <option value="Order Management">Order Management</option>
              <option value="UI / UX">UI / UX</option>
              <option value="Product Discovery">Product Discovery</option>
              <option value="Notifications">Notifications</option>
              <option value="Product Info">Product Info</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#162032] border border-[#1e293b] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Sources</option>
              <option value="In-App Feedback">In-App Feedback</option>
              <option value="Support Tickets">Support Tickets</option>
              <option value="Email">Email</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#162032] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-[10.5px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>

            <button
              onClick={() => triggerToast('Customize columns settings opened')}
              className="flex items-center gap-1.5 bg-[#162032] border border-[#1e293b] px-3 py-1.5 rounded-lg text-[10.5px] text-slate-300 hover:border-slate-500 transition-colors shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Customize columns</span>
            </button>
          </div>
        </div>

        {/* Data Table & Feature Details Drawer */}
        <div className={`grid grid-cols-1 ${isDrawerOpen ? 'xl:grid-cols-[1fr_360px]' : 'xl:grid-cols-1'} gap-3.5 items-start`}>
          {/* Table Container */}
          <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#121b2d] text-slate-400 border-b border-[#1e293b]">
                  <tr>
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="rounded bg-[#162032] border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2.5 font-medium">Feature</th>
                    <th className="px-3 py-2.5 font-medium">Category</th>
                    <th className="px-3 py-2.5 font-medium">Priority</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Users Impacted</th>
                    <th className="px-3 py-2.5 font-medium">Feedback</th>
                    <th className="px-3 py-2.5 font-medium">Created On</th>
                    <th className="px-3 py-2.5 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/70">
                  {filteredFeatures.length > 0 ? (
                    filteredFeatures.map((row) => {
                      const isSelected = selectedFeature?.id === row.id;
                      const isChecked = selectedRows.has(row.id);
                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedFeature(row);
                            setIsDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#162032] border-l-2 border-indigo-500'
                              : 'hover:bg-[#131d2e]'
                          }`}
                        >
                          <td
                            className="px-3 py-2.5 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(row.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRow(row.id)}
                              className="rounded bg-[#162032] border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <FeatureIcon type={row.iconType} />
                              <div>
                                <div className="font-semibold text-white text-[11.5px] leading-tight">{row.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 max-w-[210px] truncate">{row.desc}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-300 font-normal">{row.category}</td>
                          <td className="px-3 py-2.5">
                            <PriorityBadge value={row.priority} />
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge value={row.status} />
                          </td>
                          <td className="px-3 py-2.5 text-slate-200 font-mono font-medium">{row.usersImpacted}</td>
                          <td className="px-3 py-2.5 text-slate-300 font-mono font-medium">{row.feedbackCount}</td>
                          <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{row.createdOn}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500 hover:text-slate-300">
                            <GripVertical className="w-3.5 h-3.5 inline cursor-grab active:cursor-grabbing" />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-slate-500 text-[11px]">
                        No features found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-[#1e293b] text-[10px] text-slate-400 bg-[#0c121e] flex flex-wrap justify-between items-center gap-2">
              <span>Showing 1 to {filteredFeatures.length} of 56 features</span>

              <div className="flex items-center gap-1.5">
                <button className="px-2 py-0.5 rounded bg-[#162032] hover:bg-[#1e293b] text-slate-300 disabled:opacity-50">
                  &lt;
                </button>
                <button className="px-2.5 py-0.5 rounded bg-[#6366f1] text-white font-medium">1</button>
                <button className="px-2.5 py-0.5 rounded hover:bg-[#162032] text-slate-300">2</button>
                <button className="px-2.5 py-0.5 rounded hover:bg-[#162032] text-slate-300">3</button>
                <button className="px-2.5 py-0.5 rounded hover:bg-[#162032] text-slate-300">4</button>
                <button className="px-2.5 py-0.5 rounded hover:bg-[#162032] text-slate-300">5</button>
                <span className="text-slate-500 px-1">...</span>
                <button className="px-2.5 py-0.5 rounded hover:bg-[#162032] text-slate-300">7</button>
                <button className="px-2 py-0.5 rounded bg-[#162032] hover:bg-[#1e293b] text-slate-300">
                  &gt;
                </button>
              </div>

              <div className="flex items-center gap-1">
                <select className="bg-[#162032] border border-[#1e293b] px-2 py-0.5 rounded text-[10px] text-slate-300 focus:outline-none">
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Slide-over Feature Details Drawer */}
          {isDrawerOpen && selectedFeature && (
            <div
              className="bg-[#0f172a]/95 border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between shadow-2xl transition-all duration-200"
            >
              <div className="space-y-3.5 text-[11px]">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                  <h3 className="text-[12px] font-bold text-white tracking-wide">Feature Details</h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Close drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Feature Main Info */}
                <div className="flex items-start gap-3">
                  <FeatureIcon type={selectedFeature.iconType} className="w-4 h-4" />
                  <div>
                    <h4 className="text-[13px] font-bold text-white leading-tight">{selectedFeature.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedFeature.desc}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PriorityBadge value={selectedFeature.priority} />
                  <StatusBadge value={selectedFeature.status} />
                  <span className="text-[10px] text-slate-300 bg-[#162032] border border-[#1e293b] px-2 py-0.5 rounded font-medium">
                    {selectedFeature.category}
                  </span>
                </div>

                {/* Metrics Table */}
                <div className="divide-y divide-[#1e293b]/70 border-t border-b border-[#1e293b] py-1 text-slate-300">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Users Impacted</span>
                    <span className="font-semibold text-white font-mono">{selectedFeature.usersImpacted}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Total Feedback</span>
                    <span className="font-semibold text-white font-mono">{selectedFeature.feedbackCount}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Created On</span>
                    <span className="text-slate-300 font-mono text-[10.5px]">{selectedFeature.createdOn}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Last Updated</span>
                    <span className="text-slate-300 font-mono text-[10.5px]">{selectedFeature.lastUpdated}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Source</span>
                    <span className="text-slate-200">{selectedFeature.source}</span>
                  </div>
                  <div className="flex justify-between py-1.5 items-center">
                    <span className="text-slate-400">Owner</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] font-bold flex items-center justify-center border border-indigo-500/30">
                        PS
                      </div>
                      <span className="text-slate-200 font-medium text-[10.5px]">{selectedFeature.owner}</span>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Description</span>
                  <p className="text-[10.5px] text-slate-300 bg-[#141d2e] p-2.5 rounded-lg border border-[#1e293b] leading-relaxed">
                    {selectedFeature.longDesc}
                  </p>
                </div>

                {/* Top Related Feedback */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">Top Related Feedback</span>
                    <button
                      onClick={() => triggerToast('Opening full feedback evidence modal...')}
                      className="text-[10px] text-[#a855f7] hover:underline"
                    >
                      View all &rarr;
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {selectedFeature.topFeedback.map((fb, idx) => (
                      <div
                        key={idx}
                        className="bg-[#141d2e] border border-[#1e293b] p-2 rounded-lg flex items-start gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-200 leading-snug truncate">
                            "{fb.text}"
                          </div>
                          <div className="text-[8.5px] text-slate-500 mt-0.5">{fb.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <button
                onClick={() => triggerToast(`Opening PRD & requirements for: ${selectedFeature.name}`)}
                className="w-full mt-4 bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg py-2.5 text-[11px] font-medium transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>View full details</span> &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0f172a] border border-indigo-500/50 px-3.5 py-2.5 rounded-xl shadow-2xl text-[11px] text-white"
        >
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}