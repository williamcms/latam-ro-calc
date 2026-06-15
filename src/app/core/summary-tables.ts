import { ElementType, RaceType } from 'src/app/constants';
import { isNumber } from 'src/app/utils';

/**
 * Pure builders for the calculator's "Bônus de Habilidade / Multiplicadores"
 * summary tables. Each takes the engine's flat `totalSummary` (attr -> value)
 * and returns the rows the template renders. No Angular, no component state —
 * so the table-shaping logic is unit-testable on its own.
 */

/** The engine's computed summary: a flat bag of `attr -> number` (+ some non-numerics). */
export type DamageSummaryLike = Record<string, any>;

export interface ElementDataModel {
  name: string;
  /** pt-BR label shown in the UI; `name` stays English for CSS (property_*) + logic. */
  displayName?: string;
  physicalElementToMonster: number;
  magicalElementToMonster: number;
  myElement: number;
}

export interface RaceDataModel {
  name: string;
  /** pt-BR label shown in the UI; `name` stays English for any name-based logic. */
  displayName?: string;
  physical: number;
  magical: number;
}

export interface AtkTypeDataModel {
  name: string;
  displayName?: string;
  value: number;
}

export interface SkillMultiplierModel {
  name: string;
  /** pt-BR skill label shown in the UI (falls back to `name`). */
  displayName?: string;
  /** ragassets skill-icon id (from the LATAM skill map); absent if unmapped. */
  icon?: number;
  value: number;
  cd: string;
}

const elements = Object.values(ElementType).map((a) => [a, a.toLowerCase()]);
const races = Object.values(RaceType).map((a) => [a, a.toLowerCase()]);
const sizes: [string, string][] = [
  ['Small', 's'],
  ['Medium', 'm'],
  ['Large', 'l'],
];
const monsterTypes: [string, string][] = [
  ['Boss', 'boss'],
  ['Normal', 'normal'],
];

// pt-BR labels for the summary tables. Keyed by the English identifier
// (ElementType/RaceType value or literal) that stays on `name` for CSS classes
// (property_*) and name-based logic.
const ELEMENT_PT: Record<string, string> = {
  Neutral: 'Neutro', Water: 'Água', Earth: 'Terra', Fire: 'Fogo', Wind: 'Vento',
  Poison: 'Veneno', Holy: 'Sagrado', Dark: 'Sombrio', Ghost: 'Fantasma', Undead: 'Morto-Vivo',
};
const RACE_PT: Record<string, string> = {
  Formless: 'Amorfo', Undead: 'Morto-Vivo', Brute: 'Bruto', Plant: 'Planta', Insect: 'Inseto',
  Fish: 'Peixe', Demon: 'Demônio', DemiHuman: 'Semi-Humano', Angel: 'Anjo', Dragon: 'Dragão',
};
const SIZE_PT: Record<string, string> = { Small: 'Pequeno', Medium: 'Médio', Large: 'Grande' };
const MONSTER_TYPE_PT: Record<string, string> = { Boss: 'Chefe', Normal: 'Normal' };
const ATK_TYPE_PT: Record<string, string> = { Melee: 'Corpo a corpo', Range: 'À distância', MATK: 'MATK' };

export function buildElementTable(totalSummary: DamageSummaryLike): ElementDataModel[] {
  const p_element_all = totalSummary['p_element_all'] || 0;
  const m_element_all = totalSummary['m_element_all'] || 0;
  const m_my_element_all = totalSummary['m_my_element_all'] || 0;

  return elements.map(([eleShow, ele]) => ({
    name: eleShow,
    displayName: ELEMENT_PT[eleShow] ?? eleShow,
    physicalElementToMonster: p_element_all + (totalSummary[`p_element_${ele}`] || 0),
    magicalElementToMonster: m_element_all + (totalSummary[`m_element_${ele}`] || 0),
    myElement: m_my_element_all + (totalSummary[`m_my_element_${ele}`] || 0),
  }));
}

