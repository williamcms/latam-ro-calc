import { MainModel } from 'src/app/models/main.model';
import { MonsterModel } from 'src/app/models/monster.model';
import { Calculator } from './calculator';

/**
 * Framework-free orchestration for the calculator.
 *
 * The UI component owns form state and DOM concerns; everything that turns that
 * state into a solved {@link Calculator} lives here so it can be unit-tested
 * without Angular. The two `collect*` helpers are pure (state in, value out) and
 * {@link CalculatorController.runChain} is the single "solve the whole thing"
 * entry point that drives the engine's fluent pipeline.
 */

/** A consumable/aspd item id whose script is one of the calculator's buffs. */
type ConsumableId = number;

/** The id of the Superior Battle Pill — when active it suppresses the regular
 *  Battle Pill (12791) so the two don't stack. */
const SUPERIOR_BATTLE_PILL = 12792;
const REGULAR_BATTLE_PILL = 12791;
/** HP Increase Potion (L) — consumed flag is needed by the HP/SP step. */
const HP_INCREASE_POTION_L = 12424;

export interface ConsumableSelection {
  /** The item scripts to feed into `Calculator.setConsumables`. */
  scripts: any[];
  /** Whether HP Increase Potion (L) is active (drives the HP/SP calc). */
  usedHpL: boolean;
  /** Whether the Superior Battle Pill is active (suppresses the regular one). */
  usedSupBattlePill: boolean;
}

/**
 * Resolve the active consumable scripts from the model's selected ids.
 * Mirrors the rule that the Superior Battle Pill replaces the regular one.
 */
export function collectConsumables(
  model: Pick<MainModel, 'consumables' | 'consumables2' | 'aspdPotions'>,
  items: Record<number, { script?: any }>,
): ConsumableSelection {
  const consumables = model.consumables ?? [];
  const usedSupBattlePill = consumables.includes(SUPERIOR_BATTLE_PILL);
  const usedHpL = consumables.includes(HP_INCREASE_POTION_L);

  const scripts = [...consumables, ...(model.consumables2 ?? []), ...(model.aspdPotions ?? [])]
    .filter(Boolean)
    // when the superior pill is on, drop the regular pill so they don't stack
    .filter((id: ConsumableId) => !usedSupBattlePill || id !== REGULAR_BATTLE_PILL)
    .map((id: ConsumableId) => items[id].script);

  return { scripts, usedHpL, usedSupBattlePill };
}

/** One selectable buff row (a subset of `JobBuffs`). */
export interface BuffDef {
  name: string;
  isMasteryAtk?: boolean;
  dropdown: { value: any; isUse?: boolean; bonus?: any }[];
}

export interface BuffBonuses {
  /** Buffs applied as equipment-style atk bonuses. */
  equipAtk: Record<string, any>;
  /** Buffs applied as mastery atk bonuses. */
  masteryAtk: Record<string, any>;
}

/**
 * Resolve the selected buff dropdown values into equip/mastery bonus maps.
 * A buff that the character already casts as an active skill is skipped (the
 * active skill already contributes it).
 */
export function collectBuffBonuses(buffDefs: BuffDef[], selectedValues: any[], activeSkillNames: Set<string>): BuffBonuses {
  const equipAtk: Record<string, any> = {};
  const masteryAtk: Record<string, any> = {};

  buffDefs.forEach((buffDef, i) => {
    const selected = buffDef.dropdown.find((d) => d.value === selectedValues[i]);
    if (!selected?.isUse || activeSkillNames.has(buffDef.name)) return;

    if (buffDef.isMasteryAtk) masteryAtk[buffDef.name] = selected.bonus;
    else equipAtk[buffDef.name] = selected.bonus;
  });

  return { equipAtk, masteryAtk };
}

/** Everything the fluent solve pipeline needs once items are loaded. */
export interface CalcChainInput {
  monster: MonsterModel;
  equipAtks: Record<string, any>;
  masteryAtks: Record<string, any>;
  buffEquips: Record<string, any>;
  buffMasterys: Record<string, any>;
  consumeData: any[];
  aspdPotion: any;
  extraOptionScripts: any[];
  activeSkillNames: Set<string>;
  learnedSkillMap: Map<string, number>;
  selectedAtkSkill: any;
  selectedChances: any;
  usedHpL: boolean;
}

export class CalculatorController {
  /**
   * Drive the engine's fluent pipeline to fully solve a (already class-set,
   * already item-loaded) calculator: bonuses, atk, defs, HP/SP and damage.
   * This is the single place the whole computed state is produced.
   */
  runChain(calc: Calculator, input: CalcChainInput): Calculator {
    return calc
      .setMonster(input.monster)
      .setEquipAtkSkillAtk(input.equipAtks)
      .setBuffBonus({ masteryAtk: input.buffMasterys, equipAtk: input.buffEquips })
      .setMasterySkillAtk(input.masteryAtks)
      .setConsumables(input.consumeData)
      .setAspdPotion(input.aspdPotion)
      .setExtraOptions(input.extraOptionScripts)
      .setUsedSkillNames(input.activeSkillNames)
      .setLearnedSkills(input.learnedSkillMap)
      .setOffensiveSkill(input.selectedAtkSkill)
      .prepareAllItemBonus()
      .calcAllAtk()
      .setSelectedChances(input.selectedChances)
      .calcAllDefs()
      .calculateHpSp({ isUseHpL: input.usedHpL })
      .calculateAllDamages(input.selectedAtkSkill);
  }
}
