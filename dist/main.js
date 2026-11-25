import {CATEGORIES,Defense,ENEMIES,FIELD_ITEMS,FLIGHT_PATTERNS,HEROES,MAPS,MODES,TARGETS,TOWER_BY_ID,TOWERS,WAVES,XP_LIMITS} from './campaign.js';
import {icon,setIcon} from './icons.js';
import {Sound} from './audio.js';
import {World} from './world.js';
import {createPortraits} from './models.js';
import {EVOLUTION_DESIGNS,EVOLUTION_PARTS} from './evolution-designs.js';
import {BIOMES} from './biomes.js';
import {AGES,FOOTPRINT,MAP_SCALE} from './creature-motion.js';

const $=id=>document.getElementById(id);
const put=(id,text)=>{if($(id).textContent!==String(text)) $(id).textContent=text;};
const cash=new Intl.NumberFormat('pt-BR').format;
const dialog=$('dialog'), content=$('dialog-content'), viewport=$('viewport'), shop=$('shop'), inspector=$('inspector');
const saveKey='guarda-das-ilhas-v1';
const defaults={sound:true,music:true,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,auto:false};
let stored={};
try {stored=JSON.parse(localStorage.getItem(saveKey)||'{}')||{};} catch {}
const settings={...defaults};
for(const key of Object.keys(defaults)){
  if(typeof stored.settings?.[key]==='boolean') settings[key]=stored.settings[key];
}
const progress=Object.fromEntries(TOWERS.map(({id})=>[id,Math.max(0,Number(stored.progress?.[id])||0)]));
const audio=new Sound(settings);
let world,game,selected=null,placing=null,cursor=null,press=null,markers=[],aiming=null;
let portrait=()=>'',category='primary',heroCandidate=HEROES[0];
const categoryPicker=$('category-picker'), heroButton=$('hero-button'), abilityButton=$('hero-ability');
const arsenal=$('arsenal'), arsenalButton=$('arsenal-button'), fullscreenButton=$('fullscreen-button');
const compact=matchMedia('(max-width: 775px)');
let arsenalOpen=!compact.matches;
let speed=1,toastTimer,autoTimer,uiDirty=true,inspectorDirty=true;
let dialogScreen=null;
const cards=new Map();
const availableMap=MAPS.find(map=>map.id===stored.map)||MAPS[0];
const availableMode=MODES.find(mode=>mode.id===stored.mode)||MODES[0];

for(const node of document.querySelectorAll('[data-icon]')) setIcon(node,node.dataset.icon);

function save(){
  try {
    localStorage.setItem(saveKey,JSON.stringify({map:game.map.id,mode:game.mode.id,settings,progress}));
  } catch {}
}
function toast(text,error=false){
  const element=$('toast');
  element.hidden=false;
  element.classList.toggle('error',error);
  element.textContent=text;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>element.hidden=true,2450);
}
function showDialog(kind,title,markup){
  dialogScreen=kind;
  dialog.classList.toggle('hero-dialog',kind==='heroes');
  dialog.classList.toggle('evolution-dialog',kind==='evolutions');
  dialog.classList.toggle('map-dialog',kind==='maps');
  put('dialog-heading',title);
  content.innerHTML=markup;
  if(!dialog.open) dialog.showModal();
}
function closeDialog(){
  if(dialog.open) dialog.close();
  dialogScreen=null;
}
function handleEvent(event){
  world?.handle(event);
  audio.play(event);
  if(!['fire','projectile','projectile-end','spawn','hit','impact','deflect'].includes(event.type)) uiDirty=true;
  if(['build','upgrade','sell','clear','hero-level','item','ability','wave','phase'].includes(event.type)){
    inspectorDirty=true;
    world?.refreshRange();
  }
  if(event.type==='wave') clearTimeout(autoTimer);
  if(event.type==='complete'){
    inspectorDirty=true;
    save();
    toast('Onda '+event.wave+' concluída · +'+cash(event.gain)+' ouro');
    if(settings.auto&&game.phase==='prepare'){
      const current=game;
      const round=game.wave;
      autoTimer=setTimeout(()=>{
        if(current===game&&round===game.wave&&game.phase==='prepare'&&!dialog.open) action();
      },2300);
    }
  }
  if(event.type==='end'){
    clearPlacement();
    aiming=null;
    setTimeout(()=>{if(game.phase==='defeat'||game.phase==='victory') showEnd(event.won);},600);
  }
}

function newGame(map,mode){
  clearTimeout(autoTimer);
  clearTimeout(toastTimer);
  $('toast').hidden=true;
  selected=placing=cursor=aiming=null;
  viewport.classList.remove('placing');
  game=new Defense({map,mode,progress,onEvent:handleEvent});
  world?.setGame(game);
  if(world) world.reduced=settings.reduced;
  fitBoard();
  speed=1;
  $('speed-button').setAttribute('aria-label','Velocidade 1 vez. Clique para mudar.');
  setMarkers();
  put('map-name',map.name);
  put('mode-name',mode.name);
  inspectorDirty=uiDirty=true;
  if(world) syncUI();
  save();
}

