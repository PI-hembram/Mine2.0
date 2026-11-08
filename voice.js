/* ===== HER VOICE ===== */
const VK='mine-voice-v1',GVOICES=[['Kore','firm'],['Leda','youthful'],['Aoede','breezy'],['Zephyr','bright'],['Callirrhoe','easy-going'],['Autonoe','bright'],['Despina','smooth'],['Erinome','clear'],['Laomedeia','upbeat'],['Achernar','soft'],['Gacrux','mature'],['Pulcherrima','forward'],['Vindemiatrix','gentle'],['Sulafat','warm'],['Puck','upbeat'],['Charon','informative'],['Fenrir','excitable'],['Orus','firm'],['Algenib','gravelly'],['Umbriel','easy-going']];
let VO={auto:false,e:'phone',pv:'',pp:1.15,pr:1,gv:'Kore',gt:'gemini-3.1-flash-tts-preview'};
try{VO=Object.assign(VO,JSON.parse(localStorage.getItem(VK)||'{}'))}catch(e){}
const vsave=()=>{try{localStorage.setItem(VK,JSON.stringify(VO))}catch(e){}};
const VA=new Audio();let vurl=null;
PN.push('vp');
function vclean(t){try{t=t.replace(/\p{Extended_Pictographic}/gu,'')}catch(e){}return t.replace(/[*_`#>~]/g,'').replace(/\s+/g,' ').trim()}
function vstyle(m){m=(m||'').toLowerCase();return /happy|excit|joy/.test(m)?'Say cheerfully and warmly:':/tease|smug|play|smirk/.test(m)?'Say in a playful, teasing tone:':/sleep|tired/.test(m)?'Say softly and sleepily:':/angry|mad|annoy|jealous/.test(m)?'Say in a slightly annoyed, tsundere tone:':/sad|cry/.test(m)?'Say softly and sadly:':/shy|blush|embarrass/.test(m)?'Say shyly, in a quiet voice:':'Say in a warm, gentle, slightly playful tone:'}
function pcmToWav(b64){const bin=atob(b64),n=bin.length,buf=new ArrayBuffer(44+n),v=new DataView(buf),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
 w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n,true);
 const u=new Uint8Array(buf,44);for(let i=0;i<n;i++)u[i]=bin.charCodeAt(i);return new Blob([buf],{type:'audio/wav'})}
async function gemTTS(text,mood){
 const r=await fetch(API+encodeURIComponent(VO.gt)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':cfg('key','')},body:JSON.stringify({contents:[{parts:[{text:vstyle(mood)+' '+text}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:VO.gv}}}}})});
 const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||'Error '+r.status);
 const p=((((j.candidates||[])[0]||{}).content||{}).parts||[]).find(x=>x.inlineData||x.inline_data);if(!p)throw new Error('No audio returned');
 return pcmToWav((p.inlineData||p.inline_data).data);
}
function phoneSpeak(t){
 if(!('speechSynthesis' in window)){$('vn').textContent='This browser has no speech support.';return}
 const u=new SpeechSynthesisUtterance(t),v=speechSynthesis.getVoices().find(x=>x.voiceURI===VO.pv);if(v){u.voice=v;u.lang=v.lang}u.pitch=VO.pp;u.rate=VO.pr;speechSynthesis.speak(u);
}
function stopSpeak(){try{speechSynthesis.cancel()}catch(e){}VA.pause()}
async function speak(text,mood){
 stopSpeak();const t=vclean(text).slice(0,500);if(!t)return;
 if(VO.e==='gem'&&cfg('key','')){
  try{$('vn').textContent='Making her voice…';const bl=await gemTTS(t,mood);if(vurl)URL.revokeObjectURL(vurl);vurl=URL.createObjectURL(bl);VA.src=vurl;await VA.play();$('vn').textContent=''}
  catch(e){$('vn').textContent='Gemini voice failed ('+(e.message||'error')+'). Used phone voice instead.';phoneSpeak(t)}
 }else phoneSpeak(t);
}
function autoSpeak(raw){if(VO.auto&&!document.hidden){const s=split(raw);speak(s.text,s.mood)}}
function fillV(){
 if(!('speechSynthesis' in window))return;
 const vs=speechSynthesis.getVoices().slice().sort((a,b)=>(/^en/i.test(b.lang)-/^en/i.test(a.lang))||a.name.localeCompare(b.name)),s=$('vpv');s.innerHTML='';
 vs.forEach(v=>{const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+' ('+v.lang+')';s.appendChild(o)});
 if(VO.pv&&vs.some(v=>v.voiceURI===VO.pv))s.value=VO.pv;else if(vs.length){VO.pv=vs[0].voiceURI;s.value=VO.pv}
}
function vui(){$('va').checked=VO.auto;$('ve').value=VO.e;$('vph').hidden=VO.e!=='phone';$('vgm').hidden=VO.e!=='gem';$('vpp').value=VO.pp;$('vpr').value=VO.pr;$('vgv').value=VO.gv;$('vgt').value=VO.gt}
GVOICES.forEach(([n,d])=>{const o=document.createElement('option');o.value=n;o.textContent=n+' · '+d;$('vgv').appendChild(o)});
fillV();if('speechSynthesis' in window)speechSynthesis.onvoiceschanged=fillV;vui();
$('vbtn').addEventListener('click',()=>{const p=$('vp');p.hidden=!p.hidden;if(!p.hidden){only('vp');fillV();vui()}});
$('va').addEventListener('change',e=>{VO.auto=e.target.checked;vsave()});
$('ve').addEventListener('change',e=>{VO.e=e.target.value;vsave();vui()});
$('vpv').addEventListener('change',e=>{VO.pv=e.target.value;vsave()});
$('vpp').addEventListener('change',e=>{VO.pp=+e.target.value;vsave()});
$('vpr').addEventListener('change',e=>{VO.pr=+e.target.value;vsave()});
$('vgv').addEventListener('change',e=>{VO.gv=e.target.value;vsave()});
$('vgt').addEventListener('change',e=>{VO.gt=e.target.value.trim()||'gemini-3.1-flash-tts-preview';vsave()});
$('vt').addEventListener('click',()=>speak('Hello '+uname()+'. This is how I sound. Do you like it?','happy'));
$('vs').addEventListener('click',stopSpeak);
