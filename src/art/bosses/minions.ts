// Personnages extraits de la planche design/planches/5-boss-sbires.html : code de dessin repris tel quel, typé.
// Ne pas redessiner : corriger ici seulement ce qui casse le rendu statique.
/* eslint-disable */
import { O, shaded, gloss, limb, hand, glow, burst, beam, sparks, mirror, shadow, type CharDef, type Ctx } from '../primitives';
import { held, hoodShade, geyes, txt, tentacle } from '../kits/villain';

export const MINIONS: Record<string, CharDef> = {
jafar:{
  id:'cobra',name:'Cobras',
  poses:[{},{body:[-10,4,-10,1,.92]},{body:[16,-6,14,1.05,1.06]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#3fae6a',GD='#26804a',BL='#f3e2a8',BLD='#d8bf78',RE='#ff3b4e';
    let b='';
    b+=`<g class="wig" style="animation-duration:.3s">${tentacle('M136 198 Q156 198 160 184 Q162 174 154 172',G,10)}</g>`;
    b+=shaded(a=>`<ellipse cx="100" cy="194" rx="44" ry="13" ${a}/>`,G,GD,-4,-3)+shaded(a=>`<ellipse cx="96" cy="182" rx="32" ry="10" ${a}/>`,G,GD,-4,-3);
    b+=tentacle('M90 182 Q120 160 100 128',G,22)+`<path d="M95 176 Q112 158 101 134" stroke="${BL}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    b+=shaded(a=>`<path d="M74 146 Q62 110 84 94 Q100 88 116 94 Q138 110 126 146 Q100 156 74 146Z" ${a}/>`,G,GD,-4,-3);
    b+=`<path d="M90 146 Q88 118 100 108 Q112 118 110 146Z" fill="${BL}" stroke="${O}" stroke-width="3"/><path d="M92 124 H108 M91 134 H109" stroke="${BLD}" stroke-width="2.5"/>`;
    b+=`<ellipse cx="80" cy="118" rx="5" ry="8" fill="${GD}"/><ellipse cx="120" cy="118" rx="5" ry="8" fill="${GD}"/>`;
    b+=shaded(a=>`<ellipse cx="100" cy="102" rx="20" ry="15" ${a}/>`,G,GD,-3,-3)+gloss(92,94,5,2.5,-20,.5);
    b+=x.byPose(p=>{
      let s=geyes('#ffd23a',{x:91,y:100,s:.5,sq:p==1?.6:1});
      if(p==2) s+=`<path d="M86 108 Q100 104 114 108 Q110 124 100 124 Q90 124 86 108Z" fill="#5c0f22" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M90 108 l2 7 l2 -6 M110 108 l-2 7 l-2 -6" fill="#fff" stroke="${O}" stroke-width="1.5"/>`;
      else s+=`<path d="M92 110 Q100 107 108 110" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/><g class="wig" style="animation-duration:.18s"><path d="M100 111 v8 l-3 4 M100 119 l3 4" stroke="${RE}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
      return s;
    });
    const fxg=x.when([2],`<g class="pop">${burst(150,104,14,'#fff','#ffd23a')}</g><g class="pop"><path d="M138 92 l10 -8 M144 104 l12 0 M138 116 l10 8" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M138 92 l10 -8 M144 104 l12 0 M138 116 l10 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`);
    return shadow(48,207,.18)+`<g class="${x.A?'walk':''}">${x.body(b)}</g>`+fxg;
  }
},
cruella:{
  id:'henchman',name:'Hommes de main',
  sh:{L:[74,156],R:[126,156]},
  poses:[{L:14,R:-14},{L:30,R:-168,body:[0,2,4,1,1]},{L:20,R:-56,body:[8,2,-8,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const C='#9a6a3c',CD='#6e4a26',CP='#6b7059',CPD='#474b3a',S='#f2c39a',SD='#d29a72',SA='#c9a76a',SAD='#9a7a42';
    let b='';
    b+=`<g class="legA">${limb(88,190,88,202,'#4a4458',11)}</g><g class="legB">${limb(112,190,112,202,'#4a4458',11)}</g>`;
    b+=`<ellipse cx="86" cy="205" rx="10" ry="5" fill="${O}"/><ellipse cx="114" cy="205" rx="10" ry="5" fill="${O}"/>`;
    b+=shaded(a=>`<path d="M62 198 C60 166 72 148 100 146 C128 148 140 166 138 198Z" ${a}/>`,C,CD,-8,-4);
    b+=`<path d="M100 148 V198 M86 150 L100 170 L114 150" stroke="${CD}" stroke-width="3" fill="none"/><rect x="64" y="176" width="72" height="7" fill="${CD}" stroke="${O}" stroke-width="2.5"/><circle cx="106" cy="160" r="2.5" fill="${O}"/><circle cx="106" cy="170" r="2.5" fill="${O}"/>`;
    b+=shaded(a=>`<circle cx="100" cy="118" r="32" ${a}/>`,S,SD,-5,-5);
    b+=hoodShade(a=>`<circle cx="100" cy="118" r="32" ${a}/>`,98,124,.55);
    b+=x.byPose(p=>`<ellipse cx="88" cy="114" rx="3.5" ry="${p==1?2:4}" fill="${O}"/><ellipse cx="112" cy="114" rx="3.5" ry="${p==1?2:4}" fill="${O}"/><path d="M80 105 L94 110 M120 105 L106 110" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`
      +(p==2?`<path d="M88 134 Q100 130 112 134 Q108 144 100 144 Q92 144 88 134Z" fill="#5c0f22" stroke="${O}" stroke-width="3"/>`:`<path d="M90 136 Q100 132 110 136" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`));
    b+=`<ellipse cx="100" cy="124" rx="9" ry="7" fill="#e88a7a" stroke="${O}" stroke-width="3"/><circle cx="97" cy="121" r="2" fill="#fff" opacity=".7"/>`;
    b+=`<g fill="${SD}">${([[82,132],[86,138],[114,134],[118,138],[100,146],[92,144],[108,144]] as const).map(([cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="1.3"/>`).join('')}</g>`;
    b+=shaded(a=>`<path d="M66 108 Q66 82 100 82 Q134 82 136 106 Q100 96 66 108Z" ${a}/>`,CP,CPD,-3,-3);
    b+=shaded(a=>`<path d="M62 110 Q100 94 146 108 Q148 116 138 116 Q100 106 68 116 Q60 116 62 110Z" ${a}/>`,CP,CPD,-2,-2)+`<circle cx="100" cy="84" r="3" fill="${CPD}" stroke="${O}" stroke-width="2"/>`;
    const sack=(sx: number, sy: number)=>shaded(a=>`<path d="M${sx-16} ${sy+66} Q${sx-20} ${sy+44} ${sx-6} ${sy+40} L${sx+6} ${sy+40} Q${sx+20} ${sy+44} ${sx+16} ${sy+66} Q${sx} ${sy+74} ${sx-16} ${sy+66}Z" ${a}/>`,SA,SAD,-3,-3)+`<path d="M${sx-6} ${sy+50} l4 6 M${sx+4} ${sy+56} l4 -5" stroke="${SAD}" stroke-width="2"/>`;
    b+=x.arm('L',(sx,sy)=>limb(sx,sy,sx,sy+26,C,11)+hand(sx,sy+30,S,8));
    b+=x.arm('R',(sx,sy)=>limb(sx,sy,sx,sy+26,C,11)+sack(sx,sy)+hand(sx,sy+32,S,8));
    const fxg=x.when([2],`<g class="pop">${burst(164,188,18,'#f6c64a')}</g><g class="pop"><circle cx="146" cy="200" r="8" fill="#d8d0c0" stroke="${O}" stroke-width="2.5"/><circle cx="182" cy="198" r="7" fill="#d8d0c0" stroke="${O}" stroke-width="2.5"/></g><g class="pop">${txt(160,160,16,'#fff','POUF',8)}</g>`);
    return shadow(44,207,.18)+`<g class="${x.A?'walk':''}">${x.body(b)}</g>`+fxg;
  }
},
ursula:{
  id:'murene',name:'Murènes',
  poses:[{},{body:[-10,2,-6,1,1]},{body:[14,-4,4,1.05,1.05]}],
  draw(this: CharDef, x: Ctx): string {
    const G='#5aa83a',GD='#3a7a22',BE='#d8ec8a',Y='#ffe23a';
    const eel=(p: number, c: string, cd: string)=>{
      let s=`<g class="wig" style="animation-duration:.35s">${tentacle('M14 186 Q34 168 56 178',c,16)}</g>`;
      s+=tentacle('M50 178 Q78 196 100 172 Q118 152 136 156',c,26)+`<path d="M52 186 Q80 204 104 180" stroke="${BE}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s+=`<path d="M40 166 Q60 150 78 166 Q96 150 116 138" stroke="${O}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M40 166 Q60 150 78 166 Q96 150 116 138" stroke="${cd}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      s+=shaded(a=>`<path d="M118 146 Q130 126 152 130 Q170 134 172 150 Q168 160 156 160 Q134 168 118 160Z" ${a}/>`,c,cd,-3,-3);
      const jaw=p==2?18:p==1?6:10;
      s+=`<path d="M128 160 Q150 ${160+jaw} 170 ${150+jaw*.4} Q160 158 150 158Z" fill="${cd}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
      if(p==2) s+=`<path d="M152 158 l3 6 l3 -5 l3 6 l3 -6" fill="#fff" stroke="${O}" stroke-width="1.5"/>`;
      s+=`<g class="fx"><circle cx="148" cy="140" r="9" fill="${Y}" opacity=".35"/></g><circle cx="148" cy="140" r="5.5" fill="${Y}" stroke="${O}" stroke-width="2.5"/><path d="M147 137 v6" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/><path d="M138 132 L156 136" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`;
      return s;
    };
    let b=x.byPose(p=>`<g transform="translate(18 -18) scale(.74)" opacity=".95">${eel(p,'#3f8a30','#28601c')}</g>`+eel(p,G,GD));
    let bub='';([[176,110,4],[184,96,3],[168,86,5]] as const).forEach(([cx,cy,r])=>bub+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`);
    const fxg=x.when([2],`<g class="pop">${burst(184,154,14,'#fff','#ffe23a')}</g>`);
    return shadow(56,210,.14)+`<g class="${x.A?'float':''}">${x.body(b)}</g>`+`<g class="fx">${bub}</g>`+fxg;
  }
},
malefique:{
  id:'gobelin',name:'Gardes gobelins',
  sh:{L:[74,158],R:[126,158]},
  poses:[{L:12,R:-10,sp:[0,0,10]},{L:24,R:-36,sp:[0,0,40],body:[-6,2,-6,1,1]},{L:18,R:-62,sp:[0,0,96],body:[-6,0,2,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const S='#d99a9a',SD='#b06e74',SN='#f0b4b4',M='#9aa3b5',MD='#646c80',LE='#7a5a3a',LED='#523a24';
    const P=[126,192] as const;
    const spear=`<rect x="${P[0]!-3.5}" y="${P[1]!-62}" width="7" height="92" rx="3" fill="#8a5a32" stroke="${O}" stroke-width="3"/><polygon points="${P[0]!},${P[1]!-84} ${P[0]!-8},${P[1]!-60} ${P[0]!+8},${P[1]!-60}" fill="${M}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${P[0]!-1} ${P[1]!-78} V${P[1]!-64}" stroke="#fff" stroke-width="2" opacity=".7"/><rect x="${P[0]!-8}" y="${P[1]!-62}" width="16" height="5" rx="2" fill="#c9283a" stroke="${O}" stroke-width="2"/>`;
    let b='';
    b+=`<g class="legA">${limb(88,190,88,202,LED,11)}</g><g class="legB">${limb(112,190,112,202,LED,11)}</g><ellipse cx="86" cy="205" rx="10" ry="5" fill="${O}"/><ellipse cx="114" cy="205" rx="10" ry="5" fill="${O}"/>`;
    b+=shaded(a=>`<path d="M62 198 C60 166 72 150 100 148 C128 150 140 166 138 198Z" ${a}/>`,LE,LED,-8,-4);
    b+=shaded(a=>`<path d="M72 156 Q100 148 128 156 L124 184 Q100 192 76 184Z" ${a}/>`,M,MD,-4,-4)+`<circle cx="100" cy="170" r="5" fill="${MD}" stroke="${O}" stroke-width="2"/>`;
    const ear=`<path d="M70 112 L52 98 L66 128Z" fill="${S}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=ear+mirror(ear);
    b+=shaded(a=>`<circle cx="100" cy="122" r="30" ${a}/>`,S,SD,-5,-5);
    b+=hoodShade(a=>`<circle cx="100" cy="122" r="30" ${a}/>`,100,124,.55);
    b+=x.byPose(p=>`<ellipse cx="88" cy="116" rx="4" ry="${p==1?2.4:4}" fill="#ff4f3a"/><ellipse cx="112" cy="116" rx="4" ry="${p==1?2.4:4}" fill="#ff4f3a"/><circle cx="89" cy="115" r="1.3" fill="#fff"/><circle cx="113" cy="115" r="1.3" fill="#fff"/><path d="M78 107 L94 112 M122 107 L106 112" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`
      +(p==2?`<path d="M88 140 Q100 136 112 140 Q108 150 100 150 Q92 150 88 140Z" fill="#5c0f22" stroke="${O}" stroke-width="3"/>`:`<path d="M90 142 Q100 138 110 142" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`));
    b+=`<ellipse cx="100" cy="130" rx="12" ry="8.5" fill="${SN}" stroke="${O}" stroke-width="3"/><ellipse cx="96" cy="130" rx="2" ry="3" fill="${SD}"/><ellipse cx="104" cy="130" rx="2" ry="3" fill="${SD}"/>`;
    b+=`<path d="M86 140 l-2 -7 l5 4Z M114 140 l2 -7 l-5 4Z" fill="#fff" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`;
    b+=shaded(a=>`<path d="M66 112 Q64 84 100 82 Q136 84 134 112Z" ${a}/>`,M,MD,-4,-4)+`<rect x="62" y="106" width="76" height="9" rx="4" fill="${MD}" stroke="${O}" stroke-width="3"/><path d="M100 84 V106" stroke="${MD}" stroke-width="3"/><polygon points="100,66 94,84 106,84" fill="${M}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`+gloss(82,92,6,3,-30,.6);
    b+=x.arm('L',(sx,sy)=>limb(sx,sy,sx,sy+28,LE,11)+hand(sx,sy+32,S,8));
    b+=x.arm('R',(sx,sy)=>limb(sx,sy,sx,sy+28,LE,11)+x.part('sp',P[0]!,P[1]!,spear)+hand(sx,sy+34,S,8));
    const [kx,ky]=held(this,'R','sp',2,[126,108],P);
    const fxg=x.when([2],`<g class="pop">${sparks(kx+4,ky,18,'#fff',6)}</g>`);
    return shadow(44,207,.18)+`<g class="${x.A?'walk':''}">${x.body(b)}</g>`+fxg;
  }
},
galactus:{
  id:'drone',name:'Drones cosmiques',
  poses:[{},{body:[0,-6,0,1.06,1.06]},{body:[-6,0,-6,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const S='#c9d0de',SD='#8c95ab',C='#6ff0ff',DK='#2a2b40';
    let b='';
    b+=`<path d="M88 160 L100 180 L112 160Z" fill="${SD}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`+x.byPose(p=>glow(100,186,p==1?16:11,C));
    const fin=`<path d="M70 126 L46 112 L52 140 L72 142Z" fill="${SD}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b+=fin+mirror(fin);
    b+=`<path d="M100 98 L104 78" stroke="${O}" stroke-width="4" stroke-linecap="round"/><g class="fx"><circle cx="104" cy="76" r="5" fill="#ff4fd8" stroke="${O}" stroke-width="2.5"/></g>`;
    b+=shaded(a=>`<circle cx="100" cy="130" r="32" ${a}/>`,S,SD,-6,-6)+gloss(84,110,9,5,-35,.7);
    b+=`<path d="M70 140 Q100 152 130 140" stroke="${SD}" stroke-width="3" fill="none"/>`;
    b+=`<ellipse cx="100" cy="128" rx="24" ry="15" fill="${DK}" stroke="${O}" stroke-width="3.5"/>`;
    b+=x.byPose(p=>`<g class="fx"><circle cx="100" cy="128" r="${p?16:12}" fill="${C}" opacity=".35"/></g><ellipse cx="100" cy="128" rx="10" ry="${p==1?5:9}" fill="${C}"/><circle cx="100" cy="128" r="3.5" fill="#fff"/>`);
    b+=`<path d="M76 114 L100 122 L124 114" stroke="${O}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    b+=x.when([1],sparks(100,128,30,C,8));
    const fxg=x.when([2],`<g class="grow" style="transform-origin:96px 128px">${beam(96,128,196,150,8,C)}</g><g class="pop">${burst(190,150,16,C)}</g>`);
    return shadow(30,207,.14)+`<g class="${x.A?'float':''}">${x.body(b)}</g>`+fxg;
  }
},
bouffon:{
  id:'citrouille',name:'Citrouilles volantes',
  poses:[{},{body:[0,0,0,1.1,1.1]},{body:[0,0,0,1,1]}],
  draw(this: CharDef, x: Ctx): string {
    const OR='#f28a2a',ORD='#c45e14',Y='#ffe23a',DK='#2f2a40';
    let b='';
    const wing=`<g class="flap" style="transform-origin:72px 130px"><path d="M72 130 Q50 104 30 112 Q38 120 34 128 Q44 124 46 134 Q54 128 58 138 Q64 130 72 136Z" fill="${DK}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/></g>`;
    let pk=wing+mirror(wing);
    pk+=shaded(a=>`<ellipse cx="80" cy="140" rx="20" ry="25" ${a}/>`,OR,ORD,-3,-3)+shaded(a=>`<ellipse cx="120" cy="140" rx="20" ry="25" ${a}/>`,OR,ORD,-3,-3)+shaded(a=>`<ellipse cx="100" cy="138" rx="22" ry="28" ${a}/>`,OR,ORD,-4,-4)+gloss(90,120,6,3,-30,.6);
    pk+=`<path d="M100 110 Q96 104 100 98" stroke="#3f7a22" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M100 98 Q112 92 112 82" stroke="${O}" stroke-width="3" fill="none"/>`;
    pk+=x.byPose(p=>sparks(113,80,p==1?16:10,Y,6));
    pk+=`<g class="fx"><path d="M78 130 L94 134 L84 142Z M122 130 L106 134 L116 142Z" fill="${Y}" opacity=".5" transform="translate(0 0)"/></g><path d="M78 130 L94 134 L84 142Z M122 130 L106 134 L116 142Z" fill="${Y}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    pk+=`<path d="M80 150 L86 156 L92 150 L100 158 L108 150 L114 156 L120 150 Q100 170 80 150Z" fill="${Y}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    b+=x.when([0,1],pk);
    const fxg=x.when([2],`<g class="ring"><circle cx="100" cy="138" r="54" fill="none" stroke="${OR}" stroke-width="6"/></g><g class="pop">${burst(100,138,46,OR,Y)}</g><g class="pop">${([[48,100,0],[156,96,40],[44,176,80],[160,180,120]] as const).map(([cx,cy,r])=>`<path d="M${cx} ${cy} l10 -4 l2 10 Z" fill="${OR}" stroke="${O}" stroke-width="3" stroke-linejoin="round" transform="rotate(${r} ${cx} ${cy})"/>`).join('')}</g><g class="pop">${txt(104,222,22,'#fff','BOUM !',-4)}</g>`);
    return x.when([0,1],shadow(30,207,.14))+`<g class="${x.A?'float':''}">${x.body(b)}</g>`+fxg;
  }
}};
