import { User, UserProfileUpdate } from '../types';
import { supabase, getSupabaseConfig, testSupabaseConnection, isSupabaseConfigured } from './supabaseClient';

const DEACTIVATED_USERS_KEY = 'dupoin_deactivated_user_ids';

export const getDeactivatedUserIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DEACTIVATED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setDeactivatedUserId = (userId: string, isDeactivated: boolean): void => {
  try {
    const list = getDeactivatedUserIds();
    const updated = isDeactivated
      ? Array.from(new Set([...list, userId]))
      : list.filter(id => id !== userId);
    localStorage.setItem(DEACTIVATED_USERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update deactivated user list", e);
  }
};

export const updateUserActiveStatus = async (userId: string, isActive: boolean): Promise<void> => {
  setDeactivatedUserId(userId, !isActive);
  
  // Update local storage if current logged in demo user
  const localUserJson = localStorage.getItem(DEMO_USER_KEY);
  if (localUserJson) {
    try {
      const parsed = JSON.parse(localUserJson);
      if (parsed.id === userId) {
        parsed.isActive = isActive;
        parsed.isVerified = isActive;
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
      }
    } catch {}
  }

  // Attempt updating Supabase
  try {
    const { error } = await supabase.from('profiles').update({ is_active: isActive, is_verified: isActive }).eq('id', userId);
    if (error) {
      // If is_active column doesn't exist, fallback to is_verified
      await supabase.from('profiles').update({ is_verified: isActive }).eq('id', userId);
    }
  } catch (err) {
    try {
      await supabase.from('profiles').update({ is_verified: isActive }).eq('id', userId);
    } catch {
      // ignore
    }
  }
};

const mapProfileToUser = (profile: any, authUser: any): User => {
  const userId = authUser?.id || profile?.id;
  const deactivatedIds = getDeactivatedUserIds();
  const isDeactivatedInStorage = deactivatedIds.includes(userId);
  
  let isActive = true;
  if (isDeactivatedInStorage) {
    isActive = false;
  } else if (profile?.is_active !== undefined && profile?.is_active !== null) {
    isActive = Boolean(profile.is_active);
  } else if (profile?.is_verified === false) {
    isActive = false;
  }

  return {
    id: userId,
    email: profile?.email || authUser?.email || '',
    fullName: profile?.full_name || '',
    username: profile?.username || '',
    phoneNumber: profile?.phone_number || '',
    isAdmin: profile?.is_admin || false,
    isVerified: profile?.is_verified !== undefined ? Boolean(profile.is_verified) : true, 
    isActive: isActive,
    balance: (profile?.balance !== undefined && profile?.balance !== null) ? Number(profile.balance) : 8000000,
    notifications: [], 
    profilePictureUrl: profile?.profile_picture_url,
    bankName: profile?.bank_name || '',
    bankAccountNumber: profile?.bank_account_number || '',
    bankAccountHolder: profile?.bank_account_holder || profile?.full_name || '',
  };
};

export const register = async (userData: Omit<User, 'id' | 'username' | 'isAdmin' | 'isVerified' | 'balance' | 'notifications' | 'profilePictureUrl'> & { password: string }): Promise<{ user: User | null; error: string | null; warning?: string | null }> => {
  const cleanEmail = userData.email.trim().toLowerCase();
  const cleanPassword = userData.password.trim();
  const cleanFullName = userData.fullName.trim();

  if (!cleanFullName) {
    return { user: null, error: 'Nama Lengkap wajib diisi.' };
  }
  if (!cleanEmail) {
    return { user: null, error: 'Email wajib diisi.' };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { user: null, error: 'Kata sandi minimal 6 karakter.' };
  }

  // Periksa apakah email sudah terdaftar di data custom user lokal
  const existingCustom = getCustomUsers().find(u => u.email.toLowerCase() === cleanEmail);
  if (existingCustom) {
    return { user: null, error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk dengan kata sandi Anda.' };
  }

  // 1. Coba daftarkan langsung ke database Supabase jika sudah dikonfigurasi
  let createdSupabaseUser: User | null = null;
  let supabaseWarning: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Koneksi Supabase timeout (>4s). Pastikan Project URL Supabase aktif & benar.')), 4000)
      );
      const signUpPromise = supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanFullName,
            username: cleanEmail.split('@')[0],
            phone_number: userData.phoneNumber || '',
          }
        }
      });

      const { data: authData, error: authError } = await Promise.race([signUpPromise, timeoutPromise]) as any;

      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered')) {
          return { user: null, error: 'Email ini sudah terdaftar di database Supabase.' };
        }
        supabaseWarning = `Koneksi Supabase Auth: ${authError.message}`;
      } else if (authData?.user) {
        // Masukkan profil langsung ke public.profiles
        const profileRow = {
          id: authData.user.id,
          email: cleanEmail,
          full_name: cleanFullName,
          username: cleanEmail.split('@')[0],
          phone_number: userData.phoneNumber || '',
          balance: 8000000,
          is_verified: true,
          is_active: true,
          is_admin: false,
        };

        const { error: profileError } = await supabase.from('profiles').upsert(profileRow);
        if (profileError) {
          supabaseWarning = `User berhasil masuk ke Supabase Auth, namun baris public.profiles gagal: ${profileError.message}. Pastikan skrip supabase_schema.sql telah dijalankan di SQL Editor Supabase.`;
        }

        // Notifikasi selamat datang otomatis
        await supabase.from('notifications').insert([{
          user_id: authData.user.id,
          message: 'Selamat datang di Dupoin Pro Trader! Akun Anda telah aktif dan terverifikasi di Supabase.',
          date: new Date().toISOString(),
          read: false
        }]).catch(() => {});

        createdSupabaseUser = mapProfileToUser(profileRow, authData.user);
      }
    } catch (e: any) {
      supabaseWarning = `Supabase tidak dapat dijangkau (${e?.message || e}). Periksa koneksi project Supabase Anda.`;
    }
  } else {
    supabaseWarning = 'Aplikasi belum terhubung ke database Supabase Anda. Klik tombol "Hubungkan Supabase" di bagian atas untuk menghubungkan Project URL & Anon Key Anda.';
  }

  if (createdSupabaseUser) {
    saveCustomUser({ ...createdSupabaseUser, password: cleanPassword });
    return { user: createdSupabaseUser, error: null, warning: supabaseWarning };
  }

  // 2. Fallback pembuatan akun baru yang selalu aman beserta password
  const newId = 'user-' + Date.now();
  const newUser: User = {
    id: newId,
    email: cleanEmail,
    fullName: cleanFullName,
    username: cleanEmail.split('@')[0],
    phoneNumber: userData.phoneNumber || '',
    isAdmin: false,
    isVerified: true,
    isActive: true,
    balance: 8000000,
    password: cleanPassword,
    notifications: [
      { id: '1', message: 'Selamat datang di Dupoin Pro Trader! Akun Anda telah aktif.', date: new Date().toISOString(), read: false }
    ],
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: cleanFullName
  };

  saveCustomUser(newUser);
  return { 
    user: newUser, 
    error: null, 
    warning: null 
  };
};

