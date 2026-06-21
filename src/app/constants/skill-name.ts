// The skill-name union is derived from the Skill Catalog (src/app/skills), which is
// the single source of truth for skill names. This file previously held two
// hand-maintained arrays (ACTIVE_PASSIVE_SKILL_NAMES / OFFENSIVE_SKILL_NAMES); they
// were folded into the catalog and removed.
export type { SkillName as SKILL_NAME } from '../skills';
