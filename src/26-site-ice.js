/* =========================================================
   14p. Under the sea ice, McMurdo Sound, Antarctica (~24 m, -1.9 °C, ice ~2 m). Light comes through the ice dimmed
   to a few percent and browned by ice algae on its underside; a dive hole lets a full-strength beam in.
   A loose layer of platelet ice hangs under the sheet. Bubbles from the diver collect under the ice.
   ========================================================= */
const ICE={on:false,h:2.1,hx:1.5,hz:-1.5,hr:0.62,T:0.035};
const iceGroup=new THREE.Group();iceGroup.visible=false;scene.add(iceGroup);
const iceUnderMat=new THREE.ShaderMaterial({uniforms:Object.assign({},U,{uHole:{value:new THREE.Vector3(ICE.hx,ICE.hz,ICE.hr)},uIceT:{value:ICE.T}}),side:THREE.DoubleSide,
  vertexShader:'varying vec3 vWPos; varying vec2 vP; void main(){ vec3 p=position; vP=p.xz; vec4 wp=modelMatrix*vec4(p,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
  fragmentShader:WATER_PARS+`uniform vec3 uHole; uniform float uIceT; varying vec2 vP;
  float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p){return n2(p)*0.5+n2(p*2.1+3.1)*0.3+n2(p*4.7+7.7)*0.2;}
  void main(){
    float dh=length(vWPos.xz-uHole.xy); if(dh<uHole.z) discard;
    float snow=fb(vWPos.xz*0.05); float tr=mix(1.6,0.35,smoothstep(0.35,0.7,snow));   /* thinner snow cover lets more light through */
    float alg=smoothstep(0.42,0.75,fb(vWPos.xz*0.6+11.0))*0.85;                       /* patches of ice algae on the underside */
    vec3 ice=vec3(0.55,0.8,1.0)*tr; ice=mix(ice,ice*vec3(0.62,0.48,0.26),alg);
    ice*=1.0+0.25*(fb(vWPos.xz*3.0)-0.5);
    ice+=vec3(0.9,1.0,1.1)*2.2*exp(-pow((dh-uHole.z)/0.9,2.0));                         /* glow around the hole edge */
    vec3 c=ice*uSky*1.1;
    float d=length(vWPos-cameraPosition); vec3 T=exp(-uC*d); c=c*T+bgCol(normalize(vWPos-cameraPosition))*(1.0-T);
    gl_FragColor=vec4(c,1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  }`});
const iceUnder=new THREE.Mesh(new THREE.PlaneGeometry(400,400,1,1).rotateX(Math.PI/2),iceUnderMat);iceUnder.frustumCulled=false;iceGroup.add(iceUnder);
const iceWallGeo=new THREE.CylinderGeometry(ICE.hr,ICE.hr,ICE.h,32,1,true);
const iceWall=new THREE.Mesh(iceWallGeo,new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vWPos; varying float vY; void main(){ vY=position.y; vec4 wp=modelMatrix*vec4(position,1.0); vWPos=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
  fragmentShader:WATER_PARS+`varying float vY; void main(){ float k=0.5+vY/2.1; vec3 c=mix(vec3(0.35,0.7,0.95),vec3(1.0),k)*uSky*0.9*(0.3+0.7*k);
    float d=length(vWPos-cameraPosition); vec3 T=exp(-uC*d); c=c*T+bgCol(normalize(vWPos-cameraPosition))*(1.0-T); gl_FragColor=vec4(c,1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  }`}));
iceWall.position.set(ICE.hx,-ICE.h/2,ICE.hz);iceGroup.add(iceWall);
/* platelet ice: thin hexagonal plates, a few cm across, in a loose layer below the sheet */
const plateletGeo=(()=>{const acc=Acc();addGeo(acc,new THREE.CylinderGeometry(1,1,0.04,6),null,()=>[0.92,0.96,1.0]);return finishGeo(acc);})();
const platelets=new THREE.InstancedMesh(plateletGeo,waterify(lambert({transparent:true,opacity:0.75}),'platelet',{emit:'emit+=diffuseColor.rgb*vec3(0.55,0.8,1.0)*uSky*1.6;'}),2600);platelets.frustumCulled=false;iceGroup.add(platelets);
{const c=new THREE.Color();for(let i=0;i<2600;i++){const r=Math.sqrt(rnd())*16,a=rnd()*6.28,x=Math.cos(a)*r,z=Math.sin(a)*r;
  _q.setFromEuler(_e.set(R(-1.4,1.4),rnd()*6.28,R(-1.4,1.4)));_s.setScalar(R(0.02,0.07));_p.set(x,-ICE.h-Math.pow(rnd(),2)*0.45,z);_m.compose(_p,_q,_s);platelets.setMatrixAt(i,_m);
  const al=rnd()<0.35;platelets.setColorAt(i,al?c.setRGB(0.75,0.6,0.38):c.setRGB(1,1,1));}}
