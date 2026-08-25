import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheckIcon,
  CheckBadgeIcon,
  ArrowDownCircleIcon,
  SparklesIcon,
  BanknotesIcon,
  CheckIcon
} from '@heroicons/react/24/solid';
import DupoinLogo from '../common/DupoinLogo';

interface InvestmentTier {
  investment: string;
  profit: string;
  rawAmount: string;
}

interface InvestmentPackage {
  id: string;
  name: string;
  pillColor: string;
  tiers: InvestmentTier[];
}

const INVESTMENT_PACKAGES: InvestmentPackage[] = [
  {
    id: 'basic',
    name: 'PAKET BASIC',
    pillColor: 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]',
    tiers: [
      { investment: 'Rp300.000', profit: 'Rp8.000.000', rawAmount: '300000' },
      { investment: 'Rp500.000', profit: 'Rp15.000.000', rawAmount: '500000' },
      { investment: 'Rp800.000', profit: 'Rp17.000.000', rawAmount: '800000' },
      { investment: 'Rp1.000.000', profit: 'Rp21.000.000', rawAmount: '1000000' },
    ]
  },
  {
    id: 'silver',
    name: 'PAKET SILVER',
    pillColor: 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]',
    tiers: [
      { investment: 'Rp1.200.000', profit: 'Rp24.000.000', rawAmount: '1200000' },
      { investment: 'Rp1.600.000', profit: 'Rp28.000.000', rawAmount: '1600000' },
      { investment: 'Rp2.000.000', profit: 'Rp32.000.000', rawAmount: '2000000' },
      { investment: 'Rp2.400.000', profit: 'Rp45.000.000', rawAmount: '2400000' },
    ]
  },
  {
    id: 'gold',
    name: 'PAKET GOLD',
    pillColor: 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]',
    tiers: [
      { investment: 'Rp3.000.000', profit: 'Rp50.000.000', rawAmount: '3000000' },
      { investment: 'Rp3.500.000', profit: 'Rp70.000.000', rawAmount: '3500000' },
      { investment: 'Rp4.000.000', profit: 'Rp90.000.000', rawAmount: '4000000' },
      { investment: 'Rp5.000.000', profit: 'Rp120.000.000', rawAmount: '5000000' },
    ]
  },
  {
    id: 'platinum',
    name: 'PAKET PLATINUM',
    pillColor: 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]',
    tiers: [
      { investment: 'Rp6.000.000', profit: 'Rp160.000.000', rawAmount: '6000000' },
      { investment: 'Rp7.000.000', profit: 'Rp200.000.000', rawAmount: '7000000' },
      { investment: 'Rp8.000.000', profit: 'Rp240.000.000', rawAmount: '8000000' },
      { investment: 'Rp9.000.000', profit: 'Rp280.000.000', rawAmount: '280000000' ? '9000000' : '9000000' },
    ]
  },
];

const SIGNATURE_PACKAGE: InvestmentPackage = {
  id: 'signature',
  name: 'PAKET SIGNATURE',
  pillColor: 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]',
  tiers: [
    { investment: 'Rp15.000.000', profit: 'Rp400.000.000', rawAmount: '15000000' }
  ]
};

const InvestmentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTier = (rawAmount: string) => {
    navigate(`/wallet/add-balance?amount=${rawAmount}`, { state: { amount: rawAmount } });
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Top Banner - Matches the header from the image */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0099DE] via-[#00B4F5] to-[#2FD1FF] text-white p-6 sm:p-8 lg:p-10 shadow-lg border border-[#38BDF8]/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white border border-white/30">
              <ShieldCheckIcon className="w-4 h-4 text-white" />
              <span>Resmi & Terpercaya</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold italic leading-snug tracking-tight text-white">
              &ldquo;Nikmati kemudahan transaksi investasi yang terjamin keamanannya di bawah pengawasan OJK, BAPPEBTI & BI&rdquo;
            </h1>
            
            <p className="text-white/90 text-xs sm:text-sm font-medium">
              Pilih paket modal sesuai target profit Anda dan nikmati hasil maksimal dalam waktu singkat.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end space-y-3 flex-shrink-0">
            <div className="bg-white/95 rounded-2xl p-4 shadow-md flex items-center space-x-3">
              <DupoinLogo className="h-9" variant="colored" />
            </div>
            <div className="flex items-center space-x-2 text-white/95 text-xs font-bold bg-black/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
              <CheckBadgeIcon className="w-4 h-4 text-white" />
              <span>OJK &bull; BAPPEBTI &bull; BI</span>
            </div>
          </div>
        </div>
      </div>

      {/* "PILIHAN PAKET" Section Label */}
      <div className="flex items-center space-x-3 pt-2">
        <div className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-[#00AEEF] to-[#0086BA] text-white px-5 py-2.5 rounded-2xl shadow-md">
          <span className="text-sm sm:text-base font-black tracking-wider uppercase">PILIHAN PAKET</span>
          <ArrowDownCircleIcon className="w-5 h-5 animate-bounce" />
        </div>
        <div className="h-[2px] bg-gradient-to-r from-[#00AEEF]/40 to-transparent flex-grow rounded-full"></div>
      </div>

      {/* Grid of Main 4 Packages (Basic, Silver, Gold, Platinum) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {INVESTMENT_PACKAGES.map((pkg) => (
          <div 
            key={pkg.id} 
            className="relative bg-white border border-[#CBD5E1] rounded-3xl pt-8 pb-6 px-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            {/* Pill Header overhanging at top */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-44">
              <div className={`${pkg.pillColor} text-white text-xs sm:text-[13px] font-black py-2 px-4 rounded-full shadow-md text-center uppercase tracking-wider border-2 border-white`}>
                {pkg.name}
              </div>
            </div>

            {/* List of Tiers */}
            <div className="space-y-2.5 pt-2 flex-grow">
              {pkg.tiers.map((tier, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectTier(tier.rawAmount)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#3B82F6] transition-all duration-200 cursor-pointer group/row active:scale-[0.98]"
                >
                  <div className="text-left">
                    <span className="text-xs sm:text-[13px] font-bold text-[#1E293B] block">
                      Modal <span className="text-[#0F172A] font-extrabold">{tier.investment}</span>
                    </span>
                  </div>
                  
                  <div className="text-right flex items-center space-x-1.5">
                    <span className="text-xs sm:text-[13px] font-bold text-[#2563EB] group-hover/row:text-[#1D4ED8]">
                      Hasil <span className="font-extrabold">{tier.profit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action button */}
            <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => handleSelectTier(pkg.tiers[0].rawAmount)}
                className="w-full bg-[#00AEEF] hover:bg-[#009cd7] text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center space-x-2 active:scale-95"
              >
                <BanknotesIcon className="w-4 h-4" />
                <span>Pilih {pkg.name}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Center: PAKET SIGNATURE */}
      <div className="flex justify-center pt-2">
        <div className="relative w-full max-w-xl bg-white border-2 border-[#3B82F6]/30 rounded-3xl pt-8 pb-6 px-6 sm:px-8 shadow-lg hover:shadow-2xl transition-all duration-300 group">
          {/* Pill Header overhanging at top */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-52">
            <div className="bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#3B82F6] text-white text-xs sm:text-[13px] font-black py-2 px-4 rounded-full shadow-md text-center uppercase tracking-wider border-2 border-white flex items-center justify-center space-x-1.5">
              <SparklesIcon className="w-4 h-4 text-yellow-300" />
              <span>{SIGNATURE_PACKAGE.name}</span>
            </div>
          </div>

          {/* Signature Tier */}
          <div 
            onClick={() => handleSelectTier(SIGNATURE_PACKAGE.tiers[0].rawAmount)}
            className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#EEF2FF] hover:from-[#DBEAFE] hover:to-[#E0E7FF] border border-[#BFDBFE] transition-all duration-200 cursor-pointer active:scale-[0.99] gap-3 text-center sm:text-left"
          >
            <div>
              <span className="text-sm sm:text-base font-bold text-[#1E293B]">
                Modal <span className="font-black text-[#0F172A]">{SIGNATURE_PACKAGE.tiers[0].investment}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base font-extrabold text-[#2563EB]">
                HASIL <span className="font-black text-[#1D4ED8]">{SIGNATURE_PACKAGE.tiers[0].profit}</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-[#64748B] font-medium">
              <CheckIcon className="w-4 h-4 text-emerald-500 font-bold" />
              <span>Prioritas Eksekusi & Manajemen Portofolio VIP</span>
            </div>
            <button
              onClick={() => handleSelectTier(SIGNATURE_PACKAGE.tiers[0].rawAmount)}
              className="w-full sm:w-auto bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-xs sm:text-sm font-bold py-2.5 px-6 rounded-xl shadow-md transition-all duration-150 active:scale-95"
            >
              Ambil Paket VIP
            </button>
          </div>
        </div>
      </div>

      {/* Security and Legal Notice */}
      <div className="bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mt-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#00AEEF]/10 rounded-2xl border border-[#00AEEF]/20 text-[#00AEEF] flex-shrink-0">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-[#1E293B] font-bold text-base sm:text-lg">Keamanan Dana & Jaminan Pengawasan</h4>
            <p className="text-[#64748B] text-xs sm:text-sm max-w-xl mt-1 leading-relaxed">
              Seluruh transaksi investasi diproses melalui rekening terpisah (Segregated Account) dan diawasi secara resmi oleh BAPPEBTI, OJK, dan Bank Indonesia (BI).
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/wallet/add-balance')}
          className="bg-transparent border-2 border-[#00AEEF] text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex-shrink-0"
        >
          Deposit Sekarang
        </button>
      </div>

      {/* Bottom Copyright */}
      <div className="text-center pt-4 space-y-1">
        <p className="text-[#64748B] text-xs font-medium">
          Dupoin Markets &bull; Resmi Terdaftar & Diawasi oleh OJK, BAPPEBTI & Bank Indonesia
        </p>
        <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-bold">
          Official Investment Program &copy; 2025 Dupoin Markets
        </p>
      </div>

    </div>
  );
};

export default InvestmentPage;
