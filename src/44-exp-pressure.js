/* =========================================================
   14w. Pressure experiment. P = P_atm + rho*g*z. Compared:
   - an air balloon: Boyle's law V/V0 = P0/P, springs back on the way up;
   - a foam cup: expanded polystyrene is ~95 % air in small cells. Simple model (assumptions stated on the page):
     cell walls start to give way above ~6 atm, then the gas inside is squeezed per Boyle while the 5 % solid stays;
     the crushed walls do not recover, so the cup keeps its smallest size;
   - a bottle of water: compressibility ~4.6e-10 /Pa, so even at the trench bottom it loses only ~5 % of its volume.
   ========================================================= */
const PX={z:0,minV:1,anim:null};
function pressAtm(z){return pressure(z)/PATM;}
function foamV(P){const phi=0.05,Py=6;return phi+(1-phi)*Math.min(1,Py/P);}
function pressSlider2z(v){return v<=0?0:Math.round(10*Math.pow(10935/10,v/1000));}
function pressZ2slider(z){return z<=10?0:Math.round(1000*Math.log(z/10)/Math.log(10935/10));}
function pressDraw(){
  const z=PX.z,P=pressAtm(z),bal=1/P,cupNow=foamV(P);PX.minV=Math.min(PX.minV,cupNow);const cup=PX.minV;const wat=1-4.6e-10*(pressure(z)-PATM);
  const ls=v=>Math.cbrt(v);const svg=$('pxSvg');const W=600,H=230,base=200;
  const cupS=ls(cup),balS=ls(bal),watS=ls(wat);
  const cupPath=(cx,s)=>{const h=110*s,tw=80*s,bw=52*s;return 'M'+(cx-tw/2)+','+(base-h)+' L'+(cx+tw/2)+','+(base-h)+' L'+(cx+bw/2)+','+base+' L'+(cx-bw/2)+','+base+' Z';};
  let h='<rect x="0" y="0" width="600" height="230" fill="#05141c"/>';
  h+='<path d="'+cupPath(100,1)+'" fill="none" stroke="rgba(217,236,239,.25)" stroke-dasharray="4 4"/>';
  h+='<path d="'+cupPath(100,cupS)+$t('" fill="#e9e4d8" stroke="#bfb8a8"/><text x="100" y="222" text-anchor="middle" class="pt">泡沫杯</text>');
  const br=48;h+='<circle cx="300" cy="'+(base-br)+'" r="'+br+'" fill="none" stroke="rgba(217,236,239,.25)" stroke-dasharray="4 4"/>';
  h+='<circle cx="300" cy="'+(base-br*balS)+'" r="'+Math.max(1.5,br*balS)+$t('" fill="#ff7a63" opacity=".85"/><text x="300" y="222" text-anchor="middle" class="pt">装空气的气球</text>');
  const bw=56,bh=100;h+='<rect x="'+(500-bw/2)+'" y="'+(base-bh)+'" width="'+bw+'" height="'+bh+'" rx="8" fill="none" stroke="rgba(217,236,239,.25)" stroke-dasharray="4 4"/>';
  h+='<rect x="'+(500-bw*watS/2)+'" y="'+(base-bh*watS)+'" width="'+(bw*watS)+'" height="'+(bh*watS)+$t('" rx="8" fill="#5ea8ff" opacity=".8"/><text x="500" y="222" text-anchor="middle" class="pt">装满水的瓶子</text>');
  svg.innerHTML=h;
  $('pxZ').textContent=z.toLocaleString('en-US')+' m';
  const kg=pressure(z)*1e-4/9.81;
  $('pxNum').innerHTML='<b>'+P.toFixed(1)+$t(' 个大气压</b>，相当于每平方厘米上压着 <b>')+(kg<1000?kg.toFixed(kg<10?2:0)+' kg':(kg/1000).toFixed(2)+$t(' 吨'))+$t('</b>。<br>气球体积：原来的 <b>')+(bal*100).toFixed(bal<0.01?2:1)+$t('%</b>（回到水面会恢复）；泡沫杯：原来的 <b>')+(cup*100).toFixed(1)+$t('%</b>，高度约原来的 <b>')+(cupS*100).toFixed(0)+$t('%</b>（回到水面也不会恢复）；水：原来的 <b>')+(wat*100).toFixed(2)+$t('%</b>。');
}
function pressSet(z){PX.z=z;$('pxS').value=pressZ2slider(z);pressDraw();}
$('pxOpen').addEventListener('click',()=>{$('press').hidden=false;PX.minV=1;pressSet(0);});
$('pxX').addEventListener('click',()=>{$('press').hidden=true;cancelAnimationFrame(PX.anim);});
$('press').addEventListener('click',e=>{if(e.target.id==='press'){$('press').hidden=true;cancelAnimationFrame(PX.anim);}});
$('pxS').addEventListener('input',e=>{cancelAnimationFrame(PX.anim);pressSet(pressSlider2z(+e.target.value));});
function pressAnim(to){cancelAnimationFrame(PX.anim);const from=PX.z,t0=performance.now(),dur=5000;
  const step=now=>{const k=Math.min(1,(now-t0)/dur),e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;pressSet(Math.round(from+(to-from)*e));if(k<1)PX.anim=requestAnimationFrame(step);};PX.anim=requestAnimationFrame(step);}
$('pxDown').addEventListener('click',()=>pressAnim(10935));$('pxUp').addEventListener('click',()=>pressAnim(0));
$('pxReset').addEventListener('click',()=>{cancelAnimationFrame(PX.anim);PX.minV=1;pressSet(0);});

