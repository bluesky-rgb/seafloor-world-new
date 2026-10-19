/* =========================================================
   2. Renderer, post-processing
   ========================================================= */
const canvas=$('gl');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('err').hidden=false;return;}
/* performance: phones and weak GPUs start in the light mode (lower resolution, no bloom, about half the repeated plants and animals) */
const PERF={low:false,k:1,user:null,samp:[],t0:0,done:false,ready:false};
try{PERF.user=localStorage.getItem('seafloor-perf');}catch(e){}
{const mob=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),mem=navigator.deviceMemory||8;PERF.low=PERF.user?PERF.user==='low':(mob&&mem<=4)||mem<=2;PERF.k=PERF.low?0.45:1;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,PERF.low?1:1.75));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(60,1,0.05,1500);
scene.add(camera);
const controls=new THREE.OrbitControls(camera,canvas);
controls.enableDamping=true;controls.minDistance=1.2;controls.maxDistance=40;controls.enablePan=false;controls.autoRotateSpeed=0.35;

let composer=null,bloom=null,wbPass=null;const WB=new THREE.Vector3(1,1,1);
if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.ShaderPass){
  try{
    const rt=new THREE.WebGLRenderTarget(4,4,{type:renderer.capabilities.isWebGL2?THREE.HalfFloatType:THREE.UnsignedByteType});
    composer=new THREE.EffectComposer(renderer,rt);
    composer.addPass(new THREE.RenderPass(scene,camera));
    bloom=new THREE.UnrealBloomPass(new THREE.Vector2(256,256),0.4,0.5,0.8);
    composer.addPass(bloom);
    wbPass=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},uWB:{value:new THREE.Vector3(1,1,1)},uVig:{value:0},uHaze:{value:new THREE.Vector3()},
      uSh:{value:[0,1,2,3].map(()=>new THREE.Vector4())},uShW:{value:[0,0,0,0]},uShN:{value:0},uShT:{value:0}},   /* heat shimmer over warm springs: up to 4 screen-space plumes */
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform vec3 uWB;uniform float uVig;uniform vec3 uHaze;uniform vec4 uSh[4];uniform float uShW[4];uniform int uShN;uniform float uShT;varying vec2 vUv;'+
        'vec2 shim(vec2 uv){vec2 o=vec2(0.0);for(int i=0;i<4;i++){if(i>=uShN)break;vec2 a=uSh[i].xy,b=uSh[i].zw,ab=b-a;float t=clamp(dot(uv-a,ab)/max(dot(ab,ab),1e-6),0.0,1.0);vec2 d=(uv-a-ab*t)*vec2(1.0,0.6);'+
        'float m=smoothstep(uShW[i],0.0,length(d))*smoothstep(0.0,0.12,t)*(1.0-t);o+=m*uShW[i]*0.06*vec2(sin(uv.y*260.0-uShT*7.0+float(i)*1.7)+0.5*sin(uv.y*610.0-uShT*11.0),0.4*cos(uv.x*230.0+uShT*5.0));}return o;}'+
        'void main(){vec4 c=texture2D(tDiffuse,vUv+shim(vUv));c.rgb+=uHaze*smoothstep(0.75,0.0,length((vUv-vec2(0.5,0.47))*vec2(1.0,0.75)));c.rgb=min(c.rgb*uWB,vec3(1.0));float v=smoothstep(0.95,0.3,length((vUv-0.5)*vec2(1.0,0.8))*1.45);c.rgb*=mix(1.0,v,uVig);gl_FragColor=LinearTosRGB(c);}'});
    composer.addPass(wbPass);
  }catch(e){composer=null;bloom=null;}
}

