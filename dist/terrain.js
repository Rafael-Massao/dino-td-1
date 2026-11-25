import * as THREE from './vendor/three.module.min.js';
import {isLand,isMapLand,seeded} from './campaign.js';
import {BIOMES} from './biomes.js';
import {box,boxShape,crystalShape,cylinder,material,makeTree,piece,rock,rockShape,rod,sphere} from './models.js';

function grassPaint(random,theme){
  const canvas=document.createElement('canvas');
  canvas.width=768;
  canvas.height=512;
  const ctx=canvas.getContext('2d');
  const base=ctx.createLinearGradient(0,0,650,510);
  theme.ground.forEach((color,index)=>base.addColorStop(index*.5,color));
  ctx.fillStyle=base;
  ctx.fillRect(0,0,768,512);
  for(let i=0;i<350;i++){
    const x=random()*768,y=random()*512,r=9+random()*98;
    const brush=ctx.createRadialGradient(x,y,0,x,y,r);
    brush.addColorStop(0,theme.brush[random()<.43?0:1]);
    brush.addColorStop(1,theme.ground[1]+'00');
    ctx.fillStyle=brush;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let i=0;i<3800;i++){
    const x=random()*768,y=random()*512;
    ctx.fillStyle=theme.specks[i%theme.specks.length];
    ctx.beginPath();
    ctx.ellipse(x,y,.55+random()*2.75,.4+random(),random()*Math.PI,0,Math.PI*2);
    ctx.fill();
  }
  for(let i=0;i<290;i++){
    const x=random()*768,y=random()*512;
    ctx.strokeStyle=theme.specks[i%2];
    ctx.lineWidth=.8+random()*.8;
    ctx.beginPath();
    ctx.moveTo(x,y+1);
    ctx.quadraticCurveTo(x+1,y-2,x+random()*3,y-3-random()*4);
    ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
}

function traceShore(outline,coast){
  coast.forEach(([x,z],index)=>index?outline.lineTo(x,-z):outline.moveTo(x,-z));
  outline.closePath();
  return outline;
}

function topGeometry(coast,holes,mapScale){
  const shape=traceShore(new THREE.Shape(),coast);
  shape.holes=holes.map(hole=>traceShore(new THREE.Path(),hole));
  const geometry=new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI/2);
  const positions=geometry.attributes.position;
  const uv=geometry.attributes.uv;
  for(let i=0;i<positions.count;i++) uv.setXY(i,(positions.getX(i)/mapScale+15)/30,(10-positions.getZ(i)/mapScale)/20);
  return geometry;
}

