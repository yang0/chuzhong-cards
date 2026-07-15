#!/usr/bin/env node
/* 统一文渊八年级卡片目录与卡片中的图片/提示词索引格式。 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname);
const SUBJECTS = ['语文','数学','英语','科学','历史','地理','道德与法治'];
const TERMS = ['八年级上册','八年级下册'];
const ensure = p => mkdirSync(p, { recursive: true });
function walk(dir){if(!existsSync(dir))return[];let a=[];for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);e.isDirectory()?a.push(...walk(p)):a.push(p)}return a}

let changed=0, units=0, cards=0;
for(const subject of SUBJECTS)for(const term of TERMS){
  const termDir=join(ROOT,subject,term);
  for(const cardFile of walk(termDir).filter(p=>p.endsWith('cards.md'))){
    const unitDir=cardFile.slice(0,-'cards.md'.length); const promptDir=join(unitDir,'prompts'); const figureDir=join(unitDir,'figures'); ensure(promptDir); ensure(figureDir);
    let text=readFileSync(cardFile,'utf8').replace(/^\uFEFF/,'');
    const blocks=text.split(/(?=^##\s+\d+\.\s+|^###\s+[^\r\n]*(?:（|\()[A-Za-z0-9]+-\d+-\d+(?:）|\)))/m);
    let seq=0;
    const out=blocks.map(block=>{
      const id=block.match(/^##\s+\d+\.\s+([^\r\n]+)/m)?.[1]?.trim() || block.match(/^###\s+[^\r\n]*?(?:（|\()([A-Za-z0-9]+-\d+-\d+)(?:）|\))/m)?.[1];
      if(!id)return block;
      cards++; seq++;
      // 地理原卡片使用 ### 卡片（ID），统一为所有学科共用的 ## 序号. ID。
      if(/^###\s+[^\r\n]*?(?:（|\()[A-Za-z0-9]+-\d+-\d+(?:）|\))/m.test(block))
        block=block.replace(/^###\s+[^\r\n]*?(?:（|\()([A-Za-z0-9]+-\d+-\d+)(?:）|\))[^\r\n]*$/m,`## ${seq}. ${id}`);
      let b=block.replace(new RegExp(`!\\[[^\\]]*\\]\\(figures/${id.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}\\.(?:png|webp|jpg|jpeg)\\)`,'g'),`![配图](figures/${id}.png)`);
      if(!/提示词\s*[：:]/.test(b)){
        const promptFile=join(promptDir,`${id}.md`);
        if(existsSync(promptFile)){
          const lines=b.split(/\r?\n/); const at=lines.findIndex(x=>/提示词|配图/.test(x));
          lines.splice(at>=0?at+1:1,0,`- 提示词：prompts/${id}.md`); b=lines.join('\n'); changed++;
        }
      }
      return b;
    });
    if(out.join('\n')!==text){writeFileSync(cardFile,out.join('\n'),'utf8');changed++}
    units++;
  }
}
console.log(`规范化完成：${units} 个单元目录，${cards} 张卡片，修改 ${changed} 处。`);
