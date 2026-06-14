import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Monster sprite rendered by ragassets (zrenderer) from the mob id:
 *   1002 -> {ragassetsUrl}/image?job=1002&action=0  (idle pose, APNG)
 * Replaces the old static.divine-pride.net mob PNGs.
 */
@Pipe({ name: 'monsterSprite', standalone: true })
export class MonsterSpritePipe implements PipeTransform {
  transform(id: string | number | null | undefined): string {
    if (id === null || id === undefined || id === '') return '';
    return `${environment.ragassetsUrl}/image?job=${id}&action=0`;
  }
}
