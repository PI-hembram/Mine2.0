const GK='mine-games-v1',GP=$('gp'),GB=$('gb'),GV=$('gv');let GS={},GT=[];
try{GS=JSON.parse(localStorage.getItem(GK)||'{}')}catch(e){}
function gscore(id,r){const s=GS[id]||(GS[id]={w:0,l:0,d:0});s[r]++;try{localStorage.setItem(GK,JSON.stringify(GS))}catch(e){}}
function quip(r){const u=uname(),a={w:['You got me, '+u+'. Rematch?','Okay, that was good. I wasn’t going easy… much.','Hmph. Beginner’s luck?'],l:['I win! Don’t sulk, '+u+'. Try again?','Better luck next time~','Gotcha! Want a rematch?'],d:['A draw. We’re evenly matched.','Tie! Again?']}[r];return '“'+a[Math.floor(Math.random()*a.length)]+'” — MINE'}
const btn=(t,f)=>{const b=mk('button','',t);b.type='button';b.onclick=f;return b};
const d6=()=>1+Math.floor(Math.random()*6),rnd=n=>Math.floor(Math.random()*n);
const HW=['galaxy','pencil','monsoon','library','cricket','mountain','elephant','chemistry','triangle','festival','keyboard','umbrella','notebook','sunshine','dolphin','volcano','compass','history','geometry','rainbow','planet','battery','pyramid','kingdom','village','lantern','whisper','journey','thunder','melody'];
/* ---- Tic-Tac-Toe ---- */
function tw(b){for(const[a,c,d]of[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.includes('')?null:'D'}
function mm(b,p){const w=tw(b);if(w)return w==='O'?1:w==='X'?-1:0;let best=p==='O'?-2:2;for(let i=0;i<9;i++)if(!b[i]){b[i]=p;const v=mm(b,p==='O'?'X':'O');b[i]='';best=p==='O'?Math.max(best,v):Math.min(best,v)}return best}
function runTTT(b,st,end){const bd=Array(9).fill(''),g=mk('div','g g3');let over=false;
 const cells=bd.map((_,i)=>{const c=mk('button','cell','');c.type='button';c.onclick=()=>mv(i);g.appendChild(c);return c});
 const draw=()=>cells.forEach((c,i)=>c.textContent=bd[i]==='X'?'❌':bd[i]==='O'?'⭕':'');
 const chk=()=>{const w=tw(bd);if(!w)return false;over=true;end(w==='X'?'w':w==='O'?'l':'d',w==='X'?'You win!':w==='O'?'MINE wins.':'Draw.');return true};
 function mv(i){if(over||bd[i])return;bd[i]='X';draw();if(chk())return;const fr=bd.map((v,k)=>v?-1:k).filter(k=>k>=0);let m=fr[rnd(fr.length)];if(Math.random()>.25){let bs=-2;fr.forEach(k=>{bd[k]='O';const v=mm(bd,'X');bd[k]='';if(v>bs){bs=v;m=k}})}bd[m]='O';draw();chk()}
 b.appendChild(g);st.textContent='You are ❌. Your move.'}
/* ---- Connect 4 ---- */
function runC4(b,st,end){const R=6,C=7,bd=Array.from({length:R},()=>Array(C).fill(0));let over=false,turn=1;
 const g=mk('div','g g7'),cells=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++){const x=mk('button','cell sm','');x.type='button';x.onclick=()=>drop(c);g.appendChild(x);cells.push(x)}
 const draw=()=>cells.forEach((x,i)=>{const v=bd[Math.floor(i/C)][i%C];x.textContent=v===1?'🔴':v===2?'🟡':''});
 const free=c=>{for(let r=R-1;r>=0;r--)if(!bd[r][c])return r;return -1};
 const win=p=>{for(let r=0;r<R;r++)for(let c=0;c<C;c++)for(const[a,d]of[[0,1],[1,0],[1,1],[1,-1]]){let k=0;while(k<4){const rr=r+a*k,cc=c+d*k;if(rr<0||rr>=R||cc<0||cc>=C||bd[rr][cc]!==p)break;k++}if(k===4)return true}return false};
 const fin=p=>{if(win(p)){over=true;end(p===1?'w':'l',p===1?'You win!':'MINE wins.');return true}if(bd[0].every(v=>v)){over=true;end('d','Board full: draw.');return true}return false};
 function drop(c){if(over||turn!==1)return;const r=free(c);if(r<0)return;bd[r][c]=1;draw();if(fin(1))return;turn=2;setTimeout(ai,350)}
 function ai(){const cs=[...Array(C).keys()].filter(c=>free(c)>=0);let pk=null;for(const p of[2,1]){for(const c of cs){const r=free(c);bd[r][c]=p;const w=win(p);bd[r][c]=0;if(w){pk=c;break}}if(pk!==null)break}
  if(pk===null){cs.sort((a,b)=>Math.abs(3-a)-Math.abs(3-b)+(Math.random()-.5)*2);pk=cs[0]}bd[free(pk)][pk]=2;draw();if(!fin(2))turn=1}
 b.appendChild(g);st.textContent='You are 🔴. Tap a column.'}
/* ---- Rock Paper Scissors ---- */
function runRPS(b,st,end){let y=0,m=0,n=0;const E=['✊','✋','✌️'],row=mk('div','row'),out=mk('div','qq','');
 E.forEach((e,i)=>row.appendChild(btn(e,()=>{if(n>=5)return;const c=rnd(3);n++;const r=(i-c+3)%3;if(r===1)y++;else if(r===2)m++;out.textContent='You '+E[i]+' vs MINE '+E[c]+'\n'+y+' - '+m+' (round '+n+'/5)';if(n===5)end(y>m?'w':y<m?'l':'d','Final '+y+' - '+m)})));
 row.childNodes.forEach(x=>x.classList.add('big'));b.append(out,row);st.textContent='Best of 5. Choose!'}
/* ---- Memory Match ---- */
function runMem(b,st,end){const em=shuf(['🐱','🍓','🎧','🌙','⭐','🍙','🎮','🦊'].flatMap(x=>[x,x]));let first=null,lock=false,moves=0,found=0;const g=mk('div','g g4');
 em.forEach((e,i)=>{const x=mk('button','cell','❔');x.type='button';x.onclick=()=>{if(lock||x.dataset.o)return;x.textContent=e;x.dataset.o='1';if(first===null){first=i;return}moves++;
  if(em[first]===e){found++;first=null;st.textContent='Moves: '+moves;if(found===8)end('w','Cleared in '+moves+' moves.')}
  else{lock=true;const f=g.children[first];first=null;setTimeout(()=>{x.textContent='❔';f.textContent='❔';delete x.dataset.o;delete f.dataset.o;lock=false},700)}};g.appendChild(x)});
 b.appendChild(g);st.textContent='Find all pairs.'}
/* ---- Number Guess ---- */
function runGuess(b,st,end){const n=1+rnd(100);let t=7;const i=mk('input','');i.type='number';i.placeholder='1-100';
 b.append(i,btn('Guess',()=>{const v=+i.value;if(!v)return;t--;i.value='';if(v===n)end('w','Got it: '+n+'!');else if(!t)end('l','It was '+n+'.');else st.textContent=(v<n?'Higher ⬆️':'Lower ⬇️')+' · '+t+' tries left'}));st.textContent='I’m thinking of 1-100. You have 7 tries.'}
/* ---- Dice Duel ---- */
function runDice(b,st,end){let y=0,m=0,n=0;const o=mk('div','qq','');b.append(o,btn('🎲 Roll',()=>{if(n>=3)return;n++;const a=d6()+d6(),c=d6()+d6();y+=a;m+=c;o.textContent='Round '+n+': you '+a+' · MINE '+c+'\nTotal: '+y+' - '+m;if(n===3)end(y>m?'w':y<m?'l':'d','Final '+y+' - '+m)}));st.textContent='3 rounds, two dice each. Highest total wins.'}
/* ---- Hangman ---- */
function runHang(b,st,end){const w=HW[rnd(HW.length)];let lives=6;const got=new Set(),wd=mk('div','qq',''),kb=mk('div','kb');
 const show=()=>wd.textContent=[...w].map(c=>got.has(c)?c:'_').join(' ')+'   ❤️'+lives;
 'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c=>{const k=mk('button','key',c);k.type='button';k.onclick=()=>{k.disabled=true;if(w.includes(c)){got.add(c);show();if([...w].every(x=>got.has(x)))end('w','The word was '+w+'.')}else{lives--;show();if(!lives)end('l','The word was '+w+'.')}};kb.appendChild(k)});
 show();b.append(wd,kb)}
/* ---- Reaction ---- */
function runReact(b,st,end){const z=mk('button','zone','Tap to start');z.type='button';let s=0,t0=0,to;
 z.onclick=()=>{if(s===0){s=1;z.textContent='Wait for green…';z.style.background='#d65c5c';to=setTimeout(()=>{s=2;z.style.background='#3fa66b';z.textContent='TAP!';t0=performance.now()},1000+Math.random()*3000)}
  else if(s===1){clearTimeout(to);s=0;z.textContent='Too early! Tap to retry';z.style.background=''}
  else{const ms=Math.round(performance.now()-t0);end(ms<350?'w':'l',ms+' ms. '+(ms<350?'Fast!':'You need under 350 ms to win.'))}};
 b.appendChild(z);st.textContent='Tap when the box turns green.'}
/* ---- Math Race ---- */
function runMath(b,st,end){let i=0,ok=0,a,c,op,ans;const t0=Date.now(),q=mk('div','qq',''),inp=mk('input','');inp.type='number';inp.inputMode='numeric';
 const nx=()=>{a=2+rnd(12);c=2+rnd(12);op=['+','-','×'][rnd(3)];ans=op==='+'?a+c:op==='-'?a-c:a*c;q.textContent=(i+1)+'/10:  '+a+' '+op+' '+c+' = ?';inp.value='';inp.focus()};
 const sub=()=>{if(inp.value==='')return;if(+inp.value===ans)ok++;i++;if(i===10){const m=6+rnd(5);end(ok>m?'w':ok<m?'l':'d','You: '+ok+'/10 in '+Math.round((Date.now()-t0)/1000)+'s · MINE: '+m+'/10')}else nx()};
 inp.onkeydown=e=>{if(e.key==='Enter')sub()};b.append(q,inp,btn('Submit',sub));nx();st.textContent='10 sums. Beat my score.'}
/* ---- Simon ---- */
function runSimon(b,st,end){const col=['#d65c5c','#3fa66b','#4a6fa5','#d9a441'],seq=[];let pi=0,lock=true;const g=mk('div','g g2');
 const pads=col.map((c,i)=>{const p=mk('button','pad','');p.type='button';p.style.background=c;p.onclick=()=>tap(i);g.appendChild(p);return p});
 const flash=i=>{pads[i].style.opacity=1;setTimeout(()=>pads[i].style.opacity='',280)};
 const round=()=>{seq.push(rnd(4));pi=0;lock=true;st.textContent='Round '+seq.length+': watch…';seq.forEach((s,k)=>setTimeout(()=>flash(s),600+k*550));setTimeout(()=>{lock=false;st.textContent='Your turn'},600+seq.length*550)};
 function tap(i){if(lock)return;flash(i);if(i!==seq[pi]){lock=true;end(seq.length>=6?'w':'l','You reached round '+seq.length+'. (Win at 6.)');return}pi++;if(pi===seq.length){lock=true;setTimeout(round,700)}}
 b.appendChild(g);setTimeout(round,500)}
/* ---- Nim ---- */
function runNim(b,st,end){let n=21;const d=mk('div','qq',''),row=mk('div','row'),show=()=>d.textContent='🥢'.repeat(n)+'\n'+n+' sticks left';
 const mine=()=>{let t=(n-1)%4;if(t===0||Math.random()<.2)t=1+rnd(Math.min(3,n));t=Math.min(t,n);n-=t;show();st.textContent='MINE took '+t+'.';if(n===0)end('w','MINE took the last stick. You win!')};
 [1,2,3].forEach(k=>row.appendChild(btn('Take '+k,()=>{if(k>n)return;n-=k;show();if(n===0){end('l','You took the last stick. You lose.');return}setTimeout(mine,500)})));
 b.append(d,row);show();st.textContent='Take 1-3. Whoever takes the last stick loses.'}
/* ---- Minesweeper ---- */
function runMines(b,st,end){const N=8,M=10,val=Array(N*N).fill(0),op=Array(N*N).fill(0);let mines=null,rev=0,flag=false,over=false;
 const g=mk('div','g g8'),cells=[];for(let i=0;i<N*N;i++){const c=mk('button','cell sm m','');c.type='button';c.onclick=()=>tap(i);g.appendChild(c);cells.push(c)}
 const nb=i=>{const r=Math.floor(i/N),c=i%N,o=[];for(let a=-1;a<=1;a++)for(let d=-1;d<=1;d++){const rr=r+a,cc=c+d;if((a||d)&&rr>=0&&rr<N&&cc>=0&&cc<N)o.push(rr*N+cc)}return o};
 const place=s=>{mines=new Set();while(mines.size<M){const k=rnd(N*N);if(k!==s)mines.add(k)}for(let i=0;i<N*N;i++)val[i]=nb(i).filter(k=>mines.has(k)).length};
 const reveal=i=>{if(op[i]||cells[i].textContent==='🚩')return;op[i]=1;rev++;cells[i].classList.add('open');cells[i].textContent=val[i]||'';if(!val[i])nb(i).forEach(reveal)};
 function tap(i){if(over)return;if(flag){if(!op[i])cells[i].textContent=cells[i].textContent==='🚩'?'':'🚩';return}if(cells[i].textContent==='🚩')return;if(!mines)place(i);
  if(mines.has(i)){over=true;mines.forEach(k=>cells[k].textContent='💣');end('l','Boom.');return}reveal(i);if(rev===N*N-M){over=true;end('w','Cleared!')}}
 const tg=btn('⛏ Dig mode',()=>{flag=!flag;tg.textContent=flag?'🚩 Flag mode':'⛏ Dig mode'});b.append(tg,g);st.textContent='8×8 with 10 mines.'}
/* ---- Word Scramble ---- */
function runScr(b,st,end){let n=0,ok=0,w;const q=mk('div','qq',''),inp=mk('input','');inp.autocapitalize='off';
 const nx=()=>{w=HW[rnd(HW.length)];let s=w;for(let k=0;k<9&&s===w;k++)s=shuf(w.split('')).join('');q.textContent=(n+1)+'/5:  '+s.toUpperCase();inp.value=''};
 const sub=()=>{if(inp.value.trim().toLowerCase()===w)ok++;n++;if(n===5)end(ok>=3?'w':'l',ok+'/5 correct.');else nx()};
 inp.onkeydown=e=>{if(e.key==='Enter')sub()};b.append(q,inp,btn('Submit',sub));nx();st.textContent='Unscramble the word.'}
/* ---- Lights Out ---- */
function runLights(b,st,end){const N=5,on=Array(25).fill(false);let mv=0;
 const tg=i=>{const r=Math.floor(i/N),c=i%N;[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,d])=>{const rr=r+a,cc=c+d;if(rr>=0&&rr<N&&cc>=0&&cc<N)on[rr*N+cc]=!on[rr*N+cc]})};
 for(let k=0;k<12;k++)tg(rnd(25));if(!on.some(x=>x))tg(12);
 const g=mk('div','g g5'),cells=on.map((_,i)=>{const c=mk('button','cell','');c.type='button';c.onclick=()=>{tg(i);mv++;draw();if(!on.some(x=>x))end('w','Solved in '+mv+' moves.')};g.appendChild(c);return c});
 const draw=()=>cells.forEach((c,i)=>{c.textContent=on[i]?'💡':'';c.classList.toggle('lit',on[i])});draw();b.appendChild(g);st.textContent='Tapping a tile flips it and its neighbours. Turn all lights off.'}
