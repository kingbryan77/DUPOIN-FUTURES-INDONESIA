import React, { useRef, useEffect } from 'react';
import { NotificationItem } from '../../types';
import { useTransactions } from '../../context/TransactionContext';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { markNotificationAsRead } = useTransactions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 max-h-[450px] overflow-hidden flex flex-col animate-fade-in"
    >
      <div className="p-4 border-b border-[#E2E8F0] bg-white flex justify-between items-center">
        <h3 className="text-base font-bold text-[#1E293B]">Notifikasi</h3>
        <span className="text-[10px] bg-[#00AEEF]/10 text-[#00AEEF] px-2.5 py-0.5 rounded-full font-bold">Terbaru</span>
      </div>
      <div className="overflow-y-auto flex-1 bg-white">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#94A3B8] text-sm">Tidak ada notifikasi baru.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-4 cursor-pointer transition-colors ${
                  notif.read ? 'opacity-60 bg-[#F8FAFC]' : 'bg-white hover:bg-[#F8FAFC]'
                }`}
                onClick={() => handleNotificationClick(notif.id)}
              >
                <p className={`text-sm leading-relaxed ${notif.read ? 'text-[#64748B]' : 'text-[#1E293B] font-medium'}`}>
                  {notif.message}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-2 font-mono tabular-nums">
                  {new Date(notif.date).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {notifications.length > 0 && (
          <div className="p-3 border-t border-[#E2E8F0] text-center bg-[#F8FAFC]">
              <button className="text-xs text-[#00AEEF] hover:text-[#009cd7] font-bold transition-colors">
                  Tandai Semua Sudah Dibaca
              </button>
          </div>
      )}
    </div>
  );
};

export default NotificationDropdown;