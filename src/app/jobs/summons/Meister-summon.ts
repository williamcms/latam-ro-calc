import { SkillModel } from '../_character-base.abstract';

export const MeisterMonster = {
  1: 'Fabricar Soldado', // ABR - Battle Warrior (skill 5302)
  2: 'Fabricar Canhoneiro', // ABR - Dual Cannon (skill 5303)
  // 3: 'Fabricar Curandeira', // ABR - Mother Net (skill 5304)
} as const;

type MonsterID = keyof typeof MeisterMonster;

export const isBattleWarrior = (id: number) => MeisterMonster[id as MonsterID] === 'Fabricar Soldado';
export const isDualCannon = (id: number) => MeisterMonster[id as MonsterID] === 'Fabricar Canhoneiro';

export const genMeisterMonsterSkillList = (): SkillModel[] => {
  return [
    { label: '-', value: 0, isUse: false },
    ...Object.entries(MeisterMonster).map(([value, label]) => {
      return { label, value: Number(value), isUse: true };
    }),
  ];
};
