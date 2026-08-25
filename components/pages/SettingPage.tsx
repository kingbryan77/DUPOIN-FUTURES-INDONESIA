import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { 
  UserIcon, 
  PhoneIcon, 
  CameraIcon, 
  BuildingLibraryIcon, 
  CreditCardIcon, 
  IdentificationIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { BANK_OPTIONS, E_WALLET_OPTIONS } from '../../constants';

const SettingPage: React.FC = () => {
  const { user, isLoading, updateProfile, error } = useAuth();
  
  // Profile Information
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePictureUrl || null);
  
  // Bank / Withdrawal Information
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(user?.bankAccountHolder || user?.fullName || '');

  const [formErrors, setFormErrors] = useState<{ 
    fullName?: string; 
    phoneNumber?: string; 
    profilePicture?: string; 
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    api?: string 
  }>({});
  
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [bankSuccessMessage, setBankSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setProfilePicture(user.profilePictureUrl || null);
      setBankName(user.bankName || '');
      setBankAccountNumber(user.bankAccountNumber || '');
      setBankAccountHolder(user.bankAccountHolder || user.fullName || '');
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      setFormErrors(prev => ({ ...prev, api: error }));
    } else {
      setFormErrors(prev => ({ ...prev, api: undefined }));
    }
  }, [error]);

  const validateProfile = (): boolean => {
    const newErrors: typeof formErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Nama lengkap tidak boleh kosong.';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor telepon tidak boleh kosong.';
    } else if (!/^\d+$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Nomor telepon harus berupa angka.';
    }
    setFormErrors(prev => ({ ...prev, ...newErrors }));
    return !newErrors.fullName && !newErrors.phoneNumber;
  };

  const validateBank = (): boolean => {
    const newErrors: typeof formErrors = {};
    if (!bankName.trim()) {
      newErrors.bankName = 'Silakan pilih Bank atau E-Wallet.';
    }
    if (!bankAccountNumber.trim()) {
      newErrors.bankAccountNumber = 'Nomor rekening / nomor akun tidak boleh kosong.';
    } else if (!/^\d+$/.test(bankAccountNumber.replace(/\s|-/g, ''))) {
      newErrors.bankAccountNumber = 'Nomor rekening harus berupa angka.';
    }
    if (!bankAccountHolder.trim()) {
      newErrors.bankAccountHolder = 'Nama pemilik rekening tidak boleh kosong.';
    }
    setFormErrors(prev => ({ ...prev, ...newErrors }));
    return !newErrors.bankName && !newErrors.bankAccountNumber && !newErrors.bankAccountHolder;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE_MB = 2;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
      const MIN_WIDTH = 200;
      const MIN_HEIGHT = 200;

      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormErrors(prev => ({ ...prev, profilePicture: `Format tidak didukung. Gunakan JPG, PNG, atau GIF.` }));
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormErrors(prev => ({ ...prev, profilePicture: `Ukuran gambar maksimal ${MAX_FILE_SIZE_MB}MB.` }));
        return;
      }

      const reader = new FileReader();
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (image.width < MIN_WIDTH || image.height < MIN_HEIGHT) {
          setFormErrors(prev => ({ ...prev, profilePicture: `Dimensi gambar minimal ${MIN_WIDTH}x${MIN_HEIGHT} piksel.` }));
          return;
        }
        reader.onloadend = () => {
          setProfilePicture(reader.result as string);
          setFormErrors(prev => ({ ...prev, profilePicture: undefined, api: undefined }));
        };
        reader.readAsDataURL(file);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setFormErrors(prev => ({ ...prev, profilePicture: 'Tidak dapat membaca file gambar.' }));
      };

      image.src = objectUrl;
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMessage(null);
    setFormErrors(prev => ({ ...prev, fullName: undefined, phoneNumber: undefined, api: undefined }));

    if (!user) {
      setFormErrors(prev => ({ ...prev, api: 'User belum login.' }));
      return;
    }

    if (!validateProfile()) {
      return;
    }

    const success = await updateProfile({ 
      fullName, 
      phoneNumber, 
      profilePictureUrl: profilePicture || undefined 
    });

    if (success) {
      setProfileSuccessMessage('Profil berhasil diperbarui!');
      setTimeout(() => setProfileSuccessMessage(null), 4000);
    } else {
      setFormErrors(prev => ({ ...prev, api: error || 'Gagal memperbarui profil.' }));
    }
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSuccessMessage(null);
    setFormErrors(prev => ({ ...prev, bankName: undefined, bankAccountNumber: undefined, bankAccountHolder: undefined, api: undefined }));

    if (!user) {
      setFormErrors(prev => ({ ...prev, api: 'User belum login.' }));
      return;
    }

    if (!validateBank()) {
      return;
    }

    const success = await updateProfile({
      bankName,
      bankAccountNumber: bankAccountNumber.replace(/\s|-/g, ''),
      bankAccountHolder
    });

    if (success) {
      setBankSuccessMessage('Informasi rekening berhasil disimpan! Rekening ini akan otomatis terisi saat penarikan (withdrawal).');
      setTimeout(() => setBankSuccessMessage(null), 5000);
    } else {
      setFormErrors(prev => ({ ...prev, api: error || 'Gagal menyimpan data rekening.' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Pengaturan Akun</h2>
        <p className="text-[#64748B] text-sm mt-1">
          Kelola profil pribadi, kontak, dan nomor rekening penarikan dana Anda.
        </p>
      </div>

      {formErrors.api && (
        <div className="bg-danger/15 text-danger p-4 rounded-2xl text-sm font-medium border border-danger/20">
          {formErrors.api}
        </div>
      )}

      {/* Section 1: Data Rekening Bank / E-Wallet untuk Penarikan */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#00AEEF]/10 rounded-2xl text-[#00AEEF]">
              <BuildingLibraryIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">Rekening Penarikan Dana (Withdrawal)</h3>
              <p className="text-[#64748B] text-xs mt-0.5">
                Nomor rekening ini akan otomatis muncul pada formulir penarikan dana untuk mempermudah transaksi Anda.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 bg-[#00D09C]/10 text-[#0A3825] border border-[#00D09C]/20 px-3 py-1.5 rounded-full text-xs font-bold">
            <ShieldCheckIcon className="w-4 h-4 text-[#00D09C]" />
            <span>Otomatis Terhubung</span>
          </div>
        </div>

        {bankSuccessMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl text-sm font-medium flex items-start space-x-2.5 mb-6">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{bankSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveBankInfo} className="space-y-5">
          {/* Pilih Bank / E-Wallet */}
          <div>
            <label className="block text-[#64748B] text-xs font-bold uppercase tracking-wider mb-2">
              Nama Bank / E-Wallet <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <select
                id="bankNameSelect"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#1E293B] font-medium outline-none focus:border-[#00AEEF] focus:bg-white transition-all appearance-none cursor-pointer"
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                  setFormErrors(prev => ({ ...prev, bankName: undefined }));
                }}
                disabled={isLoading}
              >
                <option value="">-- Pilih Bank atau E-Wallet --</option>
                <optgroup label="Pilihan Bank Terdaftar">
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Pilihan E-Wallet">
                  {E_WALLET_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#94A3B8]">
                ▼
              </div>
            </div>
            {formErrors.bankName && <p className="mt-1.5 text-xs text-danger font-medium">{formErrors.bankName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nomor Rekening */}
            <div>
              <Input
                id="bankAccountNumberInput"
                label="Nomor Rekening / No. E-Wallet"
                type="text"
                icon={<CreditCardIcon />}
                placeholder="Contoh: 8735129481"
                value={bankAccountNumber}
                onChange={(e) => {
                  setBankAccountNumber(e.target.value);
                  setFormErrors(prev => ({ ...prev, bankAccountNumber: undefined }));
                }}
                error={formErrors.bankAccountNumber}
                disabled={isLoading}
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">Pastikan nomor rekening aktif dan sesuai.</p>
            </div>

            {/* Nama Pemilik Rekening */}
            <div>
              <Input
                id="bankAccountHolderInput"
                label="Nama Pemilik Rekening"
                type="text"
                icon={<IdentificationIcon />}
                placeholder="Contoh: ANDI WIJAYA"
                value={bankAccountHolder}
                onChange={(e) => {
                  setBankAccountHolder(e.target.value);
                  setFormErrors(prev => ({ ...prev, bankAccountHolder: undefined }));
                }}
                error={formErrors.bankAccountHolder}
                disabled={isLoading}
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">Harus sama persis dengan nama di buku tabungan.</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#00AEEF] hover:bg-[#009cd7] active:scale-95 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-150 text-sm shadow-md shadow-[#00AEEF]/20 flex items-center space-x-2"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Simpan Rekening Penarikan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Edit Profile */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center space-x-3 border-b border-[#E2E8F0] pb-4 mb-6">
          <div className="p-2.5 bg-[#F1F5F9] rounded-2xl text-[#64748B]">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">Informasi Profil</h3>
            <p className="text-[#64748B] text-xs mt-0.5">
              Perbarui foto profil dan data kontak akun Anda.
            </p>
          </div>
        </div>

        {profileSuccessMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl text-sm font-medium flex items-center space-x-2.5 mb-6">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{profileSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          {/* Profile Picture Upload */}
          <div>
            <label className="block text-[#64748B] text-xs font-bold uppercase tracking-wider mb-3">Foto Profil</label>
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-[#00AEEF] shadow-sm" />
                ) : (
                  <UserIcon className="h-20 w-20 text-[#94A3B8] rounded-full border-2 border-[#CBD5E1] p-2 bg-[#F8FAFC]" />
                )}
              </div>
              <div>
                <label htmlFor="profilePictureInput" className="cursor-pointer bg-white hover:bg-[#F8FAFC] text-[#1E293B] border border-[#CBD5E1] font-semibold py-2.5 px-4 rounded-xl inline-flex items-center transition-all duration-200 text-sm shadow-sm active:scale-95">
                  <CameraIcon className="h-4 h-4 mr-2 text-[#64748B]" />
                  Unggah Foto Baru
                </label>
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/jpeg, image/png, image/gif"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-[#94A3B8]">Maksimal file: 2MB (JPG, PNG, GIF). Min. 200x200px.</p>
              </div>
            </div>
            {formErrors.profilePicture && <p className="mt-2 text-sm text-danger">{formErrors.profilePicture}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="fullName"
              label="Nama Lengkap"
              type="text"
              icon={<UserIcon />}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFormErrors(prev => ({ ...prev, fullName: undefined, api: undefined }));
              }}
              error={formErrors.fullName}
              disabled={isLoading}
            />
            <Input
              id="phoneNumber"
              label="Nomor Telepon"
              type="tel"
              icon={<PhoneIcon />}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setFormErrors(prev => ({ ...prev, phoneNumber: undefined, api: undefined }));
              }}
              error={formErrors.phoneNumber}
              disabled={isLoading}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
              Simpan Profil
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingPage;
