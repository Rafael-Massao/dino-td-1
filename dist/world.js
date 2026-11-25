import * as THREE from './vendor/three.module.min.js';
import {TOWER_BY_ID,routePoint,seeded} from './campaign.js';
import {ballShape,box,crystal,makeEnemy,makeLights,makeTower,material,rockShape,sharedGeometry,sharedMaterial} from './models.js';
import {buildTerrain,makeRock} from './terrain.js';
import {GROWTH,MAP_DINO_SCALE,MAP_SCALE,MOVES,creatureFrame,ease} from './creature-motion.js';

const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const waterPlane=new THREE.Plane(new THREE.Vector3(0,1,0),.76);
const sweepShape=new THREE.RingGeometry(.84,1,30,1,-Math.PI*.71,Math.PI*1.42).rotateX(-Math.PI/2);
const attackColors={
  frost:'#97e3fb',tide:'#96f2df',resin:'#b7e45f',forge:'#ffb166',prism:'#d3a9ff',
  bomb:'#ffc580',mortar:'#ffcf87'
};
const circleShape=new THREE.CircleGeometry(1,80).rotateX(-Math.PI/2);
const ringShape=new THREE.RingGeometry(.975,1,80).rotateX(-Math.PI/2);
const dashShape=new THREE.RingGeometry(.93,1,44).rotateX(-Math.PI/2);
const barShape=new THREE.PlaneGeometry(1,.1);
const color=new THREE.Color();
const point2=new THREE.Vector2();
const vector=new THREE.Vector3();
const dummy=new THREE.Object3D();

function translucent(hex,opacity,depthTest=true){
  return new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity,depthWrite:false,depthTest,side:THREE.DoubleSide});
}

function releaseModels(root){
  const seen=new Set();
  root.traverse(node=>{
    if(node.isInstancedMesh) node.dispose();
    if(node.geometry&&!seen.has(node.geometry)&&!sharedGeometry(node.geometry)){
      seen.add(node.geometry);
      node.geometry.dispose();
    }
    const mat=node.material;
    if(mat&&!seen.has(mat)&&!sharedMaterial(mat)){
      seen.add(mat);
      mat.map?.dispose();
      mat.dispose();
    }
  });
}

function freeClonedMaterials(group){
  group.traverse(node=>{
    if(node.isMesh&&!sharedMaterial(node.material)) node.material.dispose();
  });
  group.removeFromParent();
}

