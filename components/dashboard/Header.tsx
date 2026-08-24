import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import DupoinLogo from '../common/DupoinLogo';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { balance, notifications, accountMode, toggleAccountMode } = useTransactions();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tickerRef.current) {
        if (tickerRef.current.querySelector('script')) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
          "symbols": [
            { "proName": "BINANCE:ETHUSDT", "title": "ETHUSDT" },
            { "proName": "BINANCE:LTCUSDT", "title": "LTCUSDT" },
            { "proName": "BINANCE:DOGEUSDT", "title": "DOGEUSDT" },
            { "proName": "BINANCE:BTCUSDT", "title": "BTCUSDT" },
            { "proName": "FX_IDC:EURUSD", "title": "EUR/USD" }
          ],
          "showSymbolLogo": true,
          "colorTheme": "light",
          "isTransparent": false,
          "displayMode": "adaptive",
          "locale": "en"
        });
        tickerRef.current.appendChild(script);
    }
    
    return () => {
        if (tickerRef.current) {
            tickerRef.current.innerHTML = '';
        }
    };
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('en-US')}`;
  };

  return (
    <>
    {/* 1. MAIN CYAN HEADER */}
    <header className="fixed top-0 left-0 lg:left-64 right-0 bg-[#00AEEF] h-[56px] z-[40] flex items-center justify-between px-3 sm:px-5 shadow-md">
      
      {/* Mobile & Desktop: Hamburger Menu on Left */}
      <div className="flex items-center flex-shrink-0">
         <button 
            onClick={onToggleSidebar}
            className="text-white p-2 focus:outline-none hover:bg-black/10 rounded-lg transition-all active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label="Open Menu"
         >
            <Bars3Icon className="h-7 w-7 stroke-[2.5]" />
         </button>
      </div>

      {/* Right: Controls (Balance, Bell, Profile) */}
      <div className="flex items-center space-x-2 sm:space-x-3 h-full flex-shrink-0">
        
        {/* Balance Button - Matches screenshot */}
        <button 
            onClick={toggleAccountMode} 
            className="inline-flex items-center rounded-lg overflow-hidden shadow-sm active:scale-95 transition-all duration-150 focus:outline-none select-none h-[34px] sm:h-[36px]"
            title="Click to toggle Real/Demo"
        >
          {/* Left container: Dark charcoal with white Rp balance */}
          <div className="bg-[#353B48] hover:bg-[#3d4452] text-white text-xs sm:text-[14px] font-semibold px-3 sm:px-4 flex items-center h-full font-sans tabular-nums tracking-normal transition-colors">
            {formatCurrency(balance)}
          </div>
          {/* Right container: Mint green with dark green Real text */}
          <div className="bg-[#00D09C] hover:bg-[#00be8e] text-[#0A3825] text-xs sm:text-[14px] font-semibold px-3 sm:px-3.5 flex items-center h-full min-w-[46px] justify-center font-sans transition-colors">
            {accountMode === 'real' ? 'Real' : 'Demo'}
          </div>
        </button>

        {/* Notifications */}
        <div className="relative h-full flex items-center flex-shrink-0">
          <button
            onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false);
            }}
            className="p-1.5 hover:bg-black/10 relative rounded-full transition-colors flex items-center justify-center min-w-[36px]"
          >
            <BellIcon className="h-6 w-6 text-[#FCD34D] stroke-[2.2]" />
            <span className="absolute top-1.5 right-1.5 bg-[#FF3B30] rounded-full h-2.5 w-2.5 ring-2 ring-[#00AEEF]"></span>
          </button>
          {isNotificationsOpen && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setIsNotificationsOpen(false)}
            />
          )}
        </div>

        {/* Profile */}
        <div className="relative h-full flex items-center flex-shrink-0">
          <button
            onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
            }}
            className="flex items-center focus:outline-none ml-1 rounded-full ring-2 ring-white/90 hover:ring-white transition-all shadow-md active:scale-95 overflow-hidden w-9 h-9 bg-white/20"
          >
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <UserCircleIcon className="h-full w-full text-white" />
            )}
          </button>
          {isProfileOpen && <ProfileDropdown onClose={() => setIsProfileOpen(false)} />}
        </div>
      </div>
    </header>

    {/* 2. WHITE TICKER TAPE */}
    <div className="fixed top-[56px] left-0 lg:left-64 right-0 h-12 bg-white border-b border-[#E2E8F0] z-[30] shadow-sm overflow-hidden flex items-center">
        <div className="tradingview-widget-container h-full w-full" ref={tickerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    </div>
    </>
  );
};

export default Header;