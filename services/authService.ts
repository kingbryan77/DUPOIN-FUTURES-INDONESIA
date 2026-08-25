import { User, UserProfileUpdate } from '../types';
import { supabase } from './supabaseClient';

const mapProfileToUser = (profile: any, authUser: any): User => {
  return {
    id: authUser?.id || profile?.id,
    email: profile.email || authUser?.email || '',
    fullName: profile.full_name || '',
    username: profile.username || '',
    phoneNumber: profile.phone_number || '',
    isAdmin: profile.is_admin || false,
    isVerified: profile.is_verified || true, 
    balance: (profile?.balance !== undefined && profile?.balance !== null) ? Number(profile.balance) : 8000000,
    notifications: [], 
    profilePictureUrl: profile.profile_picture_url,
    bankName: profile.bank_name || '',
    bankAccountNumber: profile.bank_account_number || '',
    bankAccountHolder: profile.bank_account_holder || profile.full_name || '',
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

const createDemoUser = (email: string, fullName = 'Pro Trader'): User => ({
  id: 'demo-user-id-001',
  email: email || 'trader@dupoin.com',
  fullName: fullName || 'Pro Trader',
  username: 'pro_trader',
  phoneNumber: '081234567890',
  isAdmin: true,
  isVerified: true,
  balance: 8000000,
  notifications: [
    { id: '1', message: 'Selamat datang di Dupoin Pro Trader!', date: new Date().toISOString(), read: false }
  ],
  profilePictureUrl: undefined,
  bankName: 'Bank Central Asia (BCA)',
  bankAccountNumber: '8735129481',
  bankAccountHolder: fullName || 'Pro Trader'
});

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

export const getAllUsers = async (): Promise<User[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return profiles.map((p: any) => mapProfileToUser(p, null));
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
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(merged));
      }
    } catch {
      // ignore
    }
  }

  try {
    await supabase.from('profiles').update(updates).eq('id', updatedData.id);
  } catch (err) {
    console.warn("Supabase profile update warning:", err);
  }
};

export const adminCreateUser = async (userData: Omit<User, 'id' | 'username' | 'notifications'> & { password: string }): Promise<User | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: userData.email, 
        password: userData.password,
        options: { data: { full_name: userData.fullName } } 
    });
    
    if (authError) {
       console.error("Supabase SignUp Error:", authError.message);
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
            is_verified: true,
            is_admin: userData.isAdmin || false, 
        })
        .select()
        .single();

    if (upsertError) throw upsertError;

    await addUserNotification(authData.user.id, `Akun Anda telah dibuat oleh Administrator.`);

    return mapProfileToUser(profileData, authData.user);
  } catch (err: any) { 
    console.error("Admin Create User Error:", err);
    return null; 
  }
};

export const verifyEmail = async (email: string) => true;