const DEMO_USER_KEY = 'dupoin_demo_user';

const createDemoUser = (email: string, fullName = 'Pro Trader'): User => {
  const isDeactivated = getDeactivatedUserIds().includes('demo-user-id-001');
  return {
    id: 'demo-user-id-001',
    email: email || 'trader@dupoin.com',
    fullName: fullName || 'Pro Trader',
    username: 'pro_trader',
    phoneNumber: '081234567890',
    isAdmin: true,
    isVerified: !isDeactivated,
    isActive: !isDeactivated,
    balance: 8000000,
    notifications: [
      { id: '1', message: 'Selamat datang di Dupoin Pro Trader!', date: new Date().toISOString(), read: false }
    ],
    profilePictureUrl: undefined,
    bankName: 'Bank Central Asia (BCA)',
    bankAccountNumber: '8735129481',
    bankAccountHolder: fullName || 'Pro Trader'
  };
};

const DEMO_CREDENTIALS: Record<string, { pass: string[]; role: string }> = {
  'admin@dupoin.com': { pass: ['admin123', 'dupoin123'], role: 'Administrator' },
  'trader@dupoin.com': { pass: ['trader123', 'dupoin123'], role: 'Pro Trader' },
  'demo@dupoin.com': { pass: ['demo123', 'dupoin123'], role: 'Demo Trader' },
  'budi.santoso@gmail.com': { pass: ['budi123', 'dupoin123', 'password123'], role: 'Budi Santoso' },
  'siti.aminah@yahoo.com': { pass: ['siti123', 'dupoin123', 'password123'], role: 'Siti Aminah' },
};

