import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, ArrowRight, ShieldCheck, Zap, Users,
  Sparkles, Check, Play, Database, Lock, X
} from 'lucide-react';
import CyberCanvas from './CyberCanvas';
import RobotHeroVisual from './RobotHeroVisual';
import InteractiveDashboardPreview from './InteractiveDashboardPreview';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

export default function LandingPage() {
  const { isDark } = useTheme();
  const [showTourModal, setShowTourModal] = useState(false);
  const [activeTourStep, setActiveTourStep] = useState(0);

  const tourSteps = [
    {
      title: "1. Multi-Source Ingestion",
      desc: "Connect App Store, Google Play, Zendesk, Discord, and internal interviews with automated batching and de-duplication.",
      badge: "Data Stream Active",
      stat: "12,842 items indexed",
    },
    {
      title: "2. AI Clustering & Pain Points",
      desc: "Gemini-powered semantic clustering discovers recurring customer pain points and scores them by severity and business impact.",
      badge: "56 Features Detected",
      stat: "7 High-Priority",
    },
    {
      title: "3. Automated PRD Generation",
      desc: "One-click generation of end-to-end PRDs with detailed functional requirements, acceptance criteria, and user stories.",
      badge: "PRD Ready for PM Review",
      stat: "100% Traceability",
    },
    {
      title: "4. Role-Specific Member Workspaces",
      desc: "Product Designers, Developers, and QA work in role-tailored workspaces with direct Figma and acceptance criteria linkages.",
      badge: "Cross-Functional Sync",
      stat: "Strict Role Isolation",
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#04060d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} font-sans selection:bg-[#7c3aed] selection:text-white relative overflow-x-hidden transition-colors duration-200`}>
      
      {/* 1. Atmospheric Canvas Background (Zero-Lag 60fps) */}
      <CyberCanvas />
      {isDark && <CyberCanvas />}

      {/* Atmospheric Radial Lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-purple-600/25 via-blue-600/15 to-transparent blur-[140px]"></div>
        <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-cyan-500/10 blur-[160px]"></div>
        <div className="absolute top-[1400px] -right-48 w-[650px] h-[650px] bg-purple-600/15 blur-[160px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
      </div>
      {isDark ? (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-purple-600/25 via-blue-600/15 to-transparent blur-[140px]"></div>
          <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-cyan-500/10 blur-[160px]"></div>
          <div className="absolute top-[1400px] -right-48 w-[650px] h-[650px] bg-purple-600/15 blur-[160px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-purple-200/40 via-blue-100/20 to-transparent blur-[140px]"></div>
          <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-cyan-100/30 blur-[160px]"></div>
          <div className="absolute top-[1400px] -right-48 w-[650px] h-[650px] bg-purple-100/30 blur-[160px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:32px_32px] opacity-60"></div>
        </div>
      )}

      {/* 2. Top Navigation Bar */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl ${isDark ? 'bg-[#04060d]/80 border-white/[0.08]' : 'bg-white/85 border-slate-200 shadow-xs'} border-b transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* Logo & Subtitle */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0 shrink">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${isDark ? 'bg-[#0d1222] border-purple-500/30' : 'bg-white border-purple-200 shadow-sm'} border overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.35)] shrink-0 flex items-center justify-center group-hover:border-purple-400 group-hover:scale-105 transition-all`}>
              <img src="/logo.png" alt="ProdAI Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-extrabold text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>ProdAI</span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 shadow-sm">
                  Assistant
                </span>
              </div>
              <p className={`hidden sm:block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium truncate`}>Product Intelligence Assistant</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className={`hidden lg:flex items-center gap-8 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#dashboard-preview" className="hover:text-purple-400 transition-colors">Workflow</a>
            <a href="#architecture" className="hover:text-purple-400 transition-colors">Architecture</a>
            <a href="#enterprise" className="hover:text-purple-400 transition-colors">Role Management</a>
            <a href="#enterprise" className="hover:text-purple-400 transition-colors">Enterprise</a>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <Link
              to="/login"
              className={`whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all shrink-0 ${
                isDark 
                  ? 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08]' 
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline-flex relative group whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-[0_0_25px_rgba(147,51,234,0.45)] hover:shadow-[0_0_35px_rgba(147,51,234,0.7)] transition-all hover:scale-[1.03] items-center gap-2 overflow-hidden shrink-0"
            >
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                Get Started <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto z-10">
        
        {/* Top Tagline Pill */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-xl ${
            isDark
              ? 'bg-[#13102c]/90 border border-purple-500/40 text-purple-200 shadow-[0_0_20px_rgba(147,51,234,0.25)]'
              : 'bg-purple-50 border border-purple-200 text-purple-700 shadow-xs'
          }`}>
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Turn feedback into product intelligence.</span>
          </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          
          {/* Left Hero Content & Floating Cards */}
          <div className="lg:col-span-7 text-center lg:text-left">
            
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ProdAI <br />
              <span className={isDark ? 'text-white' : 'text-slate-900'}>Product Intelligence </span><br />
              <span className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                Assistant
              </span>
            </h1>

            <p className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              An AI-powered assistant that analyzes customer feedback and product data to deliver actionable insights, answer product questions, and support smarter product decisions.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_35px_rgba(147,51,234,0.5)] transition-all hover:scale-[1.03] flex items-center justify-center gap-3 group"
              >
                Launch Product Workspace
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setShowTourModal(true)}
                className={`w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base shadow-lg backdrop-blur-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  isDark
                    ? 'bg-[#101426]/80 hover:bg-[#182038] text-slate-200 border border-purple-500/30 hover:border-purple-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                Explore Platform Tour
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#04060d]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="Avatar" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#04060d]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="Avatar" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#04060d]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="Avatar" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#04060d]" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80" alt="Avatar" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Trusted by product teams worldwide</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Enterprise ready
                </span>
                <span>•</span>
                <span>Secure</span>
                <span>•</span>
                <span>Scalable</span>
              </div>
            </div>

            {/* Floating Feedback Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 max-w-xl mx-auto lg:mx-0">
              <div className="p-3 rounded-xl bg-[#0e1326]/85 backdrop-blur-xl border border-emerald-500/25 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-400" alt="User" />
                  <div>
                    <p className="text-xs font-semibold text-white">Users love the new dashboard!</p>
                    <p className="text-[10px] text-slate-400">In-App Review</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">+18.6%</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1326]/85 backdrop-blur-xl border border-purple-500/25 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-400" alt="User" />
                  <div>
                    <p className="text-xs font-semibold text-white">Need dark mode feature</p>
                    <p className="text-[10px] text-slate-400">App Store Review</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md">+247 mentions</span>
              </div>
            </div>

          </div>

          {/* Right Hero Visual: 3D AI Robot Assistant */}
          <div className="lg:col-span-5 flex justify-center">
            <RobotHeroVisual />
          </div>

        </div>

        {/* 4. Interactive Futuristic Dashboard (Optimized & Instant Response) */}
        <div id="dashboard-preview" className="mt-6 scroll-mt-24">
          <InteractiveDashboardPreview />
        </div>

      </section>

      {/* 5. Core Platform Architecture Section (3 High-End Feature Cards) */}
      <section id="architecture" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 inline-block mb-3">
            Core Platform Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything needed to drive high-impact product execution
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            From feedback ingestion to AI-powered insights and seamless collaboration, ProdAI provides a unified platform for modern product teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          
          {/* Card 1: Multi-Source Ingestion */}
          <div className="p-8 rounded-3xl bg-[#0a0e20]/80 border border-white/[0.08] hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(147,51,234,0.2)] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600/25 transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                  <Database className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  <span className="text-[10px] font-mono text-slate-400">8+ Sources</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">1. Multi-Source Ingestion</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Consolidate feedback from 8+ channels including Zendesk, App Store, Play Store reviews, and internal interviews into one central intelligence hub.
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300">Live Ingestion Pipeline</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 group-hover:bg-purple-500 group-hover:text-white text-purple-400 flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Semantic AI Analysis */}
          <div className="p-8 rounded-3xl bg-[#0a0e20]/80 border border-white/[0.08] hover:border-cyan-500/40 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-600/25 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                  <Brain className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[10px] font-bold">
                  <Zap className="w-3 h-3" /> Gemini 2.5
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">2. Semantic AI Analysis</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Continuous sentiment tracking, cluster-based pain point identification, and auto-generated PRDs with detailed acceptance criteria and risk scoring.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 text-[11px] font-semibold border border-purple-500/20">Sentiment</span>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 text-[11px] font-semibold border border-blue-500/20">Clustering</span>
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-300 text-[11px] font-semibold border border-cyan-500/20">PRD Draft</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300">Automated Reasoning</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500 group-hover:text-white text-cyan-400 flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Workspace & Member Access */}
          <div className="p-8 rounded-3xl bg-[#0a0e20]/80 border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/25 transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex -space-x-2">
                  <img className="w-6 h-6 rounded-full ring-2 ring-[#0a0e20]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50" alt="" />
                  <img className="w-6 h-6 rounded-full ring-2 ring-[#0a0e20]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50" alt="" />
                  <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-[9px] font-bold text-indigo-300 flex items-center justify-center ring-2 ring-[#0a0e20]">+8</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">3. Workspace & Member Access</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Granular Product Manager control. Assign cross-functional members (Designers, Developers, QA) to distinct workspaces with strict role isolation.
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300">Role-Based Guardrails</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white text-indigo-400 flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Enterprise Access Control Section (PM-Centric Workspace Management) */}
      <section id="enterprise" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className={`p-8 sm:p-14 rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-12 transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#121633]/90 via-[#0b0e22]/90 to-[#070a16]/90 border-purple-500/30 shadow-[0_0_80px_rgba(147,51,234,0.2)]'
            : 'bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white border-purple-200 shadow-xl'
        }`}>
          
          {/* Left Content */}
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 inline-block mb-4">
              Enterprise Access Control
            </span>
            
            <h3 className={`text-3xl sm:text-4xl font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              PM-Centric Workspace Management
            </h3>

            <p className={`text-sm sm:text-base leading-relaxed mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Product Managers have supreme governance to create workspaces, invite or assign members with custom access levels, and track real-time activity across teams. Members only access their authorized workspaces.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Product Manager Workspace Dashboard</span>
              </div>

              <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Instant Member Assignment</span>
              </div>

              <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Role-Based Guardrails</span>
              </div>

              <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Built-in AI Copilot</span>
              </div>
            </div>
          </div>

          {/* Right Isometric Cyber Security Hologram Node Graphic */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute w-56 h-56 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '25s' }}></div>
              <div className="absolute w-44 h-44 rounded-full border border-purple-500/25 border-dashed"></div>

              {/* Floating Node Chips */}
              <div className={`absolute -top-2 -left-4 px-3 py-1.5 rounded-xl border text-[10px] font-bold shadow-md ${
                isDark ? 'bg-[#0f142b]/90 border-cyan-500/30 text-cyan-300' : 'bg-white border-cyan-300 text-cyan-800'
              }`}>
                🛡 PMs (Full Control)
              </div>
              <div className={`absolute -bottom-2 -right-4 px-3 py-1.5 rounded-xl border text-[10px] font-bold shadow-md ${
                isDark ? 'bg-[#0f142b]/90 border-purple-500/30 text-purple-300' : 'bg-white border-purple-300 text-purple-800'
              }`}>
                🔒 Data (Encrypted)
              </div>
              <div className={`absolute top-1/2 -right-8 -translate-y-1/2 px-2.5 py-1 rounded-xl border text-[10px] font-bold shadow-md ${
                isDark ? 'bg-[#0f142b]/90 border-indigo-500/30 text-indigo-300' : 'bg-white border-indigo-300 text-indigo-800'
              }`}>
                👥 Teams (Collaborate)
              </div>

              {/* Center Hologram Lock */}
              <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-600/30 to-blue-600/20 border border-cyan-400/40 backdrop-blur-2xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                <Lock className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </div>
            </div>

            {/* Glowing CTA Button */}
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all hover:scale-105 flex items-center gap-2"
            >
              Sign In & Explore <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 7. Interactive Tour Modal */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0d1226] border border-purple-500/40 shadow-[0_0_80px_rgba(147,51,234,0.4)] p-6 sm:p-8">
            <button
              onClick={() => setShowTourModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ProdAI Interactive Platform Tour</h3>
                <p className="text-xs text-slate-400">Step {activeTourStep + 1} of {tourSteps.length}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  {tourSteps[activeTourStep].badge}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {tourSteps[activeTourStep].stat}
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">{tourSteps[activeTourStep].title}</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{tourSteps[activeTourStep].desc}</p>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {tourSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTourStep(idx)}
                    className={`h-2 rounded-full transition-all ${activeTourStep === idx ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.7)]' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                {activeTourStep > 0 && (
                  <button
                    onClick={() => setActiveTourStep(p => p - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05]"
                  >
                    Previous
                  </button>
                )}
                {activeTourStep < tourSteps.length - 1 ? (
                  <button
                    onClick={() => setActiveTourStep(p => p + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-md"
                  >
                    Next Step →
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  >
                    Launch Workspace Now →
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 8. Minimalist High-End Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.06] bg-[#020409] relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ProdAI" className="w-6 h-6 rounded-md object-cover" />
            <span className="font-bold text-slate-300">ProdAI</span>
            <span>•</span>
            <span>Turn feedback into product intelligence.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#features" className="hover:text-purple-300 transition-colors">Features</a>
            <a href="#dashboard-preview" className="hover:text-purple-300 transition-colors">Workflow</a>
            <a href="#enterprise" className="hover:text-purple-300 transition-colors">Enterprise</a>
            <Link to="/login" className="hover:text-purple-300 transition-colors">Sign In</Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 font-medium">All Systems Operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
