import { useState, useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import CyberCanvas from '../../features/landing/CyberCanvas';
import { useTheme } from '../../context/ThemeContext';
import { getCurrentUser } from '../../utils/workspaceAccess';
import { startWorkspacePrefetch, cancelWorkspacePrefetch } from '../../utils/prefetchQueue';

export default function AppShell() {
  const { workspaceId } = useParams();
  const location = useLocation();
  const { isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const currentUser = getCurrentUser();
    const role = currentUser?.role || 'product_manager';

    // Priority 1: Current active page renders first and initiates its foreground requests.
    // Priority 2: In the background, preload and cache all other workspace routes for 0ms sidebar switching.
    const cancel = startWorkspacePrefetch(workspaceId, role, location.pathname);

    return () => {
      if (cancel) cancel();
      cancelWorkspacePrefetch();
    };
  }, [workspaceId]);

  return (
    <div className={`flex h-screen overflow-hidden font-sans relative transition-colors duration-200 ${
      isDark ? 'bg-[#04060d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    } selection:bg-[#7c3aed] selection:text-white`}>
      
      {/* 1. Atmospheric Ambient CyberCanvas Layer */}
      {isDark && <CyberCanvas />}

      {/* 2. Ambient Background Lighting */}
      {isDark ? (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 left-1/3 w-[900px] h-[400px] bg-gradient-to-b from-purple-600/15 via-blue-600/10 to-transparent blur-[140px]"></div>
          <div className="absolute top-[600px] -right-32 w-[600px] h-[600px] bg-cyan-500/10 blur-[160px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px] opacity-35"></div>
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 left-1/3 w-[900px] h-[400px] bg-gradient-to-b from-purple-200/40 via-blue-100/20 to-transparent blur-[140px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:32px_32px] opacity-60"></div>
        </div>
      )}

      {/* 3. Left Sidebar (Adaptive Drawer on Mobile/Tablet, Fixed on Desktop) */}
      <Sidebar 
        workspaceId={workspaceId} 
        isDark={isDark} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      {/* 4. Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative bg-transparent">
        <TopNavbar 
          workspaceId={workspaceId} 
          isDark={isDark} 
          onMenuToggle={() => setMobileOpen((prev) => !prev)}
        />
        
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 scrollbar-hide relative z-10">
          <Outlet context={{ isDark }} />
        </main>
      </div>

    </div>
  );
}