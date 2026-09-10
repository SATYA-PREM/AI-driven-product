import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Brain, Mail, Lock, ArrowRight, ArrowLeft, Crown, 
  BarChart3, Palette, Code2, ShieldAlert, UserX
} from 'lucide-react';
import { setCurrentUser, getStoredWorkspaces } from '../../utils/workspaceAccess';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const demoAccounts = [
    {
      name: 'Priya Sharma',
      role: 'PRODUCT_MANAGER',
      roleTitle: 'Product Manager (Owner)',
      email: 'pm@demo.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      icon: Crown,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Workspace Owner • Full PM Control & Assignation'
    },
    {
      name: 'Arjun Mehta',
      role: 'USER',
      roleTitle: 'Product Analyst (Admin)',
      email: 'analyst@demo.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      icon: BarChart3,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Assigned to E-Commerce Platform'
    },
    {
      name: 'Neha Kapoor',
      role: 'USER',
      roleTitle: 'UX Designer (Member)',
      email: 'designer@demo.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      icon: Palette,
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      description: 'Assigned to E-Commerce Platform'
    },
    {
      name: 'Rohit Singh',
      role: 'USER',
      roleTitle: 'Data Analyst (Member)',
      email: 'developer@demo.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      icon: Code2,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      description: 'Assigned to E-Commerce Platform'
    },
    {
      name: 'Rahul Verma',
      role: 'USER',
      roleTitle: 'Unassigned Member',
      email: 'unassigned@demo.com',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      icon: UserX,
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      description: 'Not yet assigned (Test PM Assignation)'
    }
  ];

  const handleLoginForUser = (userObj) => {
    setCurrentUser(userObj);

    if (userObj.role === 'PRODUCT_MANAGER' || userObj.email === 'pm@demo.com') {
      navigate('/workspaces');
    } else {
      // Check if user is in any workspace
      const workspaces = getStoredWorkspaces();
      const assignedWs = workspaces.find((ws) => 
        ws.members?.some((m) => (typeof m === 'object' ? m.email : m).toLowerCase() === userObj.email.toLowerCase())
      );

      if (assignedWs) {
        navigate(`/workspace/${assignedWs.id}/overview`);
      } else {
        // Not assigned yet, take to /workspaces where friendly unassigned prompt appears
        navigate('/workspaces');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    const matched = demoAccounts.find((d) => d.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      handleLoginForUser(matched);
    } else {
      // Treat as custom user
      const isPm = email.toLowerCase().includes('pm') || email.toLowerCase().includes('admin');
      handleLoginForUser({
        name: email.split('@')[0],
        email: email.toLowerCase().trim(),
        role: isPm ? 'PRODUCT_MANAGER' : 'USER',
        roleTitle: isPm ? 'Product Manager' : 'Team Member',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
      });
    }
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
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">ProdIntel Auth v2.0</span>
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
            <p className="text-xs text-slate-400">Access your Product Workspaces and Intelligence Pipelines</p>
          </div>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
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
                placeholder="e.g. pm@demo.com or designer@demo.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] focus:ring-1 focus:ring-[#5b3df5] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer">Any password works for demo</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] focus:ring-1 focus:ring-[#5b3df5] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            Authenticate & Open Workspace <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/[0.08] w-full"></div>
          <span className="bg-[#0e121d] px-3 text-[11px] font-mono text-slate-500 uppercase tracking-widest absolute">
            Or Instant Demo Login
          </span>
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300">Click a persona to login instantly:</span>
            <span className="text-[10px] font-mono text-[#8b5cf6] bg-[#5b3df5]/10 px-2 py-0.5 rounded border border-[#5b3df5]/20">1-Click</span>
          </div>

          {demoAccounts.map((account, idx) => {
            const Icon = account.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoginForUser(account)}
                className="w-full p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#5b3df5]/50 flex items-center justify-between gap-3 text-left transition-all duration-200 group cursor-pointer"
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
                        {account.roleTitle.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{account.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}