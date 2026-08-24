import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, Cog6ToothIcon, PhotoIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!user) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-[70] animate-fade-in overflow-hidden"
    >
      <div className="p-4 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center space-x-3">
          {user.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover border border-[#CBD5E1]" />
          ) : (
            <UserCircleIcon className="h-12 w-12 text-[#94A3B8]" />
          )}
          <div className="overflow-hidden">
            <p className="font-bold text-[#1E293B] truncate">({user.username})</p>
            <p className="text-xs text-[#64748B] truncate">{user.fullName}</p>
          </div>
        </div>
        <Link to="/setting" onClick={handleLinkClick}>
          <button className="w-full mt-3.5 bg-[#ef6e00] hover:bg-[#d86300] text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200 text-sm shadow-sm">
            Lihat Profil
          </button>
        </Link>
      </div>
      <nav className="p-2 bg-white">
        <Link
          to="/setting"
          onClick={handleLinkClick}
          className="flex items-center w-full px-3 py-2.5 text-sm text-[#334155] rounded-xl hover:bg-[#F1F5F9] hover:text-[#00AEEF] transition-colors font-medium"
        >
          <Cog6ToothIcon className="w-5 h-5 mr-3 text-[#64748B]" />
          Profil Saya
        </Link>
        <Link
          to="/setting"
          onClick={handleLinkClick}
          className="flex items-center w-full px-3 py-2.5 text-sm text-[#334155] rounded-xl hover:bg-[#F1F5F9] hover:text-[#00AEEF] transition-colors font-medium"
        >
          <PhotoIcon className="w-5 h-5 mr-3 text-[#64748B]" />
          Gambar Profil
        </Link>
        <div className="h-px bg-[#E2E8F0] my-1 mx-2"></div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm text-danger rounded-xl hover:bg-danger/10 transition-colors font-medium"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
          Keluar
        </button>
      </nav>
    </div>
  );
};

export default ProfileDropdown;