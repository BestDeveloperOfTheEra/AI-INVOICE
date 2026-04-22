'use client';

import { useState, useRef } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { API_URL } from '@/lib/constants';

export default function ProfilePage() {
  const { profileName, setProfileName, avatarUrl, setAvatarUrl, userEmail, isLoading } = useDashboard();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ name: profileName })
      });
      if (res.ok) {
        alert('Profile updated successfully!');
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploadingAvatar(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatarUrl);
        alert('Profile image updated!');
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to upload image');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating avatar: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl border border-[var(--border)] rounded-3xl p-10 animate-in slide-in-from-bottom-6 duration-700 shadow-sm transition-colors" style={{ backgroundColor: 'var(--card)' }}>               
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-40">Profile Signature</h3>
        <div className="flex items-center gap-10">
          <div className="relative group">
            {avatarUrl ? (
                <img src={`${API_URL}${avatarUrl}`} alt="Avatar" className="w-28 h-28 rounded-3xl border border-[var(--border)] object-cover bg-[var(--background)] shadow-xl transition-transform group-hover:scale-105 duration-500" />
            ) : (
                <div className="w-28 h-28 rounded-3xl border border-[var(--border)] flex items-center justify-center text-4xl shadow-xl" style={{ backgroundColor: 'var(--background)' }}>👤</div>
            )}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full border-4 border-[var(--card)] flex items-center justify-center text-white text-[10px] font-bold shadow-lg">✓</div>
          </div>
          <div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept=".jpg,.jpeg,.png" />
            <button 
                onClick={() => avatarInputRef.current?.click()} 
                disabled={isUploadingAvatar} 
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {isUploadingAvatar ? 'Syncing...' : 'Binary Update'}
            </button>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-4 opacity-40">JPG, PNG allowed • Max 5MB Path</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8 border-t border-[var(--border)] pt-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-40">Personal Parameters</h3>
        
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Archive ID (Immutable)</label>
          <input 
            type="text" 
            defaultValue={userEmail} 
            disabled 
            className="w-full border border-[var(--border)] rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none cursor-not-allowed opacity-30" 
            style={{ backgroundColor: 'var(--background)' }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Profile Alias</label>
          <input 
            type="text" 
            value={profileName} 
            onChange={e => setProfileName(e.target.value)} 
            placeholder="e.g. CORE_ADMIN" 
            className="w-full border border-[var(--border)] rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all shadow-inner" 
            style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>

        <button 
            type="submit" 
            disabled={isSavingProfile} 
            className="mt-6 px-10 py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all self-start w-full sm:w-auto shadow-xl shadow-blue-500/20 active:scale-95"
        >
          {isSavingProfile ? 'Deploying...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