/* ---- Whack-a-mole ---- */
function runWhack(b,st,end){let sc=0,t=20,cur=-1;const g=mk('div','g g3'),cells=[...Array(9)].map((_,i)=>{const c=mk('button','cell','');c.type='button';c.onclick=()=>{if(i===cur){sc++;cur=-1;c.textContent='';st.textContent='Score '+sc+' · '+t+'s'}};g.appendChild(c);return c});
 const iv=setInterval(()=>{if(cur>=0)cells[cur].textContent='';cur=rnd(9);cells[cur].textContent='🐹'},750),tm=setInterval(()=>{t--;st.textContent='Score '+sc+' · '+t+'s';if(t<=0){clearInterval(iv);clearInterval(tm);if(cur>=0)cells[cur].textContent='';end(sc>=14?'w':'l','You whacked '+sc+'. (Win at 14.)')}},1000);
 GT.push(iv,tm);b.appendChild(g);st.textContent='Whack the 🐹 · 20s'}
/* ---- Chess (no castling / en passant; promotion = queen) ---- */
const CHS={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟\uFE0E'},VAL={p:100,n:320,b:330,r:500,q:900,k:0};
const cInit=()=>['rnbqkbnr','pppppppp','........','........','........','........','PPPPPPPP','RNBQKBNR'].map(r=>r.split(''));
const isW=p=>p!=='.'&&p===p.toUpperCase();
function pseudo(b,w){const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p==='.'||isW(p)!==w)continue;const t=p.toLowerCase();
 const add=(r2,c2)=>{if(r2<0||r2>7||c2<0||c2>7)return false;const q=b[r2][c2];if(q==='.'){out.push([r,c,r2,c2]);return true}if(isW(q)!==w)out.push([r,c,r2,c2]);return false};
 if(t==='p'){const d=w?-1:1,s=w?6:1;if(r+d>=0&&r+d<8&&b[r+d][c]==='.'){out.push([r,c,r+d,c]);if(r===s&&b[r+2*d][c]==='.')out.push([r,c,r+2*d,c])}[-1,1].forEach(dc=>{const r2=r+d,c2=c+dc;if(r2>=0&&r2<8&&c2>=0&&c2<8&&b[r2][c2]!=='.'&&isW(b[r2][c2])!==w)out.push([r,c,r2,c2])})}
 else if(t==='n')[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,d])=>add(r+a,c+d));
 else if(t==='k'){for(let a=-1;a<=1;a++)for(let d=-1;d<=1;d++)if(a||d)add(r+a,c+d)}
 else{const D=t==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:t==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];D.forEach(([a,d])=>{let r2=r+a,c2=c+d;while(add(r2,c2)&&b[r2][c2]==='.'){r2+=a;c2+=d}})}}return out}
