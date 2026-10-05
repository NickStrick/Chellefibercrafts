'use client';
import * as React from "react";
export function SeperatorWave({ type='', flip=false, waveClass='', color='var(--bg)', height=64, opacity=1 }: { opacity?:number; type?: string; flip?: boolean; waveClass?: string; color?: string; height?: number }) {
  if(!type || type.length === 0) return null;
  console.log('waveClass', waveClass);
  const d = [
  "M0,80 C480,-60 960,200 1440,80 L1440,180 L0,180 Z",
  "M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z",
  "M0,80 C480,0 960,0 1440,80 L1440,140 L0,140 Z",
  "M0,80 C480,120 960,120 1440,80 L1440,140 L0,140 Z",

];
const selectLegend = [
  "1-hill",
  "2-hill",
  "1-cave",
  "2-cave",
]
const selection: number = selectLegend.indexOf(type) || 0;

  return (
    <div className='relative'>
    <div className={`${waveClass}${flip ? ' rotate-180 bottom-wave' : ' top-wave'}`} aria-hidden>
      <svg viewBox="0 0 1440 140" className={`w-full !h-[${height}px]`} style={{height}} preserveAspectRatio="none" >
        <path d={d[selection]} fill={color} fillOpacity={opacity}/>
      </svg>
    </div>
    </div>
  );
}
