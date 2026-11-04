'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Plus,
  FileText,
  Camera,
  Layers,
  ShieldCheck,
  Building,
  Home,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  Upload,
  Crosshair,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap, MapPolygon, MapMarker } from '@/components/maps/InteractiveMap';
import { CitizenLocationBar } from '@/components/common/CitizenLocationBar';
import { Modal } from '@/components/common/Modal';
import { useCitizenLocation } from '@/lib/location-context';
import { getParcelBySurveyNumber, getParcels } from '@/lib/api';
import {
  getCitizenProperties,
  addCitizenProperty,
} from '@/lib/citizen-store';
import {
  CitizenProperty,
  LandParcel,
  PropertyVerificationStatus,
} from '@/lib/types';

function MyPlotContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const { location } = useCitizenLocation();

  const isMl = language === 'ml';
  const initialSurvey = searchParams.get('survey') || '';

  // Data states
  const [citizenProperties, setCitizenProperties] = useState<CitizenProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<CitizenProperty | null>(null);
  const [allParcels, setAllParcels] = useState<LandParcel[]>([]);
  const [searchedParcel, setSearchedParcel] = useState<LandParcel | null>(null);
  const [searchInput, setSearchInput] = useState<string>(initialSurvey);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_properties' | 'search'>('my_properties');
  const [propertyDetailModal, setPropertyDetailModal] = useState<CitizenProperty | null>(null);

  // Add Property Form State
  const [formMethod, setFormMethod] = useState<'manual' | 'map'>('manual');
  const [formSurvey, setFormSurvey] = useState('');
  const [formSubdivision, setFormSubdivision] = useState('1');
  const [formVillage, setFormVillage] = useState('Cheruvannur');
  const [formWard, setFormWard] = useState<number>(session?.profileWardId || 7);
  const [formAreaCents, setFormAreaCents] = useState<number>(10);
  const [formPropType, setFormPropType] = useState<'residential' | 'agricultural' | 'commercial'>('residential');
  const [formClassification, setFormClassification] = useState<'purayidom' | 'nilam' | 'wetland'>('purayidom');
  const [formHasHouse, setFormHasHouse] = useState(true);
  const [formAddress, setFormAddress] = useState('');
  const [formPinCoords, setFormPinCoords] = useState<[number, number]>([11.305, 75.885]);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Refresh citizen properties strictly isolated by phone
  const refreshProperties = useCallback(() => {
    if (!session?.phone) {
      setCitizenProperties([]);
      return;
    }
    const props = getCitizenProperties(session.phone);
    setCitizenProperties(props);
    if (props.length > 0 && !selectedProperty) {
      setSelectedProperty(props[0]);
    }
  }, [session?.phone, selectedProperty]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const parcelsList = await getParcels();
        setAllParcels(parcelsList);

        if (session?.phone) {
          const props = getCitizenProperties(session.phone);
          setCitizenProperties(props);

          // If URL parameter specified, select matching property or parcel
          if (initialSurvey) {
            const matchedProp = props.find((p) => p.survey_number === initialSurvey);
            if (matchedProp) {
              setSelectedProperty(matchedProp);
              setActiveTab('my_properties');
            } else {
              const pData = await getParcelBySurveyNumber(initialSurvey);
              if (pData) {
                setSearchedParcel(pData);
                setActiveTab('search');
              }
            }
          } else if (props.length > 0) {
            setSelectedProperty(props[0]);
          } else {
            // Default to parcel 412/2
            const defaultParcel = await getParcelBySurveyNumber('412/2');
            setSearchedParcel(defaultParcel);
          }
        } else {
          // Unauthenticated or demo fallback
          const defaultParcel = await getParcelBySurveyNumber('412/2');
          setSearchedParcel(defaultParcel);
        }
      } catch (err) {
        console.error('Failed to load land parcel data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.phone, initialSurvey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setSearchError(null);
    try {
      const found = await getParcelBySurveyNumber(searchInput.trim());
      if (found) {
        setSearchedParcel(found);
        setActiveTab('search');
      } else {
        setSearchError(
          isMl
            ? `സർവേ നമ്പർ "${searchInput}" ഡെമോ രേഖകളിൽ കണ്ടെത്താനായില്ല.`
            : `Survey parcel "${searchInput}" was not found in demo cadastral records.`
        );
      }
    } catch {
      setSearchError(isMl ? 'തിരയുന്നതിൽ പിശകുണ്ടായി.' : 'Error searching for parcel.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoParcel = async (sNo: string) => {
    setSearchInput(sNo);
    setSearchError(null);
    const found = allParcels.find((p) => p.survey_number === sNo);
    if (found) {
      setSearchedParcel(found);
      setActiveTab('search');
    } else {
      const p = await getParcelBySurveyNumber(sNo);
      setSearchedParcel(p);
      setActiveTab('search');
    }
  };

  const handleAddPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.phone) return;

    const trimmedSurvey = formSurvey.trim();
    if (!trimmedSurvey) return;

    // Generate simulated geometry based on pinned coords or survey centroid
    const centerLat = formPinCoords[0];
    const centerLng = formPinCoords[1];
    const delta = 0.0006;

    const newProp: CitizenProperty = {
      id: `PROP-2026-${Math.floor(100 + Math.random() * 900)}`,
      owner_phone: session.phone,
      owner_name: session.profileName || 'Citizen',
      survey_number: trimmedSurvey,
      subdivision_number: formSubdivision || '1',
      village_en: formVillage,
      village_ml: formVillage === 'Cheruvannur' ? 'ചെറുവണ്ണൂർ' : formVillage,
      taluk_en: 'Kozhikode',
      taluk_ml: 'കോഴിക്കോട്',
      district_en: 'Kozhikode',
      district_ml: 'കോഴിക്കോട്',
      ward_id: formWard,
      area_cents: Number(formAreaCents),
      property_type: formPropType,
      has_house: formHasHouse,
      address_en: formAddress || `${formVillage}, Ward ${formWard}`,
      address_ml: formAddress || `${formVillage}, വാർഡ് ${formWard}`,
      classification: formClassification,
      hazard_zone: 'none',
      verification_status: uploadedDocName ? 'document_supported' : 'citizen_submitted',
      documents: uploadedDocName
        ? [
            {
              id: `DOC-${Date.now()}`,
              name: uploadedDocName,
              doc_type: 'tax_receipt',
              size_kb: 450,
              uploaded_at: new Date().toISOString().split('T')[0],
            },
          ]
        : [],
      photos: uploadedPhotoName
        ? [
            {
              id: `PH-${Date.now()}`,
              name: uploadedPhotoName,
              caption: 'Boundary demarcation',
              uploaded_at: new Date().toISOString().split('T')[0],
            },
          ]
        : [],
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [centerLng - delta, centerLat - delta],
            [centerLng + delta, centerLat - delta],
            [centerLng + delta, centerLat + delta],
            [centerLng - delta, centerLat + delta],
            [centerLng - delta, centerLat - delta],
          ],
        ],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'Citizen Registration (Self-Reported)',
    };

    addCitizenProperty(newProp);
    refreshProperties();
    setSelectedProperty(newProp);
    setActiveTab('my_properties');
    setShowAddModal(false);
    setFormSuccessMessage(
      isMl
        ? `സർവേ നമ്പർ ${newProp.survey_number} വിജയകരമായി രജിസ്റ്റർ ചെയ്തു.`
        : `Property ${newProp.survey_number} has been registered successfully.`
    );
    setTimeout(() => setFormSuccessMessage(null), 4000);
  };

  const getStatusBadge = (status: PropertyVerificationStatus) => {
    switch (status) {
      case 'officially_verified':
        return {
          label: t('verif_officially_verified'),
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'document_supported':
        return {
          label: t('verif_document_supported'),
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'verification_pending':
      case 'documents_uploaded':
        return {
          label: t('verif_pending'),
          className: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'rejected':
        return {
          label: isMl ? 'നിരസിച്ചു' : 'Rejected',
          className: 'bg-red-100 text-red-800 border-red-300',
        };
      case 'citizen_submitted':
      default:
        return {
          label: t('verif_citizen_submitted'),
          className: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  // Build polygons for map
  const mapPolygons: MapPolygon[] = [];
  let mapCenter: [number, number] = [11.305, 75.885];

  if (activeTab === 'my_properties' && selectedProperty?.geometry) {
    const coords = selectedProperty.geometry.coordinates;
    mapPolygons.push({
      id: `prop_${selectedProperty.id}`,
      coordinates: coords,
      color:
        selectedProperty.classification === 'nilam'
          ? '#dc2626'
          : selectedProperty.classification === 'wetland'
          ? '#ca8a04'
          : '#16a34a',
      label: isMl
        ? `എന്റെ സ്ഥലം: സർവേ ${selectedProperty.survey_number}/${selectedProperty.subdivision_number || ''}`
        : `My Land: Survey ${selectedProperty.survey_number}/${selectedProperty.subdivision_number || ''}`,
      fillOpacity: 0.6,
    });
    const firstRing = coords[0];
    if (firstRing && firstRing[0]) {
      mapCenter = [firstRing[0][1], firstRing[0][0]];
    }
  } else if (activeTab === 'search' && searchedParcel?.geometry) {
    const coords = searchedParcel.geometry.coordinates;
    mapPolygons.push({
      id: `parcel_${searchedParcel.survey_number}`,
      coordinates: coords,
      color:
        searchedParcel.classification === 'nilam'
          ? '#dc2626'
          : searchedParcel.classification === 'wetland'
          ? '#ca8a04'
          : '#2563eb',
      label: isMl
        ? `സർവേ ${searchedParcel.survey_number} · ${searchedParcel.classification}`
        : `Survey ${searchedParcel.survey_number} · ${searchedParcel.classification.toUpperCase()}`,
      fillOpacity: 0.55,
    });
    const firstRing = coords[0];
    if (firstRing && firstRing[0]) {
      mapCenter = [firstRing[0][1], firstRing[0][0]];
    }
  }

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
      {/* Page Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('land_manage_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('land_manage_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('land_add_property')}</span>
            </button>
          </div>
        </div>
        <SourceChip screenKey="plot" />
      </div>

      {/* Universal Geolocation Origin Bar (Part 4) */}
      <CitizenLocationBar />

      {formSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {/* Tabs: My Properties vs Cadastral Search */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('my_properties')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'my_properties'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{isMl ? 'എന്റെ രജിസ്റ്റർ ചെയ്ത വസ്തുക്കൾ' : 'My Registered Properties'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {citizenProperties.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'search'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{isMl ? 'കഡാസ്ട്രൽ സർവേ തിരച്ചിൽ' : 'Cadastral Survey Search'}</span>
        </button>
      </div>

      {/* TAB 1: MY REGISTERED PROPERTIES */}
      {activeTab === 'my_properties' && (
        <div className="space-y-6">
          {citizenProperties.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Home className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">{t('land_empty_state')}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isMl
                    ? 'നിങ്ങളുടെ കരം അടച്ച രസീതോ ആധാര വിവരങ്ങളോ ഉപയോഗിച്ച് ഭൂമി ഇവിടെ ചേർക്കാം.'
                    : 'Add your property details using tax receipt or deed survey numbers to access automated zoning checks.'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {t('land_empty_action')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: List of citizen properties */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>{isMl ? 'വസ്തുക്കളുടെ പട്ടിക' : 'Registered Holdings'}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {session?.phone ? `Linked to ${session.phone}` : ''}
                  </span>
                </h2>

                <div className="space-y-3">
                  {citizenProperties.map((prop) => {
                    const isSelected = selectedProperty?.id === prop.id;
                    const badge = getStatusBadge(prop.verification_status);
                    return (
                      <div
                        key={prop.id}
                        onClick={() => setSelectedProperty(prop)}
                        className={`p-4 rounded-xl border text-xs space-y-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {prop.id}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-sm">
                              {isMl
                                ? `സർവേ ${prop.survey_number}/${prop.subdivision_number || ''}`
                                : `Survey ${prop.survey_number}/${prop.subdivision_number || ''}`}
                            </h3>
                            <p className="text-slate-600 text-[11px]">
                              {isMl ? prop.village_ml : prop.village_en} · {isMl ? `വാർഡ് ${prop.ward_id}` : `Ward ${prop.ward_id}`}
                            </p>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-slate-500 block">{t('total_area')}</span>
                            <strong className="text-slate-800">
                              {prop.area_cents} {t('cents')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{isMl ? 'വർഗ്ഗം' : 'Classification'}</span>
                            <strong className="text-slate-800 uppercase">
                              {t(`class_${prop.classification}`)}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPropertyDetailModal(prop);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isMl ? 'രേഖകൾ കാണുക' : 'View Docs'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/citizen/build-check?survey=${prop.survey_number}`);
                            }}
                            className="text-blue-700 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1"
                          >
                            <span>{t('check_building_permission')}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 2 Columns: Map & Property Details */}
              <div className="lg:col-span-2 space-y-4 min-w-0">
                {selectedProperty && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <h3 className="font-bold text-slate-900">
                          {isMl
                            ? `സർവേ ${selectedProperty.survey_number} കഡാസ്ട്രൽ ഭൂപട അതിർത്തി`
                            : `Cadastral Boundary for Survey ${selectedProperty.survey_number}`}
                        </h3>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {selectedProperty.address_en || selectedProperty.village_en}
                      </span>
                    </div>

                    <InteractiveMap
                      center={mapCenter}
                      zoom={17}
                      markers={[citizenOriginMarker]}
                      polygons={mapPolygons}
                      height="380px"
                    />

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {isMl
                            ? 'ഭൂപടത്തിന്റെ മുകൾവശത്ത് നിന്നും സാറ്റലൈറ്റ് ലെയർ തിരഞ്ഞെടുക്കാം.'
                            : 'Toggle basemap layers (Satellite / Streets) on the map.'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPropertyDetailModal(selectedProperty)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isMl ? 'സമ്പൂർണ്ണ വിവരങ്ങൾ' : 'Full Details'}</span>
                        </button>

                        <Link
                          href={`/citizen/build-check?survey=${selectedProperty.survey_number}`}
                          className="px-3 py-1.5 bg-coconut-700 hover:bg-coconut-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
                        >
                          <span>{t('check_building_permission')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CADASTRAL SEARCH & DEMO EXPLORATION */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Survey Search Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    isMl
                      ? 'സർവേ നമ്പർ നൽകുക (ഉദാ: 412/2, 316/3, 324/4)...'
                      : 'Enter Survey Number (e.g., 412/2, 316/3, 324/4)...'
                  }
                  className="w-full pl-9 p-3 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t('search')}</span>
              </button>
            </form>

            {/* Quick Demo Parcels */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-semibold">
                {isMl ? 'മാതൃകാ സർവേ നമ്പറുകൾ:' : 'Demo Parcels:'}
              </span>
              {allParcels.slice(0, 6).map((p) => (
                <button
                  key={p.survey_number}
                  type="button"
                  onClick={() => handleSelectDemoParcel(p.survey_number)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors ${
                    searchedParcel?.survey_number === p.survey_number
                      ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {p.survey_number} ({p.classification})
                </button>
              ))}
            </div>
          </div>

          {searchError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {searchedParcel && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
              {/* Map */}
              <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>
                      {isMl ? 'കഡാസ്ട്രൽ അതിർത്തിയും കോർഡിനേറ്റുകളും' : 'Cadastral Polygon & Bounding Coordinates'}
                    </span>
                  </h3>
                  <span className="font-mono text-slate-500">
                    {isMl
                      ? `വില്ലേജ്: ${searchedParcel.village_ml} · വാർഡ് ${searchedParcel.ward_id}`
                      : `Village: ${searchedParcel.village_en} · Ward ${searchedParcel.ward_id}`}
                  </span>
                </div>

                <InteractiveMap
                  center={mapCenter}
                  zoom={16}
                  markers={[citizenOriginMarker]}
                  polygons={mapPolygons}
                  height="380px"
                />

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>
                    {isMl
                      ? 'എന്റെ ഭൂമി കഡാസ്ട്രൽ അതിർത്തി രേഖ'
                      : 'GeoJSON Boundary Layer · Ente Bhoomi Cadastral Grid'}
                  </span>
                  <button
                    onClick={() => router.push(`/citizen/build-check?survey=${searchedParcel.survey_number}`)}
                    className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <span>{t('check_building_permission')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rights and constraints */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('cadastral_record')}
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        {isMl
                          ? `സർവേ ${searchedParcel.survey_number}`
                          : `Survey ${searchedParcel.survey_number}`}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        searchedParcel.classification === 'nilam'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : searchedParcel.classification === 'wetland'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {t(`class_${searchedParcel.classification}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">{t('total_area')}</span>
                      <strong className="text-slate-900">
                        {searchedParcel.area_cents} {t('cents')}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">{t('hazard_exposure')}</span>
                      <strong className="text-amber-700 uppercase">
                        {t(`hazard_${searchedParcel.hazard_zone}`)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Permitted Activities */}
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 text-xs space-y-2">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('plot_what_you_can_do')}</span>
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {(isMl
                      ? searchedParcel.permitted_activities_ml
                      : searchedParcel.permitted_activities_en
                    ).map((act, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 font-medium">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Restricted Activities */}
                <div className="bg-red-50/80 p-4 rounded-xl border border-red-200 text-xs space-y-2">
                  <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>{t('plot_restricted_actions')}</span>
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {(isMl
                      ? searchedParcel.restricted_activities_ml
                      : searchedParcel.restricted_activities_en
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
      )}

      {/* Ente Bhoomi & ReLIS Technical Integration Research Box */}
      <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-700 space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Info className="w-4 h-4 text-emerald-700" />
          <span>
            {isMl
              ? 'എന്റെ ഭൂമി & റീലിസ് (ReLIS) സംയോജന സാങ്കേതിക കുറിപ്പ്'
              : 'Ente Bhoomi & ReLIS Integration Architecture Disclosure'}
          </span>
        </div>
        <p className="leading-relaxed text-slate-600">
          {isMl
            ? 'കേരള സർക്കാരിന്റെ "എന്റെ ഭൂമി" സമഗ്ര ഡിജിറ്റൽ സർവേ പദ്ധതിയും റവന്യൂ വകുപ്പിന്റെ റീലിസ് (ReLIS) പോർട്ടലും വഴിയുള്ള കഡാസ്ട്രൽ വിവരങ്ങളുടെ ഡെമോ പതിപ്പാണിത്. തത്സമയ ഔദ്യോഗിക വിവരങ്ങൾ സ്റ്റേറ്റ് ഡാറ്റാ സെന്റർ (KSWAN) വഴിയാണ് കൈകാര്യം ചെയ്യുന്നത്. ഇവിടെ സമർപ്പിക്കുന്ന വസ്തുക്കൾ പൗരന്റെ ഫോൺ നമ്പർ അടിസ്ഥാനമാക്കി സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു.'
            : 'Cadastral parcels and spatial rights reflect demonstration geometry based on Government of Kerala Survey & Land Records datasets (Ente Bhoomi project) and ReLIS revenue patta schema. Direct write APIs into state revenue registries require authorized KSWAN departmental credentials; this portal safely manages citizen land holdings in local authenticated storage with GeoJSON parcel export capabilities.'}
        </p>
      </div>

      {/* MODAL 1: ADD / REGISTER PROPERTY */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
          }}
          title={t('land_add_property')}
          subtitle={
            isMl
              ? 'കഡാസ്ട്രൽ വിവരങ്ങൾ നൽകിയോ മാപ്പിൽ അടയാളപ്പെടുത്തിയോ സ്ഥലം ചേർക്കാം.'
              : 'Register land holdings via cadastral survey data or map location.'
          }
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Method switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormMethod('manual')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  formMethod === 'manual'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('land_method_manual')}
              </button>
              <button
                type="button"
                onClick={() => setFormMethod('map')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  formMethod === 'map'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('land_method_map')}
              </button>
            </div>

            <form onSubmit={handleAddPropertySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {t('build_survey_label')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSurvey}
                    onChange={(e) => setFormSurvey(e.target.value)}
                    placeholder="e.g. 412/2"
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {t('land_subdivision')}
                  </label>
                  <input
                    type="text"
                    value={formSubdivision}
                    onChange={(e) => setFormSubdivision(e.target.value)}
                    placeholder="e.g. 2A"
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {isMl ? 'വില്ലേജ്' : 'Village'}
                  </label>
                  <select
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Cheruvannur">{isMl ? 'ചെറുവണ്ണൂർ' : 'Cheruvannur'}</option>
                    <option value="Peruvayal">{isMl ? 'പെരുവയൽ' : 'Peruvayal'}</option>
                    <option value="Perumanna">{isMl ? 'പെരുമണ്ണ' : 'Perumanna'}</option>
                    <option value="Kunnamangalam">{isMl ? 'കുന്നമംഗലം' : 'Kunnamangalam'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {isMl ? 'വാർഡ് നമ്പർ' : 'Ward Number'}
                  </label>
                  <select
                    value={formWard}
                    onChange={(e) => setFormWard(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {[...Array(14)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {isMl ? `വാർഡ് ${i + 1}` : `Ward ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {t('land_extent')} ({t('cents')}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="1000"
                    required
                    value={formAreaCents}
                    onChange={(e) => setFormAreaCents(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {isMl ? 'ഭൂമിയുടെ തരം (വർഗ്ഗം)' : 'Land Classification'}
                  </label>
                  <select
                    value={formClassification}
                    onChange={(e) => setFormClassification(e.target.value as 'purayidom' | 'nilam' | 'wetland')}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="purayidom">{t('class_purayidom')}</option>
                    <option value="nilam">{t('class_nilam')}</option>
                    <option value="wetland">{t('class_wetland')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {isMl ? 'ഉപയോഗ തരം' : 'Property Type'}
                  </label>
                  <select
                    value={formPropType}
                    onChange={(e) => setFormPropType(e.target.value as 'residential' | 'agricultural' | 'commercial')}
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="residential">{t('land_type_res')}</option>
                    <option value="agricultural">{t('land_type_agri')}</option>
                    <option value="commercial">{t('land_type_comm')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    {t('land_house_status')}
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={formHasHouse}
                        onChange={() => setFormHasHouse(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isMl ? 'ഉണ്ട്' : 'Yes'}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formHasHouse}
                        onChange={() => setFormHasHouse(false)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isMl ? 'ഇല്ല' : 'No'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Map Point Picker if Method B */}
              {formMethod === 'map' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>{isMl ? 'മാപ്പിൽ തൊട്ട് സ്ഥാനം അടയാളപ്പെടുത്തുക' : 'Tap Map to Pin Property Location'}</span>
                    <button
                      type="button"
                      onClick={() => setFormPinCoords([location.lat, location.lng])}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>{isMl ? 'എന്റെ സ്ഥാനം' : 'My Location'}</span>
                    </button>
                  </div>
                  <InteractiveMap
                    center={formPinCoords}
                    zoom={15}
                    selectedPoint={formPinCoords}
                    onMapClick={(lat, lng) => setFormPinCoords([lat, lng])}
                    height="200px"
                  />
                </div>
              )}

              {/* Document upload simulation */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('land_upload_docs')} (PDF / JPG &lt;= 5MB)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.size > 5 * 1024 * 1024) {
                          alert(isMl ? 'ഫയൽ വലുപ്പം 5 MB യിൽ കുറവായിരിക്കണം.' : 'File size must be 5 MB or less.');
                          e.target.value = '';
                          return;
                        }
                        setUploadedDocName(file.name);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {uploadedDocName && (
                    <span className="text-[11px] text-emerald-700 font-bold">
                      ✓ {uploadedDocName}
                    </span>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t('land_disclaimer')}
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  {isMl ? 'റദ്ദാക്കുക' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm"
                >
                  {t('land_request_verification')}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL 2: PROPERTY FULL DETAILS & DOCUMENTS VIEWER (Part 2) */}
      {propertyDetailModal && (
        <Modal
          isOpen={!!propertyDetailModal}
          onClose={() => setPropertyDetailModal(null)}
          badge={
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {propertyDetailModal.id}
            </span>
          }
          title={
            isMl
              ? `സർവേ ${propertyDetailModal.survey_number}/${propertyDetailModal.subdivision_number || ''}`
              : `Survey ${propertyDetailModal.survey_number}/${propertyDetailModal.subdivision_number || ''}`
          }
          subtitle={
            <>
              {isMl ? propertyDetailModal.village_ml : propertyDetailModal.village_en},{' '}
              {isMl ? `വാർഡ് ${propertyDetailModal.ward_id}` : `Ward ${propertyDetailModal.ward_id}`} · {propertyDetailModal.source}
            </>
          }
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Cadastral Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ഉടമസ്ഥൻ' : 'Registered Owner'}</span>
                  <strong className="text-slate-900 text-xs">{propertyDetailModal.owner_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ഫോൺ നമ്പർ' : 'Contact Phone'}</span>
                  <strong className="text-slate-900 font-mono text-xs">{propertyDetailModal.owner_phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{t('total_area')}</span>
                  <strong className="text-slate-900 text-xs">
                    {propertyDetailModal.area_cents} {t('cents')}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">
                      (~{Math.round(propertyDetailModal.area_cents * 40.4686)} sq.m)
                    </span>
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ഭൂമി വർഗ്ഗീകരണം' : 'Classification'}</span>
                  <strong className="text-slate-900 uppercase text-xs">{t(`class_${propertyDetailModal.classification}`)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'താലൂക്ക് & വില്ലേജ്' : 'Taluk & Village'}</span>
                  <strong className="text-slate-900 text-xs">
                    {isMl ? propertyDetailModal.taluk_ml : propertyDetailModal.taluk_en} / {isMl ? propertyDetailModal.village_ml : propertyDetailModal.village_en}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'നിലവിലുള്ള കെട്ടിടം' : 'Existing Building'}</span>
                  <strong className="text-slate-900 text-xs">
                    {propertyDetailModal.has_house ? (isMl ? 'ഉണ്ട് (താമസ ഗൃഹം)' : 'Yes (Residential Structure)') : (isMl ? 'ഇല്ല (ഒഴിഞ്ഞ സ്ഥലം)' : 'No (Vacant Land)')}
                  </strong>
                </div>
              </div>

              {/* Embedded Cadastral Boundary Map with Automatic Invalidation */}
              {propertyDetailModal.geometry && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>{isMl ? 'കഡാസ്ട്രൽ ഭൂപട അതിർത്തി' : 'Cadastral Boundary Map Preview'}</span>
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner min-w-0 w-full">
                    <InteractiveMap
                      center={
                        propertyDetailModal.geometry.coordinates?.[0]?.[0]
                          ? [
                              propertyDetailModal.geometry.coordinates[0][0][1],
                              propertyDetailModal.geometry.coordinates[0][0][0],
                            ]
                          : [11.305, 75.885]
                      }
                      zoom={17}
                      markers={[citizenOriginMarker]}
                      polygons={[
                        {
                          id: `modal_poly_${propertyDetailModal.id}`,
                          coordinates: propertyDetailModal.geometry.coordinates,
                          color: '#10b981',
                          label: `Survey ${propertyDetailModal.survey_number}/${propertyDetailModal.subdivision_number || ''}`,
                          fillOpacity: 0.45,
                        },
                      ]}
                      height="220px"
                    />
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>{isMl ? 'സ്ഥിരീകരണ രേഖകൾ' : 'Attached Cadastral Documents'}</span>
                </h4>
                {propertyDetailModal.documents.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-lg">
                    {isMl ? 'രേഖകൾ ഒന്നും അപ്‌ലോഡ് ചെയ്തിട്ടില്ല.' : 'No documents uploaded yet.'}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {propertyDetailModal.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{doc.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {doc.size_kb} KB · {doc.uploaded_at}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {isMl ? 'രേഖയുണ്ട്' : 'Verified File'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos */}
              {propertyDetailModal.photos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>{isMl ? 'അതിർത്തി ചിത്രങ്ങൾ' : 'Property Photos'}</span>
                  </h4>
                  <div className="space-y-1">
                    {propertyDetailModal.photos.map((ph) => (
                      <div
                        key={ph.id}
                        className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700"
                      >
                        <strong>{ph.name}</strong> — {ph.caption} ({ph.uploaded_at})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPropertyDetailModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 text-xs"
              >
                {isMl ? 'അടയ്ക്കുക' : 'Close'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = propertyDetailModal.survey_number;
                  setPropertyDetailModal(null);
                  router.push(`/citizen/build-check?survey=${s}`);
                }}
                className="px-4 py-2 bg-coconut-700 hover:bg-coconut-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>{t('check_building_permission')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
}

export default function MyPlotPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">{t('loading')}</div>}>
      <MyPlotContent />
    </Suspense>
  );
}
