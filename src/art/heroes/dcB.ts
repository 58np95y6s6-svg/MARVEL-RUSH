// Héros DC, planche B (design/planches/6-dc-heros-b.html) : même style et même API que les héros Marvel.
/* eslint-disable */
import { O, SK, SKD, f, shaded, clip, gloss, limb, hand, star, glow, burst, bolt, sparks, torso, torsoD, head, headS, mirror, shadow, face, tip, dirOf, type CharDef, type Ctx } from '../primitives';
import { rot, txt, hoodShade } from '../kits/villain';
import { cape, clasps, cowl, ears, lenses, jaw, domino, batSym, boltSym, swoosh, shock } from '../kits/dc';

export const DC_B: CharDef[] = [
{
  id:'shazam',name:'Shazam',role:'Dégâts en chaîne',rarity:'Épique',rar:'var(--epi)',tint:'#ffe6c2',tint2:'#f4b65a',stats:[4,3,3],
  atk:'Éclair magique qui tombe du ciel.',skill:'SHAZAM ! : un éclair géant frappe 5 ennemis et les étourdit 1 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-14},{L:30,R:-172,body:[-2,-6,-3,1,1.03]},{L:28,R:-136,body:[5,-2,5,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const R='#d8312f',RD='#9c1b24',G='#f6c64a',GD='#cf962a',W='#f6f2e8',WD='#cfc6b0',H='#262035',LT='#ffe066';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,R,15)+shaded(a=>`<rect x="${sx-10}" y="${sy+20}" width="20" height="15" rx="5" ${a}/>`,G,GD,-2,-2)+`<path d="M${sx-10} ${sy+27} H${sx+10}" stroke="${GD}" stroke-width="2"/>`+hand(sx,sy+38,SK);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([1,2],glow(sx,sy+42,15,LT));
    let b=cape(W,WD,6)+`<path d="M30 204 Q28 176 54 142 M170 204 Q172 176 146 142" stroke="${G}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    b+=torso(R,RD);
    b+=x.when([1,2],glow(100,164,30,LT));
    b+=boltSym(100,166,1.55,G,4.5);
    b+=shaded(a=>`<path d="M58 186 Q100 194 142 186 L142 198 Q100 206 58 198Z" ${a}/>`,G,GD,-2,-2)+`<path d="M60 192 Q100 200 140 192" stroke="${GD}" stroke-width="2" fill="none"/>`;
    b+=shaded(a=>`<path d="M58 142 Q70 132 84 138 L78 152Z" ${a}/>`,W,WD,-2,-2)+mirror(shaded(a=>`<path d="M58 142 Q70 132 84 138 L78 152Z" ${a}/>`,W,WD,-2,-2));
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M46 92 Q38 28 100 22 Q162 28 154 92 Q150 64 134 56 Q118 68 100 58 Q80 68 64 60 Q50 70 46 92Z" ${a}/>`,'#3b3352',H,-4,-4)+gloss(80,34,13,5,-20,.35);
    b+=`<path d="M104 56 Q96 70 102 78 Q108 72 106 66" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M104 56 Q96 70 102 78" stroke="#3b3352" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=x.byPose(p=>face(p,{eye:p?'#ffcf3a':'#3a5fb0'})+(p==0?`<path d="M88 114 Q100 126 112 114" stroke="${O}" stroke-width="3.5" fill="#fff" stroke-linejoin="round"/>`:''));
    b+=x.arm('L',armIn)+x.arm('R',armR);
    const [hx,hy]=tip(this,'R',1,44);
    b+=x.when([1],`<g class="pop">${bolt([[hx+10,-6],[hx-4,18],[hx+8,22],[hx,hy-14]],LT)}</g>`+sparks(hx,hy,24,LT,7));
    const T=[194,170] as const,[gx,gy]=tip(this,'R',2,44);
    b+=x.when([2],`<g class="pop">${bolt([[T[0]+12,-8],[T[0]-6,40],[T[0]+10,46],[T[0]-8,104],[T[0]+8,110],[T[0],T[1]-10]],LT)}</g>`
      +`<g class="pop">${bolt([[gx,gy],[gx+16,gy+14],[gx+10,gy+24],[T[0]-14,T[1]-8]],LT)}</g><g class="pop">${burst(T[0],T[1],26,LT,'#fff')}</g>`+shock(T[0],T[1]+20,34,8,LT));
    return shadow()+x.body(b);
  }
},
{
  id:'robin',name:'Robin',role:'Combo',rarity:'Rare',rar:'var(--rare)',tint:'#ffe0d0',tint2:'#9fd48a',stats:[3,5,2],
  atk:'Coup de bâton rapide.',skill:'Acolyte : +20 % de dégâts à Batman et Batgirl s’ils sont adjacents.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-26},{L:26,R:-168,body:[-3,-4,-6,1,1.02]},{L:24,R:-58,body:[6,2,6,1.02,.97]}],
  draw(this: CharDef, x: Ctx): string {
    const R='#d8312f',RD='#9c1b24',G='#3a9a4a',GD='#25703a',Y='#f6c64a',YD='#cf962a',K='#262035',KD='#120e1a',ST='#8a5a32',STD='#5b3a1e';
    const sleeve=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SK,14)+shaded(a=>`<path d="M${sx-11} ${sy-4} Q${sx} ${sy-12} ${sx+11} ${sy-4} L${sx+10} ${sy+14} Q${sx} ${sy+18} ${sx-10} ${sy+14}Z" ${a}/>`,G,GD,-2,-2)
      +shaded(a=>`<rect x="${sx-9}" y="${sy+24}" width="18" height="12" rx="4" ${a}/>`,G,GD,-2,-2);
    const staff=(sx: number, sy: number)=>`<rect x="${sx-4.5}" y="${sy+20}" width="9" height="78" rx="4.5" fill="${ST}" stroke="${O}" stroke-width="3.5"/><path d="M${sx-1.5} ${sy+30} V${sy+88}" stroke="#c49060" stroke-width="2" opacity=".7"/><rect x="${sx-5.5}" y="${sy+86}" width="11" height="12" rx="4" fill="#c9ced8" stroke="${O}" stroke-width="2.5"/>`;
    const armL=(sx: number, sy: number)=>sleeve(sx,sy)+hand(sx,sy+38,G);
    const armR=(sx: number, sy: number)=>sleeve(sx,sy)+staff(sx,sy)+hand(sx,sy+38,G);
    let b=cape(Y,YD,6);
    b+=`<path d="M30 204 Q28 176 54 142 M170 204 Q172 176 146 142" stroke="${K}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    b+=torso(R,RD);
    b+=`<path d="M100 140 V184" stroke="${RD}" stroke-width="2.5"/><circle cx="100" cy="150" r="2.4" fill="${Y}" stroke="${O}" stroke-width="1.5"/><circle cx="100" cy="166" r="2.4" fill="${Y}" stroke="${O}" stroke-width="1.5"/>`;
    b+=`<circle cx="80" cy="160" r="11" fill="${Y}" stroke="${O}" stroke-width="3.5"/><path d="M76 166 V154 H81.5 Q86 154 86 158 Q86 161.5 81.5 161.5 H76 M81 161.5 L85.5 166" stroke="${K}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    b+=shaded(a=>`<path d="M58 184 Q100 192 142 184 L142 196 Q100 204 58 196Z" ${a}/>`,Y,YD,-2,-2)+`<g fill="${YD}" stroke="${O}" stroke-width="2">${[74,88,112,126].map(cx=>`<rect x="${cx-4}" y="188" width="8" height="10" rx="2"/>`).join('')}</g>`;
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M44 94 Q40 64 50 52 L42 38 L60 42 L60 24 L76 34 L84 16 L98 30 L112 14 L120 32 L138 22 L140 40 L158 40 L150 54 Q160 70 156 94 Q150 68 132 62 Q114 68 100 60 Q82 70 66 62 Q50 72 44 94Z" ${a}/>`,'#3b3352',K,-4,-4)+gloss(84,38,12,4,-20,.35);
    b+=domino(K,'#4a4466');
    b+=x.byPose(p=>lenses(p)+(p==0?`<path d="M90 118 Q100 126 110 118" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:jaw(p,120))+(p?`<path d="M64 84 L92 90 M136 84 L108 90" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`:''));
    b+=clasps(Y);
    b+=x.arm('L',armL)+x.arm('R',armR);
    const [ex,ey]=tip(this,'R',2,96);
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(ex)}px ${f(ey)}px">${swoosh(`M${f(ex-50)} ${f(ey-110)} Q${f(ex+26)} ${f(ey-90)} ${f(ex+2)} ${f(ey-4)}`,'#ffe9a8',12)}</g><g class="pop">${burst(f(ex+4),f(ey+2),22,'#ffd34a','#fff')}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'batgirl',name:'Batgirl',role:'Ciblage',rarity:'Rare',rar:'var(--rare)',tint:'#e6defa',tint2:'#a593d8',stats:[3,4,4],
  atk:'Grappin qui frappe l’ennemi le plus avancé.',skill:'Analyse : marque un ennemi, qui subit +25 % de dégâts de toute l’équipe.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:20,R:-118,body:[-2,-2,-3,1,1]},{L:24,R:-112,body:[-6,0,-4,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const P='#4a3f7a',PD='#2e2754',Y='#f6c64a',YD='#cf962a',HR='#e0522f',HRD='#a8341c',GY='#9aa3b5',GYD='#646c80';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,P,14)+shaded(a=>`<rect x="${sx-10}" y="${sy+20}" width="20" height="15" rx="5" ${a}/>`,Y,YD,-2,-2)+`<path d="M${sx+9} ${sy+22} l7 2 l-7 3 l7 2 l-7 3" fill="${Y}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`+hand(sx,sy+38,Y);
    const gun=(sx: number, sy: number)=>shaded(a=>`<rect x="${sx-7}" y="${sy+36}" width="14" height="30" rx="4" ${a}/>`,GY,GYD,-2,-2)+`<rect x="${sx-4}" y="${sy+64}" width="8" height="6" rx="2" fill="#3a3f55" stroke="${O}" stroke-width="2"/>`;
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([1,2],gun(sx,sy))+hand(sx,sy+38,Y);
    let b=cape(P,PD,8);
    b+=shaded(a=>`<path d="M40 100 Q24 152 44 188 L156 188 Q176 152 160 100Z" ${a}/>`,HR,HRD,-4,-4)+`<path d="M52 130 Q46 156 56 180 M148 130 Q154 156 144 180" stroke="${HRD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=torso(P,PD);
    b+=`<ellipse cx="100" cy="162" rx="25" ry="15" fill="${Y}" stroke="${O}" stroke-width="3.5"/>`+batSym(100,162,1,P,2.5);
    b+=shaded(a=>`<path d="M58 184 Q100 192 142 184 L142 196 Q100 204 58 196Z" ${a}/>`,Y,YD,-2,-2)+`<rect x="92" y="186" width="16" height="12" rx="3" fill="${Y}" stroke="${O}" stroke-width="3"/>`;
    b+=head(SK,SKD)+ears(P,PD,'bat')+cowl(P,PD);
    b+=`<path d="M48 104 Q38 124 46 150 L58 140 Q52 124 56 108Z" fill="${HR}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`+mirror(`<path d="M48 104 Q38 124 46 150 L58 140 Q52 124 56 108Z" fill="${HR}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`);
    b+=x.byPose(p=>lenses(p)+(p==0?`<path d="M93 125 Q100 129 107 125" stroke="#c63a4a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:jaw(p,126)));
    b+=clasps(Y);
    b+=x.arm('L',armIn)+x.arm('R',armR);
    const [mx,my]=tip(this,'R',1,70);
    b+=x.when([1],`<g class="fx"><circle cx="${f(mx)}" cy="${f(my)}" r="8" fill="#fff" opacity=".6"/></g>`);
    const [gx,gy]=tip(this,'R',2,70),T=[212,92] as const;
    const hook=`<g transform="translate(${T[0]} ${T[1]}) rotate(-30)"><path d="M0 -10 V10 M0 0 Q12 -2 14 -12 M0 0 Q12 2 14 12 M0 0 H16" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 -10 V10 M0 0 Q12 -2 14 -12 M0 0 Q12 2 14 12 M0 0 H16" stroke="#cfd5e0" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`;
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(gx)}px ${f(gy)}px"><path d="M${f(gx)} ${f(gy)} L${T[0]} ${T[1]}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${f(gx)} ${f(gy)} L${T[0]} ${T[1]}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g><g class="pop">${hook}</g><g class="pop">${sparks(T[0]+6,T[1]-4,22,Y,7)}</g><g class="pop">${sparks(gx,gy,16,'#fff',6)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'catwoman',name:'Catwoman',role:'Vol · économie',rarity:'Rare',rar:'var(--rare)',tint:'#e2dcf0',tint2:'#9b8fc0',stats:[3,4,3],
  atk:'Coup de fouet sur 2 ennemis alignés.',skill:'Larcin : chaque ennemi éliminé d’un coup de fouet rapporte 1 mana de plus.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-14},{L:28,R:-176,body:[-3,-3,-6,1,1.02]},{L:26,R:-84,body:[8,0,7,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const K='#2b2740',KD='#15121f',HL='#7d72b0',S='#cfd5e0',GR='#ff6b4a',WH='#4a3020';
    const claws=(sx: number, y: number)=>`<g fill="#fff" stroke="${O}" stroke-width="2" stroke-linejoin="round"><polygon points="${sx-7},${y+6} ${sx-6},${y+15} ${sx-3},${y+7}"/><polygon points="${sx-1},${y+8} ${sx},${y+17} ${sx+2},${y+8}"/><polygon points="${sx+4},${y+7} ${sx+7},${y+15} ${sx+7},${y+5}"/></g>`;
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,K,14)+`<path d="M${sx-4} ${sy+4} Q${sx-6} ${sy+20} ${sx-4} ${sy+32}" stroke="${HL}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>`+claws(sx,sy+38)+hand(sx,sy+38,K);
    const whipR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([0],`<path d="M${sx} ${sy+44} Q${sx+18} ${sy+62} ${sx+6} ${sy+70} Q${sx-10} ${sy+76} ${sx+4} ${sy+84}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${sx} ${sy+44} Q${sx+18} ${sy+62} ${sx+6} ${sy+70} Q${sx-10} ${sy+76} ${sx+4} ${sy+84}" stroke="${WH}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    let b=torso(K,KD);
    b+=`<path d="M70 150 Q66 172 70 196" stroke="${HL}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`+gloss(76,166,8,3,-70,.35);
    b+=`<path d="M100 138 V196" stroke="${O}" stroke-width="6"/><path d="M100 138 V196" stroke="${S}" stroke-width="2.6" stroke-dasharray="3 3"/><rect x="96" y="150" width="8" height="10" rx="2" fill="${S}" stroke="${O}" stroke-width="2"/>`;
    b+=shaded(a=>`<path d="M58 186 Q100 194 142 186 L142 196 Q100 204 58 196Z" ${a}/>`,'#4a3f6a',KD,-2,-2);
    b+=head(SK,SKD)+ears(K,KD,'cat')+cowl(K,KD);
    /* lunettes relevées sur le front */
    const gg=`<circle cx="82" cy="58" r="13" fill="${S}" stroke="${O}" stroke-width="3.5"/><circle cx="82" cy="58" r="8.5" fill="${GR}" stroke="${O}" stroke-width="2.5"/><circle cx="79" cy="55" r="3" fill="#fff" opacity=".85"/>`;
    b+=`<path d="M46 66 Q100 44 154 66" stroke="${O}" stroke-width="6" fill="none"/>`+gg+mirror(gg)+`<path d="M95 56 Q100 52 105 56" stroke="${O}" stroke-width="4" fill="none"/>`;
    b+=x.byPose(p=>{
      const hole=`<path d="M64 92 Q80 82 96 94 Q96 106 82 107 Q66 105 64 92Z" fill="${SK}" stroke="${O}" stroke-width="3"/>`;
      let s=hole+mirror(hole)+face(p,{noMouth:true,noCheeks:true,eye:'#3aa86a'});
      s+=p==2?`<path d="M90 122 Q100 120 110 122 Q108 132 100 133 Q92 132 90 122Z" fill="#7a1f2b" stroke="${O}" stroke-width="3"/><path d="M92 123 H108" stroke="#fff" stroke-width="2.5"/>`
        :`<path d="M90 124 Q95 120 100 123 Q105 120 110 124 Q100 132 90 124Z" fill="#d0283a" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`+(p==0?`<path d="M106 122 L112 119" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>`:'');
      return s;
    });
    b+=x.arm('L',armIn)+x.arm('R',whipR);
    const [wx,wy]=tip(this,'R',1,44);
    b+=x.when([1],`<path d="M${f(wx)} ${f(wy)} Q${f(wx+30)} ${f(wy-40)} ${f(wx+56)} ${f(wy-6)} Q${f(wx+76)} ${f(wy+22)} ${f(wx+56)} ${f(wy+46)}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${f(wx)} ${f(wy)} Q${f(wx+30)} ${f(wy-40)} ${f(wx+56)} ${f(wy-6)} Q${f(wx+76)} ${f(wy+22)} ${f(wx+56)} ${f(wy+46)}" stroke="${WH}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    const [hx,hy]=tip(this,'R',2,44),E=[204,172] as const;
    const wd=`M${f(hx)} ${f(hy)} Q${f(hx+14)} ${f(hy-26)} ${f(hx+28)} ${f(hy-4)} Q${f(hx+38)} ${f(hy+14)} ${E[0]} ${E[1]}`;
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px"><path d="${wd}" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".35"/><path d="${wd}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${wd}" stroke="${WH}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g><g class="pop">${burst(E[0],E[1],18,'#fff','#ffd34a')}</g><g class="pop">${txt(E[0]-8,E[1]-26,15,'#fff','CLAC !',-8)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'harley',name:'Harley Quinn',role:'Chaos',rarity:'Épique',rar:'var(--epi)',tint:'#ffdbe4',tint2:'#a8b4e8',stats:[4,3,2],
  atk:'Coup de maillet géant qui étourdit.',skill:'Folie douce : effet aléatoire à chaque coup (double dégâts, recul ou confettis qui ralentissent).',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-16},{L:34,R:-150,body:[-4,-6,-6,1,1.04]},{L:26,R:-78,body:[6,0,4,1.04,.96]}],
  draw(this: CharDef, x: Ctx): string {
    const R='#e0323e',RD='#a01e2a',K='#2a2436',KD='#15111d',HB='#f6dc8a',HBD='#d6b45a',PS='#fbe9ea',PSD='#e6c4c8',W='#f4f4f8',WO='#c9935a',WOD='#8a5a32';
    const mallet=(sx: number, sy: number)=>`<rect x="${sx-4.5}" y="${sy+30}" width="9" height="40" rx="4" fill="${WO}" stroke="${O}" stroke-width="3.5"/><path d="M${sx-4.5} ${sy+50} H${sx+4.5} M${sx-4.5} ${sy+62} H${sx+4.5}" stroke="${WOD}" stroke-width="2.5"/>`
      +clip(a=>`<rect x="${sx-30}" y="${sy+66}" width="60" height="32" rx="9" ${a}/>`,`<rect x="${sx-30}" y="${sy+66}" width="30" height="32" fill="${R}"/><rect x="${sx}" y="${sy+66}" width="30" height="32" fill="${K}"/><rect x="${sx-30}" y="${sy+88}" width="60" height="10" fill="${O}" opacity=".18"/>`)
      +`<rect x="${sx-30}" y="${sy+66}" width="60" height="32" rx="9" fill="none" stroke="${O}" stroke-width="4.5"/><rect x="${sx-34}" y="${sy+64}" width="8" height="36" rx="3" fill="${W}" stroke="${O}" stroke-width="3"/><rect x="${sx+26}" y="${sy+64}" width="8" height="36" rx="3" fill="${W}" stroke="${O}" stroke-width="3"/>`+gloss(sx-16,sy+73,8,3,-10,.5);
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,PS,13)+shaded(a=>`<rect x="${sx-9}" y="${sy+20}" width="18" height="14" rx="4" ${a}/>`,R,RD,-2,-2)+hand(sx,sy+38,R);
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,PS,13)+shaded(a=>`<rect x="${sx-9}" y="${sy+20}" width="18" height="14" rx="4" ${a}/>`,K,KD,-2,-2)+mallet(sx,sy)+hand(sx,sy+38,K);
    let b='';
    /* couettes */
    const tail=(c: string,d: string)=>shaded(a=>`<path d="M54 64 Q20 66 14 108 Q12 128 24 140 Q28 120 36 108 Q44 90 58 84Z" ${a}/>`,c,d,-3,-3)+`<path d="M26 128 Q24 108 40 92" stroke="${d}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=tail(R,RD)+mirror(tail(K,'#4a4466'));
    b+=`<circle cx="52" cy="70" r="7" fill="${W}" stroke="${O}" stroke-width="3"/><circle cx="148" cy="70" r="7" fill="${W}" stroke="${O}" stroke-width="3"/>`;
    b+=clip(a=>`<path d="${torsoD}" ${a}/>`,`<rect x="40" y="130" width="60" height="80" fill="${R}"/><rect x="100" y="130" width="60" height="80" fill="${K}"/><path d="M40 210 V180 Q70 200 100 186 Q130 200 160 180 V210Z" fill="${O}" opacity=".12"/>`)+`<path d="${torsoD}" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`;
    b+=`<g stroke="${O}" stroke-width="2.5" stroke-linejoin="round"><path d="M86 166 L92 158 L98 166 L92 174Z" fill="${K}"/><path d="M102 166 L108 158 L114 166 L108 174Z" fill="${R}"/></g>`;
    b+=`<path d="M70 140 L78 150 L86 142 L94 152 L100 144 L106 152 L114 142 L122 150 L130 140 Q100 132 70 140Z" fill="${W}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b+=shaded(a=>`<path d="M58 188 Q100 196 142 188 L142 200 Q100 208 58 200Z" ${a}/>`,'#f6c64a','#cf962a',-2,-2);
    b+=head(PS,PSD);
    b+=shaded(a=>`<path d="M46 92 Q38 30 100 24 Q162 30 154 92 Q148 66 130 60 Q118 68 104 56 Q94 70 72 64 Q54 70 46 92Z" ${a}/>`,HB,HBD,-4,-4)+gloss(80,36,13,5,-20,.45);
    b+=domino(K,'#4a4466');
    b+=x.byPose(p=>{
      let s=face(p,{eye:'#3a8ad8',noCheeks:true,noMouth:true});
      s+=`<path d="M128 112 q-3 -4 -6 0 q-3 -4 -6 0 q0 5 6 9 q6 -4 6 -9Z" fill="${K}" stroke="${O}" stroke-width="1.5"/>`;
      s+=p==0?`<path d="M88 116 Q100 128 112 116 Q100 120 88 116Z" fill="#d0283a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`
        :p==1?`<path d="M88 115 Q100 132 112 115Z" fill="#7a1f2b" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M90 116 H110" stroke="#fff" stroke-width="3"/>`
        :`<path d="M86 113 Q100 111 114 113 Q112 132 100 133 Q88 132 86 113Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M88 114 H112" stroke="#fff" stroke-width="3"/><path d="M93 126 Q100 122 107 126" stroke="#e85a6e" stroke-width="3" fill="none"/>`;
      return s;
    });
    b+=x.arm('L',armL)+x.arm('R',armR);
    const [mx,my]=tip(this,'R',2,82);
    b+=x.when([1],`<g class="fx">${[[40,60,'#e0323e'],[160,20,'#3a8ad8'],[30,120,'#f6c64a'],[170,96,'#e0323e']].map(([cx,cy,c])=>`<polygon points="${star(cx as number,cy as number,6,2.5,4)}" fill="${c}" stroke="${O}" stroke-width="1.5"/>`).join('')}</g>`);
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(mx)}px ${f(my)}px">${swoosh(`M${f(mx-40)} ${f(my-96)} Q${f(mx+14)} ${f(my-80)} ${f(mx+4)} ${f(my-30)}`,'#ffd0dc',14)}</g>`
      +`<g class="pop">${burst(f(mx+26),f(my),24,'#ffd34a','#fff')}</g>`+shock(mx+30,my,10,30,'#ff8aa8')
      +`<g class="pop">${[[mx-14,my-40,'#e0323e'],[mx+20,my-34,'#3a8ad8'],[mx+18,my+32,'#f6c64a']].map(([cx,cy,c])=>`<polygon points="${star(cx as number,cy as number,7,3,4)}" fill="${c}" stroke="${O}" stroke-width="2"/>`).join('')}${txt(f(mx-12),f(my-54),18,'#fff','PAF !',-8)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'martian',name:'Martian Manhunter',role:'Contrôle',rarity:'Épique',rar:'var(--epi)',tint:'#d4f0d6',tint2:'#78c08a',stats:[3,3,5],
  atk:'Onde télépathique qui traverse la ligne.',skill:'Métamorphe : copie l’attaque du héros adjacent le plus fort pendant 6 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:160,R:-20,body:[0,-4,0,1,1.02]},{L:150,R:-92,body:[4,-4,3,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#52b05c',GD='#2f7a3a',B='#2f55b8',BD='#1f3a85',R='#d42e35',RD='#9b1d27',K='#2a2436',RE='#ff5a3a',PS='#ff7a5a';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,G,15)+shaded(a=>`<rect x="${sx-10}" y="${sy+22}" width="20" height="12" rx="4" ${a}/>`,B,BD,-2,-2)+hand(sx,sy+38,G);
    let b='';
    const collar=`<path d="M48 150 Q20 104 34 50 Q52 96 76 134Z" fill="${B}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M44 132 Q30 100 36 66" stroke="${BD}" stroke-width="4" fill="none"/>`;
    b+=cape(B,BD,10)+collar+mirror(collar);
    b+=torso(G,GD);
    b+=`<path d="M64 146 L136 196 M136 146 L64 196" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M64 146 L136 196 M136 146 L64 196" stroke="${R}" stroke-width="7.5" stroke-linecap="round"/>`;
    b+=`<circle cx="100" cy="171" r="9" fill="${R}" stroke="${O}" stroke-width="3.5"/><circle cx="98" cy="169" r="3" fill="#ffd0c8"/>`;
    b+=shaded(a=>`<path d="M58 190 Q100 198 142 190 L142 202 Q100 208 58 202Z" ${a}/>`,K,'#15111d',-2,-2);
    b+=`<path d="M66 140 L60 150 M134 140 L140 150" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`;
    b+=head(G,GD);
    b+=`<path d="M58 80 Q78 66 98 80 L100 84 L102 80 Q122 66 142 80" stroke="${GD}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 80 Q78 66 98 80 M102 80 Q122 66 142 80" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=`<path d="M70 52 Q86 44 100 50 M114 46 Q124 44 132 50" stroke="${GD}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M96 104 Q100 110 104 104" stroke="${GD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=x.byPose(p=>{
      const e=`<path d="M66 88 L94 92 Q92 102 82 103 Q68 102 66 88Z" fill="${RE}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="78" cy="94" rx="4" ry="2.2" fill="#ffe0c8"/>`;
      let s=(p?`<g class="fx"><ellipse cx="80" cy="96" rx="18" ry="11" fill="${RE}" opacity=".35"/><ellipse cx="120" cy="96" rx="18" ry="11" fill="${RE}" opacity=".35"/></g>`:'')+e+mirror(e);
      s+=p==2?`<path d="M90 118 Q100 116 110 118 Q108 128 100 129 Q92 128 90 118Z" fill="#2f1a22" stroke="${O}" stroke-width="3"/>`:`<path d="M88 120 Q100 116 112 120" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    b+=x.when([1],`<g class="fx">${[22,34,46].map(r=>`<circle cx="100" cy="84" r="${r+40}" fill="none" stroke="${PS}" stroke-width="3" opacity="${f(1-r/60)}"/>`).join('')}</g>`);
    const arc=(cx: number,r: number)=>`<path d="M${cx} ${84-r} Q${cx+r*.6} 84 ${cx} ${84+r}" stroke="${O}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${cx} ${84-r} Q${cx+r*.6} 84 ${cx} ${84+r}" stroke="${PS}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
    b+=x.when([2],`<g class="grow" style="transform-origin:150px 84px">${arc(156,16)}${arc(176,26)}${arc(198,36)}</g><g class="pop">${sparks(214,84,22,PS,8)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'greenarrow',name:'Green Arrow',role:'Précision',rarity:'Rare',rar:'var(--rare)',tint:'#dcf0cf',tint2:'#8cc472',stats:[3,4,5],
  atk:'Flèche précise sur l’ennemi le plus éloigné.',skill:'Flèches gadgets : une sur trois est une flèche-filet qui immobilise 1 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-50},{L:-100,R:-90,body:[-4,0,-3,1,1]},{L:-40,R:-90,body:[-6,0,-4,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#3f8a3a',GD='#286024',GL='#62b04e',BR='#6b4a2a',BRD='#47301a',HB='#e2b84a',HBD='#b98a2a',FL='#9dff7a';
    const bow=(sx: number, sy: number)=>{const y=sy+38;const d=`M${sx-38} ${y-12} Q${sx} ${y+22} ${sx+38} ${y-12}`;
      return `<path d="${d}" stroke="${O}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${BR}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${sx-30} ${y-8} Q${sx-14} ${y+6} ${sx-4} ${y+6}" stroke="#a07848" stroke-width="2" fill="none" stroke-linecap="round"/>`;};
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,G,14)+shaded(a=>`<rect x="${sx-9}" y="${sy+22}" width="18" height="12" rx="4" ${a}/>`,BR,BRD,-2,-2);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+bow(sx,sy)+hand(sx,sy+38,G);
    const armL=(sx: number, sy: number)=>armIn(sx,sy)+hand(sx,sy+38,G);
    let b='';
    b+=`<g transform="rotate(-24 52 120)">${shaded(a=>`<rect x="40" y="86" width="22" height="70" rx="7" ${a}/>`,BR,BRD,-3,-3)}<path d="M46 86 l-4 -14 l6 4 l3 -6 l2 16 M54 86 l0 -16 l5 6 l5 -4 l-3 14" fill="${GL}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
    b+=shaded(a=>`<path d="M34 112 Q26 30 100 6 Q174 30 166 112 Q164 144 140 152 L60 152 Q36 144 34 112Z" ${a}/>`,G,GD,-4,-4);
    b+=torso(G,GD);
    b+=`<path d="M64 142 L136 198" stroke="${O}" stroke-width="11" stroke-linecap="round"/><path d="M64 142 L136 198" stroke="${BR}" stroke-width="6" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M58 186 Q100 194 142 186 L142 198 Q100 206 58 198Z" ${a}/>`,BR,BRD,-2,-2)+`<rect x="93" y="187" width="14" height="11" rx="2" fill="#cfd5e0" stroke="${O}" stroke-width="2.5"/>`;
    b+=`<path d="M72 138 Q100 152 128 138 L122 148 Q100 158 78 148Z" fill="${GD}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b+=head(SK,SKD);
    const hoodTop=(a: string)=>`<path d="M44 96 Q42 30 100 18 Q158 30 156 96 Q150 64 130 56 Q100 46 70 56 Q50 64 44 96Z" ${a}/>`;
    b+=hoodShade(headS,60,104,.45);
    b+=shaded(hoodTop,G,GD,-4,-4)+gloss(74,34,13,5,-30,.4)+`<path d="M100 20 V44" stroke="${GD}" stroke-width="3" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M60 66 Q78 56 96 64 L92 70 Q78 66 64 72Z" ${a}/>`,HB,HBD,-2,-2)+mirror(shaded(a=>`<path d="M60 66 Q78 56 96 64 L92 70 Q78 66 64 72Z" ${a}/>`,HB,HBD,-2,-2));
    b+=domino(G,GD);
    b+=x.byPose(p=>{
      let s=face(p,{eye:'#3a7a3a',noMouth:true,noCheeks:true});
      s+=`<path d="M84 116 Q92 110 100 114 Q108 110 116 116 Q108 118 100 116 Q92 118 84 116Z" fill="${HB}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
      s+=p==2?`<path d="M92 120 Q100 118 108 120 Q106 126 100 127 Q94 126 92 120Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.5"/>`:`<path d="M92 121 Q100 124 108 120" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s+=`<path d="M92 128 Q100 132 108 128 L104 142 Q100 146 96 142Z" fill="${HB}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
      return s;
    });
    b+=x.arm('R',armR);
    /* corde de l'arc : tendue vers la main gauche à la préparation */
    const cR=this.sh!['R']!;
    const ends=(p: number)=>{const a=(this.poses[p]!['R'] as number)||0;return [rot([cR[0]-38,cR[1]+26],cR,a),rot([cR[0]+38,cR[1]+26],cR,a)] as const;};
    b+=x.byPose(p=>{const [e1,e2]=ends(p);const m=p==1?tip(this,'L',1,40):[(e1[0]+e2[0])/2,(e1[1]+e2[1])/2];
      let s=`<path d="M${f(e1[0])} ${f(e1[1])} L${f(m[0]!)} ${f(m[1]!)} L${f(e2[0])} ${f(e2[1])}" stroke="#f2ead6" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;
      if(p==1){const [hx,hy]=tip(this,'R',1,38);s+=`<path d="M${f(m[0]!)} ${f(m[1]!)} L${f(hx+22)} ${f(hy-2)}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${f(m[0]!)} ${f(m[1]!)} L${f(hx+22)} ${f(hy-2)}" stroke="#e9dcc5" stroke-width="3" stroke-linecap="round"/><path d="M${f(hx+20)} ${f(hy-8)} L${f(hx+34)} ${f(hy-2)} L${f(hx+20)} ${f(hy+4)}Z" fill="#cfd5e0" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`+glow(hx+30,hy-2,12,FL);}
      return s;});
    b+=x.arm('L',armL);
    const A=[206,148] as const;
    const arw=`<g transform="translate(${A[0]} ${A[1]}) rotate(-4)"><path d="M-44 0 H0" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M-44 0 H0" stroke="#e9dcc5" stroke-width="3" stroke-linecap="round"/><path d="M-44 0 l-6 -7 h10 Z M-44 0 l-6 7 h10 Z" fill="${GL}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-2 -6 L12 0 L-2 6Z" fill="#cfd5e0" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
    b+=x.when([2],`<g class="grow" style="transform-origin:150px 150px"><path d="M150 152 L${A[0]-44} ${A[1]+2}" stroke="${FL}" stroke-width="12" stroke-linecap="round" opacity=".35"/><path d="M150 152 L${A[0]-44} ${A[1]+2}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></g><g class="pop">${arw}</g><g class="pop">${burst(A[0]+18,A[1]-1,18,FL,'#fff')}</g>`);
    return shadow()+x.body(b);
  }
}];
