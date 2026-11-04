import { describe, expect, it } from 'vitest';
import { searchPublicKnowledge } from '../lib/public-search';

describe('Public landing page search', () => {
  it('returns public citizen feature guidance', () => {
    const results = searchPublicKnowledge('How can I submit a grievance?');

    expect(results.length).toBeGreaterThan(0);
    const grievanceResult = results.find((result) => result.href === '/citizen/grievance');
    expect(grievanceResult).toBeDefined();
    expect(grievanceResult?.restricted).toBe(false);
  });

  it('does not expose restricted MLA features in public results', () => {
    const results = searchPublicKnowledge('What can an MLA do?');
    expect(results.some((result) => result.href.startsWith('/president'))).toBe(false);
  });

  it('does not search for empty or whitespace-only queries', () => {
    expect(searchPublicKnowledge('')).toEqual([]);
    expect(searchPublicKnowledge('   ')).toEqual([]);
  });

  it('returns no results for unsupported queries', () => {
    expect(searchPublicKnowledge('xyz123unknown')).toEqual([]);
  });

  it('returns only the facility feature for a facility query', () => {
    const results = searchPublicKnowledge('Find hospitals and schools');

    expect(results).toHaveLength(1);
    expect(results[0]?.href).toBe('/citizen/facilities');
  });
});
