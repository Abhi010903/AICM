import publicVectors from '../data/ai/public-vectors.json';
import demoUsers from '../data/demo-users.json';
import mlaKnowledgeBase from '../data/mla-knowledge-base.json';

const { facilities, grievances: grievancesLive, land_parcels: landParcels, projects, wards } = mlaKnowledgeBase;

interface AssistantSession {
  role?: string | null;
  phone?: string | null;
  profileWardId?: number | null;
}

function compact<T>(value: T): string {
  return JSON.stringify(value);
}

function queryTokens(query: string) {
  return query.toLocaleLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function isRelevant(query: string, values: unknown) {
  const text = JSON.stringify(values).toLocaleLowerCase();
  return queryTokens(query).some((token) => text.includes(token));
}

export function buildAssistantContext(session?: AssistantSession | null, query = ''): string {
  const publicKnowledge = publicVectors
    .filter((record) => record.access_classification === 'public' && record.locale === 'en' && !record.navigation_route.startsWith('/president'))
    .map((record) => ({
      feature: record.feature_name,
      description: record.description,
      route: record.navigation_route,
      tags: record.tags,
    }))
    .filter((record) => !query || isRelevant(query, record))
    .slice(0, 8);

  const publicData = {
    wards: wards.map((ward) => ({
      id: ward.id,
      number: ward.number,
      name_en: ward.name_en,
      population: ward.population,
      pdi_score: ward.pdi_score,
    })),
    facilities: facilities
      .filter((facility) => !query || isRelevant(query, facility))
      .slice(0, 8)
      .map((facility) => ({
        name_en: facility.name_en,
        type: facility.type,
        ward_id: facility.ward_id,
      })),
    developmentProjects: projects
      .filter((project) => !query || isRelevant(query, project))
      .slice(0, 8)
      .map((project) => ({
        title_en: project.title_en,
        category: project.category,
        status: project.status,
        ward_id: project.ward_id,
        budget_lakhs: project.budget_lakhs,
        spent_lakhs: project.spent_lakhs,
      })),
  };

  const isCitizen = session?.role === 'citizen' && Boolean(session.phone);
  if (!isCitizen) {
    return compact({ publicKnowledge, publicData });
  }

  const user = demoUsers.find((candidate) => candidate.mobile === session.phone);
  const wardId = user?.ward_id ?? session.profileWardId;
  const ownGrievances = grievancesLive.filter(
    (grievance) => 'reporter_phone' in grievance && grievance.reporter_phone === session?.phone
  );

  return compact({
    publicKnowledge,
    publicData,
    authenticatedCitizen: {
      name: user?.name,
      wardId,
      block: user?.block,
      ownGrievances,
      wardProjects: projects.filter((project) => project.ward_id === wardId).map((project) => ({
        title_en: project.title_en,
        category: project.category,
        status: project.status,
        budget_lakhs: project.budget_lakhs,
        spent_lakhs: project.spent_lakhs,
      })),
      wardFacilities: facilities.filter((facility) => facility.ward_id === wardId).map((facility) => ({
        name_en: facility.name_en,
        type: facility.type,
      })),
      wardParcels: landParcels.filter((parcel) => parcel.ward_id === wardId).map((parcel) => ({
        survey_number: parcel.survey_number,
        classification: parcel.classification,
        area_cents: parcel.area_cents,
        hazard_zone: parcel.hazard_zone,
        permitted_activities_en: parcel.permitted_activities_en,
        restricted_activities_en: parcel.restricted_activities_en,
      })),
    },
  });
}

export function isPersonalQuery(query: string): boolean {
  return /\b(my|mine|me|myself|personal|own|permission|permissions|property|plot|grievance|complaint|application|status)\b/i.test(query);
}
