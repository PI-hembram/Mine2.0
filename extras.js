/* ===== PANEL HELPERS ===== */
const PN=['set','wb','mp','cp','up'];
function only(id){PN.forEach(i=>{if(i!==id)$(i).hidden=true})}
[['gear','set'],['wbtn','wb'],['mbtn','mp']].forEach(([b,p])=>$(b).addEventListener('click',()=>{if(!$(p).hidden)only(p)}));
function dk(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
async function once(sys,text){
 const r=await fetch(API+encodeURIComponent(cfg('model','gemini-3.8-flash'))+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':cfg('key','')},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:[{role:'user',parts:[{text}]}]})});
 const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||'Error '+r.status);
 const o=(((j.candidates||[])[0]||{}).content||{parts:[]}).parts.map(p=>p.text||'').join('').trim();if(!o)throw new Error('empty');return o;
}
/* ===== DAILY CHECK-IN ===== */
const CK2='mine-ci-v1';let CI={},cm=new Date();cm.setDate(1);
try{CI=JSON.parse(localStorage.getItem(CK2)||'{}')}catch(e){}
function cisave(){try{localStorage.setItem(CK2,JSON.stringify(CI))}catch(e){}}
function dayStats(){const o={};S.chats.forEach(c=>c.msgs.forEach(m=>{if(m.ts){const k=dk(new Date(m.ts)),d=o[k]||(o[k]={n:0,u:0});d.n++;if(m.role==='user')d.u++}}));return o}
function streakInfo(ds){
 const keys=new Set([...Object.keys(ds).filter(k=>ds[k].u>0),...Object.keys(CI),...Object.keys(W.mine).filter(k=>W.mine[k]>=60)]);
 let best=0,run=0,prev=null;[...keys].sort().forEach(k=>{const d=new Date(k+'T00:00:00');run=prev&&Math.round((d-prev)/864e5)===1?run+1:1;best=Math.max(best,run);prev=d});
 let cur=0,d=new Date();if(!keys.has(dk(d)))d.setDate(d.getDate()-1);while(keys.has(dk(d))){cur++;d.setDate(d.getDate()-1)}
 return{cur,best,total:keys.size};
}
function ciRender(){
 const ds=dayStats(),y=cm.getFullYear(),mo=cm.getMonth(),first=new Date(y,mo,1).getDay(),n=new Date(y,mo+1,0).getDate(),today=dk(new Date());
 $('cpt').textContent=cm.toLocaleDateString([],{month:'long',year:'numeric'});
 const g=$('ccal');g.innerHTML='';['S','M','T','W','T','F','S'].forEach(d=>g.appendChild(mk('div','cw',d)));
 for(let i=0;i<first;i++)g.appendChild(mk('div',''));
 let mins=0,act=0;
 for(let d=1;d<=n;d++){
  const k=dk(new Date(y,mo,d)),mn=Math.round((W.mine[k]||0)/60),u=ds[k]?ds[k].u:0,on=u>0||CI[k]||mn>=1;
  if(on)act++;mins+=mn;
  const c=mk('button','cd'+(on?(mn>=30||u>=15?' l3':mn>=10||u>=5?' l2':' l1'):'')+(k===today?' td':''),d+(CI[k]?'\n'+CI[k].mood:''));c.type='button';
  c.onclick=()=>{$('cdt').textContent=new Date(y,mo,d).toLocaleDateString([],{weekday:'long',day:'numeric',month:'short'})+': '+(on?mn+' min with MINE · '+u+' messages from you'+(CI[k]?' · mood '+CI[k].mood:''):'no chat this day')};
  g.appendChild(c);
 }
 const s=streakInfo(ds);
 $('cst').textContent='This month: '+act+' / '+n+' days active · '+fm(mins)+' with MINE\nStreak: '+s.cur+' day(s) · Best: '+s.best+' · Active days overall: '+s.total+'\nDates are tracked from the day you installed this update; older chats have no dates.';
}
$('cbtn').addEventListener('click',()=>{const p=$('cp');p.hidden=!p.hidden;if(!p.hidden){only('cp');cm=new Date();cm.setDate(1);$('cdt').textContent='';ciRender()}});
$('cpv').addEventListener('click',()=>{cm.setMonth(cm.getMonth()-1);ciRender()});
$('cnx').addEventListener('click',()=>{cm.setMonth(cm.getMonth()+1);ciRender()});
['😄','🙂','😐','😔','😡'].forEach(e=>{const b=mk('button','',e);b.type='button';b.onclick=()=>{const t=dk(new Date()),first=!CI[t];CI[t]={mood:e,ts:Date.now()};cisave();ciRender();if(first){$('cp').hidden=true;ask('Daily check-in: I feel '+e+' today.')}};$('cmd').appendChild(b)});
/* ===== WEATHER ===== */
let WXD=null;try{WXD=JSON.parse(localStorage.getItem('mine-wx')||'null')}catch(e){}
const WMO=c=>c===0?'clear sky':c<=2?'partly cloudy':c===3?'overcast':c<=48?'foggy':c<=57?'drizzle':c<=67?'rain':c<=77?'snow':c<=82?'rain showers':c<=86?'snow showers':'a thunderstorm';
async function wxFetch(){
 let L=null;try{L=JSON.parse(localStorage.getItem('mine-loc')||'null')}catch(e){}
 if(!L||(WXD&&Date.now()-WXD.ts<3600e3))return;
 try{const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+L.lat+'&longitude='+L.lon+'&current=temperature_2m,weather_code,is_day'),j=await r.json(),c=j.current;
  WXD={temp:Math.round(c.temperature_2m),code:c.weather_code,desc:WMO(c.weather_code),ts:Date.now()};localStorage.setItem('mine-wx',JSON.stringify(WXD))}catch(e){}
}
function weatherCtx(){return WXD&&Date.now()-WXD.ts<6*3600e3?'CURRENT WEATHER at the user’s place: '+WXD.temp+'°C, '+WXD.desc+'. Mention it naturally only when relevant (greetings, plans, clothes).':''}
function greetText(){
 const h=new Date().getHours(),u=uname(),tod=h<5?'night':h<12?'morning':h<17?'afternoon':h<21?'evening':'night',w=WXD&&Date.now()-WXD.ts<3*3600e3?WXD:null;let line='';
 if(w){const c=w.code;line=c>=95?'There’s a thunderstorm outside, so stay in and stay safe.':(c>=71&&c<=77)||(c>=85&&c<=86)?'It’s snowing out there. Dress warm.':(c>=51&&c<=67)||(c>=80&&c<=82)?'It’s rainy ('+w.temp+'°C). Take an umbrella if you go out.':w.temp>=35?'It’s '+w.temp+'°C, brutally hot. Drink water.':w.temp<=10?'It’s only '+w.temp+'°C. Dress warm.':c===0?'Clear sky and '+w.temp+'°C. Nice day to step outside for a bit.':'It’s '+w.temp+'°C with '+w.desc+'.'}
 const g={morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening',night:'You’re up late'}[tod],mood=w&&w.code>=95?'surprised':w&&w.code>=51&&w.code<=67?'thinking':tod==='night'?'sleepy':'happy';
 return '['+mood+'] '+g+', '+u+'. '+line+(tod==='night'?' Sleep soon, okay?':'');
}
async function greetCheck(){
 if(busy)return;const today=dk(new Date());if(localStorage.getItem('mine-greet')===today)return;
 await wxFetch();const c=chat();if(c.msgs.some(m=>m.ts&&dk(new Date(m.ts))===today))return;
 localStorage.setItem('mine-greet',today);c.msgs.push({role:'assistant',content:greetText(),ts:Date.now()});c.updated=Date.now();save();render();renderList();
}
$('wx').addEventListener('click',()=>{
 if(!navigator.geolocation){note('No location support here.');return}
 navigator.geolocation.getCurrentPosition(p=>{localStorage.setItem('mine-loc',JSON.stringify({lat:+p.coords.latitude.toFixed(2),lon:+p.coords.longitude.toFixed(2)}));WXD=null;wxFetch().then(()=>{note(WXD?'Weather on: '+WXD.temp+'°C, '+WXD.desc+'.':'Could not load the weather.');syncSW()})},()=>note('Location blocked. Allow location for this site to get weather.'),{timeout:10000,maximumAge:3600e3});
});
/* ===== SURPRISES ===== */
const KIND=['a sincere compliment (use something you remember about them if you can)','a random fun fact','a tiny playful dare they can do right now','a short riddle (do not reveal the answer)','a song, anime or game recommendation','a cute two-sentence story','a gentle reminder to drink water and rest their eyes','a motivational line for studying'];
const LOCAL=[u=>'[happy] Surprise! You’re doing better than you think, '+u+'. Don’t tell anyone I said that.',u=>'[teasing] Fun fact: octopuses have three hearts. You have one, so take care of it, '+u+'.',u=>'[playful] Dare: stand up, stretch, and drink some water. Right now.',u=>'[normal] Riddle: what has keys but can’t open locks? Tell me your answer!',u=>'[happy] I hope you eat something sweet today, '+u+'. That’s an order.'];
async function openSurprise(){
 if(busy)return;localStorage.removeItem('mine-sup');localStorage.setItem('mine-sup-t',Date.now());
 const c=chat(),k=Math.floor(Math.random()*KIND.length);let txt;
 try{if(!cfg('key',''))throw 0;txt=await once([persona(),memCtx(),xctx(),studyCtx()].filter(Boolean).join('\n'),'Surprise the user with '+KIND[k]+'. 1-3 sentences, in character.')}catch(e){txt=LOCAL[Math.floor(Math.random()*LOCAL.length)](uname())}
 if(!/^\s*\[\w+\]/.test(txt))txt='[happy] '+txt;
 c.msgs.push({role:'assistant',content:txt,ts:Date.now()});c.updated=Date.now();save();render();renderList();
}
function supCheck(){if(busy||localStorage.getItem('mine-sup'))return;const t=+localStorage.getItem('mine-sup-t')||0;if(Date.now()-t>5*3600e3&&Math.random()<.5){localStorage.setItem('mine-sup','1');render()}}
function extraRender(){if(localStorage.getItem('mine-sup')){const d=mk('div','err'),b=mk('button','sur','🎁 MINE left you a surprise. Tap to open');b.type='button';b.onclick=openSurprise;d.appendChild(b);log.appendChild(d)}}
const _r=render;render=function(){_r();extraRender()};
$('sup').addEventListener('click',()=>{if(Date.now()-(+localStorage.getItem('mine-sup-t')||0)<600e3){note('Surprises need time to cook. Wait a little.');return}openSurprise()});
function boot(){greetCheck();supCheck()}
setTimeout(boot,800);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')boot()});
/* ===== MUSIC PLAYER + NOW-PLAYING BAR ===== */
const AU=new Audio();let TR=[],TI=-1,TURL=null,lastAnn=-2;
function tmeta(n){n=n.replace(/\.[^.]+$/,'').replace(/_+/g,' ');const m=n.match(/^(.+?)\s+-\s+(.+)$/);return m?{artist:m[1].trim(),title:m[2].trim()}:{artist:'',title:n.trim()}}
function playing(){return !AU.paused&&!AU.ended&&TI>=0&&!!TR[TI]}
function musicCtx(){if(!playing())return '';const m=tmeta(TR[TI].name);return 'The user is currently listening to “'+m.title+'”'+(m.artist?' by '+m.artist:'')+' in MINE’s music player. You may mention it naturally (don’t overdo it).'}
function xctx(){return [weatherCtx(),musicCtx()].filter(Boolean).join('\n')}
function tsave(){idbSet('tracks',TR).catch(()=>{})}
function setMS(){try{if(!('mediaSession' in navigator))return;const m=tmeta(TR[TI].name);navigator.mediaSession.metadata=new MediaMetadata({title:m.title,artist:m.artist||'MINE',album:'MINE'});
 navigator.mediaSession.setActionHandler('play',()=>AU.play());navigator.mediaSession.setActionHandler('pause',()=>AU.pause());
 navigator.mediaSession.setActionHandler('nexttrack',()=>playT((TI+1)%TR.length));navigator.mediaSession.setActionHandler('previoustrack',()=>playT((TI-1+TR.length)%TR.length))}catch(e){}}
function playT(i){if(i<0||i>=TR.length)return;TI=i;if(TURL)URL.revokeObjectURL(TURL);TURL=URL.createObjectURL(TR[i].file);AU.src=TURL;AU.play().catch(()=>{});setMS();listT()}
function songQuip(){if(!$('uc').checked||!playing())return;const m=tmeta(TR[TI].name),L=['Ooh, “'+m.title+'”. Nice pick, '+uname()+'.','“'+m.title+'”? Good taste. Turn it up a little.','I see you’re listening to “'+m.title+'”. Mind if I listen too?'];bubble('her',L[Math.floor(Math.random()*L.length)])}
function barUpd(){const on=playing();$('mb').hidden=!on;if(on){const m=tmeta(TR[TI].name);$('mtn').textContent=m.title;$('mta').textContent=m.artist||'Now playing';if(lastAnn!==TI){lastAnn=TI;songQuip()}}else lastAnn=-2;syncSW();listT()}
AU.addEventListener('play',barUpd);AU.addEventListener('pause',barUpd);
AU.addEventListener('ended',()=>{if(TR.length>1)playT((TI+1)%TR.length);else barUpd()});
AU.addEventListener('timeupdate',()=>{$('mpg').style.width=(AU.duration?AU.currentTime/AU.duration*100:0)+'%'});
$('mpp').addEventListener('click',()=>AU.pause());
$('mnx').addEventListener('click',()=>{if(TR.length)playT((TI+1)%TR.length)});
$('mch').addEventListener('click',()=>{if(playing()){const m=tmeta(TR[TI].name);ask('I’m listening to “'+m.title+'”'+(m.artist?' by '+m.artist:'')+'. What do you think of it?')}});
function listT(){
 const l=$('ul');l.innerHTML='';if(!TR.length){l.appendChild(mk('div','lab','No songs yet. Add some from your phone.'));return}
 TR.forEach((t,i)=>{const r=mk('div','mi'),m=tmeta(t.name),o=mk('button','a',(i===TI&&playing()?'🔊 ':i===TI?'⏸ ':'▶ ')+m.title+(m.artist?' · '+m.artist:''));o.type='button';o.style.cssText='flex:1;text-align:left;color:var(--text);border:0';
  o.onclick=()=>{if(i===TI&&AU.src&&!AU.ended){playing()?AU.pause():AU.play()}else playT(i)};
  const x=mk('button','a','✕');x.type='button';x.onclick=()=>{TR.splice(i,1);if(i===TI){AU.pause();TI=-1}else if(i<TI)TI--;tsave();listT()};r.append(o,x);l.appendChild(r)});
}
$('ubtn').addEventListener('click',()=>{const p=$('up');p.hidden=!p.hidden;if(!p.hidden){only('up');listT()}});
$('uadd').addEventListener('click',()=>$('uf').click());
$('uf').addEventListener('change',e=>{[...e.target.files].forEach(f=>TR.push({name:f.name,file:f}));e.target.value='';tsave();if(TI<0&&TR.length)playT(0);else listT()});
$('ush').addEventListener('click',()=>{if(!TR.length)return;TR=shuf(TR);TI=-1;tsave();playT(0)});
$('uclr').addEventListener('click',()=>{if(TR.length&&confirm('Remove all songs from the player?')){AU.pause();TR=[];TI=-1;tsave();listT();barUpd()}});
idbGet('tracks').then(t=>{if(Array.isArray(t)){TR=t;listT()}}).catch(()=>{});
