/* =========================================================
   14za. VR: phone split-screen stereo (Cardboard-style) and WebXR headsets
   Stereo uses THREE.StereoCamera with a 64 mm eye separation; each eye is
   rendered through the same post chain into its half of the screen.
   ========================================================= */
const VR={on:false,xr:false,gyro:false,glide:false,yaw:0,pitch:0,off:new THREE.Quaternion(),offSet:false,dev:null,
  home:new THREE.Vector3(),fs:false,hintT:0,lblT:0,drag:null,rig:new THREE.Group(),wp:new THREE.Vector3(),snapT:0};
const stereo=new THREE.StereoCamera();stereo.eyeSep=0.064;
const _vq=new THREE.Quaternion(),_ve=new THREE.Euler(),_vv=new THREE.Vector3(),_vz=new THREE.Vector3(0,0,1),
  _vq1=new THREE.Quaternion(-Math.sqrt(0.5),0,0,Math.sqrt(0.5)),_vy=new THREE.Vector3(0,1,0);
function vrResize(){
  if(!VR.on||VR.xr)return;
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=(w/2)/h;camera.fov=w/2<h?80:70;camera.updateProjectionMatrix();
  if(composer)composer.setSize(w/2,h);
  U.uScale.value=h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));
}
function renderStereo(){
  const w=window.innerWidth,h=window.innerHeight,rp=composer?composer.passes[0]:null;
  camera.updateMatrixWorld();stereo.update(camera);
  renderer.setScissorTest(true);
  [[stereo.cameraL,0],[stereo.cameraR,w/2]].forEach(([cam,x])=>{
    renderer.setScissor(x,0,w/2,h);renderer.setViewport(x,0,w/2,h);
    if(rp){rp.camera=cam;composer.render();}else renderer.render(scene,cam);});
  if(rp)rp.camera=camera;
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}
function vrHint(html,sec){const e=$('vrHint');e.innerHTML=html;e.classList.remove('off');VR.hintT=sec||8;}
function onDevOri(e){if(e.alpha==null&&e.beta==null)return;VR.dev=e;VR.gyro=true;}
function devQuat(out){
  const e=VR.dev,d=Math.PI/180,ang=((screen.orientation&&screen.orientation.angle)||window.orientation||0)*d;
  _ve.set((e.beta||0)*d,(e.alpha||0)*d,-(e.gamma||0)*d,'YXZ');out.setFromEuler(_ve);out.multiply(_vq1);
  out.multiply(_vq.setFromAxisAngle(_vz,-ang));return out;
}
function enterVR(){
  if(VR.on)return;
  if(PILOT.on)exitPilot();
  VR.on=true;VR.xr=false;VR.glide=false;VR.offSet=false;VR.gyro=false;VR.dev=null;
  camera.getWorldDirection(_vv);VR.yaw=Math.atan2(-_vv.x,-_vv.z);VR.pitch=Math.asin(Math.max(-0.99,Math.min(0.99,_vv.y)));
  VR.home.set(controls.target.x,0,controls.target.z);
  controls.enabled=false;controls.autoRotate=false;
  document.body.classList.add('vr');$('vrUI').hidden=false;$('info').hidden=true;
  const de=document.documentElement;
  try{const p=de.requestFullscreen&&de.requestFullscreen();if(p&&p.then)p.then(()=>{VR.fs=true;try{const q=screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape');if(q&&q.catch)q.catch(()=>{});}catch(e){}}).catch(()=>{});}catch(e){}
  const start=()=>{window.addEventListener('deviceorientation',onDevOri);};
  try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function')DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')start();}).catch(()=>{});else start();}catch(e){}
  resize();
  vrHint($t('<b>手机分屏 VR</b>：把手机横过来；有纸盒眼镜就放进去，没有也可以直接看。<br>转动手机（或用手指拖动）看四周，<b>轻点屏幕</b>开始或停止朝视线方向游动。'),9);
  setTimeout(()=>{if(VR.on&&!VR.xr&&!VR.gyro)vrHint($t('这个页面读不到手机的陀螺仪（浏览器不支持，或者没有允许访问“动作与方向”），画面不会跟着手机转。<b>用手指左右上下拖动</b>来看四周，轻点屏幕开始或停止游动。'),10);},2200);
}
function exitVR(){
  if(!VR.on)return;
  if(VR.xr){const s=renderer.xr.getSession&&renderer.xr.getSession();if(s){s.end();return;}}
  VR.on=false;VR.glide=false;
  window.removeEventListener('deviceorientation',onDevOri);
  document.body.classList.remove('vr');$('vrUI').hidden=true;
  if(VR.fs&&document.fullscreenElement){try{document.exitFullscreen();}catch(e){}}VR.fs=false;
  controls.enabled=true;camera.getWorldDirection(_vv);controls.target.copy(camera.position).addScaledVector(_vv,3);controls.update();
  lastTouch=performance.now();resize();
}
function vrMove(dir,dist){
  if(DIVE.on){dir.y=0;if(dir.lengthSq()<1e-6)return;dir.normalize();}
  camera.position.addScaledVector(dir,dist);controls.target.addScaledVector(dir,dist);
  const dx=camera.position.x-VR.home.x,dz=camera.position.z-VR.home.z,r=Math.hypot(dx,dz),R=40;
  if(r>R){camera.position.x=VR.home.x+dx/r*R;camera.position.z=VR.home.z+dz/r*R;}
}
function stepVR(rdt){
  if(VR.hintT>0){VR.hintT-=rdt;if(VR.hintT<=0)$('vrHint').classList.add('off');}
  if(VR.xr){stepXRInput(rdt);return;}
  if(VR.gyro&&VR.dev){
    devQuat(_vq);
    if(!VR.offSet){_vv.set(0,0,-1).applyQuaternion(_vq);VR.off.setFromAxisAngle(_vy,VR.yaw-Math.atan2(-_vv.x,-_vv.z));VR.offSet=true;}
    camera.quaternion.copy(VR.off).multiply(_vq);
  }else{_ve.set(VR.pitch,VR.yaw,0,'YXZ');camera.quaternion.setFromEuler(_ve);}
  if(VR.glide){camera.getWorldDirection(_vv);vrMove(_vv,0.5*Math.min(rdt,0.25));}
  VR.lblT-=rdt;if(VR.lblT<=0){VR.lblT=0.3;
    const z=Math.max(-camera.position.y,0),top='−'+fmtD(z)+' m · '+$('hZone').textContent+(VR.glide?$t(' · 游动中'):'');
    const cap=$('cap').classList.contains('on')?$('capT').textContent:'';
    document.querySelectorAll('#vrUI .vt').forEach(e=>e.textContent=top);document.querySelectorAll('#vrUI .vc').forEach(e=>e.textContent=cap);
    document.querySelectorAll('#vrUI .dot').forEach(e=>e.classList.toggle('go',VR.glide));}
}
canvas.addEventListener('pointerdown',e=>{if(!VR.on||VR.xr)return;VR.drag={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,t:performance.now()};});
canvas.addEventListener('pointermove',e=>{const d=VR.drag;if(!VR.on||!d)return;
  const k=0.0045,dx=e.clientX-d.lx,dy=e.clientY-d.ly;d.lx=e.clientX;d.ly=e.clientY;
  if(VR.gyro){VR.off.premultiply(_vq.setFromAxisAngle(_vy,dx*k));}
  else{VR.yaw+=dx*k;VR.pitch=Math.max(-1.45,Math.min(1.45,VR.pitch+dy*k));}});
