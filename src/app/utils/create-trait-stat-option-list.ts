import { DropdownModel } from '../models/dropdown.model';

// pt-BR trait labels (same as the replay-import warning: POD/STA/SAB/FEI/CON/CRV).
// `value`s stay English because the calc derives option values from them — only
// the shown `label` is translated.
const TR: Record<string, string> = {
  POW: 'POD',
  WIS: 'SAB',
  SPL: 'FEI',
  CRT: 'CRV',
  'P.ATK': 'P.ATQ',
  'S.MATK': 'S.ATQM',
};
const tr = (s: string) => TR[s] ?? s;

export const createTraitStatOptionList = (starVal: number, endVal: number) => {
  const item: DropdownModel & { children: any[] } = {
    label: 'Talentos',
    value: 'Trait Stat',
    children: [],
  };

  const VAL_CAP = 20;
  const options: [string, string][] = [
    ['POW', 'pow'],
    ['SPL', 'spl'],
    ['STA', 'sta'],
    ['WIS', 'wis'],
    ['CON', 'con'],
    ['CRT', 'crt'],
    ['C.RATE', 'cRate'],
    ['P.ATK', 'pAtk'],
    ['S.MATK', 'sMatk'],
  ];

  for (const [label, prop] of options) {
    const values = [] as { label: string; min: number; max: number }[];
    for (let i = starVal; i < endVal; i += VAL_CAP) {
      const max = Math.min(i + VAL_CAP - 1, endVal);
      values.push({ label: `${i} - ${max}`, min: i, max: max });
    }

    let children = [];
    if (values.length === 1) {
      const { min, max } = values[0];
      children = Array.from({ length: max - min + 1 }, (_, k) => {
        const num = k + min;
        return {
          label: `${tr(label)} +${num}`,
          value: `${prop}:${num}`,
        };
      });
    } else if (values.length > 1) {
      children = values.map((value) => {
        const { label: label2, min, max } = value;

        return {
          label: `${tr(label)} ${label2}`,
          value: label2,
          children: Array.from({ length: max - min + 1 }, (_, k) => {
            const num = k + min;
            return {
              label: `${tr(label)} +${num}`,
              value: `${prop}:${num}`,
            };
          }),
        };
      });
    } else {
      item.children.push({
        label: tr(label),
        value: prop,
      });

      continue;
    }

    item.children.push({
      value: label,
      label: tr(label),
      children,
    });
  }

  return item;
};
