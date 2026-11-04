'use client';

import React from 'react';
import { MapPin, Crosshair, AlertCircle, RotateCcw, Compass, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useCitizenLocation } from '@/lib/location-context';

interface CitizenLocationBarProps {
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
  showPresets?: boolean;
}

export const CitizenLocationBar: React.FC<CitizenLocationBarProps> = ({
  onLocationChange,
  className = '',
  showPresets = true,
}) => {
  const { t, language } = useTranslation();
  const {
    location,
    loading,
    error,
    requestGpsLocation,
    setPresetLocation,
    resetToDemoLocation,
    isOutsideKunnamangalam,
    distanceFromKunnamangalamKm,
  } = useCitizenLocation();

  const isMl = language === 'ml';

  const handleGpsClick = async () => {
    const success = await requestGpsLocation();
    if (success && onLocationChange) {
      // Small timeout to allow state propagation
      setTimeout(() => {
        onLocationChange(location.lat, location.lng);
      }, 50);
    }
  };

  const handlePreset = (lat: number, lng: number, labelEn: string, labelMl: string) => {
    setPresetLocation(lat, lng, labelEn, labelMl);
    if (onLocationChange) onLocationChange(lat, lng);
  };

  const handleReset = () => {
    resetToDemoLocation();
    if (onLocationChange) onLocationChange(11.305, 75.885);
  };

  return (
    <div className={`bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 text-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Current Origin Display with Source Badge */}
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-xl bg-coconut-50 text-coconut-700 border border-coconut-200 flex-shrink-0 mt-0.5 sm:mt-0">
            <MapPin className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                {isMl ? 'പുറപ്പെടുന്ന സ്ഥാനം / നിലവിലെ സ്ഥാനം:' : 'Current Citizen Location / Origin:'}
              </span>

              {/* Source Badge */}
              {location.source === 'gps' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <Compass className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>LIVE GPS {location.accuracy ? `(±${location.accuracy}m)` : ''}</span>
                </span>
              )}
              {location.source === 'manual' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span>MANUAL PIN</span>
                </span>
              )}
              {location.source === 'demo' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <span>DEMO PRESET</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <strong className="text-slate-900 text-xs sm:text-sm font-extrabold">
                {isMl ? location.label_ml : location.label_en}
              </strong>
              <span className="text-[10px] font-mono text-slate-500">
                ({location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Use My GPS Location Button */}
          <button
            type="button"
            onClick={handleGpsClick}
            disabled={loading}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              location.source === 'gps'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-coconut-700 hover:bg-coconut-600 text-white'
            }`}
            title="Request device GPS via browser Geolocation API"
          >
            <Crosshair className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>
              {loading
                ? isMl ? 'ജി.പി.എസ് പരിശോധിക്കുന്നു...' : 'Acquiring GPS...'
                : isMl ? 'എന്റെ ജി.പി.എസ് ഉപയോഗിക്കുക' : 'Use My GPS Location'}
            </span>
          </button>

          {/* Reset to Demo Button */}
          {location.source !== 'demo' && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center gap-1 text-[11px]"
              title="Reset to Kunnamangalam Demonstration Centroid"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>{isMl ? 'മാതൃകയിലേക്ക് മടങ്ങുക' : 'Reset to Demo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Ward Quick Selectors */}
      {showPresets && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[10px] font-semibold">
              {isMl ? 'വാർഡ് മാതൃകകൾ:' : 'Demo Presets:'}
            </span>
            <button
              type="button"
              onClick={() => handlePreset(11.305, 75.885, 'Ward 7 (Cheruvannur Central)', 'വാർഡ് 7 (ചെറുവണ്ണൂർ സെൻട്രൽ)')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                location.lat === 11.305 && location.lng === 75.885
                  ? 'bg-coconut-100 text-coconut-800 border border-coconut-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isMl ? 'വാർഡ് 7' : 'Ward 7'}
            </button>
            <button
              type="button"
              onClick={() => handlePreset(11.332, 75.875, 'Ward 8 (Kottakkunnu)', 'വാർഡ് 8 (കോട്ടക്കുന്ന്)')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                location.lat === 11.332 && location.lng === 75.875
                  ? 'bg-coconut-100 text-coconut-800 border border-coconut-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isMl ? 'വാർഡ് 8' : 'Ward 8'}
            </button>
            <button
              type="button"
              onClick={() => handlePreset(11.285, 75.862, 'Ward 11 (Velliparamba)', 'വാർഡ് 11 (വെള്ളിപ്പറമ്പ്)')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                location.lat === 11.285 && location.lng === 75.862
                  ? 'bg-coconut-100 text-coconut-800 border border-coconut-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isMl ? 'വാർഡ് 11' : 'Ward 11'}
            </button>
            <button
              type="button"
              onClick={() => handlePreset(11.313, 75.909, 'Ward 1 (Kizhakkumuri)', 'വാർഡ് 1 (കിഴക്കുമുറി)')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                location.lat === 11.313 && location.lng === 75.909
                  ? 'bg-coconut-100 text-coconut-800 border border-coconut-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isMl ? 'വാർഡ് 1' : 'Ward 1'}
            </button>
          </div>

          <div className="text-[10px] text-slate-400">
            {isMl
              ? 'മാപ്പിൽ എവിടെയും തൊട്ട് പുറപ്പെടുന്ന സ്ഥാനം മാറ്റാം'
              : 'Tap map anytime to shift departure point'}
          </div>
        </div>
      )}

      {/* Outside Kunnamangalam Alert Notice */}
      {isOutsideKunnamangalam && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 text-[11px] rounded-xl flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-700 flex-shrink-0" />
          <p className="leading-snug">
            {isMl
              ? `നിങ്ങളുടെ ലൈവ് ജി.പി.എസ് സ്ഥാനം കുന്നമംഗലത്തിന് പുറത്താണ് (~${distanceFromKunnamangalamKm} കി.മീ അകലെ). ലൈവ് ഓപ്പൺസ്ട്രീറ്റ്മാപ്പ് സർവീസ് വഴി വിവരങ്ങൾ നൽകുന്നു.`
              : `Live GPS origin is outside Kunnamangalam Constituency (~${distanceFromKunnamangalamKm} km away). Real-world coordinates are being used for live routing.`}
          </p>
        </div>
      )}

      {/* GPS Error Alert */}
      {error && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
