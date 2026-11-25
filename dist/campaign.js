import {TOWER_BY_ID} from './roster.js';
import {EXTRA_MAPS} from './maps-extra.js';
import {MAP_SCALE,FOOTPRINT,MOVES,attackKind} from './creature-motion.js';
export {ALL_UNITS,CATEGORIES,CATEGORY_BY_ID,HEROES,TOWERS,TOWER_BY_ID} from './roster.js';

const commonCoast = [
  [-12.25,1.1],[-11.88,-1.6],[-11.55,-3.8],[-9.72,-5.43],[-7.62,-6.68],[-5.94,-7.55],
  [-3.5,-7.84],[-1.35,-7.5],[.84,-8.17],[3.2,-7.65],[5.38,-7.9],[7.18,-7.18],
  [9.63,-7.04],[11.8,-5.75],[12.45,-3.51],[12.18,-1.57],[12.83,.45],[12.38,2.56],
  [11.45,4.18],[11.72,6.1],[9.72,7.29],[7.18,7.86],[5.08,8.28],[3.15,7.8],
  [1.34,8.27],[-.88,7.87],[-2.75,8.29],[-5.08,7.75],[-7.28,7.81],[-9.87,6.78],
  [-11.65,5.42],[-12.66,3.29]
];
const emeraldRoutes = [
  [[-14.9,2.85],[-10.35,2.85],[-8.01,2.6],[-6.54,1.29],[-6.64,-2.63],[-5.63,-4.45],
    [-3.55,-5.05],[-1.11,-4.61],[-.14,-3.13],[-.12,-.06],[.84,1.48],[2.67,1.87],
    [3.97,1.1],[4.25,-2.3],[5.25,-4.52],[7.29,-4.93],[8.87,-3.76],[9.05,-1.13],
    [8.9,1.75],[9.68,3.89],[11.46,4.2],[14.8,4.18]]
];
const mistRoutes = [
  [[-14.9,-2.8],[-10.9,-2.8],[-8.14,-3.81],[-5.01,-4.52],[-3.0,-2.83],[-3.35,.05],
    [-2.26,2.72],[.16,3.69],[4.52,3.34],[7.28,4.24],[10.78,4.3],[14.8,4.3]],
  [[7.29,-9.82],[7.29,-6.4],[5.94,-4.78],[3.17,-3.99],[.94,-2.73],[.86,-.58],
    [2.62,.88],[5.44,1.05],[6.96,2.26],[7.28,4.24],[10.78,4.3],[14.8,4.3]]
];

function scalePoint([x,z,...rest]){
  return [x*MAP_SCALE,z*MAP_SCALE,...rest];
}

function expandMap(map){
  return {
    ...map,scale:MAP_SCALE,
    coast:map.coast.map(scalePoint),
    islands:map.islands?.map(coast=>coast.map(scalePoint)),
    lagoons:map.lagoons?.map(coast=>coast.map(scalePoint)),
    routes:map.routes.map(route=>route.map(scalePoint)),
    starter:scalePoint(map.starter),
    entries:map.entries.map(scalePoint),
    exit:scalePoint(map.exit),
    rocks:map.rocks.map(rock=>({...rock,x:rock.x*MAP_SCALE,z:rock.z*MAP_SCALE,r:rock.r*1.12})),
    trees:map.trees.map(scalePoint),
    heights:map.heights.map(scalePoint),
    landmarks:map.landmarks.map(scalePoint),
    crossings:map.crossings?.map(bridge=>({...bridge,x:bridge.x*MAP_SCALE,z:bridge.z*MAP_SCALE,span:bridge.span*MAP_SCALE}))
  };
}

export const MAPS = [
  {
    id:'emerald', name:'Enseada Esmeralda', summary:'Uma rota sinuosa', seed:1947,
    routes:emeraldRoutes, coast:commonCoast, starter:[-3.3,-2.45],
    entries:[[-12.6,2.85]], exit:[12.75,4.19], style:'green',
    rocks:[{id:'moss-stone', x:-3.24,z:1.2,r:.77,cost:95}, {id:'east-stone',x:6.65,z:-1.0,r:.66,cost:80}],
    heights:[[-9.7,-4.8,1.1],[2.5,-6.0,.7],[10.35,-5.66,1.1]],
    trees:[[-10.75,-2.38,1.15],[-9.55,-4.4,1.09],[-8.72,-5.58,1.35],[-7.6,-6.2,.95],
      [-5.55,-6.45,1.22],[-3.6,-6.44,.86],[-2.43,-6.83,1.12],[.8,-6.73,1.12],[2.24,-6.25,1.33],
      [3.23,-6.51,.93],[5.47,-6.67,1.07],[7.14,-6.43,1.37],[8.45,-6.25,.95],[10.63,-4.04,1.06],
      [11.03,-2.53,1.35],[11.67,.29,1.11],[10.7,1.23,.9],[10.47,6.05,1.34],[8.92,6.6,.92],
      [6.33,6.84,1.05],[4.69,7.04,.93],[3.53,5.99,1.1],[1.28,6.67,1.24],[-.7,6.53,1.04],
      [-2.85,7.01,1.23],[-5.21,5.96,.94],[-7.63,5.61,1.14],[-9.22,4.91,1.07],[-11.47,4.08,.95],
      [-9.18,.01,.9],[1.8,-2.7,.76]],
    landmarks:[[-9.3,-1.82,'mill'],[7.61,5.93,'beacon'],[-3.28,4.75,'tent'],[5.54,-6.05,'farm']]
  },
  {
    id:'mist', name:'Ilhas da Névoa', summary:'Duas rotas · +230 ouro inicial', seed:2263, bonusGold:230, drift:.78,
    routes:mistRoutes, coast:commonCoast.map(([x,z],i)=>[x*(.98+.026*Math.sin(i*2)),z*(1+.034*Math.cos(i*3))]),
    starter:[-1.16,.79], entries:[[-12.7,-2.81],[7.29,-8.33]], exit:[12.75,4.3], style:'mist',
    rocks:[{id:'west-pillar',x:-6.6,z:-1.45,r:.8,cost:90},{id:'mist-pillar',x:4.78,z:-1.07,r:.76,cost:95},{id:'east-pillar',x:9.52,z:1.62,r:.9,cost:115}],
    heights:[[-9,-5.65,.82],[-2.8,-6.25,.93],[10.6,-3.8,1.15]],
    trees:[[-10.8,-.5,1.15],[-9.1,1.36,1.22],[-9.34,-5.44,1.35],[-7.75,-6.09,.9],
      [-5.55,-6.53,1.12],[-3.6,-6.13,.9],[-2.43,-6.58,1.12],[.8,-6.64,1.12],[2.24,-6.2,1.33],
      [3.7,-6.43,.93],[5.47,-6.6,1.08],[8.45,-5.91,.95],[9.51,-4.5,1.15],
      [11.08,-2.53,1.35],[11.49,-.63,1.1],[11.16,1.23,.9],[10.47,6.15,1.34],[8.87,6.6,.92],
      [6.33,6.84,1.05],[4.48,7.04,.93],[2.8,6.55,1.1],[1.28,6.67,1.24],[-.7,6.53,1.04],
      [-2.85,7.01,1.23],[-5.21,5.96,.94],[-7.63,5.61,1.14],[-9.22,4.91,1.07],[-11.47,4.08,.95]],
    landmarks:[[-7.7,2.04,'mill'],[8,5.8,'beacon'],[-4.45,4.71,'tent'],[9.92,-5.17,'farm']]
  },
  ...EXTRA_MAPS
].map(expandMap);

