// Page de prévisualisation des personnages (#dev/art) : toutes les unités, poses, jetons et skins,
// les boss (dont Thanos), leurs sbires et les ennemis génériques, sur le fond gris des planches.
import type { BossId, UnitId } from '../data/types';
import {
  unitSvg, tokenSvg, bossSvg, minionSvg, enemySvg, uniqueSvg, loadTexture,
  unitName, unitRarity, unitTint, bossName, bossTint, minionName,
  UNIT_IDS, BOSS_IDS, RARITY_COLORS, UNIT_FRAME, TOKEN_FRAME, type Skin,
} from './index';

const CSS = `
.mr-art{--ink:#1d1733;--muted:#5e5976;--edge:#d2d1dc;min-height:100vh;background:#e2e2e8;color:var(--ink);
  font-family:Nunito,"Segoe UI",system-ui,sans-serif;font-weight:600;
  background-image:radial-gradient(circle,rgba(29,23,51,.06) 1.2px,transparent 1.3px);background-size:14px 14px;padding:20px 16px 48px;box-sizing:border-box}
.mr-art *{box-sizing:border-box}
.mr-art h1{font-family:"Lilita One","Arial Rounded MT Bold",sans-serif;font-weight:400;font-size:clamp(2rem,7vw,3.4rem);margin:0;color:#f6c64a;line-height:1;
  text-shadow:3px 0 var(--ink),-3px 0 var(--ink),0 3px var(--ink),0 -3px var(--ink),2px 2px var(--ink),-2px -2px var(--ink),2px -2px var(--ink),-2px 2px var(--ink),0 6px 0 #b8322f,0 9px 0 var(--ink)}
.mr-art h1 span{color:#e8413b}
.mr-art h2{font-family:"Lilita One","Arial Rounded MT Bold",sans-serif;font-weight:400;font-size:1.5rem;margin:28px 0 10px;letter-spacing:.02em}
.mr-art .sub{color:var(--muted);margin:12px 0 0;font-size:.9rem}
.mr-art .grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr))}
.mr-art .card{background:#f4f4f8;border:2px solid var(--edge);border-radius:20px;padding:12px;box-shadow:0 4px 0 var(--edge);min-width:0}
.mr-art .top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.mr-art .name{font-family:"Lilita One","Arial Rounded MT Bold",sans-serif;font-size:1.15rem}
.mr-art .chip{font-family:"Lilita One","Arial Rounded MT Bold",sans-serif;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;padding:2px 9px;border-radius:999px;color:#fff;background:var(--ink)}
.mr-art .id{color:var(--muted);font-size:.75rem}
.mr-art .row{display:grid;gap:6px;grid-template-columns:repeat(3,minmax(0,1fr))}
.mr-art .tile{aspect-ratio:${UNIT_FRAME.viewBox[2]}/${UNIT_FRAME.viewBox[3]};border-radius:14px;border:2px solid var(--edge);overflow:hidden}
.mr-art .tile svg,.mr-art .tok svg,.mr-art .sq svg{display:block;width:100%;height:100%}
.mr-art figure{margin:0;display:flex;flex-direction:column;gap:3px;min-width:0}
.mr-art figcaption{font-family:"Lilita One","Arial Rounded MT Bold",sans-serif;font-size:.66rem;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);text-align:center}
.mr-art .toks{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}
.mr-art .tok{width:64px;height:64px}
.mr-art .neon{background:radial-gradient(circle at 50% 38%,#3a3166 0,#141024 90%)}
.mr-art .sq{aspect-ratio:1/1;border-radius:14px;border:2px solid var(--edge);overflow:hidden}
.mr-art .boss .row{grid-template-columns:repeat(3,minmax(0,1fr))}
.mr-art .mins{display:grid;gap:6px;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:8px}
.mr-art .enemies{display:grid;gap:8px;grid-template-columns:repeat(5,minmax(0,1fr))}
.mr-art .pixi{background:#f4f4f8;border:2px solid var(--edge);border-radius:20px;padding:8px;overflow:hidden}
.mr-art .pixi canvas{display:block;max-width:100%;height:auto}
`;

