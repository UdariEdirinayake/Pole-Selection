import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const indexPath = path.join(rootDir, 'docs/reference/index.html');
const html = fs.readFileSync(indexPath, 'utf-8');

// Extract the Calc module definition (lines ~10424 to ~13988)
// and helper functions: hvabcFlagsForList, hvabcLevelFlags, clearanceBandLabel, normalizeConfigRow, findEquipmentRow, parseEquipmentKva
const sandbox = {
  console: console,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  parseInt: parseInt,
  parseFloat: parseFloat,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
};

vm.createContext(sandbox);

// Extract helper functions and Calc module from html
const helpersScript = `
function hvabcFlagsForList(list) {
  const ns = (list || []).map(x => {
    const t = String(x == null ? '' : x).trim();
    const n = parseFloat(t);
    return Number.isFinite(n) ? String(n) : t;
  });
  return ns.map((n, i) => {
    if (n !== '1') return false;
    const nx = ns.slice(i + 1);
    if (!nx.length || nx[0] !== '2') return true;
    if (nx[1] === '4' || (nx[1] === '2' && nx[2] === '2')) return true;
    return false;
  });
}
function hvabcLevelFlags(cfg) {
  if (!cfg) return { HH: [], H: [] };
  if (typeof normalizeConfigRow === 'function') normalizeConfigRow(cfg);
  return {
    HH: hvabcFlagsForList(splitSemiList(cfg.n_per_level_33kV)),
    H: hvabcFlagsForList(splitSemiList(cfg.n_per_level_11kV))
  };
}
function clearanceBandLabel(band, isAbc) {
  if (band === 'HH') return isAbc ? '33kV ABC' : '33kV';
  if (band === 'H') return isAbc ? '11kV ABC' : '11kV';
  return 'LV';
}
function splitSemiList(s) {
  return String(s == null ? '' : s).split(';').map(x => String(x).trim()).filter(x => x !== '');
}
function joinSemiList(arr) {
  return (arr || []).map(x => String(x).trim()).filter(x => x !== '').join(';');
}
function normalizeConfigRow(cfg) {
  if (!cfg || typeof cfg !== 'object') return cfg;
  const nHH = parseInt(cfg.levels_HH, 10) || 0;
  const nH = parseInt(cfg.levels_H, 10) || 0;
  const nL = parseInt(cfg.levels_L, 10) || 0;
  const bandKeys = ['heights_33kV_m', 'n_per_level_33kV', 'heights_11kV_m', 'n_per_level_11kV', 'heights_LV_m', 'n_per_level_LV'];
  const hasBand = bandKeys.some(k => cfg[k] != null && String(cfg[k]).trim() !== '');
  const hasLegacy = (cfg.heights_m != null && String(cfg.heights_m).trim() !== '') ||
    (cfg.n_per_level != null && String(cfg.n_per_level).trim() !== '');
  if (hasBand) {
    const hHH = splitSemiList(cfg.heights_33kV_m);
    const n33 = splitSemiList(cfg.n_per_level_33kV);
    const h11 = splitSemiList(cfg.heights_11kV_m);
    const n11 = splitSemiList(cfg.n_per_level_11kV);
    const hLV = splitSemiList(cfg.heights_LV_m);
    const nLV = splitSemiList(cfg.n_per_level_LV);
    cfg.heights_m = joinSemiList(hHH.concat(h11, hLV));
    cfg.n_per_level = joinSemiList(n33.concat(n11, nLV));
  } else if (hasLegacy) {
    const hs = splitSemiList(cfg.heights_m);
    const ns = splitSemiList(cfg.n_per_level);
    let i = 0;
    cfg.heights_33kV_m = joinSemiList(hs.slice(i, i + nHH));
    cfg.n_per_level_33kV = joinSemiList(ns.slice(i, i + nHH));
    i += nHH;
    cfg.heights_11kV_m = joinSemiList(hs.slice(i, i + nH));
    cfg.n_per_level_11kV = joinSemiList(ns.slice(i, i + nH));
    i += nH;
    cfg.heights_LV_m = joinSemiList(hs.slice(i, i + nL));
    cfg.n_per_level_LV = joinSemiList(ns.slice(i, i + nL));
    cfg.heights_m = joinSemiList(hs);
    cfg.n_per_level = joinSemiList(ns);
  }
  return cfg;
}
function parseEquipmentKva(name) {
  if (name == null || name === '') return 0;
  const s = String(name);
  const m = s.match(/(\\d+(?:\\.\\d+)?)\\s*kVA/i);
  if (m) return parseFloat(m[1]);
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
function findEquipmentRow(list, key) {
  if (!key && key !== 0) return null;
  const rows = list || [];
  const s = String(key).trim();
  let hit = rows.find(t => String(t.equipment || '').trim() === s);
  if (hit) return hit;
  hit = rows.find(t => String(t.kva || '') === s);
  if (hit) return hit;
  const kva = parseEquipmentKva(s);
  if (kva) {
    hit = rows.find(t => parseEquipmentKva(t.equipment) === kva || Number(t.kva) === kva);
  }
  return hit || null;
}
`;

vm.runInContext(helpersScript, sandbox);

// Extract Calc definition block
const calcMatch = html.match(/const Calc\s*=\s*\(\(\)\s*=>\s*\{([\s\S]*?)\}\)\(\);/);
if (!calcMatch) {
  console.error("Could not find Calc module in index.html");
  process.exit(1);
}

const calcSource = `const Calc = (() => {` + calcMatch[1] + `})();\nthis.Calc = Calc;`;
vm.runInContext(calcSource, sandbox);

export function getCalc() {
  return sandbox.Calc;
}

if (process.argv[1] && process.argv[1].endsWith('run_original_calc.mjs')) {
  console.log("Calc loaded successfully in sandbox. Available methods:", Object.keys(sandbox.Calc));
}
