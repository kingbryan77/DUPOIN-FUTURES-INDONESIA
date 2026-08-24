import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const WalletTransfer: React.FC = () => {
  const { transfer, balance, isLoadingTransactions } = useTransactions();
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const num = parseFloat(amount);
    if (!email) { setMsg({type:'error', text: 'Email required'}); return; }
    if (!num || num <= 0) { setMsg({type:'error', text: 'Invalid amount'}); return; }
    
    const res = await transfer(email, num);
    if (res.success) {
        setMsg({type:'success', text: res.message});
        setAmount('');
        setEmail('');
    } else {
        setMsg({type:'error', text: res.message});
    }
  };

  return (
    <WalletLayout>
        <div className="max-w-xl mx-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
            <div className="flex items-center mb-6">
                <div className="p-3 bg-[#00AEEF]/10 rounded-xl mr-3.5">
                    <ArrowsRightLeftIcon className="w-6 h-6 text-[#00AEEF]" />
                </div>
                <div>
                    <h3 className="text-[#1E293B] text-xl font-bold">Internal Transfer</h3>
                    <p className="text-[#64748B] text-xs">Send funds to another user instantly.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                     <label className="block text-[#64748B] text-xs font-medium mb-1">Available Balance</label>
                     <p className="text-[#1E293B] font-sans tabular-nums text-xl font-bold">Rp {balance.toLocaleString('en-US')}</p>
                </div>

                <div>
                    <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Recipient Email</label>
                    <input 
                        type="email" 
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#1E293B] text-sm outline-none focus:border-[#00AEEF]"
                        placeholder="user@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[#64748B] text-xs sm:text-sm font-medium mb-1.5">Amount (IDR)</label>
                    <input 
                        type="number" 
                        className="w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-[#1E293B] text-sm outline-none focus:border-[#00AEEF] font-sans tabular-nums"
                        placeholder="0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>

                <button disabled={isLoadingTransactions} className="w-full bg-[#00AEEF] hover:bg-[#009cd7] text-white py-2.5 rounded-lg font-bold transition-colors shadow-md shadow-[#00AEEF]/20 text-sm">
                    {isLoadingTransactions ? 'Sending...' : 'Confirm Transfer'}
                </button>

                {msg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold text-center ${msg.type === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {msg.text}
                    </div>
                )}
            </form>
        </div>
    </WalletLayout>
  );
};

export default WalletTransfer;