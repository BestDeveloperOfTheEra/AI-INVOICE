'use client';

import { useRouter, usePathname } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';

// --- Premium Inline SVGs for Layout ---
const Icons = {
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  ),
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Pricing: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { credits, planName, profileName, avatarUrl, userEmail, isLoading } = useDashboard();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const menuItems = [
    { name: 'Extract', path: '/dashboard', id: 'dashboard' },
    { name: 'History', path: '/dashboard/history', id: 'history' },
    { name: 'Plan', path: '/dashboard/pricing', id: 'pricing' },
    { name: 'Config', path: '/dashboard/settings', id: 'settings' },
  ];

  const activeView = pathname.split('/').pop() || 'dashboard';
  const currentView = pathname === '/dashboard' ? 'dashboard' : activeView;

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-white min-h-screen bg-[#020202]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Loading AutoExtract...</p>
        </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 font-sans relative overflow-x-hidden">
      {/* Premium Background Layering (Refined for Clarity) */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.05)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(99,102,241,0.03)_0%,transparent_40%)]"></div>
          <div className="absolute inset-0 opacity-[0.015] contrast-125 brightness-100" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-screen">
        {/* Elite Fixed Sidebar */}
        <aside className="w-full lg:w-80 lg:h-screen lg:sticky lg:top-0 flex flex-col shrink-0 border-r border-white/[0.04] bg-[#020202] py-16 px-10 z-20 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-4 mb-24 group cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Icons.Sparkles />
            </div>
            <span className="text-xl font-black text-white tracking-widest uppercase italic">AutoExtract</span>
          </div>

          <div className="flex flex-col gap-16 w-full flex-1">
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-10 opacity-80">Menu</p>
                <div className="flex flex-col gap-8">
                    {[
                      { label: 'Extract Invoices', path: '/dashboard' },
                      { label: 'Invoice History', path: '/dashboard/history' },
                    ].map((item) => {
                      const isActive = pathname === item.path;
                      return (
                        <Link 
                          key={item.label}
                          href={item.path}
                          className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                            isActive 
                            ? 'text-blue-500' 
                            : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
            </div>

            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-10 opacity-80">Settings</p>
                <div className="flex flex-col gap-10">
                    {[
                      { label: 'Update Profile', path: '/dashboard/profile' },
                      { label: 'Developer Portal', path: '/dashboard/developer' },
                      { label: 'Subscription Plan', path: '/dashboard/pricing' },
                    ].map((item) => {
                      const isActive = pathname === item.path;
                      return (
                        <Link 
                          key={item.label}
                          href={item.path}
                          className={`px-6 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                            isActive 
                            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)]' 
                            : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-10 pt-16 border-t border-white/[0.04]">
             <div className="px-2">
                 <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-80">Neural Quota</p>
                     <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-md italic">{planName}</span>
                 </div>
                 <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden mb-4">
                     <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${Math.min(100, (credits/100)*100)}%` }}></div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic opacity-60">{credits} / 100 Credits Loaded</p>
             </div>

             <div className="flex items-center gap-4 hover:bg-white/[0.02] p-4 rounded-3xl transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-all">
                      <Icons.User />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">{profileName || 'Main Admin'}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic opacity-60 group-hover:text-gray-400 transition-colors">Workspace Owner</span>
                  </div>
             </div>
          </div>
        </aside>

        {/* Content Area (Elastic Fitness) */}
        <div className="flex-1 flex flex-col bg-transparent min-w-0">
          <header className="flex items-center justify-between px-10 py-8 border-b border-white/[0.03] sticky top-0 bg-[#020202]/50 backdrop-blur-3xl z-50">
            <div>
                <h1 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] italic opacity-60">
                   {pathname === '/dashboard' ? 'Neural Workspace' : 
                    pathname.includes('history') ? 'Archive Stream' : 
                    pathname.includes('pricing') ? 'Financial Scaling' : 'Account Config'}
                </h1>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 px-5 py-2 bg-blue-600/5 border border-blue-500/10 rounded-full shadow-inner">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]"></span>
                <span className="text-xs font-black text-blue-500/80 uppercase tracking-widest">
                    {credits} / 100 Credits Loaded
                </span>
              </div>
              <button onClick={handleLogout} className="text-[10px] font-black text-gray-500 hover:text-red-500 uppercase tracking-widest transition-all">Logout</button>
            </div>
          </header>

          <main className="flex-1 p-10 overflow-x-hidden no-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
