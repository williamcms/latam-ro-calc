import { describe, expect, it } from 'vitest';
import { CharacterBase } from 'src/app/jobs/_character-base.abstract';
import { BaseStateCalculator } from './base-state-calculator';

// setClass only reads `initialStatPoint`, so a tiny stub suffices.
const classWith = (initialStatPoint: number) => ({ initialStatPoint } as unknown as CharacterBase);

describe('BaseStateCalculator — main stat points', () => {
  it('total points = class initial points at level 1', () => {
    const calc = new BaseStateCalculator().setClass(classWith(48)).setLevel(1).setMainStatusLevels([]).calculate();
    expect(calc.summary.totalPoint).toBe(48);
  });

  it('accumulates the per-level point gain (level 6 grants +16 over level 1)', () => {
    // Gains: +3 at L2..L5, +4 at L6 => 16 total on top of the initial pool.
    const calc = new BaseStateCalculator().setClass(classWith(48)).setLevel(6).setMainStatusLevels([]).calculate();
    expect(calc.summary.totalPoint).toBe(48 + 16);
  });

  it('charges the cost of raising a single stat (stat at 10 costs 18)', () => {
    const calc = new BaseStateCalculator().setClass(classWith(48)).setLevel(1).setMainStatusLevels([10]).calculate();
    expect(calc.summary.usedPoint).toBe(18);
  });

  it('sums used points across all stats', () => {
    const calc = new BaseStateCalculator().setClass(classWith(48)).setLevel(1).setMainStatusLevels([10, 10]).calculate();
    expect(calc.summary.usedPoint).toBe(36);
  });

  it('availablePoint = total - used', () => {
    const calc = new BaseStateCalculator().setClass(classWith(100)).setLevel(1).setMainStatusLevels([10]).calculate();
    expect(calc.availablePoint).toBe(100 - 18);
    expect(calc.summary.availablePoint).toBe(82);
  });

  it('suggests the appropriate level when stat points are overspent', () => {
    // Way too many points used at level 1 -> summary should search for a level
    // that affords it (a positive, > current level).
    const calc = new BaseStateCalculator().setClass(classWith(48)).setLevel(1).setMainStatusLevels([100]).calculate();
    const summary = calc.summary;
    expect(summary.availablePoint).toBeLessThan(0);
    expect(summary.appropriateLevel).toBeGreaterThan(1);
  });

  it('leaves appropriateLevel at 0 when points are within budget', () => {
    const calc = new BaseStateCalculator().setClass(classWith(100)).setLevel(50).setMainStatusLevels([10]).calculate();
    expect(calc.summary.availablePoint).toBeGreaterThanOrEqual(0);
    expect(calc.summary.appropriateLevel).toBe(0);
  });
});

describe('BaseStateCalculator — trait points (4th job)', () => {
  it('grants 7 trait points at level 200', () => {
    const calc = new BaseStateCalculator().setLevel(200).setTraitStatusLevels([]).calculate();
    expect(calc.summary.totalTraitPoint).toBe(7);
  });

  it('grants no trait points below level 200', () => {
    const calc = new BaseStateCalculator().setLevel(199).setTraitStatusLevels([]).calculate();
    expect(calc.summary.totalTraitPoint).toBe(0);
  });

  it('adds +3 per level and an extra +4 on multiples of 5', () => {
    // L200=7, +3 each to L204=19, then L205 adds 3+4 => 26.
    const calc = new BaseStateCalculator().setLevel(205).setTraitStatusLevels([]).calculate();
    expect(calc.summary.totalTraitPoint).toBe(26);
  });

  it('used trait points are the raw sum of trait stat levels', () => {
    const calc = new BaseStateCalculator().setLevel(200).setTraitStatusLevels([2, 3, 0, 0, 0, 0]).calculate();
    expect(calc.summary.usedTraitPoint).toBe(5);
    expect(calc.availableTraitPoint).toBe(2);
  });
});
