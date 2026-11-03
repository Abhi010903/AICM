/**
 * Role-Aware Omnichannel Search Engine
 *
 * Implements genuine debounced, ranked, categorized search across all Digital Twin datasets.
 * Strictly enforces role-based filtering so Citizens cannot discover administrative,
 * budget-simulation, or private records through search queries.
 */

import { UserRole } from './types';
import wardsData from '../data/wards.json';
import assetsData from '../data/assets.json';
import facilitiesData from '../data/facilities.json';
import gpdpProjectsData from '../data/gpdp_projects.json';
import landParcelsData from '../data/land_parcels.json';
import grievancesData from '../data/grievances.json';

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

// Category display labels
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

/**
 * Searches system records with role-aware security filtering
 */
export function searchSystem(query: string, role: UserRole): SearchResultItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  const results: SearchResultItem[] = [];

  // 1. Wards (Both roles, different target links)
  wardsData.forEach((w) => {
    const targetLink = role === 'president' ? `/president/wards` : `/shared/ward/${w.id}`;
    if (
      w.name_en.toLowerCase().includes(clean) ||
      w.name_ml.toLowerCase().includes(clean) ||
      `ward ${w.number}`.includes(clean) ||
      `ward ${w.id}`.includes(clean)
    ) {
      results.push({
        id: `ward_${w.id}`,
        title: `Ward ${w.number}: ${w.name_en} (${w.name_ml})`,
        category: 'ward',
        categoryLabel: CATEGORY_LABELS.ward,
        description: `Population: ${w.population.toLocaleString()} · PDI Score: ${w.pdi_score} · Spend: ₹${w.spend_lakhs}L`,
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
        title: f.name_en,
        category: 'facility',
        categoryLabel: CATEGORY_LABELS.facility,
        description: `Type: ${f.type.toUpperCase()} · Staffing: ${f.staff_filled}/${f.staff_sanctioned} · Phone: ${f.contact_phone}`,
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
      `survey ${p.survey_number}`.toLowerCase().includes(clean)
    ) {
      results.push({
        id: `parcel_${p.survey_number}`,
        title: `Survey Parcel ${p.survey_number}`,
        category: 'parcel',
        categoryLabel: CATEGORY_LABELS.parcel,
        description: `Classification: ${p.classification.toUpperCase()} · Area: ${p.area_cents} Cents · Ward ${p.ward_id} (${p.hazard_zone})`,
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
      title: 'Automated Building Suitability Check',
      category: 'service',
      categoryLabel: CATEGORY_LABELS.service,
      description: 'Check building permissions under Kerala Conservation of Paddy Land Act & KMBR setback rules.',
      href: '/citizen/build-check',
      badge: 'Planning Tool',
    },
    {
      id: 'srv_my_plot',
      title: 'Cadastral Plot Explorer (Ente Bhoomi & ReLIS)',
      category: 'service',
      categoryLabel: CATEGORY_LABELS.service,
      description: 'Inspect property boundaries, survey rights, and hazard constraints.',
      href: '/citizen/plot',
      badge: 'Cadastral',
    },
    {
      id: 'srv_grievance',
      title: 'Geotag Citizen Issue / Report a Problem',
      category: 'service',
      categoryLabel: CATEGORY_LABELS.service,
      description: 'Submit geo-located civic problem with photograph directly to Grama Panchayat.',
      href: '/citizen/grievance',
      badge: 'Public Helpdesk',
    },
    {
      id: 'srv_shelter',
      title: 'Emergency Flood Relief Shelters & Routes',
      category: 'evacuation',
      categoryLabel: CATEGORY_LABELS.evacuation,
      description: 'Find nearest designated KSDMA emergency shelter and high-ground evacuation path.',
      href: '/citizen/hazard',
      badge: 'Disaster Safety',
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
        title: a.name_en,
        category: 'asset',
        categoryLabel: CATEGORY_LABELS.asset,
        description: `Condition: ${a.condition.toUpperCase()} · Ward ${a.ward_id} · Maintained: ${a.last_maintained}`,
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
        title: p.title_en,
        category: 'project',
        categoryLabel: CATEGORY_LABELS.project,
        description: `Category: ${p.category.toUpperCase()} · Budget: ₹${p.budget_lakhs}L · Status: ${p.status.toUpperCase()} (Ward ${p.ward_id})`,
        href: role === 'president' ? `/president/promises` : `/citizen/ward`,
        badge: p.status.toUpperCase(),
        isPresidentOnly: false,
      });
    }
  });

  // 7. PRESIDENT-ONLY SEARCH ITEMS (Strictly filtered out for Citizens)
  if (role === 'president') {
    // Budget Simulations & Fiscal Scenarios
    const budgetMatches = [
      {
        id: 'budget_shift',
        title: 'Fiscal Equity Budget Simulation Sandbox',
        category: 'budget' as SearchCategory,
        categoryLabel: CATEGORY_LABELS.budget,
        description: 'Simulate reallocating developmental funds between wards to optimize Panchayat PDI.',
        href: '/president/budget',
        badge: 'Fiscal Admin',
        isPresidentOnly: true,
      },
      {
        id: 'equity_matrix',
        title: 'Ward Equity 4-Quadrant Priority Matrix',
        category: 'budget' as SearchCategory,
        categoryLabel: CATEGORY_LABELS.budget,
        description: 'PDI vs per-capita expenditure correlation identifying high-need intervention wards.',
        href: '/president/equity',
        badge: 'Analytics',
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
        g.category.toLowerCase().includes(clean) ||
        g.id.toLowerCase().includes(clean)
      ) {
        results.push({
          id: `grievance_${g.id}`,
          title: `Grievance ${g.id} (${g.category.toUpperCase()})`,
          category: 'grievance',
          categoryLabel: CATEGORY_LABELS.grievance,
          description: `Filed in Ward ${g.ward_id} · Assigned to ${g.assigned_dept} · Status: ${g.status.toUpperCase()}`,
          href: `/president/assets`,
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
