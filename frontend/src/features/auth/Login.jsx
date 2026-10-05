import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Brain, Mail, Lock, ArrowRight, ArrowLeft, Crown, 
  Users, Loader2, AlertCircle, ShieldCheck, Palette,
  Code, CheckCircle2, Briefcase, Sparkles
} from 'lucide-react';
import { authApi } from '../../api/auth';
import { getStoredToken } from '../../api/core';
import { setCurrentUser, isProductManager, getActiveWorkspaceId } from '../../utils/workspaceAccess';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('satya@admin');
  const [password, setPassword] = useState('test');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for expired session redirect query
  const searchParams = new URLSearchParams(location.search);
  const isSessionExpired = searchParams.get('expired') === 'true';

  useEffect(() => {
    const token = getStoredToken();
    const user = localStorage.getItem('currentUser');
    if ((token || user) && !isSessionExpired) {
      const activeWs = getActiveWorkspaceId();
      navigate(activeWs ? `/workspace/${activeWs}/overview` : '/workspaces', { replace: true });
    }
  }, [isSessionExpired, navigate]);

  const demoAccounts = [
    {
      name: 'string (Super Admin)',
      role: 'super_admin',
      roleTitle: 'Super Admin (Complete System & Workspace Authority)',
      email: 'user@example.com',
      password: 'string',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      icon: Sparkles,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      description: 'Global Authority • Cross-Workspace Admin, AI Agent Pipelines & System Settings'
    },
    {
      name: 'Satya Prem (PM / Admin)',
      role: 'product_manager',
      roleTitle: 'Product Manager (PM - Full Access & PRD Authority)',
      email: 'satya@admin',
      password: 'test',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      icon: Crown,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Full PM Control • PRD Generation, PM Review & Assignments'
    },
    {
      name: 'Satya Prem (Product Designer)',
      role: 'designer',
      roleTitle: 'Product Designer / UX Designer',
      email: 'satya@designer',
      password: 'test',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      icon: Palette,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      description: 'UX Specifications • User Journey & Interactive Design'
    },
    {
      name: 'Satya Prem (Lead Developer)',
      role: 'developer',
      roleTitle: 'Developer / Lead Engineer',
      email: 'satya@developer',
      password: 'test',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      icon: Code,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      description: 'Technical Architecture • PRD Requirements, Epics & Tasks'
    },
    {
      name: 'Satya Prem (QA Lead)',
      role: 'qa',
      roleTitle: 'QA / Tester (Acceptance & Testing)',
      email: 'satya@qa',
      password: 'test',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Acceptance Criteria Verification & Edge-Case Validation'
    },
    {
      name: 'Satya Prem (Business Owner)',
      role: 'stakeholder',
      roleTitle: 'Stakeholder / Business Owner',
      email: 'satya@stakeholder',
      password: 'test',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      icon: Briefcase,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
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

      // Navigate to workspaces dashboard for all authenticated users
      navigate('/workspaces');
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
    <div className="min-h-screen bg-[#080a11] text-slate-100 font-sans selection:bg-[#5b3df5] selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden">
      
      {/* Background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f2639_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5b3df5]/15 blur-[160px] rounded-full pointer-events-none"></div>

      {/* Top back link */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-5 z-10">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">FastAPI Auth Ready</span>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#0e121d]/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 sm:p-8 z-10">
        
        {/* Brand Header */}
        <div className="flex items-start sm:items-center gap-4 mb-6 border-b border-white/[0.08] pb-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-purple-500/40 overflow-hidden shadow-xl shadow-[#5b3df5]/30 shrink-0">
            <img src="/logo.png" alt="ProdAI Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white tracking-tight">ProdAI</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Product Intelligence Assistant
              </span>
            </div>
            <p className="text-xs text-purple-300 font-medium italic mt-0.5">“Turn feedback into product intelligence.”</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-lg leading-relaxed">
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

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] focus:ring-1 focus:ring-[#5b3df5] transition-all disabled:opacity-50 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">All: test</span>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] focus:ring-1 focus:ring-[#5b3df5] transition-all disabled:opacity-50 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all hover:scale-[1.005] active:scale-[0.995] flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Authenticate & Open Workspace <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-white/[0.08] w-full"></div>
          <span className="bg-[#0e121d] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest absolute">
            1-Click Team Member Gateways
          </span>
        </div>

        {/* 1-Click Demo Profiles for All 5 Roles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300">Select any role to sign in instantly:</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck size={11} /> Password: <span className="font-bold underline">test</span>
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
                className="w-full p-2.5 sm:p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#5b3df5]/50 flex items-center justify-between gap-3 text-left transition-all duration-200 group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#5b3df5]/50 transition-colors">
                    <Icon className="w-4 h-4 text-slate-300 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white group-hover:text-[#a28bff] transition-colors">
                        {account.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${account.badgeColor}`}>
                        {account.roleTitle.split(' (')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Username: <span className="text-slate-200 font-bold">{account.email}</span> • Pass: <span className="text-emerald-400 font-bold">{account.password}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{account.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Role Guard: Active (6 Role Gateways)</span>
          <span>ProdAI • Product Intelligence Assistant</span>
        </div>

      </div>

    </div>
  );
}