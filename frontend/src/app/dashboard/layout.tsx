'use client';

import { useRouter, usePathname } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { credits, planName, profileName, avatarUrl, userEmail, isLoading } = useDashboard();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const menuItems = [
    { name: 'Extract', path: '/dashboard', id: 'dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    { name: 'History', path: '/dashboard/history', id: 'history', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { name: 'Usage', path: '/dashboard/stats', id: 'stats', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { name: 'Plan', path: '/dashboard/pricing', id: 'pricing', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { name: 'Dev Portal', path: '/dashboard/developer', id: 'developer', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
    { name: 'Profile', path: '/dashboard/profile', id: 'profile', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  const activeView = pathname.split('/').pop() || 'dashboard';
  const currentView = pathname === '/dashboard' ? 'dashboard' : activeView;

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-white min-h-screen bg-[#050505]">
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
        {/* Elite Minimal Sidebar */}
        <aside className="w-full lg:w-72 flex flex-row lg:flex-col gap-2 shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.04] pb-4 lg:pb-8 lg:pt-12 px-6 overflow-x-auto lg:overflow-visible no-scrollbar bg-[#020202]">
          <div className="hidden lg:flex items-center gap-4 px-4 mb-14 group cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Icons.Sparkles />
            </div>
            <span className="text-xl font-black text-white tracking-widest uppercase italic">AutoExtract</span>
          </div>

          <div className="flex flex-row lg:flex-col gap-2 w-full">
            <p className="hidden lg:block text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-4 mb-4">Core Navigation</p>
            {[
              { label: 'Intelligence', icon: <Icons.Dashboard />, path: '/dashboard' },
              { label: 'Neural Log', icon: <Icons.History />, path: '/dashboard/history' },
              { label: 'Scale Up', icon: <Icons.Pricing />, path: '/dashboard/pricing' },
              { label: 'Config', icon: <Icons.Settings />, path: '/dashboard/settings' },
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.label}
                  href={item.path}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                    isActive 
                    ? 'bg-white/[0.03] text-white border border-white/[0.05] shadow-inner' 
                    : 'text-gray-500 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  <div className={`transition-colors duration-300 ${isActive ? 'text-blue-500' : 'group-hover:text-blue-400'}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)]"></div>}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto hidden lg:flex flex-col gap-8 pt-10 border-t border-white/[0.04]">
             <div className="px-4">
                 <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Neural Quota</p>
                     <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md italic">{planName}</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden mb-4">
                     <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${Math.min(100, (credits/100)*100)}%` }}></div>
                 </div>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">{credits} / 100 Credits Loaded</p>
             </div>

             <div className="px-1 flex items-center gap-4 hover:bg-white/[0.02] p-3 rounded-2xl transition-colors cursor-pointer group pb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                      <Icons.User />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">{profileName || 'Main Admin'}</span>
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic group-hover:text-gray-400 transition-colors">Workspace Owner</span>
                  </div>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06] sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                  {menuItems.find(i => i.id === currentView)?.name || 'Extract'}
                </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-black text-blue-400">
                    {credits} Credits Left
                </span>
              </div>
              <Link href="/dashboard/pricing" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black transition-all shadow-[0_0_25px_rgba(37,99,235,0.25)]">
                Upgrade
              </Link>
              
              <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-white/[0.06]">
                  <div className="text-right">
                      <p className="text-sm font-bold text-white">{profileName || 'User'}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{planName}</p>
                  </div>
                  {avatarUrl ? (
                    <img src={`${API_URL}${avatarUrl}`} alt="Avatar" className="w-10 h-10 rounded-xl border border-white/10 object-cover bg-black" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg uppercase shadow-lg">
                      {profileName ? profileName.charAt(0) : 'U'}
                    </div>
                  )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-8">
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
