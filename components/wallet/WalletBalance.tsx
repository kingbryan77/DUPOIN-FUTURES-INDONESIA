import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { BanknotesIcon } from '@heroicons/react/24/outline';

const WalletBalance: React.FC = () => {
  const { balance } = useTransactions();

  return (
    <WalletLayout>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center shadow-sm font-sans max-w-3xl mx-auto">
            <div className="inline-block p-5 bg-[#00AEEF]/10 rounded-full mb-6 border border-[#00AEEF]/20">
                <BanknotesIcon className="w-12 h-12 text-[#00AEEF]" />
            </div>
            <h3 className="text-[#64748B] text-base mb-2 font-medium">Total Saldo Tersedia</h3>
            <h1 className="text-4xl sm:text-5xl text-[#1E293B] font-bold font-sans mb-8 tabular-nums">Rp {balance.toLocaleString('en-US')}</h1>
            <div className="max-w-md mx-auto p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <p className="text-[#64748B] text-sm leading-relaxed">
                    Saldo ini dapat digunakan untuk perdagangan, investasi, atau ditarik ke rekening bank terdaftar Anda secara instan.
                </p>
            </div>
        </div>
    </WalletLayout>
  );
};

export default WalletBalance;