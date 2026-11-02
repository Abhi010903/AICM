import {
  LandParcel,
  SitingEvaluation,
  SitingReason,
  SitingVerdict,
  CitizenBuildVerdict,
} from './types';

/**
 * Shared deterministic siting rule engine used by both:
 * - President Siting Compliance Checker (/president/siting)
 * - Citizen "Can I Build Here?" Checker (/citizen/build-check)
 */
export function evaluateSitingCompliance(
  parcel: LandParcel,
  proposedWorkType: string = 'residential'
): SitingEvaluation {
  const reasons: SitingReason[] = [];

  // Rule 1: Wetland / Nilam classification check
  if (parcel.classification === 'nilam') {
    reasons.push({
      rule_id: 'RULE_NILAM_RESTRICTION',
      level: 'FAIL',
      message_en:
        'Paddy Land & Wetland Act: Parcel classified as Nilam (paddy land). Conversion or construction is strictly restricted.',
      message_ml:
        'നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമം: സ്ഥലം നിലമായി രേഖപ്പെടുത്തിയിരിക്കുന്നു. നിർമ്മാണ പ്രവർത്തനങ്ങൾക്ക് കടുത്ത നിയന്ത്രണമുണ്ട്.',
    });
  } else if (parcel.classification === 'wetland') {
    reasons.push({
      rule_id: 'RULE_WETLAND_PROHIBITION',
      level: 'FAIL',
      message_en:
        'Ecologically sensitive wetland zone. Construction is prohibited under ecological conservation regulations.',
      message_ml:
        'പരിസ്ഥിതിലോല തണ്ണീർത്തട മേഖല. നിർമ്മാണം പൂർണ്ണമായും നിരോധിച്ചിരിക്കുന്നു.',
    });
  }

  // Rule 2: Road setback check
  if (!parcel.road_setback_ok) {
    reasons.push({
      rule_id: 'RULE_ROAD_SETBACK_BREACH',
      level: 'FAIL',
      message_en:
        'Kerala Municipality/Panchayat Building Rules: Inadequate road setback distance (< 3m from public road boundary).',
      message_ml:
        'കെട്ടിട നിർമ്മാണ ചട്ട ലംഘനം: പൊതുവഴിയിൽ നിന്നുള്ള നിർദ്ദിഷ്ട റോഡ് സെറ്റ്-ബാക്ക് ദൂരം (3 മീറ്റർ) ലഭ്യമല്ല.',
    });
  }

  // Rule 3: High flood risk zone check
  if (parcel.hazard_zone === 'flood_high') {
    reasons.push({
      rule_id: 'RULE_HIGH_FLOOD_OVERLAY',
      level: 'CONDITIONAL',
      message_en:
        'KSDMA High Flood Inundation Zone: Requires special plinth elevation clearance and disaster mitigation NOC.',
      message_ml:
        'അതിതീവ്ര വെള്ളപ്പൊക്ക സാധ്യതാ മേഖല: നിശ്ചിത ഉയരത്തിലുള്ള തറ ഉയർത്തലും ദുരന്ത നിവാരണ അതോറിറ്റി എൻ.ഒ.സി യും ആവശ്യമാണ്.',
    });
  } else if (parcel.hazard_zone === 'landslide') {
    reasons.push({
      rule_id: 'RULE_LANDSLIDE_SLOPE',
      level: 'CONDITIONAL',
      message_en:
        'High slope hazard zone: Requires soil stability certificate and slope-retention structural clearance.',
      message_ml:
        'ഉരുൾപൊട്ടൽ സാധ്യതയുള്ള ചരിവ് മേഖല: മണ്ണ് പരിശോധനാ റിപ്പോർട്ടും സംരക്ഷണ ഭിത്തി നിർമ്മാണ അനുമതിയും വേണം.',
    });
  }

  // If no negative rules triggered
  if (reasons.length === 0) {
    reasons.push({
      rule_id: 'RULE_PURAYIDOM_CLEAR',
      level: 'PASS',
      message_en:
        'Zoning & statutory compliance confirmed: Dry land (Purayidom) with compliant road setback and no critical hazard constraints.',
      message_ml:
        'നിയമാനുസൃതമായ സ്ഥലം: ആവശ്യമായ റോഡ് വീതിയും അപകടരഹിതമായ കരഭൂമിയും (പുരയിടം) സ്ഥിരീകരിച്ചു.',
    });
  }

  // Hierarchy: Any FAIL -> FAIL; Otherwise any CONDITIONAL -> CONDITIONAL; Otherwise -> PASS
  let verdict: SitingVerdict = 'PASS';
  const hasFail = reasons.some((r) => r.level === 'FAIL');
  const hasConditional = reasons.some((r) => r.level === 'CONDITIONAL');

  if (hasFail) {
    verdict = 'FAIL';
  } else if (hasConditional) {
    verdict = 'CONDITIONAL';
  } else {
    verdict = 'PASS';
  }

  // Map to Citizen wording
  let citizen_verdict: CitizenBuildVerdict = 'PASS';
  if (verdict === 'FAIL') {
    citizen_verdict = 'NOT PERMITTED';
  } else if (verdict === 'CONDITIONAL') {
    citizen_verdict = 'NEEDS APPROVAL';
  } else {
    citizen_verdict = 'PASS';
  }

  return {
    verdict,
    citizen_verdict,
    reasons,
    parcel,
  };
}
