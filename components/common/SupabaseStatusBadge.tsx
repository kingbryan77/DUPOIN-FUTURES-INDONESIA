import React, { useState, useEffect } from 'react';
import { ServerIcon } from '@heroicons/react/24/outline';
import { isSupabaseConfigured, getSupabaseConfig } from '../../services/supabaseClient';
import SupabaseStatusModal from './SupabaseStatusModal';

interface SupabaseStatusBadgeProps {
  className?: string;
  variant?: 'header' | 'floating' | 'card';
}

const SupabaseStatusBadge: React.FC<SupabaseStatusBadgeProps> = ({ 
  className = '', 
  variant = 'header' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configured, setConfigured] = useState(isSupabaseConfigured());

  const refreshState = () => {
    setConfigured(isSupabaseConfigured());
  };

  useEffect(() => {
    refreshState();
    // Listen for storage changes in case config changes in another tab
    window.addEventListener('storage', refreshState);
    return () => window.removeEventListener('storage', refreshState);
  }, []);

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold shadow-xl border backdrop-blur-md transition-all active:scale-95 ${
            configured
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/90'
              : 'bg-slate-900/90 border-cyan-500/50 text-cyan-200 hover:bg-slate-800'
          } ${className}`}
          title="Klik untuk melihat status atau hubungkan project Supabase"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <ServerIcon className="w-4 h-4 text-cyan-400" />
          <span>{configured ? 'Supabase Terhubung' : 'Hubungkan Supabase'}</span>
        </button>

        <SupabaseStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfigChanged={refreshState}
        />
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <div 
          onClick={() => setIsModalOpen(true)}
          className={`cursor-pointer p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all hover:border-cyan-400 ${
            configured 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          } ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold">
              {configured ? 'Database Supabase Cloud Aktif' : 'Supabase Cloud Belum Terhubung'}
            </span>
          </div>
          <span className="text-[11px] text-cyan-300 underline font-semibold hover:text-white">
            {configured ? 'Detail' : 'Hubungkan Sekarang &rarr;'}
          </span>
        </div>

        <SupabaseStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfigChanged={refreshState}
        />
      </>
    );
  }

  // Default: Header variant
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 shadow-sm select-none ${
          configured
            ? 'bg-[#002D1E]/40 border-emerald-400/50 text-emerald-100 hover:bg-[#002D1E]/60'
            : 'bg-[#151922]/50 border-amber-400/40 text-white hover:bg-[#151922]/80'
        } ${className}`}
        title="Klik untuk membuka Pengaturan & Status Supabase"
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
        </span>
        <ServerIcon className="w-3.5 h-3.5 text-white/90" />
        <span className="hidden sm:inline font-sans">
          {configured ? 'Supabase Aktif' : 'Hubungkan Supabase'}
        </span>
      </button>

      <SupabaseStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfigChanged={refreshState}
      />
    </>
  );
};

export default SupabaseStatusBadge;
