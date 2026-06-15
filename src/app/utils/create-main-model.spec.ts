import { describe, expect, it } from 'vitest';
import { createMainModel } from './create-main-model';

describe('createMainModel', () => {
  it('seeds sensible defaults', () => {
    const m = createMainModel();
    expect(m.level).toBe(99);
    expect(m.class).toBe(1);
    expect(m.str).toBe(1);
    expect(m.luk).toBe(1);
    expect(m.rawOptionTxts).toEqual([]);
    expect(m.activeSkills).toEqual([]);
    expect(m.consumables).toEqual([]);
  });

  it('returns a fresh, independent object each call', () => {
    const a = createMainModel();
    const b = createMainModel();
    expect(a).not.toBe(b);
    expect(a.activeSkills).not.toBe(b.activeSkills); // arrays not shared by reference

    a.str = 99;
    a.activeSkills.push(1);
    expect(b.str).toBe(1);
    expect(b.activeSkills).toEqual([]);
  });
});
