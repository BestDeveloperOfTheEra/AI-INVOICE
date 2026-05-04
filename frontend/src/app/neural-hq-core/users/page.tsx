'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch registry');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
      try {
          const token = localStorage.getItem('access_token');
          await fetch(`${API_URL}/admin/users/${userId}/block`, {
              method: 'PUT',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ isBlocked: !currentStatus })
          });
          fetchUsers();
      } catch (err) {
          console.error(err);
      }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-2xl border border-white/[0.05]"></div>)}
  </div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] border border-white/[0.05] p-8 rounded-[2.5rem]">
         <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">Customer Base</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Neural Entity Registry</p>
         </div>
         <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-40 group-focus-within:text-purple-500 transition-colors">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
               type="text" 
               placeholder="Search Neural Identities..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-14 pr-10 py-4 bg-black/20 border border-white/[0.08] rounded-2xl focus:border-purple-500 focus:outline-none w-full md:w-96 text-xs font-black uppercase tracking-widest transition-all"
            />
         </div>
      </div>

      <div className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl overflow-x-auto custom-scrollbar">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-white/[0.03]">
                  {['Entity Identity', 'Status', 'Module Logic', 'History', 'Joined Stream', 'Operations'].map(h => (
                     <th key={h} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 border-b border-[var(--border)]">{h}</th>
                  ))}
               </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
               {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-purple-600/[0.02] transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-purple-600/5 border border-purple-500/10 flex items-center justify-center text-purple-500">
                              {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-2xl object-cover" /> : <span className="font-black">{user.email[0].toUpperCase()}</span>}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black uppercase tracking-tight leading-tight">{user.name || 'Anonymous Operator'}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{user.email}</span>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.isBlocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`}></div>
                           {user.isBlocked ? 'Blocked' : 'Active'}
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/10">{user.role.name}</span>
                     </td>
                     <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-tight opacity-40">
                        {new Date(user.createdAt).toLocaleDateString('en-GB')}
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => handleBlockToggle(user.id, user.isBlocked)}
                             className={`p-3 rounded-xl border transition-all ${user.isBlocked ? 'bg-green-500/5 border-green-500/20 text-green-500 hover:bg-green-500/10' : 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10'}`}
                           >
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
