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
    // item.json keys reductions by skill id; Arrow Storm = 2233.
    const r = calcSkillAspd({
      skillData: skill({ name: 'Arrow Storm', acd: 0, cd: 5 }),
      totalEquipStatus: { ...equip, cd__2233: 2 },
      status,
      skillLevel: 5,
    });
    expect(r.reducedCd).toBe(3);
  });

  // Characterization: locks every per-skill timing reduction, each keyed by the
  // skill ID (`cd__<id>`, `vct__<id>`, ...). Arrow Storm = 2233.
  it('locks all six per-skill timing reductions keyed by skill id', () => {
    const r = calcSkillAspd({
      skillData: skill({ name: 'Arrow Storm', acd: 1, cd: 5, fct: 2, vct: 3 }),
      totalEquipStatus: {
        ...equip,
        'cd__2233': 1,
        'vct__2233': 20, // 20% variable-cast reduction
        'fix_vct__2233': 0.5, // 0.5s fixed variable-cast reduction
        'fct__2233': 0.4,
        'fctPercent__2233': 10, // 10% fixed-cast reduction
        'acd__2233': 0.2,
      },
      status,
      skillLevel: 10,
    });
    expect(r.reducedCd).toBe(4); // 5 - 1
    expect(r.reducedVct).toBe(2); // (3 - 0.5) * 0.8
    expect(r.reducedFct).toBe(1.4401); // (2 - 0.4) * 0.9, rounded up at 4dp by roundUp
    expect(r.reducedAcd).toBe(0.8); // 1 - 0.2
  });
});
