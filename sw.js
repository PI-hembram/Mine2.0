self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
const API='https://generativelanguage.googleapis.com/v1beta/models/';
const NACT=[{action:'reply',title:'Reply',type:'text',placeholder:'Message MINE…'},{action:'ok',title:'👍 Okay'}];
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('mine-sw',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbGet(k){return idb().then(d=>new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))}
function idbSet(k,v){return idb().then(d=>new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)}))}
function ago(ms){const m=Math.round(ms/60000);if(m<1)return 'moments';if(m<60)return m+' min';const h=Math.floor(m/60);if(h<24)return h+'h '+(m%60)+'m';const d=Math.floor(h/24);return d+' day'+(d>1?'s':'')+' '+(h%24)+'h'}
function stamp(ts){return new Date(ts).toLocaleString([],{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}
function tagT(x,p){return '['+stamp(x.ts)+(p&&p.ts&&x.ts-p.ts>10*60000?', replied after '+ago(x.ts-p.ts):'')+'] '}
function show(body,chatId){return self.registration.showNotification('MINE',{body:body.slice(0,180),icon:'icon-192.png',badge:'icon-192.png',tag:'mine',renotify:true,data:{chatId},actions:NACT})}
async function openApp(){const l=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(l.length)return l[0].focus();return self.clients.openWindow('./')}
async function quick(txt){
 const ctx=await idbGet('ctx');
 if(!ctx||!ctx.key)return openApp();
 const ob=(await idbGet('outbox'))||[],now=Date.now();
 const hist=ctx.msgs.concat(ob.filter(b=>b.chatId===ctx.chatId).flatMap(b=>b.msgs),[{role:'user',content:txt,ts:now}]).slice(-20);
 const contents=hist.map((x,i,a)=>({role:x.role==='user'?'user':'model',parts:[{text:x.role==='user'&&x.ts?tagT(x,a[i-1])+x.content:x.content}]}));
 while(contents.length&&contents[0].role!=='user')contents.shift();
 const p=hist[hist.length-2],g=p&&p.ts?now-p.ts:0;
 const sys=ctx.persona+'\nTIME AWARENESS: It is now '+stamp(now)+'. User messages start with their send time in brackets; never write such brackets yourself. '+(g>20*60000?'The user replied '+ago(g)+' after the previous message; notice it naturally in one short line, never guilt-trip. ':'')+'\n'+ctx.wb+'\nThe user is replying from a phone notification: keep it to 1-2 short sentences.';
 try{
  const res=await fetch(API+encodeURIComponent(ctx.model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':ctx.key},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents})});
  const j=await res.json();if(!res.ok)throw new Error((j.error&&j.error.message)||'Error '+res.status);
  const raw=((((j.candidates||[])[0]||{}).content||{parts:[]}).parts||[]).map(x=>x.text||'').join('').trim();
  if(!raw)throw new Error('Empty reply');
  ob.push({chatId:ctx.chatId,msgs:[{role:'user',content:txt,ts:now},{role:'assistant',content:raw,ts:Date.now()}]});
  await idbSet('outbox',ob);
  await show(raw.replace(/^\s*\[\w+\]\s*/,''),ctx.chatId);
  (await self.clients.matchAll({type:'window'})).forEach(c=>c.postMessage('merge'));
 }catch(err){await show('Could not reply: '+(err.message||'network error'),ctx.chatId)}
}
self.addEventListener('notificationclick',e=>{
 e.notification.close();
 const txt=e.action==='reply'&&e.reply?e.reply:e.action==='ok'?'Okay 👍':null;
 e.waitUntil(txt?quick(txt):openApp());
});