function fitBoard(){
  if(!world) return;
  const area=viewport.getBoundingClientRect();
  const {height,width}=area;
  const bounds=selector=>document.querySelector(selector)?.getBoundingClientRect?.();
  const mission=bounds('.mission-head');
  const panel=arsenalOpen?arsenal.getBoundingClientRect?.():null;
  const dock=bounds('.control-deck');
  const tools=bounds('.stage-bottom');
  const surfaceBottom=compact.matches&&panel?.top!==undefined?panel.top:Math.min(dock?.top??Infinity,tools?.top??Infinity);
  const right=!compact.matches&&panel?.left!==undefined?Math.max(0,area.left+width-panel.left)+16:12;
  world.setInsets({
    top:Math.min(height*.38,Math.max(0,(mission?.bottom??area.top)-area.top+(mission?9:0))),
    bottom:Math.min(height*.45,Number.isFinite(surfaceBottom)?Math.max(0,area.top+height-surfaceBottom)+9:0),
    left:12,right
  });
}
function setArsenal(open){
  arsenalOpen=open;
  arsenal.hidden=!open;
  arsenalButton.setAttribute('aria-expanded',String(open));
  arsenalButton.setAttribute('aria-label',open?'Ocultar arsenal':'Abrir arsenal');
  fitBoard();
}
function syncFullscreen(){
  const expanded=Boolean(document.fullscreenElement);
  const label=expanded?'Sair da tela cheia':'Tela cheia';
  setIcon(fullscreenButton,expanded?'fullscreenExit':'fullscreen');
  fullscreenButton.setAttribute('aria-label',label);
  fullscreenButton.setAttribute('aria-pressed',String(expanded));
  fullscreenButton.title=label;
  fitBoard();
}
async function toggleFullscreen(){
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch{
    toast('A tela cheia do navegador está indisponível aqui.',true);
  }
}

function setMarkers(){
  const root=$('map-markers');
  root.replaceChildren();
  markers=[...game.map.entries.map(([x,z],index)=>({x,z,title:game.map.entries.length===1?'Entrada':'Entrada '+(index+1),entry:true})),
    {x:game.map.exit[0],z:game.map.exit[1],title:'Saída',entry:false}];
  markers.forEach(marker=>{
    marker.node=document.createElement('span');
    marker.node.className='map-marker'+(marker.entry?' entry':'');
    marker.node.textContent=marker.title;
    root.append(marker.node);
  });
}
function positionMarkers(){
  if(!world) return;
  markers.forEach(marker=>{
    const point=world.project(marker.x,2.04,marker.z);
    marker.node.hidden=point.x<2||point.x>98||point.y<3||point.y>97;
    marker.node.style.left=point.x+'%';
    marker.node.style.top=point.y+'%';
  });
}
function cardColors(tower){
  const [base,light,border]=tower.card;
  return '--card-bg:'+base+';--card-lamp:'+light+';--card-border:'+border+';--card-accent:'+tower.color;
}
function art(tower,cls,form){
  const source=portrait(tower.id,form?.tier,form?.path,form?.wet,form?.bond,form?.compare);
  return source?'<img class="'+cls+'" alt="" src="'+source+'">':'';
}
function visibleTowers(){
  return TOWERS.filter(tower=>tower.category===category);
}
function makeCategories(){
  categoryPicker.innerHTML=CATEGORIES.filter(family=>family.id!=='hero').map(family=>
    '<button type="button" class="category-button" style="--family:'+family.color+'" aria-pressed="'+(family.id===category)+
    '" data-category="'+family.id+'">'+icon(family.icon)+'<span>'+family.name+'</span></button>').join('');
}
function makeShop(){
  shop.replaceChildren();
  cards.clear();
  visibleTowers().forEach((tower,index)=>{
    const card=document.createElement('button');
    card.type='button';
    card.className='shop-card';
    card.title=tower.species+' · '+tower.desc;
    card.setAttribute('aria-pressed','false');
    card.style.cssText=cardColors(tower);
    card.innerHTML=
      '<kbd class="card-key">'+(index+1)+'</kbd><span class="card-role">'+icon(tower.icon)+'</span>'+
      art(tower,'tower-art')+
      '<span class="card-copy"><span class="card-name">'+tower.name+'</span><span class="card-cost">'+icon('coin')+'<span></span></span></span>';
    card.addEventListener('click',()=>chooseTower(tower.id,true));
    shop.append(card);
    cards.set(tower.id,card);
  });
}
categoryPicker.addEventListener('click',event=>{
  const button=event.target.closest('[data-category]');
  if(!button||button.dataset.category===category) return;
  if(placing) clearPlacement();
  category=button.dataset.category;
  for(const item of categoryPicker.querySelectorAll('[data-category]')) item.setAttribute('aria-pressed',String(item===button));
  makeShop();
  shop.scrollTop=0;
  syncUI();
});

