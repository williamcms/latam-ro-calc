#!/usr/bin/env node
// Build the calculator's pt-BR skill map, keyed by the calculator's own skill
// names, using divine-pride skill ids as the bridge.
//
// Strategy (replaces the old runtime fuzzy match):
//   1. english name -> id   : the LATAM client GRF skillinfolist_enus (id ->
//      English name) reversed. These ids ARE the standard divine-pride / client
//      skill ids (verified: Adoramus 2040, Wind Cutter 2005, Napalm Vulcan 400).
//   2. add the id to every calc skill : for each name in OFFENSIVE_SKILL_NAMES
//      we resolve an id (exact -> curated alias -> spacing/punctuation-insensitive
//      match -> manual override) and bake it into the output, saved in the repo.
//   3. id -> pt name : from divine-pride (../ragreplaystats public/db/skill.json,
//      id -> pt), falling back to the GRF skillinfolist_ptbr, then English.
//
// Output: src/assets/demo/data/latam-skills.json  { "<calcName>": { id, name } }
//   `id`   drives the ragassets skill icon (/icons/skill/{id}.png)
//   `name` is the pt-BR label shown in the Habilidade picker.
//
// Usage: node tools/build-latam-skills.mjs [--grf <data.grf>] [--dp <skill.json>] [--report]

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { openGrf, closeGrf, findBestEntry, extractFile, normalize } from "./grf.mjs";
import { runChunkInto, LuaTable, decodeClientString } from "./lua51.mjs";

const DEFAULT_GRF = "C:\\Gravity\\Ragnarok\\data.grf";
const DEFAULT_DP = "../ragreplaystats/public/db/skill.json"; // divine-pride id -> { name: ptName }
const SKILLINFOZ = "data/luafiles514/lua files/skillinfoz";

// calc-name spelling/variant -> the English name as it appears in the client
// skillinfolist_enus, so the exact id lookup hits. Only confident fixes.
const SKILL_NAME_ALIASES = {
  "Fatal Manace": "Fatal Menace",
  "Metalic Sound": "Metallic Sound",
  "Lightening Bolt": "Lightning Bolt",
  "Hack and Slasher": "Hack and Slash",
  "Third Punish": "Third Punishment",
  "Second Judgement": "Second Judgment",
  "Rock Down Arrow": "Rock Down",
  "Powerful Swing": "Power Swing",
  "Shatter Storm": "Shattering Storm",
  "Nuckle Boost": "Knuckle Boost",
  "Spread Shot": "Spread Attack",
  "Rain of Crystal": "Crystal Rain",        // AG_CRYSTAL_RAIN 5216 "Cascata de Cristal"
};

