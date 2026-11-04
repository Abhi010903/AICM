import React from 'react';

interface KLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textVariant?: 'light' | 'dark';
  className?: string;
}

/**
 * Unified "K" brand mnemonic representing:
 * - Kerala (State heritage and decentralized self-governance)
 * - Community (Citizen empowerment & collective resilience)
 * Integrated with the "Nature, People, Industry" ESG philosophy
 * using coconut leaf green hues.
 */
export const KLogo: React.FC<KLogoProps> = ({
  size = 'md',
  showText = false,
  textVariant = 'light',
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 40, svg: 40, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 52, svg: 52, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 64, svg: 64, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 78, svg: 78, text: 'text-2xl', sub: 'text-sm' },
  };

  const dim = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: dim.box, height: dim.box }}
        className="relative flex items-center justify-center flex-shrink-0"
      >
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#087443" strokeWidth="5" />
          <path d="M13 68C28 54 42 53 53 59C63 64 75 67 87 59V87H13Z" fill="#075b3a" />
          <path d="M15 61C28 48 39 48 51 55C62 62 74 61 85 51V68C72 76 61 73 50 67C38 61 27 62 15 73Z" fill="#22a35a" />
          <path d="M28 66L48 18L72 66H59L54 54H40L35 66H28ZM44 44H51L48 35Z" fill="#087443" />
          <path d="M40 54H55L60 66H35Z" fill="#f8fafc" />
          <path d="M22 39C26 31 33 27 40 25C35 32 31 38 29 46Z" fill="#34a853" />
          <path d="M73 40C78 35 82 34 85 35C81 39 78 44 77 49Z" fill="#34a853" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div
            className={`font-black tracking-tight ${dim.text} ${
              textVariant === 'light' ? 'text-white' : 'text-[#102542]'
            }`}
          >
            Constituency <span className={`${textVariant === 'light' ? 'text-coconut-400' : 'text-emerald-700'} font-extrabold font-sans`}>Digital Twin</span>
          </div>
          <div
            className={`font-semibold tracking-wider uppercase mt-1 ${dim.sub} ${
              textVariant === 'light' ? 'text-coconut-200/80' : 'text-[#102542]'
            }`}
          >
            Nature · People · Industry
          </div>
        </div>
      )}
    </div>
  );
};
