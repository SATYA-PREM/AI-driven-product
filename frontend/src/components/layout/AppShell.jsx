import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import CyberCanvas from '../../features/landing/CyberCanvas';

export default function AppShell() {
  const { workspaceId } = useParams();

  return (
    <div className="flex h-screen overflow-hidden font-sans relative bg-[#04060d] text-slate-100 selection:bg-[#7c3aed] selection:text-white">
      
      {/* 1. Atmospheric Ambient CyberCanvas Layer */}
      <CyberCanvas />

      {/* 2. Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/3 w-[900px] h-[400px] bg-gradient-to-b from-purple-600/15 via-blue-600/10 to-transparent blur-[140px]"></div>
        <div className="absolute top-[600px] -right-32 w-[600px] h-[600px] bg-cyan-500/10 blur-[160px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] opacity-35"></div>
      </div>

      {/* 3. Left Sidebar */}
      <Sidebar workspaceId={workspaceId} isDark={true} />
      
      {/* 4. Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative bg-transparent">
        <TopNavbar workspaceId={workspaceId} isDark={true} />
        
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-5 scrollbar-hide relative z-10">
          <Outlet context={{ isDark: true }} />
        </main>
      </div>

    </div>
  );
}