function doM(b,m){const[r,c,r2,c2]=m,p=b[r][c],cap=b[r2][c2];m[4]=p;b[r2][c2]=(p==='P'&&r2===0)?'Q':(p==='p'&&r2===7)?'q':p;b[r][c]='.';return cap}
function undo(b,m,cap){b[m[0]][m[1]]=m[4];b[m[2]][m[3]]=cap}
function inCheck(b,w){let kr=-1,kc=-1;const K=w?'K':'k';for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]===K){kr=r;kc=c}if(kr<0)return true;return pseudo(b,!w).some(m=>m[2]===kr&&m[3]===kc)}
function legal(b,w){return pseudo(b,w).filter(m=>{const cap=doM(b,m),ok=!inCheck(b,w);undo(b,m,cap);return ok})}
function evalB(b){let s=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p==='.')continue;const v=VAL[p.toLowerCase()]+(Math.abs(3.5-r)<2&&Math.abs(3.5-c)<2?10:0);s+=isW(p)?v:-v}return s}
function ab(b,d,al,be,w){if(d===0)return evalB(b);const ms=legal(b,w);if(!ms.length)return inCheck(b,w)?(w?-99999-d:99999+d):0;
 if(w){let v=-Infinity;for(const m of ms){const cap=doM(b,m);v=Math.max(v,ab(b,d-1,al,be,false));undo(b,m,cap);al=Math.max(al,v);if(al>=be)break}return v}
 let v=Infinity;for(const m of ms){const cap=doM(b,m);v=Math.min(v,ab(b,d-1,al,be,true));undo(b,m,cap);be=Math.min(be,v);if(al>=be)break}return v}
