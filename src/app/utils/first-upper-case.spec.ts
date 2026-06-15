import { describe, expect, it } from 'vitest';
import { firstUppercase } from './first-upper-case';

describe('firstUppercase', () => {
  it('capitalises the first character only', () => {
    expect(firstUppercase('hello')).toBe('Hello');
    expect(firstUppercase('hello world')).toBe('Hello world');
  });

  it('leaves an already-capitalised string unchanged', () => {
    expect(firstUppercase('Ghost')).toBe('Ghost');
  });

  it('handles single characters and non-letters', () => {
    expect(firstUppercase('a')).toBe('A');
    expect(firstUppercase('1abc')).toBe('1abc');
  });

  it('throws on an empty string (documents the edge — caller must guard)', () => {
    expect(() => firstUppercase('')).toThrow();
  });
});
