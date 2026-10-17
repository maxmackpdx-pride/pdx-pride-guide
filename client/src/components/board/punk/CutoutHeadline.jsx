import React,{useEffect,useRef,useState} from 'react';
import {RansomText,ransomContrast} from './RansomText';
function balancedLines(words,count,max,measure){
  const target=measure(words.join(' '))/count,memo=new Map();
  function fit(start,remaining){
    if(!remaining)return start===words.length?{cost:0,lines:[]}:null;
    const key=`${start}:${remaining}`;if(memo.has(key))return memo.get(key);
    let best=null;
    for(let end=start+1;end<=words.length-remaining+1;end++){
      const line=words.slice(start,end).join(' '),width=measure(line);if(width>max)break;
      const tail=fit(end,remaining-1);if(!tail)continue;
      const cost=tail.cost+(width-target)**2;
      if(!best||cost<best.cost)best={cost,lines:[line,...tail.lines]};
    }
    memo.set(key,best);return best;
  }
  return fit(0,count)?.lines;
}
export function CutoutHeadline({text,maxLines=2,ransom=false,seed=text,balance=false,minInset=14}) {
  const ref=useRef(null);const [lines,setLines]=useState([text]);const [truncated,setTruncated]=useState(false);
  useEffect(()=>{let alive=true;const split=()=>{if(!alive||!ref.current)return;const node=ref.current;const css=getComputedStyle(node);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');ctx.font=`${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;if(ransom)ctx.fontKerning="none";const strip=node.querySelector('.cut-line');const stripCss=strip?getComputedStyle(strip):null;const inset=stripCss?Math.max(minInset,parseFloat(stripCss.paddingLeft)+parseFloat(stripCss.paddingRight)+2):minInset;const max=Math.max(80,node.clientWidth-inset);const words=String(text).trim().toUpperCase().split(/\s+/);const result=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>max){result.push(line);line=word}else line=candidate}if(line)result.push(line);const balanced=balance&&result.length>1&&result.length<=maxLines?balancedLines(words,result.length,max,s=>ctx.measureText(s).width):null;const clipped=balanced||result.slice(0,maxLines);if(result.length>maxLines){let last=clipped[maxLines-1];while(last&&ctx.measureText(last+'…').width>max)last=last.slice(0,-1);clipped[maxLines-1]=last.trim()+'…'}const fittedLines=clipped.map(line=>{let fitted=line;while(fitted.length>1&&ctx.measureText(fitted).width>max)fitted=fitted.slice(0,-2)+'…';return fitted});setLines(fittedLines);setTruncated(fittedLines.join(' ')!==words.join(' '))};split();document.fonts.ready.then(split);const ro=new ResizeObserver(split);if(ref.current)ro.observe(ref.current);return()=>{alive=false;ro.disconnect()}},[text,maxLines,ransom,balance,minInset]);
  return <span ref={ref} className="cut-headline" data-truncated={truncated||undefined}>{lines.map((line,i)=><span className="cut-line" key={i}><span>{ransom?<RansomText text={line} seed={`${seed}:line-${i}`} contrast={ransomContrast(seed)}/>:line}</span></span>)}</span>
}
