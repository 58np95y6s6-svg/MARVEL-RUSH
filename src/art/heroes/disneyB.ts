// Personnages extraits de la planche design/planches/4-disney-b.html : code de dessin repris tel quel, typé.
// Ne pas redessiner : corriger ici seulement ce qui casse le rendu statique.
/* eslint-disable */
import { O, SK, SKD, f, uid, shaded, clip, gloss, limb, hand, star, glow, burst, sparks, torso, head, cheeks, mirror, shadow, face, tip, dirOf, type CharDef, type Ctx } from '../primitives';
import { shadedW, fly, gather, rope, word, dot, pix, plus, twinkle, note, petal, coin, enemy, bigMouth, strand } from '../kits/disneyB';

export const DISNEY_B: CharDef[] = [
/* ===== 08 · Tiana & Naveen ===== */
{
  id:'tiana',name:'Tiana & Naveen',role:'Économie',rarity:'Rare',rar:'var(--rare)',tint:'#e4f5d6',tint2:'#a6d68f',stats:[2,3,3],
  atk:'Lumière de luciole.',skill:'Restaurant : mana bonus à chaque vague ; la grenouille attrape un ennemi avec sa langue.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:-42,R:42,body:[0,-4,0,1,1]},{L:66,R:-54,body:[-3,-6,-3,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const S='#a8704c',SD='#7f4f35',D='#6cbf62',DD='#3f8a45',DL='#b1e48f',H='#3a2626',HD='#1e1214',F='#a9d23f',FD='#6f9b22',GL='#ffe46b',G='#f6c64a';
    const firefly=(x0: number, y0: number, s=1)=>`<g transform="translate(${f(x0)} ${f(y0)}) scale(${s})">${glow(0,3,16,GL)}<ellipse cx="-6" cy="-8" rx="6.5" ry="4" transform="rotate(-30 -6 -8)" fill="#eefaff" stroke="${O}" stroke-width="2"/><ellipse cx="6" cy="-8" rx="6.5" ry="4" transform="rotate(30 6 -8)" fill="#eefaff" stroke="${O}" stroke-width="2"/><ellipse cx="0" cy="-3" rx="4.5" ry="6" fill="#7a4b2a" stroke="${O}" stroke-width="2.5"/><circle cx="0" cy="5" r="5.5" fill="#fff36b" stroke="${O}" stroke-width="2.5"/><circle cx="-1.5" cy="-5" r="1.4" fill="#fff"/><path d="M-2 -9 L-5 -15 M2 -9 L5 -15" stroke="${O}" stroke-width="1.6" stroke-linecap="round"/></g>`;
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,S,14)+hand(sx,sy+38,S);
    let b='';
    b+=x.when([0],`<g class="wig">${firefly(26,98)}</g>`);
    // chignon derrière la tête
    b+=shaded(a=>`<circle cx="100" cy="28" r="22" ${a}/>`,'#4a3232',H,-4,-4)+`<path d="M86 24 Q92 13 103 15 M93 37 Q104 30 114 34" stroke="${HD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=torso(S,SD);
    const dress=(a: string)=>`<path d="M60 203 C58 174 61 159 66 151 Q83 145 100 156 Q117 145 134 151 C139 159 142 174 140 203Z" ${a}/>`;
    b+=shaded(dress,D,DD,-6,-3);
    b+=`<path d="M80 160 Q86 180 82 200 M120 160 Q114 180 118 200 M100 160 V200" stroke="${DD}" stroke-width="2.5" fill="none" opacity=".7"/>`;
    let lv='';([[66,195,-22],[83,197,-9],[100,198,0],[117,197,9],[134,195,22]] as const).forEach(([lx,ly,r])=>{lv+=`<g transform="rotate(${r} ${lx} ${ly})"><path d="M${lx} ${ly-17} Q${lx+11} ${ly-5} ${lx} ${ly+7} Q${lx-11} ${ly-5} ${lx} ${ly-17}Z" fill="${DL}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${lx} ${ly-12} V${ly+2}" stroke="${DD}" stroke-width="1.8"/></g>`});
    b+=lv;
    b+=head(S,SD);
    b+=`<path d="M48 82 Q42 96 50 106 Q55 112 51 118" stroke="${H}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M152 82 Q158 96 150 106" stroke="${H}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M44 88 Q38 30 100 26 Q162 30 156 88 Q150 62 132 54 Q116 62 100 56 Q84 62 68 54 Q50 62 44 88Z" ${a}/>`,'#4a3232',H,-4,-4);
    b+=`<path d="M100 30 V54 M70 40 Q80 48 84 58 M130 40 Q120 48 116 58" stroke="${HD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`+gloss(78,40,12,4,-20,.3);
    // fleur de nénuphar dans le chignon
    let fl='';for(let i=0;i<5;i++){const a=i*72-90;fl+=`<ellipse cx="124" cy="${f(16-6)}" rx="4.5" ry="8" transform="rotate(${a} 124 16)" fill="#ffd8ea" stroke="${O}" stroke-width="2.2"/>`}
    b+=fl+`<circle cx="124" cy="16" r="4" fill="${G}" stroke="${O}" stroke-width="2"/>`;
    b+=x.byPose(p=>face(p,{eye:'#5a3420'}));
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    const leaf=(cx: number, r: number)=>`<g transform="rotate(${r} ${cx} 146)"><path d="M${cx-17} 146 Q${cx} 130 ${cx+17} 146 Q${cx} 158 ${cx-17} 146Z" fill="${DL}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${cx-11} 146 H${cx+11}" stroke="${DD}" stroke-width="2"/></g>`;
    b+=leaf(64,-28)+leaf(136,28);
    // préparation : la lueur se rassemble dans les mains jointes
    let gp='';([[46,118],[154,116],[36,168],[166,178],[100,128],[70,206],[132,206]] as const).forEach(([gx,gy],i)=>{gp+=gather(100-gx,178-gy,dot(gx,gy,4.5,GL)+`<circle cx="${gx}" cy="${gy}" r="9" fill="${GL}" opacity=".35"/>`,i*.04)});
    b+=x.when([1],gp+glow(100,178,30,GL)+firefly(100,170,1.1));
    // grenouille Naveen
    b+=x.byPose(p=>{
      let s=shadedW(a=>`<ellipse cx="160" cy="141" rx="21" ry="14" ${a}/>`,F,FD,-4,-3,4.5);
      s+=`<ellipse cx="160" cy="147" rx="11" ry="5.5" fill="#eaf3b4"/>`;
      s+=`<ellipse cx="148" cy="155" rx="6" ry="3.5" fill="${F}" stroke="${O}" stroke-width="3"/><ellipse cx="172" cy="155" rx="6" ry="3.5" fill="${F}" stroke="${O}" stroke-width="3"/>`;
      s+=shadedW(a=>`<circle cx="149" cy="127" r="9" ${a}/>`,F,FD,-2,-2)+shadedW(a=>`<circle cx="171" cy="127" r="9" ${a}/>`,F,FD,-2,-2);
      const lk=([[0,0],[-2.5,2],[3,-1]] as const)[p]!;
      [149,171].forEach(ex=>{s+=p==2&&ex==149?`<path d="M${ex-5} 128 Q${ex} 123 ${ex+5} 128" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`:`<circle cx="${ex}" cy="127" r="${p==1?6.5:5.5}" fill="#fff" stroke="${O}" stroke-width="2"/><circle cx="${ex+lk[0]!}" cy="${127+lk[1]!}" r="3" fill="${O}"/><circle cx="${ex+lk[0]!+1}" cy="${126+lk[1]!}" r="1" fill="#fff"/>`});
      s+=`<path d="M152 120 L152 109 L156 114 L160 106 L164 114 L168 109 L168 120Z" fill="${G}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="160" cy="114" r="1.8" fill="#e8413b"/>`;
      if(p==0) s+=`<path d="M146 140 Q160 149 174 140" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      else if(p==1) s+=`<ellipse cx="160" cy="142" rx="4" ry="4.5" fill="#7a1f2b" stroke="${O}" stroke-width="2.5"/>`;
      else s+=`<path d="M147 138 Q160 136 173 138 Q170 150 160 150 Q150 150 147 138Z" fill="#7a1f2b" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      return s;
    });
    // frappe : la luciole s'envole, la langue attrape, pièce de mana
    b+=x.when([2],
      rope('M164 145 Q200 162 220 128','#ff86ab',6,'draw')
      +`<g class="pop">${dot(221,127,7,'#ff86ab')}${enemy(222,112,.8)}</g>`
      +fly(-92,104,firefly(192,74,1.15)+sparks(192,78,26,GL,8))
      +`<g class="pop">${coin(26,52,15)}${sparks(26,52,26,G,8)}${word(26,86,'+MANA',13,G)}</g>`);
    return shadow()+x.body(b);
  }
},
/* ===== 09 · Nemo & Dory ===== */
{
  id:'nemo',name:'Nemo & Dory',role:'Aléatoire',rarity:'Rare',rar:'var(--rare)',tint:'#d4f1ff',tint2:'#80c6ec',stats:[2,4,3],
  atk:'Tir de bulles.',skill:'Mémoire de poisson : effet aléatoire à chaque tir.',
  sh:{L:[74,82],R:[116,144]},
  poses:[{L:16,R:22},{L:66,R:70,body:[0,-4,0,1,1]},{L:-18,R:-28,body:[-4,0,-4,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const OR='#ff8a1e',ORD='#d55f14',BL='#3d7fe2',BLD='#2456ad',Y='#ffd23f',YD='#e0a91c';
    const bub=(a: string)=>`<circle cx="100" cy="106" r="97" ${a}/>`;
    let b=bub(`fill="#bfe9ff" opacity=".6"`);
    let sea=`<path d="M0 178 Q50 162 104 174 Q150 184 210 166 V215 H0Z" fill="#f2d49a" stroke="${O}" stroke-width="4"/>`;
    sea+=`<path d="M30 190 Q40 186 50 190 M120 194 Q132 190 144 194" stroke="#d9b06a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    sea+=`<g class="wig">${strand('M24 184 Q14 160 26 142 Q36 124 26 104','#58b55a',7,'#bff0a8')}</g><g class="wig">${strand('M40 182 Q48 166 40 152','#58b55a',6,'#bff0a8')}</g>`;
    let an='';([[150,172,-30],[158,166,-14],[166,164,0],[174,166,14],[182,172,30]] as const).forEach(([ax,ay,r])=>{const ex=ax+Math.sin(r*Math.PI/180)*22,ey=ay-Math.cos(r*Math.PI/180)*22;an+=strand(`M${ax} ${ay+8} Q${f((ax+ex)/2+4)} ${f((ay+ey)/2)} ${f(ex)} ${f(ey)}`,'#d27ae0',7,'#f7c8ff')});
    sea+=`<g class="wig">${an}</g>`+`<ellipse cx="66" cy="186" rx="9" ry="6" fill="#c9c3d9" stroke="${O}" stroke-width="3"/><ellipse cx="128" cy="190" rx="7" ry="5" fill="#e6a3b0" stroke="${O}" stroke-width="3"/>`;
    b+=clip(bub,sea);
    b+=x.when([1],`<g class="spin"><circle cx="100" cy="108" r="76" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="34 24" stroke-linecap="round" opacity=".8"/><circle cx="100" cy="108" r="58" fill="none" stroke="#9ad9ff" stroke-width="3" stroke-dasharray="20 30" stroke-linecap="round"/></g>`);
    const eye=(ex: number, ey: number, rx: number, ry: number, c: string, lx=1.5, ly=0)=>`<ellipse cx="${ex}" cy="${ey}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${O}" stroke-width="3"/><ellipse cx="${f(ex+lx)}" cy="${f(ey+ly)}" rx="${f(rx*.66)}" ry="${f(ry*.68)}" fill="${c}"/><ellipse cx="${f(ex+lx)}" cy="${f(ey+ly)}" rx="${f(rx*.36)}" ry="${f(ry*.4)}" fill="${O}"/><circle cx="${f(ex+lx+rx*.25)}" cy="${f(ey+ly-ry*.32)}" r="${f(rx*.24)}" fill="#fff"/>`;
    // --- Dory ---
    const dBody=(a: string)=>`<ellipse cx="76" cy="64" rx="32" ry="24" ${a}/>`;
    let dy=shadedW(a=>`<path d="M50 64 Q36 42 24 46 Q32 64 24 82 Q36 86 50 64Z" ${a}/>`,Y,YD,-3,-3,4.5);
    dy+=shadedW(a=>`<path d="M58 46 Q72 28 98 46Z" ${a}/>`,'#33343f','#1d1d26',-2,-2,4);
    dy+=shaded(dBody,BL,BLD,-5,-4);
    dy+=clip(dBody,`<path d="M80 42 Q60 44 58 58 Q58 72 76 76 Q90 78 100 72" stroke="${O}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M52 48 Q46 64 54 80" stroke="${O}" stroke-width="6" fill="none"/>`)+dBody(`fill="none" stroke="${O}" stroke-width="5"`);
    dy+=gloss(70,50,9,4,-15,.45);
    dy+=x.byPose(p=>{
      let s='';
      if(p==1) s+=`<path d="M82 60 Q87 53 92 60 M95 61 Q99 55 103 61" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      else s+=eye(87,59,7,8.5,'#6a4bd0',p==2?-1:1.5,p==2?-3:0)+eye(99,61,5,7.5,'#6a4bd0',p==2?-1:1,p==2?-3:0);
      if(p==0) s+=`<path d="M92 72 Q97 76 102 71" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      else if(p==1) s+=`<path d="M91 70 Q97 70 103 69 Q101 79 96 79 Q92 78 91 70Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
      else s+=`<path d="M91 74 Q94 71 97 74 Q100 77 103 73" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    dy+=x.arm('L',(sx,sy)=>shadedW(a=>`<path d="M${sx-4} ${sy} Q${sx-12} ${sy+12} ${sx-4} ${sy+19} Q${sx+6} ${sy+14} ${sx+5} ${sy}Z" ${a}/>`,Y,YD,-2,-2,3.5));
    // --- Nemo ---
    const nBody=(a: string)=>`<ellipse cx="118" cy="124" rx="42" ry="34" ${a}/>`;
    let nm=shadedW(a=>`<path d="M84 124 Q66 96 52 102 Q62 124 52 146 Q66 152 84 124Z" ${a}/>`,OR,ORD,-3,-3,4.5);
    nm+=`<path d="M57 104 Q66 124 57 144" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M57 104 Q66 124 57 144" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    nm+=shadedW(a=>`<path d="M96 96 Q106 70 132 84 Q138 92 136 98Z" ${a}/>`,OR,ORD,-2,-2,4.5)+`<path d="M101 86 Q110 74 128 82" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    nm+=shaded(nBody,OR,ORD,-6,-5);
    nm+=clip(nBody,`<g fill="none" stroke-linecap="round"><path d="M128 88 Q138 124 128 160" stroke="${O}" stroke-width="20"/><path d="M128 88 Q138 124 128 160" stroke="#fff" stroke-width="12"/><path d="M100 88 Q93 124 100 160" stroke="${O}" stroke-width="18"/><path d="M100 88 Q93 124 100 160" stroke="#fff" stroke-width="10"/><path d="M82 100 Q78 124 82 148" stroke="${O}" stroke-width="13"/><path d="M82 100 Q78 124 82 148" stroke="#fff" stroke-width="6"/></g>`)+nBody(`fill="none" stroke="${O}" stroke-width="5"`);
    nm+=gloss(112,100,12,5,-12,.45);
    nm+=x.byPose(p=>{
      let s='';
      if(p==1) s+=`<path d="M139 98 L153 103 M151 99 L163 104" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`;
      s+=eye(146,111,8,10,'#e0701b',2,p==1?1:0)+eye(158,113,6,9,'#e0701b',1.5,p==1?1:0);
      if(p==0) s+=`<path d="M146 134 Q152 139 158 132" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      else if(p==1) s+=`<path d="M145 132 Q152 131 159 130 Q157 139 152 139 Q147 138 145 132Z" fill="#fff" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><path d="M146 135 H158" stroke="${O}" stroke-width="1.5"/>`;
      else s+=`<ellipse cx="154" cy="134" rx="5.5" ry="6.5" fill="#7a1f2b" stroke="${O}" stroke-width="3"/>`;
      return s;
    });
    nm+=x.arm('R',(sx,sy)=>shadedW(a=>`<path d="M${sx-4} ${sy} Q${sx-13} ${sy+11} ${sx-6} ${sy+19} Q${sx+4} ${sy+17} ${sx+5} ${sy+2}Z" ${a}/>`,OR,ORD,-2,-2,3.5)+`<path d="M${sx-9} ${sy+13} Q${sx-3} ${sy+19} ${sx+3} ${sy+14}" stroke="#fff" stroke-width="2" fill="none"/>`);
    b+=x.mv('swimB',['none','translate(18px,-4px)','none'],`<g transform="translate(76 64) scale(1.08) translate(-76 -64)">${dy}</g>`);
    b+=x.mv('swimA',['none','translate(-12px,-12px)','none'],`<g transform="translate(118 124) scale(1.12) translate(-118 -124)">${nm}</g>`);
    // paroi de la bulle
    b+=bub(`fill="none" stroke="#fff" stroke-width="3" opacity=".7" transform="translate(100 106) scale(.95) translate(-100 -106)"`)+bub(`fill="none" stroke="${O}" stroke-width="5"`);
    b+=gloss(50,44,22,8,-42,.65)+gloss(162,168,8,3,-42,.5)+`<circle cx="34" cy="74" r="4" fill="#fff" opacity=".6"/>`;
    b+=x.when([0,1],`<g class="fx">${dot(170,98,4,'#eaf9ff')}${dot(178,82,3,'#eaf9ff')}</g>`);
    // frappe : jet de bulles à effets aléatoires
    const icon=[
      (cx: number,cy: number)=>`<polygon points="${star(cx,cy,6,2.6,5,-Math.PI/2)}" fill="${Y}" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`,
      (cx: number,cy: number)=>`<path d="M${cx+1} ${cy-7} L${cx-4} ${cy+1} L${cx+1} ${cy+1} L${cx-1} ${cy+7} L${cx+5} ${cy-2} L${cx} ${cy-2}Z" fill="#ffe066" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`,
      (cx: number,cy: number)=>`<path d="M${cx-6} ${cy}H${cx+6}M${cx-3} ${cy-5}L${cx+3} ${cy+5}M${cx+3} ${cy-5}L${cx-3} ${cy+5}" stroke="#4fb3ff" stroke-width="2.4" stroke-linecap="round"/>`];
    const bb=(bx: number, by: number, r: number, ic: any)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#e8f9ff" fill-opacity=".75" stroke="${O}" stroke-width="3"/><ellipse cx="${f(bx-r*.35)}" cy="${f(by-r*.4)}" rx="${f(r*.3)}" ry="${f(r*.16)}" transform="rotate(-35 ${f(bx-r*.35)} ${f(by-r*.4)})" fill="#fff"/>`+(ic!=null?icon[ic]!(bx,by):'');
    let st='';([[180,134,7],[200,118,10],[222,140,14,0],[228,96,13,1],[198,80,12,2],[190,164,8]] as const).forEach(([bx,by,r,ic],i)=>{st+=fly(164-bx,136-by,bb(bx,by,r,ic),i*.05)});
    b+=x.when([2],st+`<g class="pop">${sparks(172,136,12,'#fff',6)}</g>`
      +`<g class="pop"><rect x="98" y="6" width="30" height="30" rx="7" fill="${Y}" stroke="${O}" stroke-width="4"/><rect x="101" y="9" width="24" height="5" rx="2" fill="#fff" opacity=".55"/>${word(113,31,'?',24,'#fff')}${sparks(113,21,26,'#fff3a0',8)}</g>`);
    return shadow(68)+x.body(b);
  }
},
/* ===== 10 · Coco (Miguel) ===== */
{
  id:'coco',name:'Coco (Miguel)',role:'Soutien',rarity:'Épique',rar:'var(--epi)',tint:'#ffe4cc',tint2:'#f4a867',stats:[2,3,4],
  atk:'Notes de musique.',skill:'Remember Me : ressuscite un héros détruit.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:-30,R:-128},{L:-62,R:-132,body:[0,-3,-4,1,1]},{L:-8,R:-124,body:[2,-7,4,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const S='#c68a5e',SD='#9b6340',R='#d8343c',RD='#9a1f29',H='#2f2433',HD='#140d18',GW='#f7f2e6',GWD='#d2c6ae',GO='#f2b33d',MG='#ff9a1f',GL='#ffd36a';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,R,15)+`<rect x="${sx-10}" y="${sy+27}" width="20" height="8" rx="3" fill="${RD}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+40,S);
    let b='';
    b+=x.when([2],`<g class="fx"><ellipse cx="100" cy="112" rx="98" ry="104" fill="${GL}" opacity=".2"/><ellipse cx="100" cy="112" rx="76" ry="84" fill="${GL}" opacity=".18"/></g>`);
    b+=x.when([0],`<g class="wig">${petal(28,70,7,-30)}${petal(176,56,6,40)}${petal(20,150,6,10)}</g>`);
    b+=torso(R,RD);
    b+=`<path d="M64 170 Q70 186 66 200 M136 170 Q130 186 134 200" stroke="${RD}" stroke-width="3" fill="none"/>`;
    b+=shaded(a=>`<path d="M62 146 Q58 132 76 128 Q100 138 124 128 Q142 132 138 146 Q100 160 62 146Z" ${a}/>`,R,RD,-3,-4);
    b+=`<path d="M92 150 L90 170 M108 150 L110 168" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M92 150 L90 170 M108 150 L110 168" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
    b+=head(S,SD);
    b+=shaded(a=>`<path d="M44 92 Q34 34 96 22 Q160 22 158 88 L150 72 L146 86 L138 62 L128 76 L120 58 L110 72 L98 56 L88 72 L76 58 L70 76 L58 64 L54 82Z" ${a}/>`,'#463a4c',H,-4,-4);
    b+=shaded(a=>`<path d="M84 32 Q74 18 84 8 Q86 20 98 22 Q96 8 110 2 Q106 16 114 24 Q122 14 132 16 Q120 24 120 34Z" ${a}/>`,'#463a4c',H,-2,-2)+gloss(78,40,12,4,-20,.3);
    b+=x.byPose(p=>{
      if(p==0) return face(0,{eye:'#4a2a1a'});
      const brows=`<path d="M71 80 Q80 72 89 79 M111 79 Q120 72 129 80" stroke="${O}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      if(p==1) return brows+`<path d="M71 97 Q80 87 89 97 M111 97 Q120 87 129 97" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="118" rx="7.5" ry="9" fill="#7a1f2b" stroke="${O}" stroke-width="3.5"/><path d="M95 123 Q100 120 105 123" stroke="#e85a6e" stroke-width="2.5" fill="none"/>`+cheeks;
      return face(0,{eye:'#4a2a1a',noMouth:true})+bigMouth;
    });
    // guitare blanche à tête de mort
    let gt=`<path d="M100 168 L176 112" stroke="${O}" stroke-width="14" stroke-linecap="round"/><path d="M100 168 L176 112" stroke="#6a4630" stroke-width="7.5" stroke-linecap="round"/>`;
    gt+=[.35,.5,.65,.8].map(t=>{const px=100+76*t,py=168-56*t;return `<path d="M${f(px-2.2)} ${f(py-3)} L${f(px+2.2)} ${f(py+3)}" stroke="${GO}" stroke-width="1.8"/>`}).join('');
    gt+=`<g transform="rotate(54 186 102)"><path d="M174 94 Q174 83 186 83 Q198 83 198 94 Q198 102 193 104 V111 H179 V104 Q174 102 174 94Z" fill="${GW}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="181" cy="95" r="3.4" fill="${O}"/><circle cx="191" cy="95" r="3.4" fill="${O}"/><path d="M186 99 l-1.8 3.2 h3.6z" fill="${O}"/><path d="M182 106 V111 M186 106 V111 M190 106 V111" stroke="${O}" stroke-width="1.6"/><circle cx="174" cy="90" r="2" fill="${GO}" stroke="${O}" stroke-width="1"/><circle cx="198" cy="90" r="2" fill="${GO}" stroke="${O}" stroke-width="1"/></g>`;
    const gb=[[78,184,25],[102,162,19]] as const;
    gt+=gb.map(([cx,cy,r])=>`<circle cx="${cx}" cy="${cy}" r="${r+2.5}" fill="${O}"/>`).join('');
    const gs=(a: string)=>gb.map(([cx,cy,r])=>`<circle cx="${cx}" cy="${cy}" r="${r}" ${a}/>`).join('');
    gt+=clip(gs,`${gs(`fill="${GWD}"`)}<g transform="translate(-5 -5)">${gs(`fill="${GW}"`)}</g><path d="M62 196 Q66 206 80 206 M118 156 Q120 166 112 174" stroke="${GO}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
    gt+=`<circle cx="92" cy="172" r="8" fill="${O}"/><circle cx="92" cy="172" r="10.5" fill="none" stroke="${GO}" stroke-width="2.5"/>`;
    gt+=`<path d="M70 196 L80 204" stroke="#5a3a24" stroke-width="6" stroke-linecap="round" transform="rotate(-80 75 200)"/>`;
    gt+=`<g stroke="#8d8576" stroke-width="1" opacity=".9"><path d="M74 198 L174 110"/><path d="M77 200 L177 113"/><path d="M71 196 L171 108"/></g>`;
    gt+=x.when([1],glow(90,176,20,MG));
    b+=gt;
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    // préparation : grattage, pétales en tourbillon
    let ring='';for(let i=0;i<8;i++){const a=i*Math.PI/4;ring+=petal(100+Math.cos(a)*92,112+Math.sin(a)*92,7,i*45+90)}
    b+=x.when([1],`<g class="spin">${ring}</g>`+`<g class="fx">${note(126,182,.7,MG)}${note(60,160,.6,GL)}</g>`+`<path d="M60 186 l-10 4 M58 176 l-12 -2 M62 196 l-8 8" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`);
    // frappe : vague de notes + pétales + halo doré de résurrection
    let wv='';
    ([[166,34,MG],[204,62,GL],[226,108,MG],[214,154,GL],[186,190,MG]] as const).forEach(([nx,ny,c],i)=>{wv+=fly(90-nx,176-ny,note(nx,ny,1.05,c)+`<circle cx="${nx}" cy="${ny}" r="15" fill="${GL}" opacity=".25"/>`,i*.05)});
    ([[140,16,20],[232,64,-30],[236,150,60],[200,206,10],[150,200,-40],[186,120,30]] as const).forEach(([px,py,r],i)=>{wv+=fly(90-px,176-py,petal(px,py,7,r),.08+i*.04)});
    b+=x.when([2],rope('M104 176 Q134 204 166 184 T236 166','#ffb347',3.5,'draw')+wv
      +`<g class="ring"><circle cx="100" cy="110" r="96" fill="none" stroke="${GL}" stroke-width="7"/></g>`
      +`<g class="pop">${plus(22,58,7,GL)}${plus(36,30,5,'#fff3b0')}${plus(12,120,5,GL)}${twinkle(56,10,8,'#fff3b0')}</g>`);
    return shadow()+x.body(b);
  }
},
/* ===== 11 · Judy & Nick ===== */
{
  id:'nickjudy',name:'Judy & Nick',role:'Contrôle / malus',rarity:'Épique',rar:'var(--epi)',tint:'#dde6ff',tint2:'#97b0e8',stats:[3,4,3],
  atk:'Tir de carotte.',skill:'Arrestation : stoppe un ennemi 2 s ; Nick réduit l’armure.',
  sh:{L:[68,150],R:[132,150],J:[4,182]},
  poses:[{L:12,R:-12,J:10},{L:-34,R:-150,J:168,body:[-2,-5,-3,1,1]},{L:20,R:-96,J:140,body:[4,-3,4,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const FU='#b7b7c9',FUD='#8b8ba4',PK='#f4a6bb',NV='#2b4a93',NVD='#1c3168',G='#f6c64a',GD='#cf962a',NF='#e2753a',NFD='#b3532a',NC='#f7e4c8',NS='#7fb069',NSD='#55803f';
    const badge=(cx: number, cy: number, s=1)=>`<g transform="translate(${cx} ${cy}) scale(${s})"><path d="M0 -14 L12 -9 Q12 6 0 14 Q-12 6 -12 -9Z" fill="${G}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><polygon points="${star(0,0,7,3,5,-Math.PI/2)}" fill="#fff3c4" stroke="${GD}" stroke-width="1.5"/></g>`;
    // --- Nick (personnage principal) ---
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,NS,15)+`<rect x="${sx-9}" y="${sy+27}" width="18" height="7" rx="3" fill="${NSD}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+40,NF);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([2],`<path d="M${sx} ${sy+46} V${sy+60}" stroke="${O}" stroke-width="12" stroke-linecap="round"/><path d="M${sx} ${sy+46} V${sy+60}" stroke="${NF}" stroke-width="6.5" stroke-linecap="round"/><path d="M${sx+9} ${sy+38} L${sx+14} ${sy+34}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${sx+9} ${sy+38} L${sx+14} ${sy+34}" stroke="${NF}" stroke-width="5" stroke-linecap="round"/>`)+hand(sx,sy+40,NF);
    let b='';
    const ear=`<polygon points="52,62 44,2 92,36" fill="${NF}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><polygon points="58,50 52,18 80,38" fill="#5a3324"/>`;
    b+=ear+mirror(ear);
    b+=torso(NS,NSD);
    b+=`<g fill="${NSD}" opacity=".8"><ellipse cx="72" cy="170" rx="5" ry="2.5" transform="rotate(-30 72 170)"/><ellipse cx="128" cy="166" rx="5" ry="2.5" transform="rotate(30 128 166)"/><ellipse cx="76" cy="192" rx="5" ry="2.5" transform="rotate(20 76 192)"/><ellipse cx="126" cy="190" rx="5" ry="2.5" transform="rotate(-20 126 190)"/></g>`;
    b+=`<path d="M82 137 L100 150 L118 137 L116 146 L100 156 L84 146Z" fill="#c9e6b4" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b+=`<path d="M100 150 L91 158 L97 196 L100 202 L103 196 L109 158Z" fill="#5865b8" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M94 170 L106 166 M95 182 L106 178" stroke="#a9b3ff" stroke-width="2.5"/>`;
    b+=head(NF,NFD);
    b+=`<path d="M50 104 Q100 82 150 104 Q142 146 100 148 Q58 146 50 104Z" fill="${NC}"/>`;
    b+=`<ellipse cx="100" cy="112" rx="11" ry="7.5" fill="${O}"/><ellipse cx="96" cy="109" rx="3.5" ry="2" fill="#fff" opacity=".7"/>`;
    b+=x.byPose(p=>{
      let s='';
      const eo=(ex: number)=>`<ellipse cx="${ex}" cy="94" rx="8" ry="9.5" fill="#4cae4c"/><ellipse cx="${ex+(p==1?-3:1)}" cy="95" rx="3.6" ry="6" fill="${O}"/><circle cx="${ex+2.5}" cy="91" r="2.6" fill="#fff"/><path d="M${ex-11} 87 Q${ex} 82 ${ex+11} 87 L${ex+11} 93 Q${ex} 87 ${ex-11} 93Z" fill="${NFD}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
      if(p==2) s+=`<path d="M70 95 Q80 88 90 95" stroke="${O}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`+eo(120);
      else s+=eo(80)+eo(120);
      s+=p==1?`<path d="M68 80 L90 82 M110 78 Q120 68 132 74" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/>`
             :`<path d="M68 79 L90 84 M110 84 L132 78" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`;
      s+=p==2?`<path d="M80 124 Q100 140 122 120 Q114 138 100 139 Q86 138 80 124Z" fill="#fff" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M86 129 Q100 134 116 127" stroke="${O}" stroke-width="1.6" fill="none"/>`
             :p==1?`<path d="M84 128 Q100 132 120 122" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
             :`<path d="M82 126 Q100 134 120 124 Q122 120 124 119" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b+=x.arm('L',armIn)+x.arm('R',armR);
    // --- Judy (partenaire, plus petite) ---
    b+=x.byPose(p=>{
      const a=[-8,-2,-14][p]!;
      const earS=(cx: number)=>(e: string)=>`<ellipse cx="${cx}" cy="104" rx="6.5" ry="17" ${e}/>`;
      const ear=(cx: number)=>`<g transform="rotate(${cx<22?a:-a} ${cx} 120)">${shadedW(earS(cx),FU,FUD,-2,-2,3.5)}<ellipse cx="${cx}" cy="106" rx="3" ry="11" fill="${PK}"/>${clip(earS(cx),`<ellipse cx="${cx}" cy="88" rx="8" ry="5" fill="#4a4a5c"/>`)}${earS(cx)(`fill="none" stroke="${O}" stroke-width="3.5"`)}</g>`;
      let s=ear(13)+ear(31);
      s+=shadedW(e=>`<path d="M0 206 C-1 184 8 174 22 174 C36 174 45 184 44 206Z" ${e}/>`,NV,NVD,-4,-3,4.5);
      s+=`<path d="M16 175 L22 183 L28 175Z" fill="#a9c8f2" stroke="${O}" stroke-width="2" stroke-linejoin="round"/><path d="M1 198 Q22 203 43 198" stroke="#30303f" stroke-width="5"/>`+badge(32,188,.42);
      s+=`<g fill="none" stroke="${O}" stroke-width="3.5"><circle cx="8" cy="204" r="3.6"/><circle cx="15" cy="204" r="3.6"/></g><g fill="none" stroke="#c9ced8" stroke-width="1.6"><circle cx="8" cy="204" r="3.6"/><circle cx="15" cy="204" r="3.6"/></g>`;
      s+=limb(40,182,42,198,NV,8)+hand(42,200,FU,6.5);
      s+=shadedW(e=>`<circle cx="22" cy="146" r="26" ${e}/>`,FU,FUD,-5,-4,4.5);
      s+=`<ellipse cx="22" cy="161" rx="12" ry="8" fill="#efedf5"/>`;
      [13,31].forEach(ex=>{s+=`<ellipse cx="${ex}" cy="148" rx="4.4" ry="${p==2?4.6:5.4}" fill="#7a4fc6"/><ellipse cx="${ex}" cy="146" rx="3.6" ry="2.2" fill="${O}" opacity=".45"/><circle cx="${ex+1.4}" cy="146" r="1.6" fill="#fff"/>`});
      s+=p?`<path d="M6 139 L17 142 M27 142 L38 139" stroke="${O}" stroke-width="2.8" stroke-linecap="round"/>`:`<path d="M8 140 Q13 137 18 140 M26 140 Q31 137 36 140" stroke="${O}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      s+=`<path d="M19.5 155 H24.5 L22 158.5Z" fill="#f27a9a" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`;
      s+=p==2?`<path d="M16 161 Q22 160 28 161 Q27 169 22 169 Q17 169 16 161Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/><rect x="20" y="161" width="4" height="3" fill="#fff"/>`
             :p==1?`<path d="M17 163 Q22 164 28 160" stroke="${O}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
             :`<path d="M17 161 Q19.5 164 22 161 Q24.5 164 27 161" stroke="${O}" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="20.5" y="162" width="3" height="2.6" fill="#fff" stroke="${O}" stroke-width="1"/>`;
      s+=`<ellipse cx="8" cy="156" rx="4" ry="2.4" fill="#ff7c7c" opacity=".4"/><ellipse cx="36" cy="156" rx="4" ry="2.4" fill="#ff7c7c" opacity=".4"/>`;
      return s;
    });
    b+=x.arm('J',(sx,sy)=>limb(sx,sy,sx,sy+17,NV,8)+hand(sx,sy+21,FU,6.5)
      +x.when([1],`<g transform="rotate(-168 ${sx} ${sy+36})">${glow(sx,sy+36,18,'#fff3a0')}${badge(sx,sy+36,.9)}</g>`));
    // préparation : l'insigne de Judy brille, Nick jette un œil
    const [bx0,by0]=tip(this,'J',1,36);
    b+=x.when([1],sparks(bx0,by0,22,G,8));
    // frappe : Judy lance le stylo-carotte (rebond), Nick fait un clin d'œil + pistolet du doigt
    const [hx,hy]=tip(this,'J',2,22);
    const carrot=(cx: number, cy: number)=>`<g transform="translate(${cx} ${cy}) scale(-1 1) rotate(-18)"><path d="M-13 -6 Q-17 0 -13 6 L15 1.5 Q17 0 15 -1.5Z" fill="#ff8a2a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M-6 -3 l3 2 M2 -2 l3 2 M-4 3 l3 -1" stroke="#c75a12" stroke-width="1.6" stroke-linecap="round"/><path d="M-13 -2 l-9 -7 M-13 0 l-11 0 M-13 2 l-9 7" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M-13 -2 l-9 -7 M-13 0 l-11 0 M-13 2 l-9 7" stroke="#4caf50" stroke-width="2.6" stroke-linecap="round"/><rect x="-11" y="-2" width="6" height="4" rx="1" fill="#e8413b" stroke="${O}" stroke-width="1.2"/></g>`;
    const ex=-12,ey=94,bx=-26,by=194;
    b+=x.when([2],`<path d="M${f(hx)} ${f(hy)} Q${f((hx+bx)/2)} ${f(hy-20)} ${bx} ${by} Q${(bx+ex)/2-8} ${ey-30} ${ex} ${ey}" stroke="#fff" stroke-width="4" stroke-dasharray="1 9" stroke-linecap="round" fill="none"/>`
      +`<g class="pop"><path d="M${bx-10} ${by+6} l-5 4 M${bx+10} ${by+6} l5 4 M${bx} ${by+8} v6" stroke="${O}" stroke-width="3" stroke-linecap="round"/></g>`
      +`<g class="hop" style="--fx:${f(hx-ex)}px;--fy:${f(hy-ey)}px;--bx:${bx-ex}px;--by:${by-ey}px">${carrot(ex,ey)}</g>`
      +`<g class="pop">${sparks(ex-4,ey,20,'#ffb15c',8)}${word(ex,ey-24,'2 s',15,'#fff')}</g>`);
    const [fx0,fy0]=tip(this,'R',2,60);
    b+=x.when([2],`<g class="pop">${sparks(fx0+4,fy0,14,'#fff',6)}${twinkle(64,80,8,'#fff')}${word(194,124,'-ARMURE',15,'#ff6f6f')}<g transform="translate(196 98)"><path d="M0 -10 L10 -7 Q10 6 0 11 Q-10 6 -10 -7Z" fill="#c9ced8" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/><path d="M1 -9 L-2 0 L2 2 L-1 10" stroke="${O}" stroke-width="2.2" fill="none"/></g></g>`);
    return shadow(76)+x.body(b);
  }
},
/* ===== 12 · Buzz l'Éclair & Woody ===== */
{
  id:'buzzwoody',name:'Buzz l’Éclair & Woody',role:'Duo / polyvalent',rarity:'Légendaire',rar:'var(--leg)',tint:'#e5ddff',tint2:'#ab98e6',stats:[4,3,4],
  atk:'Laser de Buzz.',skill:'Vers l’infini : laser perçant ; le lasso de Woody attrape un ennemi.',
  sh:{L:[68,150],R:[132,150],W:[0,176]},
  poses:[{L:12,R:-12,W:10},{L:-30,R:-118,W:172,body:[-2,-4,-3,1,1]},{L:-24,R:-112,W:148,body:[-5,0,-5,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const W='#f4f4f8',WD='#c6c6d6',GR='#6cc04a',GRD='#3f8a2c',PU='#8a5cc4',PUD='#5f3a94',LR='#ff2b4a',HT='#8a5a2b',HTD='#5e3b1a',YS='#f2cf4a',YSD='#c99f26';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,W,15)+`<rect x="${sx-9}" y="${sy+14}" width="18" height="7" rx="3" fill="${GR}" stroke="${O}" stroke-width="3"/><rect x="${sx-10}" y="${sy+26}" width="20" height="8" rx="3" fill="${PU}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+40,PU);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+`<rect x="${sx+4}" y="${sy+18}" width="9" height="13" rx="2.5" fill="#e23b3b" stroke="${O}" stroke-width="3"/><circle cx="${sx+8.5}" cy="${sy+29}" r="2.2" fill="#ffd0d6"/>`;
    let b='';
    b+=torso(W,WD);
    const pan=`<path d="M58 202 C56 172 62 152 74 144 L84 202Z" fill="${GR}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
    b+=pan+mirror(pan);
    b+=`<path d="M62 188 Q100 198 138 188 L140 203 L60 203Z" fill="${PU}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
    b+=`<rect x="102" y="155" width="26" height="22" rx="4" fill="#c9ced8" stroke="${O}" stroke-width="3.5"/><circle cx="109" cy="166" r="3.4" fill="#e8413b" stroke="${O}" stroke-width="1.8"/><circle cx="117" cy="162" r="3.4" fill="${GR}" stroke="${O}" stroke-width="1.8"/><circle cx="121" cy="171" r="3.4" fill="#4f8ff0" stroke="${O}" stroke-width="1.8"/>`;
    b+=`<circle cx="84" cy="164" r="9" fill="${PU}" stroke="${O}" stroke-width="3"/><path d="M78 166 Q84 158 91 161" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=head(PU,PUD);
    b+=shaded(a=>`<ellipse cx="100" cy="102" rx="40" ry="36" ${a}/>`,SK,SKD,-6,-5);
    b+=x.byPose(p=>{
      let s=face(p,{eye:'#5a86c8',brow:'#5a3a2a',noMouth:true});
      if(p==1) s+=`<ellipse cx="80" cy="95" rx="10" ry="12" fill="${SK}"/><path d="M71 97 Q80 101 89 97" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      s+=p==2?bigMouth:p==1?`<path d="M90 117 Q100 116 110 112" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:`<path d="M90 114 Q100 122 110 114" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      return s+`<path d="M98 132 Q100 135 102 132" stroke="${SKD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    });
    // casque-bulle
    b+=`<circle cx="100" cy="86" r="64" fill="#e6f7ff" fill-opacity=".22" stroke="${O}" stroke-width="5"/><path d="M48 66 Q58 34 92 26" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/><path d="M152 104 Q148 124 134 136" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>`+gloss(70,40,10,4,-40,.8);
    b+=shaded(a=>`<path d="M58 146 Q100 160 142 146 L140 136 Q100 150 60 136Z" ${a}/>`,GR,GRD,-2,-2);
    b+=x.arm('L',armIn)+x.arm('R',armR);
    b+=shaded(a=>`<circle cx="64" cy="147" r="14" ${a}/>`,W,WD,-4,-4)+shaded(a=>`<circle cx="136" cy="147" r="14" ${a}/>`,W,WD,-4,-4);
    // préparation : viseur
    const [ax,ay]=tip(this,'R',1,36),[adx,ady]=dirOf(this,'R',1);
    b+=x.when([1],`<g class="fx"><path d="M${f(ax+adx*10)} ${f(ay+ady*10)} L${f(ax+adx*80)} ${f(ay+ady*80)}" stroke="${LR}" stroke-width="2" stroke-dasharray="4 6" opacity=".8"/>${glow(f(ax),f(ay),11,LR)}</g>`);
    // frappe : laser fin et perçant
    const [lx,ly]=tip(this,'R',2,34),[dx,dy]=dirOf(this,'R',2),L2=150,rx=lx+dx*66,ry=ly+dy*66;
    let pew='';for(let i=0;i<4;i++){const d=24+i*30;pew+=`<path d="M${f(lx+dx*d-dy*9)} ${f(ly+dy*d+dx*9)} L${f(lx+dx*d+dy*9)} ${f(ly+dy*d-dx*9)}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>`}
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(lx)}px ${f(ly)}px"><path d="M${f(lx)} ${f(ly)} L${f(lx+dx*L2)} ${f(ly+dy*L2)}" stroke="${LR}" stroke-width="20" opacity=".25" stroke-linecap="round"/><path d="M${f(lx)} ${f(ly)} L${f(lx+dx*L2)} ${f(ly+dy*L2)}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${f(lx)} ${f(ly)} L${f(lx+dx*L2)} ${f(ly+dy*L2)}" stroke="${LR}" stroke-width="6" stroke-linecap="round"/><path d="M${f(lx)} ${f(ly)} L${f(lx+dx*L2)} ${f(ly+dy*L2)}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>${pew}</g>`
      +`<g class="pop"><circle cx="${f(lx)}" cy="${f(ly)}" r="10" fill="#fff" stroke="${LR}" stroke-width="4"/></g><g class="ring"><circle cx="${f(lx)}" cy="${f(ly)}" r="16" fill="none" stroke="${LR}" stroke-width="3"/></g>`
      +`<g class="pop"><circle cx="${f(rx)}" cy="${f(ry)}" r="13" fill="none" stroke="${O}" stroke-width="6"/><circle cx="${f(rx)}" cy="${f(ry)}" r="13" fill="none" stroke="${LR}" stroke-width="3"/><path d="M${f(rx-20)} ${f(ry)} H${f(rx-8)} M${f(rx+8)} ${f(ry)} H${f(rx+20)} M${f(rx)} ${f(ry-20)} V${f(ry-8)} M${f(rx)} ${f(ry+8)} V${f(ry+20)}" stroke="${LR}" stroke-width="3" stroke-linecap="round"/>${sparks(rx,ry,22,'#ffd0d6',8)}</g>`);
    // Woody
    const wBody=(a: string)=>`<path d="M-4 206 C-5 182 5 168 20 168 C35 168 45 182 44 206Z" ${a}/>`;
    b+=x.byPose(p=>{
      let s=shadedW(wBody,YS,YSD,-4,-3,4.5);
      s+=clip(wBody,`<g stroke="#d9483b" stroke-width="2" opacity=".75"><path d="M6 168 V206 M14 168 V206 M26 168 V206 M34 168 V206 M-4 182 H44 M-4 192 H44"/></g>`);
      s+=`<path d="M-4 206 C-5 184 2 172 10 170 L12 206Z" fill="#f7f5ef" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M44 206 C45 184 38 172 30 170 L28 206Z" fill="#f7f5ef" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      s+=`<g fill="${O}"><ellipse cx="2" cy="186" rx="3" ry="4"/><ellipse cx="6" cy="198" rx="2.5" ry="2"/><ellipse cx="38" cy="194" rx="2.5" ry="3.5"/></g>`;
      s+=`<polygon points="${star(36,182,7,3,5,-Math.PI/2)}" fill="#f6c64a" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;
      s+=`<path d="M12 166 L28 166 L20 176Z" fill="#d6303a" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
      s+=limb(40,178,42,196,YS,8)+hand(42,198,SK,6.5);
      s+=shadedW(a=>`<circle cx="20" cy="140" r="25" ${a}/>`,SK,SKD,-5,-4,4.5);
      s+=`<path d="M-3 130 Q-2 140 2 146 M43 130 Q42 140 38 146" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      const ey=144;
      s+=[12,28].map(ex=>`<ellipse cx="${ex}" cy="${ey}" rx="4.2" ry="${p==2?4.6:5.4}" fill="#5a3420"/><circle cx="${ex+1.4}" cy="${ey-2}" r="1.6" fill="#fff"/>`).join('');
      s+=p==1?`<path d="M6 135 Q12 131 17 135 M23 135 Q28 131 34 135" stroke="#5a3420" stroke-width="2.8" fill="none" stroke-linecap="round"/>`:`<path d="M6 137 L17 138 M23 138 L34 136" stroke="#5a3420" stroke-width="2.8" stroke-linecap="round"/>`;
      s+=p==1?`<path d="M13 154 Q20 152 27 154 Q25 163 20 163 Q15 163 13 154Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`:p==2?`<path d="M13 155 Q20 159 28 152" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`:`<path d="M13 154 Q20 160 27 154" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s+=`<ellipse cx="7" cy="150" rx="4" ry="2.5" fill="#ff7c7c" opacity=".4"/><ellipse cx="33" cy="150" rx="4" ry="2.5" fill="#ff7c7c" opacity=".4"/>`;
      s+=shadedW(a=>`<ellipse cx="20" cy="120" rx="33" ry="7.5" ${a}/>`,HT,HTD,-3,-3,4);
      s+=shadedW(a=>`<path d="M3 120 Q1 96 10 96 Q20 103 30 96 Q39 96 37 120Z" ${a}/>`,HT,HTD,-3,-3,4);
      s+=`<path d="M4 114 Q20 118 36 114" stroke="${HTD}" stroke-width="4" fill="none"/>`+gloss(12,104,4,2,-20,.45);
      return s;
    });
    b+=x.arm('W',(sx,sy)=>limb(sx,sy,sx,sy+20,YS,8)+hand(sx,sy+24,SK,6.5)
      +x.when([0],`<g fill="none" stroke-width="3.5"><ellipse cx="${sx}" cy="${sy+34}" rx="8" ry="10" stroke="${O}" stroke-width="6.5"/><ellipse cx="${sx}" cy="${sy+34}" rx="8" ry="10" stroke="#d9b56a"/></g>`)
      +x.when([1],`<path d="M${sx} ${sy+26} V${sy+80}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${sx} ${sy+26} V${sy+80}" stroke="#d9b56a" stroke-width="3" stroke-linecap="round"/><ellipse cx="${sx}" cy="${sy+90}" rx="24" ry="9" fill="none" stroke="${O}" stroke-width="7"/><ellipse class="lasso" cx="${sx}" cy="${sy+90}" rx="24" ry="9" fill="none" stroke="#d9b56a" stroke-width="3.5" stroke-dasharray="12 6"/>`));
    const [wx,wy]=tip(this,'W',2,24);
    b+=x.when([2],rope(`M${f(wx)} ${f(wy)} Q-36 100 0 60`,'#d9b56a',3.5,'draw')+`<g class="pop">${enemy(2,42,.85)}<ellipse cx="2" cy="52" rx="19" ry="8" fill="none" stroke="${O}" stroke-width="7"/><ellipse cx="2" cy="52" rx="19" ry="8" fill="none" stroke="#d9b56a" stroke-width="3.5"/>${twinkle(-18,30,6)}${twinkle(22,26,5)}</g>`);
    return shadow(80)+x.body(b);
  }
},
/* ===== 13 · Raiponce & Pascal ===== */
{
  id:'rapunzel',name:'Raiponce & Pascal',role:'Contrôle / soin',rarity:'Épique',rar:'var(--epi)',tint:'#f7e0fb',tint2:'#d5a0e8',stats:[2,3,3],
  atk:'Coup de poêle.',skill:'Cheveux magiques : soigne et renforce les alliés ; Pascal se camoufle.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-48},{L:40,R:-166,body:[0,-6,-4,1,1]},{L:18,R:-64,body:[3,2,3,1.03,.97]}],
  draw(this: CharDef, x: Ctx): string {
    const HR='#f7cf4f',HRD='#d9a42c',HL='#fff1a8',PUR='#7d4fae',PURD='#56317f',PK='#f0a7d2',PKD='#c978aa',GL='#ffe066';
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,SK,14)+hand(sx,sy+38,SK);
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,SK,14)
      +`<rect x="${sx-4}" y="${sy+38}" width="8" height="18" rx="3" fill="#6a4630" stroke="${O}" stroke-width="3.5"/>`
      +shaded(a=>`<ellipse cx="${sx}" cy="${sy+70}" rx="18" ry="19" ${a}/>`,'#6d7488','#3f4455',-4,-4)
      +`<ellipse cx="${sx}" cy="${sy+70}" rx="11" ry="12" fill="none" stroke="#8d95a8" stroke-width="2.5"/>`+gloss(sx-7,sy+62,5,2.5,-40,.6)
      +hand(sx,sy+38,SK);
    let b='';
    // longue chevelure derrière
    b+=x.when([1],`<g class="fx"><path d="M42 70 Q18 140 6 206 L194 206 Q182 140 158 70Z" fill="${GL}" opacity=".35" transform="translate(100 140) scale(1.12) translate(-100 -140)"/></g>`);
    b+=x.when([1],`<g class="fx"><path d="M46 72 Q26 130 16 204 L184 204 Q174 130 154 72Z" fill="none" stroke="#fff3a0" stroke-width="16" stroke-linejoin="round" opacity=".9"/></g>`)+shaded(a=>`<path d="M46 72 Q26 130 16 204 L184 204 Q174 130 154 72Z" ${a}/>`,HR,HRD,-6,-3)+x.when([1],`<g class="fx"><path d="M40 110 Q30 160 30 200 M160 110 Q170 160 170 200 M52 130 Q46 170 48 200 M148 130 Q154 170 152 200" stroke="#fff6c0" stroke-width="4" fill="none" stroke-linecap="round"/></g>`);
    b+=`<path d="M40 110 Q30 160 30 200 M160 110 Q170 160 170 200 M52 130 Q46 170 48 200 M148 130 Q154 170 152 200" stroke="${HRD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=strand('M24 196 Q-10 196 -14 176 Q-16 158 0 158 Q14 160 10 172 Q6 180 -2 176','#f7cf4f',11,HL);
    b+=strand('M176 200 Q214 204 220 186 Q224 168 208 168 Q196 170 200 182','#f7cf4f',11,HL);
    b+=torso(SK,SKD);
    b+=shaded(a=>`<path d="M60 203 C58 176 62 160 68 152 Q84 148 100 156 Q116 148 132 152 C138 160 142 176 140 203Z" ${a}/>`,PUR,PURD,-6,-3);
    b+=`<path d="M88 160 L112 172 M112 160 L88 172 M88 172 L112 184 M112 172 L88 184" stroke="${PK}" stroke-width="3" stroke-linecap="round"/><path d="M62 190 Q100 198 138 190 L140 203 L60 203Z" fill="${PK}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M42 96 Q34 30 100 24 Q166 30 158 96 Q152 68 136 58 Q118 66 100 52 Q82 66 64 58 Q48 68 42 96Z" ${a}/>`,HR,HRD,-4,-4);
    b+=`<path d="M100 28 Q96 40 100 52 M70 42 Q74 52 70 60 M130 42 Q126 52 130 60" stroke="${HRD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`+gloss(78,40,14,5,-20,.55);
    const flw=(cx: number, cy: number, c: string)=>{let s='';for(let i=0;i<5;i++)s+=`<circle cx="${f(cx+Math.cos(i*1.256)*4.5)}" cy="${f(cy+Math.sin(i*1.256)*4.5)}" r="3.6" fill="${c}" stroke="${O}" stroke-width="1.6"/>`;return s+`<circle cx="${cx}" cy="${cy}" r="2.6" fill="${GL}"/>`};
    b+=flw(54,90,'#ffb3d9')+flw(146,94,'#d8b8ff')+flw(30,150,'#fff')+flw(168,140,'#ffb3d9')+flw(40,186,'#d8b8ff');
    b+=x.byPose(p=>{
      if(p==1) return `<path d="M71 80 Q80 73 89 79 M111 79 Q120 73 129 80" stroke="${O}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M71 97 Q80 103 89 97 M111 97 Q120 103 129 97" stroke="${O}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M71 98 l-3 3 M129 98 l3 3" stroke="${O}" stroke-width="3" stroke-linecap="round"/><ellipse cx="100" cy="117" rx="5" ry="5.5" fill="#7a1f2b" stroke="${O}" stroke-width="3"/>`+cheeks;
      return face(p,{eye:'#3f9a54'});
    });
    
    b+=x.arm('L',armL)+x.arm('R',armR);
    const puff=(cx: number)=>shaded(a=>`<circle cx="${cx}" cy="148" r="15" ${a}/>`,PK,PKD,-4,-4)+`<path d="M${cx-8} 140 Q${cx} 146 ${cx-2} 158" stroke="${PKD}" stroke-width="2" fill="none"/>`;
    b+=puff(64)+puff(136)+gloss(59,141,5,3,-30,.6)+gloss(131,141,5,3,-30,.6);
    // Pascal sur l'épaule
    b+=x.byPose(p=>{
      const [c,cd]=([['#7ccf4a','#4f9a2a'],['#ffd34a','#d9a42c'],['#f07ab0','#c24f86']] as const)[p]!;
      let s=`<path d="M48 142 Q30 148 34 160 Q40 168 46 160 Q48 154 42 154" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M48 142 Q30 148 34 160 Q40 168 46 160 Q48 154 42 154" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      s+=shadedW(a=>`<ellipse cx="54" cy="138" rx="13" ry="8" ${a}/>`,c,cd,-3,-2,3.5);
      s+=shadedW(a=>`<path d="M40 128 Q40 114 52 114 Q64 114 64 126 Q62 134 52 134 Q42 134 40 128Z" ${a}/>`,c,cd,-2,-2,3.5);
      s+=`<path d="M47 116 Q52 110 57 116" stroke="${cd}" stroke-width="2" fill="none"/>`;
      ([[42,121],[62,121]] as const).forEach(([ex,ey])=>{s+=`<circle cx="${ex}" cy="${ey}" r="6" fill="${c}" stroke="${O}" stroke-width="2.5"/><circle cx="${ex}" cy="${ey}" r="3.6" fill="#fff"/><circle cx="${ex+(p==1?-1.2:1.2)}" cy="${ey+(p==2?-1:.5)}" r="2" fill="${O}"/>`});
      s+=p==2?`<ellipse cx="52" cy="129" rx="3" ry="2.5" fill="#7a1f2b" stroke="${O}" stroke-width="1.8"/>`:`<path d="M47 128 Q52 131 57 128" stroke="${O}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      if(p) s+=`<g class="fx">${twinkle(66,108,5,p==1?GL:'#fff')}</g>`;
      return s;
    });
    // préparation : cheveux lumineux + soins
    let hs='';([[16,168],[180,150],[30,110],[172,96],[100,4],[40,40]] as const).forEach(([px,py],i)=>{hs+=gather(0,-26,plus(px,py,5,i%2?'#7dff9c':GL),i*.05)});
    b+=x.when([1],hs+`<g class="fx">${twinkle(60,60,7,'#fff')}${twinkle(150,46,6,'#fff')}${twinkle(186,190,6,'#fff')}${twinkle(12,196,6,'#fff')}</g>`);
    // frappe : coup de poêle « BONK »
    const [px,py]=tip(this,'R',2,70);
    b+=x.when([2],`<g class="pop"><path d="M${f(px-34)} ${f(py-64)} Q${f(px+18)} ${f(py-60)} ${f(px+10)} ${f(py-26)}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/><path d="M${f(px-44)} ${f(py-48)} Q${f(px+2)} ${f(py-46)} ${f(px-2)} ${f(py-22)}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></g>`
      +`<g class="pop">${burst(f(px+22),f(py+4),17,'#ffe066')}</g><g class="pop">${word(186,76,'BONK !',22,'#ffe066',-10)}</g><g class="pop">${twinkle(px+28,py-30,7,'#fff')}${twinkle(px+26,py+24,6,'#ffe066')}</g>`);
    return shadow(84)+x.body(b);
  }
},
/* ===== 14 · Vanellope & Ralph ===== */
{
  id:'vanralph',name:'Vanellope & Ralph',role:'Chaos',rarity:'Légendaire',rar:'var(--leg)',tint:'#ffe1e8',tint2:'#f39db2',stats:[5,2,2],shake:true,
  atk:'Coup de poing de Ralph.',skill:'Glitch : Vanellope se téléporte ; Ralph détruit les boucliers.',
  sh:{L:[60,148],R:[140,148]},
  poses:[{L:16,R:-16},{L:160,R:-160,body:[0,-12,0,.96,1.06]},{L:-26,R:26,body:[0,6,0,1.1,.88],head:[0,8,1.03]}],
  draw(this: CharDef, x: Ctx): string {
    const S='#f1c09a',SD='#d0936b',RS='#d9453b',RSD='#9e2a24',OV='#7c5131',OVD='#553620',HR='#7a4a2a',HRD='#4e2e18';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+46,S,22)
      +`<path d="M${sx} ${sy} L${sx} ${sy+18}" stroke="${O}" stroke-width="35" stroke-linecap="round"/><path d="M${sx} ${sy} L${sx} ${sy+18}" stroke="${RS}" stroke-width="26" stroke-linecap="round"/><rect x="${sx-15}" y="${sy+20}" width="30" height="9" rx="4" fill="${RSD}" stroke="${O}" stroke-width="3"/>`
      +hand(sx,sy+52,S,21)+`<path d="M${sx-12} ${sy+60} Q${sx-8} ${sy+66} ${sx-3} ${sy+61} Q${sx+2} ${sy+67} ${sx+7} ${sy+61} Q${sx+11} ${sy+65} ${sx+13} ${sy+58}" stroke="${SD}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    // Vanellope (origine = centre de la tête)
    const V=(p: number, X: any, Y: any)=>{
      const VS='#f6d0aa',VSD='#d9a27c',VH='#2a1e22',MT='#86d8b8',MTD='#4fa386';
      let s=`<g transform="translate(${X} ${Y})">`;
      s+=`<path d="M-6 38 L-8 52 M6 38 L8 52" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M-6 38 L-8 52 M6 38 L8 52" stroke="#7a3fa6" stroke-width="5.5" stroke-linecap="round"/><path d="M-9 44 h4 M5 44 h4 M-9 49 h4 M5 49 h4" stroke="#2a1e22" stroke-width="2"/>`;
      s+=shadedW(a=>`<path d="M-6 -14 Q-12 -34 4 -38 Q20 -38 18 -26 Q12 -30 8 -26 Q10 -20 4 -14Z" ${a}/>`,'#3e2f34',VH,-2,-2,3.5);
      s+=dot(2,-31,2.6,'#ff6fae')+dot(11,-33,2.6,'#ffe066')+dot(-4,-26,2.4,'#6fd0ff')+dot(13,-27,2,'#8dff9a');
      s+=shadedW(a=>`<path d="M-14 40 C-15 26 -9 19 0 19 C9 19 15 26 14 40Z" ${a}/>`,MT,MTD,-3,-2,3.5);
      s+=`<path d="M-3 22 L-3 30 M3 22 L3 30" stroke="#fff" stroke-width="1.8"/><path d="M-12 36 H12" stroke="#6b4a32" stroke-width="5"/>`;
      const arms=([[[-11,25,-16,36],[11,25,16,36]] as const,[[-11,25,-20,14],[11,25,18,36]],[[-11,25,-20,8],[11,25,20,8]]] as const)[p]!;
      arms.forEach(([a1,a2,a3,a4])=>{s+=`<path d="M${a1} ${a2} L${a3} ${a4}" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M${a1} ${a2} L${a3} ${a4}" stroke="${MT}" stroke-width="5" stroke-linecap="round"/><circle cx="${a3}" cy="${a4}" r="3.6" fill="${VS}" stroke="${O}" stroke-width="2.2"/>`});
      s+=shadedW(a=>`<circle cx="0" cy="0" r="19" ${a}/>`,VS,VSD,-4,-3,4);
      s+=shadedW(a=>`<path d="M-20 2 Q-21 -20 0 -20 Q21 -20 20 2 Q13 -10 7 -6 Q2 -13 -4 -7 Q-11 -12 -20 2Z" ${a}/>`,'#3e2f34',VH,-2,-2,3.5);
      s+=`<ellipse cx="-7" cy="3" rx="3.4" ry="${p==1?3:4.4}" fill="#5a3420"/><ellipse cx="7" cy="3" rx="3.4" ry="${p==1?3:4.4}" fill="#5a3420"/><circle cx="-6" cy="1.5" r="1.2" fill="#fff"/><circle cx="8" cy="1.5" r="1.2" fill="#fff"/>`;
      s+=p==0?`<path d="M-5 11 Q0 15 5 11" stroke="${O}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`:`<path d="M-6 10 Q0 9 6 10 Q4 17 0 17 Q-4 17 -6 10Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-4 10.5 H4" stroke="#fff" stroke-width="2"/>`;
      s+=`<ellipse cx="-12" cy="9" rx="3.5" ry="2" fill="#ff7c7c" opacity=".45"/><ellipse cx="12" cy="9" rx="3.5" ry="2" fill="#ff7c7c" opacity=".45"/>`;
      return s+'</g>';
    };
    let g='';
    // frappe : onde de choc en pixels
    let pr='';for(let i=0;i<20;i++){const a=i*2*Math.PI/20;pr+=pix(100+Math.cos(a)*112,204+Math.sin(a)*16,9,['#f2c95a','#7fd8ff','#ff6f91','#8dff9a'][i%4]!)}
    let deb='';([[30,150,12,'#b5653a'],[176,140,10,'#b5653a'],[8,186,9,'#f2c95a'],[194,182,11,'#b5653a'],[56,120,8,'#7fd8ff'],[150,112,8,'#ff6f91'],[-14,150,8,'#b5653a'],[216,150,9,'#8dff9a']] as const).forEach(([dx,dy,s,c],i)=>{deb+=fly(100-dx,196-dy,pix(dx,dy,s,c)+(c=='#b5653a'?`<path d="M${dx-s/2} ${dy} H${dx+s/2}" stroke="${O}" stroke-width="1.5"/>`:''),i*.02)});
    g+=x.when([2],`<g class="ring">${pr}</g>`+deb);
    let b=torso(RS,RSD,'M40 203 C38 154 62 130 100 128 C138 130 162 154 160 203Z');
    b+=`<path d="M72 152 Q86 160 98 152 M102 152 Q114 160 128 152" stroke="${RSD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M62 203 L66 170 Q100 176 134 170 L138 203Z" ${a}/>`,OV,OVD,-4,-3);
    b+=`<path d="M70 172 L78 136 M130 172 L122 136" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M70 172 L78 136 M130 172 L122 136" stroke="${OV}" stroke-width="6" stroke-linecap="round"/><circle cx="71" cy="172" r="4" fill="#f2c95a" stroke="${O}" stroke-width="2"/><circle cx="129" cy="172" r="4" fill="#f2c95a" stroke="${O}" stroke-width="2"/><rect x="90" y="182" width="20" height="14" rx="3" fill="${OVD}" stroke="${O}" stroke-width="2.5"/>`;
    let h=head(S,SD);
    h+=`<circle cx="44" cy="96" r="9" fill="${S}" stroke="${O}" stroke-width="4"/><circle cx="156" cy="96" r="9" fill="${S}" stroke="${O}" stroke-width="4"/>`;
    h+=shaded(a=>`<path d="M44 92 Q30 70 40 56 L26 46 L44 42 L36 22 L58 30 L60 8 L76 24 L86 2 L98 20 L112 0 L120 22 L138 6 L140 28 L160 20 L156 40 L176 42 L160 56 Q170 72 156 92 Q154 66 136 58 Q120 70 100 62 Q80 70 64 58 Q48 66 44 92Z" ${a}/>`,'#94603a',HR,-4,-4)+gloss(80,30,12,4,-15,.3);
    h+=`<path d="M70 40 L78 54 M100 30 L102 50 M128 38 L122 52" stroke="${HRD}" stroke-width="3" stroke-linecap="round"/>`;
    h+=x.byPose(p=>{
      let s='';
      const ry=p==2?6:p==1?8:9;
      ([[80,1],[120,-1]] as const).forEach(([ex,d])=>{s+=`<ellipse cx="${ex}" cy="94" rx="6.5" ry="${ry}" fill="${O}"/><circle cx="${ex+2}" cy="90" r="2.6" fill="#fff"/>`;
        s+=p?`<path d="M${ex-13*d} 76 L${ex+9*d} 86" stroke="${HRD}" stroke-width="8" stroke-linecap="round"/>`:`<path d="M${ex-11} 80 Q${ex} 74 ${ex+11} 80" stroke="${HRD}" stroke-width="7" fill="none" stroke-linecap="round"/>`});
      s+=shaded(a=>`<ellipse cx="100" cy="108" rx="14" ry="10" ${a}/>`,'#f6caa6',SD,-3,-3);
      if(p==0) s+=`<path d="M82 124 Q100 134 118 124" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M92 127 L92 131 M108 127 L108 131" stroke="${O}" stroke-width="2"/>`;
      else if(p==1) s+=`<path d="M78 120 Q100 116 122 120 Q120 144 100 145 Q80 144 78 120Z" fill="#6e1a29" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M80 121 Q100 117 120 121 L118 128 Q100 125 82 128Z" fill="#fff" stroke="${O}" stroke-width="2"/><path d="M90 138 Q100 132 110 138" stroke="#e85a6e" stroke-width="4" fill="none"/>`;
      else s+=`<rect x="80" y="120" width="40" height="15" rx="5" fill="#fff" stroke="${O}" stroke-width="3.5"/><path d="M80 127.5 H120 M90 120 V135 M100 120 V135 M110 120 V135" stroke="${O}" stroke-width="2"/>`;
      return s;
    });
    b+=x.head(h);
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    const [lx,ly]=tip(this,'L',2,52),[rx,ry]=tip(this,'R',2,52);
    b+=x.when([2],`<g class="pop">${burst(f((lx+rx)/2),f((ly+ry)/2+22),24,'#f2c95a')}</g><g class="pop">${pix(64,194,8,'#7fd8ff')}${pix(136,192,8,'#ff6f91')}${pix(100,168,7,'#8dff9a')}</g>`);
    b+=x.when([1],`<path d="M40 70 Q50 50 66 44 M160 70 Q150 50 134 44" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    // Vanellope : repos sur l'épaule, téléportation glitch, retour
    const gid=uid('g');
    const filt=`<filter id="${gid}c" x="-30%" y="-30%" width="160%" height="160%"><feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.95  0 0 0 0 1  0 0 0 .6 0"/></filter><filter id="${gid}m" x="-30%" y="-30%" width="160%" height="160%"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.2  0 0 0 0 0.75  0 0 0 .6 0"/></filter>`;
    let ps='';([[-22,-8,'#7fd8ff'],[24,4,'#ff6f91'],[-18,30,'#8dff9a'],[22,40,'#7fd8ff'],[-26,50,'#ff6f91'],[18,-24,'#ffe066']] as const).forEach(([dx,dy,c])=>ps+=pix(dx,dy,7,c));
    let o='';
    o+=x.when([0],V(0,170,104));
    o+=x.when([1],`<g class="glitch"><g filter="url(#${gid}c)" transform="translate(-5 1)">${V(1,8,36)}</g><g filter="url(#${gid}m)" transform="translate(5 -1)">${V(1,8,36)}</g>${V(1,8,36)}<g transform="translate(8 36)">${ps}</g></g><g class="flick"><g transform="translate(170 104)">${ps}</g>${pix(170,100,9,'#86d8b8')}${pix(160,118,7,'#86d8b8')}${pix(180,128,6,'#86d8b8')}</g>`);
    o+=x.when([2],`<g class="glitch">${V(2,170,104)}</g><g class="pop"><g transform="translate(170 104)">${ps}</g></g>`);
    return filt+shadow(80)+x.body(b+o)+g;
  }
}];
