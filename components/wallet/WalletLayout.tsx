import React from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface WalletLayoutProps {
  children: React.ReactNode;
}

const WalletLayout: React.FC<WalletLayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto max-w-7xl">
      {/* IDR Wallet Top Card with Breadcrumb */}
      <div className="bg-white border border-[#E2E8F0] p-6 sm:p-7 rounded-2xl shadow-sm mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#2B313A] tracking-tight">IDR Wallet</h1>
          
          {/* Breadcrumb Box */}
          <div className="mt-4 bg-[#E9EDF5] rounded-xl px-4 py-2.5 flex items-center text-xs sm:text-sm text-[#707D93] font-medium w-full">
              <GlobeAltIcon className="w-4 h-4 mr-2 text-[#707D93] flex-shrink-0" /> 
              <span>Home</span> 
              <span className="mx-2 text-[#94A3B8] font-light">&gt;</span> 
              <span>IDR Wallet</span>
          </div>
      </div>
      
      {children}
    </div>
  );
};

export default WalletLayout;