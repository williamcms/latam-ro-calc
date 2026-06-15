import { beforeEach, describe, expect, it } from 'vitest';
import { calcSkillAspd } from './calc-skill-aspd';

// Build a fully-zeroed equipment summary; the function reads acd/vct/fct/etc as
// numbers, so every field a calculation touches must exist to avoid NaN.
const zeroEquip = () =>
  ({
    acd: 0,
    vct: 0,
    vct_inc: 0,
    fct: 0,
    fctPercent: 0,
    vctBySkill: 0,
    releasedSkill: 0,
  } as any);

const zeroStatus = () => ({ totalDex: 0, totalInt: 0 } as any);

const skill = (over: Record<string, any> = {}) =>
  ({ name: 'TestSkill', acd: 1, fct: 0, vct: 0, cd: 0, hitEveryNSec: 0, ...over } as any);

describe('calcSkillAspd', () => {
  let equip: any;
  let status: any;

  beforeEach(() => {
    equip = zeroEquip();
    status = zeroStatus();
  });

  it('with no reductions, after-cast delay drives the hit period', () => {
    const r = calcSkillAspd({ skillData: skill({ acd: 1 }), totalEquipStatus: equip, status, skillLevel: 5 });
    expect(r.reducedAcd).toBe(1);
    expect(r.reducedVct).toBe(0);
    expect(r.reducedFct).toBe(0);
    expect(r.hitPeriod).toBe(1);
    expect(r.totalHitPerSec).toBe(1);
  });

  it('global ACD reduction shortens the after-cast delay', () => {
    equip.acd = 50; // 50% acd reduction
    const r = calcSkillAspd({ skillData: skill({ acd: 1 }), totalEquipStatus: equip, status, skillLevel: 5 });
    expect(r.reducedAcd).toBe(0.5);
    expect(r.hitPeriod).toBe(0.5);
    expect(r.totalHitPerSec).toBe(2);
  });

  it('releasedSkill zeroes cast, cooldown and fixed-cast times', () => {
    const r = calcSkillAspd({
      skillData: skill({ acd: 1, cd: 5, fct: 2, vct: 3 }),
      totalEquipStatus: { ...equip, releasedSkill: 1 },
      status,
      skillLevel: 5,
    });
    expect(r.reducedCd).toBe(0);
    expect(r.reducedVct).toBe(0);
    expect(r.reducedFct).toBe(0);
  });

  it('resolves function-valued timings against the skill level', () => {
    const r = calcSkillAspd({
      skillData: skill({ acd: (lv: number) => lv * 0.4 }),
      totalEquipStatus: equip,
      status,
      skillLevel: 5,
    });
    // acd(5) = 2.0, no reduction -> reducedAcd 2
    expect(r.acd).toBe(2);
    expect(r.reducedAcd).toBe(2);
  });

  it('hitEveryNSec skills use the channel interval as the cast period', () => {
    const r = calcSkillAspd({
      skillData: skill({ acd: 1, hitEveryNSec: 0.5 }),
      totalEquipStatus: equip,
      status,
      skillLevel: 5,
    });
    // block period is forced to 0 for channelled skills; cast period == interval
    expect(r.castPeriod).toBe(0.5);
    expect(r.hitPeriod).toBe(0.5);
    expect(r.totalHitPerSec).toBe(2);
  });

  it('per-skill cooldown reduction lowers the reported cooldown', () => {
    const r = calcSkillAspd({
      skillData: skill({ acd: 0, cd: 5 }),
      totalEquipStatus: { ...equip, cd__TestSkill: 2 },
      status,
      skillLevel: 5,
    });
    expect(r.reducedCd).toBe(3);
  });
});