function runChess(b,st,end){const bd=cInit();let sel=null,tg=[],turn=true,over=false;
 const lv=document.createElement('select');[['1','Easy'],['2','Normal'],['3','Hard']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;lv.appendChild(o)});lv.value='2';
 const g=mk('div','g g8 gch'),cells=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=mk('button','cell ch '+((r+c)%2?'dk':'lt'),'');x.type='button';x.onclick=()=>click(r,c);g.appendChild(x);cells.push(x)}
 const draw=()=>cells.forEach((x,i)=>{const r=Math.floor(i/8),c=i%8,p=bd[r][c];x.textContent=p==='.'?'':CHS[p];x.classList.toggle('sel',!!sel&&sel[0]===r&&sel[1]===c);x.classList.toggle('tg',tg.some(m=>m[2]===r&&m[3]===c))});
 const status=()=>st.textContent=turn?(inCheck(bd,true)?'Check! Your move.':'Your move (white).'):'MINE is thinking…';
 function after(){const ms=legal(bd,turn);if(ms.length)return false;over=true;if(inCheck(bd,turn))end(turn?'l':'w',turn?'Checkmate. MINE wins.':'Checkmate! You win!');else end('d','Stalemate.');return true}
 function click(r,c){if(!turn||over)return;const p=bd[r][c],m=tg.find(m=>m[2]===r&&m[3]===c);
  if(m){doM(bd,m);sel=null;tg=[];turn=false;draw();if(after())return;status();setTimeout(ai,60);return}
  if(p!=='.'&&isW(p)){sel=[r,c];tg=legal(bd,true).filter(m=>m[0]===r&&m[1]===c)}else{sel=null;tg=[]}draw()}
 function ai(){const d=+lv.value;let best=null,bv=Infinity;shuf(legal(bd,false)).forEach(m=>{const cap=doM(bd,m),v=d===1?evalB(bd)+(Math.random()-.5)*150:ab(bd,d-1,-Infinity,Infinity,true);undo(bd,m,cap);if(v<bv){bv=v;best=m}});
  doM(bd,best);turn=true;draw();if(!after())status()}
 b.append(btn('Resign',()=>{if(!over){over=true;end('l','You resigned.')}}),lv,g);draw();st.textContent='You are white ♙. Tap a piece, then a green square. (No castling or en passant.)'}
