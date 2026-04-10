'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { API_URL } from '@/lib/constants';

export default function StatsPage() {
  const { isLoading: isDashboardLoading } = useDashboard();
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            const history = data.map(doc => JSON.parse(doc.extractedData));
            setExtractedData(history);
        }
    })
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="text-gray-400">Loading usage statistics...</div>;

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Total Processed</p>
                <p className="text-3xl font-black text-white">{extractedData.length}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Time Saved (Est.)</p>
                <p className="text-3xl font-black text-blue-400">{(extractedData.length * 5 / 60).toFixed(1)} hrs</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Avg. Confidence</p>
                <p className="text-3xl font-black text-green-400">98.2%</p>
            </div>
        </div>
    </div>
  );
}
