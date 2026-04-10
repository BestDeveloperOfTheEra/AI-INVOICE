'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { PDFDocument } from 'pdf-lib';
import { API_URL } from '@/lib/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { credits, refreshUserData } = useDashboard();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isInsufficient, setIsInsufficient] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [totalCreditsRequired, setTotalCreditsRequired] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    let totalPages = 0;
    setIsUploading(true);
    
    try {
        for (const file of files) {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                totalPages += pdfDoc.getPageCount();
            } else {
                totalPages += 1;
            }
        }
        
        setPendingFiles(files);
        setTotalCreditsRequired(totalPages);

        if (totalPages > credits) {
            setIsInsufficient(true);
        } else if (files.length <= 4) {
            await processUploadsManual(files, totalPages);
        } else {
            setIsConfirming(true);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to read file pages.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processUploadsManual = async (files: File[], totalReq: number) => {
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const token = localStorage.getItem('access_token');
    const isSandbox = localStorage.getItem('is_sandbox') === 'true';

    try {
        for (let i = 0; i < files.length; i++) {
            // First file update to 0% with loader
            setUploadProgress({ current: i, total: files.length });
            
            const file = files[i];
            const formData = new FormData();
            formData.append('files', file);

            const res = await fetch(`${API_URL}/documents/upload`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'x-sandbox': isSandbox ? 'true' : 'false'
              },
              body: formData
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => null);
              throw new Error(errData?.message || "Upload failed.");
            }

            const data = await res.json();
            // Data is an array of results from the backend loop
            const result = Array.isArray(data) ? data[0] : data;
            
            if (result && result.status === 'failed') {
                throw new Error(result.errorMessage || "Extraction failed for " + file.name);
            }

            setUploadProgress({ current: i + 1, total: files.length });
        }

        refreshUserData();
        router.push('/dashboard/history');

    } catch (err: any) {
      console.error(err);
      alert('Extraction failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setPendingFiles([]);
    }
  };

  const processUploads = async () => {
    setIsConfirming(false);
    await processUploadsManual(pendingFiles, totalCreditsRequired);
  };

  const progressPercentage = uploadProgress 
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
      />
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const fileList = Array.from(e.dataTransfer.files);
            handleFileChange({ target: { files: fileList } } as any);
          }
        }}
        className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 lg:p-20 transition-all cursor-pointer ${isUploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/50 hover:bg-white/[0.02]'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
        
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📄</div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Drop your invoices here</h3>
            <p className="text-gray-400 max-w-sm mx-auto">Upload PDF or Images. We'll automatically extract GST, items, and totals.</p>
          </div>
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Browse Files
          </button>
        </div>
      </div>

      {/* EXTRACTION OVERLAY */}
      {isUploading && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#030712]/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-10 w-full max-w-xl">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-[6px] border-blue-500/10 rounded-full"></div>
                <div 
                    className="absolute inset-0 border-[6px] border-blue-500 rounded-full animate-spin border-t-transparent shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                    style={{ animationDuration: '2s' }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">
                    {progressPercentage}%
                </div>
            </div>
            
            <div className="text-center w-full space-y-6">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Processing your data</h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-blue-400 text-lg font-bold uppercase tracking-widest text-sm">
                            {uploadProgress?.current === uploadProgress?.total && uploadProgress?.total !== 0 
                                ? 'Finalizing...' 
                                : uploadProgress?.current === 0 ? 'Analyzing pages...' : 'Extracting Data...'}
                        </p>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-[2px]">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                        <span>Initiating</span>
                        <span>{uploadProgress?.current || 0} / {uploadProgress?.total || 0} Files</span>
                        <span>Complete</span>
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-gray-400 italic text-sm">"Our AI is reading your documents for GST compliance..."</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}
      {isConfirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-bold text-white mb-4">Confirm Batch Upload</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    You are uploading <span className="text-white font-bold">{pendingFiles.length} files</span> which will use <span className="text-blue-400 font-bold">{totalCreditsRequired} credits</span>. Proceed?
                </p>
                <div className="flex gap-3">
                    <button onClick={processUploads} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">Start Extraction</button>
                    <button onClick={() => setIsConfirming(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">Cancel</button>
                </div>
            </div>
        </div>
      )}

      {isInsufficient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto">⚠️</div>
                <h3 className="text-2xl font-bold text-white mb-2 text-center">Insufficient Balance</h3>
                <p className="text-gray-400 mb-8 text-center leading-relaxed">
                    This batch requires <span className="text-white font-bold">{totalCreditsRequired} credits</span>, but you only have <span className="text-red-400 font-bold">{credits}</span> remaining.
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => window.location.href='/dashboard/pricing'} className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20">Upgrade My Plan</button>
                    <button onClick={() => setIsInsufficient(false)} className="py-3 text-gray-500 hover:text-white transition-colors text-sm font-medium">Maybe Later</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
