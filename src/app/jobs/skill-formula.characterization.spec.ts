import { describe, expect, it } from 'vitest';
import { AtkSkillModel } from './_character-base.abstract';
import { Minstrel } from './Minstrel';
import { Oboro } from './Oboro';
import { Ranger } from './Ranger';

/**
 * Characterization tests that lock current skill-damage output BEFORE the
 * skill-id / standalone-const refactor. The numbers asserted here must not
 * change when `this.isSkillActive('Fear Breeze')` becomes
 * `skills.isActive(FEAR_BREEZE)` and skills move out of the job classes.
 *
 * They also pin the `isSkillActive` cross-skill lookup, which currently reads
 * `this.bonuses.activeSkillNames` (a name-keyed Set) and will become id-keyed.
 */
const stubBonuses = (activeSkillNames: string[] = []) =>
  ({
    activeSkillNames: new Set(activeSkillNames),
    equipAtks: {},
    masteryAtks: {},
    learnedSkillMap: new Map<string, number>(),
    usedSkillMap: new Map<string, number>(),
  } as any);

const findSkill = (char: { atkSkills: AtkSkillModel[] }, name: string) => {
  const skill = char.atkSkills.find((s) => s.name === name);
  if (!skill) throw new Error(`atk skill not found: ${name}`);
  return skill;
};

const dmgOf = (char: any, name: string, input: { level: number; skillLevel: number }) =>
  findSkill(char, name).formula({
    model: { level: input.level },
    skillLevel: input.skillLevel,
    skills: char.skillState, // standalone-const formulas read cross-skill state from here
  } as any);

describe('Ranger atk-skill formulas (characterization)', () => {
  describe('Arrow Storm — branches on Fear Breeze', () => {
    // (200 + (180 + 0) * 10) * (200 / 100) = 4000
    it('Lv10 @ base 200, no Fear Breeze', () => {
      const ranger = new Ranger();
      (ranger as any).bonuses = stubBonuses();
      expect(dmgOf(ranger, 'Arrow Storm', { level: 200, skillLevel: 10 })).toBe(4000);
    });

    // (200 + (180 + 70) * 10) * (200 / 100) = 5400
    it('Lv10 @ base 200, Fear Breeze active (+70 per level)', () => {
      const ranger = new Ranger();
      (ranger as any).bonuses = stubBonuses(['Fear Breeze']);
      expect(dmgOf(ranger, 'Arrow Storm', { level: 200, skillLevel: 10 })).toBe(5400);
    });
  });

  describe('Aimed Bolt — branches on Fear Breeze', () => {
    // with Fear Breeze: (800 + 10 * 35) * (200 / 100) = 2300
    it('Lv10 @ base 200, Fear Breeze active', () => {
      const ranger = new Ranger();
      (ranger as any).bonuses = stubBonuses(['Fear Breeze']);
      expect(dmgOf(ranger, 'Aimed Bolt', { level: 200, skillLevel: 10 })).toBe(2300);
    });
  });
});

describe('Minstrel atk-skill formulas (shared Maestro/Wanderer consts)', () => {
  // Exercises the standalone shared consts (ARROW_VULCAN / REVERBERATION / METALIC_SOUND)
  // through a real job instance, so the dedup is verified end-to-end.
  it('Arrow Vulcan Lv10 @ base 200: (500 + 10*100) * 2 = 3000', () => {
    const minstrel = new Minstrel();
    (minstrel as any).bonuses = stubBonuses();
    expect(dmgOf(minstrel, 'Arrow Vulcan', { level: 200, skillLevel: 10 })).toBe(3000);
  });

  it('Reverberation Lv5 @ base 200: (700 + 5*300) * 2 = 4400', () => {
    const minstrel = new Minstrel();
    (minstrel as any).bonuses = stubBonuses();
    expect(dmgOf(minstrel, 'Reverberation', { level: 200, skillLevel: 5 })).toBe(4400);
  });

  it('Metalic Sound reads Lesson level via the skills context', () => {
    const minstrel = new Minstrel();
    (minstrel as any).bonuses = stubBonuses();
    (minstrel as any).bonuses.learnedSkillMap.set('Lesson', 10);
    // (skillLevel*120 + lessonLv*60) * (level/100) = (10*120 + 10*60) * 2 = 3600
    expect(dmgOf(minstrel, 'Metalic Sound', { level: 200, skillLevel: 10 })).toBe(3600);
  });
});

describe('Oboro/Kagerou shared Cross Slash (branches on Cross Wound)', () => {
  it('Lv10 @ base 200, no Cross Wound: 10*200*2 = 4000', () => {
    const oboro = new Oboro();
    (oboro as any).bonuses = stubBonuses();
    expect(dmgOf(oboro, 'Cross Slash', { level: 200, skillLevel: 10 })).toBe(4000);
  });

  it('Lv10 @ base 200, Cross Wound active: 4000 + 200*10 = 6000', () => {
    const oboro = new Oboro();
    (oboro as any).bonuses = stubBonuses(['Cross Wound']);
    expect(dmgOf(oboro, 'Cross Slash', { level: 200, skillLevel: 10 })).toBe(6000);
  });
});
