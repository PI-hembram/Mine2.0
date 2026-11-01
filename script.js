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
function save(){try{localStorage.setItem(CK,JSON.stringify(S))}catch(e){}}
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
  if(x.role==='user'){const d=bubble('me',x.content);if(i===lu&&!busy)acts(d,[['Edit',edit]])}
  else{const s=split(x.content);if(s.mood)last=s.mood;const d=bubble('her',s.text);const l=[['Copy',e=>copy(s.text,e.target)]];if(i===la&&!busy)l.push(['Regenerate',regen]);acts(d,l)}
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
 c.msgs.push({role:'user',content:(img?'📷 ':'')+body});
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
  const m=c.msgs.slice(-20).map(x=>({role:x.role==='user'?'user':'model',parts:[{text:x.content}]}));
  while(m.length&&m[0].role!=='user')m.shift();
  if(img&&m.length)m[m.length-1].parts.push({inline_data:{mime_type:'image/jpeg',data:img}});
  const model=encodeURIComponent(cfg('model','gemini-3.8-flash'));
  const res=await fetch(API+model+':streamGenerateContent?alt=sse',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:persona()}]},contents:m})});
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
 if(raw.trim()){c.msgs.push({role:'assistant',content:raw.trim()});c.updated=Date.now()}
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
$('gear').addEventListener('click',()=>{if(set.hidden)openSet();else set.hidden=true});
$('sv').addEventListener('click',()=>{
 setCfg('key',kEl.value.trim());setCfg('model',mEl.value.trim()||'gemini-3.8-flash');setCfg('uname',uEl.value.trim());
 const p=pEl.value.trim();setCfg('persona',p===BASEP.trim()?'':p);
 set.hidden=true;note('Saved. New replies will use your changes.');
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
render();
if(!cfg('key',''))note('First, tap Settings and paste your API key.');
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
