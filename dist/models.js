import * as THREE from './vendor/three.module.min.js';
import {ENEMIES, TOWER_BY_ID} from './campaign.js';
import {EVOLUTION_DESIGNS} from './evolution-designs.js';
import {GROWTH} from './creature-motion.js';

const gradient = new THREE.DataTexture(new Uint8Array([102,155,205,244]),4,1,THREE.RedFormat);
gradient.needsUpdate=true;
gradient.minFilter=gradient.magFilter=THREE.NearestFilter;
const paintRamp=new THREE.DataTexture(new Uint8Array([142,181,219,255]),4,1,THREE.RedFormat);
paintRamp.minFilter=paintRamp.magFilter=THREE.NearestFilter;
paintRamp.needsUpdate=true;

const materials=new Map();
const geometries=new Map();
export function material(color,kind='toon') {
  const key=kind+color;
  if(materials.has(key)) return materials.get(key);
  const options={color};
  let value;
  if(kind==='ink') value=new THREE.MeshBasicMaterial({...options,side:THREE.BackSide,toneMapped:false});
  else if(kind==='paint') value=new THREE.MeshToonMaterial({...options,gradientMap:paintRamp});
  else if(kind==='light') value=new THREE.MeshBasicMaterial(options);
  else if(kind==='soft') value=new THREE.MeshLambertMaterial(options);
  else if(kind==='gloss') value=new THREE.MeshPhongMaterial({...options,shininess:34,specular:0x9ca99c});
  else value=new THREE.MeshToonMaterial({...options,gradientMap:gradient});
  materials.set(key,value);
  return value;
}
function geometry(key,factory){
  if(!geometries.has(key)) geometries.set(key,factory());
  return geometries.get(key);
}
export const boxShape=geometry('box',()=>new THREE.BoxGeometry(1,1,1));
export const crystalShape=geometry('crystal',()=>new THREE.OctahedronGeometry(.5));
export const rockShape=geometry('rock',()=>new THREE.IcosahedronGeometry(.6,0));
export const ballShape=geometry('ball',()=>new THREE.SphereGeometry(.5,16,12));
const poleShape=geometry('pole',()=>new THREE.CylinderGeometry(.5,.5,1,8));
const foliageShape=geometry('foliage',()=>new THREE.IcosahedronGeometry(.5,1));

export function piece(group,shape,mat,x,y,z,sx=1,sy=sx,sz=sx) {
  const object=new THREE.Mesh(shape,mat);
  object.position.set(x,y,z);
  object.scale.set(sx,sy,sz);
  group.add(object);
  return object;
}
export const box=(group,color,x,y,z,sx,sy,sz,kind)=>piece(group,boxShape,material(color,kind),x,y,z,sx,sy,sz);
export const rock=(group,color,x,y,z,sx,sy,sz,kind='soft')=>piece(group,rockShape,material(color,kind),x,y,z,sx,sy,sz);
export const crystal=(group,color,x,y,z,sx,sy,sz,kind)=>piece(group,crystalShape,material(color,kind),x,y,z,sx,sy,sz);
export const sphere=(group,color,x,y,z,sx,sy,sz,kind)=>piece(group,ballShape,material(color,kind),x,y,z,sx,sy,sz);
export function cylinder(group,color,x,y,z,top,bottom,height,sides=10,kind) {
  const shape=geometry('c'+[top,bottom,sides].join(','),()=>new THREE.CylinderGeometry(top,bottom,1,sides));
  return piece(group,shape,material(color,kind),x,y,z,1,height,1);
}
export function hoop(group,color,x,y,z,radius,width,kind) {
  const shape=geometry('t'+[radius,width].join(','),()=>new THREE.TorusGeometry(radius,width,5,24));
  return piece(group,shape,material(color,kind),x,y,z);
}
export function rod(group,color,a,b,width,kind) {
  const origin=new THREE.Vector3(...a);
  const end=new THREE.Vector3(...b);
  const middle=origin.clone().add(end).multiplyScalar(.5);
  const object=piece(group,poleShape,material(color,kind),middle.x,middle.y,middle.z,width,end.distanceTo(origin),width);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(origin).normalize());
  return object;
}

export function makeLights(scene,strength=1){
  const sky=new THREE.HemisphereLight(0xf9ffd8,0x61715f,2.65*strength);
  scene.add(sky);
  const sun=new THREE.DirectionalLight(0xffe8b1,2.3*strength);
  sun.position.set(-12,20,9);
  scene.add(sun);
  const bounce=new THREE.DirectionalLight(0x9ce6ed,.46*strength);
  bounce.position.set(7,8,-12);
  scene.add(bounce);
  return sun;
}

const hideShape=geometry('hide',()=>new THREE.SphereGeometry(.5,16,12));
const hideDetail=geometry('hide-detail',()=>new THREE.SphereGeometry(.5,12,8));
const finShape=geometry('fin',()=>{
  const form=new THREE.Shape();
  form.moveTo(-.5,-.27);
  form.quadraticCurveTo(-.17,-.43,.42,-.29);
  form.quadraticCurveTo(.55,-.12,.33,.16);
  form.quadraticCurveTo(.16,.39,.04,.57);
  form.quadraticCurveTo(-.22,.45,-.41,.14);
  form.quadraticCurveTo(-.62,-.15,-.5,-.27);
  const shape=new THREE.ExtrudeGeometry(form,{
    depth:.16,curveSegments:4,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.065,bevelThickness:.045
  });
  shape.translate(0,0,-.08);
  return shape;
});
function rounded(group,color,x,y,z,sx,sy,sz,stroke=0){
  const shape=Math.max(sx,sy,sz)<=.31?hideDetail:hideShape;
  const part=piece(group,shape,material(color,'paint'),x,y,z,sx,sy,sz);
  part.userData.stroke=stroke;
  return part;
}
function fin(group,color,x,y,z,width,height,thickness,rotation=0,stroke=.024){
  const part=piece(group,finShape,material(color,'paint'),x,y,z,width,height,thickness);
  part.rotation.y=rotation;
  part.userData.stroke=stroke;
  return part;
}
function horn(group,color,start,end,width,stroke=.018){
  const a=new THREE.Vector3(...start), b=new THREE.Vector3(...end);
  const mid=a.clone().add(b).multiplyScalar(.5);
  const part=cylinder(group,color,mid.x,mid.y,mid.z,width*.19,width,b.distanceTo(a),10,'paint');
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());
  part.userData.stroke=stroke;
  return part;
}
const paintMix=(a,b,amount)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),amount).getHexString();
const INK='#39252b';
const MOUTH='#56352f';
const CREAM='#ffdf9c';

