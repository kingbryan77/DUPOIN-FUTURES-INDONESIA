import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'dupoin_custom_supabase_url';
const STORAGE_ANON_KEY = 'dupoin_custom_supabase_anon_key';

// Kredensial default (dari environment atau fallback)
const DEFAULT_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://jlpthxzpiqaexjpdzcsl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmeHV5Z2RydWxxaGdkY3ZxbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MjgzNzMsImV4cCI6MjA4MjIwNDM3M30.KPddJd_xsE7zDLpz-X3Bd25fE8tWnnGEYeceFfhpt8Q';

export const getSupabaseConfig = (): { url: string; anonKey: string; isCustom: boolean } => {
  try {
    const savedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const savedKey = localStorage.getItem(STORAGE_ANON_KEY);
    if (savedUrl && savedKey) {
      return { url: savedUrl.trim(), anonKey: savedKey.trim(), isCustom: true };
    }
  } catch (e) {
    // localStorage might not be available in some environments
  }
  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY, isCustom: false };
};

let currentConfig = getSupabaseConfig();
let activeClient: SupabaseClient = createClient(currentConfig.url, currentConfig.anonKey);

/**
 * Proxy object for supabase so any module importing `supabase`
 * will automatically route queries to the latest active client.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    return (activeClient as any)[prop];
  }
});

/**
 * Update and persist Supabase credentials dynamically.
 */
export const updateSupabaseConfig = (url: string, anonKey: string): { success: boolean; error?: string } => {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl.startsWith('https://')) {
    return { success: false, error: 'URL Supabase harus dimulai dengan https://' };
  }
  if (!cleanKey || cleanKey.length < 20) {
    return { success: false, error: 'Anon key Supabase tidak valid.' };
  }

  try {
    localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
    activeClient = createClient(cleanUrl, cleanKey);
    currentConfig = { url: cleanUrl, anonKey: cleanKey, isCustom: true };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal menyimpan konfigurasi.' };
  }
};

/**
 * Reset Supabase credentials to default.
 */
export const resetSupabaseConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  } catch (e) {}
  currentConfig = { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY, isCustom: false };
  activeClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
};

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return config.isCustom && config.url.startsWith('https://') && !config.url.includes('jlpthxzpiqaexjpdzcsl');
};

/**
 * Test Supabase connection against the configured instance.
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  const config = getSupabaseConfig();

  // If still using non-existent default URL, return clear immediate diagnostic
  if (!config.isCustom || config.url.includes('jlpthxzpiqaexjpdzcsl')) {
    return {
      success: false,
      message: 'Koneksi belum terhubung: Aplikasi masih menggunakan URL contoh bawaan yang tidak aktif. Masukkan Project URL (https://xxxx.supabase.co) dan Anon Key dari project Supabase Anda sendiri.',
      details: { isDefaultUrl: true }
    };
  }

  try {
    // 1. Test ping health endpoint
    const healthTimeout = new Promise<Response>((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi timeout (>3.5s). Pastikan URL Supabase benar dan project Supabase tidak dalam status paused.')), 3500)
    );

    try {
      const healthFetch = fetch(`${config.url}/auth/v1/health`, {
        headers: { apikey: config.anonKey }
      });
      await Promise.race([healthFetch, healthTimeout]);
    } catch (netErr: any) {
      return {
        success: false,
        message: `Gagal menjangkau server Supabase (${netErr?.message || netErr}). Pastikan URL Project Anda valid.`,
        details: { networkError: true }
      };
    }

    // 2. Test querying profiles table
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi timeout saat query tabel')), 3500)
    );
    const queryPromise = activeClient.from('profiles').select('id').limit(1);

    const { error: queryError } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (queryError) {
      if (queryError.code === '42P01' || queryError.message?.toLowerCase().includes('does not exist')) {
        return {
          success: true,
          message: 'Berhasil terhubung ke Supabase! Namun tabel "public.profiles" belum dibuat. Buka SQL Editor di dashboard Supabase lalu jalankan skrip supabase_schema.sql.',
          details: { tableMissing: true }
        };
      }
      return { 
        success: true, 
        message: `Terhubung ke Supabase! Respon tabel: ${queryError.message}` 
      };
    }

    return { 
      success: true, 
      message: `Sempurna! Terhubung ke Supabase (${config.url}). Database dan tabel profiles siap digunakan secara live.` 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `Gagal terhubung: ${err?.message || 'Host tidak dapat dijangkau. Periksa URL dan API Key.'}` 
    };
  }
};
