'use client';

import React from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { useTranslation } from '@/lib/i18n';

export default function PresidentAuthPage() {
  const { t } = useTranslation();

  return (
    <div className="-m-4 flex min-h-screen flex-col animate-fade-in sm:-m-6 lg:-m-8 lg:h-screen lg:flex-row lg:overflow-hidden">
      <AuthBrandPanel
        backgroundImage="/assets/mla-login-bg.png"
        title={t('auth_mla_left_title')}
        titleAccent={t('auth_mla_left_title_accent')}
        description={t('auth_mla_left_description')}
        location={t('auth_mla_left_location')}
      />
      <AuthCard targetRole="president" />
    </div>
  );
}
