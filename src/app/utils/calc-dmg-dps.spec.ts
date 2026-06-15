import { describe, expect, it } from 'vitest';
import { calcDmgDps } from './calc-dmg-dps';

const base = { min: 100, max: 100, cri: 0, criDmg: 0, hitsPerSec: 1, accRate: 100 };

describe('calcDmgDps', () => {
  it('returns the average hit per second with no crit and full accuracy', () => {
    expect(calcDmgDps({ ...base })).toBe(100);
  });

  it('averages the min/max damage', () => {
    expect(calcDmgDps({ ...base, min: 100, max: 200 })).toBe(150);
  });

  it('scales linearly with hits per second', () => {
    expect(calcDmgDps({ ...base, hitsPerSec: 2 })).toBe(200);
  });

  it('uses crit damage for the crit portion of hits', () => {
    // 100% crit, crit multiplier 150 -> 150 per hit.
    expect(calcDmgDps({ ...base, cri: 100, criDmg: 150 })).toBe(150);
  });

  it('caps crit rate at 100%', () => {
    expect(calcDmgDps({ ...base, cri: 150, criDmg: 150 })).toBe(calcDmgDps({ ...base, cri: 100, criDmg: 150 }));
  });

  it('reduces non-crit damage by the miss chance', () => {
    // 50% accuracy halves the non-crit contribution.
    expect(calcDmgDps({ ...base, accRate: 50 })).toBe(50);
  });

  it('blends crit and non-crit contributions', () => {
    // 50% crit @150, 50% normal @100 (full acc) -> floor((50*100 + 150*50)/100) = 125
    expect(calcDmgDps({ ...base, cri: 50, criDmg: 150 })).toBe(125);
  });
});
