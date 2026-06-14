import { Pipe, PipeTransform } from '@angular/core';
import { racePtBr, sizePtBr, elementPtBr, monsterTypePtBr } from '../constants/monster-i18n';

/**
 * Translates a monster race / size / element / type label to pt-BR for display,
 * leaving the underlying English value (used for CSS classes and calc logic)
 * untouched. Terms from browiki.org/wiki/Monstros.
 *   'Formless' | race    -> 'Amorfo'
 *   'Medium'   | size    -> 'Médio'    ('L' -> 'G')
 *   'Neutral'  | element -> 'Neutro'   ('Ghost 3' -> 'Fantasma 3')
 *   'Boss'     | type    -> 'Chefe'
 */
@Pipe({ name: 'monsterTerm', standalone: true })
export class MonsterTermPipe implements PipeTransform {
  transform(value: string | null | undefined, kind: 'race' | 'size' | 'element' | 'type'): string {
    if (value == null) return '';
    switch (kind) {
      case 'race': return racePtBr(value);
      case 'size': return sizePtBr(value);
      case 'type': return monsterTypePtBr(value);
      case 'element': return elementPtBr(value);
      default: return value;
    }
  }
}
