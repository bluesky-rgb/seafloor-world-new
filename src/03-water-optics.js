/* =========================================================
   3. Shared water-optics shader code
   ========================================================= */
const U={
  uK:{value:new THREE.Vector3()},uC:{value:new THREE.Vector3()},uWater:{value:new THREE.Vector3()},
  uCamDepth:{value:5},uTime:{value:0},uCaustAmp:{value:1},uRipAmp:{value:0},uRipL:{value:0.3},uRipDir:{value:new THREE.Vector2(1,0)},
  uSunDir:{value:new THREE.Vector3(0,1,0)},uScale:{value:800},uSky:{value:1},uDay:{value:1},
  uTorch:{value:0},uTorchCol:{value:new THREE.Vector3(1,0.95,0.85)},uTorchWB:{value:new THREE.Vector3(1,1,1)},uCamDir:{value:new THREE.Vector3(0,0,-1)},
  uFlow:{value:new THREE.Vector2()},uCamPos:{value:new THREE.Vector3()},uShaft:{value:0},uDeepFan:{value:0}
};
const WATER_PARS=`
uniform vec3 uCamPos;
#define cameraPosition uCamPos
varying vec3 vWPos;
uniform vec3 uK; uniform vec3 uC; uniform vec3 uWater; uniform float uCamDepth; uniform float uTime;
uniform float uCaustAmp; uniform float uRipAmp; uniform float uRipL; uniform vec2 uRipDir;
uniform float uSky; uniform float uDay; uniform float uTorch; uniform vec3 uTorchCol; uniform vec3 uTorchWB; uniform vec3 uCamDir; uniform vec3 uSunDir;
vec3 lightAt(float d){ return exp(-uK*max(d,0.0)); }
float angF(float mu){ return mix(0.35,1.6,smoothstep(-0.6,1.0,mu)); }
vec3 bgCol(vec3 dir){ return uWater*lightAt(uCamDepth)*angF(dir.y)*uSky; }
vec3 waterPath(vec3 col, vec3 wp){
  vec3 v=wp-cameraPosition; float dist=length(v); vec3 T=exp(-uC*dist);
  return col*lightAt(-wp.y)*T + bgCol(v/max(dist,1e-4))*(1.0-T);
}
vec3 torchAt(vec3 wp, float ndl){
  vec3 v=wp-cameraPosition; float d=max(length(v),1e-3);
  float cs=dot(v/d,uCamDir);
  float cone=smoothstep(0.82,0.96,cs)+0.25*smoothstep(0.6,0.86,cs);
  return uTorchWB*uTorchCol*(uTorch*cone*(0.25+0.75*ndl)*0.9/(1.0+0.04*d*d))*exp(-uC*d);
}
vec3 hsv2rgb(vec3 c){ vec3 p=abs(fract(c.xxx+vec3(0.0,2.0/3.0,1.0/3.0))*6.0-3.0); return c.z*mix(vec3(1.0),clamp(p-1.0,0.0,1.0),c.y); }
float caustic(vec2 uv, float time){
  vec2 p=mod(uv*6.28318,6.28318)-250.0; vec2 i=p; float c=1.0; float inten=0.005;
  for(int n=0;n<4;n++){ float t=time*(1.0-(3.5/float(n+1)));
    i=p+vec2(cos(t-i.x)+sin(t+i.y), sin(t-i.y)+cos(t+i.x));
    c+=1.0/length(vec2(p.x/(sin(i.x+t)/inten), p.y/(cos(i.y+t)/inten))); }
  c/=4.0; c=1.17-pow(c,1.4); return clamp(pow(abs(c),8.0),0.0,1.0);
}
`;
const WATER_FRAG=(lit,emit)=>`
{
#ifdef CAUSTICS
  { float dO=max(-vWPos.y,0.0); float ca=caustic(vWPos.xz/2.2,uTime*0.55);
    gl_FragColor.rgb*=1.0+uCaustAmp*uDay*exp(-dO/7.0)*ca*2.2*smoothstep(0.0,0.6,vWNrm.y); }
#endif
#ifdef RIPPLES
  { float rs=dot(vWPos.xz,uRipDir); float rq=dot(vWPos.xz,vec2(-uRipDir.y,uRipDir.x));
    float ph=6.2831853*(rs+0.25*sin(rq*0.9)+0.12*sin(rq*2.3+rs*0.5))/uRipL;
    float fw=fwidth(ph); float rp=sin(ph)*clamp(1.0-fw*0.5,0.0,1.0);
    gl_FragColor.rgb*=1.0+uRipAmp*0.13*rp; }
#endif
  vec3 nrmW=normalize(vWNrm);
  vec3 vdir=normalize(vWPos-cameraPosition);
  ${lit||''}
  vec3 tE=torchAt(vWPos,abs(dot(nrmW,vdir)));
  vec3 emit=vec3(0.0);
#ifdef FLUO
  emit+=vFluo*(tE.b*1.4+0.05*lightAt(-vWPos.y).b*uSky);
#endif
  ${emit||''}
  float dd=length(vWPos-cameraPosition);
  gl_FragColor.rgb=waterPath(gl_FragColor.rgb,vWPos)+(diffuseColor.rgb*tE+emit)*exp(-uC*dd);
}
#include <tonemapping_fragment>`;