function addContours(root){
  const parts=[];
  root.traverse(part=>{if(part.userData.stroke) parts.push(part);});
  const bounds=new THREE.Vector3();
  for(const part of parts){
    const width=part.userData.stroke;
    if(!part.geometry.boundingBox) part.geometry.computeBoundingBox();
    part.geometry.boundingBox.getSize(bounds);
    const shell=new THREE.Mesh(part.geometry,material(INK,'ink'));
    shell.position.copy(part.position);
    shell.quaternion.copy(part.quaternion);
    shell.scale.copy(part.scale);
    for(const axis of ['x','y','z']) shell.scale[axis]+=Math.min(.32,width*2/Math.max(.14,bounds[axis]));
    shell.userData.contour=true;
    part.parent.add(shell);
  }
}

const tailShape=geometry('swept-tail',()=>{
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,.10),new THREE.Vector3(.035,-.02,-.21),
    new THREE.Vector3(.14,.028,-.49),new THREE.Vector3(.31,.15,-.78),
    new THREE.Vector3(.44,.31,-1.06)
  ]);
  const slices=13,rings=10;
  const positions=[], indices=[];
  const frames=curve.computeFrenetFrames(slices,false);
  for(let i=0;i<=slices;i++){
    const t=i/slices, origin=curve.getPointAt(t);
    const radius=.012+.225*(1-t)**1.05;
    for(let j=0;j<rings;j++){
      const angle=j*Math.PI*2/rings;
      const point=origin.clone().addScaledVector(frames.normals[i],Math.cos(angle)*radius)
        .addScaledVector(frames.binormals[i],Math.sin(angle)*radius);
      positions.push(point.x,point.y,point.z);
      if(i>0){
        const current=i*rings+j;
        const next=i*rings+(j+1)%rings;
        indices.push(current-rings,next-rings,current,next-rings,next,current);
      }
    }
  }
  const tip=curve.getPointAt(1);
  positions.push(tip.x,tip.y,tip.z);
  const cap=(slices+1)*rings;
  for(let j=0;j<rings;j++) indices.push(slices*rings+j,slices*rings+(j+1)%rings,cap);
  const shape=new THREE.BufferGeometry();
  shape.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  shape.setIndex(indices);
  shape.computeVertexNormals();
  return shape;
});

const frames={
  biped:{height:.82,wide:.82,length:.94,headY:1.54,headZ:.41,headW:1.09,headH:1.03,depth:.93,snout:.47,tail:.95},
  runner:{height:.82,wide:.77,length:1.02,headY:1.48,headZ:.50,headW:1.04,headH:.93,depth:.94,snout:.58,tail:1.12},
  plated:{height:.66,wide:.91,length:1.23,headY:.94,headZ:.79,headW:.88,headH:.82,depth:.83,snout:.42,tail:1.07,quad:true},
  tank:{height:.63,wide:1.06,length:1.28,headY:.89,headZ:.80,headW:.90,headH:.79,depth:.87,snout:.45,tail:.94,quad:true},
  horned:{height:.72,wide:1.01,length:1.16,headY:1.03,headZ:.72,headW:1.05,headH:.88,depth:.88,snout:.57,tail:.87,quad:true},
  swimmer:{height:.63,wide:.79,length:1.21,headY:.92,headZ:.79,headW:.85,headH:.79,depth:.90,snout:.74,tail:1.20,quad:true},
  flier:{height:.81,wide:.69,length:.96,headY:1.35,headZ:.51,headW:.94,headH:.86,depth:.84,snout:.46,tail:.99},
  giant:{height:.87,wide:.92,length:1.11,headY:1.55,headZ:.48,headW:1.18,headH:1.02,depth:1.01,snout:.69,tail:1.16},
  neck:{height:.77,wide:.94,length:1.12,headY:2.04,headZ:.63,headW:.85,headH:.80,depth:.84,snout:.40,tail:1.08,quad:true},
  slender:{height:.81,wide:.70,length:.91,headY:1.73,headZ:.48,headW:.89,headH:.88,depth:.88,snout:.49,tail:1.04}
};
const silhouettes={
  beak:'biped',plates:'plated',armor:'tank',spines:'plated',dome:'biped',twin:'runner',raptor:'runner',
  sail:'swimmer',croc:'swimmer',wing:'flier',glider:'flier',horns:'horned',blade:'runner',crest:'biped',
  rex:'giant',plume:'runner',frill:'horned',thumbs:'biped',duck:'slender',long:'neck',sauropod:'neck',
  helmet:'biped',bosses:'horned',ostrich:'slender',royal:'runner',flame:'giant',bull:'giant',
  claws:'slender',mother:'biped',duelist:'runner',lookout:'runner',egg:'slender'
};
const beaks=new Set(['beak','horns','frill','egg','bosses','ostrich','duck']);
const teeth=new Set(['rex','bull','croc','sail','raptor','duelist']);

