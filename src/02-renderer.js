/* =========================================================
   2. Renderer, post-processing
   ========================================================= */
const canvas=$('gl');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('err').hidden=false;return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
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
    wbPass=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},uWB:{value:new THREE.Vector3(1,1,1)},uVig:{value:0},uHaze:{value:new THREE.Vector3()}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform vec3 uWB;uniform float uVig;uniform vec3 uHaze;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);c.rgb+=uHaze*smoothstep(0.75,0.0,length((vUv-vec2(0.5,0.47))*vec2(1.0,0.75)));c.rgb=min(c.rgb*uWB,vec3(1.0));float v=smoothstep(0.95,0.3,length((vUv-0.5)*vec2(1.0,0.8))*1.45);c.rgb*=mix(1.0,v,uVig);gl_FragColor=LinearTosRGB(c);}'});
    composer.addPass(wbPass);
  }catch(e){composer=null;bloom=null;}
}

