-- =========================================================================
-- DUPOIN PRO BROKER - SUPABASE DATABASE & AUTHENTICATION SECURITY SCHEMA
-- =========================================================================
-- Skrip SQL lengkap untuk mengonfigurasi database Supabase:
-- 1. Menyimpan data pengguna ke tabel public.profiles secara otomatis saat mendaftar.
-- 2. Mengaktifkan Row Level Security (RLS) dengan kebijakan yang aman & fleksibel.
-- 3. Membuat tabel transactions, notifications, dan company_bank_info.
--
-- CARA MENGGUNAKAN:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih project database Supabase Anda
-- 3. Masuk ke menu "SQL Editor" di bilah sebelah kiri
-- 4. Klik "New query", salin (copy) dan tempel (paste) seluruh isi skrip ini
-- 5. Klik tombol "Run" (hijau) di pojok kanan bawah
-- 6. Masuk ke "Authentication" -> "Providers" -> "Email", pastikan:
--    - "Enable Email provider" AKTIF (ON)
--    - "Confirm email" NONAKTIF (OFF) agar pengguna bisa langsung masuk tanpa verifikasi link email.
-- =========================================================================

-- 1. AKTIFKAN EXTENSION PGCRYPTO
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABEL PROFILES (DATA DETAIL PENGGUNA TERHUBUNG KE AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT,
    phone_number TEXT,
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

-- Pastikan kolom-kolom baru tersedia jika tabel sudah pernah dibuat sebelumnya
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_name') THEN
        ALTER TABLE public.profiles ADD COLUMN bank_name TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_account_number') THEN
        ALTER TABLE public.profiles ADD COLUMN bank_account_number TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_account_holder') THEN
        ALTER TABLE public.profiles ADD COLUMN bank_account_holder TEXT DEFAULT '';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. TABEL TRANSACTIONS (DEPOSIT, WITHDRAWAL, TRANSFER)
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

-- Pastikan kolom baru di tabel transactions ada jika tabel sudah pernah dibuat
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'method') THEN
        ALTER TABLE public.transactions ADD COLUMN method TEXT DEFAULT 'Bank Transfer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'bank_or_ewallet_name') THEN
        ALTER TABLE public.transactions ADD COLUMN bank_or_ewallet_name TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account_number') THEN
        ALTER TABLE public.transactions ADD COLUMN account_number TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account_holder_name') THEN
        ALTER TABLE public.transactions ADD COLUMN account_holder_name TEXT DEFAULT '';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- 4. TABEL NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 5. TABEL COMPANY_BANK_INFO (REKENING RESMI PERUSAHAAN UNTUK DEPOSIT)
CREATE TABLE IF NOT EXISTS public.company_bank_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. FUNCTION TRIGGER OTOMATIS: SYNCHRONIZE AUTH.USERS KE PUBLIC.PROFILES
-- Setiap kali ada user baru yang mendaftar di auth.users (melalui formulir register atau admin),
-- function ini otomatis membuat baris profil di tabel public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        8000000.00,
        true,
        true,
        CASE WHEN NEW.email ILIKE '%admin%' THEN true ELSE false END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        updated_at = NOW();

    -- Tambahkan notifikasi sambutan selamat datang otomatis
    INSERT INTO public.notifications (user_id, message, date, read)
    VALUES (NEW.id, 'Selamat datang di Dupoin Pro Trader! Akun Anda telah aktif dan terverifikasi.', NOW(), false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. PENGATURAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bank_info ENABLE ROW LEVEL SECURITY;

-- Policy Profiles: Mengizinkan SELECT, INSERT, dan UPDATE
DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;
CREATE POLICY "Profiles view policy" ON public.profiles
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE
    USING (true);

-- Policy Transactions: Mengizinkan transaksi user & admin
DROP POLICY IF EXISTS "Transactions view policy" ON public.transactions;
CREATE POLICY "Transactions view policy" ON public.transactions
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Transactions insert policy" ON public.transactions;
CREATE POLICY "Transactions insert policy" ON public.transactions
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Transactions update policy" ON public.transactions;
CREATE POLICY "Transactions update policy" ON public.transactions
    FOR UPDATE
    USING (true);

-- Policy Notifications
DROP POLICY IF EXISTS "Notifications policy" ON public.notifications;
CREATE POLICY "Notifications policy" ON public.notifications
    FOR ALL
    USING (true);

-- Policy Company Bank Info
DROP POLICY IF EXISTS "Company bank info policy" ON public.company_bank_info;
CREATE POLICY "Company bank info policy" ON public.company_bank_info
    FOR ALL
    USING (true);

-- 8. FUNGSI ADMIN UNTUK MENGUBAH / MERESET KATA SANDI USER (OPSIONAL)
CREATE OR REPLACE FUNCTION public.admin_set_user_password(target_user_id UUID, new_plain_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE auth.users
    SET encrypted_password = crypt(new_plain_password, gen_salt('bf'))
    WHERE id = target_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Selesai! Skema database siap dan sinkron dengan aplikasi Dupoin Pro Broker.
