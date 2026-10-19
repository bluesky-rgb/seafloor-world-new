/* =========================================================
   Scene in words: a text description of where you are, the conditions, and which animals are in view,
   for screen-reader users and anyone who can't see the 3D view well. "文字描述" button in the console, or the G key.
   It reuses what the page already knows: the HUD readings, the site texts and isSeen() from the field guide.
   ========================================================= */
const guideEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const firstSentence=s=>{const m=String(s).match(/^.*?[。！？]|^.*?[.!?](?=\s|$)/);return(m?m[0]:s).trim();};
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
  h+=seen.length?'<ul>'+seen.map(c=>'<li><b>'+guideEsc(c[1])+'</b> <i lang="la">'+guideEsc(c[2])+'</i>'+(FACTS[c[0]]?$t('：')+guideEsc(firstSentence(FACTS[c[0]])):'')+'</li>').join('')+'</ul>'
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
