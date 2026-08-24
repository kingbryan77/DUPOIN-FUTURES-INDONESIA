import React from 'react';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-[#0B0E11] overflow-hidden text-white p-4 font-sans">
      
      {/* 4K Skyscraper Background */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3840&auto=format&fit=crop" 
            alt="Modern Financial Skyscrapers" 
            className="w-full h-full object-cover opacity-100"
            style={{
                animation: 'slowZoom 60s infinite alternate ease-in-out'
            }}
        />
         {/* Layered Overlays for Cinematic Look */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#1BB5BC 0.5px, transparent 0.5px), linear-gradient(90deg, #1BB5BC 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Login Card - Ultra Glassmorphism */}
      <div className="w-full max-w-md bg-black/25 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-8 sm:p-12 border border-white/20 relative z-10 transition-all">
        {/* Subtle top light effect */}
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        
        {children}
      </div>

      {/* Minimal Footer */}
      <div className="mt-12 text-gray-500 text-[10px] tracking-[0.3em] uppercase relative z-10 font-bold">
        Secure & Licensed Trading Portal
      </div>

      <style>{`
        @keyframes slowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;