import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Paperclip,
  ChevronDown,
  ArrowRight,
  Database,
  Layers,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Brain,
  Quote,
  Flame,
  Check,
  Zap,
  Sliders,
  RefreshCw,
  Clock,
  UserCheck,
  Boxes,
  PlusCircle,
  ExternalLink,
  Bot,
  Compass,
} from 'lucide-react';
import { assistantApi } from '../../api/assistant';
import { workspaceApi } from '../../api/workspaces';
import { getCurrentUser, getActiveWorkspaceId, setActiveWorkspaceId } from '../../utils/workspaceAccess';
import { formatISTTime } from '../../utils/dateUtils';
import { useTheme } from '../../context/ThemeContext';

// ──────────────────────────────────────────────
// Pre-tested Question Banks (20 Insight + 20 PRD)
// ──────────────────────────────────────────────
const PRETESTED_INSIGHT_QUESTIONS = [
  "What are the highest-priority issues?",
  "Why is this insight high priority?",
  "What evidence supports this insight?",
  "How many customers are affected?",
  "What are the most common customer problems?",
  "What are the recurring issues?",
  "Which issues are increasing?",
  "Which issues are decreasing?",
  "What are the biggest pain points?",
  "What are the most requested features?",
  "Which feature has the highest demand?",
  "What is the dominant sentiment?",
  "What product area has the most problems?",
  "What are the emerging issues?",
  "What customer evidence supports this issue?",
  "What is the impact of this issue?",
  "What trends are visible?",
  "Which issues have the strongest evidence?",
  "Summarize the product intelligence.",
  "What should I understand about this category?",
];

const PRETESTED_PRD_QUESTIONS = [
  "Summarize this PRD.",
  "What problem does this PRD solve?",
  "Why was this PRD created?",
  "What is the main product goal?",
  "What are the key features?",
  "What are the functional requirements?",
  "What are the non-functional requirements?",
  "What are the main user stories?",
  "What are the acceptance criteria?",
  "What customer evidence supports this PRD?",
  "Which insight generated this PRD?",
  "What are the major risks?",
  "What are the dependencies?",
  "What assumptions are being made?",
  "What are the open questions?",
  "What is included in scope?",
  "What is explicitly out of scope?",
  "Explain the technical requirements.",
  "Explain the UX requirements.",
  "Explain the PRD in simple terms.",
];

