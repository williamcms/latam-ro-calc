import { SkillModel } from '../_character-base.abstract';

export const BioloMonster = {
  1: 'Cultivar Fada', // Wooden Fairy (skill 5345)
  2: 'Cultivar Bárbaro', // Wooden Warrior (skill 5344)
  // 3: 'Mother Net',
} as const;

type MonsterID = keyof typeof BioloMonster;

export const isBioloWoodenFairy = (id: number) => BioloMonster[id as MonsterID] === 'Cultivar Fada';
export const isBioloWoodenWarrior = (id: number) => BioloMonster[id as MonsterID] === 'Cultivar Bárbaro';

export const genBioloMonsterSkillList = (): SkillModel[] => {
  return [
    { label: '-', value: 0, isUse: false },
    ...Object.entries(BioloMonster).map(([value, label]) => {
      return { label, value: Number(value), isUse: true };
    }),
  ];
};