function canBuild(){
  return world&&game.canAct();
}
function chooseTower(id,fromCard=false){
  if(!canBuild()||(TOWER_BY_ID[id].hero&&game.heroChoice!==id)) return;
  if(placing===id){clearPlacement();return;}
  if(game.gold<game.towerPrice(id)){
    toast('Ouro insuficiente para '+TOWER_BY_ID[id].name+'.',true);
    return;
  }
  select(null);
  placing=id;
  cursor=null;
  world.setPlacing(id);
  viewport.classList.add('placing');
  inspectorDirty=uiDirty=true;
  if(fromCard&&compact.matches) setArsenal(false);
}
function clearPlacement(){
  placing=null;
  cursor=null;
  viewport.classList.remove('placing');
  world?.setPlacing(null);
  uiDirty=true;
}
function select(item){
  if(placing) clearPlacement();
  aiming=null;
  selected=item;
  if(item) setArsenal(true);
  world?.setSelected(item);
  inspectorDirty=uiDirty=true;
}
function positionCursor(x,z,show=true){
  if(!placing) return;
  const snapped={x:Math.round(x*6)/6,z:Math.round(z*6)/6};
  const error=game.placement(snapped.x,snapped.z,placing);
  cursor={...snapped,error};
  if(show) world.placeCursor(cursor);
  uiDirty=true;
}
function placeAtCursor(){
  if(!canBuild()||!placing||!cursor) return;
  const result=game.build(placing,cursor.x,cursor.z);
  if(result.error){toast(result.error,true);return;}
  clearPlacement();
  toast(TOWER_BY_ID[result.tower.type].name+' em campo.');
}
function switchSound(){
  settings.sound=!settings.sound;
  audio.awake().then(()=>audio.sync());
  audio.sync();
  syncSoundButton();
  save();
}
function syncSoundButton(){
  setIcon($('sound-button'),settings.sound?'volume':'mute');
  const label=settings.sound?'Silenciar som':'Ativar som';
  $('sound-button').setAttribute('aria-label',label);
  $('sound-button').title=label;
}
function action(){
  if(!world||dialog.open) return;
  audio.awake().then(()=>audio.sync());
  if(game.phase==='victory'||game.phase==='defeat'){
    showMaps();
    return;
  }
  game.toggleWave();
  uiDirty=true;
}
function speedUp(){
  speed=speed%3+1;
  put('speed-value',speed+'×');
  $('speed-button').setAttribute('aria-label','Velocidade '+speed+' vezes. Clique para mudar.');
}
function describeStatus(){
  if(aiming) return ['Marcar ponto para '+TOWER_BY_ID[aiming.type].name,'Clique no mapa para definir o alvo. Esc cancela.','crosshair'];
  if(placing){
    const unit=TOWER_BY_ID[placing], terrain=unit.stats.terrain;
    const instruction=terrain==='water'?'Clique na água para posicionar.':terrain==='both'?'Posicione na terra ou na água.':'Clique na grama para posicionar.';
    return ['Posicionar '+unit.name,cursor?.error||instruction,'crosshair'];
  }
  if(game.phase==='battle') return ['Onda '+game.wave+' em andamento',game.remaining+(game.remaining===1?' invasor restante.':' invasores restantes.'),'flag'];
  if(game.phase==='paused') return ['Partida pausada','Retome a onda quando estiver pronto.','pause'];
  if(game.phase==='defeat') return ['Defesa derrubada','A frota atravessou as defesas.','flag'];
  if(game.phase==='victory') return ['Ilhas protegidas','Você concluiu as vinte ondas.','medal'];
  if(game.wave>1) return ['Onda '+game.wave+' à espera','Aprimore suas torres ou inicie a próxima onda.','crosshair'];
  return ['Prepare a defesa','Escolha um dinossauro no arsenal.','crosshair'];
}
function syncUI(){
  uiDirty=false;
  put('life-value',cash(game.lives));
  put('gold-value',cash(game.gold));
  put('wave-value',String(game.wave).padStart(2,'0'));
  put('intel-label',game.phase==='battle'||game.phase==='paused'?'Nesta onda':'Próxima onda');
  put('speed-value',speed+'×');
  const [title,detail,signal]=describeStatus();
  put('battle-status',title);
  put('battle-detail',detail);
  if($('battle-icon').dataset.icon!==signal){
    setIcon($('battle-icon'),signal);
    $('battle-icon').dataset.icon=signal;
  }
  const [waveLabel,waveIcon]={
    battle:['Pausar onda','pause'],paused:['Retomar onda','play'],prepare:['Iniciar onda','play'],
    victory:['Nova partida','play'],defeat:['Nova partida','play']
  }[game.phase];
  put('wave-label',waveLabel);
  if($('wave-icon').dataset.icon!==waveIcon){
    setIcon($('wave-icon'),waveIcon);
    $('wave-icon').dataset.icon=waveIcon;
  }
  const notice=$('stage-notice');
  notice.hidden=!placing&&!aiming;
  if(aiming) notice.textContent='Marque um ponto no mapa';
  if(placing) notice.textContent=TOWER_BY_ID[placing].name+' · '+cash(game.towerPrice(placing))+' ouro';
  for(const [id,card] of cards){
    const price=game.towerPrice(id);
    card.querySelector('.card-cost span').textContent=cash(price);
    card.setAttribute('aria-label',TOWER_BY_ID[id].name+', '+cash(price)+' ouro');
    card.setAttribute('aria-pressed',String(placing===id));
    card.classList.toggle('unaffordable',game.gold<price);
    card.disabled=!world||!game.canAct();
  }
  if(inspectorDirty){
    renderInspector();
    inspectorDirty=false;
  }
  syncHero();
  for(const button of inspector.querySelectorAll('[data-cost]')){
    button.disabled=game.gold<Number(button.dataset.cost)||!game.canAct();
  }
}

