export const defaultMembers = [
  {
    id: 'm1',
    name: 'Priya Sharma',
    email: 'pm@demo.com',
    role: 'Owner',
    roleTitle: 'Product Manager (Owner)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    initials: 'PS',
    isCurrentUser: true,
  },
  {
    id: 'm2',
    name: 'Arjun Mehta',
    email: 'analyst@demo.com',
    role: 'Admin',
    roleTitle: 'Product Analyst',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    initials: 'AM',
  },
  {
    id: 'm3',
    name: 'Neha Kapoor',
    email: 'designer@demo.com',
    role: 'Member',
    roleTitle: 'UX Designer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    initials: 'NK',
  },
  {
    id: 'm4',
    name: 'Rohit Singh',
    email: 'developer@demo.com',
    role: 'Member',
    roleTitle: 'Data Analyst',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    initials: 'RS',
  },
  {
    id: 'm5',
    name: 'Ananya Das',
    email: 'qa@demo.com',
    role: 'Member',
    roleTitle: 'QA Engineer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    initials: 'AD',
  }
];

export const availableTeamPool = [
  {
    name: 'Rahul Verma',
    email: 'rahul@demo.com',
    roleTitle: 'Backend Engineer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    initials: 'RV'
  },
  {
    name: 'Sneha Patel',
    email: 'sneha@demo.com',
    roleTitle: 'Product Marketer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    initials: 'SP'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@demo.com',
    roleTitle: 'Technical Lead',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    initials: 'MJ'
  },
  {
    name: 'Kavita Iyer',
    email: 'kavita@demo.com',
    roleTitle: 'AI Research Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    initials: 'KI'
  }
];

export const defaultDataSources = [
  { id: 'ds1', name: 'User Interviews', count: '1,245', icon: 'MessageSquare', color: 'text-blue-400 bg-blue-500/10' },
  { id: 'ds2', name: 'Surveys', count: '1,240', icon: 'FileText', color: 'text-purple-400 bg-purple-500/10' },
  { id: 'ds3', name: 'Support Tickets', count: '3,642', icon: 'Inbox', color: 'text-sky-400 bg-sky-500/10' },
  { id: 'ds4', name: 'Social Media', count: '1,098', icon: 'Share2', color: 'text-indigo-400 bg-indigo-500/10' },
  { id: 'ds5', name: 'App Store Reviews', count: '2,185', icon: 'Smartphone', color: 'text-emerald-400 bg-emerald-500/10' },
  { id: 'ds6', name: 'Email Feedback', count: '956', icon: 'Mail', color: 'text-cyan-400 bg-cyan-500/10' },
  { id: 'ds7', name: 'Play Store Reviews', count: '1,876', icon: 'Play', color: 'text-teal-400 bg-teal-500/10' },
  { id: 'ds8', name: 'Internal Notes', count: '600', icon: 'BookOpen', color: 'text-amber-400 bg-amber-500/10' },
];

export const defaultRecentActivity = [
  {
    id: 'a1',
    activity: 'Added 320 new feedback items',
    user: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    module: 'Feedback',
    moduleColor: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
    time: '2 hours ago',
    icon: 'MessageSquare'
  },
  {
    id: 'a2',
    activity: 'AI generated 15 new insights',
    user: 'AI Assistant',
    isAi: true,
    module: 'Insights',
    moduleColor: 'bg-blue-950/70 text-blue-300 border-blue-800/50',
    time: '3 hours ago',
    icon: 'Lightbulb'
  },
  {
    id: 'a3',
    activity: "Created feature 'One-click checkout'",
    user: 'Arjun Mehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    module: 'Features',
    moduleColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50',
    time: '5 hours ago',
    icon: 'Layers'
  },
  {
    id: 'a4',
    activity: 'Updated priority for 3 features',
    user: 'Neha Kapoor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    module: 'Prioritization',
    moduleColor: 'bg-amber-950/70 text-amber-300 border-amber-800/50',
    time: '1 day ago',
    icon: 'Star'
  },
  {
    id: 'a5',
    activity: 'Added 2 new requirements',
    user: 'Rohit Singh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    module: 'Requirements',
    moduleColor: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/50',
    time: '1 day ago',
    icon: 'FileCheck'
  },
  {
    id: 'a6',
    activity: 'Updated roadmap timeline',
    user: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    module: 'Roadmap',
    moduleColor: 'bg-orange-950/70 text-orange-300 border-orange-800/50',
    time: '2 days ago',
    icon: 'Map'
  },
  {
    id: 'a7',
    activity: 'Generated Feedback Summary Report',
    user: 'AI Assistant',
    isAi: true,
    module: 'Reports',
    moduleColor: 'bg-blue-950/70 text-blue-300 border-blue-800/50',
    time: '2 days ago',
    icon: 'FileText'
  },
];

