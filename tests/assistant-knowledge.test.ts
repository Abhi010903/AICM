import { describe, expect, it } from 'vitest';
import { buildAssistantContext, isPersonalQuery } from '../lib/assistant-knowledge';
import { getMlaAssistantContext } from '../lib/mla-assistant-knowledge';
import mlaKnowledgeBase from '../data/mla-knowledge-base.json';

describe('AICM assistant knowledge scope', () => {
  it('recognises personal questions that require citizen scope', () => {
    expect(isPersonalQuery('What are my plot permissions?')).toBe(true);
    expect(isPersonalQuery('What is this portal for?')).toBe(false);
  });

  it('includes only the authenticated demo citizen records', () => {
    const anitaContext = buildAssistantContext({
      role: 'citizen',
      phone: '9847654321',
      profileWardId: 7,
    }, 'my plot permissions');
    const rajeshContext = buildAssistantContext({
      role: 'citizen',
      phone: '9876543210',
      profileWardId: 3,
    }, 'my grievance status');

    expect(anitaContext).toContain('"name":"Anita Nair"');
    expect(anitaContext).not.toContain('"name":"Rajesh Kumar"');
    expect(rajeshContext).toContain('"name":"Rajesh Kumar"');
    expect(rajeshContext).not.toContain('"name":"Anita Nair"');
  });

  it('does not include citizen records for public visitors', () => {
    const context = buildAssistantContext(null);

    expect(context).toContain('"publicKnowledge"');
    expect(context).not.toContain('"authenticatedCitizen"');
    expect(context).not.toContain('"name":"Anita Nair"');
  });

  it('keeps the grounded context below the free-tier request budget', () => {
    const publicContext = buildAssistantContext(null, 'road development progress in Ward 7');
    const citizenContext = buildAssistantContext(
      { role: 'citizen', phone: '9847654321', profileWardId: 7 },
      'my plot permissions'
    );

    expect(publicContext.length).toBeLessThan(28000);
    expect(citizenContext.length).toBeLessThan(28000);
  });

  it('uses the canonical MLA dataset for operational summaries', () => {
    const context = getMlaAssistantContext('open grievances');

    expect(context.dataset_summary.grievances).toEqual({
      total: 58,
      open: 20,
      in_progress: 14,
      resolved: 24,
    });
    expect(context.dataset_summary.projects).toEqual({
      total: 47,
      completed: 24,
      ongoing: 9,
      delayed: 14,
    });
  });

  it('keeps every authorized MLA data domain in one physical knowledge base', () => {
    expect(Object.keys(mlaKnowledgeBase)).toEqual(expect.arrayContaining([
      'panchayat',
      'wards',
      'projects',
      'grievances',
      'assets',
      'facilities',
      'land_parcels',
      'pdi_themes',
      'hazard_zones',
      'evacuation_routes',
    ]));
    expect(mlaKnowledgeBase.wards).toHaveLength(14);
    expect(mlaKnowledgeBase.projects).toHaveLength(47);
    expect(mlaKnowledgeBase.grievances).toHaveLength(58);
  });
});