function renderInspector(){
  shop.hidden=Boolean(selected);
  categoryPicker.hidden=Boolean(selected);
  inspector.hidden=!selected;
  if(!selected){
    put('panel-heading','Arsenal');
    inspector.replaceChildren();
    return;
  }
  const back='<button type="button" class="back-button" data-inspect="back">'+icon('back')+'Arsenal</button>';
  if(!selected.stats){
    put('panel-heading','Obstáculo');
    const price=game.clearPrice(selected);
    inspector.innerHTML=back+'<div class="inspect-portrait"><span class="status-icon">'+icon('shovel')+'</span><div><h3>Rocha coberta de musgo</h3><small>Terreno</small></div></div>'+
      '<p class="inspect-description">Bloqueia a mira de torres de ataque direto. Remova a rocha para liberar espaço para construção.</p>'+
      '<button class="primary-button" type="button" data-inspect="clear" data-cost="'+price+'">'+icon('shovel')+'Remover · '+cash(price)+' ouro</button>';
    return;
  }
  const unit=selected, tower=TOWER_BY_ID[unit.type];
  const stats=unit.stats, buffs=game.buffsFor(unit);
  const path=unit.path===null?null:tower.paths[unit.path];
  const stat=(name,value)=>'<div class="inspect-stat"><span>'+name+'</span><strong>'+value+'</strong></div>';
  const distance=stats.range>=35?'Global':(stats.range+buffs.range).toFixed(1).replace('.',',');
  const tick=(1/stats.rate*(1+buffs.rate)).toFixed(1).replace('.',',');
  let statLine=stat('Alcance',distance)+stat('Dano',stats.damage+buffs.damage)+stat('Ataques / s',tick);
  if(stats.style==='support'){
    statLine=stat('Alcance',distance)+
      (stats.income?stat('Ouro / onda',stats.income):stat('Cadência','+'+Math.round(stats.aura*100)+'%'))+
      (stats.auraDetect?stat('Detecção','Sim'):stat('Função',stats.aura?'Bônus':'Renda'));
  }
  if(stats.style==='trap') statLine=stat('Alcance',distance)+stat('Dano',stats.damage)+stat('Espinhos',stats.charges);
  const bio='<div class="inspect-portrait current-form" style="'+cardColors(tower)+'">'+art(tower,'inspect-art',unit)+
    '<div><span class="species">'+tower.species+'</span><h3>'+tower.name+'</h3><small>'+
    tower.role+(buffs.has?' · Com bônus':'')+'</small>'+
    '<span class="form-chip">'+AGES[unit.tier]+'</span>'+
    '<button type="button" class="form-link" data-inspect="forms">'+icon('spark')+'Ver evoluções</button></div></div>';
  if(unit.level){
    renderHeroInspector(back,bio,unit,tower,statLine);
    return;
  }
  const pips=Array.from({length:5},(_,i)=>'<i class="'+(i<unit.tier?'on':'')+'"></i>').join('');
  const xp=progress[unit.type]||0;
  const pathButtons=tower.paths.map((spec,index)=>{
    const plan=game.upgradeInfo(unit,index);
    if(!plan) return '';
    const locked=xp<plan.xp;
    return '<button class="path-button" type="button" data-inspect="upgrade" data-path="'+index+'"'+
      (locked?' disabled':' data-cost="'+plan.price+'"')+'><span class="path-picture">'+icon(locked?'lock':spec.icon)+'</span><span><strong>'+
      spec.name+(unit.tier>0?' · '+plan.level:'')+'</strong><small>'+(locked?cash(plan.xp)+' XP necessários':spec.detail)+
      '</small></span><span class="path-cost">'+(locked?cash(xp)+' XP':cash(plan.price)+' G')+'</span></button>';
  }).join('');
  const tracked=stats.style==='aimed'||stats.motion==='pilot';
  const setFocus=stats.style==='mortar'||tracked;
  const button=(command,label,glyph,disabled=false)=>'<button type="button" class="secondary-button" data-inspect="'+
    command+'"'+(disabled?' disabled':'')+'>'+icon(glyph)+label+'</button>';
  let controls='';
  if(setFocus){
    controls=button('focus','Marcar ponto','crosshair')+(tracked?button('follow','Seguir cursor','mouse',unit.control==='cursor'):'');
  }
  if(stats.motion==='wing') controls=button('pattern','Voo · '+FLIGHT_PATTERNS[unit.pattern],'loop');
  if(unit.type==='handler') controls=button('fuse',unit.bond?'Fundir · Vínculo '+unit.bond:'Fundir companheiros','leaf',!game.partner(unit));
  const canAim=!setFocus&&!['support','trap','burst'].includes(stats.style);
  const targeting=canAim?button('aim',TARGETS[unit.aim],'target'):'';
  put('panel-heading','Dinossauro');
  inspector.innerHTML=back+bio+
    '<p class="inspect-description">'+(path?path.detail:tower.desc)+'</p>'+
    '<div class="inspect-stats">'+statLine+'</div>'+
    (controls?'<div class="special-controls">'+controls+'</div>':'')+
    '<div class="upgrade-head"><strong>Aprimoramentos</strong><span class="tier-pips" aria-label="Nível '+unit.tier+' de 5">'+pips+'</span></div>'+
    '<div class="path-list">'+(pathButtons||'<p class="inspect-description">Nível máximo atingido.</p>')+'</div>'+
    '<div class="sell-row">'+targeting+'<button class="secondary-button sell" type="button" data-inspect="sell">Vender · '+cash(game.resale(unit))+' G</button></div>';
}

function showEvolutions(unit){
  const tower=TOWER_BY_ID[unit.type];
  const path=unit.path??0;
  const choices=tower.hero?'':'<div class="evolution-paths" role="group" aria-label="Especializações">'+
    tower.paths.map((spec,index)=>'<button type="button" class="secondary-button" data-preview-path="'+index+
      '" aria-pressed="'+(index===path)+'">'+icon(spec.icon)+spec.name+'</button>').join('')+'</div>';
  showDialog('evolutions','Evoluções de '+tower.name,choices+
    '<p class="evolution-name" id="evolution-name"></p><div id="evolution-gallery" class="evolution-gallery" style="'+cardColors(tower)+'"></div>');
  renderEvolutions(unit,path);
}

function renderEvolutions(unit,path){
  const tower=TOWER_BY_ID[unit.type];
  const gallery=$('evolution-gallery');
  const design=EVOLUTION_DESIGNS[unit.type][tower.hero?0:path];
  put('evolution-name',design.name);
  gallery.innerHTML=Array.from({length:6},(_,tier)=>{
    const current=tier===unit.tier&&(tower.hero||!tier||path===unit.path);
    const level=tower.hero?'Nível '+(tier?tier*4:1):tier?'Nível '+tier:'Ao recrutar';
    const trait=tier?' · '+EVOLUTION_PARTS[design.stages[tier-1].shape]:'';
    const form={tier,path:tower.hero?null:path,wet:unit.wet,bond:unit.bond,compare:true};
    return '<figure class="evolution-card'+(current?' current':'')+'">'+art(tower,'evolution-art',form)+
      '<figcaption><div class="evolution-level"><strong>'+AGES[tier]+'</strong>'+
      '<small class="evolution-detail">'+level+trait+'</small>'+
      '</div>'+(current?'<span>Em campo</span>':'')+'</figcaption></figure>';
  }).join('');
}

