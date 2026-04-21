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
    { name: 'Extract', path: '/dashboard', id: 'dashboard' },
    { name: 'History', path: '/dashboard/history', id: 'history' },
    { name: 'Usage', path: '/dashboard/stats', id: 'stats' },
    { name: 'Plan', path: '/dashboard/pricing', id: 'pricing' },
    { name: 'Dev Portal', path: '/dashboard/developer', id: 'developer' },
    { name: 'Profile', path: '/dashboard/profile', id: 'profile' },
  ];

  const activeView = pathname.split('/').pop() || 'dashboard';
  const currentView = pathname === '/dashboard' ? 'dashboard' : activeView;

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-white min-h-screen bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading AutoExtract...</p>
        </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans">
      <div className="flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-screen">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-72 flex flex-row lg:flex-col gap-1 lg:gap-2 shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06] pb-4 lg:pb-8 lg:pt-12 px-6 overflow-x-auto lg:overflow-visible no-scrollbar">
          <div className="hidden lg:flex items-center gap-3 px-4 mb-12">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">A</div>
            <span className="text-xl font-black tracking-tight">AutoExtract</span>
          </div>

          <div className="hidden lg:block px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Dashboard</div>
          
          {menuItems.map((item) => (
            <Link 
              key={item.id}
              href={item.path} 
              className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-tight ${currentView === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]' : 'text-gray-500 hover:bg-white/[0.03] hover:text-white'}`}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="lg:mt-auto pt-8 border-t border-white/[0.06]">
              <button onClick={handleLogout} className="w-full whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-bold">
                Logout
              </button>
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