function makeFace(head,jaw,profile,palette,unit){
  const eyes=[];
  const [skin,belly,crest,tint]=palette;
  const {headW:w,headH:h,snout,depth}=profile;
  const beaked=beaks.has(unit.plan);
  const eyeMark=paintMix(belly,skin,.18);
  const muzzle=paintMix(belly,skin,.09);
  rounded(head,skin,0,.025,.007,w,h,depth,.038);
  const muzzleWidth=w*(beaked ? .64 : .79);
  const muzzleZ=(depth*.32+snout*.25);
  const muzzleLength=snout*(beaked ? .87 : 1.21);
  rounded(head,muzzle,0,-h*.205,muzzleZ,muzzleWidth,h*.38,muzzleLength,.023);
  rounded(jaw,eyeMark,0,.014,snout*.33,muzzleWidth*.91,h*.26,snout*.94,.016);
  if(beaked){
    rounded(head,paintMix(belly,crest,.31),0,-h*.24,muzzleZ+muzzleLength*.43,
      w*.36,h*.22,.20,.017);
  }
  const front=muzzleZ+muzzleLength*.49;
  for(const side of [-1,1]){
    const eye=new THREE.Group();
    eye.position.set(side*w*.244,h*.11,depth*.416);
    eye.rotation.set(-.06,side*.34,side*.125);
    head.add(eye);
    eyes.push(eye);
    rounded(eye,eyeMark,0,-h*.039,-.025,w*.49,h*.66,.23);
    rounded(eye,MOUTH,0,0,.078,w*.348,h*.47,.125);
    rounded(eye,'#fff5df',0,.002,.111,w*.313,h*.428,.127);
    rounded(eye,'#754734',side*-.024,-h*.021,.167,w*.151,h*.239,.076);
    rounded(eye,'#36222a',side*-.020,-h*.016,.192,w*.112,h*.194,.055);
    const light=sphere(eye,'#fff9ec',-.023,h*.048,.223,.085,.095,.027,'light');
    light.rotation.z=-.22;
    sphere(eye,'#f7b47a',.024,-h*.082,.207,.038,.039,.021,'light');
    const brow=rounded(eye,paintMix(crest,INK,.58),side*.02,h*.263,.074,w*.31,h*.102,.115);
    brow.rotation.z=side*(unit.category==='military' ? .24 : .11);

    const nostril=rounded(head,paintMix(MOUTH,belly,.09),side*muzzleWidth*.237,-h*.153,front,
      .054,.032,.022);
    nostril.rotation.z=side*.30;
    if(teeth.has(unit.plan)) rounded(jaw,'#fff0c7',side*muzzleWidth*.38,-h*.03,snout*.55,.12,.17,.117);
    const curve=rounded(jaw,MOUTH,side*muzzleWidth*.36,-.016,snout*.57,.14,.035,.022);
    curve.rotation.z=side*.24;
    rounded(head,paintMix(belly,tint,.32),side*w*.361,-h*.26,depth*.41,.148,.081,.035).rotation.y=side*.43;
  }
  const shine=rounded(head,paintMix(belly,skin,.32),-.24*w,h*.376,depth*.345,.235,.054,.035);
  shine.rotation.z=.41;
  shine.rotation.y=-.18;
  return eyes;
}

function decorateSkull(head,plan,palette,profile){
  const [skin,belly,crest,tint]=palette;
  const {headW:w,headH:h,snout}=profile;
  if(['horns','frill','bosses'].includes(plan)){
    const collar=rounded(head,crest,0,.16,-.26,w*1.46,h*1.34,.37,.035);
    collar.rotation.x=-.19;
    rounded(head,tint,0,.20,-.115,w*1.24,h*1.13,.21);
    for(let i=-2;i<=2;i++) {
      horn(head,belly,[i*w*.214,h*.64-i*i*.024,-.19],[i*w*.27,h*.79-i*i*.066,-.21],.064);
    }
    for(const side of [-1,1]){
      if(plan==='horns') horn(head,CREAM,[side*w*.451,h*.30,.32],[side*w*.60,h*.56,.93],.115,.027);
      if(plan==='bosses') rounded(head,belly,side*w*.438,h*.34,.35,.24,.28,.25,.021);
      if(plan==='frill') rounded(head,tint,side*w*.553,h*.22,-.07,.20,.28,.13,.017);
    }
    if(plan==='horns') horn(head,belly,[0,-h*.12,snout*.91],[0,h*.16,snout*1.18],.075,.017);
  }
  if(plan==='dome'){
    rounded(head,crest,0,h*.49,-.03,w*.98,.60,.77,.033);
    rounded(head,paintMix(tint,belly,.39),-.07,h*.60,.065,w*.71,.36,.63);
    for(const side of [-1,1]) for(const z of [-.23,.09,.26]){
      rounded(head,belly,side*w*.444,h*.38,z,.13,.15,.16,.011);
    }
  }
  if(plan==='twin'||plan==='flame'){
    for(const side of [-1,1]){
      const scale=plan==='flame'?1.26:1;
      const ridge=fin(head,crest,side*.123,h*.54,.065,.76*scale,.57*scale,.64,Math.PI/2);
      ridge.rotation.z=side*.16;
      fin(head,tint,side*.151,h*.61,-.09,.37,.40,.49,Math.PI/2,0).rotation.z=side*.26;
    }
  }
  if(plan==='crest'){
    const roller=fin(head,crest,0,h*.54,-.40,1.31,.72,1.02,Math.PI/2,.038);
    roller.rotation.x=-.36;
    fin(head,tint,0,h*.74,-.48,.61,.42,.85,Math.PI/2,0).rotation.x=-.36;
  }
  if(['helmet','royal','egg','mother'].includes(plan)){
    const scale=plan==='royal'?1.19:1;
    fin(head,crest,0,h*.51,-.19,.70*scale,.72*scale,1.0,Math.PI/2,.027);
    fin(head,tint,0,h*.64,-.18,.46*scale,.42*scale,.86,Math.PI/2,0);
  }
  if(['blade','bull','rex'].includes(plan)){
    const horns=plan==='bull'?[-1,1]:[0];
    for(const side of horns){
      horn(head,crest,[side*w*.38,h*.38,.28],[side*w*.57,h*.71,plan==='blade' ? .64 : .34],.133,.024);
    }
  }
  if(['plume','raptor','wing','glider','duelist','lookout','ostrich','claws','beak'].includes(plan)){
    const count=plan==='beak'?2:3;
    for(let i=0;i<count;i++){
      const feather=fin(head,i===2?belly:crest,(i-(count-1)*.5)*.12,h*.44+i*.052,-.27,.50,.43,.63,Math.PI/2-.34*i,.022);
      feather.rotation.x=.25+i*.17;
    }
  }
}