function renderHeroInspector(back,bio,unit,tower,stats){
  put('panel-heading','Herói');
  const spell=tower.ability;
  const merchant=unit.type==='ambar'?'<div class="field-items"><h3>Bolsa de campo</h3>'+FIELD_ITEMS.map(item=>{
    const price=unit.vouchers?0:game.price(item.price);
    const blocked=item.id==='fruit'?game.lives===game.mode.lives:game.phase!=='battle';
    return '<button type="button" class="path-button" data-inspect="buy" data-item="'+item.id+'" '+
      (blocked?'disabled':'data-cost="'+price+'"')+'><span class="path-picture">'+icon(item.id==='fruit'?'heart':'drop')+
      '</span><span><strong>'+item.name+'</strong><small>'+item.desc+'</small></span><span class="path-cost">'+(price?cash(price)+' G':'Grátis')+'</span></button>';
  }).join('')+'</div>':'';
  inspector.innerHTML=back+bio+'<p class="inspect-description">'+tower.desc+'</p><div class="inspect-stats">'+stats+'</div>'+
    '<div class="hero-skill"><div class="upgrade-head"><strong>Nível '+unit.level+' / 20</strong><span>+1 por onda</span></div>'+
    '<progress max="20" value="'+unit.level+'" aria-label="Nível do herói"></progress><h3>'+spell.name+'</h3><p>'+spell.description+'</p>'+
    '<button type="button" class="primary-button" data-inspect="ability" id="hero-inspector-cast">'+icon('bolt')+'<span id="hero-inspector-label">Ativar habilidade</span></button></div>'+merchant;
}
function syncHero(){
  if(!game) return;
  const unit=game.hero, choice=game.heroChoice&&TOWER_BY_ID[game.heroChoice];
  const status=game.heroStatus();
  put('hero-label',unit?choice.name:choice?'Posicionar '+choice.name:'Escolher herói');
  put('hero-detail',unit?'Herói · Nível '+unit.level+'/20':choice?cash(game.towerPrice(choice.id))+' ouro':'Um por partida');
  heroButton.disabled=!world||(!unit&&!game.canAct());
  abilityButton.hidden=!unit;
  if(!unit) return;
  const description=unit.level<3?'Libera no nível 3':status.seconds?status.seconds+' s':status.ready?'Ativar habilidade':'Ativa durante a onda';
  abilityButton.disabled=!status.ready;
  abilityButton.setAttribute('aria-label',choice.ability.name+' · '+description);
  abilityButton.title=choice.ability.name+' · '+description;
  put('hero-timer',unit.level<3?'Nv. 3':status.seconds?status.seconds+' s':'H');
  const detail=$('hero-inspector-cast');
  if(detail){
    detail.disabled=!status.ready;
    put('hero-inspector-label',description);
  }
}
function activateHero(){
  if(!game.activateHero()){
    if(game.heroStatus().ready) toast('Aguarde os balões entrarem no alcance da habilidade.');
    return;
  }
  toast(TOWER_BY_ID[game.hero.type].ability.name+' ativada.');
  syncHero();
}
function showHeroes(){
  if(!canBuild()) return;
  const cards=HEROES.map(hero=>'<button type="button" class="hero-option" data-hero="'+hero.id+'" style="'+cardColors(hero)+
    '" aria-pressed="'+(hero===heroCandidate)+'">'+art(hero,'hero-art')+'<strong>'+hero.name+'</strong><small>'+hero.role+'</small></button>').join('');
  showDialog('heroes','Heróis','<p>Escolha um herói para a partida. Ele sobe de nível a cada onda e libera sua habilidade no nível 3.</p>'+
    '<div class="hero-grid">'+cards+'</div><div id="hero-selection"></div>');
  renderHeroChoice();
}
function renderHeroChoice(){
  const hero=heroCandidate, price=game.towerPrice(hero.id);
  $('hero-selection').innerHTML='<div class="hero-selection-copy"><span class="species">'+hero.species+
    '</span><h3>'+hero.ability.name+'</h3><p>'+hero.desc+' '+hero.ability.description+'</p></div>'+
    '<button type="button" class="primary-button" data-do="recruit">'+icon('medal')+'Escolher '+hero.name+' · '+cash(price)+' G</button>';
}