function shoreBand(coast,topScale,bottomScale,topY,bottomY,palette,random,center){
  const points=[], colors=[];
  const tint=palette.map(color=>new THREE.Color(color));
  function triangle(a,b,c){
    points.push(...a,...b,...c);
    const base=tint[Math.floor(random()*tint.length)];
    for(let i=0;i<3;i++) colors.push(base.r,base.g,base.b);
  }
  coast.forEach(([x,z],index)=>{
    const [nx,nz]=coast[(index+1)%coast.length];
    const point=(a,b,y,scale)=>[center[0]+(a-center[0])*scale,y,center[1]+(b-center[1])*scale];
    const a=point(x,z,topY,topScale), b=point(nx,nz,topY,topScale);
    const jitter=.996+Math.sin(index*11.7)*.009;
    const nextJitter=.996+Math.sin((index+1)%coast.length*11.7)*.009;
    const c=point(x,z,bottomY,bottomScale*jitter);
    const d=point(nx,nz,bottomY,bottomScale*nextJitter);
    triangle(a,b,c);
    triangle(c,b,d);
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
  mesh.receiveShadow=true;
  return mesh;
}

function waterSurface(theme,scale){
  const geometry=new THREE.PlaneGeometry(190,190);
  geometry.rotateX(-Math.PI/2);
  const mat=new THREE.ShaderMaterial({
    uniforms:{
      time:{value:0},
      scale:{value:scale},
      deep:{value:new THREE.Color(theme.water[0])},
      light:{value:new THREE.Color(theme.water[1])},
      crest:{value:new THREE.Color(theme.water[2])}
    },
    vertexShader:`
      varying vec2 point;
      void main(){
        point=position.xz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      varying vec2 point;
      uniform float time;
      uniform float scale;
      uniform vec3 deep;
      uniform vec3 light;
      uniform vec3 crest;

      void main(){
        vec2 p=point/scale;
        float edge=length(vec2(p.x*.073,p.y*.109));
        float depth=smoothstep(.68,1.57,edge+.046*sin(p.x*.7)*cos(p.y*.7));
        float swell=sin(p.x*.83+p.y*.4+time*.8)*cos(p.y*.71-time*.7);
        float small=sin(p.x*2.1+p.y*1.3-time*.7)*sin(p.y*2.2+p.x*.4+time*.9);
        float foam=pow(max(0.0,sin(p.y*3.8+sin(p.x*.8+time*.18)*1.4+time*.85)),15.0);
        foam *= smoothstep(.42,.92,sin(p.x*1.2+p.y*.6+time*.35));
        vec3 col=mix(light,deep,depth)+swell*.018+small*.006;
        col=mix(col,crest,(.23+.24*(1.-depth))*foam);
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.position.y=-.77;
  return mesh;
}

function foamyEdge(coast,random,center,tint,inset){
  const points=[];
  for(let i=0;i<coast.length;i++){
    const [ax,az]=coast[i], [bx,bz]=coast[(i+1)%coast.length];
    for(let j=0;j<4;j++){
      if(random()<.25) continue;
      const t=j/4+random()*.06, u=t+.08+random()*.145;
      const s=inset?.86-random()*.055:1.11+random()*.028;
      const at=k=>[center[0]+(ax+(bx-ax)*k-center[0])*s,-.751,center[1]+(az+(bz-az)*k-center[1])*s];
      points.push(...at(t),...at(u));
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  return new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:tint,transparent:true,opacity:.64}));
}

function ribbon(route,map,random,y,theme){
  const widths=[-.95,-.87,-.72,-.34,0,.35,.72,.87,.95];
  const palette=[...theme.path,...theme.path.slice(0,-1).reverse()].map(hex=>new THREE.Color(hex));
  const positions=[],colors=[],indices=[];
  const {samples}=route;
  for(let i=0;i<samples.length;i++){
    const {x,z}=samples[i];
    const a=samples[Math.max(i-1,0)],b=samples[Math.min(i+1,samples.length-1)];
    const length=Math.hypot(b.x-a.x,b.z-a.z);
    const xNormal=(b.z-a.z)/length,zNormal=(a.x-b.x)/length;
    const sway=.95+.045*Math.sin(i*.31)+.035*Math.sin(i*1.3);
    for(let j=0;j<widths.length;j++){
      const width=widths[j]*sway*map.scale;
      positions.push(x+xNormal*width,y,z+zNormal*width);
      const color=palette[j],p=.94+random()*.13;
      colors.push(color.r*p,color.g*p,color.b*p);
      if(i===0||j===0||!isMapLand(map,x,z)) continue;
      const current=i*widths.length+j,prev=current-widths.length;
      indices.push(prev-1,current,current-1,prev-1,prev,current);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const surface=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
  surface.receiveShadow=true;
  return surface;
}

function scatter(scene,shape,values,kind='soft'){
  if(values.length===0) return;
  const mesh=new THREE.InstancedMesh(shape,material('#ffffff',kind),values.length);
  const dummy=new THREE.Object3D();
  const color=new THREE.Color();
  values.forEach(([x,y,z,sx,sy,sz,ry,tint,rx=0,rz=0],i)=>{
    dummy.position.set(x,y,z);
    dummy.scale.set(sx,sy,sz);
    dummy.rotation.set(rx,ry,rz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
    mesh.setColorAt(i,color.set(tint));
  });
  mesh.receiveShadow=true;
  scene.add(mesh);
}

function scatterGrass(ground,map,routes,random,theme){
  const blades=[],flowers=[],stones=[],dirt=[];
  function valid(x,z){
    return isMapLand(map,x,z)
      &&!routes.some(route=>route.samples.some(point=>(point.x-x)**2+(point.z-z)**2<1.27))
      &&!map.landmarks.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<1.36);
  }
  const count=Math.ceil(465*map.scale**2);
  for(let i=0;i<count;i++){
    const x=(random()-.5)*25.5*map.scale,z=(random()-.5)*16.2*map.scale;
    if(!valid(x,z)) continue;
    const palette=theme.plants;
    const height=.095+random()*.22;
    for(let j=0;j<2+(i%3);j++){
      const wind=(random()-.5)*.7;
      blades.push([x+(random()-.5)*.29,height*.45,z+(random()-.5)*.29,.068,height+random()*.09,.035,random()*6,palette[i%palette.length],wind,wind]);
    }
    if(i%6===0){
      for(let j=0;j<4;j++){
        flowers.push([x+(random()-.5)*.5,.125+random()*.12,z+(random()-.5)*.5,.09,.09,.09,random()*5,theme.flowers[i%theme.flowers.length]]);
      }
    }
    if(i%8===0){
      const s=.2+random()*.29;
      stones.push([x,.07,z,s*1.69,s*.49,s,s*18,theme.stone[i%3]]);
    }
  }
  for(const route of routes){
    for(let i=1;i<route.samples.length;i+=2){
      const point=route.samples[i];
      const x=point.x+(random()-.5)*1.55,z=point.z+(random()-.5)*1.55;
      if(isMapLand(map,x,z)&&random()<.84){
        const s=.056+random()*.11;
        dirt.push([x,.024,z,s*1.1,.028,s*.65,random()*5,theme.path[(i%3)+1]]);
      }
    }
  }
  scatter(ground,crystalShape,blades);
  scatter(ground,crystalShape,flowers);
  scatter(ground,rockShape,stones);
  scatter(ground,rockShape,dirt);
}

function bridge(ground,x,z,angle,span,leftward,width){
  const group=new THREE.Group();
  group.position.set(x,0,z);
  group.rotation.y=angle;
  group.scale.x=width;
  ground.add(group);
  const planks=Math.ceil(span/.38);
  for(let i=0;i<planks;i++){
    const d=(i*.38-span/2)*leftward;
    box(group,['#bc8b54','#c99b61','#ad7b4d','#c08f55'][i%4],0,-.045,d,1.78,.145,.36,'soft');
    for(const side of [-1,1]){
      if(i%2===0) box(group,'#725442',side*.74,.034,d,.07,.035,.07,'soft');
      if(i%4===0){
        box(group,'#946c4a',side*.88,.02,d,.13,.65,.16,'soft');
        box(group,'#d4af76',side*.88,.36,d,.16,.13,.182,'soft');
      }
    }
  }
  for(const side of [-1,1]) box(group,'#65513e',side*.61,-.37,0,.31,.5,span,'soft');
}

function gate(ground,x,z,angle,accent,animated,width){
  const root=new THREE.Group();
  root.position.set(x,0,z);
  root.rotation.y=angle;
  root.scale.x=width;
  ground.add(root);
  for(const side of [-1,1]){
    const px=side*1.0;
    box(root,'#a59b82',px,.16,0,.52,.39,.58,'soft');
    for(let i=0;i<5;i++){
      box(root,i%2?'#8d8e7c':'#beb69b',px,.29+i*.239,0,.395,.232,.44,'soft');
    }
    box(root,'#97876c',px,1.5,0,.49,.17,.54,'soft');
    cylinder(root,accent,px,1.65,0,.095,.335,.36,4,'soft').rotation.y=Math.PI/4;
  }
  box(root,'#98927c',0,1.33,0,1.97,.25,.35,'soft');
  box(root,'#c8b896',0,1.52,0,1.38,.17,.45,'soft');
  crystalOrnament(root,accent,0,1.68,.25,.4,.43,.16);
  for(const side of [-1,1]){
    rod(root,'#8f6d4a',[side*1.23,.65,-.11],[side*1.23,2.12,-.11],.07,'soft');
    const geom=new THREE.PlaneGeometry(.47,.32,7,2);
    const flag=piece(root,geom,new THREE.MeshLambertMaterial({color:accent,side:THREE.DoubleSide}),side*1.41,1.9,-.11);
    flag.rotation.y=.36;
    const attr=geom.attributes.position;
    animated.push(time=>{
      for(let i=0;i<attr.count;i++) attr.setZ(i,Math.sin(time*4+attr.getX(i)*7)*(.055+side*attr.getX(i)*.18));
      attr.needsUpdate=true;
    });
  }
}

function crystalOrnament(group,color,x,y,z,sx,sy,sz) {
  return piece(group,crystalShape,material(color,'soft'),x,y,z,sx,sy,sz);
}

function landmarks(ground,map,animated){
  for(const [x,z,type] of map.landmarks){
    const g=new THREE.Group();
    g.position.set(x,0,z);
    g.rotation.y=type==='mill' ? .19 : -.23;
    ground.add(g);
    if(type==='mill'){
      cylinder(g,'#a8a085',0,.14,0,.86,.94,.28,7,'soft');
      cylinder(g,'#d1be8d',0,.94,0,.48,.69,1.35,7,'soft');
      cylinder(g,'#ae8b62',0,1.64,0,.74,.7,.19,7,'soft');
      cylinder(g,'#ae6a4d',0,1.98,0,.065,.77,.64,7,'soft');
      box(g,'#745e4d',0,.47,.615,.29,.62,.09,'soft');
      const wheel=new THREE.Group();
      wheel.position.set(0,1.42,.66);
      g.add(wheel);
      sphere(wheel,'#9a7e58',0,0,.035,.29,.29,.17,'soft');
      for(let i=0;i<4;i++){
        const wing=new THREE.Group();
        wing.rotation.z=i*Math.PI/2;
        wheel.add(wing);
        box(wing,'#9b7653',0,.62,0,.085,1.1,.074,'soft');
        const cloth=box(wing,'#f0deb0',.15,.79,.02,.26,.71,.04,'soft');
        cloth.rotation.z=-.12;
        for(let k=0;k<3;k++) box(wing,'#c7af84',.15,.58+k*.2,.045,.25,.037,.04,'soft');
      }
      animated.push(t=>wheel.rotation.z=-t*.37+.42);
    } else if(type==='beacon'){
      cylinder(g,'#8b8e72',0,.10,0,.94,1.0,.2,8,'soft');
      cylinder(g,'#e0c69a',0,.77,0,.42,.65,1.25,9,'soft');
      cylinder(g,'#bd7661',0,1.01,0,.466,.545,.41,9,'soft');
      cylinder(g,'#9b9b79',0,1.47,0,.64,.56,.17,9,'soft');
      cylinder(g,'#eedc9e',0,1.73,0,.35,.43,.39,6,'soft');
      cylinder(g,'#5f8a72',0,2.09,0,.035,.55,.46,7,'soft');
      box(g,'#866c56',.025,.355,.579,.21,.41,.09,'soft');
      for(const side of [-1,1]) box(g,'#7b6f54',side*.28,1.74,.27,.045,.38,.083,'soft');
      const glow=sphere(g,'#ffe2a6',0,1.77,.349,.22,.25,.08,'light');
      animated.push(t=>glow.scale.y=.22+.035*Math.sin(t*2.25));
    } else if(type==='tent'){
      const cloth=cylinder(g,'#d9ae69',0,.59,0,0,.96,1.12,4,'soft');
      cloth.rotation.y=Math.PI/4;
      const roof=cylinder(g,'#b57258',0,.815,0,0,.58,.68,4,'soft');
      roof.rotation.y=Math.PI/4;
      box(g,'#796c52',-.02,.29,.56,.33,.52,.05,'soft');
      box(g,'#a18256',.83,.17,.08,.38,.35,.44,'soft');
      box(g,'#c09b60',.83,.36,.08,.43,.07,.47,'soft');
      rod(g,'#806548',[0,1.02,0],[0,1.66,0],.056,'soft');
      const flag=box(g,'#86be8b',.18,1.55,0,.38,.2,.024,'soft');
      animated.push(t=>flag.rotation.y=.4+Math.sin(t*3)*.35);
    }else if(type==='hammock'){
      for(const side of [-1,1]) rod(g,'#a87758',[side*.65,0,0],[side*.84,1.29,0],.145,'soft');
      for(let i=0;i<7;i++){
        const x=(i-3)*.211;
        const strip=box(g,i%2?'#f6dda6':'#73c6bf',x,.31+Math.abs(x)*.45,0,.224,.084,.55,'soft');
        strip.rotation.z=x*.45;
      }
    }else if(type==='shells'){
      for(const side of [-1,0,1]){
        const shell=rock(g,side===0?'#f0b18b':'#b6d3af',side*.36,.13,.11,.68,.45,.58);
        shell.rotation.y=side*.57;
        crystalOrnament(g,'#e9a483',side*.29,.50,-.12,.25,.84,.22).rotation.z=-side*.42;
      }
    }else if(type==='arch'){
      for(const side of [-1,1]){
        cylinder(g,'#a66b54',side*.51,.51,0,.32,.46,1.02,6,'soft');
        rock(g,'#cc946c',side*.44,1.13,.03,.71,.46,.7);
      }
      rock(g,'#deaa77',0,1.41,.04,1.7,.45,.73).rotation.z=.064;
    }else if(type==='well'){
      cylinder(g,'#90654b',0,.18,0,.64,.76,.33,8,'soft');
      cylinder(g,'#5a635f',0,.35,0,.44,.46,.05,10,'soft');
      for(const side of [-1,1]) rod(g,'#a57551',[side*.53,.20,0],[side*.53,1.18,0],.116,'soft');
      box(g,'#d2a369',0,1.21,.035,1.51,.13,.69,'soft').rotation.x=.26;
    }else if(type==='ice-spire'){
      for(const [ix,iy,iz,height,tint] of [[0,.75,0,1.66,'#8cc8dc'],[.49,.47,.12,1.17,'#bbebeb'],[-.43,.45,-.13,1.1,'#e3f5ee']]){
        const piece=crystalOrnament(g,tint,ix,iy,iz,.68,height,.68);
        piece.rotation.z=-ix*.64;
      }
    }else if(type==='vent'||type==='furnace'){
      cylinder(g,'#655063',0,.20,0,.61,.82,.38,8,'soft');
      const glow=cylinder(g,'#ffad73',0,.395,0,.45,.49,.06,8,'light');
      for(let i=0;i<5;i++){
        const theta=i*Math.PI*2/5;
        rock(g,'#796071',Math.cos(theta)*.61,.43,Math.sin(theta)*.61,.62,.66,.59);
        const spark=sphere(g,'#ffc585',0,0,0,.13,.13,.13,'light');
        animated.push(t=>{
          const age=(t*.56+i*.18)%1;
          spark.position.set(Math.cos(theta+t)*.30,.49+age*1.18,Math.sin(theta+t)*.31);
          spark.scale.setScalar(.13*(1-age));
        });
      }
      if(type==='furnace') crystalOrnament(g,'#ffac79',.05,.75,.089,.51,.70,.45);
      animated.push(t=>{const pulse=1+Math.sin(t*1.85)*.07;glow.scale.set(pulse,glow.scale.y,pulse);});
    }else {
      for(let i=0;i<3;i++){
        const x=(i-1)*.49;
        box(g,'#a49356',x,.019,0,.4,.08,1.45,'soft');
        for(let k=0;k<5;k++){
          crystalOrnament(g,k%2?'#8da85c':'#b5bf6b',x,.16,(k-2)*.27,.24,.28,.19);
        }
      }
    }
    g.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});
  }
}

function islets(root,map,random,animated,theme){
  for(const [sx,sz,scale] of [[-13.7,-5.9,1.25],[-14.2,-5.16,.62],[12.6,-7.6,1.08],[13.7,-7.9,.6],
    [-10.9,8.5,.85],[11.4,7.85,.77],[-4.7,9.7,.64],[4.6,-8.55,.53],[-7.6,-9.17,.7],[13.4,5.2,.49]]){
    const x=sx*map.scale,z=sz*map.scale;
    if(isMapLand(map,x,z)) continue;
    const shale=rock(root,theme.stone[0],x,-.66,z,scale*1.65,scale*.93,scale*1.27);
    shale.rotation.y=random()*5.5;
    shale.castShadow=true;
    rock(root,theme.stone[1],x-.15,-.69,z+.12,scale*.72,scale*.26,scale*.78);
  }
  for(const [sx,sz,angle] of [[-11.9,7.9,.92],[12.4,-5.25,.46]]){
    const x=sx*map.scale,z=sz*map.scale;
    if(isMapLand(map,x,z)) continue;
    const boat=new THREE.Group();
    boat.position.set(x,-.7,z);
    boat.rotation.y=angle;
    root.add(boat);
    const hull=rock(boat,'#a47d58',0,0,0,.95,.53,1.7);
    hull.rotation.y=.11;
    sphere(boat,'#ddbc85',0,.11,-.05,.58,.1,1.35,'soft');
    box(boat,'#92795c',0,.15,0,.42,.073,.19,'soft');
    rod(boat,'#7e654a',[0,.12,.15],[0,1.12,.15],.05,'soft');
    const sail=piece(boat,crystalShape,material('#f3d99d','soft'),.17,.64,.15,.75,.84,.07);
    sail.rotation.z=.29;
    animated.push(t=>{boat.position.y=-.66+Math.sin(t*1.4+x)*.057;boat.rotation.z=Math.sin(t*1.02+x)*.045;});
  }
}

export function makeRock(rockDef,style='green'){
  const colors=BIOMES[style].stone;
  const group=new THREE.Group();
  group.position.set(rockDef.x,0,rockDef.z);
  for(const [x,y,z,sx,sy,sz,angle,color] of [
    [-.09,.51,-.09,1.52,1.49,1.47,.77,colors[0]],
    [.33,.25,.29,.89,.71,.89,.3,colors[1]],
    [-.46,.21,.18,.85,.61,.76,.55,colors[0]],
    [-.15,.91,-.105,1.07,.49,1.05,.77,colors[2]]
  ]){
    const boulder=rock(group,color,x,y,z,sx,sy,sz);
    boulder.rotation.y=angle;
    boulder.castShadow=true;
    boulder.receiveShadow=true;
  }
  group.scale.setScalar(.22+rockDef.r);
  return group;
}

function shorelineCenter(coast){
  return coast.reduce(([sumX,sumZ],[x,z])=>[sumX+x/coast.length,sumZ+z/coast.length],[0,0]);
}

function paintShore(root,coast,theme,random,hole=false){
  const center=shorelineCenter(coast);
  const layers=hole
    ? [[.953,.88,-.727,-.752,theme.sand],[.986,.953,-.18,-.73,theme.cliff],[1,.986,.001,-.183,theme.edge]]
    : [[1.065,1.146,-.727,-.752,theme.sand],[1.012,1.065,-.18,-.73,theme.cliff],[1,1.012,.001,-.183,theme.edge]];
  layers.forEach(([a,b,y1,y2,palette])=>root.add(shoreBand(coast,a,b,y1,y2,palette,random,center)));
  root.add(foamyEdge(coast,random,center,theme.water[2],hole));
}

function plant(style,x,z,scale,random){
  if(style==='green'||style==='mist') return makeTree(x,z,scale,random,style==='mist');
  const model=new THREE.Group();
  model.position.set(x,0,z);
  model.scale.setScalar(scale);
  model.rotation.y=random()*Math.PI*2;
  if(style==='atoll'){
    const bark=['#95634b','#c19866'];
    for(let i=0;i<5;i++){
      rod(model,bark[i%2],[i*i*.013,i*.40,0],[(i+1)*(i+1)*.013,(i+1)*.40,0],.20-i*.012,'soft');
    }
    for(let i=0;i<6;i++){
      const theta=i*Math.PI/3;
      const crown=rock(model,i%2?'#5d9f6e':'#84ba75',.325+Math.sin(theta)*.49,1.95,Math.cos(theta)*.47,.38,.18,1.43,'soft');
      crown.rotation.set(.23,theta,0);
    }
    sphere(model,'#bd8251',.39,1.83,.17,.19,.19,.19,'soft');
  }else if(style==='amber'){
    cylinder(model,'#8f6a50',0,.09,0,.39,.52,.16,7,'soft');
    cylinder(model,'#6d9866',0,.82,0,.186,.219,1.47,7,'soft');
    sphere(model,'#9fb982',0,1.54,0,.37,.34,.37,'soft');
    for(const side of [-1,1]){
      const height=side===1?1.16:.95;
      rod(model,'#769961',[0,.52,0],[side*.39,.66,.08],.23,'soft');
      rod(model,'#769961',[side*.39,.62,.08],[side*.39,height,.08],.21,'soft');
      sphere(model,'#a6bd82',side*.39,height,.08,.215,.27,.21,'soft');
    }
  }else if(style==='fjord'){
    rod(model,'#8d7771',[0,0,0],[0,2.18,0],.147,'soft');
    for(let i=0;i<3;i++){
      const y=.98+i*.49, radius=.81-i*.19;
      cylinder(model,'#548f89',0,y,0,.069,radius,.89,7,'soft');
      cylinder(model,'#dfede8',0,y+.101,.035,.053,radius*.81,.74,7,'soft');
    }
  }else {
    rock(model,'#665267',0,.25,0,1.38,.58,1.10);
    const spike=crystalOrnament(model,'#82677b',-.16,.68,.036,.67,1.39,.58);
    spike.rotation.z=.22;
    const second=crystalOrnament(model,'#ab776d',.32,.52,-.053,.51,1.03,.49);
    second.rotation.z=-.29;
    for(let i=0;i<3;i++) rock(model,'#be856e',-.23+i*.23,.20,.29,.24,.42,.34);
  }
  model.traverse(piece=>{if(piece.isMesh){piece.castShadow=true;piece.receiveShadow=true;}});
  return model;
}

export function buildTerrain(map,routes){
  const theme=BIOMES[map.style];
  const random=seeded(map.seed);
  const root=new THREE.Group();
  const animated=[];
  const scale=map.scale;
  const water=waterSurface(theme,scale);
  root.add(water);
  const grass=grassPaint(random,theme);
  const landMaterial=new THREE.MeshLambertMaterial({map:grass});
  for(const coast of [map.coast,...(map.islands||[])]){
    const holes=(map.lagoons||[]).filter(hole=>isLand(coast,...hole[0]));
    paintShore(root,coast,theme,random);
    holes.forEach(hole=>paintShore(root,hole,theme,random,true));
    const top=new THREE.Mesh(topGeometry(coast,holes,scale),landMaterial);
    top.receiveShadow=true;
    root.add(top);
  }
  routes.forEach((route,i)=>root.add(ribbon(route,map,random,.017+i*.002,theme)));
  scatterGrass(root,map,routes,random,theme);
  for(const [x,z,s] of map.heights){
    const boulder=rock(root,theme.stone[0],x,.18,z,1.58*s,1.13*s,1.35*s);
    boulder.rotation.y=random()*Math.PI;
    boulder.castShadow=true;
    rock(root,theme.stone[1],x-.21,.44*s,z,1.24*s,.57*s,1.14*s);
  }
  for(const [x,z,scale] of map.trees) root.add(plant(map.style,x,z,scale,random));
  landmarks(root,map,animated);

  for(const crossing of map.crossings||[]){
    bridge(root,crossing.x,crossing.z,crossing.angle,crossing.span,1,scale);
  }
  map.entries.forEach(([x,z,angle],i)=>{
    const turn=angle??(i===0?Math.PI/2:0);
    const dx=Math.sin(turn), dz=Math.cos(turn);
    bridge(root,x-.91*dx*scale,z-.91*dz*scale,turn,3.65*scale,-1,scale);
    gate(root,x+.19*dx*scale,z+.19*dz*scale,turn,theme.gate[0],animated,scale);
  });
  const [exitX,exitZ,exitAngle=Math.PI/2]=map.exit;
  bridge(root,exitX+.47*Math.sin(exitAngle)*scale,exitZ+.47*Math.cos(exitAngle)*scale,exitAngle,3.78*scale,1,scale);
  gate(root,exitX-.35*Math.sin(exitAngle)*scale,exitZ-.35*Math.cos(exitAngle)*scale,exitAngle,theme.gate[1],animated,scale);
  islets(root,map,random,animated,theme);
  return {root,water,animated,grass};
}
