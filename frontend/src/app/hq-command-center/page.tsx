'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'roles'>('transactions');
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  
  // Available permissions for the checkbox UI
  const AVAILABLE_PERMISSIONS = [
    { id: 'manage_users', label: 'Manage Users (Ban, Change Roles)' },
    { id: 'manage_roles', label: 'Manage Roles' },
    { id: 'manage_plans', label: 'Manage Subscription Plans' },
    { id: 'view_reports', label: 'View Analytics & Reports' },
    { id: 'upload_invoice', label: 'Upload Invoices' },
    { id: 'export_data', label: 'Export Documents' },
  ];
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleUpdatePlan = async (e: React.FormEvent, planId: string) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          id: planId,
          name: (form.elements.namedItem('name') as HTMLInputElement).value,
          price: (form.elements.namedItem('price') as HTMLInputElement).value,
          quotaPages: (form.elements.namedItem('quota') as HTMLInputElement).value,
      };
      
      const token = localStorage.getItem('access_token');
      await fetch('http://127.0.0.1:3001/admin/update-plan', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(data)
      });
      fetchAdminMetrics(); // refresh data
  };

  const handleDeletePlan = async (planId: string) => {
      // ... existing plan code ...
      if (!confirm('WARNING: Are you sure you want to delete this subscription tier permanently? Proceeding may affect currently subscribed customers!')) return;
      const token = localStorage.getItem('access_token');
      try {
          const res = await fetch('http://127.0.0.1:3001/admin/delete-plan', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({ id: planId })
          });
          if (!res.ok) throw new Error("Deletion failed on backend");
      } catch (err: any) { alert(err.message); }
      fetchAdminMetrics();
  };

  const handleRoleAction = async (e: React.FormEvent, roleId?: string) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          name: (form.elements.namedItem('name') as HTMLInputElement).value,
          permissions: selectedPermissions.join(','),
      };
      
      const token = localStorage.getItem('access_token');
      const url = roleId ? `http://127.0.0.1:3001/admin/roles/${roleId}` : 'http://127.0.0.1:3001/admin/roles';
      const method = roleId ? 'PUT' : 'POST';

      await fetch(url, {
          method,
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(data)
      });
      setEditingRole(null);
      fetchAdminMetrics();
  };

  const handleDeleteRole = async (roleId: string) => {
      if (!confirm('Are you sure you want to delete this role?')) return;
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:3001/admin/roles/${roleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Deletion failed');
      }
      fetchAdminMetrics();
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:3001/admin/users/${userId}/block`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ isBlocked: !currentStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Block action failed');
      }
      fetchAdminMetrics();
  };

  const handleChangeRole = async (userId: string, newRoleId: string) => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:3001/admin/users/${userId}/role`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ roleId: newRoleId })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Role change failed');
      }
      fetchAdminMetrics();
  };

  const fetchAdminMetrics = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
        router.push('/hq-login');
        return;
    }

    try {
        const res = await fetch('http://127.0.0.1:3001/admin/metrics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 403) {
            setError("Access Denied. You are currently logged in as a 'Customer'.");
            setIsLoading(false);
            return;
        }

        if (!res.ok) throw new Error("Failed to load admin panel.");
        
        const data = await res.json();

        // Also fetch Users and Roles if user has permission
        try {
            const [rolesRes, usersRes] = await Promise.all([
                fetch('http://127.0.0.1:3001/admin/roles', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://127.0.0.1:3001/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (e) {
            console.error("Failed to load secondary data", e);
        }

        setMetrics(data);
        setError(null);
    } catch(err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  if (isLoading) return <div className="text-white flex items-center justify-center min-h-[50vh]">Securing Admin Context...</div>;

  return (
    <div className="pt-24 px-6 max-w-6xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Control Panel</h1>
            <p className="text-gray-400">Manage user quotas, security policies, and application scaling.</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors">
            Exit Admin View
        </button>
      </div>

      {error && !metrics ? (
        <div className="max-w-xl mx-auto mt-20 text-center p-8 bg-red-500/10 border border-red-500/30 rounded-3xl animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Security Breach Blocked</h2>
            <p className="text-gray-300 mb-8">{error}</p>
        </div>
      ) : metrics && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="grid md:grid-cols-[1fr_2fr] gap-6 mb-12">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
                <div className="mb-4">
                   <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Internal Records</h3>
                   <div className="text-5xl font-bold text-white">{metrics.totalUsers} <span className="text-lg text-gray-600 font-medium tracking-normal lowercase">Users</span></div>
                </div>
                <div className="pt-4 border-t border-white/5">
                   <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Compute Volume</h3>
                   <div className="text-5xl font-bold text-blue-400">{metrics.totalInvoicesProcessed} <span className="text-lg text-blue-900/50 font-medium tracking-normal lowercase">Passes</span></div>
                </div>
            </div>

            {/* The Accounting Ledger System */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 shadow-2xl hover:border-emerald-500/30 transition-colors">
               <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Real-Time Financial Accounting</h3>
                  <div className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">AUTOMATED AUDITOR</div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">Paid Orders</p>
                      <p className="text-2xl font-bold text-white">{metrics.accounting?.runningOrders || 0}</p>
                  </div>
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">Gross Revenue</p>
                      <p className="text-2xl font-bold text-white">${metrics.accounting?.grossRevenue || 0}</p>
                  </div>
                  <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                      <p className="text-xs text-orange-500/80 font-bold uppercase mb-1">Stripe Fees</p>
                      <p className="text-2xl font-bold text-orange-400">-${metrics.accounting?.gatewayFees || 0}</p>
                  </div>
                  <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                      <p className="text-xs text-yellow-500/80 font-bold uppercase mb-1">Tax Offset (20%)</p>
                      <p className="text-2xl font-bold text-yellow-400">-${metrics.accounting?.taxReserved || 0}</p>
                  </div>
                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                      <p className="text-xs text-red-500/80 font-bold uppercase mb-1">AI Processor Compute</p>
                      <p className="text-2xl font-bold text-red-400">-${metrics.accounting?.aiComputeCosts || 0}</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.1)]">
                      <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1 tracking-wider">Actual Net Profit</p>
                      <p className="text-3xl font-bold text-emerald-400">${metrics.accounting?.netProfit || 0}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">System Auditing Logs</h2>
              <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                  <button onClick={() => setActiveTab('transactions')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'transactions' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
                      Transaction Ledger
                  </button>
                  <button onClick={() => setActiveTab('users')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
                      Customer Activity
                  </button>
                  <button onClick={() => setActiveTab('roles')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
                      Security Roles
                  </button>
              </div>
          </div>
          
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
             <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-400">
                        {activeTab === 'users' ? (
                            <>
                                <th className="px-6 py-4">User Account ID</th>
                                <th className="px-6 py-4">Assigned Role Privilege</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </>
                        ) : activeTab === 'roles' ? (
                            <>
                                <th className="px-6 py-4">Role Name</th>
                                <th className="px-6 py-4">Permissions Pipeline</th>
                                <th className="px-6 py-4 text-center">Total Users</th>
                                <th className="px-6 py-4 text-right">Controls</th>
                            </>
                        ) : (
                            <>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {activeTab === 'users' && users?.map((u: any, i: number) => (
                        <tr key={'fu'+i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                            <td className="px-6 py-4">
                                <select 
                                   value={u.roleId} 
                                   onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                   className="bg-black border border-white/10 rounded-md text-xs px-2 py-1 text-white focus:border-blue-500 outline-none"
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold border ${u.isBlocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                    {u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {u.role?.name !== 'Admin' && (
                                    <button onClick={() => handleToggleBlock(u.id, u.isBlocked)} className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${u.isBlocked ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
                                        {u.isBlocked ? 'Unban User' : 'Ban User'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {activeTab === 'roles' && roles?.map((r: any, i: number) => (
                        <tr key={'rr'+i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 text-white font-medium">
                                {r.name}
                                {r.name === 'Admin' && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">SYSTEM</span>}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-gray-400 max-w-xs truncate" title={r.permissions}>
                                {r.permissions ? r.permissions.split(',').join(', ') : '-'}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-400 font-medium">
                                {r._count?.users || 0}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => {
                                    setEditingRole(r.id);
                                    setSelectedPermissions(r.permissions ? r.permissions.split(',') : []);
                                }} className="text-xs text-blue-400 hover:text-blue-300 font-medium mr-4 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                {r.name !== 'Admin' && r.name !== 'Customer' && (
                                    <button onClick={() => handleDeleteRole(r.id)} className="text-xs text-red-400 hover:text-red-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {activeTab === 'transactions' && metrics.recentOrders?.map((o: any, i: number) => (
                        <tr key={'o'+i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-mono text-gray-500">{o.txId}</td>
                            <td className="px-6 py-4 text-white font-medium">{o.email}</td>
                            <td className="px-6 py-4 text-emerald-400 font-medium">${o.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-xs px-2 py-1 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {o.status.toUpperCase()}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {activeTab === 'transactions' && (!metrics.recentOrders || metrics.recentOrders.length === 0) && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No verifiable transactions recorded yet.</td></tr>
                    )}
                </tbody>
             </table>
             {(activeTab === 'roles') && (
                 <div className="p-6 bg-black/30 border-t border-white/5">
                     <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{editingRole ? 'Update Security Role' : 'Create New Security Role'}</h3>
                     <form onSubmit={(e) => handleRoleAction(e, editingRole || undefined)} className="flex flex-col gap-4">
                         <div className="flex items-end gap-4">
                             <div className="flex-1">
                                 <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Role Name</label>
                                 <input name="name" defaultValue={roles.find(r => r.id === editingRole)?.name || ''} placeholder="e.g. Auditor" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500" required />
                             </div>
                             <div className="flex gap-2">
                                 <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                                     {editingRole ? 'Update Configuration' : 'Deploy Role'}
                                 </button>
                                 {editingRole && <button type="button" onClick={() => { setEditingRole(null); setSelectedPermissions([]); }} className="text-gray-400 font-medium py-2 px-4 hover:text-white transition-colors border border-white/10 rounded-lg">Cancel</button>}
                             </div>
                         </div>
                         <div>
                             <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Assign Permissions</label>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                 {AVAILABLE_PERMISSIONS.map(perm => (
                                     <label key={perm.id} className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPermissions.includes(perm.id) ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                         <input 
                                             type="checkbox" 
                                             className="mt-1"
                                             checked={selectedPermissions.includes(perm.id)}
                                             onChange={(e) => {
                                                 if (e.target.checked) setSelectedPermissions([...selectedPermissions, perm.id]);
                                                 else setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                                             }}
                                         />
                                         <span className="text-xs text-gray-300 font-medium leading-snug">{perm.label}</span>
                                     </label>
                                 ))}
                             </div>
                         </div>
                     </form>
                 </div>
             )}
          </div>
          <div className="mt-16 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-6">Active Subscription Tiers</h2>
              <button 
                onClick={() => {
                  setEditingRole('');
                  setSelectedPermissions([]);
                  setActiveTab('roles');
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }} 
                className={`px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-white uppercase hover:bg-white/10 transition-colors ${activeTab === 'roles' ? '' : 'hidden'}`}
              >
                  + Create New Role
              </button>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
             {metrics.plans?.map((plan: any) => (
                 <form key={plan.id} onSubmit={(e) => handleUpdatePlan(e, plan.id)} className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col gap-4">
                     <input name="name" defaultValue={plan.name} className="bg-black/50 border border-white/10 rounded-lg p-2 text-white font-medium focus:border-blue-500 outline-none" />
                     <div className="flex gap-4">
                         <div className="flex-1">
                             <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Monthly Price ($)</label>
                             <input name="price" defaultValue={plan.price} type="number" step="0.01" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none" />
                         </div>
                         <div className="flex-1">
                             <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Upload Quota</label>
                             <input name="quota" defaultValue={plan.quotaPages} type="number" className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none" />
                         </div>
                     </div>
                     <div className="flex gap-4 mt-2">
                       <button type="submit" className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-medium py-2 rounded-lg border border-blue-500/20 transition-colors">
                           Save Configuration
                       </button>
                       <button type="button" onClick={() => handleDeletePlan(plan.id)} className="px-6 bg-red-600/20 hover:bg-red-600/40 text-red-500 font-medium py-2 rounded-lg border border-red-500/20 transition-colors">
                           Delete Plan
                       </button>
                     </div>
                 </form>
             ))}
                 <form onSubmit={(e) => { handleUpdatePlan(e, 'NEW'); (e.target as HTMLFormElement).reset(); }} className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col gap-4">
                     <input name="name" placeholder="e.g. Enterprise Plan" className="bg-black/50 border border-emerald-500/20 rounded-lg p-2 text-emerald-100 placeholder:text-emerald-700 font-medium focus:border-emerald-500 outline-none" required />
                     <div className="flex gap-4">
                         <div className="flex-1">
                             <label className="text-xs text-emerald-600/70 uppercase tracking-wider block mb-1">Monthly Price ($)</label>
                             <input name="price" placeholder="99.00" type="number" step="0.01" className="w-full bg-black/50 border border-emerald-500/20 rounded-lg p-2 text-emerald-100 focus:border-emerald-500 outline-none" required />
                         </div>
                         <div className="flex-1">
                             <label className="text-xs text-emerald-600/70 uppercase tracking-wider block mb-1">Upload Quota</label>
                             <input name="quota" placeholder="5000" type="number" className="w-full bg-black/50 border border-emerald-500/20 rounded-lg p-2 text-emerald-100 focus:border-emerald-500 outline-none" required />
                         </div>
                     </div>
                     <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-2">
                         + Deploy New Subscription Tier
                     </button>
                 </form>
          </div>
        </div>
      )}
    </div>
  );
}
