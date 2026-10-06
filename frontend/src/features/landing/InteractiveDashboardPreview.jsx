import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, BarChart3, MessageSquare,
  Brain, Users, TrendingUp, Zap, Sparkles, ArrowRight
} from 'lucide-react';

export default function InteractiveDashboardPreview() {
  const cardRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [hoveredTheme, setHoveredTheme] = useState(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  };

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Outer Glow Halo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-cyan-500/30 rounded-3xl blur-2xl opacity-70 pointer-events-none"></div>

      {/* Main Glass Dashboard Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-3xl border border-purple-500/30 bg-[#090d1c]/95 shadow-2xl overflow-hidden transition-transform duration-200 ease-out will-change-transform"
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0c1024]/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300">
                P
              </div>
              <span className="text-xs font-bold text-white tracking-wide">ProdAI</span>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-slate-400 w-80">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search feedback, insights, or products...</span>
            <span className="ml-auto px-1.5 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono text-slate-300">⌘K</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.1]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Alex Thompson"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-400"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-none">Alex Thompson</p>
                <p className="text-[10px] text-purple-300 leading-none mt-0.5">Product Manager</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="grid grid-cols-12 min-h-[460px]">
          
          {/* Left Mini Sidebar */}
          <div className="hidden md:block col-span-2 border-r border-white/[0.08] bg-[#070a16]/60 p-4 space-y-1 text-xs">
            {[
              { name: 'Dashboard', icon: BarChart3 },
              { name: 'Feedback', icon: MessageSquare },
              { name: 'Insights', icon: Brain },
              { name: 'Users', icon: Users },
              { name: 'Roadmap', icon: TrendingUp },
              { name: 'Integrations', icon: Zap },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-all ${
                  activeTab === name
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === name ? 'text-purple-400' : ''}`} />
                <span>{name}</span>
              </button>
            ))}
          </div>

          {/* Main Dashboard Content */}
          <div className="col-span-12 md:col-span-10 p-6 space-y-6">
            
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Metric 1: Feedback Volume */}
              <div className="p-4 rounded-2xl bg-[#11172e]/85 border border-white/[0.08] hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">Feedback Volume</span>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">+18.6%</span>
                </div>
                <p className="text-2xl font-black text-white">12,842 items</p>
                <div className="h-10 mt-2">
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-cyan-400 fill-none">
                    <path d="M0,25 Q15,5 30,20 T60,10 T90,5 L100,15" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Metric 2: AI Synthesized Insights */}
              <div className="p-4 rounded-2xl bg-[#11172e]/85 border border-white/[0.08] hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">AI Synthesized Insights</span>
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full">128 Total</span>
                </div>
                <p className="text-2xl font-black text-white">56 Features</p>
                <div className="flex items-end gap-1.5 h-10 mt-2">
                  <div className="w-full bg-purple-500/40 rounded-t h-[30%]"></div>
                  <div className="w-full bg-purple-500/60 rounded-t h-[50%]"></div>
                  <div className="w-full bg-purple-500/80 rounded-t h-[75%]"></div>
                  <div className="w-full bg-purple-400 rounded-t h-[100%] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                  <div className="w-full bg-purple-500/70 rounded-t h-[65%]"></div>
                  <div className="w-full bg-purple-500/50 rounded-t h-[40%]"></div>
                  <div className="w-full bg-purple-500/80 rounded-t h-[85%]"></div>
                </div>
              </div>

              {/* Metric 3: Active Workspace Members */}
              <div className="p-4 rounded-2xl bg-[#11172e]/85 border border-white/[0.08] hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400">Active Workspace Members</span>
                  <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full">PM Assigned</span>
                </div>
                <p className="text-2xl font-black text-white">12 Members</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-2">
                    <img className="w-7 h-7 rounded-full ring-2 ring-[#11172e]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60" alt="" />
                    <img className="w-7 h-7 rounded-full ring-2 ring-[#11172e]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60" alt="" />
                    <img className="w-7 h-7 rounded-full ring-2 ring-[#11172e]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60" alt="" />
                    <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center justify-center ring-2 ring-[#11172e]">
                      +8
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium ml-1">Cross-functional</span>
                </div>
              </div>

            </div>

            {/* Bottom Split Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Top Product Themes */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0e1428]/80 border border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Top Product Themes</span>
                  <span className="text-[11px] text-slate-400 font-medium">Frequency Count</span>
                </div>

                <div className="space-y-3.5">
                  {/* Theme 1 */}
                  <div
                    onMouseEnter={() => setHoveredTheme('ux')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span> User Experience
                      </span>
                      <span className="font-mono text-purple-300 font-bold">2,420</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 w-[88%] shadow-[0_0_12px_rgba(168,85,247,0.5)]"></div>
                    </div>
                  </div>

                  {/* Theme 2 */}
                  <div
                    onMouseEnter={() => setHoveredTheme('perf')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Performance
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">1,830</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[68%] shadow-[0_0_12px_rgba(6,182,212,0.5)]"></div>
                    </div>
                  </div>

                  {/* Theme 3 */}
                  <div
                    onMouseEnter={() => setHoveredTheme('int')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-teal-400"></span> Integrations
                      </span>
                      <span className="font-mono text-teal-300 font-bold">1,240</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 w-[48%]"></div>
                    </div>
                  </div>

                  {/* Theme 4 */}
                  <div
                    onMouseEnter={() => setHoveredTheme('price')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pricing
                      </span>
                      <span className="font-mono text-amber-300 font-bold">980</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 w-[36%]"></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* AI Summary Card */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-[#171438]/95 via-[#0f142b]/95 to-[#0c1022]/95 border border-purple-500/30 flex flex-col justify-between relative overflow-hidden shadow-[0_0_30px_rgba(147,51,234,0.15)]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI Summary</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Customers are highly positive about the new dashboard but frequently request dark mode, better mobile performance, and deeper integration with third-party tools.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.08]">
                  <Link
                    to="/login"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 transition-all flex items-center justify-center gap-2 group"
                  >
                    View Detailed Insights
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

