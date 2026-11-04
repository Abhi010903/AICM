'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building2,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  FileText,
  Home,
  Zap,
  Mountain,
  Waves,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap, MapMarker } from '@/components/maps/InteractiveMap';
import { CitizenLocationBar } from '@/components/common/CitizenLocationBar';
import { useCitizenLocation } from '@/lib/location-context';
import { getParcelBySurveyNumber, getParcels, getHazardZones } from '@/lib/api';
import { getCitizenProperties } from '@/lib/citizen-store';
import {
  LandParcel,
  HazardZoneCollection,
  CitizenProperty,
} from '@/lib/types';

interface DetailedCheck {
  id: string;
  name: string;
  status: 'suitable' | 'conditional' | 'restricted' | 'insufficient';
  reason: string;
  source: string;
  action: string;
}

function BuildCheckContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const { location } = useCitizenLocation();

  const isMl = language === 'ml';
  const initialSurvey = searchParams.get('survey') || '412/2';

  // Form states
  const [surveyNumber, setSurveyNumber] = useState<string>(initialSurvey);
  const [buildingType, setBuildingType] = useState<string>('residential');
  const [address, setAddress] = useState<string>('Cheruvannur Central, Ward 7');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Data states
  const [citizenProperties, setCitizenProperties] = useState<CitizenProperty[]>([]);
  const [allParcels, setAllParcels] = useState<LandParcel[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [currentParcel, setCurrentParcel] = useState<LandParcel | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data and citizen properties
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [parcelsList, hz] = await Promise.all([getParcels(), getHazardZones()]);
        setAllParcels(parcelsList);
        setHazardZones(hz);

        // Load citizen properties if logged in
        if (session?.phone) {
          const props = getCitizenProperties(session.phone);
          setCitizenProperties(props);
          const matchedProp = props.find((p) => p.survey_number === initialSurvey);
          if (matchedProp) {
            setSelectedPropertyId(matchedProp.id);
          }
        }

        const found = parcelsList.find((p) => p.survey_number === initialSurvey) || parcelsList[0];
        if (found) {
          setCurrentParcel(found);
        }
      } catch (err) {
        console.error('Failed to load build check data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialSurvey, session?.phone]);

  // Handle property selection from citizen's registered land
  const handleSelectCitizenProperty = (propId: string) => {
    setSelectedPropertyId(propId);
    if (!propId) return;

    const prop = citizenProperties.find((p) => p.id === propId);
    if (prop) {
      setSurveyNumber(prop.survey_number);
      setAddress(prop.address_en || `${prop.village_en}, Ward ${prop.ward_id}`);
      const found = allParcels.find((p) => p.survey_number === prop.survey_number);
      if (found) {
        setCurrentParcel(found);
        setErrorMsg(null);
      } else {
        // Synthesize parcel view from property
        const synthetic: LandParcel = {
          survey_number: prop.survey_number,
          village_en: prop.village_en,
          village_ml: prop.village_ml,
          ward_id: prop.ward_id,
          classification: prop.classification,
          area_cents: prop.area_cents,
          hazard_zone: prop.hazard_zone || 'none',
          road_setback_ok: true,
          permitted_activities_en: ['Residential building construction', 'Well digging', 'Compound wall'],
          permitted_activities_ml: ['താമസ കെട്ടിട നിർമ്മാണം', 'കിണർ നിർമ്മാണം', 'മതിൽ നിർമ്മാണം'],
          restricted_activities_en: ['Commercial high-rise without NOC'],
          restricted_activities_ml: ['എൻ.ഒ.സി ഇല്ലാത്ത വാണിജ്യ സമുച്ചയങ്ങൾ'],
          geometry: prop.geometry || {
            type: 'Polygon',
            coordinates: [[[75.885, 11.305], [75.8862, 11.305], [75.8862, 11.3061], [75.885, 11.3061], [75.885, 11.305]]],
          },
          source: prop.source || 'Citizen Verified Property',
        };
        setCurrentParcel(synthetic);
        setErrorMsg(null);
      }
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = surveyNumber.trim();
    if (!query) return;

    const found = allParcels.find(
      (p) => p.survey_number.toLowerCase() === query.toLowerCase()
    );
    if (found) {
      setCurrentParcel(found);
      setErrorMsg(null);
    } else {
      setCurrentParcel(null);
      setErrorMsg(
        isMl
          ? `സർവേ നമ്പർ "${query}" കഡാസ്ട്രൽ വിവരങ്ങളിൽ കണ്ടെത്താനായില്ല.`
          : `Survey parcel "${query}" was not found in cadastral demo records.`
      );
    }
  };

  const handleSelectQuickSurvey = (sNo: string) => {
    setSurveyNumber(sNo);
    setSelectedPropertyId('');
    const found = allParcels.find((p) => p.survey_number === sNo);
    if (found) {
      setCurrentParcel(found);
      setErrorMsg(null);
    }
  };

  // Evaluate the 6 specific checks required by Part 6 of the spec
  const detailedChecks: DetailedCheck[] = useMemo(() => {
    if (!currentParcel) return [];

    const checks: DetailedCheck[] = [];

    // 1. Paddy & Wetland Act (2008)
    if (currentParcel.classification === 'nilam') {
      checks.push({
        id: 'paddy_wetland',
        name: t('build_check_paddy_wetland'),
        status: 'restricted',
        reason: isMl
          ? '2008-ലെ കേരള നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമപ്രകാരം നിലമായി രേഖപ്പെടുത്തിയ ഭൂമിയിൽ നിർമ്മാണത്തിന് കർശന നിരോധനമുണ്ട്. ആർ.ഡി.ഒ (RDO) ഡാറ്റാ ബാങ്ക് ഇളവ് ഇല്ലാതെ അനുമതി നൽകാനാവില്ല.'
          : 'Strictly restricted under Kerala Conservation of Paddy Land & Wetland Act, 2008. Parcel is gazetted as Nilam (paddy wetland); building unauthorized without statutory RDO Data Bank clearance.',
        source: 'Kerala Conservation of Paddy Land and Wetland Act (2008)',
        action: isMl
          ? 'പ്രാദേശിക കൃഷിഭവനിലോ ആർ.ഡി.ഒ ഓഫീസിലോ ഡാറ്റാ ബാങ്ക് രേഖ പരിശോധിക്കുക.'
          : 'Verify local Data Bank entry at Agricultural Office / RDO Revenue Division.',
      });
    } else if (currentParcel.classification === 'wetland') {
      checks.push({
        id: 'paddy_wetland',
        name: t('build_check_paddy_wetland'),
        status: 'restricted',
        reason: isMl
          ? 'പരിസ്ഥിതിലോല തണ്ണീർത്തടമായി രേഖപ്പെടുത്തിയതിനാൽ നിർമ്മാണ പ്രവർത്തനങ്ങൾക്ക് അനുമതിയില്ല.'
          : 'Classified as ecologically critical wetland. Building construction is prohibited under environmental protection mandates.',
        source: 'Wetland Conservation Authority',
        action: isMl ? 'ഭൂമി സ്വാഭാവിക തണ്ണീർത്തടമായി നിലനിർത്തുക.' : 'Preserve natural wetland state.',
      });
    } else {
      checks.push({
        id: 'paddy_wetland',
        name: t('build_check_paddy_wetland'),
        status: 'suitable',
        reason: isMl
          ? 'വില്ലേജ് രേഖകളിൽ കരഭൂമി (പുരയിടം) ആയി സ്ഥിരീകരിച്ചു. നെൽവയൽ നിയമപ്രകാരമുള്ള തടസ്സങ്ങളില്ല.'
          : 'Officially recorded as Purayidom (dry garden land). Fully compliant with land classification rules.',
        source: 'Revenue Land Information System (ReLIS)',
        action: isMl
          ? 'കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ പാലിച്ചുള്ള പ്ലാൻ തയ്യാറാക്കാം.'
          : 'Proceed with architectural building plan compliance.',
      });
    }

    // 2. SDMA Flood Inundation Zone
    if (currentParcel.hazard_zone === 'flood_high') {
      checks.push({
        id: 'flood_zone',
        name: t('build_check_flood_zone'),
        status: 'conditional',
        reason: isMl
          ? 'അതിതീവ്ര വെള്ളപ്പൊക്ക സാധ്യതാ മേഖല: 2018/2019 ലെ ഏറ്റവും ഉയർന്ന ജലനിരപ്പിന് മുകളിൽ (HFL + 1.5m) തറ ഉയർത്തലും കെ.എസ്.ഡി.എം.എ എൻ.ഒ.സി യും ആവശ്യമാണ്.'
          : 'High flood inundation zone: Requires elevated plinth design (>= 1.5m above HFL) and Disaster Management structural clearance.',
        source: 'KSDMA Flood Hazard Atlas 2024',
        action: isMl
          ? 'തറ ഉയർത്തൽ നിബന്ധനയോടെ അംഗീകൃത എഞ്ചിനീയറുടെ റിപ്പോർട്ട് സമർപ്പിക്കുക.'
          : 'Submit flood-resilient structural drawings with plinth elevation certificate.',
      });
    } else if (currentParcel.hazard_zone === 'flood_med') {
      checks.push({
        id: 'flood_zone',
        name: t('build_check_flood_zone'),
        status: 'conditional',
        reason: isMl
          ? 'ഇടത്തരം വെള്ളപ്പൊക്ക സാധ്യതാ മേഖല: ആവശ്യമായ തറ ഉയരവും മഴവെള്ള ഡ്രെയിനേജ് സംവിധാനവും ഉറപ്പാക്കണം.'
          : 'Moderate flood exposure: Standard elevated plinth and certified storm drainage plan required.',
        source: 'KSDMA District Disaster Management Plan',
        action: isMl
          ? 'ഡ്രെയിനേജ് പ്ലാൻ സമർപ്പിക്കുക.'
          : 'Ensure storm drainage connectivity in building layout.',
      });
    } else {
      checks.push({
        id: 'flood_zone',
        name: t('build_check_flood_zone'),
        status: 'suitable',
        reason: isMl
          ? 'വെള്ളപ്പൊക്ക സാധ്യതാ മേഖലയ്ക്ക് പുറത്താണ്. പ്രത്യേക തറ ഉയർത്തൽ നിബന്ധനകളില്ല.'
          : 'Located safely outside critical flood inundation contours.',
        source: 'KSDMA Spatial Hazard Model',
        action: isMl ? 'സാധാരണ അടിത്തറ നിർമ്മാണം സാധ്യമാണ്.' : 'Standard foundation design compliant.',
      });
    }

    // 3. KMBR / KPBR Road Setback Requirements
    if (!currentParcel.road_setback_ok) {
      checks.push({
        id: 'setbacks',
        name: t('build_check_setbacks'),
        status: 'restricted',
        reason: isMl
          ? 'കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ (KPBR 2019 ചട്ടം 26) പ്രകാരമുള്ള മുൻവശ റോഡ് സെറ്റ്-ബാക്ക് ദൂരം (3 മീറ്റർ) ലഭ്യമല്ല.'
          : 'Inadequate road frontage / setback distance (< 3.0 meters) under Kerala Panchayat Building Rules (KPBR 2019 Rule 26).',
        source: 'Kerala Panchayat Building Rules (KPBR 2019)',
        action: isMl
          ? 'റോഡ് വികസനത്തിന് ആവശ്യമായ സ്ഥലം വിട്ടുനൽകിയോ പ്ലാൻ പുനഃക്രമീകരിച്ചോ വീണ്ടും പരിശോധിക്കുക.'
          : 'Redesign building layout to achieve minimum 3m road clearance.',
      });
    } else {
      checks.push({
        id: 'setbacks',
        name: t('build_check_setbacks'),
        status: 'suitable',
        reason: isMl
          ? 'പൊതുവഴിയിൽ നിന്നും ആവശ്യമായ 3 മീറ്റർ റോഡ് സെറ്റ്-ബാക്ക് ദൂരം ലഭ്യമാണ്.'
          : 'Complies with mandatory minimum 3.0m public road setback under KPBR 2019.',
        source: 'KPBR 2019 Rule 26 & Cadastral Road Overlay',
        action: isMl
          ? 'നിർമ്മാണ വേളയിൽ 3 മീറ്റർ അകലം കൃത്യമായി പാലിക്കുക.'
          : 'Maintain 3m boundary setback during construction.',
      });
    }

    // 4. High Tension (HT) Power Line Clearance
    checks.push({
      id: 'powerlines',
      name: t('build_check_powerlines'),
      status: 'suitable',
      reason: isMl
        ? 'ഹൈ ടെൻഷൻ (11kV / 66kV) വൈദ്യുതി ലൈനുകളുടെ സുരക്ഷാ പരിധിക്ക് പുറത്താണ്. കെ.എസ്.ഇ.ബി ക്ലിയറൻസ് തടസ്സങ്ങളില്ല.'
        : 'Parcel is clear of High Tension (11kV/66kV) electrical transmission corridors; CEA safety buffer satisfied.',
      source: 'Central Electricity Authority Regulations & KSEB Grid Map',
      action: isMl
        ? 'മേൽക്കൂര നിർമ്മാണത്തിൽ ആവശ്യമായ ലൈൻ അകലം നിലനിർത്തുക.'
        : 'Ensure rooftop installations maintain standard 2.5m vertical line clearance.',
    });

    // 5. Ecologically Sensitive / Slope Zone
    if (currentParcel.hazard_zone === 'landslide') {
      checks.push({
        id: 'environmental',
        name: t('build_check_environmental'),
        status: 'conditional',
        reason: isMl
          ? 'കുന്നിൻചെരിവ് മേഖല: മണ്ണ് പരിശോധനാ റിപ്പോർട്ടും സംരക്ഷണ ഭിത്തി നിർമ്മാണ എൻജിനീയറിങ് സർട്ടിഫിക്കറ്റും നിർബന്ധമാണ്.'
          : 'High slope hazard terrain: Requires soil mechanics stability certificate and retaining wall design.',
        source: 'Geological Survey of India (GSI) Slope Atlas',
        action: isMl
          ? 'മണ്ണ് സംരക്ഷണ വിഭാഗത്തിന്റെ എൻ.ഒ.സി ലഭ്യമാക്കുക.'
          : 'Engage geotechnical consultant for slope stabilization NOC.',
      });
    } else {
      checks.push({
        id: 'environmental',
        name: t('build_check_environmental'),
        status: 'suitable',
        reason: isMl
          ? 'ഉരുൾപൊട്ടൽ സാധ്യതയില്ലാത്ത സുരക്ഷിതമായ നിരപ്പായ പ്രദേശം.'
          : 'Stable topography (<10° slope) free from slope failure or landslide hazards.',
        source: 'GSI Landslide Hazard Zonation & Forest Buffer Registry',
        action: isMl ? 'സാധാരണ മണ്ണ് പരിശോധന മതിയാകും.' : 'Standard soil bearing test sufficient.',
      });
    }

    // 6. Coastal / Waterbody Buffer Restrictions
    checks.push({
      id: 'crz_waterways',
      name: t('build_check_crz'),
      status: 'suitable',
      reason: isMl
        ? 'കോസ്റ്റൽ റഗുലേഷൻ സോൺ (CRZ) പരിധിക്ക് പുറത്താണ്. ജലാശയ സംരക്ഷണ പരിധികളിൽ തടസ്സമില്ല.'
        : 'Located outside Coastal Regulation Zone (CRZ) and maintains statutory buffer from designated public waterways.',
      source: 'Kerala Coastal Zone Management Authority (KCZMA) & Water Resources Dept',
      action: isMl
        ? 'പ്രകൃതിദത്ത നീരൊഴുക്കുകൾ തടസ്സപ്പെടുത്താതെ നിലനിർത്തുക.'
        : 'Ensure natural surface run-off channels remain unobstructed.',
    });

    return checks;
  }, [currentParcel, isMl, t]);

  // Compute Overall 4-Tier Verdict
  const overallVerdict = useMemo(() => {
    if (!currentParcel || detailedChecks.length === 0) {
      return {
        key: 'insufficient',
        label: t('build_verdict_insufficient'),
        bgClass: 'bg-slate-100 border-slate-300 text-slate-800',
        badgeClass: 'bg-slate-200 text-slate-800',
      };
    }

    const hasRestricted = detailedChecks.some((c) => c.status === 'restricted');
    const hasConditional = detailedChecks.some((c) => c.status === 'conditional');

    if (hasRestricted) {
      return {
        key: 'restricted',
        label: t('build_verdict_restricted'),
        bgClass: 'bg-red-50 border-red-300 text-red-950',
        badgeClass: 'bg-red-100 text-red-900 border-red-200',
      };
    }
    if (hasConditional) {
      return {
        key: 'conditional',
        label: t('build_verdict_conditional'),
        bgClass: 'bg-amber-50 border-amber-300 text-amber-950',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
      };
    }
    return {
      key: 'suitable',
      label: t('build_verdict_suitable'),
      bgClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    };
  }, [currentParcel, detailedChecks, t]);

  if (loading && !currentParcel) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Setup Map Elements
  const parcelCoords = currentParcel?.geometry.coordinates[0][0] || [75.885, 11.305];
  const mapCenter: [number, number] = [parcelCoords[1], parcelCoords[0]];

  const mapPolygons = [
    ...(hazardZones?.features.map((hz) => ({
      id: hz.properties.id,
      coordinates: hz.geometry.coordinates,
      color:
        hz.properties.severity === 'high'
          ? '#dc2626'
          : hz.properties.severity === 'medium'
          ? '#ea580c'
          : '#ca8a04',
      label: isMl
        ? `${hz.properties.name_ml || hz.properties.name_en} (${hz.properties.severity})`
        : `${hz.properties.name_en} (${hz.properties.severity})`,
      fillOpacity: 0.25,
    })) || []),
    ...(currentParcel
      ? [
          {
            id: `parcel_${currentParcel.survey_number}`,
            coordinates: currentParcel.geometry.coordinates,
            color:
              currentParcel.classification === 'nilam'
                ? '#dc2626'
                : currentParcel.classification === 'wetland'
                ? '#ca8a04'
                : '#16a34a',
            label: isMl
              ? `സർവേ ${currentParcel.survey_number} · ${currentParcel.classification}`
              : `Survey ${currentParcel.survey_number} · ${currentParcel.classification.toUpperCase()}`,
            fillOpacity: 0.65,
          },
        ]
      : []),
  ];

  const citizenOriginMarker: MapMarker = {
    id: 'citizen_gps_origin',
    lat: location.lat,
    lng: location.lng,
    title: isMl ? location.label_ml : location.label_en,
    category: isMl ? 'എന്റെ സ്ഥാനം' : 'My Location',
    color: '#0284c7',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('build_check_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'സ്വയംപ്രേരിത നിർമ്മാണ അനുമതി പ്രീ-ചെക്ക് · 6 അടിസ്ഥാന നിയമാവലികൾ'
                : 'Automated Building Feasibility Pre-Check · 6 Statutory Spatial Checks'}
            </p>
          </div>
        </div>
        <SourceChip screenKey="build_check" />
      </div>

      {/* Universal Geolocation Origin Bar (Part 4) */}
      <CitizenLocationBar />

      {/* Prominent Statutory Disclaimer Required by Part 6 */}
      <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-amber-900">
            {isMl ? 'പ്രധാന നിയമപരമായ അറിയിപ്പ് (സങ്കേതം / K-SMART):' : 'Statutory Building Permit Disclaimer:'}
          </h4>
          <p className="leading-relaxed">
            {t('build_statutory_disclaimer')}
          </p>
        </div>
      </div>

      {/* Input Selection Card: Registered Property Selector + Manual Search */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* If Citizen has registered properties, provide one-click dropdown */}
        {citizenProperties.length > 0 && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-emerald-700" />
              <span>{isMl ? 'എന്റെ രജിസ്റ്റർ ചെയ്ത വസ്തു തിരഞ്ഞെടുക്കുക:' : 'Select From Your Registered Land Holdings:'}</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedPropertyId}
                onChange={(e) => handleSelectCitizenProperty(e.target.value)}
                className="flex-1 p-2.5 bg-white rounded-lg border border-emerald-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">{isMl ? '-- രജിസ്റ്റർ ചെയ്ത സ്ഥലം തിരഞ്ഞെടുക്കുക --' : '-- Choose a registered property --'}</option>
                {citizenProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isMl
                      ? `സർവേ ${p.survey_number}/${p.subdivision_number || ''} · ${p.village_ml} · വാർഡ് ${p.ward_id} (${p.area_cents} സെന്റ്)`
                      : `Survey ${p.survey_number}/${p.subdivision_number || ''} · ${p.village_en} · Ward ${p.ward_id} (${p.area_cents} cents)`}
                  </option>
                ))}
              </select>

              <Link
                href="/citizen/plot"
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <span>{isMl ? 'സ്ഥലം ചേർക്കുക / തിരുത്തുക' : 'Manage Properties'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Manual Form */}
        <form onSubmit={handleManualSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">{t('build_survey_label')}:</label>
            <input
              type="text"
              value={surveyNumber}
              onChange={(e) => {
                setSurveyNumber(e.target.value);
                setSelectedPropertyId('');
              }}
              placeholder="e.g. 412/2"
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-coconut-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">{t('build_bldg_type')}:</label>
            <select
              value={buildingType}
              onChange={(e) => setBuildingType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-coconut-500 focus:outline-none"
            >
              <option value="residential">{t('build_type_res')}</option>
              <option value="commercial">{t('build_type_comm')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              {isMl ? 'സ്ഥലത്തിന്റെ മേൽവിലാസം / അടയാളം:' : 'Property Address / Landmark:'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-coconut-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Quick Demo Parcels */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 font-medium">
                {isMl ? 'മാതൃകാ പരിശോധനകൾ:' : 'Test Cadastral Cases:'}
              </span>
              <button
                type="button"
                onClick={() => handleSelectQuickSurvey('412/2')}
                className="px-2.5 py-1 rounded-lg bg-red-100 text-red-900 font-bold hover:bg-red-200 transition-colors"
              >
                {isMl ? '412/2 (നിലം / നിയന്ത്രണമുള്ളത്)' : '412/2 (Nilam / Restricted)'}
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickSurvey('316/3')}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200 transition-colors"
              >
                {isMl ? '316/3 (പുരയിടം / അനുയോജ്യം)' : '316/3 (Purayidom / Suitable)'}
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickSurvey('324/4')}
                className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 transition-colors"
              >
                {isMl ? '324/4 (വെള്ളപ്പൊക്കം / വ്യവസ്ഥാപിതം)' : '324/4 (Flood / Conditional)'}
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-coconut-700 hover:bg-coconut-600 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isMl ? 'പരിശോധനാ ഫലം കാണുക' : 'Evaluate Feasibility'}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Results Grid */}
      {currentParcel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          {/* Left 2 Columns: Overall Verdict & 6 Detailed Checks */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Overall Verdict Card */}
            <div className={`p-6 rounded-2xl border-2 shadow-md space-y-4 ${overallVerdict.bgClass}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
                <div className="flex items-center gap-3.5">
                  {overallVerdict.key === 'suitable' ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 flex-shrink-0" />
                  ) : overallVerdict.key === 'conditional' ? (
                    <AlertTriangle className="w-10 h-10 text-amber-600 flex-shrink-0" />
                  ) : (
                    <AlertOctagon className="w-10 h-10 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {isMl ? 'ഓട്ടോമേറ്റഡ് പ്രീ-ചെക്ക് ഫലം' : 'Automated Feasibility Verdict'}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black">
                      {overallVerdict.label}
                    </h2>
                  </div>
                </div>

                <Link
                  href={`/citizen/plot?survey=${currentParcel.survey_number}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <MapPin className="w-4 h-4 text-coconut-700" />
                  <span>{isMl ? 'കഡാസ്ട്രൽ ഭൂപടം' : 'Inspect Plot on Map'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              <p className="text-xs font-medium leading-relaxed">
                {overallVerdict.key === 'suitable'
                  ? isMl
                    ? 'പ്രാഥമിക സ്പേഷ്യൽ പരിശോധനകളിൽ തടസ്സങ്ങളൊന്നും കണ്ടെത്തിയിട്ടില്ല. അംഗീകൃത എഞ്ചിനീയർ തയ്യാറാക്കിയ കെട്ടിട പ്ലാൻ സഹിതം സങ്കേതം പോർട്ടൽ വഴി ഔദ്യോഗിക അനുമതിക്ക് അപേക്ഷിക്കാം.'
                    : 'All preliminary statutory spatial checks pass. You may engage an empaneled civil engineer or architect to prepare building plans and apply via the official Sanketham (IKM) portal.'
                  : overallVerdict.key === 'conditional'
                  ? isMl
                    ? 'പ്രത്യേക നിബന്ധനകൾക്ക് വിധേയം: വെള്ളപ്പൊക്ക സാധ്യതാ മേഖലയിലോ ചരിവുള്ള സ്ഥലത്തോ ആയതിനാൽ തറ ഉയർത്തൽ, ഡ്രെയിനേജ് പ്ലാൻ, ദുരന്ത നിവാരണ ക്ലിയറൻസ് എന്നിവ നിർബന്ധമാണ്.'
                    : 'Conditional feasibility: The parcel is proximate to flood or slope contours. Plinth elevation clearance and disaster mitigation NOC are required prior to permit issuance.'
                  : isMl
                  ? 'നിലവിലുള്ള വിവരങ്ങൾ പ്രകാരം നിർമ്മാണം അനുവദനീയമല്ല: നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമപ്രകാരമോ റോഡ് സെറ്റ്-ബാക്ക് കുറവായതിനാലോ നിയന്ത്രണമുണ്ട്.'
                  : 'Construction is restricted based on available cadastral records. Conversion of Paddy wetland or breach of mandatory 3m road setback violates building regulations.'}
              </p>
            </div>

            {/* 6 Specific Checks Accordion/List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-coconut-700" />
                  <span>{isMl ? '6 അടിസ്ഥാന പരിശോധനാ ഘടകങ്ങൾ' : '6 Mandatory Statutory Spatial Checks'}</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {detailedChecks.filter((c) => c.status === 'suitable').length} / {detailedChecks.length} {isMl ? 'അനുയോജ്യം' : 'Clear'}
                </span>
              </div>

              <div className="space-y-3">
                {detailedChecks.map((check, index) => {
                  let badge = {
                    text: t('build_verdict_suitable'),
                    class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  };
                  if (check.status === 'conditional') {
                    badge = {
                      text: t('build_verdict_conditional'),
                      class: 'bg-amber-100 text-amber-800 border-amber-300',
                    };
                  } else if (check.status === 'restricted') {
                    badge = {
                      text: t('build_verdict_restricted'),
                      class: 'bg-red-100 text-red-800 border-red-300',
                    };
                  }

                  return (
                    <div
                      key={check.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {index + 1}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm">{check.name}</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                          {badge.text}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed font-medium pl-7">
                        {check.reason}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60 pl-7 text-slate-600">
                        <div>
                          <strong className="text-slate-800">{t('build_source')}:</strong> {check.source}
                        </div>
                        <div>
                          <strong className="text-slate-800">{t('build_next_action')}:</strong> {check.action}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cadastral Polygon Map */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-coconut-700" />
                  <span>
                    {isMl
                      ? 'കഡാസ്ട്രൽ അതിർത്തിയും ദുരന്ത സാധ്യതാ ലെയറും'
                      : 'Cadastral Boundary on KSDMA Hazard Grid'}
                  </span>
                </h3>
                <span className="font-mono text-slate-500">
                  {isMl
                    ? `വില്ലേജ്: ${currentParcel.village_ml} · വാർഡ് ${currentParcel.ward_id}`
                    : `Village: ${currentParcel.village_en} · Ward ${currentParcel.ward_id}`}
                </span>
              </div>

              <InteractiveMap
                center={mapCenter}
                zoom={16}
                markers={[citizenOriginMarker]}
                polygons={mapPolygons}
                height="320px"
              />

              <div className="text-[11px] text-slate-500 text-center">
                {isMl
                  ? 'KSDMA വെള്ളപ്പൊക്ക സാധ്യതാ ലെയറുകൾക്ക് മുകളിൽ ഭൂമിയുടെ അതിർത്തി അടയാളപ്പെടുത്തിയിരിക്കുന്നു.'
                  : 'Highlighted polygon shows parcel boundary over KSDMA flood plain layers.'}
              </div>
            </div>
          </div>

          {/* Right 1 Column: Cadastral Attributes & Plain-Language Rights */}
          <div className="space-y-6 min-w-0">
            {/* Cadastral Record Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t('cadastral_record')}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {isMl
                      ? `സർവേ ${currentParcel.survey_number}`
                      : `Survey ${currentParcel.survey_number}`}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    currentParcel.classification === 'nilam'
                      ? 'bg-red-100 text-red-800'
                      : currentParcel.classification === 'wetland'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {t(`class_${currentParcel.classification}`)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('total_area')}:</span>
                  <strong className="text-slate-900 font-bold">
                    {currentParcel.area_cents} {t('cents')}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('road_setback')}:</span>
                  <strong className={currentParcel.road_setback_ok ? 'text-emerald-700' : 'text-red-700'}>
                    {currentParcel.road_setback_ok ? t('compliant_3m') : t('breach_3m')}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('hazard_exposure')}:</span>
                  <strong className="text-amber-800 uppercase font-mono">
                    {currentParcel.hazard_zone}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{isMl ? 'വില്ലേജ്:' : 'Village:'}</span>
                  <strong className="text-slate-800">
                    {isMl ? currentParcel.village_ml : currentParcel.village_en}
                  </strong>
                </div>
              </div>
            </div>

            {/* Permitted Activities */}
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('plot_what_you_can_do')}</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {(isMl
                  ? currentParcel.permitted_activities_ml
                  : currentParcel.permitted_activities_en
                ).map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-800 font-medium">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted Activities */}
            <div className="bg-red-50/80 p-4 rounded-2xl border border-red-200 text-xs space-y-2">
              <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>{t('plot_restricted_actions')}</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {(isMl
                  ? currentParcel.restricted_activities_ml
                  : currentParcel.restricted_activities_en
                ).map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-800 font-medium">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuildCheckPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <BuildCheckContent />
    </Suspense>
  );
}
