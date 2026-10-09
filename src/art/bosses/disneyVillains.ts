// Personnages extraits de la planche design/planches/5-boss-sbires.html : code de dessin repris tel quel, typé.
// Ne pas redessiner : corriger ici seulement ce qui casse le rendu statique.
/* eslint-disable */
import { O, f, shaded, clip, gloss, limb, hand, star, glow, burst, beam, bolt, sparks, headS, head, mirror, shadow, face, tip, type CharDef, type Ctx } from '../primitives';
import { held, hoodShade, geyes, evilMouth, spiral, txt, tentacle, ringPts, fluffy, twinkle, rnd, token } from '../kits/villain';

export const BOSSES: CharDef[] = [
{
  id:'jafar',name:'Jafar & Iago',stats:[4,2,4],tint:'#b44a63',tint2:'#4b1631',mt:'#f6dbe0',mt2:'#e2a7b4',glow:'#ffb02e',
  power:'Hypnose : prend le contrôle d’un de tes héros, qui arrête d’attaquer.',minionTxt:'Cobras : rapides, se faufilent.',
  sh:{L:[64,150],R:[136,150]},
  poses:[{L:14,R:-34,st:[0,0,34]},{L:44,R:-150,st:[0,0,150],body:[2,-5,3,1,1.03]},{L:30,R:-118,st:[0,0,128],body:[-5,0,-4,1,1]}],
  bg(): string {let s='';const r=rnd(7);for(let i=0;i<10;i++)s+=twinkle(f(-20+r()*240),f(-26+r()*120),f(3+r()*4),'#ffd27a',.5);return s},
  draw(this: CharDef, x: Ctx): string {
    const BK='#2b2338',BKD='#15111f',R='#c8283a',RD='#8c1726',G='#f6c64a',GD='#cf962a',S='#d9a77a',SD='#a87650',E='#ffb02e',RE='#ff3b4e';
    const P=[136,188] as const;
    const cobraEyes=(cx: number, cy: number, big: any)=>`<g class="fx"><circle cx="${cx-5}" cy="${cy-7}" r="${big?9:5}" fill="${RE}" opacity=".45"/><circle cx="${cx+5}" cy="${cy-7}" r="${big?9:5}" fill="${RE}" opacity=".45"/></g><ellipse cx="${cx-5}" cy="${cy-7}" rx="3" ry="2.2" fill="${RE}" stroke="${O}" stroke-width="1.2"/><ellipse cx="${cx+5}" cy="${cy-7}" rx="3" ry="2.2" fill="${RE}" stroke="${O}" stroke-width="1.2"/><circle cx="${cx-5}" cy="${cy-7}" r="1" fill="#fff"/><circle cx="${cx+5}" cy="${cy-7}" r="1" fill="#fff"/>`;
    const cobra=(cx: number, cy: number)=>shaded(a=>`<path d="M${cx-16} ${cy+26} Q${cx-24} ${cy+2} ${cx-11} ${cy-8} Q${cx} ${cy-14} ${cx+11} ${cy-8} Q${cx+24} ${cy+2} ${cx+16} ${cy+26} Q${cx} ${cy+32} ${cx-16} ${cy+26}Z" ${a}/>`,G,GD,-3,-3)
      +`<path d="M${cx-8} ${cy+8} Q${cx} ${cy+13} ${cx+8} ${cy+8} M${cx-9} ${cy+17} Q${cx} ${cy+23} ${cx+9} ${cy+17}" stroke="${GD}" stroke-width="2.5" fill="none"/><circle cx="${cx}" cy="${cy+12}" r="3.5" fill="${R}" stroke="${O}" stroke-width="2"/>`
      +shaded(a=>`<ellipse cx="${cx}" cy="${cy-6}" rx="12" ry="9.5" ${a}/>`,G,GD,-2,-2)
      +`<path d="M${cx} ${cy+3} v5 l-3 4 M${cx} ${cy+8} l3 4" stroke="${RE}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const staff=`<rect x="${P[0]!-5}" y="72" width="10" height="140" rx="5" fill="${G}" stroke="${O}" stroke-width="4"/><path d="M${P[0]!-5} 96 h10 M${P[0]!-5} 104 h10 M${P[0]!-5} 160 h10" stroke="${GD}" stroke-width="3"/><path d="M${P[0]!-2} 112 V150" stroke="#fff" stroke-width="2" opacity=".5"/>`
      +cobra(P[0]!,58)+x.byPose(p=>cobraEyes(P[0]!,58,p>0))+x.when([1],sparks(P[0]!,52,30,RE,8));
    const armL=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,BK,18)+`<rect x="${sx-11}" y="${sy+26}" width="22" height="8" rx="3" fill="${R}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+38,S);
    const armR=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,BK,18)+`<rect x="${sx-11}" y="${sy+26}" width="22" height="8" rx="3" fill="${R}" stroke="${O}" stroke-width="3"/>`+x.part('st',P[0]!,P[1]!,staff)+hand(sx,sy+38,S);
    let b='';
    const collar=`<path d="M46 152 Q12 100 28 36 Q50 92 76 134Z" fill="${BK}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M42 134 Q26 98 30 56" stroke="${R}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    b+=collar+mirror(collar);
    b+=shaded(a=>`<path d="M32 205 Q36 150 66 134 L134 134 Q164 150 168 205Z" ${a}/>`,BK,BKD,-8,-4);
    b+=shaded(a=>`<path d="M86 136 L114 136 L126 205 L74 205Z" ${a}/>`,R,RD,-4,-3)+`<path d="M86 136 L74 205 M114 136 L126 205" stroke="${G}" stroke-width="3.5"/>`;
    b+=shaded(a=>`<path d="M54 172 Q100 184 146 172 L147 184 Q100 196 53 184Z" ${a}/>`,G,GD,-3,-3);
    b+=`<polygon points="${star(100,184,8,4,4)}" fill="${R}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    b+=head(S,SD)+hoodShade(headS,62,112,.78);
    b+=x.byPose(p=>{
      let s=geyes(E,{sq:p==1?.75:1});
      s+=`<path d="M62 74 Q78 72 94 88 M138 74 Q122 72 106 88" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      s+=evilMouth(p,100,124,11);
      return s;
    });
    b+=`<path d="M98 116 Q86 111 77 117 Q72 122 77 127 M102 116 Q114 111 123 117 Q128 122 123 127" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M99 106 Q96 112 100 113" stroke="${SD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=`<path d="M93 139 Q100 143 107 139 Q105 156 110 168 Q112 174 106 175 Q100 162 93 139Z" fill="${O}"/><path d="M101 146 Q103 160 108 170" stroke="#5a4a6e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M48 78 Q38 30 66 8 Q86 -12 100 -22 Q114 -12 134 8 Q162 30 152 78 Q100 58 48 78Z" ${a}/>`,R,RD,-5,-4);
    b+=`<path d="M70 14 Q90 30 96 58 M130 14 Q110 30 104 58" stroke="${RD}" stroke-width="3" fill="none"/>`+gloss(74,20,10,4,-40,.4);
    b+=shaded(a=>`<path d="M44 82 Q100 58 156 82 L154 66 Q100 44 46 66Z" ${a}/>`,BK,BKD,-3,-3)+`<path d="M47 73 Q100 52 153 73" stroke="${G}" stroke-width="3" fill="none"/>`;
    b+=`<path d="M100 50 Q124 22 120 -28 Q112 10 94 46Z" fill="${BK}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M104 40 Q116 18 117 -14" stroke="${R}" stroke-width="2.5" fill="none"/>`;
    b+=`<ellipse cx="100" cy="58" rx="10" ry="12" fill="${G}" stroke="${O}" stroke-width="4"/><ellipse cx="100" cy="58" rx="5" ry="7" fill="${RE}"/><circle cx="98" cy="54" r="2" fill="#fff"/>`;
    b+=x.arm('L',armL)+x.arm('R',armR);
    /* Iago, perché sur l'épaule */
    b+=x.byPose(p=>{
      const PR='#e0322f',PRD='#a61e27';
      let s=`<path d="M22 134 L12 166 L22 160 L26 170 L32 140Z" fill="#2f5fd0" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M18 152 L24 146" stroke="#f6c64a" stroke-width="3"/>`;
      s+=shaded(a=>`<ellipse cx="30" cy="130" rx="15" ry="19" ${a}/>`,PR,PRD,-3,-3);
      s+=`<path d="M22 124 Q16 140 26 150 Q34 140 32 126Z" fill="${PRD}" stroke="${O}" stroke-width="2.5"/><path d="M24 146 L28 152" stroke="#2f5fd0" stroke-width="4" stroke-linecap="round"/>`;
      s+=`<path d="M26 148 v6 M34 148 v6" stroke="#8a8a9a" stroke-width="4" stroke-linecap="round"/>`;
      s+=shaded(a=>`<circle cx="32" cy="106" r="14" ${a}/>`,PR,PRD,-3,-3);
      s+=p==0?`<path d="M42 102 Q58 102 54 116 Q48 112 42 112Z" fill="${G}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`
             :`<path d="M42 99 Q60 98 56 110 Q50 106 43 106Z" fill="${G}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M43 110 Q55 112 52 121 Q46 117 42 114Z" fill="${GD}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      s+=`<circle cx="34" cy="102" r="5.5" fill="#fff" stroke="${O}" stroke-width="2"/><circle cx="35.5" cy="103" r="2.6" fill="${O}"/><path d="M27 94 L40 98" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`;
      if(p==1) s+=`<g class="fx"><path d="M62 92 l8 -4 M64 102 l9 0 M62 112 l8 4" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
      return s;
    });
    /* hypnose */
    const [ex,ey]=held(this,'R','st',2,[136,52],P);
    const rings=[0,.22,.44].map(d=>`<g class="ring" style="animation-delay:${d}s"><circle cx="${f(ex)}" cy="${f(ey)}" r="40" fill="none" stroke="${RE}" stroke-width="5"/></g>`).join('');
    const tx=176,ty=176;
    let wave='';for(let i=0;i<=20;i++){const t=i/20,px=ex+(tx-ex)*t+Math.sin(t*Math.PI*5)*7,py=ey+(ty-ey)*t;wave+=(i?'L':'M')+f(px)+' '+f(py)}
    b+=x.when([2],rings+`<g class="grow" style="transform-origin:${f(ex)}px ${f(ey)}px"><path d="${wave}" stroke="${O}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="${wave}" stroke="${RE}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 9"/></g>`
      +`<g class="pop"><circle cx="${f(ex)}" cy="${f(ey)}" r="24" fill="#fff" stroke="${O}" stroke-width="4"/><g class="spin fast">${spiral(ex,ey,21,RE,3)}</g></g>`
      +`<g class="pop">${token(tx,ty,15,'#3c8bf0',`<g class="spin fast">${spiral(tx-6,ty-2,5,'#fff',2)}</g><g class="spin fast">${spiral(tx+6,ty-2,5,'#fff',2)}</g>`)}<g class="spin">${sparks(tx,ty,30,'#ff8aa0',6)}</g></g>`);
    return shadow(76)+x.body(b);
  }
},
{
  id:'cruella',name:'Cruella',stats:[3,3,3],tint:'#4f8a6a',tint2:'#18352c',mt:'#e3f2dc',mt2:'#b2d6a6',glow:'#8de86a',
  power:'Vol de manteau : vole le bonus de fusion d’un héros.',minionTxt:'Hommes de main : résistants, en groupe.',
  sh:{L:[62,150],R:[138,150]},
  poses:[{L:40,R:-14},{L:84,R:-84,cp:[0,-4,-14,1.12,1],body:[0,-4,-5,1,1.02]},{L:34,R:-132,cp:[0,0,10,1.05,1],body:[-6,0,-6,1,1]}],
  bg(): string {let s='';const r=rnd(11);for(let i=0;i<7;i++)s+=`<circle cx="${f(-20+r()*240)}" cy="${f(-20+r()*200)}" r="${f(8+r()*16)}" fill="#8de86a" opacity=".08"/>`;for(let i=0;i<6;i++)s+=twinkle(f(-20+r()*240),f(-26+r()*110),f(3+r()*3),'#d8ffc4',.45);return s},
  draw(this: CharDef, x: Ctx): string {
    const W='#f7f5fb',WD='#c6c0d8',R='#d0283a',RD='#8c1726',BK='#231c2e',BKD='#120e1a',S='#f1e2d6',SD='#c9afa2',Y='#ffe23a',SM='#8de86a';
    const armIn=(sx: number, sy: number, side: string)=>limb(sx,sy,sx,sy+24,W,22)+limb(sx,sy+26,sx,sy+36,R,12)+fluffy(ringPts(sx,sy+22,12,4,6),5,W,WD)+hand(sx,sy+40,R,11)
      +(side=='L'?`<path d="M${sx} ${sy+40} L${sx-58} ${sy+18}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${sx} ${sy+40} L${sx-58} ${sy+18}" stroke="#3b3148" stroke-width="3" stroke-linecap="round"/><path d="M${sx-50} ${sy+21} L${sx-58} ${sy+18}" stroke="${G()}" stroke-width="3.5" stroke-linecap="round"/><path d="M${sx-58} ${sy+18} L${sx-66} ${sy+15}" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="${sx-67}" cy="${sy+14}" r="3" fill="#ff7a2f"/>`
        +`<g class="wig"><path d="M${sx-68} ${sy+10} q-8 -10 2 -18 q9 -8 -1 -18 q-8 -8 2 -16" stroke="${SM}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".75"/></g>`:'');
    function G(){return '#f6c64a'}
    let b='';
    /* manteau de fourrure ample (pièce qui tournoie) */
    b+=x.part('cp',100,140,fluffy(ringPts(100,160,78,40,22),14,'#e8e4f2','#b5aecb'));
    b+=x.when([1],`<g class="spin fast" style="transform-origin:100px 130px;transform-box:view-box">${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return `<circle cx="${f(100+Math.cos(a)*100)}" cy="${f(130+Math.sin(a)*86)}" r="${12+i%3*4}" fill="${SM}" stroke="${O}" stroke-width="3" opacity=".85"/>`}).join('')}</g>`);
    b+=fluffy(ringPts(100,166,60,34,20),14,W,WD);
    b+=`<path d="M86 140 L114 140 L120 206 L80 206Z" fill="${BK}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M86 142 L80 204 M114 142 L120 204" stroke="${R}" stroke-width="4"/>`;
    b+=fluffy(ringPts(100,124,52,26,11,.15*Math.PI,.85*Math.PI,false),13,W,WD,false);
    b+=`<path d="M84 128 Q100 150 116 128" fill="${S}" stroke="${O}" stroke-width="4"/>`;
    b+=fluffy(ringPts(100,190,58,18,9,.1*Math.PI,.9*Math.PI,false),10,W,WD,false);
    /* tête */
    b+=head(S,SD)+hoodShade(headS,58,106,.6);
    b+=`<ellipse cx="78" cy="94" rx="16" ry="10" fill="#5b2a6e" opacity=".55"/><ellipse cx="122" cy="94" rx="16" ry="10" fill="#5b2a6e" opacity=".55"/>`;
    b+=x.byPose(p=>{
      let s=geyes(Y,{y:96,sq:p==1?.7:1});
      s+=`<path d="M60 76 Q74 64 94 82 M140 76 Q126 64 106 82" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      if(p==0) s+=`<path d="M88 122 Q100 117 114 113 Q109 127 92 126Z" fill="${R}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      else s+=evilMouth(p,100,122,12)+`<path d="M88 119 Q100 ${p==2?115:117} 112 119" stroke="${R}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b+=`<path d="M64 108 Q70 118 78 120 M136 108 Q130 118 122 120" stroke="${SD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=`<circle cx="46" cy="104" r="5" fill="${R}" stroke="${O}" stroke-width="2.5"/><circle cx="154" cy="104" r="5" fill="${R}" stroke="${O}" stroke-width="2.5"/>`;
    const hair=(a: string)=>`<path d="M38 104 Q20 40 66 16 Q100 0 134 16 Q180 40 162 104 Q154 66 130 56 Q112 70 100 60 Q88 70 70 56 Q46 66 38 104Z" ${a}/>`;
    b+=shaded(hair,'#3a3149',BKD,-4,-4);
    b+=clip(a=>`<rect x="100" y="-40" width="120" height="200" ${a}/>`,shaded(hair,W,WD,-4,-4));
    b+=hair(`fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"`)+`<path d="M100 4 V60" stroke="${O}" stroke-width="3"/>`+gloss(66,30,12,5,-35,.35)+gloss(128,28,12,5,30,.6);
    b+=x.arm('L',(sx,sy)=>armIn(sx,sy,'L'))+x.arm('R',(sx,sy)=>armIn(sx,sy,'R'));
    /* vol du bonus de fusion */
    const [hx,hy]=tip(this,'R',2,40),tx=196,ty=40;
    const claw=`<path d="M${tx-14} ${ty+14} q-10 -18 2 -30 M${tx-6} ${ty+16} q-4 -22 10 -30 M${tx+4} ${ty+14} q6 -18 18 -20" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${tx-14} ${ty+14} q-10 -18 2 -30 M${tx-6} ${ty+16} q-4 -22 10 -30 M${tx+4} ${ty+14} q6 -18 18 -20" stroke="${SM}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    b+=x.when([2],`<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${beam(hx,hy,tx-6,ty+14,10,SM)}</g>`
      +`<g class="pop">${glow(tx,ty,28,'#ffe27a')}<polygon points="${star(tx,ty,17,8,5,-Math.PI/2)}" fill="#f6c64a" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${tx} ${ty+5} v-10 m-5 5 l5 -5 l5 5" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>${claw}</g>`
      +`<g class="pop">${txt(36,22,24,SM,'VOL !',-8)}</g>`
      +`<g class="pop">${([[22,200,16],[176,204,14],[40,180,10],[160,186,10]] as const).map(([cx,cy,r])=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SM}" stroke="${O}" stroke-width="3" opacity=".85"/>`).join('')}</g>`);
    return shadow(80)+x.body(b);
  }
},
{
  id:'ursula',name:'Ursula',stats:[5,1,4],tint:'#4a6fa8',tint2:'#16213f',mt:'#e0e6fb',mt2:'#a9b7e6',glow:'#ffd23a',
  power:'Contrat : échange la position de 2 héros sur le plateau.',minionTxt:'Murènes : avancent en duo.',
  sh:{L:[56,148],R:[144,148]},
  poses:[{L:18,R:-18},{L:140,R:-140,body:[0,-6,0,1,1.04]},{L:64,R:-64,body:[0,-2,0,1.04,.98]}],
  bg(): string {let s='';const r=rnd(5);for(let i=0;i<12;i++){const R=f(2+r()*6);s+=`<circle cx="${f(-24+r()*250)}" cy="${f(-24+r()*230)}" r="${R}" fill="none" stroke="#bfe3ff" stroke-width="2" opacity=".35"/>`}return s},
  draw(this: CharDef, x: Ctx): string {
    const L='#b99ae0',LD='#8a6bc0',BK='#2a1d3c',BKD='#130c1d',W='#f6f4fb',WD='#c9c5dc',G='#f6c64a',GD='#cf962a',Y='#ffd23a',R='#d0283a';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+38,L,20)+`<rect x="${sx-12}" y="${sy+24}" width="24" height="7" rx="3" fill="${G}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+40,L,13);
    let b='';
    const tl=['M70 188 Q36 196 22 208 Q6 220 0 202','M82 194 Q66 218 46 220 Q30 221 34 206','M94 196 Q98 220 82 226 Q66 228 70 214'];
    b+=tl.map((d,i)=>`<g class="wig" style="animation-delay:${i*.15}s">${tentacle(d,BK,16,'#6a4f94')}</g>`).join('')+mirror(tl.map((d,i)=>`<g class="wig" style="animation-delay:${i*.15+.2}s">${tentacle(d,BK,16,'#6a4f94')}</g>`).join(''));
    b+=shaded(a=>`<path d="M36 204 C32 150 62 126 100 124 C138 126 168 150 164 204Z" ${a}/>`,L,LD,-10,-4);
    b+=shaded(a=>`<path d="M36 204 C34 172 44 154 58 150 Q100 162 142 150 C156 154 166 172 164 204Z" ${a}/>`,BK,BKD,-8,-4)+gloss(60,170,10,4,-50,.25);
    b+=`<path d="M72 138 Q100 156 128 138" stroke="${GD}" stroke-width="3" fill="none"/>`;
    b+=x.when([1,2],glow(100,160,34,'#ffe27a'));
    b+=shaded(a=>`<circle cx="100" cy="160" r="14" ${a}/>`,G,GD,-3,-3)+`<path d="M100 160 m0 -2 a2 2 0 1 1 -2 2 a5 5 0 0 1 6 -5 a8 8 0 0 1 -1 15 a11 11 0 0 1 -12 -12" stroke="${GD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    b+=head(L,LD)+hoodShade(headS,52,100,.55);
    b+=`<ellipse cx="78" cy="88" rx="17" ry="11" fill="#3f86e0" opacity=".75"/><ellipse cx="122" cy="88" rx="17" ry="11" fill="#3f86e0" opacity=".75"/>`;
    b+=x.byPose(p=>{
      let s=geyes(Y,{sq:p==1?.7:1});
      s+=`<path d="M58 74 Q72 60 94 76 M142 74 Q128 60 106 76" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if(p==0) s+=`<path d="M84 120 Q92 114 100 118 Q108 114 116 120 Q108 130 100 128 Q92 130 84 120Z" fill="${R}" stroke="${O}" stroke-width="3.2" stroke-linejoin="round"/><path d="M86 121 Q100 124 114 121" stroke="${O}" stroke-width="2"/>`;
      else s+=evilMouth(p,100,121,13)+`<path d="M87 117 Q100 ${p==2?113:115} 113 117" stroke="${R}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b+=`<circle cx="126" cy="128" r="2.6" fill="${O}"/>`;
    b+=shaded(a=>`<path d="M44 90 Q40 42 62 28 L52 6 L76 16 L78 -10 L94 10 L104 -14 L114 10 L130 -6 L130 18 L150 8 L144 32 Q162 52 156 90 Q146 62 128 56 Q100 64 72 56 Q54 62 44 90Z" ${a}/>`,W,WD,-4,-4)+gloss(70,34,10,4,-30,.5);
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    /* contrat + échange */
    const scroll=`<g class="grow" style="transform-origin:100px 168px"><rect x="22" y="148" width="156" height="40" rx="4" fill="#fbe9b8" stroke="${O}" stroke-width="4"/><path d="M34 168 H96 M34 176 H118 M104 168 H138" stroke="#c9a25a" stroke-width="2.5" stroke-linecap="round"/><text x="100" y="162" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="10" fill="#7a4a1a" letter-spacing="1">CONTRAT</text><path d="M120 180 q6 -10 10 0 q4 8 9 -2 q4 -6 8 0" stroke="#3f2a7a" stroke-width="2.2" fill="none"/><circle cx="160" cy="174" r="7" fill="${R}" stroke="${O}" stroke-width="2.5"/></g>`
      +`<g class="pop"><rect x="12" y="142" width="12" height="52" rx="5" fill="${G}" stroke="${O}" stroke-width="3.5"/><rect x="176" y="142" width="12" height="52" rx="5" fill="${G}" stroke="${O}" stroke-width="3.5"/></g>`;
    const pre=x.when([2],scroll);
    const arrow=(d: any, hx: number, hy: number, ang: number)=>`<path d="${d}" stroke="${O}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${G}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="14 7"/><polygon points="${star(hx,hy,13,13,3,ang)}" fill="${G}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    const fxg=x.when([2],`<g class="pop">${arrow('M-12 78 Q100 -120 204 70',206,80,Math.PI/2)}</g><g class="pop">${arrow('M212 128 Q100 262 -4 136',-6,124,-Math.PI/2)}</g>`
      +`<g class="pop">${token(-12,104,13,'#e8413b')}${token(212,104,13,'#3c8bf0')}</g>`);
    return shadow(84)+x.body(b+pre)+fxg;
  }
},
{
  id:'malefique',name:'Maléfique',stats:[4,2,5],tint:'#5a8a3a',tint2:'#1d1430',mt:'#e7f5da',mt2:'#c1a9e0',glow:'#7dff5a',
  power:'Sommeil maudit : endort une ligne de héros.',minionTxt:'Gardes gobelins : armure élevée.',
  sh:{L:[62,152],R:[138,152]},
  poses:[{L:14,R:-34,st:[0,0,34]},{L:30,R:-152,st:[0,0,148],body:[0,-6,0,1,1.03]},{L:40,R:-112,st:[0,0,124],body:[-4,0,-4,1,1]}],
  bg(): string {let s='';const r=rnd(3);for(let i=0;i<10;i++)s+=`<circle cx="${f(-24+r()*250)}" cy="${f(-20+r()*230)}" r="${f(1.5+r()*3)}" fill="#7dff5a" opacity=".55"/>`;
    const th=`<path d="M-40 230 Q-10 180 10 200 Q24 170 46 196 L60 230Z" fill="#120b1c" opacity=".7"/><path d="M-6 192 l-6 -8 M22 186 l2 -10 M36 196 l8 -6" stroke="#120b1c" stroke-width="4" opacity=".7"/>`;return s+th+mirror(th)},
  draw(this: CharDef, x: Ctx): string {
    const GR='#a8d88e',GRD='#73a862',BK='#251b34',BKD='#120c1c',PU='#5b2a8a',PUD='#3c1862',Y='#e9ff4a',GN='#7dff5a',R='#c8283a';
    const P=[138,190] as const;
    const staff=`<rect x="${P[0]!-5}" y="74" width="10" height="140" rx="4" fill="#3b2a4a" stroke="${O}" stroke-width="4"/><path d="M${P[0]!-2} 100 V160" stroke="#7a62a0" stroke-width="2" opacity=".7"/>`
      +`<path d="M${P[0]!-14} 78 Q${P[0]!-18} 56 ${P[0]!-8} 44 M${P[0]!+14} 78 Q${P[0]!+18} 56 ${P[0]!+8} 44 M${P[0]!} 78 V60" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${P[0]!-14} 78 Q${P[0]!-18} 56 ${P[0]!-8} 44 M${P[0]!+14} 78 Q${P[0]!+18} 56 ${P[0]!+8} 44" stroke="#3b2a4a" stroke-width="4" fill="none" stroke-linecap="round"/>`
      +x.byPose(p=>glow(P[0]!,56,p?34:22,GN))+`<circle cx="${P[0]!}" cy="56" r="12" fill="${GN}" stroke="${O}" stroke-width="4"/><circle cx="${P[0]!-4}" cy="52" r="4" fill="#fff" opacity=".8"/>`
      +`<rect x="${P[0]!-16}" y="76" width="32" height="8" rx="3" fill="#3b2a4a" stroke="${O}" stroke-width="3"/>`
      +x.when([1],sparks(P[0]!,56,34,GN,10));
    const sleeve=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,BK,18)+`<path d="M${sx-14} ${sy+28} L${sx} ${sy+42} L${sx+14} ${sy+28}" fill="${PU}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    const armL=(sx: number, sy: number)=>sleeve(sx,sy)+hand(sx,sy+38,GR);
    const armR=(sx: number, sy: number)=>sleeve(sx,sy)+x.part('st',P[0]!,P[1]!,staff)+hand(sx,sy+38,GR);
    let b='';
    const collar=`<path d="M48 152 Q4 104 20 24 Q40 70 52 96 Q60 70 64 60 Q70 110 78 134Z" fill="${BK}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M44 134 Q22 96 24 48" stroke="${PU}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    b+=collar+mirror(collar);
    b+=shaded(a=>`<path d="M30 206 Q36 150 64 134 L136 134 Q164 150 170 206Z" ${a}/>`,BK,BKD,-8,-4);
    b+=shaded(a=>`<path d="M84 136 L116 136 L130 206 L70 206Z" ${a}/>`,PU,PUD,-4,-3)+`<path d="M100 140 V206" stroke="${PUD}" stroke-width="3"/>`;
    b+=`<path d="M38 196 Q60 186 70 206 M162 196 Q140 186 130 206" stroke="${PU}" stroke-width="4" fill="none"/>`;
    /* coiffe cornue */
    const horn=(a: string)=>`<path d="M60 52 Q30 20 40 -24 Q44 -32 50 -26 Q52 4 80 34Z" ${a}/>`;
    b+=shaded(horn,'#3a2a4e',BKD,-3,-3)+mirror(shaded(horn,'#3a2a4e',BKD,-3,-3));
    b+=`<path d="M48 -16 Q48 6 64 26 M152 -16 Q152 6 136 26" stroke="#8a6fc0" stroke-width="2.5" fill="none" opacity=".7"/>`;
    b+=shaded(a=>`<path d="M40 96 Q34 34 100 26 Q166 34 160 96 Q158 134 130 140 L70 140 Q42 134 40 96Z" ${a}/>`,'#3a2a4e',BKD,-5,-5)+gloss(70,42,12,5,-30,.3);
    const face=(a: string)=>`<path d="M62 84 Q66 58 100 54 Q134 58 138 84 Q138 118 118 134 Q100 144 82 134 Q62 118 62 84Z" ${a}/>`;
    b+=shaded(face,GR,GRD,-4,-4)+hoodShade(face,54,100,.7);
    b+=x.byPose(p=>{
      let s=geyes(Y,{x:84,y:94,s:.9,sq:p==1?.7:1});
      s+=`<path d="M64 70 Q76 62 94 80 M136 70 Q124 62 106 80" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      if(p==0) s+=`<path d="M88 122 Q100 118 112 116 Q108 126 92 126Z" fill="${R}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      else s+=evilMouth(p,100,121,11)+`<path d="M90 118 Q100 ${p==2?114:116} 110 118" stroke="${R}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b+=`<path d="M72 108 Q76 118 84 122 M128 108 Q124 118 116 122" stroke="${GRD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b+=x.arm('L',armL)+x.arm('R',armR);
    /* sommeil maudit */
    const [ox,oy]=held(this,'R','st',2,[138,56],P);
    let wv='';for(let i=0;i<=40;i++){const px=-36+i*7,py=196+Math.sin(i*.9)*7;wv+=(i?'L':'M')+f(px)+' '+f(py)}
    const flame=(fx: number, fy: number, s: any)=>`<g class="wig"><path d="M${fx} ${fy} q${-12*s} ${-10*s} ${-4*s} ${-26*s} q${4*s} ${8*s} ${8*s} ${2*s} q${-2*s} ${-12*s} ${6*s} ${-20*s} q${10*s} ${18*s} ${2*s} ${44*s}Z" fill="${GN}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${fx+1} ${fy-3} q${-5*s} ${-6*s} ${1*s} ${-14*s} q${5*s} ${8*s} ${-1*s} ${14*s}Z" fill="#e8ffd8"/></g>`;
    b+=x.when([2],`<g class="pop">${flame(+f(ox-14),+f(oy+8),1)}${flame(+f(ox+12),+f(oy+6),.9)}${flame(+f(ox),+f(oy-2),1.15)}</g>`);
    const fxg=x.when([2],`<g class="grow" style="transform-origin:100px 196px"><path d="${wv}" stroke="${GN}" stroke-width="30" fill="none" opacity=".28" stroke-linecap="round"/><path d="${wv}" stroke="${O}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="${wv}" stroke="#c9a0ff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${wv}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>`
      +`<g class="pop">${flame(8,206,1.1)}${flame(196,208,1.2)}</g>`
      +`<g class="pop">${txt(-6,150,26,'#c9a0ff','Z',-12)}${txt(14,124,20,'#c9a0ff','z',-12)}${txt(206,150,26,'#c9a0ff','Z',12)}${txt(190,124,20,'#c9a0ff','z',12)}${txt(218,104,16,'#c9a0ff','z',12)}</g>`);
    return shadow(80)+x.body(b)+fxg;
  }
},
{
  id:'galactus',name:'Galactus',stats:[5,1,5],tint:'#4a3a9a',tint2:'#120c2e',mt:'#e4e2fb',mt2:'#b4b0e6',glow:'#8ff6ff',shake:true,
  power:'Dévoreur : détruit un héros aléatoire toutes les X s.',minionTxt:'Drones cosmiques : volent, ignorent certains contrôles.',
  sh:{L:[50,152],R:[150,152]},
  poses:[{L:18,R:-18},{L:150,R:-150,body:[0,-6,0,1,1.03]},{L:62,R:-62,body:[-3,2,-3,1.02,.98]}],
  bg(): string {let s='';const r=rnd(19);for(let i=0;i<26;i++){const x=f(-28+r()*256),y=f(-30+r()*250),rr=r();s+=rr>.7?twinkle(x,y,f(3+r()*4),'#fff',.85):`<circle cx="${x}" cy="${y}" r="${f(.8+r()*1.6)}" fill="#fff" opacity="${f(.4+r()*.5)}"/>`}
    s+=`<circle cx="-6" cy="28" r="14" fill="#ff8a5c" opacity=".5"/><ellipse cx="-6" cy="28" rx="24" ry="5" fill="none" stroke="#ffd0a8" stroke-width="2" opacity=".5" transform="rotate(-20 -6 28)"/>`;return s},
  draw(this: CharDef, x: Ctx): string {
    const PU='#7a3cc0',PUD='#4f1f8a',BL='#2d4fcf',BLD='#1c3391',G='#f6c64a',GD='#cf962a',C='#8ff6ff',FD='#170c2c';
    const armIn=(sx: number, sy: number)=>limb(sx,sy,sx,sy+36,PU,24)+shaded(a=>`<rect x="${sx-15}" y="${sy+22}" width="30" height="20" rx="7" ${a}/>`,BL,BLD,-3,-3)+`<path d="M${sx-15} ${sy+30} H${sx+15}" stroke="${G}" stroke-width="3"/>`+hand(sx,sy+46,BL,15)+x.when([1,2],glow(sx,sy+48,18,C));
    let b='';
    /* ailerons du casque (derrière) */
    const fin=(a: string)=>`<path d="M48 80 L18 -26 Q22 -36 34 -30 L66 50Z" ${a}/>`;
    b+=shaded(fin,PU,PUD,-3,-3)+`<path d="M44 62 L26 -14" stroke="${BL}" stroke-width="5" stroke-linecap="round"/>`;
    b+=mirror(shaded(fin,PU,PUD,-3,-3)+`<path d="M44 62 L26 -14" stroke="${BL}" stroke-width="5" stroke-linecap="round"/>`);
    b+=shaded(a=>`<path d="M26 206 C22 152 56 128 100 126 C144 128 178 152 174 206Z" ${a}/>`,BL,BLD,-10,-4)+gloss(52,166,12,5,-55,.25);
    b+=shaded(a=>`<path d="M56 134 L100 172 L144 134 L156 150 L100 196 L44 150Z" ${a}/>`,PU,PUD,-4,-3);
    b+=shaded(a=>`<path d="M30 190 Q100 204 170 190 L172 206 L28 206Z" ${a}/>`,PU,PUD,-3,-3)+`<path d="M30 190 Q100 204 170 190" stroke="${G}" stroke-width="3" fill="none"/>`;
    b+=x.when([1,2],glow(100,170,26,C));
    b+=`<circle cx="100" cy="170" r="13" fill="${G}" stroke="${O}" stroke-width="4"/><circle cx="100" cy="170" r="6" fill="${C}" stroke="${O}" stroke-width="2"/>`;
    /* casque */
    b+=shaded(a=>`<path d="M38 110 Q32 28 100 22 Q168 28 162 110 Q152 140 100 144 Q48 140 38 110Z" ${a}/>`,PU,PUD,-6,-6)+gloss(70,40,16,6,-30,.35);
    b+=shaded(a=>`<path d="M44 66 Q100 40 156 66 L152 82 Q100 58 48 82Z" ${a}/>`,BL,BLD,-3,-3);
    b+=`<path d="M70 58 L80 70 L90 52 L100 66 L110 52 L120 70 L130 58" stroke="${G}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>`;
    const fp=(a: string)=>`<path d="M60 84 Q100 70 140 84 L136 122 Q100 142 64 122Z" ${a}/>`;
    b+=fp(`fill="${FD}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"`)+clip(fp,`<ellipse cx="100" cy="140" rx="34" ry="18" fill="#3a2a66" opacity=".7"/>`);
    b+=`<path d="M48 86 L60 86 L64 122 L52 120Z M152 86 L140 86 L136 122 L148 120Z" fill="${BL}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=x.byPose(p=>geyes(C,{x:84,y:98,s:p==2?1.15:1,sq:p==1?.6:1,lid:FD})+`<path d="M90 ${p==2?124:122} H110" stroke="#5a4a90" stroke-width="3" stroke-linecap="round"/>`);
    b+=shaded(a=>`<circle cx="50" cy="146" r="22" ${a}/>`,PU,PUD,-4,-4)+shaded(a=>`<circle cx="150" cy="146" r="22" ${a}/>`,PU,PUD,-4,-4)+gloss(44,138,7,3,-30,.5)+gloss(144,138,7,3,-30,.5);
    b+=x.arm('L',armIn)+x.arm('R',armIn);
    /* énergie cosmique rassemblée */
    const [lx,ly]=tip(this,'L',1,46),[rx,ry]=tip(this,'R',1,46);
    b+=x.when([1],`<g class="gather">${sparks(100,-6,46,C,12)}</g>${glow(100,-6,24,C)}`+bolt([[lx,ly],[lx+18,ly-40],[64,10],[92,-4]],C)+bolt([[rx,ry],[rx-18,ry-40],[136,10],[108,-4]],C));
    /* dévoreur : rayon des yeux vers un vortex */
    const vx=200,vy=186;
    const fxg=x.when([2],([[84,98],[116,98]] as const).map(([ex,ey])=>{const L=Math.hypot(vx-ex,vy-ey),dx=(vx-ex)/L,dy=(vy-ey)/L,sx=ex+dx*30,sy=ey+dy*30;return `<g class="grow" style="transform-origin:${f(sx)}px ${f(sy)}px">${beam(sx,sy,vx,vy,7,'#c38bff')}</g>`}).join('')
      +`<g class="pop"><ellipse cx="${vx}" cy="${vy}" rx="40" ry="40" fill="#2a1450" stroke="${O}" stroke-width="4"/><g class="spin fast">${spiral(vx,vy,36,'#c38bff',3)}${spiral(vx,vy,28,C,2)}</g></g>`
      +`<g class="ring"><circle cx="${vx}" cy="${vy}" r="44" fill="none" stroke="${C}" stroke-width="5"/></g>`
      +`<g class="suck" style="--tx:28px;--ty:28px">${token(vx-28,vy-28,12,'#f2a93b')}</g>`
      );
    return shadow(86)+x.body(b)+fxg;
  }
},
{
  id:'bouffon',name:'Bouffon Vert',stats:[3,4,3],tint:'#7a4aa8',tint2:'#1f1238',mt:'#efe0fb',mt2:'#cfb1ea',glow:'#ff9b2f',shake:true,
  power:'Bombes citrouilles : bombardent le plateau et étourdissent.',minionTxt:'Citrouilles volantes : explosent à l’arrivée.',
  sh:{L:[66,148],R:[134,148]},
  poses:[{L:20,R:-20},{L:44,R:-160,body:[0,-4,4,1,1],head:[0,-4,1.05]},{L:30,R:-66,body:[-8,2,-7,1,1]}],
  bg(): string {let s=`<circle cx="-2" cy="14" r="30" fill="#fff3c4" opacity=".9"/><circle cx="8" cy="8" r="6" fill="#e9d79a" opacity=".7"/><circle cx="-12" cy="24" r="4" fill="#e9d79a" opacity=".7"/>`;
    const bat=(x: number, y: number, s: any)=>`<path d="M${x} ${y} q${-6*s} ${-6*s} ${-14*s} ${-2*s} q${4*s} ${2*s} ${2*s} ${6*s} q${6*s} ${-4*s} ${12*s} ${2*s} q${6*s} ${-6*s} ${12*s} ${-2*s} q${-2*s} ${-4*s} ${2*s} ${-6*s} q${-8*s} ${-4*s} ${-14*s} ${2*s}Z" fill="#120a20" opacity=".7"/>`;
    return s+bat(180,10,1.2)+bat(206,36,.8)+bat(160,-12,.7)},
  draw(this: CharDef, x: Ctx): string {
    const G='#7cc23a',GD='#4f8a22',PU='#6b2c9e',PUD='#47197a',Y='#ffe23a',DK='#6a5c8e',DKD='#43395e',OR='#f28a2a',ORD='#c45e14';
    const pumpkin=(cx: number, cy: number, r=13)=>{cx=+cx;cy=+cy;return `<ellipse cx="${cx-r*.45}" cy="${cy}" rx="${f(r*.7)}" ry="${r}" fill="${ORD}" stroke="${O}" stroke-width="3"/><ellipse cx="${cx+r*.45}" cy="${cy}" rx="${f(r*.7)}" ry="${r}" fill="${ORD}" stroke="${O}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${f(r*.62)}" ry="${r}" fill="${OR}" stroke="${O}" stroke-width="3"/><path d="M${cx} ${cy-r} l2 -6" stroke="#3f7a22" stroke-width="4" stroke-linecap="round"/><path d="M${f(cx-r*.45)} ${f(cy-r*.15)} l${f(r*.25)} ${f(r*.2)} l${f(r*.15)} ${f(-r*.25)}Z M${f(cx+r*.45)} ${f(cy-r*.15)} l${f(-r*.25)} ${f(r*.2)} l${f(-r*.15)} ${f(-r*.25)}Z M${f(cx-r*.4)} ${f(cy+r*.35)} l${f(r*.2)} ${f(r*.2)} l${f(r*.2)} ${f(-r*.2)} l${f(r*.2)} ${f(r*.2)} l${f(r*.2)} ${f(-r*.2)}" fill="${Y}" stroke="${Y}" stroke-width="2" stroke-linejoin="round"/>`};
    const armIn=(sx: number, sy: number, side: string)=>limb(sx,sy,sx,sy+36,PU,15)+`<rect x="${sx-10}" y="${sy+22}" width="20" height="8" rx="3" fill="${G}" stroke="${O}" stroke-width="3"/>`+hand(sx,sy+38,PU,11)
      +(side=='R'?x.when([1],`${glow(sx,sy+54,20,OR)}${pumpkin(sx,sy+54,14)}`):'');
    let b='';
    /* planeur chauve-souris */
    const wing=`<path d="M100 180 L66 174 Q42 168 20 152 Q24 168 14 184 Q28 180 34 194 Q42 184 54 196 Q64 188 76 200 L100 202Z" fill="${DK}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/><path d="M96 186 L36 168 M96 192 L50 190" stroke="${DKD}" stroke-width="3" fill="none"/>`;
    b+=wing+mirror(wing);
    b+=x.byPose(p=>`<g class="fx"><path d="M90 200 Q100 ${p?232:222} 110 200Z" fill="#ffb347" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M95 202 Q100 ${p?220:214} 105 202Z" fill="#fff3c4"/></g>`);
    /* jambes */
    b+=limb(86,168,84,184,G,12)+limb(114,168,116,184,G,12)+`<path d="M74 186 Q84 178 94 186Z M106 186 Q116 178 126 186Z" fill="${PU}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=shaded(a=>`<ellipse cx="100" cy="192" rx="26" ry="11" ${a}/>`,DK,DKD,-3,-3)+`<path d="M78 186 L74 176 L84 182Z M122 186 L126 176 L116 182Z" fill="${DK}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b+=`<g class="fx"><ellipse cx="90" cy="192" rx="5" ry="3" fill="${Y}"/><ellipse cx="110" cy="192" rx="5" ry="3" fill="${Y}"/></g>`;
    /* buste */
    b+=shaded(a=>`<path d="M64 176 C62 150 74 134 100 132 C126 134 138 150 136 176 Q100 184 64 176Z" ${a}/>`,PU,PUD,-8,-4);
    b+=`<path d="M72 138 L128 172" stroke="#7a4a2a" stroke-width="6"/><path d="M72 138 L128 172" stroke="${O}" stroke-width="1.5" opacity=".4"/>`;
    b+=shaded(a=>`<path d="M118 160 L142 160 L144 182 L116 182Z" ${a}/>`,'#8a5a32','#5b3a1e',-3,-3)+pumpkin(130,158,7);
    b+=`<path d="M80 150 Q90 156 100 150 Q110 156 120 150" stroke="${G}" stroke-width="4" fill="none"/>`;
    /* tête */
    let h='';
    const ear=`<path d="M52 92 L8 72 L48 116Z" fill="${G}" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/><path d="M44 96 L22 80" stroke="${GD}" stroke-width="3"/>`;
    h+=ear+mirror(ear);
    h+=head(G,GD);
    h+=shaded(a=>`<path d="M42 92 Q36 30 100 24 Q150 26 162 62 Q182 58 196 82 Q176 76 162 86 Q152 58 100 54 Q58 58 42 92Z" ${a}/>`,PU,PUD,-4,-4)+gloss(78,36,12,4,-20,.35);
    h+=hoodShade(headS,58,100,.65);
    h+=`<path d="M74 82 Q88 78 96 90 M126 82 Q112 78 104 90" stroke="${GD}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    h+=x.byPose(p=>{
      let s=geyes(Y,{x:82,y:96,s:1.05,sq:p==1?.6:1});
      s+=`<path d="M94 100 Q100 110 106 100 M90 108 Q100 116 110 108" stroke="${GD}" stroke-width="2.5" fill="none"/>`;
      if(p==1) s+=`<path d="M62 114 Q100 106 138 114 Q130 148 100 150 Q70 148 62 114Z" fill="#4a0f22" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M64 115 Q100 108 136 115 L132 122 Q100 115 68 122Z" fill="#fff" stroke="${O}" stroke-width="2"/><path d="M86 142 Q100 134 114 142" stroke="#e85a6e" stroke-width="4" fill="none"/>`;
      else {const y2=p==2?136:130;s+=`<path d="M62 114 Q100 ${y2+8} 138 114 Q100 ${y2-6} 62 114Z" fill="#fff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;for(let i=1;i<8;i++){const t=i/8,xx=62+76*t;s+=`<path d="M${f(xx)} ${f(114+Math.sin(t*Math.PI)*(y2-118))} V${f(114+Math.sin(t*Math.PI)*(y2-108))}" stroke="${O}" stroke-width="1.8"/>`}}
      return s;
    });
    b+=x.head(h);
    b+=x.arm('L',(sx,sy)=>armIn(sx,sy,'L'))+x.arm('R',(sx,sy)=>armIn(sx,sy,'R'));
    b+=x.when([1],`<g class="fx">${txt(22,14,22,'#c4f06a','HA HA',-12)}${txt(186,26,18,'#c4f06a','HA !',12)}</g>`);
    /* lancer de bombe citrouille */
    const [hx,hy]=tip(this,'R',2,46),tx=196,ty=178;
    const fly=x.A?`<g class="throw" style="--tx:${f(tx-hx)}px;--ty:${f(ty-hy)}px">${pumpkin(+f(hx),+f(hy),13)}</g>`:`<g transform="translate(${f((tx-hx)*.5)} ${f((ty-hy)*.5-30)})">${pumpkin(+f(hx),+f(hy),13)}</g>`;
    let stun='';for(let i=0;i<4;i++){const a=i*Math.PI/2;stun+=`<polygon points="${star(tx+Math.cos(a)*22,ty-34+Math.sin(a)*7,7,3,5,-Math.PI/2)}" fill="${Y}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`}
    const fxg=x.when([2],fly+`<g class="boom"><circle cx="${tx}" cy="${ty}" r="46" fill="#ffb347" opacity=".35"/>${burst(tx,ty,34,OR,Y)}<circle cx="${tx-24}" cy="${ty+14}" r="10" fill="#7a6f8a" stroke="${O}" stroke-width="3"/><circle cx="${tx+20}" cy="${ty+16}" r="12" fill="#7a6f8a" stroke="${O}" stroke-width="3"/></g><g class="boom"><g class="spin fast">${stun}</g></g>`);
    return shadow(70,210)+`<g class="${x.A?'float':''}">${x.body(b)}</g>`+fxg;
  }
}];
