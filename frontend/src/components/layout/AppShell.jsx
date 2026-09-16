import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function AppShell() {
  const { workspaceId } = useParams();

  return (
    <div className="flex h-screen overflow-hidden font-sans relative bg-[#070910] text-slate-100">
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 bg-[radial-gradient(#1a2236_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

      {/* Fixed Sidebar */}
      <Sidebar workspaceId={workspaceId} isDark={true} />
      
      {/* Content wrapper with Fixed TopNavbar across all tab pages */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative bg-[#070910]">
        
        {/* Fixed / Sticky Top Bar for ALL Pages */}
        <TopNavbar workspaceId={workspaceId} isDark={true} />
        
        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 scrollbar-hide">
          <Outlet context={{ isDark: true }} />
        </main>

      </div>

    </div>
  );
}