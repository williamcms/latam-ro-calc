import { describe, expect, it } from 'vitest';
import { sortObj } from './sort-obj';

describe('sortObj', () => {
  const rows = () => [{ value: 3 }, { value: 1 }, { value: 2 }];

  it('sorts ascending by the given field by default', () => {
    const sorted = rows().sort(sortObj('value'));
    expect(sorted.map((r) => r.value)).toEqual([1, 2, 3]);
  });

  it('sorts descending when order is -1', () => {
    const sorted = rows().sort(sortObj('value', -1));
    expect(sorted.map((r) => r.value)).toEqual([3, 2, 1]);
  });

  it('works on string fields', () => {
    const sorted = [{ name: 'b' }, { name: 'a' }, { name: 'c' }].sort(sortObj('name'));
    expect(sorted.map((r) => r.name)).toEqual(['a', 'b', 'c']);
  });
});
