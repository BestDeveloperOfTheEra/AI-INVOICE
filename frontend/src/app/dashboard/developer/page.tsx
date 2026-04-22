'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { API_URL } from '@/lib/constants';

// --- Shared SVGs ---
const Icons = {
  Terminal: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  ),
  Key: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3-3.5 3.5z"/></svg>
  )
};

export default function DeveloperPage() {
  const { isLoading: isDashboardLoading } = useDashboard();
  const [apiTokens, setApiTokens] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const fetchApiTokens = async () => {
      const token = localStorage.getItem('access_token');
      try {
          const res = await fetch(`${API_URL}/api-tokens`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to fetch API tokens');
          const data = await res.json();
          if (Array.isArray(data)) {
              setApiTokens(data);
          } else {
              setApiTokens([]);
          }
      } catch (err) { 
          setApiTokens([]);
      }
  };

  useEffect(() => {
     fetchApiTokens();
  }, []);

  const createApiKey = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreatingKey(true);
      const token = localStorage.getItem('access_token');
      try {
          const res = await fetch(`${API_URL}/api-tokens`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({ name: newKeyName })
          });
          if (res.ok) {
              const data = await res.json();
              setCreatedToken(data.rawToken);
              setNewKeyName('');
              fetchApiTokens();
          }
      } catch (err) { console.error(err); } finally { setIsCreatingKey(false); }
  };

  const revokeApiKey = async (id: string) => {
      if (!confirm('Are you sure you want to revoke this API key? Applications using it will stop working.')) return;
      const token = localStorage.getItem('access_token');
      try {
          await fetch(`${API_URL}/api-tokens/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchApiTokens();
      } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-6 duration-700 pb-20">
        
        {/* API Authorization Management */}
        <div className="border border-[var(--border)] rounded-[3rem] p-12 transition-colors duration-500 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-blue-600/5 text-blue-500 rounded-2xl border border-blue-500/10">
                    <Icons.Key />
                </div>
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40">Neural Authorization</h3>
                    <p className="text-xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>API Interface Access</p>
                </div>
            </div>
            
            {createdToken && (
                <div className="mb-12 p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl animate-in zoom-in-95 duration-500">
                    <h4 className="text-blue-500 font-black text-sm uppercase tracking-widest mb-3 italic">Signature Generated!</h4>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-6">Security Protocol: This key will only be displayed once. Archive it now.</p>
                    <div className="flex items-center gap-4 border border-blue-500/20 p-5 rounded-2xl mb-6 shadow-inner" style={{ backgroundColor: 'var(--background)' }}>
                        <code className="flex-1 font-mono text-blue-500 text-sm break-all font-bold tracking-tight">{createdToken}</code>
                        <button onClick={() => { navigator.clipboard.writeText(createdToken); alert('Signature Captured!'); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">Copy</button>
                    </div>
                    <button onClick={() => setCreatedToken(null)} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:tracking-[0.2em] transition-all italic">Protocol Confirmed</button>
                </div>
            )}

            <div className="overflow-x-auto mb-10">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">IdentityTag</th>
                            <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Genesis</th>
                            <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Last Activity</th>
                            <th className="pb-6 px-4 text-right text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Protocol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {apiTokens.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-16 text-center text-[10px] font-black uppercase tracking-widest opacity-20 italic">No Active Signal Detected</td>
                            </tr>
                        ) : apiTokens.map(tk => (
                            <tr key={tk.id} className="group hover:bg-white/[0.01] transition-colors">
                                <td className="py-6 px-4 text-sm font-black tracking-tight uppercase" style={{ color: 'var(--foreground)' }}>{tk.name}</td>
                                <td className="py-6 px-4 text-[11px] font-bold opacity-40 italic">{new Date(tk.createdAt).toLocaleDateString()}</td>
                                <td className="py-6 px-4 text-[11px] font-bold opacity-40 italic">{tk.lastUsedAt ? new Date(tk.lastUsedAt).toLocaleString() : 'STANDBY'}</td>
                                <td className="py-6 px-4 text-right">
                                    <button onClick={() => revokeApiKey(tk.id)} className="text-red-500/40 group-hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all hover:tracking-[0.2em]">Revoke</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={createApiKey} className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-[var(--border)]">
                <input 
                    type="text" 
                    required
                    placeholder="KEY_ALIAS_PRODUCTION" 
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="flex-1 border border-[var(--border)] rounded-2xl p-5 text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 shadow-inner transition-all" 
                    style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
                <button type="submit" disabled={isCreatingKey} className="px-10 py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                    {isCreatingKey ? 'SIGNING...' : 'INITIATE KEY'}
                </button>
            </form>
        </div>

        {/* Integration Documentation */}
        <div className="border border-[var(--border)] rounded-[3rem] p-12 shadow-sm transition-colors duration-500" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center gap-4 mb-10 text-gray-500">
                <div className="p-3 bg-blue-600/5 text-blue-500 rounded-2xl border border-blue-500/10">
                    <Icons.Terminal />
                </div>
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40">Integration Protocol</h3>
                    <p className="text-xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>Neural Logic Documentation</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Production Pipeline</p>
                    </div>
                    <div className="relative group">
                        <pre className="p-6 rounded-[2rem] text-[11px] font-mono border border-[var(--border)] overflow-x-auto shadow-inner transition-colors group-hover:border-blue-500/20" style={{ backgroundColor: 'var(--background)', color: 'var(--accent)' }}>
{`curl -X POST ${API_URL}/documents/upload \\
  -H "x-api-key: YOUR_SIGNATURE" \\
  -F "file=@invoice.pdf"`}
                        </pre>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Neural Sandbox</p>
                    </div>
                    <div className="relative group">
                        <pre className="p-6 rounded-[2rem] text-[11px] font-mono border border-[var(--border)] overflow-x-auto shadow-inner transition-colors group-hover:border-blue-500/20" style={{ backgroundColor: 'var(--background)', color: 'var(--accent)' }}>
{`curl -X POST ${API_URL}/documents/upload \\
  -H "x-api-key: YOUR_SIGNATURE" \\
  -H "x-sandbox: true" \\
  -F "file=@test-invoice.pdf"`}
                        </pre>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 pt-10 border-t border-[var(--border)]">
                 <p className="text-[10px] font-medium uppercase tracking-widest leading-relaxed opacity-40 italic">
                    * Sandbox signals return realistic telemetry for verification cycles without depleting neural quota balance.
                 </p>
            </div>
        </div>
    </div>
  );
}
