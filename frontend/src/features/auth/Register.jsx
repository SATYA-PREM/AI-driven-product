import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles, Loader2, User, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import CyberCanvas from '../landing/CyberCanvas';
import ThemeToggle from '../../components/common/ThemeToggle';

import { authApi } from '../../api/auth';

export default function Register() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.register({ name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-purple-600 selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Background Atmosphere */}
      <CyberCanvas />
      <div className="fixed inset-0 bg-radial-gradient pointer-events-none -z-10" />

      {/* Navigation link */}
      <div className="w-full max-w-md mb-6 z-10 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-xl border border-white/[0.08]"
        >
          <ArrowLeft size={14} /> Back to Landing Page
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl relative z-10 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">ProdAI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                Create Account
              </span>
            </div>
            <p className="text-xs text-slate-400">Join the Product Intelligence Workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/40 transition-all" 
                placeholder="Alex Rivera" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/40 transition-all" 
                placeholder="alex@company.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/40 transition-all" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}