export const login = async (identifier: string, passwordAttempt: string): Promise<{ user: User | null; error: string | null }> => {
  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanPassword = passwordAttempt.trim();

  if (!cleanIdentifier) {
    return { user: null, error: 'Email atau nomor telepon wajib diisi.' };
  }
  if (!cleanPassword) {
    return { user: null, error: 'Kata sandi wajib diisi.' };
  }

  // 1. Strict verification for pre-configured Demo/Admin accounts
  if (DEMO_CREDENTIALS[cleanIdentifier]) {
    const creds = DEMO_CREDENTIALS[cleanIdentifier];
    if (!creds.pass.includes(cleanPassword)) {
      return { 
        user: null, 
        error: 'Kata sandi salah. Silakan masukkan kata sandi yang benar.' 
      };
    }
    const demoUser = createDemoUser(cleanIdentifier, creds.role);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    return { user: demoUser, error: null };
  }

  // 2. Strict verification for registered custom/admin-created accounts
  const customUsers = getCustomUsers();
  const matchedCustomUser = customUsers.find(
    u => u.email.toLowerCase() === cleanIdentifier || (u.phoneNumber && u.phoneNumber === cleanIdentifier)
  );

  if (matchedCustomUser) {
    if (!matchedCustomUser.password || matchedCustomUser.password !== cleanPassword) {
      return { 
        user: null, 
        error: 'Kata sandi salah. Silakan masukkan kata sandi yang sesuai.' 
      };
    }
    const isDeactivated = getDeactivatedUserIds().includes(matchedCustomUser.id);
    const resolvedUser: User = {
      ...matchedCustomUser,
      isActive: !isDeactivated && matchedCustomUser.isActive !== false,
      isVerified: !isDeactivated && matchedCustomUser.isVerified !== false,
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(resolvedUser));
    return { user: resolvedUser, error: null };
  }

  // 3. Strict verification against Supabase Auth database
  try {
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi timeout')), 3000)
    );
    const signInPromise = supabase.auth.signInWithPassword({
      email: cleanIdentifier,
      password: cleanPassword,
    });

    const { data: authData, error: authError } = await Promise.race([signInPromise, timeoutPromise]) as any;

    if (authError) {
      const errLower = (authError.message || '').toLowerCase();
      if (errLower.includes('invalid login credentials') || errLower.includes('invalid credentials')) {
        return { 
          user: null, 
          error: 'Email atau kata sandi salah. Silakan periksa kembali kata sandi Anda.' 
        };
      }
      if (errLower.includes('email not confirmed')) {
        return { 
          user: null, 
          error: 'Email belum dikonfirmasi. Pastikan Anda telah mengonfirmasi email pendaftaran.' 
        };
      }
      if (errLower.includes('rate limit')) {
        return { 
          user: null, 
          error: 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.' 
        };
      }
      return { user: null, error: 'Email atau kata sandi tidak cocok di database.' };
    }

    if (!authData?.user) {
      return { user: null, error: 'Pengguna tidak ditemukan atau kata sandi salah.' };
    }

    // Ambil profil dari database profiles
    let profileResponse = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileResponse.error || !profileResponse.data) {
      // Tunggu sebentar jika trigger Supabase sedang membuat profil
      await new Promise(r => setTimeout(r, 800));
      profileResponse = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
    }

    if (profileResponse.error || !profileResponse.data) {
      // Inisialisasi profil jika belum ada di database
      const initialProfile = {
        id: authData.user.id,
        email: authData.user.email || cleanIdentifier,
        full_name: authData.user.user_metadata?.full_name || cleanIdentifier.split('@')[0],
        balance: 8000000,
        is_verified: true,
        is_active: true,
        is_admin: cleanIdentifier.includes('admin'),
      };
      await supabase.from('profiles').upsert(initialProfile);
      profileResponse = { data: initialProfile, error: null } as any;
    }

    if (profileResponse.data && (profileResponse.data.balance === null || profileResponse.data.balance === undefined)) {
      await supabase.from('profiles').update({ balance: 8000000 }).eq('id', authData.user.id);
      profileResponse.data.balance = 8000000;
    }

    const user = mapProfileToUser(profileResponse.data, authData.user);
    localStorage.removeItem(DEMO_USER_KEY);
    return { user, error: null };
  } catch (e: any) {
    return { 
      user: null, 
      error: 'Terjadi kegagalan verifikasi kata sandi di server database: ' + (e.message || 'Koneksi terputus.') 
    };
  }
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(DEMO_USER_KEY);
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore signout errors
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session?.user) {
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        if (profileData.balance === null || profileData.balance === undefined) {
          await supabase.from('profiles').update({ balance: 8000000 }).eq('id', session.user.id);
          profileData.balance = 8000000;
        }

        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false });

        const user = mapProfileToUser(profileData, session.user);
        user.notifications = notifs || [];
        return user;
      }
    }

    // Check localStorage fallback
    const localUserJson = localStorage.getItem(DEMO_USER_KEY);
    if (localUserJson) {
      return JSON.parse(localUserJson) as User;
    }

    return null;
  } catch {
    const localUserJson = localStorage.getItem(DEMO_USER_KEY);
    if (localUserJson) {
      return JSON.parse(localUserJson) as User;
    }
    return null;
  }
};

