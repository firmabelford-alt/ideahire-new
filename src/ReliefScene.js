import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import wordmark from "./assets/ideaHireRelief.json";
import { clamp, smooth, reliefDepthAt } from "./ReliefMotion";

/* A stencil cuts the original letter contours into an invisible floor.
   It preserves counters and overlapping kerning without fragile compound holes. */
export function createReliefScene(host, canvas) {
  const mobile = window.matchMedia("(max-width:600px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion:reduce)");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, stencil: true, antialias: true, powerPreference: "low-power" });
  } catch {
    host.dataset.renderer = "fallback";
    return { dispose() {}, setPaused() {} };
  }
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const stage = new THREE.Group();
  stage.position.set(-wordmark.center[0], -wordmark.center[1], 0); scene.add(stage);
  const geometries = [], materials = [];
  const geometry = item => { geometries.push(item); return item; };
  const material = item => { materials.push(item); return item; };
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture; room.dispose(); pmrem.dispose();

  const face = material(new THREE.MeshPhysicalMaterial({ color: "#193238", metalness: .38, roughness: .34, clearcoat: .22, clearcoatRoughness: .32, envMapIntensity: .9 }));
  const edge = material(new THREE.MeshStandardMaterial({ color: "#607b80", metalness: .8, roughness: .3, envMapIntensity: 1.05 }));
  const wall = material(new THREE.MeshStandardMaterial({ color: "#31575d", metalness: .72, roughness: .32, side: THREE.DoubleSide, envMapIntensity: 1.1 }));
  const invisible = material(new THREE.MeshBasicMaterial({ visible: false }));
  const depthOnly = material(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, side: THREE.DoubleSide }));
  const shadow = material(new THREE.ShadowMaterial({ opacity: .2, depthWrite: false }));
  const cutout = material(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp, side: THREE.DoubleSide }));
  for (const floorMaterial of [depthOnly, shadow]) {
    floorMaterial.stencilWrite = true; floorMaterial.stencilRef = 1;
    floorMaterial.stencilFunc = THREE.NotEqualStencilFunc;
    floorMaterial.stencilFail = THREE.KeepStencilOp;
    floorMaterial.stencilZFail = THREE.KeepStencilOp;
    floorMaterial.stencilZPass = THREE.KeepStencilOp;
  }
  const key = new THREE.DirectionalLight("#fff8ef", 3.25);
  key.position.set(-3.8, 5.4, 6); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 2.6, bottom: -2.6, near: .1, far: 18 });
  key.shadow.bias = -.00035; key.shadow.normalBias = .008; key.shadow.radius = 3; scene.add(key);
  const fill = new THREE.HemisphereLight("#eefaff", "#496873", 1.35); scene.add(fill);
  const softFill = new THREE.DirectionalLight("#e8f7ff", .65);
  softFill.position.set(3, -3, 4); scene.add(softFill);
  const rim = new THREE.SpotLight("#31d7da", 24, 15, Math.PI / 4, 1, 2);
  rim.position.set(3.4, .7, 3); rim.target.position.set(0, 0, .1); scene.add(rim, rim.target);

  const [cx, cy] = wordmark.center, silhouettes = [];
  const letters = wordmark.glyphs.map((glyph, index) => {
    const parsed = new SVGLoader().parse('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000" fill-rule="nonzero" d="' + glyph.path + '"/></svg>');
    const shapes = parsed.paths.flatMap(path => SVGLoader.createShapes(path));
    silhouettes.push(...shapes);
    const capGeometry = geometry(new THREE.ExtrudeGeometry(shapes, { depth: .004, steps: 1, curveSegments: 12, bevelEnabled: true, bevelSegments: 3, bevelSize: .006, bevelThickness: .006 }));
    const bodyGeometry = geometry(new THREE.ExtrudeGeometry(shapes, { depth: 1, steps: 1, curveSegments: 12, bevelEnabled: false }));
    const body = new THREE.Mesh(bodyGeometry, [invisible, wall]), cap = new THREE.Mesh(capGeometry, [face, edge]);
    body.castShadow = true; body.receiveShadow = true; cap.castShadow = true; cap.receiveShadow = true;
    stage.add(body, cap);
    return { body, cap, x: glyph.center - cx, index, depth: -.075 };
  });
  const stencil = new THREE.Mesh(geometry(new THREE.ShapeGeometry(silhouettes, 12)), cutout);
  stencil.renderOrder = -30; stage.add(stencil);
  const floorGeometry = geometry(new THREE.PlaneGeometry(40, 20));
  floorGeometry.translate(cx, cy, 0);
  // Depth and shadow only: no painted panel behind the wordmark.
  const occluder = new THREE.Mesh(floorGeometry, depthOnly); occluder.renderOrder = -20;
  const receiver = new THREE.Mesh(floorGeometry, shadow);
  receiver.receiveShadow = true; receiver.position.z = .0003; stage.add(occluder, receiver);

  let width = 1, height = 1, distance = 8;
  let frame = 0, last = 0, lastPaint = 0, elapsed = 0, visible = false, destroyed = false, contextLost = false;
  let paused = host.dataset.paused === "true", ready = false, lastStamp = -1, dark = false;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  function palette() {
    const value = getComputedStyle(host).getPropertyValue("--v-ink").trim(), colour = new THREE.Color();
    if (value) colour.setStyle(value);
    dark = colour.r + colour.g + colour.b > 1.6;
    face.color.set(dark ? "#c6e0e4" : "#193238");
    wall.color.set(dark ? "#316a73" : "#31575d"); edge.color.set(dark ? "#83c9cf" : "#607b80");
    shadow.opacity = dark ? .34 : .2; scene.environmentIntensity = dark ? .8 : 1;
    if (ready) paint();
  }
  function resize() {
    const box = host.getBoundingClientRect(); width = Math.max(1, box.width); height = Math.max(1, box.height);
    renderer.setSize(width, height, false); camera.aspect = width / height;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    distance = Math.max(wordmark.width / (.84 * 2 * tangent * camera.aspect), 2.05 / (2 * tangent));
    camera.updateProjectionMatrix(); if (ready) paint();
  }
  function pose() {
    const still = reduced.matches, intro = still ? 1 : smooth(elapsed / 1.65);
    const progress = ((Math.max(0, elapsed - 2) % 16) - 5) / 8;
    const wave = progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 4 : 0;
    for (const letter of letters) {
      const depth = reliefDepthAt(elapsed, letter.x, wordmark.width, mobile, still);
      letter.depth = depth; letter.cap.position.z = depth;
      letter.body.scale.z = Math.abs(depth) < .0003 ? .0003 * Math.sign(depth || 1) : depth;
    }
    const x = still ? 0 : pointer.x, y = still ? 0 : pointer.y;
    camera.position.set(distance * (-.07 + x * .042), distance * ((mobile ? .16 : .24) + (1 - intro) * .18 + y * .026), distance);
    camera.lookAt(0, 0, .04);
    key.position.x = -3.8 + x * .75; key.position.y = 5.4 + y * .45;
    rim.position.x = 3.4 + x * 1.5; rim.position.y = .7 + y * .8;
    rim.intensity = (dark ? 29 : 24) + (still ? 0 : wave * 4);
    host.dataset.phase = intro < 1 ? "intro" : "relief";
    const stamp = Math.floor(elapsed * 4);
    if (stamp !== lastStamp) { host.dataset.frame = String(stamp); lastStamp = stamp; }
  }
  function paint() {
    if (destroyed || contextLost) return;
    pose(); renderer.render(scene, camera);
    if (!ready) {
      ready = true; host.dataset.renderer = "webgl";
      host.dataset.vertices = String(geometries.reduce((sum, item) => sum + item.getAttribute("position").count, 0));
    }
  }
  function tick(now) {
    frame = 0; const interval = mobile ? 32 : 15;
    if (!lastPaint || now - lastPaint >= interval) {
      const dt = last ? Math.min((now - last) / 1000, .06) : 1 / 60;
      last = now; lastPaint = now; elapsed += dt;
      const follow = 1 - Math.exp(-dt * 8);
      pointer.x += (pointer.targetX - pointer.x) * follow; pointer.y += (pointer.targetY - pointer.y) * follow; paint();
    }
    if (visible && !document.hidden && !paused && !reduced.matches && !contextLost) frame = requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(frame); frame = 0; last = 0; lastPaint = 0;
    const running = visible && !document.hidden && !paused && !reduced.matches && !contextLost;
    host.dataset.motion = running ? "running" : "still";
    if (reduced.matches) { pointer.x = 0; pointer.y = 0; }
    paint(); if (running) frame = requestAnimationFrame(tick);
  }
  function move(event) {
    if (event.pointerType !== "mouse" || paused || reduced.matches) return;
    const box = host.getBoundingClientRect();
    pointer.targetX = clamp((event.clientX - box.left) / width * 2 - 1, -1, 1);
    pointer.targetY = clamp(1 - (event.clientY - box.top) / height * 2, -1, 1);
    host.dataset.parallax = pointer.targetX.toFixed(2) + "," + pointer.targetY.toFixed(2);
  }
  function leave() { pointer.targetX = 0; pointer.targetY = 0; }
  function lost(event) { event.preventDefault(); contextLost = true; host.dataset.renderer = "fallback"; update(); }
  function restored() { contextLost = false; host.dataset.renderer = "webgl"; update(); }
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .15 });
  const sizes = new ResizeObserver(resize), appearance = new MutationObserver(palette);
  palette(); resize(); paint(); visibility.observe(host); sizes.observe(host);
  appearance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-template", "style", "class"] });
  document.addEventListener("visibilitychange", update); reduced.addEventListener("change", update);
  host.addEventListener("pointermove", move, { passive: true }); host.addEventListener("pointerleave", leave);
  canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("webglcontextrestored", restored);
  return {
    setPaused(value) { paused = value; update(); },
    dispose() {
      destroyed = true; cancelAnimationFrame(frame); visibility.disconnect(); sizes.disconnect(); appearance.disconnect();
      document.removeEventListener("visibilitychange", update); reduced.removeEventListener("change", update);
      host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored);
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); environment.dispose(); renderer.dispose();
      host.dataset.renderer = "fallback";
    },
  };
}
