import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, ArrowRight, ShieldCheck, Zap, BarChart3, Users, 
  Sparkles, CheckCircle2, Database, Layers
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080a11] text-slate-100 font-sans selection:bg-[#5b3df5] selection:text-white relative overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f2639_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-[#5b3df5]/20 to-transparent blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[600px] right-[-100px] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] pointer-events-none"></div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#080a11]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4f2ee8] to-[#7952fc] flex items-center justify-center shadow-lg shadow-[#5b3df5]/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                ProdIntel AI
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#5b3df5]/20 text-[#a28bff] rounded-full border border-[#5b3df5]/30">
                  v2.0
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Product Intelligence Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#roles" className="hover:text-white transition-colors">Role Management</a>
            <a href="#security" className="hover:text-white transition-colors">Enterprise</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link 
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white rounded-xl shadow-lg shadow-[#5b3df5]/30 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-[#c4b5fd] mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
          Autonomous Product Intelligence & Workspace Hub
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6">
          Turn Customer Voice into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-slate-200 to-[#a78bfa] bg-clip-text text-transparent">
            Validated Product Roadmaps
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          ProdIntel AI connects raw feedback from surveys, tickets, and user interviews, extracts high-signal pain points, and gives Product Managers powerful workspace hubs with member assignation and live AI synthesis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-xl shadow-[#5b3df5]/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            Launch Product Workspace <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] transition-all"
          >
            Explore Platform Tour
          </a>
        </div>

        {/* Hero Interactive Mock Preview Card */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.12] bg-[#0e121d]/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] p-6 sm:p-8 text-left">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">ProdIntel AI // Workspace Node [E-Commerce Platform]</span>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              System Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Feedback Volume</span>
                <span className="text-xs text-emerald-400 font-bold">+18.6%</span>
              </div>
              <p className="text-2xl font-bold text-white">12,842 items</p>
              <p className="text-[11px] text-slate-500 mt-1">Ingested from 8 data streams</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">AI Synthesized Insights</span>
                <span className="text-xs text-emerald-400 font-bold">128 Total</span>
              </div>
              <p className="text-2xl font-bold text-white">56 Features</p>
              <p className="text-[11px] text-slate-500 mt-1">7 Marked as High Priority</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Active Workspace Members</span>
                <span className="text-xs text-[#a78bfa] font-bold">PM Assigned</span>
              </div>
              <p className="text-2xl font-bold text-white">12 Members</p>
              <p className="text-[11px] text-slate-500 mt-1">Cross-functional team access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-[#8b5cf6] uppercase tracking-widest mb-3">Core Platform Architecture</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white">Everything needed to drive high-impact product execution</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[#5b3df5]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#5b3df5]/10 border border-[#5b3df5]/20 flex items-center justify-center mb-6">
              <Database className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">1. Multi-Source Ingestion</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Consolidate feedback from 8+ channels including Zendesk, App Store, Play Store reviews, and internal interview transcripts into one central intelligence hub.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[#5b3df5]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">2. Semantic AI Analysis</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Continuous sentiment tracking, cluster-based pain point identification, and auto-generated PRDs with detailed acceptance criteria and risk scoring.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[#5b3df5]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">3. Workspace & Member Access</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Granular Product Manager control. Assign cross-functional members (Designers, Developers, QA) to distinct workspaces with strict role isolation.
            </p>
          </div>
        </div>
      </section>

      {/* Role Flow Section */}
      <section id="roles" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Enterprise Access Control</span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-4">
              PM-Centric Workspace Management
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Product Managers have supreme governance to create workspaces, invite or assign members with custom access levels, and track real-time activity across teams. Members only access their authorized workspaces.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Product Manager Workspace Dashboard
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Instant Member Assignation
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Role-Based Guardrails
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Built-in AI Copilot
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl font-bold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-xl shadow-[#5b3df5]/30 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              Sign In & Explore <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-xs text-slate-500">
        <p>© 2026 ProdIntel AI. Product Intelligence Platform. Built for modern Product Teams.</p>
      </footer>

    </div>
  );
}
