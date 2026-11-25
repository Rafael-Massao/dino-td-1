export const MAP_SCALE=1.30;
export const MAP_DINO_SCALE=.62;
export const FOOTPRINT=1.04;
export const AGES=['Bebê','Filhote','Juvenil','Subadulto','Adulto jovem','Adulto'];
export const GROWTH=[1,1.115,1.235,1.355,1.475,1.59];

const moves={
  scout:'bite',loop:'tail',cannon:'tail',quills:'sweep',frost:'breath',glue:'spit',
  sniper:'roar',sub:'bite',corsair:'tail',wing:'dive',pilot:'dive',mortar:'stomp',gunner:'roar',
  prism:'breath',super:'pounce',hive:'claw',brew:'spit',grove:'sweep',tide:'breath',
  farm:'gather',spikes:'dig',beacon:'call',engineer:'bite',handler:'pounce',
  lira:'pounce',brasa:'breath',tambor:'stomp',seiva:'sweep',mina:'gather',
  talho:'claw',iris:'pounce',ambar:'bite'
};

export const MOVES={
  bite:{duration:.61,hit:.53,reach:.76},
  pounce:{duration:.82,hit:.59,reach:.47},
  tail:{duration:.77,hit:.60,reach:.88},
  sweep:{duration:.70,hit:.57,reach:.78},
  claw:{duration:.57,hit:.55,reach:.64},
  dive:{duration:.78,hit:.55,reach:.51},
  stomp:{duration:.86,hit:.57,reach:0},
  roar:{duration:.66,hit:.53,reach:0},
  breath:{duration:.67,hit:.56,reach:0},
  spit:{duration:.57,hit:.60,reach:0},
  gather:{duration:1.10,hit:.63,reach:0},
  dig:{duration:.75,hit:.57,reach:0},
  call:{duration:.93,hit:.52,reach:0}
};

export function attackKind(type,stats,distance=0){
  if(stats.style==='mortar') return 'stomp';
  if(stats.style==='aimed'||(stats.network&&distance>stats.range)) return 'roar';
  if(stats.style==='forge'||stats.style==='tide') return 'breath';
  if(stats.style==='support') return stats.income?'gather':'call';
  if(stats.style==='trap') return 'dig';
  return moves[type];
}

const cap=n=>Math.max(0,Math.min(1,n));
export function ease(from,to,t){
  const p=cap((t-from)/(to-from));
  return p*p*(3-2*p);
}
const roll=(start,crest,end,t)=>ease(start,crest,t)*(1-ease(crest,end,t));

export function creatureFrame(kind,t,hit,sign=1){
  t=cap(t);
  const prep=roll(0,.20,hit,t);
  const strike=ease(.17,hit,t)*(1-ease(Math.min(.82,hit+.055),1,t));
  const landing=roll(hit-.045,hit+.055,hit+.20,t);
  const rise=Math.sin(Math.PI*cap((t-.16)/(hit-.15)));
  const jump=strike*.28+rise*.67;
  const recoil=roll(hit-.061,hit+.025,Math.min(1,hit+.25),t);
  const swing=sign*(strike-.31*prep);
  const pose={travel:0,lift:0,crouch:prep*.21+landing*.10,stretch:0,jaw:0,tail:0,turn:0,nod:0,lean:0,bank:0,paw:0,wing:0};
  switch(kind){
    case 'bite':
      return {...pose,travel:strike,lift:jump*.31,jaw:prep*.72+strike*.24-recoil*.26,nod:-prep*.14+recoil*.25,
        lean:strike*.14,tail:-swing*.29,paw:swing*.45,stretch:strike*.09};
    case 'pounce':
      return {...pose,travel:strike,lift:jump*.93,jaw:prep*.42+strike*.33-recoil*.23,nod:rise*-.28+recoil*.24,
        lean:rise*-.19+landing*.38,tail:-swing*.56,paw:rise*.80-swing*.19,stretch:rise*.17-landing*.12};
    case 'tail':
    case 'sweep':
      return {...pose,travel:strike,lift:jump*.41,turn:sign*(3.04*strike-.45*prep),tail:sign*(.28*recoil-.90*prep),
        bank:swing*.19,lean:prep*.15,nod:-swing*.13,jaw:recoil*.22,paw:swing*.57};
    case 'claw':
      return {...pose,travel:strike,lift:jump*.48,jaw:prep*.22,nod:strike*.19,tail:-swing*.47,
        bank:swing*.41,paw:swing*1.16,stretch:strike*.12};
    case 'dive':
      return {...pose,travel:strike,lift:-.23*strike+.68*rise,nod:strike*.38,stretch:strike*.13,
        jaw:prep*.27+strike*.42,lean:strike*.29-rise*.12,bank:swing*.23,tail:swing*.54,paw:strike*.43,
        wing:rise*.72-strike*.48+landing*.28};
    case 'stomp':
      return {...pose,lift:rise*.51,lean:-rise*.38+landing*.51,nod:-prep*.12+recoil*.58,jaw:recoil*.40,
        tail:swing*.56,stretch:rise*.11-landing*.21,paw:rise*.63};
    case 'roar':
    case 'call':
      return {...pose,jaw:Math.max(0,strike*.95+prep*.24+Math.sin(t*44)*strike*.043),
        nod:-strike*.38,lean:-strike*.19,stretch:strike*.20,tail:swing*.38,paw:prep*.18};
    case 'breath':
    case 'spit':
      return {...pose,jaw:prep*.24+strike*.71,nod:-prep*.28+recoil*.35,lean:recoil*.16,
        stretch:prep*.12-strike*.11,tail:swing*.38,paw:recoil*.21};
    case 'gather':
      return {...pose,nod:Math.sin(Math.PI*t)*.63,jaw:Math.max(0,Math.sin(t*23)*.29)*strike,
        lean:Math.sin(Math.PI*t)*.15,tail:swing*.36,paw:swing*.32};
    case 'dig':
      return {...pose,nod:prep*.22+strike*.23,lean:strike*.17,jaw:recoil*.26,paw:Math.sin(t*Math.PI*5)*strike*.87,
        tail:swing*.48,stretch:-landing*.07};
    default: return pose;
  }
}
