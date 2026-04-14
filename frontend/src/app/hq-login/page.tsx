'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:3001/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials or unauthorized access');
      }

      const data = await res.json();
      
      const payloadJSON = atob(data.access_token.split('.')[1]);
      const payload = JSON.parse(payloadJSON);
      if (payload.role !== 'Admin') {
          throw new Error("Access Denied. You do not have Administrative clearance.");
      }

      localStorage.setItem('access_token', data.access_token);
      router.push('/hq-command-center');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-24 min-h-[80vh]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-red-950/20 border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.1)] backdrop-blur-xl h-fit">
        <div className="flex justify-center mb-6">
           <span className="bg-red-500/20 text-red-500 font-bold tracking-[0.2em] px-4 py-1 text-xs rounded-full border border-red-500/30">RESTRICTED ZONE</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          Operations Portal
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Strictly for authorized administrative personnel only. All access is logged.
        </p>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Admin Clearance Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dataextract.com" 
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-red-500/10 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Master Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-red-500/10 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl bg-red-600 text-white font-bold tracking-wide hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            {loading ? 'Authenticating Signature...' : 'INITIATE SECURE LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

