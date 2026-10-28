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
async function ask(text){
 send.disabled=true;t.disabled=true;
 hist.push({role:'user',content:text});bubble('me',text);
 const out=bubble('her','…');setFace('thinking');st.textContent='MINE is typing…';
 try{
  const sample=await claude.use('sample');
  if(!sample)throw {code:'unavailable'};
  const msgs=hist.slice(-20).map(h=>({role:h.role,content:h.content}));
  msgs[0]={role:'user',content:PERSONA+'\n\nConversation starts now. The user says: '+msgs[0].content};
  const r=await sample(msgs,{cache:false,onText:({text})=>{const s=split(text);out.textContent=s.text||'…';if(s.mood)setFace(s.mood);log.scrollTop=log.scrollHeight}});
  const s=split(r.text);out.textContent=s.text;setFace(s.mood||'normal');
  hist.push({role:'assistant',content:r.text});save();
 }catch(e){
  hist.pop();out.remove();setFace('sad');
  note(e&&e.code==='not_granted'?'Permission was declined. Reload the page and allow it to talk to MINE.':e&&e.code==='rate_limited'?'Too many messages too fast. Wait a moment, then try again.':'MINE can’t answer right now. Check your connection and try again.');
 }
 st.textContent='Your AI companion';send.disabled=false;t.disabled=false;t.focus();
}
document.getElementById('f').addEventListener('submit',e=>{e.preventDefault();const v=t.value.trim();if(!v)return;t.value='';ask(v)});
t.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!matchMedia('(pointer:coarse)').matches){e.preventDefault();document.getElementById('f').requestSubmit()}});
document.getElementById('clear').addEventListener('click',()=>{hist=[];save();render()});
render();
  
