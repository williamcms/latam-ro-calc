import { describe, expect, it } from 'vitest';
import { floor } from './floor';

describe('floor', () => {
  it('floors to an integer by default', () => {
    expect(floor(5)).toBe(5);
    expect(floor(5.9)).toBe(5);
    expect(floor(5.0001)).toBe(5);
  });

  it('floors toward -Infinity for negatives', () => {
    expect(floor(-1.5)).toBe(-2);
    expect(floor(-0.0001)).toBe(-1);
  });

  it('corrects binary floating-point drift before flooring', () => {
    // Without the internal round(_, 6), Math.floor(2.9999999999) would give 2.
    expect(floor(2.9999999999)).toBe(3);
    // 0.1 + 0.2 === 0.30000000000000004 — must still floor to 0.3 at 1 digit.
    expect(floor(0.1 + 0.2, 1)).toBe(0.3);
  });

  it('floors at a given number of decimal digits', () => {
    expect(floor(123.456, 2)).toBe(123.45);
    expect(floor(123.4, 2)).toBe(123.4);
    expect(floor(-1.234, 2)).toBe(-1.24);
  });
});
