/* =========================================================
   0b. Language (00-i18n.js, after 00-bootstrap). Chinese is the source text; English comes from i18n/en.js (window.SEAFLOOR_EN, generated from
   i18n/en.json: Chinese text → English). Choice order: ?lang=en|zh, saved preference, browser language.
   $t('中文') returns the English text in English mode (or the Chinese if a string has no translation yet).
   Static page text is translated once here, by walking the text nodes; switching language reloads the page.
   ========================================================= */
const LANG=window.SEAFLOOR_LANG||(()=>{let l=null;try{const q=new URLSearchParams(location.search).get('lang');l=q?(q==='en'?'en':'zh'):localStorage.getItem('seafloor-lang');}catch(e){}
  if(l!=='en'&&l!=='zh')l=/^zh/i.test(navigator.language||'zh')?'zh':'en';return l;})();
const EN=window.SEAFLOOR_EN||{};
const i18nKey=s=>s.replace(/\s+/g,' ').trim();
const $t=s=>{if(LANG!=='en')return s;const v=EN[s];return v!=null?v:(EN[i18nKey(s)]!=null?EN[i18nKey(s)]:s);};
function setLang(l){try{localStorage.setItem('seafloor-lang',l);}catch(e){}const u=new URL(location.href);u.searchParams.delete('lang');location.replace(u.toString());}
if(LANG==='en'){
  document.documentElement.lang='en';
  const tr=s=>{const k=i18nKey(s);if(!/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\u201c\u201d]/.test(k))return s;const v=EN[k];if(v==null)return s;const m=s.match(/^(\s*)[\s\S]*?(\s*)$/);return m[1]+v+m[2];};
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentNode&&n.parentNode.closest('#logDet .log,script,style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  /* Chinese needs no spaces around inline elements (<b>, <a>, <code>…); English does */
  nodes.forEach(n=>{const o=n.nodeValue,v=tr(o);if(v===o)return;let r=v;const pv=n.previousSibling,nx=n.nextSibling;
    if(nx&&nx.nodeType===1&&!/^(SUB|SUP)$/.test(nx.nodeName)&&/[A-Za-z0-9,;)’”]$/.test(r))r+=' ';
    if(pv&&pv.nodeType===1&&!/^(SUB|SUP)$/.test(pv.nodeName)&&/^[A-Za-z0-9(“‘]/.test(r))r=' '+r;n.nodeValue=r;});
  document.querySelectorAll('[title],[placeholder],[aria-label],[alt]').forEach(e=>['title','placeholder','aria-label','alt'].forEach(a=>{if(e.hasAttribute(a))e.setAttribute(a,tr(e.getAttribute(a)));}));
  document.title=tr(document.title);
}
/* language switch buttons: the label names the other language, in that language */
for(const id of['langBtn','welLang']){const b=$(id);if(!b)continue;b.textContent=LANG==='en'?'中文':'English';b.lang=LANG==='en'?'zh-CN':'en';b.addEventListener('click',()=>setLang(LANG==='en'?'zh':'en'));}
