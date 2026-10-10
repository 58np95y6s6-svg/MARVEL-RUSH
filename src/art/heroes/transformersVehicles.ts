// Autobots en mode véhicule (design/planches/8-transformers-heros.html, 2e rangée de chaque carte) :
// camion, voitures, ambulance, moto, porte-voitures et Grimlock en T-rex. Même cadre et mêmes poses que
// les robots (0 repos, 1 démarrage, 2 attaque), tournés vers la droite.
/* eslint-disable */
import { O, f, shaded, gloss, glow, burst, beam, sparks, mirror, type CharDef, type Ctx } from '../primitives';
import { vehicleDraw, impact, autobot, MET, type VehicleOpts } from '../kits/transformers';

const P3 = [{}, {}, {}];

function veh(id: string, name: string, o: VehicleOpts, col: string, hit: (x: Ctx) => string): CharDef {
  return { id, name, poses: P3, draw(this: CharDef, x: Ctx): string { return vehicleDraw(x, o, hit(x), col); } };
}

const flamesHit = (c: string) => `<g class="pop"><path d="M-10 150 Q-30 140 -40 156 Q-30 152 -26 166 Q-44 164 -50 178 L0 178Z" fill="${c}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/></g>`;

export const TF_VEHICLES: CharDef[] = [
  veh('optimus', 'Optimus Prime (camion)', { kind: 'truck', body: '#d8322c', bodyD: '#9b1d27', flames: '#2f5fd0' }, '#ff9a2a',
    () => impact(214, 140, '#ff9a2a')),
  veh('bumblebee', 'Bumblebee (voiture jaune)', { kind: 'beetle', body: '#f6c83a', bodyD: '#c99418', stripes: '#2b2838' }, '#5ad8ff',
    () => `<g class="grow">${beam(196, 146, 236, 140, 5, '#5ad8ff')}</g>` + impact(236, 140, '#5ad8ff')),
  veh('ironhide', 'Ironhide (fourgon)', { kind: 'van', body: '#b8282c', bodyD: '#7e1620', accent: '#6a7088' }, '#ffb347',
    () => impact(214, 150, '#ffb347') + `<g class="ring"><ellipse cx="214" cy="170" rx="34" ry="10" fill="none" stroke="#ffb347" stroke-width="5"/></g>`),
  veh('ratchet', 'Ratchet (ambulance)', { kind: 'ambulance', body: '#eef0f6', bodyD: '#b8bfd0', accent: '#e0323e' }, '#7dffb0',
    () => `<g class="ring"><circle cx="100" cy="140" r="96" fill="none" stroke="#7dffb0" stroke-width="5" opacity=".6"/></g>`),
  veh('jazz', 'Jazz (voiture de sport)', { kind: 'sport', body: '#eef0f6', bodyD: '#b8bfd0', stripes: '#3a8ae0' }, '#3a8ae0',
    () => `<g class="fx"><text x="206" y="120" font-size="26" fill="#3a8ae0" stroke="${O}" stroke-width="4" paint-order="stroke">♪</text></g>` + impact(222, 150, '#f6c64a')),
  veh('arcee', 'Arcee (moto)', { kind: 'moto', body: '#ff6fa8', bodyD: '#c43c78', accent: '#f4f1f6', accentD: '#c9c0d8' }, '#ff6fa8',
    () => impact(214, 130, '#ff6fa8')),
  veh('wheeljack', 'Wheeljack (voiture de course)', { kind: 'race', body: '#eef0f6', bodyD: '#b8bfd0', accent: '#3fae5a', accentD: '#26803a', stripes: '#3fae5a' }, '#3fae5a',
    () => `<g class="pop"><circle cx="-20" cy="178" r="12" fill="#3a3550" stroke="${O}" stroke-width="3"/><circle cx="-20" cy="178" r="4" fill="#ff4a3a"/></g>` + impact(220, 150, '#ffe14a')),
  veh('hotrod', 'Hot Rod (bolide)', { kind: 'sport', body: '#e8452c', bodyD: '#a8261a', flames: '#f6c64a' }, '#ff8a2a',
    () => flamesHit('#ff8a2a') + impact(220, 150, '#ff8a2a')),
  veh('elita', 'Elita-1 (voiture)', { kind: 'sport', body: '#c4389a', bodyD: '#8a1f6a', stripes: '#f4f1f6' }, '#ff7ad8',
    () => `<g class="fx"><circle cx="226" cy="140" r="16" fill="none" stroke="#ff7ad8" stroke-width="4"/><path d="M226 118 V130 M226 150 V162 M204 140 H216 M236 140 H248" stroke="#ff7ad8" stroke-width="4"/></g>`),
  veh('bulkhead', 'Bulkhead (tout-terrain)', { kind: 'jeep', body: '#4f9a3a', bodyD: '#2f6a24', stripes: undefined }, '#f2c33c',
    () => impact(214, 170, '#f2c33c') + `<g class="ring"><ellipse cx="214" cy="190" rx="40" ry="10" fill="none" stroke="#f2c33c" stroke-width="5"/></g>`),
  veh('sideswipe', 'Sideswipe (voiture de sport)', { kind: 'sport', body: '#d8322c', bodyD: '#9b1d27', stripes: '#c8ccd8' }, '#ffffff',
    () => `<g class="grow">${beam(196, 156, 246, 156, 4, '#fff')}</g>` + impact(232, 156, '#ff6a5a')),
  veh('prowl', 'Prowl (voiture de police)', { kind: 'police', body: '#f4f5fa', bodyD: '#c0c6d6', accent: '#2b2838' }, '#5ab0ff',
    () => `<g class="fx"><circle cx="100" cy="82" r="22" fill="#5ab0ff" opacity=".4"/><circle cx="122" cy="82" r="22" fill="#ff5a5a" opacity=".4"/></g>` + impact(218, 156, '#7dffb0')),
  veh('mirage', 'Mirage (voiture de course)', { kind: 'race', body: '#f4f5fa', bodyD: '#c0c6d6', accent: '#2f6ad8', accentD: '#1d4590', stripes: '#2f6ad8' }, '#9adcff',
    () => `<g class="fx" opacity=".4"><g transform="translate(-40 0)"><path d="M10 176 Q8 142 30 136 L64 132 Q78 104 108 102 Q138 104 152 130 L184 138 Q196 142 194 162 L192 176Z" fill="#9adcff"/></g></g>` + impact(220, 150, '#9adcff')),
  veh('ultramagnus', 'Ultra Magnus (porte-voitures)', { kind: 'carrier', body: '#f4f5fa', bodyD: '#c0c6d6', accent: '#2f5fd0', accentD: '#1f3f95', flames: '#d8322c' }, '#ffd34a',
    () => `<g class="ring"><rect x="-10" y="60" width="220" height="140" rx="30" fill="none" stroke="#ffd34a" stroke-width="5" opacity=".6"/></g>` + impact(212, 140, '#ffd34a')),
  // Grimlock : Dinobot T-rex (sa « transformation »).
  {
    id: 'grimlock', name: 'Grimlock (T-rex)', poses: P3,
    draw(this: CharDef, x: Ctx): string {
      const G = '#9aa3b8', GD = '#6a7088', Y = '#f2c33c', YD = '#c48a1a', RV = '#ff4a3a', FI = '#ff8a2a';
      const body = (open: boolean) => {
        let s = '';
        s += shaded((a) => `<path d="M30 150 Q4 140 -10 112 Q16 126 40 128Z" ${a}/>`, G, GD, -3, -3); // queue
        s += shaded((a) => `<path d="M64 168 L56 198 L80 198 L84 170Z M110 168 L104 198 L128 198 L130 168Z" ${a}/>`, GD, O, -2, -2); // pattes
        s += shaded((a) => `<path d="M28 148 Q34 104 84 98 Q128 96 140 120 Q150 148 132 172 Q96 186 54 178 Q30 170 28 148Z" ${a}/>`, G, GD, -6, -4);
        s += shaded((a) => `<path d="M58 118 L118 112 L120 150 L64 156Z" ${a}/>`, Y, YD, -3, -3) + autobot(90, 134, 0.6);
        s += [70, 86, 102, 118].map((xx, i) => `<path d="M${xx} ${100 - i} l6 -16 l6 15" fill="${Y}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`).join('');
        s += `<path d="M128 140 Q140 150 134 160" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/>`; // bras
        // tête
        const jaw = open ? 'M128 100 L196 112 L188 124 L132 118Z' : 'M128 100 L194 100 L190 112 L132 112Z';
        s += shaded((a) => `<path d="${jaw}" ${a}/>`, GD, O, -2, -2);
        s += shaded((a) => `<path d="M118 82 Q124 50 158 52 Q192 54 198 78 L196 98 L128 102 Q118 96 118 82Z" ${a}/>`, G, GD, -4, -4);
        s += `<path d="M150 98 l4 8 l4 -8 M166 98 l4 8 l4 -8 M182 98 l4 7 l4 -7" fill="#fff" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;
        s += `<rect x="146" y="66" width="34" height="10" rx="5" fill="${RV}" stroke="${O}" stroke-width="3"/><g class="fx"><rect x="140" y="60" width="46" height="22" rx="11" fill="${RV}" opacity=".3"/></g>`;
        s += gloss(140, 62, 10, 4, -10, 0.5);
        return s;
      };
      const shadowV = `<ellipse cx="100" cy="200" rx="80" ry="8" fill="${O}" opacity=".18"/>`;
      const pose = x.byPose((p) => p === 0 ? `<g>${body(false)}</g>` : p === 1 ? `<g transform="rotate(-4 100 190)">${body(true)}</g>` : `<g transform="translate(6 -2) rotate(3 100 190)">${body(true)}</g>`);
      const fire = x.when([2], `<g class="grow"><path d="M192 116 Q230 96 250 122 Q236 120 244 140 Q222 130 214 148 Q206 128 192 122Z" fill="${FI}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M196 118 Q222 108 234 124 Q222 124 220 134 Q208 126 198 122Z" fill="#ffe27a"/></g><g class="pop">${sparks(236, 124, 30, '#ffe27a', 7)}</g>`);
      const roar = x.when([1], `<g class="fx">${[0, 1, 2].map((i) => `<path d="M${206 + i * 10} ${96 + i * 4} q8 10 0 20" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('')}</g>`);
      return shadowV + pose + fire + roar;
    },
  },
];

void f; void glow; void burst; void mirror; void MET;
