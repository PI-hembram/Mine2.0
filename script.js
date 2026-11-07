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
 if(raw.trim()){c.msgs.push({role:'assistant',content:raw.trim(),ts:Date.now()});c.updated=Date.now();if(document.hidden)notify(raw.trim(),c.id);learn(c)}
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
$('gear').addEventListener('click',()=>{if(set.hidden){openSet();wb.hidden=true;$('mp').hidden=true}else set.hidden=true});
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
/* ===== GEMINI JSON HELPER ===== */
async function gj(parts){
 const r=await fetch(API+encodeURIComponent(cfg('model','gemini-3.8-flash'))+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':cfg('key','')},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json'}})});
 const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||'Error '+r.status);
 return JSON.parse((((j.candidates||[])[0]||{}).content||{parts:[]}).parts.map(p=>p.text||'').join(''));
}
/* ===== MEMORY ===== */
const MK='mine-mem-v1';let MEM=[];
try{MEM=JSON.parse(localStorage.getItem(MK)||'[]')}catch(e){}if(!Array.isArray(MEM))MEM=[];
function msave(){try{localStorage.setItem(MK,JSON.stringify(MEM))}catch(e){}syncSW()}
function memCtx(){return MEM.length?'THINGS YOU REMEMBER ABOUT THE USER (use naturally when relevant; never list them unprompted):\n'+MEM.slice(-40).map(m=>'- '+m.text).join('\n'):''}
function memAdd(f){f=String(f).trim().slice(0,140);if(f&&!MEM.some(m=>m.text.toLowerCase()===f.toLowerCase()))MEM.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),text:f,ts:Date.now()});MEM=MEM.slice(-80)}
function memRender(){
 const l=$('ml');l.innerHTML='';
 if(!MEM.length){l.appendChild(mk('div','lab','Nothing remembered yet.'));return}
 MEM.slice().reverse().forEach(m=>{const r=mk('div','mi');r.appendChild(mk('span','',m.text));const x=mk('button','a','✕');x.type='button';x.onclick=()=>{MEM=MEM.filter(z=>z.id!==m.id);msave();memRender()};r.appendChild(x);l.appendChild(r)});
}
async function learn(c){
 try{
  const us=c.msgs.filter(m=>m.role==='user'),last=us[us.length-1];
  if(!cfg('key','')||!last||!(us.length%5===0||/remember|yaad rakh/i.test(last.content)))return;
  const tx=c.msgs.slice(-10).map(m=>(m.role==='user'?'User: ':'MINE: ')+m.content.replace(/^\s*\[\w+\]\s*/,'')).join('\n');
  const d=await gj([{text:'Extract NEW lasting facts about the USER worth remembering long-term (their details, exams, goals, likes, dislikes, habits, important events). Skip small talk and anything temporary or already known.\nAlready known:\n'+(MEM.map(m=>'- '+m.text).join('\n')||'(none)')+'\n\nConversation:\n'+tx+'\n\nReturn JSON only: {"add":["short fact"]} with at most 3 items, or an empty array.'}]);
  (d.add||[]).slice(0,3).forEach(memAdd);msave();
 }catch(e){}
}
$('mbtn').addEventListener('click',()=>{const p=$('mp');p.hidden=!p.hidden;if(!p.hidden){$('wb').hidden=true;set.hidden=true;memRender()}});
$('madd').addEventListener('click',()=>{const v=$('mt').value;if(!v.trim())return;memAdd(v);$('mt').value='';msave();memRender()});
$('mclr').addEventListener('click',()=>{if(MEM.length&&confirm('Make MINE forget everything?')){MEM=[];msave();memRender()}});
/* ===== STUDY MODE ===== */
const SK='mine-study-v1';let SD={sub:{},hist:[],wrong:[],seen:{}},QZ=null;
try{SD=Object.assign(SD,JSON.parse(localStorage.getItem(SK)||'{}'))}catch(e){}
function ssave(){try{localStorage.setItem(SK,JSON.stringify(SD))}catch(e){}syncSW()}
const SA=['Mathematics','Science','History','Geography','Civics','English'],SB=['Mathematics','Science','History','Geography','Political Science','Economics','English'],SC=['Physics','Chemistry','Biology','Mathematics','Economics','Accountancy','Business Studies','History','Geography','Political Science','Computer Science','English'];
function fillSubj(){const c=+$('sc').value,L=c<=8?SA:c<=10?SB:SC;$('ss').innerHTML=L.map(x=>'<option>'+x+'</option>').join('');$('chs').hidden=true;$('sch').value=''}
function pctc(c,a){return a?Math.round(c/a*100):0}
function shuf(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function normQ(q){if(!q||!q.q||!Array.isArray(q.options)||q.options.length!==4||!(q.answer>=0&&q.answer<4))return null;const s=shuf(q.options.map((t,i)=>({t:String(t),c:i===q.answer})));return{q:String(q.q),o:s.map(x=>x.t),a:s.findIndex(x=>x.c),why:String(q.why||'')}}
function smsg(t){$('sm').textContent=t}
function mbar(p){const b=mk('div','bar'),f=mk('i');f.style.width=p+'%';f.style.background=p>=75?'#3fa66b':p>=50?'#d9a441':'#d65c5c';b.appendChild(f);return b}
function streak(){const ds=new Set(SD.hist.map(h=>new Date(h.ts).toDateString()));let n=0,d=new Date();if(!ds.has(d.toDateString()))d.setDate(d.getDate()-1);while(ds.has(d.toDateString())){n++;d.setDate(d.getDate()-1)}return n}
function studyCtx(){
 const e=Object.entries(SD.sub).filter(([k,s])=>s.a>=5);if(!e.length)return '';
 const wk=[];Object.entries(SD.sub).forEach(([k,s])=>Object.entries(s.ch).forEach(([c,x])=>{if(x.a>=3&&pctc(x.c,x.a)<60)wk.push(k+' / '+c+' '+pctc(x.c,x.a)+'%')}));
 return 'USER STUDY QUIZ STATS (in-app MCQs):\n'+e.map(([k,s])=>k+': '+pctc(s.c,s.a)+'% ('+s.c+'/'+s.a+')').join('\n')+(wk.length?'\nWeak chapters: '+wk.slice(0,6).join('; '):'')+'\nMention weak areas when they study or procrastinate; encouraging but honest.';
}
function openSp(){$('wb').hidden=true;$('mp').hidden=true;set.hidden=true;$('sp').hidden=false;tab('q')}
function closeSp(){$('sp').hidden=true}
function tab(t){
 $('stq').classList.toggle('on',t==='q');$('stp').classList.toggle('on',t==='p');
 $('sq').hidden=!(t==='q'&&!QZ);$('sg').hidden=!(t==='q'&&QZ);$('spg').hidden=t!=='p';
 if(t==='q'){$('gw').textContent='Practice my mistakes ('+SD.wrong.length+')';$('gw').disabled=!SD.wrong.length}
 if(t==='p')progress();
}
async function startQuiz(){
 if(!cfg('key','')){smsg('Add your API key first (Settings).');return}
 const cls=$('sc').value,sub=$('ss').value,ch=$('sch').value.trim(),n=+$('sn').value,ky=cls+'|'+sub+'|'+(ch||'All'),seen=(SD.seen[ky]||[]).slice(-15);
 $('go').disabled=true;smsg('Making '+n+' questions…');
 try{
  const d=await gj([{text:'Create '+n+' multiple-choice questions for CBSE/NCERT Class '+cls+' '+sub+', '+(ch?'chapter "'+ch+'"':'mixed from the whole syllabus')+'. Difficulty: '+$('sd').value+'. Base them strictly on NCERT content and exam style. Exactly 4 options, exactly one correct. No questions needing a diagram. Be factually certain; skip anything you are unsure about.'+(seen.length?' Do NOT repeat these:\n'+seen.join('\n'):'')+'\nReturn JSON only: [{"q":"","options":["","","",""],"answer":0,"why":"1-2 sentence explanation"}] where answer is the index 0-3 of the correct option.'}]);
  const qs=(Array.isArray(d)?d:d.questions||[]).map(normQ).filter(Boolean).slice(0,n);
  if(!qs.length)throw new Error('No valid questions came back, try again');
  smsg('');runQuiz(qs,{cls,sub,ch:ch||'All chapters'});
 }catch(e){smsg('Could not make quiz: '+(e.message||'error'))}
 $('go').disabled=false;
}
function runQuiz(qs,meta){QZ={qs,i:0,sc:0,meta,res:[],done:false};tab('q');showQ()}
function showQ(){
 const g=$('sg');g.innerHTML='';const q=QZ.qs[QZ.i];
 g.appendChild(mk('div','lab','Question '+(QZ.i+1)+' / '+QZ.qs.length+' · Score '+QZ.sc));
 g.appendChild(mbar(QZ.i/QZ.qs.length*100));
 g.appendChild(mk('div','qq',q.q));
 const ob=[];q.o.forEach((t,k)=>{const b=mk('button','opt',String.fromCharCode(65+k)+'. '+t);b.type='button';b.onclick=()=>pick(k,ob,q);ob.push(b);g.appendChild(b)});
 const ex=mk('div','ex');ex.id='exq';g.appendChild(ex);
}
function pick(k,ob,q){
 if(QZ.done)return;QZ.done=true;const ok=k===q.a;if(ok)QZ.sc++;QZ.res.push({q,ok});
 ob.forEach((b,i)=>{b.disabled=true;if(i===q.a)b.classList.add('ok');else if(i===k)b.classList.add('bad')});
 const ex=$('exq');ex.textContent=(ok?'✅ Correct. ':'❌ Wrong. ')+q.why;
 const row=mk('div','row');
 const nx=mk('button','pri',QZ.i+1<QZ.qs.length?'Next':'Finish');nx.type='button';nx.onclick=()=>{QZ.done=false;QZ.i++;QZ.i<QZ.qs.length?showQ():finish()};row.appendChild(nx);
 if(!ok){const e=mk('button','','Explain with MINE');e.type='button';e.onclick=()=>{closeSp();ask('Explain this MCQ to me simply. Question: '+q.q+' Options: '+q.o.join(' | ')+'. Correct answer: '+q.o[q.a]+'. I picked: '+q.o[k]+'. Why was my choice wrong?')};row.appendChild(e)}
 ex.appendChild(row);
}
function finish(){
 const m=QZ.meta,tot=QZ.qs.length,sc=QZ.sc,p=pctc(sc,tot);QZ.fin=true;
 if(m.practice){SD.wrong=SD.wrong.filter(w=>!QZ.res.some(r=>r.ok&&r.q.q===w.q.q))}
 else{
  const sk='Class '+m.cls+' · '+m.sub,s=SD.sub[sk]||(SD.sub[sk]={a:0,c:0,ch:{}});s.a+=tot;s.c+=sc;
  const cs=s.ch[m.ch]||(s.ch[m.ch]={a:0,c:0});cs.a+=tot;cs.c+=sc;
  SD.hist.push({ts:Date.now(),sk,ch:m.ch,sc,tot});SD.hist=SD.hist.slice(-200);
  const ky=m.cls+'|'+m.sub+'|'+(m.ch==='All chapters'?'All':m.ch);
  SD.seen[ky]=(SD.seen[ky]||[]).concat(QZ.res.map(r=>r.q.q.slice(0,90))).slice(-30);
  QZ.res.filter(r=>!r.ok&&!SD.wrong.some(w=>w.q.q===r.q.q)).forEach(r=>SD.wrong.push({q:r.q,sk,ch:m.ch}));SD.wrong=SD.wrong.slice(-60);
 }
 ssave();
 const g=$('sg');g.innerHTML='';
 g.appendChild(mk('div','qq','Score: '+sc+' / '+tot+' ('+p+'%)'));g.appendChild(mbar(p));
 g.appendChild(mk('div','ex',p>=80?'Strong. Don’t get cocky.':p>=50?'Decent, but there are gaps. Look at what you missed.':'Weak. Revise the chapter, then retry.'));
 const row=mk('div','row');
 const a=mk('button','pri','New quiz');a.type='button';a.onclick=()=>{QZ=null;tab('q')};
 const b=mk('button','','Progress');b.type='button';b.onclick=()=>{QZ=null;tab('p')};
 row.append(a,b);g.appendChild(row);
}
function progress(){
 const g=$('spg');g.innerHTML='';let A=0,C=0;Object.values(SD.sub).forEach(s=>{A+=s.a;C+=s.c});
 if(!A){g.appendChild(mk('div','ex','No quizzes yet. Take one first.'));return}
 g.appendChild(mk('div','qq','Overall: '+C+' / '+A+' correct ('+pctc(C,A)+'%)'));g.appendChild(mbar(pctc(C,A)));
 g.appendChild(mk('div','ex','Quizzes taken: '+SD.hist.length+' · Day streak: '+streak()+' · Mistakes to practice: '+SD.wrong.length));
 g.appendChild(mk('div','lab','Subjects (weakest first)'));
 Object.entries(SD.sub).sort((x,y)=>pctc(x[1].c,x[1].a)-pctc(y[1].c,y[1].a)).forEach(([k,s])=>{
  const p=pctc(s.c,s.a),r=mk('div','sr'),t=mk('div','t');
  t.append(mk('span','',k),mk('span','',p+'% · '+s.c+'/'+s.a+' · '+(s.a<5?'need more data':p>=75?'Strong':p>=50?'Okay':'Needs work')));
  r.append(t,mbar(p));g.appendChild(r);
 });
 const wk=[];Object.entries(SD.sub).forEach(([k,s])=>Object.entries(s.ch).forEach(([c,x])=>{if(x.a>=3&&pctc(x.c,x.a)<60)wk.push([k+' › '+c,pctc(x.c,x.a)])}));
 if(wk.length){g.appendChild(mk('div','lab','Work on these chapters'));wk.sort((a,b)=>a[1]-b[1]).slice(0,6).forEach(([n,p])=>g.appendChild(mk('div','ex','• '+n+': '+p+'%')))}
 g.appendChild(mk('div','lab','Recent quizzes'));
 SD.hist.slice(-5).reverse().forEach(h=>g.appendChild(mk('div','ex',new Date(h.ts).toLocaleDateString([],{day:'numeric',month:'short'})+' · '+h.sk+' · '+h.ch+' · '+h.sc+'/'+h.tot)));
 const z=mk('button','','Reset all progress');z.type='button';z.onclick=()=>{if(confirm('Delete all study progress?')){SD={sub:{},hist:[],wrong:[],seen:{}};ssave();progress()}};g.appendChild(z);
}
$('sbtn').addEventListener('click',openSp);$('sx').addEventListener('click',closeSp);
$('stq').addEventListener('click',()=>tab('q'));$('stp').addEventListener('click',()=>tab('p'));
$('sc').addEventListener('change',fillSubj);$('ss').addEventListener('change',()=>{$('chs').hidden=true;$('sch').value=''});
$('chs').addEventListener('change',e=>{$('sch').value=e.target.value});
$('go').addEventListener('click',startQuiz);
$('gw').addEventListener('click',()=>{if(SD.wrong.length)runQuiz(shuf(SD.wrong).slice(0,10).map(w=>w.q),{practice:true})});
$('chb').addEventListener('click',async()=>{
 if(!cfg('key','')){smsg('Add your API key first (Settings).');return}
 smsg('Loading chapters…');
 try{const d=await gj([{text:'List the chapter names of the NCERT Class '+$('sc').value+' '+$('ss').value+' textbook (current edition). Return JSON only: {"chapters":["Chapter name"]}. Names only, no numbering.'}]);
  const l=(d.chapters||[]).slice(0,40),s=$('chs');s.innerHTML='<option value="">All chapters (mixed)</option>';
  l.forEach(c=>{const o=document.createElement('option');o.value=o.textContent=String(c);s.appendChild(o)});s.hidden=!l.length;
  smsg(l.length?l.length+' chapters loaded. This list is AI-made, so check it against your book.':'No chapters came back. Type the chapter name instead.');
 }catch(e){smsg('Could not load chapters: '+(e.message||'error'))}
});
fillSubj();
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
function sysPrompt(c){return [persona(),timeCtx(c),wbCtx(),memCtx(),studyCtx()].filter(Boolean).join('\n')}
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
$('wbtn').addEventListener('click',()=>{wb.hidden=!wb.hidden;if(!wb.hidden){set.hidden=true;$('mp').hidden=true;wbFill();wbSum()}});
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
function syncSW(){const c=chat();idbSet('ctx',{key:cfg('key',''),model:cfg('model','gemini-3.8-flash'),persona:persona(),wb:[wbCtx(),memCtx(),studyCtx()].filter(Boolean).join('\n'),chatId:c.id,msgs:c.msgs.slice(-20).map(m=>({role:m.role,content:m.content,ts:m.ts||0}))}).catch(()=>{})}
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
