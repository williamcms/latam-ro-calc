import { describe, expect, it } from 'vitest';
import { isSkillCanEDP } from './is-skill-can-edp';

describe('isSkillCanEDP', () => {
  it('returns false for skills explicitly excluded from EDP', () => {
    expect(isSkillCanEDP('Meteor Assault')).toBe(false);
  });

  it('returns true for any other skill', () => {
    expect(isSkillCanEDP('Sonic Blow')).toBe(true);
    expect(isSkillCanEDP('Cross Impact')).toBe(true);
    expect(isSkillCanEDP('')).toBe(true);
  });
});
