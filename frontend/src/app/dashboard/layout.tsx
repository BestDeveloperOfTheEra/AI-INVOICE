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

  const activeView = pathname.split('/').pop() || 'dashboard';
  const currentView = pathname === '/dashboard' ? 'dashboard' : activeView;

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-white min-h-screen bg-black">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 gap-6 lg:gap-8 min-h-screen">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 flex flex-row lg:flex-col gap-1 lg:gap-2 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-8 overflow-x-auto lg:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="hidden lg:block px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</div>
          <Link href="/dashboard" className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-colors text-sm lg:text-base ${currentView === 'dashboard' ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            Extract
          </Link>
          <Link href="/dashboard/history" className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-colors text-sm lg:text-base ${currentView === 'history' ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            History
          </Link>
          
          <div className="hidden lg:block px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Settings</div>
          <Link href="/dashboard/profile" className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-colors text-sm lg:text-base ${currentView === 'profile' ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            Profile
          </Link>
          <Link href="/dashboard/developer" className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-colors text-sm lg:text-base ${currentView === 'developer' ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            Dev Portal
          </Link>
          <Link href="/dashboard/pricing" className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-colors text-sm lg:text-base ${currentView === 'pricing' ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            Plan
          </Link>
          <Link href="/dashboard/stats" className={`whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl transition-colors text-sm lg:text-base ${currentView === 'stats' ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            Usage
          </Link>
          <button onClick={handleLogout} className="whitespace-nowrap lg:whitespace-normal text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors lg:mt-auto">
            Logout
          </button>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          <header className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={`${API_URL}${avatarUrl}`} alt="Avatar" className="w-12 h-12 rounded-full border border-white/20 object-cover bg-black" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xl uppercase">
                  {profileName ? profileName.charAt(0) : userEmail ? userEmail.charAt(0) : 'U'}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white uppercase tracking-tight">
                  {currentView === 'profile' ? 'Profile Settings' : 
                   currentView === 'developer' ? 'Developer Portal' :
                   currentView === 'pricing' ? 'Subscription Plans' : 
                   currentView === 'stats' ? 'Usage Statistics' :
                   currentView === 'history' ? 'Extraction History' :
                   'Extract Invoices'}
                </h1>
                {profileName && <p className="text-gray-400 text-sm">Welcome back, <span className="text-gray-200 font-medium">{profileName}</span></p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium px-3 py-1 rounded-full border ${credits > 0 ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'}`}>
                {planName} ({credits} credits left)
              </span>
              <Link href="/dashboard/pricing" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                Upgrade
              </Link>
            </div>
          </header>

          <main className="flex-1">
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
