import { describe, expect, it } from 'vitest';
import { parseOptionScripts } from './option-scripts';

describe('parseOptionScripts', () => {
  it('parses "attr:value" entries into bonus-script objects', () => {
    expect(parseOptionScripts(['str:10', 'agi:5'])).toEqual([{ str: 10 }, { agi: 5 }]);
  });

  it('coerces the value to a number, including zero', () => {
    expect(parseOptionScripts(['luk:0'])).toEqual([{ luk: 0 }]);
  });

  it('drops empty and malformed entries', () => {
    expect(parseOptionScripts(['', 'no-colon-digits', 'vit:3'])).toEqual([{ vit: 3 }]);
  });

  it('ignores non-string entries', () => {
    expect(parseOptionScripts([null as any, undefined as any, 'dex:7'])).toEqual([{ dex: 7 }]);
  });

  it('returns an empty array for empty/nullish input', () => {
    expect(parseOptionScripts([])).toEqual([]);
    expect(parseOptionScripts(null as any)).toEqual([]);
  });
});
