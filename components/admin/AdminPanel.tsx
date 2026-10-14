import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { Transaction, TransactionStatus, User, CompanyBankInfo } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { 
    BanknotesIcon, 
    CreditCardIcon, 
    BuildingLibraryIcon, 
    PlusIcon, 
    TrashIcon, 
    XMarkIcon, 
    CurrencyDollarIcon, 
    MagnifyingGlassIcon,
    UserPlusIcon,
    EnvelopeIcon,
    PhoneIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    DocumentDuplicateIcon,
    CheckIcon,
    CommandLineIcon,
    ArrowPathIcon,
    ServerIcon,
    LinkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getSupabaseConfig, updateSupabaseConfig, resetSupabaseConfig, testSupabaseConnection } from '../../services/supabaseClient';
import * as authService from '../../services/authService';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    getAllUsers,
    updateUserVerification,
    updateUserActiveStatus,
    getAllTransactions,
    updateDepositStatus,
    updateWithdrawalStatus,
    companyBankInfoList,
    setCompanyBankInfoList,
    adminUpdateUserBalance,
    adminCreateUser,
    deleteUser
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'settings' | 'security'>('users');
  const [copiedSql, setCopiedSql] = useState(false);
  const [bankList, setBankList] = useState<CompanyBankInfo[]>(companyBankInfoList);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [trxSearch, setTrxSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userActionMessage, setUserActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'set'>('add');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    balance: '8000000',
    isAdmin: false,
    isVerified: true,
    isActive: true,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Supabase Configuration & Health State
  const initialSupabaseConfig = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(initialSupabaseConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(initialSupabaseConfig.anonKey);
  const [isCustomSupabase, setIsCustomSupabase] = useState(initialSupabaseConfig.isCustom);
  const [supabaseTestLoading, setSupabaseTestLoading] = useState(false);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [syncReport, setSyncReport] = useState<{ total: number; synced: number; failed: number; errors: string[] } | null>(null);

  const handleTestSupabase = async () => {
    setSupabaseTestLoading(true);
    setSupabaseTestStatus(null);
    const res = await testSupabaseConnection();
    setSupabaseTestStatus(res);
    setSupabaseTestLoading(false);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    if (res.success) {
      setIsCustomSupabase(true);
      setUserActionMessage({ text: 'Kredensial Supabase berhasil disimpan! Silakan klik "Test Koneksi".', type: 'success' });
      setTimeout(() => setUserActionMessage(null), 4000);
      handleTestSupabase();
    } else {
      setUserActionMessage({ text: res.error || 'Gagal menyimpan kredensial.', type: 'error' });
      setTimeout(() => setUserActionMessage(null), 4000);
    }
  };

  const handleResetSupabaseConfig = () => {
    resetSupabaseConfig();
    const cfg = getSupabaseConfig();
    setSupabaseUrlInput(cfg.url);
    setSupabaseKeyInput(cfg.anonKey);
    setIsCustomSupabase(false);
    setSupabaseTestStatus(null);
    setUserActionMessage({ text: 'Kredensial Supabase dikembalikan ke default.', type: 'success' });
    setTimeout(() => setUserActionMessage(null), 3000);
  };

  const handleSyncUsers = async () => {
    setIsSyncingUsers(true);
    setSyncReport(null);
    try {
      const report = await authService.syncCustomUsersToSupabase();
      setSyncReport(report);
      if (report.synced > 0) {
        setUserActionMessage({ 
          text: `Berhasil menyinkronkan ${report.synced} pengguna ke database Supabase!`, 
          type: 'success' 
        });
      } else if (report.failed > 0) {
        setUserActionMessage({ 
          text: `Gagal sinkronisasi (${report.errors[0] || 'Periksa koneksi Supabase'}).`, 
          type: 'error' 
        });
      }
      setTimeout(() => setUserActionMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      setUserActionMessage({ text: `Gagal sinkronisasi: ${err?.message || err}`, type: 'error' });
    } finally {
      setIsSyncingUsers(false);
    }
  };

  useEffect(() => {
    setBankList(companyBankInfoList);
  }, [companyBankInfoList]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
      if (!trxSearch.trim()) {
          setFilteredTransactions(transactions);
      } else {
          const lower = trxSearch.toLowerCase();
          const filtered = transactions.filter(t => 
             t.id.toLowerCase().includes(lower) || 
             t.userId.toLowerCase().includes(lower) ||
             users.find(u => u.id === t.userId)?.email.toLowerCase().includes(lower) ||
             users.find(u => u.id === t.userId)?.fullName.toLowerCase().includes(lower)
          );
          setFilteredTransactions(filtered);
      }
  }, [trxSearch, transactions, users]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      const fetchedTransactions = await getAllTransactions();
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error loading admin data", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto text-center text-danger py-10">
        Access Denied: You must be an administrator to view this page.
      </div>
    );
  }

  const handleToggleUserActive = async (u: User, newActiveState: boolean) => {
    try {
      await updateUserActiveStatus(u.id, newActiveState);
      setUserActionMessage({
        text: `Akun "${u.fullName}" berhasil ${newActiveState ? 'diaktifkan kembali' : 'dinonaktifkan'}. ${!newActiveState ? 'User tidak dapat melakukan penarikan dana.' : 'User sekarang dapat melakukan penarikan dana.'}`,
        type: 'success'
      });
      setTimeout(() => setUserActionMessage(null), 5000);
      await loadData();
    } catch (err) {
      setUserActionMessage({
        text: `Gagal mengubah status akun "${u.fullName}".`,
        type: 'error'
      });
      setTimeout(() => setUserActionMessage(null), 5000);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === user.id) {
      setUserActionMessage({ text: 'Tidak dapat menghapus akun Anda sendiri.', type: 'error' });
      setTimeout(() => setUserActionMessage(null), 3000);
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${u.fullName}" (${u.email})?`)) {
      try {
        await deleteUser(u.id);
        setUserActionMessage({
          text: `Pengguna "${u.fullName}" berhasil dihapus.`,
          type: 'success'
        });
        setTimeout(() => setUserActionMessage(null), 4000);
        await loadData();
      } catch {
        setUserActionMessage({ text: 'Gagal menghapus pengguna.', type: 'error' });
        setTimeout(() => setUserActionMessage(null), 4000);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    const name = createData.fullName.trim();
    const mail = createData.email.trim();
    const pass = createData.password.trim();

    if (!name || !mail || !pass) {
        setCreateError("Nama Lengkap, Email, dan Password wajib diisi.");
        setCreateLoading(false);
        return;
    }

    if (pass.length < 6) {
        setCreateError("Password minimal 6 karakter.");
        setCreateLoading(false);
        return;
    }

    try {
        const success = await adminCreateUser({
            fullName: name,
            email: mail,
            phoneNumber: createData.phoneNumber.trim(),
            password: pass,
            balance: parseFloat(createData.balance) || 8000000,
            isAdmin: createData.isAdmin,
            isVerified: createData.isVerified,
            isActive: createData.isActive
        });

        if (success) {
            setIsCreateModalOpen(false);
            setCreateData({
                fullName: '',
                email: '',
                phoneNumber: '',
                password: '',
                balance: '8000000',
                isAdmin: false,
                isVerified: true,
                isActive: true
            });
            setUserActionMessage({
                text: `Pengguna baru "${name}" (${mail}) berhasil dibuat & disimpan! Status: ${createData.isActive ? 'Aktif' : 'Nonaktif'}.`,
                type: 'success'
            });
            setTimeout(() => setUserActionMessage(null), 5000);
            await loadData();
        } else {
            setCreateError("Gagal membuat pengguna baru. Silakan periksa kembali data Anda.");
        }
    } catch (err: any) {
        setCreateError(err?.message || "Terjadi kesalahan saat membuat pengguna.");
    } finally {
        setCreateLoading(false);
    }
  };

  const handleBankChange = (index: number, field: keyof CompanyBankInfo, value: string) => {
    const updatedList = [...bankList];
    updatedList[index][field] = value;
    setBankList(updatedList);
  };

  const addBank = () => {
    setBankList([...bankList, { bankName: '', accountNumber: '', accountHolderName: '' }]);
  };

  const removeBank = (index: number) => {
    const updatedList = bankList.filter((_, i) => i !== index);
    setBankList(updatedList);
  };

  const handleUpdateBankInfo = () => {
    setCompanyBankInfoList(bankList);
    alert('Company Bank Info Updated!');
  };

  const handleStatusChange = async (t: Transaction, newStatus: string) => {
      if (t.status === newStatus) return;
      
      const status = newStatus as TransactionStatus;
      if (t.type === 'DEPOSIT') {
          await updateDepositStatus(t.id, status);
      } else if (t.type === 'WITHDRAWAL') {
          await updateWithdrawalStatus(t.id, status);
      }
      await loadData();
  };

  const openBalanceModal = (u: User) => {
    setSelectedUserForBalance(u);
    setBalanceAmount('');
    setBalanceOperation('add');
    setIsBalanceModalOpen(true);
  };

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance || !balanceAmount) return;

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount)) {
        alert("Please enter a valid number");
        return;
    }

    await adminUpdateUserBalance(selectedUserForBalance.id, amount, balanceOperation);
    setIsBalanceModalOpen(false);
    setSelectedUserForBalance(null);
    setBalanceAmount('');
    loadData();
  };

  const getStatusClass = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return 'bg-success/20 text-success';
      case TransactionStatus.PENDING:
        return 'bg-warning/20 text-warning';
      case TransactionStatus.REJECTED:
      case TransactionStatus.FAILED:
      case TransactionStatus.CANCELLED:
        return 'bg-danger/20 text-danger';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getUserDetails = (userId: string) => {
      const u = users.find(user => user.id === userId);
      return u ? `${u.fullName} (${u.email})` : userId;
  };

  return (
    <div className="container mx-auto relative font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Admin Panel</h2>
            <p className="text-gray-500">Manage users, transactions, and company settings.</p>
        </div>
        <Button onClick={loadData} variant="ghost" className="flex items-center" isLoading={isRefreshing}>
             Refresh Data
        </Button>
      </div>

      <div className="bg-darkblue2 p-6 rounded-lg shadow-md">
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`px-4 py-2 text-base sm:text-lg font-medium whitespace-nowrap ${
              activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button
            className={`ml-4 px-4 py-2 text-base sm:text-lg font-medium whitespace-nowrap ${
              activeTab === 'transactions' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            Manage Transactions
          </button>
          <button
            className={`ml-4 px-4 py-2 text-base sm:text-lg font-medium whitespace-nowrap ${
              activeTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Company Settings
          </button>
          <button
            className={`ml-4 px-4 py-2 text-base sm:text-lg font-medium whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <ServerIcon className="w-5 h-5 text-emerald-400" />
            Database Supabase & SQL
          </button>
        </div>

        {activeTab === 'users' && (
          <div>
            {userActionMessage && (
              <div className={`p-4 rounded-xl mb-5 text-sm font-semibold flex items-center justify-between animate-fade-in ${
                userActionMessage.type === 'success' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}>
                <span>{userActionMessage.text}</span>
                <button onClick={() => setUserActionMessage(null)} className="text-gray-400 hover:text-white ml-3">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Registered Profiles ({users.length})</h3>
                  <div className="flex items-center space-x-3 text-xs mt-1 text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {users.filter(u => u.isActive !== false).length} Aktif
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      {users.filter(u => u.isActive === false).length} Nonaktif
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncUsers} 
                    isLoading={isSyncingUsers}
                    className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Sinkronkan ke Supabase
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      Create New User
                  </Button>
                </div>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5 text-xs text-gray-300">
                <ServerIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <span>
                  <strong className="text-white">Status Database Supabase:</strong> Jika data pengguna baru belum masuk ke tabel Supabase, pastikan URL & Key sudah diatur dan klik tombol <span className="text-emerald-400 font-semibold">"Sinkronkan ke Supabase"</span>.
                </span>
              </div>
              <button 
                onClick={() => setActiveTab('security')} 
                className="text-xs text-primary underline hover:text-white flex items-center gap-1 font-semibold whitespace-nowrap"
              >
                Konfigurasi Supabase &rarr;
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-darkblue">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status Akun</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u: User) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 font-sans tabular-nums">{u.id.substring(0,8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white font-medium">{u.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white font-sans tabular-nums">Rp {u.balance.toLocaleString('en-US')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        {u.isActive !== false ? (
                          <span className="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isAdmin ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-400'}`}>
                          {u.isAdmin ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex space-x-2 justify-end items-center">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openBalanceModal(u)}
                                className="bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30"
                            >
                                Edit Balance
                            </Button>
                            {u.isActive !== false ? (
                              <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleToggleUserActive(u, false)}
                                  className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs px-3 py-1.5 font-medium transition-all"
                                  title="Nonaktifkan akun user (User tidak akan bisa melakukan penarikan dana)"
                              >
                                  Nonaktifkan
                              </Button>
                            ) : (
                              <Button
                                  size="sm"
                                  onClick={() => handleToggleUserActive(u, true)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 shadow-sm transition-all"
                                  title="Aktifkan kembali akun user"
                              >
                                  Aktifkan
                              </Button>
                            )}
                            {u.id !== user.id && (
                              <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                  title="Hapus Pengguna"
                              >
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !isRefreshing && (
                      <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No users found in database.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold">Transaction Management</h3>
                <div className="relative w-full sm:w-64 font-sans">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search User ID, Name, Email..." 
                        className="w-full bg-[#1E2329] border border-gray-700 rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                        value={trxSearch}
                        onChange={(e) => setTrxSearch(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto min-h-[400px]">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-darkblue">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTransactions.map((t: Transaction) => (
                    <tr key={t.id} className="hover:bg-white/[0.01]">
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 font-sans tabular-nums">{new Date(t.date).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                          <div className="flex flex-col">
                              <span className="text-white font-medium">{getUserDetails(t.userId).split('(')[0]}</span>
                              <span className="text-xs text-gray-500">{getUserDetails(t.userId).split('(')[1]?.replace(')','')}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${t.type === 'DEPOSIT' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-400'}`}>
                             {t.type}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white font-sans tabular-nums font-bold">Rp {t.amount.toLocaleString('en-US')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-xs sm:text-sm font-medium">
                        {t.type !== 'TRANSFER' ? (
                          t.status === TransactionStatus.PENDING ? (
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleStatusChange(t, TransactionStatus.SUCCESS)} 
                                className="px-3 py-1.5 bg-success hover:bg-[#0BA66A] text-white rounded font-bold text-xs transition-all active:scale-95 uppercase tracking-wide cursor-pointer shadow-sm shadow-success/15"
                              >
                                Success
                              </button>
                              <button 
                                onClick={() => handleStatusChange(t, TransactionStatus.REJECTED)} 
                                className="px-3 py-1.5 bg-danger hover:bg-[#D43D51] text-white rounded font-bold text-xs transition-all active:scale-95 uppercase tracking-wide cursor-pointer shadow-sm shadow-danger/15"
                              >
                                Reject / Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 text-xs italic font-medium mr-2">Selesai</span>
                              <select
                                className="bg-[#1E2329] border border-gray-700 text-gray-400 hover:text-white text-[11px] rounded p-1 focus:border-primary focus:outline-none cursor-pointer"
                                value={t.status}
                                onChange={(e) => handleStatusChange(t, e.target.value)}
                              >
                                  <option value={TransactionStatus.PENDING}>PENDING</option>
                                  <option value={TransactionStatus.SUCCESS}>SUCCESS</option>
                                  <option value={TransactionStatus.REJECTED}>REJECTED</option>
                                  {t.type === 'WITHDRAWAL' && <option value={TransactionStatus.CANCELLED}>CANCELLED</option>}
                                  {t.type === 'WITHDRAWAL' && <option value={TransactionStatus.FAILED}>FAILED</option>}
                              </select>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-500 italic text-xs">Auto-Success</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                      <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No transactions match your search.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Company Bank Information for Deposits</h3>
            <div className="space-y-6">
                {bankList.map((bank, index) => (
                    <div key={index} className="bg-darkblue p-4 rounded-md border border-gray-700 relative group">
                        <h4 className="font-semibold text-lg mb-4 text-white">Bank Account #{index + 1}</h4>
                        <Input
                            id={`adminBankName-${index}`}
                            label="Bank Name"
                            type="text"
                            icon={<BuildingLibraryIcon />}
                            value={bank.bankName}
                            onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                            className="mb-4"
                        />
                        <Input
                            id={`adminAccountNumber-${index}`}
                            label="Account Number"
                            type="text"
                            icon={<CreditCardIcon />}
                            value={bank.accountNumber}
                            onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                            className="mb-4 font-sans"
                        />
                        <Input
                            id={`adminAccountHolderName-${index}`}
                            label="Account Holder Name"
                            type="text"
                            icon={<BanknotesIcon />}
                            value={bank.accountHolderName}
                            onChange={(e) => handleBankChange(index, 'accountHolderName', e.target.value)}
                            className="mb-4"
                        />
                        <Button onClick={() => removeBank(index)} variant="danger" size="sm" className="absolute top-4 right-4 !p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-700 pt-6">
              <Button onClick={addBank} variant="secondary" size="md">
                  <PlusIcon className="h-5 w-5 mr-2" /> Add New Bank Account
              </Button>
              <Button onClick={handleUpdateBankInfo} variant="primary" size="lg" className="shadow-lg shadow-primary/20">
                  Save All Changes
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-darkblue to-darkblue border border-emerald-500/30 rounded-xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ServerIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Integrasi Database Supabase Cloud</h3>
                    <p className="text-gray-400 text-sm">
                      Kelola koneksi database Supabase, verifikasi kata sandi, dan sinkronkan data pengguna langsung ke tabel.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleTestSupabase} 
                    isLoading={supabaseTestLoading}
                    className="whitespace-nowrap"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                    Test Koneksi Database
                  </Button>
                </div>
              </div>

              {/* Status Indicator */}
              {supabaseTestStatus && (
                <div className={`mt-4 p-4 rounded-xl border text-sm font-medium flex items-start gap-3 ${
                  supabaseTestStatus.success 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' 
                    : 'bg-red-500/15 border-red-500/40 text-red-200'
                }`}>
                  {supabaseTestStatus.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{supabaseTestStatus.success ? 'Koneksi Berhasil' : 'Koneksi Bermasalah'}</div>
                    <p className="text-xs mt-0.5 opacity-90">{supabaseTestStatus.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Supabase Connection Settings Form */}
            <div className="bg-darkblue/80 border border-gray-700/80 rounded-xl p-5 sm:p-6">
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                1. Pengaturan Kredensial Supabase Project Anda
              </h4>
              <p className="text-xs text-gray-400 mb-4">
                Dapatkan Project URL & Anon Key di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary underline font-semibold">Supabase Dashboard &gt; Project Settings &gt; API</a>.
              </p>

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary font-mono"
                      placeholder="https://xyzabcdefghijklmn.supabase.co"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Supabase Anon (Public) Key
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary font-mono truncate"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isCustomSupabase ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    <span>Status: <strong>{isCustomSupabase ? 'Kredensial Kustom Aktif' : 'Kredensial Default'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCustomSupabase && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleResetSupabaseConfig}>
                        Reset ke Default
                      </Button>
                    )}
                    <Button type="submit" variant="primary" size="sm">
                      Simpan Kredensial & Hubungkan
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* 2. Synchronize Data to Supabase Table */}
            <div className="bg-darkblue/80 border border-gray-700/80 rounded-xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowPathIcon className="w-5 h-5 text-emerald-400" />
                    2. Sinkronkan Pengguna Terdaftar ke Tabel Supabase
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Jika ada akun yang sebelumnya terdaftar tetapi datanya belum masuk ke tabel Supabase (<code className="text-emerald-300">auth.users</code> & <code className="text-emerald-300">public.profiles</code>), tekan tombol ini untuk memasukkan seluruh akun ke database sekarang.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="md" 
                  onClick={handleSyncUsers} 
                  isLoading={isSyncingUsers}
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 whitespace-nowrap shadow-md shadow-emerald-950"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Sinkronkan Pengguna Sekarang
                </Button>
              </div>

              {syncReport && (
                <div className="bg-slate-900 border border-gray-800 rounded-lg p-4 mt-3 text-xs">
                  <div className="font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>Laporan Hasil Sinkronisasi:</span>
                    <span className="text-emerald-400">{syncReport.synced} Berhasil Masuk</span>
                    {syncReport.failed > 0 && <span className="text-red-400">• {syncReport.failed} Gagal</span>}
                  </div>
                  <p className="text-gray-400">Total akun diproses: {syncReport.total}</p>
                  {syncReport.errors.length > 0 && (
                    <div className="mt-2 text-red-300 font-mono bg-red-950/40 p-2.5 rounded border border-red-900/50 space-y-1">
                      {syncReport.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Explanation Why Data Might Not Enter */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5">
              <h4 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
                Mengapa Data Pengguna Bisa Terdaftar Tapi Belum Masuk ke Tabel Supabase?
              </h4>
              <div className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                  <p>
                    <strong>URL & API Key Supabase Belum Terhubung:</strong> Jika URL Supabase masih menggunakan placeholder atau domain salah, aplikasi menyimpan akun ke penyimpanan lokal agar aplikasi tidak error saat dicoba. Pastikan Anda telah memasukkan Project URL Supabase Anda di form atas.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                  <p>
                    <strong>Tabel <code className="text-amber-200">public.profiles</code> Belum Dibuat di Supabase:</strong> Di Supabase, pendaftaran akun masuk ke tabel <code className="text-amber-200">auth.users</code>. Agar data profil lengkap masuk ke tabel yang bisa dilihat di Table Editor, Anda harus menjalankan skrip SQL di bawah ini di menu <strong>SQL Editor</strong> Supabase.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                  <p>
                    <strong>Opsi "Confirm email" di Supabase Masih Aktif:</strong> Di dashboard Supabase &gt; <em>Authentication &gt; Providers &gt; Email</em>, matikan opsi <em>Confirm email</em> agar pengguna langsung aktif dan terdaftar tanpa perlu konfirmasi tautan email.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Complete SQL Script Viewer with Copy Button */}
            <div className="bg-darkblue/60 border border-gray-700 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <CommandLineIcon className="w-5 h-5 text-primary" />
                    4. Skrip SQL Lengkap Database Dupoin (<code className="text-xs text-primary font-mono">supabase_schema.sql</code>)
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Salin skrip di bawah ini, lalu buka <strong>Supabase Dashboard &gt; SQL Editor &gt; New query &gt; Run</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fullSql = `-- =========================================================================
-- DUPOIN PRO BROKER - SUPABASE DATABASE & AUTHENTICATION SECURITY SCHEMA
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABEL PROFILES
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

-- 2. TABEL TRANSACTIONS
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABEL COMPANY_BANK_INFO
CREATE TABLE IF NOT EXISTS public.company_bank_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. FUNCTION TRIGGER OTOMATIS HANDLE_NEW_USER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, full_name, username, phone_number, balance, is_verified, is_active, is_admin
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        8000000.00, true, true,
        CASE WHEN NEW.email ILIKE '%admin%' THEN true ELSE false END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
        updated_at = NOW();

    INSERT INTO public.notifications (user_id, message, date, read)
    VALUES (NEW.id, 'Selamat datang di Dupoin Pro Trader! Akun Anda telah aktif dan terverifikasi.', NOW(), false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SETUP ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bank_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;
CREATE POLICY "Profiles view policy" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Transactions view policy" ON public.transactions;
CREATE POLICY "Transactions view policy" ON public.transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transactions insert policy" ON public.transactions;
CREATE POLICY "Transactions insert policy" ON public.transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Transactions update policy" ON public.transactions;
CREATE POLICY "Transactions update policy" ON public.transactions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Notifications policy" ON public.notifications;
CREATE POLICY "Notifications policy" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Company bank info policy" ON public.company_bank_info;
CREATE POLICY "Company bank info policy" ON public.company_bank_info FOR ALL USING (true);`;

                    navigator.clipboard.writeText(fullSql);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-900/30 whitespace-nowrap"
                >
                  {copiedSql ? (
                    <>
                      <CheckIcon className="w-5 h-5 text-white" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="w-5 h-5" />
                      <span>Salin Skrip SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 border border-gray-800 rounded-xl p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-850">
                  <span className="text-xs font-mono text-gray-400">supabase_schema.sql (Lengkap dengan profiles, transactions, trigger & RLS)</span>
                  <span className="text-xs text-emerald-400 font-mono">PostgreSQL 15+</span>
                </div>
                <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto p-2 bg-black/40 rounded-lg leading-relaxed max-h-80">
{`-- 1. TABEL PROFILES (DENGAN TRIGGER OTOMATIS)
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. TRIGGER HANDLE_NEW_USER
-- Memastikan saat akun dibuat di Supabase Auth, otomatis masuk ke public.profiles!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, username, phone_number, balance, is_verified, is_active, is_admin)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'phone_number', ''), 8000000.00, true, true, CASE WHEN NEW.email ILIKE '%admin%' THEN true ELSE false END)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS POLICIES (MENGIZINKAN INSERT DARI FRONTEND)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles view policy" ON public.profiles FOR SELECT USING (true);`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-darkblue2 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in font-sans">
                <div className="bg-darkblue p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-white text-lg font-semibold flex items-center uppercase tracking-wider">
                        <UserPlusIcon className="w-5 h-5 mr-2 text-primary" />
                        Create New User
                    </h3>
                    <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {createError && (
                        <div className="bg-danger/20 text-danger p-3 rounded-md text-sm border border-danger/30">
                            {createError}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            id="createFullName"
                            label="Full Name"
                            placeholder="John Doe"
                            icon={<PlusIcon />}
                            value={createData.fullName}
                            onChange={(e) => setCreateData({...createData, fullName: e.target.value})}
                        />
                        <Input 
                            id="createEmail"
                            label="Email"
                            type="email"
                            placeholder="john@example.com"
                            icon={<EnvelopeIcon />}
                            value={createData.email}
                            onChange={(e) => setCreateData({...createData, email: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            id="createPhone"
                            label="Phone Number"
                            placeholder="081234..."
                            icon={<PhoneIcon />}
                            value={createData.phoneNumber}
                            onChange={(e) => setCreateData({...createData, phoneNumber: e.target.value})}
                        />
                        <Input 
                            id="createPassword"
                            label="Password"
                            type="password"
                            icon={<LockClosedIcon />}
                            value={createData.password}
                            onChange={(e) => setCreateData({...createData, password: e.target.value})}
                        />
                    </div>

                    <Input 
                        id="createBalance"
                        label="Initial Balance (Rp)"
                        type="number"
                        icon={<CurrencyDollarIcon />}
                        value={createData.balance}
                        onChange={(e) => setCreateData({...createData, balance: e.target.value})}
                        className="font-sans"
                    />

                    <div className="flex flex-col space-y-3 pt-2">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={createData.isAdmin}
                                onChange={(e) => setCreateData({...createData, isAdmin: e.target.checked})}
                                className="w-5 h-5 bg-darkblue border-gray-700 rounded text-primary focus:ring-0"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Make Administrator</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={createData.isActive}
                                onChange={(e) => setCreateData({...createData, isActive: e.target.checked})}
                                className="w-5 h-5 bg-darkblue border-gray-700 rounded text-emerald-500 focus:ring-0"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                              Status Akun: Aktif (User dapat melakukan penarikan & transaksi)
                            </span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={createData.isVerified}
                                onChange={(e) => setCreateData({...createData, isVerified: e.target.checked})}
                                className="w-5 h-5 bg-darkblue border-gray-700 rounded text-primary focus:ring-0"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Auto-Verify Account</span>
                        </label>
                    </div>

                    <div className="mt-8 flex space-x-3 pt-4 border-t border-gray-700">
                        <Button type="button" variant="ghost" fullWidth onClick={() => setIsCreateModalOpen(false)} disabled={createLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" fullWidth isLoading={createLoading} disabled={createLoading}>
                            Save & Create
                        </Button>
                    </div>
                </form>
              </div>
          </div>
      )}

      {/* Balance Edit Modal */}
      {isBalanceModalOpen && selectedUserForBalance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-darkblue2 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in font-sans">
                <div className="bg-darkblue p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-white text-lg font-semibold flex items-center uppercase tracking-widest">
                        <CurrencyDollarIcon className="w-5 h-5 mr-2 text-primary" />
                        Edit User Balance
                    </h3>
                    <button onClick={() => setIsBalanceModalOpen(false)} className="text-gray-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleBalanceSubmit} className="p-6">
                    <div className="mb-6 bg-darkblue/50 p-4 rounded-lg border border-gray-800">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Target User</p>
                        <p className="text-white font-medium text-lg">{selectedUserForBalance.fullName}</p>
                        <p className="text-gray-400 text-sm">{selectedUserForBalance.email}</p>
                    </div>
                    
                    <div className="mb-8">
                         <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Current Balance</p>
                         <p className="text-3xl font-sans font-black text-white">Rp {selectedUserForBalance.balance.toLocaleString('en-US')}</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs text-gray-500 mb-3 uppercase tracking-widest font-bold">Select Operation</label>
                            <div className="flex space-x-4">
                                <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${balanceOperation === 'add' ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10 scale-105' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                                    <input 
                                        type="radio" 
                                        name="operation" 
                                        value="add" 
                                        checked={balanceOperation === 'add'} 
                                        onChange={() => setBalanceOperation('add')}
                                        className="hidden" 
                                    />
                                    <PlusIcon className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Add/Deduct</span>
                                </label>
                                <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${balanceOperation === 'set' ? 'bg-warning/20 border-warning text-white shadow-lg shadow-warning/10 scale-105' : 'border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                                    <input 
                                        type="radio" 
                                        name="operation" 
                                        value="set" 
                                        checked={balanceOperation === 'set'} 
                                        onChange={() => setBalanceOperation('set')}
                                        className="hidden" 
                                    />
                                    <BanknotesIcon className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Set Absolute</span>
                                </label>
                            </div>
                        </div>

                        <Input 
                            id="adminBalanceInput"
                            label={balanceOperation === 'add' ? "Amount (Negative for deduction)" : "New Absolute Total"}
                            type="number"
                            placeholder="0"
                            value={balanceAmount}
                            onChange={(e) => setBalanceAmount(e.target.value)}
                            icon={<CurrencyDollarIcon />}
                            className="font-sans"
                        />
                    </div>

                    <div className="mt-10 flex space-x-3">
                        <Button type="button" variant="ghost" fullWidth onClick={() => setIsBalanceModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" fullWidth className="shadow-lg shadow-primary/20">
                            Confirm Update
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
