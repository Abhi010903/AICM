'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('AICM Digital Twin ServiceWorker registered: ', registration.scope);
          })
          .catch((error) => {
            console.log('AICM Digital Twin ServiceWorker registration failed: ', error);
          });
      });
    }
  }, []);

  return null;
};