export default function ChatAssistant() {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = routeWorkspaceId || getActiveWorkspaceId();
  const currentUser = getCurrentUser();
  const { isDark } = useTheme();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'prd'
  const [selectedScope, setSelectedScope] = useState('All Data');
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const chatEndRef = useRef(null);

  // User Display Initials
  const userInitials = useMemo(() => {
    const name = currentUser?.name || currentUser?.email || 'PM';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [currentUser]);

  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState(workspaceId);

  // Auto-resolve valid workspace if missing
  useEffect(() => {
    let isMounted = true;
    if (!resolvedWorkspaceId || resolvedWorkspaceId === 'default-ws' || resolvedWorkspaceId === 'default-workspace') {
      workspaceApi.listWorkspaces()
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res) ? res : res?.workspaces || [];
          const valid = list.filter((w) => {
            const wid = w.id || w._id;
            return wid && wid !== 'default-ws' && wid !== 'default-workspace' && wid !== 'ws_demo_01';
          });
          if (valid.length > 0) {
            const firstId = valid[0].id || valid[0]._id;
            setResolvedWorkspaceId(firstId);
            setActiveWorkspaceId(firstId);
          }
        })
        .catch(() => {});
    } else {
      setResolvedWorkspaceId(workspaceId);
    }
    return () => {
      isMounted = false;
    };
  }, [workspaceId, resolvedWorkspaceId]);

  // Load context and initialize default chat state
  useEffect(() => {
    let isMounted = true;
    const targetWs = resolvedWorkspaceId || workspaceId;
    if (targetWs && targetWs !== 'default-ws' && targetWs !== 'default-workspace') {
      assistantApi.getContext(targetWs)
        .then((res) => {
          if (isMounted && res) {
            setContextData(res);
          }
        })
        .catch((err) => console.warn('Could not load context:', err.message));
    }
    return () => {
      isMounted = false;
    };
  }, [resolvedWorkspaceId, workspaceId]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Query Submission
  const handleSend = async (textToSend) => {
    const queryText = typeof textToSend === 'string' ? textToSend : inputValue;
    if (!queryText.trim() || loading) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      time: formatISTTime(new Date()),
    };

    const currentHistory = messages.slice(-10).map((m) => ({
      sender: m.sender,
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text,
      time: m.time,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setProgressStage('Processing message...');
    setProgressPercent(25);

    try {
      const scopeMapping = {
        'All Data': 'all',
        'Insights Only': 'insights',
        'PRDs Only': 'prds',
        'Feedback Only': 'feedback',
      };

      setProgressPercent(50);

      const targetWorkspace = resolvedWorkspaceId || workspaceId;
      const cleanWorkspaceId = (targetWorkspace && targetWorkspace !== 'default-ws' && targetWorkspace !== 'default-workspace') 
        ? targetWorkspace 
        : null;

      const response = await assistantApi.query({
        workspace_id: cleanWorkspaceId,
        category_id: 'all',
        message: queryText,
        session_id: sessionId,
        scope: scopeMapping[selectedScope] || 'all',
        history: currentHistory,
      });

      setProgressStage('Synthesizing response...');
      setProgressPercent(85);

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Add colored classes to top issues if present
      const structured = response.structured_data || null;
      if (structured && structured.top_issues && Array.isArray(structured.top_issues)) {
        const colors = ['bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
        structured.top_issues = structured.top_issues.map((iss, idx) => ({
          ...iss,
          color: iss.color || colors[idx % colors.length],
        }));
      }

      const aiMessage = {
        id: response.message_id || `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        mode: response.mode,
        sources: response.sources || [],
        structured_data: structured,
        confidence: response.confidence,
        time: formatISTTime(new Date()),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Notice: ${err.message || 'Could not process query. Please try again.'}`,
        mode: 'CONVERSATIONAL',
        sources: [],
        structured_data: null,
        time: formatISTTime(new Date()),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setProgressStage('');
      setProgressPercent(0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Connected Sources summary
  const dataSources = contextData?.data_sources || [
    { name: 'App Store Reviews', count: '12.4K items', connected: true },
    { name: 'Play Store Reviews', count: '8.2K items', connected: true },
    { name: 'Support Tickets', count: '5.1K items', connected: true },
    { name: 'Surveys', count: '2.3K items', connected: true },
    { name: 'Social Media', count: '3.4K items', connected: true },
    { name: 'In-App Feedback', count: '1.8K items', connected: true },
  ];

  const starterQuestions = [
    "What are the top customer complaints about checkout?",
    "Why is payment confirmation a high priority?",
    "Summarize the latest PRD",
    "What are the most requested features?",
    "Show overall sentiment distribution",
  ];

  return (
    <div className={`flex h-[calc(100vh-4.5rem)] overflow-hidden font-sans ${
      isDark ? 'bg-[#060813] text-slate-100' : 'bg-[#f1f5f9] text-slate-900'
    }`}>
      
      {/* ────────────────────────────────────────────── */}
      {/* LEFT / CENTER: CHAT FEED & STRUCTURED CARDS    */}
      {/* ────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 border-r relative ${
        isDark ? 'border-[#151b2a] bg-[#070a14]' : 'border-slate-300 bg-slate-50/70'
      }`}>
        
        {/* Top Header */}
        <div className={`flex items-center justify-between px-6 py-3.5 border-b backdrop-blur-md z-10 ${
          isDark ? 'border-[#151b2a] bg-[#090d1a]/80' : 'border-slate-300 bg-white shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] text-white shadow-md shadow-[#5b3df5]/30">
              <Brain size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Assistant</h1>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#5b3df5]/15 text-[#6941f5] border border-[#5b3df5]/30">
                  BETA
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ask questions about your customer feedback, product insights, features, PRDs, or roadmap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
            <Sparkles size={14} className="text-purple-600 animate-pulse" />
            <span>Powered by Semantic AI</span>
          </div>
        </div>

        {/* Live Progress Bar if querying */}
        {loading && (
          <div className="bg-[#0b1021] px-6 py-2 border-b border-[#1b233a] flex items-center justify-between text-xs text-purple-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <RefreshCw size={13} className="animate-spin text-purple-400" />
              <span>{progressStage || 'Processing query...'}</span>
            </div>
            <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Welcome Screen (When no messages yet) */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto py-12 px-6 flex flex-col items-center text-center space-y-6 animate-fade-in-up">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] flex items-center justify-center text-white shadow-xl shadow-purple-500/30">
                  <Brain size={36} />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>

              <div className="space-y-2">
                <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Hello! How can I assist you today?
                </h2>
                <p className={`text-sm max-w-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  I am your <span className="text-purple-600 dark:text-purple-300 font-semibold">AI Product Intelligence Assistant</span>. 
                  Ask me questions about customer complaints, sentiment distribution, PRD requirements, or product roadmap.
                </p>
              </div>

              {/* Suggested Quick Starter Chips */}
              <div className="w-full space-y-2.5 pt-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider block text-left ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Suggested Questions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      className={`text-left p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer ${
                        isDark 
                          ? 'bg-[#0e1428] border-[#1b2542] hover:border-purple-500/60 hover:bg-[#131c38] text-slate-200 hover:text-white' 
                          : 'bg-white border-slate-300 hover:border-purple-500 hover:bg-purple-50/40 text-slate-800'
                      }`}
                    >
                      <span className="line-clamp-2 leading-relaxed font-semibold">{q}</span>
                      <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-600 shrink-0 transition-transform group-hover:translate-x-1 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const sd = msg.structured_data;

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end gap-3 max-w-2xl ml-auto">
                  <div className="flex flex-col items-end">
                    <div className="rounded-2xl rounded-tr-sm bg-[#3b2db5] px-4 py-2.5 text-sm text-white shadow-lg shadow-purple-950/40 leading-relaxed font-medium">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{msg.time}</span>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5b3df5] text-white font-bold text-xs shadow-md">
                    {userInitials}
                  </div>
                </div>
              );
            }

            // AI Message Response
            return (
              <div key={msg.id} className="flex items-start gap-3.5 max-w-4xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#11172b] border border-purple-500/30 text-purple-400 shadow-md">
                  <Brain size={20} />
                </div>

                <div className="flex-1 space-y-4">
                  {/* Text Intro Bubble */}
                  <div className="rounded-2xl rounded-tl-sm bg-[#0e1324] border border-[#1b233a] p-4 text-sm text-slate-200 leading-relaxed shadow-sm">
                    {msg.text}
                  </div>

                  {/* Structured Visual Cards if present (for project-related intelligence questions) */}
                  {sd && (
                    <div className="space-y-4">
                      
                      {/* 1. Top Issues & Sentiment Distribution */}
                      {(sd.top_issues || sd.sentiment_distribution) && (
                        <div className={`grid grid-cols-1 gap-4 ${sd.top_issues && sd.sentiment_distribution ? 'md:grid-cols-12' : ''}`}>
                          
                          {/* Top Issues Card */}
                          {sd.top_issues && sd.top_issues.length > 0 && (
                            <div className={`${sd.sentiment_distribution ? 'md:col-span-7' : 'w-full'} rounded-xl bg-[#0b0f1e] border border-[#182138] p-4 space-y-3 shadow-sm`}>
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                  Top Issues in Category
                                </h3>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  % Share
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {sd.top_issues.map((issue) => (
                                  <div key={issue.rank} className="flex items-center gap-3 text-xs">
                                    <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                                      issue.rank === 1 ? 'bg-rose-500' :
                                      issue.rank === 2 ? 'bg-cyan-500' :
                                      issue.rank === 3 ? 'bg-amber-500' :
                                      issue.rank === 4 ? 'bg-purple-500' : 'bg-emerald-500'
                                    }`}>
                                      {issue.rank}
                                    </span>

                                    <span className="w-48 truncate text-slate-200 font-medium" title={issue.title}>
                                      {issue.title}
                                    </span>

                                    <div className="flex-1 bg-[#131b30] rounded-full h-2 overflow-hidden mx-2">
                                      <div
                                        className={`h-full rounded-full ${issue.color || 'bg-purple-500'}`}
                                        style={{ width: `${Math.min(issue.percentage * 2.8, 100)}%` }}
                                      />
                                    </div>

                                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                      {issue.percentage}% ({issue.count})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sentiment Distribution Card */}
                          {sd.sentiment_distribution && (
                            <div className={`${sd.top_issues ? 'md:col-span-5' : 'max-w-md'} rounded-xl bg-[#0b0f1e] border border-[#182138] p-4 flex flex-col justify-between shadow-sm`}>
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                  Sentiment Distribution
                                </h3>
                                <Link to={`/workspace/${workspaceId}/feedback`} className="text-[10px] text-purple-400 hover:underline flex items-center gap-1">
                                  View All Feedback <ArrowRight size={10} />
                                </Link>
                              </div>

                              {/* Donut Simulation */}
                              <div className="flex items-center justify-center py-2 relative">
                                <div className="relative w-28 h-28 flex items-center justify-center">
                                  <div className="w-28 h-28 rounded-full border-[8px] border-rose-500 border-t-cyan-500 border-r-emerald-500 animate-spin-slow"></div>
                                  <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-base font-extrabold text-white">
                                      {sd.sentiment_distribution.total || 352}
                                    </span>
                                    <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Feedback Items</span>
                                  </div>
                                </div>
                              </div>

                              {/* Legend */}
                              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#151d33] text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                                  <span className="text-slate-400">Negative</span>
                                  <span className="font-bold text-white font-mono">{sd.sentiment_distribution.negative}%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
                                  <span className="text-slate-400">Neutral</span>
                                  <span className="font-bold text-white font-mono">{sd.sentiment_distribution.neutral}%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                                  <span className="text-slate-400">Positive</span>
                                  <span className="font-bold text-white font-mono">{sd.sentiment_distribution.positive}%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Example Customer Feedback Quotes */}
                      {sd.example_feedback && sd.example_feedback.length > 0 && (
                        <div className="rounded-xl bg-[#0b0f1e] border border-[#182138] p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Quote size={14} className="text-purple-400" />
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                Example Customer Feedback
                              </h3>
                            </div>
                            <Link to={`/workspace/${workspaceId}/feedback`} className="text-[10px] text-purple-400 hover:underline flex items-center gap-1">
                              View All <ArrowRight size={10} />
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {sd.example_feedback.map((fb, i) => (
                              <div key={fb.id || i} className="rounded-lg bg-[#0e1428] border border-[#1a233d] p-3 flex flex-col justify-between space-y-2">
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                  "{fb.text}"
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-[#161d36] text-[10px] text-slate-400">
                                  <span className="flex items-center gap-1 font-medium text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                    {fb.source}
                                  </span>
                                  <span>{fb.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Key AI Insights Bullets */}
                      {sd.ai_insights && sd.ai_insights.length > 0 && (
                        <div className="rounded-xl bg-[#0b0f1e] border border-[#182138] p-4 space-y-2.5 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Lightbulb size={14} className="text-amber-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                              AI Insights
                            </h3>
                          </div>
                          <ul className="space-y-1.5 pl-2 text-xs text-slate-300">
                            {sd.ai_insights.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                <span className="leading-relaxed">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 4. Refer Page Navigation Buttons (One-click jump for further details) */}
                      {sd.refer_buttons && sd.refer_buttons.length > 0 && (
                        <div className="rounded-xl bg-[#0b0f1e] border border-[#182138] p-4 space-y-2.5 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Compass size={14} className="text-purple-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                              Explore Further in Workspace
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sd.refer_buttons.map((btn, idx) => (
                              <Link
                                key={idx}
                                to={btn.path}
                                className="px-3 py-1.5 rounded-lg bg-[#111833] border border-[#23315a] hover:border-purple-500 hover:bg-[#192348] text-xs text-purple-200 font-semibold transition-all flex items-center gap-1.5 shadow-sm group"
                              >
                                <span>{btn.label}</span>
                                <ArrowRight size={12} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sources Citation Bar */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-500">Sources:</span>
                      {msg.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#10172c] border border-[#1c2747] text-purple-300 font-mono text-[10px] hover:border-purple-500 cursor-pointer"
                        >
                          {s.id || s.title}
                        </span>
                      ))}
                      {msg.mode && (
                        <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {msg.mode === 'FAST_RETRIEVAL' ? '⚡ FAST RETRIEVAL' : '🧠 DYNAMIC ANALYSIS'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className={`p-4 border-t backdrop-blur-md ${
          isDark ? 'border-[#151b2a] bg-[#080b18]/90' : 'border-slate-300 bg-white shadow-xs'
        }`}>
          <div className={`relative rounded-2xl border transition-all p-2 flex items-center gap-2 shadow-sm ${
            isDark 
              ? 'bg-[#0d1224] border-[#1b2542] focus-within:border-purple-500/80 shadow-inner' 
              : 'bg-slate-50 border-slate-300 focus-within:border-purple-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/20'
          }`}>
            
            {/* Attachment icon */}
            <button
              type="button"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
              title="Attach context reference"
            >
              <Paperclip size={18} />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your product data..."
              disabled={loading}
              className={`flex-1 bg-transparent text-sm focus:outline-none px-2 ${
                isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />

            {/* Scope Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowScopeDropdown(!showScopeDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b34] border border-[#202c52] text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span>{selectedScope}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {showScopeDropdown && (
                <div className="absolute right-0 bottom-full mb-2 w-36 rounded-xl bg-[#0f152d] border border-[#23315a] shadow-2xl py-1 z-30 animate-in fade-in">
                  {['All Data', 'Insights Only', 'PRDs Only', 'Feedback Only'].map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => {
                        setSelectedScope(scope);
                        setShowScopeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                        selectedScope === scope ? 'bg-purple-600/30 text-purple-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{scope}</span>
                      {selectedScope === scope && <Check size={12} className="text-purple-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !inputValue.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all cursor-pointer shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* RIGHT SIDEBAR: EXAMPLE QUESTIONS & CONTEXT     */}
      {/* ────────────────────────────────────────────── */}
      <div className={`w-80 border-l p-4 flex flex-col gap-4 overflow-y-auto shrink-0 scrollbar-thin ${
        isDark ? 'border-[#151b2a] bg-[#070a14] scrollbar-thumb-slate-800' : 'border-slate-300 bg-slate-100/60 scrollbar-thumb-slate-300'
      }`}>
        
        {/* Card 1: Example Questions */}
        <div className={`rounded-xl border p-4 space-y-3 shadow-sm ${
          isDark ? 'bg-[#090d1c] border-[#161f38]' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-purple-600 dark:text-purple-400" />
              <h2 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Example Questions</h2>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  activeTab === 'insights' ? 'bg-purple-600 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Insights
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prd')}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  activeTab === 'prd' ? 'bg-purple-600 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                PRD
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {(activeTab === 'insights' ? PRETESTED_INSIGHT_QUESTIONS : PRETESTED_PRD_QUESTIONS).slice(0, 8).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all group flex items-center justify-between gap-2 cursor-pointer ${
                  isDark 
                    ? 'bg-[#0e1428] border-[#18233f] hover:border-purple-500/60 hover:bg-[#131b36] text-slate-300 hover:text-white' 
                    : 'bg-slate-50 border-slate-200 hover:border-purple-400 hover:bg-white text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
              >
                <span className="text-xs line-clamp-2 leading-relaxed font-medium">
                  {q}
                </span>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-purple-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Data Sources */}
        <div className={`rounded-xl border p-4 space-y-3 shadow-sm ${
          isDark ? 'bg-[#090d1c] border-[#161f38]' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Data Sources</h2>
            <Link to={`/workspace/${workspaceId}/data/datasets`} className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-2">
            {dataSources.map((ds, idx) => (
              <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                isDark ? 'bg-[#0e1428] border-[#18233f]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ds.connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{ds.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ds.count}</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    ✓ Connected
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Current Context */}
        <div className={`rounded-xl border p-4 space-y-2.5 shadow-sm ${
          isDark ? 'bg-[#090d1c] border-[#161f38]' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Current Context</h2>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">Edit</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5"><Database size={13} /> Workspace</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{contextData?.workspace_name || 'Customer Intelligence'}</span>
            </div>
            <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5"><Clock size={13} /> Time Range</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{contextData?.time_range || 'Last 3 months'}</span>
            </div>
            <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5"><Layers size={13} /> Data Type</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedScope}</span>
            </div>
            <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5"><UserCheck size={13} /> User Role</span>
              <span className="font-semibold text-purple-600 dark:text-purple-300">{currentUser?.roleTitle || 'Product Manager'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}