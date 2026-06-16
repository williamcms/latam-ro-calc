import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-misc-detail',
  templateUrl: './misc-detail.component.html',
  styleUrls: ['../ro-calculator.component.css'],
})
export class MiscDetailComponent {
  @Input({ required: true }) elementTable: any[];
  @Input({ required: true }) raceTable: any[];
  @Input({ required: true }) sizeTable: any[];
  @Input({ required: true }) classTable: any[];
  @Input({ required: true }) skillMultiplierTable: any[];
  @Input() atkTypeTable: any[] = [];
  /** Resolves the pt-BR skill popover HTML for a multiplier row (see ro-calculator.buffTooltip). */
  @Input() skillTooltip?: (skill: any) => string;
  /** These tables show penetration values, so the bonus keys are the `*_pene_*` variants. */
  @Input() isPene = false;
  /** Clicking a value asks the parent to open the "which items contribute" breakdown.
   *  `keys` are the engine summary keys whose sum equals the clicked value;
   *  `valueClass` is the source cell's colour class so the modal matches it. */
  @Output() valueClick = new EventEmitter<{ label: string; keys: string[]; valueClass: string }>();

  constructor() {}

  private static readonly SIZE_SHORT: Record<string, string> = { Small: 's', Medium: 'm', Large: 'l' };
  /** physical bonuses are shown in the ATK (orange) colour, magical in the MATK (blue) colour. */
  private static readonly PHYS = 'summary_stat_atk';
  private static readonly MAGIC = 'summary_stat_matk';

  private fmLabel(displayName: string, kind: 'physical' | 'magical'): string {
    return `${displayName} (${kind === 'physical' ? 'Físico' : 'Mágico'})`;
  }

  private toneOf(kind: 'physical' | 'magical'): string {
    return kind === 'physical' ? MiscDetailComponent.PHYS : MiscDetailComponent.MAGIC;
  }

  onElementClick(val: any, kind: 'physical' | 'magical' | 'myElement'): void {
    const e = String(val.name).toLowerCase();
    const name = val.displayName || val.name;
    if (kind === 'physical') return this.valueClick.emit({ label: this.fmLabel(name, 'physical'), keys: ['p_element_all', `p_element_${e}`], valueClass: this.toneOf('physical') });
    if (kind === 'magical') return this.valueClick.emit({ label: this.fmLabel(name, 'magical'), keys: ['m_element_all', `m_element_${e}`], valueClass: this.toneOf('magical') });
    return this.valueClick.emit({ label: `${name} (Elem. Mágico)`, keys: ['m_my_element_all', `m_my_element_${e}`], valueClass: MiscDetailComponent.MAGIC });
  }

  onRaceClick(val: any, kind: 'physical' | 'magical'): void {
    const r = String(val.name).toLowerCase();
    const base = this.isPene ? 'pene_race' : 'race';
    const prefix = `${kind === 'physical' ? 'p' : 'm'}_${base}_`;
    this.valueClick.emit({ label: this.fmLabel(val.displayName || val.name, kind), keys: [`${prefix}all`, `${prefix}${r}`], valueClass: this.toneOf(kind) });
  }

  onClassClick(val: any, kind: 'physical' | 'magical'): void {
    const c = String(val.name).toLowerCase();
    const base = this.isPene ? 'pene_class' : 'class';
    const prefix = `${kind === 'physical' ? 'p' : 'm'}_${base}_`;
    this.valueClick.emit({ label: this.fmLabel(val.displayName || val.name, kind), keys: [`${prefix}all`, `${prefix}${c}`], valueClass: this.toneOf(kind) });
  }

  onSizeClick(val: any, kind: 'physical' | 'magical'): void {
    const s = MiscDetailComponent.SIZE_SHORT[val.name as string] ?? String(val.name).toLowerCase();
    const prefix = `${kind === 'physical' ? 'p' : 'm'}_size_`;
    this.valueClick.emit({ label: this.fmLabel(val.displayName || val.name, kind), keys: [`${prefix}all`, `${prefix}${s}`], valueClass: this.toneOf(kind) });
  }

  onAtkTypeClick(val: any): void {
    const map: Record<string, string[]> = { Melee: ['melee'], Range: ['range'], MATK: ['matkPercent'] };
    const valueClass = val.name === 'MATK' ? MiscDetailComponent.MAGIC : MiscDetailComponent.PHYS;
    this.valueClick.emit({ label: val.displayName || val.name, keys: map[val.name as string] ?? [], valueClass });
  }

  onSkillClick(val: any, kind: 'value' | 'cd'): void {
    const name = val.displayName || val.name;
    if (kind === 'cd') return this.valueClick.emit({ label: `${name} (CD)`, keys: [`cd__${val.name}`], valueClass: 'summary_damage' });
    this.valueClick.emit({ label: name, keys: [val.name], valueClass: 'summary_damage' });
  }

  get isShowElementTable() {
    return this.elementTable?.length > 0;
  }

  get isShowSizeTable() {
    return this.sizeTable?.length > 0;
  }

  get isShowSkillMultiplierTable() {
    return this.skillMultiplierTable?.length > 0;
  }

  get isShowAtkTypeTable() {
    return this.atkTypeTable?.length > 0;
  }
}
