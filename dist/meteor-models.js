import * as THREE from './vendor/three.module.min.js';
import {ENEMIES,seeded} from './campaign.js';
import {material} from './models.js';

const bodies={
  red:       [.38,'#733b37',[1.09,.88,1.07]],
  yellow:    [.43,'#855034',[.95,.83,1.27]],
  blue:      [.44,'#427084',[1.17,.78,.94]],
  green:     [.48,'#3e633a',[.98,1.10,.95]],
  pink:      [.34,'#823d54',[.86,.86,1.32]],
  lead:      [.53,'#636679',[1.10,.88,1.03]],
  veil:      [.45,'#685481',[1.07,1.04,.88]],
  basalt:    [.50,'#3a374b',[1.13,.85,1.13]],
  chalk:     [.49,'#719fac',[.89,1.14,.96]],
  stripe:    [.53,'#625574',[1.14,.79,1.02]],
  opal:      [.50,'#704c80',[.91,1.14,.89]],
  clay:      [.57,'#925641',[1.08,1.04,.93]],
  zephyr:    [.92,'#455c87',[1.15,.82,1.08]],
  boss:      [1.23,'#63303d',[1.06,.91,1.19]]
};

const models=new Map();
const rockPaint=material('#ffffff','paint').clone();
rockPaint.vertexColors=true;
const outline=new THREE.MeshBasicMaterial({color:'#453039',side:THREE.BackSide});

function sculpt(type){
  const [,stone,stretch]=bodies[type];
  const def=ENEMIES[type];
  const seed=Object.keys(bodies).indexOf(type)+1;
  const random=seeded(seed*7919);
  const shape=new THREE.IcosahedronGeometry(1,def.massive?3:2);
  const vertices=shape.attributes.position;
  const normal=new THREE.Vector3();
  const dents=[new THREE.Vector3(-.42,.82,.16).normalize(),new THREE.Vector3(.81,.14,.57).normalize()];
  for(let i=0;i<vertices.count;i++){
    normal.fromBufferAttribute(vertices,i).normalize();
    const uneven=Math.sin(normal.x*13.3+normal.y*7.4-normal.z*9.7+seed)*.063+
      Math.sin(normal.z*4.5-normal.x*8.9+seed*3.1)*.091;
    let radius=1+uneven;
    for(const dent of dents){
      const depth=THREE.MathUtils.clamp((normal.dot(dent)-.79)/.21,0,1);
      radius+=Math.sin(depth*Math.PI)*.09-depth*.23;
    }
    vertices.setXYZ(i,normal.x*radius*stretch[0],normal.y*radius*stretch[1],normal.z*radius*stretch[2]);
  }
  const colors=new Float32Array(vertices.count*3);
  const shade=new THREE.Color(stone);
  const dark=shade.clone().multiplyScalar(.49);
  const vein=new THREE.Color(def.color);
  const faceColor=new THREE.Color();
  for(let i=0;i<vertices.count;i+=3){
    const x=(vertices.getX(i)+vertices.getX(i+1)+vertices.getX(i+2))/3;
    const y=(vertices.getY(i)+vertices.getY(i+1)+vertices.getY(i+2))/3;
    const z=(vertices.getZ(i)+vertices.getZ(i+1)+vertices.getZ(i+2))/3;
    const band=Math.abs(y+.19*x-.15*Math.sin(z*6));
    const mineral=type==='stripe'?band<.15||Math.abs(band-.49)<.08:
      def.hot?Math.abs(x+.34*Math.sin(5*z)+.24*y)<.22:random()<.17;
    faceColor.copy(shade).lerp(dark,random()*.50).lerp(vein,mineral?.53+random()*.34:random()*.23);
    for(let j=0;j<3;j++) faceColor.toArray(colors,(i+j)*3);
  }
  shape.setAttribute('color',new THREE.BufferAttribute(colors,3));
  shape.computeVertexNormals();
  return shape;
}

function flameShape(){
  const profile=[ [.33,.49,0,0],[-.06,.96,.045,.84],[-.54,.85,.13,.68],
    [-1.09,.57,.23,.53],[-1.76,.34,.28,.34],[-2.48,.13,.36,.15],[-3.21,0,.46,0] ];
  const sections=12, xyz=[], rgba=[], indices=[];
  profile.forEach(([z,radius,lift,alpha],row)=>{
    for(let j=0;j<sections;j++){
      const angle=j/sections*Math.PI*2;
      const uneven=1+Math.sin(angle*3+row*.82)*.14;
      xyz.push(Math.cos(angle)*radius*uneven, lift+Math.sin(angle)*radius*.80*uneven, z+Math.sin(angle*2)*radius*.16);
      rgba.push(1,1-row*.044,1-row*.103,alpha);
      if(row===0) continue;
      const a=(row-1)*sections+j, b=(row-1)*sections+(j+1)%sections;
      indices.push(a,a+sections,b,b,a+sections,b+sections);
    }
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(rgba,4));
  geometry.setIndex(indices);
  return geometry;
}

const flame=flameShape();
const glow=(color,opacity)=>new THREE.MeshBasicMaterial({
  color,opacity,vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false
});
const flameRim=glow('#f46837',.62);
const flameCenter=glow('#ffd079',.77);

export function makeMeteor(type){
  const def=ENEMIES[type];
  const [radius]=bodies[type];
  if(!models.has(type)) models.set(type,sculpt(type));
  const geometry=models.get(type);
  const model=new THREE.Group();
  model.scale.setScalar(radius);
  const spin=new THREE.Group();
  model.add(spin);
  const core=new THREE.Mesh(geometry,def.hidden?rockPaint.clone():rockPaint);
  const fade=def.hidden?core.material:null;
  if(fade){
    fade.transparent=true;
    fade.opacity=.52;
  }
  spin.add(core);
  if(!def.hidden){
    const ink=new THREE.Mesh(geometry,outline);
    ink.scale.setScalar(1.038);
    spin.add(ink);
  }
  let trail=null;
  if(def.hot){
    trail=new THREE.Group();
    const edges=new THREE.Mesh(flame,flameRim);
    const center=new THREE.Mesh(flame,flameCenter);
    center.scale.set(.71,.76,.64);
    trail.add(edges,center);
    model.add(trail);
  }
  const lift=radius+.66;
  function pose(time,phase){
    const spinRate=def.massive?.39:.96;
    const t=time*spinRate;
    spin.rotation.set(phase*.73+t*.64,.26+phase*.47+t*.87,.21+phase*.58-t*.49);
    if(trail){
      trail.scale.set(.96+Math.sin(time*8.1+phase)*.07,1,.98+Math.sin(time*9.6+phase)*.13);
    }
  }
  return {model,fade,radius,lift,pose};
}
