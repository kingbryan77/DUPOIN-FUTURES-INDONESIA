import React from 'react';

interface DupoinLogoProps {
  className?: string;
  variant?: 'white' | 'dark' | 'colored';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showContainer?: boolean;
}

export const DupoinLogo: React.FC<DupoinLogoProps> = ({ 
  className = "h-9", 
  variant = 'white',
  size = 'md',
  showContainer = false 
}) => {
  const textColor = variant === 'dark' 
    ? '#0B0E11' 
    : variant === 'colored' 
      ? '#1BB5BC' 
      : '#FFFFFF';

  const sizeHeights = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
    xl: 'h-20'
  };

  const actualClass = className || sizeHeights[size];

  const logoGraphic = (
    <div className={`inline-flex items-center select-none ${actualClass}`}>
      <svg 
        viewBox="0 0 175 55" 
        className="h-full w-auto overflow-visible" 
        aria-label="Dupoin"
      >
        {/* Shadow filter for depth */}
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.2" />
        </filter>

        <g filter="url(#logoShadow)">
          {/* Main "Dupoin" cursive text using the loaded script font */}
          <text 
            x="2" 
            y="42" 
            fontFamily="'Pacifico', 'Satisfy', 'Caveat', cursive" 
            fontSize="52" 
            fontStyle="italic"
            fontWeight="400" 
            fill={textColor}
            letterSpacing="-0.5px"
          >
            Dupoin
          </text>
        </g>
      </svg>
    </div>
  );

  if (showContainer) {
    return (
      <div className="bg-[#1BB5BC] p-6 rounded-2xl shadow-xl flex items-center justify-center border border-white/10">
        {logoGraphic}
      </div>
    );
  }

  return logoGraphic;
};

export default DupoinLogo;