const svgIn = (svg: string): string => uniqueSvg(svg);
const RARITY_LABEL = { rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' } as const;
const POSE_LABEL = ['Repos', 'Préparation', 'Frappe'] as const;

function unitCard(id: UnitId): string {
  const [t1] = unitTint(id);
  const rar = unitRarity(id);
  const bg = `background:radial-gradient(circle at 50% 38%,#fff 0,${t1} 85%)`;
  const poses = ([0, 1, 2] as const).map((p) => `<figure><div class="tile" style="${bg}">${svgIn(unitSvg(id, p))}</div><figcaption>${POSE_LABEL[p]}</figcaption></figure>`).join('');
  const skins = (['hiver', 'neon'] as Skin[]).map((s) =>
    `<figure><div class="tile ${s === 'neon' ? 'neon' : ''}" style="${s === 'neon' ? '' : 'background:radial-gradient(circle at 50% 38%,#fff 0,#d6ecfb 85%)'}">${svgIn(unitSvg(id, 2, s))}</div><figcaption>${s === 'neon' ? 'Néon' : 'Hiver'}</figcaption></figure>`).join('');
  const toks = [1, 4, 7].map((r) => `<div class="tok" title="rang ${r}">${svgIn(tokenSvg(id, r))}</div>`).join('') +
    (['hiver', 'neon'] as Skin[]).map((s) => `<div class="tok" title="${s}">${svgIn(tokenSvg(id, 3, s))}</div>`).join('');
  return `<article class="card"><div class="top"><span class="name">${unitName(id)}</span><span class="chip" style="background:${RARITY_COLORS[rar]}">${RARITY_LABEL[rar]}</span><span class="id">${id}</span></div>
    <div class="row">${poses}</div><div class="row" style="margin-top:6px;grid-template-columns:repeat(3,minmax(0,1fr))">${skins}<figure><div class="tile" style="${bg}">${svgIn(unitSvg(id, 0, 'classique'))}</div><figcaption>Classique</figcaption></figure></div>
    <div class="toks">${toks}</div></article>`;
}

function bossCard(id: BossId): string {
  const [t1, t2] = bossTint(id);
  const bg = `background:radial-gradient(circle at 50% 40%,${t1} 0,${t2} 100%)`;
  const poses = ([0, 1, 2] as const).map((p) => `<figure><div class="sq" style="${bg}">${svgIn(bossSvg(id, p, { bg: true }))}</div><figcaption>${['Repos', 'Préparation', 'Pouvoir'][p]}</figcaption></figure>`).join('');
  const mins = ([0, 1, 2] as const).map((p) => `<figure><div class="sq" style="background:radial-gradient(circle at 50% 40%,#fff 0,#e9e6f2 100%)">${svgIn(minionSvg(id, p))}</div><figcaption>${['Marche 1', 'Marche 2', 'Action'][p]}</figcaption></figure>`).join('');
  return `<article class="card boss"><div class="top"><span class="name">${bossName(id)}</span><span class="chip" style="background:#c0263a">Boss</span><span class="id">Sbires · ${minionName(id)}</span></div>
    <div class="row">${poses}</div><div class="mins">${mins}</div></article>`;
}

function enemiesCard(): string {
  const kinds = ['normal', 'rapide', 'gros', 'blinde', 'bouclier'] as const;
  const fams = ['Créature-feuille', 'Slime', 'Robot'];
  return `<article class="card">${[0, 1, 2].map((v) => `<div class="top" style="margin-top:6px"><span class="name">${fams[v]}</span><span class="id">variant ${v}</span></div><div class="enemies">${kinds
    .map((k) => `<figure><div class="sq" style="background:#fbfbfd">${svgIn(enemySvg(k, v))}</div><figcaption>${k}</figcaption></figure>`).join('')}</div>`).join('')}</article>`;
}

/** Vérifie la chaîne SVG → texture PixiJS (netteté selon la densité de l'écran). */
async function mountPixi(host: HTMLElement): Promise<void> {
  const { Application, Sprite } = await import('pixi.js');
  const app = new Application();
  await app.init({ width: 640, height: 180, background: '#f4f4f8', resolution: Math.min(3, window.devicePixelRatio || 1), autoDensity: true, antialias: true });
  host.appendChild(app.canvas);
  const ids: UnitId[] = ['ironman', 'thor', 'moana', 'buzzwoody'];
  let x = 10;
  for (const [i, id] of ids.entries()) {
    const tex = await loadTexture(unitSvg(id, (i % 3) as 0 | 1 | 2), 140);
    const s = new Sprite(tex);
    s.anchor.set(UNIT_FRAME.anchor[0], UNIT_FRAME.anchor[1]);
    s.position.set(x + 70, 150);
    app.stage.addChild(s);
    x += 120;
  }
  for (const [i, r] of [1, 4, 7].entries()) {
    const tex = await loadTexture(tokenSvg('spiderman', r), 56);
    const s = new Sprite(tex);
    s.anchor.set(TOKEN_FRAME.anchor[0], TOKEN_FRAME.anchor[1]);
    s.position.set(520 + (i % 2) * 60, 40 + i * 50);
    app.stage.addChild(s);
  }
}

export function mountArtPreview(root: HTMLElement): void {
  root.innerHTML = `<style>${CSS}</style><div class="mr-art">
    <h1>MARVEL <span>RUSH</span></h1>
    <p class="sub">Direction artistique · ${UNIT_IDS.length} héros, ${BOSS_IDS.length} boss, sbires et ennemis génériques. Code de dessin extrait des planches.</p>
    <h2>Héros</h2><div class="grid">${UNIT_IDS.map(unitCard).join('')}</div>
    <h2>Boss et sbires</h2><div class="grid">${BOSS_IDS.map(bossCard).join('')}</div>
    <h2>Ennemis génériques</h2>${enemiesCard()}
    <h2>Textures PixiJS</h2><div class="pixi" id="mr-art-pixi"></div>
  </div>`;
  const host = root.querySelector<HTMLElement>('#mr-art-pixi');
  if (host) {
    mountPixi(host).catch((e: unknown) => {
      host.textContent = `Textures indisponibles : ${e instanceof Error ? e.message : String(e)}`;
    });
  }
}
