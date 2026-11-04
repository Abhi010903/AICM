import mlaKnowledgeBase from '../data/mla-knowledge-base.json';

const { projects, assets, facilities, land_parcels: landParcels, wards, panchayat, grievances: liveGrievances } = mlaKnowledgeBase;

function tokens(query: string) {
  return query.toLocaleLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function matches(query: string, value: unknown) {
  const text = JSON.stringify(value).toLocaleLowerCase();
  return tokens(query).some((token) => text.includes(token));
}

export interface MlaAssistantAction {
  label: string;
  href: string;
}

export function getMlaAssistantContext(query: string) {
  const wardMatch = query.match(/\b(?:ward|w)\s*(\d{1,2})\b/i);
  const wardId = wardMatch ? Number(wardMatch[1]) : undefined;
  const allGrievances = liveGrievances;
  const grievanceSummary = {
    total: allGrievances.length,
    open: allGrievances.filter((grievance) => grievance.status === 'open').length,
    in_progress: allGrievances.filter((grievance) => grievance.status === 'in_progress').length,
    resolved: allGrievances.filter((grievance) => grievance.status === 'resolved').length,
  };
  const projectSummary = {
    total: projects.length,
    completed: projects.filter((project) => project.status === 'completed').length,
    ongoing: projects.filter((project) => project.status === 'ongoing').length,
    delayed: projects.filter((project) => project.status === 'delayed').length,
  };

  return {
    constituency: {
      name: panchayat.name_en,
      district: panchayat.district_en,
      wards: panchayat.wards_count,
      pdi_score: panchayat.pdi_score,
    },
    dataset_summary: {
      projects: projectSummary,
      grievances: grievanceSummary,
    },
    wards: wards
      .filter((ward) => !wardId || ward.id === wardId || matches(query, ward))
      .slice(0, 8)
      .map((ward) => ({
        id: ward.id,
        number: ward.number,
        name: ward.name_en,
        pdi_score: ward.pdi_score,
        population: ward.population,
        spend_lakhs: ward.spend_lakhs,
      })),
    projects: projects
      .filter((project) => !wardId || project.ward_id === wardId)
      .filter((project) => !query || matches(query, project))
      .slice(0, 12)
      .map((project) => ({
        id: project.id,
        ward_id: project.ward_id,
        title: project.title_en,
        category: project.category,
        status: project.status,
        budget_lakhs: project.budget_lakhs,
        spent_lakhs: project.spent_lakhs,
        start_date: project.start_date,
        end_date: project.end_date,
        source: project.source,
      })),
    grievances: allGrievances
      .filter((grievance) => !wardId || grievance.ward_id === wardId)
      .filter((grievance) => !query || matches(query, grievance))
      .slice(0, 20)
      .map((grievance) => ({
        id: grievance.id,
        ward_id: grievance.ward_id,
        category: grievance.category,
        description: grievance.description_en,
        status: grievance.status,
        assigned_dept: grievance.assigned_dept,
        filed_date: grievance.filed_date,
        updated_at: 'updated_at' in grievance ? grievance.updated_at : undefined,
      })),
    assets: assets
      .filter((asset) => !wardId || asset.ward_id === wardId)
      .filter((asset) => !query || matches(query, asset))
      .slice(0, 12)
      .map((asset) => ({
        id: asset.id,
        ward_id: asset.ward_id,
        name: asset.name_en,
        type: asset.type,
        condition: asset.condition,
        last_maintained: asset.last_maintained,
      })),
    facilities: facilities
      .filter((facility) => !wardId || facility.ward_id === wardId)
      .filter((facility) => !query || matches(query, facility))
      .slice(0, 12)
      .map((facility) => ({
        name: facility.name_en,
        type: facility.type,
        ward_id: facility.ward_id,
        staff_filled: facility.staff_filled,
        staff_sanctioned: facility.staff_sanctioned,
      })),
    plots: landParcels
      .filter((parcel) => !wardId || parcel.ward_id === wardId)
      .filter((parcel) => !query || matches(query, parcel))
      .slice(0, 8)
      .map((parcel) => ({
        survey_number: parcel.survey_number,
        village: parcel.village_en,
        ward_id: parcel.ward_id,
        classification: parcel.classification,
        area_cents: parcel.area_cents,
        hazard_zone: parcel.hazard_zone,
        permitted_activities: parcel.permitted_activities_en,
        restricted_activities: parcel.restricted_activities_en,
      })),
  };
}

export const MLA_ASSISTANT_ACTIONS: MlaAssistantAction[] = [
  { label: 'Open Grievance Inbox', href: '/president/grievances' },
  { label: 'View Project Progress', href: '/president/promises' },
  { label: 'Open Plot Details', href: '/president/siting' },
  { label: 'View Development Report', href: '/president/wards' },
  { label: 'Open Asset Register', href: '/president/assets' },
];