// Calc names whose id we pin by hand because the client English name differs
// from the calc's name. Each id comes from the GRF SKID constant table
// (skill-const -> id), so there's no guesswork: calcName -> skill id.
const SKILL_ID_OVERRIDES = {
  "Cart Termination": 485,    // WS_CARTTERMINATION  "High Speed Cart Ram"
  "Catnip Meteor": 5028,      // SU_CN_METEOR        "CN Meteor"
  "Crazy Weed": 2483,         // GN_CRAZYWEED        "Crazy Vines"
  "Combo Finish": 273,        // MO_COMBOFINISH      "Raging Thrust"
  "Chain Combo": 272,         // MO_CHAINCOMBO       "Raging Quadruple Blow"
  "Finger Offensive": 267,    // MO_FINGEROFFENSIVE  "Throw Spirit Sphere"
  "Shield Chain": 480,        // PA_SHIELDCHAIN      "Rapid Smiting"
  "Banishing Point": 2308,    // LG_BANISHINGPOINT   "Vanishing Point"
  "Dragon Breath": 2008,      // RK_DRAGONBREATH     "Dragon's Breath"
  "Dragon Breath - WATER": 5004, // RK_DRAGONBREATH_WATER "Dragon's Water Breath"
  "Hot Barrel": 2568,         // RL_HEAT_BARREL      "Hit Barrel"
  "Wug Strike": 2243,         // RA_WUGSTRIKE        "Warg Strike"
  "Wug Rider": 2241,          // RA_WUGRIDER         "Warg Ride"
  "Nature Friendly": 5325,    // WH_NATUREFRIENDLY   "Nature's Friend"
  "Wind Walk": 383,           // SN_WINDWALK         "Wind Walk" -> "Caminho do Vento"
  "Cold Slower": 2260,        // NC_COLDSLOWER       "Ice Launcher"
  "Musical Strike": 316,      // BA_MUSICALSTRIKE    "Melody Strike"
  "Lion Howling": 2517,       // SR_HOWLINGOFLION    "Lion's Howl"
  "Comet": 2213,              // WL_COMET — the lowest-id "Comet" (708) is a dead/legacy id (404 on the CDN)
  "Comet Amp": 2213,          // amplified-Comet debuff toggle — show as "Cometa"
  "Released": 2230,           // WL_RELEASE          "Lançar Magia"
  "Ignition Break": 2006,     // RK_IGNITIONBREAK — lowest-id "Impacto Flamejante" (740) is dead (404 on the CDN)
  "Ride Dragon": 2007,        // RK_DRAGONTRAINING icon (riding has no dedicated skill/icon)
  "Dragonic Breath": 2008,    // calc-only DK breath (no client skill) — reuse the Dragon Breath icon
  "Shadow Wound": 5293,       // SHC_ENCHANTING_SHADOW "Profanar Arma" — the skill that inflicts the debuff
  "Fatal Manace": 2284,       // SC_FATALMENACE — lowest-id "Ofensiva Fatal" (732) is dead (404 on the CDN)
  "Psychic Wave": 2449,       // reproduced skill — lowest-id "Onda Psíquica" (736) is dead (404)
  "Reverberation": 2414,      // reproduced skill — lowest-id "Ressonância" (725) is dead (404)
  "Genesis Ray": 2321,        // reproduced skill — lowest-id "Luz da Criação" (737) is dead (404)
  "Strip Shadow": 5313,       // ABC_STRIP_SHADOW "Remoção Sombria Total" (client name didn't auto-match)
  "Unlucky Rush": 5315,       // ABC_UNLUCKY_RUSH "Salto Revés" (client typo "Unluck Rush" — no auto-match)
  "Snatcher": 210,            // RG_SNATCHER "Mãos Leves" (didn't auto-match)
  "Plagiarism": 225,          // RG_PLAGIARISM "Plágio" (GRF en-name for 225 is "Intimidate", so no auto-match)
  "Intimidate": 219,          // RG_INTIMIDATE "Rapto" — without this it grabs 225 "Plágio" (en-name collision)
  "Hell Gate": 2343,          // SR_GATEOFHELL "Portões do Inferno" (calc name "Hell Gate" != client "Gates of Hell")
  "Iron Hand": 259,           // MO_IRONHAND "Punhos de Ferro"
  "Gentle Touch - Opposite": 2347, // SR_GENTLETOUCH_CHANGE — client "Chakra da Fúria" (Touch - Change)
  "Gentle Touch - Alive": 2348,    // SR_GENTLETOUCH_REVITALIZE — client "Chakra do Vigor" (Touch - Revitalize)
  "Dodge": 265,               // MO Dodge "Cair das Pétalas" (49 is Thief's Improve Dodge, 420 is TaeKwon's)
  "Sincere Faith": 5242,      // IQ "Mantra da Energia" (one of the 3 mutually-exclusive Faiths)
  "Firm Faith": 5239,         // IQ "Mantra da Saúde"
  "Powerful Faith": 5238,     // IQ "Mantra da Força"
  "Vigor Explosion": 270,     // MO_EXPLOSIONSPIRITS "Fúria Interior" (client en "Explosion Spirits"; bROWiki)
  "Vigor condensation": 261,  // MO_CALLSPIRITS "Invocar Esfera Espiritual" (client en "Call Spirits")
  "Two hand Staff Mastery": 5228, // AG_TWOHANDSTAFF "Perícia com Cajado de Duas Mãos" (client renamed en "Two Staff" -> "Two-handed Staff Mastery", broke the alias)
  "Grand Judgement": 5263,    // IG_GRAND_JUDGEMENT "Lança da Justiça" (client en "Grand Judgment" — calc spells "Judgement")
  "Auto Guard": 249,          // CR_AUTOGUARD "Bloqueio" (client en is just "Guard")
  "Ride Peco": 63,            // KN_RIDING "Montaria" (calc toggle "Ride Peco" != client "Peco Peco Ride")
  "Dancing Lesson": 323,      // DC_DANCINGLESSON "Lições de Dança" (client en "Dance Lessons")
  "Lesson": 2412,             // WM_LESSON "Domínio Musicial" (client en "Voice Lessons")
  "Dart Arrow": 324,          // DC_THROWARROW "Estilingue" (Dancer counterpart of "Musical Strike"; client en "Slinging Arrow")
  "Dance With Wug": 2428,     // WM_DANCE_WITH_WUG "Dança com Lobos" (client en "Dances with Wargs")
  "Circling Nature": 2423,    // WM_SIRCLEOFNATURE "Sibilo de Eir" (client en "Circle of Nature")
  "Stage Manner": 5349,       // TR_STAGE_MANNER "Presença de Palco" (client en "Stage Etiquette")
  "Musical Lesson": 315,      // BA_MUSICALLESSON "Lições de Música" (client en "Music Lessons")
  "Rush To Windmill": 2381,   // MI_RUSH_WINDMILL "Sinfonia dos Ventos" (client en "Windmill Rush")
  "Framen": 5284,             // CD_FRAMEN "Flamen" (calc spells "Framen"; client/divine-pride en+pt are "Flamen")
  "Learning Potion": 227,     // AM_LEARNINGPOTION "Pesquisa de Poções" (client en "Potion Research"; calc label "Learn Potion")
  "Acid Demonstration": 490,  // CR_ACIDDEMONSTRATION "Bomba Ácida" (calc label "Acid Bomb"; same skill as the atk "Acid Bomb")
  "Bio Cannibalize": 232,     // AM_CANNIBALIZE "Criar Monstro Planta" (client en "Summon Flora")
  "Two Hand Defending": 5300, // MT_TWOHANDDEF "Defesa com Machado" (client en didn't auto-match)
  "Mandragora Howling": 2492, // GN_MANDRAGORA "Grito da Mandrágora" — lowest-id "Mandragora Howl" (735 NPC_MANDRAGORA) is a dead icon (404)
  "Lava Flow": 5006,          // NC_MAGMA_ERUPTION "Erupção de Magma" — lowest-id "Lava Flow" (733 NPC_MAGMA_ERUPTION) is a dead icon (404)
  "On Magogear": 2255,        // NC_MADOLICENCE "Licença de Pilotagem" (mount-state toggle; reuses the license skill icon)
  "Power Maximize": 114,      // BS_MAXIMIZE "Amplificar Poder" (calc label "P.Maximize"; client en "Maximize Power")
  "Lightning Loader": 282,    // SA_LIGHTNINGLOADER "Encantar com Ventania" (client en "Endow Tornado")
  "Frost Weapon": 281,        // SA_FROSTWEAPON "Encantar com Geada" (client en "Endow Tsunami")
  "Seismic Weapon": 283,      // SA_SEISMICWEAPON "Encantar com Terremoto" (client en "Endow Quake")
  "Advanced Book": 274,       // SA_ADVANCEDBOOK "Estudo de Livros" (calc label "Adv Book"; client en "Study")
  "Auto Spell": 279,          // SA_AUTOSPELL "Desejo Arcano" (client en "Hindsight")
  "Run": 411,                 // TK_RUN "Corrida" (client en "Sprint")
  "Seven Wind": 425,          // TK_SEVENWIND "Brisa Leve" (client en "Mild Wind")
  "Power": 424,               // TK_POWER "Kihop" (calc label "Power"; the (lv*15+10)% ATK buff)
  "Knowledge of Sun, Moon and Star": 443, // SG_KNOWLEDGE "Transmissão Solar, Lunar e Estelar" (en "Solar, Lunar and Stellar Courier")
  "Fusion of Sun, Moon and Star": 444,    // SG_FUSION "União Solar, Lunar e Estelar" (calc label was raw Thai "ตัวลอย")
  "Blessing of Sun": 438,     // SG_SUN_BLESS "Bênção Solar"
  "Blessing of Moon": 439,    // SG_MOON_BLESS "Bênção Lunar"
  "Blessing of Star": 440,    // SG_STAR_BLESS "Bênção Estelar"
  "Eswhoo": 2604,             // SP_SWHOO "Eswhoo" (Soul Reaper; client en "Eswoo")
  "Silvervine Stem Spear": 5026, // SU_SV_STEMSPEAR "Lança Gateira" (client en "SV Stem Spear")
  "Silvervine Root Twist": 5029, // SU_SV_ROOTTWIST "Hera Venenosa" (client en "SV Root Twist")
  "Arclouse Dash": 5035,      // SU_ARCLOUSEDASH "Impulso de Arclouse" (client en "Arclouze Dash")
  "Frash Shrimp": 5041,       // SU_FRESHSHRIMP "Camarão Fresquinho" (calc typo "Frash"; client en "Fresh Shrimp")
  "Power of Flock": 5045,     // SU_POWEROFFLOCK "Intimidar" (client en "Power Of Lock")
  "Sprit Of Life": 5052,      // SU_SPIRITOFLIFE "Invocação da Fauna" (client en "Spirit Of Life")
  "Spirit of Savage": 5046,   // SU_SVG_SPIRIT "Ataque Selvagem" (client en "Sprit Of Savage")
  "Wrath of": 437,            // SG_STAR_ANGER "Fúria Estelar" — calc's ATK bonus (BaseLv+LUK+DEX+STR-vs-Large)/3 uniquely uses FOR, which only Fúria Estelar does
};