function makeLimbs(spine,profile,palette,plan){
  const [skin,belly,crest]=palette;
  const joints=[];
  for(const side of [-1,1]){
    const leg=new THREE.Bone();
    leg.position.set(side*profile.wide*.37,profile.height-.17,-.26);
    spine.add(leg);
    joints.push(leg);
    const length=profile.height-.17;
    const thigh=rounded(leg,skin,0,-length*.39,0,.43,length*.96,.45,.019);
    thigh.rotation.x=.34;
    rounded(leg,skin,0,-length*.75,.11,.27,length*.52,.31,.018);
    const footZ=profile.quad ? .16 : .24;
    rounded(leg,belly,0,-length+.085,footZ,.43,.23,.50,.023);
    for(let i=-1;i<=1;i++) rounded(leg,CREAM,i*.093,-length+.082,footZ+.194,.10,.082,.15);
    if(profile.quad){
      const fore=new THREE.Bone();
      fore.position.set(side*profile.wide*.40,profile.height-.18,.38);
      spine.add(fore);
      joints.push(fore);
      rounded(fore,skin,0,-length*.48,.047,.36,length*.98,.35,.018);
      rounded(fore,belly,0,-length+.082,.14,.34,.24,.45,.020);
      for(const x of [-.083,.083]) rounded(fore,CREAM,x,-length+.082,.30,.096,.075,.102);
      continue;
    }
    const arm=new THREE.Bone();
    arm.position.set(side*profile.wide*.48,profile.height+.12,.31);
    spine.add(arm);
    joints.push(arm);
    if(plan==='wing'||plan==='glider'){
      rounded(arm,skin,side*.31,-.014,.013,.81,.20,.30,.02);
      if(plan==='glider'){
        const sail=fin(arm,crest,side*.53,-.005,-.22,1.26,.63,.48,.07*side,.028);
        sail.rotation.x=Math.PI/2;
        horn(arm,belly,[side*.70,0,.18],[side*1.08,.044,.09],.068);
      }else{
        for(let i=0;i<4;i++){
          const feather=rounded(arm,i%2?crest:skin,side*(.29+i*.205),-.023,-.23-i*.043,.30,.103,.83-i*.063,.019);
          feather.rotation.y=side*(i*.11-.26);
        }
      }
    }else{
      const armLength=plan==='rex'||plan==='bull' ? .32 : plan==='claws' ? .60 : .49;
      rounded(arm,skin,side*.053,-armLength*.38,.115,.26,armLength*.85,.31,.020).rotation.x=-.45;
      rounded(arm,belly,side*.086,-armLength*.67,.29,.30,.25,.35,.020).rotation.z=side*.16;
      for(let i=0;i<3;i++){
        const x=side*.086+(i-1)*.083;
        rounded(arm,CREAM,x,-armLength*.69,.443,.078,.087,.127);
      }
    }
  }
  return joints;
}

function decorateBody(spine,tail,plan,palette,profile){
  const [,belly,crest,tint]=palette;
  const h=profile.height, ts=profile.tail;
  if(plan==='plates'||plan==='sail'||plan==='spines'||plan==='croc'){
    for(let i=0;i<5;i++){
      const z=.36-i*.236;
      if(plan==='plates'||plan==='sail'){
        fin(spine,i%2?crest:tint,plan==='plates'?(i%2-.5)*.14:0,h+.32+(i<3 ? .13 : 0),z,
          .30+(4-i)*.031,plan==='sail'?.93-i*.117:.66-i*.066,.58,Math.PI/2,.022);
      }else{
        for(const side of [-1,1]){
          const kent=plan==='spines';
          horn(spine,i%2?crest:belly,[side*.24,h+.24,z],[side*(kent ? .53 : .31),h+(kent ? .81 : .52)-i*.068,z-.14],.107);
        }
      }
    }
  }
  if(plan==='armor'){
    rounded(spine,crest,0,h+.24,-.13,1.11,.53,1.25,.032);
    for(const side of [-1,0,1]){
      for(let i=0;i<3;i++){
        rounded(spine,i%2?belly:tint,side*.29,h+.43-Math.abs(side)*.083,.19-i*.29,.31,.24,.32,.017);
      }
    }
    rounded(tail,crest,ts*.47,.30,-ts*1.02,.5,.44,.49,.026);
    rounded(tail,belly,ts*.51,.38,-ts*1.08,.33,.29,.35);
  }
  if(['plume','wing','royal','duelist','lookout'].includes(plan)){
    for(let i=-1;i<=1;i++){
      const feather=rounded(tail,i===0?crest:tint,ts*.24+i*.16,.22,-ts*.92,.31,.12,.61,.017);
      feather.rotation.y=-i*.36;
    }
  }
  if(['beak','sauropod','spines'].includes(plan)){
    for(const side of [-1,1]){
      horn(tail,crest,[ts*.19+side*.11,.16,-ts*.61],[ts*.23+side*.32,.31,-ts*.9],.079);
    }
  }
  if(['croc','sail','duck','glider'].includes(plan)){
    fin(tail,crest,.29*ts,.21,-ts*.68,.53,.44,.63,Math.PI/2,.02);
  }
  for(const side of [-1,1]){
    for(let i=0;i<3;i++){
      const patch=rounded(spine,i===1?tint:crest,side*(profile.wide*.473-i*.024),h+.11-i*.078,.18-i*.215,.06,.16,.21);
      patch.rotation.x=-.41;
    }
  }
  if(['long','mother','egg','bosses','frill'].includes(plan)){
    for(let i=-1;i<=1;i++){
      rounded(spine,i===0?belly:crest,i*.22,h+.25-Math.abs(i)*.065,-.15,.27,.24,.39,.013);
    }
  }
}

