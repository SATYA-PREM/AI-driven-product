import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function AppShell() {
  const { workspaceId } = useParams();

  return (
    <div className="flex h-screen overflow-hidden font-sans relative bg-[#070910] text-slate-100">
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 bg-[radial-gradient(#1a2236_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

      {/* Sidebar */}
      <Sidebar workspaceId={workspaceId} isDark={true} />
      
      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative bg-[#070910]">
        <TopNavbar workspaceId={workspaceId} isDark={true} />
        
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-5 scrollbar-hide">
          <Outlet context={{ isDark: true }} />
        </main>
      </div>

    </div>
  );
}