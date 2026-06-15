import { describe, expect, it } from 'vitest';
import { round, roundUp } from './round';

describe('round', () => {
  it('rounds to the requested precision', () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.235, 2)).toBe(1.24);
    expect(round(1.5, 0)).toBe(2);
  });

  it('is a no-op for already-precise values', () => {
    expect(round(10, 2)).toBe(10);
  });
});

describe('roundUp', () => {
  it('always rounds toward +Infinity at the precision', () => {
    expect(roundUp(1.231, 2)).toBe(1.24);
    expect(roundUp(1.0001, 2)).toBe(1.01);
    expect(roundUp(2, 0)).toBe(2);
  });
});