function showGuide(){
  const guide=(image,title,paragraph)=>'<div class="guide-row"><span class="status-icon">'+icon(image)+'</span><div><h3>'+title+'</h3><p>'+paragraph+'</p></div></div>';
  showDialog('guide','Como jogar','<div class="help-grid">'+
    guide('tower','Crie seus dinossauros','Cada dinossauro chega bebê e cresce com os aprimoramentos. Escolha uma linhagem ou compare as fases em Ver evoluções. As teclas 1 a 7 selecionam criaturas na categoria atual.')+
    guide('play','Defenda a saída','Inicie ou pause a onda com Espaço. F alterna a velocidade. Balões que chegam à saída custam vidas. Complete vinte ondas para vencer.')+
    guide('shield','Combine as espécies','Anquilossauro e Parasauro rompem Liga. Coritossauro revela Véus para aliados próximos. Posicione Espinossauro e Barionix na água.')+
    guide('medal','Escolha um herói','Recrute um herói por partida. Ao chegar ao nível 3, ative a habilidade com H ou com o botão ao lado do herói.')+
    guide('map','Explore o mapa','Arraste com o botão direito ou com um dedo para mover a câmera. Use o zoom para se aproximar e A para alternar o arsenal. Ao construir, use as setas e confirme com Enter.')+
    '</div><button class="primary-button" data-do="close" type="button">Entendi</button>');
}
function showIntel(){
  const roster=WAVES[game.wave-1];
  const current=game.phase==='battle'||game.phase==='paused';
  const rows=roster.map(([id,count])=>{
    const enemy=ENEMIES[id];
    return '<div class="intel-row"><span class="enemy-dot" style="background:'+enemy.color+'"></span><div><strong>'+count+' × '+enemy.name+'</strong><p>'+enemy.desc+'</p></div></div>';
  }).join('');
  showDialog('intel',(current?'Nesta onda':'Próxima onda')+' · '+String(game.wave).padStart(2,'0'),rows);
}
function showMastery(){
  const tier=(xp)=>xp>=XP_LIMITS[5]?5:xp>=XP_LIMITS[4]?4:xp>=XP_LIMITS[3]?3:2;
  const total=game.totalXP;
  const closest=total<250?250:total<850?850:total<1650?1650:Infinity;
  const merit=closest===250?'250 XP · +50 ouro inicial':closest===850?'850 XP · remoções mais baratas':closest===1650?'1.650 XP · +18 ouro ao fim da onda':'Todos os bônus ativos';
  const row=tower=>{
    const xp=progress[tower.id]||0;
    return '<div class="xp-row"><strong>'+tower.name+'</strong><progress max="230" value="'+Math.min(xp,230)+'" aria-label="Experiência de '+tower.name+'"></progress><span>Nv. '+tier(xp)+' · '+cash(xp)+'</span></div>';
  };
  const rows=CATEGORIES.filter(family=>family.id!=='hero').map(family=>
    '<h3 class="xp-family" style="--family:'+family.color+'">'+family.name+'</h3>'+
    TOWERS.filter(tower=>tower.category===family.id).map(row).join('')
  ).join('');
  showDialog('mastery','Maestria','<p>Torres em campo ganham experiência ao concluir ondas. Os níveis 3, 4 e 5 são liberados com 70, 140 e 230 XP em cada torre. O progresso fica neste navegador.</p>'+
    rows+'<h3>Bônus permanentes · '+cash(total)+' XP</h3><p class="medal-note">'+icon('medal')+merit+'</p>');
}
function showMaps(){
  const mini=map=>{
    const theme=BIOMES[map.style];
    const island=[map.coast,...(map.islands||[]),...(map.lagoons||[])].map(coast=>'M'+coast.map(point=>point.join(',')).join('L')+'Z').join('');
    const routes=map.routes.map(path=>'<polyline points="'+path.map(point=>point.join(',')).join(' ')+'"/>').join('');
    const frame=[-16,-9,32,18].map(value=>value*MAP_SCALE).join(' ');
    return '<div class="map-preview" style="--sea:'+theme.water[0]+'"><svg viewBox="'+frame+'" aria-hidden="true">'+
      '<path d="'+island+'" fill="'+theme.ground[1]+'" fill-rule="evenodd" stroke="'+theme.sand[0]+'" stroke-width="'+.34*MAP_SCALE+'"/>'+
      '<g fill="none" stroke="'+theme.path[4]+'" stroke-width="'+.71*MAP_SCALE+'" stroke-linecap="round" stroke-linejoin="round">'+routes+'</g></svg></div>';
  };
  const mapButtons=MAPS.map(map=>'<button type="button" class="map-choice" data-map="'+map.id+'" aria-pressed="'+(map===game.map)+'">'+mini(map)+'<strong>'+map.name+'</strong><small>'+map.summary+'</small></button>').join('');
  const modeButtons=MODES.map(mode=>'<button type="button" class="mode-choice" data-mode="'+mode.id+'" aria-pressed="'+(mode===game.mode)+'"><strong>'+mode.name+'</strong><small>'+mode.detail+'</small></button>').join('');
  const playing=game.wave>1||['battle','paused'].includes(game.phase);
  showDialog('maps','Nova partida','<h3>Escolha um mapa</h3><div class="map-choices">'+mapButtons+'</div><h3>Dificuldade</h3><div class="mode-choices">'+modeButtons+'</div>'+
    (playing&&game.canAct()?'<p>Começar uma partida encerra a defesa em andamento.</p>':'')+
    '<div class="dialog-actions"><button type="button" class="secondary-button" data-do="close">Voltar</button><button type="button" class="primary-button" data-do="new">'+icon('play')+'Começar partida</button></div>');
}
function showSettings(){
  const option=(key,name,text)=>'<label class="setting-row"><span><strong>'+name+'</strong><small>'+text+'</small></span><input type="checkbox" data-setting="'+key+'" '+(settings[key]?'checked':'')+'></label>';
  showDialog('settings','Configurações',option('sound','Som','Estouro, impacto metálico e ataques.')+
    option('music','Trilha dinâmica','A trilha acelera durante a batalha.')+
    option('reduced','Animações reduzidas','Diminui partículas e movimentos do cenário.')+
    option('auto','Ondas automáticas','A próxima onda começa após uma breve pausa.')+
    '<button class="secondary-button" type="button" data-do="maps">'+icon('reset')+'Nova partida</button>');
}
function showEnd(won){
  if(dialogScreen==='maps') return;
  showDialog('end',won?'Ilhas protegidas!':'Defesa derrubada',
    '<p>'+ (won?'Você segurou as vinte ondas e derrotou a Nau-Titã.':'A frota passou na onda '+game.wave+'.')+'</p>'+
    '<div class="inspect-stats"><div class="inspect-stat"><span>Balões abatidos</span><strong>'+cash(game.killCount)+'</strong></div>'+
    '<div class="inspect-stat"><span>Vidas restantes</span><strong>'+game.lives+'</strong></div>'+
    '<div class="inspect-stat"><span>Maestria total</span><strong>'+cash(game.totalXP)+'</strong></div></div>'+
    '<div class="dialog-actions"><button class="secondary-button" type="button" data-do="close">Ver mapa</button><button class="primary-button" type="button" data-do="maps">'+icon('reset')+'Nova partida</button></div>');
}

