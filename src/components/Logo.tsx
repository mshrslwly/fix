import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Clay-style Dome / Book SVG Icon */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#6AA078] to-[#457453] p-1.5 shadow-[4px_4px_10px_rgba(95,143,107,0.35),-2px_-2px_8px_rgba(255,255,255,0.7),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 16 C36 28 26 40 26 58 C26 76 37 84 50 84 C63 84 74 76 74 58 C74 40 64 28 50 16 Z"
              fill="#E8D5C4"
            />
            <path
              d="M38 84 L38 60 C38 52 43 47 50 47 C57 47 62 52 62 60 L62 84 Z"
              fill="#3F6B4D"
            />
            <circle cx="50" cy="15" r="4.5" fill="#F6B98A" />
            <line x1="50" y1="50" x2="50" y2="84" stroke="#5F8F6B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`font-black tracking-tight text-[#3F6B4D] font-heading ${titleSizes[size]}`}>
          SiPontren
        </span>
        {showSubtitle && (
          <span className="text-xs text-[#7A6C5D] font-medium leading-none mt-0.5">
            Sistem Informasi Pesantren
          </span>
        )}
      </div>
    </div>
  );
};
