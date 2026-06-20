---
name: add-ro-monster
description: Add one or more monsters to the calculator's monster.json from their in-game ids — pulls the full stat block from divine-pride (authenticated LATAM) and the dbname from the GRF, then groups them by spawn map. Use when a monster is missing from the calc's target/monster picker, e.g. new instance mobs, or any "monstro não está no banco de dados" situation.
---

# Add monster(s) to the calculator DB

A monster the calc can target must be a record in `src/assets/demo/data/monster.json`
(keyed by id). This skill turns a monster **id** into a complete record: stats from
divine-pride + `dbname` from the GRF, grouped under its spawn map in the picker.

## What the calc actually uses (so you know what must be right)
`Monster.setData` in [monster.ts](src/app/domain/monster.ts) reads only `name` and
`stats.{level, health, defense, magicDefense, res, mres, str, agi, vit, int, dex, luk,
elementName, raceName, scaleName, class, mvp}`. Everything else (softDef/softMDef,
the flee-equivalent `hitRequireFor100 = 200 + level + agi`, criShield…) is **derived**.
Crucially it parses the **English name strings** `elementName` ("Dark 3"),
`raceName` ("Undead"), `scaleName` ("Medium") — not the numeric codes. So those three
strings must be the calc's exact English vocab (race uses **DemiHuman**, not "Human").

## Where the data comes from
- **GRF** (`data.grf`) → `dbname` (aegis) via `npcidentity.lub` (`JT_<AEGIS>` → id; strip `JT_`).
  The client carries **no** mob stats and **no** instance spawns (`navi_mob` excludes
  instance mobs), so that's all the GRF gives. `System/mapInfo.lub` (decode with
  `tools/lua51.mjs`) maps a map code → pt-BR display name, for the spawn-group label.
- **divine-pride** (`/database/monster/<id>`, `lang=en`) → the full stat block. LATAM
  mobs are **gated behind login** (anonymous shows "account/login" + `Unknown name`),
  so the fetch carries a logged-in session from **`.dp-cookies.json`** (git-ignored,
  repo root — same session the add-ro-item skill uses). The "Default" server values
  ARE the LATAM ones (HP matches the dp-monster scrape). We read `lang=en` so the
  element/race/size strings come back as the calc's English vocab. The `og:title`
  prefix gives boss-ness: `Monster:` → class 0; `MVP:`/`Mini:` → class 1 (mvp=1 only for MVP).
- **spawn map** is NOT machine-derivable for instance mobs (DP lists no spawn; client
  navi excludes them; `mapInfo.lub` can't tell instance variants apart). You set it.

`.dp-cookies.json` shape (never commit — it's the user's live credentials):
```json
{ "ASPXAUTH": "<.ASPXAUTH>", "ASP.NET_SessionId": "<id>", "lang": "pt" }
```
If it's missing or expired, ask the user to paste `.ASPXAUTH` + `ASP.NET_SessionId`
from a logged-in browser (DevTools → Application → Cookies → divine-pride.net).

## Procedure

### 1. Extract
```
node .claude/skills/add-ro-monster/extract.mjs <id> [<id> ...]
```
Prints a per-mob summary (name, dbname, level, race/size/element, HP, DEF/MDEF, stats),
a divine-pride URL, and warnings (unmapped race/element/size, or a Korean name). Writes
the records array to `<os tmp>/latam-monster-recs.json` with `spawn: "TBD"`.
**Cross-check:** the calc's `200 + level + agi` should equal DP's "Req. Hit" on the page
— a quick sanity check that level/agi parsed right.

### 2. Spawn + group (the "grouped by map code" step)
For each record, set the top-level **`spawn`** to the instance's map code (e.g.
`1@gl_kh`). All mobs of the same instance share one code. Then add a
group entry in [monster-spawn-mapper.ts](src/app/constants/monster-spawn-mapper.ts):
```ts
'1@gl_kh': 'Glastheim Infernal',
```
The key is the spawn code; the value is the pt-BR label shown as the picker group
header (`getMonsterSpawnMap` maps code → label; an unmapped code renders as "undefined").
Confirm the **map code** and **label** with the user — neither is reliably derivable
(`mapInfo.lub` gives candidate codes + their pt-BR names, but can't pick the right
instance variant).

### 3. Name
The displayed name comes from the **`latam-monsters.json`** overlay (RoService applies
it onto monster.json at runtime); the record's `name` stays the English base, matching
all other monsters. DP frequently has **no pt-BR name** for new mobs — and for the
newest ones not even an English one (it serves Korean; the extractor warns on that).
Do **not** invent a pt-BR name, derive one from the aegis, or scrape one from elsewhere.

When no pt-BR name is available, **keep the English name** (if the overlay holds a
Korean string, replace it with the English base name) and **report the gap to the user**
so they can supply the official label. Only write a pt-BR name into the overlay when the
user provides it:
```
node -e "const fs=require('fs');const F='src/assets/demo/data/latam-monsters.json';const o=JSON.parse(fs.readFileSync(F,'utf8'));o['<id>']='<name from user>';fs.writeFileSync(F,JSON.stringify(o));"
```
(Keep `latam-monsters.json` single-line/minified. See [[no-guessing-translations]],
[[latam-localization]].)

### 4. Apply
```
node .claude/skills/add-ro-monster/apply.mjs <os tmp>/latam-monster-recs.json
```
Appends the records to `monster.json` with a minimal diff (the file is keyed by id;
a full re-stringify would reorder all 300+ entries). It refuses `spawn:"TBD"` (pass
`--allow-tbd` only for a throwaway test) and skips ids already present. New ids land at
the end of the file — fine, the file is keyed, not ordered.

### 5. Verify
- Dev preview recompiles; confirm `✔ Compiled successfully` in its logs.
- The served data has the mobs: `curl -s localhost:4200/assets/demo/data/monster.json`.
- In the calc: the monster/target picker shows the new group (the spawn label) with the
  mobs; selecting one shows the right level/element/race/size/DEF.
- Re-run `extract.mjs <id>` then `apply.mjs` → it should report "already in monster.json".

## Rules & gotchas
- One record per id; `id` + `stats.{elementName,raceName,scaleName}` are required and
  must use the calc's **English** vocab (apply.mjs enforces their presence).
- DP "Human" → `raceName: "DemiHuman"` (the extractor maps this; watch for other label
  drift if DP changes vocab — the extractor warns on an unmapped race/element/size).
- `element`/`scale`/`race` **numeric** codes are filled for format parity but the calc
  ignores them — don't sweat them; the name strings are what matter.
- Keep `spawn` as the real instance map code when known; the grouping label lives in
  monster-spawn-mapper.ts, not in the record.
- An id may **already be in monster.json** (the base set runs to ~21601) — `apply.mjs`
  skips it, and the existing record is often *more* authoritative than DP's gated page
  (e.g. MVPs whose `mvp`/`class`/`res`/`mres` DP understates). Don't overwrite it; if the
  user wants it grouped, just set that record's `spawn` (e.g. 21361 → `1@advs`).
- DP's `og:title` mislabels some MVPs as `Monster:` — the extractor instead keys MVP off
  the "MVP Exp/Reward" block. `res`/`mres` live in cells that end in `%)` (e.g.
  "249 Res (-30.69%)"), parsed by leading number — not by a label-suffix match.
- Never commit `.dp-cookies.json`. Delete any scratch HTML/temp files when done.
