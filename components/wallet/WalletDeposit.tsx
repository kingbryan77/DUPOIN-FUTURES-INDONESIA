import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { InformationCircleIcon, ClipboardDocumentCheckIcon, CheckIcon } from '@heroicons/react/24/outline';

const WalletDeposit: React.FC = () => {
  const { deposit, companyBankInfoList, isLoadingTransactions } = useTransactions();
  const location = useLocation();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const amountParam = queryParams.get('amount') || location.state?.amount;
    if (amountParam) {
      const numeric = amountParam.toString().replace(/\D/g, '');
      setAmount(numeric);
    }
  }, [location]);
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\D/g, ''));
    if (!num || num <= 0) {
        setMsg({type:'error', text: 'Masukkan jumlah deposit yang valid'});
        return;
    }
    const success = await deposit(num);
    if(success) {
        setMsg({type:'success', text: `Deposit dalam proses, mohon kirim bukti transfer ke admin.`});
        setAmount('');
    } else {
        setMsg({type:'error', text: 'Gagal membuat permintaan deposit.'});
    }
  };

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('en-US');
  };

  // Define default company bank accounts
  const briBank = {
    bankName: 'Bank Rakyat Indonesia (BRI)',
    accountNumber: '367801004397504',
    accountHolderName: 'GUSTI PUTRAP N'
  };

  const muamalatBank = {
    bankName: 'BANK MUAMALAT',
    accountNumber: '3280019029',
    accountHolderName: 'MUHAMAD DZAKWAN HAKIM'
  };

  const defaultBanks = [briBank, muamalatBank];

  // Show companyBankInfoList from database if available, or fallback to default list
  const allBanks = (companyBankInfoList && companyBankInfoList.length > 0)
    ? companyBankInfoList
    : defaultBanks;

  return (
    <WalletLayout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
                <h3 className="text-[#1E293B] text-xl font-bold mb-6">Deposit</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Jumlah Deposit (Rp)</label>
                        <input 
                            type="text" 
                            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#1E293B] outline-none focus:border-[#00AEEF] font-sans tabular-nums text-sm"
                            placeholder="Contoh: 1.000.000"
                            value={formatCurrencyInput(amount)}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>
                    <button disabled={isLoadingTransactions} className="w-full bg-[#00AEEF] hover:bg-[#009cd7] text-white font-bold py-2.5 rounded-lg transition-colors shadow-md shadow-[#00AEEF]/20 text-sm">
                        {isLoadingTransactions ? 'Memproses...' : 'Kirim Permintaan Deposit'}
                    </button>
                    {msg && (
                        <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                            {msg.text}
                        </div>
                    )}
                </form>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
                <h3 className="text-[#1E293B] text-xl font-bold mb-6">Rekening Tujuan Transfer</h3>
                <div className="space-y-4">
                    {allBanks.map((info, idx) => (
                        <div key={idx} className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex justify-between items-center relative overflow-hidden group">
                            {idx === 0 && (
                                <div className="absolute top-0 right-0 bg-[#00AEEF] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg">
                                    Rekomendasi
                                </div>
                            )}
                            <div>
                                <p className="text-[#00AEEF] font-bold text-sm">{info.bankName}</p>
                                <p className="text-[#1E293B] text-xl tracking-wider font-sans tabular-nums my-1 font-bold">{info.accountNumber}</p>
                                <p className="text-[#64748B] text-xs uppercase font-medium">Atas Nama: {info.accountHolderName}</p>
                            </div>
                            <button 
                                onClick={() => handleCopy(info.accountNumber)}
                                className="text-[#94A3B8] hover:text-[#00AEEF] transition-colors p-2"
                                title="Salin Nomor Rekening"
                            >
                                {copiedText === info.accountNumber ? (
                                    <span className="flex items-center text-success text-xs gap-1 font-bold">
                                        <CheckIcon className="w-5 h-5" />
                                        Tersalin
                                    </span>
                                ) : (
                                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] p-4 rounded-xl text-xs mt-4 flex">
                    <InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 text-[#F59E0B]" />
                    <p>Mohon transfer dengan jumlah yang tepat. Saldo Anda akan diperbarui secara otomatis setelah verifikasi admin selesai dilakukan.</p>
                </div>
            </div>
        </div>
    </WalletLayout>
  );
};

export default WalletDeposit;