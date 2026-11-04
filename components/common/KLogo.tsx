import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';

interface KLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textVariant?: 'light' | 'dark';
  className?: string;
}

/**
 * Shared project logo used across the landing, authentication, and dashboard
 * surfaces.
 */
export const KLogo: React.FC<KLogoProps> = ({
  size = 'md',
  showText = false,
  textVariant = 'light',
  className = '',
}) => {
  const { t } = useTranslation();
  const sizeMap = {
    sm: { logo: 60, text: 'text-sm', sub: 'text-[8px]' },
    md: { logo: 78, text: 'text-base', sub: 'text-[9px]' },
    lg: { logo: 96, text: 'text-xl', sub: 'text-[11px]' },
    xl: { logo: 117, text: 'text-2xl', sub: 'text-xs' },
  };

  const dim = sizeMap[size];

  return (
    <div className={`inline-flex max-w-full items-center gap-2.5 ${className}`}>
      <Image
        src="/assets/project_logo.png"
        alt={t('app_brand')}
        width={dim.logo}
        height={dim.logo}
        priority
      />
      {showText && (
        <div className="min-w-0 max-w-[min(100%,430px)] flex-1">
          <div
            className={`font-black leading-tight tracking-tight break-words ${dim.text} ${
              textVariant === 'light' ? 'text-white' : 'text-[#102542]'
            }`}
          >
            {t('app_brand')}
          </div>
          <div
            className={`mt-1 font-semibold leading-snug tracking-wider uppercase break-words ${dim.sub} ${
              textVariant === 'light' ? 'text-coconut-200/80' : 'text-emerald-700'
            }`}
          >
            {t('hero_subtitle')}
          </div>
        </div>
      )}
    </div>
  );
};