/* ---- Ludo (2 players: you vs MINE, 4 tokens each) ---- */
function runLudo(b,st,end){
 const START=[0,26],SAFE=new Set([0,8,13,21,26,34,39,47]),T=[[-1,-1,-1,-1],[-1,-1,-1,-1]];let turn=0,rl=0,pending=false,over=false;
 const gi=(p,r)=>(START[p]+r)%52,ang=i=>i/52*2*Math.PI-Math.PI/2;
 function xy(p,i,r){if(r<0)return[95+i*45,p===0?18:302];if(r<=50){const a=ang(gi(p,r));return[160+125*Math.cos(a),160+125*Math.sin(a)]}const a=ang((START[p]+51)%52),R=r===56?6+i*5:100-(r-51)*18;return[160+R*Math.cos(a),160+R*Math.sin(a)]}
 const can=(p,i,x)=>{const r=T[p][i];return r<0?x===6:r+x<=56},movable=(p,x)=>[0,1,2,3].filter(i=>can(p,i,x));
 function apply(p,i,x){const r=T[p][i]<0?0:T[p][i]+x;T[p][i]=r;let cap=false;if(r<=50&&!SAFE.has(gi(p,r))){const o=1-p;T[o].forEach((q,k)=>{if(q>=0&&q<=50&&gi(o,q)===gi(p,r)){T[o][k]=-1;cap=true}})}return cap}
 const bx=mk('div','ludo'),info=mk('div','qq','');
 function draw(mv){let s='<svg viewBox="0 0 320 320" class="lsvg">';
  for(let i=0;i<52;i++){const a=ang(i);s+='<circle cx="'+(160+125*Math.cos(a)).toFixed(1)+'" cy="'+(160+125*Math.sin(a)).toFixed(1)+'" r="7" fill="'+(i===0?'#d65c5c88':i===26?'#4a6fa588':SAFE.has(i)?'#d9a44166':'#8884')+'"/>'}
  [0,1].forEach(p=>{const a=ang((START[p]+51)%52);for(let k=0;k<5;k++){const R=100-k*18;s+='<circle cx="'+(160+R*Math.cos(a)).toFixed(1)+'" cy="'+(160+R*Math.sin(a)).toFixed(1)+'" r="7" fill="'+(p?'#4a6fa5':'#d65c5c')+'66"/>'}});
  s+='<text x="8" y="22" font-size="11" fill="#d65c5c">You</text><text x="8" y="312" font-size="11" fill="#4a6fa5">MINE</text>';
  T.forEach((tp,p)=>tp.forEach((r,i)=>{const[x,y]=xy(p,i,r),m=p===0&&mv.includes(i);s+='<circle data-t="'+i+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(m?10:8)+'" fill="'+(p?'#4a6fa5':'#d65c5c')+'" stroke="'+(m?'#fff':'#000')+'" stroke-width="'+(m?3:1)+'"'+(p?' pointer-events="none"':'')+'/>'}));
  bx.innerHTML=s+'</svg>'}
 function humanRoll(){if(over||turn!==0||pending)return;rl=d6();const mv=movable(0,rl);info.textContent='You rolled '+rl;if(!mv.length){info.textContent+=' — no move.';turn=1;setTimeout(mineTurn,900);return}pending=true;draw(mv)}
 function pick(i){if(!pending||!movable(0,rl).includes(i))return;pending=false;const cap=apply(0,i,rl);draw([]);if(T[0].every(x=>x===56)){over=true;end('w','All four tokens home!');return}
  info.textContent='You rolled '+rl+(cap?' — captured!':'');if(rl===6){info.textContent+=' Roll again.';return}turn=1;setTimeout(mineTurn,800)}
 function mineTurn(){if(over)return;rl=d6();const mv=movable(1,rl),msg='MINE rolled '+rl;if(!mv.length){info.textContent=msg+' — no move.';turn=0;return}
  let best=mv[0],bs=-1;mv.forEach(i=>{const r=T[1][i],n=r<0?0:r+rl;let s=n*.1;if(r<0)s+=60;if(n===56)s+=90;else if(n>50)s+=40;if(n<=50&&SAFE.has(gi(1,n)))s+=30;if(n<=50&&!SAFE.has(gi(1,n))&&T[0].some(q=>q>=0&&q<=50&&gi(0,q)===gi(1,n)))s+=100;if(s>bs){bs=s;best=i}});
  const cap=apply(1,best,rl);draw([]);if(T[1].every(x=>x===56)){over=true;end('l','MINE got all tokens home.');return}
  info.textContent=msg+(cap?' — captured your token!':'');if(rl===6)setTimeout(mineTurn,900);else turn=0}
 bx.onclick=e=>{const t=e.target.closest('[data-t]');if(t)pick(+t.dataset.t)};
 b.append(info,btn('🎲 Roll',humanRoll),bx);draw([]);st.textContent='Roll a 6 to leave base. Reach the centre with all 4. Landing on a non-star square captures. 6 = roll again.'}
