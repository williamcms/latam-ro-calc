import { describe, expect, it } from 'vitest';
import { SKILL_DESC_BY_ID, SKILL_ID_BY_NAME, SKILL_META, VALID_SKILL_IDS, resolveSkillMeta } from './index';

describe('skill catalog', () => {
  it('carries id, pt-BR label and description per skill', () => {
    const arrowStorm = SKILL_META['Arrow Storm'];
    expect(arrowStorm.id).toBe(2233);
    expect(arrowStorm.label).toBe('Tempestade de Flechas');
    expect(arrowStorm.description).toContain('Tempestade de Flechas');
  });

  it('maps internal name -> id (unambiguous direction)', () => {
    expect(SKILL_ID_BY_NAME['Holy Light']).toBe(156);
    expect(SKILL_ID_BY_NAME['Storm Gust']).toBe(89);
  });

  it('keeps distinct skills on distinct ids (Dragon Breath vs Dragonic Breath)', () => {
    // The GRF fuzzy-match wrongly mapped DK Dragonic Breath onto RK Dragon Breath
    // (2008); divine-pride id for Dragonic Breath is 6001.
    expect(SKILL_ID_BY_NAME['Dragon Breath']).toBe(2008);
    expect(SKILL_ID_BY_NAME['Dragonic Breath']).toBe(6001);
  });

  it('maps id -> description for the hover tooltip', () => {
    // the client description opens with "<pt-BR> (<English>)"
    expect(SKILL_DESC_BY_ID[2233]).toContain('(Arrow Storm)');
  });

  it('exposes the set of valid skill ids for item.json validation', () => {
    expect(VALID_SKILL_IDS.has(2233)).toBe(true);
    expect(VALID_SKILL_IDS.has(156)).toBe(true);
    expect(VALID_SKILL_IDS.has(999999)).toBe(false);
  });

  it('keeps id-less internal markers as valid skill names (English fallback)', () => {
    const internal = resolveSkillMeta('_ElementalMaster_spirit');
    expect(internal).toBeDefined();
    expect(internal!.id).toBeUndefined();
  });
});
