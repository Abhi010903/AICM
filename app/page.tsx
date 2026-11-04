'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Database,
  Factory,
  HeartHandshake,
  Leaf,
  MapPin,
  Map,
  MessageSquare,
  Home,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { KLogo } from '@/components/common/KLogo';

const toneClasses = {
  green: 'bg-emerald-100 text-emerald-700',
  purple: 'bg-violet-100 text-violet-700',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-700',
};

export default function LandingPage() {
  const { language, setLanguage } = useTranslation();
  const isMalayalam = language === 'ml';
  const copy = isMalayalam
    ? {
        search: 'വാർഡുകൾ, സേവനങ്ങൾ, ആസ്തികൾ, റിപ്പോർട്ടുകൾ തിരയുക...',
        eyebrow: 'പ്രകൃതി · ജനങ്ങൾ · വ്യവസായം',
        titleStart: 'വികേന്ദ്രീകൃത ഭരണസംവിധാനം',
        titleEnd: 'പ്രകൃതി, ജനങ്ങൾ, വ്യവസായം എന്നിവയ്ക്കായി',
        intro: 'തദ്ദേശ ഭരണത്തിനായുള്ള തീരുമാന സഹായവും പൗര സേവനങ്ങളും നൽകുന്ന AICM, കുന്നമംഗലം നിയോജകമണ്ഡലത്തിന്റെ ബുദ്ധിപരമായ ഡിജിറ്റൽ പ്രതിരൂപമാണ്.',
        mla: 'എംഎൽഎ ആയി പ്രവേശിക്കുക',
        mlaText: 'ഭരണം, വാർഡ് സമത്വം, സൈറ്റിംഗ്, ധനകാര്യ സാൻഡ്‌ബോക്സ്, ദുരന്ത നിയന്ത്രണം',
        citizen: 'പൗരനായി പ്രവേശിക്കുക',
        citizenText: 'കഡാസ്ട്രൽ പ്ലോട്ട് എക്സ്പ്ലോറർ, കെട്ടിട പരിശോധന, സമീപ സേവനങ്ങൾ, പരാതികൾ',
        features: [
          ['സംവേദനാത്മക ഭൂപടങ്ങൾ', 'ആസ്തികൾ, ഭൂമി, അപകട മേഖലകൾ, സൗകര്യങ്ങൾ എന്നിവ'],
          ['വികസന ആസൂത്രണം', 'GPDP പദ്ധതികളും ബജറ്റ് നിരീക്ഷണവും'],
          ['സേവന നിരീക്ഷണം', 'വിദ്യാഭ്യാസം, ആരോഗ്യം, ജലം, ക്ഷേമ സേവനങ്ങൾ'],
          ['ദുരന്ത മുന്നൊരുക്കം', 'അപകട മേഖലകളും ഒഴിപ്പിക്കൽ പാതകളും'],
          ['പരാതി പരിഹാരം', 'പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്ത് പിന്തുടരുക'],
          ['സുസ്ഥിര വികസനം', 'PDI, SDG സൂചകങ്ങൾ'],
        ],
        cards: [['ഭൂമിയും ആസൂത്രണവും', 'ഭൂമി, സോണിംഗ്, അനുസരണ പരിശോധന കാണുക'], ['ആസ്തികളും സൗകര്യങ്ങളും', 'പൊതു ആസ്തികളും സേവന കേന്ദ്രങ്ങളും പരിശോധിക്കുക'], ['ദുരന്ത പ്രതിരോധം', 'അപകട ഭൂപടങ്ങളും സുരക്ഷിത ഒഴിപ്പിക്കൽ പാതകളും']],
        philosophy: 'പ്രകൃതി, ജനങ്ങൾ, വ്യവസായം: പ്രവർത്തനത്തിലെ ESG',
        philosophyText: 'തദ്ദേശ സ്വയംഭരണത്തിന് വികസനത്തെയും പരിസ്ഥിതി സംരക്ഷണത്തെയും വിരുദ്ധ ലക്ഷ്യങ്ങളായി കാണാനാവില്ല. AICM ESG അളവുകോലുകൾ പഞ്ചായത്തിന്റെ തീരുമാനങ്ങളുമായി സംയോജിപ്പിക്കുന്നു.',
        report: 'പൊതു ഡാറ്റയും സ്ഥലപരമായ ശ്രേണിയും',
      }
    : {
        search: 'Search wards, services, assets and reports...',
        eyebrow: 'Nature · People · Industry',
        titleStart: 'Decentralized Governance for',
        titleEnd: 'Nature, People & Industry',
        intro: 'AICM delivers an intelligent digital replica of Kunnamangalam Constituency, bridging cadastral spatial zoning, infrastructure asset management, disaster resilience, and citizen transparency.',
        mla: 'Enter as MLA',
        mlaText: 'Governance, Ward Equity, Siting, Fiscal Sandbox & Hazard Command',
        citizen: 'Enter as Citizen',
        citizenText: 'Cadastral Plot Explorer, Building Pre-Check, Nearby Services & Grievances',
        features: [
          ['Interactive Maps', 'Assets, land, hazards, facilities and more'],
          ['Development Planning', 'GPDP projects and budget tracking'],
          ['Service Monitoring', 'Education, health, water and welfare services'],
          ['Disaster Preparedness', 'Hazard zones and evacuation routes'],
          ['Grievance Redressal', 'Report and track issues'],
          ['Sustainable Development', 'PDI and SDG indicators'],
        ],
        cards: [['Land & Planning', 'View land parcels, zoning and compliance'], ['Assets & Facilities', 'Explore public assets and service locations'], ['Disaster Resilience', 'Hazard maps and safe evacuation routes']],
        philosophy: 'Nature, People, Industry: ESG in Action',
        philosophyText: 'Local self-government cannot treat development and ecological stewardship as opposing goals. AICM integrates ESG metrics directly into Panchayat decisions.',
        report: 'Public Data & Spatial Hierarchy',
      };
  const featureItems = [
    { icon: Map, tone: 'green' }, { icon: BarChart3, tone: 'purple' }, { icon: Users, tone: 'orange' },
    { icon: ShieldCheck, tone: 'red' }, { icon: MessageSquare, tone: 'blue' }, { icon: Leaf, tone: 'green' },
  ];
  const [locationState, setLocationState] = useState<'pending' | 'detected' | 'denied'>('pending');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('denied');
      return;
    }

    setLocationState('pending');
    navigator.geolocation.getCurrentPosition(
      () => setLocationState('detected'),
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div className="landing-page min-h-screen bg-white text-slate-900">
      <header className="absolute inset-x-0 top-0 z-20 bg-white/25 backdrop-blur-[2px]">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-10">
          <div className="flex items-center gap-3">
            <KLogo size="md" showText textVariant="dark" />
          </div>

          <div className="hidden w-full max-w-[520px] md:block">
            <label className="relative block">
              <span className="sr-only">Search the digital twin</span>
              <input
                type="search"
                placeholder={copy.search}
                className="w-full rounded-full bg-slate-100 px-5 py-3 text-xs text-slate-700 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-emerald-300"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">⌕</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-bold"
            aria-label="Toggle language"
          >
            <span className="rounded-full bg-emerald-800 px-3 py-1.5 text-white">{language === 'en' ? 'EN' : 'മ'}</span>
            <span className="px-1 text-slate-700">{language === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>
        </div>
      </header>

      <main id="home">
        <section
          className="relative min-h-screen overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/bgimage01.png')" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 25%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0.08) 68%, rgba(255,255,255,0) 84%)',
            }}
          />

          <div className="relative mx-auto grid min-h-screen max-w-[1440px] items-center gap-10 px-5 pb-12 pt-28 sm:px-10 sm:pt-32 lg:grid-cols-[1fr_340px] lg:pb-16">
            <div className="max-w-[600px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{copy.eyebrow}</p>
              <h1 className="mt-3 text-[42px] font-extrabold leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-[50px]">
                {copy.titleStart}{' '}
                <span className="text-emerald-700">{copy.titleEnd}</span>
              </h1>
              <p className="mt-4 max-w-[500px] text-sm leading-5 text-slate-600">
                {copy.intro}
              </p>

              <div className="mt-6 grid max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                <RoleCard href="/auth/president" icon={Building2} title={copy.mla} text={copy.mlaText} tone="blue" />
                <RoleCard href="/auth/citizen" icon={Users} title={copy.citizen} text={copy.citizenText} tone="green" />
              </div>
            </div>

            <LocationCard locationState={locationState} onRequestLocation={requestLocation} isMalayalam={isMalayalam} />
          </div>
        </section>

        <section id="services" className="mx-auto grid max-w-[1440px] grid-cols-2 overflow-hidden rounded-xl bg-slate-50 px-0 sm:grid-cols-3 lg:grid-cols-6">
          {featureItems.map(({ icon: Icon, tone }, index) => (
            <div key={copy.features[index][0]} className="bg-transparent px-6 py-7">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${toneClasses[tone as keyof typeof toneClasses]}`}><Icon className="h-5 w-5" /></div>
              <h3 className="text-sm font-extrabold text-slate-800">{copy.features[index][0]}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{copy.features[index][1]}</p>
            </div>
          ))}
        </section>

        <section id="maps" className="mx-auto grid max-w-[1440px] gap-4 px-5 py-4 sm:px-10 md:grid-cols-3">
          {copy.cards.map((card, index) => (
            <div
              key={card[0]}
              className="relative flex h-[180px] items-end overflow-hidden rounded-xl bg-cover bg-center p-4"
              style={{ backgroundImage: `url('/assets/bgimage0${index + 2}.png')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              <div className="relative z-10 w-full rounded-lg bg-slate-950/75 px-3 py-2 text-white">
                <h3 className="text-xs font-bold">{card[0]}</h3>
                <p className="mt-0.5 text-[10px] text-white/80">{card[1]}</p>
              </div>
            </div>
          ))}
        </section>

        <section id="about" className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">{isMalayalam ? 'മാർഗ്ഗനിർദ്ദേശ തത്വം' : 'Guiding Philosophy'}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{copy.philosophy}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">{copy.philosophyText}</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <EsgCard icon={Leaf} title={isMalayalam ? 'പരിസ്ഥിതി പ്രതിരോധം (E)' : 'Environmental Resilience (E)'} text={isMalayalam ? 'പ്രകൃതിദത്ത വെള്ളപ്പൊക്ക സംഭരണ മേഖലകൾ സംരക്ഷിക്കുന്നതിനുള്ള നിയമപരമായ പരിരക്ഷ. ചാലിയാർ നദീതടത്തിലെ വെള്ളപ്പൊക്ക ഭൂപടം, വരൾച്ചാ സൂചകങ്ങൾ, ചരിവ് അപകട നിയന്ത്രണം.' : 'Statutory enforcement of the Kerala Conservation of Paddy Land & Wetland Act to protect natural flood sinks. Real-time Chaliyar river basin inundation mapping, drought indicators, and slope hazard containment.'} source={isMalayalam ? 'KSDMA വെള്ളപ്പൊക്ക മേഖലകൾ · ജല ബാലൻസ് സൂചകങ്ങൾ' : 'KSDMA Flood Zones · Water Balance Indicators'} />
            <EsgCard icon={HeartHandshake} title={isMalayalam ? 'സാമൂഹിക സമത്വവും ഉൾക്കൊള്ളലും (S)' : 'Social Equity & Inclusion (S)'} text={isMalayalam ? '14 വാർഡുകളിലും പ്രാഥമിക ആരോഗ്യ സേവനങ്ങളിലേക്കും സ്കൂളുകളിലേക്കും തുല്യ പ്രവേശനം. സ്വകാര്യത സംരക്ഷിച്ചുള്ള പരാതിപരിഹാരവും ലളിതമായ പൗര സേവനങ്ങളും.' : 'Equal access to primary healthcare (FHC/PHC) and schools across all 14 wards. Automated grievance routing with zero-Aadhaar privacy protections and plain-language citizen service accessibility.'} source={isMalayalam ? 'UDISE+ വിദ്യാഭ്യാസം · ഇ-ഹെൽത്ത് · പൗര പ്രതികരണം' : 'UDISE+ Education · e-Health Coverage · Civic Feedback'} />
            <EsgCard icon={Factory} title={isMalayalam ? 'ഉത്തരവാദിത്തമുള്ള വ്യവസായവും ഭരണവും (G)' : 'Responsible Industry & Governance (G)'} text={isMalayalam ? 'സെറ്റ്ബാക്കും പരിസ്ഥിതി അനുമതിയും ഉൾപ്പെടുത്തിയ സുതാര്യമായ സ്ഥല ആസൂത്രണം. PDI വിഷയങ്ങൾ ഉപയോഗിച്ച് വാർഡ് ബജറ്റ് പുനർവിന്യാസത്തിലെ ധന സംരക്ഷണം പരിശോധിക്കുന്നു.' : 'Transparent spatial planning for commercial enterprises with setback and ecological clearance. 100% fiscal conservation in ward budget reallocation, verified through Panchayat Development Index (PDI) themes.'} source={isMalayalam ? 'ധന നിഷ്പക്ഷത · GPDP ചക്രം · PDI വിഷയങ്ങൾ' : 'Fiscal Neutrality · GPDP Lifecycle · PDI 9 Themes'} />
          </div>
        </section>

        <section id="reports" className="mx-auto max-w-[1440px] px-5 pb-10 sm:px-10">
          <div className="rounded-2xl bg-slate-50 p-5 text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2"><Database className="h-4 w-4 text-emerald-700" /><h2 className="text-sm font-bold text-slate-900">{copy.report}</h2></div>
              <span className="text-[10px] text-slate-500">{isMalayalam ? 'അവസാനം പരിശോധിച്ചത്: 2026-10-30' : 'Baseline Verified: 2026-10-30'}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                isMalayalam ? ['L1 സ്ഥല അടിസ്ഥാനം', 'KSDI ഭരണ അതിർത്തികൾ, നദി ഇടനാഴികൾ, WFS വെക്റ്റർ ലെയറുകൾ.'] : ['L1 Spatial Base', 'KSDI administrative boundaries, river corridors, WFS vector layers.'],
                isMalayalam ? ['L2 കഡാസ്ട്രൽ', 'Ente Bhoomi, ReLIS ഭൂമി വർഗ്ഗീകരണങ്ങൾ.'] : ['L2 Cadastral', 'Ente Bhoomi & ReLIS parcel classifications (Nilam vs Purayidom).'],
                isMalayalam ? ['L3 നിർമ്മിത ആസ്തികൾ', 'Sanchaya IKM രജിസ്റ്ററുകൾ, ജല ശൃംഖലകൾ, റോഡുകൾ, തെരുവ് വിളക്കുകൾ.'] : ['L3 Built Assets', 'Sanchaya IKM registers, water networks, PWD roads, streetlights.'],
                isMalayalam ? ['L6 പദ്ധതി, ധനകാര്യം', 'eGramSwaraj GPDP പദ്ധതികൾ, PDI വിഷയങ്ങൾ, ധന കൈമാറ്റ രേഖ.'] : ['L6 Plan & Finance', 'eGramSwaraj GPDP projects, PDI 9 themes, fiscal transfer ledger.'],
              ].map(([title, text]) => <div key={title} className="rounded-lg bg-white p-3"><h3 className="text-[10px] font-bold text-emerald-700">{title}</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">{text}</p></div>)}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-slate-100 text-slate-700">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50"><Leaf className="h-5 w-5 text-emerald-700" /></div>
            <div className="text-[10px] font-semibold">
              {isMalayalam ? 'നിയോജകമണ്ഡലം ഡിജിറ്റൽ ട്വിൻ' : 'Constituency Digital Twin'}<br />
              <span className="text-emerald-700">{isMalayalam ? 'പ്രകൃതി · ജനങ്ങൾ · വ്യവസായം' : 'Nature · People · Industry'}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            {isMalayalam
              ? 'നിയമപരമായ വിവരങ്ങൾ: കേരള പഞ്ചായത്ത് രാജ് ആക്ട് 1994 | KSDI | പഞ്ചായത്ത് വികസന സൂചിക (PDI)'
              : 'Statutory Links: Kerala Panchayat Raj Act 1994 | KSDI | Panchayat Development Index'}
          </div>
          <div className="text-[10px] font-semibold text-slate-500">
            {isMalayalam ? 'അവസാനം പരിശോധിച്ചത്: 2026-10-30' : 'Last verified: 2026-10-30'}
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({ href, icon: Icon, title, text, tone }: { href: string; icon: React.ElementType; title: string; text: string; tone: 'blue' | 'green' }) {
  const colors = tone === 'blue' ? 'border-blue-200/70 bg-blue-50/55 text-blue-800' : 'border-emerald-200/70 bg-emerald-50/55 text-emerald-800';
  return <Link href={href} className={`group flex min-h-[105px] items-center justify-between rounded-xl border p-3 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1 ${colors}`}><span className="flex items-center gap-2.5"><span className="rounded-xl bg-white/65 p-2.5"><Icon className="h-7 w-7" /></span><span><strong className="block text-base">{title}</strong><small className="mt-0.5 block max-w-[190px] text-[11px] leading-4 opacity-80">{text}</small></span></span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/75 text-current"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>;
}

function LocationCard({ locationState, onRequestLocation, isMalayalam }: { locationState: 'pending' | 'detected' | 'denied'; onRequestLocation: () => void; isMalayalam: boolean }) {
  const isDetected = locationState === 'detected';
  const labels = isMalayalam
    ? {
        detected: 'നിങ്ങളുടെ നിലവിലെ സ്ഥലം',
        detectedSub: 'നിങ്ങളുടെ ബ്രൗസറിൽ സ്ഥലം കണ്ടെത്തി',
        fallback: 'കുന്നമംഗലം നിയോജകമണ്ഡലം',
        fallbackSub: 'കുന്നമംഗലം നിയോജകമണ്ഡലം',
        granted: 'സ്ഥല അനുമതി ലഭിച്ചു',
        demo: 'ഡെമോ ഡാറ്റ — സാങ്കൽപ്പിക പഞ്ചായത്ത്',
        district: 'ജില്ല',
        constituency: 'നിയമസഭാ മണ്ഡലം',
        population: 'ജനസംഖ്യ',
        households: 'കുടുംബങ്ങൾ',
        area: 'വിസ്തീർണ്ണം',
        wards: 'വാർഡുകൾ',
        retry: 'എന്റെ സ്ഥലം ഉപയോഗിക്കുക',
      }
    : {
        detected: 'Your current location',
        detectedSub: 'Location detected in your browser',
        fallback: 'Kunnamangalam Constituency',
        fallbackSub: 'Kunnamangalam Constituency',
        granted: 'Location permission granted',
        demo: 'Demo data — fictional constituency',
        district: 'District',
        constituency: 'Assembly Constituency',
        population: 'Population',
        households: 'Households',
        area: 'Area',
        wards: 'Wards',
        retry: 'Use my location',
      };
  return (
    <div className="relative hidden min-h-[340px] rounded-2xl border border-white/70 bg-white/60 p-5 shadow-xl backdrop-blur-md lg:block">
      <h2 className="text-lg font-extrabold leading-tight text-slate-950">
        {isDetected ? labels.detected : labels.fallback}
      </h2>
      <p className="mt-0.5 text-xs text-slate-600">{isDetected ? labels.detectedSub : labels.fallbackSub}</p>
      <div className="mt-3 inline-flex rounded-md bg-amber-100 px-3 py-1.5 text-[10px] font-medium text-amber-900">
        {isDetected ? labels.granted : labels.demo}
      </div>

      <div className="mt-4 border-t border-white/70 pt-4">
        <LocationRow icon={MapPin} label={labels.district} value={isMalayalam ? 'കോഴിക്കോട്' : 'Kozhikode'} />
        <LocationRow icon={Building2} label={labels.constituency} value={isMalayalam ? 'കുന്നമംഗലം' : 'Kunnamangalam'} />
      </div>
      <div className="my-3 border-t border-white/70" />
      <div className="space-y-2.5">
        <LocationRow icon={Users} label={labels.population} value="28,450" />
        <LocationRow icon={Home} label={labels.households} value="6,820" />
        <LocationRow icon={Map} label={labels.area} value={isMalayalam ? '32.4 ച. കി.മീ.' : '32.4 sq.km'} />
        <LocationRow icon={MapPin} label={labels.wards} value="14" />
      </div>

      {locationState === 'denied' && (
        <button type="button" onClick={onRequestLocation} className="mt-4 text-[10px] font-bold text-emerald-800 underline underline-offset-2">
          {labels.retry}
        </button>
      )}
    </div>
  );
}

function LocationRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-6 w-6 flex-shrink-0 text-emerald-800" strokeWidth={2.2} />
      <div className="leading-tight">
        <span className="block text-xs text-slate-500">{label}</span>
        <strong className="block text-sm text-slate-900">{value}</strong>
      </div>
    </div>
  );
}

function EsgCard({ icon: Icon, title, text, source }: { icon: React.ElementType; title: string; text: string; source: string }) {
  return <article className="rounded-xl bg-slate-50 p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><Icon className="h-4 w-4" /></div><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-[11px] leading-5 text-slate-600">{text}</p><p className="mt-3 text-[10px] font-semibold text-emerald-800">{source}</p></article>;
}
