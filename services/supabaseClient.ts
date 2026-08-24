import { createClient } from '@supabase/supabase-js';

/**
 * Kredensial Proyek Supabase Anda (Cloud)
 */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://jlpthxzpiqaexjpdzcsl.supabase.co';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmeHV5Z2RydWxxaGdkY3ZxbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MjgzNzMsImV4cCI6MjA4MjIwNDM3M30.KPddJd_xsE7zDLpz-X3Bd25fE8tWnnGEYeceFfhpt8Q';

// Inisialisasi client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