export const updateUserNotification = async (userId: string, notificationId: string, read: boolean): Promise<void> => {
  await supabase.from('notifications').update({ read }).eq('id', notificationId).eq('user_id', userId);
};

export const addUserNotification = async (userId: string, message: string): Promise<void> => {
  await supabase.from('notifications').insert([{ user_id: userId, message, date: new Date().toISOString(), read: false }]);
};

export const updateUserBalance = async (userId: string, newBalance: number): Promise<void> => {
  await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
};

const CUSTOM_USERS_KEY = 'dupoin_custom_users';

export const getCustomUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomUser = (user: User): void => {
  try {
    const existing = getCustomUsers();
    const filtered = existing.filter(u => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase());
    const updated = [user, ...filtered];
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(updated));
  } catch {}
};

export const deleteCustomUser = (userId: string): void => {
  try {
    const existing = getCustomUsers();
    const updated = existing.filter(u => u.id !== userId);
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(updated));
  } catch {}
};

export const getAllUsers = async (): Promise<User[]> => {
  const deactivatedIds = getDeactivatedUserIds();
  const customUsers = getCustomUsers().map(u => ({
    ...u,
    isActive: !deactivatedIds.includes(u.id) && u.isActive !== false,
    isVerified: !deactivatedIds.includes(u.id) && u.isVerified !== false,
  }));

  try {
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 2000)
    );
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    const { data: profiles, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

    if (!error && profiles && profiles.length > 0) {
      const dbUsers = profiles.map((p: any) => mapProfileToUser(p, null));
      // Prioritaskan customUsers di urutan teratas agar user baru langsung terlihat
      const combined = [...customUsers];
      for (const dbu of dbUsers) {
        if (!combined.some(u => u.id === dbu.id || u.email.toLowerCase() === dbu.email.toLowerCase())) {
          combined.push(dbu);
        }
      }
      return combined;
    }
  } catch (err) {
    // Supabase offline / query timeout
  }

  // Fallback demo users list
  const localUserJson = localStorage.getItem(DEMO_USER_KEY);
  const demoTrader = createDemoUser('trader@dupoin.com', 'Pro Trader');
  const demoUsers: User[] = [
    demoTrader,
    {
      id: 'user-sample-002',
      email: 'budi.santoso@gmail.com',
      fullName: 'Budi Santoso',
      username: 'budisantoso',
      phoneNumber: '081298765432',
      isAdmin: false,
      isVerified: true,
      isActive: !deactivatedIds.includes('user-sample-002'),
      balance: 15450000,
      notifications: [],
      bankName: 'Bank Central Asia (BCA)',
      bankAccountNumber: '5210984123',
      bankAccountHolder: 'Budi Santoso'
    },
    {
      id: 'user-sample-003',
      email: 'siti.aminah@yahoo.com',
      fullName: 'Siti Aminah',
      username: 'sitiaminah',
      phoneNumber: '085712345678',
      isAdmin: false,
      isVerified: false,
      isActive: !deactivatedIds.includes('user-sample-003'),
      balance: 3200000,
      notifications: [],
      bankName: 'SEA BANK',
      bankAccountNumber: '901234567890',
      bankAccountHolder: 'Siti Aminah'
    }
  ];

  if (localUserJson) {
    try {
      const parsed = JSON.parse(localUserJson);
      const idx = demoUsers.findIndex(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
      const activeState = !deactivatedIds.includes(parsed.id) && parsed.isActive !== false;
      if (idx >= 0) {
        demoUsers[idx] = { ...demoUsers[idx], ...parsed, isActive: activeState, isVerified: activeState };
      } else {
        demoUsers.unshift({ ...parsed, isActive: activeState, isVerified: activeState });
      }
    } catch {}
  }

  // Gabungkan customUsers (user baru) di urutan TERATAS agar admin langsung melihatnya
  const combinedDemo = [...customUsers];
  for (const du of demoUsers) {
    if (!combinedDemo.some(u => u.id === du.id || u.email.toLowerCase() === du.email.toLowerCase())) {
      combinedDemo.push(du);
    }
  }

  return combinedDemo;
};

