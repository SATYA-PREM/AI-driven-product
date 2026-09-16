import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Brain, Mail, Lock, ArrowRight, ArrowLeft, Crown, 
  Users, Loader2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { authApi, getStoredToken } from '../../api/client';
import { setCurrentUser, isProductManager, getActiveWorkspaceId } from '../../utils/workspaceAccess';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('Stringst@123');
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
      name: 'Priya Sharma (PM)',
      role: 'product_manager',
      roleTitle: 'Product Manager (Admin / Owner)',
      email: 'user@example.com',
      password: 'Stringst@123',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      icon: Crown,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Full PM Control • Access to Product Intelligence Dashboard'
    },
    {
      name: 'Team Member',
      role: 'member',
      roleTitle: 'Team Member',
      email: 'user@example1.com',
      password: 'Stringst@123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      icon: Users,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Standard Member • Restricted from PM Overview'
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
      setError('Please enter both email and password.');
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
      <div className="w-full max-w-xl flex items-center justify-between mb-6 z-10">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">FastAPI Backend Online</span>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#0e121d]/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 sm:p-8 z-10">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-white/[0.08] pb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#4f2ee8] to-[#7952fc] flex items-center justify-center shadow-lg shadow-[#5b3df5]/30 shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sign in to ProdIntel AI</h1>
            <p className="text-xs text-slate-400">Authenticate with your Workspace Credentials</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] focus:ring-1 focus:ring-[#5b3df5] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-slate-400">Default: Stringst@123</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] focus:ring-1 focus:ring-[#5b3df5] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
              </>
            ) : (
              <>
                Authenticate & Open Workspace <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/[0.08] w-full"></div>
          <span className="bg-[#0e121d] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest absolute">
            Verified Database Credentials
          </span>
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300">Click to authenticate instantly:</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck size={11} /> 1-Click Fast Auth
            </span>
          </div>

          {demoAccounts.map((account, idx) => {
            return (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handle1ClickLogin(account)}
                className="w-full p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#5b3df5]/50 flex items-center justify-between gap-3 text-left transition-all duration-200 group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={account.avatar} 
                    alt={account.name} 
                    className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-[#a28bff] transition-colors truncate">
                        {account.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${account.badgeColor}`}>
                        {account.role === 'product_manager' ? 'Product Manager' : 'Member'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                      {account.email} • {account.password}
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
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Role Guard: Active</span>
          <span>FastAPI v1.0.0</span>
        </div>

      </div>

    </div>
  );
}