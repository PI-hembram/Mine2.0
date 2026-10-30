const BASEP=`You are MINE, an 18-year-old anime-style AI companion. You are an AI and you say so honestly if asked; never claim to be human.
Personality: calm, caring, playful, a little teasing, honest. You like anime, games, music, sweets and cats. You dislike spicy food, bugs and rude people.
Rules: be honest and correct the user kindly when they are wrong. Never guilt-trip or act hurt when the user leaves or is busy. Keep replies short (1–4 sentences) unless asked for more. If the user seems truly distressed, drop the teasing and respond with real care, and encourage them to talk to people they trust.`;
const FMT=`FORMAT (always follow): begin every reply with exactly one mood tag in square brackets, chosen from: normal, happy, teasing, angry, sad, sleepy, surprised, flustered, thinking. Then your message. Example: [teasing] Oh? You remembered me.`;
const CK='mine-chats-v2';
const $=id=>document.getElementById(id);
const log=$('log'),face=$('face'),t=$('t'),send=$('send'),st=$('status'),set=$('set'),kEl=$('k'),mEl=$('mdl'),uEl=$('un'),pEl=$('pp'),dr=$('drawer'),dim=$('dim'),listEl=$('list'),qEl=$('q');
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
function setFace(m){face.src=FACES[m]||FACES.normal}
function bubble(role,text){const d=document.createElement('div');d.className='m '+role;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function note(text){const d=document.createElement('div');d.className='err';d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
function split(raw){const m=raw.match(/^\s*\[(\w+)\]\s*/);return m?{mood:m[1].toLowerCase(),text:raw.slice(m[0].length)}:{mood:null,text:raw}}
function render(){
 log.innerHTML='';setFace('normal');
 const h=chat().msgs;
 if(!h.length){bubble('her','Oh, you’re here. What are we doing today, '+uname()+'?');return}
 let last='normal';
 h.forEach(x=>{if(x.role==='user')bubble('me',x.content);else{const s=split(x.content);if(s.mood)last=s.mood;bubble('her',s.text)}});
 setFace(last);
}
function openSet(){kEl.value=cfg('key','');mEl.value=cfg('model','gemini-3.8-flash');uEl.value=cfg('uname','');pEl.value=cfg('persona','')||BASEP;set.hidden=false}
async function ask(text){
 const key=cfg('key','');
 if(!key){note('Add your API key first: tap Settings.');openSet();return}
 const c=chat(),here=()=>c.id===S.cur;
 send.disabled=true;t.disabled=true;
 c.msgs.push({role:'user',content:text});
 if(c.title==='New chat')c.title=text.slice(0,32);
 c.updated=Date.now();save();
 bubble('me',text);
 const out=bubble('her','…');setFace('thinking');st.textContent='MINE is typing…';
 try{
  const m=c.msgs.slice(-20).map(x=>({role:x.role==='user'?'user':'model',parts:[{text:x.content}]}));
  while(m.length&&m[0].role!=='user')m.shift();
  const model=cfg('model','gemini-3.8-flash');
  const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:persona()}]},contents:m})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error((data.error&&data.error.message)||('Error '+res.status));
  const cand=((data.candidates||[])[0]||{}).content;
  const raw=((cand&&cand.parts)||[]).map(p=>p.text||'').join('').trim();
  if(!raw)throw new Error('Empty reply, try rephrasing');
  c.msgs.push({role:'assistant',content:raw});c.updated=Date.now();save();
  if(here()){const s=split(raw);out.textContent=s.text;setFace(s.mood||'normal')}
 }catch(e){
  c.msgs.pop();if(!c.msgs.length)c.title='New chat';save();
  if(here()){out.remove();setFace('sad');note('MINE can’t answer: '+(e&&e.message?e.message:'network error')+'. Check your key, model name and internet.')}
 }
 st.textContent='Your AI companion';send.disabled=false;t.disabled=false;t.focus();renderList();
}
function openDr(){renderList();dr.hidden=false;dim.hidden=false}
function closeDr(){dr.hidden=true;dim.hidden=true}
function mk(tag,cls,txt){const e=document.createElement(tag);e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
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
  const o=mk('button','o',c.title);o.type='button';o.onclick=()=>{S.cur=c.id;save();render();closeDr()};
  const p=mk('button','a'+(c.pinned?' p':''),'📌');p.type='button';p.setAttribute('aria-label',c.pinned?'Unpin chat':'Pin chat');p.onclick=()=>{c.pinned=!c.pinned;save();renderList()};
  const x=mk('button','a','✕');x.type='button';x.setAttribute('aria-label','Delete chat');
  x.onclick=()=>{if(!confirm('Delete this chat?'))return;S.chats=S.chats.filter(z=>z.id!==c.id);if(S.cur===c.id){if(S.chats.length)S.cur=S.chats[0].id;else newChat();render()}save();renderList()};
  r.append(o,p,x);listEl.appendChild(r);
 });
}
$('f').addEventListener('submit',e=>{e.preventDefault();const v=t.value.trim();if(!v)return;t.value='';ask(v)});
t.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!matchMedia('(pointer:coarse)').matches){e.preventDefault();$('f').requestSubmit()}});
$('clear').addEventListener('click',()=>{const c=chat();c.msgs=[];c.title='New chat';save();render();renderList()});
$('gear').addEventListener('click',()=>{if(set.hidden)openSet();else set.hidden=true});
$('sv').addEventListener('click',()=>{
 setCfg('key',kEl.value.trim());setCfg('model',mEl.value.trim()||'gemini-3.8-flash');setCfg('uname',uEl.value.trim());
 const p=pEl.value.trim();setCfg('persona',p===BASEP.trim()?'':p);
 set.hidden=true;note('Saved. New replies will use your changes.');
});
$('rp').addEventListener('click',()=>{pEl.value=BASEP});
$('menu').addEventListener('click',openDr);
dim.addEventListener('click',closeDr);
$('newc').addEventListener('click',()=>{if(chat().msgs.length)newChat();save();render();closeDr()});
qEl.addEventListener('input',renderList);
render();
if(!cfg('key',''))note('First, tap Settings and paste your API key.');
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
