import { describe, expect, it } from 'vitest';
import { createNumberDropdownList } from './create-number-dropdown-list';

describe('createNumberDropdownList', () => {
  it('builds an inclusive range of {label, value}', () => {
    expect(createNumberDropdownList({ from: 1, to: 3 })).toEqual([
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
    ]);
  });

  it('supports a single-element range', () => {
    expect(createNumberDropdownList({ from: 0, to: 0 })).toEqual([{ label: '0', value: 0 }]);
  });

  it('prefixes the label when asked', () => {
    expect(createNumberDropdownList({ from: 1, to: 2, prefixLabel: '+' })).toEqual([
      { label: '+1', value: 1 },
      { label: '+2', value: 2 },
    ]);
  });

  it('filters out excluded numbers', () => {
    const list = createNumberDropdownList({ from: 1, to: 4, excludingNumbers: [2, 3] });
    expect(list.map((o) => o.value)).toEqual([1, 4]);
  });
});
