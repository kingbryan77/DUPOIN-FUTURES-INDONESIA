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

/**
 * Test Supabase connection against the configured instance.
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const config = getSupabaseConfig();
    // Test auth endpoint
    const { error: sessionError } = await activeClient.auth.getSession();
    if (sessionError) {
      return { success: false, message: `Koneksi Auth gagal: ${sessionError.message}` };
    }

    // Test querying profiles table (with short timeout)
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi timeout (>3s). Periksa apakah URL Supabase sudah benar.')), 3500)
    );
    const queryPromise = activeClient.from('profiles').select('id').limit(1);

    const { error: queryError } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (queryError) {
      if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Catatan: Tabel "public.profiles" belum dibuat. Jalankan skrip supabase_schema.sql di SQL Editor Supabase.',
          details: { tableMissing: true }
        };
      }
      return { 
        success: true, 
        message: `Terhubung ke Supabase Auth! (Tabel profiles respon: ${queryError.message})` 
      };
    }

    return { 
      success: true, 
      message: `Berhasil terhubung ke Supabase (${config.url})! Database dan tabel profiles siap digunakan.` 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `Gagal terhubung: ${err?.message || 'Host tidak dapat dijangkau. Pastikan URL dan API Key benar.'}` 
    };
  }
};