export const updateUserInfo = async (updatedData: Partial<User>): Promise<void> => {
  if (!updatedData.id) return;
  const updates: any = {};
  if (updatedData.fullName !== undefined) updates.full_name = updatedData.fullName;
  if (updatedData.phoneNumber !== undefined) updates.phone_number = updatedData.phoneNumber;
  if (updatedData.profilePictureUrl !== undefined) updates.profile_picture_url = updatedData.profilePictureUrl;
  if (updatedData.isVerified !== undefined) updates.is_verified = updatedData.isVerified;
  if (updatedData.bankName !== undefined) updates.bank_name = updatedData.bankName;
  if (updatedData.bankAccountNumber !== undefined) updates.bank_account_number = updatedData.bankAccountNumber;
  if (updatedData.bankAccountHolder !== undefined) updates.bank_account_holder = updatedData.bankAccountHolder;
  if (updatedData.isActive !== undefined) {
    setDeactivatedUserId(updatedData.id, !updatedData.isActive);
    updates.is_active = updatedData.isActive;
    updates.is_verified = updatedData.isActive;
  }
  
  // Update local storage if present
  const localUserJson = localStorage.getItem(DEMO_USER_KEY);
  if (localUserJson) {
    try {
      const localUser = JSON.parse(localUserJson);
      if (localUser && localUser.id === updatedData.id) {
        const merged = {
          ...localUser,
          ...(updatedData.fullName !== undefined ? { fullName: updatedData.fullName } : {}),
          ...(updatedData.phoneNumber !== undefined ? { phoneNumber: updatedData.phoneNumber } : {}),
          ...(updatedData.profilePictureUrl !== undefined ? { profilePictureUrl: updatedData.profilePictureUrl } : {}),
          ...(updatedData.bankName !== undefined ? { bankName: updatedData.bankName } : {}),
          ...(updatedData.bankAccountNumber !== undefined ? { bankAccountNumber: updatedData.bankAccountNumber } : {}),
          ...(updatedData.bankAccountHolder !== undefined ? { bankAccountHolder: updatedData.bankAccountHolder } : {}),
          ...(updatedData.isActive !== undefined ? { isActive: updatedData.isActive, isVerified: updatedData.isActive } : {}),
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(merged));
      }
    } catch {
      // ignore
    }
  }

  // Update in custom users list if present
  try {
    const customUsers = getCustomUsers();
    const idx = customUsers.findIndex(u => u.id === updatedData.id);
    if (idx >= 0) {
      customUsers[idx] = { 
        ...customUsers[idx], 
        ...updatedData,
        ...(updatedData.isActive !== undefined ? { isActive: updatedData.isActive, isVerified: updatedData.isActive } : {})
      };
      localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(customUsers));
    }
  } catch {}

  try {
    await supabase.from('profiles').update(updates).eq('id', updatedData.id);
  } catch (err) {
    console.warn("Supabase profile update warning:", err);
  }
};

