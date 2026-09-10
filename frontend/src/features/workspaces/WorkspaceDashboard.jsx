import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, LayoutGrid, Star, Frown, Plus,
  ChevronDown, Send, Truck, CreditCard, Moon, Heart,
  FileText, Download, Eye, Calendar, Clock,
  Search, Bell, HelpCircle, ArrowRight, MousePointer,
  RotateCcw, Sparkles, UserCheck, Settings, LogOut,
  SquarePlus
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import {
  getWorkspaceById, getCurrentUser, getStoredWorkspaces, logoutUser, setCurrentUser
} from '../../utils/workspaceAccess';
import {
  dashboardTrends, sentimentStats, topPainPoints,
  topFeatureRequests, upcomingMilestones, recentDocuments,
  workspaceActivityFeed
} from '../../mock/workspaces';

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const workspaces = getStoredWorkspaces();
  const activeWorkspace = getWorkspaceById(workspaceId);

  const [period, setPeriod] = useState('Last 6 Months');
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hi Priya! 👋\nHow can I help you with your product insights today?'
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // 5 Suggested prompt questions matching the image
  const suggestedQuestions = [
    "What are the top customer pain points?",
    'Why is feature "Real-time Order Tracking" P1?',
    "Show me the most requested features",
    "What are the biggest risks for this quarter?",
    "Generate PRD for the top priority feature"
  ];

  const handleSendQuestion = (questionText) => {
    const q = questionText || chatInput;
    if (!q.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setChatInput('');
    setIsAiResponding(true);

    setTimeout(() => {
      let answer = "Based on the 12,842 feedback items analyzed across all channels, Checkout friction and Order Tracking represent 68% of negative customer sentiment.";
      if (q.includes('pain points')) {
        answer = "Top customer pain points: 1) Slow Checkout Process (1,842 mentions, High), 2) Payment Failures (1,231 mentions, High), and 3) Delayed Order Tracking (978 mentions, Medium).";
      } else if (q.includes('Real-time Order Tracking') || q.includes('P1')) {
        answer = "Real-time Order Tracking is P1 with 892 upvotes and is associated with 978 delivery delay complaints. Implementing it is projected to cut support volume by 22%.";
      } else if (q.includes('requested features')) {
        answer = "Top 3 feature requests: 1) Real-time Order Tracking (892 votes), 2) Multiple Payment Options (756 votes), and 3) Dark Mode (624 votes).";
      } else if (q.includes('risks')) {
        answer = "Primary quarter risk: 41% of recent customer sentiment is negative, driven by payment gateway drops during peak transactions.";
      } else if (q.includes('PRD')) {
        answer = "PRD generated! Drafted PRD for 'Real-time Order Tracking' with user stories, acceptance criteria, and telemetry hooks.";
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
      setIsAiResponding(false);
    }, 600);
  };

  const handleSwitchWorkspace = (newId) => {
    setShowWsMenu(false);
    navigate(`/workspace/${newId}/overview`);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleSwitchToPM = () => {
    setCurrentUser({
      name: 'Priya Sharma',
      email: 'pm@demo.com',
      role: 'PRODUCT_MANAGER',
      roleTitle: 'Product Manager',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    });
    setShowUserMenu(false);
    window.location.reload();
  };

  const donutData = [
    { name: 'Positive', value: sentimentStats.positive.percentage, color: '#10b981' },
    { name: 'Neutral', value: sentimentStats.neutral.percentage, color: '#f59e0b' },
    { name: 'Negative', value: sentimentStats.negative.percentage, color: '#f43f5e' },
  ];

  // Custom dot for the last data point on the line chart (Aug)
  const renderCustomDot = (props) => {
    const { cx, cy, index } = props;
    if (index === dashboardTrends.length - 1) {
      return (
        <g key="active-dot">
          <circle cx={cx} cy={cy} r={7} fill="#8b5cf6" fillOpacity={0.4} />
          <circle cx={cx} cy={cy} r={4.5} fill="#a855f7" stroke="#ffffff" strokeWidth={2} />
        </g>
      );
    }
    return null;
  };

  return (
    <div className="w-full font-sans text-slate-100 space-y-4 pb-8 select-none">
      
      {/* 1. Header Row (Welcome back + Workspace Selector + Header Utilities) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight flex items-center gap-2">
            Welcome back, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Here's what's happening with your product today.
          </p>
        </div>

        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Workspace dropdown selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWsMenu(!showWsMenu)}
              className="flex flex-col text-left px-3.5 py-1.5 rounded-xl bg-[#0e1322] border border-[#1b2338] hover:border-[#5b3df5]/50 transition-all cursor-pointer min-w-[170px]"
            >
              <span className="text-[10px] text-slate-400 font-medium leading-none">Workspace</span>
              <div className="flex items-center justify-between text-xs font-semibold text-white mt-1 gap-2">
                <span className="truncate">{activeWorkspace?.name || 'E-Commerce Platform'}</span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {showWsMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-[#121828] border border-[#202a42] shadow-2xl p-1.5 z-40 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">
                  Select Workspace
                </span>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                      ws.id === workspaceId 
                        ? 'bg-[#5b3df5] text-white font-bold' 
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === workspaceId && <span className="text-[10px] font-mono">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Icon */}
          <button 
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Search"
          >
            <Search size={16} />
          </button>

          {/* Notifications Icon with Badge 3 */}
          <button 
            type="button"
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute 1 top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Help Icon */}
          <button 
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Help"
          >
            <HelpCircle size={16} />
          </button>

          {/* User Profile */}
          <div className="relative">
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-white/[0.04] transition-all"
            >
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" 
              />
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs font-bold text-white leading-tight truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate">Product Manager</p>
              </div>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#121828] border border-[#202a42] rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1.5 border-b border-white/[0.06] mb-1">
                  <p className="font-bold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>

                {currentUser.email !== 'pm@demo.com' && (
                  <button
                    type="button"
                    onClick={handleSwitchToPM}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck size={14} /> Switch to Priya Sharma (PM)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-slate-300 hover:bg-white/[0.05] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings size={14} /> Account Settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action button row: + New Upload button aligned to right */}
      <div className="flex justify-end -mt-1 -mb-1">
        <Link
          to={`/workspace/${workspaceId}/data/upload`}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>New Upload</span>
        </Link>
      </div>

      {/* 2. Top KPI Cards (5 Cards matching Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Feedback */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Total Feedback</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">12,842</p>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 mt-1.5 leading-none">
              ↑ 18.6% vs last month
            </span>
          </div>
        </div>

        {/* Identified Themes */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Identified Themes</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">24</p>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 mt-1.5 leading-none">
              ↑ 12.5% vs last month
            </span>
          </div>
        </div>

        {/* Feature Requests */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <SquarePlus className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Feature Requests</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">128</p>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 mt-1.5 leading-none">
              ↑ 22.4% vs last month
            </span>
          </div>
        </div>

        {/* High Priority Features */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">High Priority Features</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">7</p>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 mt-1.5 leading-none">
              ↑ 16.7% vs last month
            </span>
          </div>
        </div>

        {/* Customer Sentiment */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
            <Frown className="w-5 h-5 text-rose-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Customer Sentiment</span>
            <p className="text-[22px] font-bold text-rose-400 tracking-tight mt-1 leading-none">-0.23</p>
            <span className="text-[11px] font-medium text-rose-400 block mt-1.5 leading-none">
              Negative
            </span>
          </div>
        </div>

      </div>

      {/* 3. Middle Section: Charts & AI Assistant (matching Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Feedback Trend Curve ~34% width */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Feedback Trend</h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-300 px-2.5 py-1 rounded-lg bg-[#121828] border border-[#1e273f]">
              <span>{period}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardTrends} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  ticks={[0, 1000, 2000, 3000]}
                  domain={[0, 3200]}
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => (v === 0 ? '0' : `${v / 1000}K`)} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121828', borderColor: '#232d44', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                  formatter={(val) => [`${val}`, 'Feedback']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#purpleGradient)" 
                  dot={renderCustomDot}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution Donut Chart ~32% width */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-2">Sentiment Distribution</h3>

          <div className="flex items-center justify-center gap-6 my-auto">
            {/* Clean Donut with dark cutout matching original image */}
            <div className="w-32 h-32 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121828', borderColor: '#232d44', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                    formatter={(val) => [`${val}%`, 'Sentiment']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend matching original image */}
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                  <span className="text-slate-200 font-medium">Positive</span>
                </div>
                <p className="text-xs text-slate-400 ml-4 font-normal mt-0.5">4,521 (35%)</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
                  <span className="text-slate-200 font-medium">Neutral</span>
                </div>
                <p className="text-xs text-slate-400 ml-4 font-normal mt-0.5">3,102 (24%)</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
                  <span className="text-slate-200 font-medium">Negative</span>
                </div>
                <p className="text-xs text-slate-400 ml-4 font-normal mt-0.5">5,219 (41%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Interactive Card ~34% width */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">AI Assistant</h3>
              <button 
                type="button"
                onClick={() => setChatMessages([{ sender: 'ai', text: 'Hi Priya! 👋\nHow can I help you with your product insights today?' }])}
                className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold cursor-pointer"
              >
                New Chat
              </button>
            </div>

            {/* AI Greeting Message Bubble matching Image */}
            <div className="space-y-2 mb-3 max-h-28 overflow-y-auto pr-1">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  {msg.sender === 'ai' ? (
                    <>
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={14} className="text-white" />
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#141b2c] border border-[#1e273f] text-xs text-slate-200 leading-relaxed max-w-[90%] whitespace-pre-line">
                        {msg.text}
                      </div>
                    </>
                  ) : (
                    <div className="ml-auto p-2.5 rounded-2xl bg-[#5b3df5]/20 border border-[#5b3df5]/30 text-xs text-[#c4b5fd] max-w-[85%]">
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {isAiResponding && (
                <div className="text-[11px] text-slate-400 font-mono animate-pulse pl-9">
                  AI Assistant is analyzing...
                </div>
              )}
            </div>

            {/* Suggested Questions matching all 5 from original image */}
            <div className="space-y-1.5 mb-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Suggested Questions
              </span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuestion(q)}
                  className="w-full text-left text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-[#121727] hover:bg-[#161d31] border border-[#1c253b] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{q}</span>
                  <ArrowRight size={13} className="text-[#8b5cf6] shrink-0 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendQuestion(chatInput); }}
            className="relative mt-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about your product..."
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#121727] border border-[#1f283e] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-[#5b3df5] hover:bg-[#4f2ee8] text-white flex items-center justify-center transition-colors shadow cursor-pointer"
            >
              <Send size={11} className="-rotate-12 translate-x-0.5" />
            </button>
          </form>
        </div>

      </div>

      {/* 4. Lower-Middle: Top Pain Points + Top Feature Requests (matching Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Top Pain Points */}
        <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Top Pain Points</h3>
            <Link to={`/workspace/${workspaceId}/intelligence/issues`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {topPainPoints.map((item) => {
              const iconMap = {
                clock: Clock,
                card: CreditCard,
                truck: Truck,
                search: Search,
                return: RotateCcw,
              };
              const IconComp = iconMap[item.type] || Clock;
              const isHigh = item.severity === 'High';

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#121727] border border-[#1c253b] flex items-center justify-between gap-3 hover:bg-[#151c2f] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isHigh ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      <IconComp size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <span className="text-[11px] text-slate-400">{item.count}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md border shrink-0 ${
                    isHigh 
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {item.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Feature Requests */}
        <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Top Feature Requests</h3>
            <Link to={`/workspace/${workspaceId}/development/phases`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {topFeatureRequests.map((item) => {
              const iconMap = {
                truck: Truck,
                card: CreditCard,
                moon: Moon,
                click: MousePointer,
                heart: Heart,
              };
              const IconComp = iconMap[item.type] || Truck;

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#121727] border border-[#1c253b] flex items-center justify-between gap-3 hover:bg-[#151c2f] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <IconComp size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <span className="text-[11px] text-slate-400">{item.votes} votes</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                    ↑ {item.votes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Bottom Row: Recently Generated Documents + Milestones & Activity (matching Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Recently Generated Documents (~62% width) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Recently Generated Documents</h3>
            <Link to={`/workspace/${workspaceId}/reports`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1b2338] text-[11px] text-slate-400 font-semibold">
                  <th className="pb-2.5 font-semibold">Document</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 font-semibold">Feature</th>
                  <th className="pb-2.5 font-semibold">Generated On</th>
                  <th className="pb-2.5 font-semibold">By</th>
                  <th className="pb-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e30]">
                {recentDocuments.map((doc) => {
                  const iconColors = {
                    emerald: 'text-emerald-400',
                    amber: 'text-amber-400',
                    orange: 'text-amber-400',
                    blue: 'text-blue-400',
                  };
                  const colorClass = iconColors[doc.iconColor] || 'text-emerald-400';

                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-3 text-slate-200 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className={`${colorClass} shrink-0`} />
                          <span className="truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        {doc.type}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400 truncate max-w-[140px]">{doc.feature}</td>
                      <td className="py-2.5 pr-3 text-slate-400 font-mono text-[11px]">{doc.generatedOn}</td>
                      <td className="py-2.5 pr-3 text-[#a78bfa] font-medium">{doc.by}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button className="p-1 text-[#8b5cf6] hover:text-[#a78bfa] transition-colors cursor-pointer" title="Preview">
                            <Eye size={15} />
                          </button>
                          <button className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer" title="Download">
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Stack: Upcoming Milestones + Workspace Activity (~38% width) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Upcoming Milestones */}
          <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Upcoming Milestones</h3>
              <Link to={`/workspace/${workspaceId}/development/tasks`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingMilestones.map((m, idx) => {
                const iconColorMap = {
                  orange: 'text-amber-400',
                  purple: 'text-purple-400',
                  blue: 'text-blue-400',
                };
                const iconColor = iconColorMap[m.iconColor] || 'text-purple-400';

                const statusStyles = {
                  progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                  upcoming: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                  planned: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                };
                const statusStyle = statusStyles[m.statusType] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';

                return (
                  <div 
                    key={idx} 
                    className="p-2.5 rounded-xl bg-[#121727] border border-[#1c253b] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar size={15} className={`${iconColor} shrink-0`} />
                      <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusStyle}`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace Activity */}
          <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Workspace Activity</h3>
              <Link to="/workspaces" className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {workspaceActivityFeed.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isAi ? (
                      <div className="w-6 h-6 rounded-full bg-[#5b3df5]/25 text-[#a78bfa] flex items-center justify-center shrink-0">
                        <Sparkles size={12} />
                      </div>
                    ) : (
                      <img 
                        src={item.avatar} 
                        alt={item.user} 
                        className="w-6 h-6 rounded-full object-cover shrink-0" 
                      />
                    )}
                    <p className="text-slate-300 truncate">
                      <span className="font-bold text-white">{item.user}</span> {item.action}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}