export const MODES = [
  {id:'classic',name:'Clássico',detail:'100 vidas · preços padrão',lives:100,gold:650,speed:1,price:1,xp:1},
  {id:'gale',name:'Vendaval',detail:'65 vidas · ondas mais velozes',lives:65,gold:1150,speed:1.1904,price:1.1,xp:1.25},
  {id:'last',name:'Última Vida',detail:'1 vida · mais ouro inicial e XP',lives:1,gold:2000,speed:1.017,price:1.15,xp:1.5}
];

export const XP_LIMITS = [0,0,0,70,140,230];
export const MAX_WAVE = 20;
export const ENEMIES = {
  red:{name:'Rubim',color:'#f36255',hp:1,speed:2.76,value:6,leak:1,desc:'Balão leve e fácil de estourar.'},
  yellow:{name:'Fagulha',color:'#ffd065',hp:1,speed:3.65,value:3,leak:2,children:['red'],desc:'Mais rápido. Libera um Rubim ao estourar.'},
  blue:{name:'Azulino',color:'#52cde8',hp:1,speed:3.08,value:4,leak:3,children:['yellow'],desc:'Carrega duas camadas de balões.'},
  green:{name:'Jade',color:'#aadb4f',hp:2,speed:2.92,value:7,leak:4,children:['blue'],desc:'Casca reforçada e três camadas inferiores.'},
  pink:{name:'Vespa-rosa',color:'#fb83bd',hp:1,speed:4.64,value:5,leak:3,children:['red','red'],desc:'Muito rápida. Dividirá em dois Rubins.'},
  lead:{name:'Liga',color:'#9baabd',hp:4,speed:1.92,value:12,leak:5,armor:true,children:['blue'],desc:'A casca metálica resiste a golpes comuns. Anquilossauro e Parasauro conseguem rompê-la.'},
  veil:{name:'Véu',color:'#b69be8',hp:2,speed:3.45,value:10,leak:5,hidden:true,children:['pink'],desc:'Visível a dinossauros com detecção e a aliados dentro da aura do Coritossauro.'},
  basalt:{name:'Basalto',color:'#4a445d',hp:3,speed:2.53,value:9,leak:5,immune:['blast'],children:['pink'],desc:'Resiste a abalos. Use mordidas, garradas ou sopros arcanos.'},
  chalk:{name:'Giz',color:'#ebede0',hp:3,speed:2.69,value:9,leak:5,immune:['frost'],children:['blue'],desc:'Imune a pulsos de gelo.'},
  stripe:{name:'Listrado',color:'#b0afbf',hp:5,speed:2.41,value:11,leak:5,immune:['frost','blast'],children:['red','blue'],desc:'Suas listras protegem contra gelo e abalos.'},
  opal:{name:'Opala',color:'#ca77cf',hp:5,speed:3.2,value:11,leak:5,immune:['arcane'],children:['red','yellow'],desc:'Absorve energia arcana. Use ataques físicos.'},
  clay:{name:'Terracota',color:'#e79057',hp:14,speed:2.47,value:18,leak:8,children:['green','green'],desc:'Casca espessa. Libera dois Jades.'},
  zeppelin:{name:'Zéfiro',color:'#488bd0',hp:90,speed:1.72,value:65,leak:22,airship:true,children:['clay','clay','blue'],desc:'Dirigível blindado com carga de Terracotas.'},
  boss:{name:'Nau-Titã',color:'#d45274',hp:370,speed:1.3,value:180,leak:150,airship:true,children:['zeppelin','veil','clay','clay'],desc:'Capitânia da frota. Transporta um Zéfiro e um grupo de balões.'}
};

