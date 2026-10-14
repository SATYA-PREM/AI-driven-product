import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, ArrowRight, ArrowLeft, Crown, 
  Loader2, AlertCircle, ShieldCheck, Palette,
  Code, CheckCircle2, Briefcase, Sparkles, KeyRound
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { getStoredToken } from '../../api/core';
import { setCurrentUser, getActiveWorkspaceId } from '../../utils/workspaceAccess';
import CyberCanvas from '../landing/CyberCanvas';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

export default function Login() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('satya@admin');
  const [password, setPassword] = useState('test');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for expired session redirect query
  const searchParams = new URLSearchParams(location.search);
  const isSessionExpired = searchParams.get('expired') === 'true';

  const getRoleDestination = (role, wsId) => {
    if (!wsId) return '/workspaces';
    const r = String(role || '').toLowerCase();
    if (['designer', 'product_designer', 'product designer', 'ux', 'ux_designer'].includes(r)) {
      return `/workspace/${wsId}/designer/dashboard`;
    }
    if (['developer', 'dev', 'engineer', 'lead_engineer', 'lead engineer'].includes(r)) {
      return `/workspace/${wsId}/developer/dashboard`;
    }
    if (['qa', 'tester', 'qa_tester', 'quality_assurance'].includes(r)) {
      return `/workspace/${wsId}/qa/dashboard`;
    }
    if (['stakeholder', 'business', 'business_owner', 'business owner'].includes(r)) {
      return `/workspace/${wsId}/stakeholder/dashboard`;
    }
    if (['product_manager', 'pm', 'admin', 'super_admin'].includes(r)) {
      return `/workspace/${wsId}/pm-dashboard`;
    }
    return `/workspace/${wsId}/my-dashboard`;
  };

  useEffect(() => {
    const token = getStoredToken();
    const userStr = localStorage.getItem('currentUser');
    if ((token || userStr) && !isSessionExpired) {
      try {
        const user = userStr ? JSON.parse(userStr) : {};
        const activeWs = getActiveWorkspaceId();
        navigate(getRoleDestination(user?.role, activeWs), { replace: true });
      } catch {
        navigate('/workspaces', { replace: true });
      }
    }
  }, [isSessionExpired, navigate]);

  const demoAccounts = [
    {
      name: 'Satya Prem (Super Admin)',
      role: 'super_admin',
      roleBadge: 'Super Admin',
      email: 'user@example.com',
      password: 'test',
      icon: Sparkles,
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      description: 'Global Authority • Cross-Workspace Admin, AI Agent Pipelines & System Settings'
    },
    {
      name: 'Satya Prem (PM / Admin)',
      role: 'product_manager',
      roleBadge: 'Product Manager',
      email: 'satya@admin',
      password: 'test',
      icon: Crown,
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      description: 'Full PM Control • PRD Generation, PM Review & Assignments'
    },
    {
      name: 'Satya Prem (Product Designer)',
      role: 'designer',
      roleBadge: 'Product Designer / UX Designer',
      email: 'satya@designer',
      password: 'test',
      icon: Palette,
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      description: 'UX Specifications • User Journey & Interactive Design'
    },
    {
      name: 'Satya Prem (Lead Developer)',
      role: 'developer',
      roleBadge: 'Developer / Lead Engineer',
      email: 'satya@developer',
      password: 'test',
      icon: Code,
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      description: 'Technical Architecture • PRD Requirements, Epics & Tasks'
    },
    {
      name: 'Satya Prem (QA Lead)',
      role: 'qa',
      roleBadge: 'QA Lead / Tester',
      email: 'satya@qa',
      password: 'test',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      description: 'Quality Strategy • Test Execution, Defect Verification & Release Readiness'
    },
    {
      name: 'Satya Prem (Business Owner)',
      role: 'stakeholder',
      roleBadge: 'Stakeholder / Business Owner',
      email: 'satya@stakeholder',
      password: 'test',
      icon: Briefcase,
      iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
      description: 'Strategic Review • Business Insights & Market Metrics'
    }
  ];

  const performLogin = async (loginEmail, loginPassword) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      const user = response.user || {};
      const token = response.access_token;

      setCurrentUser({
        ...user,
        token,
      });

      const activeWs = getActiveWorkspaceId();
      navigate(getRoleDestination(user.role, activeWs));
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both username/email and password.');
      return;
    }
    performLogin(email, password);
  };

  const handle1ClickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    performLogin(account.email, account.password);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#04060d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} font-sans selection:bg-[#7c3aed] selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden transition-colors duration-200`}>
      
      {/* 1. Atmospheric Canvas Background */}
      {isDark && <CyberCanvas />}

      {/* Atmospheric Ambient Glows */}
      {isDark ? (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-600/20 via-blue-600/10 to-transparent blur-[140px]"></div>
          <div className="absolute bottom-10 -right-32 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px] opacity-35"></div>
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-200/40 via-blue-100/20 to-transparent blur-[140px]"></div>
          <div className="absolute bottom-10 -right-32 w-[500px] h-[500px] bg-cyan-100/30 blur-[150px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:28px_28px] opacity-60"></div>
        </div>
      )}

      {/* 2. Top Navigation Links */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-5 z-10">
        <Link 
          to="/"
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
            isDark
              ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} /> Back to Landing Page
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            isDark ? 'bg-[#0c1322]/90 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'} uppercase tracking-wider font-bold`}>FastAPI Auth Ready</span>
          </div>
        </div>
      </div>

      {/* 3. Main Glassmorphic Auth Card */}
      <div className={`w-full max-w-2xl rounded-3xl border ${
        isDark
          ? 'border-purple-500/30 bg-[#090d1c]/95 backdrop-blur-2xl shadow-[0_0_80px_-15px_rgba(147,51,234,0.4)]'
          : 'border-slate-200 bg-white/95 backdrop-blur-2xl shadow-xl'
      } p-6 sm:p-8 z-10 transition-colors duration-200`}>
        
        {/* Brand Header */}
        <div className={`flex items-start sm:items-center gap-4 mb-6 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'} pb-5`}>
          <div className={`w-13 h-13 rounded-2xl ${isDark ? 'bg-[#0e1328] border-purple-500/40' : 'bg-slate-100 border-purple-300'} border overflow-hidden shadow-md shrink-0 flex items-center justify-center`}>
            <img src="/logo.png" alt="ProdAI Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>ProdAI</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm">
                Product Intelligence Assistant
              </span>
            </div>
            <p className="text-xs text-purple-400 font-semibold italic mt-1">“Turn feedback into product intelligence.”</p>
            <p className={`text-[11px] mt-1 max-w-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              An AI-powered assistant that analyzes customer feedback and product data to deliver actionable insights, answer product questions, and support smarter product decisions.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {isSessionExpired && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Your session has expired. Please sign in again to continue.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Username/Email Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="satya@admin"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e1428]/90 border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all disabled:opacity-50 font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  All: test
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="test"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e1428]/90 border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all disabled:opacity-50 font-mono shadow-inner"
                />
              </div>
            </div>

          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(147,51,234,0.45)] hover:shadow-[0_0_35px_rgba(147,51,234,0.7)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" /> Authenticating...
              </>
            ) : (
              <>
                Authenticate & Open Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/[0.08] w-full"></div>
          <span className="bg-[#090d1c] px-3.5 text-[10px] font-mono text-purple-300 font-bold uppercase tracking-widest absolute border border-purple-500/20 py-0.5 rounded-full">
            1-Click Team Member Gateways
          </span>
        </div>

        {/* 1-Click Role Profiles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Select any role to sign in instantly:</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1 font-semibold">
              <KeyRound size={11} /> Password: <span className="font-bold underline">test</span>
            </span>
          </div>

          {demoAccounts.map((account, idx) => {
            const Icon = account.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handle1ClickLogin(account)}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all duration-200 group cursor-pointer disabled:opacity-50 shadow-xs ${
                  isDark
                    ? 'bg-[#0c1126]/70 hover:bg-[#121938] border-white/[0.06] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                    : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm ${account.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold group-hover:text-purple-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {account.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${account.badgeColor}`}>
                        {account.roleBadge}
                      </span>
                    </div>
                    <p className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Username: <span className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-bold`}>{account.email}</span> • Pass: <span className="text-emerald-500 font-bold">{account.password}</span>
                    </p>
                    <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{account.description}</p>
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                  isDark 
                    ? 'bg-white/[0.04] group-hover:bg-purple-600/30 border-white/[0.06] group-hover:border-purple-500/40 text-slate-400 group-hover:text-white' 
                    : 'bg-slate-100 group-hover:bg-purple-50 border-slate-200 text-slate-500 group-hover:text-purple-600'
                }`}>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`mt-6 pt-4 border-t flex items-center justify-between text-[11px] font-mono ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-slate-200 text-slate-500'}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Role Guard: Active (6 Role Gateways)
          </span>
          <span>ProdAI • Product Intelligence Assistant</span>
        </div>

      </div>

    </div>
  );
}