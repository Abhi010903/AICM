'use client';

import React from 'react';
import { KLogo } from '@/components/common/KLogo';

interface AuthBrandPanelProps {
  backgroundImage: string;
  title: string;
  titleAccent: string;
  description: string;
  location: string;
}

export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({
  backgroundImage,
  title,
  titleAccent,
  description,
  location,
}) => (
  <div
    className="relative hidden min-h-screen overflow-hidden bg-[#062d3d] lg:flex lg:h-screen lg:w-[45%] lg:flex-shrink-0 lg:flex-col lg:justify-between lg:px-12 lg:py-12"
    style={{ backgroundImage: `url('${backgroundImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-[#062d3d]/90 via-[#062d3d]/35 to-[#031d2a]/95" />
    <div className="relative z-10 min-w-0">
      <div className="mb-10 min-w-0">
        <KLogo size="xl" showText textVariant="light" />
      </div>
      <div className="mt-[38vh] max-w-md">
        <h2 className="text-4xl font-black leading-tight text-white">
          {title}
          <br />
          <span className="text-lime-300">{titleAccent}</span>
        </h2>
        <p className="mt-5 text-base leading-relaxed text-slate-100">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-lime-300/80 px-4 py-2 text-sm font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-lime-300" /> {location}
        </div>
      </div>
    </div>
  </div>
);
