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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName })
      });
      if (res.ok) alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl bg-white/[0.02] border border-white/10 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-500">               
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Profile Image</h3>
        <div className="flex items-center gap-6">
          {avatarUrl ? (
            <img src={`${API_URL}${avatarUrl}`} alt="Avatar" className="w-24 h-24 rounded-full border border-white/20 object-cover bg-black" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl">👤</div>
          )}
          <div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept=".jpg,.jpeg,.png" />
            <button onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
              {isUploadingAvatar ? 'Uploading...' : 'Change Image'}
            </button>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG allowed. Max size of 5MB.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 border-t border-white/5 pt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal Details</h3>
        
        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Email Address (Cannot be changed)</label>
          <input type="text" defaultValue={userEmail} disabled className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-gray-400 outline-none cursor-not-allowed" />
        </div>

        <div>
          <label className="text-xs text-gray-500 font-semibold mb-1 block">Full Name</label>
          <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500" />
        </div>

        <button type="submit" disabled={isSavingProfile} className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors self-start w-full sm:w-auto">
          {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
        </button>
      </form>
    </div>
  );
}
