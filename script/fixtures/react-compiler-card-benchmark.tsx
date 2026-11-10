/** Instrument an opt-in compiler card boundary with stable records and a stable renderer.
 * This browser-only fixture never imports a production page or writes real API data.
 */
import React, {Profiler, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  ExperimentalCardCollection,
  type CardRecord,
} from '@/components/cards/experimental/React19CardBoundaries';

type Sample = {phase:string; actualDurationMs:number; baseDurationMs:number};
declare global {
  interface Window {
    __zayCompilerBenchmark?: {renderCalls:number; samples:Sample[]};
  }
}
const RECORDS:readonly CardRecord[] = Array.from({length:120}, (_,i)=>({
  id:`fixture-${i}`,title:`Sample Place ${i+1}`,category:i%2?'place':'event',
}));
const metrics = {renderCalls:0, samples:[] as Sample[]};
window.__zayCompilerBenchmark = metrics;
const render = (record:CardRecord) => {
  metrics.renderCalls++;
  return <article data-card-record={record.id}>{record.title}</article>;
};

function Benchmark() {
  const [tick,setTick] = useState(0);
  useEffect(()=>{
    const onTick=()=>setTick(value=>value+1);
    window.addEventListener('zaylist-compiler-benchmark-tick',onTick);
    return ()=>window.removeEventListener('zaylist-compiler-benchmark-tick',onTick);
  },[]);
  return <main>
    <output id="benchmark-tick">{tick}</output>
    <Profiler id="compiler-experimental-cards" onRender={(_id,phase,actualDurationMs,baseDurationMs)=>{
      metrics.samples.push({phase,actualDurationMs,baseDurationMs});
    }}>
      <ExperimentalCardCollection records={RECORDS} render={render} />
    </Profiler>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Benchmark />);