export function buildRaceTables(totalSummary: DamageSummaryLike): { raceTable: RaceDataModel[]; peneRaceTable: RaceDataModel[] } {
  const p_race_all = totalSummary['p_race_all'] || 0;
  const m_race_all = totalSummary['m_race_all'] || 0;
  const raceTable = races.map(([raceShow, race]) => ({
    name: raceShow,
    displayName: RACE_PT[raceShow] ?? raceShow,
    physical: p_race_all + (totalSummary[`p_race_${race}`] || 0),
    magical: m_race_all + (totalSummary[`m_race_${race}`] || 0),
  }));

  const p_pene_race_all = totalSummary['p_pene_race_all'] || 0;
  const m_pene_race_all = totalSummary['m_pene_race_all'] || 0;
  const peneRaceTable = races.map(([classShow, race]) => ({
    name: classShow,
    displayName: RACE_PT[classShow] ?? classShow,
    physical: p_pene_race_all + (totalSummary[`p_pene_race_${race}`] || 0),
    magical: m_pene_race_all + (totalSummary[`m_pene_race_${race}`] || 0),
  }));

  return { raceTable, peneRaceTable };
}

export function buildSizeTable(totalSummary: DamageSummaryLike): RaceDataModel[] {
  const p_size_all = totalSummary['p_size_all'] || 0;
  const m_size_all = totalSummary['m_size_all'] || 0;

  return sizes.map(([sizeShow, size]) => ({
    name: sizeShow,
    displayName: SIZE_PT[sizeShow] ?? sizeShow,
    physical: p_size_all + (totalSummary[`p_size_${size}`] || 0),
    magical: m_size_all + (totalSummary[`m_size_${size}`] || 0),
  }));
}

export function buildMonsterTypeTables(totalSummary: DamageSummaryLike): { classTable: RaceDataModel[]; peneClassTable: RaceDataModel[] } {
  const p_class_all = totalSummary['p_class_all'] || 0;
  const m_class_all = totalSummary['m_class_all'] || 0;
  const classTable = monsterTypes.map(([classShow, _class]) => ({
    name: classShow,
    displayName: MONSTER_TYPE_PT[classShow] ?? classShow,
    physical: p_class_all + (totalSummary[`p_class_${_class}`] || 0),
    magical: m_class_all + (totalSummary[`m_class_${_class}`] || 0),
  }));

  const p_pene_class_all = totalSummary['p_pene_class_all'] || 0;
  const m_pene_class_all = totalSummary['m_pene_class_all'] || 0;
  const peneClassTable = monsterTypes.map(([classShow, _class]) => ({
    name: classShow,
    displayName: MONSTER_TYPE_PT[classShow] ?? classShow,
    physical: p_pene_class_all + (totalSummary[`p_pene_class_${_class}`] || 0),
    magical: m_pene_class_all + (totalSummary[`m_pene_class_${_class}`] || 0),
  }));

  return { classTable, peneClassTable };
}

export function buildAtkTypeTable(totalSummary: DamageSummaryLike): AtkTypeDataModel[] {
  return [
    { name: 'Melee', displayName: ATK_TYPE_PT['Melee'], value: totalSummary['melee'] || 0 },
    { name: 'Range', displayName: ATK_TYPE_PT['Range'], value: totalSummary['range'] || 0 },
    { name: 'MATK', displayName: ATK_TYPE_PT['MATK'], value: totalSummary['matkPercent'] || 0 },
  ];
}

/**
 * Build the skill-multiplier rows. Any capitalised summary attr is treated as a
 * skill multiplier; `cd__<skill>` attrs fold a cooldown delta into the matching
 * row. `resolveSkill` overlays the pt-BR name + icon when the row maps to a
 * known LATAM skill.
 */
export function buildSkillMultiplierTable(
  totalSummary: DamageSummaryLike,
  resolveSkill: (name: string) => { id: number; name: string } | undefined,
): SkillMultiplierModel[] {
  const dMap = new Map<string, any>();
  const addValue = (key: string, val: Partial<SkillMultiplierModel>) => {
    dMap.set(key, dMap.has(key) ? { ...dMap.get(key), ...val } : val);
  };

  for (const [attr, value] of Object.entries(totalSummary)) {
    if (!isNumber(value)) continue;

    const firstCap = attr.charAt(0);
    if (firstCap === firstCap.toUpperCase()) {
      addValue(attr, { name: attr, value });
      continue;
    }

    if (attr.startsWith('cd__')) {
      const actualAttr = attr.replace('cd__', '');
      addValue(actualAttr, {
        name: actualAttr,
        cd: value < 0 ? `+${value * -1}` : `-${value}`,
      });
    }
  }

  return [...dMap.values()].map((row) => {
    const pt = resolveSkill(row.name);
    return pt ? { ...row, displayName: pt.name, icon: pt.id } : row;
  });
}
