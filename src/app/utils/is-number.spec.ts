import { describe, expect, it } from 'vitest';
import { isNumber } from './is-number';

// NOTE: the current implementation is `!Number.isNaN(n)`, so it is really an
// "is not the NaN value" guard rather than a strict typeof-number check. These
// tests pin that ACTUAL behaviour so a future tightening is a conscious change.
describe('isNumber', () => {
  it('is true for real numbers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(-3.14)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
  });

  it('is false only for the literal NaN value', () => {
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(0 / 0)).toBe(false);
  });

  it('treats non-number values as "numbers" (NaN-only guard quirk)', () => {
    expect(isNumber('5')).toBe(true);
    expect(isNumber(undefined)).toBe(true);
    expect(isNumber(null)).toBe(true);
  });
});
