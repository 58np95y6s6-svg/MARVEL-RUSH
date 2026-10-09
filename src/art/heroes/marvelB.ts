// Personnages extraits de la planche design/planches/2-marvel-b.html : code de dessin repris tel quel, typé.
// Ne pas redessiner : corriger ici seulement ce qui casse le rendu statique.
/* eslint-disable */
import { O, SK, SKD, f, uid, shaded, clip, gloss, limb, hand, star, glow, burst, bolt, sparks, torsoD, torso, head, mirror, shadow, face, tip, ctx, type CharDef, type Ctx } from '../primitives';
import { wpt, track, flyer, hitAt, morph, P2, puff, reticle } from '../kits/marvelB';

export const MARVEL_B: CharDef[] = [
{
  id:'cap',name:'Captain America',role:'Soutien / rebond',rarity:'Légendaire',rar:'var(--leg)',tint:'#dfe7ff',tint2:'#9db2ea',stats:[3,3,3],
  atk:'Bouclier qui rebondit sur 3 ennemis.',skill:'Leader : +15 % de vitesse d’attaque aux héros adjacents.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-18},{L:36,R:62,body:[-6,-2,-8,1,1]},{L:24,R:-98,body:[6,0,7,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const B='#2f55b8',BD='#1f3a85',N='#26407f',ND='#182a5a',R='#d42e35',RD='#9b1d27',W='#f4f4f8';
    const shield=(r: number)=>shaded(a=>`<circle cx="0" cy="0" r="${r}" ${a}/>`,R,RD,f(-r*.16),f(-r*.16))
      +`<circle r="${f(r*.72)}" fill="${W}" stroke="${O}" stroke-width="2"/><circle r="${f(r*.5)}" fill="${R}" stroke="${O}" stroke-width="2"/><circle r="${f(r*.3)}" fill="${B}" stroke="${O}" stroke-width="2"/><polygon points="${star(0,0,r*.27,r*.11,5,-Math.PI/2)}" fill="#fff"/>`
      +gloss(f(-r*.4),f(-r*.42),f(r*.3),f(r*.12),-45,.6);
    const arm=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,B,15)+`<rect x="${sx-9}" y="${sy+24}" width="18" height="8" rx="3" fill="${R}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+38,R);
    const armR=(sx: number, sy: number)=>arm(sx,sy)+x.when([0,1],`<g transform="translate(${sx} ${sy+40})">${shield(27)}</g>`)
      +x.when([1],`<g class="fx"><polygon points="${star(sx-12,sy+24,11,2.6,4)}" fill="#fff" stroke="${O}" stroke-width="2"/></g>`);
    let b=torso(B,BD);
    let st='';for(let i=0;i<9;i++)st+=`<rect x="${57+i*10}" y="174" width="5" height="32" fill="${W}"/>`;
    b+=clip(a=>`<path d="${torsoD}" ${a}/>`,`<rect x="50" y="174" width="100" height="32" fill="${R}"/>${st}<rect x="50" y="174" width="100" height="32" fill="${O}" opacity=".08"/><path d="M50 174 H150" stroke="${O}" stroke-width="3"/>`)+`<path d="${torsoD}" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`;
    b+=`<polygon points="${star(100,154,15,6.5,5,-Math.PI/2)}" fill="${W}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=x.when([1,2],`<path d="M62 160 Q66 150 72 146 M138 160 Q134 150 128 146" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`);
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M50.4 110 A56 56 0 1 1 149.6 110 L139 112 Q138 66 100 64 Q62 66 61 112Z" ${a}/>`,N,ND,-4,-4)+gloss(78,40,13,5,-25,.45);
    b+=`<path d="M100 30 L115 58 L107 58 L104.5 52 L95.5 52 L93 58 L85 58Z M100 41 L97.5 47 L102.5 47Z" fill="#fff" fill-rule="evenodd" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    const wing=`<path d="M56 90 Q42 86 30 72 Q40 74 46 72 Q36 66 32 54 Q44 62 52 64 Q48 58 48 50 Q58 62 62 78Z" fill="#fff" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 82 Q44 78 38 70" stroke="#c9cbd8" stroke-width="2" fill="none"/>`;
    b+=wing+mirror(wing);
    b+=x.byPose(p=>face(p,{eye:'#3b67c9'}));
    b+=x.arm('L',arm)+x.arm('R',armR);
    const [hx,hy]=tip(this,'R',2,40);
    b+=x.when([2],`<g class="pop">${sparks(hx,hy,26,'#fff',7)}</g>`);
    /* vol du bouclier : 3 rebonds puis retour à la main */
    const wp=[[186,150],[222,190],[214,62],[150,4],[214,104],[186,150]] as const,pts=track(wp,44),p0=49,p1=80;
    let g=flyer(x,'cap-sh',pts,p0,p1,`<g class="spinF">${shield(19)}</g>`,{trail:'#8fb0ff',tw:22,sp:.42});
    [1,2,3].forEach(i=>{const [cx,cy]=wp[i]!,t=p0+(p1-p0)*pts.fr[i]!;
      g+=hitAt(x,'cap-h'+i,t,`${burst(cx,cy,20,'#ffe066')}<circle cx="${cx}" cy="${cy}" r="28" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>`,{d:7,st:pts.fr[i]!<.42});});
    return shadow()+x.body(b)+g;
  }
},
{
  id:'loki',name:'Loki',role:'Trickster',rarity:'Épique',rar:'var(--epi)',tint:'#dcf3d6',tint2:'#8fd08c',stats:[3,3,3],
  atk:'Dague magique.',skill:'Illusion : se copie en un autre héros pendant 10 s ; les ennemis touchés s’attaquent entre eux.',
  sh:{L:[68,150],R:[132,150]},parts:['wR'],
  poses:[{L:14,R:-20,wR:208},{L:40,R:-150,wR:330,body:[0,-5,0,1,1.02]},{L:104,R:-104,wR:314,body:[0,-2,0,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#2f8a4a',GD='#1d5e31',GO='#f2c14e',GOD='#c98f28',K='#2a2433',KD='#16121e',HR='#1f1a2b',GEM='#5ec2ff',MG='#5cf07a';
    const staff=(sx: number, sy: number)=>{const y=sy+38;
      return `<rect x="${sx-4}" y="${y-18}" width="8" height="94" rx="3" fill="${GO}" stroke="${O}" stroke-width="3.5"/><path d="M${sx-1.5} ${y-14} V${y+72}" stroke="#fff3c4" stroke-width="2" opacity=".7"/>`
        +shaded(a=>`<path d="M${sx-10} ${y+70} Q${sx-20} ${y+90} ${sx} ${y+110} Q${sx+20} ${y+90} ${sx+10} ${y+70}Z" ${a}/>`,GO,GOD,-3,-3)
        +`<path d="M${sx-10} ${y+72} Q${sx-14} ${y+82} ${sx-6} ${y+84} M${sx+10} ${y+72} Q${sx+14} ${y+82} ${sx+6} ${y+84}" stroke="${GOD}" stroke-width="2.5" fill="none"/>`
        +x.when([1,2],glow(sx,y+88,17,GEM))
        +`<circle cx="${sx}" cy="${y+88}" r="7.5" fill="${GEM}" stroke="${O}" stroke-width="3"/><circle cx="${sx-2.5}" cy="${y+85.5}" r="2.5" fill="#fff"/>`;};
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,G,15)+`<rect x="${sx-9}" y="${sy+22}" width="18" height="9" rx="3" fill="${GO}" stroke="${O}" stroke-width="3"/>`;
    const armL=(sx: number, sy: number)=>armIn(sx,sy)+hand(sx,sy+38,K)+x.when([1],glow(sx,sy+46,13,MG))+x.when([2],glow(sx,sy+46,14,MG));
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.part('wR',sx,sy+38,staff(sx,sy))+hand(sx,sy+38,K);
    let b=shaded(a=>`<path d="M52 142 Q28 178 32 204 L168 204 Q172 178 148 142Z" ${a}/>`,'#26703c','#164a27',8,-4)+`<path d="M44 172 Q41 190 42 204 M156 172 Q159 190 158 204" stroke="#164a27" stroke-width="3" fill="none"/>`;
    const lock=`<path d="M50 84 Q38 128 54 154 Q66 154 76 142 Q60 122 62 92Z" fill="${HR}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/><path d="M50 108 Q50 128 58 142" stroke="#4a4160" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=lock+mirror(lock);
    b+=torso(G,GD);
    b+=shaded(a=>`<path d="M88 138 L112 138 L118 204 L82 204Z" ${a}/>`,K,KD,-3,-3)+`<path d="M88 138 L82 204 M112 138 L118 204" stroke="${GO}" stroke-width="3.5"/><path d="M84 186 H116" stroke="${GO}" stroke-width="5"/><path d="M84 186 H116" stroke="${O}" stroke-width="1.5" opacity=".35"/>`;
    const plate=`<path d="M66 148 Q82 136 96 146 L90 162 Q80 154 70 160Z" fill="${GO}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M72 150 Q82 144 90 150" stroke="#fff3c4" stroke-width="2" fill="none"/>`;
    b+=plate+mirror(plate);
    b+=x.when([1,2],glow(100,166,16,MG));
    b+=`<path d="M100 158 L106 166 L100 174 L94 166Z" fill="${MG}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    const horn=(a: string)=>`<path d="M66 50 C44 44 30 26 34 -2 C44 4 44 14 50 22 C58 32 76 34 92 32Z" ${a}/>`;
    b+=shaded(horn,GO,GOD,-3,-2)+mirror(shaded(horn,GO,GOD,3,-2));
    b+=`<path d="M56 36 Q42 24 40 6" stroke="#fff3c4" stroke-width="2.5" fill="none" stroke-linecap="round"/>`+mirror(`<path d="M56 36 Q42 24 40 6" stroke="#fff3c4" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".5"/>`);
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M45 98 Q38 32 100 28 Q162 32 155 98 L145 114 Q144 84 130 72 Q114 66 100 80 Q86 66 70 72 Q56 84 55 114Z" ${a}/>`,GO,GOD,-4,-4);
    b+=`<path d="M60 76 Q70 62 90 62 M140 76 Q130 62 110 62" stroke="${GOD}" stroke-width="3" fill="none" stroke-linecap="round"/>`+gloss(80,42,14,5,-20,.55);
    b+=x.byPose(p=>{
      let s=face(p,{eye:'#36a456',noMouth:true});
      if(p==0)s+=`<path d="M90 116 Q101 121 111 111" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      else if(p==1)s+=`<path d="M90 117 Q100 121 112 113" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M110 111 L114 114" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;
      else s+=`<path d="M88 111 Q100 115 113 108 Q110 128 100 129 Q90 127 88 111Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M90 112 Q100 115 111 109" stroke="#fff" stroke-width="3" fill="none"/>`;
      return s;
    });
    b+=x.arm('L',armL)+x.arm('R',armR);
    b+=shaded(a=>`<circle cx="64" cy="147" r="14" ${a}/>`,GO,GOD,-4,-4)+shaded(a=>`<circle cx="136" cy="147" r="14" ${a}/>`,GO,GOD,-4,-4)+gloss(60,141,5,3,-30,.6)+gloss(132,141,5,3,-30,.6);
    b+=x.when([1],`<g class="fx"><circle cx="100" cy="96" r="92" fill="none" stroke="${MG}" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round" opacity=".8"/></g>`);
    /* clones d'illusion */
    let back='',front='';
    if(!x.clone&&(x.A||x.mode===2)){
      const cx=ctx(this,0);cx.clone=true;
      const fid=uid('lg');
      const cl=`<g opacity=".6" filter="url(#${fid})"><g transform="scale(.6) translate(-100 -207)">${this.draw(cx)}</g></g>`;
      back+=`<filter id="${fid}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".1 .2 .05 0 0  .3 .6 .15 0 .18  .15 .3 .1 0 .05  0 0 0 1 0"/></filter>`;
      ([[6,'L'],[194,'R']] as const).forEach(([tx,k])=>{
        back+=flyer(x,'loki-c'+k,track([[100,207],[tx,207]],14),49.5,55,`<ellipse cx="0" cy="-60" rx="66" ry="70" fill="${MG}" opacity=".2"/>`+cl,{sc:[.25,1],hold:23,sp:1});
        front+=hitAt(x,'loki-p'+k,50,puff(tx+(k=='L'?-14:14),196,10),{d:12});
        front+=hitAt(x,'loki-q'+k,50,`<ellipse cx="${tx}" cy="206" rx="40" ry="8" fill="none" stroke="${MG}" stroke-width="5"/>`,{d:20});
      });
      front+=hitAt(x,'loki-pc',49.5,puff(46,178,9)+puff(154,178,9),{d:7});
    }
    return shadow()+back+x.body(b)+front;
  }
},
{
  id:'bucky',name:'Soldat de l’hiver',role:'Critique',rarity:'Épique',rar:'var(--epi)',tint:'#e0e5ee',tint2:'#9eabc0',stats:[4,3,3],shake:true,
  atk:'Tir de précision.',skill:'Bras bionique : chaque 4e attaque est un critique assommant.',
  sh:{L:[68,150],R:[132,150]},parts:['wR'],
  poses:[{L:14,R:-14,wR:[0,1]},{L:30,R:-160,wR:[0,1.12],body:[-5,2,-8,1,1]},{L:22,R:-92,wR:[0,1.5],body:[8,0,8,1.03,.98]}],
  draw(this: CharDef, x: Ctx): string {
    const M='#c9d0db',MD='#8b94a6',K='#2e3038',KD='#1b1c22',ST='#57493d',HR='#3b2a24',HRD='#24180f',RS='#d42e35';
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,K,15)+`<rect x="${sx-9}" y="${sy+24}" width="18" height="8" rx="3" fill="${ST}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+38,'#3a3c46');
    const fist=(sx: number, sy: number)=>hand(sx,sy+38,M,13)+`<path d="M${sx-8} ${sy+42} H${sx+8} M${sx-6} ${sy+47} H${sx+6}" stroke="${MD}" stroke-width="2.2" stroke-linecap="round"/>`;
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,M,16)+`<path d="M${sx-8} ${sy+10} H${sx+8} M${sx-8} ${sy+19} H${sx+8} M${sx-8} ${sy+28} H${sx+8}" stroke="${MD}" stroke-width="2.2"/><path d="M${sx+3} ${sy+6} V${sy+32}" stroke="${MD}" stroke-width="1.6"/>`
      +x.when([1],`<g class="fx"><path d="M${sx-16} ${sy+12} q-6 8 0 16 M${sx+16} ${sy+12} q6 8 0 16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`)
      +x.part('wR',sx,sy+38,fist(sx,sy))+x.when([1],sparks(sx,sy+40,26,'#ffb347',7));
    let b='';
    const back=`<path d="M48 82 Q36 128 56 152 L76 140 Q60 118 62 92Z" fill="${HR}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/>`;
    b+=back+mirror(back);
    b+=torso(K,KD);
    b+=`<path d="M80 140 L82 204 M120 140 L118 204" stroke="${O}" stroke-width="10"/><path d="M80 140 L82 204 M120 140 L118 204" stroke="${ST}" stroke-width="6"/><path d="M64 168 Q100 176 136 168" stroke="${O}" stroke-width="10" fill="none"/><path d="M64 168 Q100 176 136 168" stroke="${ST}" stroke-width="6" fill="none"/>`;
    b+=([[81,171],[119,171]] as const).map(([cx,cy])=>`<rect x="${cx-6}" y="${cy-5}" width="12" height="10" rx="2" fill="${M}" stroke="${O}" stroke-width="2.5"/>`).join('');
    b+=([[66,188],[134,188],[100,190]] as const).map(([cx,cy])=>shaded(a=>`<rect x="${cx-10}" y="${cy-8}" width="20" height="16" rx="3" ${a}/>`,'#454850','#2b2d33',-2,-2)).join('');
    b+=x.when([1],`<g class="spinF"><circle cx="136" cy="147" r="24" fill="none" stroke="${MD}" stroke-width="5" stroke-dasharray="7 6"/></g>`);
    b+=head(SK,SKD);
    b+=`<ellipse cx="80" cy="95" rx="16" ry="11" fill="${O}" opacity=".18"/><ellipse cx="120" cy="95" rx="16" ry="11" fill="${O}" opacity=".18"/>`;
    b+=shaded(a=>`<path d="M44 94 Q36 30 100 26 Q164 30 156 94 Q152 68 136 60 Q120 56 104 66 L100 60 L96 66 Q80 56 64 60 Q48 68 44 94Z" ${a}/>`,'#4a3630',HRD,-4,-4);
    const strand=`<path d="M46 84 Q50 112 58 128 L62 104 Q58 92 60 78Z" fill="${HR}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=strand+mirror(strand)+gloss(80,40,13,4,-15,.3);
    b+=x.byPose(p=>face(p,{eye:'#5d7fa3',noMouth:true,noCheeks:true}));
    b+=shaded(a=>`<path d="M58 108 Q100 101 142 108 Q141 132 100 145 Q59 132 58 108Z" ${a}/>`,'#33353d','#1c1d22',-3,-3)
      +`<path d="M86 114 V132 M93 113 V136 M100 112 V138 M107 113 V136 M114 114 V132" stroke="#0f1014" stroke-width="2.2" stroke-linecap="round"/><path d="M66 112 Q100 106 134 112" stroke="#5a5d68" stroke-width="2" fill="none"/>`;
    b+=x.arm('L',armL)+x.arm('R',armR);
    b+=shaded(a=>`<circle cx="64" cy="147" r="14" ${a}/>`,K,KD,-4,-4)+shaded(a=>`<circle cx="136" cy="147" r="16" ${a}/>`,M,MD,-4,-4)+gloss(131,141,5,3,-30,.7);
    b+=`<polygon points="${star(136,148,9,3.8,5,-Math.PI/2)}" fill="${RS}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;
    const [fx,fy]=tip(this,'R',2,76);
    b+=x.when([2],`<g class="pop"><path d="M140 ${f(fy-22)} H166 M144 ${f(fy+20)} H170" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/></g>`
      +`<g class="pop">${burst(f(fx),f(fy),26,'#ffd23f')}</g><g class="ring"><circle cx="${f(fx)}" cy="${f(fy)}" r="34" fill="none" stroke="#fff" stroke-width="5"/></g>`);
    let g='';
    const crit=`<polygon points="${star(204,36,34,19,8,-Math.PI/2)}" fill="#ffd23f" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><polygon points="${star(204,36,24,14,8,-Math.PI/2+.2)}" fill="#fff4b0"/><text x="204" y="43" text-anchor="middle" font-family="Lilita One,Arial Rounded MT Bold,sans-serif" font-size="19" fill="#d42e35" stroke="${O}" stroke-width="5" paint-order="stroke" transform="rotate(-10 204 36)">CRIT !</text>`;
    g+=hitAt(x,'bucky-crit',53,crit,{d:20});
    let dz='';for(let i=0;i<3;i++){const a=i*2.1+.4;dz+=`<polygon points="${star(212+Math.cos(a)*18,124+Math.sin(a)*7,7,3,5,-Math.PI/2)}" fill="#ffd23f" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`}
    g+=hitAt(x,'bucky-dz',58,`<ellipse cx="212" cy="124" rx="18" ry="7" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 4"/><g class="spin">${dz}</g>`,{d:18});
    return shadow()+x.body(b)+g;
  }
},
{
  id:'hawkeye',name:'Œil de faucon',role:'Polyvalent',rarity:'Rare',rar:'var(--rare)',tint:'#ebe0fa',tint2:'#b49ae2',stats:[3,4,5],
  atk:'Flèche simple.',skill:'Flèches spéciales : alterne flèche explosive, glace et électrique.',
  sh:{L:[68,150],R:[132,150]},parts:['wL'],
  poses:[{L:30,R:-14,wL:28},{L:90,R:92,wL:-90,body:[12,0,2,1,1]},{L:90,R:-34,wL:-90,body:[12,0,3,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const P='#7b4bc4',PD='#55308f',K='#2a2236',KD='#17121f',HR='#7a4a2a',HRD='#53301a',BW='#4b2f63',FL='#ff8a2a';
    const bow=(sx: number, sy: number)=>{const y=sy+38;const d=`M${sx+14} ${y-42} Q${sx-16} ${y} ${sx+14} ${y+42}`;
      return `<path d="${d}" stroke="${O}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${BW}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${sx+8} ${y-34} Q${sx-6} ${y-16} ${sx-1} ${y-6}" stroke="#a07fd0" stroke-width="2" fill="none" stroke-linecap="round"/>`
        +`<circle cx="${sx+14}" cy="${y-42}" r="3.5" fill="${P}" stroke="${O}" stroke-width="2"/><circle cx="${sx+14}" cy="${y+42}" r="3.5" fill="${P}" stroke="${O}" stroke-width="2"/>`;};
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SK,14)+`<rect x="${sx-9}" y="${sy+20}" width="18" height="13" rx="4" fill="${K}" stroke="${O}" stroke-width="3"/>`;
    const armL=(sx: number, sy: number)=>armIn(sx,sy)+x.part('wL',sx,sy+38,bow(sx,sy))+hand(sx,sy+38,SK);
    const arrow=(sx: number, sy: number)=>{const y=sy+38;
      return `<path d="M${sx} ${y-8} V${y+80}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${sx} ${y-8} V${y+80}" stroke="#e9dcc5" stroke-width="3" stroke-linecap="round"/>`
        +`<path d="M${sx} ${y-10} l-7 -6 v12 Z M${sx} ${y-10} l7 -6 v12 Z" fill="${P}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`
        +glow(sx,y+84,13,FL)+`<rect x="${sx-5}" y="${y+66}" width="10" height="13" rx="3" fill="#d4402c" stroke="${O}" stroke-width="2.5"/><path d="M${sx-6} ${y+79} L${sx} ${y+92} L${sx+6} ${y+79}Z" fill="#cfd5e0" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;};
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([1],arrow(sx,sy))+hand(sx,sy+38,SK)+`<rect x="${sx-6}" y="${sy+43}" width="12" height="5" rx="2" fill="${K}"/>`;
    let b='';
    b+=`<g transform="rotate(24 150 120)">${shaded(a=>`<rect x="140" y="84" width="22" height="72" rx="7" ${a}/>`,'#6b4a35','#4a3020',-3,-3)}<path d="M146 84 l-5 -14 l5 4 l4 -6 l1 16 M154 84 l-2 -16 l6 6 l5 -4 l-3 14" fill="${P}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
    b+=torso(K,KD);
    const side=`<path d="M58 202 C56 162 66 142 84 138 L88 160 L76 202Z" fill="${P}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
    b+=side+mirror(side);
    b+=`<path d="M136 146 L66 200" stroke="${O}" stroke-width="11" stroke-linecap="round"/><path d="M136 146 L66 200" stroke="#6b4a35" stroke-width="6" stroke-linecap="round"/><rect x="93" y="170" width="12" height="10" rx="2" fill="#cfd5e0" stroke="${O}" stroke-width="2.5" transform="rotate(-37 99 175)"/>`;
    b+=`<path d="M70 192 H130" stroke="${O}" stroke-width="8"/><path d="M70 192 H130" stroke="${PD}" stroke-width="4"/>`;
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M45 94 Q40 62 48 50 L44 36 L60 42 L64 24 L78 34 L88 16 L100 30 L114 14 L122 32 L138 22 L140 40 L156 38 L151 54 Q160 70 155 94 Q150 68 134 62 Q112 70 96 60 Q72 66 60 70 Q50 78 45 94Z" ${a}/>`,HR,HRD,-4,-4)+gloss(84,38,12,4,-20,.35);
    b+=x.byPose(p=>{
      if(p!=1)return face(p,{eye:'#5a7a3a'});
      let s=face(1,{eye:'#5a7a3a',noMouth:true});
      s+=`<rect x="68" y="82" width="26" height="26" fill="${SK}"/><path d="M71 96 Q80 101 89 96" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M69 86 L91 89" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/>`;
      return s+`<path d="M92 117 Q100 114 108 117" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M106 116 L110 112" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;
    });
    b+=x.arm('L',armL);
    const ds=[0,1,2].map(p=>{const [ax,ay]=wpt(this,'L',p,82,146),[bx,by]=wpt(this,'L',p,82,230);const m=p==1?tip(this,'R',1,40):[(ax+bx)/2,(ay+by)/2];return `M${P2([ax,ay])} L${P2(m)} L${P2([bx,by])}`});
    b+=morph(x,'hawk',ds,`fill="none" stroke="#efe6ff" stroke-width="2.5" stroke-linejoin="round"`);
    b+=x.arm('R',armR);
    b+=shaded(a=>`<circle cx="64" cy="147" r="14" ${a}/>`,P,PD,-4,-4)+shaded(a=>`<circle cx="136" cy="147" r="14" ${a}/>`,P,PD,-4,-4)+gloss(60,141,5,3,-30,.6)+gloss(132,141,5,3,-30,.6);
    const [sx2,sy2]=wpt(this,'L',2,82,188);
    b+=x.when([2],`<g class="pop"><path d="M${f(sx2+8)} ${f(sy2-30)} q6 10 0 20 q-6 10 0 20 M${f(sx2+16)} ${f(sy2-22)} q5 8 0 14 q-5 8 0 14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`);
    let g='';
    const TX=-6,TY=122;
    g+=x.when([1],`<g class="fx"><path d="M10 146 L${TX+14} ${TY+6}" stroke="${FL}" stroke-width="2.5" stroke-dasharray="5 5" stroke-linecap="round"/></g>${reticle(TX,TY,13,'#ff5a3c')}`);
    const arw=`<path d="M-50 0 H0" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M-50 0 H0" stroke="#e9dcc5" stroke-width="3" stroke-linecap="round"/><path d="M-50 0 l-6 -7 h10 Z M-50 0 l-6 7 h10 Z" fill="${P}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-2 -6 L12 0 L-2 6Z" fill="#cfd5e0" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`+`<path d="M-56 -4 H-90 M-56 4 H-80" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
    g+=flyer(x,'hawk-a',track([[22,148],[TX+8,TY+2]],12),49,53.5,arw,{align:true,sc:[1,.75],sp:.55});
    g+=x.when([2],`<g class="grow" style="transform-origin:30px 140px"><path d="M30 134 L-30 116 M30 152 L-26 132" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>`);
    g+=hitAt(x,'hawk-x',53.5,`<circle cx="${TX}" cy="${TY}" r="42" fill="#ffb648" opacity=".25"/>${burst(TX,TY,32,'#ff8a2a','#ffe27a')}`,{d:18});
    g+=hitAt(x,'hawk-r',54,`<circle cx="${TX}" cy="${TY}" r="40" fill="none" stroke="#ffd27a" stroke-width="5"/>`+`<g fill="#5d5470" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"><polygon points="${TX+30},${TY-34} ${TX+40},${TY-40} ${TX+40},${TY-28}"/><polygon points="${TX+36},${TY+30} ${TX+48},${TY+32} ${TX+40},${TY+42}"/><polygon points="${TX-8},${TY-48} ${TX+2},${TY-56} ${TX+4},${TY-44}"/></g>`,{d:16});
    return shadow()+x.body(b)+g;
  }
},
{
  id:'falcon',name:'Falcon',role:'Ciblage',rarity:'Rare',rar:'var(--rare)',tint:'#d9ecff',tint2:'#8cbfec',stats:[3,4,4],
  atk:'Tir aérien.',skill:'Drone Redwing : marque l’ennemi le plus fort (+25 % de dégâts subis).',
  sh:{L:[68,150],R:[132,150]},parts:['wgL','wgR'],
  poses:[{L:16,R:-16,wgL:-14,wgR:14},{L:58,R:-58,wgL:30,wgR:-30,body:[0,-24,0,1,1]},{L:34,R:-62,wgL:64,wgR:-64,body:[-12,-8,-9,1.07,1.07]}],
  draw(this: CharDef, x: Ctx): string {
    const GY='#8d95a3',GYD='#646b79',R='#d4343c',RD='#9b1d27',K='#2a2b33',SKF='#b97f57',SKFD='#8c5a3a';
    let wg='';
    for(let k=4;k>=0;k--){const t=(150+k*10)*Math.PI/180,L=118-k*8,c=[Math.cos(t),Math.sin(t)],q=[-c[1]!,c[0]!],px=86,py=150;
      const pt=(u: number, v: number)=>P2([px+c[0]!*u+q[0]!*v,py+c[1]!*u+q[1]!*v]);
      wg+=shaded(a=>`<path d="M${pt(0,6)} L${pt(L*.8,9)} L${pt(L,0)} L${pt(L*.8,-8)} L${pt(0,-6)}Z" ${a}/>`,k%2?'#b4bcc9':'#c9d0db',GYD,-2,-2);
      if(k==0)wg+=`<path d="M${pt(L*.35,0)} L${pt(L*.82,0)}" stroke="${R}" stroke-width="4" stroke-linecap="round"/>`;}
    wg+=`<path d="M86 150 L${P2([86+Math.cos(2.7)*46,150+Math.sin(2.7)*46])}" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M86 150 L${P2([86+Math.cos(2.7)*46,150+Math.sin(2.7)*46])}" stroke="#5d6472" stroke-width="7" stroke-linecap="round"/>`;
    let b=x.part('wgL',86,150,wg)+x.part('wgR',114,150,mirror(wg));
    b+=x.when([1],`<g class="fx"><path d="M40 196 Q30 186 38 176 M160 196 Q170 186 162 176" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`);
    b+=`<path d="M78 140 L80 162 L120 162 L122 140Z" fill="${K}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
    b+=torso(GY,GYD);
    b+=`<path d="M88 160 L100 204 L112 160 Z" fill="${K}" opacity=".5"/>`;
    b+=`<path d="M66 146 L100 178 L134 146" stroke="${O}" stroke-width="13" fill="none" stroke-linejoin="round"/><path d="M66 146 L100 178 L134 146" stroke="${R}" stroke-width="8" fill="none" stroke-linejoin="round"/>`;
    b+=`<circle cx="100" cy="178" r="9" fill="#cfd5e0" stroke="${O}" stroke-width="3.5"/><circle cx="100" cy="178" r="3.5" fill="${R}"/><path d="M64 194 H136" stroke="${O}" stroke-width="9"/><path d="M64 194 H136" stroke="${K}" stroke-width="5"/>`;
    b+=head(SKF,SKFD);
    b+=shaded(a=>`<path d="M47 78 Q48 30 100 28 Q152 30 153 78 Q132 56 100 58 Q68 56 47 78Z" ${a}/>`,'#2a2024','#160f12',-3,-3);
    b+=x.byPose(p=>{
      let s=face(p,{noMouth:true,noCheeks:true,eye:'#3a2418'});
      s+=`<path d="M44 92 Q100 82 156 92 L156 102 Q100 92 44 102Z" fill="#4a4f5c" stroke="${O}" stroke-width="3"/>`;
      const lens=`<path d="M64 88 Q80 82 96 88 Q98 102 90 106 Q78 110 66 104 Q60 96 64 88Z" fill="${R}" opacity=".62" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M69 90 Q78 87 86 90" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8" stroke-linecap="round"/>`;
      s+=lens+mirror(lens);
      s+=p?`<path d="M69 ${p==2?78:80} L91 86 M131 ${p==2?78:80} L109 86" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/>`:'';
      if(p==0)s+=`<path d="M90 116 Q100 123 110 116" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      else if(p==1)s+=`<path d="M88 114 Q100 120 112 114 Q110 124 100 125 Q90 124 88 114Z" fill="#fff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M89 117 H111" stroke="${O}" stroke-width="1.6"/>`;
      else s+=`<path d="M89 111 Q100 109 111 111 Q109 128 100 129 Q91 128 89 111Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M91 112 H109" stroke="#fff" stroke-width="3"/>`;
      return s;
    });
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,GY,15)+`<path d="M${sx-9} ${sy+14} H${sx+9}" stroke="${R}" stroke-width="5"/>`+hand(sx,sy+38,K);
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    b+=shaded(a=>`<circle cx="64" cy="147" r="14" ${a}/>`,R,RD,-4,-4)+shaded(a=>`<circle cx="136" cy="147" r="14" ${a}/>`,R,RD,-4,-4)+gloss(60,141,5,3,-30,.6)+gloss(132,141,5,3,-30,.6);
    const [mx,my]=tip(this,'R',2,52);
    b+=x.when([2],`<g class="pop">${burst(f(mx),f(my),14,'#ffd23f')}</g>`);
    let g=x.when([2],`<g class="pop"><path d="M168 168 L196 182 M162 190 L186 204" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/></g>`);
    const drone=`<g class="wig"><path d="M-20 -2 Q-10 -12 0 -5 Q10 -12 20 -2 Q10 0 6 6 L0 10 L-6 6 Q-10 0 -20 -2Z" fill="${R}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="0" cy="0" r="5" fill="#ffe6e6" stroke="${O}" stroke-width="2.5"/><circle cx="0" cy="0" r="2" fill="${R}"/></g>`;
    g+=flyer(x,'fal-d',track([[150,134],[198,118],[214,58]],18),49,55,drone,{trail:'#ff9a9a',tw:10,hold:25,sp:1});
    g+=hitAt(x,'fal-l',55.5,`<path d="M214 66 L210 172" stroke="#ff4a4a" stroke-width="7" opacity=".3" stroke-linecap="round"/><path d="M214 66 L210 172" stroke="#ff4a4a" stroke-width="2.5" stroke-dasharray="6 4" stroke-linecap="round"/>`,{d:22});
    g+=hitAt(x,'fal-t',57,reticle(210,186,16,'#ff3b3b')+`<path d="M200 150 L210 162 L220 150Z" fill="#ff3b3b" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`,{d:20});
    return shadow()+x.body(b)+g;
  }
},
{
  id:'widow',name:'Black Widow',role:'Anti-boss',rarity:'Épique',rar:'var(--epi)',tint:'#ffe1dc',tint2:'#ee9f96',stats:[4,4,2],
  atk:'Tir rapide.',skill:'Morsure de la veuve : paralyse 1 s ; dégâts doublés contre les boss.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-14},{L:-52,R:52,body:[0,6,0,1.03,.95]},{L:102,R:-102,body:[0,-4,0,1.02,1.02]}],
  draw(this: CharDef, x: Ctx): string {
    const K='#24222e',KD='#121019',HR='#d8432e',HRD='#9e2a1d',M='#cfd5e0',MD='#8d95a8',E='#7fd8ff';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,'#3b3a4c',14)+`<rect x="${sx-10}" y="${sy+22}" width="20" height="12" rx="4" fill="${M}" stroke="${O}" stroke-width="3"/><rect x="${sx-4}" y="${sy+25}" width="8" height="6" rx="2" fill="${E}" stroke="${O}" stroke-width="1.6"/>`+hand(sx,sy+38,K)
      +x.when([1,2],glow(sx,sy+28,12,E));
    let b='';
    const back=`<path d="M46 80 Q30 130 48 158 Q64 162 78 146 Q60 122 62 90Z" fill="${HR}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/><path d="M46 112 Q44 134 54 150" stroke="${HRD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=back+mirror(back);
    b+=torso(K,KD);
    b+=`<path d="M100 140 V186" stroke="${MD}" stroke-width="2.5"/><path d="M76 140 Q100 152 124 140" stroke="${O}" stroke-width="3" fill="none" opacity=".6"/>`;
    b+=`<path d="M60 188 Q100 196 140 188" stroke="${O}" stroke-width="10" fill="none"/><path d="M60 188 Q100 196 140 188" stroke="${MD}" stroke-width="6" fill="none"/>`;
    b+=`<circle cx="100" cy="193" r="11" fill="${K}" stroke="${O}" stroke-width="3.5"/><path d="M94 186 H106 L100 193 L106 200 H94 L100 193Z" fill="#e8313b" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`;
    b+=x.when([1],`<g class="fx"><circle cx="100" cy="170" r="34" fill="${E}" opacity=".25"/></g>`);
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M44 96 Q36 30 100 26 Q164 30 156 96 Q150 66 128 58 Q106 72 74 62 Q56 70 44 96Z" ${a}/>`,HR,HRD,-4,-4);
    b+=`<path d="M60 52 Q80 38 108 42 M70 62 Q94 52 116 58" stroke="#f07a5e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`+gloss(86,38,12,4,-12,.35);
    const curl=`<path d="M46 86 Q42 112 54 130 Q50 112 60 98Z" fill="${HR}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=curl+mirror(curl);
    b+=x.byPose(p=>{
      let s=face(p,{eye:'#3f8a74',noMouth:true});
      s+=`<path d="M71 88 L66 84 M129 88 L134 84" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;
      if(p==0)s+=`<path d="M91 116 Q101 121 110 114" stroke="#b8243a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      else if(p==1)s+=`<path d="M92 117 H108" stroke="#b8243a" stroke-width="4" stroke-linecap="round"/>`;
      else s+=`<path d="M89 111 Q100 108 111 111 Q109 126 100 127 Q91 126 89 111Z" fill="#7a1f2b" stroke="#b8243a" stroke-width="3.5" stroke-linejoin="round"/><path d="M91 112 H109" stroke="#fff" stroke-width="3"/>`;
      return s;
    });
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    b+=x.when([1],`<g>${bolt([[82,150],[74,140],[80,134],[70,122]])}${bolt([[118,150],[128,142],[122,134],[132,124]])}${bolt([[56,176],[46,170],[50,186],[40,184]])}${bolt([[144,176],[154,170],[150,186],[160,184]])}</g>`);
    const zap=(side: string, s: any)=>{const [hx,hy]=tip(this,side,2,44);const ex=hx+s*66,ey=hy-6;
      return `<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${bolt(([[hx,hy],[hx+s*14,hy-10],[hx+s*26,hy+4],[hx+s*40,hy-10],[hx+s*52,hy+2],[ex,ey]] as const).map(q=>q.map(v=>+f(v))),E)}${bolt(([[hx,hy],[hx+s*18,hy+12],[hx+s*30,hy+4],[hx+s*44,hy+18]] as const).map(q=>q.map(v=>+f(v))),E)}</g>`
        +`<g class="pop">${burst(f(hx),f(hy),17,E)}</g><g class="pop">${burst(f(ex),f(ey),15,'#bff4ff')}</g><g class="ring"><circle cx="${f(ex)}" cy="${f(ey)}" r="24" fill="none" stroke="${E}" stroke-width="5"/></g>`;};
    b+=x.when([2],zap('L',-1)+zap('R',1));
    return shadow()+x.body(b);
  }
},
{
  id:'shangchi',name:'Shang-Chi',role:'Combo',rarity:'Épique',rar:'var(--epi)',tint:'#d9f1ee',tint2:'#86ccc4',stats:[4,4,2],
  atk:'Enchaînement d’arts martiaux.',skill:'Dix Anneaux : des anneaux frappent jusqu’à 10 ennemis.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:24,R:-96,body:[-3,0,-3,1,1]},{L:128,R:-128,body:[0,-8,0,1,1.02]},{L:96,R:-96,body:[0,2,0,1.06,.96]}],
  draw(this: CharDef, x: Ctx): string {
    const R='#c8283a',RD='#8c1726',GO='#f2c14e',GOD='#c98f28',BL='#6fe3ff',HR='#1f1a24';
    const ringG=(r=12)=>`<circle r="${r+5}" fill="${BL}" opacity=".25"/><ellipse rx="${r}" ry="${f(r*.5)}" fill="none" stroke="${O}" stroke-width="8"/><ellipse rx="${r}" ry="${f(r*.5)}" fill="none" stroke="${GO}" stroke-width="4.5"/><ellipse rx="${r}" ry="${f(r*.5)}" fill="none" stroke="#fff6cf" stroke-width="1.4"/><ellipse rx="${f(r*.62)}" ry="${f(r*.26)}" fill="none" stroke="${BL}" stroke-width="2.4"/>`;
    const armIn=(sx: number, sy: number)=>{let s=limb(sx,sy,sx,sy+38,R,15)+`<path d="M${sx} ${sy+4} V${sy+16}" stroke="${GO}" stroke-width="3"/>`;
      let rg='';for(let i=0;i<4;i++)rg+=`<ellipse cx="${sx}" cy="${sy+18+i*5}" rx="12" ry="4" fill="none" stroke="${O}" stroke-width="5.5"/><ellipse cx="${sx}" cy="${sy+18+i*5}" rx="12" ry="4" fill="none" stroke="${i%2?BL:GO}" stroke-width="2.6"/>`;
      return s+x.when([0],`<g class="fx"><rect x="${sx-15}" y="${sy+11}" width="30" height="28" rx="10" fill="${BL}" opacity=".22"/></g>`+rg)+hand(sx,sy+38,SK);};
    let b=torso(R,RD);
    b+=`<path d="M76 140 L118 204" stroke="${O}" stroke-width="9"/><path d="M76 140 L118 204" stroke="${GO}" stroke-width="5"/>`;
    b+=`<path d="M86 144 Q90 156 84 166 M110 176 Q122 182 124 194" stroke="${GOD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=`<path d="M58 190 Q100 198 142 190 L142 200 Q100 208 58 200Z" fill="${GO}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=`<path d="M82 136 Q100 144 118 136 L116 146 Q100 152 84 146Z" fill="${GO}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M46 88 Q40 30 100 26 Q160 30 154 88 Q148 64 132 58 L124 66 L116 56 Q100 70 80 60 L74 70 Q56 70 46 88Z" ${a}/>`,'#352c3c',HR,-4,-4)+gloss(84,38,12,4,-12,.35);
    b+=x.byPose(p=>{
      let s=face(p,{eye:p==1?'#3fb7d8':O,noMouth:p==2});
      if(p==2)s+=`<path d="M88 110 Q100 107 112 110 Q110 130 100 131 Q90 130 88 110Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M90 111 H110" stroke="#fff" stroke-width="3"/><path d="M93 125 Q100 121 107 125" stroke="#e85a6e" stroke-width="3" fill="none"/>`;
      return s;
    });
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    b+=shaded(a=>`<circle cx="64" cy="147" r="14" ${a}/>`,R,RD,-4,-4)+shaded(a=>`<circle cx="136" cy="147" r="14" ${a}/>`,R,RD,-4,-4)+`<path d="M52 150 Q64 156 76 150 M124 150 Q136 156 148 150" stroke="${GO}" stroke-width="3" fill="none"/>`+gloss(60,141,5,3,-30,.6)+gloss(132,141,5,3,-30,.6);
    /* dix anneaux : orbite elliptique autour de la taille puis éventail */
    const CX=100,CY=168,RX=104,RY=30;
    let g=x.when([1],`<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="${BL}" stroke-width="10" opacity=".18"/><ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 7" opacity=".8"/>`);
    const ph=[...Array(10)].map((_,i)=>i*Math.PI/5+.3);
    const start=ph.map((t): [number, number]=>[CX+RX*Math.cos(t),CY+RY*Math.sin(t)]);
    const order=start.map((p,i)=>i).sort((a,b)=>start[a]![0]-start[b]![0]);
    order.forEach((i,rank)=>{
      const t0=ph[i]!,loop=[...Array(25)].map((_,k): [number, number]=>{const t=t0+k*2*Math.PI/24;return [CX+RX*Math.cos(t),CY+RY*Math.sin(t)]});
      g+=flyer(x,'sc-o'+i,loop,16,49,`<g class="spinF">${ringG()}</g>`,{sm:1,sp:0});
      const left=rank<5,j=left?rank:9-rank,a=(left?132+j*24:48-j*24)*Math.PI/180;
      const end=[100+130*Math.cos(a),128+104*Math.sin(a)];
      g+=flyer(x,'sc-f'+i,track([start[i]!,end],10),49,55.5,`<g class="spinF">${ringG(13)}</g>`,{trail:BL,tw:12,hold:0,sp:1});
      g+=hitAt(x,'sc-h'+i,55.5+j*.8,`<g transform="translate(${P2(end)})">${ringG(14)}</g><circle cx="${f(end[0]!)}" cy="${f(end[1]!)}" r="22" fill="none" stroke="${BL}" stroke-width="4"/>`,{d:16});
    });
    b+=x.when([1],`${glow(tip(this,'L',1,40)[0]!,tip(this,'L',1,40)[1]!,14,BL)}${glow(tip(this,'R',1,40)[0]!,tip(this,'R',1,40)[1]!,14,BL)}`);
    b+=x.when([2],`<g class="pop">${burst(f(tip(this,'L',2,44)[0]!),f(tip(this,'L',2,44)[1]!),15,GO)}</g><g class="pop">${burst(f(tip(this,'R',2,44)[0]!),f(tip(this,'R',2,44)[1]!),15,GO)}</g>`);
    return shadow()+x.body(b)+g;
  }
}];
