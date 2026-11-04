import publicVectors from '../data/ai/public-vectors.json';
import type { Language } from '@/lib/types';

interface PublicVectorRecord {
  id: string;
  page_name: string;
  feature_name: string;
  description: string;
  detailed_explanation: string;
  navigation_route: string;
  access_classification: string;
  locale: string;
  tags: string[];
  source_identity?: {
    source_name?: string;
  };
}

export interface PublicSearchResult {
  id: string;
  title: string;
  description: string;
  details: string;
  href: string;
  source?: string;
  restricted: boolean;
  score: number;
}

const records = publicVectors as PublicVectorRecord[];

const synonyms: Record<string, string[]> = {
  citizen: ['citizen', 'public', 'service', 'services'],
  grievance: ['grievance', 'complaint', 'report', 'issue'],
  property: ['property', 'plot', 'land', 'cadastral', 'survey'],
  facility: ['facility', 'facilities', 'hospital', 'school', 'services'],
  hospitals: ['hospital'],
  schools: ['school'],
  project: ['project', 'projects', 'works', 'development'],
  mla: ['mla', 'president', 'governance', 'executive'],
  hazard: ['hazard', 'disaster', 'flood', 'evacuation', 'safety'],
};

const stopWords = new Set([
  'a', 'an', 'and', 'can', 'do', 'does', 'for', 'find', 'how', 'i', 'in',
  'is', 'me', 'my', 'of', 'the', 'to', 'what', 'where', 'which', 'with',
]);

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize('NFKC');
}

function tokens(value: string) {
  return normalize(value)
    .split(/[\s,.;:!?()[\]{}"'\/\\|+=*&^%$#@<>~-]+/)
    .filter((token) => token.length > 1);
}

function expandedTokens(query: string) {
  const queryTokens = tokens(query).filter((token) => !stopWords.has(token));
  return new Set([
    ...queryTokens,
    ...queryTokens.flatMap((token) => synonyms[token] ?? []),
  ]);
}

export function searchPublicKnowledge(
  query: string,
  language: Language = 'en',
  limit = 6
): PublicSearchResult[] {
  const cleanQuery = normalize(query.trim());
  if (cleanQuery.length < 2) return [];

  const queryTokens = expandedTokens(cleanQuery);
  const isFacilityQuery = queryTokens.has('hospital') || queryTokens.has('hospitals') || queryTokens.has('school') || queryTokens.has('schools');
  const preferred = records.filter((record) => record.locale === language);
  const fallback = records.filter((record) => record.locale === 'en');
  const searchableRecords = preferred.length > 0 ? preferred : fallback;

  const rankedResults = searchableRecords
    .filter((record) => record.access_classification === 'public' && !record.navigation_route.startsWith('/president'))
    .filter((record) => {
      if (!isFacilityQuery) return true;
      const facilityText = normalize(`${record.feature_name} ${record.description}`);
      return /facility|health|hospital|school|medical|service/.test(facilityText);
    })
    .map((record) => {
      const titleTokens = new Set(tokens(record.feature_name));
      const descriptionTokens = new Set(tokens(record.description));
      const tagTokens = new Set(tokens(record.tags.join(' ')));
      const detailedTokens = new Set(tokens(record.detailed_explanation));
      const tagText = normalize(record.tags.join(' '));
      const phraseBonus = normalize(record.feature_name).includes(cleanQuery) ? 8 : 0;
      const queryTokenList = Array.from(queryTokens);
      const tagBonus = queryTokenList.filter((token) => tagTokens.has(token) || tagText.includes(token)).length * 5;
      const titleBonus = queryTokenList.filter((token) => titleTokens.has(token)).length * 6;
      const descriptionBonus = queryTokenList.filter((token) => descriptionTokens.has(token)).length * 2;
      const detailedBonus = queryTokenList.filter((token) => detailedTokens.has(token)).length;
      const score = phraseBonus + tagBonus + titleBonus + descriptionBonus + detailedBonus;

      return {
        id: record.id,
        title: record.feature_name,
        description: record.description,
        details: record.detailed_explanation,
        href: record.navigation_route,
        source: record.source_identity?.source_name,
        restricted: false,
        score,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);

  const bestScore = rankedResults[0]?.score ?? 0;
  return rankedResults.filter((result) => result.score >= Math.max(3, bestScore * 0.65));
}
