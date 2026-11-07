import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));

function colour(context, css, fallback) {
  context.fillStyle = fallback;
  context.fillStyle = css;
  const value = context.fillStyle;
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  return (value.match(/[\d.]+/g) || [20, 195, 202]).slice(0, 3).map(Number);
}

/* Two independently lit surfaces weave together in perspective. No textures,
   external runtime, generated imagery or pointer-dependent playback. */
export default function ConnectionSculpture() {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!host || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1, height = 1, ratio = 1, frame = 0, last = 0, elapsed = 0;
    let visible = false, entrance = 0, targetTilt = 0, tilt = 0, lastStamp = -1;
    let accent, ink, dark;
    function palette() {
      const style = getComputedStyle(host);
      accent = colour(context, style.getPropertyValue("--v-accent").trim(), "#14c3ca");
      ink = colour(context, style.getPropertyValue("--v-ink").trim(), "#101b20");
      dark = document.documentElement.dataset.theme === "dark";
    }
    function point(u, v, strand, time, reveal) {
      const phase = u * TAU * .86 + time * .34 + strand * Math.PI;
      const taper = .18 + .82 * Math.pow(Math.sin(Math.PI * u), .45);
      const spread = 76 * taper * v;
      const twist = phase + .7 * Math.sin(u * Math.PI);
      let x = (u - .5) * 410 + (strand ? 1 : -1) * (1 - reveal) * 105;
      let y = Math.sin(phase) * 67 + spread * Math.cos(twist);
      let z = Math.cos(phase) * 65 + spread * Math.sin(twist);
      const turn = tilt * .35 + (1 - reveal) * .6;
      const xx = x * Math.cos(turn) + z * Math.sin(turn);
      z = -x * Math.sin(turn) + z * Math.cos(turn);
      x = xx;
      const yy = y * .92 - z * .38;
      z = y * .38 + z * .92;
      y = yy;
      const roll = -.19 + Math.sin(time * .18) * .055;
      const screenX = x * Math.cos(roll) - y * Math.sin(roll);
      const screenY = x * Math.sin(roll) + y * Math.cos(roll);
      const perspective = 720 / (720 - z);
      return { x: screenX * perspective, y: screenY * perspective, z, phase, v };
    }
    function draw() {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width / 490, height / 310);
      const reveal = reduced.matches ? 1 : 1 - Math.pow(1 - clamp(entrance / 1.15), 3);
      const time = reduced.matches ? 1.8 : elapsed;
      const faces = [], along = 72, across = 8;
      for (let strand = 0; strand < 2; strand++) {
        const rows = [];
        for (let i = 0; i <= along; i++) {
          rows.push(Array.from({ length: across + 1 }, (_, j) => point(i / along, j / across - .5, strand, time, reveal)));
        }
        for (let i = 0; i < along; i++) for (let j = 0; j < across; j++) {
          const corners = [rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]];
          faces.push({ corners, strand, phase: corners[0].phase, v: (j + .5) / across - .5, z: corners.reduce((sum, p) => sum + p.z, 0) / 4 });
        }
      }
      faces.sort((a, b) => a.z - b.z);
      context.save();
      context.translate(width / 2, height / 2 - 4);
      context.scale(scale, scale);
      const shadow = context.createRadialGradient(5, 126, 3, 5, 126, 150);
      shadow.addColorStop(0, dark ? "#00000032" : "#101b2017");
      shadow.addColorStop(1, "#101b2000");
      context.save(); context.translate(0, 126); context.scale(1, .13); context.translate(0, -126);
      context.fillStyle = shadow; context.fillRect(-180, -24, 360, 300); context.restore();
      for (const face of faces) {
        const material = face.strand ? ink : accent;
        const light = .66 + .34 * Math.cos(face.phase - .9);
        const sheen = Math.pow(Math.max(0, Math.cos(face.v * Math.PI * 1.4 + face.phase * .55)), 12) * (face.strand ? .27 : .42);
        const rgb = material.map(channel => Math.round(clamp(channel * light + (255 - channel) * sheen, 0, 255)));
        context.beginPath();
        face.corners.forEach((p, index) => index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y));
        context.closePath();
        context.fillStyle = `rgb(${rgb.join(",")})`;
        context.strokeStyle = context.fillStyle;
        context.lineWidth = .45;
        context.fill(); context.stroke();
      }
      context.restore();
      const stamp = Math.floor(elapsed * 2);
      if (stamp !== lastStamp) { host.dataset.frame = String(stamp); lastStamp = stamp; }
    }
    function tick(now) {
      frame = 0;
      const delta = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now;
      elapsed += delta; entrance += delta;
      tilt += (targetTilt - tilt) * .05;
      draw();
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      host.dataset.motion = visible && !document.hidden && !reduced.matches ? "running" : "still";
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
      else draw();
    }
    function scroll() {
      const bounds = host.getBoundingClientRect();
      targetTilt = clamp((bounds.top + bounds.height / 2) / window.innerHeight, 0, 1) * 2 - 1;
    }
    function resize() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      scroll(); palette(); draw();
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) entrance = 0;
      visible = entry.isIntersecting; scroll(); update();
    }, { threshold: .12 });
    const resizeObserver = new ResizeObserver(resize);
    const appearance = new MutationObserver(() => { palette(); draw(); });
    palette(); resize(); observer.observe(host); resizeObserver.observe(host);
    appearance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-template", "style"] });
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); appearance.disconnect();
      window.removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return <div ref={hostRef} className="ih-sculpture-art" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
