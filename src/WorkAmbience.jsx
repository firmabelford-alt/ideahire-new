import React, { useEffect, useRef } from 'react';

export default function WorkAmbience() {
  const ref = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const paint = () => {
      frame = 0;
      ref.current?.style.setProperty('--work-scroll', `${Math.min(32, window.scrollY * .035)}px`);
    };
    const scroll = () => { if (!media.matches && !frame) frame = requestAnimationFrame(paint); };
    const preference = () => { if (media.matches) { cancelAnimationFrame(frame); frame = 0; ref.current?.style.removeProperty('--work-scroll'); } else scroll(); };
    window.addEventListener('scroll', scroll, { passive: true });
    media.addEventListener?.('change', preference);
    scroll();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); media.removeEventListener?.('change', preference); };
  }, []);
  return <div className="ih-work-ambience" ref={ref} aria-hidden="true"><div><i /><i /><i /></div></div>;
}