// Calc names that render an 'item' icon instead of a skill icon. The Rune Knight
// rune toggles show the rune-stone item icon (bROWiki) — the effect-skill icon for
// Lux Anima (skill 5005) isn't served by ragassets, and a rune-stone icon fits a
// "Runa: X" toggle better anyway. id = divine-pride item id, iconType is baked into
// the output so the UI requests /icons/item/{id}.png.
const SKILL_ICON_OVERRIDES = {
  "Turisus Runestone": { id: 12731, iconType: "item" }, // Thurisaz rune -> Força Titânica
  "Asir Runestone": { id: 12729, iconType: "item" },    // Othila rune   -> Aura de Combate
  "Lux Anima Runestone": { id: 22540, iconType: "item" }, // Luxanima rune -> Luz da Alma
};

// Calc names whose displayed pt-BR label we pin by hand, overriding the
// divine-pride name resolved from the id. Used for the Rune Knight rune toggles
// (show the rune name from bROWiki rather than the rune's effect-skill name) and
// the Ride Dragon mount toggle.
const SKILL_PT_NAME_OVERRIDES = {
  "Ride Dragon": "Montar Dragão",
  "Dragonic Breath": "Sopro Draconiano", // distinct from Dragon Breath ("Sopro do Dragão")
  "Shadow Wound": "Profanação",          // official client status name inflicted by Profanar Arma (Enchanting Shadow)
  "Turisus Runestone": "Runa: Thurisaz",
  "Asir Runestone": "Runa: Othila",
  "Lux Anima Runestone": "Runa: Luxanima",
};

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--grf") out.grf = argv[++i];
    else if (argv[i] === "--dp") out.dp = argv[++i];
    else if (argv[i] === "--report") out.report = true;
  }
  return out;
}

