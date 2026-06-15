import { describe, expect, it } from 'vitest';
import { Calculator } from './calculator';
import { BuffDef, CalcChainInput, CalculatorController, collectBuffBonuses, collectConsumables } from './calculator-controller';

const items = {
  100: { script: 'a' },
  101: { script: 'b' },
  200: { script: 'c' },
  12791: { script: 'regular-pill' },
  12792: { script: 'superior-pill' },
  12424: { script: 'hp-l' },
} as Record<number, { script?: any }>;

describe('collectConsumables', () => {
  it('flattens consumables, secondary consumables and aspd potions into scripts', () => {
    const sel = collectConsumables({ consumables: [100], consumables2: [101], aspdPotions: [200] }, items);
    expect(sel.scripts).toEqual(['a', 'b', 'c']);
  });

  it('flags HP Increase Potion (L)', () => {
    expect(collectConsumables({ consumables: [12424], consumables2: [], aspdPotions: [] }, items).usedHpL).toBe(true);
    expect(collectConsumables({ consumables: [100], consumables2: [], aspdPotions: [] }, items).usedHpL).toBe(false);
  });

  it('suppresses the regular Battle Pill when the Superior one is active', () => {
    const sel = collectConsumables({ consumables: [12792, 12791], consumables2: [], aspdPotions: [] }, items);
    expect(sel.usedSupBattlePill).toBe(true);
    expect(sel.scripts).toEqual(['superior-pill']); // regular (12791) dropped
  });

  it('keeps both pills when only the regular Battle Pill is active', () => {
    const sel = collectConsumables({ consumables: [12791], consumables2: [], aspdPotions: [] }, items);
    expect(sel.usedSupBattlePill).toBe(false);
    expect(sel.scripts).toEqual(['regular-pill']);
  });

  it('ignores falsy ids and tolerates missing arrays', () => {
    const sel = collectConsumables({ consumables: [0, 100] as any, consumables2: undefined as any, aspdPotions: undefined as any }, items);
    expect(sel.scripts).toEqual(['a']);
  });
});

describe('collectBuffBonuses', () => {
  const defs: BuffDef[] = [
    { name: 'Blessing', dropdown: [{ value: 1, isUse: true, bonus: { str: 10 } }] },
    { name: 'WeaponMastery', isMasteryAtk: true, dropdown: [{ value: 2, isUse: true, bonus: { atk: 20 } }] },
    { name: 'Unused', dropdown: [{ value: 0, isUse: false, bonus: { x: 1 } }] },
  ];

  it('splits selected buffs into equip vs mastery bonus maps', () => {
    const { equipAtk, masteryAtk } = collectBuffBonuses(defs, [1, 2, 0], new Set());
    expect(equipAtk).toEqual({ Blessing: { str: 10 } });
    expect(masteryAtk).toEqual({ WeaponMastery: { atk: 20 } });
  });

  it('skips buffs the character already casts as an active skill', () => {
    const { equipAtk } = collectBuffBonuses(defs, [1, 2, 0], new Set(['Blessing']));
    expect(equipAtk).toEqual({});
  });

  it('skips dropdown values not marked isUse, or with no matching selection', () => {
    expect(collectBuffBonuses(defs, [0, 0, 0], new Set())).toEqual({ equipAtk: {}, masteryAtk: {} });
    expect(collectBuffBonuses(defs, [99, 99, 99], new Set())).toEqual({ equipAtk: {}, masteryAtk: {} });
  });
});

// A recording stand-in for the engine: every method returns the spy and logs
// the call, so we can assert the controller drives the pipeline correctly
// without standing up the real Calculator.
function makeCalcSpy() {
  const calls: { method: string; args: any[] }[] = [];
  const spy: any = new Proxy(
    {},
    {
      get(_t, prop: string) {
        return (...args: any[]) => {
          calls.push({ method: prop, args });
          return spy;
        };
      },
    },
  );
  return { spy: spy as Calculator, calls };
}

describe('CalculatorController.runChain', () => {
  const input: CalcChainInput = {
    monster: { id: 1002 } as any,
    equipAtks: { e: 1 },
    masteryAtks: { m: 1 },
    buffEquips: { be: 1 },
    buffMasterys: { bm: 1 },
    consumeData: ['s'],
    aspdPotion: 'pot',
    extraOptionScripts: ['opt'],
    activeSkillNames: new Set(['Skill']),
    learnedSkillMap: new Map([['Skill', 5]]),
    selectedAtkSkill: 'Cross Impact',
    selectedChances: { crit: 1 },
    usedHpL: true,
  };

  it('drives the full solve pipeline in order and returns the calculator', () => {
    const { spy, calls } = makeCalcSpy();
    const result = new CalculatorController().runChain(spy, input);

    expect(result).toBe(spy);
    expect(calls.map((c) => c.method)).toEqual([
      'setMonster',
      'setEquipAtkSkillAtk',
      'setBuffBonus',
      'setMasterySkillAtk',
      'setConsumables',
      'setAspdPotion',
      'setExtraOptions',
      'setUsedSkillNames',
      'setLearnedSkills',
      'setOffensiveSkill',
      'prepareAllItemBonus',
      'calcAllAtk',
      'setSelectedChances',
      'calcAllDefs',
      'calculateHpSp',
      'calculateAllDamages',
    ]);
  });

  it('passes the key inputs to the right pipeline steps', () => {
    const { spy, calls } = makeCalcSpy();
    new CalculatorController().runChain(spy, input);
    const arg = (method: string) => calls.find((c) => c.method === method)!.args[0];

    expect(arg('setMonster')).toBe(input.monster);
    expect(arg('setBuffBonus')).toEqual({ masteryAtk: input.buffMasterys, equipAtk: input.buffEquips });
    expect(arg('setConsumables')).toBe(input.consumeData);
    expect(arg('calculateHpSp')).toEqual({ isUseHpL: true });
    expect(arg('calculateAllDamages')).toBe(input.selectedAtkSkill);
  });
});