function growingProfile(plan,tier){
  const frame=frames[silhouettes[plan]];
  const maturity=tier/5;
  return {
    ...frame,
    height:frame.height*(.85+.24*maturity),
    wide:frame.wide*(.89+.27*maturity),
    length:frame.length*(.90+.30*maturity),
    headY:frame.headY*(.90+.15*maturity),
    headZ:frame.headZ*(.89+.28*maturity),
    headW:frame.headW*(1.07-.09*maturity),
    headH:frame.headH*(1.06-.10*maturity),
    depth:frame.depth*(.96+.07*maturity),
    snout:frame.snout*(.80+.44*maturity),
    tail:frame.tail*(.70+.49*maturity)
  };
}

function growthPalette(unit,tier,design){
  const [skin,belly,crest,tint]=unit.palette;
  if(!tier) return [paintMix(skin,'#ffe6ad',.15),belly,paintMix(crest,skin,.21),tint];
  const age=[0,.17,.30,.45,.59,.73][tier];
  const adultSkin=paintMix(design.skin,design.pattern,.32);
  return [
    paintMix(skin,adultSkin,age),
    paintMix(belly,design.skin,age*.63),
    paintMix(crest,design.pattern,age*1.16),
    paintMix(tint,design.skin,age*1.21)
  ];
}

const anatomyMounts={
  crown:(p,rig)=>[[rig.head,0,p.headH*.43,-.17,0]],
  crest:(p,rig)=>[[rig.head,0,p.headH*.35,-p.depth*.33,Math.PI/2]],
  cheek:(p,rig)=>[-1,1].map(side=>[rig.head,side*p.headW*.426,.07,p.depth*.18,side*.79]),
  chest:(p,rig)=>[[rig.spine,0,p.height-.08,p.length*.515,0]],
  throat:(p,rig)=>[[rig.spine,0,p.height+.32,p.headZ*.64+.25,0]],
  side:(p,rig)=>[[rig.spine,p.wide*.452,p.height+.11,-.19,.83]],
  spine:(p,rig)=>[[rig.spine,-.022,p.height+.32,-.29,Math.PI/2]],
  ridge:(p,rig)=>[[rig.spine,-.06,p.height+.31,-p.length*.45,0]],
  flank:(p,rig)=>[-1,1].map(side=>[rig.spine,side*(p.wide*.444),p.height+.11,-.20,side*.78]),
  tail:(p,rig)=>[[rig.tail,p.tail*.31,.26,-p.tail*.86,Math.PI/2]],
  wrist:(p,rig)=>[-1,1].map((side,i)=>[rig.joints[i*2+1],side*.083,-p.height*.29,.226,side*.27]),
  wings:(p,rig)=>[-1,1].map((side,i)=>[rig.joints[i*2+1],side*.68,.028,-.19,side*.66])
};
const skinPatches=new Set(['eye-stripe','belly','spots','stripes','freckles','dew','spot','scale-pattern','bib','patch','rosettes','glow','luminescence']);
const scales=new Set(['scutes','armor','shell','carapace','armor-spines','scales','keeled-scales','scute']);
const plumage=new Set(['plumes','ruff','spine-fan','fan','fin','twin-fins','tuft','sail','leaf-crest','ribbon-fin',
  'flippers','flight-feathers','membrane','sun-crest','petals','spine-row','ridge','throat-frill']);

