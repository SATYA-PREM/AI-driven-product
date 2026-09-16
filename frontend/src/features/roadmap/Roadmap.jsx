import React, { useState, useEffect, useMemo } from 'react';

export default function RoadmapPage({ onNavigate }) {
  // Theme state: light or dark with localStorage persistence
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Active view tab state: 'Roadmap View', 'Timeline', 'Kanban', 'Dependencies'
  const [activeTab, setActiveTab] = useState('Roadmap View');

  // Filter & Sort state
  const [selectedPhase, setSelectedPhase] = useState('All Phases');
  const [sortBy, setSortBy] = useState('Sort by: Priority');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterImpact, setFilterImpact] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Collapsed phases state
  const [collapsedPhases, setCollapsedPhases] = useState({});

  const togglePhase = (phaseId) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  // Sync dark mode class on root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Metrics summary
  const metrics = [
    { label: 'Total Items', value: '28', type: 'plain' },
    { label: 'High Priority', value: '12', type: 'dot', dotColor: 'bg-rose-500' },
    { label: 'In Progress', value: '5', type: 'dot', dotColor: 'bg-indigo-500' },
    { label: 'Planned', value: '7', type: 'dot', dotColor: 'bg-cyan-500' },
    { label: 'Completed', value: '4', type: 'dot', dotColor: 'bg-emerald-500' },
    {
      label: 'Est. Completion',
      value: '6 - 8 Weeks',
      type: 'icon',
      icon: (
        <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  // Roadmap Phases and Items Data
  const [phasesData] = useState([
    {
      id: 1,
      phaseNum: '1',
      title: 'Critical Fixes & Feedback Resolution',
      hasAlert: true,
      subtitle: 'Address high-priority feedback and bugs',
      priorityBadge: 'P0 - Critical',
      priorityBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900/60',
      targetDuration: '1 - 2 Weeks',
      items: [
        {
          id: '1-1',
          title: 'Checkout Payment Failure',
          feedbackCount: '32 feedbacks',
          priority: 'P0',
          priorityBadgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'M',
          effortClass: 'text-amber-500',
          status: 'In Progress',
          statusBadgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
          target: '3 Days',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '1-2',
          title: 'Login / OTP Issues',
          feedbackCount: '18 feedbacks',
          priority: 'P0',
          priorityBadgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'S',
          effortClass: 'text-emerald-500',
          status: 'In Progress',
          statusBadgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
          target: '2 Days',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '1-3',
          title: 'Cart Price Mismatch',
          feedbackCount: '15 feedbacks',
          priority: 'P0',
          priorityBadgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'M',
          effortClass: 'text-amber-500',
          status: 'Todo',
          statusBadgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700',
          target: '4 Days',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '1-4',
          title: 'Page Load Performance',
          feedbackCount: '12 feedbacks',
          priority: 'P1',
          priorityBadgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'M',
          effortClass: 'text-amber-500',
          status: 'Todo',
          statusBadgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700',
          target: '5 Days',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 2,
      phaseNum: '2',
      title: 'Feature Improvements (High Impact)',
      hasAlert: false,
      subtitle: 'Improve experience and address important feedback',
      priorityBadge: 'P1 - High',
      priorityBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-900/60',
      targetDuration: '3 - 4 Weeks',
      items: [
        {
          id: '2-1',
          title: 'Add Multiple Payment Options',
          feedbackCount: '27 feedbacks',
          priority: 'P1',
          priorityBadgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'L',
          effortClass: 'text-rose-500',
          status: 'In Progress',
          statusBadgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
          target: '1 Week',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '2-2',
          title: 'Search Relevance Improvement',
          feedbackCount: '21 feedbacks',
          priority: 'P1',
          priorityBadgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'M',
          effortClass: 'text-amber-500',
          status: 'Todo',
          statusBadgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700',
          target: '1 Week',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '2-3',
          title: 'Order Tracking Enhancements',
          feedbackCount: '16 feedbacks',
          priority: 'P1',
          priorityBadgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
          impact: 'Medium',
          impactClass: 'text-amber-500',
          effort: 'M',
          effortClass: 'text-amber-500',
          status: 'Todo',
          statusBadgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700',
          target: '5 Days',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 3,
      phaseNum: '3',
      title: 'New Features & Enhancements',
      hasAlert: false,
      subtitle: 'Planned features and enhancements',
      priorityBadge: 'P2 - Medium',
      priorityBadgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-900/60',
      targetDuration: '5 - 8 Weeks',
      items: [
        {
          id: '3-1',
          title: 'AI Product Recommendations',
          feedbackCount: '30 feedbacks',
          priority: 'P2',
          priorityBadgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900',
          impact: 'High',
          impactClass: 'text-emerald-600 dark:text-emerald-400',
          effort: 'L',
          effortClass: 'text-rose-500',
          status: 'Planned',
          statusBadgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
          target: '2 Weeks',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '3-2',
          title: 'Wishlist & Save for Later',
          feedbackCount: '14 feedbacks',
          priority: 'P2',
          priorityBadgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900',
          impact: 'Medium',
          impactClass: 'text-amber-500',
          effort: 'S',
          effortClass: 'text-emerald-500',
          status: 'Planned',
          statusBadgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
          target: '1 Week',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          id: '3-3',
          title: 'Guest Checkout',
          feedbackCount: '11 feedbacks',
          priority: 'P2',
          priorityBadgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900',
          impact: 'Medium',
          impactClass: 'text-amber-500',
          effort: 'S',
          effortClass: 'text-emerald-500',
          status: 'Planned',
          statusBadgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
          target: '5 Days',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 4,
      phaseNum: '4',
      title: 'Future Enhancements',
      hasAlert: false,
      subtitle: 'Low priority and long term ideas',
      priorityBadge: 'P3 - Low',
      priorityBadgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-900/60',
      targetDuration: '8+ Weeks',
      items: [
        {
          id: '4-1',
          title: 'Dark Mode',
          feedbackCount: '8 feedbacks',
          priority: 'P3',
          priorityBadgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
          impact: 'Low',
          impactClass: 'text-cyan-600 dark:text-cyan-400',
          effort: 'S',
          effortClass: 'text-emerald-500',
          status: 'Backlog',
          statusBadgeClass: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700',
          target: 'TBD',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ],
    },
  ]);

  // Filter and sort items dynamically
  const filteredPhases = useMemo(() => {
    return phasesData
      .map((phase) => {
        // Phase level filter
        if (selectedPhase !== 'All Phases') {
          if (
            (selectedPhase.includes('Phase 1') && phase.id !== 1) ||
            (selectedPhase.includes('Phase 2') && phase.id !== 2) ||
            (selectedPhase.includes('Phase 3') && phase.id !== 3) ||
            (selectedPhase.includes('Phase 4') && phase.id !== 4)
          ) {
            return null;
          }
        }

        // Item level filter by search, impact, status
        const items = phase.items.filter((item) => {
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = item.title.toLowerCase().includes(q);
            const matchPriority = item.priority.toLowerCase().includes(q);
            if (!matchTitle && !matchPriority) return false;
          }
          if (filterImpact !== 'All' && item.impact !== filterImpact) return false;
          if (filterStatus !== 'All' && item.status !== filterStatus) return false;
          return true;
        });

        // Sorting
        const sortedItems = [...items].sort((a, b) => {
          if (sortBy.includes('Impact')) return a.impact.localeCompare(b.impact);
          if (sortBy.includes('Effort')) return a.effort.localeCompare(b.effort);
          if (sortBy.includes('Feedbacks')) {
            const numA = parseInt(a.feedbackCount) || 0;
            const numB = parseInt(b.feedbackCount) || 0;
            return numB - numA;
          }
          // Default priority
          return a.priority.localeCompare(b.priority);
        });

        return {
          ...phase,
          items: sortedItems,
        };
      })
      .filter(Boolean);
  }, [phasesData, selectedPhase, sortBy, searchQuery, filterImpact, filterStatus]);

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans text-xs antialiased transition-colors duration-200 ease-in-out ${isDark ? 'dark bg-[#070913] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {/* ========================================================
          1. LEFT SIDEBAR (Consistent with ProdIntel AI System)
      ======================================================== */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#0d111d] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between transition-colors duration-200 z-20 select-none">
        <div className="flex flex-col flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {/* Logo Header */}
          <div className="flex items-center space-x-2.5 px-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l8.5 4.9v9.8L12 21.5 3.5 16.7V6.9L12 2zm0 2.3L5.5 8.1v7.8L12 19.2l6.5-3.3V8.1L12 4.3zM12 8a4 4 0 110 8 4 4 0 010-8z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">ProdIntel AI</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Product Intelligence Platform</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-0.5 text-xs font-medium">
            <button
              onClick={() => onNavigate && onNavigate('PM Dashboard')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>PM Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Insights')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Insights</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Feedback')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Feedback</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Features')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Features</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Prioritization')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Prioritization</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Requirements')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Requirements (PRDs)</span>
            </button>

            {/* ACTIVE ITEM: Roadmap */}
            <button
              className="w-full flex items-center px-2.5 py-2 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-400 font-semibold transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Roadmap</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Reports')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Reports</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('AI Assistant')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Workspaces')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Workspace Members</span>
            </button>

            <button
              onClick={() => alert('Settings')}
              className="w-full flex items-center px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Settings</span>
            </button>
          </nav>

          {/* Current Workspace Card */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5 block">
              Current Workspace
            </label>
            <div
              onClick={() => onNavigate && onNavigate('Workspaces')}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition"
            >
              <div className="truncate pr-2">
                <span className="block font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">E-Commerce Platform</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">12 Members</span>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Workspace Usage Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>Workspace Usage</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">78%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">7.8 GB / 10 GB</div>
          </div>
        </div>

        {/* Bottom Profile Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b0e18]">
          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition cursor-pointer">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs ring-2 ring-indigo-400/20">
                PS
              </div>
              <div className="truncate">
                <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">Priya Sharma</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">Product Manager</span>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => alert('Sidebar toggle')}
            className="mt-2 w-full flex items-center justify-center space-x-1.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8m-4-4h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Collapse</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d] px-6 flex items-center justify-between select-none z-10 transition-colors">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer">Roadmap</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500 dark:text-slate-400">Intelligent Roadmap</span>
          </div>

          {/* Right: Controls & Consistent Sun/Moon Toggle Button */}
          <div className="flex items-center space-x-3.5">
            {/* Workspace Selector Dropdown */}
            <div
              onClick={() => onNavigate && onNavigate('Workspaces')}
              className="hidden md:flex items-center px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 space-x-2 cursor-pointer hover:border-slate-300"
            >
              <span className="text-[10px] text-slate-400">Workspace:</span>
              <span className="font-medium text-xs">E-Commerce Platform</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Search Icon */}
            <button
              onClick={() => {
                const term = prompt('Search roadmap items or tags:', searchQuery);
                if (term !== null) setSearchQuery(term);
              }}
              aria-label="Search"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                aria-label="Notifications"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-[#0d111d]">
                8
              </span>
            </div>

            {/* Help / Docs */}
            <button
              aria-label="Help"
              onClick={() => alert('Intelligent Roadmap: Prioritized with Gemini & CrewAI based on customer impact and effort.')}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* CONSISTENT TOGGLE BUTTON (Sliding Pill with Sun & Moon Icons) */}
            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <button
                type="button"
                aria-label="Toggle Light and Dark Mode"
                onClick={() => setIsDark(!isDark)}
                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  isDark ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow flex items-center justify-center ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                >
                  {isDark ? (
                    /* Moon Icon */
                    <svg className="w-2.5 h-2.5 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
                    /* Sun Icon */
                    <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </div>

            {/* Top Right Profile Monogram */}
            <div className="flex items-center space-x-2 pl-2 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs ring-1 ring-slate-300 dark:ring-slate-700">
                PS
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">Priya Sharma</span>
                <span className="block text-[10px] text-slate-400">Product Manager</span>
              </div>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </header>

        {/* Center Main Content & Right Analytics Sidebar Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Roadmap Area */}
          <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Header Title & Share Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Intelligent Roadmap</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                    Auto-Prioritized
                  </span>
                  <button
                    aria-label="Information tooltip"
                    onClick={() => alert('AI Auto-Prioritized: calculated dynamically via RICE score (Reach, Impact, Confidence, Effort).')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    type="button"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This roadmap is automatically generated based on priority, impact, effort, and feedback urgency. Focus on high-impact, quick wins first.
                </p>
              </div>

              {/* Share CTA */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-xs shadow-sm shadow-indigo-500/20 transition"
                  type="button"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Share Roadmap</span>
                </button>
              </div>
            </div>

            {/* View Tabs Strip */}
            <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-xs font-semibold">
              {['Roadmap View', 'Timeline', 'Kanban', 'Dependencies'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 6 Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-1 text-slate-700 dark:text-slate-300">
              {metrics.map((m, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-[#0d111d] border border-slate-200 dark:border-slate-800/80 rounded-lg shadow-sm">
                  {m.type === 'plain' && (
                    <>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{m.label}</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">{m.value}</span>
                    </>
                  )}
                  {m.type === 'dot' && (
                    <>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${m.dotColor}`}></span>
                        <span>{m.label}</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">{m.value}</span>
                    </>
                  )}
                  {m.type === 'icon' && (
                    <div className="flex items-center space-x-2.5">
                      {m.icon}
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{m.label}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{m.value}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Controls / Filter Strip */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center space-x-3">
                {/* Phases Dropdown */}
                <div className="relative">
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="bg-white dark:bg-[#0d111d] border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md py-1.5 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option>All Phases</option>
                    <option>Phase 1: Critical Fixes</option>
                    <option>Phase 2: Feature Improvements</option>
                    <option>Phase 3: New Features</option>
                    <option>Phase 4: Future Enhancements</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white dark:bg-[#0d111d] border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md py-1.5 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option>Sort by: Priority</option>
                    <option>Sort by: Impact</option>
                    <option>Sort by: Effort</option>
                    <option>Sort by: Feedbacks</option>
                  </select>
                </div>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#0d111d] border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 rounded-md font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                type="button"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Filters</span>
                {(filterImpact !== 'All' || filterStatus !== 'All') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                )}
              </button>
            </div>

            {/* ========================================================
                ROADMAP TABLE CONTAINER
            ======================================================== */}
            <div className="bg-white dark:bg-[#0d111d] border border-slate-200 dark:border-slate-800/80 rounded-lg shadow-sm overflow-hidden text-xs">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <div className="col-span-5">Phase / Issues</div>
                <div className="col-span-1 text-center">Priority</div>
                <div className="col-span-1 text-center">Impact</div>
                <div className="col-span-1 text-center">Effort</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Target</div>
                <div className="col-span-1 text-right pr-2">Actions</div>
              </div>

              {/* Loop over Phases */}
              {filteredPhases.map((phase) => {
                const isCollapsed = collapsedPhases[phase.id];
                return (
                  <div key={phase.id} className="border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                    {/* Phase Banner */}
                    <div className="grid grid-cols-12 px-4 py-2.5 bg-indigo-50/50 dark:bg-[#13192b] items-center border-b border-slate-100 dark:border-slate-800/50">
                      <div className="col-span-5 flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {phase.phaseNum}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-800 dark:text-white inline-flex items-center gap-1.5">
                            {phase.title}
                            {phase.hasAlert && (
                              <svg className="w-3.5 h-3.5 text-rose-500 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{phase.subtitle}</p>
                        </div>
                      </div>

                      <div className="col-span-1 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${phase.priorityBadgeClass}`}>
                          {phase.priorityBadge}
                        </span>
                      </div>

                      <div className="col-span-1"></div>
                      <div className="col-span-1"></div>
                      <div className="col-span-2"></div>

                      <div className="col-span-1 text-center font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                        {phase.targetDuration}
                      </div>

                      <div
                        onClick={() => togglePhase(phase.id)}
                        className="col-span-1 text-right pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <svg
                          className={`w-4 h-4 inline transform transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Phase Items List */}
                    {!isCollapsed &&
                      phase.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/40 last:border-b-0"
                        >
                          {/* Issue title and icon */}
                          <div className="col-span-5 flex items-center space-x-3 pl-2">
                            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-slate-800 text-indigo-500 flex-shrink-0">
                              {item.icon}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{item.title}</span>
                              <span className="text-[10px] text-slate-400">{item.feedbackCount}</span>
                            </div>
                          </div>

                          {/* Priority */}
                          <div className="col-span-1 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.priorityBadgeClass}`}>
                              {item.priority}
                            </span>
                          </div>

                          {/* Impact */}
                          <div className="col-span-1 text-center">
                            <span className={`font-semibold text-[11px] ${item.impactClass}`}>{item.impact}</span>
                          </div>

                          {/* Effort */}
                          <div className="col-span-1 text-center">
                            <span className={`font-semibold text-[11px] ${item.effortClass}`}>{item.effort}</span>
                          </div>

                          {/* Status */}
                          <div className="col-span-2 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${item.statusBadgeClass}`}>
                              {item.status}
                            </span>
                          </div>

                          {/* Target */}
                          <div className="col-span-1 text-center font-medium text-slate-600 dark:text-slate-300">
                            {item.target}
                          </div>

                          {/* Actions */}
                          <div
                            onClick={() => alert(`Options for: ${item.title}`)}
                            className="col-span-1 text-right pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 inline" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>

            {/* Bottom Status / Sync Footer Info */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center space-x-1.5">
                <span>Roadmap auto-generated on May 20, 2025 10:30 AM</span>
                <button
                  aria-label="Refresh Roadmap"
                  onClick={() => alert('Refreshing roadmap priorities with Gemini AI...')}
                  className="hover:text-slate-600 dark:hover:text-slate-300 transition"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <span>Last updated: 2 mins ago</span>
            </div>
          </main>

          {/* ========================================================
              3. RIGHT SIDEBAR (Analytics, Donut Chart, Flow, Legend)
          ======================================================== */}
          <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d] p-5 overflow-y-auto space-y-6 flex-shrink-0 select-none transition-colors">
            {/* Roadmap Summary (Donut Chart) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">Roadmap Summary</h3>
              <div className="flex items-center justify-between gap-4">
                {/* Visual Conic Donut Chart */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-full"
                    style={{
                      background: 'conic-gradient(#ef4444 0% 43%, #f97316 43% 72%, #3b82f6 72% 90%, #06b6d4 90% 100%)',
                    }}
                  ></div>
                  <div className="absolute w-16 h-16 bg-white dark:bg-[#0d111d] rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">28</span>
                    <span className="text-[9px] text-slate-400 font-medium">Total</span>
                  </div>
                </div>

                {/* Breakdown Labels List */}
                <div className="flex-1 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded bg-rose-500 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Critical (P0)</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">12 (43%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded bg-orange-500 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">High (P1)</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">8 (29%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded bg-blue-500 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Medium (P2)</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">5 (18%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded bg-cyan-500 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Low (P3)</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">3 (10%)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs font-semibold border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span>Total Items</span>
                <span className="text-slate-900 dark:text-white font-bold">28</span>
              </div>
            </div>

            {/* Roadmap Flow (Vertical Steps Process) */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">Roadmap Flow</h3>
              <div className="space-y-4 relative pl-2">
                {/* Step 1 */}
                <div className="flex items-start space-x-3 group">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Feedback Received</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Collect feedback from multiple sources</p>
                  </div>
                </div>

                <div className="pl-3 -my-2 text-slate-400 dark:text-slate-600">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-3 group">
                  <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Prioritization Engine</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Score based on impact, urgency, effort</p>
                  </div>
                </div>

                <div className="pl-3 -my-2 text-slate-400 dark:text-slate-600">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-3 group">
                  <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Roadmap Generated</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Auto-generate prioritized roadmap</p>
                  </div>
                </div>

                <div className="pl-3 -my-2 text-slate-400 dark:text-slate-600">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-3 group">
                  <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Execution & Tracking</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Track progress and update status</p>
                  </div>
                </div>

                <div className="pl-3 -my-2 text-slate-400 dark:text-slate-600">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Step 5 */}
                <div className="flex items-start space-x-3 group">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Feedback Loop</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Measure impact and iterate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend Section */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">Legend</h3>
              <div className="space-y-1.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Priority:</span>
                  <span className="ml-1">P0 (Critical) • P1 (High) • P2 (Medium) • P3 (Low)</span>
                </div>
                <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Impact:</span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>High</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 ml-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Medium</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 ml-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Low</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Effort:</span>
                  <span className="ml-1">
                    <strong className="text-emerald-500 font-medium">S</strong> (Small) •{' '}
                    <strong className="text-amber-500 font-medium">M</strong> (Medium) •{' '}
                    <strong className="text-rose-500 font-medium">L</strong> (Large)
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Status:</span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Todo</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>In Progress</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span>Planned</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Done</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span>Backlog</span>
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================
          MODALS
      ======================================================== */}
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121929] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Intelligent Roadmap</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate a shareable read-only link or export to Jira / Linear for cross-functional alignment.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value="https://prodintel.ai/share/roadmap/e-commerce-p0"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c1220] text-xs text-slate-700 dark:text-slate-300 select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('https://prodintel.ai/share/roadmap/e-commerce-p0');
                  alert('Copied to clipboard!');
                  setShowShareModal(false);
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121929] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filter Roadmap Items</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Impact Level</label>
                <select
                  value={filterImpact}
                  onChange={(e) => setFilterImpact(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c1220] text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Impacts</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c1220] text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Todo">Todo</option>
                  <option value="Planned">Planned</option>
                  <option value="Backlog">Backlog</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFilterImpact('All');
                  setFilterStatus('All');
                  setShowFilterModal(false);
                }}
                className="text-xs text-indigo-600 hover:underline"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}