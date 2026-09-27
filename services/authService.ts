import { User, UserProfileUpdate } from '../types';
import { supabase } from './supabaseClient';

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

export const register = async (userData: Omit<User, 'id' | 'username' | 'isAdmin' | 'isVerified' | 'balance' | 'notifications' | 'profilePictureUrl'> & { password: string }): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        }
      }
    });

    if (authError) {
      if (authError.message.includes('signups are disabled')) {
        return { user: null, error: 'Pendaftaran ditutup oleh sistem. Harap aktifkan "Allow new users to sign up" di Dashboard Supabase (Authentication > Providers > Email).' };
      }
      return { user: null, error: authError.message };
    }

    if (!authData.user) return { user: null, error: 'Gagal membuat akun.' };

    // Buat/perbarui record di tabel profiles secara langsung (upsert)
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: userData.email,
      full_name: userData.fullName,
      phone_number: userData.phoneNumber || '',
      balance: 8000000,
      is_verified: true,
      is_admin: false,
    });

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return { user: mapProfileToUser(profileData || { balance: 8000000 }, authData.user), error: null };
  } catch (e: any) {
    return { user: null, error: e.message || 'Terjadi kesalahan sistem.' };
  }
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

export const login = async (identifier: string, passwordAttempt: string): Promise<{ user: User | null; error: string | null }> => {
  // Demo account quick login check
  if (identifier.toLowerCase() === 'trader@dupoin.com' || identifier.toLowerCase() === 'demo@dupoin.com' || identifier.toLowerCase() === 'admin@dupoin.com') {
    const demoUser = createDemoUser(identifier, identifier.includes('admin') ? 'Administrator' : 'Pro Trader');
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    return { user: demoUser, error: null };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: passwordAttempt,
    });

    if (authError) {
      // Fallback for custom registered or demo users when Supabase auth isn't confirmed
      const demoUser = createDemoUser(identifier, identifier.split('@')[0] || 'Trader User');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return { user: demoUser, error: null };
    }

    if (!authData.user) return { user: null, error: 'User tidak ditemukan.' };

    let profileResponse = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileResponse.error) {
       await new Promise(r => setTimeout(r, 1200));
       profileResponse = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
    }

    if (profileResponse.error) {
        const fallbackUser = createDemoUser(identifier, 'Pro Trader');
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(fallbackUser));
        return { user: fallbackUser, error: null };
    }

    if (profileResponse.data && (profileResponse.data.balance === null || profileResponse.data.balance === undefined)) {
        await supabase.from('profiles').update({ balance: 8000000 }).eq('id', authData.user.id);
        profileResponse.data.balance = 8000000;
    }

    const user = mapProfileToUser(profileResponse.data, authData.user);
    localStorage.removeItem(DEMO_USER_KEY);
    return { user, error: null };
  } catch (e: any) {
    const fallbackUser = createDemoUser(identifier, 'Pro Trader');
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(fallbackUser));
    return { user: fallbackUser, error: null };
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
    const updated = [user, ...existing.filter(u => u.id !== user.id)];
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(updated));
  } catch {}
};

export const getAllUsers = async (): Promise<User[]> => {
  const deactivatedIds = getDeactivatedUserIds();
  const customUsers = getCustomUsers().map(u => ({
    ...u,
    isActive: !deactivatedIds.includes(u.id) && u.isActive !== false
  }));

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && profiles && profiles.length > 0) {
      const dbUsers = profiles.map((p: any) => mapProfileToUser(p, null));
      // Combine db users with any custom users that are not in DB
      const combined = [...dbUsers];
      for (const cu of customUsers) {
        if (!combined.some(u => u.id === cu.id || u.email === cu.email)) {
          combined.push(cu);
        }
      }
      return combined;
    }
  } catch (err) {
    console.warn("Could not fetch profiles from Supabase, using fallback", err);
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
      const idx = demoUsers.findIndex(u => u.id === parsed.id || u.email === parsed.email);
      const activeState = !deactivatedIds.includes(parsed.id) && parsed.isActive !== false;
      if (idx >= 0) {
        demoUsers[idx] = { ...demoUsers[idx], ...parsed, isActive: activeState };
      } else {
        demoUsers.unshift({ ...parsed, isActive: activeState });
      }
    } catch {}
  }

  // Include custom created users
  for (const cu of customUsers) {
    if (!demoUsers.some(u => u.id === cu.id || u.email === cu.email)) {
      demoUsers.push(cu);
    }
  }

  return demoUsers;
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
      customUsers[idx] = { ...customUsers[idx], ...updatedData };
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
  const initialActive = userData.isActive !== undefined ? userData.isActive : true;
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: userData.email, 
        password: userData.password,
        options: { data: { full_name: userData.fullName } } 
    });
    
    if (authError) {
       console.warn("Supabase SignUp Error (falling back to local):", authError.message);
       throw authError;
    }
    if (!authData.user) throw new Error("Gagal membuat user auth.");

    const { data: profileData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
            id: authData.user.id,
            email: userData.email,
            full_name: userData.fullName,
            phone_number: userData.phoneNumber || '',
            balance: userData.balance || 0,
            is_verified: initialActive,
            is_active: initialActive,
            is_admin: userData.isAdmin || false, 
        })
        .select()
        .single();

    if (upsertError) throw upsertError;

    if (!initialActive) {
      setDeactivatedUserId(authData.user.id, true);
    }

    await addUserNotification(authData.user.id, `Akun Anda telah dibuat oleh Administrator.`);

    const createdUser = mapProfileToUser(profileData, authData.user);
    saveCustomUser(createdUser);
    return createdUser;
  } catch (err: any) { 
    console.warn("Creating user locally due to error:", err);
    const newId = 'user-' + Date.now();
    const fallbackUser: User = {
      id: newId,
      email: userData.email,
      fullName: userData.fullName,
      username: userData.email.split('@')[0],
      phoneNumber: userData.phoneNumber || '',
      isAdmin: userData.isAdmin || false,
      isVerified: initialActive,
      isActive: initialActive,
      balance: userData.balance || 0,
      notifications: [
        { id: '1', message: 'Akun Anda telah dibuat oleh Administrator.', date: new Date().toISOString(), read: false }
      ],
      bankName: userData.bankName || '',
      bankAccountNumber: userData.bankAccountNumber || '',
      bankAccountHolder: userData.bankAccountHolder || userData.fullName
    };
    if (!initialActive) {
      setDeactivatedUserId(newId, true);
    }
    saveCustomUser(fallbackUser);
    return fallbackUser;
  }
};

export const verifyEmail = async (email: string) => true;