function grfLub(grf, base) {
  const e = findBestEntry(grf, `${base}.lub`) ?? findBestEntry(grf, `${base}.lua`);
  return e ? extractFile(grf, e) : null;
}

// Run skillid.lub + the given skillinfolist through the VM and read id -> SkillName.
function extractSkillNames(grf, listBase) {
  const skillId = grfLub(grf, `${SKILLINFOZ}/skillid`);
  const skillInfo = grfLub(grf, listBase);
  if (!skillId || !skillInfo) return null;
  const g = new LuaTable();
  runChunkInto(skillId, g);
  runChunkInto(skillInfo, g);
  let best = null, bestSize = -1;
  for (const [k, v] of g.map) {
    if (k === "SKID") continue;
    if (v instanceof LuaTable && v.map.size > bestSize) { best = v; bestSize = v.map.size; }
  }
  const out = {};
  if (best) {
    for (const [id, entry] of best.map) {
      if (typeof id !== "number" || !(entry instanceof LuaTable)) continue;
      const name = decodeClientString(entry.get("SkillName"));
      if (name) out[id] = name.trim();
    }
  }
  return out;
}

// Read one `<VAR> = [ ... ] as const;` string array out of skill-name.ts.
function readSkillNamesArray(varName) {
  const src = readFileSync(resolve(process.cwd(), "src/app/constants/skill-name.ts"), "utf8");
  const block = src.split(`${varName} = [`)[1].split("] as const;")[0];
  return [...block.matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);
}

