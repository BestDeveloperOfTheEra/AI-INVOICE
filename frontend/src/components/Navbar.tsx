'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/constants";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string>('Customer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payloadJSON = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadJSON);
        setRole(payload.role || 'Customer');
      } catch (e) {
        setRole('Customer'); // Failsafe
      }
    } else {
      setIsLoggedIn(false);
      setRole('Customer');
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    window.location.href = '/login'; // Hard redirect clears states securely
  };

  return (
    <nav className={`sticky top-0 z-50 w-full border-b backdrop-blur-md ${role === 'Admin' ? 'bg-red-950/20 border-red-500/20' : 'bg-black/50 border-white/10'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* BRANDING */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 whitespace-nowrap">
            <div>Auto<span className={role === 'Admin' ? 'text-red-500' : 'text-blue-500'}>Extract</span></div>
            {role === 'Admin' && (
              <span className="text-[10px] font-bold tracking-widest uppercase bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
                Admin
              </span>
            )}
          </Link>
        </div>

        {/* ADMIN EXCLUSIVE HEADER */}
        {role === 'Admin' ? (
          <div className="flex items-center gap-8">
            <Link href="/hq-command-center" className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider">
              Control Panel
            </Link>
            <button onClick={handleLogout} className="rounded-full bg-red-600/20 border border-red-500/30 px-5 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-600/40 hover:text-red-200">
              Sign Out
            </button>
          </div>
        ) : (
          /* STANDARD CUSTOMER HEADER */
          <>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <a href={`${API_URL.includes('localhost') ? API_URL.replace('/api', '') + '/docs' : API_URL.replace('/api', '') + '/api/docs'}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white transition-colors">Developers API</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              {!isLoggedIn ? (
                <>
                  <Link href="/login" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link href="/dashboard" className="rounded-full bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    Get Started
                  </Link>
                </>
              ) : (
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-all hover:bg-white/20">
                    My Account <span className="text-[10px] opacity-50">▼</span>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0a0a0a] border border-white/10 shadow-2xl p-2 hidden group-hover:block transition-all transform origin-top-right z-50 before:absolute before:-top-2 before:left-0 before:w-full before:h-2 before:content-['']">
                    <div className="px-3 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                      Menu Options
                    </div>

                    <Link href="/dashboard" className="block w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 rounded-lg mb-1 transition-colors">
                      User Dashboard
                    </Link>

                    <Link href="/dashboard/profile" className="block w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 rounded-lg mb-1 transition-colors">
                      Profile Settings
                    </Link>

                    <Link href="/dashboard/pricing" className="block w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 rounded-lg mb-1 transition-colors">
                      Subscription Plan
                    </Link>

                    <div className="h-px w-full bg-white/10 my-1"></div>

                    <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors mt-1">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* MOBILE DROPDOWN LINKS */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/90 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-4 gap-2">
            <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl">Features</Link>
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl">Pricing</Link>
            <a href={`${API_URL.includes('localhost') ? API_URL.replace('/api', '') + '/docs' : API_URL.replace('/api', '') + '/api/docs'}`} target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl">Developers API</a>
          </div>
        </div>
      )}
    </nav>
  );
}
