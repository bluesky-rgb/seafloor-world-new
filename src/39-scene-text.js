/* =========================================================
   Scene in words: a text description of where you are, the conditions, and which animals are in view,
   for screen-reader users and anyone who can't see the 3D view well. "文字描述" button in the console, or the G key.
   It reuses what the page already knows: the HUD readings, the site texts and isSeen() from the field guide.
   ========================================================= */
const guideEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const firstSentence=s=>{const m=String(s).match(/^.*?[。！？]|^.*?[.!?](?=\s|$)/);return(m?m[0]:s).trim();};
/* nearest instance of a catalogue species, in world space (null when it has no single position, e.g. a whole reef) */
const PICK_ALIAS={fanS:'fan',fanD:'fan',paragorgia:'fan',starT:'star',starC:'star',odontaster:'star',sterechinus:'urchinT',rossella:'sponge'};
const _gv=new THREE.Vector3(),_gm=new THREE.Matrix4();
function nearestOf(k){
  const c=camera.position;let best=null,bd=1e9;
  const take=(x,y,z)=>{const d=Math.hypot(x-c.x,y-c.y,z-c.z);if(d<bd){bd=d;best=(best||new THREE.Vector3()).set(x,y,z);}};
  const arr=(p,n)=>{const st=Math.max(1,Math.floor(n/96));for(let i=0;i<n;i+=st)take(p[i*3],p[i*3+1],p[i*3+2]);};
  if(FISH[k]&&FISH[k].active){arr(FISH[k].p,FISH[k].n);return best;}
  if(JELLY[k]&&JELLY[k].active){arr(JELLY[k].p,JELLY[k].n);return best;}
  if(DRIFT[k]&&DRIFT[k].active){arr(DRIFT[k].p,DRIFT[k].n);return best;}
  const enc={whaleshark:encWS,sperm:encSW,squid:encSQ,siph:encSI,seal:encSeal}[k];
  if(enc){if(enc.on)take(enc.pos.x,enc.pos.y,enc.pos.z);return best;}
  if(k==='narwhal'||k==='beluga'){const P=ARC.pod;if(P&&P.sp===k)P.m.forEach(q=>take(q.pos.x,q.pos.y,q.pos.z));return best;}
  const ck=PICK_ALIAS[k]||k;
  for(const o of PICK){if(o.userData.ck!==ck||!chainVisible(o))continue;o.updateMatrixWorld();
    if(o.isInstancedMesh){const n=o.count,st=Math.max(1,Math.floor(n/96)),a=o.instanceMatrix.array;
      for(let i=0;i<n;i+=st){_gv.set(a[i*16+12],a[i*16+13],a[i*16+14]).applyMatrix4(o.matrixWorld);take(_gv.x,_gv.y,_gv.z);}}
    else{const g=o.geometry;if(g&&!g.boundingSphere&&g.attributes&&g.attributes.position)g.computeBoundingSphere();
      if(g&&g.boundingSphere)_gv.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);else o.getWorldPosition(_gv);take(_gv.x,_gv.y,_gv.z);}}
  return best;
}
/* where a point is relative to the current view: "ahead left, above, about 3 m" */
function dirWords(p){
  const v=_gv.copy(p).applyMatrix4(camera.matrixWorldInverse),d=v.length();
  const az=Math.atan2(v.x,-v.z)*180/Math.PI,el=Math.atan2(v.y,Math.hypot(v.x,v.z))*180/Math.PI;
  let w;
  if(el>60)w=$t('头顶');else if(el<-60)w=$t('正下方');
  else{const L=az<0;w=Math.abs(az)<25?$t('正前方'):Math.abs(az)<70?(L?$t('左前方'):$t('右前方')):Math.abs(az)<115?(L?$t('左边'):$t('右边')):$t('身后');
    if(el>25)w+=$t('偏上');else if(el<-25)w+=$t('偏下');}
  return{w:w+$t('，约 ')+(d<10?d.toFixed(1):Math.round(d))+' m',d};
}
function guideKey(){if(DIVE.on)return DIVE.dvm?'dvm':DIVE.bh?'bluehole':DIVE.replay?'replay':'dive';return S.loc;}
function lightWords(z){
  if(S.night&&!DIVE.dvm)return $t('夜里，没有阳光');
  const v=light(z,1)*(DIVE.dvm?surfE(DVM.t):1);
  return v>0.2?$t('阳光充足'):v>0.01?$t('阳光变暗，颜色偏蓝绿'):v>1e-4?$t('只剩微弱的蓝光'):$t('没有阳光，一片漆黑');
}
function torchWords(){return S.torch==='off'?$t('手电关着'):S.torch==='blue'?$t('开着蓝光手电'):$t('开着白光手电');}
function renderGuide(){
  hud();                                    /* refresh the HUD readings this reuses, in case no frame has run since a jump */
  const k=guideKey(),d=k&&SITE[k]?SITE[k]:null,z=camZ(),see=seeDist(false);
  let seen=[];try{seen=CAT.filter(c=>{try{return isSeen(c[0]);}catch(e){return false;}});}catch(e){}
  let h='<h3>'+$t('你在哪里')+'</h3><p>'+guideEsc(d?d[0]:$t('自定义参数'))+'</p>';
  if(d)h+='<p>'+guideEsc(d[1])+'</p>';
  h+='<h3>'+$t('环境')+'</h3><ul>'
    +'<li>'+$t('水深 ')+fmtD(z)+' m · '+guideEsc($('hZone').textContent)+'</li>'
    +'<li>'+$t('压强 ')+guideEsc($('hPress').textContent)+'</li>'
    +'<li>'+guideEsc($('hTemp').textContent)+'</li>'
    +'<li>'+$t('光线：')+lightWords(z)+$t('；')+torchWords()+'</li>'
    +'<li>'+(see>0?$t('大约能看清 ')+Math.round(see)+$t(' m 以内'):$t('几乎什么都看不见，只有会发光的生物'))+'</li></ul>';
  h+='<h3>'+$t('附近看得见的生物')+' ('+seen.length+')</h3>';
  camera.updateMatrixWorld();
  const rows=seen.map(c=>{let p=null;try{p=nearestOf(c[0]);}catch(e){}const dw=p?dirWords(p):null;return{c,dw,d:dw?dw.d:1e9};}).sort((a,b)=>a.d-b.d);
  h+=seen.length?'<ul>'+rows.map(({c,dw})=>'<li><b>'+guideEsc(c[1])+'</b> <i lang="la">'+guideEsc(c[2])+'</i>'+(dw?' <span class="gdir">('+guideEsc(dw.w)+')</span>':'')+(FACTS[c[0]]?$t('：')+guideEsc(firstSentence(FACTS[c[0]])):'')+'</li>').join('')+'</ul>'
    :'<p>'+$t('附近暂时没有看到动物。试试打开手电、换个地点，或者等一会儿。')+'</p>';
  if(d&&d[2])h+='<h3>'+$t('可以试试')+'</h3><p>'+guideEsc(d[2])+'</p>';
  $('guideBody').innerHTML=h;
  $('guideSum').textContent=(d?d[0]:$t('自定义参数'))+$t('，水深 ')+fmtD(z)+' m'+$t('，附近看得见 ')+seen.length+$t(' 种生物。');
}
let guideFrom=null;
function openGuide(){guideFrom=document.activeElement;renderGuide();$('guide').hidden=false;$('guideX').focus();}
function closeGuide(){$('guide').hidden=true;if(guideFrom&&guideFrom.focus)guideFrom.focus();guideFrom=null;}
$('guideBtn').addEventListener('click',openGuide);
$('guideX').addEventListener('click',closeGuide);
$('guideR').addEventListener('click',renderGuide);
$('guide').addEventListener('click',e=>{if(e.target===$('guide'))closeGuide();});
window.addEventListener('keydown',e=>{
  const tg=e.target;if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'||tg.isContentEditable))return;
  if(e.key==='Escape'&&!$('guide').hidden){e.stopImmediatePropagation();closeGuide();return;}
  if((e.key==='g'||e.key==='G')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if($('guide').hidden)openGuide();else closeGuide();}
});
/* keyboard look-around for the 3D view: arrow keys turn, +/− zoom (when the page or the canvas has focus, not while piloting or in VR) */
const _sph=new THREE.Spherical();
function orbitBy(dTheta,dPhi,zoom){
  const off=camera.position.clone().sub(controls.target);_sph.setFromVector3(off);
  _sph.theta+=dTheta;_sph.phi=Math.max(0.15,Math.min(Math.PI-0.15,_sph.phi+dPhi));
  _sph.radius=Math.max(controls.minDistance,Math.min(controls.maxDistance,_sph.radius*zoom));
  camera.position.copy(controls.target).add(off.setFromSpherical(_sph));camera.lookAt(controls.target);controls.update();lastTouch=performance.now();
}
window.addEventListener('keydown',e=>{
  if(PILOT.on||VR.on||e.ctrlKey||e.metaKey||e.altKey)return;
  const a=document.activeElement;if(a&&a!==document.body&&a!==canvas)return;
  const K={ArrowLeft:[0.17,0,1],ArrowRight:[-0.17,0,1],ArrowUp:[0,-0.1,1],ArrowDown:[0,0.1,1],'+':[0,0,0.85],'=':[0,0,0.85],'-':[0,0,1.18],'_':[0,0,1.18]}[e.key];
  if(!K)return;e.preventDefault();orbitBy(K[0],K[1],K[2]);
});
