'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { API_URL } from '@/lib/constants';

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
          const data = await res.json();
          setApiTokens(data);
      } catch (err) { console.error(err); }
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
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Your API Keys</h3>
            
            {createdToken && (
                <div className="mb-8 p-6 bg-blue-600/20 border border-blue-500/30 rounded-xl">
                    <h4 className="text-blue-400 font-bold mb-2">New API Key Created!</h4>
                    <p className="text-gray-300 text-sm mb-4">Copy this key now. For security, we won't show it again.</p>
                    <div className="flex items-center gap-3 bg-black p-4 rounded-lg border border-white/10 mb-4">
                        <code className="text-white font-mono break-all">{createdToken}</code>
                        <button onClick={() => { navigator.clipboard.writeText(createdToken); alert('Copied!'); }} className="shrink-0 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors">Copy</button>
                    </div>
                    <button onClick={() => setCreatedToken(null)} className="text-blue-400 text-sm font-medium hover:underline">I have saved it</button>
                </div>
            )}

            <div className="overflow-x-auto mb-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                            <th className="pb-3 px-4">Name</th>
                            <th className="pb-3 px-4">Created At</th>
                            <th className="pb-3 px-4">Last Used</th>
                            <th className="pb-3 px-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apiTokens.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-600 text-sm italic">No active API keys found.</td>
                            </tr>
                        ) : apiTokens.map(tk => (
                            <tr key={tk.id} className="border-b border-white/5 text-sm">
                                <td className="py-4 px-4 text-white font-medium">{tk.name}</td>
                                <td className="py-4 px-4 text-gray-400">{new Date(tk.createdAt).toLocaleDateString()}</td>
                                <td className="py-4 px-4 text-gray-400">{tk.lastUsedAt ? new Date(tk.lastUsedAt).toLocaleString() : 'Never used'}</td>
                                <td className="py-4 px-4 text-right underline decoration-indigo-200">
                                    <button onClick={() => revokeApiKey(tk.id)} className="text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={createApiKey} className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
                <input 
                    type="text" 
                    required
                    placeholder="Key Name (e.g. Production Mobile App)" 
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500 text-sm" 
                />
                <button type="submit" disabled={isCreatingKey} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors shadow-lg">
                    {isCreatingKey ? 'Generating...' : 'Generate New Key'}
                </button>
            </form>
        </div>

        <div className="bg-black border border-white/10 rounded-2xl p-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">API Documentation</h3>
            
            <div className="space-y-6">
                <div>
                    <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Production Mode (Deducts Credits)
                    </p>
                    <pre className="p-4 bg-gray-950 rounded-xl text-xs text-blue-300 font-mono overflow-x-auto border border-white/5">
{`curl -X POST ${API_URL}/documents/upload \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "file=@invoice.pdf"`}
                    </pre>
                </div>

                <div>
                    <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Sandbox Mode (Free Testing)
                    </p>
                    <pre className="p-4 bg-gray-950 rounded-xl text-xs text-blue-300 font-mono overflow-x-auto border border-white/5">
{`curl -X POST ${API_URL}/documents/upload \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "x-sandbox: true" \\
  -F "file=@test-invoice.pdf"`}
                    </pre>
                    <p className="mt-2 text-[10px] text-gray-500 leading-relaxed italic">
                        * Sandbox mode returns realistic mock data for integration testing without charging your account balance.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
