import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { MOCK_NEWS } from '../../constants';
import { 
    HomeIcon, 
    UserGroupIcon, 
    GiftIcon, 
    ChartBarIcon, 
    WalletIcon, 
    NewspaperIcon, 
    InformationCircleIcon,
    ClipboardIcon
} from '@heroicons/react/24/solid';

const WaveSvg = ({ color }: { color: string }) => (
    <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-16 sm:h-20 opacity-10 pointer-events-none">
        <path fill={color} fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
);

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, waveColor }: any) => (
    <div className="bg-white rounded-2xl relative overflow-hidden h-40 border border-[#E2E8F0] shadow-sm group transition-all duration-300 hover:shadow-md">
        <div className="p-5 z-10 relative h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <Icon className={`w-7 h-7 ${colorClass}`} />
                        <h3 className="text-[#1E293B] font-bold text-base sm:text-lg">{title}</h3>
                    </div>
                    <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-bold">{subtext}</p>
                </div>
                <div className="bg-[#F1F5F9] px-2.5 py-1 rounded-lg cursor-pointer hover:bg-[#00AEEF]/10 transition-colors border border-[#E2E8F0]">
                    <span className="text-[#00AEEF] text-[10px] font-bold">Detail</span>
                </div>
            </div>
            <div>
               <h4 className="text-2xl font-bold text-[#1E293B] font-sans tabular-nums">{value}</h4>
            </div>
        </div>
        <WaveSvg color={waveColor} />
    </div>
);

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { balance, notifications } = useTransactions();
  const forexRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState('Salin Link Reff');

  const referralLink = user ? `http://dupoin.com/?reff=${user.username}` : 'Memuat...';

  const handleCopy = () => {
      navigator.clipboard.writeText(referralLink);
      setCopyStatus('Tersalin!');
      setTimeout(() => setCopyStatus('Salin Link Reff'), 2000);
  };

  useEffect(() => {
    if (forexRef.current) {
        if (forexRef.current.querySelector('script')) return;
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        forexRef.current.appendChild(widgetDiv);
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
          "width": "100%",
          "height": "100%", 
          "currencies": ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"],
          "isTransparent": false,
          "colorTheme": "light",
          "locale": "id"
        });
        forexRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex flex-col space-y-6">
       
       {/* 1. HEADER RINGKASAN */}
       <div className="bg-white p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center border border-[#E2E8F0] shadow-sm">
            <h1 className="text-2xl font-bold text-[#1E293B] mb-2 md:mb-0">
                Ringkasan <span className="text-[#64748B] font-normal text-base ml-2">Panel Kontrol</span>
            </h1>
            <div className="flex items-center text-xs text-[#64748B] bg-[#F1F5F9] px-3.5 py-1.5 rounded-full border border-[#E2E8F0]">
                <HomeIcon className="w-3.5 h-3.5 mr-2 text-[#94A3B8]" />
                <span className="hover:text-[#00AEEF] cursor-pointer transition-colors">Beranda</span>
                <span className="mx-2 text-[#CBD5E1]">/</span>
                <span className="text-[#1E293B] font-semibold">Dashboard</span>
            </div>
       </div>

       {/* 2. IKHTISAR PASAR */}
       <div className="w-full bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm">
             <div className="bg-[#F8FAFC] p-4 border-b border-[#E2E8F0] flex items-center">
                 <ChartBarIcon className="w-5 h-5 text-[#00AEEF] mr-2" />
                 <span className="text-[#1E293B] font-bold text-sm">Ikhtisar Pasar</span>
             </div>
             <div className="w-full h-[500px]" ref={forexRef}></div>
       </div>

       {/* 3. REFERRAL LINK BAR */}
       <div className="flex flex-col md:flex-row shadow-sm rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white">
            <div className="flex-grow p-4 text-[#64748B] text-sm flex items-center bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-[#E2E8F0]">
                <span className="truncate font-medium">{referralLink}</span>
            </div>
            <button 
                onClick={handleCopy}
                className="bg-[#00AEEF] hover:bg-[#009cd7] text-white font-bold px-8 py-4 text-sm transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-sm"
            >
                <ClipboardIcon className="w-4 h-4" />
                <span>{copyStatus}</span>
            </button>
       </div>

       {/* 4. STAT CARDS (REFERRAL, BONUS, PROFIT, WALLET) */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Referral" subtext="total member" value="0 member" icon={UserGroupIcon} colorClass="text-[#00AEEF]" waveColor="#00AEEF" />
            <StatCard title="Bonus" subtext="total bonus" value="Rp 0" icon={GiftIcon} colorClass="text-[#F59E0B]" waveColor="#F59E0B" />
            <StatCard title="Profit" subtext="total profit" value="Rp 0" icon={ChartBarIcon} colorClass="text-[#0ECB81]" waveColor="#0ECB81" />
            <StatCard title="IDR Wallet" subtext="Saldo Anda" value={`Rp ${balance.toLocaleString('en-US')}`} icon={WalletIcon} colorClass="text-[#00AEEF]" waveColor="#00AEEF" />
       </div>

       {/* 5. NEWS & NOTIFICATIONS */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-[#F8FAFC] p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                   <h3 className="text-base text-[#1E293B] font-bold">Berita Terbaru</h3>
                   <span className="text-[#00AEEF] text-xs cursor-pointer hover:underline font-semibold">Lihat Semua</span>
               </div>
               <div className="divide-y divide-[#E2E8F0]">
                   {MOCK_NEWS.map((news) => (
                       <div key={news.id} className="p-5 flex items-start space-x-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
                           <div className={`p-2.5 rounded-xl ${news.bgColor} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                               <NewspaperIcon className={`w-5 h-5 ${news.iconColor}`} />
                           </div>
                           <div>
                               <h4 className="text-[#1E293B] text-sm font-bold group-hover:text-[#00AEEF] transition-colors">{news.title}</h4>
                               <p className="text-[#94A3B8] text-[10px] mt-1.5 flex items-center uppercase tracking-wide font-semibold">
                                   <ChartBarIcon className="w-3 h-3 mr-1" />
                                   {news.date}
                               </p>
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-[#F8FAFC] p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                   <h3 className="text-base text-[#1E293B] font-bold">Notifikasi</h3>
                   <span className="text-[#00AEEF] text-xs cursor-pointer hover:underline font-semibold" onClick={() => {}}>Bersihkan</span>
               </div>
               <div className="divide-y divide-[#E2E8F0]">
                   {notifications.slice(0, 5).map((notif) => (
                       <div key={notif.id} className="p-5 flex items-start space-x-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
                           <div className="p-2.5 rounded-xl bg-[#00AEEF]/10 flex-shrink-0">
                               <InformationCircleIcon className="w-5 h-5 text-[#00AEEF]" />
                           </div>
                           <div className="flex-1">
                               <h4 className="text-[#334155] text-sm font-medium leading-relaxed">{notif.message}</h4>
                               <p className="text-[#94A3B8] text-[10px] mt-1.5 uppercase tracking-wide font-semibold">{new Date(notif.date).toLocaleString()}</p>
                           </div>
                       </div>
                   ))}
                   {notifications.length === 0 && (
                       <div className="p-12 text-center flex flex-col items-center justify-center">
                           <InformationCircleIcon className="w-10 h-10 text-[#CBD5E1] mb-2" />
                           <p className="text-[#94A3B8] text-sm">Tidak ada notifikasi baru.</p>
                       </div>
                   )}
               </div>
           </div>
       </div>

       <div className="text-center md:text-left pt-6 border-t border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-xs font-medium">
                Hak Cipta © 2025 <span className="text-[#64748B] font-bold">Dupoin Pro</span>. Seluruh Hak Dilindungi.
            </p>
       </div>
    </div>
  );
};

export default DashboardContent;