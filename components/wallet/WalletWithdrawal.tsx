import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { E_WALLET_OPTIONS, BANK_OPTIONS } from '../../constants';
import { TransactionStatus } from '../../types';
import Button from '../common/Button';
import WalletLayout from './WalletLayout';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

const WalletWithdrawal: React.FC = () => {
  const { user } = useAuth();
  const { balance, withdraw, isLoadingTransactions, withdrawalHistory, accountMode } = useTransactions();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'bank' | 'e-wallet'>('bank');
  const [bankOrEwalletName, setBankOrEwalletName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isLowBalance = balance <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (accountMode === 'demo') {
         setMessage({ type: 'error', text: 'Demo mode active.' });
         return;
    }

    const numAmount = parseFloat(amount.replace(/\D/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
        setMessage({ type: 'error', text: 'Invalid amount.' });
        return;
    }

    const fullMethodName = method === 'bank' ? `Bank (${bankOrEwalletName})` : `E-Wallet (${bankOrEwalletName})`;
    const success = await withdraw(numAmount, fullMethodName, bankOrEwalletName, accountNumber, accountHolderName);

    if (success) {
      setMessage({ type: 'success', text: 'Withdrawal submitted.' });
      setAmount('');
      setAccountNumber('');
    } else {
      setMessage({ type: 'error', text: 'Withdrawal failed. Check balance.' });
    }
  };

  return (
    <WalletLayout>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Column: Withdrawal Form */}
           <div className="lg:col-span-1">
               <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden p-6 sm:p-7">
                   <h2 className="text-2xl font-bold text-[#1E293B] mb-6">Withdrawal</h2>
                   
                   {/* Green Status / Processing Alert Banner */}
                   <div className="bg-[#00D09C] text-white p-4 rounded-xl text-xs sm:text-sm font-medium mb-6 shadow-sm leading-relaxed">
                       Withdrawal IDR Balance no E42I9NR341RN has been successfully, please wait we will process your withdrawal.
                   </div>
                   
                   <form onSubmit={handleSubmit} className="space-y-4">
                       
                       {/* Available Balance Section */}
                       <div>
                           <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Available Balance</label>
                           <div className="flex">
                               <div className="bg-white text-[#64748B] text-sm font-medium px-4 py-2.5 border border-[#CBD5E1] rounded-l-lg flex items-center justify-center">IDR</div>
                               <div className={`flex-1 ${isLowBalance ? 'bg-[#E50914]' : 'bg-[#0ECB81]'} text-white text-sm px-4 py-2.5 rounded-r-lg font-bold font-sans tabular-nums flex items-center`}>
                                   {isLowBalance ? 'No Balance' : balance.toLocaleString('en-US')}
                               </div>
                           </div>
                       </div>

                       {/* Currency (Fixed) */}
                       <div>
                           <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Withdrawal Currency</label>
                           <div className="bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#334155] text-sm flex justify-between items-center">
                               <span>IDR (Indonesia Rupiah)</span>
                               <span className="text-[#94A3B8] text-xs">▼</span>
                           </div>
                       </div>

                       {/* Withdrawal To */}
                       <div>
                           <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Withdrawal To</label>
                           <select 
                                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#334155] text-sm outline-none focus:border-[#00AEEF]"
                                value={bankOrEwalletName}
                                onChange={(e) => setBankOrEwalletName(e.target.value)}
                           >
                               <option value="">Select Bank / E-Wallet</option>
                               <optgroup label="Banks">
                                   {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                               </optgroup>
                               <optgroup label="E-Wallets">
                                    {E_WALLET_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                               </optgroup>
                           </select>
                           
                           {/* Extra inputs for account details */}
                           <input 
                                type="text"
                                placeholder="Account Number"
                                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#1E293B] text-sm outline-none focus:border-[#00AEEF] mt-2.5 font-sans tabular-nums"
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value)}
                           />
                           <input 
                                type="text"
                                placeholder="Account Holder Name"
                                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#1E293B] text-sm outline-none focus:border-[#00AEEF] mt-2.5"
                                value={accountHolderName}
                                onChange={e => setAccountHolderName(e.target.value)}
                           />
                       </div>

                       {/* Amount */}
                       <div>
                           <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Amount Withdrawal</label>
                           <div className="flex">
                               <div className="bg-white text-[#64748B] text-sm font-medium px-4 py-2.5 border border-[#CBD5E1] rounded-l-lg flex items-center justify-center">IDR</div>
                               <input 
                                    type="text"
                                    placeholder="Amount Withdrawal"
                                    className="flex-1 bg-white border border-[#CBD5E1] border-l-0 rounded-r-lg px-4 py-2.5 text-[#1E293B] text-sm outline-none focus:border-[#00AEEF] font-sans tabular-nums"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                               />
                           </div>
                       </div>

                       <div className="pt-2">
                           <button type="submit" disabled={isLoadingTransactions} className="bg-[#00AEEF] hover:bg-[#009cd7] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md shadow-[#00AEEF]/20">
                               {isLoadingTransactions ? 'Processing...' : 'Submit'}
                           </button>
                       </div>

                       {/* Notice Box */}
                       <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl text-[#92400E] text-xs mt-4">
                           <div className="flex items-start">
                               <InformationCircleIcon className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-[#F59E0B]" />
                               <div>
                                   <span className="font-bold block mb-0.5">Notice:</span>
                                   <p>Min Rp 10, Max Rp 500,000,000, Fee 0%.</p>
                               </div>
                           </div>
                       </div>
                       
                       {message && (
                           <div className={`p-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                               {message.text}
                           </div>
                       )}

                   </form>
               </div>
           </div>

           {/* Right Column: History Table */}
           <div className="lg:col-span-2">
               <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden p-6 sm:p-7 h-full flex flex-col">
                    <div className="border-b border-[#E2E8F0] pb-4 mb-4">
                       <h3 className="text-[#1E293B] text-xl font-bold">Withdrawal History</h3>
                    </div>
                    
                    <div>
                        <div className="flex space-x-2 mb-4">
                            <button className="bg-[#00AEEF] hover:bg-[#009cd7] text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors">PDF</button>
                            <button className="bg-[#00AEEF] hover:bg-[#009cd7] text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors">Print</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-y border-[#E2E8F0] text-[#64748B] text-xs bg-[#F8FAFC]">
                                        <th className="p-3 font-semibold border-r border-[#E2E8F0]">Fee</th>
                                        <th className="p-3 font-semibold border-r border-[#E2E8F0]">Received</th>
                                        <th className="p-3 font-semibold border-r border-[#E2E8F0]">Berita</th>
                                        <th className="p-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalHistory.map(wd => (
                                        <tr key={wd.id} className="border-b border-[#E2E8F0] text-xs hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-3 text-[#64748B] border-r border-[#E2E8F0] font-sans tabular-nums">Rp 0</td>
                                            <td className="p-3 text-[#1E293B] font-semibold border-r border-[#E2E8F0] font-sans tabular-nums">Rp {wd.amount.toLocaleString('en-US')}</td>
                                            <td className="p-3 text-[#64748B] border-r border-[#E2E8F0] max-w-xs">
                                                <div className="font-bold text-[#1E293B]">Withdrawal IDR Balance</div>
                                                <div>To: {wd.method.includes('Bank') ? 'Bank Account' : 'E-Wallet'} (IDR)</div>
                                                <div className="uppercase font-medium text-[#334155]">{wd.bankOrEwalletName}</div>
                                                <div className="font-sans tabular-nums">{wd.accountNumber}</div>
                                                <div className="uppercase">{wd.accountHolderName}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-md text-white text-[11px] font-bold ${wd.status === TransactionStatus.SUCCESS ? 'bg-[#0ECB81]' : wd.status === TransactionStatus.PENDING ? 'bg-[#F59E0B]' : 'bg-[#E50914]'}`}>
                                                    {wd.status === TransactionStatus.SUCCESS ? 'Done' : wd.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {withdrawalHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-[#94A3B8] text-xs">No records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-center items-center mt-6 text-xs text-[#64748B] space-x-3">
                             <span className="cursor-pointer hover:text-[#00AEEF]">Previous</span>
                             <span className="bg-[#00AEEF] text-white w-6 h-6 flex items-center justify-center rounded font-bold">1</span>
                             <span className="cursor-pointer hover:text-[#00AEEF]">Next</span>
                        </div>
                    </div>
               </div>
           </div>
       </div>
    </WalletLayout>
  );
};

export default WalletWithdrawal;