function growTrait(group,shape,palette){
  const [skin,belly,deep,mark]=palette;
  if(skinPatches.has(shape)){
    const broad=['belly','bib','patch','eye-stripe','spot','luminescence'].includes(shape);
    const row=shape==='stripes';
    if(broad){
      const stripe=shape==='eye-stripe';
      rounded(group,mark,0,.025,.035,stripe?.46:.61,stripe?.16:.34,.088).rotation.z=stripe?-.29:.20;
      if(shape==='luminescence') rounded(group,belly,-.10,.071,.069,.18,.16,.035);
      return;
    }
    const count=shape==='freckles'||shape==='scale-pattern'?5:3;
    for(let i=0;i<count;i++){
      const x=(i-(count-1)*.5)*.128;
      const spots=rounded(group,i%2?mark:belly,x,.032+(i%2)*.081,-.03+(1-Math.abs(x))*.063,
        row?.17:.19,row?.43:.15+.015*i,row?.103:.087);
      spots.rotation.z=row?-.38:i*.10;
      if(shape==='rosettes') rounded(group,deep,x,.047+i%2*.081,.063,.063,.054,.029);
    }
    return;
  }
  if(scales.has(shape)){
    const count=['armor','carapace','armor-spines','keeled-scales'].includes(shape)?5:shape==='scute'?1:3;
    const taper=shape==='armor-spines'||shape==='keeled-scales';
    for(let i=0;i<count;i++){
      const index=i-(count-1)*.5;
      const scute=rounded(group,i%2?mark:deep,index*.137,.061+(i%2)*.055,-Math.abs(index)*.039,
        .30,.30+(taper?.08:0),.279,.019);
      scute.rotation.z=-index*.13;
      if(taper) horn(group,belly,[index*.14,.16,0],[index*.18,.36+i*.015,-.07],.064,.013);
    }
    return;
  }
  if(plumage.has(shape)){
    const wide=['fan','ruff','spine-fan','sun-crest','petals','flight-feathers'].includes(shape);
    const membrane=shape==='membrane'||shape==='flippers'||shape==='sail';
    const count=wide?5:shape==='fin'||shape==='ribbon-fin'?1:3;
    const length=shape==='sail'?1.02:shape==='ribbon-fin'?.85:membrane?.77:.55;
    for(let i=0;i<count;i++){
      const index=i-(count-1)*.5;
      const plate=fin(group,i%2?mark:deep,index*(membrane?.16:.128),.12-.022*Math.abs(index),
        -.011+i*.032,membrane?.44:.29,length-Math.abs(index)*.05,membrane?.66:.47,0,.02);
      plate.rotation.z=-index*(wide?.34:.18);
      if(membrane) plate.rotation.x=-.39;
    }
    return;
  }
  if(['hump','air-sacs','throat-sac','club'].includes(shape)){
    const paired=shape==='air-sacs';
    for(const x of paired?[-.22,.22]:[0]){
      rounded(group,skin,x,.10,-.013,shape==='hump'?.68:.41,.41,.45,.025);
      rounded(group,mark,x,.149,.105,.36,.30,.25,.012);
      if(shape==='club') horn(group,deep,[x,.125,-.068],[x+.06,.39,-.15],.098,.019);
    }
    return;
  }
  const long=shape==='sting'||shape==='curved-horn';
  const crown=['barbs','quills','spikes','feelers'].includes(shape);
  const count=shape==='quills'?7:crown?4:long?1:2;
  for(let i=0;i<count;i++){
    const offset=i-(count-1)*.5;
    const x=offset*.136,start=[x,.014,0];
    const end=[x*1.55,.31+(long?.26:0)-.037*Math.abs(offset),.11-Math.abs(offset)*.067];
    horn(group,shape==='claws'||shape==='tusks'?belly:i%2?mark:deep,start,end,
      shape==='feelers'?.042:long?.11:.081,.019);
    if(shape==='antlers'||shape==='curved-horn'){
      horn(group,mark,[end[0]*.8,.26,end[2]],[end[0]*1.08+.10,end[1]+.11,-.11],.057,.013);
    }
  }
}

