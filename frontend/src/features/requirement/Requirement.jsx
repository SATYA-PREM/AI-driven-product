import React, { useState, useEffect, useMemo } from 'react';

export default function RequirementsPage({ onNavigate }) {
  // Theme state with localStorage persistence
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Synchronize dark class on documentElement
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

  // Active sub-tabs
  const [activeTab, setActiveTab] = useState('PRD Generation'); // 'PRD Generation' | 'PRD Library' | 'PRD History'
  const [docTab, setDocTab] = useState('Preview'); // 'Preview' | 'Document' | 'Key Details' | 'Comments (2)' | 'Change Log'

  // PRD List Filter & Search
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState('');

  // Form states for Generate PRD modal
  const [newPrdTitle, setNewPrdTitle] = useState('');
  const [newPrdFeature, setNewPrdFeature] = useState('Checkout Flow Optimization');
  const [newPrdGoals, setNewPrdGoals] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Review & Validation state
  const [selectedDecision, setSelectedDecision] = useState(null); // 'Approve' | 'Request Changes' | 'Reject' | 'Snooze'
  const [reviewComments, setReviewComments] = useState('');

  // Mock PRD Dataset
  const [prds, setPrds] = useState([
    {
      id: 'PRD-2025-0012',
      title: 'One-click Checkout',
      date: 'May 20, 2025',
      version: '1.0',
      status: 'Pending Validation',
      statusType: 'pending', // pending, validated, shared, draft
      statusBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40',
      overview:
        'This PRD outlines the implementation of a one-click checkout feature to simplify the purchase process for users and improve conversion rate.',
      problem:
        'Users abandon carts due to lengthy checkout process. We need to reduce friction and improve the checkout experience.',
      goals: [
        'Enable users to complete purchase with one click',
        'Improve conversion rate by 15%',
        'Reduce cart abandonment by 20%',
      ],
      scope: [
        'Support saved addresses and payment methods',
        'One-click purchase on web and mobile',
        'Order confirmation & tracking',
      ],
      userStories: [
        {
          id: 'US-01',
          story: 'As a user, I want to place an order with one click so that I can save time.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
        {
          id: 'US-02',
          story: 'As a shopper, I want to choose my default payment method beforehand.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0011',
      title: 'Multiple Payment Options',
      date: 'May 18, 2025',
      version: '1.0',
      status: 'Validated ✓',
      statusType: 'validated',
      statusBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      overview:
        'Integrate Google Pay, Apple Pay, Klarna, and regional UPI payment gateways to offer customers diverse payment options.',
      problem: 'High customer drop-off during checkout due to lack of preferred local payment gateways.',
      goals: ['Support Apple Pay and Google Pay', 'Add BNPL integration with Klarna', 'Reduce payment failures by 30%'],
      scope: ['Gateway routing algorithm', 'Unified checkout modal integration', 'Web & Mobile responsive UI'],
      userStories: [
        {
          id: 'US-03',
          story: 'As an international buyer, I want to use Apple Pay without typing my card details.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0010',
      title: 'Order Tracking in Real-time',
      date: 'May 15, 2025',
      version: '1.2',
      status: 'Validated ✓',
      statusType: 'validated',
      statusBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      overview:
        'Provide live shipment status updates, push notifications, and courier vehicle live map tracking for customers.',
      problem: 'Customer support tickets are 40% dominated by "Where is my order?" inquiries.',
      goals: ['Reduce WISMO support tickets by 50%', 'Send automated SMS and WhatsApp tracking triggers'],
      scope: ['FedEx / UPS / DHL webhook integration', 'Interactive order detail map widget'],
      userStories: [
        {
          id: 'US-04',
          story: 'As a customer, I want to see real-time updates of my delivery on a map.',
          priority: 'Medium',
          priorityColor: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0009',
      title: 'AI Product Recommendations',
      date: 'May 12, 2025',
      version: '1.0',
      status: 'Shared 👥',
      statusType: 'shared',
      statusBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      overview:
        'Personalized recommendation engine powered by vector embeddings analyzing shopping cart items and past searches.',
      problem: 'Low average order value (AOV) and limited cross-selling discovery on product detail pages.',
      goals: ['Increase average order value by 12%', 'Improve click-through rate on recommendation widgets by 25%'],
      scope: ['Real-time similarity ranking', 'Frequently bought together bundle builder'],
      userStories: [
        {
          id: 'US-05',
          story: 'As a buyer, I want to see complementary items recommended on checkout.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0008',
      title: 'Wishlist & Save for Later',
      date: 'May 10, 2025',
      version: '1.0',
      status: 'Shared 👥',
      statusType: 'shared',
      statusBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      overview: 'Allows users to bookmark favorites and move items from cart to save-for-later collection.',
      problem: 'Shoppers use cart as a temporary wishlist, causing artificial abandonment metrics.',
      goals: ['Segment cart intent accurately', 'Enable price-drop alerts on saved wishlist items'],
      scope: ['Wishlist management page', 'Saved for later tray beneath shopping cart table'],
      userStories: [
        {
          id: 'US-06',
          story: 'As a customer, I want to save an item to my wishlist for next week purchase.',
          priority: 'Medium',
          priorityColor: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0007',
      title: 'Return & Refund Automation',
      date: 'May 08, 2025',
      version: '0.9',
      status: 'Draft',
      statusType: 'draft',
      statusBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      overview: 'Self-service return label generation and automated refund processing upon carrier scan.',
      problem: 'Manual RMA generation takes up to 48 hours and frustrates high-value shoppers.',
      goals: ['Instant return QR codes', 'Automated refund crediting in under 2 hours'],
      scope: ['Return portal UI', 'Logistics return webhook handlers'],
      userStories: [
        {
          id: 'US-07',
          story: 'As a buyer, I want to initiate a return in 2 steps without calling support.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0006',
      title: 'User Authentication Upgrade',
      date: 'May 06, 2025',
      version: '0.8',
      status: 'Draft',
      statusType: 'draft',
      statusBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      overview: 'Passkeys and biometric login for iOS, Android, and web to eliminate password friction.',
      problem: '18% of feedback tickets mention password resets or OTP SMS delays.',
      goals: ['Support WebAuthn / Passkeys', 'Social OAuth login with Apple and Google'],
      scope: ['Biometric auth prompt', 'Session token renewal enhancements'],
      userStories: [
        {
          id: 'US-08',
          story: 'As a returning user, I want to log in using fingerprint or Face ID.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
      ],
    },
    {
      id: 'PRD-2025-0005',
      title: 'Guest Checkout',
      date: 'May 05, 2025',
      version: '1.0',
      status: 'Pending Validation',
      statusType: 'pending',
      statusBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
      overview: 'Permit users to complete transactions without creating an account upfront.',
      problem: 'Mandatory account creation creates abandonment for first-time shoppers.',
      goals: ['Lower first-time purchase abandonment by 22%', 'Offer optional post-purchase account creation'],
      scope: ['One-page guest checkout form', 'Claim order after checkout flow'],
      userStories: [
        {
          id: 'US-09',
          story: 'As a first-time visitor, I want to buy without registering a password.',
          priority: 'High',
          priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
        },
      ],
    },
  ]);

  // Selected active PRD in reader
  const [selectedPrdId, setSelectedPrdId] = useState('PRD-2025-0012');

  const activePrd = useMemo(() => {
    return prds.find((p) => p.id === selectedPrdId) || prds[0];
  }, [prds, selectedPrdId]);

  // Filtered PRD list
  const filteredPrds = useMemo(() => {
    return prds.filter((prd) => {
      const matchesSearch =
        prd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prd.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'All Status') return true;
      if (statusFilter === 'Pending Validation' && prd.status.includes('Pending')) return true;
      if (statusFilter === 'Validated' && prd.status.includes('Validated')) return true;
      if (statusFilter === 'Draft' && prd.status.includes('Draft')) return true;
      if (statusFilter === 'Shared' && prd.status.includes('Shared')) return true;
      return true;
    });
  }, [prds, searchQuery, statusFilter]);

  // History timeline events
  const [historyEvents, setHistoryEvents] = useState([
    {
      id: 1,
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-purple-500/20 text-brand-500',
      badgeText: 'PS',
      title: 'Validated by Priya Sharma',
      time: 'Version 1.0 • May 20, 2025 10:30 AM',
      detail: 'Approved and shared with team',
    },
    {
      id: 2,
      dotColor: 'bg-blue-500',
      badgeBg: 'bg-blue-500/20 text-blue-500',
      badgeText: '👥',
      title: 'Shared with Team',
      time: 'May 20, 2025 10:35 AM',
      detail: 'Shared with 8 members',
    },
    {
      id: 3,
      dotColor: 'bg-brand-500',
      badgeBg: 'bg-brand-500/20 text-brand-500',
      badgeText: '✨',
      title: 'Generated by AI',
      time: 'Version 1.0 • May 20, 2025 09:15 AM',
      detail: 'AI generated the PRD based on prioritized features',
    },
  ]);

  // Shared / Validated PRDs Table
  const validatedSharedPrds = [
    {
      name: 'Multiple Payment Options',
      version: '1.0',
      date: 'May 18, 2025',
      validator: 'Priya Sharma',
      validatorAvatar: 'PS',
      sharedWith: '8 Members',
      status: 'Shared',
      statusBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
    },
    {
      name: 'Order Tracking in Real-time',
      version: '1.2',
      date: 'May 15, 2025',
      validator: 'Priya Sharma',
      validatorAvatar: 'PS',
      sharedWith: '12 Members',
      status: 'Shared',
      statusBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
    },
    {
      name: 'AI Product Recommendations',
      version: '1.0',
      date: 'May 12, 2025',
      validator: 'Priya Sharma',
      validatorAvatar: 'PS',
      sharedWith: '6 Members',
      status: 'Shared',
      statusBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
    },
  ];

  // Handle Validation Action submission
  const handleSubmitDecision = () => {
    if (!selectedDecision) {
      alert('Please select a decision action (Approve, Request Changes, Reject, or Snooze) first.');
      return;
    }

    let updatedStatus = activePrd.status;
    let badgeClass = activePrd.statusBadge;

    if (selectedDecision === 'Approve') {
      updatedStatus = 'Validated ✓';
      badgeClass = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';
    } else if (selectedDecision === 'Request Changes') {
      updatedStatus = 'Changes Requested';
      badgeClass = 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300';
    } else if (selectedDecision === 'Reject') {
      updatedStatus = 'Rejected';
      badgeClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
    } else if (selectedDecision === 'Snooze') {
      updatedStatus = 'Snoozed';
      badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }

    setPrds((prev) =>
      prev.map((p) => (p.id === activePrd.id ? { ...p, status: updatedStatus, statusBadge: badgeClass } : p))
    );

    // Append to history
    const newEvent = {
      id: Date.now(),
      dotColor:
        selectedDecision === 'Approve'
          ? 'bg-emerald-500'
          : selectedDecision === 'Reject'
          ? 'bg-rose-500'
          : 'bg-amber-500',
      badgeBg: 'bg-purple-500/20 text-brand-500',
      badgeText: 'PS',
      title: `${selectedDecision} by Priya Sharma`,
      time: `Version ${activePrd.version} • Just now`,
      detail: reviewComments.trim() || `Decision submitted: ${selectedDecision}`,
    };
    setHistoryEvents((prev) => [newEvent, ...prev]);

    setShowNotificationToast(`Decision "${selectedDecision}" submitted for ${activePrd.title}!`);
    setTimeout(() => setShowNotificationToast(''), 4000);
    setReviewComments('');
    setSelectedDecision(null);
  };

  // Handle New PRD generation
  const handleGeneratePrd = (e) => {
    e.preventDefault();
    if (!newPrdTitle.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const generatedId = `PRD-2025-00${prds.length + 1}`;
      const newPrdObj = {
        id: generatedId,
        title: newPrdTitle,
        date: 'Today',
        version: '1.0',
        status: 'Pending Validation',
        statusType: 'pending',
        statusBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40',
        overview: `Auto-generated PRD for feature: ${newPrdFeature}. Focused on conversion optimization and technical feasibility.`,
        problem: `Customer feedback indicates urgent requirement for ${newPrdTitle.toLowerCase()}.`,
        goals: newPrdGoals
          ? newPrdGoals.split('\n').filter(Boolean)
          : ['Deliver MVP within 3 sprint cycles', 'Improve customer NPS score by +12 points'],
        scope: ['Responsive client interface', 'Backend REST APIs & secure payment hooks', 'Telemetry telemetry tracking'],
        userStories: [
          {
            id: 'US-NEW',
            story: `As a consumer, I want ${newPrdTitle.toLowerCase()} so that I experience minimal friction.`,
            priority: 'High',
            priorityColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
          },
        ],
      };

      setPrds([newPrdObj, ...prds]);
      setSelectedPrdId(generatedId);
      setIsGenerating(false);
      setShowGenerateModal(false);
      setNewPrdTitle('');
      setNewPrdGoals('');
      setShowNotificationToast(`✨ AI has successfully generated ${newPrdTitle}!`);
      setTimeout(() => setShowNotificationToast(''), 4000);
    }, 1200);
  };

  return (
    <div
      className={`min-h-screen flex antialiased font-sans transition-colors duration-200 ${
        isDark ? 'dark bg-[#0c0f17] text-slate-200' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Toast Notification */}
      {showNotificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-brand-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{showNotificationToast}</span>
        </div>
      )}

      {/* ========================================================
          1. LEFT SIDEBAR
      ======================================================== */}
      <aside
        className="w-64 flex-shrink-0 bg-white dark:bg-[#121623] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex select-none z-20"
        data-purpose="sidebar-navigation"
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l8.5 4.9v9.8L12 21.5 3.5 16.7V6.9L12 2zm0 2.3L5.5 8.1v7.8L12 19.2l6.5-3.3V8.1L12 4.3zM12 8a4 4 0 110 8 4 4 0 010-8z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-slate-900 dark:text-white tracking-tight">ProdIntel AI</div>
              <div className="text-[11px] text-slate-400">Product Intelligence Platform</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            <button
              onClick={() => onNavigate && onNavigate('PM Dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>PM Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Insights')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Insights</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Feedback')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Feedback</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Features')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Features</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Prioritization')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Prioritization</span>
            </button>

            {/* Active Navigation Menu Item: Requirements (PRDs) */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-600 text-white font-semibold shadow-sm shadow-brand-500/30 text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Requirements (PRDs)</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Roadmap')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Roadmap</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Reports')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Reports</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('AI Assistant')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex items-center justify-between flex-1">
                AI Assistant
                <span className="bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  Pro
                </span>
              </span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('Workspaces')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Workspace Members</span>
            </button>

            <button
              onClick={() => alert('Settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Workspace and Usage */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div
            onClick={() => onNavigate && onNavigate('Workspaces')}
            className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Current Workspace
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">E-Commerce Platform</div>
                <div className="text-[11px] text-slate-500">12 Members</div>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="text-slate-600 dark:text-slate-400">Workspace Usage</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">78%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">7.8 GB / 10 GB</div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 pt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Collapse</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white dark:bg-[#121623] border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
          {/* Breadcrumb & Workspace Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Requirements</span>
              <svg className="w-3.5 h-3.5 mx-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">PRDs</span>
            </div>
            <div
              onClick={() => onNavigate && onNavigate('Workspaces')}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:border-slate-300"
            >
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Workspace:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">E-Commerce Platform</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Right Header Utilities & Consistent Dark/Light Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <button
              aria-label="Search"
              onClick={() => {
                const q = prompt('Search PRDs by keyword or ID:');
                if (q !== null) setSearchQuery(q);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                aria-label="Notifications"
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                8
              </span>
            </div>

            {/* Documentation Help */}
            <button
              aria-label="Help"
              onClick={() => alert('ProdIntel AI: Generates high-fidelity Product Requirement Documents based on user insights and technical constraints.')}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* CONSISTENT TOGGLE BUTTON (Sliding Pill with Sun & Moon Icons) */}
            <div className="border-l border-slate-200 dark:border-slate-800 pl-2">
              <button
                type="button"
                aria-label="Toggle Light and Dark Mode"
                onClick={() => setIsDark(!isDark)}
                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  isDark ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow flex items-center justify-center ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                >
                  {isDark ? (
                    <svg className="w-2.5 h-2.5 text-brand-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
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

            {/* Profile Monogram Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-brand-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-purple-400/30">
                PS
              </div>
              <div className="hidden xl:block leading-tight">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Priya Sharma</div>
                <div className="text-[10px] text-slate-400">Product Manager</div>
              </div>
            </div>

            {/* Primary Action Button: Generate PRD */}
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm shadow-brand-500/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Generate PRD</span>
            </button>
          </div>
        </header>

        {/* ========================================================
            WORKSPACE BODY
        ======================================================== */}
        <main className="p-6 space-y-6">
          {/* Page Heading & Tabs */}
          <div>
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Requirements (PRDs)</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate, review, validate and manage Product Requirement Documents. Once validated, PRDs are shared with your team.
              </p>
            </div>

            {/* Navigation Sub-tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium gap-6">
              {['PRD Generation', 'PRD Library', 'PRD History'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2.5 transition ${
                    activeTab === tab
                      ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-500 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 6 Metrics Summary Stats */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5" data-purpose="metrics-summary">
            {/* 1. Total PRDs */}
            <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total PRDs</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{prds.length}</div>
              </div>
            </div>

            {/* 2. Draft */}
            <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Draft</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {prds.filter((p) => p.statusType === 'draft').length || 2}
                </div>
              </div>
            </div>

            {/* 3. Pending Validation */}
            <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-950/50 text-yellow-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pending Validation</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {prds.filter((p) => p.statusType === 'pending').length}
                </div>
              </div>
            </div>

            {/* 4. Validated */}
            <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Validated</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {prds.filter((p) => p.statusType === 'validated').length}
                </div>
              </div>
            </div>

            {/* 5. Shared */}
            <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Shared</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {prds.filter((p) => p.statusType === 'shared').length || 5}
                </div>
              </div>
            </div>

            {/* 6. Avg. Validation Time */}
            <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg. Validation Time</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  2.4 <span className="text-xs font-normal text-slate-400">days</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
              3-COLUMN WORKSPACE:
              Col 1: Generated PRDs List (3 Cols)
              Col 2: Active PRD Reader (6 Cols)
              Col 3: Validation Panel & History (3 Cols)
          ======================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT SUB-COLUMN: Generated PRDs List (3 Cols) */}
            <div className="lg:col-span-3 bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Generated PRDs</h2>
                <p className="text-[11px] text-slate-400">AI generated PRDs waiting for your review and validation.</p>
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg py-1.5 px-2 focus:ring-1 focus:ring-brand-500"
                >
                  <option>All Status</option>
                  <option>Pending Validation</option>
                  <option>Validated</option>
                  <option>Shared</option>
                  <option>Draft</option>
                </select>

                <div className="relative flex-1">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-2 pr-7 py-1.5 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:ring-1 focus:ring-brand-500"
                    placeholder="Search PRDs..."
                    type="text"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* PRD Items List */}
              <div className="space-y-2 pt-1 text-xs max-h-[520px] overflow-y-auto pr-1">
                {filteredPrds.map((prd) => {
                  const isSelected = prd.id === activePrd.id;
                  return (
                    <div
                      key={prd.id}
                      onClick={() => setSelectedPrdId(prd.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-1 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <svg
                            className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                          <div className="truncate">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">{prd.title}</div>
                            <div className="text-[10px] text-slate-400">Generated on {prd.date}</div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Options for ${prd.title}`);
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5v.01M12 12v.01M12 19v.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${prd.statusBadge}`}>
                          {prd.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                <span>Showing 1 to {filteredPrds.length} of {prds.length} PRDs</span>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded bg-brand-600 text-white font-semibold flex items-center justify-center">
                    1
                  </button>
                  <button className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
                    2
                  </button>
                  <button className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* MIDDLE SUB-COLUMN: Active PRD Reader & Specs (6 Cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              {/* Document Header Meta & Actions */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{activePrd.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${activePrd.statusBadge}`}>
                      {activePrd.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>
                      PRD ID: <strong className="text-slate-600 dark:text-slate-300">{activePrd.id}</strong>
                    </span>
                    <span>•</span>
                    <span>Generated on: <strong>{activePrd.date}</strong></span>
                    <span>•</span>
                    <span>Version: <strong>{activePrd.version}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => alert(`Additional Options for ${activePrd.title}`)}
                    className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    ••• More
                  </button>
                </div>
              </div>

              {/* Document Sub-tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-medium gap-4">
                {['Preview', 'Document', 'Key Details', 'Comments (2)', 'Change Log'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDocTab(tab)}
                    className={`pb-2 transition ${
                      docTab === tab
                        ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-500 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Document Body Content */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {/* 1. Overview */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">1. Overview</h4>
                  <p className="text-slate-600 dark:text-slate-400">{activePrd.overview}</p>
                </div>

                {/* 2. Problem Statement */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">2. Problem Statement</h4>
                  <p className="text-slate-600 dark:text-slate-400">{activePrd.problem}</p>
                </div>

                {/* 3. Goals */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">3. Goals</h4>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                    {activePrd.goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Scope */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">4. Scope</h4>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                    {activePrd.scope.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. User Stories */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">5. User Stories</h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3">ID</th>
                          <th className="py-2 px-3">User Story</th>
                          <th className="py-2 px-3">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {activePrd.userStories.map((us) => (
                          <tr key={us.id}>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-600 dark:text-slate-400">{us.id}</td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{us.story}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${us.priorityColor}`}>
                                {us.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SUB-COLUMN: Validation Actions & PRD History (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Validation Panel */}
              <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Validation</h3>
                  <p className="text-[11px] text-slate-400">Review the PRD and take action.</p>
                </div>

                {/* 4 Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {/* Approve */}
                  <button
                    onClick={() => setSelectedDecision('Approve')}
                    className={`p-2.5 rounded-lg border transition-all flex flex-col items-center ${
                      selectedDecision === 'Approve'
                        ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/50 ring-2 ring-emerald-500/40'
                        : 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/70'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs">Approve</span>
                    <span className="text-[9px] text-slate-400 leading-tight">Approve & share with team</span>
                  </button>

                  {/* Request Changes */}
                  <button
                    onClick={() => setSelectedDecision('Request Changes')}
                    className={`p-2.5 rounded-lg border transition-all flex flex-col items-center ${
                      selectedDecision === 'Request Changes'
                        ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/50 ring-2 ring-amber-500/40'
                        : 'border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/70'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs">Request Changes</span>
                    <span className="text-[9px] text-slate-400 leading-tight">Request changes before approval</span>
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => setSelectedDecision('Reject')}
                    className={`p-2.5 rounded-lg border transition-all flex flex-col items-center ${
                      selectedDecision === 'Reject'
                        ? 'border-rose-500 bg-rose-100 dark:bg-rose-950/50 ring-2 ring-rose-500/40'
                        : 'border-rose-300 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-semibold text-rose-700 dark:text-rose-400 text-xs">Reject</span>
                    <span className="text-[9px] text-slate-400 leading-tight">Reject this PRD</span>
                  </button>

                  {/* Snooze */}
                  <button
                    onClick={() => setSelectedDecision('Snooze')}
                    className={`p-2.5 rounded-lg border transition-all flex flex-col items-center ${
                      selectedDecision === 'Snooze'
                        ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-950/50 ring-2 ring-indigo-500/40'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Snooze</span>
                    <span className="text-[9px] text-slate-400 leading-tight">Review later</span>
                  </button>
                </div>

                {/* Review Comments Input */}
                <div className="pt-1 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Add Review Comments (Optional)
                  </label>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    maxLength={1000}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Add your comments or feedback..."
                    rows="3"
                  ></textarea>
                  <div className="text-right text-[10px] text-slate-400">{reviewComments.length}/1000</div>
                </div>

                {/* Submit Decision Button */}
                <button
                  onClick={handleSubmitDecision}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm shadow-brand-500/20"
                >
                  Submit Decision
                </button>
              </div>

              {/* PRD History Timeline Card */}
              <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">PRD History</h3>
                  <button onClick={() => setActiveTab('PRD History')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                    View all
                  </button>
                </div>

                <div className="space-y-3 text-xs border-l-2 border-slate-100 dark:border-slate-800 pl-3 ml-2">
                  {historyEvents.map((evt) => (
                    <div key={evt.id} className="relative">
                      <span className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full ${evt.dotColor} ring-4 ring-white dark:ring-[#121623]`}></span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <div className={`w-4 h-4 rounded-full ${evt.badgeBg} flex items-center justify-center text-[9px] font-bold`}>
                          {evt.badgeText}
                        </div>
                        <span>{evt.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{evt.time}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{evt.detail}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('PRD History')}
                  className="w-full py-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  View Full History
                </button>
              </div>
            </div>
          </section>

          {/* ========================================================
              4. VALIDATED PRDS (SHARED WITH TEAM) TABLE SECTION
          ======================================================== */}
          <section
            className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
            data-purpose="shared-prds-table"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Validated PRDs (Shared with Team)</h3>
                <p className="text-xs text-slate-400">These PRDs are validated and shared with your team.</p>
              </div>
              <button
                onClick={() => setStatusFilter('Shared')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
              >
                <span>View All PRDs</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">PRD Name</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Validated On</th>
                    <th className="py-3 px-4">Validated By</th>
                    <th className="py-3 px-4">Shared With</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                  {validatedSharedPrds.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">{row.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{row.version}</td>
                      <td className="py-3.5 px-4 text-slate-500">{row.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] ring-1 ring-purple-400/40">
                            {row.validatorAvatar}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{row.validator}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{row.sharedWith}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${row.statusBadge}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            onClick={() => {
                              const match = prds.find((p) => p.title === row.name);
                              if (match) setSelectedPrdId(match.id);
                            }}
                            className="hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowExportModal(true)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            onClick={() => alert(`Options for: ${row.name}`)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            title="More"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 5v.01M12 12v.01M12 19v.01" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ========================================================
          MODALS
      ======================================================== */}
      {/* Generate PRD Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  ✨
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Generate New PRD</h3>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePrd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">PRD Title / Feature Name</label>
                <input
                  type="text"
                  required
                  value={newPrdTitle}
                  onChange={(e) => setNewPrdTitle(e.target.value)}
                  placeholder="e.g. Instant Apple Pay Express Checkout"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c0f17] text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Module / Priority Focus</label>
                <select
                  value={newPrdFeature}
                  onChange={(e) => setNewPrdFeature(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c0f17] text-slate-800 dark:text-slate-200"
                >
                  <option>Checkout Flow Optimization</option>
                  <option>Search Relevance & Discovery</option>
                  <option>Cart Abandonment Recovery</option>
                  <option>AI Recommendations</option>
                  <option>Delivery Tracking</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Success Goals (One per line)</label>
                <textarea
                  rows="3"
                  value={newPrdGoals}
                  onChange={(e) => setNewPrdGoals(e.target.value)}
                  placeholder="e.g. Reduce friction by 25%&#10;Increase order completion rate&#10;Support web and iOS apps"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c0f17] text-slate-800 dark:text-slate-200"
                ></textarea>
              </div>

              <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 rounded-lg text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                🤖 <strong>AI Agent Assist:</strong> Gemini will analyze your customer feedback clusters, generate the problem statement, scope, and testable user stories automatically.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm shadow-brand-500/20 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <span>Generate PRD</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121623] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export PRD</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export <strong>{activePrd.title}</strong> to your product management tool or document format:
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  alert(`Exported ${activePrd.title} to PDF!`);
                  setShowExportModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Export as PDF</span>
                </div>
                <span className="text-[10px] text-slate-400">.pdf</span>
              </button>

              <button
                onClick={() => {
                  alert(`Exported ${activePrd.title} to Markdown!`);
                  setShowExportModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Export as Markdown</span>
                </div>
                <span className="text-[10px] text-slate-400">.md</span>
              </button>

              <button
                onClick={() => {
                  alert(`Synced ${activePrd.title} directly to Jira Software!`);
                  setShowExportModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <span>🔷</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Export to Jira / Linear</span>
                </div>
                <span className="text-[10px] text-slate-400">API Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}