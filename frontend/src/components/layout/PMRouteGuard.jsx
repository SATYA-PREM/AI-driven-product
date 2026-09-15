import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Crown } from 'lucide-react';
import { getCurrentUser, isProductManager, logoutUser } from '../../utils/workspaceAccess';

export default function PMRouteGuard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isPm = isProductManager(currentUser);

  if (!isPm) {
    const handleLogout = () => {
      logoutUser();
      navigate('/login');
    };

    return (
      <div className="min-h-screen bg-[#080a11] text-slate-100 font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-rose-500/20 bg-[#0e121d] p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <ShieldAlert size={28} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Product Manager Authorization Required</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The PM Overview Dashboard and Product Intelligence features are restricted to users with the <span className="text-amber-400 font-semibold font-mono">product_manager</span> role.
          </p>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] mb-6 text-left text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Current User:</span>
              <span className="text-slate-300 font-bold">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-300">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Role:</span>
              <span className="text-rose-400 font-bold uppercase">{currentUser.role || 'MEMBER'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/workspaces"
              className="flex-1 py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Return to Workspaces
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-3 px-4 rounded-xl bg-[#5b3df5] hover:bg-[#4f2ee8] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#5b3df5]/20"
            >
              <Crown size={14} /> Sign in as PM
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

