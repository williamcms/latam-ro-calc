#!/usr/bin/env node
// Build pt-BR monster names from ragreplaystats' Divine Pride scrape.
//
// ragreplaystats/tools/scrape-dp.mjs walks Divine Pride's monster database with
// the "pt-BR" Accept-Language header and writes public/db/dp-monster.json
// ({ "<id>": { name, hp, level } }). That IS the LATAM monster-name source
// (same kRO/DP mob ids the calculator's monster.json uses). This script slims
// it to an id -> pt-BR name map that RoService overlays at runtime.
//
// Usage: node tools/build-latam-monsters.mjs [path/to/dp-monster.json]

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = process.argv[2] ?? "C:\\Users\\adson\\dev\\ragreplaystats\\public\\db\\dp-monster.json";
const OUT = resolve(process.cwd(), "src/assets/demo/data/latam-monsters.json");

const db = JSON.parse(readFileSync(SRC, "utf8"));
const out = {};
for (const [id, rec] of Object.entries(db)) {
  if (rec && rec.name) out[id] = rec.name;
}
writeFileSync(OUT, JSON.stringify(out));
console.log(`latam-monsters.json — ${Object.keys(out).length} pt-BR monster names (from ${SRC})`);