function waterify(mat,key,o){
  o=o||{};
  mat.defines=Object.assign({},mat.defines||{},o.defines||{});
  if(o.ext)mat.extensions={derivatives:true};
  const fluo=!!(o.defines&&('FLUO' in o.defines));
  mat.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,U,o.uniforms||{});
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm; varying vec3 vLocal;\nuniform float uTime; uniform vec2 uFlow;\n'+(fluo?'attribute vec3 aFluo; varying vec3 vFluo;\n':'')+(o.vHead||''))
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvLocal=position;\n'+(fluo?'vFluo=aFluo;\n':'')+(o.vBegin||''))
      .replace('#include <project_vertex>',`#include <project_vertex>
        { vec4 wp4=vec4(transformed,1.0); vec3 wn=objectNormal;
        #ifdef USE_INSTANCING
          wp4=instanceMatrix*wp4; wn=mat3(instanceMatrix)*wn;
        #endif
          vWPos=(modelMatrix*wp4).xyz; vWNrm=normalize(mat3(modelMatrix)*wn); }`);
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWNrm; varying vec3 vLocal;\n'+(fluo?'varying vec3 vFluo;\n':'')+WATER_PARS+(o.fHead||''))
      .replace('#include <color_fragment>','#include <color_fragment>\n'+(o.fColor||''))
      .replace('#include <tonemapping_fragment>',WATER_FRAG(o.lit,o.emit));
  };
  mat.customProgramCacheKey=()=>key;
  return mat;
}
const lambert=(opts)=>new THREE.MeshLambertMaterial(Object.assign({vertexColors:true},opts||{}));

/* lights (scaled by sky brightness each rebuild) */
const sunLight=new THREE.DirectionalLight(0xffffff,1.5);scene.add(sunLight);
const hemi=new THREE.HemisphereLight(0xdfefff,0x3a3a30,0.65);scene.add(hemi);

/* =========================================================
   4. Water volume: sky / Snell's window
   ========================================================= */
const sky=new THREE.Mesh(new THREE.SphereGeometry(700,48,24),new THREE.ShaderMaterial({
  uniforms:U,side:THREE.BackSide,depthWrite:false,
  vertexShader:'varying vec3 vDir; varying vec3 vWPos; void main(){ vDir=position; vWPos=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:WATER_PARS+`
    varying vec3 vDir;
    void main(){
      vec3 d=normalize(vDir); float mu=d.y; float dc=max(uCamDepth,0.0);
      vec3 bg=bgCol(d); vec3 col=bg;
      if(mu>0.001){
        float s=dc/mu; vec3 T=exp(-uC*s);
        vec2 sp=cameraPosition.xz+d.xz*s;
        float rip=0.5+0.5*sin(sp.x*0.8+uTime*1.4)*sin(sp.y*0.63-uTime*1.1);
        float edge=smoothstep(0.64,0.70,mu+(rip-0.5)*0.05*uCaustAmp);
        float sd=max(dot(d,uSunDir),0.0);
        vec3 daySky=vec3(0.45,0.68,1.0)*0.75*(0.8+0.4*rip*uCaustAmp)+vec3(1.0,0.96,0.88)*(pow(sd,600.0)*30.0+pow(sd,30.0)*1.2);
        vec3 nightSky=vec3(0.05,0.08,0.16)+vec3(0.85,0.9,1.0)*(pow(sd,1500.0)*60.0+pow(sd,60.0)*1.2);
        vec3 skyc=mix(nightSky,daySky,uDay)*uSky;
        vec3 win=mix(uWater*0.4*uSky,skyc,edge);
        col=win*T+bg*(1.0-T);
      }
      gl_FragColor=vec4(col,1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`
}));
sky.renderOrder=-1;scene.add(sky);