export const WAVES = [
  [['red',14,.64]],
  [['red',16,.41],['yellow',7,.62]],
  [['yellow',15,.4],['blue',6,.62]],
  [['red',15,.27],['blue',14,.44],['green',5,.6]],
  [['blue',11,.31],['pink',11,.42],['green',8,.52]],
  [['lead',8,.74],['yellow',17,.26],['blue',10,.3]],
  [['pink',21,.27],['green',9,.38],['lead',7,.65]],
  [['veil',10,.57],['blue',18,.25],['pink',10,.31]],
  [['green',13,.28],['lead',9,.41],['chalk',3,.48],['veil',12,.33]],
  [['clay',7,.66],['blue',16,.22],['pink',18,.24]],
  [['lead',11,.48],['basalt',3,.42],['clay',9,.51],['veil',12,.31]],
  [['zeppelin',1,.65],['clay',9,.44],['green',19,.24]],
  [['pink',23,.19],['opal',3,.48],['veil',18,.3],['lead',14,.42]],
  [['clay',14,.39],['lead',15,.27],['zeppelin',2,3.4]],
  [['green',25,.18],['zeppelin',3,2.4],['veil',18,.24]],
  [['clay',18,.31],['stripe',3,.62],['veil',22,.16],['zeppelin',2,1.2]],
  [['lead',24,.22],['clay',19,.29],['zeppelin',3,1.9],['pink',24,.13]],
  [['zeppelin',4,1.7],['clay',22,.21],['veil',24,.18]],
  [['veil',27,.15],['lead',24,.22],['zeppelin',5,1.25],['clay',16,.2]],
  [['clay',14,.28],['veil',18,.16],['boss',1,.7],['zeppelin',4,1.8],['pink',24,.16]]
];

export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state,1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const pointDist = (x,z,node) => Math.hypot(x-node.x,z-node.z);
function curveValue(a,b,c,d,t){
  return .5 * ((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
}

export function buildRoute(points){
  let distance = 0;
  const samples = [];
  points.slice(0,-1).forEach((b,index)=>{
    const a=points[Math.max(index-1,0)], c=points[index+1], d=points[Math.min(index+2,points.length-1)];
    for(let step=0;step<14;step++){
      const t=step/14;
      const x=curveValue(a[0],b[0],c[0],d[0],t), z=curveValue(a[1],b[1],c[1],d[1],t);
      if (samples.length) distance+=pointDist(x,z,samples.at(-1));
      samples.push({x,z,d:distance});
    }
  });
  const [x,z]=points.at(-1);
  distance+=pointDist(x,z,samples.at(-1));
  samples.push({x,z,d:distance});
  return {samples,length:distance};
}

export function routePoint(route,dist){
  const {samples,length}=route;
  const distance=Math.max(0,Math.min(length,dist));
  let low=0, high=samples.length-1;
  while(high-low>1){
    const middle=(low+high)>>1;
    if(samples[middle].d<=distance) low=middle;
    else high=middle;
  }
  const a=samples[low], b=samples[high];
  const weight=(distance-a.d)/(b.d-a.d);
  return {x:a.x+(b.x-a.x)*weight,z:a.z+(b.z-a.z)*weight,angle:Math.atan2(b.x-a.x,b.z-a.z)};
}

export function isLand(coast,x,z){
  let inside=false;
  for(let i=0,j=coast.length-1;i<coast.length;j=i++){
    const [ax,az]=coast[i], [bx,bz]=coast[j];
    if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax) inside=!inside;
  }
  return inside;
}

export function isMapLand(map,x,z){
  const solid=isLand(map.coast,x,z)||map.islands?.some(coast=>isLand(coast,x,z));
  return Boolean(solid&&!map.lagoons?.some(coast=>isLand(coast,x,z)));
}

const lineGap = (x,z,a,b) => {
  const dx=b.x-a.x, dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-(a.x+t*dx),z-(a.z+t*dz));
};
const pathPrice = [115,190,315,530,850];
export const TARGETS = ['Primeiro','Último','Mais forte'];
export const FLIGHT_PATTERNS = ['Órbita','Oito','Trevo'];
export const FIELD_ITEMS = [
  {id:'nectar',name:'Néctar de vigília',price:100,desc:'Revela Véus por 10 segundos.'},
  {id:'sap',name:'Pote de seiva',price:125,desc:'Atrasa a frota por 5 segundos.'},
  {id:'fruit',name:'Fruto medicinal',price:155,desc:'Recupera até 3 vidas perdidas.'}
];
const MOTION_STYLES=new Set(['wing','pilot']);
const distanceOrder=(a,b)=>a.distance-b.distance;

export function towerStats(tower){
  const def=TOWER_BY_ID[tower.type];
  const stats={
    range:4, rate:1, damage:0, pierce:1, slow:0, duration:0, aura:0, auraDamage:0, auraRange:0,
    auraRadius:0, splash:0, style:'bolt', terrain:'land', channel:'physical', corrosion:0, knock:0,
    flightSpeed:5.6, trapLimit:4, sentryDamage:1, resale:.70, ...def.stats
  };
  const changes=tower.path==null?[]:def.paths[tower.path].changes.slice(0,tower.tier);
  for(const tier of changes){
    for(const [key,value] of Object.entries(tier)){
      stats[key]=typeof value==='number'?stats[key]+value:value;
    }
  }
  if(tower.level){
    const veteran=tower.level-1;
    if(stats.income) stats.income+=9*veteran;
    else {
      stats.damage+=Math.floor(veteran/3);
      stats.range+=Math.min(1.55,veteran*.08);
      stats.rate=Math.max(.24,stats.rate-veteran*.012);
    }
  }
  if(tower.bond){
    stats.damage+=tower.bond*3;
    stats.range+=tower.bond*.4;
  }
  for(const key of ['range','splash','auraRadius','auraRange','knock','flightSpeed']) stats[key]*=MAP_SCALE;
  return stats;
}

