'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

const Icons = {
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  FileText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  ),
  ShoppingCart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
  ),
  Layout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  )
};

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { userRole, profileName, handleLogout, isLoading } = useDashboard();

  useEffect(() => {
    if (!isLoading && userRole !== 'Admin' && pathname !== '/neural-hq-core/login') {
      router.push('/dashboard');
    }
  }, [userRole, isLoading, router, pathname]);

  if (pathname === '/neural-hq-core/login') return <>{children}</>;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
       <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-500/50 animate-pulse">Initializing Neural HQ</p>
       </div>
    </div>
  );

  if (userRole !== 'Admin') return null;

  return (
    <div className="relative min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-purple-500/30" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-purple-600/5 to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-screen">
        <aside className="w-full lg:w-64 lg:h-screen lg:sticky lg:top-0 flex flex-col shrink-0 border-r border-[var(--border)] py-10 px-6 z-20 overflow-y-auto no-scrollbar transition-colors duration-500" style={{ backgroundColor: 'var(--sidebar)' }}>
          <div className="flex items-center gap-4 mb-16 px-4 group cursor-pointer" onClick={() => router.push('/neural-hq-core')}>
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform duration-500">
              <Icons.Sparkles />
            </div>
            <span className="text-xl font-black tracking-widest uppercase italic" style={{ color: 'var(--foreground)' }}>Admin</span>
          </div>

          <div className="flex flex-col gap-8 w-full flex-1">
            <div className="px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-6 text-purple-500/50">Control Center</p>
                <div className="flex flex-col gap-2">
                    {[
                      { label: 'Metrics Overview', path: '/neural-hq-core', icon: Icons.Layout },
                      { label: 'Customer Base', path: '/neural-hq-core/users', icon: Icons.Users },
                      { label: 'System Invoices', path: '/neural-hq-core/invoices', icon: Icons.FileText },
                      { label: 'Order History', path: '/neural-hq-core/orders', icon: Icons.ShoppingCart },
                    ].map((item) => {
                      const isActive = item.path === '/neural-hq-core' ? pathname === '/neural-hq-core' : pathname.startsWith(item.path);
                      return (
                        <Link 
                          key={item.label}
                          href={item.path}
                          className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${
                            isActive 
                            ? 'bg-purple-600/10 text-purple-500 border border-purple-500/20 shadow-lg shadow-purple-500/5' 
                            : 'opacity-40 hover:opacity-100 hover:bg-white/[0.03]'
                          }`}
                        >
                          <item.icon />
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
            </div>

            <div className="px-2 mt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-6 text-gray-500">System</p>
                <Link href="/dashboard" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-white/[0.03] transition-all">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                   User Workspace
                </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-8 pt-10 border-t border-[var(--border)] px-2">
             <div className="px-4">
                <button 
                  onClick={toggleTheme}
                  className="w-full h-14 flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-[var(--border)] hover:bg-white/[0.08] transition-all group overflow-hidden"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Mode</span>
                  <div className="flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border)]">
                      <div className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-purple-600 text-white shadow-lg' : 'opacity-30'}`}><Icons.Moon /></div>
                      <div className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-purple-600 text-white shadow-lg' : 'opacity-30'}`}><Icons.Sun /></div>
                  </div>
                </button>
             </div>

             <div className="flex items-center gap-4 p-4 rounded-[1.5rem] border border-transparent hover:border-[var(--border)] hover:bg-white/[0.02] transition-all cursor-pointer group" onClick={() => router.push('/dashboard/profile')}>
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-[10px] font-black">AD</div>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{profileName || 'SuperAdmin'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest italic text-purple-500">Control Operator</span>
                  </div>
             </div>

             <button 
                onClick={handleLogout} 
                className="text-[10px] font-black hover:text-red-500 uppercase tracking-widest transition-all opacity-40 hover:opacity-100 flex items-center justify-center py-4 px-6 border border-[var(--border)] rounded-xl hover:bg-red-500/5 mt-4"
              >
                Terminate Session
              </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)] sticky top-0 z-50 transition-colors backdrop-blur-3xl" style={{ backgroundColor: 'var(--background)' }}>
            <div>
                <h1 className="text-[10px] font-black uppercase tracking-[0.5em] italic text-purple-500">
                   {pathname === '/neural-hq-core' ? 'Strategic Metrics' : 
                    pathname.includes('users') ? 'Customer Intelligence' : 
                    pathname.includes('invoices') ? 'System Log Stream' : 'Order Distribution'}
                </h1>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-x-hidden no-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <AdminContent>{children}</AdminContent>
    </DashboardProvider>
  );
}
