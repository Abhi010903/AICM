/**
 * Role-Aware Omnichannel Search Engine
 *
 * Implements genuine debounced, ranked, categorized search across all Digital Twin datasets.
 * Strictly enforces role-based filtering so Citizens cannot discover administrative,
 * budget-simulation, or private records through search queries.
 * Fully supports English and Malayalam search results.
 */

import { UserRole, Language } from './types';
import mlaKnowledgeBase from '../data/mla-knowledge-base.json';

const { wards: wardsData, assets: assetsData, facilities: facilitiesData, projects: gpdpProjectsData, land_parcels: landParcelsData, grievances: grievancesData } = mlaKnowledgeBase;

export type SearchCategory =
  | 'ward'
  | 'asset'
  | 'facility'
  | 'project'
  | 'budget'
  | 'hazard'
  | 'grievance'
  | 'evacuation'
  | 'parcel'
  | 'service';

export interface SearchResultItem {
  id: string;
  title: string;
  category: SearchCategory;
  categoryLabel: string;
  description: string;
  href: string;
  badge?: string;
  isPresidentOnly?: boolean;
  score?: number;
}

// Category display labels in English
export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  ward: 'Wards & Governance',
  asset: 'Infrastructure Assets',
  facility: 'Public Facilities',
  project: 'GPDP Development Works',
  budget: 'Budget & Fiscal Simulation',
  hazard: 'Hazard & Disaster Safety',
  grievance: 'Citizen Grievances',
  evacuation: 'Emergency Shelters & Routes',
  parcel: 'Cadastral Land Parcels',
  service: 'Citizen Public Services',
};

// Category display labels in Malayalam
export const CATEGORY_LABELS_ML: Record<SearchCategory, string> = {
  ward: 'വാർഡുകളും ഭരണവും',
  asset: 'പൊതു ആസ്തികൾ',
  facility: 'പൊതു സേവന കേന്ദ്രങ്ങൾ',
  project: 'GPDP വികസന പദ്ധതികൾ',
  budget: 'ബജറ്റ് സിമുലേഷൻ',
  hazard: 'ദുരന്ത നിവാരണ സുരക്ഷ',
  grievance: 'പൗര പരാതികൾ',
  evacuation: 'ക്യാമ്പുകളും ഒഴിപ്പിക്കൽ പാതകളും',
  parcel: 'കഡാസ്ട്രൽ ഭൂമി വിവരങ്ങൾ',
  service: 'പൊതുജന സേവനങ്ങൾ',
};

/**
 * Searches system records with role-aware security filtering and multilingual presentation
 */
