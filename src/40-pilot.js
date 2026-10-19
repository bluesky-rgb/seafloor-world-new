/* =========================================================
   14s. Free piloting: a tethered ROV (or a diver) under thrust and water drag.
   Thrust ~0.9 m/s², quadratic drag gives a top speed of ~1 m/s (typical small ROV / swimming diver).
   The water itself moves you: tidal/ambient current (log-law profile near the bottom) and wave surge (linear wave orbits).
   A 60 m tether limits how far you can go from where you started.
   ========================================================= */
const PILOT={on:false,yaw:0,pitch:0,v:new THREE.Vector3(),pos:new THREE.Vector3(),home:new THREE.Vector3(),tether:60,hudT:0,joy:{x:0,y:0},vb:0,drag:false,lx:0,ly:0,warn:0};
const KEYS={};
const _pd=new THREE.Vector3(),_pr=new THREE.Vector3(),_pa=new THREE.Vector3(),_pw=new THREE.Vector3();
function enterPilot(){
  if(DIVE.on)return;PILOT.on=true;controls.enabled=false;
  camera.getWorldDirection(_pd);PILOT.yaw=Math.atan2(-_pd.x,-_pd.z);PILOT.pitch=Math.asin(Math.max(-0.99,Math.min(0.99,_pd.y)));
  PILOT.pos.copy(camera.position);PILOT.v.set(0,0,0);PILOT.home.set(controls.target.x,0,controls.target.z);
  $('pilotBar').hidden=false;$('pilotBtn').hidden=true;$('diveCta').hidden=true;$('cardBtn').style.bottom=window.innerWidth<760?'200px':'140px';$('joyWrap').hidden=!matchMedia('(pointer: coarse)').matches;
  if(window.innerWidth<760)setPanel(false);
  showCaption($t('自由驾驶'),$t('推进器加速度约 0.9 m/s²，最高速度约 1 m/s；海流和波浪会推着你漂。缆绳长 60 m。'),6);
}
function exitPilot(){
  if(!PILOT.on)return;PILOT.on=false;controls.enabled=true;
  camera.getWorldDirection(_pd);controls.target.copy(camera.position).addScaledVector(_pd,3);controls.update();
  $('pilotBar').hidden=true;$('pilotBtn').hidden=DIVE.on;$('diveCta').hidden=DIVE.on;$('cardBtn').style.bottom='';$('joyWrap').hidden=true;
}
function pilotDir(out){const cp=Math.cos(PILOT.pitch);return out.set(-Math.sin(PILOT.yaw)*cp,Math.sin(PILOT.pitch),-Math.cos(PILOT.yaw)*cp);}
function stepPilot(rdt,t){
  const dt=Math.min(rdt,0.25),K=KEYS;
  const turn=(K.arrowleft?1:0)-(K.arrowright?1:0);PILOT.yaw+=turn*1.1*dt;
  const f=Math.max(-1,Math.min(1,(K.w||K.arrowup?1:0)-(K.s||K.arrowdown?1:0)+PILOT.joy.y));
  const r=Math.max(-1,Math.min(1,(K.d?1:0)-(K.a?1:0)+PILOT.joy.x));
  const u=Math.max(-1,Math.min(1,(K.e||K[' ']?1:0)-(K.q||K.c?1:0)+PILOT.vb));
  pilotDir(_pd);_pr.set(Math.cos(PILOT.yaw),0,-Math.sin(PILOT.yaw));
  _pa.set(0,0,0).addScaledVector(_pd,f).addScaledVector(_pr,r);_pa.y+=u;if(_pa.lengthSq()>1)_pa.normalize();_pa.multiplyScalar(0.9);
  const sp=PILOT.v.length();PILOT.v.addScaledVector(_pa,dt).multiplyScalar(1/(1+0.9*sp*dt+0.15*dt));
  /* water motion: current with the bottom boundary layer, plus wave orbital surge */
  const p=PILOT.pos,alt=Math.max(0.05,p.y-floorY(p.x,p.z));orbital(p.x,p.y,t,_u);
  const cu=S.cur*curProfile(Math.min(alt,S.D));_pw.set(CUR.x*cu+_u.x,_u.y,CUR.z*cu+_u.z);
  p.addScaledVector(PILOT.v,dt).addScaledVector(_pw,dt);
  /* tether */
  const dx=p.x-PILOT.home.x,dz=p.z-PILOT.home.z,dh=Math.hypot(dx,dz);
  if(dh>PILOT.tether){p.x=PILOT.home.x+dx/dh*PILOT.tether;p.z=PILOT.home.z+dz/dh*PILOT.tether;const vr=(PILOT.v.x*dx+PILOT.v.z*dz)/dh;if(vr>0){PILOT.v.x-=vr*dx/dh;PILOT.v.z-=vr*dz/dh;}PILOT.warn=2;}
  /* bottom, surface or ice */
  const fy=floorY(p.x,p.z)+0.5;if(p.y<fy){p.y=fy;if(PILOT.v.y<0)PILOT.v.y=0;}
  const top=ICE.on?-ICE.h-0.5:underArcIce(p.x-0.4,p.z)?-ARC.h-0.4:-0.4;if(p.y>top){p.y=top;if(PILOT.v.y>0)PILOT.v.y=0;}
  if(brineOn&&brineQ(p.x,p.z)<1.02&&p.y<BR.base+BR.L+0.3){p.y=BR.base+BR.L+0.3;if(PILOT.v.y<0)PILOT.v.y=0;}
  camera.position.copy(p);_pa.copy(p).add(pilotDir(_pd));camera.lookAt(_pa);controls.target.copy(p).addScaledVector(_pd,4);
  PILOT.hudT+=rdt;if(PILOT.hudT>0.2){PILOT.hudT=0;
    let hd=((-PILOT.yaw*180/Math.PI)%360+360)%360;const nm=[$t('北'),$t('东北'),$t('东'),$t('东南'),$t('南'),$t('西南'),$t('西'),$t('西北')][Math.round(hd/45)%8];
    PILOT.warn=Math.max(0,PILOT.warn-0.2);
    $('pilotInfo').textContent=$t('速度 ')+PILOT.v.length().toFixed(2)+$t(' m/s · 航向 ')+Math.round(hd)+'° '+nm+$t(' · 离底 ')+(p.y-floorY(p.x,p.z)).toFixed(1)+$t(' m · 缆绳 ')+Math.round(Math.min(dh,PILOT.tether))+' / '+PILOT.tether+' m'+(PILOT.warn>0?$t(' · 缆绳已放到头'):'')+(_pw.length()>0.05?$t(' · 水流 ')+_pw.length().toFixed(2)+' m/s':'');}
}
window.addEventListener('keydown',e=>{if(!PILOT.on)return;const tg=e.target;if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'))return;const k=e.key.toLowerCase();
  if(k==='escape'){exitPilot();return;}if(['w','a','s','d','q','e','c',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){KEYS[k]=true;e.preventDefault();}});
window.addEventListener('keyup',e=>{KEYS[e.key.toLowerCase()]=false;});
window.addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;});
canvas.addEventListener('pointerdown',e=>{if(!PILOT.on)return;PILOT.drag=true;PILOT.lx=e.clientX;PILOT.ly=e.clientY;});
window.addEventListener('pointermove',e=>{if(!PILOT.on||!PILOT.drag)return;const dx=e.clientX-PILOT.lx,dy=e.clientY-PILOT.ly;PILOT.lx=e.clientX;PILOT.ly=e.clientY;
  PILOT.yaw-=dx*0.005;PILOT.pitch=Math.max(-1.35,Math.min(1.35,PILOT.pitch-dy*0.005));});
window.addEventListener('pointerup',()=>{PILOT.drag=false;});
{const pad=$('joy'),knob=$('joyKnob');let id=null;
  const upd=e=>{const b=pad.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2,R=b.width/2;let x=(e.clientX-cx)/R,y=(e.clientY-cy)/R;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}
    PILOT.joy.x=x;PILOT.joy.y=-y;knob.style.transform='translate('+(x*R*0.6)+'px,'+(y*R*0.6)+'px)';};
  pad.addEventListener('pointerdown',e=>{id=e.pointerId;pad.setPointerCapture(id);upd(e);e.stopPropagation();});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===id)upd(e);});
  const end=e=>{if(e.pointerId!==id)return;id=null;PILOT.joy.x=PILOT.joy.y=0;knob.style.transform='';};
  pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);
  for(const[bid,v]of[['joyUp',1],['joyDn',-1]]){const b=$(bid);b.addEventListener('pointerdown',e=>{PILOT.vb=v;b.setPointerCapture(e.pointerId);});
    const st=()=>{PILOT.vb=0;};b.addEventListener('pointerup',st);b.addEventListener('pointercancel',st);}}
$('pilotBtn').addEventListener('click',enterPilot);$('pilotX').addEventListener('click',exitPilot);