export const mockWorkspaces = [
  {
    id: 'ecommerce-platform',
    name: 'E-Commerce Platform',
    status: 'Active',
    description: 'Central workspace for analyzing customer feedback, discovering insights, and building better e-commerce experiences.',
    ownerEmail: 'pm@demo.com',
    ownerName: 'Priya Sharma',
    createdAt: 'Aug 01, 2025',
    membersCount: 12,
    members: defaultMembers,
    stats: {
      totalFeedback: '12,842',
      feedbackGrowth: '+18.6%',
      totalFeatures: '56',
      featuresGrowth: '+12.0%',
      insightsGenerated: '128',
      insightsGrowth: '+15.7%',
      activeMembers: '12',
      membersGrowth: '+20.0%',
      dataSources: '8',
      dataSourcesGrowth: '2 new'
    },
    dataSources: defaultDataSources,
    recentActivity: defaultRecentActivity,
    storageUsage: {
      usedGb: '7.8',
      totalGb: '10',
      percentage: 78
    }
  },
  {
    id: 'fintech-app',
    name: 'Fintech Mobile Banking',
    status: 'Active',
    description: 'Autonomous financial telemetry and customer interaction analysis for retail banking apps.',
    ownerEmail: 'pm@demo.com',
    ownerName: 'Priya Sharma',
    createdAt: 'Sep 10, 2025',
    membersCount: 6,
    members: [
      defaultMembers[0], // Priya
      defaultMembers[1], // Arjun
      defaultMembers[3], // Rohit
    ],
    stats: {
      totalFeedback: '8,450',
      feedbackGrowth: '+14.2%',
      totalFeatures: '32',
      featuresGrowth: '+8.5%',
      insightsGenerated: '94',
      insightsGrowth: '+11.0%',
      activeMembers: '6',
      membersGrowth: '+10.0%',
      dataSources: '5',
      dataSourcesGrowth: '1 new'
    },
    dataSources: defaultDataSources.slice(0, 5),
    recentActivity: defaultRecentActivity.slice(0, 4),
    storageUsage: {
      usedGb: '4.2',
      totalGb: '10',
      percentage: 42
    }
  }
];

export const dashboardTrends = [
  { month: 'Mar', value: 1000 },
  { month: 'Apr', value: 1900 },
  { month: 'May', value: 1600 },
  { month: 'Jun', value: 2400 },
  { month: 'Jul', value: 2100 },
  { month: 'Aug', value: 3000 }
];

export const sentimentStats = {
  score: '-0.23',
  status: 'Negative',
  positive: { count: '4,521', percentage: 35 },
  neutral: { count: '3,102', percentage: 24 },
  negative: { count: '5,219', percentage: 41 }
};

export const topPainPoints = [
  { id: 'pp1', title: 'Slow Checkout Process', count: '1,842 mentions', severity: 'High', type: 'clock' },
  { id: 'pp2', title: 'Payment Failures', count: '1,231 mentions', severity: 'High', type: 'card' },
  { id: 'pp3', title: 'Delayed Order Tracking', count: '978 mentions', severity: 'Medium', type: 'truck' },
  { id: 'pp4', title: 'Poor Search Experience', count: '764 mentions', severity: 'Medium', type: 'search' },
  { id: 'pp5', title: 'Return / Refund Issues', count: '642 mentions', severity: 'Medium', type: 'return' },
];

export const topFeatureRequests = [
  { id: 'fr1', title: 'Real-time Order Tracking', votes: 892, type: 'truck' },
  { id: 'fr2', title: 'Multiple Payment Options', votes: 756, type: 'card' },
  { id: 'fr3', title: 'Dark Mode', votes: 624, type: 'moon' },
  { id: 'fr4', title: 'One-click Reorder', votes: 512, type: 'click' },
  { id: 'fr5', title: 'Wishlist & Save for Later', votes: 478, type: 'heart' },
];

export const upcomingMilestones = [
  { title: 'Q3 Roadmap Planning', date: 'Sep 15, 2025', status: 'In Progress', statusType: 'progress', iconColor: 'orange' },
  { title: 'PRD Review - Top 3 Features', date: 'Sep 20, 2025', status: 'Upcoming', statusType: 'upcoming', iconColor: 'purple' },
  { title: 'Stakeholder Review', date: 'Sep 28, 2025', status: 'Upcoming', statusType: 'upcoming', iconColor: 'purple' },
  { title: 'Q3 Release', date: 'Oct 15, 2025', status: 'Planned', statusType: 'planned', iconColor: 'blue' },
];

export const recentDocuments = [
  {
    id: 'doc1',
    name: 'PRD - Real-time Order Tracking',
    type: 'PRD',
    feature: 'Real-time Order Tracking',
    generatedOn: 'Aug 20, 2025',
    by: 'AI Assistant',
    iconColor: 'emerald'
  },
  {
    id: 'doc2',
    name: 'User Stories - Multiple Payment Options',
    type: 'User Stories',
    feature: 'Multiple Payment Options',
    generatedOn: 'Aug 19, 2025',
    by: 'AI Assistant',
    iconColor: 'amber'
  },
  {
    id: 'doc3',
    name: 'Acceptance Criteria - Dark Mode',
    type: 'Acceptance Criteria',
    feature: 'Dark Mode',
    generatedOn: 'Aug 18, 2025',
    by: 'AI Assistant',
    iconColor: 'orange'
  },
  {
    id: 'doc4',
    name: 'Risk Analysis - Q3',
    type: 'Risk Report',
    feature: 'Q3 Initiatives',
    generatedOn: 'Aug 18, 2025',
    by: 'AI Assistant',
    iconColor: 'blue'
  }
];

export const workspaceActivityFeed = [
  { id: 'waf1', user: 'Rahul', action: 'added new feedback data', time: '2 mins ago', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: 'waf2', user: 'AI Assistant', action: 'generated PRD for Real-time Order Tracking', time: '15 mins ago', isAi: true },
  { id: 'waf3', user: 'Sneha', action: 'updated feature priority', time: '1 hour ago', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: 'waf4', user: 'Mike', action: 'commented on PRD - Multiple Payment Options', time: '2 hours ago', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
];