export class World {
  constructor(viewport){
    this.viewport=viewport;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color('#287d80');
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.04;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute('aria-hidden','true');
    this.viewport.append(this.renderer.domElement);
    this.camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,125);
    this.ray=new THREE.Raycaster();
    this.zoom=1;
    this.target=new THREE.Vector3(0,0,0);
    this.time=0;
    const sun=makeLights(this.scene,.72);
    sun.position.set(-13,23,9);
    sun.castShadow=true;
    sun.shadow.mapSize.set(1536,1536);
    Object.assign(sun.shadow.camera,{left:-20,right:20,top:15,bottom:-16,near:.5,far:63});
    sun.shadow.autoUpdate=false;
    sun.shadow.needsUpdate=true;
    sun.shadow.bias=-.00045;
    sun.shadow.normalBias=.016;
    this.sun=sun;
    this.scene.add(sun.target);
    this.towers=new Map();
    this.enemies=new Map();
    this.traps=new Map();
    this.rocks=new Map();
    this.effects=[];
    this.particles=[];
    this.preview=[];
    this.range=new THREE.Group();
    const fill=new THREE.Mesh(circleShape,translucent('#c3f882',.145));
    const edge=new THREE.Mesh(ringShape,translucent('#e4ffc2',.9));
    fill.renderOrder=1;
    edge.renderOrder=2;
    edge.position.y=.004;
    this.range.add(fill,edge);
    this.range.visible=false;
    this.scene.add(this.range);
    this.reticle=new THREE.Mesh(dashShape,translucent('#ffde8b',.94));
    this.reticle.visible=false;
    this.scene.add(this.reticle);
    this.sparks=new THREE.InstancedMesh(rockShape,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),210);
    this.sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sparks.frustumCulled=false;
    this.sparks.count=0;
    this.scene.add(this.sparks);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(viewport);
    this.resize();
  }
  resize(){
    const width=this.viewport.clientWidth,height=this.viewport.clientHeight;
    if(!width||!height) return;
    this.width=width;
    this.height=height;
    this.renderer.setSize(width,height,false);
    this.refreshCamera();
  }
  setInsets(insets){
    this.insets=insets;
    this.refreshCamera();
  }
  refreshCamera(){
    if(!this.width||!this.height) return;
    const {width,height}=this;
    const {top=0,right=0,bottom=0,left=0}=this.insets||{};
    const boardWidth=Math.max(width*.40,width-left-right);
    const boardHeight=Math.max(height*.40,height-top-bottom);
    const yaw=width<height*.80?Math.PI*.43:.079;
    this.camera.position.set(this.target.x+Math.sin(yaw)*24.4,25,this.target.z+Math.cos(yaw)*24.4);
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();

    if(!this.boardSize||this.framedYaw!==yaw||this.framedMap!==this.game?.map){
      const map=this.game?.map;
      const allPoints=map?[...map.coast,...(map.islands||[]).flat(),...map.routes.flat(),...map.entries,map.exit]:[[-15,-8],[15,8],[-15,8],[15,-8]];
      const inverse=this.camera.quaternion.clone().invert();
      const bounds=new THREE.Box3();
      for(const [x,z] of allPoints){
        bounds.expandByPoint(vector.set(x,-.78,z).applyQuaternion(inverse));
        bounds.expandByPoint(vector.set(x,1.93,z).applyQuaternion(inverse));
      }
      this.boardCenter=bounds.getCenter(new THREE.Vector3());
      this.boardSize=bounds.getSize(new THREE.Vector3()).multiplyScalar(1.045);
      this.framedMap=map;
      this.framedYaw=yaw;
    }
    const scale=Math.max(this.boardSize.x/boardWidth,this.boardSize.y/boardHeight)/this.zoom;
    const halfW=width*scale*.5,halfH=height*scale*.5;
    const shiftX=this.boardCenter.x+(right-left)*scale*.5;
    const shiftY=this.boardCenter.y+(top-bottom)*scale*.5;
    Object.assign(this.camera,{left:shiftX-halfW,right:shiftX+halfW,top:shiftY+halfH,bottom:shiftY-halfH});
    this.camera.updateProjectionMatrix();
  }
  tweakZoom(amount){
    this.zoom=Math.min(1.83,Math.max(.73,this.zoom+amount));
    this.refreshCamera();
  }
  center(){
    this.zoom=1;
    this.target.set(0,0,0);
    this.refreshCamera();
  }
  mapPoint(x,y){
    const {left,top,width,height}=this.viewport.getBoundingClientRect();
    point2.set((x-left)/width*2-1,-(y-top)/height*2+1);
    this.ray.setFromCamera(point2,this.camera);
    const hit=this.ray.ray.intersectPlane(groundPlane,vector);
    if(hit&&this.game?.onWater(hit.x,hit.z)) this.ray.ray.intersectPlane(waterPlane,vector);
    return hit?{x:hit.x,z:hit.z}:null;
  }
  moveCamera(from,to){
    this.target.x=THREE.MathUtils.clamp(this.target.x+from.x-to.x,-10*MAP_SCALE,10*MAP_SCALE);
    this.target.z=THREE.MathUtils.clamp(this.target.z+from.z-to.z,-6.5*MAP_SCALE,6.5*MAP_SCALE);
    this.refreshCamera();
  }
  project(x,y,z){
    vector.set(x,y,z).project(this.camera);
    return {x:(vector.x*.5+.5)*100,y:(.5-vector.y*.5)*100};
  }
  setGame(game){
    this.game=game;
    const rebuild=this.mapId!==game.map.id;
    if(rebuild){
      if(this.terrain){
        this.terrain.root.removeFromParent();
        releaseModels(this.terrain.root);
      }
      this.terrain=buildTerrain(game.map,game.routes);
      this.scene.add(this.terrain.root);
      this.mapId=game.map.id;
    }
    this.setPlacing(null);
    this.setSelected(null);
    this.live?.traverse(node=>{
      if(node.isMesh&&node.userData.disposable) node.material.dispose();
    });
    for(const enemy of this.enemies.values()) freeClonedMaterials(enemy.model);
    this.live?.removeFromParent();
    this.live=new THREE.Group();
    this.scene.add(this.live);
    this.towers.clear();
    this.enemies.clear();
    this.traps.clear();
    this.rocks.clear();
    for(const effect of this.effects) effect.mesh.material.dispose();
    this.effects=[];
    this.particles=[];
    this.preview=[];
    for(const tower of game.towers) this.putTower(tower,false);
    for(const rock of game.obstacles){
      const model=makeRock(rock,game.map.style);
      this.rocks.set(rock.id,model);
      this.live.add(model);
    }
    const random=seeded(game.map.seed+23);
    const parade=['red','yellow','red','blue','yellow','red','blue','pink','red'];
    parade.forEach((type,index)=>{
      const {model,lift}=makeEnemy(type);
      const track=index%game.routes.length;
      const p=routePoint(game.routes[track],(2.2+index*.64)*MAP_SCALE);
      model.position.set(p.x+(random()-.5)*.46,lift+.29+random()*.48,p.z+(random()-.5)*1.24);
      const scale=.81+random()*.34;
      model.scale.setScalar(scale);
      this.preview.push({model,y:model.position.y,index});
      this.live.add(model);
    });
    this.sun.shadow.needsUpdate=true;
    this.center();
  }
  clearPreview(){
    for(const {model} of this.preview) model.removeFromParent();
    this.preview=[];
  }
  putTower(tower,animate=true){
    const previous=this.towers.get(tower.id);
    if(previous){
      previous.shadow.material.dispose();
      previous.root.removeFromParent();
    }
    const view=makeTower(tower.type,tower.tier,tower.path,tower.wet,tower.bond);
    view.root.position.set(tower.x,tower.wet?-.73:0,tower.z);
    view.scale=tower.isSentry?MAP_DINO_SCALE*.62:MAP_DINO_SCALE;
    view.root.scale.setScalar(view.scale);
    view.groundY=view.body.position.y;
    view.growthFrom=previous&&previous.tier!==view.tier?GROWTH[previous.tier]/GROWTH[view.tier]:1;
    view.offset=new THREE.Vector3();
    view.shadow=new THREE.Mesh(circleShape,translucent('#253330',.20));
    view.shadow.userData.disposable=true;
    view.shadow.position.y=.061;
    view.shadow.scale.set(.75,1,.57);
    view.root.add(view.shadow);
    view.spine.rotation.y=previous?.spine.rotation.y??-.62;
    view.turn=previous?.turn??-.62;
    view.arrival=view.growthFrom<1?.80:.43;
    view.born=animate?view.arrival:0;
    view.detail=tower;
    view.recovery=previous?.recovery;
    view.actionTime=previous?.actionTime??0;
    view.contact=previous?.contact;
    view.emitted=previous?.emitted;
    const aura=new THREE.Mesh(dashShape,material('#baf485','light'));
    aura.scale.set(.93,1,.93);
    aura.position.y=.052;
    aura.visible=false;
    view.root.add(aura);
    view.aura=aura;
    const sigil=new THREE.Group();
    box(sigil,'#d6ff9c',0,0,0,.22,.06,.04,'light');
    box(sigil,'#d6ff9c',0,0,0,.06,.22,.04,'light');
    sigil.position.set(0,2.1,0);
    sigil.visible=false;
    view.root.add(sigil);
    view.sigil=sigil;
    this.live.add(view.root);
    this.towers.set(tower.id,view);
    return view;
  }
  evolveTower(tower){
    this.sun.shadow.needsUpdate=true;
    const view=this.putTower(tower,true);
    const surface=tower.wet?-.71:.075;
    this.waveEffect(tower.x,surface,tower.z,view.accent,1.14+tower.tier*.14,.64);
    this.waveEffect(tower.x,surface+.20,tower.z,'#fff0c4',1.08+tower.tier*.1,.40,.64);
    this.addParticles(tower.x,surface+.72,tower.z,view.accent,18+tower.tier*3,1.12);
  }
  setSelected(selected){
    this.selected=selected;
    this.aimPreview=null;
    if(!this.placing) this.refreshRange();
  }
  setPlacing(type){
    if(this.ghost) freeClonedMaterials(this.ghost);
    this.ghost=null;
    this.placing=type;
    this.cursor=null;
    if(type){
      const {root}=makeTower(type,0,null,TOWER_BY_ID[type].stats.terrain==='water');
      root.scale.setScalar(MAP_DINO_SCALE);
      root.traverse(mesh=>{
        if(!mesh.isMesh) return;
        if(mesh.userData.contour){
          mesh.visible=false;
          return;
        }
        mesh.material=mesh.material.clone();
        mesh.material.transparent=true;
        mesh.material.opacity=.67;
        mesh.material.depthWrite=false;
      });
      root.visible=false;
      this.ghost=root;
      this.scene.add(root);
    }
    this.refreshRange();
  }
  placeCursor(cursor){
    this.cursor=cursor;
    if(this.ghost){
      this.ghost.visible=cursor!=null;
      if(cursor) this.ghost.position.set(cursor.x,this.game.onWater(cursor.x,cursor.z)?-.71:.037,cursor.z);
    }
    this.refreshRange();
  }
  previewFocus(point){
    this.aimPreview=point;
    this.refreshRange();
  }
  refreshRange(){
    let at=null,size=1,valid=true,fill='#c3f882',edge='#e4ffc2';
    this.reticle.visible=false;
    if(this.placing&&this.cursor){
      at=this.cursor;
      size=Math.min(15*MAP_SCALE,TOWER_BY_ID[this.placing].stats.range*MAP_SCALE);
      valid=!at.error;
    }else if(this.selected){
      const selected=this.selected;
      at=selected;
      if(selected.stats){
        const {style,motion}=selected.stats;
        if(style==='mortar'){
          at=this.aimPreview||selected.focus;
          size=selected.stats.splash;
        }else{
          at=this.game.origin(selected);
          size=Math.min(15*MAP_SCALE,selected.stats.range+this.game.buffsFor(selected).range);
        }
        if(style==='mortar'||style==='aimed'||motion==='pilot'){
          const target=this.aimPreview||(style==='mortar'?selected.focus:this.game.aimPoint(selected));
          this.reticle.visible=true;
          this.reticle.position.set(target.x,this.game.onWater(target.x,target.z)?-.73:.09,target.z);
          this.reticle.scale.set(.45,1,.45);
        }
      }else{
        size=at.r+.23;
        fill='#eec36b';
        edge='#ffe397';
      }
    }
    this.range.visible=Boolean(at);
    if(!at) return;
    this.range.position.set(at.x,this.game.onWater(at.x,at.z)?-.735:.055,at.z);
    this.range.scale.set(size,1,size);
    this.range.children[0].material.color.set(valid?fill:'#f77766');
    this.range.children[1].material.color.set(valid?edge:'#ffd0b8');
  }
  addParticles(x,y,z,hex,count=10,force=1){
    if(this.reduced) count=Math.min(count,5);
    const rand=Math.random;
    for(let i=0;i<count&&this.particles.length<210;i++){
      const angle=rand()*Math.PI*2;
      const spread=(1+rand()*2.2)*force;
      const life=.27+rand()*.45;
      this.particles.push({
        floor:y<0?-.72:.10,
        x:x+(rand()-.5)*.18,y,z:z+(rand()-.5)*.18,
        vx:Math.cos(angle)*spread,vy:(rand()*1.4+.55)*force,vz:Math.sin(angle)*spread,
        scale:.07+rand()*.11,life,max:life,hex:i%4===0?'#fff1b2':hex
      });
    }
  }
  waveEffect(x,y,z,hex,radius,duration,opacity=.82){
    const mesh=new THREE.Mesh(dashShape,translucent(hex,opacity));
    mesh.position.set(x,y,z);
    mesh.scale.setScalar(.25);
    this.live.add(mesh);
    this.effects.push({mesh,duration,life:duration,opacity,update:t=>mesh.scale.set(.24+radius*t,1,.24+radius*t)});
  }
  sweepEffect(x,y,z,angle,hex,radius,tail=false){
    const mesh=new THREE.Mesh(sweepShape,translucent(hex,tail?.72:.52));
    mesh.position.set(x,y,z);
    mesh.rotation.y=angle-Math.PI*.43;
    if(!tail) mesh.rotation.x=-.44;
    this.live.add(mesh);
    const duration=tail?.38:.26;
    this.effects.push({mesh,duration,life:duration,opacity:tail?.72:.53,update:t=>{
      const expand=radius*(.45+.71*ease(0,1,t));
      mesh.scale.set(expand,1,expand);
      mesh.rotation.y=angle-.62+t*.77;
    }});
  }
  gust(from,to,hex,duration,resin=false){
    const count=this.reduced?3:7;
    for(let i=0;i<count;i++){
      const puff=new THREE.Mesh(ballShape,translucent(hex,resin?.68:.38));
      const phase=i/count;
      const span=duration*(.80+phase*.41);
      const range=.58+phase*.44;
      this.live.add(puff);
      this.effects.push({mesh:puff,duration:span,life:span,opacity:resin?.68:.38,update:t=>{
        const p=ease(0,1,t)*range;
        const lift=Math.sin(p*Math.PI)*(.13+phase*.18);
        puff.position.set(THREE.MathUtils.lerp(from[0],to[0],p)+Math.cos(i*1.8)*phase*.22,
          THREE.MathUtils.lerp(from[1],to[1],p)+lift,THREE.MathUtils.lerp(from[2],to[2],p));
        puff.scale.setScalar((resin?.16:.28)+phase*.13+t*(resin?.07:.28));
      }});
    }
  }
  towerSpot(tower){
    const view=this.towers.get(tower.id);
    if(!view) return this.game.origin(tower);
    return {
      x:tower.x+view.body.position.x*view.scale,
      z:tower.z+view.body.position.z*view.scale,
      y:view.root.position.y+(view.body.position.y+view.headHeight*.62)*view.scale
    };
  }
  removeTower(tower){
    const view=this.towers.get(tower.id);
    if(!view) return;
    view.shadow.material.dispose();
    view.root.removeFromParent();
    this.towers.delete(tower.id);
  }
  makeEnemyView(enemy){
    const view=makeEnemy(enemy.type);
    this.live.add(view.model);
    view.detail=enemy;
    if(enemy.def.hidden) view.fade=view.model.children.find(node=>node.material?.transparent)?.material;
    if(enemy.def.hp>=4){
      const barGroup=new THREE.Group();
      const background=new THREE.Mesh(barShape,material('#283736','light'));
      background.scale.set(1.25,1.25,1.25);
      const bar=new THREE.Mesh(barShape,material(enemy.type==='boss'?'#ffad6f':'#d1f082','light'));
      bar.position.z=.002;
      barGroup.add(background,bar);
      this.live.add(barGroup);
      view.bar=bar;
      view.barGroup=barGroup;
    }
    this.enemies.set(enemy.id,view);
  }
  removeEnemy(enemy){
    const view=this.enemies.get(enemy.id);
    if(!view) return;
    freeClonedMaterials(view.model);
    view.barGroup?.removeFromParent();
    this.enemies.delete(enemy.id);
  }
  putTrap(trap){
    const pile=new THREE.Group();
    pile.position.set(trap.x,.044,trap.z);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI*.27;
      const piece=crystal(pile,i%2?'#89c5c8':'#efe0a2',Math.cos(angle)*.29,.11,Math.sin(angle)*.26,.12,.28,.16);
      piece.rotation.set(Math.sin(angle)*.52,angle,Math.cos(angle)*.49);
    }
    this.live.add(pile);
    this.traps.set(trap.id,{trap,pile});
  }
  removeTrap(trap){
    this.traps.get(trap.id)?.pile.removeFromParent();
    this.traps.delete(trap.id);
  }
  enemyPosition(enemy){
    const cached=this.enemies.get(enemy.id);
    const angle=enemy.angle||0, lane=enemy.lane||0;
    return [enemy.x+Math.cos(angle)*lane,cached?.model.position.y||1.12,enemy.z-Math.sin(angle)*lane];
  }
  handle(event){
    const {type,tower,enemy,rock,trap}=event;
    if(type==='trap'){this.putTrap(trap);return;}
    if(type==='trap-end'){this.removeTrap(trap);return;}
    if(type==='sentry'){this.putTower(tower,true);return;}
    if(type==='sentry-end'){
      this.removeTower(tower);
      this.sun.shadow.needsUpdate=true;
      return;
    }
    if(type==='upgrade'||(type==='hero-level'&&event.evolved)){
      this.evolveTower(tower);
      return;
    }
    if(type==='ability'||type==='item'){
      const model=this.towers.get(tower.id);
      if(model&&!tower.attack) model.displayMove={kind:tower.stats.income?'gather':'call',at:this.time};
      this.waveEffect(tower.x,.085,tower.z,'#ffd67a',Math.min(6,tower.stats.range+1),.8);
      this.addParticles(tower.x,1.28,tower.z,'#f7d489',22);
      return;
    }
    if(type==='build'){
      this.sun.shadow.needsUpdate=true;
      this.putTower(tower,true);
      const surface=tower.wet?-.71:.075;
      this.waveEffect(tower.x,surface,tower.z,'#e6dbad',1.24,.5);
      this.addParticles(tower.x,surface+.25,tower.z,'#d8bd87',14);
      return;
    }
    if(type==='sell'){
      this.sun.shadow.needsUpdate=true;
      this.removeTower(tower);
      this.addParticles(tower.x,.27,tower.z,'#f5ca75',13);
      return;
    }
    if(type==='clear'){
      this.sun.shadow.needsUpdate=true;
      this.rocks.get(rock.id)?.removeFromParent();
      this.rocks.delete(rock.id);
      this.addParticles(rock.x,.41,rock.z,'#ced1a1',26,1.1);
      return;
    }
    if(type==='complete'){
      for(const view of this.towers.values()){
        if(view.detail.stats.income) view.displayMove={kind:'gather',at:this.time};
      }
      return;
    }
    if(type==='wave'){
      this.clearPreview();
      for(const view of this.towers.values()){
        if(view.detail.stats.style==='support'&&!view.detail.stats.income){
          view.displayMove={kind:'call',at:this.time};
        }
      }
      return;
    }
    if(type==='spawn'){this.makeEnemyView(enemy);return;}
    if(type==='attack-start'){
      const view=this.towers.get(tower.id);
      if(view){
        view.recovery=event.attack;
        view.actionTime=0;
        view.contact=null;
        view.emitted=false;
      }
      return;
    }
    if(type==='impact'){
      const {attack,stats}=event;
      if(!attack) return;
      const p=this.enemyPosition(enemy);
      const view=this.towers.get(tower.id);
      if(view&&attack.target===enemy) view.contact=p;
      const tint=attackColors[stats.style]||(tower.wet?'#a9f1e0':'#ffdfa0');
      const ground=this.game.onWater(p[0],p[2])?-.71:.066;
      const angle=Math.atan2(p[0]-attack.origin.x,p[2]-attack.origin.z);
      const kind=attack.kind;
      if(kind==='tail'||kind==='sweep'||kind==='claw'){
        this.sweepEffect(p[0],p[1]-.11,p[2],angle,tint,stats.splash||1.39,kind!=='claw');
      }else if(kind==='stomp'||kind==='pounce'||kind==='dive'){
        this.waveEffect(p[0],ground,p[2],tint,stats.splash||1.18,.44,.62);
        if(kind==='stomp') this.waveEffect(attack.origin.x,.062,attack.origin.z,tint,1.51,.37,.49);
      }else if(['breath','spit','roar'].includes(kind)){
        this.waveEffect(p[0],ground+.10,p[2],tint,stats.splash||.91,.42,.55);
      }
      const heavy=kind==='stomp'||(stats.splash>1.2&&kind==='tail');
      this.addParticles(p[0],heavy?ground+.25:p[1]-.05,p[2],tint,heavy?19:7,heavy?1.28:.63);
      return;
    }
    if(type==='pop'){
      const p=this.enemyPosition(enemy);
      this.addParticles(...p,enemy.def.color,enemy.def.airship?31:9,enemy.def.airship?1.57:1);
      if(enemy.def.airship) this.waveEffect(p[0],.13,p[2],'#ffed9e',2.05,.55);
      this.removeEnemy(enemy);
    }
    if(type==='deflect'){
      this.addParticles(...this.enemyPosition(enemy),'#f9e8a1',5,.53);
    }
    if(type==='leak'){
      this.removeEnemy(enemy);
      this.waveEffect(enemy.x,.066,enemy.z,'#ff906f',1.12,.52);
    }
  }
  updateDinosaur(view,dt,motion){
    const tower=view.detail;
    const buff=this.game.buffsFor(tower);
    let active=tower.attack;
    if(active) view.actionTime=active.elapsed;
    else if(view.recovery?.resolved&&view.actionTime<view.recovery.duration){
      active=view.recovery;
      view.actionTime=Math.min(active.duration,Math.max(view.actionTime,active.elapsed)+dt);
    }else view.recovery=null;
    const idleOrigin=this.game.origin(tower);
    const surface=view.root.position.y;
    const origin=active?.origin||idleOrigin;
    let x=origin.x,y=origin.y||0,z=origin.z;
    let yaw=view.turn,frame={},turnSpeed=13;
    if(active){
      const t=view.actionTime/active.duration;
      const action=MOVES[active.kind];
      const [tx,ty,tz]=view.contact||this.enemyPosition(active.target);
      const dx=tx-x,dz=tz-z;
      const gap=Math.hypot(dx,dz)||1;
      yaw=Math.atan2(dx,dz);
      view.turn=yaw;
      frame=creatureFrame(active.kind,t,active.hit,active.sign);
      const tailAttack=active.kind==='tail'||active.kind==='sweep';
      turnSpeed=tailAttack?38:23;
      const reach=(tailAttack?view.muzzleReach*1.17:view.muzzleReach)*view.scale*action.reach;
      const travel=frame.travel*Math.max(0,1-reach/gap);
      const smallMotion=this.reduced?.35:1;
      x+=dx*travel*smallMotion;
      z+=dz*travel*smallMotion;
      if(frame.travel){
        const baseY=active.kind==='pounce'?ty+.11:ty-view.headHeight*view.scale*(tailAttack?.51:.86);
        const contact=Math.max(0,baseY-(surface+view.groundY*view.scale));
        y=THREE.MathUtils.lerp(y,contact,frame.travel*smallMotion);
      }
      y+=frame.lift*smallMotion;
      if(!view.emitted&&t>=active.hit*.73){
        view.emitted=true;
        if(['breath','spit','roar'].includes(active.kind)){
          const offset=Math.min(.78,view.muzzleReach*view.scale);
          const from=[x+Math.sin(yaw)*offset,surface+y+(view.groundY+view.headHeight*.93)*view.scale,z+Math.cos(yaw)*offset];
          this.gust(from,[tx,ty,tz],attackColors[active.stats.style]||'#ffe3ac',
            Math.max(.17,active.duration*.48),active.kind==='spit');
        }else if((active.kind==='dive'||active.kind==='pounce')&&!this.reduced){
          this.addParticles(origin.x,surface+.13,origin.z,tower.wet?'#b9efee':'#e7d7a9',6,.73);
        }
      }
    }else{
      if(tower.stats.style==='aimed'){
        const target=this.game.aimPoint(tower);
        yaw=Math.atan2(target.x-tower.x,target.z-tower.z);
        view.turn=yaw;
      }
      if(view.displayMove&&this.game.phase!=='paused'){
        const {kind,at}=view.displayMove;
        const move=MOVES[kind];
        const t=(this.time-at)/move.duration;
        if(t<1) frame=creatureFrame(kind,t,move.hit);
        else view.displayMove=null;
      }
    }
    const angle=yaw+(this.reduced?0:frame.turn||0);
    const difference=THREE.MathUtils.euclideanModulo(angle-view.spine.rotation.y+Math.PI,Math.PI*2)-Math.PI;
    view.spine.rotation.y+=difference*(1-Math.exp(-dt*turnSpeed));

    view.born=Math.max(0,view.born-dt);
    const placed=1-view.born/view.arrival;
    const growth=this.reduced?1:THREE.MathUtils.lerp(view.growthFrom,1,ease(0,.86,placed));
    const settle=this.reduced||view.growthFrom<1?0:(1-ease(0,1,placed))*.62;
    const factor=active?1:1-Math.exp(-dt*15);
    vector.set(x-tower.x,y+settle,z-tower.z);
    view.offset.lerp(vector,factor);
    view.body.position.set(view.offset.x/view.scale,view.groundY+view.offset.y/view.scale,view.offset.z/view.scale);
    const shadowSurface=this.game.onWater(x,z)?-.74:.049;
    view.shadow.position.set(view.body.position.x,(shadowSurface-surface)/view.scale,view.body.position.z);
    view.shadow.material.opacity=Math.max(.09,.24-view.offset.y*.054);
    view.shadow.scale.set(.68+.093*view.tier,1,.51+.080*view.tier);
    view.aura.visible=buff.has;
    view.sigil.visible=buff.has;
    view.sigil.quaternion.copy(this.camera.quaternion);
    view.sigil.position.set(view.body.position.x,view.body.position.y+view.headHeight+.54,view.body.position.z);
    view.pose(this.reduced?0:motion+tower.id,frame,growth);
  }
  update(dt){
    if(!this.terrain) return;
    this.time+=dt;
    const t=this.time;
    const motion=this.reduced?0:t;
    this.terrain.water.material.uniforms.time.value=motion*.8;
    for(const animate of this.terrain.animated) animate(motion);
    this.preview.forEach(({model,y,index})=>{
      model.position.y=y+Math.sin(motion*1.9+index*.9)*.14;
      model.rotation.z=.12*Math.sin(motion*1.45-index);
    });
    for(const view of this.towers.values()) this.updateDinosaur(view,dt,motion);
    if(this.selected?.stats&&(this.selected.stats.motion||this.selected.stats.style==='aimed')) this.refreshRange();
    for(const {trap,pile} of this.traps.values()){
      pile.scale.y=.61+.39*trap.charges/trap.stats.charges;
    }
    const combatTime=this.game.phase==='paused'?this.combatTime:(this.combatTime=motion);
    for(const item of this.enemies.values()){
      const {detail,model,lift,barGroup,bar,fade}=item;
      if(fade) fade.opacity=(detail.stripped||this.game.globalVision) ? .95 : .57;
      const offset=Math.sin((combatTime||0)*3.55+detail.id*.72)*.13;
      model.position.set(detail.x+Math.cos(detail.angle)*detail.lane,lift+offset,detail.z-Math.sin(detail.angle)*detail.lane);
      model.rotation.y=detail.angle;
      model.rotation.z=.11*Math.sin((combatTime||0)*2.85+detail.id);
      if(bar){
        barGroup.position.copy(model.position);
        barGroup.position.y+=(detail.def.airship?1.02:.64);
        barGroup.quaternion.copy(this.camera.quaternion);
        const remain=Math.max(.018,detail.hp/detail.def.hp);
        bar.scale.x=remain;
        bar.position.x=-(1-remain)*.5;
      }
    }
    this.effects=this.effects.filter(effect=>{
      effect.life-=dt;
      if(effect.life<=0){
        effect.mesh.removeFromParent();
        effect.mesh.material.dispose();
        return false;
      }
      effect.update(1-effect.life/effect.duration);
      effect.mesh.material.opacity=effect.opacity*(effect.life/effect.duration);
      return true;
    });
    this.particles=this.particles.filter(p=>p.life>dt);
    this.particles.forEach((p,i)=>{
      p.life-=dt;
      p.x+=p.vx*dt;
      p.y=Math.max(p.floor,p.y+p.vy*dt);
      p.z+=p.vz*dt;
      p.vy-=6.2*dt;
      dummy.position.set(p.x,p.y,p.z);
      dummy.rotation.set(i*.86+t*6,i*.48-t*4,.5);
      dummy.scale.setScalar(p.scale*(.36+.64*p.life/p.max));
      dummy.updateMatrix();
      this.sparks.setMatrixAt(i,dummy.matrix);
      this.sparks.setColorAt(i,color.set(p.hex));
    });
    this.sparks.count=this.particles.length;
    if(this.sparks.count){
      this.sparks.instanceMatrix.needsUpdate=true;
      this.sparks.instanceColor.needsUpdate=true;
    }
    this.renderer.render(this.scene,this.camera);
  }
}
