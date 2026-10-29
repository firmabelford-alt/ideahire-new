import { createElement, Fragment, useEffect, useRef, useState } from 'react';

export function LucynaWords({text,animate=false}) {
  return String(text || '').split(/(\s+)/).map((part,index)=>/\S/.test(part)
    ? createElement('span',{key:index,className:animate?'lu-word-in':undefined},part)
    : createElement(Fragment,{key:index},part));
}

// Presentation only: reveal an answer already received, never simulate an AI result.
export function useLucynaReveal(text, enabled = false) {
  const target = String(text || '');
  const [shown,setShown] = useState(() => enabled ? '' : target);
  const [reduced,setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const state = useRef({target:'',cursor:0,skip:false,frame:0});
  useEffect(() => {
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);
    update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(() => {
    const current=state.current;
    cancelAnimationFrame(current.frame);
    if (!target.startsWith(current.target)) {current.cursor=0;current.skip=false;setShown('');}
    current.target=target;
    if (!enabled || reduced || current.skip) {current.cursor=target.length;setShown(target);return;}
    let last=performance.now();
    const tick=now=>{
      const elapsed=Math.min(80,Math.max(0,now-last));last=now;
      current.cursor=Math.min(target.length,current.cursor+Math.max(45,target.length/9)*elapsed/1000);
      let end=Math.floor(current.cursor);
      if(end<target.length && /[\uD800-\uDBFF]/.test(target[end-1] || ''))end--;
      setShown(target.slice(0,end));
      if(current.cursor<target.length && !current.skip)current.frame=requestAnimationFrame(tick);
    };
    current.frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(current.frame);
  },[target,enabled,reduced]);
  function revealAll() {
    const current=state.current;current.skip=true;current.cursor=current.target.length;
    cancelAnimationFrame(current.frame);setShown(current.target);
  }
  const visible=!enabled || reduced ? target : target.startsWith(shown) ? shown : '';
  return {text:visible,revealing:visible!==target,revealAll,motionEnabled:enabled && !reduced};
}
