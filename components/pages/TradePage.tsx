import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TradeHistoryItem {
  id: string;
  date: string;
  market: string;
  trx: string;
  package: string;
  amount: number;
  rateStake: number;
  rateEnd: number;
  status: 'Win' | 'Loss' | 'Pending';
}

// Mock data to show how it looks with rows
const MOCK_TRADE_HISTORY: TradeHistoryItem[] = [
  // Example row if needed, but keeping empty for now to match the "No records" feel if that's what's intended
  /*
  {
    id: '1',
    date: '18/12/2025 00:26',
    market: 'ETH/BTC',
    trx: 'BUY',
    package: 'Basic',
    amount: 50,
    rateStake: 0.03311,
    rateEnd: 0.03328,
    status: 'Win'
  }
  */
];

const TradePage: React.FC = () => {
  const { balance } = useTransactions();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stakeAmount, setStakeAmount] = useState('50');
  const [tradeTime, setTradeTime] = useState('3 Hour');

  useEffect(() => {
    if (containerRef.current) {
        if (containerRef.current.querySelector('script')) return;

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
          "autosize": true,
          "symbol": "BINANCE:ETHBTC",
          "interval": "1",
          "timezone": "Etc/UTC",
          "theme": "light",
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_chart",
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
          "support_host": "https://www.tradingview.com"
        });
        containerRef.current.appendChild(script);
    }
    
    return () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* 1. Trading Terminal Card */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] flex flex-col shadow-sm">
          
          {/* Chart Header */}
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
              <div className="flex items-center space-x-2 cursor-pointer group">
                  <h2 className="text-[#1E293B] text-lg sm:text-xl font-bold">ETH/BTC</h2>
                  <ChevronDownIcon className="w-4 h-4 text-[#64748B] group-hover:text-[#00AEEF] transition-colors" />
              </div>
          </div>

          {/* Chart Body */}
          <div className="relative h-[450px] sm:h-[550px] lg:h-[650px] bg-white">
              <div 
                id="tradingview_chart"
                className="tradingview-widget-container w-full h-full" 
                ref={containerRef}
              >
              </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="p-4 sm:p-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap lg:flex-nowrap items-center gap-3">
               
               <div className="flex items-center bg-white border border-[#CBD5E1] rounded-xl overflow-hidden w-full sm:w-auto flex-grow lg:max-w-[220px] shadow-sm">
                   <div className="px-3.5 py-2.5 text-[#64748B] text-sm font-semibold border-r border-[#CBD5E1] bg-[#F1F5F9]">IDR</div>
                   <input 
                        type="text" 
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="bg-transparent w-full px-3.5 py-2.5 text-[#1E293B] text-sm outline-none font-sans tabular-nums font-semibold"
                   />
               </div>

               <div className="flex items-center bg-white border border-[#CBD5E1] rounded-xl overflow-hidden w-full sm:w-auto flex-grow lg:max-w-[200px] cursor-pointer hover:border-[#00AEEF] transition-colors shadow-sm">
                   <div className="px-3.5 py-2.5 text-[#64748B] border-r border-[#CBD5E1] bg-[#F1F5F9]">
                       <ClockIcon className="w-4 h-4" />
                   </div>
                   <div className="flex-grow flex items-center justify-between px-3.5 py-2.5">
                       <span className="text-[#1E293B] text-sm font-medium">{tradeTime}</span>
                       <ChevronDownIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
                   </div>
               </div>

               <button className="flex-grow lg:flex-1 bg-[#00C098] hover:bg-[#00a884] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-[#00C098]/20">
                   <div className="bg-white/20 p-1 rounded-full">
                       <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                   </div>
                   <span className="text-base tracking-wide">Buy 99%</span>
               </button>

               <button className="flex-grow lg:flex-1 bg-[#FF8A65] hover:bg-[#ff764d] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-[#FF8A65]/20">
                   <div className="bg-white/20 p-1 rounded-full rotate-180">
                       <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                   </div>
                   <span className="text-base tracking-wide">Sell 99%</span>
               </button>
          </div>
      </div>

      {/* 2. History Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm p-6 sm:p-7">
          <div className="border-b border-[#E2E8F0] pb-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">History</h2>
          </div>
          
          <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                      <tr className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider border-r border-[#E2E8F0]">Date</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider border-r border-[#E2E8F0]">Market</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider border-r border-[#E2E8F0]">Trx</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider border-r border-[#E2E8F0]">Package</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider border-r border-[#E2E8F0]">Amount</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider text-center border-r border-[#E2E8F0]">Rate Stake</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider text-center border-r border-[#E2E8F0]">Rate End</th>
                          <th className="px-5 py-4 text-xs font-bold text-[#64748B] tracking-wider text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {MOCK_TRADE_HISTORY.map((item) => (
                          <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                              <td className="px-5 py-4 text-xs text-[#64748B] font-sans tabular-nums border-r border-[#E2E8F0]">{item.date}</td>
                              <td className="px-5 py-4 text-xs text-[#1E293B] font-semibold border-r border-[#E2E8F0]">{item.market}</td>
                              <td className="px-5 py-4 border-r border-[#E2E8F0]">
                                  <span className={`text-xs font-bold ${item.trx === 'BUY' ? 'text-success' : 'text-danger'}`}>
                                      {item.trx}
                                  </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-[#64748B] border-r border-[#E2E8F0]">{item.package}</td>
                              <td className="px-5 py-4 text-xs text-[#1E293B] font-sans tabular-nums font-bold border-r border-[#E2E8F0]">
                                  {item.amount.toLocaleString('en-US')}
                              </td>
                              <td className="px-5 py-4 text-xs text-[#64748B] text-center font-sans tabular-nums border-r border-[#E2E8F0]">{item.rateStake.toFixed(5)}</td>
                              <td className="px-5 py-4 text-xs text-[#64748B] text-center font-sans tabular-nums border-r border-[#E2E8F0]">{item.rateEnd.toFixed(5)}</td>
                              <td className="px-5 py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      item.status === 'Win' ? 'bg-success/20 text-success' : 
                                      item.status === 'Loss' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                                  }`}>
                                      {item.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {MOCK_TRADE_HISTORY.length === 0 && (
                          <tr>
                              <td colSpan={8} className="py-16 text-center text-[#94A3B8] text-sm">
                                  No transaction records found.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      <div className="pt-6 pb-4 text-center">
          <p className="text-[#94A3B8] text-[10px] uppercase tracking-[0.3em] font-bold">
              Institutional Grade Execution Environment &copy; 2025
          </p>
      </div>

    </div>
  );
};

export default TradePage;