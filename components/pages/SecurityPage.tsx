import React from 'react';
import Button from '../common/Button';

const SecurityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-6">Security Settings</h2>
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <p className="text-[#64748B] mb-2 text-sm leading-relaxed">
          Manage your account's security features, such as changing your password,
          enabling two-factor authentication (2FA), and reviewing login activity.
        </p>
        <p className="text-[#94A3B8] mb-6 text-xs">
          Example: Change password, setup 2FA, view recent logins.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">
            Change Password
          </Button>
          <Button variant="secondary">
            Enable 2FA
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;