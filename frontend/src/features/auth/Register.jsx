import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        // FIX: FastAPI ke array/object errors ko properly handle karna
        if (data.detail && Array.isArray(data.detail)) {
          // Agar validation error hai, toh pehla error message dikhao
          setError(`${data.detail[0].loc[data.detail[0].loc.length - 1]}: ${data.detail[0].msg}`);
        } else if (typeof data.detail === 'string') {
          setError(data.detail);
        } else {
          setError('Registration failed. Please check your inputs.');
        }
      }
    } catch (err) {
      setError('Server unreachable. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans relative overflow-hidden selection:bg-[#00FFA3] selection:text-black flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-[#00FFA3]/10 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl relative z-10 shadow-2xl animate-fade-in-up m-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-3 h-3 bg-[#00FFA3] animate-pulse-fast"></div>
          <span className="font-mono text-sm tracking-[0.2em] uppercase font-bold">[ NEW_NODE_DEPLOYMENT ]</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2">Deploy Workspace</h1>
        <p className="text-sm text-gray-400 mb-6">Initialize a new telemetry access node.</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">Node Designation (Name)</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FFA3]/50 transition-all font-mono" 
              placeholder="Admin User" 
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FFA3]/50 transition-all font-mono" 
              placeholder="sysadmin@company.com" 
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">Security Key</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FFA3]/50 transition-all font-mono" 
              placeholder="••••••••" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 mt-4 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase bg-[#00FFA3] text-black hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deploying...' : 'Deploy Node'}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-gray-500 font-mono">
          Existing node? <Link to="/login" className="text-[#00FFA3] hover:underline">Access Node</Link>
        </p>
      </div>
    </div>
  );
}