/* ---- Game registry ---- */
const GAMES=[
{id:'chess',e:'♟️',n:'Chess',d:'Vs MINE, 3 levels',run:runChess,s:'Board'},{id:'ludo',e:'🎲',n:'Ludo',d:'You vs MINE, 4 tokens each',run:runLudo,s:'Board'},
{id:'ttt',e:'❌',n:'Tic-Tac-Toe',d:'She plays smart',run:runTTT,s:'Board'},{id:'c4',e:'🔴',n:'Connect 4',d:'Four in a row',run:runC4,s:'Board'},{id:'nim',e:'🥢',n:'Nim',d:'Don’t take the last stick',run:runNim,s:'Board'},
{id:'mines',e:'💣',n:'Minesweeper',d:'8×8, 10 mines',run:runMines,s:'Puzzle'},{id:'lights',e:'💡',n:'Lights Out',d:'5×5 puzzle',run:runLights,s:'Puzzle'},{id:'mem',e:'🃏',n:'Memory Match',d:'Find the pairs',run:runMem,s:'Puzzle'},{id:'scr',e:'🔤',n:'Word Scramble',d:'5 words',run:runScr,s:'Puzzle'},{id:'hang',e:'🪢',n:'Hangman',d:'6 lives',run:runHang,s:'Puzzle'},
{id:'rps',e:'✌️',n:'Rock Paper Scissors',d:'Best of 5',run:runRPS,s:'Quick'},{id:'dice',e:'🎲',n:'Dice Duel',d:'3 rounds',run:runDice,s:'Quick'},{id:'guess',e:'🔢',n:'Number Guess',d:'1-100, 7 tries',run:runGuess,s:'Quick'},{id:'math',e:'➗',n:'Math Race',d:'10 sums vs MINE',run:runMath,s:'Quick'},
{id:'react',e:'⚡',n:'Reaction Test',d:'Under 350 ms',run:runReact,s:'Arcade'},{id:'simon',e:'🎵',n:'Simon',d:'Repeat the pattern',run:runSimon,s:'Arcade'},{id:'whack',e:'🐹',n:'Whack-a-Mole',d:'20 seconds',run:runWhack,s:'Arcade'}];
const CHATG=[['20q','❓','20 Questions (you think)','You secretly think of something, MINE guesses.','Let’s play 20 Questions. I secretly think of something (a character, object or animal) and you ask me yes/no questions, one at a time, to guess it. Count the questions and tell me if you win or lose. Ask your first question.'],
['20q2','🕵️','20 Questions (MINE thinks)','MINE thinks of something, you guess.','Let’s play 20 Questions. You secretly think of something (never reveal it until the end). I ask yes/no questions and you answer honestly. Count my questions. Say you’re ready and wait for me.'],
['chain','🔗','Word Chain','Each word starts with the last letter.','Let’s play Word Chain: each word must start with the last letter of the previous word, no repeats, real words only. You start. One word per turn plus a tiny comment. Whoever fails loses.'],
['riddle','🧩','Riddles','She asks, you solve.','Let’s play Riddles. Give me one riddle at a time, wait for my answer, give a hint if I’m stuck, and keep score.'],
['tod','🎭','Truth or Dare','Clean and fun.','Let’s play Truth or Dare. Ask me one at a time. Keep it clean and fun, and do your own dare or truth when I ask you.'],
['wyr','🤔','Would You Rather','Silly dilemmas.','Let’s play Would You Rather. Give me a funny dilemma, react to my answer, then give the next one. Also answer your own.'],
['story','📖','Story Relay','Write a story together.','Let’s write a story together. You write 2 sentences, I add 2 sentences, and we alternate. Start with a fun opening.'],
['emoji','😎','Emoji Guess','Guess the movie, anime or phrase.','Let’s play Emoji Guess. Give me emojis that represent a movie, anime, game or phrase, and I guess. Keep score.'],
['trivia','🧠','Trivia Battle','Score points vs MINE.','Let’s play Trivia Battle. Ask me one general-knowledge question at a time with 4 options, keep our score, and answer one yourself every 3rd question.'],
['ttl','🤥','Two Truths One Lie','Spot the lie.','Let’s play Two Truths and One Lie. Tell me three statements about yourself (make them fun), I guess the lie, then I tell you mine.'],
['nhie','🙈','Never Have I Ever','Confessions, clean edition.','Let’s play Never Have I Ever. Keep it clean and funny. Say one, I answer, then I say one and you answer.'],
['rap','🎤','Rhyme Battle','Clean rhyme battle.','Let’s have a friendly rhyme battle. You drop 4 rhyming lines about me, I reply with 4 about you, and we score each round. Keep it clean.'],
['anime','🍥','Anime Quiz','Test your anime knowledge.','Let’s play an anime quiz. Ask me one question at a time (characters, quotes, plots; no spoilers), keep score and give me hints if I ask.'],
['tot','⚖️','This or That','Quick-fire choices.','Let’s play This or That. Give me two options, I pick fast, and you tell me what my choice says about me. Then your turn.']];
const gClose=()=>{GT.forEach(clearInterval);GT=[];GP.hidden=true};
function hub(){
 GT.forEach(clearInterval);GT=[];GV.hidden=true;GB.hidden=false;GB.innerHTML='';
 GB.appendChild(mk('div','ex','Games you can play inside the app: '+GAMES.length+'. Chat games with MINE: '+CHATG.length+'.'));
 let sec=null;GAMES.forEach(g=>{if(g.s!==sec){sec=g.s;GB.appendChild(mk('div','lab',g.s+' games'))}
  const s=GS[g.id]||{w:0,l:0,d:0},c=mk('button','gc',g.e+'  '+g.n+' — '+g.d+(s.w+s.l+s.d?'   [W'+s.w+' L'+s.l+' D'+s.d+']':''));c.type='button';c.onclick=()=>gopen(g);GB.appendChild(c)});
 GB.appendChild(mk('div','lab','Chat games (talk with MINE)'));
 CHATG.forEach(([id,e,n,d,p])=>{const c=mk('button','gc',e+'  '+n+' — '+d);c.type='button';c.onclick=()=>{if(busy)return;gClose();if(chat().msgs.length)newChat();save();render();renderList();ask(p+' Keep each turn short.')};GB.appendChild(c)});
}
function gopen(g){
 GT.forEach(clearInterval);GT=[];GB.hidden=true;GV.hidden=false;GV.innerHTML='';
 const top=mk('div','sh');top.append(btn('← Games',hub),mk('b','',g.e+' '+g.n));
 const st=mk('div','ex'),body=mk('div','gbody'),ctl=mk('div','row');GV.append(top,st,body,ctl);let ended=false;
 const end=(r,msg)=>{if(ended)return;ended=true;body.classList.add('gdone');gscore(g.id,r);st.textContent=(r==='w'?'🏆 ':r==='l'?'💀 ':'🤝 ')+msg+'\n'+quip(r);
  ctl.append(btn('Play again',()=>gopen(g)),btn('Chat about it',()=>{gClose();ask('I just played '+g.n+' with you. Result: '+msg+' React to it.')}))};
 g.run(body,st,end);
}
$('gmb').addEventListener('click',()=>{$('wb').hidden=true;$('mp').hidden=true;$('sp').hidden=true;set.hidden=true;GP.hidden=false;hub()});
$('gx').addEventListener('click',gClose);