function addAnatomy(tier,profile,rig,stages,palette){
  for(let index=0;index<tier;index++){
    const {mount,shape}=stages[index];
    for(const [parent,x,y,z,direction] of anatomyMounts[mount](profile,rig)){
      const trait=new THREE.Group();
      trait.position.set(x,y,z);
      trait.rotation.y=direction;
      trait.scale.setScalar(.67+index*.057+tier*.072);
      trait.userData.trait=shape;
      parent.add(trait);
      growTrait(trait,shape,palette);
    }
  }
}
export function makeTower(type,tier=0,path=null,wet=false,bond=0){
  const unit=TOWER_BY_ID[type], plan=unit.plan;
  const design=EVOLUTION_DESIGNS[type][path??0];
  const palette=growthPalette(unit,tier,design);
  const [skin,belly,crest,tint]=palette;
  const profile=growingProfile(plan,tier);
  const h=profile.height;
  const root=new THREE.Group();
  const base=new THREE.Group();
  const body=new THREE.Group();
  root.add(base,body);
  const border=tier?palette[3]:unit.color;
  const baseScale=.87;
  const rim=cylinder(base,border,0,.139,0,.72,.76,.067,12,'paint');
  if(wet){
    cylinder(base,'#3f635e',0,.045,0,.77,.84,.12,12,'paint');
    rim.position.y=.098;
    hoop(base,tier?belly:'#c4efe7',0,.145,0,.77,.035,'paint').rotation.x=Math.PI/2;
  }else{
    cylinder(base,'#433840',0,.052,0,.78,.86,.12,12,'paint');
    cylinder(base,'#8b795f',0,.12,0,.76,.80,.077,12,'paint');
    cylinder(base,'#cab795',0,.192,0,.66,.724,.048,12,'paint');
    if(tier>=4) hoop(base,belly,0,.174,0,.724,.027,'paint').rotation.x=Math.PI/2;
  }
  base.scale.set(baseScale,1,baseScale);
  body.position.y=wet ? .052 : .212;
  const spine=new THREE.Bone();
  spine.scale.setScalar(GROWTH[tier]);
  body.add(spine);
  rounded(spine,skin,0,h,0,profile.wide,.84,profile.length,.036);
  const stomach=rounded(spine,belly,0,h-.137,.235,profile.wide*.76,.62,profile.length*.77,.012);
  stomach.rotation.x=-.18;
  const tail=new THREE.Bone();
  tail.position.set(0,h-.079,-profile.length*.34);
  spine.add(tail);
  const tailSkin=piece(tail,tailShape,material(skin,'paint'),0,0,0,profile.tail,.97,profile.tail);
  tailSkin.userData.stroke=.028;
  const head=new THREE.Bone();
  head.position.set(0,profile.headY,profile.headZ);
  spine.add(head);
  const neckMid=(profile.headY+h)*.5;
  const neckHeight=profile.headY-h+.41;
  const long=profile.headY>1.9;
  const neck=rounded(spine,skin,0,neckMid,profile.headZ*.54,long ? .49 : .53,neckHeight,.51,.029);
  neck.rotation.x=Math.atan2(profile.headZ*.80,Math.max(.39,profile.headY-h));
  if(long){
    const front=rounded(spine,belly,0,neckMid+.035,profile.headZ*.67+.105,.37,neckHeight*.89,.35,.012);
    front.rotation.x=neck.rotation.x;
  }
  const jaw=new THREE.Bone();
  jaw.position.set(0,-profile.headH*.357,profile.depth*.23);
  head.add(jaw);
  const eyes=makeFace(head,jaw,profile,palette,unit);
  decorateSkull(head,plan,palette,profile);
  const joints=makeLimbs(spine,profile,palette,plan);
  decorateBody(spine,tail,plan,palette,profile);
  if(type==='iris'){
    fin(spine,crest,.43,h+.27,-.33,.56,.68,.61,.63);
    fin(spine,tint,-.43,h+.27,-.33,.56,.68,.61,-.63);
  }
  if(type==='handler'){
    const pet=new THREE.Group();
    pet.position.set(.60,wet ? .06 : .12,-.43);
    pet.rotation.y=-.33;
    pet.scale.setScalar(.80+bond*.28);
    spine.add(pet);
    const petSkin=wet?'#5aa8ac':'#d48865';
    rounded(pet,petSkin,0,.32,.05,.55,.48,.64,.021);
    rounded(pet,petSkin,.04,.59,.29,.55,.49,.49,.024);
    rounded(pet,'#ffd2a2',.04,.52,.49,.39,.22,.31,.013);
    horn(pet,petSkin,[0,.28,-.19],[-.095,.25,-.55],.14);
    for(const side of [-1,1]){
      rounded(pet,'#fff7e0',.04+side*.13,.64,.48,.16,.18,.092);
      rounded(pet,MOUTH,.044+side*.14,.65,.524,.073,.106,.042);
      rounded(pet,wet?tint:petSkin,side*.17,.12,.11,.20,.24,.26,.013);
    }
    if(wet||bond>=2) fin(pet,wet?'#99e9bd':tint,0,.66,-.15,.40,.46,.54,Math.PI/2);
  }
  if(tier>0) addAnatomy(tier,profile,{spine,head,tail,joints},design.stages,palette);
  addContours(body);
  const headBase=head.position.clone();
  const pose=(time,move={},growth=1)=>{
    const breath=Math.sin(time*2.45);
    const stride=Math.sin(time*10.5);
    const crouch=move.crouch||0,stretch=move.stretch||0;
    const flex=GROWTH[tier]*growth;
    spine.position.y=breath*.029-crouch*.12;
    spine.scale.set(flex*(1-stretch*.26+crouch*.13),flex*(1+stretch-crouch),flex*(1+stretch*.32+crouch*.07));
    spine.rotation.x=(move.lean||0)*.68;
    spine.rotation.z=(move.bank||0)*.71;
    head.position.y=headBase.y+breath*.021-crouch*.17;
    head.position.z=headBase.z+stretch*.26;
    head.rotation.x=(move.nod||0)+breath*.045;
    head.rotation.z=Math.sin(time*1.31)*.041+(move.bank||0)*.19;
    jaw.rotation.x=Math.max(0,move.jaw||0);
    tail.rotation.x=breath*.055-(move.paw||0)*.09;
    tail.rotation.y=Math.sin(time*2.37)*.14+(move.tail||0);
    const blinkCycle=(time+.79)%4.63;
    const blink=blinkCycle<.13?Math.sin(blinkCycle/.13*Math.PI):0;
    for(const eye of eyes) eye.scale.y=1-blink*.91;
    joints.forEach((joint,index)=>{
      const a=index<2?-1:1;
      const paw=move.paw||0;
      joint.rotation.x=Math.sin(time*1.9+index)*.048+paw*a*(index%2===1 ? .68 : .43)+stride*(move.travel||0)*.09;
      joint.rotation.z=unit.stats.motion&&index%2===1?a*(Math.sin(time*10)*.36+(move.wing||0)):paw*a*.12;
    });
  };
  return {
    root,base,body,spine,head,pose,accent:border,tier,turn:0,born:0,
    headHeight:profile.headY*GROWTH[tier]+.16,
    muzzleReach:(profile.headZ+profile.snout*.72)*GROWTH[tier]
  };
}
export function makeEnemy(type){
  const def=ENEMIES[type];
  const model=new THREE.Group();
  let lift=1;
  if(def.airship){
    const boss=type==='boss';
    const s=boss?1.32:1;
    lift=boss?1.62:1.45;
    sphere(model,def.color,0,.02,0,1.22*s,1.30*s,2.73*s,'gloss');
    sphere(model,boss?'#962e65':'#3b69aa',0,-.13,.54*s,1.16*s,1.09*s,1.50*s);
    for(const z of [-.52,.45]){
      hoop(model,boss?'#f1b65d':'#e5dbac',0,0,z*s,.58*s,.066*s);
    }
    sphere(model,boss?'#f4a86c':'#94d7ef',0,.04,1.15*s,.76*s,.78*s,.71*s);
    sphere(model,'#364546',0,-.71*s,-.05*s,.55*s,.36*s,1.25*s);
    for(const x of [-1,1]){
      const fin=crystal(model,boss?'#f0835e':'#6faecf',x*.62*s,.012,-.83*s,.77*s,.22*s,.69*s);
      fin.rotation.y=x*.3;
      sphere(model,'#ffdc7d',x*.21*s,-.67*s,.42*s,.12,.11,.11,'light');
    }
    crystal(model,def.color,0,.58*s,-.88*s,.2,.82*s,.77*s);
  }else{
    const armored=type==='lead'||type==='clay';
    const s=armored ? .88 : type==='pink' ? .64 : .76;
    const mat=def.hidden?'toon':'gloss';
    const core=sphere(model,def.color,0,0,0,s,s*1.175,s*.96,mat);
    if(def.hidden){
      core.material=core.material.clone();
      core.material.transparent=true;
      core.material.opacity=.67;
      const halo=hoop(model,'#ebd9fb',0,0,0,.39,.023,'light');
      halo.rotation.x=Math.PI*.48;
    }
    if(type==='stripe'){
      for(const y of [-.20,0,.21]){
        hoop(model,'#55506b',0,y,0,s*(y===0 ? .49 : .43),.037).rotation.x=Math.PI/2;
      }
    }
    if(type==='opal'){
      const sheen=hoop(model,'#f1c2fa',0,.027,0,s*.51,.025,'light');
      sheen.rotation.set(Math.PI*.47,.46,.5);
    }
    if(armored){
      hoop(model,type==='lead'?'#d5d9ca':'#f1b67c',0,0,0,s*.49,.034).rotation.x=Math.PI/2;
      for(let i=0;i<4;i++){
        const angle=i*Math.PI/2+.3;
        sphere(model,'#efe4be',Math.cos(angle)*s*.48,.025,Math.sin(angle)*s*.48,.09,.09,.09);
      }
    }
    crystal(model,def.color,0,-s*.62,0,.15,.18,.12);
    rod(model,'#dfd9a6',[0,-s*.66,0],[.07,-s*1.05,-.026],.022,'soft');
    rod(model,'#dfd9a6',[.07,-s*1.05,-.026],[-.018,-s*1.22,-.02],.022,'soft');
  }
  return {model,lift};
}

