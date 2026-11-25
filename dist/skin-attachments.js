import * as THREE from './vendor/three.module.min.js';

const ray=new THREE.Raycaster();
const hits=[];
const normalMatrix=new THREE.Matrix3();
const raySpan=5;
ray.far=raySpan+.005;

function skinContact(surface,center,direction){
  // Cast back toward a point inside the skin, then express the hit in the skin bone's coordinates.
  const outward=direction.clone().transformDirection(surface.parent.matrixWorld);
  const origin=surface.parent.localToWorld(center.clone()).addScaledVector(outward,raySpan);
  ray.set(origin,outward.negate());
  hits.length=0;
  const [hit]=ray.intersectObject(surface,false,hits);
  if(!hit) return null;
  return {
    point:surface.parent.worldToLocal(hit.point),
    normal:(hit.normal||hit.face.normal).clone().applyNormalMatrix(normalMatrix.getNormalMatrix(surface.matrix))
  };
}

function tangent(normal,forward){
  const axis=forward.clone().addScaledVector(normal,-forward.dot(normal));
  if(axis.lengthSq()<.04) axis.set(0,-1,0).addScaledVector(normal,normal.y);
  return axis.normalize();
}

export function skinSocket(surface,direction,twist=0,center=surface.position){
  const outward=new THREE.Vector3(...direction).applyQuaternion(surface.quaternion);
  const contact=skinContact(surface,center,outward);
  if(!contact) return null;
  const forward=tangent(contact.normal,new THREE.Vector3(0,0,1)).applyAxisAngle(contact.normal,twist);
  const across=new THREE.Vector3().crossVectors(contact.normal,forward);
  return {
    forward,
    sample(x,z){
      if(!x&&!z) return contact;
      const heading=contact.point.clone().sub(center).addScaledVector(across,x).addScaledVector(forward,z);
      return skinContact(surface,center,heading)||contact;
    }
  };
}

export function rootOnSkin(group,socket,x,z,size){
  const {point,normal}=socket.sample(x*size,z*size);
  const forward=tangent(normal,socket.forward);
  const across=new THREE.Vector3().crossVectors(normal,forward);
  const root=new THREE.Group();
  root.position.copy(point).addScaledVector(normal,-.051*size);
  root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,normal,forward));
  root.scale.setScalar(size);
  group.add(root);
  return root;
}

export function paintOnSkin(group,socket,x,z,width,length,angle,paint,lift=.010){
  const segments=12, rows=3;
  const xyz=[], indices=[];
  const cos=Math.cos(angle), sin=Math.sin(angle);
  function vertex(dx,dz){
    const contact=socket.sample(x+dx*cos-dz*sin,z+dx*sin+dz*cos);
    const point=contact.point.clone().addScaledVector(contact.normal,lift);
    xyz.push(point.x,point.y,point.z);
  }
  vertex(0,0);
  for(let ring=1;ring<=rows;ring++){
    const t=ring/rows;
    for(let i=0;i<segments;i++){
      const phase=i*Math.PI*2/segments;
      vertex(Math.cos(phase)*t*width*.5,Math.sin(phase)*t*length*.5);
      const a=1+(ring-1)*segments+i, b=1+(ring-1)*segments+(i+1)%segments;
      if(ring===1) indices.push(0,b,a);
      else indices.push(a-segments,b-segments,b,a-segments,b,a);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const marking=new THREE.Mesh(geometry,paint);
  marking.userData.skinPaint=true;
  group.add(marking);
}

export function releaseSkinPaint(root){
  root.traverse(part=>{if(part.userData.skinPaint) part.geometry.dispose();});
}
