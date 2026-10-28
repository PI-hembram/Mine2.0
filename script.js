const PERSONA=`You are MINE, an 18-year-old anime-style AI companion. You are an AI and you say so honestly if asked; never claim to be human.
Personality: calm, caring, playful, a little teasing, honest. You like anime, games, music, sweets and cats. You dislike spicy food, bugs and rude people. You call the user “Master”, as your character sheet says, in a warm, light way.
Rules: be honest and correct the user kindly when they are wrong. Never guilt-trip or act hurt when the user leaves or is busy. Keep replies short (1–4 sentences) unless asked for more. If the user seems truly distressed, drop the teasing and respond with real care, and encourage them to talk to people they trust.
FORMAT: begin every reply with exactly one mood tag in square brackets, chosen from: normal, happy, teasing, angry, sad, sleepy, surprised, flustered, thinking. Then your message. Example: [teasing] Oh? You remembered me, Master.`;
const KEY='mine-chat-v1';
const log=document.getElementById('log'),face=document.getElementById('face'),t=document.getElementById('t'),send=document.getElementById('send'),st=document.getElementById('status');
let hist=[];
try{hist=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){hist=[]}
function setFace(m){face.src=FACES[m]||FACES.normal}
function bubble(role,text){const d=document.createElement('div');d.className='m '+role;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function note(text){const d=document.createElement('div');d.className='err';d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
function split(raw){const m=raw.match(/^\s*\[(\w+)\]\s*/);return m?{mood:m[1].toLowerCase(),text:raw.slice(m[0].length)}:{mood:null,text:raw}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(hist.slice(-40)))}catch(e){}}
function render(){
 log.innerHTML='';setFace('normal');
 if(!hist.length){bubble('her','Oh, you’re here. What are we doing today, Master?');return}
 let last='normal';
 hist.forEach(h=>{if(h.role==='user')bubble('me',h.content);else{const s=split(h.content);if(s.mood)last=s.mood;bubble('her',s.text)}});
 setFace(last);
}
function cfg(k,d){try{return localStorage.getItem('mine-'+k)||d}catch(e){return d}}
function setCfg(k,v){try{localStorage.setItem('mine-'+k,v)}catch(e){}}
const set=document.getElementById('set'),kEl=document.getElementById('k'),mEl=document.getElementById('mdl');
function openSet(){kEl.value=cfg('key','');mEl.value=cfg('model','gemini-3.8-flash');set.hidden=false}
async function ask(text){
 const key=cfg('key','');
 if(!key){note('Add your API key first: tap Settings.');openSet();return}
 send.disabled=true;t.disabled=true;
 hist.push({role:'user',content:text});bubble('me',text);
 const out=bubble('her','…');setFace('thinking');st.textContent='MINE is typing…';
 try{
  const m=hist.slice(-20).map(x=>({role:x.role==='user'?'user':'model',parts:[{text:x.content}]}));
  while(m.length&&m[0].role!=='user')m.shift();
  const model=cfg('model','gemini-3.8-flash');
  const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:PERSONA}]},contents:m})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error((data.error&&data.error.message)||('Error '+res.status));
  const parts=((data.candidates||[])[0]||{}).content;
  const raw=((parts&&parts.parts)||[]).map(p=>p.text||'').join('').trim();
  if(!raw)throw new Error('Empty reply, try rephrasing');
  const s=split(raw);out.textContent=s.text;setFace(s.mood||'normal');
  hist.push({role:'assistant',content:raw});save();
 }catch(e){
  hist.pop();out.remove();setFace('sad');
  note('MINE can’t answer: '+(e&&e.message?e.message:'network error')+'. Check your key, model name and internet.');
 }
 st.textContent='Your AI companion';send.disabled=false;t.disabled=false;t.focus();
}
document.getElementById('f').addEventListener('submit',e=>{e.preventDefault();const v=t.value.trim();if(!v)return;t.value='';ask(v)});
t.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!matchMedia('(pointer:coarse)').matches){e.preventDefault();document.getElementById('f').requestSubmit()}});
document.getElementById('clear').addEventListener('click',()=>{hist=[];save();render()});
document.getElementById('gear').addEventListener('click',()=>{if(set.hidden)openSet();else set.hidden=true});
document.getElementById('sv').addEventListener('click',()=>{setCfg('key',kEl.value.trim());setCfg('model',mEl.value.trim()||'gemini-3.8-flash');set.hidden=true;note('Saved.')});
render();
if(!cfg('key',''))note('First, tap Settings and paste your API key.');

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
