import React from 'react';
import Button from '../common/Button';

const KycPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-6">KYC (Know Your Customer)</h2>
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <p className="text-[#64748B] mb-2 text-sm leading-relaxed">
          To comply with regulations and enhance security, please complete your KYC verification.
          This usually involves uploading identification documents.
        </p>
        <p className="text-[#94A3B8] mb-6 text-xs">
          Example: Upload ID card, proof of address, selfie with ID.
        </p>
        <div>
          <Button variant="primary">
            Start KYC Verification
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KycPage;
