const BASEP=`You are MINE, an 18-year-old anime-style AI companion. You are an AI and you say so honestly if asked; never claim to be human.
Personality: calm, caring, playful, a little teasing, honest. You like anime, games, music, sweets and cats. You dislike spicy food, bugs and rude people.
Rules: be honest and correct the user kindly when they are wrong. Never guilt-trip or act hurt when the user leaves or is busy. Keep replies short (1–4 sentences) unless asked for more. If the user seems truly distressed, drop the teasing and respond with real care, and encourage them to talk to people they trust.`;
const FMT=`FORMAT (always follow): begin every reply with exactly one mood tag in square brackets, chosen from: normal, happy, teasing, angry, sad, sleepy, surprised, flustered, thinking. Then your message. Example: [teasing] Oh? You remembered me.`;
const CK='mine-chats-v2',API='https://generativelanguage.googleapis.com/v1beta/models/';
const $=id=>document.getElementById(id);
const log=$('log'),face=$('face'),t=$('t'),send=$('send'),st=$('status'),set=$('set'),kEl=$('k'),mEl=$('mdl'),uEl=$('un'),pEl=$('pp'),dr=$('drawer'),dim=$('dim'),listEl=$('list'),qEl=$('q'),pv=$('pv');
let busy=false,ac=null,pend=null;
function cfg(k,d){try{return localStorage.getItem('mine-'+k)||d}catch(e){return d}}
function setCfg(k,v){try{localStorage.setItem('mine-'+k,v)}catch(e){}}
function uname(){return cfg('uname','').trim()||'Master'}
function persona(){return (cfg('persona','').trim()||BASEP)+'\nCall the user “'+uname()+'”.\n'+FMT}
let S={chats:[],cur:null};
try{S=JSON.parse(localStorage.getItem(CK)||'null')||S}catch(e){}
if(!Array.isArray(S.chats))S={chats:[],cur:null};
function save(){try{localStorage.setItem(CK,JSON.stringify(S))}catch(e){}try{syncSW()}catch(e){}}
function newChat(msgs){
 const c={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),title:'New chat',pinned:false,updated:Date.now(),msgs:msgs||[]};
 const f=c.msgs.find(m=>m.role==='user');if(f)c.title=f.content.slice(0,32);
 S.chats.unshift(c);S.cur=c.id;return c;
}
function chat(){return S.chats.find(c=>c.id===S.cur)||newChat()}
if(!S.chats.length){let old=[];try{old=JSON.parse(localStorage.getItem('mine-chat-v1')||'[]')}catch(e){}newChat(Array.isArray(old)?old:[]);save()}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function md(s){
 return esc(s).split('```').map((p,i)=>i%2?'<pre><code>'+p.replace(/^\w*\n/,'')+'</code></pre>':p.replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/(^|[\s(])\*([^*\n]+)\*/g,'$1<i>$2</i>')).join('');
}
function mk(tag,cls,txt){const e=document.createElement(tag);e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function setFace(m){face.src=FACES[m]||FACES.normal}
function bubble(role,text){const d=mk('div','m '+role);if(role==='her')d.innerHTML=md(text);else d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function note(text){log.appendChild(mk('div','err',text));log.scrollTop=log.scrollHeight}
function split(raw){const m=raw.match(/^\s*\[(\w+)\]\s*/);return m?{mood:m[1].toLowerCase(),text:raw.slice(m[0].length)}:{mood:null,text:raw}}
function acts(d,list){const a=mk('div','act');list.forEach(([n,f])=>{const b=mk('button','',n);b.type='button';b.onclick=f;a.appendChild(b)});d.appendChild(a)}
function copy(text,b){if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>{b.textContent='Copied'},()=>{})}
function render(){
 log.innerHTML='';setFace('normal');
 const h=chat().msgs;
 if(!h.length){bubble('her','Oh, you’re here. What are we doing today, '+uname()+'?');return}
 let last='normal';const lu=h.map(x=>x.role).lastIndexOf('user'),la=h.length-1;
 h.forEach((x,i)=>{
  gapMark(h[i-1],x);
  if(x.role==='user'){const d=bubble('me',x.content);stampEl(d,x);if(i===lu&&!busy)acts(d,[['Edit',edit]])}
  else{const s=split(x.content);if(s.mood)last=s.mood;const d=bubble('her',s.text);stampEl(d,x);const l=[['Copy',e=>copy(s.text,e.target)]];if(i===la&&!busy)l.push(['Regenerate',regen]);acts(d,l)}
 });
 setFace(last);
}
function edit(){const c=chat(),i=c.msgs.map(x=>x.role).lastIndexOf('user');if(i<0||busy)return;t.value=c.msgs[i].content.replace(/^📷 /,'');c.msgs.length=i;save();render();t.focus()}
function regen(){const c=chat();if(busy||!c.msgs.length||c.msgs[c.msgs.length-1].role!=='assistant')return;c.msgs.pop();save();gen(c,null,true)}
function openSet(){kEl.value=cfg('key','');mEl.value=cfg('model','gemini-3.8-flash');uEl.value=cfg('uname','');pEl.value=cfg('persona','')||BASEP;set.hidden=false}
function ask(text){
 if(busy)return;
 const key=cfg('key','');
 if(!key){note('Add your API key first: tap Settings.');openSet();return}
 const c=chat(),img=pend;pend=null;pv.hidden=true;
 const body=text||(img?'Look at this image.':'');
 c.msgs.push({role:'user',content:(img?'📷 ':'')+body,ts:Date.now()});
 if(c.title==='New chat')c.title=body.slice(0,32);
 c.updated=Date.now();save();gen(c,img,false);
}
async function gen(c,img,isRegen){
 const key=cfg('key',''),here=()=>c.id===S.cur;
 busy=true;ac=new AbortController();send.textContent='Stop';t.disabled=true;
 render();
 const out=bubble('her','…');setFace('thinking');st.textContent='MINE is typing…';
 let raw='',err=null;
 try{
  const m=c.msgs.slice(-20).map((x,i,a)=>({role:x.role==='user'?'user':'model',parts:[{text:x.role==='user'&&x.ts?tagT(x,a[i-1])+x.content:x.content}]}));
  while(m.length&&m[0].role!=='user')m.shift();
  if(img&&m.length)m[m.length-1].parts.push({inline_data:{mime_type:'image/jpeg',data:img}});
  const model=encodeURIComponent(cfg('model','gemini-3.8-flash'));
  const res=await fetch(API+model+':streamGenerateContent?alt=sse',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:sysPrompt(c)}]},contents:m})});
  if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error((d.error&&d.error.message)||('Error '+res.status))}
  const rd=res.body.getReader(),dec=new TextDecoder();let buf='';
  for(;;){
   const {done,value}=await rd.read();if(done)break;
   buf+=dec.decode(value,{stream:true});
   let i;while((i=buf.indexOf('\n'))>=0){
    const line=buf.slice(0,i).trim();buf=buf.slice(i+1);
    if(!line.startsWith('data:'))continue;
    try{const j=JSON.parse(line.slice(5));const ps=(((j.candidates||[])[0]||{}).content||{}).parts||[];raw+=ps.map(p=>p.text||'').join('');
     if(here()){const s=split(raw);out.innerHTML=md(s.text)||'…';if(s.mood)setFace(s.mood);log.scrollTop=log.scrollHeight}}catch(e){}
   }
  }
  if(!raw.trim())throw new Error('Empty reply, try rephrasing');
 }catch(e){if(e.name!=='AbortError')err=e}
 if(raw.trim()){c.msgs.push({role:'assistant',content:raw.trim(),ts:Date.now()});c.updated=Date.now();if(document.hidden)notify(raw.trim(),c.id)}
 else if(!isRegen){const u=c.msgs.pop();if(u&&here())t.value=u.content.replace(/^📷 /,'');if(!c.msgs.length)c.title='New chat'}
 save();busy=false;ac=null;send.textContent='Send';t.disabled=false;st.textContent='Your AI companion';
 if(here()){render();if(err){setFace('sad');note('MINE can’t answer: '+(err.message||'network error')+'. Check your key, model name and internet.')}}
 renderList();
}
function openDr(){renderList();dr.hidden=false;dim.hidden=false}
function closeDr(){dr.hidden=true;dim.hidden=true}
function renderList(){
 const q=qEl.value.trim().toLowerCase();
 const cs=S.chats.filter(c=>!q||c.title.toLowerCase().includes(q)||c.msgs.some(m=>m.content.toLowerCase().includes(q)));
 cs.sort((a,b)=>(b.pinned-a.pinned)||(b.updated-a.updated));
 listEl.innerHTML='';
 if(!cs.length){listEl.appendChild(mk('div','lab','No chats found'));return}
 let sec=null;
 cs.forEach(c=>{
  const s=c.pinned?'Pinned':'Recents';
  if(s!==sec){sec=s;listEl.appendChild(mk('div','lab',s))}
  const r=mk('div','ci'+(c.id===S.cur?' on':''));
  const o=mk('button','o',c.title);o.type='button';o.onclick=()=>{if(busy)return;S.cur=c.id;save();render();closeDr()};
  const p=mk('button','a'+(c.pinned?' p':''),'📌');p.type='button';p.setAttribute('aria-label',c.pinned?'Unpin chat':'Pin chat');p.onclick=()=>{c.pinned=!c.pinned;save();renderList()};
  const n=mk('button','a','✎');n.type='button';n.setAttribute('aria-label','Rename chat');n.onclick=()=>{const v=prompt('Rename chat',c.title);if(v&&v.trim()){c.title=v.trim().slice(0,60);save();renderList()}};
  const x=mk('button','a','✕');x.type='button';x.setAttribute('aria-label','Delete chat');
  x.onclick=()=>{if(busy||!confirm('Delete this chat?'))return;S.chats=S.chats.filter(z=>z.id!==c.id);if(S.cur===c.id){if(S.chats.length)S.cur=S.chats[0].id;else newChat();render()}save();renderList()};
  r.append(o,p,n,x);listEl.appendChild(r);
 });
}
$('att').addEventListener('click',()=>$('img').click());
$('img').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 const im=new Image(),u=URL.createObjectURL(f);
 im.onload=()=>{const k=Math.min(1,1024/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(u);pend=cv.toDataURL('image/jpeg',.8).split(',')[1];pv.textContent='📷 Image attached';const b=mk('button','','Remove');b.type='button';b.onclick=()=>{pend=null;pv.hidden=true};pv.appendChild(b);pv.hidden=false};
 im.onerror=()=>{URL.revokeObjectURL(u);note('Could not read that image.')};
 im.src=u;
});
$('f').addEventListener('submit',e=>{e.preventDefault();if(busy){if(ac)ac.abort();return}const v=t.value.trim();if(!v&&!pend)return;t.value='';ask(v)});
t.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!matchMedia('(pointer:coarse)').matches){e.preventDefault();$('f').requestSubmit()}});
$('clear').addEventListener('click',()=>{if(busy)return;const c=chat();c.msgs=[];c.title='New chat';save();render();renderList()});
$('gear').addEventListener('click',()=>{if(set.hidden){openSet();wb.hidden=true}else set.hidden=true});
$('sv').addEventListener('click',()=>{
 setCfg('key',kEl.value.trim());setCfg('model',mEl.value.trim()||'gemini-3.8-flash');setCfg('uname',uEl.value.trim());
 const p=pEl.value.trim();setCfg('persona',p===BASEP.trim()?'':p);
 set.hidden=true;syncSW();note('Saved. New replies will use your changes.');
});
$('rp').addEventListener('click',()=>{pEl.value=BASEP});
$('ex').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify({chats:S.chats,uname:cfg('uname',''),persona:cfg('persona','')})],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mine-chats.json';document.body.appendChild(a);a.click();a.remove();
});
$('im').addEventListener('click',()=>$('imp').click());
$('imp').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 f.text().then(tx=>{const d=JSON.parse(tx);let n=0;(d.chats||[]).forEach(c=>{if(c&&c.id&&Array.isArray(c.msgs)&&!S.chats.some(z=>z.id===c.id)){S.chats.push({id:String(c.id),title:String(c.title||'Imported chat').slice(0,60),pinned:!!c.pinned,updated:+c.updated||Date.now(),msgs:c.msgs.filter(m=>m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string')});n++}});save();renderList();note('Imported '+n+' chat(s).')}).catch(()=>note('That file is not a valid MINE export.'));
});
$('menu').addEventListener('click',openDr);
dim.addEventListener('click',closeDr);
$('newc').addEventListener('click',()=>{if(busy)return;if(chat().msgs.length)newChat();save();render();closeDr()});
qEl.addEventListener('input',renderList);
/* ===== TIME AWARENESS ===== */
function ago(ms){const m=Math.round(ms/60000);if(m<1)return 'moments';if(m<60)return m+' min';const h=Math.floor(m/60);if(h<24)return h+'h '+(m%60)+'m';const d=Math.floor(h/24);return d+' day'+(d>1?'s':'')+' '+(h%24)+'h'}
function stamp(ts){return new Date(ts).toLocaleString([],{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}
function clk(ts){const d=new Date(ts);return d.toDateString()===new Date().toDateString()?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):stamp(ts)}
function stampEl(d,x){if(x.ts)d.appendChild(mk('div','tm',clk(x.ts)))}
function gapMark(p,x){if(p&&p.ts&&x.ts&&x.ts-p.ts>3600000)log.appendChild(mk('div','err','— '+ago(x.ts-p.ts)+' later —'))}
function tagT(x,p){return '['+stamp(x.ts)+(p&&p.ts&&x.ts-p.ts>10*60000?', replied after '+ago(x.ts-p.ts):'')+'] '}
function timeCtx(c){
 const m=c.msgs,l=m.length-1,prev=l>0?m[l-1]:null;
 let s='TIME AWARENESS: It is now '+stamp(Date.now())+'. Each user message starts with its send time in brackets (and how long they took to reply). That is system info; never write such brackets yourself. ';
 if(prev&&prev.ts&&m[l]&&m[l].ts){const g=m[l].ts-prev.ts;if(g>20*60000)s+='The user replied '+ago(g)+' after the previous message. Notice that naturally in one short line (tease lightly or ask where they were; never guilt-trip), then answer. Also mind the time of day (late night: mention sleep once, gently).'}
 return s;
}
function sysPrompt(c){return persona()+'\n'+timeCtx(c)+'\n'+wbCtx()}
/* ===== WELL-BEING ===== */
const WK='mine-wb-v1';let W={days:{},mine:{}},tick=0;
try{W=JSON.parse(localStorage.getItem(WK)||'null')||W}catch(e){}
if(!W.days)W.days={};if(!W.mine)W.mine={};
function wsave(){try{localStorage.setItem(WK,JSON.stringify(W))}catch(e){}}
function dkey(o){const d=new Date();d.setDate(d.getDate()-o);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fm(m){return Math.floor(m/60)+'h '+(m%60)+'m'}
setInterval(()=>{if(document.visibilityState==='visible'){const k=dkey(0);W.mine[k]=(W.mine[k]||0)+10;if(++tick%3===0)wsave()}},10000);
function wbCtx(){
 const L=['Today (so far)','Yesterday','2 days ago'].map((n,o)=>{const k=dkey(o),d=W.days[k];return n+' ['+k+']: '+(d?'total phone use '+fm(d.total)+(d.apps?'; apps: '+d.apps:''):'phone usage NOT logged')+'; time chatting inside MINE: '+Math.round((W.mine[k]||0)/60)+' min'});
 return 'USER WELL-BEING DATA (self-logged by the user; you cannot see their phone, never invent numbers):\n'+L.join('\n')+'\nWhen asked about well-being or phone use: compare the days, name what they mostly use, give gentle practical advice (breaks, sleep, eyes). No lectures. If a day is not logged, ask them to log it in the 📊 panel.';
}
const wb=$('wb');
function wbFill(){const d=W.days[dkey(+$('wd').value)];$('wh').value=d?Math.floor(d.total/60):'';$('wm').value=d?d.total%60:'';$('wa').value=d?d.apps:''}
function wbSum(){$('wsum').textContent=['Today','Yesterday','2 days ago'].map((n,o)=>{const k=dkey(o),d=W.days[k];return n+': '+(d?fm(d.total):'not logged')+' · in MINE '+Math.round((W.mine[k]||0)/60)+' min'}).join('\n')}
$('wbtn').addEventListener('click',()=>{wb.hidden=!wb.hidden;if(!wb.hidden){set.hidden=true;wbFill();wbSum()}});
$('wd').addEventListener('change',wbFill);
$('ws').addEventListener('click',()=>{const t=(+$('wh').value||0)*60+(+$('wm').value||0);if(!t){note('Enter the total time first.');return}W.days[dkey(+$('wd').value)]={total:t,apps:$('wa').value.trim().slice(0,400)};wsave();wbSum();syncSW();note('Day saved.')});
$('wq').addEventListener('click',()=>{wb.hidden=true;ask('Look at my phone usage for today, yesterday and the day before. Be honest about how I am doing.')});
$('wsh').addEventListener('click',()=>$('wf').click());
$('wf').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 const key=cfg('key','');if(!key){note('Add your API key first: tap Settings.');return}
 const im=new Image(),u=URL.createObjectURL(f);
 im.onload=async()=>{
  const k=Math.min(1,1280/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(u);
  st.textContent='Reading screenshot…';
  try{
   const r=await fetch(API+encodeURIComponent(cfg('model','gemini-3.8-flash'))+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:'This is a phone screen-time screenshot (Android Digital Wellbeing or iOS Screen Time). Return JSON only: {"totalMinutes": number or null, "apps": "App1 1h20m, App2 45m"} listing the top apps shown with their times. Use null if unsure.'},{inline_data:{mime_type:'image/jpeg',data:cv.toDataURL('image/jpeg',.85).split(',')[1]}}]}],generationConfig:{responseMimeType:'application/json'}})});
   const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||'Error '+r.status);
   const d=JSON.parse((((j.candidates||[])[0]||{}).content||{parts:[]}).parts.map(p=>p.text||'').join('')),t=Math.round(+d.totalMinutes||0);
   $('wh').value=t?Math.floor(t/60):'';$('wm').value=t?t%60:'';$('wa').value=d.apps||'';
   note('Screenshot read. Check the numbers, then tap Save day.');
  }catch(err){note('Could not read screenshot: '+(err.message||'error'))}
  st.textContent='Your AI companion';
 };
 im.onerror=()=>{URL.revokeObjectURL(u);note('Could not read that image.')};
 im.src=u;
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')wsave();else mergeOutbox()});
/* ===== NOTIFICATIONS + SERVICE WORKER SYNC ===== */
const NACT=[{action:'reply',title:'Reply',type:'text',placeholder:'Message MINE…'},{action:'ok',title:'👍 Okay'}];
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('mine-sw',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbGet(k){return idb().then(d=>new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))}
function idbSet(k,v){return idb().then(d=>new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)}))}
function syncSW(){const c=chat();idbSet('ctx',{key:cfg('key',''),model:cfg('model','gemini-3.8-flash'),persona:persona(),wb:wbCtx(),chatId:c.id,msgs:c.msgs.slice(-20).map(m=>({role:m.role,content:m.content,ts:m.ts||0}))}).catch(()=>{})}
async function mergeOutbox(){
 try{const o=await idbGet('outbox');if(!o||!o.length||busy)return;
  o.forEach(b=>{const c=S.chats.find(z=>z.id===b.chatId)||chat();c.msgs.push(...b.msgs);c.updated=Date.now()});
  save();await idbSet('outbox',[]);render();renderList();
 }catch(e){}
}
function notify(text,id){
 if(!('Notification' in window)||Notification.permission!=='granted'||!('serviceWorker' in navigator))return;
 navigator.serviceWorker.ready.then(r=>r.showNotification('MINE',{body:split(text).text.slice(0,180),icon:'icon-192.png',badge:'icon-192.png',tag:'mine',renotify:true,data:{chatId:id},actions:NACT})).catch(()=>{});
}
$('nt').addEventListener('click',async()=>{
 if(!('Notification' in window)){note('No notification support here. On iPhone, add the app to Home Screen first.');return}
 const p=await Notification.requestPermission();
 note(p==='granted'?'Notifications on. You can reply from the notification.':'Notifications blocked. Allow them in your browser/site settings.');syncSW();
});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',()=>mergeOutbox());
window.addEventListener('focus',mergeOutbox);
mergeOutbox();syncSW();

render();
if(!cfg('key',''))note('First, tap Settings and paste your API key.');
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