function pickItem(point,event){
  const rect=viewport.getBoundingClientRect();
  const objects=[...game.towers,...game.obstacles];
  return objects.map(item=>{
    const floor=Math.hypot(item.x-point.x,item.z-point.z);
    const origin=item.stats?world.towerSpot(item):item;
    const middle=world.project(origin.x,origin.y??.57,origin.z);
    const screen=Math.hypot(rect.left+rect.width*middle.x/100-event.clientX,rect.top+rect.height*middle.y/100-event.clientY);
    return {item,distance:Math.min(floor/(item.r||FOOTPRINT*.69),screen/16)};
  }).filter(candidate=>candidate.distance<=1).sort((a,b)=>a.distance-b.distance)[0]?.item||null;
}
viewport.addEventListener('pointerdown',event=>{
  if(!world||event.button===1||press) return;
  press={id:event.pointerId,x:event.clientX,y:event.clientY,drag:false,canDrag:event.button===2||(event.pointerType==='touch'&&!placing&&!aiming),button:event.button};
  viewport.setPointerCapture(event.pointerId);
  audio.awake().then(()=>audio.sync());
});
viewport.addEventListener('pointermove',event=>{
  if(!world) return;
  const point=world.mapPoint(event.clientX,event.clientY);
  if(!point) return;
  if(press?.id===event.pointerId&&press.canDrag){
    const distance=Math.hypot(event.clientX-press.x,event.clientY-press.y);
    if(distance>5||press.drag){
      const from=world.mapPoint(press.x,press.y);
      world.moveCamera(from,point);
      press.x=event.clientX;
      press.y=event.clientY;
      press.drag=true;
      viewport.classList.add('touching');
      return;
    }
  }
  game.pointer=point;
  if(aiming) world.previewFocus(point);
  if(placing) positionCursor(point.x,point.z);
});
viewport.addEventListener('pointerup',event=>{
  if(!press||event.pointerId!==press.id) return;
  const {drag,button}=press;
  press=null;
  viewport.classList.remove('touching');
  if(!world||drag||button===2) return;
  const point=world.mapPoint(event.clientX,event.clientY);
  if(!point) return;
  game.pointer=point;
  if(aiming){
    game.focusTower(aiming,point.x,point.z);
    aiming=null;
    world.previewFocus(null);
    inspectorDirty=uiDirty=true;
    if(compact.matches) setArsenal(true);
    toast('Ponto marcado.');
  } else if(placing){
    positionCursor(point.x,point.z);
    placeAtCursor();
  } else {
    select(pickItem(point,event));
  }
});
viewport.addEventListener('pointercancel',()=>{press=null;viewport.classList.remove('touching');});
viewport.addEventListener('pointerleave',()=>{if(!press&&placing) world?.placeCursor(null);});
viewport.addEventListener('contextmenu',event=>event.preventDefault());
for(const [id,listener] of [['zoom-in',()=>world?.tweakZoom(.18)],['zoom-out',()=>world?.tweakZoom(-.18)],['zoom-reset',()=>world?.center()]]){
  $(id).addEventListener('click',listener);
}
function keyboardCursor(key){
  const step=.5;
  if(!cursor){
    const [x,z]=game.map.starter;
    const water=TOWER_BY_ID[placing].stats.terrain==='water';
    const tideSpots=[[13.8,0],[-13.8,0],[0,9],[0,-9]];
    const spots=water?tideSpots.map(([a,b])=>[a*MAP_SCALE,b*MAP_SCALE]):[[x+2,z],[x-2,z],[x,z+2],[x,z-2],[x+2,z+2],[x-2,z-2],[x,z+4]];
    for(const [ax,az] of spots){
      if(!game.placement(ax,az,placing)){positionCursor(ax,az);break;}
    }
    if(!cursor) positionCursor(x,z);
  }
  const [dx,dy]={ArrowUp:[0,-step],ArrowDown:[0,step],ArrowLeft:[-step,0],ArrowRight:[step,0]}[key];
  const yaw=world.framedYaw||0;
  positionCursor(cursor.x+dx*Math.cos(yaw)+dy*Math.sin(yaw),cursor.z-dx*Math.sin(yaw)+dy*Math.cos(yaw));
}
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||dialog.open||!world) return;
  if(event.key==='Escape'){
    if(placing) clearPlacement();
    else if(aiming){aiming=null;world.previewFocus(null);uiDirty=true;}
    else select(null);
    return;
  }
  if(event.repeat&&event.key!=='ArrowDown'&&event.key!=='ArrowUp'&&event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return;
  if(/^[1-7]$/.test(event.key)){
    const tower=visibleTowers()[Number(event.key)-1];
    if(!tower) return;
    event.preventDefault();
    chooseTower(tower.id);
    if(placing) viewport.focus({preventScroll:true});
  } else if(event.code==='Space'&&!event.target.closest('button,input')){
    event.preventDefault();
    action();
  } else if(event.key.toLowerCase()==='a'){
    setArsenal(!arsenalOpen);
  } else if(event.key.toLowerCase()==='h'){
    activateHero();
  } else if(event.key.toLowerCase()==='f'){
    speedUp();
  } else if(placing&&event.key.startsWith('Arrow')){
    event.preventDefault();
    keyboardCursor(event.key);
    viewport.focus({preventScroll:true});
  } else if(placing&&event.key==='Enter'&&!event.target.closest('button,input')){
    event.preventDefault();
    if(!cursor) keyboardCursor('ArrowRight');
    placeAtCursor();
  }
});

