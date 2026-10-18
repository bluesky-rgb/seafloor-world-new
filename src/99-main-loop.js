/* =========================================================
   17. Main loop
   ========================================================= */
resize();
if(window.innerWidth<760)setPanel(false);
registerPickables();
applyLocation('xisha');
renderCatalog();updDiveUI();
const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let last=performance.now(),t=0,hudAcc=1,expo=1,discT=0;
function frame(now){
  const rdt=Math.min((now-last)/1000,0.5),dt=Math.min(rdt,1/25);last=now;t+=dt;
  if(VR.xr)vrXRPre();
  controls.autoRotate=TOUR.on?!reduceMotion&&!TOUR.paused&&(now-lastTouch>4000):S.tour&&!reduceMotion&&(now-lastTouch>8000)&&!wall.visible;
  if(DIVE.on){
    if(DIVE.replay){if(DIVE.play)replayStep(rdt);}
    else if(DIVE.play){const dz=diveSpeed()*rdt;DIVE.elapsed+=Math.min(dz,S.D-2.2-DIVE.z);setDiveZ(DIVE.z+dz);}
    stepDVM(rdt);stepWall();updProfile();
    DIVE.zoneT+=rdt;if(DIVE.zoneT>0.25){DIVE.zoneT=0;zoneUpdate();if(DIVE.dvm)drawEcho();}
    DIVE.infoT+=rdt;if(DIVE.infoT>0.5){DIVE.infoT=0;diveInfo();readouts();updDiveUI();if(DIVE.dvm)dvmNote();}
  }
  if(capTimer>0){capTimer-=rdt;if(capTimer<=0)$('cap').classList.remove('on');}
  if(TOUR.on)stepTour(rdt);
  if(VR.on)stepVR(rdt);else if(PILOT.on)stepPilot(rdt,t);else controls.update();
  stepMissions(rdt);stepStir(rdt);
  const fy=floorY(camera.position.x,camera.position.z)+0.4;
  camera.position.y=Math.min(Math.max(camera.position.y,fy),ICE.on?-ICE.h-0.5:underArcIce(camera.position.x-0.4,camera.position.z)?-ARC.h-0.4:-0.3);
  if(brineOn&&brineQ(camera.position.x,camera.position.z)<1.05)camera.position.y=Math.max(camera.position.y,BR.base+BR.L+0.3);
  U.uTime.value=t;U.uCamDepth.value=-camera.position.y;U.uCamPos.value.copy(camera.position);camera.getWorldDirection(U.uCamDir.value);
  sky.position.copy(camera.position);
  orbital(0,-S.D+0.2,t,_u);U.uFlow.value.set(Math.max(-1.5,Math.min(1.5,_u.x/0.3)),Math.max(-1.5,Math.min(1.5,_u.z/0.3)));
  stepKelp(dt/2,t);stepKelp(dt/2,t+dt/2);drawKelp(t);
  for(const k in FISH)stepSchool(FISH[k],dt,t);
  for(const k in JELLY)stepJelly(JELLY[k],dt,t);
  stepMantas(dt,t);stepTurtles(dt,t);stepAnglers(dt,t);
  for(const k in DRIFT)stepDrift(DRIFT[k],dt,t);
  stepGiants(dt,t);audioUpdate(dt,t);stepWhaleFall(dt,t);stepVent(dt,t);stepBrine(dt,t);stepBH(dt,t);stepSpawn(rdt,t);stepAbyss(dt,t);stepMangrove(dt,t);stepArctic(dt,t);
  if(infoT>0){infoT-=rdt;if(infoT<=0)$('info').hidden=true;}
  discT+=rdt;if(discT>0.5){discT=0;checkDiscover();if(SPN.on){spawnNote();readouts();}}stepToast(rdt);
  FANS.forEach(m=>{if(!m.visible)return;const u=m.userData;m.rotation.set(0.12*(U.uFlow.value.x*Math.sin(u.yaw)+U.uFlow.value.y*Math.cos(u.yaw))*0.5+0.03*Math.sin(t*0.8+u.ph),u.yaw,0);});
  stepBubbles(dt,t);stepSnow(dt,t);stepSparks(dt,t);stepRays(dt,t);
  const z=-camera.position.y;
  const L=(0.3*light(z,0)+0.5*light(z,1)+0.2*light(z,2))*U.uSky.value;
  let target=S.adapt?Math.min(40,Math.max(1,Math.pow(L+1e-12,-0.5))):1;
  if(S.adapt&&(S.night||z>200))target=Math.min(target,S.torch==='off'?10:(z>200?4:2.6));
  expo+=(target-expo)*Math.min(1,rdt*2);renderer.toneMappingExposure=expo*0.9;
  if(wbPass){let g=[1,1,1];
    if(S.adapt&&!S.night&&z<200){const a=[0,1,2].map(i=>light(z,i)*Math.exp(-OPT.c[i]*3)),m=(a[0]+a[1]+a[2])/3;
      g=a.map(v=>Math.min(5,Math.max(0.5,Math.pow(m/Math.max(v,1e-6),0.5))));const n=(g[0]*a[0]+g[1]*a[1]+g[2]*a[2])/(a[0]+a[1]+a[2]);g=g.map(v=>Math.min(2.4,v/n));if(MANG.on)g=g.map(v=>1+(v-1)*0.35);}   /* keep the lagoon's green cast, as the eye sees it */
    if(S.torch==='blue'&&(S.night||z>=200))g=[1.15,1.1,0.22];
    {/* deep white lamps: the camera balances to its own lamps over ~2 m of water each way, as on an ROV (applied to lamp-lit light only, the water stays dark blue) */
      let tw=[1,1,1];if(S.torch==='white'&&z>=200){tw=[0,1,2].map(i=>Math.exp(OPT.c[i]*4.0));const n=0.3*tw[0]+0.59*tw[1]+0.11*tw[2];tw=tw.map(v=>Math.min(3.5,v/n));}
      U.uTorchWB.value.lerp(_p.set(tw[0],tw[1],tw[2]),Math.min(1,rdt*2));}
    WB.lerp(_p.set(g[0],g[1],g[2]),Math.min(1,rdt*2));wbPass.uniforms.uWB.value.copy(WB);
    wbPass.uniforms.uVig.value=Math.min(0.6,Math.max(0,(z-120)/700));
    const hz=U.uTorch.value*Math.min(1,0.25+WATER[S.water].b[1]*3)*0.06*(DIVE.bh?1+5*bhHaze(DIVE.z):1)*Math.max(0,1-light(z,1)*U.uSky.value*30);
    wbPass.uniforms.uHaze.value.set(U.uTorchCol.value.x*hz*Math.exp(-OPT.c[0]*4),U.uTorchCol.value.y*hz*Math.exp(-OPT.c[1]*4),U.uTorchCol.value.z*hz*Math.exp(-OPT.c[2]*4));}
  hudAcc+=dt;if(hudAcc>0.2){hudAcc=0;hud();}
  if(VR.xr){vrXRPost();renderer.render(scene,camera);}
  else if(VR.on)renderStereo();
  else if(composer)composer.render();else renderer.render(scene,camera);
  if(!VR.xr)requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
