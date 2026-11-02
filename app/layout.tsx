import type { Metadata, Viewport } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { RoleProvider } from '@/lib/role-context';
import { Header } from '@/components/navigation/Header';
import { DemoBanner } from '@/components/common/DemoBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { MobileTabBar } from '@/components/navigation/MobileTabBar';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Thekkumpuram Grama Panchayat — Digital Twin Demo',
  description:
    'Grama Panchayat Digital Twin demo portal connecting local governance data, spatial zoning, asset registers, PDI metrics, and disaster risk resilience.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Thekkumpuram Twin',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
        <I18nProvider>
          <RoleProvider>
            <ServiceWorkerRegister />
            <DemoBanner />
            <Header />
            <div className="flex-1 flex flex-row w-full max-w-full">
              <Sidebar />
              <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
                {children}
              </main>
            </div>
            <MobileTabBar />
          </RoleProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
