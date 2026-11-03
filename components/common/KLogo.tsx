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
    sm: { box: 28, svg: 24, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 36, svg: 30, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 48, svg: 40, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 64, svg: 56, text: 'text-2xl', sub: 'text-sm' },
  };

  const dim = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* K Brand Mnemonic Mark */}
      <div
        style={{ width: dim.box, height: dim.box }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-coconut-600 via-coconut-700 to-emerald-900 shadow-md shadow-coconut-900/20 border border-coconut-400/30 flex-shrink-0"
      >
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform -translate-y-[0.5px]"
          aria-hidden="true"
        >
          {/* Vertical Stem - Governance Pillar */}
          <rect
            x="18"
            y="14"
            width="18"
            height="72"
            rx="9"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Upper Diagonal Leaf Wing - Nature & Environment */}
          <path
            d="M44 48 C 44 48, 52 38, 64 26 C 72 18, 82 20, 84 28 C 86 36, 76 44, 58 56 Z"
            fill="#a7f3d0"
          />
          {/* Lower Diagonal Growth Branch - People & Industry */}
          <path
            d="M42 52 C 48 58, 60 72, 70 82 C 76 88, 86 86, 84 76 C 82 66, 70 58, 54 48 Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Center Leaf Vein Accent */}
          <circle cx="48" cy="50" r="5" fill="#34d399" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div
            className={`font-black tracking-tight ${dim.text} ${
              textVariant === 'light' ? 'text-white' : 'text-slate-900'
            }`}
          >
            AICM <span className="text-coconut-400 font-extrabold font-sans">TWIN</span>
          </div>
          <div
            className={`font-semibold tracking-wider uppercase mt-1 ${dim.sub} ${
              textVariant === 'light' ? 'text-coconut-200/80' : 'text-slate-600'
            }`}
          >
            Nature · People · Industry
          </div>
        </div>
      )}
    </div>
  );
};
