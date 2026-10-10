// Planches des extensions (design/planches/*.html) générées à partir des dessins du jeu (src/art) :
// une carte par personnage avec ses 3 poses (et, pour les Autobots, les 3 poses du mode véhicule),
// son jeton de plateau et sa fiche (rareté, rôle, attaque, compétence).
// Usage : npx vite-node scripts/planche.ts -- <transformers-heros|transformers-mechants|pixar-heros|pixar-mechants> [fichier.html]
import { writeFileSync } from 'node:fs';
import { bossSvg, hasVehicle, minionSvg, tokenSvg, unitSvg, vehicleSvg, uniqueSvg, bossName, minionName, unitTint, bossTint } from '../src/art/index';
import { BOSSES, LIEUTENANTS } from '../src/data/bosses';
import { UNITS, UNIT_LIST } from '../src/data/units';
import type { BossId, Pack, UnitId } from '../src/data/types';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const kind = argv[0] ?? 'transformers-heros';
const FILES: Record<string, string> = {
  'transformers-heros': '8-transformers-heros', 'transformers-mechants': '9-transformers-mechants',
  'pixar-heros': '10-pixar-heros', 'pixar-mechants': '11-pixar-mechants',
};
const out = argv[1] ?? `design/planches/${FILES[kind] ?? kind}.html`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const RAR: Record<string, string> = { rare: 'var(--rare)', epique: 'var(--epi)', legendaire: 'var(--leg)' };
const RLAB: Record<string, string> = { rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' };
const tile = (svg: string, label: string, bg: string) => `<figure><div class="tile" style="background:${bg}">${uniqueSvg(svg)}</div><figcaption>${label}</figcaption></figure>`;

function heroCards(pack: Pack): string {
  return UNIT_LIST.filter((u) => u.pack === pack).map((u, i) => {
    const [t1, t2] = unitTint(u.id as UnitId);
    const bg = `radial-gradient(circle at 50% 36%,#fff 0,${t1} 58%,${t2} 100%)`;
    const poses = ([0, 1, 2] as const).map((p) => tile(unitSvg(u.id, p), ['Repos', 'Préparation', 'Frappe'][p]!, bg)).join('');
    const veh = hasVehicle(u.id) ? ([0, 1, 2] as const).map((p) => tile(vehicleSvg(u.id, p), ['Véhicule', 'Démarrage', 'Attaque'][p]!, bg)).join('') : '';
    const toks = [1, 3, 5, 7].map((r) => `<div class="tok">${uniqueSvg(tokenSvg(u.id, r))}</div>`).join('');
    return `<article class="card" style="--rar:${RAR[u.rarity]}"><div class="top"><span class="num">${String(i + 1).padStart(2, '0')}</span><h2>${esc(u.name)}</h2><span class="chip r">${RLAB[u.rarity]}</span><span class="chip">${esc(u.role)}</span></div>
<p class="txt"><b>${esc(u.ability.name)}.</b> ${esc(u.ability.description)}</p>
<div class="row">${poses}</div>${veh ? `<div class="row">${veh}</div>` : ''}<div class="toks">${toks}</div></article>`;
  }).join('\n');
}

function bossCards(ids: BossId[]): string {
  return ids.map((id, i) => {
    const [t1, t2] = bossTint(id);
    const bg = `radial-gradient(circle at 50% 40%,${t1} 0,${t2} 100%)`;
    const poses = ([0, 1, 2] as const).map((p) => `<figure><div class="sq" style="background:${bg}">${uniqueSvg(bossSvg(id, p, { bg: true }))}</div><figcaption>${['Repos', 'Préparation', 'Pouvoir'][p]}</figcaption></figure>`).join('');
    const mins = ([0, 1, 2] as const).map((p) => `<figure><div class="sq mini">${uniqueSvg(minionSvg(id, p))}</div><figcaption>${['Marche', 'Marche', 'Action'][p]}</figcaption></figure>`).join('');
    const b = BOSSES[id];
    return `<article class="card boss"><div class="top"><span class="num">${String(i + 1).padStart(2, '0')}</span><h2>${esc(bossName(id))}</h2><span class="chip">${esc(b.power.name)}</span></div>
<p class="txt">${esc(b.power.description)}</p><div class="row">${poses}</div>
<p class="txt"><b>${esc(minionName(id))}</b> — ${esc(b.minion.description)} Lieutenant : <b>${esc(LIEUTENANTS[id].name)}</b> (${esc(LIEUTENANTS[id].power.description)})</p>
<div class="row">${mins}</div></article>`;
  }).join('\n');
}

const TITLES: Record<string, [string, string]> = {
  'transformers-heros': ['Autobots', 'Extension Transformers · 15 héros · mode robot et mode véhicule'],
  'transformers-mechants': ['Decepticons', 'Extension Transformers · 5 gros boss, Megatron, Unicron et leurs sbires'],
  'pixar-heros': ['Pixar', 'Extension Pixar · 15 héros (beaucoup de duos)'],
  'pixar-mechants': ['Méchants Pixar', 'Extension Pixar · 5 gros boss, l’Empereur Zurg et leurs sbires'],
};
const [title, sub] = TITLES[kind] ?? [kind, ''];
const body = kind === 'transformers-heros' ? heroCards('transformers')
  : kind === 'transformers-mechants' ? bossCards(['starscream', 'soundwave', 'shockwave', 'devastator', 'blitzwing', 'megatron', 'unicron'])
  : kind === 'pixar-heros' ? heroCards('pixar')
  : kind === 'pixar-mechants' ? bossCards(['syndrome', 'randall', 'lotso', 'hopper', 'muntz', 'zurg'])
  : '';

const html = `<!doctype html>
<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Marvel Rush · ${esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800&display=swap">
<style>
:root{--ink:#1d1733;--muted:#5e5976;--edge:#d2d1dc;--leg:#f2a93b;--epi:#9b59e6;--rare:#3c8bf0;--display:"Lilita One","Arial Rounded MT Bold",sans-serif}
*{box-sizing:border-box}
body{margin:0;background:#e2e2e8;color:var(--ink);font-family:Nunito,"Segoe UI",system-ui,sans-serif;font-weight:600;background-image:radial-gradient(circle,rgba(29,23,51,.06) 1.2px,transparent 1.3px);background-size:14px 14px}
.wrap{max-width:1180px;margin:0 auto;padding:28px 16px 56px}
h1{font-family:var(--display);font-weight:400;font-size:clamp(2.2rem,7vw,4rem);margin:0;color:#f6c64a;line-height:.95;text-shadow:3px 0 var(--ink),-3px 0 var(--ink),0 3px var(--ink),0 -3px var(--ink),2px 2px var(--ink),-2px -2px var(--ink),0 7px 0 #b8322f,0 10px 0 var(--ink)}
.sub{font-family:var(--display);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 22px}
.cards{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(min(100%,540px),1fr))}
.card{background:#f4f4f8;border:2px solid var(--edge);border-radius:24px;padding:14px;box-shadow:0 5px 0 var(--edge);min-width:0}
.top{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.num{font-family:var(--display);color:var(--muted)}
h2{font-family:var(--display);font-weight:400;font-size:1.6rem;margin:0}
.chip{font-family:var(--display);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:999px;background:var(--ink);color:#f6c64a}
.chip.r{background:var(--rar);color:#fff}
.txt{font-size:.84rem;color:#3a3552;margin:8px 0}
.row{display:grid;gap:6px;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:6px}
.tile{aspect-ratio:280/220;border-radius:14px;border:3px solid var(--rar,var(--edge));overflow:hidden}
.sq{aspect-ratio:1/1;border-radius:14px;border:2px solid var(--edge);overflow:hidden}
.sq.mini{aspect-ratio:1/1;background:radial-gradient(circle at 50% 40%,#fff 0,#d8d6e4 100%)}
.tile svg,.sq svg,.tok svg{display:block;width:100%;height:100%}
figure{margin:0;display:flex;flex-direction:column;gap:3px;min-width:0}
figcaption{font-family:var(--display);font-size:.66rem;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);text-align:center}
.toks{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.tok{width:64px;height:64px}
</style>
<div class="wrap"><h1>${esc(title)}</h1><p class="sub">${esc(sub)} — planche générée par scripts/planche.ts à partir de src/art</p>
<section class="cards">${body}</section></div></html>`;
writeFileSync(out, html);
console.log(`${out} : ${(html.length / 1024).toFixed(0)} Ko`);
void UNITS;
