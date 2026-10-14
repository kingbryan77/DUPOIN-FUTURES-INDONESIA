import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ServerIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  DocumentDuplicateIcon, 
  CheckIcon, 
  LinkIcon, 
  CommandLineIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { 
  getSupabaseConfig, 
  updateSupabaseConfig, 
  resetSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured 
} from '../../services/supabaseClient';
import { syncCustomUsersToSupabase } from '../../services/authService';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- =========================================================================
-- DUPOIN PRO BROKER - SUPABASE DATABASE & AUTHENTICATION SCHEMA
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABEL PROFILES (DATA DETAIL PENGGUNA TERHUBUNG KE AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT,
    phone_number TEXT DEFAULT '',
    balance NUMERIC(15, 2) DEFAULT 8000000.00 NOT NULL,
    is_verified BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    profile_picture_url TEXT,
    bank_name TEXT DEFAULT '',
    bank_account_number TEXT DEFAULT '',
    bank_account_holder TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. TABEL TRANSACTIONS (DEPOSIT, WITHDRAWAL, TRANSFER)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')),
    amount NUMERIC(15, 2) NOT NULL,
    method TEXT DEFAULT 'Bank Transfer',
    bank_or_ewallet_name TEXT DEFAULT '',
    account_number TEXT DEFAULT '',
    account_holder_name TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUCCESS')),
    notes TEXT,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. TABEL NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABEL REKENING DEPOSIT BROKER
CREATE TABLE IF NOT EXISTS public.company_bank_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TRIGGER OTOMATIS: SAAT USER DAFTAR DI AUTH.USERS, MASUK KE PUBLIC.PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    phone_number,
    balance,
    is_verified,
    is_active,
    is_admin
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    8000000.00,
    true,
    true,
    CASE WHEN NEW.email IN ('admin@dupoin.com', 'trader@dupoin.com') THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. KEBIJAKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bank_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "transactions_all" ON public.transactions;
CREATE POLICY "transactions_all" ON public.transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "company_bank_info_all" ON public.company_bank_info;
CREATE POLICY "company_bank_info_all" ON public.company_bank_info FOR ALL USING (true);`;

const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose, onConfigChanged }) => {
  const [config, setConfig] = useState(getSupabaseConfig());
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ total: number; synced: number; failed: number; errors: string[] } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSupabaseConfig();
      setConfig(current);
      setUrlInput(current.url);
      setKeyInput(current.anonKey);
      setSaveMessage(null);
      // Auto-run connection test when modal opens
      handleRunTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Gagal menguji koneksi.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    const res = updateSupabaseConfig(urlInput, keyInput);
    if (res.success) {
      const updated = getSupabaseConfig();
      setConfig(updated);
      setSaveMessage({ type: 'success', text: 'Kredensial berhasil disimpan! Menguji koneksi sekarang...' });
      if (onConfigChanged) onConfigChanged();
      handleRunTest();
    } else {
      setSaveMessage({ type: 'error', text: res.error || 'Gagal menyimpan kredensial.' });
    }
  };

  const handleReset = () => {
    resetSupabaseConfig();
    const updated = getSupabaseConfig();
    setConfig(updated);
    setUrlInput(updated.url);
    setKeyInput(updated.anonKey);
    setSaveMessage({ type: 'success', text: 'Kredensial dikembalikan ke default.' });
    if (onConfigChanged) onConfigChanged();
    handleRunTest();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSyncUsers = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await syncCustomUsersToSupabase();
      setSyncResult(res);
      handleRunTest();
    } catch (e: any) {
      setSyncResult({
        total: 0,
        synced: 0,
        failed: 1,
        errors: [e?.message || 'Gagal sinkronisasi']
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-[#0F172A] px-5 sm:px-7 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ServerIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Koneksi Database Supabase Cloud
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                  isConfigured 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isConfigured ? 'Kredensial Aktif' : 'Perlu Konfigurasi'}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Hubungkan project Supabase Anda agar pengguna & data transaksi tersimpan langsung di cloud
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* Live Status Banner */}
          <div className={`p-4 rounded-xl border text-sm flex items-start gap-3.5 transition-all ${
            testResult?.success 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/40 border-red-500/40 text-red-200'
          }`}>
            {testResult?.success ? (
              <CheckCircleIcon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-base">
                  {isTesting ? 'Menguji koneksi ke Supabase...' : (testResult?.success ? 'Terhubung ke Supabase' : 'Belum Terhubung ke Supabase')}
                </div>
                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting}
                  className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all w-fit"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 mr-1.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Menguji...' : 'Uji Koneksi Ulang'}
                </button>
              </div>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {isTesting ? 'Menghubungi endpoint Supabase...' : (testResult?.message || 'Menunggu hasil pengujian...')}
              </p>
            </div>
          </div>

          {/* Form Setup Kredensial */}
          <div className="bg-slate-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Masukkan Kredensial Project Supabase Anda
              </h4>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Supabase Dashboard</a> &gt; Pilih Project &gt; <strong>Project Settings &gt; API</strong> untuk menyalin URL dan Anon Key.
            </p>

            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg text-xs font-medium border ${
                saveMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {saveMessage.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Project URL <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                  placeholder="https://xyzabcdefghijklmn.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Project API Key (Anon / Public Key) <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-950 border border-gray-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono resize-none"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Reset ke Bawaan
                </button>
                <div className="flex items-center gap-2">
                  <Button type="submit" variant="primary" size="sm">
                    Simpan & Hubungkan Sekarang
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Setup 3 Langkah & Copy SQL */}
          <div className="bg-slate-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CommandLineIcon className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Buat Tabel & Trigger di Supabase SQL Editor
                </h4>
              </div>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
              >
                {copied ? <CheckIcon className="w-4 h-4 mr-1.5 text-white" /> : <DocumentDuplicateIcon className="w-4 h-4 mr-1.5" />}
                {copied ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL Lengkap'}
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-4">
              Jalankan skrip ini sekali saja di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Supabase SQL Editor</a> untuk otomatis membuat tabel <code className="text-cyan-300">profiles</code>, <code className="text-cyan-300">transactions</code>, dan trigger auth.
            </p>

            <div className="bg-slate-950 border border-gray-800 rounded-lg p-3 text-[11px] font-mono text-gray-300 max-h-36 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCRIPT.slice(0, 750)}... [Klik tombol Salin untuk mengambil seluruh isi skrip]</pre>
            </div>
          </div>

          {/* 3. Sinkronisasi Data Pengguna */}
          <div className="bg-slate-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    3. Sinkronkan Akun Pengguna yang Sudah Ada
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Masukkan akun yang sebelumnya dibuat ke tabel Supabase (<code className="text-cyan-300">auth.users</code> & <code className="text-cyan-300">public.profiles</code>).
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncUsers}
                isLoading={syncLoading}
                className="whitespace-nowrap"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                Sinkronkan Sekarang
              </Button>
            </div>

            {syncResult && (
              <div className="mt-3 p-3 bg-slate-950 border border-gray-800 rounded-lg text-xs">
                <div className="flex items-center gap-4 font-semibold">
                  <span className="text-gray-300">Total Akun: {syncResult.total}</span>
                  <span className="text-emerald-400">Berhasil Masuk: {syncResult.synced}</span>
                  {syncResult.failed > 0 && <span className="text-red-400">Gagal: {syncResult.failed}</span>}
                </div>
                {syncResult.errors.length > 0 && (
                  <div className="mt-2 text-red-300 space-y-1">
                    {syncResult.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 sm:px-7 py-3 border-t border-gray-800 flex items-center justify-between flex-shrink-0 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <InformationCircleIcon className="w-4 h-4 text-cyan-400" />
            <span>Kredensial disimpan aman di browser dan dapat diganti sewaktu-waktu.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

export default SupabaseStatusModal;
