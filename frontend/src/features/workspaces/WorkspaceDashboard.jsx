import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MessageSquare, Grid, PlusSquare, Star, Frown,
  ArrowUpRight, ChevronDown, Sparkles, Send,
  Truck, CreditCard, Moon, RotateCw, Heart,
  FileText, Download, Eye, Calendar, Clock,
  Search, Bell, HelpCircle, Plus, UploadCloud,
  CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import {
  getWorkspaceById, getCurrentUser, getStoredWorkspaces
} from '../../utils/workspaceAccess';
import {
  dashboardTrends, sentimentStats, topPainPoints,
  topFeatureRequests, upcomingMilestones, recentDocuments,
  workspaceActivityFeed
} from '../../mock/workspaces';

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspaces = getStoredWorkspaces();
  const activeWorkspace = getWorkspaceById(workspaceId);

  const [period, setPeriod] = useState('Last 6 Months');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hi Priya! 👋 How can I help you with your product insights today?'
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Suggested prompt questions matching Image 2
  const suggestedQuestions = [
    "What are the top customer pain points?",
    "Why is feature 'Real-time Order Tracking' P1?",
    "Show me the most requested features",
    "What are the biggest risks for this quarter?",
    "Generate PRD for the top priority feature"
  ];

  const handleSendQuestion = (questionText) => {
    const q = questionText || chatInput;
    if (!q.trim()) return;

    // Add user message
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setChatInput('');
    setIsAiResponding(true);

    // Dynamic simulated AI answer
    setTimeout(() => {
      let answer = "Based on the 12,842 feedback items analyzed across 8 channels, our semantic clustering identified that Checkout friction and Order Tracking represent 68% of negative sentiment.";
      if (q.includes('pain points')) {
        answer = "Top pain points: 1) Slow Checkout Process (1,842 mentions, High), 2) Payment Failures (1,231 mentions, High), and 3) Delayed Order Tracking (978 mentions, Medium).";
      } else if (q.includes('Real-time Order Tracking') || q.includes('P1')) {
        answer = "Real-time Order Tracking has 892 upvotes and is tied to 978 delivery complaints. Resolving it is projected to reduce support ticket volume by ~22%.";
      } else if (q.includes('requested features')) {
        answer = "Top 3 features: Real-time Order Tracking (892 votes), Multiple Payment Options (756 votes), and Dark Mode (624 votes).";
      } else if (q.includes('risks')) {
        answer = "Quarterly risk: 41% of recent customer sentiment is negative, primarily driven by payment gateway drops during peak hours.";
      } else if (q.includes('PRD')) {
        answer = "PRD generated! Drafted PRD-04 for Real-time Order Tracking with 4 user stories, acceptance criteria, and technical telemetry hooks.";
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
      setIsAiResponding(false);
    }, 600);
  };

  const donutData = [
    { name: 'Positive', value: sentimentStats.positive.percentage, color: '#10b981' },
    { name: 'Neutral', value: sentimentStats.neutral.percentage, color: '#f59e0b' },
    { name: 'Negative', value: sentimentStats.negative.percentage, color: '#f43f5e' },
  ];

  return (
    <div className="w-full min-h-full font-sans text-slate-100 space-y-6 pb-12">
      
      {/* 1. Header Row (Welcome back + Workspace Selector + Actions) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c253b] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Welcome back, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here's what's happening with your product today.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Workspace selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101524] border border-[#1d263b] text-xs">
            <span className="text-slate-500 font-medium">Workspace:</span>
            <span className="font-bold text-white truncate max-w-[160px]">{activeWorkspace?.name || 'E-Commerce Platform'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* Quick Upload button */}
          <Link
            to={`/workspace/${workspaceId}/data/upload`}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Upload
          </Link>
        </div>
      </div>

      {/* 2. Top KPI Cards (5 Cards matching Image 2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Feedback */}
        <div className="p-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 18.6%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Total Feedback</span>
          <p className="text-2xl font-bold text-white tracking-tight mt-0.5">12,842</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">vs last month</span>
        </div>

        {/* Identified Themes */}
        <div className="p-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Grid className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12.5%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Identified Themes</span>
          <p className="text-2xl font-bold text-white tracking-tight mt-0.5">24</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">vs last month</span>
        </div>

        {/* Feature Requests */}
        <div className="p-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <PlusSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 22.4%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Feature Requests</span>
          <p className="text-2xl font-bold text-white tracking-tight mt-0.5">128</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">vs last month</span>
        </div>

        {/* High Priority Features */}
        <div className="p-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 16.7%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">High Priority Features</span>
          <p className="text-2xl font-bold text-white tracking-tight mt-0.5">7</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">vs last month</span>
        </div>

        {/* Customer Sentiment */}
        <div className="p-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Frown className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[11px] font-semibold text-rose-400">
              Negative
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium block">Customer Sentiment</span>
          <p className="text-2xl font-bold text-rose-400 tracking-tight mt-0.5">-0.23</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Aggregated CSAT index</span>
        </div>

      </div>

      {/* 3. Middle Section: Charts & AI Assistant (matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Feedback Trend Curve (Recharts Area Chart) ~38% */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Feedback Trend</h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1 rounded-lg bg-[#141b2c] border border-[#1f283e]">
              <span>{period}</span>
              <ChevronDown size={12} />
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141b2c', borderColor: '#232d44', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                  formatter={(val) => [`${val} items`, 'Feedback']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#purpleGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-[#171f33] flex items-center justify-between">
            <span>Peak volume: Aug (3,200)</span>
            <span className="text-emerald-400 font-semibold">+42% 6mo growth</span>
          </div>
        </div>

        {/* Sentiment Distribution Donut Chart ~32% */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-2">Sentiment Distribution</h3>

          <div className="flex items-center justify-center gap-4 my-auto">
            {/* Donut */}
            <div className="w-32 h-32 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141b2c', borderColor: '#232d44', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                    formatter={(val) => [`${val}%`, 'Ratio']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-white">-0.23</span>
                <span className="text-[9px] text-slate-400">Score</span>
              </div>
            </div>

            {/* Legend & Stats matching Image 2 */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <span className="text-slate-300 font-medium">Positive</span>
                  <p className="text-[11px] text-slate-400 font-mono">4,521 (35%)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div>
                  <span className="text-slate-300 font-medium">Neutral</span>
                  <p className="text-[11px] text-slate-400 font-mono">3,102 (24%)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <div>
                  <span className="text-slate-300 font-medium">Negative</span>
                  <p className="text-[11px] text-slate-400 font-mono">5,219 (41%)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-[#171f33]">
            Highest negative volume in Checkout & Delivery flows
          </div>
        </div>

        {/* AI Assistant Interactive Card ~30% */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
                </div>
                <h3 className="text-sm font-bold text-white">AI Assistant</h3>
              </div>
              <button 
                type="button"
                onClick={() => setChatMessages([{ sender: 'ai', text: 'Hi Priya! 👋 How can I help you with your product insights today?' }])}
                className="text-[11px] text-[#8b5cf6] hover:text-[#a78bfa] font-semibold cursor-pointer"
              >
                New Chat
              </button>
            </div>

            {/* Chat Stream Box */}
            <div className="space-y-2 mb-3 max-h-36 overflow-y-auto pr-1">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'ai' 
                      ? 'bg-[#141a2c] text-slate-200 border border-[#1e263d]' 
                      : 'bg-[#5b3df5]/20 text-[#c4b5fd] border border-[#5b3df5]/30 ml-4'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
              {isAiResponding && (
                <div className="p-2 text-[11px] text-slate-400 font-mono animate-pulse">
                  AI Assistant is compiling insights...
                </div>
              )}
            </div>

            {/* Suggested prompt chips */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Suggested Questions
              </span>
              {suggestedQuestions.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuestion(q)}
                  className="w-full text-left text-[11px] text-slate-300 hover:text-white p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{q}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-[#8b5cf6] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
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
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#141b2c] border border-[#202a42] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b5cf6] hover:text-[#a78bfa] p-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* 4. Bottom Row: Top Pain Points + Top Feature Requests (matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Pain Points */}
        <div className="rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Top Pain Points</h3>
            <Link to={`/workspace/${workspaceId}/intelligence/issues`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {topPainPoints.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#131826] border border-[#1c253b] flex items-center justify-between gap-3 hover:bg-[#161d2e] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <span className="text-[11px] text-slate-400">{item.count}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md border shrink-0 ${item.color}`}>
                  {item.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Feature Requests */}
        <div className="rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Top Feature Requests</h3>
            <Link to={`/workspace/${workspaceId}/development/phases`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {topFeatureRequests.map((item, idx) => {
              const icons = [Truck, CreditCard, Moon, RotateCw, Heart];
              const IconComponent = icons[idx % icons.length];
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#131826] border border-[#1c253b] flex items-center justify-between gap-3 hover:bg-[#161d2e] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
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

      {/* 5. Bottom Row 2: Upcoming Milestones + Recently Generated Documents + Workspace Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recently Generated Documents (~65% width) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recently Generated Documents</h3>
            <Link to={`/workspace/${workspaceId}/reports`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1c253b] text-[11px] font-semibold text-slate-400">
                  <th className="pb-3 font-semibold">Document</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Feature</th>
                  <th className="pb-3 font-semibold">Generated On</th>
                  <th className="pb-3 font-semibold">By</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e30]">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-3 text-slate-200 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-slate-400 truncate max-w-[140px]">{doc.feature}</td>
                    <td className="py-3 pr-3 text-slate-500 font-mono text-[11px]">{doc.generatedOn}</td>
                    <td className="py-3 pr-3 text-[#a78bfa] font-medium">{doc.by}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-white cursor-pointer" title="Preview">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-white cursor-pointer" title="Download">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Stack: Milestones & Activity (~35% width) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upcoming Milestones */}
          <div className="rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Upcoming Milestones</h3>
              <Link to={`/workspace/${workspaceId}/development/tasks`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingMilestones.map((m, idx) => (
                <div 
                  key={idx} 
                  className="p-2.5 rounded-xl bg-[#131826] border border-[#1c253b] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{m.date}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${m.statusColor}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace Activity */}
          <div className="rounded-2xl bg-[#0f1422] border border-[#1c253b] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Workspace Activity</h3>
              <span className="text-[11px] text-slate-500 font-mono">Live</span>
            </div>

            <div className="space-y-3">
              {workspaceActivityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs">
                  {item.isAi ? (
                    <div className="w-6 h-6 rounded-full bg-[#5b3df5]/30 text-[#a28bff] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      AI
                    </div>
                  ) : (
                    <img 
                      src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                      alt={item.user} 
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" 
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-300 leading-snug">
                      <span className="font-bold text-white">{item.user}</span> {item.action}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}