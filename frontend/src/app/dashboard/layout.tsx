'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// --- Premium Shared Icons ---
const Icons = {
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  )
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { credits, planName, profileName, handleLogout, avatarUrl } = useDashboard();

  return (
    <div className="relative min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-blue-500/30" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Neural Web Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-mesh opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-blue-600/5 to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1700px] mx-auto min-h-screen">
        {/* Elite Unified Sidebar */}
        <aside className="w-full lg:w-80 lg:h-screen lg:sticky lg:top-0 flex flex-col shrink-0 border-r border-[var(--border)] py-16 px-8 z-20 overflow-y-auto no-scrollbar transition-colors duration-500" style={{ backgroundColor: 'var(--sidebar)' }}>
          <div className="flex items-center gap-4 mb-24 px-4 group cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Icons.Sparkles />
            </div>
            <span className="text-xl font-black tracking-widest uppercase italic" style={{ color: 'var(--foreground)' }}>AutoExtract</span>
          </div>

          <div className="flex flex-col gap-12 w-full flex-1">
            <div className="px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-10 px-6 opacity-40" style={{ color: 'var(--foreground)' }}>Menu</p>
                <div className="flex flex-col gap-3">
                    {[
                      { label: 'Extract Invoices', path: '/dashboard' },
                      { label: 'Invoice History', path: '/dashboard/history' },
                    ].map((item) => {
                      const isActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path);
                      return (
                        <Link 
                          key={item.label}
                          href={item.path}
                          className={`px-6 py-4 rounded-2xl text-[14px] font-medium transition-all duration-300 ${
                            isActive 
                            ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                            : 'opacity-50 hover:opacity-100 hover:bg-white/[0.03]'
                          }`}
                          style={{ color: isActive ? '' : 'var(--foreground)' }}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
            </div>

            <div className="px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-10 px-6 opacity-40" style={{ color: 'var(--foreground)' }}>Settings</p>
                <div className="flex flex-col gap-3">
                    {[
                      { label: 'Update Profile', path: '/dashboard/profile' },
                      { label: 'Developer Portal', path: '/dashboard/developer' },
                      { label: 'Subscription Plan', path: '/dashboard/pricing' },
                    ].map((item) => {
                      const isActive = pathname.startsWith(item.path);
                      return (
                        <Link 
                          key={item.label}
                          href={item.path}
                          className={`px-6 py-4 rounded-2xl text-[14px] font-medium transition-all duration-300 ${
                            isActive 
                            ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                            : 'opacity-50 hover:opacity-100 hover:bg-white/[0.03]'
                          }`}
                          style={{ color: isActive ? '' : 'var(--foreground)' }}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-8 pt-10 border-t border-[var(--border)] px-2">
             {/* Theme Switcher Toggle */}
             <div className="px-4">
                <button 
                  onClick={toggleTheme}
                  className="w-full h-14 flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-[var(--border)] hover:bg-white/[0.08] transition-all group overflow-hidden"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Mode</span>
                  <div className="flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border)]">
                      <div className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'opacity-30'}`}><Icons.Moon /></div>
                      <div className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-blue-600 text-white shadow-lg' : 'opacity-30'}`}><Icons.Sun /></div>
                  </div>
                </button>
             </div>

             <div className="px-4">
                 <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Neural Quota</p>
                     <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-md italic">{planName}</span>
                 </div>
                 <div className="w-full h-1 bg-white/[0.03] border border-[var(--border)] rounded-full overflow-hidden mb-4">
                     <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${Math.min(100, (credits/100)*100)}%` }}></div>
                 </div>
                 <p className="text-[9px] font-bold uppercase tracking-widest italic opacity-40">{credits} / 100 Credits Loaded</p>
             </div>

             <div className="flex items-center gap-4 p-4 rounded-[1.5rem] border border-transparent hover:border-[var(--border)] hover:bg-white/[0.02] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full rounded-2xl object-cover" /> : <Icons.User />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{profileName || 'Main Admin'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest italic opacity-40">Owner</span>
                  </div>
             </div>

             <button 
                onClick={handleLogout} 
                className="text-[10px] font-black hover:text-red-500 uppercase tracking-widest transition-all opacity-40 hover:opacity-100 flex items-center justify-center py-4 px-6 border border-[var(--border)] rounded-xl hover:bg-red-500/5 mt-4"
              >
                Logout Procedure
              </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-10 py-8 border-b border-[var(--border)] sticky top-0 z-50 transition-colors backdrop-blur-3xl" style={{ backgroundColor: 'var(--background)' }}>
            <div>
                <h1 className="text-[10px] font-black uppercase tracking-[0.5em] italic opacity-40">
                   {pathname === '/dashboard' ? 'Neural Workspace' : 
                    pathname.includes('history') ? 'Archive Stream' : 
                    pathname.includes('pricing') ? 'Financial Scaling' : 'Account Config'}
                </h1>
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
    <ThemeProvider>
      <DashboardProvider>
        <DashboardContent>{children}</DashboardProvider>
      </ThemeProvider>
    </ThemeProvider>
  );
}
