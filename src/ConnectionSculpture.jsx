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

/* A living, locally steered flock. The animation evolves from its current
   state; there is no looping timeline, fixed silhouette or ribbon geometry. */
export default function ConnectionSculpture() {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!host || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const random = Math.random;
    const count = window.matchMedia("(max-width: 600px)").matches ? 520 : 760;
    const particles = Array.from({ length: count }, (_, index) => {
      const group = index < count / 2 ? -1 : 1;
      const a = random() * TAU, z = random() * 2 - 1;
      const r = Math.cbrt(random()), radial = Math.sqrt(1 - z * z);
      return {
        x: group * 88 + Math.cos(a) * radial * r * 90,
        y: Math.sin(a) * radial * r * 66,
        z: z * r * 66,
        vx: -group * (15 + random() * 12), vy: (random() - .5) * 22, vz: (random() - .5) * 22,
        ax: 0, ay: 0, az: 0, group, length: 3 + random() * 4.5, weight: .65 + random() * .8,
      };
    });
    const pointer = { active: false, x: 0, y: 0 };
    const focus = { x: 0, y: 0, z: 0 }, goal = { x: 0, y: 0, z: 0 };
    let width = 1, height = 1, ratio = 1, scale = 1;
    let frame = 0, last = 0, lastPaint = 0, elapsed = 0, nextTurn = 0;
    let visible = false, entrance = 0, targetTilt = 0, tilt = 0, lastStamp = -1, bursts = 0;
    let press = null, accent, ink;
    const cellKey = (x, y, z) => x + 32 + (y + 32) * 64 + (z + 32) * 4096;
    function palette() {
      const style = getComputedStyle(host);
      accent = colour(context, style.getPropertyValue("--v-action").trim() || style.getPropertyValue("--v-accent").trim(), "#19cbd3");
      ink = colour(context, style.getPropertyValue("--v-ink").trim(), "#101b20");
    }
    function simulate(dt) {
      if (elapsed >= nextTurn) {
        goal.x = (random() - .5) * 100; goal.y = (random() - .5) * 38; goal.z = (random() - .5) * 52;
        nextTurn = elapsed + 3 + random() * 3.5;
      }
      const follow = 1 - Math.exp(-dt * .65);
      for (const axis of ["x", "y", "z"]) focus[axis] += (goal[axis] - focus[axis]) * follow;
      // A spatial grid keeps local steering bounded instead of comparing every pair.
      const grid = new Map();
      particles.forEach((p, index) => {
        p.cx = Math.floor(p.x / 34); p.cy = Math.floor(p.y / 34); p.cz = Math.floor(p.z / 34);
        const key = cellKey(p.cx, p.cy, p.cz);
        const cell = grid.get(key);
        if (cell) cell.push(index); else grid.set(key, [index]);
      });
      particles.forEach((p, index) => {
        let neighbours = 0, px = 0, py = 0, pz = 0, vx = 0, vy = 0, vz = 0;
        let sx = 0, sy = 0, sz = 0;
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
          const cell = grid.get(cellKey(p.cx + x, p.cy + y, p.cz + z));
          if (!cell) continue;
          for (const neighbour of cell) {
            if (neighbour === index) continue;
            const q = particles[neighbour], dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z;
            const distance2 = dx * dx + dy * dy + dz * dz;
            if (distance2 >= 34 * 34 || distance2 < .01) continue;
            neighbours++; px += q.x; py += q.y; pz += q.z; vx += q.vx; vy += q.vy; vz += q.vz;
            if (distance2 < 14 * 14) {
              const distance = Math.sqrt(distance2), repel = (1 - distance / 14) * 27 / distance;
              sx += dx * repel; sy += dy * repel; sz += dz * repel;
            }
          }
        }
        let ax = (focus.x - p.x) * .055 + sx;
        let ay = (focus.y - p.y) * .095 + sy;
        let az = (focus.z - p.z) * .095 + sz;
        if (neighbours) {
          ax += (px / neighbours - p.x) * .15 + (vx / neighbours - p.vx) * .9;
          ay += (py / neighbours - p.y) * .15 + (vy / neighbours - p.vy) * .9;
          az += (pz / neighbours - p.z) * .15 + (vz / neighbours - p.vz) * .9;
        }
        ax += Math.sin(p.y * .023 + elapsed * .31) * 5 + Math.cos(p.z * .019 - elapsed * .17) * 3;
        ay += Math.sin(p.z * .025 + elapsed * .23) * 5 - Math.cos(p.x * .016 + elapsed * .13) * 3;
        az += Math.sin(p.x * .018 - elapsed * .27) * 5 + Math.cos(p.y * .021 + elapsed * .11) * 3;
        for (const [axis, limit, strength] of [["x", 178, .35], ["y", 78, .55], ["z", 78, .55]]) {
          const edge = Math.max(0, Math.abs(p[axis]) - limit) * Math.sign(p[axis]) * strength;
          if (axis === "x") ax -= edge; else if (axis === "y") ay -= edge; else az -= edge;
        }
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy);
          if (distance < 66 && distance > .5) {
            const force = (1 - distance / 66) * 42;
            ax += dx / distance * force; ay += dy / distance * force; az += Math.sin(elapsed + p.x) * force * .18;
          }
        }
        const acceleration = Math.hypot(ax, ay, az), cap = acceleration > 85 ? 85 / acceleration : 1;
        p.ax = ax * cap; p.ay = ay * cap; p.az = az * cap;
      });
      for (const p of particles) {
        p.vx += p.ax * dt; p.vy += p.ay * dt; p.vz += p.az * dt;
        const speed = Math.hypot(p.vx, p.vy, p.vz) || 1;
        const factor = speed > 48 ? 48 / speed : speed < 12 ? 12 / speed : 1;
        p.vx *= factor; p.vy *= factor; p.vz *= factor;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      }
    }
    function project(x, y, z) {
      const yaw = tilt * .3, cosine = Math.cos(yaw), sine = Math.sin(yaw);
      const xx = x * cosine + z * sine;
      const zz = -x * sine + z * cosine;
      const yy = y * .96 - zz * .28;
      const depth = y * .28 + zz * .96;
      const perspective = 650 / (650 - depth);
      return { x: xx * perspective, y: yy * perspective, depth, perspective };
    }
    function draw() {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const reveal = reduced.matches ? 1 : .35 + .65 * clamp(entrance / 1.2);
      const projected = particles.map(p => ({ p, ...project(p.x, p.y, p.z) })).sort((a, b) => a.depth - b.depth);
      context.save(); context.translate(width / 2, height / 2); context.scale(scale, scale);
      context.lineCap = "round";
      for (const point of projected) {
        const { p, x, y, depth, perspective } = point;
        const ahead = project(p.x + p.vx * .2, p.y + p.vy * .2, p.z + p.vz * .2);
        const dx = ahead.x - x, dy = ahead.y - y, length = Math.hypot(dx, dy) || 1;
        const tail = p.length * perspective;
        const colour = p.group > 0 ? accent : ink;
        const alpha = clamp(.43 + (depth + 100) / 350, .32, .96) * reveal;
        context.strokeStyle = `rgba(${colour.join(",")},${alpha})`;
        context.lineWidth = (1.05 + p.weight * .75) * perspective;
        context.beginPath(); context.moveTo(x - dx / length * tail / 2, y - dy / length * tail / 2);
        context.lineTo(x + dx / length * tail / 2, y + dy / length * tail / 2); context.stroke();
      }
      context.restore();
      const stamp = Math.floor(elapsed * 2);
      if (stamp !== lastStamp) { host.dataset.frame = String(stamp); lastStamp = stamp; }
    }
    function tick(now) {
      frame = 0;
      if (!lastPaint || now - lastPaint >= 32) {
        const dt = last ? Math.min((now - last) / 1000, .05) : 1 / 30;
        last = now; lastPaint = now; elapsed += dt; entrance += dt;
        tilt += (targetTilt - tilt) * .08;
        simulate(dt); draw();
      }
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame); frame = 0; last = 0; lastPaint = 0;
      const running = visible && !document.hidden && !reduced.matches;
      host.dataset.motion = running ? "running" : "still";
      if (running) frame = requestAnimationFrame(tick); else draw();
    }
    function scroll() {
      const bounds = host.getBoundingClientRect();
      targetTilt = clamp((bounds.top + bounds.height / 2) / window.innerHeight) * 2 - 1;
    }
    function resize() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      scale = Math.min(width / 500, height / 285);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      scroll(); palette(); draw();
    }
    function position(event) {
      const bounds = host.getBoundingClientRect();
      return { x: (event.clientX - bounds.left - width / 2) / scale, y: (event.clientY - bounds.top - height / 2) / scale };
    }
    function move(event) {
      if (event.pointerType !== "mouse" || reduced.matches) return;
      Object.assign(pointer, position(event), { active: true });
    }
    function leave() { pointer.active = false; press = null; }
    function down(event) { press = { x: event.clientX, y: event.clientY, time: performance.now() }; }
    function up(event) {
      if (!press || reduced.matches) return;
      const tap = Math.hypot(event.clientX - press.x, event.clientY - press.y) < 10 && performance.now() - press.time < 500;
      press = null;
      if (!tap) return;
      const origin = position(event);
      for (const p of particles) {
        const dx = p.x - origin.x, dy = p.y - origin.y, dz = p.z;
        const distance = Math.hypot(dx, dy, dz) || 1;
        const impulse = Math.max(0, 1 - distance / 210) * 44;
        p.vx += dx / distance * impulse; p.vy += dy / distance * impulse; p.vz += dz / distance * impulse;
      }
      host.dataset.bursts = String(++bursts);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) entrance = 0;
      visible = entry.isIntersecting; scroll(); update();
    }, { threshold: .12 });
    const resizeObserver = new ResizeObserver(resize);
    const appearance = new MutationObserver(() => { palette(); draw(); });
    palette(); resize(); observer.observe(host); resizeObserver.observe(host);
    appearance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-template", "style"] });
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave); host.addEventListener("pointerdown", down, { passive: true });
    host.addEventListener("pointerup", up, { passive: true }); host.addEventListener("pointercancel", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", update); reduced.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); appearance.disconnect();
      host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerdown", down); host.removeEventListener("pointerup", up); host.removeEventListener("pointercancel", leave);
      window.removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return <div ref={hostRef} className="ih-sculpture-art" data-concept="living-flock" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