export const adminCreateUser = async (userData: Omit<User, 'id' | 'username' | 'notifications'> & { password: string; isActive?: boolean }): Promise<User | null> => {
  const cleanEmail = userData.email.trim().toLowerCase();
  const cleanPassword = userData.password.trim();
  const cleanFullName = userData.fullName.trim();
  const initialActive = userData.isActive !== undefined ? userData.isActive : true;

  if (!cleanFullName || !cleanEmail || !cleanPassword) {
    throw new Error('Nama Lengkap, Email, dan Password wajib diisi.');
  }

  // Jika email sudah terdaftar di customUsers, perbarui akun tersebut
  const existingCustom = getCustomUsers().find(u => u.email.toLowerCase() === cleanEmail);
  if (existingCustom) {
    const updatedUser: User = {
      ...existingCustom,
      fullName: cleanFullName,
      phoneNumber: userData.phoneNumber || existingCustom.phoneNumber,
      password: cleanPassword,
      balance: userData.balance !== undefined ? userData.balance : existingCustom.balance,
      isAdmin: userData.isAdmin !== undefined ? userData.isAdmin : existingCustom.isAdmin,
      isVerified: userData.isVerified !== undefined ? userData.isVerified : initialActive,
      isActive: initialActive,
    };
    if (!initialActive) {
      setDeactivatedUserId(existingCustom.id, true);
    } else {
      setDeactivatedUserId(existingCustom.id, false);
    }
    saveCustomUser(updatedUser);
    return updatedUser;
  }

  // Coba buat di Supabase Auth jika online
  try {
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 2500)
    );
    const signUpPromise = supabase.auth.signUp({ 
        email: cleanEmail, 
        password: cleanPassword,
        options: { data: { full_name: cleanFullName } } 
    });
    
    const { data: authData, error: authError } = await Promise.race([signUpPromise, timeoutPromise]) as any;

    if (!authError && authData?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .upsert({ 
            id: authData.user.id,
            email: cleanEmail,
            full_name: cleanFullName,
            phone_number: userData.phoneNumber || '',
            balance: userData.balance !== undefined ? userData.balance : 8000000,
            is_verified: userData.isVerified !== undefined ? userData.isVerified : initialActive,
            is_active: initialActive,
            is_admin: userData.isAdmin || false, 
        })
        .select()
        .single();

      if (!initialActive) {
        setDeactivatedUserId(authData.user.id, true);
      }

      await addUserNotification(authData.user.id, `Akun Anda telah dibuat oleh Administrator.`);

      const createdUser = mapProfileToUser(profileData || {}, authData.user);
      saveCustomUser({ ...createdUser, password: cleanPassword });
      return createdUser;
    }
  } catch (err: any) { 
    console.warn("Supabase Auth tidak dapat diakses, membuat user secara lokal aman:", err?.message || err);
  }

  // Fallback pembuatan user lokal yang selalu berhasil & tersimpan dengan sandi
  const newId = 'user-' + Date.now();
  const fallbackUser: User = {
    id: newId,
    email: cleanEmail,
    fullName: cleanFullName,
    username: cleanEmail.split('@')[0],
    phoneNumber: userData.phoneNumber || '',
    isAdmin: userData.isAdmin || false,
    isVerified: userData.isVerified !== undefined ? userData.isVerified : initialActive,
    isActive: initialActive,
    balance: userData.balance !== undefined ? userData.balance : 8000000,
    password: cleanPassword,
    notifications: [
      { id: '1', message: 'Akun Anda telah dibuat oleh Administrator.', date: new Date().toISOString(), read: false }
    ],
    bankName: userData.bankName || '',
    bankAccountNumber: userData.bankAccountNumber || '',
    bankAccountHolder: userData.bankAccountHolder || cleanFullName
  };

  if (!initialActive) {
    setDeactivatedUserId(newId, true);
  }
  saveCustomUser(fallbackUser);
  return fallbackUser;
};

