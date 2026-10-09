// Personnages extraits de la planche design/planches/3-disney-a.html : code de dessin repris tel quel, typé.
// Ne pas redessiner : corriger ici seulement ce qui casse le rendu statique.
/* eslint-disable */
import { O, SK, SKD, f, shaded, clip, gloss, limb, hand, star, glow, burst, sparks, torso, head, mirror, shadow, face, type CharDef, type Ctx } from '../primitives';
import { SKT, SKTD, pt, scallop, curls, lashes, leaf, heart, note, bubble, foam, flower, mface, swoosh, fire, bite, puff, speed } from '../kits/disneyA';

export const DISNEY_A: CharDef[] = [
{
  id:'moana',name:'Vaïana & Pua',role:'Contrôle',rarity:'Épique',rar:'var(--epi)',tint:'#c7f1ee',tint2:'#71cdd0',stats:[2,3,4],
  atk:'Coup de rame.',skill:'Appel de l’océan : une vague repousse les ennemis.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-128,sk:[0,0,0,1,1]},{L:145,R:-158,body:[-3,-5,-4,1,1.02],sk:[0,5,0,1.12,.84]},{L:150,R:-76,body:[6,2,6,1,1],sk:[2,-24,-10,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const H='#3a3044',HD='#17121f',T='#d8392f',TD='#a0222a',TP='#efd6a4',TPD='#c9a66e',WD='#b07a43',WDD='#7d5228',W='#39c9d4',W2='#1b8fb0';
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SKT,15)+hand(sx,sy+38,SKT);
    const armR=(sx: number, sy: number)=>{
      const blade=(a: string)=>`<path d="M${sx} ${sy+64} Q${sx+15} ${sy+74} ${sx+13} ${sy+92} Q${sx+9} ${sy+106} ${sx} ${sy+108} Q${sx-9} ${sy+106} ${sx-13} ${sy+92} Q${sx-15} ${sy+74} ${sx} ${sy+64}Z" ${a}/>`;
      return x.when([1,2],`<g class="fx"><ellipse cx="${sx}" cy="${sy+88}" rx="24" ry="32" fill="${W}" opacity=".4"/></g>`)
        +limb(sx,sy,sx,sy+38,SKT,15)
        +`<path d="M${sx} ${sy+30} V${sy+72}" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M${sx} ${sy+30} V${sy+72}" stroke="${WD}" stroke-width="6" stroke-linecap="round"/>`
        +shaded(blade,WD,WDD,-3,-3)+`<path d="M${sx} ${sy+72} V${sy+102} M${sx-6} ${sy+86} L${sx} ${sy+80} L${sx+6} ${sy+86} M${sx-6} ${sy+96} L${sx} ${sy+90} L${sx+6} ${sy+96}" stroke="${WDD}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`+gloss(sx-5,sy+80,2.5,7,0,.45)
        +hand(sx,sy+38,SKT);
    };
    // vague qui monte (préparation), puis déferlante (frappe)
    const waveUp=(a: string)=>`<path d="M124 207 C126 160 146 116 192 104 C222 98 240 116 236 136 C228 124 212 122 205 134 C198 148 210 160 222 158 C216 178 214 194 220 207Z" ${a}/>`;
    let g=x.when([1],`<g class="rise" style="transform-origin:180px 207px">${shaded(waveUp,W,W2,-8,-6)}<path d="M148 192 Q156 152 184 126 M170 202 Q174 172 194 152" stroke="#c6f7fa" stroke-width="4" fill="none" stroke-linecap="round"/>${foam([[186,108,6],[198,103,8],[212,101,7],[225,106,7],[234,117,6]])}</g>`);
    const waveC=(a: string)=>`<path d="M132 207 C132 150 156 98 202 86 C232 80 248 104 240 132 C232 116 216 114 208 126 C200 140 212 152 226 150 C218 172 222 192 232 207Z" ${a}/>`;
    g+=x.when([2],`<g class="pop">${shaded(waveC,W,W2,-8,-6)}<path d="M160 150 Q170 116 196 100" stroke="#c6f7fa" stroke-width="4" fill="none" stroke-linecap="round"/>${foam([[188,92,6],[202,86,8],[217,84,8],[230,90,7],[239,104,7],[240,120,5]])}</g>`
      +`<g class="ring"><ellipse cx="200" cy="205" rx="44" ry="9" fill="none" stroke="#fff" stroke-width="5"/></g>`);
    const surge=(a: string)=>`<path d="M150 207 Q160 186 184 182 Q206 178 222 188 Q234 180 244 186 L244 207Z" ${a}/>`;
    const fg=x.when([2],`<g class="pop">${shaded(surge,W,W2,-5,-4)}${foam([[168,190,5],[184,184,6],[200,183,5],[216,188,6],[232,186,5]])}</g>`);
    let fr=x.when([2],`<g class="pop">${foam([[200,64,5],[222,62,4],[184,72,3.5],[236,74,3.5],[212,48,3]])}</g>`+`<g class="pop">${sparks(214,104,40,'#c6f7fa',10)}</g>`);
    fr+=x.when([1],sparks(...pt(this,'R',1,0,90),26,'#c6f7fa',7));
    let b=shaded(a=>`<path d="${scallop(100,104,66,80,16,15)}" ${a}/>`,H,HD,-4,-4);
    b+=torso(SKT,SKTD);
    b+=shaded(a=>`<path d="M59 174 C57 156 70 140 100 138 C130 140 143 156 141 174 Q100 182 59 174Z" ${a}/>`,T,TD,-6,-3);
    b+=shaded(a=>`<path d="M57 188 Q100 194 143 188 L143 203 L57 203Z" ${a}/>`,TP,TPD,-3,-3);
    let zz='M62 199';for(let i=0;i<13;i++)zz+=` l3 -5 l3 5`;
    b+=`<path d="${zz}" stroke="#b5562f" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;
    b+=`<path d="M82 140 Q100 156 118 140" stroke="${O}" stroke-width="2.6" fill="none"/><circle cx="100" cy="156" r="9" fill="#f3ead2" stroke="${O}" stroke-width="3"/><path d="M100 156 q3 -1 3 2 q-1 4 -5 3 q-5 -1 -4 -6 q2 -5 8 -4" stroke="#2fb36b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    b+=head(SKT,SKTD);
    b+=x.byPose(p=>face(p,{eye:'#4b2c1d'})+lashes);
    b+=shaded(a=>`<path d="M44 94 Q38 30 100 26 Q162 30 156 94 Q152 70 138 60 Q122 50 104 52 Q100 44 96 52 Q74 50 60 62 Q48 74 44 94Z" ${a}/>`,H,HD,-3,-3)+gloss(80,36,12,4,-10,.3);
    b+=flower(56,58,15,'#ff6f91');
    b+=x.arm('L',armL)+x.arm('R',armR);
    // Pua
    const PK='#fde6e8',PKD='#efb3bf',SP='#8a5a3c';
    let p=`<path d="M52 194 q8 -2 6 -8 q-2 -4 -5 0" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M52 194 q8 -2 6 -8 q-2 -4 -5 0" stroke="#f3a9b8" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    p+=shaded(a=>`<ellipse cx="38" cy="194" rx="19" ry="12" ${a}/>`,PK,PKD,-3,-3)+`<ellipse cx="46" cy="190" rx="5" ry="3.5" fill="${SP}"/>`;
    p+=`<g fill="${PK}" stroke="${O}" stroke-width="3" stroke-linejoin="round"><path d="M13 168 L9 151 L24 160Z"/><path d="M39 168 L43 151 L28 160Z"/></g><path d="M14 162 L12 155 L19 159Z M38 162 L40 155 L33 159Z" fill="#f5a3b3"/>`;
    p+=shaded(a=>`<circle cx="26" cy="176" r="16" ${a}/>`,PK,PKD,-3,-3)+`<ellipse cx="34" cy="166" rx="5.5" ry="4" fill="${SP}"/>`+gloss(19,166,4,2.4,-30,.7);
    p+=x.byPose(q=>{
      let s=mface(26,175,1,q,{happy:true});
      s+=`<ellipse cx="26" cy="184" rx="7.5" ry="5" fill="#f5a3b3" stroke="${O}" stroke-width="2.5"/><circle cx="23.5" cy="184" r="1.4" fill="${O}"/><circle cx="28.5" cy="184" r="1.4" fill="${O}"/>`;
      if(q==2) s+=`<path d="M21 190 Q26 199 31 190Z" fill="#7a1f2b" stroke="${O}" stroke-width="2"/>`;
      if(q==1) s+=`<path d="M44 160 q3 5 0 7 q-3 -2 0 -7Z" fill="#9be7ff" stroke="${O}" stroke-width="1.6"/>`;
      return s;
    });
    return shadow()+`<ellipse cx="32" cy="207" rx="22" ry="6" fill="${O}" opacity=".16"/>`+g+fr+x.body(b)+fg+x.kick(p,32,206);
  }
},
{
  id:'maui',name:'Maui',role:'Dégâts / transformation',rarity:'Légendaire',rar:'var(--leg)',tint:'#cfe6ff',tint2:'#79a9e0',stats:[5,2,2],shake:true,
  atk:'Coup d’hameçon.',skill:'Métamorphose : se change en faucon ou en requin.',
  sh:{L:[60,148],R:[140,148]},
  poses:[{L:16,R:-135},{L:42,R:-160,body:[-4,-8,-6,.98,1.05]},{L:28,R:-70,body:[2,4,3,1.06,.92]}],
  draw(this: CharDef, x: Ctx): string {
    const S='#a9683f',SD='#7c4628',TT='#2a1f2e',H='#3a3044',HD='#140f1a',LF='#53a63c',LFD='#357a28',BN='#f1e4c6',BND='#c9b48a',BL='#6fd8ff';
    const tat=(sx: number, sy: number)=>`<path d="M${sx-10} ${sy+12} L${sx-4} ${sy+7} L${sx+2} ${sy+12} L${sx+8} ${sy+7} M${sx-10} ${sy+20} H${sx+10} M${sx-10} ${sy+27} L${sx-4} ${sy+32} L${sx+2} ${sy+27} L${sx+8} ${sy+32}" stroke="${TT}" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+42,S,22)+tat(sx,sy)+hand(sx,sy+46,S,16);
    const armR=(sx: number, sy: number)=>{
      const d=`M${sx} ${sy+30} L${sx} ${sy+70} Q${sx} ${sy+92} ${sx-18} ${sy+92} Q${sx-32} ${sy+90} ${sx-32} ${sy+76}`;
      return x.when([1,2],`<g class="fx"><path d="${d}" stroke="${BL}" stroke-width="38" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/></g>`)
        +limb(sx,sy,sx,sy+42,S,22)+tat(sx,sy)
        +`<path d="${d}" stroke="${O}" stroke-width="21" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        +`<polygon points="${sx-43},${sy+84} ${sx-32},${sy+60} ${sx-22},${sy+82}" fill="${BN}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`
        +`<path d="${d}" stroke="${BN}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        +`<path d="M${sx+3} ${sy+56} V${sy+72} Q${sx+2} ${sy+89} ${sx-12} ${sy+90}" stroke="${BND}" stroke-width="4" fill="none" stroke-linecap="round"/>`
        +`<path d="M${sx-3} ${sy+58} V${sy+72}" stroke="#fff" stroke-width="3" opacity=".75" stroke-linecap="round"/>`
        +x.when([1,2],`<g class="fx"><path d="M${sx} ${sy+64} l-3 6 l3 6 l-3 6 M${sx-10} ${sy+88} l-6 -3 l-6 3" stroke="${BL}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`)
        +`<path d="M${sx-7} ${sy+57} H${sx+7} M${sx-7} ${sy+63} H${sx+7}" stroke="#7a4b2a" stroke-width="3.2"/>`
        +hand(sx,sy+46,S,16);
    };
    let b=shaded(a=>`<path d="${scallop(100,98,74,82,18,18)}" ${a}/>`,H,HD,-4,-4);
    b+=torso(S,SD,'M34 203 C32 152 62 128 100 126 C138 128 168 152 166 203Z');
    b+=`<path d="M62 162 Q82 174 98 164 M102 164 Q118 174 138 162" stroke="${SD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    b+=`<g stroke="${TT}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="M50 156 L58 148 L66 156 L74 148 L82 156 M118 156 L126 148 L134 156 L142 148 L150 156"/><path d="M84 176 H116 M86 183 L93 189 L100 183 L107 189 L114 183"/><path d="M128 168 q8 -4 12 4 q2 8 -6 8 q-6 -2 -2 -6"/></g>`;
    b+=`<g stroke="${TT}" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cx="70" cy="166" r="3.2" fill="${TT}"/><path d="M70 170 V180 M64 174 H76 M70 180 L65 186 M70 180 L75 186"/></g>`;
    b+=shaded(a=>`<path d="M35 186 L44 194 L52 184 L62 195 L72 185 L82 195 L92 185 L102 195 L112 185 L122 195 L132 185 L142 195 L152 184 L160 193 L166 186 L166 203 L34 203Z" ${a}/>`,LF,LFD,-4,-3);
    b+=`<path d="M52 186 V202 M72 187 V202 M92 187 V202 M112 187 V202 M132 187 V202 M152 186 V202" stroke="${LFD}" stroke-width="2.4"/>`;
    let th='';for(let i=0;i<7;i++){const t=(i+1)/8,cx=(1-t)**2*70+2*(1-t)*t*100+t*t*130,cy=(1-t)**2*138+2*(1-t)*t*160+t*t*138;th+=`<polygon points="${f(cx-4)},${f(cy)} ${f(cx+4)},${f(cy)} ${f(cx)},${f(cy+10)}"/>`}
    b+=`<path d="M70 138 Q100 160 130 138" stroke="${O}" stroke-width="3" fill="none"/><g fill="#fff8e6" stroke="${O}" stroke-width="2.2" stroke-linejoin="round">${th}</g>`;
    b+=head(S,SD);
    b+=shaded(a=>`<path d="M44 90 Q36 26 100 22 Q164 26 156 90 Q150 64 134 56 Q118 66 100 58 Q82 66 66 56 Q50 64 44 90Z" ${a}/>`,H,HD,-3,-3)+gloss(84,34,12,4,-10,.3);
    b+=x.byPose(p=>{
      let s=face(p,{noMouth:true,noCheeks:true,eye:'#3a2216'});
      s+=`<path d="M70 ${p?80:79} Q80 ${p?78:74} 90 ${p?84:80} M130 ${p?80:79} Q120 ${p?78:74} 110 ${p?84:80}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s+=`<path d="M91 110 Q100 101 109 110 Q112 117 100 118 Q88 117 91 110Z" fill="${SD}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      if(p==0) s+=`<path d="M80 122 Q100 128 120 122 Q114 138 100 139 Q86 138 80 122Z" fill="#fff" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M84 126 Q100 131 116 126" stroke="${O}" stroke-width="1.8" fill="none"/>`;
      else if(p==1) s+=`<rect x="84" y="121" width="32" height="12" rx="4" fill="#fff" stroke="${O}" stroke-width="3.5"/><path d="M84 127 H116 M92 121 V133 M100 121 V133 M108 121 V133" stroke="${O}" stroke-width="1.8"/>`;
      else s+=`<path d="M82 120 Q100 116 118 120 Q116 142 100 143 Q84 142 82 120Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M84 121 Q100 118 116 121 L115 126 Q100 123 85 126Z" fill="#fff"/><path d="M92 137 Q100 132 108 137" stroke="#e85a6e" stroke-width="3" fill="none"/>`;
      return s+`<ellipse cx="68" cy="112" rx="8" ry="5" fill="#ff7c7c" opacity=".3"/><ellipse cx="132" cy="112" rx="8" ry="5" fill="#ff7c7c" opacity=".3"/>`;
    });
    b+=x.arm('L',armL)+x.arm('R',armR);
    b+=x.when([1],`${sparks(...pt(this,'R',1,-16,86),28,BL,8)}`);
    b+=x.when([2],`<g class="pop">${swoosh(140,148,92,24,-74,14,'#bfeeff')}</g>`);
    const [ix,iy]=pt(this,'R',2,-16,88);
    const hawk=`<path d="M0 -6 Q-14 -22 -44 -18 Q-30 -8 -34 2 Q-18 -4 -9 4 L-5 16 L0 11 L5 16 L9 4 Q18 -4 34 2 Q30 -8 44 -18 Q14 -22 0 -6Z" fill="${BL}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="0" cy="-8" r="6" fill="${BL}" stroke="${O}" stroke-width="3"/><path d="M-2 -5 L0 1 L2 -5Z" fill="#f6c64a" stroke="${O}" stroke-width="1.5"/><path d="M-30 -12 Q-16 -14 -6 -4 M30 -12 Q16 -14 6 -4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const fx=x.when([2],`<g class="ring"><circle cx="${f(ix)}" cy="${f(iy)}" r="44" fill="${BL}" opacity=".35"/></g><g class="pop">${burst(f(ix),f(iy),28,BL)}</g><g class="ring"><ellipse cx="${f(ix)}" cy="${f(iy+8)}" rx="50" ry="11" fill="none" stroke="${BL}" stroke-width="5"/></g>`
      +`<g class="pop">${glow(10,30,30,BL)}<g transform="translate(10 32) scale(1.15)">${hawk}</g>${sparks(10,30,44,'#bfeeff',10)}</g>`);
    return shadow(72)+fx+x.body(b);
  }
},
{
  id:'pocahontas',name:'Pocahontas & Meeko',role:'Soutien',rarity:'Rare',rar:'var(--rare)',tint:'#fbe4c6',tint2:'#e8a565',stats:[2,3,4],
  atk:'Tourbillon de feuilles.',skill:'Couleurs du vent : +vitesse d’attaque aux voisins ; Meeko vole un bonus.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12,sk:[0,0,0,1,1]},{L:100,R:-100,body:[0,-6,0,1,1.02],sk:[0,6,0,1.12,.84]},{L:52,R:-92,body:[5,-3,4,1,1],sk:[0,-34,-12,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const H='#352c40',HD='#120d18',DR='#d9a566',DRD='#b07a42',TQ='#33bfb3',LC=['#e8413b','#f28a2e','#f6c64a'];
    const arm=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SKT,15)+`<path d="M${sx-8} ${sy+8} H${sx+8}" stroke="${TQ}" stroke-width="3.5"/>`+hand(sx,sy+38,SKT);
    const strand=(d: any)=>shaded(a=>`<path d="${d}" ${a}/>`,H,HD,-3,-3);
    let b=`<g class="flut" style="transform-origin:140px 70px">`
      +shaded(a=>`<path d="M136 40 Q170 30 186 46 Q198 60 184 70 Q200 80 190 96 Q186 106 192 118 Q178 122 170 112 Q176 98 166 88 Q176 74 160 64 Q150 58 140 62Z" ${a}/>`,H,HD,-4,-4)
      +shaded(a=>`<path d="M150 74 Q176 86 178 108 Q180 126 194 136 Q176 140 166 124 Q160 110 152 100Z" ${a}/>`,H,HD,-3,-3)
      +`<path d="M150 46 Q172 42 182 52 M162 80 Q174 92 172 106 M162 98 Q170 114 182 128" stroke="#5a4c6a" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
    b+=shaded(a=>`<path d="M42 92 Q36 24 100 22 Q160 24 162 84 Q162 140 152 186 L48 186 Q38 140 42 92Z" ${a}/>`,H,HD,-4,-4);
    b+=torso(SKT,SKTD);
    const dress=(a: string)=>`<path d="M57 203 C55 178 60 160 72 152 L126 137 C140 146 145 172 143 203Z" ${a}/>`;
    b+=shaded(dress,DR,DRD,-6,-3);
    b+=clip(dress,`<path d="M54 188 l8 -7 l8 7 l8 -7 l8 7 l8 -7 l8 7 l8 -7 l8 7 l8 -7 l8 7 l8 -7 l8 7" stroke="${TQ}" stroke-width="4" fill="none"/><path d="M54 195 H146" stroke="#c0392b" stroke-width="3"/>`);
    b+=`<path d="M128 140 l-2 9 M133 143 l-1 9 M138 147 l0 9 M123 139 l-3 9" stroke="${DRD}" stroke-width="2.6" stroke-linecap="round"/>`;
    b+=`<path d="M84 139 Q100 149 116 139" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M84 139 Q100 149 116 139" stroke="${TQ}" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="150" rx="5" ry="6.5" fill="${TQ}" stroke="${O}" stroke-width="2.6"/>`;
    b+=head(SKT,SKTD);
    b+=x.byPose(p=>face(p,{eye:'#3b2418'})+lashes);
    b+=shaded(a=>`<path d="M44 102 Q36 26 100 24 Q164 26 156 102 Q152 66 132 52 Q114 44 100 52 Q86 44 68 52 Q48 66 44 102Z" ${a}/>`,H,HD,-3,-3)+gloss(80,34,12,4,-10,.3);
    b+=shaded(a=>`<path d="M44 96 Q38 142 52 186 L66 186 Q56 142 58 104Z" ${a}/>`,H,HD,-2,-2);
    b+=x.arm('L',arm)+x.arm('R',arm);
    let lv='';for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?82:96;lv+=leaf(100+Math.cos(a)*r,112+Math.sin(a)*r,1.15,a*180/Math.PI+90,LC[i%3]!)}
    const swirl=`<path d="M30 112 A70 70 0 0 1 150 62 M170 112 A70 70 0 0 1 50 162" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
    let g0='';const vx=(side: string)=>{const [vx0,vy0]=pt(this,side,1,0,44);let v=`<circle cx="${f(vx0)}" cy="${f(vy0)}" r="24" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="20 14" opacity=".9"/>`;for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;v+=leaf(vx0+Math.cos(a)*24,vy0+Math.sin(a)*24,.9,a*180/Math.PI+90,LC[i%3]!)}return `<g class="spinF">${v}</g>`};
    const gb=x.when([1],`<g class="spinF">${swirl}${lv}</g>`);
    g0=x.when([1],vx('L')+vx('R'));
    let g=g0;
    const [hx,hy]=pt(this,'R',2,0,42);
    let st=`<path d="M${f(hx)} ${f(hy)} C${f(hx+16)} ${f(hy-26)} ${f(hx+28)} ${f(hy+26)} ${f(hx+44)} ${f(hy)} S${f(hx+60)} ${f(hy-24)} 238 ${f(hy)}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>`;
    ([[14,-12,0],[26,10,1],[38,-8,2],[50,12,0],[60,-14,1]] as const).forEach(([dx,dy,k],i)=>{st+=leaf(hx+dx,hy+dy,1.1,i*70,LC[k]!)});
    g+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${st}</g><g class="pop">${leaf(218,hy-26,1.2,30,LC[0]!)}${leaf(232,hy+18,1.2,-40,LC[2]!)}${leaf(206,hy+26,1.1,80,LC[1]!)}${leaf(214,hy-2,1.3,-10,LC[1]!)}${sparks(220,hy,30,'#fff3b0',8)}</g>`);
    // Meeko
    const G='#b3afc0',GD='#8a86a0',MK='#4d4860';
    let m=`<path d="M44 198 Q60 188 58 166 Q56 150 64 140" stroke="${O}" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M44 198 Q60 188 58 166 Q56 150 64 140" stroke="${G}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M44 198 Q60 188 58 166 Q56 150 64 140" stroke="${MK}" stroke-width="10" fill="none" stroke-dasharray="5 7" stroke-dashoffset="-3"/>`;
    m+=shaded(a=>`<ellipse cx="34" cy="195" rx="17" ry="11" ${a}/>`,G,GD,-3,-3);
    m+=`<g fill="${G}" stroke="${O}" stroke-width="3"><circle cx="15" cy="159" r="7.5"/><circle cx="45" cy="159" r="7.5"/></g><circle cx="15" cy="159" r="3.5" fill="#f3c9d2"/><circle cx="45" cy="159" r="3.5" fill="#f3c9d2"/>`;
    m+=shaded(a=>`<circle cx="30" cy="175" r="18" ${a}/>`,G,GD,-3,-3)+gloss(22,164,4,2.4,-30,.6);
    m+=`<path d="M13 173 Q20 166 30 170 Q40 166 47 173 Q43 182 36 180 Q30 178 24 180 Q17 182 13 173Z" fill="${MK}"/>`;
    m+=`<ellipse cx="30" cy="185" rx="9" ry="6.5" fill="#f6f4fa" stroke="${O}" stroke-width="2.2"/><ellipse cx="30" cy="181.5" rx="3.6" ry="2.6" fill="${O}"/>`;
    m+=x.byPose(q=>{
      let s=mface(30,174.5,1.05,q,{ring:true,sp:7.5,happy:true});
      if(q==2) s+=`<path d="M26 186 Q30 193 34 186Z" fill="#7a1f2b" stroke="${O}" stroke-width="1.8"/><polygon points="${star(30,146,11,5,5,-Math.PI/2)}" fill="#f6c64a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`+hand(22,154,G,4.5)+hand(38,154,G,4.5);
      else s+=`<path d="M27 188 Q30 190 33 188" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    return shadow()+`<ellipse cx="34" cy="207" rx="22" ry="6" fill="${O}" opacity=".16"/>`+gb+x.body(b)+x.kick(m,34,206)+g;
  }
},
{
  id:'mulan',name:'Mulan & Mushu',role:'Dégâts / brûlure',rarity:'Légendaire',rar:'var(--leg)',tint:'#ffdcd2',tint2:'#ef9682',stats:[4,3,2],
  atk:'Coup d’épée.',skill:'Souffle de Mushu : brûlure ; Avalanche une fois par vague.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-140,sk:[0,0,0,1,1]},{L:30,R:-168,body:[-4,-4,-5,1,1.02],sk:[2,-2,10,1.08,1.08]},{L:20,R:-68,body:[7,3,7,1,1],sk:[-2,0,-6,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const H='#352c40',HD='#120d18',AR='#cf3138',ARD='#921c26',DK='#3d3852',DKD='#25213a',GD='#eab544',ST='#eef3f9',STD='#a9b5c6',MR='#e43a2e',MRD='#a8221d',MY='#ffd34d';
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,DK,15)+`<rect x="${sx-9}" y="${sy+22}" width="18" height="9" rx="3" fill="${AR}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+38,SK);
    const armR=(sx: number, sy: number)=>{
      const bl=(a: string)=>`<path d="M${sx-5} ${sy+48} L${sx-5} ${sy+94} L${sx} ${sy+106} L${sx+5} ${sy+94} L${sx+5} ${sy+48}Z" ${a}/>`;
      return limb(sx,sy,sx,sy+38,DK,15)+`<rect x="${sx-9}" y="${sy+22}" width="18" height="9" rx="3" fill="${AR}" stroke="${O}" stroke-width="3"/>`
        +`<rect x="${sx-4}" y="${sy+28}" width="8" height="18" rx="3" fill="${AR}" stroke="${O}" stroke-width="3"/>`
        +shaded(bl,ST,STD,-3,0)+`<path d="M${sx} ${sy+52} V${sy+98}" stroke="${STD}" stroke-width="1.8"/>`
        +`<rect x="${sx-13}" y="${sy+43}" width="26" height="7" rx="3.5" fill="${GD}" stroke="${O}" stroke-width="3"/>`
        +x.when([1,2],`<g class="fx"><path d="M${sx} ${sy+56} V${sy+100}" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`)
        +hand(sx,sy+38,SK);
    };
    let b=shaded(a=>`<path d="M52 110 Q50 150 62 160 L138 160 Q150 150 148 110Z" ${a}/>`,H,HD,-3,-3);
    b+=torso(DK,DKD);
    const plate=(a: string)=>`<path d="M74 142 Q100 134 126 142 L123 184 Q100 190 77 184Z" ${a}/>`;
    b+=shaded(plate,AR,ARD,-4,-3);
    b+=clip(plate,`<g stroke="${ARD}" stroke-width="2" fill="none">${[152,162,172,182].map(y=>`<path d="M70 ${y} q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0"/>`).join('')}</g>`);
    b+=`<path d="M74 142 Q100 134 126 142" stroke="${GD}" stroke-width="3" fill="none"/>`;
    b+=`<path d="M58 190 Q100 198 142 190 L142 200 Q100 208 58 200Z" fill="${DKD}" stroke="${O}" stroke-width="3.5"/><circle cx="100" cy="198" r="6.5" fill="${GD}" stroke="${O}" stroke-width="3"/>`;
    b+=`<path d="M86 136 L100 150 L114 136" stroke="${O}" stroke-width="7" fill="none" stroke-linejoin="round"/><path d="M86 136 L100 150 L114 136" stroke="#f3e9d2" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
    b+=head(SK,SKD);
    b+=x.byPose(p=>face(p,{eye:'#2a1d1a'})+lashes);
    b+=shaded(a=>`<circle cx="100" cy="24" r="17" ${a}/>`,H,HD,-3,-3);
    b+=shaded(a=>`<path d="M44 94 Q38 30 100 30 Q162 30 156 94 Q152 66 134 58 Q116 52 96 60 Q76 66 66 58 Q50 68 44 94Z" ${a}/>`,H,HD,-3,-3);
    b+=`<rect x="86" y="34" width="28" height="9" rx="4" fill="${AR}" stroke="${O}" stroke-width="3"/>`+gloss(84,44,12,4,-10,.3)+gloss(94,18,5,3,-30,.4);
    b+=`<path d="M58 70 Q50 92 54 108" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M58 70 Q50 92 54 108" stroke="${H}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b+=x.arm('L',armL)+x.arm('R',armR);
    const pd=(cx: number)=>shaded(a=>`<path d="M${cx-17} 154 Q${cx-18} 134 ${cx} 133 Q${cx+18} 134 ${cx+17} 154 Q${cx} 160 ${cx-17} 154Z" ${a}/>`,AR,ARD,-4,-4)+`<path d="M${cx-15} 150 Q${cx} 155 ${cx+15} 150" stroke="${GD}" stroke-width="3" fill="none"/>`;
    b+=pd(64)+pd(136);
    b+=x.when([2],`<g class="pop">${swoosh(132,150,104,26,-78,26,'#fff')}</g><g class="pop">${sparks(...pt(this,'R',2,0,104),18,'#fff',6)}</g>`);
    // Mushu sur l'épaule gauche
    let m=`<path d="M60 150 q12 4 12 -8 q0 -8 -7 -6" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 150 q12 4 12 -8 q0 -8 -7 -6" stroke="${MR}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    m+=shaded(a=>`<ellipse cx="52" cy="140" rx="11" ry="12" ${a}/>`,MR,MRD,-3,-2)+`<ellipse cx="50" cy="143" rx="5.5" ry="8" fill="${MY}" stroke="${O}" stroke-width="2"/><path d="M46 140 H54 M46 145 H54" stroke="#e0a21e" stroke-width="1.6"/>`;
    m+=`<g fill="${MY}" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"><path d="M38 110 Q31 100 35 92 Q38 102 44 106Z"/><path d="M50 108 Q54 97 62 94 Q58 104 55 110Z"/></g><path d="M56 112 l6 -2 l-2 6 l6 0 l-4 5" fill="${MRD}" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>`;
    m+=x.byPose(q=>{
      const sn=q==1?[30,126,11.5,9]:[30,127,10,7.5];
      let s=shaded(a=>`<circle cx="44" cy="120" r="14" ${a}/>`,MR,MRD,-3,-3)+gloss(39,112,3.5,2,-30,.6);
      s+=shaded(a=>`<ellipse cx="${sn[0]!}" cy="${sn[1]!}" rx="${sn[2]!}" ry="${sn[3]!}" ${a}/>`,MR,MRD,-2,-2)+`<circle cx="23" cy="${sn[1]!-3}" r="1.6" fill="${O}"/><circle cx="28" cy="${sn[1]!-4}" r="1.6" fill="${O}"/>`;
      s+=mface(45,117,.85,q,{ring:true,sp:5.4});
      if(q==2) s+=`<path d="M20 131 Q26 128 34 133 Q30 140 22 138Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>`;
      else if(q==1) s+=`<circle cx="16" cy="118" r="4" fill="#d8d6e2" stroke="${O}" stroke-width="2"/><circle cx="9" cy="112" r="3" fill="#d8d6e2" stroke="${O}" stroke-width="2"/>`;
      else s+=`<path d="M22 133 Q28 136 34 132" stroke="${O}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    m+=hand(40,146,MR,4)+hand(58,148,MR,4);
    m+=x.when([2],`<g class="grow" style="transform-origin:22px 134px">${fire(22,134,-34,108)}</g><g class="pop">${burst(-30,106,18,'#ffd23f','#fff3b0')}</g>`);
    b+=x.kick(m,52,152);
    return shadow()+x.body(b);
  }
},
{
  id:'merida',name:'Rebelle',role:'Précision',rarity:'Rare',rar:'var(--rare)',tint:'#d9efcd',tint2:'#86bd71',stats:[4,3,5],
  atk:'Flèche longue portée.',skill:'Tir parfait : 100 % de critiques sur la cible la plus éloignée.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-66},{L:-78,R:-92,body:[-4,0,-3,1,1],head:[0,3,.98]},{L:38,R:-92,body:[-7,-2,-5,1,1],head:[0,-7,1.05]}],
  draw(this: CharDef, x: Ctx): string {
    const H='#e4542a',HD='#b2341a',HL='#ff9a5a',DR='#2f5a3c',DRD='#1d3d27',BW='#8a5a32',BWD='#5e3b1e';
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,DR,15)+`<rect x="${sx-9}" y="${sy+26}" width="18" height="7" rx="3" fill="#c9a24a" stroke="${O}" stroke-width="2.5"/>`+hand(sx,sy+38,SK);
    const bowD=(sx: number, sy: number)=>`M${sx-32} ${sy+14} Q${sx-27} ${sy+22} ${sx-20} ${sy+28} Q${sx} ${sy+50} ${sx+20} ${sy+28} Q${sx+27} ${sy+22} ${sx+32} ${sy+14}`;
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,DR,15)+`<rect x="${sx-9}" y="${sy+26}" width="18" height="7" rx="3" fill="#c9a24a" stroke="${O}" stroke-width="2.5"/>`
      +x.when([0,2],`<path d="M${sx-32} ${sy+14} L${sx+32} ${sy+14}" stroke="${O}" stroke-width="4"/><path d="M${sx-32} ${sy+14} L${sx+32} ${sy+14}" stroke="#f3ead2" stroke-width="1.6"/>`)
      +`<path d="${bowD(sx,sy)}" stroke="${O}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${bowD(sx,sy)}" stroke="${BW}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${sx-26} ${sy+20} Q${sx-14} ${sy+36} ${sx-6} ${sy+38}" stroke="#c48a52" stroke-width="2" fill="none" stroke-linecap="round"/>`
      +hand(sx,sy+38,SK);
    let b=x.head(shaded(a=>`<path d="${curls(100,92,80,76,15,1)}" ${a}/>`,H,HD,-5,-5)+`<g stroke="${HL}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M34 96 q-8 -6 -2 -12 q6 -2 6 4"/><path d="M164 100 q8 -6 2 -12 q-6 -2 -6 4"/><path d="M40 130 q-6 -8 2 -12 q6 0 4 6"/><path d="M160 134 q6 -8 -2 -12 q-6 0 -4 6"/><path d="M58 30 q-2 -8 6 -8 q4 2 2 6"/><path d="M146 34 q2 -8 -6 -8 q-4 2 -2 6"/></g>`);
    b+=torso(DR,DRD);
    b+=`<path d="M84 138 Q100 150 116 138" stroke="#cfd9c4" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M84 138 Q100 150 116 138" stroke="${O}" stroke-width="2" fill="none" stroke-dasharray="2 4"/>`;
    b+=`<path d="M134 142 L72 200" stroke="${O}" stroke-width="11" stroke-linecap="round"/><path d="M134 142 L72 200" stroke="${BW}" stroke-width="6" stroke-linecap="round"/><rect x="96" y="166" width="11" height="11" rx="2" transform="rotate(-42 101.5 171.5)" fill="#c9a24a" stroke="${O}" stroke-width="2.6"/>`;
    b+=`<path d="M60 196 Q100 202 140 196" stroke="#c9a24a" stroke-width="4" fill="none"/>`;
    let hd=head(SK,SKD);
    hd+=x.byPose(p=>face(p,{eye:'#2f6fd0'})+lashes+`<g fill="#d9895a"><circle cx="66" cy="106" r="1.6"/><circle cx="72" cy="110" r="1.6"/><circle cx="64" cy="112" r="1.4"/><circle cx="134" cy="106" r="1.6"/><circle cx="128" cy="110" r="1.6"/><circle cx="136" cy="112" r="1.4"/></g>`);
    let bang=`M42 96 Q34 24 100 20 Q166 24 158 96`;const bulgeR=[0,16,14,15,17,15,14,16,16] as const;
    const bx=[158,148,136,120,104,86,70,56,42] as const,by=[96,70,76,60,70,58,76,68,96] as const;
    for(let i=1;i<bx.length;i++){bang+=` A${bulgeR[i]!} ${bulgeR[i]!} 0 0 1 ${bx[i]!} ${by[i]!}`}
    hd+=shaded(a=>`<path d="${bang}Z" ${a}/>`,H,HD,-3,-4)+gloss(82,32,13,5,-12,.35)+`<g stroke="${HL}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M70 44 q6 -8 14 -2"/><path d="M118 40 q8 -6 14 2"/><path d="M96 34 q4 -6 10 -2"/></g>`;
    b+=x.head(hd);
    b+=x.arm('L',armL)+x.arm('R',armR);
    // corde tendue + flèche encochée (préparation)
    const t1=pt(this,'R',1,-32,14),t2=pt(this,'R',1,32,14),lh=pt(this,'L',1,0,38);
    const arrow=(x0: number, y0: number, x1: number, y1: number)=>{const L=Math.hypot(x1-x0,y1-y0),ux=(x1-x0)/L,uy=(y1-y0)/L,nx=-uy,ny=ux;
      return `<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="#c48a52" stroke-width="3" stroke-linecap="round"/>`
       +`<polygon points="${f(x1+ux*12)},${f(y1+uy*12)} ${f(x1+nx*6)},${f(y1+ny*6)} ${f(x1-nx*6)},${f(y1-ny*6)}" fill="#dfe6ef" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`
       +`<polygon points="${f(x0)},${f(y0)} ${f(x0+ux*12+nx*7)},${f(y0+uy*12+ny*7)} ${f(x0+ux*16)},${f(y0+uy*16)} ${f(x0+ux*12-nx*7)},${f(y0+uy*12-ny*7)}" fill="#e8413b" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>`};
    const [bhx,bhy]=pt(this,'R',1,0,40);
    b+=x.when([1],`<path d="M${f(t1[0]!)} ${f(t1[1]!)} L${f(lh[0]!)} ${f(lh[1]!)} L${f(t2[0]!)} ${f(t2[1]!)}" stroke="${O}" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M${f(t1[0]!)} ${f(t1[1]!)} L${f(lh[0]!)} ${f(lh[1]!)} L${f(t2[0]!)} ${f(t2[1]!)}" stroke="#f3ead2" stroke-width="1.6" fill="none"/>`+arrow(lh[0]!-2,lh[1]!,bhx+22,bhy)+hand(lh[0]!,lh[1]!,SK));
    const [rx,ry]=pt(this,'R',2,0,40);
    const tx=220,ty=f(ry);
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(rx+20)}px ${ty}px">${speed(rx+22,+ty,1,22,3)}</g>`
      +`<g class="pop"><circle cx="${tx}" cy="${ty}" r="18" fill="#fff" stroke="${O}" stroke-width="4"/><circle cx="${tx}" cy="${ty}" r="12.5" fill="#e8413b"/><circle cx="${tx}" cy="${ty}" r="7.5" fill="#fff"/><circle cx="${tx}" cy="${ty}" r="3.5" fill="#e8413b"/></g>`
      +`<g class="fly" style="--fx:-40px;--fy:0px">${arrow(tx-38,+ty,tx-8,+ty)}</g>`
      +`<g class="pop">${sparks(tx,+ty,30,'#f6c64a',10)}</g><g class="ring"><circle cx="${tx}" cy="${ty}" r="24" fill="none" stroke="#f6c64a" stroke-width="4"/></g>`
      +`<g class="pop"><path d="M${f(rx-6)} ${f(ry-30)} q-6 6 0 12 M${f(rx-6)} ${f(ry+30)} q-6 -6 0 -12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`);
    return shadow()+x.body(b);
  }
},
{
  id:'ariel',name:'Ariel & Sébastien',role:'Contrôle',rarity:'Épique',rar:'var(--epi)',tint:'#cfeefc',tint2:'#74bfe6',stats:[2,3,4],
  atk:'Bulles.',skill:'Chant de sirène : charme et arrête les ennemis ; Sébastien pince.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:12,R:-12,sk:[0,0,0,1,1]},{L:22,R:-128,body:[0,-4,0,1,1.02],head:[0,-3,1.02],sk:[0,-8,-8,1,1]},{L:24,R:-100,body:[5,0,4,1,1],sk:[0,-14,8,1.06,1.06]}],
  draw(this: CharDef, x: Ctx): string {
    const H='#e2343f',HD='#a51e31',HL='#ff7272',SH='#9b5fe0',SHD='#6c3db0',TL='#38c08a',TLD='#22906a',CR='#e5432f',CRD='#a92a1f';
    const arm=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,SK,15)+hand(sx,sy+38,SK);
    let b=shaded(a=>`<path d="M36 96 Q28 22 100 18 Q172 22 164 96 Q176 150 166 200 L140 200 Q146 160 140 130 L60 130 Q54 160 60 200 L34 200 Q24 150 36 96Z" ${a}/>`,H,HD,-4,-4);
    b+=torso(SK,SKD);
    const tail=(a: string)=>`<path d="M57 184 Q100 176 143 184 L143 203 L57 203Z" ${a}/>`;
    b+=shaded(tail,TL,TLD,-3,-3)+clip(tail,`<g stroke="${TLD}" stroke-width="2.2" fill="none">${[0,1,2,3,4,5,6,7].map(i=>`<path d="M${58+i*12} 192 q6 7 12 0"/><path d="M${64+i*12} 201 q6 7 12 0"/>`).join('')}</g>`);
    const shell=(cx: number)=>shaded(a=>`<path d="M${cx-16} 160 Q${cx} 142 ${cx+16} 160 Q${cx+13} 173 ${cx} 175 Q${cx-13} 173 ${cx-16} 160Z" ${a}/>`,SH,SHD,-3,-3)+`<path d="M${cx} 174 L${cx} 150 M${cx} 174 L${cx-8} 152 M${cx} 174 L${cx+8} 152 M${cx} 174 L${cx-13} 158 M${cx} 174 L${cx+13} 158" stroke="${SHD}" stroke-width="2"/>`;
    b+=`<path d="M100 160 V160 M84 147 L80 137 M116 147 L120 137" stroke="${SHD}" stroke-width="3" stroke-linecap="round"/>`+shell(84)+shell(116);
    b+=head(SK,SKD);
    b+=x.byPose(p=>{
      let s=face(p==1?0:p,{eye:'#2f86d6',noMouth:p==1})+lashes;
      if(p==1) s+=`<ellipse cx="100" cy="118" rx="6.5" ry="8" fill="#7a1f2b" stroke="${O}" stroke-width="3.2"/><path d="M96 122 Q100 119 104 122" stroke="#e85a6e" stroke-width="2.4" fill="none"/>`;
      return s;
    });
    b+=shaded(a=>`<path d="M42 102 Q34 28 104 22 Q166 26 160 102 Q156 70 140 58 Q144 48 130 40 Q116 58 92 54 Q66 54 52 72 Q44 84 42 102Z" ${a}/>`,H,HD,-3,-3);
    b+=shaded(a=>`<path d="M62 46 Q68 10 108 10 Q138 12 146 32 Q126 22 108 30 Q88 28 62 46Z" ${a}/>`,H,HD,-2,-2)+gloss(86,24,11,4,-25,.4);
    b+=`<path d="M76 26 Q92 16 118 17" stroke="${HL}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const lock=shaded(a=>`<path d="M42 98 Q34 150 48 196 L64 196 Q56 150 60 108Z" ${a}/>`,H,HD,-2,-2);
    b+=lock+mirror(lock);
    b+=x.arm('L',arm)+x.arm('R',arm);
    // chant : notes et cœurs (préparation)
    const fl=(s: any, d: any)=>`<g class="float" style="animation-delay:${d}s">${s}</g>`;
    let g=x.when([1],fl(note(150,48,'#ffd23f'),0)+fl(heart(178,78,1.1),-.12)+fl(note(30,56,'#ff8fc4'),-.06)+fl(heart(20,96,.9,'#ff8fc4'),-.18)+fl(note(170,24,'#9ee6ff'),-.24));
    const [hx,hy]=pt(this,'R',2,0,42);
    let bs='';([[10,-6,6],[22,8,8],[34,-9,7],[44,6,9]] as const).forEach(([dx,dy,r])=>{bs+=bubble(hx+dx,hy+dy,r)});
    g+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${bs}</g><g class="pop">${bubble(220,hy-6,15)}${bubble(206,hy-32,8)}${bubble(228,hy+22,7)}${sparks(220,hy-6,28,'#bff4ff',6)}</g><g class="ring"><circle cx="220" cy="${f(hy-6)}" r="26" fill="none" stroke="#bff4ff" stroke-width="4"/></g>`
      +`<g class="pop">${heart(200,hy-62,.8)}${heart(224,hy-44,.6,'#ff8fc4')}</g>`);
    // Sébastien
    const claw=(cx: number, cy: number, r: number, op: any)=>`<g transform="translate(${cx} ${cy}) rotate(${r})"><path d="M0 4 C-10 2 -12 -12 -4 -18 C-3 -10 1 -6 0 4Z" transform="rotate(${-op})" fill="${CR}" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/><path d="M0 4 C10 2 12 -12 4 -18 C3 -10 -1 -6 0 4Z" transform="rotate(${op})" fill="${CR}" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/><circle cx="0" cy="5" r="6" fill="${CR}" stroke="${O}" stroke-width="2.8"/></g>`;
    let sb=`<path d="M12 198 l-6 6 M16 201 l-3 6 M40 198 l6 6 M36 201 l3 6" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M12 198 l-6 6 M16 201 l-3 6 M40 198 l6 6 M36 201 l3 6" stroke="${CR}" stroke-width="2.2" stroke-linecap="round"/>`;
    sb+=`<path d="M20 186 L17 168 M32 186 L35 168" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M20 186 L17 168 M32 186 L35 168" stroke="${CR}" stroke-width="2.6" stroke-linecap="round"/>`;
    sb+=shaded(a=>`<ellipse cx="26" cy="192" rx="17" ry="12" ${a}/>`,CR,CRD,-3,-3)+gloss(19,186,4,2.4,-30,.6);
    sb+=x.byPose(q=>{
      let s=`<circle cx="16" cy="165" r="6.5" fill="#fff" stroke="${O}" stroke-width="2.6"/><circle cx="36" cy="165" r="6.5" fill="#fff" stroke="${O}" stroke-width="2.6"/>`;
      s+=q==1?`<path d="M12 165 Q16 162 20 165 M32 165 Q36 162 40 165" stroke="${O}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`:`<circle cx="${q==2?18:17}" cy="166" r="3" fill="${O}"/><circle cx="${q==2?34:37}" cy="166" r="3" fill="${O}"/>`;
      s+=q==2?`<path d="M20 194 Q26 202 32 194Z" fill="#7a1f2b" stroke="${O}" stroke-width="2"/>`:`<path d="M21 195 Q26 199 31 195" stroke="${O}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      const P=[[[4,188,-20,12],[48,188,20,12]] as const,[[2,170,-30,4],[50,170,30,4]],[[0,166,-40,26],[52,166,40,26]]][q]!;
      s+=P.map(([cx,cy,r,op])=>`<path d="M${cx>26?40:12} 190 L${cx} ${cy+6}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${cx>26?40:12} 190 L${cx} ${cy+6}" stroke="${CR}" stroke-width="2.6" stroke-linecap="round"/>`+claw(cx,cy,r,op)).join('');
      if(q==2) s+=`<g class="pop">${sparks(-2,150,12,'#fff',5)}${sparks(54,150,12,'#fff',5)}</g>`;
      return s;
    });
    return shadow()+`<ellipse cx="26" cy="207" rx="22" ry="6" fill="${O}" opacity=".16"/>`+x.body(b)+x.kick(sb,26,206)+g;
  }
},
{
  id:'foxhound',name:'Rox & Rouky',role:'Duo',rarity:'Rare',rar:'var(--rare)',tint:'#f6e9c9',tint2:'#d9b673',stats:[3,4,1],shake:true,
  atk:'Morsure.',skill:'Meilleurs amis : deux attaques par tour, plus fortes si l’autre a touché.',
  sh:{L:[68,150],R:[132,150]},
  poses:[{L:0,R:0,sk:[0,0,0,1,1]},{L:0,R:0,body:[0,10,0,1.06,.86],sk:[0,10,0,1.06,.86]},{L:0,R:0,body:[-8,-18,-6,1,1.06],sk:[8,-18,6,1,1.06]}],
  draw(this: CharDef, x: Ctx): string {
    const F='#ee7b2c',FD='#ba521a',W='#fff6ea',BE='#f6e7cc',BED='#dcc29a',BR='#9a5a2e',BRD='#6e3b1b',NS='#2a2030';
    const mouth=(cx: number, y: number, p: number, tongue: any)=>p==2
      ?`<path d="M${cx-11} ${y} Q${cx} ${y-3} ${cx+11} ${y} Q${cx+9} ${y+15} ${cx} ${y+16} Q${cx-9} ${y+15} ${cx-11} ${y}Z" fill="#7a1f2b" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${cx-9} ${y+1} l3 6 l3 -5 M${cx+9} ${y+1} l-3 6 l-3 -5" fill="#fff" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>`
      :p==1?`<path d="M${cx-7} ${y+3} Q${cx} ${y+1} ${cx+7} ${y+3}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      :`<path d="M${cx-9} ${y} Q${cx-4.5} ${y+6} ${cx} ${y} Q${cx+4.5} ${y+6} ${cx+9} ${y}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`+(tongue?`<path d="M${cx+1} ${y+3} Q${cx+2} ${y+13} ${cx+7} ${y+12} Q${cx+10} ${y+8} ${cx+7} ${y+2}Z" fill="#ff7c8f" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>`:'');
    const eyes=(cx: number, p: number)=>([[cx-14,1],[cx+14,-1]] as const).map(([ex,d])=>{
      let s=`<ellipse cx="${ex}" cy="104" rx="6.5" ry="${p==1?7:8.5}" fill="${O}"/><circle cx="${ex+2}" cy="100" r="2.8" fill="#fff"/><circle cx="${ex-2}" cy="108" r="1.3" fill="#fff" opacity=".85"/>`;
      s+=p?`<path d="M${ex-9*d} 88 L${ex+8*d} 94" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>`:`<path d="M${ex-7} 91 Q${ex} 86 ${ex+7} 91" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      return s}).join('');
    // Rox
    const tail=(a: string)=>`<path d="M42 196 Q2 198 -4 160 Q-8 128 14 112 Q12 146 30 160 Q42 172 50 186Z" ${a}/>`;
    let r=shaded(tail,F,FD,-4,-3)+clip(tail,`<circle cx="6" cy="118" r="16" fill="${W}"/>`)+tail(`fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"`);
    r+=shaded(a=>`<ellipse cx="60" cy="182" rx="31" ry="24" ${a}/>`,F,FD,-5,-3)+`<ellipse cx="60" cy="188" rx="14" ry="15" fill="${W}" stroke="${O}" stroke-width="2.6"/>`;
    r+=`<g fill="#3a2a2e" stroke="${O}" stroke-width="3"><ellipse cx="45" cy="202" rx="9" ry="6"/><ellipse cx="75" cy="202" rx="9" ry="6"/></g>`;
    const ear=`<path d="M30 84 L20 44 L54 70Z" fill="${F}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/><path d="M33 76 L25 52 L36 60Z" fill="#3a2a2e"/><path d="M34 78 L30 64 L46 72Z" fill="#ffe2c4"/>`;
    let rh=ear+`<g transform="translate(120 0) scale(-1 1)">${ear}</g>`;
    rh+=shaded(a=>`<circle cx="60" cy="108" r="38" ${a}/>`,F,FD,-6,-5)+gloss(40,82,10,5,-35,.5);
    rh+=`<path d="M23 112 Q38 104 50 116 Q60 108 70 116 Q82 104 97 112 Q94 142 60 146 Q26 142 23 112Z" fill="${W}" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>`;
    rh+=x.byPose(p=>eyes(60,p)+`<ellipse cx="60" cy="119" rx="6.5" ry="4.8" fill="${NS}"/><circle cx="58" cy="117.5" r="1.6" fill="#fff"/>`+mouth(60,126,p,false)+`<ellipse cx="34" cy="120" rx="6" ry="4" fill="#ff7c7c" opacity=".35"/><ellipse cx="86" cy="120" rx="6" ry="4" fill="#ff7c7c" opacity=".35"/>`);
    r+=`<g transform="translate(0 12)">${rh}</g>`;
    // Rouky
    let k=shaded(a=>`<ellipse cx="142" cy="182" rx="31" ry="24" ${a}/>`,BE,BED,-5,-3)+clip(a=>`<ellipse cx="142" cy="182" rx="31" ry="24" ${a}/>`,`<ellipse cx="170" cy="172" rx="18" ry="14" fill="${BR}"/>`)+`<ellipse cx="142" cy="182" rx="31" ry="24" fill="none" stroke="${O}" stroke-width="5"/>`;
    k+=`<path d="M170 184 Q186 176 184 160" stroke="${O}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M170 184 Q186 176 184 160" stroke="${BE}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    k+=`<g fill="#fff" stroke="${O}" stroke-width="3"><ellipse cx="128" cy="202" rx="9" ry="6"/><ellipse cx="156" cy="202" rx="9" ry="6"/></g>`;
    const hs=(a: string)=>`<circle cx="142" cy="108" r="38" ${a}/>`;
    let kh=shaded(hs,BE,BED,-6,-5)+clip(hs,`<path d="M100 60 H184 V92 Q162 84 150 96 Q142 106 134 96 Q122 84 100 92Z" fill="${BR}"/><path d="M138 70 Q142 90 146 70Z" fill="${BE}"/>`)+hs(`fill="none" stroke="${O}" stroke-width="5"`)+gloss(124,80,10,5,-35,.45);
    kh+=`<ellipse cx="142" cy="126" rx="20" ry="14" fill="#fff" stroke="${O}" stroke-width="2.6"/>`;
    const lear=(a: string)=>`<path d="M112 80 Q96 86 97 120 Q98 148 112 148 Q122 142 119 112 Q118 94 112 80Z" ${a}/>`;
    const earS=shaded(lear,BR,BRD,-3,-3);
    kh+=x.byPose(p=>{
      const sw=[0,-8,16][p]!;
      let s=`<g transform="rotate(${sw} 112 84)">${earS}</g><g transform="translate(284 0) scale(-1 1)"><g transform="rotate(${sw} 112 84)">${earS}</g></g>`;
      s+=eyes(142,p)+`<ellipse cx="142" cy="118" rx="8" ry="6" fill="${NS}"/><circle cx="139.5" cy="116" r="2" fill="#fff"/>`+mouth(142,127,p,true);
      return s;
    });
    k+=`<g transform="translate(0 12)">${kh}</g>`;
    let g=x.when([1],`${sparks(52,52,22,'#f6c64a',6)}${sparks(150,52,22,'#f6c64a',6)}${puff([[14,203,6],[24,200,5],[6,199,4]])}${puff([[188,203,6],[178,200,5],[196,199,4]])}`);
    const gb='';
    g+=x.when([2],`<g class="ring"><ellipse cx="100" cy="206" rx="96" ry="12" fill="none" stroke="#e8c27a" stroke-width="5"/></g>`
      +`<g class="pop">${puff([[30,204,7],[42,200,6],[54,204,5]])}</g><g class="pop">${puff([[148,204,5],[160,200,6],[172,204,7]])}</g>`
      +`<g class="pop">${bite(-6,30,'#ff9a3c')}</g><g class="pop">${bite(200,42,'#f6c64a')}</g>`);
    return gb+`<ellipse cx="60" cy="207" rx="40" ry="8" fill="${O}" opacity=".16"/><ellipse cx="142" cy="207" rx="40" ry="8" fill="${O}" opacity=".16"/>`+x.body(r)+x.kick(k,142,206)+g;
  }
}];
