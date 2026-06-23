import { describe, expect, it } from 'vitest';
import { Monster } from '../domain';
import { MonsterModel } from '../models/monster.model';
import { DamageCalculator } from './damage-calculator';

const monsterModel = (id: number): MonsterModel =>
  ({
    id,
    name: 'Test Mob',
    spawn: 'MVP',
    stats: {
      level: 100,
      health: 1_000_000,
      str: 1,
      agi: 1,
      vit: 1,
      int: 1,
      dex: 1,
      luk: 1,
      defense: 0,
      magicDefense: 0,
      res: 0,
      mres: 0,
      elementName: 'Neutral 1',
      raceName: 'Formless',
      scaleName: 'Medium',
      class: 1,
      mvp: 1,
    },
  } as any);

// applyAuraReduction is the single chokepoint every final damage number passes
// through (physical/magical skills + basic/crit autoattacks), so testing it in
// isolation pins the red-aura 99.9% reduction without standing up the whole
// damage pipeline.
const reduceWith = (id: number, damage: number) => {
  const dc = new DamageCalculator();
  (dc as any).monster = new Monster().setData(monsterModel(id));
  return (dc as any).applyAuraReduction(damage) as number;
};

describe('DamageCalculator red-aura reduction', () => {
  it('reduces final damage by 99.9% for a red-aura MVP (Orc Hero 1087)', () => {
    expect(reduceWith(1087, 1_000_000)).toBe(1000); // floor(1_000_000 * 0.001)
    expect(reduceWith(1087, 1_234_567)).toBe(1234); // floor(1_234_567 * 0.001)
  });

  it('leaves damage untouched for an MVP without a red aura (Gemaring 3505)', () => {
    expect(reduceWith(3505, 1_000_000)).toBe(1_000_000);
  });

  it('leaves damage untouched for an ordinary monster (Poring 1002)', () => {
    expect(reduceWith(1002, 1_000_000)).toBe(1_000_000);
  });
});