export function makeTree(x,z,scale,random,mist=false){
  const group=new THREE.Group();
  group.position.set(x,0,z);
  group.scale.setScalar(scale);
  group.rotation.y=random()*Math.PI*2;
  const pine=random()<.44;
  const palette=mist
    ? (pine?['#436e60','#558775','#87a779']:['#4d7f68','#77a176','#9fbb7d'])
    : (pine?['#416e49','#548a50','#85a950']:['#50864b','#81ad52','#b0c966']);
  const trunk=rod(group,'#7f6245',[0,-.035,0],[.13,2,0],.21,'soft');
  trunk.receiveShadow=true;
  if(pine){
    for(let i=0;i<3;i++){
      const branch=cylinder(group,palette[i],.07,1.03+i*.53,0,.09,.86-i*.19,1.02,7,'soft');
      branch.rotation.y=i*1.12;
      branch.castShadow=true;
    }
  } else {
    const canopyData=[
      [-.34,1.48,-.09,1.27,1.33,1.22],
      [.42,1.64,.01,1.41,1.64,1.27],
      [.02,1.53,.42,1.3,1.35,1.22],
      [.04,2.08,-.13,1.45,1.53,1.31]
    ];
    canopyData.forEach(([a,b,c,d,e,f],i)=>{
      const leaves=piece(group,foliageShape,material(palette[Math.min(i,2)],'soft'),a,b,c,d,e,f);
      leaves.rotation.set(random()*.45,random()*6,random()*.25);
      leaves.castShadow=true;
    });
    if(random()<.55) sphere(group,'#e09557',.43,1.33,.61,.16,.15,.16,'soft');
  }
  return group;
}

export const sharedGeometry = value => Array.from(geometries.values()).includes(value);
export const sharedMaterial = value => Array.from(materials.values()).includes(value);


export function framePortrait(camera,root,aspect){
  root.updateMatrixWorld(true);
  const center=new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  camera.position.copy(center).add(new THREE.Vector3(3.0,2.65,7.35));
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const view=new THREE.Box3();
  const point=new THREE.Vector3();
  const modelView=new THREE.Matrix4();
  root.traverse(node=>{
    if(!node.isMesh) return;
    if(!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    const {min,max}=node.geometry.boundingBox;
    modelView.multiplyMatrices(camera.matrixWorldInverse,node.matrixWorld);
    for(const x of [min.x,max.x]) for(const y of [min.y,max.y]) for(const z of [min.z,max.z]){
      view.expandByPoint(point.set(x,y,z).applyMatrix4(modelView));
    }
  });
  const size=view.getSize(new THREE.Vector3());
  const offsets=view.getCenter(new THREE.Vector3());
  const half=Math.max(size.y*.535,size.x*.535/aspect);
  camera.left=offsets.x-half*aspect;
  camera.right=offsets.x+half*aspect;
  camera.top=offsets.y+half;
  camera.bottom=offsets.y-half;
  camera.updateProjectionMatrix();
}

export function createPortraits(){
  const width=320,height=256;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);
  renderer.setSize(width,height);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.10;
  const scene=new THREE.Scene();
  makeLights(scene,1.01);
  const camera=new THREE.OrthographicCamera(-2,2,1.6,-1.6,.01,40);
  const portraits=new Map();
  const comparisonFrames=new Map();
  function readyModel(type,tier,path,wet,bond){
    const {root,spine,pose}=makeTower(type,tier,path,wet,bond);
    spine.rotation.y=-.12;
    pose(.55);
    return root;
  }
  return (type,tier=0,path=null,wet=TOWER_BY_ID[type].stats.terrain==='water',bond=0,compare=false)=>{
    const key=[type,tier,tier||compare?path:null,wet,bond,compare].join('/');
    if(portraits.has(key)) return portraits.get(key);
    const root=readyModel(type,tier,path,wet,bond);
    if(compare){
      const framing=[type,wet,bond].join('/');
      if(!comparisonFrames.has(framing)){
        const adults=new THREE.Group();
        for(const branch of EVOLUTION_DESIGNS[type].keys()){
          adults.add(tier===5&&branch===(path??0)?root:readyModel(type,5,branch,wet,bond));
        }
        framePortrait(camera,adults,width/height);
        comparisonFrames.set(framing,camera.clone());
      }
      camera.copy(comparisonFrames.get(framing));
    }else framePortrait(camera,root,width/height);
    scene.add(root);
    renderer.render(scene,camera);
    const image=renderer.domElement.toDataURL('image/png');
    scene.remove(root);
    if(portraits.size>=120) portraits.delete(portraits.keys().next().value);
    portraits.set(key,image);
    return image;
  };
}
