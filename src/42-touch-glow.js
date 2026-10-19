/* =========================================================
   14u. Touch-triggered bioluminescence. Dinoflagellates (and, deeper, small crustaceans) flash when the shear stress
   of moving water exceeds ~0.1–0.3 Pa (Latz et al.). For a hand-sized body (L≈0.1 m) moving at speed U the wall shear
   is roughly tau = mu*U/delta with a laminar boundary layer delta = 5*sqrt(nu*L/U); that crosses the threshold near
   0.3 m/s. Flashes are only visible when ambient light is very low (night, or the deep sea).
   ========================================================= */
const STIR={on:false,prev:null,lastT:0,hint:0};
const _sr=new THREE.Raycaster(),_sv=new THREE.Vector2(),_sp1=new THREE.Vector3();
function shearPa(U,L){const mu=viscosity(S.temp),nu=mu/RHO;if(U<=1e-4)return 0;const d=5*Math.sqrt(nu*L/U);return mu*U/d;}
function isDark(){return S.night||light(camZ(),1)*U.uSky.value<2e-3;}
function stirFlash(a,b,U,L){
  const tau=shearPa(U,L),k=tau/0.15-1;if(k<=0)return 0;
  const len=a.distanceTo(b),n=Math.min(30,Math.ceil(Math.min(k,4)*len*14));
  for(let i=0;i<n;i++){const t=rnd();emitSpark(a.x+(b.x-a.x)*t+R(-0.06,0.06),a.y+(b.y-a.y)*t+R(-0.06,0.06),a.z+(b.z-a.z)*t+R(-0.06,0.06),R(0.15,0.45),R(0.007,0.016));}
  return n;
}
function pointerWorld(e,dist,out){const r=canvas.getBoundingClientRect();_sv.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);_sr.setFromCamera(_sv,camera);return out.copy(_sr.ray.origin).addScaledVector(_sr.ray.direction,dist);}
canvas.addEventListener('pointerdown',e=>{if(VR.on)return;STIR.on=true;STIR.prev=pointerWorld(e,1.6,new THREE.Vector3());STIR.lastT=performance.now();});
window.addEventListener('pointerup',()=>{STIR.on=false;STIR.prev=null;});
canvas.addEventListener('pointermove',e=>{
  if(!STIR.on||!STIR.prev)return;const now=performance.now(),dt=Math.max(0.008,(now-STIR.lastT)/1000);STIR.lastT=now;
  const p=pointerWorld(e,1.6,_sp1),U=p.distanceTo(STIR.prev)/dt;
  if(isDark()){stirFlash(STIR.prev,p,Math.min(U,3),0.1);}
  else if(U>0.3&&STIR.hint<=0){STIR.hint=60;showCaption($t('这里太亮了'),$t('生物发光很微弱，白天在浅水里看不到。切到“夜潜”，或者到 200 m 以下，再用手指或鼠标在水里划一划。'),5);}
  STIR.prev.copy(p);
});
function stepStir(rdt){
  if(STIR.hint>0)STIR.hint-=rdt;
  /* the ROV hull and thrusters stir the water too */
  if(PILOT.on&&isDark()){const U=PILOT.v.length();if(U>0.15){pilotDir(_pd);const c=camera.position;
    const a=_sp1.copy(c).addScaledVector(_pd,0.6);a.x+=R(-0.5,0.5);a.y+=R(-0.4,0.3);a.z+=R(-0.5,0.5);
    const b=a.clone().addScaledVector(_pd,-U*rdt*4);stirFlash(a,b,U,0.5);}}
}