inspector.addEventListener('click',event=>{
  const button=event.target.closest('[data-inspect]');
  if(!button||!selected) return;
  const command=button.dataset.inspect;
  if(command==='back') select(null);
  if(command==='forms'&&selected.stats) showEvolutions(selected);
  if(command==='clear'&&game.clearRock(selected.id)){
    toast('Terreno liberado.');
    select(null);
  }
  if(command==='upgrade'&&game.upgradeTower(selected,Number(button.dataset.path))){
    world?.setSelected(selected);
    toast('Nível '+selected.tier+' instalado.');
  }
  if(command==='sell'&&game.sell(selected)){
    toast('Torre vendida · +'+cash(game.resale(selected))+' ouro');
    select(null);
  }
  if(command==='aim'){
    selected.aim=(selected.aim+1)%TARGETS.length;
    inspectorDirty=uiDirty=true;
  }
  if(command==='pattern'){
    selected.pattern=(selected.pattern+1)%FLIGHT_PATTERNS.length;
    inspectorDirty=uiDirty=true;
  }
  if(command==='focus'){
    aiming=selected;
    uiDirty=true;
    if(compact.matches) setArsenal(false);
  }
  if(command==='follow'){
    selected.control='cursor';
    aiming=null;
    world.previewFocus(null);
    inspectorDirty=uiDirty=true;
  }
  if(command==='fuse'&&game.fuse(selected)) toast('Companheiros fundidos.');
  if(command==='ability') activateHero();
  if(command==='buy'&&game.buyItem(button.dataset.item)) toast(FIELD_ITEMS.find(item=>item.id===button.dataset.item).name+' usado.');
});
content.addEventListener('click',event=>{
  const target=event.target.closest('button');
  if(!target) return;
  if(target.dataset.map||target.dataset.mode){
    const attr=target.dataset.map?'map':'mode';
    content.querySelectorAll('[data-'+attr+']').forEach(button=>button.setAttribute('aria-pressed',String(button===target)));
  }
  if(target.dataset.previewPath!==undefined&&dialogScreen==='evolutions'&&selected?.stats){
    for(const option of content.querySelectorAll('[data-preview-path]')) option.setAttribute('aria-pressed',String(option===target));
    renderEvolutions(selected,Number(target.dataset.previewPath));
  }
  if(target.dataset.hero){
    heroCandidate=TOWER_BY_ID[target.dataset.hero];
    for(const option of content.querySelectorAll('[data-hero]')) option.setAttribute('aria-pressed',String(option===target));
    renderHeroChoice();
  }
  const command=target.dataset.do;
  if(command==='recruit'&&game.chooseHero(heroCandidate.id)){
    closeDialog();
    if(game.gold>=game.towerPrice(heroCandidate.id)) chooseTower(heroCandidate.id,true);
    else toast(heroCandidate.name+' escolhido. Junte ouro para colocá-lo em campo.');
  }
  if(command==='close') closeDialog();
  if(command==='maps') showMaps();
  if(command==='new'){
    const map=MAPS.find(item=>item.id===content.querySelector('[data-map][aria-pressed="true"]')?.dataset.map)||MAPS[0];
    const mode=MODES.find(item=>item.id===content.querySelector('[data-mode][aria-pressed="true"]')?.dataset.mode)||MODES[0];
    closeDialog();
    newGame(map,mode);
  }
});
content.addEventListener('change',event=>{
  const key=event.target.dataset.setting;
  if(!(key in settings)) return;
  settings[key]=event.target.checked;
  audio.awake().then(()=>audio.sync());
  audio.sync();
  syncSoundButton();
  if(world) world.reduced=settings.reduced;
  save();
});
dialog.addEventListener('close',()=>dialogScreen=null);
dialog.addEventListener('click',event=>{if(event.target===dialog) closeDialog();});
$('dialog-close').addEventListener('click',closeDialog);
$('help-button').addEventListener('click',showGuide);
$('settings-button').addEventListener('click',showSettings);
$('sound-button').addEventListener('click',switchSound);
$('map-button').addEventListener('click',showMaps);
$('mastery-button').addEventListener('click',showMastery);
$('intel-button').addEventListener('click',showIntel);
$('speed-button').addEventListener('click',speedUp);
$('wave-button').addEventListener('click',action);
arsenalButton.addEventListener('click',()=>setArsenal(!arsenalOpen));
document.addEventListener('fullscreenchange',syncFullscreen);
fullscreenButton.addEventListener('click',toggleFullscreen);
fullscreenButton.hidden=!document.documentElement.requestFullscreen||document.fullscreenEnabled===false;
compact.addEventListener?.('change',()=>setArsenal(!compact.matches));
viewport.addEventListener('wheel',event=>{
  if(!world) return;
  event.preventDefault();
  world.tweakZoom(event.deltaY<0 ? .10 : -.10);
},{passive:false});
heroButton.addEventListener('click',()=>{
  if(game.hero) select(game.hero);
  else if(game.heroChoice) chooseTower(game.heroChoice,true);
  else showHeroes();
});
abilityButton.addEventListener('click',activateHero);
document.addEventListener('pointerdown',event=>{
  if(!event.target.closest('#sound-button')) audio.awake().then(()=>audio.sync());
},{once:true});

try {
  world=new World(viewport);
} catch(error) {
  console.error(error);
  $('webgl-message').hidden=false;
  $('wave-button').disabled=true;
}
if(world){
  try {portrait=createPortraits();} catch(error) {console.warn('Prévia de torres indisponível',error);}
}
const overlayObserver=new ResizeObserver(fitBoard);
[viewport,arsenal,...document.querySelectorAll('.mission-head,.stage-bottom,.control-deck')].forEach(element=>overlayObserver.observe(element));
setArsenal(arsenalOpen);
syncFullscreen();
makeCategories();
makeShop();
newGame(availableMap,availableMode);
syncSoundButton();
syncUI();

let last=performance.now(),acc=0;
function frame(now){
  const dt=Math.min(.065,Math.max(0,(now-last)/1000));
  last=now;
  if(game.phase==='battle'&&!dialog.open){
    acc+=dt*speed;
    while(acc>=1/60){
      game.step(1/60);
      acc-=1/60;
    }
  } else {
    acc=0;
  }
  world?.update(dt);
  audio.update(game);
  positionMarkers();
  if(uiDirty) syncUI();
  else if(game.hero&&game.phase==='battle') syncHero();
  requestAnimationFrame(frame);
}
if(world) requestAnimationFrame(frame);
