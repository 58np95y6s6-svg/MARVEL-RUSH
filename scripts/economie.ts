// Simulation de l'économie (docs/equilibrage.md §6) : npx vite-node scripts/economie.ts [-- --seeds 20 --days 400 --k 1]
// Joue un joueur régulier avec les vraies règles (src/meta/economySim.ts) et affiche les jalons moyens.
import { daysPerTenPull, simulateEconomy, type SimResult } from '../src/meta/economySim';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string, d: number) => { const i = argv.indexOf(n); return i >= 0 ? Number(argv[i + 1]) : d; };
const seeds = opt('--seeds', 20), days = opt('--days', 400), k = opt('--k', 1);

const avg = (xs: (number | null)[]) => {
  const ok = xs.filter((x): x is number => x !== null);
  return { mean: ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null, missed: xs.length - ok.length };
};
const runs = (focus: 'rare' | 'legendaire'): SimResult[] => Array.from({ length: seeds }, (_, i) => simulateEconomy({ days, seed: 1000 + i, focus, k }));
const rare = runs('rare'), leg = runs('legendaire');
const star1 = avg(rare.map((r) => r.firstStar1));
const star5 = avg(rare.map((r) => r.rareStar5));
const star10 = avg(leg.map((r) => r.legendaryStar10));
console.log(`Économie, ${seeds} joueurs × ${days} jours, k = ${k}`);
console.log(`Premier ★1 : jour ${star1.mean}  ·  ★5 sur un Rare : jour ${star5.mean} (${star5.missed} ratés)  ·  ★10 Légendaire : jour ${star10.mean} (${star10.missed} pas atteint)`);
for (const [a, b] of [[1, 30], [31, 90], [91, 240], [241, days]] as [number, number][]) {
  const per = rare.map((r) => daysPerTenPull(r, a, b));
  console.log(`Jours ${a}-${b} : un lot de 10 acheté tous les ${(per.reduce((x, y) => x + y, 0) / per.length).toFixed(1)} jours`);
}
console.log('Tirages ouverts (achetés + offerts), en lots de 10 :');
for (const [a, b] of [[1, 7], [8, 14], [15, 30], [31, 90], [91, 240]] as [number, number][]) {
  if (b > days) break;
  const pulls = rare.reduce((n, r) => n + (r.days[b - 1]!.pulls - (a > 1 ? r.days[a - 2]!.pulls : 0)), 0) / rare.length;
  const bought = rare.reduce((n, r) => n + r.tenPulls.filter((d) => d >= a && d <= b).length, 0) / rare.length;
  console.log(`  Jours ${a}-${b} : ${(pulls / 10).toFixed(1)} lots (${bought.toFixed(1)} achetés) · ${(pulls / 10 / (b - a + 1)).toFixed(2)} lot/jour · un lot tous les ${((b - a + 1) / (pulls / 10)).toFixed(1)} jours`);
}
for (let i = 0; i < rare[0]!.income.length; i++) {
  const m = (f: (x: SimResult['income'][number]) => number) => Math.round(rare.reduce((n, r) => n + f(r.income[i]!), 0) / rare.length);
  const x = rare[0]!.income[i]!;
  console.log(`Revenu jours ${x.from}-${x.to} : ${m((y) => y.gold)} or · ${m((y) => y.gems)} gemmes · ${m((y) => y.crystals)} ✦ par jour`);
}
const lv = (d: number) => Math.round(rare.reduce((n, r) => n + (r.days[d - 1]?.level ?? 0), 0) / rare.length);
const dl = (d: number) => (rare.reduce((n, r) => n + (r.days[d - 1]?.deckLevel ?? 0), 0) / rare.length).toFixed(1);
console.log(`Niveau moyen du deck : J7 ${dl(7)}, J21 ${dl(21)}, J30 ${dl(30)}, J60 ${dl(60)}, J90 ${dl(90)}`);
console.log(`Niveau de compte : J7 ${lv(7)}, J30 ${lv(30)}, J90 ${lv(90)}, J240 ${lv(240)} · héros possédés à la fin : ${Math.round(rare.reduce((n, r) => n + r.heroes, 0) / rare.length)}`);
console.log('Sources, jours 1-30 (moyenne par jour) :');
const names = Object.keys(rare[0]!.sources);
for (const n of names) {
  const m = (k: 'gold' | 'gems' | 'crystals') => Math.round(rare.reduce((a, r) => a + (r.sources[n]?.[k] ?? 0), 0) / rare.length / 30);
  console.log(`  ${n.padEnd(34)} ${String(m('gold')).padStart(6)} or ${String(m('gems')).padStart(5)} gemmes ${String(m('crystals')).padStart(4)} ✦`);
}
