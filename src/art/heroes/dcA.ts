// Héros DC, planche A (design/planches/6-dc-heros-a.html) : même style et même API que les héros Marvel.
/* eslint-disable */
import { O, SK, SKD, f, shaded, clip, gloss, limb, hand, star, glow, burst, beam, bolt, sparks, torso, torsoD, head, headS, mirror, shadow, face, tip, dirOf, beamFrom, type CharDef, type Ctx } from '../primitives';
import { SKB, SKBD, cape, clasps, cowl, ears, lenses, jaw, domino, sShield, batSym, batPath, boltSym, speedLines, swoosh, shock, drops } from '../kits/dc';

export const DC_A: CharDef[] = [
{
  id:'batman',name:'Batman',role:'Exécution',rarity:'Légendaire',rar:'var(--leg)',tint:'#d6dbe8',tint2:'#8e97b3',stats:[4,3,4],
  atk:'Batarang qui file vers l’ennemi le plus avancé.',skill:'Chevalier noir : coups critiques garantis contre les ennemis étourdis ou ralentis.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:22,R:-162,body:[-3,-3,-6,1,1.02]},{L:30,R:-98,body:[7,0,7,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#7d8398',GD='#555a6f',K='#2c2b40',KD='#17162a',Y='#f6c64a',YD='#cf962a',BR='#3a3a52';
    const rang=(s: number)=>`<g transform="scale(${s})"><path d="${batPath}" fill="${BR}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M-13 -2 Q-6 -5 -2 -3" stroke="#8d8fb0" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,G,15)
      +shaded(a=>`<rect x="${sx-10}" y="${sy+19}" width="20" height="16" rx="5" ${a}/>`,K,KD,-2,-2)
      +`<path d="M${sx+9} ${sy+21} l7 2 l-7 3 l7 2 l-7 3" fill="${K}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`+hand(sx,sy+38,K);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([1],`<g transform="translate(${sx} ${sy+46}) rotate(90)">${rang(1.05)}</g>`);
    let b=cape(K,KD,8);
    b+=torso(G,GD);
    b+=`<path d="M70 160 Q84 168 98 160 M102 160 Q116 168 130 160" stroke="${GD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=batSym(100,160,1.35,K,3);
    b+=shaded(a=>`<path d="M58 184 Q100 194 142 184 L142 198 Q100 208 58 198Z" ${a}/>`,Y,YD,-3,-3);
    b+=`<g fill="${YD}" stroke="${O}" stroke-width="2.5">${[70,86,114,130].map(cx=>`<rect x="${cx-5}" y="${cx<100?188:188}" width="10" height="11" rx="2"/>`).join('')}</g><rect x="93" y="188" width="14" height="12" rx="3" fill="${Y}" stroke="${O}" stroke-width="3"/>`;
    b+=head(SK,SKD)+ears(K,KD,'bat')+cowl(K,KD);
    b+=x.byPose(p=>lenses(p)+jaw(p,127)+`<path d="M84 ${p?84:86} L96 ${p?92:90} M116 ${p?84:86} L104 ${p?92:90}" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`);
    b+=clasps(Y);
    b+=x.arm('L',armIn)+x.arm('R',armR);
    const [hx,hy]=tip(this,'R',2,40);
    const tx=198,ty=118;
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px"><path d="M${f(hx)} ${f(hy)} Q${f((hx+tx)/2)} ${f(Math.min(hy,ty)-26)} ${tx} ${ty}" stroke="#fff" stroke-width="4" fill="none" stroke-dasharray="7 7" stroke-linecap="round" opacity=".85"/></g>`
      +`<g class="pop"><g transform="translate(${tx} ${ty})"><g class="spin fast">${rang(1.35)}</g></g></g><g class="pop">${sparks(tx,ty,30,'#fff',8)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'superman',name:'Superman',role:'Dégâts',rarity:'Légendaire',rar:'var(--leg)',tint:'#d5e2ff',tint2:'#8eaaf0',stats:[5,3,4],
  atk:'Vision thermique sur l’ennemi le plus résistant.',skill:'Homme d’acier : rayon thermique qui balaie toute la ligne et la fait brûler.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:30,R:-30,body:[0,-6,0,1,1.03]},{L:40,R:-40,body:[-3,-9,-5,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const B='#2f5fd0',BD='#1f3f95',R='#d42e35',RD='#9b1d27',Y='#f6c64a',YD='#cf962a',H='#262035',HD='#13101d',HV='#ff3b3b';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,B,15)+`<path d="M${sx-1} ${sy+6} V${sy+28}" stroke="${BD}" stroke-width="2.5" stroke-linecap="round"/>`+hand(sx,sy+38,B)
      +x.when([1,2],`<path d="M${sx-7} ${sy+34} H${sx+7} M${sx-7} ${sy+40} H${sx+7}" stroke="${BD}" stroke-width="2" stroke-linecap="round"/>`);
    let b=cape(R,RD,10);
    b+=torso(B,BD);
    b+=`<path d="M66 172 Q84 180 98 172 M102 172 Q116 180 134 172" stroke="${BD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=sShield(100,158,1.15,R,Y);
    b+=shaded(a=>`<path d="M58 188 Q100 196 142 188 L142 200 Q100 208 58 200Z" ${a}/>`,R,RD,-3,-3)+`<rect x="92" y="189" width="16" height="12" rx="3" fill="${Y}" stroke="${O}" stroke-width="3"/>`;
    b+=shaded(a=>`<path d="M60 140 Q66 132 80 136 L74 150Z" ${a}/>`,R,RD,-2,-2)+mirror(shaded(a=>`<path d="M60 140 Q66 132 80 136 L74 150Z" ${a}/>`,R,RD,-2,-2));
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M46 90 Q38 30 100 24 Q162 30 154 90 Q150 64 134 58 Q116 68 100 60 Q80 68 64 62 Q52 70 46 90Z" ${a}/>`,'#3b3352',H,-4,-4)+gloss(80,36,13,5,-20,.35);
    b+=`<path d="M98 58 Q88 64 92 74 Q98 80 103 72" stroke="${O}" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M98 58 Q88 64 92 74 Q98 80 103 72" stroke="#3b3352" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    b+=x.byPose(p=>{
      let s=face(p,{eye:p?HV:'#2d5bb5',noCheeks:p==2});
      if(p) s+=`<g class="fx"><circle cx="80" cy="95" r="${p==2?16:12}" fill="${HV}" opacity=".35"/><circle cx="120" cy="95" r="${p==2?16:12}" fill="${HV}" opacity=".35"/></g>`;
      return s;
    });
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    b+=x.when([1],glow(80,95,13,HV)+glow(120,95,13,HV));
    const T=[232,150] as const;
    b+=x.when([2],`<g class="grow" style="transform-origin:80px 95px">${beam(80,95,T[0]-6,T[1]-4,5,HV)}</g><g class="grow" style="transform-origin:120px 95px">${beam(120,95,T[0],T[1]+4,5,HV)}</g>`
      +`<g class="pop">${burst(T[0],T[1],22,'#ff8a3a','#ffe27a')}</g><g class="pop"><path d="M${T[0]-18} ${T[1]+22} q4 -10 0 -18 M${T[0]} ${T[1]+26} q5 -12 0 -22 M${T[0]+16} ${T[1]+22} q4 -10 0 -18" stroke="#ff8a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'wonderwoman',name:'Wonder Woman',role:'Contrôle',rarity:'Légendaire',rar:'var(--leg)',tint:'#ffdcd4',tint2:'#ef9a8a',stats:[4,3,3],
  atk:'Lasso de vérité qui frappe et ralentit.',skill:'Lasso de Hestia : attache 3 ennemis, qui restent immobiles 2 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:14,R:-14},{L:30,R:-160,body:[-2,-4,-4,1,1.02]},{L:28,R:-96,body:[6,0,6,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const R='#d42e35',RD='#9b1d27',G='#f6c64a',GD='#cf962a',B='#2f55b8',BD='#1f3a85',H='#2a2033',HD='#160f1e',S='#dfe4ee',SD='#a3acbd',LS='#ffd34a';
    const cuff=(sx: number, sy: number)=>shaded(a=>`<rect x="${sx-10}" y="${sy+22}" width="20" height="12" rx="4" ${a}/>`,S,SD,-2,-2)+`<path d="M${sx-10} ${sy+28} H${sx+10}" stroke="${SD}" stroke-width="2"/>`;
    const coil=(cx: number, cy: number)=>`<g fill="none" stroke-linecap="round"><ellipse cx="${cx}" cy="${cy}" rx="14" ry="9" stroke="${O}" stroke-width="7"/><ellipse cx="${cx}" cy="${cy}" rx="14" ry="9" stroke="${LS}" stroke-width="3.5"/><ellipse cx="${cx+3}" cy="${cy+3}" rx="12" ry="7" stroke="${O}" stroke-width="7"/><ellipse cx="${cx+3}" cy="${cy+3}" rx="12" ry="7" stroke="${G}" stroke-width="3.5"/></g>`;
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SK,14)+cuff(sx,sy)+coil(sx,sy+48)+hand(sx,sy+38,SK);
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SK,14)+cuff(sx,sy)+hand(sx,sy+38,SK);
    let b='';
    b+=shaded(a=>`<path d="M42 86 Q30 150 46 186 L154 186 Q170 150 158 86Z" ${a}/>`,'#3b3046',HD,-4,-4);
    b+=torso(SK,SKD);
    b+=shaded(a=>`<path d="M58 202 C57 172 61 156 68 148 Q84 156 100 150 Q116 156 132 148 C139 156 143 172 142 202Z" ${a}/>`,R,RD,-6,-3);
    b+=shaded(a=>`<path d="M66 150 Q80 160 92 152 L100 164 L108 152 Q120 160 134 150 L128 166 Q114 172 106 164 L100 174 L94 164 Q86 172 72 166Z" ${a}/>`,G,GD,-2,-2);
    b+=shaded(a=>`<path d="M58 182 Q100 190 142 182 L142 192 Q100 200 58 192Z" ${a}/>`,G,GD,-2,-2);
    b+=clip(a=>`<path d="${torsoD}" ${a}/>`,`<path d="M50 190 Q100 200 150 190 V210 H50Z" fill="${B}"/>${[74,100,126].map(cx=>`<polygon points="${star(cx,201,4.5,2,5,-Math.PI/2)}" fill="#fff"/>`).join('')}`)+`<path d="M58 191 Q100 200 142 191" stroke="${O}" stroke-width="3" fill="none"/><path d="${torsoD}" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`;
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M44 96 Q34 28 100 24 Q166 28 156 96 Q152 66 134 60 Q112 70 100 58 Q88 70 66 60 Q48 68 44 96Z" ${a}/>`,'#3b3046',H,-4,-4)+gloss(78,36,13,5,-20,.35);
    b+=shaded(a=>`<path d="M58 66 Q100 50 142 66 L139 75 Q100 62 61 75Z" ${a}/>`,G,GD,-2,-2);
    b+=`<polygon points="${star(100,60,9,4,5,-Math.PI/2)}" fill="${R}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b+=x.byPose(p=>face(p,{eye:'#3a5fb0'})+(p==0?`<path d="M94 116 Q100 119 106 116" stroke="#d24a5a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`:''));
    b+=x.arm('L',armL)+x.arm('R',armR);
    /* lasso tournoyant puis lancé */
    const [wx,wy]=tip(this,'R',1,44);
    b+=x.when([1],`<g class="fx"><ellipse cx="${f(wx)}" cy="${f(wy-14)}" rx="30" ry="11" fill="${LS}" opacity=".25"/></g><ellipse cx="${f(wx)}" cy="${f(wy-14)}" rx="30" ry="11" fill="none" stroke="${O}" stroke-width="8"/><ellipse cx="${f(wx)}" cy="${f(wy-14)}" rx="30" ry="11" fill="none" stroke="${LS}" stroke-width="4"/>${sparks(wx,wy-14,40,'#fff2a0',6)}`);
    const [hx,hy]=tip(this,'R',2,40),T=[210,160] as const;
    const rope=`M${f(hx)} ${f(hy)} Q${f((hx+T[0])/2)} ${f(hy-40)} ${T[0]-20} ${T[1]-4}`;
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px"><path d="${rope}" stroke="${LS}" stroke-width="16" fill="none" opacity=".3" stroke-linecap="round"/><path d="${rope}" stroke="${O}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${rope}" stroke="${LS}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`
      +`<g class="pop"><ellipse cx="${T[0]}" cy="${T[1]}" rx="24" ry="30" fill="${LS}" opacity=".25"/><ellipse cx="${T[0]}" cy="${T[1]}" rx="22" ry="28" fill="none" stroke="${O}" stroke-width="8"/><ellipse cx="${T[0]}" cy="${T[1]}" rx="22" ry="28" fill="none" stroke="${LS}" stroke-width="4"/>${sparks(T[0],T[1],40,'#fff2a0',8)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'flash',name:'Flash',role:'Vitesse',rarity:'Épique',rar:'var(--epi)',tint:'#ffe1cc',tint2:'#f6a77a',stats:[2,5,3],
  atk:'Rafale de coups ultra-rapides.',skill:'Force véloce : accélère tous les héros adjacents de 25 % pendant 4 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:46,R:34,body:[-12,6,-10,1.04,.94]},{L:22,R:-100,body:[18,-2,10,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const R='#d8312f',RD='#9c1b24',Y='#f6c64a',YD='#cf962a',LT='#ffe066';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,R,15)+`<path d="M${sx-8} ${sy+26} l6 -4 l2 5 l7 -5" stroke="${Y}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`+hand(sx,sy+38,R);
    let b='';
    /* silhouettes de vitesse (images rémanentes) */
    const ghost=(dx: number,o: number)=>`<g opacity="${o}" transform="translate(${dx} 6)"><path d="${torsoD}" fill="${R}"/><circle cx="100" cy="84" r="56" fill="${R}"/></g>`;
    b+=x.when([2],`<g class="pop">${ghost(-46,.18)}${ghost(-24,.3)}</g>`);
    b+=torso(R,RD);
    b+=`<circle cx="100" cy="162" r="15" fill="#fff" stroke="${O}" stroke-width="4"/>`+boltSym(100,162,.85,Y,3);
    b+=shaded(a=>`<path d="M58 188 L80 192 L84 186 L100 194 L116 186 L120 192 L142 188 L142 200 Q100 208 58 200Z" ${a}/>`,Y,YD,-2,-2);
    b+=head(SK,SKD)+cowl(R,RD);
    const wing=`<path d="M48 76 L24 62 L38 78 L20 82 L44 92Z" fill="${Y}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=wing+mirror(wing);
    b+=`<path d="M70 40 Q100 30 130 40" stroke="${RD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=x.byPose(p=>{
      const hole=`<path d="M64 90 Q80 80 96 92 Q96 104 82 106 Q66 104 64 90Z" fill="${SK}" stroke="${O}" stroke-width="3"/>`;
      return hole+mirror(hole)+face(p,{noMouth:true,noCheeks:true,eye:'#3a7ad0'})+(p==2?jaw(2,127):p==1?jaw(1,127):`<path d="M90 124 Q100 130 110 124" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    });
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    b+=x.when([1],`<g class="fx">${bolt([[44,190],[30,170],[40,166],[26,146]],LT)}${bolt([[160,196],[176,178],[166,174],[182,156]],LT)}</g>`);
    const [hx,hy]=tip(this,'R',2,44);
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${speedLines(hx-10,hy,70,LT,3,10)}</g>`
      +`<g class="pop">${burst(f(hx+8),f(hy),22,LT,'#fff')}</g><g class="pop">${bolt([[hx+10,hy-14],[hx+24,hy-30],[hx+20,hy-16],[hx+36,hy-26]],LT)}${bolt([[hx+10,hy+14],[hx+22,hy+30],[hx+30,hy+20],[hx+38,hy+34]],LT)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'aquaman',name:'Aquaman',role:'Dégâts de zone',rarity:'Épique',rar:'var(--epi)',tint:'#cdf0ee',tint2:'#6cc6c8',stats:[4,2,3],
  atk:'Trident qui projette un jet d’eau.',skill:'Raz-de-marée : une vague repousse tous les ennemis de la ligne.',
  sh:{L:[68,150],R:[132,150]},parts:['tr'],
  poses:[{L:14,R:-14,tr:200},{L:24,R:-172,tr:0,body:[-3,-4,-5,1,1.02]},{L:26,R:-128,tr:0,body:[7,0,6,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const OR='#f28a2a',ORD='#c45e14',G='#3f9a52',GD='#2a6e38',GO='#f6c64a',GOD='#cf962a',H='#6b4a2a',HD='#47301a',W='#5ad0ff';
    const trident=(sx: number, y: number)=>`<rect x="${sx-4}" y="${y-30}" width="8" height="104" rx="4" fill="${GO}" stroke="${O}" stroke-width="3.5"/><path d="M${sx-1.5} ${y-20} V${y+60}" stroke="#fff3b0" stroke-width="2" opacity=".7"/>`
      +shaded(a=>`<path d="M${sx-20} ${y+66} Q${sx-20} ${y+80} ${sx} ${y+80} Q${sx+20} ${y+80} ${sx+20} ${y+66} L${sx+14} ${y+66} Q${sx+12} ${y+74} ${sx} ${y+74} Q${sx-12} ${y+74} ${sx-14} ${y+66}Z" ${a}/>`,GO,GOD,-2,-2)
      +`<g fill="${GO}" stroke="${O}" stroke-width="3" stroke-linejoin="round"><polygon points="${sx-17},${y+78} ${sx-22},${y+102} ${sx-11},${y+80}"/><polygon points="${sx+17},${y+78} ${sx+22},${y+102} ${sx+11},${y+80}"/><polygon points="${sx-5},${y+78} ${sx},${y+108} ${sx+5},${y+78}"/></g>`;
    const glove=(sx: number, sy: number)=>shaded(a=>`<rect x="${sx-10}" y="${sy+20}" width="20" height="16" rx="5" ${a}/>`,G,GD,-2,-2)+`<path d="M${sx+9} ${sy+22} l7 3 l-7 3 l7 3 l-7 3" fill="${G}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,OR,15)+glove(sx,sy)+hand(sx,sy+38,G);
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,OR,15)+glove(sx,sy)+x.part('tr',sx,sy+38,trident(sx,sy+38))+hand(sx,sy+38,G);
    let b='';
    b+=shaded(a=>`<path d="M40 88 Q30 150 50 172 L150 172 Q170 150 160 88Z" ${a}/>`,'#7d5834',HD,-4,-4);
    b+=torso(OR,ORD);
    let sc='';for(let r=0;r<6;r++)for(let i=0;i<10;i++){const cx=50+i*11+(r%2)*5.5,cy=142+r*10;sc+=`<path d="M${cx-5.5} ${cy} Q${cx} ${cy+8} ${cx+5.5} ${cy}"/>`}
    b+=clip(a=>`<path d="${torsoD}" ${a}/>`,`<g stroke="${ORD}" stroke-width="2.2" fill="none">${sc}</g>`)+`<path d="${torsoD}" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`;
    b+=shaded(a=>`<path d="M58 188 Q100 196 142 188 L142 200 Q100 208 58 200Z" ${a}/>`,G,GD,-3,-3)+shaded(a=>`<path d="M90 187 H110 L106 202 H94Z" ${a}/>`,GO,GOD,-2,-2)+`<path d="M96 199 L100 190 L104 199 M97.5 196 H102.5" stroke="${O}" stroke-width="2" fill="none"/>`;
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M54 90 Q54 128 74 142 Q88 152 100 152 Q112 152 126 142 Q146 128 146 90 Q140 110 126 116 Q114 110 100 112 Q86 110 74 116 Q60 110 54 90Z" ${a}/>`,'#7d5834',HD,-3,-4);
    b+=x.byPose(p=>face(p,{eye:'#3a8a8a',noCheeks:true}));
    b+=`<path d="M78 114 Q88 104 100 110 Q112 104 122 114 Q110 118 100 115 Q90 118 78 114Z" fill="#7d5834" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    b+=shaded(a=>`<path d="M44 96 Q34 28 100 22 Q166 28 156 96 Q154 70 140 60 Q120 70 102 54 Q84 70 62 62 Q48 72 44 96Z" ${a}/>`,'#7d5834',HD,-4,-4)+`<path d="M60 50 Q76 36 96 40 M112 40 Q130 38 142 52" stroke="#a07848" stroke-width="3" fill="none" stroke-linecap="round"/>`+gloss(80,34,13,5,-20,.3);
    b+=x.arm('L',armL)+x.arm('R',armR);
    const [px,py]=tip(this,'R',1,146);
    b+=x.when([1],`<g class="spin"><g fill="none" stroke-linecap="round"><path d="M${f(px-22)} ${f(py)} A22 12 0 1 1 ${f(px+22)} ${f(py)}" stroke="${O}" stroke-width="9"/><path d="M${f(px-22)} ${f(py)} A22 12 0 1 1 ${f(px+22)} ${f(py)}" stroke="${W}" stroke-width="5"/></g></g>`+drops([[px-24,py+12,5],[px+24,py+6,6],[px+6,py-18,5]],W));
    const [qx,qy]=tip(this,'R',2,146);
    const wave=`<path d="M136 208 C140 172 160 132 196 118 C224 108 240 124 238 146 C230 134 214 134 208 146 C202 160 214 172 228 166 C234 182 236 196 238 208Z" fill="${W}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M152 206 C154 178 170 156 196 144" stroke="#2f9ad8" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M176 196 C178 182 186 172 198 166" stroke="#2f9ad8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M186 134 C206 124 226 126 234 138" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="214" cy="158" r="5" fill="#fff" opacity=".85"/>`;
    b+=x.when([2],`<g class="pop">${glow(qx,qy,18,W)}</g>`);
    const fxw=x.when([2],`<g class="pop">${wave}</g><g class="pop">${drops([[214,100,6],[194,108,5],[232,112,4],[170,120,4]],W)}</g>`);
    return shadow()+x.body(b)+fxw;
  }
},
{
  id:'greenlantern',name:'Green Lantern',role:'Soutien · bouclier',rarity:'Légendaire',rar:'var(--leg)',tint:'#d6f4d2',tint2:'#86d17c',stats:[3,3,4],
  atk:'Poing-construction vert.',skill:'Serment : une bulle verte protège un héros des pouvoirs de boss pendant 6 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:20,R:-150,body:[-2,-4,-4,1,1.02]},{L:24,R:-122,body:[4,0,4,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#3fae4a',GD='#25803a',K='#2a2636',KD='#16131f',H='#5a3a22',HD='#3a2414',GL='#7dff7a';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,K,15)+shaded(a=>`<rect x="${sx-9}" y="${sy+22}" width="18" height="12" rx="4" ${a}/>`,G,GD,-2,-2)+hand(sx,sy+38,G);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([1,2],glow(sx,sy+44,14,GL))+`<circle cx="${sx}" cy="${sy+44}" r="5" fill="${GL}" stroke="${O}" stroke-width="2.5"/>`;
    let b=torso(K,KD);
    b+=shaded(a=>`<path d="M78 138 Q100 146 122 138 L134 203 L66 203Z" ${a}/>`,G,GD,-4,-3);
    b+=`<circle cx="100" cy="162" r="15" fill="#fff" stroke="${O}" stroke-width="4"/><circle cx="100" cy="162" r="8.5" fill="none" stroke="${G}" stroke-width="4"/><path d="M89 154 H111 M89 170 H111" stroke="${G}" stroke-width="3.5" stroke-linecap="round"/>`;
    b+=x.when([1,2],glow(100,162,26,GL));
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M46 90 Q40 30 100 26 Q160 30 154 90 Q150 62 132 56 Q120 66 100 56 Q82 64 66 58 Q50 68 46 90Z" ${a}/>`,'#6e4a2c',HD,-4,-4)+`<path d="M78 40 Q92 30 106 34" stroke="#94683e" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=domino(G,GD);
    b+=x.byPose(p=>face(p,{eye:p?'#9dffa0':'#fbfdff'}));
    b+=x.arm('L',armIn)+x.arm('R',armR);
    const [rx,ry]=tip(this,'R',1,46);
    b+=x.when([1],sparks(rx,ry,26,GL,8));
    /* construction : poing géant vert */
    const [hx,hy]=tip(this,'R',2,46),[dx,dy]=dirOf(this,'R',2),cx=hx+dx*34+8,cy=hy+dy*34+8;
    const fist=`<g transform="translate(${f(cx)} ${f(cy)}) rotate(-20)" stroke="${O}" stroke-linejoin="round"><rect x="-30" y="-22" width="44" height="44" rx="12" fill="${GL}" fill-opacity=".6" stroke-width="5"/>${[-16.5,-5.5,5.5,16.5].map(yy=>`<rect x="6" y="${yy-5.5}" width="20" height="11" rx="5.5" fill="${GL}" fill-opacity=".75" stroke-width="3.5"/>`).join('')}<path d="M-20 -22 Q-4 -32 8 -20" fill="${GL}" fill-opacity=".75" stroke-width="3.5"/><path d="M-22 -12 Q-24 0 -20 10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/></g>`;
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${beam(hx,hy,cx-dx*30,cy-dy*30,8,GL)}</g><g class="pop">${fist}</g><g class="pop">${sparks(cx+20,cy-14,30,GL,7)}</g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'cyborg',name:'Cyborg',role:'Dégâts',rarity:'Épique',rar:'var(--epi)',tint:'#dfe5f0',tint2:'#98a7c2',stats:[4,3,4],
  atk:'Canon sonique sur l’ennemi le plus proche.',skill:'Piratage : désactive le pouvoir du boss pendant 5 s.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-14},{L:20,R:-58,body:[-2,-2,-3,1,1]},{L:24,R:-96,body:[-6,0,-5,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const M='#d3d9e5',MD='#8f99b0',DK='#3a3f55',DKD='#232636',RE='#ff3b3b',C='#7fe8ff';
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,M,16)+`<path d="M${sx-8} ${sy+16} H${sx+8}" stroke="${MD}" stroke-width="2.5"/>`+hand(sx,sy+38,DK);
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+30,M,16)
      +shaded(a=>`<rect x="${sx-15}" y="${sy+18}" width="30" height="40" rx="8" ${a}/>`,M,MD,-3,-3)
      +`<path d="M${sx-15} ${sy+30} H${sx+15} M${sx-15} ${sy+42} H${sx+15}" stroke="${MD}" stroke-width="2.5"/>`
      +shaded(a=>`<rect x="${sx-11}" y="${sy+56}" width="22" height="10" rx="3" ${a}/>`,DK,DKD,-2,-2)
      +x.byPose(p=>p?glow(sx,sy+66,p==2?18:13,C):'')+x.byPose(p=>`<ellipse cx="${sx}" cy="${sy+66}" rx="8" ry="4" fill="${p?'#e8fdff':DKD}" stroke="${O}" stroke-width="2.5"/>`);
    let b=torso(M,MD);
    b+=`<path d="M60 172 Q100 182 140 172 M100 138 V150 M76 150 L66 196 M124 150 L134 196" stroke="${MD}" stroke-width="3" fill="none"/>`;
    b+=shaded(a=>`<path d="M78 148 Q100 140 122 148 L118 178 Q100 186 82 178Z" ${a}/>`,DK,DKD,-3,-3);
    b+=x.when([1,2],glow(100,162,22,RE));
    b+=`<circle cx="100" cy="162" r="9" fill="${RE}" stroke="${O}" stroke-width="3.5"/><circle cx="97" cy="159" r="3" fill="#fff" opacity=".8"/>`;
    b+=shaded(a=>`<path d="M58 190 Q100 198 142 190 L142 202 Q100 208 58 202Z" ${a}/>`,DK,DKD,-2,-2);
    b+=shaded(headS,M,MD)+gloss(76,50,14,8);
    b+=`<path d="M72 36 Q100 26 128 36 M100 28 V54 M138 60 Q150 72 152 92" stroke="${MD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M54 82 Q60 66 82 66 Q98 68 100 80 L100 140 Q70 138 56 118 Q50 100 54 82Z" ${a}/>`,SKB,SKBD,-3,-3);
    b+=`<path d="M54 82 Q60 66 82 66 Q98 68 100 80 L100 140" fill="none" stroke="${O}" stroke-width="3.5"/><circle cx="100" cy="86" r="2.5" fill="${MD}" stroke="${O}" stroke-width="1.5"/><circle cx="100" cy="128" r="2.5" fill="${MD}" stroke="${O}" stroke-width="1.5"/>`;
    b+=x.byPose(p=>{
      let s=face(p,{eye:'#3a2418',noCheeks:true});
      s+=`<g class="fx"><circle cx="120" cy="95" r="${p?16:12}" fill="${RE}" opacity=".35"/></g><circle cx="120" cy="95" r="11" fill="${DK}" stroke="${O}" stroke-width="3.5"/><circle cx="120" cy="95" r="6.5" fill="${RE}"/><circle cx="118" cy="93" r="2.2" fill="#fff"/>`;
      return s+`<path d="M108 82 L132 86" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`;
    });
    b+=x.arm('L',armL)+x.arm('R',armR);
    b+=shaded(a=>`<circle cx="136" cy="147" r="15" ${a}/>`,M,MD,-4,-4)+gloss(132,141,5,3,-30,.6);
    b+=x.when([2],beamFrom(this,'R',68,118,22,C)+`<g class="ring"><circle cx="${f(tip(this,'R',2,140)[0])}" cy="${f(tip(this,'R',2,140)[1])}" r="20" fill="none" stroke="${C}" stroke-width="5"/></g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'supergirl',name:'Supergirl',role:'Dégâts',rarity:'Rare',rar:'var(--rare)',tint:'#dbe6ff',tint2:'#f0a3a8',stats:[4,4,2],
  atk:'Coup de poing supersonique.',skill:'Fille d’acier : chaque 5e coup projette une onde de choc qui étourdit.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12},{L:26,R:44,body:[-8,-4,-8,1,1.02]},{L:24,R:-98,body:[8,-6,7,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const B='#3a6be0',BD='#244aa6',R='#d42e35',RD='#9b1d27',Y='#f6c64a',YD='#cf962a',HR='#f6d26a',HRD='#d6a636';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,B,14)+hand(sx,sy+38,SK);
    const armR=(sx: number, sy: number)=>armIn(sx,sy)+x.when([1],glow(sx,sy+40,15,'#9fd0ff'));
    let b=cape(R,RD,8);
    b+=shaded(a=>`<path d="M40 88 Q28 150 50 180 L150 180 Q172 150 160 88Z" ${a}/>`,HR,HRD,-4,-4);
    b+=torso(B,BD);
    b+=sShield(100,160,1,R,Y);
    b+=shaded(a=>`<path d="M58 186 Q100 194 142 186 L143 203 L57 203Z" ${a}/>`,R,RD,-3,-3)+shaded(a=>`<path d="M58 182 Q100 190 142 182 L142 189 Q100 197 58 189Z" ${a}/>`,Y,YD,-2,-2);
    b+=head(SK,SKD);
    b+=shaded(a=>`<path d="M44 98 Q34 28 100 24 Q166 28 156 98 Q152 66 132 58 Q122 70 104 62 Q96 74 76 66 Q54 70 44 98Z" ${a}/>`,HR,HRD,-4,-4)+gloss(82,36,14,5,-20,.45);
    b+=x.byPose(p=>face(p,{eye:'#3a6be0'})+(p==0?`<path d="M94 116 Q100 119 106 116" stroke="#d24a5a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`:''));
    b+=x.arm('L',armIn)+x.arm('R',armR);
    const [hx,hy]=tip(this,'R',2,44);
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${speedLines(hx-24,hy,60,'#cfe2ff',3,11)}</g>`
      +shock(hx+16,hy,12,24,'#fff')+`<g class="ring" style="animation-delay:.12s"><ellipse cx="${f(hx+30)}" cy="${f(hy)}" rx="14" ry="34" fill="none" stroke="${O}" stroke-width="9"/><ellipse cx="${f(hx+30)}" cy="${f(hy)}" rx="14" ry="34" fill="none" stroke="#9fd0ff" stroke-width="5"/></g><g class="pop">${burst(f(hx+8),f(hy),20,'#fff','#cfe2ff')}</g>`);
    return shadow()+x.body(b);
  }
}];
