#!/usr/bin/env node
/* 文渊八年级卡片生图：ChatGPT CDP、逐卡片下载、按 ID 改名、写回 cards.md。 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { writeFile, rename, appendFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname);
const SUBJECTS = ['语文','数学','英语','科学','历史','地理','道德与法治'];
const TERMS = ['八年级上册','八年级下册'];
const EXT = ['.png','.webp','.jpg','.jpeg'];
const STATE_FILE = join(ROOT, '文渊八年级生图状态.json');
const LOG_FILE = join(ROOT, '文渊八年级生图日志.jsonl');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ensure = p => mkdirSync(p, { recursive: true });

function parseArgs(argv) {
  const a={run:false,dry:false,port:9221,wait:300,limit:0,retry:false};
  for(let i=0;i<argv.length;i++){const x=argv[i];
    if(x==='--run')a.run=true; else if(x==='--dry-run')a.dry=true;
    else if(x==='--retry-failed')a.retry=true; else if(x==='--port')a.port=+argv[++i];
    else if(x==='--wait-seconds')a.wait=+argv[++i]; else if(x==='--limit')a.limit=+argv[++i];
    else if(x==='--only')a.only=new Set(argv[++i].split(',').map(s=>s.trim()));
    else if(x==='--state')a.state=resolve(argv[++i]); else if(x==='-h'||x==='--help')a.help=true;
    else throw Error(`未知参数：${x}`);
  } return a;
}
function help(){console.log(`用法：\n  node generate_wenyuan_grade8_images.mjs --dry-run\n  node generate_wenyuan_grade8_images.mjs --run\n  node generate_wenyuan_grade8_images.mjs --run --limit 10\n  node generate_wenyuan_grade8_images.mjs --run --retry-failed\n  node generate_wenyuan_grade8_images.mjs --run --only ZJM8A-01-001,C8A-01-001`)}
function walk(dir){if(!existsSync(dir))return[];let a=[];for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);e.isDirectory()?a.push(...walk(p)):a.push(p)}return a}

function scan(){const jobs=[]; for(const subject of SUBJECTS)for(const term of TERMS){const termDir=join(ROOT,subject,term);for(const cardFile of walk(termDir).filter(p=>basename(p)==='cards.md')){
  const text=readFileSync(cardFile,'utf8').replace(/^\uFEFF/,''); const blocks=text.split(/(?=^##\s+\d+\.\s+)/m);
  for(const block of blocks){const id=block.match(/^##\s+\d+\.\s+([^\r\n]+)/m)?.[1]?.trim();const rel=block.match(/^-\s*提示词\s*[：:]\s*([^\r\n]+)/m)?.[1]?.trim();if(!id||!rel)continue;
    const promptFile=resolve(dirname(cardFile),rel.replaceAll('/', '\\'));if(!existsSync(promptFile))throw Error(`找不到提示词：${promptFile}`);
    const unit=dirname(cardFile), fig=join(unit,'figures'), image=EXT.map(e=>join(fig,id+e)).find(existsSync);const embedded=new RegExp(`!\\[配图\\]\\(figures/${id.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}\\.(?:png|webp|jpg|jpeg)\\)`).test(block);
    jobs.push({key:`${subject}/${term}/${relative(termDir,unit)}/${id}`,subject,term,id,cardFile,promptFile,fig,image,embedded});
  }
}} return jobs}
function load(p){try{return existsSync(p)?JSON.parse(readFileSync(p,'utf8')):{jobs:{}}}catch{return{jobs:{}}}}
function save(p,s){ensure(dirname(p));writeFileSync(p,JSON.stringify(s,null,2)+'\n','utf8')}
function embed(file,id,image){let text=readFileSync(file,'utf8');const rel=`figures/${basename(image)}`;const parts=text.split(/(?=^##\s+\d+\.\s+)/m);let changed=false;const out=parts.map(b=>{if(!new RegExp(`^##\\s+\\d+\\.\\s+${id.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}(?:\\s|$)`,'m').test(b))return b;const ls=b.split(/\r?\n/).filter(x=>!/^!\[配图\]\(figures\/[^)]+\)$/.test(x.trim()));while(ls.at(-1)==='')ls.pop();ls.push(`![配图](${rel})`,'');changed=true;return ls.join('\n')});if(changed)writeFileSync(file,out.join('\n'),'utf8')}

async function json(url,opt){const r=await fetch(url,opt);if(!r.ok)throw Error(`${r.status} ${r.statusText}`);return r.json()}
class CDP{constructor(url){this.ws=new WebSocket(url);this.n=0;this.p=new Map()}async open(){await new Promise((ok,no)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',()=>no(Error('无法连接 Chrome CDP')),{once:true})});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data),p=this.p.get(m.id);if(!p)return;this.p.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)})}call(method,params={}){const id=++this.n;return new Promise((resolve,reject)=>{this.p.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}async ev(expr,awaitPromise=false){const r=await this.call('Runtime.evaluate',{expression:expr,awaitPromise,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'页面脚本错误');return r.result?.value}close(){this.ws.close()}}
async function connect(port,newTab=false){const base=`http://127.0.0.1:${port}`;let page;if(newTab)page=await json(`${base}/json/new?https://chatgpt.com/`,{method:'PUT'});else{const ts=await json(`${base}/json/list`);page=ts.filter(x=>x.type==='page'&&/^https:\/\/chatgpt\.com\//i.test(x.url)).at(-1)||await json(`${base}/json/new?https://chatgpt.com/`,{method:'PUT'})}const c=new CDP(page.webSocketDebuggerUrl);await c.open();await c.call('Runtime.enable');await c.call('Page.enable');return c}
const HELP=`window.__wy={before:new Set(),beforeText:new Set(),imgs(){return [...document.querySelectorAll('[class~="group/imagegen-image"] img')].map(x=>x.currentSrc).filter(Boolean)},texts(){return [...document.querySelectorAll('[data-message-author-role="assistant"]')].map(x=>(x.innerText||x.textContent||'').trim()).filter(Boolean)},mark(){this.before=new Set(this.imgs());this.beforeText=new Set(this.texts())},new(){return this.imgs().filter(x=>!this.before.has(x)).at(-1)||null},newText(){return this.texts().filter(x=>!this.beforeText.has(x)).at(-1)||null},send(){const b=document.querySelector('[data-testid="send-button"]')||[...document.querySelectorAll('button')].find(x=>/send|发送/i.test((x.ariaLabel||'')+' '+x.textContent)&&!x.disabled);if(!b)return false;b.click();return true}}`;
async function send(c,p){const ok=await c.ev(`(()=>{const e=[...document.querySelectorAll('#prompt-textarea,textarea:not([hidden]),[contenteditable=true]')].find(x=>x.getClientRects().length);if(!e)return false;e.focus();if(e.tagName==='TEXTAREA')e.select();else{const r=document.createRange();r.selectNodeContents(e);const s=getSelection();s.removeAllRanges();s.addRange(r)}window.__wyPrompt=e;return true})()`);if(!ok)throw Error('找不到 ChatGPT 输入框');await c.call('Input.insertText',{text:p});for(let i=0;i<30;i++){if(await c.ev('window.__wy.send()'))return;await sleep(1000)}throw Error('无法发送提示词')}
async function waitImage(c,sec){const end=Date.now()+sec*1000,grace=Date.now()+30000;while(Date.now()<end){const u=await c.ev('window.__wy.new()');if(u)return {kind:'image',url:u};if(Date.now()>grace){const t=await c.ev('window.__wy.newText()');if(t)return {kind:'text',text:t}}await sleep(1000)}throw Error('等待生图超时')}
async function logEvent(event){await appendFile(LOG_FILE,JSON.stringify({time:new Date().toISOString(),...event})+'\n','utf8')}
async function download(c,url,dir,id){const data=await c.ev(`(async()=>{const r=await fetch(${JSON.stringify(url)},{credentials:'include'}),b=await r.blob(),f=new FileReader();return await new Promise((ok,no)=>{f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(b)})})()`,true);const m=data.match(/^data:image\/([^;]+);base64,(.+)$/);if(!m)throw Error('图片数据异常');const ext=m[1].includes('webp')?'.webp':m[1].includes('jpeg')?'.jpg':'.png';ensure(dir);const tmp=join(dir,`.${id}.downloading${ext}`),out=join(dir,id+ext);await writeFile(tmp,Buffer.from(m[2],'base64'));await rename(tmp,out);return out}

async function main(){let a;try{a=parseArgs(process.argv.slice(2))}catch(e){console.error(e.message);return}if(a.help||(!a.run&&!a.dry)){help();return}const stateFile=a.state||STATE_FILE,state=load(stateFile);let jobs;try{jobs=scan()}catch(e){console.error(e.message);return}if(a.only)jobs=jobs.filter(j=>a.only.has(j.id));
  // 目录中的图片是最终判定依据：存在就不再调用 ChatGPT。
  let pending=jobs.filter(j=>!j.image); console.log(`扫描 ${jobs.length} 张，待生图 ${pending.length} 张，已有图片 ${jobs.length-pending.length} 张`);
  if(a.dry){for(const subject of SUBJECTS){const all=jobs.filter(j=>j.subject===subject),todo=pending.filter(j=>j.subject===subject);console.log(`${subject}：共 ${all.length} 张，待生图 ${todo.length} 张，已有图片 ${all.length-todo.length} 张`)}const show=a.limit>0?pending.slice(0,a.limit):pending;show.forEach(j=>console.log(`${j.subject} / ${j.term} / ${j.id}  ${j.cardFile}`));return}
  // 已有图片但尚未嵌入时，只补写 Markdown；已有图片且已嵌入时直接记为完成。
  for(const j of jobs.filter(x=>x.image)){if(!j.embedded){embed(j.cardFile,j.id,j.image);console.log('补嵌入 '+j.image)}state.jobs[j.key]={status:'done',id:j.id,image:j.image};save(stateFile,state)}
  const list=pending.filter(j=>a.retry||state.jobs[j.key]?.status!=='failed').slice(0,a.limit||Infinity);if(!list.length)return;
  let c=await connect(a.port);try{await c.ev(HELP);for(const j of list){state.jobs[j.key]={status:'running',id:j.id,cardFile:j.cardFile};save(stateFile,state);let finished=false;for(let attempt=1;attempt<=2&&!finished;attempt++){try{console.log(`生成 ${j.key}（第${attempt}次）`);await c.ev('window.__wy.mark()');await send(c,readFileSync(j.promptFile,'utf8'));const result=await waitImage(c,a.wait);if(result.kind==='text'){await logEvent({type:'text-response',key:j.key,id:j.id,attempt,text:result.text});if(attempt===1){console.warn(`返回文字，换新标签页重试：${j.id}`);c.close();c=await connect(a.port,true);await c.ev(HELP);continue}state.jobs[j.key]={status:'skipped-text',id:j.id,error:'连续两次返回文字，已跳过'};save(stateFile,state);console.warn(`第二次仍返回文字，跳过：${j.id}`);finished=true;continue}const image=await download(c,result.url,j.fig,j.id);embed(j.cardFile,j.id,image);state.jobs[j.key]={status:'done',id:j.id,image};save(stateFile,state);console.log('完成 '+image);await sleep(1200);finished=true}catch(e){if(attempt===2){state.jobs[j.key]={status:'failed',error:e.message};save(stateFile,state);await logEvent({type:'error',key:j.key,id:j.id,error:e.message});console.error('失败 '+j.id+'：'+e.message);finished=true}else{await logEvent({type:'retry-error',key:j.key,id:j.id,attempt,error:e.message});console.warn(`第${attempt}次失败，换新标签页重试：${j.id}`);c.close();c=await connect(a.port,true);await c.ev(HELP)}}}}}finally{c.close()}}
main().catch(e=>console.error(e.stack||e.message));
