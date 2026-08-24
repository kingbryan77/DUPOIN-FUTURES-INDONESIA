import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrophyIcon, 
  RocketLaunchIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

interface InvestmentTier {
  investment: string;
  profit: string;
}

interface InvestmentPackage {
  name: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  tiers: InvestmentTier[];
}

const INVESTMENT_PACKAGES: InvestmentPackage[] = [
  {
    name: "PAKET BASIC",
    icon: <BoltIcon className="w-12 h-12" />,
    color: "bg-amber-500",
    textColor: "text-amber-500",
    borderColor: "border-amber-500/30",
    shadowColor: "shadow-amber-500/10",
    tiers: [
      { investment: "500.000", profit: "15.000.000" },
      { investment: "1.000.000", profit: "30.000.000" },
    ]
  },
  {
    name: "PAKET GOLD",
    icon: <TrophyIcon className="w-12 h-12" />,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    borderColor: "border-yellow-500/30",
    shadowColor: "shadow-yellow-500/10",
    tiers: [
      { investment: "1.500.000", profit: "45.000.000" },
      { investment: "2.000.000", profit: "70.000.000" },
      { investment: "2.500.000", profit: "90.000.000" },
    ]
  },
  {
    name: "PAKET PLATINUM",
    icon: <RocketLaunchIcon className="w-12 h-12" />,
    color: "bg-gray-300",
    textColor: "text-gray-300",
    borderColor: "border-gray-300/30",
    shadowColor: "shadow-gray-300/10",
    tiers: [
      { investment: "3.500.000", profit: "110.000.000" },
      { investment: "4.500.000", profit: "130.000.000" },
      { investment: "5.000.000", profit: "145.000.000" },
      { investment: "5.500.000", profit: "160.000.000" },
    ]
  },
  {
    name: "PAKET DIAMOND",
    icon: <SparklesIcon className="w-12 h-12" />,
    color: "bg-cyan-400",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    shadowColor: "shadow-cyan-400/10",
    tiers: [
      { investment: "6.000.000", profit: "200.000.000" },
      { investment: "7.000.000", profit: "240.000.000" },
      { investment: "8.000.000", profit: "270.000.000" },
      { investment: "9.000.000", profit: "300.000.000" },
      { investment: "10.000.000", profit: "350.000.000" },
    ]
  }
];

const InvestmentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTier = (amount: string) => {
    // Navigate to the deposit page (add-balance) with the raw numeric amount as query param and state
    const cleanAmount = amount.replace(/\D/g, '');
    navigate(`/wallet/add-balance?amount=${cleanAmount}`, { state: { amount: cleanAmount } });
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-fade-in font-sans">
      
      {/* Header Section */}
      <div className="text-center space-y-3 py-6">
        <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight uppercase">
          DAFTAR PAKET INVESTASI <span className="text-[#00AEEF]">DUPOIN</span>
        </h2>
        <p className="text-[#00AEEF] max-w-2xl mx-auto text-sm sm:text-base font-semibold">
          Paket Aktif Setelah Pembayaran Modal
        </p>
      </div>

      {/* Grid Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {INVESTMENT_PACKAGES.map((pkg, idx) => (
          <div 
            key={idx} 
            className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] group flex flex-col"
          >
            {/* Package Header */}
            <div className={`p-8 flex flex-col items-center space-y-4 bg-gradient-to-b from-slate-50 to-white`}>
                <div className={`${pkg.textColor} group-hover:scale-110 transition-transform duration-500`}>
                    {pkg.icon}
                </div>
                <h3 className={`text-xl font-black tracking-widest ${pkg.textColor} text-center`}>
                    {pkg.name}
                </h3>
            </div>

            {/* Tiers List */}
            <div className="px-6 py-4 flex-grow space-y-4">
                {pkg.tiers.map((tier, tIdx) => (
                  <button 
                    key={tIdx} 
                    onClick={() => handleSelectTier(tier.investment)}
                    className="w-full text-left bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5 group/item hover:bg-white hover:border-[#00AEEF] transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00AEEF] block"
                  >
                      <div className="flex justify-between items-center">
                          <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-tighter">Modal</span>
                          <span className="text-[#1E293B] font-sans font-bold text-sm">Rp {tier.investment}</span>
                      </div>
                      <div className="h-[1px] bg-[#E2E8F0] w-full"></div>
                      <div className="flex justify-between items-center">
                          <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-tighter">Hasil</span>
                          <span className={`${pkg.textColor} font-sans font-bold text-base`}>Rp {tier.profit}</span>
                      </div>
                      <div className="pt-2">
                          <span className="w-full inline-flex items-center justify-center text-[10px] font-black py-1.5 rounded-lg border border-dashed border-[#CBD5E1] text-[#64748B] group-hover/item:bg-[#00AEEF] group-hover/item:text-white group-hover/item:border-solid group-hover/item:border-[#00AEEF] transition-all uppercase tracking-wider">
                              Pilih Nominal Ini
                          </span>
                      </div>
                  </button>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="p-6 mt-auto">
                <button 
                    onClick={() => handleSelectTier(pkg.tiers[0].investment)}
                    className={`w-full ${pkg.color} text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm shadow-md active:scale-95 transition-all hover:brightness-105 flex items-center justify-center`}
                >
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Mulai Rp {pkg.tiers[0].investment}
                </button>
                <div className="mt-4 flex items-center justify-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-success" />
                    <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-widest">Aktivasi Instan</span>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#00AEEF]/10 rounded-full border border-[#00AEEF]/20">
                  <ShieldCheckIcon className="w-8 h-8 text-[#00AEEF]" />
              </div>
              <div>
                  <h4 className="text-[#1E293B] font-bold text-lg">Keamanan Dana Terjamin</h4>
                  <p className="text-[#64748B] text-sm max-w-md mt-1">
                      Sistem kami menggunakan enkripsi end-to-end dan pemisahan akun untuk memastikan modal Anda aman selama masa kontrak investasi.
                  </p>
              </div>
          </div>
          <button className="bg-transparent border-2 border-[#00AEEF] text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all">
              Hubungi Konsultan
          </button>
      </div>

      <div className="text-center pt-6 pb-4 space-y-2">
          <p className="text-[#64748B] text-xs font-medium">
              Dupoin telah resmi dan terdaftar dan diawasi oleh OJK, BAPPEBTI serta peserta penjamin LPS
          </p>
          <p className="text-[#94A3B8] text-[9px] uppercase tracking-[0.3em] font-bold">
              Official Investment Program &copy; 2025 Dupoin
          </p>
      </div>

    </div>
  );
};

export default InvestmentPage;