export class Defense {
  constructor({map=MAPS[0],mode=MODES[0],progress={},onEvent=()=>{}}={}){
    this.map=map;
    this.mode=mode;
    this.progress=progress;
    this.onEvent=onEvent;
    this.routes=map.routes.map(buildRoute);
    this.gold=mode.gold+(map.bonusGold||0)+(this.totalXP>=250?50:0);
    this.drift=mode.speed*(map.drift||1)*MAP_SCALE;
    this.lives=mode.lives;
    this.phase='prepare';
    this.wave=1;
    this.towers=[];
    this.enemies=[];
    this.attacks=[];
    this.traps=[];
    this.sentries=[];
    this.obstacles=map.rocks.map(rock=>({...rock}));
    this.queue=[];
    this.clock=0;
    this.time=0;
    this.serial=0;
    this.killCount=0;
    this.used=new Set();
    this.pointer=null;
    this.heroChoice=null;
    this.hero=null;
    this.revealUntil=0;
    this.placed('scout',...map.starter,0);
  }
  get totalXP(){return Object.values(this.progress).reduce((sum,value)=>sum+value,0);}
  get remaining(){return this.queue.length+this.enemies.length;}
  get globalVision(){return this.revealUntil>this.time||(this.hero?.type==='iris'&&this.hero.level>=8);}
  emit(type,detail={}){this.onEvent({type,...detail});}
  price(cost){return Math.round(cost*this.mode.price);}
  towerPrice(type){return this.price(TOWER_BY_ID[type].price);}
  clearPrice(rock){return this.price(rock.cost-(this.totalXP>=850?20:0));}
  canAct(){return this.phase!=='victory'&&this.phase!=='defeat';}
  onWater(x,z){return !isMapLand(this.map,x,z);}
  placement(x,z,type){
    if(!Number.isFinite(x)||!Number.isFinite(z)) return 'Escolha um lugar no mapa.';
    const terrain=TOWER_BY_ID[type]?.stats.terrain||'land';
    const wet=this.onWater(x,z);
    if(terrain==='water'&&!wet) return 'Este dinossauro precisa de água.';
    if(terrain==='land'&&wet) return 'Este dinossauro precisa de terra firme.';
    if(wet&&(Math.abs(x)>16.1*MAP_SCALE||Math.abs(z)>10.15*MAP_SCALE)) return 'Escolha água perto da ilha.';
    const edges=[[-.39,0],[.39,0],[0,-.39],[0,.39]];
    if(edges.some(([dx,dz])=>this.onWater(x+dx,z+dz)!==wet)) return 'Deixe espaço entre a margem e o dinossauro.';
    if(this.routes.some(route=>route.samples.some(point=>pointDist(x,z,point)<1.24*MAP_SCALE))) return wet?'Deixe a ponte livre.':'Deixe a trilha livre.';
    if(this.towers.some(tower=>pointDist(x,z,tower)<FOOTPRINT)) return 'Já existe uma torre aqui.';
    if(this.obstacles.some(rock=>pointDist(x,z,rock)<rock.r+.39)) return 'Remova o obstáculo primeiro.';
    if(this.map.trees.some(([tx,tz,s])=>Math.hypot(x-tx,z-tz)<s*.60+.39)) return 'Escolha uma área aberta.';
    if(this.map.landmarks.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<1.22)) return 'Escolha uma área aberta.';
    return '';
  }
  chooseHero(type){
    if(!this.canAct()||this.heroChoice||!TOWER_BY_ID[type]?.hero) return false;
    this.heroChoice=type;
    this.emit('hero-choice');
    return true;
  }
  nearestRoutePoint(source){
    let best=null, gap=Infinity;
    for(const route of this.routes){
      for(const point of route.samples){
        if(this.onWater(point.x,point.z)) continue;
        const dist=pointDist(source.x,source.z,point);
        if(dist<gap){best=point;gap=dist;}
      }
    }
    return {x:best?.x??source.x,z:best?.z??source.z};
  }
  placed(type,x,z,spent){
    const def=TOWER_BY_ID[type];
    const tower={id:++this.serial,type,x,z,spent,tier:0,path:null,aim:0,wait:0,wet:this.onWater(x,z),focus:this.nearestRoutePoint({x,z}),
      control:'cursor',pattern:0,bond:0,motion:{x,z,y:1.8},sentryAt:0,nextAbility:0,boostUntil:0,vouchers:0};
    if(def.hero){
      tower.level=1;
      this.hero=tower;
    }
    tower.stats=towerStats(tower);
    this.towers.push(tower);
    if((this.phase==='battle'||this.phase==='paused')&&!tower.level) this.used.add(type);
    return tower;
  }
  build(type,x,z){
    const def=TOWER_BY_ID[type];
    if(!this.canAct()||!def) return {error:'Selecione um dinossauro disponível.'};
    if(def.hero&&(this.hero||this.heroChoice!==type)) return {error:'Use o herói escolhido para esta partida.'};
    const error=this.placement(x,z,type);
    if(error) return {error};
    const price=this.towerPrice(type);
    if(this.gold<price) return {error:'Ouro insuficiente.'};
    const tower=this.placed(type,x,z,price);
    this.gold-=price;
    this.emit('build',{tower});
    return {tower};
  }
  clearRock(id){
    const rock=this.obstacles.find(obstacle=>obstacle.id===id);
    if(!rock||!this.canAct()) return false;
    const price=this.clearPrice(rock);
    if(this.gold<price) return false;
    this.gold-=price;
    this.obstacles=this.obstacles.filter(obstacle=>obstacle!==rock);
    this.emit('clear',{rock});
    return true;
  }
  upgradeInfo(tower,path){
    const spec=TOWER_BY_ID[tower.type].paths[path];
    if(!spec||tower.tier>=5||(tower.path!==null&&tower.path!==path)) return null;
    const level=tower.tier+1;
    return {spec,level,price:this.price(pathPrice[level-1]*spec.price),xp:XP_LIMITS[level]};
  }
  upgradeTower(tower,path){
    if(!this.towers.includes(tower)||!this.canAct()) return false;
    const next=this.upgradeInfo(tower,path);
    if(!next||this.gold<next.price||(this.progress[tower.type]||0)<next.xp) return false;
    this.gold-=next.price;
    tower.spent+=next.price;
    tower.tier=next.level;
    tower.path=path;
    tower.stats=towerStats(tower);
    this.emit('upgrade',{tower});
    return true;
  }
  resale(tower){return Math.round(tower.spent*tower.stats.resale);}
  dismiss(tower){
    this.towers=this.towers.filter(unit=>unit!==tower);
    this.cancelAttacks(tower);
    for(const sentry of this.sentries.filter(unit=>unit.owner===tower)) this.removeSentry(sentry);
    for(const trap of this.traps.filter(unit=>unit.owner===tower)) this.removeTrap(trap);
    this.emit('sell',{tower});
  }
  sell(tower){
    if(!this.canAct()||tower.level||!this.towers.includes(tower)) return false;
    this.gold+=this.resale(tower);
    this.dismiss(tower);
    return true;
  }
  partner(tower){
    if(tower.type!=='handler'||tower.bond>=3) return null;
    return this.towers.find(other=>other!==tower&&other.type===tower.type&&other.wet===tower.wet&&
      tower.bond+other.bond<3&&pointDist(tower.x,tower.z,other)<=3.6*MAP_SCALE);
  }
  fuse(tower){
    if(!this.canAct()||!this.towers.includes(tower)) return false;
    const partner=this.partner(tower);
    if(!partner) return false;
    tower.bond+=1+partner.bond;
    tower.spent+=partner.spent;
    this.dismiss(partner);
    tower.stats=towerStats(tower);
    this.emit('upgrade',{tower});
    return true;
  }
  focusTower(tower,x,z){
    if(!this.canAct()||!this.towers.includes(tower)||!Number.isFinite(x)||!Number.isFinite(z)) return false;
    tower.focus={x:Math.max(-16*MAP_SCALE,Math.min(16*MAP_SCALE,x)),z:Math.max(-10*MAP_SCALE,Math.min(10*MAP_SCALE,z))};
    tower.control='point';
    return true;
  }
  buffsFor(tower){
    const result={has:false,detect:false,rate:0,damage:0,range:0};
    if(tower.stats?.style==='support') return result;
    const position=tower.owner||tower;
    for(const ally of this.towers){
      if(ally===tower||(!ally.stats.aura&&!ally.stats.auraDamage&&!ally.stats.auraRange)) continue;
      if(pointDist(position.x,position.z,ally)>(ally.stats.auraRadius||ally.stats.range)) continue;
      result.has=true;
      result.detect ||= Boolean(ally.stats.auraDetect);
      result.rate=Math.max(result.rate,ally.stats.aura);
      result.damage=Math.max(result.damage,ally.stats.auraDamage);
      result.range=Math.max(result.range,ally.stats.auraRange);
    }
    return result;
  }
  toggleWave(){
    if(this.phase==='battle'){this.phase='paused';this.emit('phase');return;}
    if(this.phase==='paused'){this.phase='battle';this.emit('phase');return;}
    if(this.phase!=='prepare') return;
    let at=.65;
    let order=0;
    this.queue=WAVES[this.wave-1].flatMap(([id,count,gap])=>Array.from({length:count},()=>{
      const route=order++%this.routes.length;
      const spawn={id,route,at};
      at+=gap;
      return spawn;
    }));
    this.used=new Set(this.towers.filter(tower=>!tower.level).map(tower=>tower.type));
    this.clock=0;
    this.phase='battle';
    this.emit('wave',{wave:this.wave});
  }
  spawn(type,route,progress=0,lane=0){
    const def=ENEMIES[type];
    const spot=routePoint(this.routes[route],progress);
    const enemy={id:++this.serial,type,def,route,progress,lane,...spot,hp:def.hp,slow:0,chill:0,acid:0,acidTime:0,acidIn:0,
      stripped:false,trappedUntil:0,dead:false};
    this.enemies.push(enemy);
    this.emit('spawn',{enemy});
  }
  aimPoint(tower){
    return (tower.control==='cursor'&&this.pointer)||tower.focus;
  }
  origin(tower){
    return MOTION_STYLES.has(tower.stats.motion)?tower.motion:tower;
  }
  fly(tower,dt){
    const t=this.time*1.45+tower.id*.45;
    const model=tower.stats.motion;
    let anchor=tower;
    if(model==='pilot') anchor=this.aimPoint(tower);
    const radius=(model==='pilot'?(tower.control==='point' ? .95 : 0):2.72)*MAP_SCALE;
    const mode=tower.pattern;
    const x=anchor.x+Math.cos(t)*radius;
    const z=anchor.z+Math.sin(mode===1?t*2:t)*radius*(mode===2?.62+.36*Math.cos(t*3):1);
    const current=tower.motion;
    const dist=pointDist(x,z,current);
    const v=Math.min(1,dt*tower.stats.flightSpeed/Math.max(.001,dist));
    current.x+=(x-current.x)*v;
    current.z+=(z-current.z)*v;
    current.y=2.15+.31*Math.sin(t*2);
  }
  canSee(tower,enemy,buffs,origin=this.origin(tower)){
    if(enemy.def.hidden&&!enemy.stripped&&!tower.stats.detect&&!buffs.detect&&!this.globalVision) return false;
    if(tower.stats.lob) return true;
    return !this.obstacles.some(rock=>lineGap(rock.x,rock.z,origin,enemy)<rock.r*.9);
  }
  eligible(tower,enemy,buffs,origin){
    if(enemy.dead) return false;
    if(pointDist(origin.x,origin.z,enemy)<=tower.stats.range+buffs.range&&this.canSee(tower,enemy,buffs,origin)) return true;
    return tower.stats.network&&this.towers.some(ally=>ally!==tower&&ally.stats.range<35*MAP_SCALE&&
      pointDist(ally.x,ally.z,enemy)<=ally.stats.range&&this.canSee(ally,enemy,this.buffsFor(ally)));
  }
  immune(enemy,stats){
    return enemy.def.immune?.includes(stats.channel)||Boolean(enemy.def.armor&&!stats.armor);
  }
  hit(enemy,power){
    if(enemy.dead||power<=0) return;
    enemy.hp-=power;
    if(enemy.hp>0){this.emit('hit',{enemy});return;}
    enemy.dead=true;
    this.gold+=enemy.def.value;
    this.killCount++;
    this.emit('pop',{enemy});
    enemy.def.children?.forEach((type,index)=>{
      this.spawn(type,enemy.route,Math.max(0,enemy.progress-index*.45*MAP_SCALE),Math.max(-.31,Math.min(.31,enemy.lane+(index%2 ? .17 : -.1))));
    });
  }
  affect(enemy,stats,buffs){
    if(enemy.dead) return;
    if(this.immune(enemy,stats)){
      this.emit('deflect',{enemy});
      return;
    }
    if(stats.slow){
      enemy.slow=Math.max(enemy.slow,stats.slow);
      enemy.chill=Math.max(enemy.chill,stats.duration);
    }
    if(stats.corrosion){
      enemy.acid=Math.max(enemy.acid,stats.corrosion);
      enemy.acidTime=Math.max(enemy.acidTime,stats.duration||2.5);
    }
    if(stats.strip) enemy.stripped=true;
    if(stats.knock&&!enemy.def.airship) enemy.progress=Math.max(0,enemy.progress-stats.knock);
    this.hit(enemy,stats.damage+buffs.damage);
  }
  visibleSplash(enemy,stats,buffs){
    return !enemy.def.hidden||enemy.stripped||stats.detect||buffs.detect||this.globalVision;
  }
  impact(tower,point,stats,buffs,targets,attack){
    if(!targets){
      const radius=stats.splash||1.65*MAP_SCALE;
      const nearby=(stats.splash||stats.pierce>1)?this.enemies.filter(unit=>unit!==point&&!unit.dead&&
        pointDist(point.x,point.z,unit)<=radius&&this.visibleSplash(unit,stats,buffs)):[];
      targets=[...(point.def&&!point.dead?[point]:[]),...(stats.splash?nearby:nearby.slice(0,stats.pierce-1))];
    }
    this.emit('impact',{tower,enemy:point,targets,stats,attack});
    for(const unit of targets) this.affect(unit,stats,buffs);
  }
  startAttack(tower,origin,target,stats,buffs,options={}){
    if(tower.attack) this.cancelAttacks(tower);
    const kind=options.kind||attackKind(tower.type,stats,pointDist(origin.x,origin.z,target));
    const move=MOVES[kind];
    const duration=options.duration||Math.min(move.duration,Math.max(.125,tower.wait*.97));
    const attack={
      tower,kind,target,stats,buffs,duration,hit:move.hit,elapsed:0,resolved:false,
      origin:{x:origin.x,z:origin.z,y:origin.y||0},sign:tower.id%2?-1:1,
      targets:options.targets,extraTargets:options.extraTargets,trap:options.trap
    };
    tower.attack=attack;
    this.attacks.push(attack);
    this.emit('attack-start',{tower,attack});
  }
  resolveAttack(attack){
    const {tower,stats,buffs,trap}=attack;
    if(trap){
      this.layTrap(tower);
      return;
    }
    let target=attack.target;
    if(target.dead&&!attack.targets){
      const x=target.x,z=target.z;
      target=this.enemies.find(enemy=>!enemy.dead&&pointDist(x,z,enemy)<=1.13*MAP_SCALE&&this.visibleSplash(enemy,stats,buffs))||target;
    }
    attack.target=target;
    this.impact(tower,target,stats,buffs,attack.targets,attack);
    for(const secondary of attack.extraTargets||[]){
      if(!secondary.dead) this.impact(tower,secondary,stats,buffs,undefined,attack);
    }
  }
  stepAttacks(dt){
    this.attacks=this.attacks.filter(attack=>{
      attack.elapsed=Math.min(attack.duration,attack.elapsed+dt);
      if(!attack.resolved&&attack.elapsed>=attack.duration*attack.hit){
        attack.resolved=true;
        this.resolveAttack(attack);
      }
      if(attack.elapsed<attack.duration) return true;
      if(attack.tower.attack===attack) attack.tower.attack=null;
      return false;
    });
  }
  cancelAttacks(tower){
    this.attacks=this.attacks.filter(attack=>{
      if(tower&&tower!==attack.tower) return true;
      attack.tower.attack=null;
      return false;
    });
  }
  fire(tower,dt){
    const stats=tower.stats;
    if(stats.style==='support') return;
    tower.wait=Math.max(0,tower.wait-dt);
    if(tower.wait>0||tower.attack) return;
    const origin=this.origin(tower), buffs=this.buffsFor(tower);
    const rate=(stats.crowd?Math.min(1.6,this.enemies.length*.021):0)+(tower.boostUntil>this.time ? .65 : 0)+buffs.rate;
    const recharge=stats.rate/(1+rate);
    if(stats.style==='trap'){
      if(this.traps.filter(trap=>trap.owner===tower).length>=stats.trapLimit) return;
      tower.wait=stats.rate;
      this.startAttack(tower,origin,tower.focus,stats,buffs,{trap:true});
      return;
    }
    if(stats.style==='mortar'){
      tower.wait=recharge;
      this.startAttack(tower,origin,tower.focus,stats,buffs);
      return;
    }
    const choose=[
      (a,b)=>b.progress/this.routes[b.route].length-a.progress/this.routes[a.route].length,
      (a,b)=>a.progress/this.routes[a.route].length-b.progress/this.routes[b.route].length,
      (a,b)=>b.hp-a.hp
    ][tower.aim];
    let candidates=this.enemies.filter(unit=>this.eligible(tower,unit,buffs,origin)).sort(choose);
    if(stats.style==='aimed'){
      const focus=this.aimPoint(tower);
      const dx=focus.x-tower.x,dz=focus.z-tower.z;
      const length=Math.hypot(dx,dz)||1;
      const end={x:tower.x+dx/length*stats.range,z:tower.z+dz/length*stats.range};
      candidates=candidates.filter(unit=>lineGap(unit.x,unit.z,origin,end)<.55*MAP_SCALE)
        .sort((a,b)=>pointDist(origin.x,origin.z,a)-pointDist(origin.x,origin.z,b));
    }
    const enemy=candidates[0];
    if(!enemy) return;
    tower.wait=recharge;
    const options={};
    if(stats.style==='burst') options.targets=candidates;
    if(stats.style==='aimed') options.targets=candidates.slice(0,stats.pierce);
    if(stats.flanks){
      const second=candidates.find(unit=>(unit.x-origin.x)*(enemy.x-origin.x)+(unit.z-origin.z)*(enemy.z-origin.z)<0);
      if(second) options.extraTargets=[second];
    }
    this.startAttack(tower,origin,enemy,stats,buffs,options);
  }
  layTrap(tower){
    const {focus,stats}=tower;
    const pile=this.traps.filter(trap=>trap.owner===tower).length;
    const candidates=this.routes.flatMap(route=>route.samples.filter((point,index)=>
      index%12===0&&pointDist(tower.x,tower.z,point)<stats.range&&isMapLand(this.map,point.x,point.z)));
    const choice=candidates[pile%candidates.length]||focus;
    const trap={id:++this.serial,x:choice.x,z:choice.z,owner:tower,charges:stats.charges,stats,wave:this.wave};
    this.traps.push(trap);
    this.emit('trap',{trap});
  }
  removeTrap(trap){
    this.traps=this.traps.filter(unit=>unit!==trap);
    this.emit('trap-end',{trap});
  }
  triggerTraps(){
    for(const trap of this.traps){
      for(const enemy of this.enemies.slice()){
        if(enemy.dead||this.time<enemy.trappedUntil||pointDist(trap.x,trap.z,enemy)>.58*MAP_SCALE) continue;
        enemy.trappedUntil=this.time+.25;
        this.affect(enemy,trap.stats,{damage:0});
        trap.charges--;
        if(!trap.charges){this.removeTrap(trap);break;}
      }
    }
  }
  addSentry(owner){
    if(owner.sentryAt>this.time||!this.enemies.length) return;
    if(this.sentries.filter(sentry=>sentry.owner===owner).length>=owner.stats.sentries) return;
    const angle=this.serial*2.399;
    owner.sentryAt=this.time+3.6;
    const stats={...owner.stats,style:'bolt',range:3.3*MAP_SCALE,rate:.58,damage:owner.stats.sentryDamage};
    const tower={id:++this.serial,type:'scout',x:owner.x+Math.cos(angle)*.99,z:owner.z+Math.sin(angle)*.99,
      isSentry:true,owner,age:this.time+17+owner.tier*1.5,stats,aim:0,wait:.3};
    this.sentries.push(tower);
    this.emit('sentry',{tower});
  }
  removeSentry(tower){
    this.sentries=this.sentries.filter(sentry=>sentry!==tower);
    this.cancelAttacks(tower);
    this.emit('sentry-end',{tower});
  }
  heroStatus(){
    const hero=this.hero;
    if(!hero||hero.level<3) return {ready:false,seconds:0};
    const seconds=Math.max(0,Math.ceil(hero.nextAbility-this.time));
    return {ready:seconds===0&&this.phase==='battle',seconds};
  }
  activateHero(){
    if(!this.heroStatus().ready) return false;
    const tower=this.hero, ability=TOWER_BY_ID[tower.type].ability, level=tower.level;
    const power=4+Math.floor(level*.7);
    const targets=this.enemies.filter(enemy=>!enemy.dead).sort((a,b)=>b.progress-a.progress);
    const supported=['vision','stash','voucher'];
    const near=targets.filter(enemy=>pointDist(tower.x,tower.z,enemy)<=tower.stats.range+1.55*MAP_SCALE);
    if(!supported.includes(ability.kind)&&!targets.length) return false;
    if(['flame','slash'].includes(ability.kind)&&!near.length) return false;
    tower.nextAbility=this.time+ability.cooldown;
    const hit=(group,kind,channel,damage,extra={})=>{
      if(!group.length) return;
      const stats={...tower.stats,armor:true,channel,damage,...extra};
      const buffs={damage:0,detect:true};
      tower.wait=Math.max(tower.wait,MOVES[kind].duration);
      this.startAttack(tower,this.origin(tower),group[0],stats,buffs,{kind,targets:group,duration:MOVES[kind].duration});
    };
    switch(ability.kind){
      case 'amber-roar': hit(targets.slice(0,8+Math.floor(level/5)),'roar','physical',power); break;
      case 'flame': hit(near,'breath','arcane',power,{corrosion:2+Math.floor(level/3),duration:5}); break;
      case 'quake':
        tower.wait=Math.max(tower.wait,MOVES.stomp.duration);
        this.startAttack(tower,this.origin(tower),targets[0],{...tower.stats,damage:power,splash:1.8*MAP_SCALE},
          {damage:0,detect:true},{kind:'stomp',duration:MOVES.stomp.duration,extraTargets:targets.slice(1,3+Math.floor(level/4))});
        break;
      case 'roots': hit(targets,'roar','arcane',power*.5,{slow:.69,duration:5,knock:1.33*MAP_SCALE}); break;
      case 'stash':
        this.gold+=65+level*7;
        this.lives=Math.min(this.mode.lives,this.lives+2);
        break;
      case 'slash':
        hit(near,'claw','physical',power+2);
        tower.boostUntil=this.time+8;
        break;
      case 'vision': this.revealUntil=Math.max(this.revealUntil,this.time+12); break;
      case 'voucher': tower.vouchers=Math.min(3,tower.vouchers+1); break;
    }
    this.emit('ability',{tower,ability});
    return true;
  }
  buyItem(id){
    const hero=this.hero;
    const item=FIELD_ITEMS.find(entry=>entry.id===id);
    if(!item||hero?.type!=='ambar'||!this.canAct()) return false;
    if(id==='sap'&&this.phase!=='battle') return false;
    if(id==='fruit'&&this.lives>=this.mode.lives) return false;
    if(id==='nectar'&&this.phase!=='battle') return false;
    const price=hero.vouchers?0:this.price(item.price);
    if(this.gold<price) return false;
    if(hero.vouchers) hero.vouchers--;
    this.gold-=price;
    if(id==='nectar') this.revealUntil=Math.max(this.revealUntil,this.time+10);
    if(id==='sap'){
      for(const enemy of this.enemies) {
        enemy.slow=Math.max(enemy.slow,.68);
        enemy.chill=Math.max(enemy.chill,5);
      }
    }
    if(id==='fruit') this.lives=Math.min(this.mode.lives,this.lives+3);
    this.emit('item',{tower:hero,item});
    return true;
  }
  step(dt){
    if(this.phase!=='battle') return;
    this.clock+=dt;
    this.time+=dt;
    while(this.queue[0]?.at<=this.clock){
      const queued=this.queue.shift();
      this.spawn(queued.id,queued.route,0,(this.serial%5-2)*.095);
    }
    for(const enemy of this.enemies){
      if(enemy.dead) continue;
      if(enemy.acidTime>0){
        enemy.acidTime-=dt;
        enemy.acidIn-=dt;
        if(enemy.acidIn<=0){
          this.hit(enemy,enemy.acid);
          enemy.acidIn=.64;
          if(enemy.dead) continue;
        }
      } else {
        enemy.acid=0;
      }
      enemy.chill=Math.max(0,enemy.chill-dt);
      if(enemy.chill===0) enemy.slow=0;
      enemy.progress+=enemy.def.speed*this.drift*(1-enemy.slow)*dt;
      if(enemy.progress>=this.routes[enemy.route].length){
        enemy.dead=true;
        this.lives=Math.max(0,this.lives-enemy.def.leak);
        this.emit('leak',{enemy});
      } else {
        Object.assign(enemy,routePoint(this.routes[enemy.route],enemy.progress));
      }
    }
    if(this.lives<=0){
      this.phase='defeat';
      this.cancelAttacks();
      this.emit('end',{won:false});
      return;
    }
    this.stepAttacks(dt);
    this.triggerTraps();
    for(const tower of this.towers){
      if(tower.stats.motion) this.fly(tower,dt);
      if(tower.stats.sentries) this.addSentry(tower);
      this.fire(tower,dt);
    }
    for(const sentry of this.sentries){
      if(sentry.age<this.time) this.removeSentry(sentry);
      else this.fire(sentry,dt);
    }
    this.enemies=this.enemies.filter(enemy=>!enemy.dead);
    if(this.remaining===0) this.completeWave();
  }
  completeWave(){
    this.cancelAttacks();
    const wave=this.wave;
    for(const trap of this.traps.filter(unit=>wave-unit.wave>=1)) this.removeTrap(trap);
    const income=this.towers.reduce((sum,tower)=>sum+(tower.stats.income||0),0);
    const gain=100+wave*13+income+(this.totalXP>=1650?18:0);
    this.gold+=gain;
    for(const type of this.used) this.progress[type]=(this.progress[type]||0)+Math.round((24+wave*4)*this.mode.xp);
    if(this.hero&&this.hero.level<20){
      const hero=this.hero;
      hero.level++;
      const tier=Math.min(5,Math.floor(hero.level/4));
      const evolved=tier!==hero.tier;
      hero.tier=tier;
      hero.stats=towerStats(hero);
      this.emit('hero-level',{tower:hero,evolved});
    }
    if(wave===MAX_WAVE){
      this.phase='victory';
      this.emit('complete',{wave,gain});
      this.emit('end',{won:true});
    } else {
      this.wave++;
      this.phase='prepare';
      this.emit('complete',{wave,gain});
    }
  }
}