export const verifyEmail = async (email: string) => true;

/**
 * Sinkronisasi seluruh user yang terdaftar lokal ke Supabase Auth & public.profiles
 */
export const syncCustomUsersToSupabase = async (): Promise<{
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}> => {
  const users = getCustomUsers();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const u of users) {
    try {
      // 1. Daftarkan ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: u.email,
        password: u.password || 'Password123!',
        options: {
          data: {
            full_name: u.fullName,
            username: u.username || u.email.split('@')[0],
            phone_number: u.phoneNumber || '',
          }
        }
      });

      // Jika email sudah ada di auth.users, kita tetap coba upsert ke public.profiles
      const targetId = authData?.user?.id || u.id;

      // 2. Masukkan ke public.profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: targetId,
        email: u.email,
        full_name: u.fullName,
        username: u.username || u.email.split('@')[0],
        phone_number: u.phoneNumber || '',
        balance: u.balance || 8000000,
        is_verified: u.isVerified !== undefined ? u.isVerified : true,
        is_active: u.isActive !== undefined ? u.isActive : true,
        is_admin: u.isAdmin || false,
        bank_name: u.bankName || '',
        bank_account_number: u.bankAccountNumber || '',
        bank_account_holder: u.bankAccountHolder || u.fullName,
      });

      if (profileError) {
        // Coba insert jika upsert gagal
        const { error: insertErr } = await supabase.from('profiles').insert([{
          id: targetId,
          email: u.email,
          full_name: u.fullName,
          username: u.username || u.email.split('@')[0],
          phone_number: u.phoneNumber || '',
          balance: u.balance || 8000000,
          is_verified: u.isVerified !== undefined ? u.isVerified : true,
          is_active: u.isActive !== undefined ? u.isActive : true,
          is_admin: u.isAdmin || false,
        }]);

        if (insertErr) {
          failed++;
          errors.push(`${u.email}: ${insertErr.message}`);
          continue;
        }
      }

      synced++;
    } catch (e: any) {
      failed++;
      errors.push(`${u.email}: ${e?.message || 'Error sinkronisasi'}`);
    }
  }

  return { total: users.length, synced, failed, errors };
};
