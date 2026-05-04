'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/constants';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Unauthorized Access: Invalid Admin Credentials');
      }

      const data = await res.json();
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));

      if (payload.role !== 'Admin') {
        throw new Error('Access Denied: This portal is reserved for System Administrators.');
      }

      localStorage.setItem('access_token', data.access_token);
      router.push('/neural-hq-core');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 selection:bg-purple-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#0a0a0a] border border-white/[0.05] rounded-[2rem] p-10 shadow-2xl overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
           
           <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] mb-6">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white mb-2">Neural HQ Portal</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-500/50">Authorized Personnel Only</p>
           </div>

           {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-500 text-center leading-relaxed">{error}</p>
              </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 px-4">Operator Email</label>
                 <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-4 text-xs font-black uppercase tracking-widest text-white focus:border-purple-500 focus:outline-none transition-all placeholder:opacity-20"
                    placeholder="ADMIN_IDENTIFIER"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 px-4">Access Key</label>
                 <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-4 text-xs font-black uppercase tracking-widest text-white focus:border-purple-500 focus:outline-none transition-all placeholder:opacity-20"
                    placeholder="••••••••••••"
                 />
              </div>

              <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-purple-600 hover:bg-purple-50 hover:text-purple-900 text-white font-black uppercase tracking-[0.3em] py-5 rounded-xl transition-all duration-500 shadow-xl shadow-purple-900/20 disabled:opacity-50 text-[11px]"
              >
                 {loading ? 'Decrypting...' : 'Initialize Session'}
              </button>
           </form>

           <div className="mt-10 flex items-center justify-center gap-4">
              <div className="h-px bg-white/5 flex-1"></div>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Secure Ledger v4.0</span>
              <div className="h-px bg-white/5 flex-1"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