// Every calc skill name we want a pt-BR label + icon id for: the offensive
// (atkSkill) names AND the active/passive skill names shown in the
// "learn for bonuses" / "activating skills" panels. `_`-prefixed names are
// calc-internal pseudo-skills (no real client skill / icon) — drop them so
// they don't norm-match an unrelated id.
function readSkillNames() {
  const names = [
    ...readSkillNamesArray("OFFENSIVE_SKILL_NAMES"),
    ...readSkillNamesArray("ACTIVE_PASSIVE_SKILL_NAMES"),
  ].filter((n) => n && !n.startsWith("_"));
  return [...new Set(names)];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const grfPath = resolve(args.grf ?? DEFAULT_GRF);
  const dpPath = resolve(process.cwd(), args.dp ?? DEFAULT_DP);

  // divine-pride id -> pt name (preferred pt source).
  let dpPt = {};
  if (existsSync(dpPath)) {
    const raw = JSON.parse(readFileSync(dpPath, "utf8"));
    for (const [id, v] of Object.entries(raw)) if (v && v.name) dpPt[id] = v.name;
    console.log(`divine-pride pt: ${Object.keys(dpPt).length} skills (${dpPath})`);
  } else {
    console.warn(`! divine-pride file not found at ${dpPath} — falling back to GRF pt only`);
  }

  const grf = openGrf(grfPath);
  try {
    const ptGrf = extractSkillNames(grf, `${SKILLINFOZ}/skillinfolist_ptbr`) ?? {};
    let en = null, enFrom = null;
    for (const base of ["skillinfolist_enus", "skillinfolist_us", "skillinfolist_en"]) {
      const m = extractSkillNames(grf, `${SKILLINFOZ}/${base}`);
      if (m && Object.keys(m).length && m[28] && m[28] !== ptGrf[28]) { en = m; enFrom = base; break; }
    }
    if (!en) throw new Error("could not find an English skillinfolist in the GRF");
    console.log(`GRF English list (${enFrom}): ${Object.keys(en).length} skills`);

    // english name -> id (lowest id wins: integer keys iterate ascending, so the
    // base skill beats its high-id clone).
    const enToId = {};
    const normToId = {};
    for (const [id, name] of Object.entries(en)) {
      if (!name) continue;
      if (!(name in enToId)) enToId[name] = Number(id);
      const nk = norm(name);
      if (!(nk in normToId)) normToId[nk] = Number(id);
    }

    const ptById = (id) => dpPt[id] ?? ptGrf[id] ?? null;

    const names = readSkillNames();
    const out = {};
    const unmatched = [];
    let exact = 0, alias = 0, normd = 0, override = 0;

    for (const name of names) {
      // item-icon toggles (rune stones): bake the item id + iconType, label from the override.
      if (name in SKILL_ICON_OVERRIDES) {
        const { id, iconType } = SKILL_ICON_OVERRIDES[name];
        out[name] = { id, name: SKILL_PT_NAME_OVERRIDES[name] || name, iconType };
        override++;
        continue;
      }

      let id;
      if (name in SKILL_ID_OVERRIDES) { id = SKILL_ID_OVERRIDES[name]; override++; }
      else if (name in enToId) { id = enToId[name]; exact++; }
      else if (SKILL_NAME_ALIASES[name] && enToId[SKILL_NAME_ALIASES[name]]) { id = enToId[SKILL_NAME_ALIASES[name]]; alias++; }
      else if (normToId[norm(name)]) { id = normToId[norm(name)]; normd++; }

      if (id == null) { unmatched.push(name); continue; }

      const pt = ptById(id);
      out[name] = { id, name: SKILL_PT_NAME_OVERRIDES[name] || pt || name };
    }

    const outPath = resolve(process.cwd(), "src/assets/demo/data/latam-skills.json");
    writeFileSync(outPath, JSON.stringify(out));

    const total = names.length;
    const matched = total - unmatched.length;
    console.log(`\nwrote ${outPath}`);
    console.log(`calc skills (offensive + active/passive): ${total}`);
    console.log(`  matched: ${matched} (${Math.round((matched / total) * 100)}%) — exact ${exact}, alias ${alias}, norm ${normd}, override ${override}`);
    console.log(`  unmatched (left English): ${unmatched.length}`);
    if (args.report && unmatched.length) {
      console.log("\nunmatched calc skill names:");
      for (const n of unmatched.sort()) console.log("  " + n);
    }
  } finally {
    closeGrf(grf);
  }
}

main();
