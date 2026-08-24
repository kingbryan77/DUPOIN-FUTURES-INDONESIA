import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';

const DepositForm: React.FC = () => {
  const { user } = useAuth();
  const { deposit, companyBankInfoList, isLoadingTransactions, transactionError, addNotification } = useTransactions();
  const [amount, setAmount] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; api?: string }>({});
  const [depositSuccessMessage, setDepositSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transactionError) {
      setErrors(prev => ({ ...prev, api: transactionError }));
    } else {
      setErrors(prev => ({ ...prev, api: undefined }));
    }
  }, [transactionError]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0.';
    } else if (parsedAmount < 10000) { // Example minimum deposit
      newErrors.amount = 'Minimum deposit amount is Rp 10,000.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) {
      return;
    }

    setDepositSuccessMessage(null);
    const success = await deposit(parseFloat(amount));

    if (success) {
      setDepositSuccessMessage(`Deposit dalam proses, mohon kirim bukti transfer ke admin.`);
      setAmount('');
      setErrors({});
    } else {
      setErrors(prev => ({ ...prev, api: transactionError || 'Failed to submit deposit. Please try again.' }));
    }
  };

  const formatCurrencyInput = (value: string): string => {
    // Remove non-numeric characters first
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';

    // Format as Rupiah
    return parseInt(numericValue, 10).toLocaleString('en-US');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Store only numeric value in state for calculation, display formatted value in input
    const numericValue = rawValue.replace(/\D/g, '');
    setAmount(numericValue);
    setErrors(prev => ({ ...prev, amount: undefined, api: undefined }));
  };

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Deposit Funds</h2>

      <div className="bg-darkblue2 p-6 rounded-lg shadow-md">
        {errors.api && (
          <div className="bg-danger/20 text-danger p-3 rounded-md mb-4 text-sm">
            {errors.api}
          </div>
        )}
        {depositSuccessMessage && (
          <div className="bg-success/20 text-success p-3 rounded-md mb-4 text-sm">
            {depositSuccessMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            id="depositAmount"
            label="Amount (Rp)"
            type="text" // Use text to allow custom formatting
            placeholder="e.g., 100.000"
            icon={<BanknotesIcon />}
            value={formatCurrencyInput(amount)}
            onChange={handleAmountChange}
            error={errors.amount}
            inputMode="numeric"
          />

          <h3 className="text-xl font-semibold text-white mt-8 mb-4">Detail Rekening Bank Perusahaan</h3>
          <div className="space-y-4">
            {(companyBankInfoList && companyBankInfoList.length > 0 ? companyBankInfoList : [
              {
                bankName: 'Bank Rakyat Indonesia (BRI)',
                accountNumber: '367801004397504',
                accountHolderName: 'GUSTI PUTRAP N'
              },
              {
                bankName: 'BANK MUAMALAT',
                accountNumber: '3280019029',
                accountHolderName: 'MUHAMAD DZAKWAN HAKIM'
              }
            ]).map((bank, index) => (
              <div key={index} className="bg-darkblue p-4 rounded-md border border-primary/50 relative overflow-hidden">
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                    Rekomendasi
                  </div>
                )}
                <p className="text-gray-300 flex items-center mb-2">
                  <CreditCardIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-bold text-white">{bank.bankName}</span>
                </p>
                <p className="text-gray-300 flex items-center mb-2">
                  <span className="font-medium mr-2 text-gray-400">No. Rekening:</span> 
                  <span className="font-mono text-white text-lg tracking-wider">{bank.accountNumber}</span>
                </p>
                <p className="text-gray-300 flex items-center">
                  <span className="font-medium mr-2 text-gray-400">Atas Nama:</span> 
                  <span className="text-white font-medium uppercase">{bank.accountHolderName}</span>
                </p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Silakan transfer dengan jumlah yang tepat ke salah satu rekening bank perusahaan di atas. Deposit Anda akan diproses setelah verifikasi bukti transfer.
          </p>

          <div className="mt-8">
            <Button type="submit" fullWidth isLoading={isLoadingTransactions} disabled={isLoadingTransactions}>
              Submit Deposit Request
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">View your deposit history <a href="/#/deposit-history" className="text-primary hover:underline">here</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;