/* giant sea spiders (Pycnogonida) on the bottom */
const pycnoGeo=(()=>{const acc=Acc(),col=()=>[0.85,0.55,0.3];
  addGeo(acc,new THREE.CylinderGeometry(0.03,0.03,0.18,6),M4(0,0.12,0,Math.PI/2,0,0),col);
  for(let k=0;k<4;k++)for(const sg of[1,-1]){const z=-0.06+k*0.04,a=sg*(0.9+k*0.05);
    addGeo(acc,new THREE.CylinderGeometry(0.008,0.006,0.22,4),M4(sg*0.1,0.17,z,0,0,-a*0.6),col);
    addGeo(acc,new THREE.CylinderGeometry(0.006,0.004,0.26,4),M4(sg*0.24,0.08,z+(k-1.5)*0.03,0,0,sg*0.35),col);}
  return finishGeo(acc);})();
const pycnos=new THREE.InstancedMesh(pycnoGeo,urchinMat,7);pycnos.frustumCulled=false;pycnos.count=0;scene.add(pycnos);
/* icefish: scaleless, pale and translucent-looking, with a long flat snout; they rest on the bottom */
makeDrift('icefish',{n:4,size:[0.38,0.48],spd:0.035,minAb:0.12,geo:(()=>{const g=buildFishGeo({h:0.13,w:0.1,tailH:0.1,dorsal:0.12,anal:0.05,eye:0.03,
    col:(x,y,z,f)=>f?[0.82,0.82,0.78]:mixc([0.95,0.95,0.92],[0.62,0.62,0.6],sstep(-0.05,0.1,y)),
    extra:(acc,ex0)=>{addGeo(acc,new THREE.SphereGeometry(1,12,6),M4(0,-0.01,0.47,0,0,0,0.07,0.03,0.12),()=>[0.9,0.9,0.86],ex0);}});return g;})()});
DRIFT.icefish.upright=false;
/* bald notothen (Pagothenia borchgrevinki): small fish living in the platelet layer right under the ice */
makeDrift('borch',{n:10,size:[0.18,0.25],spd:0.08,minAb:1,maxY:-ICE.h-0.15,geo:buildFishGeo({h:0.2,w:0.09,tailH:0.13,dorsal:0.08,anal:0.05,
    col:(x,y,z,f)=>f?[0.45,0.42,0.38]:mixc([0.85,0.83,0.78],[0.38,0.36,0.32],sstep(-0.1,0.2,y/0.2))})});
/* Weddell seal (Leptonychotes weddellii): ~2.5–3 m, dark grey with pale blotches, passes under the ice */
const SEAL=makeSwimmer('seal',(()=>{const acc=Acc();
  const body=latheZ([[0.001,-0.5],[0.04,-0.44],[0.09,-0.32],[0.13,-0.12],[0.14,0.06],[0.12,0.22],[0.085,0.33],[0.07,0.4],[0.055,0.46],[0.02,0.5],[0.001,0.505]],18);
  addGeo(acc,body,null,(x,y,z)=>{const sp=Math.sin(x*60+z*31)*Math.sin(y*55-z*23)>0.55;return y<-0.04?(sp?[0.7,0.7,0.68]:[0.5,0.52,0.52]):(sp?[0.62,0.63,0.62]:[0.22,0.24,0.26]);});
  for(const sg of[1,-1]){addGeo(acc,new THREE.SphereGeometry(1,8,5),M4(sg*0.14,-0.05,0.2,0,sg*0.6,0,0.1,0.015,0.05),()=>[0.25,0.26,0.28]);
    addGeo(acc,triGeo([0,0,-0.48, sg*0.13,0.0,-0.62, sg*0.03,0,-0.6]),null,()=>[0.2,0.21,0.23]);
    addGeo(acc,new THREE.SphereGeometry(0.012,6,4),M4(sg*0.04,0.03,0.46),()=>[0.02,0.02,0.02]);}
  return finishGeo(acc);})(),{vBegin:'float bt=clamp(-0.1-position.z,0.0,1.0); transformed.x+=sin(aPhase-position.z*3.0)*0.12*bt*bt;'});
const encSeal=new Enc({R0:22,fwd:[7,11],fwdDark:[6,9],y:[0,1.2],cool:[10,20],spd:1.4,len:2.7,minAb:1,yAbs:-ICE.h-1.6});
function buildIce(on){
  ICE.on=on;iceGroup.visible=on;if(!on){pycnos.count=0;return;}
  iceUnder.position.y=-ICE.h;
  let k=0;for(let i=0;i<7;i++){const a=rnd()*6.28,r=R(2,9),x=Math.cos(a)*r,z=Math.sin(a)*r;_q.setFromEuler(_e.set(0,rnd()*6.28,0));_s.setScalar(R(1.1,1.7));_p.set(x,floorY(x,z),z);_m.compose(_p,_q,_s);pycnos.setMatrixAt(k++,_m);}
  pycnos.count=k;pycnos.instanceMatrix.needsUpdate=true;
}

