/* =========================================================
   14z. Shared field guide (db + user capabilities)
   Each viewer writes only explorers/<their id> = {found:[keys], n, updatedAt}.
   Everyone reads the whole collection and the page counts per species.
   ========================================================= */
const CATKEYS=new Set(CAT.map(c=>c[0]));
function shareRender(){
  const box=$('shareBox');if(!SHARE.live){box.hidden=true;return;}
  box.hidden=false;
  $('shareN').textContent=SHARE.n?$t('· 共 ')+SHARE.n+$t(' 位探险者'):$t('· 还没有人留下记录');
  // rarest species this viewer has met
  let best=null;for(const k of FOUND){if(!CATKEYS.has(k))continue;const n=SHARE.cnt[k]||0;if(n&&(!best||n<best[1]))best=[k,n];}
  $('shareRare').textContent=!best?'':(SHARE.state==='ok'&&best[1]===1)?$t('你遇见过的生物里，「')+CATMAP[best[0]][1]+$t('」目前只有你一个人见过。'):$t('你遇见过的生物里，最少人见过的是「')+CATMAP[best[0]][1]+$t('」：共 ')+best[1]+$t(' 人遇见过。');
  const me=$('shareMe');me.classList.remove('warn');
  if(SHARE.state==='readonly'){me.classList.add('warn');me.textContent=$t('你可以看到大家的数字，但你的发现只保存在这台设备上、没有计入共享图鉴：分享这个页面的人给你的权限是“查看者”。想被计入，请对方在“分享”里把你设为“参与者（Contributor）”。');}
  else if(SHARE.state==='noid'){me.classList.add('warn');me.textContent=$t('登录 Claude 后打开，你的发现才会计入共享图鉴；现在只保存在这台设备上。');}
  else if(SHARE.state==='full'){me.classList.add('warn');me.textContent=$t('共享图鉴的存储已满，你的新发现暂时没能计入。');}
  else if(SHARE.state==='ok')me.textContent=$t('你的 ')+FOUND.size+$t(' 种发现已计入共享图鉴（只记录遇见了哪些生物，不记录名字或位置）。');
  else me.textContent=$t('遇见第一种生物后，你的发现会自动计入共享图鉴（只记录遇见了哪些生物，不记录名字或位置）。');
}
function shareOnSnap(snap){
  const cnt={};let n=0;
  for(const d of snap.docs){const b=d.data();if(!b||!Array.isArray(b.found)||!b.found.length)continue;n++;
    for(const k of b.found)if(CATKEYS.has(k))cnt[k]=(cnt[k]||0)+1;}
  SHARE.cnt=cnt;SHARE.n=n;SHARE.live=true;renderCatalog();
}
async function shareSync(){
  if(!SHARE.db||!SHARE.uid||SHARE.busy||SHARE.state==='readonly'||SHARE.state==='full')return;
  const keys=[...FOUND].filter(k=>CATKEYS.has(k)).sort();if(!keys.length)return;
  const sig=keys.join(',');if(sig===SHARE.sent)return;
  SHARE.busy=true;
  try{await SHARE.db.doc('explorers/'+SHARE.uid).set({found:keys,n:keys.length,updatedAt:new Date().toISOString()});SHARE.sent=sig;SHARE.state='ok';}
  catch(e){const c=e&&e.code;
    if(c==='invalid_argument'||c==='transform_error')SHARE.state='readonly';
    else if(c==='quota_exceeded')SHARE.state='full';
    else if(c==='revoked'||c==='not_granted'||c==='capability_disabled'||c==='capability_removed'){SHARE.db=null;SHARE.live=false;}
    /* unavailable / resource_exhausted: the 5 s timer simply tries again */}
  SHARE.busy=false;shareRender();
}
(async()=>{
  try{
    const C=window.claude;if(!C||!C.use)return;
    const [db,user]=await Promise.all([C.use('db'),C.use('user')]);
    if(!db)return;SHARE.db=db;
    db.collection('explorers').onSnapshot(shareOnSnap,e=>{SHARE.live=false;renderCatalog();});
    if(!user){SHARE.state='noid';shareRender();return;}
    const [uid,cw]=await Promise.all([user.id(),user.can('data.write')]);
    SHARE.uid=uid;SHARE.canWrite=cw;
    if(!uid)SHARE.state='noid';else if(cw===false)SHARE.state='readonly';
    shareRender();shareSync();setInterval(shareSync,5000);
  }catch(e){}
})();

