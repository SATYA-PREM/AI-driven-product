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
    const rotateX = ((y - centerY) / centerY) * -2;
    const rotateY = ((x - centerX) / centerX) * 2;

    cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
  };

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Soft Ambient Glow Halo behind the frame */}
      <div className="absolute -inset-2 bg-gradient-to-r from-purple-300/30 via-indigo-200/20 to-pink-200/30 rounded-[32px] blur-2xl opacity-60 pointer-events-none"></div>

      {/* Main Container Card matching reference screenshot */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-[28px] border border-[#e8ecf4] bg-[#fbfbfe] shadow-[0_20px_60px_-15px_rgba(30,27,75,0.08)] overflow-hidden transition-transform duration-200 ease-out will-change-transform"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border-b border-[#edf0f7]">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7033f5]">
              <Sparkles className="w-6 h-6 fill-[#7033f5]" />
            </div>
            <span className="text-xl font-extrabold text-[#111827] tracking-tight">ProdAI</span>
          </div>

          {/* Search Bar with ⌘K badge */}
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#f3f4f8] border border-[#e5e7eb]/80 text-xs text-[#9ca3af] w-96 shadow-inner">
            <Search className="w-4 h-4 text-[#9ca3af]" />
            <span className="truncate text-xs font-normal text-[#6b7280]">Search feedback, insights, or products...</span>
            <span className="ml-auto px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-[#9ca3af]">⌘K</span>
          </div>

          {/* Right Header Actions: Bell & User Pill */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#f3f4f8] border border-[#e5e7eb] flex items-center justify-center text-[#4b5563] hover:text-[#111827] transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2.5 pl-2 cursor-pointer group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Alex Thompson"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-xs"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#111827] leading-none group-hover:text-[#7033f5] transition-colors">Alex Thompson</p>
                <p className="text-[10px] text-[#6b7280] leading-none mt-1 font-medium">Product Manager</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
            </div>
          </div>
        </div>

        {/* Dashboard Body Grid */}
        <div className="grid grid-cols-12 min-h-[480px]">
          {/* Left Navigation Sidebar */}
          <div className="hidden md:block col-span-2 bg-[#fbfbfe] border-r border-[#edf0f7] p-4 space-y-1.5 text-xs">
            {[
              { name: 'Dashboard', icon: BarChart3 },
              { name: 'Feedback', icon: MessageSquare },
              { name: 'Insights', icon: Brain },
              { name: 'Users', icon: Users },
              { name: 'Roadmap', icon: TrendingUp },
              { name: 'Integrations', icon: Zap },
            ].map(({ name, icon: Icon }) => {
              const isActive = activeTab === name;
              return (
                <button
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-medium transition-all ${
                    isActive
                      ? 'bg-[#ede9fe] text-[#7033f5] font-bold shadow-xs'
                      : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f8]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7033f5]' : 'text-[#6b7280]'}`} />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>

          {/* Main Dashboard Canvas */}
          <div className="col-span-12 md:col-span-10 p-6 space-y-6 bg-[#fbfbfe]">
            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Metric 1: Feedback Volume */}
              <div className="p-5 rounded-2xl bg-white border border-[#edf0f7] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:border-purple-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#f3f0ff] flex items-center justify-center text-[#7033f5]">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#6b7280]">Feedback Volume</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      +18.6% <span className="text-[10px]">↑</span>
                    </span>
                  </div>
                  <p className="text-2xl font-black text-[#111827] tracking-tight mt-1">12,842 items</p>
                </div>
                {/* Purple wave curve with subtle gradient under-fill */}
                <div className="h-12 mt-3 relative">
                  <svg viewBox="0 0 160 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 45 C 20 45, 30 38, 45 28 C 60 18, 75 22, 90 32 C 105 42, 120 18, 135 22 C 145 25, 155 35, 160 38 L 160 50 L 0 50 Z"
                      fill="url(#waveGradient)"
                    />
                    <path
                      d="M 0 45 C 20 45, 30 38, 45 28 C 60 18, 75 22, 90 32 C 105 42, 120 18, 135 22 C 145 25, 155 35, 160 38"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Metric 2: AI Synthesized Insights */}
              <div className="p-5 rounded-2xl bg-white border border-[#edf0f7] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:border-purple-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#f3f0ff] flex items-center justify-center text-[#7033f5]">
                        <Sparkles className="w-4 h-4 fill-[#7033f5]/20 text-[#7033f5]" />
                      </div>
                      <span className="text-xs font-semibold text-[#6b7280]">AI Synthesized Insights</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#7033f5] bg-[#f3f0ff] px-2 py-0.5 rounded-full">
                      128 Total
                    </span>
                  </div>
                  <p className="text-2xl font-black text-[#111827] tracking-tight mt-1">56 Features</p>
                </div>
                {/* 7 Vertical Purple Bars */}
                <div className="flex items-end justify-between gap-1.5 h-12 mt-3 px-1">
                  <div className="w-full bg-[#d8b4fe] rounded-t-sm h-[25%]"></div>
                  <div className="w-full bg-[#c084fc] rounded-t-sm h-[45%]"></div>
                  <div className="w-full bg-[#c084fc] rounded-t-sm h-[65%]"></div>
                  <div className="w-full bg-[#a855f7] rounded-t-sm h-[90%]"></div>
                  <div className="w-full bg-[#c084fc] rounded-t-sm h-[55%]"></div>
                  <div className="w-full bg-[#d8b4fe] rounded-t-sm h-[35%]"></div>
                  <div className="w-full bg-[#a855f7] rounded-t-sm h-[80%]"></div>
                </div>
              </div>

              {/* Metric 3: Active Workspace Members */}
              <div className="p-5 rounded-2xl bg-white border border-[#edf0f7] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:border-purple-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#2563eb]">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#6b7280]">Active Workspace Members</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded-full">
                      PM Assigned
                    </span>
                  </div>
                  <p className="text-2xl font-black text-[#111827] tracking-tight mt-1">12 Members</p>
                </div>
                {/* Stacked user avatars with +8 counter */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80" alt="Member 1" />
                    <img className="w-8 h-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80" alt="Member 2" />
                    <img className="w-8 h-8 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80" alt="Member 3" />
                    <div className="w-8 h-8 rounded-full bg-[#f3e8ff] border border-purple-200 text-[11px] font-bold text-[#7033f5] flex items-center justify-center ring-2 ring-white">
                      +8
                    </div>
                  </div>
                  <span className="text-xs text-[#6b7280] font-medium">Cross-functional</span>
                </div>
              </div>
            </div>

            {/* Bottom Split Pane: Top Product Themes & AI Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 2-Column: Top Product Themes */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#edf0f7] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">Top Product Themes</span>
                  <span className="text-xs text-[#6b7280] font-medium">Frequency Count</span>
                </div>

                <div className="space-y-4">
                  {/* Theme 1: User Experience */}
                  <div
                    onMouseEnter={() => setHoveredTheme('ux')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="group"
                  >
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="flex items-center gap-2 text-[#1f2937]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea]"></span>
                        User Experience
                      </span>
                      <span className="font-bold text-[#7033f5]">2,420</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#f3f4f8] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#9333ea] to-[#c026d3] w-[75%] transition-all duration-300"></div>
                    </div>
                  </div>

                  {/* Theme 2: Performance */}
                  <div
                    onMouseEnter={() => setHoveredTheme('perf')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="group"
                  >
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="flex items-center gap-2 text-[#1f2937]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                        Performance
                      </span>
                      <span className="font-bold text-[#0284c7]">1,830</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#f3f4f8] overflow-hidden">
                      <div className="h-full rounded-full bg-[#0ea5e9] w-[58%] transition-all duration-300"></div>
                    </div>
                  </div>

                  {/* Theme 3: Integrations */}
                  <div
                    onMouseEnter={() => setHoveredTheme('int')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="group"
                  >
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="flex items-center gap-2 text-[#1f2937]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]"></span>
                        Integrations
                      </span>
                      <span className="font-bold text-[#0d9488]">1,240</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#f3f4f8] overflow-hidden">
                      <div className="h-full rounded-full bg-[#14b8a6] w-[42%] transition-all duration-300"></div>
                    </div>
                  </div>

                  {/* Theme 4: Pricing */}
                  <div
                    onMouseEnter={() => setHoveredTheme('price')}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className="group"
                  >
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="flex items-center gap-2 text-[#1f2937]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]"></span>
                        Pricing
                      </span>
                      <span className="font-bold text-[#ea580c]">980</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#f3f4f8] overflow-hidden">
                      <div className="h-full rounded-full bg-[#f97316] w-[30%] transition-all duration-300"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Summary */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#edf0f7] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7033f5] mb-3">
                    <Sparkles className="w-4 h-4 fill-[#7033f5]/20 text-[#7033f5]" />
                    <span>AI Summary</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#4b5563] leading-relaxed">
                    Customers are highly positive about the new dashboard but frequently request dark mode, better mobile performance, and deeper integration with third-party tools.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#f3f4f8]">
                  <Link
                    to="/login"
                    className="w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#7033f5] to-[#6366f1] hover:from-[#622bd6] hover:to-[#4f46e5] shadow-[0_4px_16px_rgba(112,51,245,0.3)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    View Detailed Insights
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
