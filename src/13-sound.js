/* =========================================================
   14e. Synthesized sound (Web Audio; starts only after a click)
   ========================================================= */
const AUD={ctx:null,on:false,clickT:1};
function audioStart(){
  if(!AUD.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
    let ctx;try{ctx=new C();}catch(e){return false;}AUD.ctx=ctx;
    const master=ctx.createGain();master.gain.value=0.7;master.connect(ctx.destination);AUD.master=master;
    const len=ctx.sampleRate*4,nb=ctx.createBuffer(1,len,ctx.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<len;i++)nd[i]=Math.random()*2-1;AUD.noise=nb;
    const bb=ctx.createBuffer(1,len,ctx.sampleRate),bd=bb.getChannelData(0);let l=0;for(let i=0;i<len;i++){l=(l+0.02*(Math.random()*2-1))/1.02;bd[i]=l*3.5;}
    const rs=ctx.createBufferSource();rs.buffer=bb;rs.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;
    const rg=ctx.createGain();rg.gain.value=0;rs.connect(lp);lp.connect(rg);rg.connect(master);rs.start();AUD.rumble=rg;AUD.rlp=lp;
    const ws=ctx.createBufferSource();ws.buffer=nb;ws.loop=true;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=550;bp.Q.value=0.5;
    const wg=ctx.createGain();wg.gain.value=0;ws.connect(bp);bp.connect(wg);wg.connect(master);ws.start();AUD.wash=wg;}
  if(AUD.ctx.state==='suspended')AUD.ctx.resume();AUD.on=true;return true;
}
function setSound(on){
  if(on){if(!audioStart())on=false;}else if(AUD.ctx){AUD.ctx.suspend();AUD.on=false;}
  AUD.on=on;$('cSound').checked=on;$('dSound').textContent='声音：'+(on?'开':'关');
}
/* exhaled bubbles ring at their Minnaert frequency f=(1/2πr)√(3γP/ρ); the regulator hisses on the inhale */
function playBreath(){
  if(!AUD.on)return;const ctx=AUD.ctx,t0=ctx.currentTime,P=pressure(camZ());
  for(let i=0;i<24;i++){const st=t0+Math.random()*1.4,r=Math.exp(Math.log(8e-4)+Math.random()*Math.log(6));
    const f=Math.min(6000,Math.sqrt(3*1.4*P/RHO)/(2*Math.PI*r));
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f,st);o.frequency.exponentialRampToValueAtTime(f*1.25,st+0.06);
    g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(0.03+Math.random()*0.04,st+0.004);g.gain.exponentialRampToValueAtTime(0.0001,st+0.08);
    o.connect(g);g.connect(AUD.master);o.start(st);o.stop(st+0.1);}
  const st=t0+2.3,src=ctx.createBufferSource();src.buffer=AUD.noise;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2600;bp.Q.value=1.1;
  const g=ctx.createGain();g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(0.05,st+0.25);g.gain.linearRampToValueAtTime(0,st+1.1);
  src.connect(bp);bp.connect(g);g.connect(AUD.master);src.start(st,Math.random()*2,1.2);
}
function playClick(gain){
  const ctx=AUD.ctx,t0=ctx.currentTime;
  for(let k=0;k<3;k++){const st=t0+k*0.004,src=ctx.createBufferSource();src.buffer=AUD.noise;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2200;bp.Q.value=0.7;
    const g=ctx.createGain();const gk=gain*[1,0.45,0.2][k];g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(gk,st+0.0008);g.gain.exponentialRampToValueAtTime(0.0001,st+0.02);
    src.connect(bp);bp.connect(g);g.connect(AUD.master);src.start(st,Math.random()*3,0.03);}
}
function audioUpdate(dt,t){
  if(!AUD.on||!AUD.ctx)return;const z=camZ(),now=AUD.ctx.currentTime;
  AUD.wash.gain.setTargetAtTime(0.14*Math.exp(-z/18)*(0.6+0.4*Math.sin(2*Math.PI*t/S.T)),now,0.2);
  AUD.rumble.gain.setTargetAtTime((ventOn?0.2:0.05)+0.1*Math.min(1,z/1500),now,0.5);
  AUD.rlp.frequency.setTargetAtTime(240-140*Math.min(1,z/3000),now,0.5);
  if(encSW.on){AUD.clickT-=dt;if(AUD.clickT<=0){AUD.clickT=R(0.5,1.0);playClick(0.5*Math.exp(-encSW.pos.distanceTo(camera.position)/80));}}
}