window.addEventListener('pointerup',e=>{const d=VR.drag;VR.drag=null;if(!VR.on||!d)return;
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<8&&performance.now()-d.t<400){VR.glide=!VR.glide;VR.lblT=0;}});
$('vrSplit').addEventListener('click',enterVR);
$('vrX').addEventListener('click',exitVR);

/* ---- WebXR headset ---- */
function vrXRPre(){ /* the XR camera pose is local to the rig: convert to world so every other system sees world coordinates */
  camera.position.applyQuaternion(VR.rig.quaternion).add(VR.rig.position);VR.wp.copy(camera.position);
}
function vrXRPost(){ /* whatever moved the camera this frame (swimming, descent, floor) moves the rig instead */
  VR.rig.position.add(_vv.copy(camera.position).sub(VR.wp));VR.rig.updateMatrixWorld(true);
}
function stepXRInput(rdt){
  const s=renderer.xr.getSession&&renderer.xr.getSession();if(!s)return;
  const dt=Math.min(rdt,0.1);VR.snapT-=dt;
  for(const src of s.inputSources){const g=src.gamepad;if(!g||!g.axes)continue;
    const ax=g.axes.length>=4?g.axes[2]:g.axes[0]||0,ay=g.axes.length>=4?g.axes[3]:g.axes[1]||0;
    if(src.handedness==='right'){
      if(Math.abs(ax)>0.7&&VR.snapT<=0){VR.rig.rotateY(ax>0?-Math.PI/6:Math.PI/6);VR.snapT=0.35;}
      if(Math.abs(ay)>0.2){_vv.set(0,-ay,0);vrMove(_vv,0.8*dt);}
    }else if(Math.abs(ay)>0.15||Math.abs(ax)>0.15){
      camera.getWorldDirection(_vv);const fwd=_vv.clone(),right=new THREE.Vector3().crossVectors(fwd,_vy).normalize();
      _vv.copy(fwd).multiplyScalar(-ay).addScaledVector(right,ax);const m=Math.min(1,_vv.length());if(m>0){_vv.normalize();vrMove(_vv,1.2*m*dt);}
    }
  }
}
function enterXR(){
  if(!navigator.xr||VR.on)return;
  if(PILOT.on)exitPilot();
  navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']}).then(async sess=>{
    renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(sess);
    camera.getWorldDirection(_vv);
    VR.rig.position.copy(camera.position);VR.rig.rotation.set(0,Math.atan2(-_vv.x,-_vv.z),0);
    scene.add(VR.rig);VR.rig.add(camera);camera.position.set(0,0,0);camera.quaternion.identity();
    VR.home.set(controls.target.x,0,controls.target.z);
    VR.on=true;VR.xr=true;controls.enabled=false;
    sess.addEventListener('end',()=>{
      renderer.setAnimationLoop(null);
      camera.updateMatrixWorld(true);camera.matrixWorld.decompose(camera.position,camera.quaternion,_vv);
      scene.add(camera);renderer.xr.enabled=false;VR.xr=false;VR.on=false;
      controls.enabled=true;camera.getWorldDirection(_vv);controls.target.copy(camera.position).addScaledVector(_vv,3);controls.update();
      resize();last=performance.now();requestAnimationFrame(frame);
      $('vrNote').textContent=$t('已退出头显 VR。');
    });
    last=performance.now();renderer.setAnimationLoop(frame);
  }).catch(err=>{$('vrNote').textContent=$t('没能进入头显 VR：')+(err&&err.message?err.message:$t('浏览器拒绝了请求'))+$t('。可以改用上面的手机分屏 VR。');});
}
$('vrXR').addEventListener('click',enterXR);
(function vrCheck(){
  const no=$t('这台设备的浏览器没有提供头显 VR（WebXR），所以这里只有手机分屏模式。用 VR 头显时，请在头显自带的浏览器里打开这个页面。');
  try{if(navigator.xr&&navigator.xr.isSessionSupported)navigator.xr.isSessionSupported('immersive-vr').then(ok=>{$('vrXR').hidden=!ok;$('vrNote').textContent=ok?$t('检测到 VR 头显，可以用“进入头显 VR”。头显模式里没有泛光和白平衡后期处理，颜色会比屏幕上偏蓝一些。'):no;}).catch(()=>{$('vrNote').textContent=no;});
  else $('vrNote').textContent=no;}catch(e){$('vrNote').textContent=no;}
})();