export function searchSystem(
  query: string,
  role: UserRole,
  language: Language = 'en'
): SearchResultItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  const isMl = language === 'ml';
  const catLabels = isMl ? CATEGORY_LABELS_ML : CATEGORY_LABELS;
  const results: SearchResultItem[] = [];

  // 1. Wards (Both roles, different target links)
  wardsData.forEach((w) => {
    const targetLink = role === 'president' ? `/president/wards` : `/shared/ward/${w.id}`;
    if (
      w.name_en.toLowerCase().includes(clean) ||
      w.name_ml.toLowerCase().includes(clean) ||
      `ward ${w.number}`.includes(clean) ||
      `ward ${w.id}`.includes(clean) ||
      `വാർഡ് ${w.number}`.includes(clean)
    ) {
      results.push({
        id: `ward_${w.id}`,
        title: isMl
          ? `വാർഡ് ${w.number}: ${w.name_ml} (${w.name_en})`
          : `Ward ${w.number}: ${w.name_en} (${w.name_ml})`,
        category: 'ward',
        categoryLabel: catLabels.ward,
        description: isMl
          ? `ജനസംഖ്യ: ${w.population.toLocaleString()} · PDI സ്കോർ: ${w.pdi_score} · ചെലവ്: ₹${w.spend_lakhs}L`
          : `Population: ${w.population.toLocaleString()} · PDI Score: ${w.pdi_score} · Spend: ₹${w.spend_lakhs}L`,
        href: targetLink,
        badge: `PDI ${w.pdi_score}`,
        isPresidentOnly: false,
      });
    }
  });

  // 2. Public Facilities (Both roles)
  const keywordTypes: Record<string, string[]> = {
    phc: ['phc', 'fhc'],
    hospital: ['phc', 'fhc', 'vet'],
    health: ['phc', 'fhc'],
    school: ['school'],
  };
  const keywordMatchedTypes = Object.entries(keywordTypes)
    .filter(([k]) => clean.includes(k))
    .flatMap(([, types]) => types);

  facilitiesData.forEach((f) => {
    if (
      f.name_en.toLowerCase().includes(clean) ||
      f.name_ml.toLowerCase().includes(clean) ||
      f.type.toLowerCase().includes(clean) ||
      keywordMatchedTypes.includes(f.type)
    ) {
      results.push({
        id: `fac_${f.id}`,
        title: isMl ? f.name_ml || f.name_en : f.name_en,
        category: 'facility',
        categoryLabel: catLabels.facility,
        description: isMl
          ? `തരം: ${f.type.toUpperCase()} · ജീവനക്കാർ: ${f.staff_filled}/${f.staff_sanctioned} · ഫോൺ: ${f.contact_phone}`
          : `Type: ${f.type.toUpperCase()} · Staffing: ${f.staff_filled}/${f.staff_sanctioned} · Phone: ${f.contact_phone}`,
        href: `/citizen/facilities`,
        badge: f.type.toUpperCase(),
        isPresidentOnly: false,
      });
    }
  });

  // 3. Cadastral Land Parcels (Both roles, different routing)
  landParcelsData.forEach((p) => {
    if (
      p.survey_number.toLowerCase().includes(clean) ||
      p.classification.toLowerCase().includes(clean) ||
      `survey ${p.survey_number}`.toLowerCase().includes(clean) ||
      `സർവേ ${p.survey_number}`.toLowerCase().includes(clean)
    ) {
      results.push({
        id: `parcel_${p.survey_number}`,
        title: isMl
          ? `സർവേ നമ്പർ ${p.survey_number}`
          : `Survey Parcel ${p.survey_number}`,
        category: 'parcel',
        categoryLabel: catLabels.parcel,
        description: isMl
          ? `വർഗ്ഗീകരണം: ${p.classification.toUpperCase()} · വിസ്തീർണ്ണം: ${p.area_cents} സെന്റ് · വാർഡ് ${p.ward_id}`
          : `Classification: ${p.classification.toUpperCase()} · Area: ${p.area_cents} Cents · Ward ${p.ward_id} (${p.hazard_zone})`,
        href: role === 'president' ? `/president/siting` : `/citizen/plot?survey=${p.survey_number}`,
        badge: p.classification.toUpperCase(),
        isPresidentOnly: false,
      });
    }
  });

  // 4. Citizen Public Services (Both roles)
  const citizenServices: SearchResultItem[] = [
    {
      id: 'srv_build_check',
      title: isMl
        ? 'സ്വയംപ്രേരിത നിർമ്മാണ അനുമതി പരിശോധന'
        : 'Automated Building Suitability Check',
      category: 'service',
      categoryLabel: catLabels.service,
      description: isMl
        ? 'നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമവും കെട്ടിട നിർമ്മാണ ചട്ടങ്ങളും പ്രകാരമുള്ള പരിശോധന.'
        : 'Check building permissions under Kerala Conservation of Paddy Land Act & KMBR setback rules.',
      href: '/citizen/build-check',
      badge: isMl ? 'ആസൂത്രണ ഉപകരണം' : 'Planning Tool',
    },
    {
      id: 'srv_my_plot',
      title: isMl
        ? 'എന്റെ ഭൂമി കഡാസ്ട്രൽ ഭൂപടം (Ente Bhoomi & ReLIS)'
        : 'Cadastral Plot Explorer (Ente Bhoomi & ReLIS)',
      category: 'service',
      categoryLabel: catLabels.service,
      description: isMl
        ? 'സർവേ അതിർത്തികൾ, അവകാശങ്ങൾ, ദുരന്ത സാധ്യതാ വിവരങ്ങൾ എന്നിവ കാണുക.'
        : 'Inspect property boundaries, survey rights, and hazard constraints.',
      href: '/citizen/plot',
      badge: isMl ? 'കഡാസ്ട്രൽ' : 'Cadastral',
    },
    {
      id: 'srv_grievance',
      title: isMl
        ? 'പരാതി അറിയിക്കുക / പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്യുക'
        : 'Geotag Citizen Issue / Report a Problem',
      category: 'service',
      categoryLabel: catLabels.service,
      description: isMl
        ? 'ഫോട്ടോ സഹിതം മാപ്പിൽ രേഖപ്പെടുത്തി തദ്ദേശ സ്ഥാപനത്തിന് പരാതി അയക്കുക.'
        : 'Submit geo-located civic problem with photograph directly to Grama Panchayat.',
      href: '/citizen/grievance',
      badge: isMl ? 'പൗര സഹായം' : 'Public Helpdesk',
    },
    {
      id: 'srv_shelter',
      title: isMl
        ? 'അടിയന്തര ദുരിതാശ്വാസ ക്യാമ്പുകളും ഒഴിപ്പിക്കൽ പാതകളും'
        : 'Emergency Flood Relief Shelters & Routes',
      category: 'evacuation',
      categoryLabel: catLabels.evacuation,
      description: isMl
        ? 'ഏറ്റവും അടുത്തുള്ള KSDMA ദുരിതാശ്വാസ ക്യാമ്പും സുരക്ഷിത പാതയും കണ്ടെത്തുക.'
        : 'Find nearest designated KSDMA emergency shelter and high-ground evacuation path.',
      href: '/citizen/hazard',
      badge: isMl ? 'ദുരന്ത സുരക്ഷ' : 'Disaster Safety',
    },
  ];

  citizenServices.forEach((srv) => {
    if (
      srv.title.toLowerCase().includes(clean) ||
      srv.description.toLowerCase().includes(clean)
    ) {
      results.push(srv);
    }
  });

  // 5. Infrastructure Assets (President & Shared view)
  assetsData.forEach((a) => {
    if (
      a.name_en.toLowerCase().includes(clean) ||
      a.name_ml.toLowerCase().includes(clean) ||
      a.type.toLowerCase().includes(clean) ||
      `asset ${a.id}`.includes(clean)
    ) {
      results.push({
        id: `asset_${a.id}`,
        title: isMl ? a.name_ml || a.name_en : a.name_en,
        category: 'asset',
        categoryLabel: catLabels.asset,
        description: isMl
          ? `അവസ്ഥ: ${a.condition.toUpperCase()} · വാർഡ് ${a.ward_id} · പരിശോധിച്ചത്: ${a.last_maintained}`
          : `Condition: ${a.condition.toUpperCase()} · Ward ${a.ward_id} · Maintained: ${a.last_maintained}`,
        href: role === 'president' ? `/president/assets` : `/shared/assets`,
        badge: a.condition.toUpperCase(),
        isPresidentOnly: false,
      });
    }
  });

  // 6. GPDP Projects (President & Citizen view)
  gpdpProjectsData.forEach((p) => {
    if (
      p.title_en?.toLowerCase().includes(clean) ||
      p.title_ml?.toLowerCase().includes(clean) ||
      p.category?.toLowerCase().includes(clean) ||
      `project ${p.id}`.includes(clean)
    ) {
      results.push({
        id: `proj_${p.id}`,
        title: isMl ? p.title_ml || p.title_en : p.title_en,
        category: 'project',
        categoryLabel: catLabels.project,
        description: isMl
          ? `വിഭാഗം: ${p.category.toUpperCase()} · ബജറ്റ്: ₹${p.budget_lakhs}L · അവസ്ഥ: ${p.status.toUpperCase()} (വാർഡ് ${p.ward_id})`
          : `Category: ${p.category.toUpperCase()} · Budget: ₹${p.budget_lakhs}L · Status: ${p.status.toUpperCase()} (Ward ${p.ward_id})`,
        href: role === 'president' ? `/president/promises` : `/citizen/ward`,
        badge: p.status.toUpperCase(),
        isPresidentOnly: false,
      });
    }
  });

  // 7. PRESIDENT-ONLY SEARCH ITEMS (Strictly filtered out for Citizens)
  if (role === 'president') {
    // Budget Simulations & Fiscal Scenarios
    const budgetMatches: SearchResultItem[] = [
      {
        id: 'budget_shift',
        title: isMl
          ? 'ബജറ്റ് പുനർവിന്യാസ സിമുലേഷൻ സാൻഡ്‌ബോക്സ്'
          : 'Fiscal Equity Budget Simulation Sandbox',
        category: 'budget',
        categoryLabel: catLabels.budget,
        description: isMl
          ? 'പി.ഡി.ഐ വർദ്ധിപ്പിക്കുന്നതിനായി വാർഡുകൾക്കിടയിൽ ഫണ്ട് പുനർവിഭജനം ചെയ്യുക.'
          : 'Simulate reallocating developmental funds between wards to optimize Panchayat PDI.',
        href: '/president/budget',
        badge: isMl ? 'ധനകാര്യം' : 'Fiscal Admin',
        isPresidentOnly: true,
      },
      {
        id: 'equity_matrix',
        title: isMl
          ? 'വാർഡ് വികസന സമത്വ 4-ക്വാഡ്രന്റ് മുൻഗണനാ മാട്രിക്സ്'
          : 'Ward Equity 4-Quadrant Priority Matrix',
        category: 'budget',
        categoryLabel: catLabels.budget,
        description: isMl
          ? 'പി.ഡി.ഐയും ആളോഹരി ചെലവും താരതമ്യം ചെയ്ത് കൂടുതൽ ഇടപെടൽ ആവശ്യമുള്ള വാർഡുകൾ കണ്ടെത്തുക.'
          : 'PDI vs per-capita expenditure correlation identifying high-need intervention wards.',
        href: '/president/equity',
        badge: isMl ? 'അനലിറ്റിക്സ്' : 'Analytics',
        isPresidentOnly: true,
      },
    ];

    budgetMatches.forEach((b) => {
      if (b.title.toLowerCase().includes(clean) || b.description.toLowerCase().includes(clean)) {
        results.push(b);
      }
    });

    // Grievance tracking with privacy preservation (anonymized in search)
    grievancesData.forEach((g) => {
      if (
        g.description_en.toLowerCase().includes(clean) ||
        g.description_ml.toLowerCase().includes(clean) ||
        g.category.toLowerCase().includes(clean) ||
        g.id.toLowerCase().includes(clean)
      ) {
        results.push({
          id: `grievance_${g.id}`,
          title: isMl
            ? `പരാതി ${g.id} (${g.category.toUpperCase()})`
            : `Grievance ${g.id} (${g.category.toUpperCase()})`,
          category: 'grievance',
          categoryLabel: catLabels.grievance,
          description: isMl
            ? `വാർഡ് ${g.ward_id} · വിഭാഗം: ${g.assigned_dept} · അവസ്ഥ: ${g.status.toUpperCase()}`
            : `Filed in Ward ${g.ward_id} · Assigned to ${g.assigned_dept} · Status: ${g.status.toUpperCase()}`,
          href: `/president/grievances`,
          badge: g.status.toUpperCase(),
          isPresidentOnly: true,
        });
      }
    });
  }

  // Filter out any President-only items if citizen
  const filtered = role === 'president' ? results : results.filter((r) => !r.isPresidentOnly);

  // Score & sort: Title prefix > Title match > Category match
  return filtered
    .map((item) => {
      let score = 0;
      const lowerTitle = item.title.toLowerCase();
      if (lowerTitle === clean) score += 100;
      else if (lowerTitle.startsWith(clean)) score += 60;
      else if (lowerTitle.includes(clean)) score += 40;
      if (item.category.toLowerCase().includes(clean)) score += 20;
      return { ...item, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 15);
}
