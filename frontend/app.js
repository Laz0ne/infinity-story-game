/* ═══════════════════════════════════════════════════════════════
   Infinity Story Game — Cinematic Engine (Canvas 2D)
   Procedural scenes • Particles • Transitions • Web Audio
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────────────────────────
   CANVAS SETUP
──────────────────────────────────────────────────────────── */
const canvas = document.createElement('canvas');
const ctx    = canvas.getContext('2d');
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;';
document.getElementById('pixi-container').appendChild(canvas);

/* ────────────────────────────────────────────────────────────
   ANIMATION LOOP
──────────────────────────────────────────────────────────── */
let rafId           = 0;
let lastTime        = 0;
let currentRenderFn = null;  // (ctx, dt) → void
let currentThemeKey = 'title';

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (currentRenderFn) rebuildCurrentScene();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCamera(dt, currentThemeKey);
    applyCameraBegin(ctx);
    if (currentRenderFn) currentRenderFn(ctx, dt);
    applyCameraEnd(ctx);
    applyPostProcessing(ctx, dt, currentThemeKey);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
}

function rebuildCurrentScene() {
  buildScene(currentThemeKey);
}

/* ────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────── */
const W = () => canvas.width;
const H = () => canvas.height;

function rand(a, b)    { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

/** Draw a vertical linear gradient across the full canvas. */
function drawSkyGradient(ctx, colorStops) {
  const h   = H();
  const w   = W();
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  colorStops.forEach(([stop, color]) => grd.addColorStop(stop, color));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
}

/** Draw a mountain silhouette as a filled polygon. */
function drawMountain(ctx, color, yBase, amplitude, freq, phase, alpha) {
  const w = W(), h = H();
  ctx.save();
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    const y = yBase * h
      + Math.sin(x * freq + phase) * amplitude
      + Math.cos(x * freq * 2.1 + phase) * amplitude * 0.35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a humanoid silhouette. */
function drawSilhouette(ctx, x, y, scale, cls, color, bob) {
  const s  = scale || 1;
  const dy = bob || 0;
  ctx.fillStyle = color || '#111118';

  // head
  ctx.beginPath();
  ctx.arc(x, y - 46 * s + dy, 10 * s, 0, Math.PI * 2);
  ctx.fill();

  // hood (voleur)
  if (cls === 'voleur') {
    ctx.beginPath();
    ctx.ellipse(x, y - 50 * s + dy, 14 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // torso
  ctx.fillRect(x - 9 * s, y - 36 * s + dy, 18 * s, 28 * s);

  // legs
  ctx.fillRect(x - 9 * s, y - 8 * s + dy, 8 * s, 26 * s);
  ctx.fillRect(x +  1 * s, y - 8 * s + dy, 8 * s, 26 * s);

  // arms
  ctx.fillRect(x - 18 * s, y - 35 * s + dy, 8 * s, 20 * s);
  ctx.fillRect(x +  10 * s, y - 35 * s + dy, 8 * s, 20 * s);

  // class accessories
  if (cls === 'aventurier') {
    ctx.fillStyle = '#d4a843';
    ctx.fillRect(x + 17 * s, y - 50 * s + dy, 3 * s, 40 * s);
    ctx.fillRect(x + 13 * s, y - 36 * s + dy, 11 * s, 3 * s);
  } else if (cls === 'marchand') {
    ctx.fillStyle = color || '#111118';
    ctx.beginPath();
    ctx.arc(x - 20 * s, y - 18 * s + dy, 9 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(212,168,67,0.45)';
    ctx.beginPath();
    ctx.arc(x - 20 * s, y - 18 * s + dy, 6 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ────────────────────────────────────────────────────────────
   PARTICLE SYSTEM
──────────────────────────────────────────────────────────── */
/* dt is in ms; DT = dt/16.67 normalizes to ~1.0 at 60fps */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters  = [];
  }

  addEmitter(opts) {
    this.emitters.push({ ...opts, _timer: 0 });
    return this;
  }

  _emit(opts) {
    this.particles.push({
      x:            opts.x, y: opts.y,
      vx:           (opts.vx || 0) + (Math.random() - 0.5) * (opts.spread || 1),
      vy:           opts.vy || -0.8,
      life:         1,
      dur:          opts.life || 2,
      sz:           rand(opts.minSize || 1.5, opts.maxSize || 4),
      col:          opts.color || '#ffffff',
      al:           opts.alpha || 0.75,
      grav:         opts.gravity || 0,
      shape:        opts.shape  || 'circle',
      fireMode:     opts.fireMode     || false,
      firefly:      opts.firefly      || false,
      fireflyPhase: Math.random() * Math.PI * 2,
      isRain:       opts.isRain       || false,
      groundY:      opts.groundY      || 0,
      splashed:     false,
    });
  }

  update(ctx, dt) {
    const DT = dt / 16.67;

    for (const em of this.emitters) {
      em._timer += dt;
      const interval = 1000 / (em.rate || 10);
      while (em._timer >= interval) {
        em._timer -= interval;
        const ex = (typeof em.x === 'function' ? em.x() : em.x)
                 + (Math.random() - 0.5) * (em.spreadX || 0);
        const ey = (typeof em.y === 'function' ? em.y() : em.y)
                 + (Math.random() - 0.5) * (em.spreadY || 0);
        this._emit({ ...em, x: ex, y: ey });
      }
    }

    const splashToAdd = [];

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= DT / (p.dur * 60);
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      p.x  += p.vx * DT;
      p.y  += p.vy * DT;
      p.vy += p.grav * DT;

      // Firefly sinusoidal lateral movement
      if (p.firefly) {
        const age = (1 - p.life) * p.dur;
        p.x += Math.sin(age * 3 + p.fireflyPhase) * 0.5;
      }

      // Rain splash: spawn micro-particles when raindrop hits ground
      if (p.isRain && !p.splashed && p.y > p.groundY) {
        p.splashed = true;
        for (let si = 0; si < 3; si++) {
          splashToAdd.push({
            x: p.x, y: p.groundY,
            vx: (Math.random() - 0.5) * 3,
            vy: -rand(0.3, 0.8),
            life: 1, dur: 0.35,
            sz: rand(1, 2),
            col: '#aac0dd', al: 0.55,
            grav: 0.04, shape: 'circle',
            fireMode: false, firefly: false, fireflyPhase: 0,
            isRain: false, groundY: 0, splashed: false,
          });
        }
      }

      const a = p.al * Math.min(1, p.life * 2);
      ctx.save();

      // Fire color interpolation: yellow → red → dark based on life
      if (p.fireMode) {
        const progress = 1 - p.life; // 0 = just spawned, 1 = dying
        let r, g, b;
        if (progress < 0.5) {
          const f = progress * 2;
          r = 255; g = Math.round(200 * (1 - f)); b = 0;
        } else {
          const f = (progress - 0.5) * 2;
          r = Math.round(200 * (1 - f)); g = 0; b = 0;
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else {
        ctx.fillStyle = p.col;
      }

      // Firefly glow: pulsing alpha
      if (p.firefly) {
        const age2 = (1 - p.life) * p.dur;
        ctx.globalAlpha = Math.max(0, a * (0.4 + 0.6 * Math.abs(Math.sin(age2 * 4 + p.fireflyPhase))));
      } else {
        ctx.globalAlpha = Math.max(0, a);
      }

      if (p.shape === 'rect') {
        ctx.fillRect(p.x - p.sz * 0.5, p.y - p.sz, p.sz, p.sz * 2.5);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.sz * Math.max(0.2, p.life)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Add splash particles after the loop to avoid concurrent modification
    for (const sp of splashToAdd) this.particles.push(sp);
  }
}

/* ────────────────────────────────────────────────────────────
   CAMERA SYSTEM — Ken Burns zoom + screen shake
──────────────────────────────────────────────────────────── */
const camera = {
  zoom: 1.0,
  shakeX: 0,
  shakeY: 0,
  _shakeTimer: 0,
};

function updateCamera(dt, theme) {
  const now = performance.now() * 0.001;
  // Ken Burns: gentle zoom oscillating between 1.0 and 1.02 over ~20 s
  camera.zoom = 1.0 + 0.01 * (1 - Math.cos(now * Math.PI / 10));

  // Decay existing shake smoothly
  camera.shakeX *= 0.78;
  camera.shakeY *= 0.78;

  camera._shakeTimer += dt;
  if (theme === 'combat' && camera._shakeTimer > 50) {
    camera.shakeX = (Math.random() - 0.5) * 3;
    camera.shakeY = (Math.random() - 0.5) * 1.5;
    camera._shakeTimer = 0;
  } else if (theme === 'trahison' && camera._shakeTimer > 300) {
    camera.shakeX = (Math.random() - 0.5) * 2;
    camera.shakeY = (Math.random() - 0.5) * 1;
    camera._shakeTimer = 0;
  }
}

function applyCameraBegin(ctx) {
  const w = W(), h = H();
  ctx.save();
  ctx.translate(w / 2 + camera.shakeX, h / 2 + camera.shakeY);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-w / 2, -h / 2);
}

function applyCameraEnd(ctx) {
  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   POST-PROCESSING — grain, vignette, color grading
──────────────────────────────────────────────────────────── */
let _grainCanvas = null, _grainCtx = null, _grainTimer = 0;

const VIGNETTE_STRENGTH = {
  title: 0.55, ville: 0.45, 'forêt': 0.50, donjon: 0.75,
  marché: 0.30, combat: 0.60, rencontre: 0.35, mystère: 0.65, trahison: 0.80,
};

const COLOR_GRADE = {
  ville:     [255, 180, 100, 0.05],
  'forêt':   [100, 200, 100, 0.05],
  donjon:    [80,  100, 180, 0.06],
  combat:    [200, 80,  60,  0.06],
  mystère:   [150, 80,  200, 0.06],
  trahison:  [180, 50,  50,  0.07],
  marché:    [220, 180, 80,  0.04],
  rencontre: [220, 160, 100, 0.04],
};

function applyPostProcessing(ctx, dt, theme) {
  const w = W(), h = H();

  // 1. Film grain — refreshed every ~100ms, drawn tiled at very low opacity
  _grainTimer += dt;
  if (_grainTimer > 100 || !_grainCanvas) {
    _grainTimer = 0;
    const gw = 256, gh = 256;
    if (!_grainCanvas) {
      _grainCanvas = document.createElement('canvas');
      _grainCanvas.width  = gw;
      _grainCanvas.height = gh;
      _grainCtx = _grainCanvas.getContext('2d');
    }
    _grainCtx.clearRect(0, 0, gw, gh);
    for (let gi = 0; gi < 2500; gi++) {
      const gx = Math.random() * gw;
      const gy = Math.random() * gh;
      const ga = Math.random() * 0.18;
      _grainCtx.fillStyle = `rgba(255,255,255,${ga})`;
      _grainCtx.fillRect(gx, gy, 1, 1);
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.03;
  const gw2 = _grainCanvas.width, gh2 = _grainCanvas.height;
  for (let gx2 = 0; gx2 < w; gx2 += gw2) {
    for (let gy2 = 0; gy2 < h; gy2 += gh2) {
      ctx.drawImage(_grainCanvas, gx2, gy2);
    }
  }
  ctx.restore();

  // 2. Vignette — radial gradient, dark at edges
  const vStr = VIGNETTE_STRENGTH[theme] || 0.5;
  const vRad = Math.hypot(w, h) * 0.5;
  const vGrad = ctx.createRadialGradient(w / 2, h / 2, vRad * 0.3, w / 2, h / 2, vRad);
  vGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(1, `rgba(0,0,0,${vStr})`);
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);

  // 3. Color grading — subtle theme-tinted overlay
  const grade = COLOR_GRADE[theme];
  if (grade) {
    ctx.save();
    ctx.globalAlpha = grade[3];
    ctx.fillStyle = `rgb(${grade[0]},${grade[1]},${grade[2]})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/* ────────────────────────────────────────────────────────────
   THEME DETECTION
──────────────────────────────────────────────────────────── */
const THEME_MAP = {
  ville: 'ville', foret: 'forêt', donjon: 'donjon',
  marche: 'marché', combat: 'combat', rencontre: 'rencontre',
  mystere: 'mystère', trahison: 'trahison',
  luxe: 'ville', classe: 'rencontre', reputation: 'rencontre',
};

function getThemeFromSituationId(sid) {
  if (!sid) return 'ville';
  return THEME_MAP[sid.split('_')[0]] || 'ville';
}

/* ────────────────────────────────────────────────────────────
   SCENE MANAGEMENT
──────────────────────────────────────────────────────────── */
const SCENE_BUILDERS = {};

function buildScene(theme) {
  currentThemeKey  = theme;
  const builder    = SCENE_BUILDERS[theme] || SCENE_BUILDERS['ville'];
  currentRenderFn  = builder(W(), H());
}

/* ────────────────────────────────────────────────────────────
   SCENE: TITLE
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['title'] = function(w, h) {
  const stars = Array.from({ length: 200 }, () => ({
    x: rand(0, w), y: rand(0, h * 0.75),
    r: rand(0.4, 1.8), phase: rand(0, Math.PI * 2),
  }));

  // Precompute mountain polygons (arrays of [x,y])
  function makeMtPoints(yBase, amp, freq, off) {
    const pts = [];
    for (let x = 0; x <= w; x += 8) {
      pts.push([x, yBase * h + Math.sin(x * freq + off) * amp
                             + Math.cos(x * freq * 2.2 + off) * amp * 0.35]);
    }
    return pts;
  }

  const mt1 = makeMtPoints(0.55, 70, 0.018, 0);
  const mt2 = makeMtPoints(0.63, 55, 0.013, 1.5);
  const mt3 = makeMtPoints(0.72, 40, 0.022, 3.0);

  function drawMtLine(pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  const ps = new ParticleSystem();
  ps.addEmitter({
    x: () => rand(0, w), y: () => rand(h * 0.3, h * 0.75),
    vy: -0.15, vx: 0, spread: 0, life: 4,
    minSize: 0.8, maxSize: 2.5, color: '#aa99ff', alpha: 0.5, rate: 2,
  });

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    drawSkyGradient(ctx, [[0, '#0a0a2e'], [0.5, '#14083a'], [1, '#08080f']]);

    // Stars
    for (const s of stars) {
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.7 + s.phase));
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawMtLine(mt1, '#14143a');
    drawMtLine(mt2, '#0f0f28');
    drawMtLine(mt3, '#080818');

    // Ground mist
    const mist = ctx.createLinearGradient(0, h * 0.65, 0, h);
    mist.addColorStop(0, 'rgba(20,10,50,0)');
    mist.addColorStop(1, 'rgba(10,6,30,0.9)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: VILLE (City at night)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['ville'] = function(w, h) {
  // Generate buildings
  const buildings = [];
  let bx = -20;
  while (bx < w + 30) {
    const bw = randInt(30, 80);
    const bh = randInt(h * 0.2, h * 0.55);
    buildings.push({ x: bx, y: h - bh, w: bw, h: bh });
    bx += bw + randInt(-5, 8);
  }

  // Generate windows
  const windows = [];
  for (const b of buildings) {
    for (let wy = b.y + 8; wy < b.y + b.h - 16; wy += 14) {
      for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 12) {
        windows.push({ x: wx, y: wy, lit: Math.random() < 0.55, phase: rand(0, Math.PI * 2) });
      }
    }
  }

  // Stars (sparse)
  const stars = Array.from({ length: 70 }, () => ({
    x: rand(0, w), y: rand(0, h * 0.5), r: rand(0.3, 1.2), ph: rand(0, Math.PI * 2),
  }));

  // Pedestrians
  const peds = Array.from({ length: 4 }, () => ({
    x: rand(50, w - 50), y: h * 0.88,
    speed: rand(0.15, 0.4) * (Math.random() < 0.5 ? 1 : -1),
    phase: rand(0, Math.PI * 2),
  }));

  // Torch positions
  const torchPos = buildings
    .filter((_, i) => i % 4 === 0).slice(0, 8)
    .map(b => ({ x: b.x + b.w * 0.5, y: b.y }));

  const ps = new ParticleSystem();
  for (const tp of torchPos) {
    ps.addEmitter({
      x: tp.x, y: tp.y, spreadX: 4,
      vy: -0.9, vx: 0.1, life: 0.8,
      minSize: 2, maxSize: 5, color: '#ff8820', alpha: 0.7, rate: 12,
      gravity: -0.05, fireMode: true,
    });
    ps.addEmitter({
      x: tp.x, y: tp.y, spreadX: 2,
      vy: -0.5, vx: 0.15, life: 0.5,
      minSize: 1, maxSize: 3, color: '#ffcc00', alpha: 0.5, rate: 8,
      gravity: -0.03, fireMode: true,
    });
  }
  // Chimney smoke
  for (const b of buildings.filter(() => Math.random() < 0.3)) {
    ps.addEmitter({
      x: b.x + b.w * 0.3, y: b.y, spreadX: 6,
      vy: -0.4, vx: 0.05, life: 3,
      minSize: 4, maxSize: 10, color: '#404040', alpha: 0.18, rate: 2,
      gravity: -0.01,
    });
  }

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    const DT = dt / 16.67;

    drawSkyGradient(ctx, [
      [0, '#0d0820'], [0.45, '#1a0d35'], [0.75, '#2d1045'], [1, '#0a060f'],
    ]);

    // Stars
    for (const s of stars) {
      const tw = 0.2 + 0.8 * Math.abs(Math.sin(t * 0.6 + s.ph));
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Buildings
    ctx.fillStyle = '#0a0814';
    for (const b of buildings) ctx.fillRect(b.x, b.y, b.w, b.h);

    // Windows
    for (const w2 of windows) {
      if (!w2.lit) continue;
      const fl = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.1 + w2.phase));
      ctx.globalAlpha = fl * 0.9;
      ctx.fillStyle = '#ffcc66';
      ctx.fillRect(w2.x, w2.y, 5, 7);
    }
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = '#07060d';
    ctx.fillRect(0, h * 0.87, w, h * 0.13);

    // Pedestrians (walking silhouettes)
    ctx.fillStyle = '#111118';
    for (const p of peds) {
      p.x += p.speed * DT;
      if (p.x > w + 20) p.x = -20;
      if (p.x < -20)    p.x = w + 20;
      const bob   = Math.sin(t * 4 + p.phase) * 1.5;
      const swing = Math.sin(t * 5 + p.phase) * 4;
      ctx.fillStyle = '#111118';
      ctx.beginPath(); ctx.arc(p.x, p.y - 20 + bob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(p.x - 3, p.y - 16 + bob, 6, 10);
      ctx.fillRect(p.x - 3, p.y - 6 + bob, 3, 10 + swing);
      ctx.fillRect(p.x,     p.y - 6 + bob, 3, 10 - swing);
    }

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: FORÊT (Forest)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['forêt'] = function(w, h) {
  // Generate tree data for three parallax layers
  function genTrees(count, minX, maxX, yBase, maxH, minH) {
    return Array.from({ length: count }, () => ({
      x:     rand(minX, maxX),
      y:     yBase * h,
      trH:   rand(minH, maxH) * h,
      trW:   rand(7, 18),
      crW:   rand(35, 65),
      phase: rand(0, Math.PI * 2),
    }));
  }

  const farTrees  = genTrees(24, -40, w + 40, 0.58, 0.45, 0.28);
  const midTrees  = genTrees(16, -40, w + 40, 0.65, 0.50, 0.32);

  function drawTreeLayer(trees, bodyColor, alpha, windAmp, t) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = bodyColor;
    for (const tr of trees) {
      const sway = Math.sin(t * 0.8 + tr.phase) * windAmp;
      // trunk
      ctx.fillRect(tr.x - tr.trW / 2, tr.y, tr.trW, tr.trH);
      // crown
      ctx.beginPath();
      ctx.ellipse(tr.x + sway, tr.y - tr.crW * 0.4, tr.crW * 0.5, tr.crW * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const ps = new ParticleSystem();
  ps.addEmitter({
    x: () => rand(0, w), y: -10, spreadX: 0,
    vy: 0.5, vx: 0.3, life: 5,
    minSize: 2, maxSize: 5, color: '#336611', alpha: 0.6, rate: 4, shape: 'rect', gravity: 0.003,
  });
  ps.addEmitter({
    x: () => rand(0, w), y: -10, spreadX: 0,
    vy: 0.38, vx: -0.2, life: 6,
    minSize: 1.5, maxSize: 4, color: '#558833', alpha: 0.5, rate: 3, shape: 'rect', gravity: 0.002,
  });
  // Fireflies
  ps.addEmitter({
    x: () => rand(w * 0.1, w * 0.9),
    y: () => rand(h * 0.5, h * 0.78),
    vy: -0.06, vx: 0, spread: 0.3, life: 4,
    minSize: 1.5, maxSize: 3.5, color: '#aaff44', alpha: 0.85, rate: 2,
    gravity: 0, firefly: true,
  });

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;

    drawSkyGradient(ctx, [
      [0, '#0d1a08'], [0.4, '#142408'], [0.75, '#0a1405'], [1, '#060c03'],
    ]);

    // Light rays — more pronounced, oscillating diagonally
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const rx  = w * (0.07 + i * 0.15);
      const ang = Math.sin(t * 0.3 + i * 1.5) * 0.12;
      const rh  = h * (0.42 + 0.15 * Math.sin(t * 0.2 + i));
      const pulse = 0.04 + 0.03 * Math.sin(t * 0.7 + i);
      ctx.globalAlpha = pulse;
      const rayGrad = ctx.createLinearGradient(rx, 0, rx + ang * rh * 60, rh);
      rayGrad.addColorStop(0, 'rgba(180,255,120,0.9)');
      rayGrad.addColorStop(1, 'rgba(100,200,60,0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rx - 15, 0);
      ctx.lineTo(rx + 15, 0);
      ctx.lineTo(rx + 15 + ang * rh * 60, rh);
      ctx.lineTo(rx - 15 + ang * rh * 60, rh);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Trees (far → near)
    drawTreeLayer(farTrees, '#0d2208', 0.85, 3, t);
    drawTreeLayer(midTrees, '#0f2c0a', 1.0,  5, t);

    // Near trees (dark silhouettes on sides)
    ctx.fillStyle = '#080f04';
    ctx.beginPath(); ctx.ellipse(w * 0.07, h * 0.5, 55, 100, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-20, h * 0.35, 90, h * 0.65);
    ctx.beginPath(); ctx.ellipse(w * 0.93, h * 0.5, 55, 100, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(w - 70, h * 0.35, 90, h * 0.65);

    // Ground
    ctx.fillStyle = '#070e04';
    ctx.fillRect(0, h * 0.88, w, h * 0.12);

    // Ground mist
    const mist = ctx.createLinearGradient(0, h * 0.72, 0, h);
    mist.addColorStop(0, 'rgba(20,40,10,0)');
    mist.addColorStop(1, 'rgba(15,25,8,0.75)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Player silhouette
    const idleBob = Math.sin(t * 1.2) * 1.5;
    drawSilhouette(ctx, w * 0.5, h * 0.88, 1.4, gameState.playerClass, '#0d1a08', idleBob);

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: DONJON (Dungeon)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['donjon'] = function(w, h) {
  const torchPos = [
    { x: w * 0.13, y: h * 0.38 },
    { x: w * 0.87, y: h * 0.38 },
    { x: w * 0.13, y: h * 0.68 },
    { x: w * 0.87, y: h * 0.68 },
  ];

  const ps = new ParticleSystem();
  for (const tp of torchPos) {
    ps.addEmitter({
      x: tp.x, y: tp.y - 14, spreadX: 5,
      vy: -0.8, life: 0.7,
      minSize: 3, maxSize: 7, color: '#ff6600', alpha: 0.8, rate: 15, gravity: -0.04,
      fireMode: true,
    });
    ps.addEmitter({
      x: tp.x, y: tp.y - 14, spreadX: 3,
      vy: -0.6, life: 0.5,
      minSize: 1.5, maxSize: 4, color: '#ffdd00', alpha: 0.6, rate: 10, gravity: -0.03,
      fireMode: true,
    });
  }

  // Chain data
  const chainXs = [w * 0.28, w * 0.50, w * 0.72];

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#060606'); bg.addColorStop(1, '#020204');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // Stone wall grid
    ctx.strokeStyle = 'rgba(30,30,45,0.6)';
    ctx.lineWidth   = 1;
    const stW = 48, stH = 28;
    for (let sy = 0; sy < h; sy += stH) {
      const off = (Math.floor(sy / stH) % 2) * (stW * 0.5);
      for (let sx = -stW + off; sx < w + stW; sx += stW) {
        ctx.strokeRect(sx + 2, sy + 2, stW - 4, stH - 4);
      }
    }

    // Torches (sconces)
    ctx.fillStyle = '#4a3010';
    for (const tp of torchPos) ctx.fillRect(tp.x - 4, tp.y - 16, 8, 22);

    // Animated chains
    ctx.save();
    for (let ci = 0; ci < chainXs.length; ci++) {
      const cx   = chainXs[ci];
      const sway = Math.sin(t * 0.5 + ci * 1.2) * 8;
      for (let cy = 0; cy < h * 0.45; cy += 10) {
        const progress = cy / (h * 0.45);
        const ox = sway * progress;
        ctx.strokeStyle = 'rgba(40,40,55,0.7)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy, 5, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Moving shadows from torches
    for (const tp of torchPos) {
      const sAlpha = 0.06 + 0.05 * Math.sin(t * 1.2 + tp.x * 0.01);
      ctx.save();
      ctx.globalAlpha = sAlpha;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(tp.x, h * 0.5, 70 + Math.sin(t * 0.9) * 18, 200, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dark vignette
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w * 0.22, h);
    ctx.fillRect(w * 0.78, 0, w * 0.22, h);
    ctx.fillRect(0, 0, w, h * 0.18);
    ctx.restore();

    // Ground mist
    const mist = ctx.createLinearGradient(0, h * 0.72, 0, h);
    mist.addColorStop(0, 'rgba(10,8,30,0)');
    mist.addColorStop(1, 'rgba(8,5,20,0.9)');
    ctx.fillStyle = mist; ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Dragon silhouette (breathing)
    const breathe = 1 + Math.sin(t * 0.7) * 0.018;
    ctx.save();
    ctx.translate(w * 0.5, h * 0.82);
    ctx.scale(breathe, 1 + Math.sin(t * 0.7) * 0.012);
    ctx.translate(-w * 0.5, -h * 0.82);
    ctx.fillStyle = '#0d0a10';
    ctx.beginPath();
    ctx.ellipse(w * 0.5,         h * 0.82, w * 0.22, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.5 + w * 0.18, h * 0.77, w * 0.08, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.5 - w * 0.22, h * 0.84, w * 0.14, h * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.76);
    ctx.lineTo(w * 0.5 - w * 0.1, h * 0.6);
    ctx.lineTo(w * 0.5 - w * 0.18, h * 0.74);
    ctx.lineTo(w * 0.5 - w * 0.05, h * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ps.update(ctx, dt);

    // Red eyes pulsing in the darkness
    const eyeSpots = [
      { x: w * 0.08, y: h * 0.45 }, { x: w * 0.91, y: h * 0.52 },
      { x: w * 0.15, y: h * 0.70 }, { x: w * 0.84, y: h * 0.66 },
    ];
    for (const ep of eyeSpots) {
      const pulse   = 0.5 + 0.5 * Math.sin(t * 1.5 + ep.x * 0.01);
      const blink   = Math.sin(t * 1.8 + ep.y * 0.02) > 0.88 ? 0 : 1;
      if (blink && pulse > 0.25) {
        ctx.save();
        ctx.globalAlpha = pulse * 0.75;
        ctx.fillStyle = '#ff1100';
        ctx.beginPath();
        ctx.ellipse(ep.x - 5, ep.y, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ep.x + 5, ep.y, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: MARCHÉ (Market)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['marché'] = function(w, h) {
  const STALL_COLORS = ['#cc3322', '#2244aa', '#228833', '#cc8800', '#882288'];
  const stalls = [];
  for (let sx = 30; sx < w - 60; sx += randInt(90, 130)) {
    const sw = randInt(70, 100);
    const sy = h * rand(0.55, 0.65);
    stalls.push({
      x: sx, y: sy, w: sw,
      col1: STALL_COLORS[randInt(0, STALL_COLORS.length - 1)],
      col2: STALL_COLORS[randInt(0, STALL_COLORS.length - 1)],
    });
  }

  // Pre-generate background buildings
  const bgBuildings2 = [];
  for (let bx2 = -20; bx2 < w + 30;) {
    const bw = randInt(50, 90);
    const bh = randInt(h * 0.25, h * 0.4);
    bgBuildings2.push({ x: bx2, w: bw, h: bh });
    bx2 += bw + randInt(0, 15);
  }

  const crowd = Array.from({ length: 8 }, () => ({
    x: rand(30, w - 30), y: rand(h * 0.75, h * 0.85),
    speed: rand(0.1, 0.3) * (Math.random() < 0.5 ? 1 : -1),
    phase: rand(0, Math.PI * 2),
  }));

  const ps = new ParticleSystem();
  ps.addEmitter({
    x: () => rand(0, w), y: h * 0.8,
    vy: -0.25, vx: 0.1, life: 4,
    minSize: 1, maxSize: 3, color: '#ffaa44', alpha: 0.3, rate: 3, gravity: -0.007,
  });

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    const DT = dt / 16.67;

    drawSkyGradient(ctx, [[0, '#1a1005'], [0.5, '#2d1e08'], [1, '#0f0c04']]);

    // Background buildings (pre-generated at init time, referenced here)
    ctx.fillStyle = '#120e06';
    for (const bg of bgBuildings2) ctx.fillRect(bg.x, h - bg.h, bg.w, bg.h);

    // Stalls
    for (const st of stalls) {
      // Awning stripes
      const sw3 = st.w / 3;
      for (let stripe = 0; stripe < 3; stripe++) {
        ctx.fillStyle = stripe % 2 === 0 ? st.col1 : st.col2;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(st.x + sw3 * stripe,         st.y);
        ctx.lineTo(st.x + sw3 * (stripe + 1),   st.y);
        ctx.lineTo(st.x + sw3 * (stripe + 1) + 5, st.y + 22);
        ctx.lineTo(st.x + sw3 * stripe - 5,       st.y + 22);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Poles
      ctx.fillStyle = '#442200';
      ctx.fillRect(st.x + 4,        st.y + 22, 6, h - st.y - 22);
      ctx.fillRect(st.x + st.w - 10, st.y + 22, 6, h - st.y - 22);
      // Table
      ctx.fillStyle = '#331a00';
      ctx.fillRect(st.x - 5, st.y + 26, st.w + 10, 10);
      // Banner flag
      const wave = Math.sin(t * 1.5 + st.x * 0.02) * 6;
      ctx.fillStyle = st.col1;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(st.x + st.w * 0.5 - 2, st.y - 30);
      ctx.lineTo(st.x + st.w * 0.5 + 22 + wave, st.y - 20);
      ctx.lineTo(st.x + st.w * 0.5 + 18 + wave, st.y - 8);
      ctx.lineTo(st.x + st.w * 0.5 - 2, st.y - 15);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ground
    ctx.fillStyle = '#0c0902';
    ctx.fillRect(0, h * 0.87, w, h * 0.13);

    // Crowd
    ctx.fillStyle = '#110e06';
    for (const p of crowd) {
      p.x += p.speed * DT;
      if (p.x > w + 20) p.x = -20;
      if (p.x < -20) p.x = w + 20;
      const bob = Math.sin(t * 3.5 + p.phase) * 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y - 16 + bob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(p.x - 4, p.y - 12 + bob, 8, 12);
      ctx.fillRect(p.x - 4, p.y + bob, 3, 10);
      ctx.fillRect(p.x + 1, p.y + bob, 3, 10);
    }

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: COMBAT
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['combat'] = function(w, h) {
  const ps = new ParticleSystem();
  ps.addEmitter({
    x: w * 0.5, y: h * 0.7, spreadX: 20, spreadY: 15,
    vy: -0.8, spread: 3, life: 0.5,
    minSize: 1.5, maxSize: 4, color: '#ffcc00', alpha: 0.9, rate: 20, gravity: 0.05,
    fireMode: true,
  });
  ps.addEmitter({
    x: w * 0.5, y: h * 0.7, spreadX: 15,
    vy: -0.4, spread: 2, life: 0.3,
    minSize: 1, maxSize: 3, color: '#ff4400', alpha: 0.7, rate: 15, gravity: 0.03,
    fireMode: true,
  });
  // Embers rising from ground
  ps.addEmitter({
    x: () => rand(w * 0.25, w * 0.75), y: () => h * 0.82 + rand(-5, 5),
    vy: -0.5, vx: 0, spread: 1.5, life: 2,
    minSize: 1, maxSize: 2.5, color: '#ff6600', alpha: 0.8, rate: 8,
    gravity: -0.02, fireMode: true,
  });

  let t = 0, flashTimer = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    flashTimer -= dt * 0.001;
    const DT = dt / 16.67;

    drawSkyGradient(ctx, [
      [0, '#1a0303'], [0.4, '#2d0808'], [0.7, '#180404'], [1, '#0a0101'],
    ]);

    // Storm clouds
    ctx.fillStyle = '#1a0505';
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(w * (0.1 + i * 0.2), h * (0.08 + i * 0.05),
                  100 + i * 30, 40 + i * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Cracked ground
    ctx.fillStyle = '#0f0505';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);

    // Cracks
    ctx.strokeStyle = 'rgba(60,0,0,0.8)';
    ctx.lineWidth   = 1.5;
    for (let i = 0; i < 8; i++) {
      const cx2 = w * (0.1 + i * 0.1), cy2 = h * (0.84 + (i % 3) * 0.04);
      ctx.beginPath();
      ctx.moveTo(cx2, cy2);
      ctx.lineTo(cx2 + rand(-60, 60), cy2 + rand(5, 20));
      ctx.stroke();
    }

    // Fighters
    const f1swing = Math.sin(t * 2.5) * 0.12;
    const f2swing = -Math.sin(t * 2.5 + 0.5) * 0.12;
    const f1y = h * 0.82 + Math.abs(Math.sin(t * 2.5)) * 3;
    const f2y = h * 0.82 + Math.abs(Math.sin(t * 2.5 + 0.5)) * 3;

    ctx.save();
    ctx.translate(w * 0.32, f1y);
    ctx.rotate(f1swing);
    ctx.translate(-w * 0.32, -f1y);
    drawSilhouette(ctx, w * 0.32, f1y, 1.6, 'aventurier', '#1a0505');
    ctx.restore();

    ctx.save();
    ctx.translate(w * 0.68, f2y);
    ctx.rotate(f2swing);
    ctx.scale(-1, 1);
    ctx.translate(-w * 0.68, -f2y);
    drawSilhouette(ctx, w * 0.68, f2y, 1.6, 'aventurier', '#1a0505');
    ctx.restore();

    // Lightning flash
    if (flashTimer <= 0 && Math.random() < 0.005) {
      flashTimer = rand(0.08, 0.15);
    }
    if (flashTimer > 0) {
      ctx.globalAlpha = Math.min(1, flashTimer * 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      // Lightning bolt
      if (flashTimer > 0.05) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2;
        let lx = rand(w * 0.3, w * 0.7), ly = 0;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        while (ly < h * 0.5) {
          lx += rand(-40, 40); ly += rand(20, 50);
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Red ambient
    ctx.globalAlpha = 0.05 + 0.05 * Math.sin(t * 1.5);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: RENCONTRE (Encounter)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['rencontre'] = function(w, h) {
  let char1X = -60, char2X = w + 60;
  const TARGET1 = w * 0.38, TARGET2 = w * 0.62;

  const ps = new ParticleSystem();
  ps.addEmitter({
    x: () => rand(0, w), y: h * 0.85,
    vy: -0.2, vx: 0.15, life: 4,
    minSize: 1, maxSize: 3.5, color: '#cc8844', alpha: 0.22, rate: 3, gravity: -0.004,
  });

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    const DT = dt / 16.67;

    drawSkyGradient(ctx, [
      [0, '#1a100a'], [0.4, '#2d1c10'], [0.7, '#3a2418'], [1, '#100a06'],
    ]);

    // Sun on horizon
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff8833';
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.62, 55, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.62, 90, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Road (perspective converging lines)
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 8, h * 0.62);
    ctx.lineTo(w * 0.5 + 8, h * 0.62);
    ctx.lineTo(w * 0.95, h);
    ctx.lineTo(w * 0.05, h);
    ctx.closePath();
    ctx.fill();

    // Trees flanking road (perspective)
    ctx.fillStyle = '#0c1506';
    for (let i = 0; i < 7; i++) {
      const progress = i / 7;
      const tH = h * (0.12 + progress * 0.22);
      const tW = tH * 0.35;
      const lx = w * (0.05 + progress * 0.38);
      const rx = w * (0.95 - progress * 0.38);
      const ty = h * 0.62 + progress * h * 0.25 - tH;
      ctx.beginPath(); ctx.ellipse(lx, ty + tH * 0.5, tW * 0.5, tH * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(lx - 3, ty + tH * 0.5, 6, tH * 0.5);
      ctx.beginPath(); ctx.ellipse(rx, ty + tH * 0.5, tW * 0.5, tH * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(rx - 3, ty + tH * 0.5, 6, tH * 0.5);
    }

    // Ground
    ctx.fillStyle = '#100b05';
    ctx.fillRect(0, h * 0.87, w, h * 0.13);

    // Characters approaching
    if (char1X < TARGET1) char1X += 0.25 * DT;
    if (char2X > TARGET2) char2X -= 0.25 * DT;

    const bob1 = Math.sin(t * 3.5) * 2;
    const bob2 = Math.sin(t * 3.5 + Math.PI) * 2;
    drawSilhouette(ctx, char1X, h * 0.84, 1.2, gameState.playerClass, '#150e08', bob1);
    ctx.save();
    ctx.scale(-1, 1);
    drawSilhouette(ctx, -char2X, h * 0.84, 1.2, 'aventurier', '#150e08', bob2);
    ctx.restore();

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: MYSTÈRE (Mystery)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['mystère'] = function(w, h) {
  const stars = Array.from({ length: 110 }, () => ({
    x: rand(0, w), y: rand(0, h * 0.65), r: rand(0.3, 1.5), ph: rand(0, Math.PI * 2),
  }));

  const crystals = Array.from({ length: 8 }, () => ({
    x: rand(w * 0.05, w * 0.95),
    y: rand(h * 0.52, h * 0.85),
    r: rand(8, 25), phase: rand(0, Math.PI * 2),
  }));

  const runes = Array.from({ length: 12 }, () => ({
    x: rand(0, w), y: rand(h * 0.2, h * 0.85),
    vx: rand(-0.08, 0.08), vy: rand(-0.06, 0.06),
    size: rand(8, 18), phase: rand(0, Math.PI * 2),
    sides: randInt(3, 6),
  }));

  const ps = new ParticleSystem();
  ps.addEmitter({
    x: () => rand(0, w), y: () => rand(h * 0.6, h),
    vy: -0.2, spread: 2, life: 5,
    minSize: 8, maxSize: 20, color: '#330077', alpha: 0.18, rate: 5, gravity: -0.004,
  });
  ps.addEmitter({
    x: () => rand(0, w), y: () => rand(h * 0.4, h * 0.7),
    vy: -0.1, spread: 1, life: 3,
    minSize: 3, maxSize: 8, color: '#9900ff', alpha: 0.3, rate: 4, gravity: -0.003,
  });

  let t = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    const DT = dt / 16.67;

    drawSkyGradient(ctx, [[0, '#05020f'], [0.5, '#0d0520'], [1, '#030110']]);

    // Stars
    for (const s of stars) {
      const tw = 0.1 + 0.9 * Math.abs(Math.sin(t * 0.8 + s.ph));
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#bb99ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Crystals
    for (const cr of crystals) {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.2 + cr.phase));
      ctx.globalAlpha = pulse * 0.55;
      ctx.fillStyle = '#6600cc';
      ctx.beginPath();
      ctx.moveTo(cr.x, cr.y - cr.r * 2.5);
      ctx.lineTo(cr.x - cr.r, cr.y);
      ctx.lineTo(cr.x + cr.r, cr.y);
      ctx.lineTo(cr.x, cr.y + cr.r);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = pulse * 0.22;
      ctx.fillStyle = '#aa44ff';
      ctx.beginPath(); ctx.arc(cr.x, cr.y - cr.r, cr.r * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground mist
    const mist = ctx.createLinearGradient(0, h * 0.65, 0, h);
    mist.addColorStop(0, 'rgba(20,5,50,0)');
    mist.addColorStop(1, 'rgba(15,3,40,0.9)');
    ctx.fillStyle = mist; ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Floating rune polygons
    ctx.lineWidth = 1.5;
    for (const rn of runes) {
      rn.x = ((rn.x + rn.vx * DT) + w) % w;
      rn.y = ((rn.y + rn.vy * DT) + h) % h;
      const al = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.9 + rn.phase));
      ctx.globalAlpha = al;
      ctx.strokeStyle = '#aa66ff';
      ctx.beginPath();
      for (let s2 = 0; s2 < rn.sides; s2++) {
        const a = (s2 / rn.sides) * Math.PI * 2 - Math.PI / 2 + t * 0.3;
        const px = rn.x + Math.cos(a) * rn.size;
        const py = rn.y + Math.sin(a) * rn.size;
        s2 === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   SCENE: TRAHISON (Betrayal)
──────────────────────────────────────────────────────────── */
SCENE_BUILDERS['trahison'] = function(w, h) {
  // Pre-generate buildings
  const buildings2 = [];
  for (let bx2 = -20; bx2 < w + 30; bx2 += randInt(35, 75)) {
    const bw2 = randInt(30, 70);
    const bh2 = randInt(h * 0.2, h * 0.5);
    buildings2.push({ x: bx2, w: bw2, h: bh2 });
  }

  const ps = new ParticleSystem();
  ps.addEmitter({
    x: () => rand(-50, w + 50), y: -10,
    vy: 5, vx: 1.5, life: 0.8,
    minSize: 1, maxSize: 2, color: '#4466aa', alpha: 0.4, rate: 65, shape: 'rect', gravity: 0.1,
    isRain: true, groundY: h * 0.85,
  });

  let t = 0, flashTimer = 0;
  return function(ctx, dt) {
    t += dt * 0.001;
    flashTimer -= dt * 0.001;

    drawSkyGradient(ctx, [[0, '#100205'], [0.5, '#1a0305'], [1, '#050103']]);

    // Dark buildings (pre-generated)
    ctx.fillStyle = '#0a0105';
    for (const b of buildings2) ctx.fillRect(b.x, h - b.h, b.w, b.h);

    // Shadow figures
    drawSilhouette(ctx, w * 0.2,  h * 0.82, 1.3, 'voleur',    '#1a0308');
    drawSilhouette(ctx, w * 0.75, h * 0.82, 1.2, 'voleur',    '#1a0308');
    drawSilhouette(ctx, w * 0.6,  h * 0.80, 1.0, 'aventurier','#1a0308');

    // Ground
    ctx.fillStyle = '#080103';
    ctx.fillRect(0, h * 0.87, w, h * 0.13);

    // Pulsing red ambiance
    ctx.globalAlpha = 0.05 + 0.04 * Math.sin(t * 0.8);
    ctx.fillStyle = '#880011';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // Lightning
    if (flashTimer <= 0 && Math.random() < 0.006) flashTimer = rand(0.06, 0.12);
    if (flashTimer > 0) {
      ctx.globalAlpha = Math.min(0.1, flashTimer * 0.7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    ps.update(ctx, dt);
  };
};

/* ────────────────────────────────────────────────────────────
   GLOBAL GAME STATE (needed by some scene builders)
──────────────────────────────────────────────────────────── */
const gameState = {
  playerId:     null,
  currentChoices: [],
  isTyping:     false,
  typingTimer:  null,
  playerClass:  'aventurier',
  audioEnabled: false,
  audioCtx:     null,
  audioNodes:   [],
};

/* ────────────────────────────────────────────────────────────
   CINEMATIC TRANSITION
──────────────────────────────────────────────────────────── */
const TRANSITION_PHRASES = [
  'Le destin bascule…', 'Les ombres se referment…',
  'Un nouveau chapitre s\'ouvre…', 'La route bifurque…',
  'Les dés sont jetés…', 'Le sort en est mis…',
  'Le vent tourne…', 'Le temps suspend son vol…',
  'L\'aventure continue…', 'Les cartes se redistribuent…',
  'Les fils du destin se resserrent…',
  'Un nouveau chapitre s\'écrit dans le sang et la poussière…',
  'Le monde retient son souffle…',
  'Tes pas résonnent dans l\'inconnu…',
];

const transEl     = document.getElementById('transition-overlay');
const transTextEl = document.getElementById('transition-text');

async function playTransition(newTheme) {
  const phrase = TRANSITION_PHRASES[Math.floor(Math.random() * TRANSITION_PHRASES.length)];
  transTextEl.textContent = phrase;
  transEl.classList.add('fade-in');
  await delay(800);
  buildScene(newTheme);
  switchAmbiance(newTheme);
  await delay(450);
  transEl.classList.remove('fade-in');
  transEl.classList.add('fade-out');
  await delay(800);
  transEl.classList.remove('fade-out');
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ────────────────────────────────────────────────────────────
   WEB AUDIO — PROCEDURAL AMBIANCE
──────────────────────────────────────────────────────────── */
function initAudio() {
  if (gameState.audioCtx) return;
  gameState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function stopAllAudio() {
  gameState.audioNodes.forEach(n => {
    // Errors here are expected (e.g. nodes already stopped/disconnected) and safe to ignore
    try { n.stop(); } catch (_) {}
    try { n.disconnect(); } catch (_) {}
  });
  gameState.audioNodes = [];
}

function switchAmbiance(theme) {
  if (!gameState.audioEnabled || !gameState.audioCtx) return;
  stopAllAudio();
  startAmbiance(theme);
}

function startAmbiance(theme) {
  if (!gameState.audioEnabled || !gameState.audioCtx) return;
  const ac = gameState.audioCtx;
  const masterGain = ac.createGain();
  masterGain.gain.setValueAtTime(0.07, ac.currentTime);
  masterGain.connect(ac.destination);
  gameState.audioNodes.push(masterGain);

  function mkOsc(type, freq, gainVal, filtFreq) {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    const f   = ac.createBiquadFilter();
    osc.type            = type;
    osc.frequency.value = freq;
    f.type              = 'lowpass';
    f.frequency.value   = filtFreq || 800;
    g.gain.value        = gainVal;
    osc.connect(f); f.connect(g); g.connect(masterGain);
    osc.start();
    gameState.audioNodes.push(osc, g, f);
  }

  switch (theme) {
    case 'forêt':    mkOsc('sawtooth', 60, 0.3, 200); mkOsc('sine', 110, 0.15, 400); break;
    case 'donjon':   mkOsc('sawtooth', 40, 0.4, 120); mkOsc('square', 55, 0.1, 80); break;
    case 'combat':   mkOsc('sawtooth', 80, 0.35, 300); mkOsc('square', 120, 0.2, 500); break;
    case 'mystère':  mkOsc('sine', 70, 0.3, 600); mkOsc('sine', 105, 0.2, 900); break;
    case 'trahison': mkOsc('sawtooth', 50, 0.5, 150); mkOsc('sine', 75, 0.2, 200); break;
    case 'marché':   mkOsc('sine', 220, 0.08, 800); mkOsc('triangle', 330, 0.06, 600); break;
    default:         mkOsc('sine', 90, 0.2, 500); break;
  }
}

function playClickSound() {
  if (!gameState.audioEnabled || !gameState.audioCtx) return;
  const ac  = gameState.audioCtx;
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.type            = 'sine';
  osc.frequency.value = 660;
  g.gain.setValueAtTime(0.12, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  osc.connect(g); g.connect(ac.destination);
  osc.start(); osc.stop(ac.currentTime + 0.15);
}

/* ────────────────────────────────────────────────────────────
   DOM SELECTORS
──────────────────────────────────────────────────────────── */
const $  = id => document.getElementById(id);
const screens = { welcome: $('screen-welcome'), game: $('screen-game') };
const ui = {
  form:             $('form-character'),
  btnStart:         $('btn-start'),
  storyText:        $('story-text'),
  typingCursor:     $('typing-cursor'),
  loading:          $('loading'),
  choicesContainer: $('choices-container'),
  choicesList:      $('choices-list'),
  errorOverlay:     $('error-overlay'),
  errorMessage:     $('error-message'),
  btnErrorClose:    $('btn-error-close'),
  valTurn:          $('val-turn'),
  valReputation:    $('val-reputation'),
  valArgent:        $('val-argent'),
  valInfluence:     $('val-influence'),
  valName:          $('val-name'),
  classIcon:        $('class-icon'),
  barReputation:    $('bar-reputation'),
  barArgent:        $('bar-argent'),
  barInfluence:     $('bar-influence'),
  btnMute:          $('btn-mute'),
  btnFullscreen:    $('btn-fullscreen'),
};

const CLASS_ICONS = { aventurier: '🗡️', voleur: '🗝️', marchand: '💰' };

/* ────────────────────────────────────────────────────────────
   NAVIGATION
──────────────────────────────────────────────────────────── */
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
}

/* ────────────────────────────────────────────────────────────
   ERROR
──────────────────────────────────────────────────────────── */
function showError(msg) {
  ui.errorMessage.textContent = msg;
  ui.errorOverlay.classList.remove('hidden');
}
ui.btnErrorClose.addEventListener('click', () => ui.errorOverlay.classList.add('hidden'));

/* ────────────────────────────────────────────────────────────
   STATS
──────────────────────────────────────────────────────────── */
const STAT_MAXES = { reputation: 100, argent: 500, influence: 100 };

function updateStats(stats) {
  const fields = [
    { el: ui.valTurn,       val: stats.turn,       neutral: true,  bar: null },
    { el: ui.valReputation, val: stats.reputation, neutral: false, bar: ui.barReputation, max: STAT_MAXES.reputation },
    { el: ui.valArgent,     val: stats.argent,     neutral: true,  bar: ui.barArgent,     max: STAT_MAXES.argent },
    { el: ui.valInfluence,  val: stats.influence,  neutral: true,  bar: ui.barInfluence,  max: STAT_MAXES.influence },
  ];

  fields.forEach(({ el, val, neutral, bar, max }) => {
    const prev = parseInt(el.textContent, 10) || 0;
    el.textContent = val;
    el.classList.remove('bump', 'positive', 'negative');
    if (!neutral && val !== prev) el.classList.add(val > prev ? 'positive' : 'negative');
    void el.offsetWidth;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump', 'positive', 'negative'), 400);
    if (bar && max !== undefined) {
      const pct = Math.max(0, Math.min(100, ((val + max) / (max * 2)) * 100));
      bar.style.width = pct + '%';
    }
  });

  if (stats.name) {
    ui.valName.textContent   = stats.name;
    ui.classIcon.textContent = CLASS_ICONS[stats.character_class] || '⚔️';
  }
}

/* ────────────────────────────────────────────────────────────
   TYPEWRITER
──────────────────────────────────────────────────────────── */
const TYPEWRITER_SPEED = 22;

function typewrite(text, onDone) {
  if (gameState.typingTimer) clearTimeout(gameState.typingTimer);
  gameState.isTyping = true;
  ui.storyText.dataset.fullText = text;
  ui.storyText.textContent = '';
  ui.typingCursor.classList.remove('hidden');

  const chars = [...text];
  let i = 0;

  function step() {
    if (i < chars.length) {
      ui.storyText.textContent += chars[i++];
      gameState.typingTimer = setTimeout(step, TYPEWRITER_SPEED);
    } else {
      gameState.isTyping = false;
      ui.typingCursor.classList.add('hidden');
      if (typeof onDone === 'function') onDone();
    }
  }
  step();
}

function skipTyping() {
  if (!gameState.isTyping) return;
  if (gameState.typingTimer) clearTimeout(gameState.typingTimer);
  gameState.isTyping = false;
  ui.typingCursor.classList.add('hidden');
  const full = ui.storyText.dataset.fullText;
  if (full) ui.storyText.textContent = full;
  renderChoices(gameState.currentChoices);
}

/* ────────────────────────────────────────────────────────────
   CHOICES
──────────────────────────────────────────────────────────── */
function renderChoices(choices) {
  ui.choicesList.innerHTML = '';
  choices.forEach((choice, idx) => {
    const btn           = document.createElement('button');
    btn.className       = 'btn-choice';
    btn.dataset.idx     = (idx + 1) + '.';
    btn.textContent     = choice.text;
    btn.style.animationDelay = (idx * 0.3) + 's';
    btn.addEventListener('click', () => onChoiceClick(choice.id));
    ui.choicesList.appendChild(btn);
  });
  ui.choicesContainer.classList.remove('hidden');
}

function hideChoices()    { ui.choicesContainer.classList.add('hidden'); ui.choicesList.innerHTML = ''; }
function disableChoices() { ui.choicesList.querySelectorAll('.btn-choice').forEach(b => (b.disabled = true)); }

/* ────────────────────────────────────────────────────────────
   DISPLAY SITUATION
──────────────────────────────────────────────────────────── */
function displaySituation(data) {
  hideChoices();
  ui.loading.classList.add('hidden');
  updateStats(data.stats);
  gameState.currentChoices = data.choices;
  typewrite(data.story_text, () => renderChoices(data.choices));
}

/* ────────────────────────────────────────────────────────────
   API
──────────────────────────────────────────────────────────── */
async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Erreur ${res.status}`);
  }
  return res.json();
}

async function startNewGame(name, characterClass) {
  ui.btnStart.disabled = true;
  try {
    const data = await apiPost('/api/game/new', { name, character_class: characterClass });
    gameState.playerId    = data.player_id;
    gameState.playerClass = characterClass;

    const theme = getThemeFromSituationId(data.situation_id);
    await playTransition(theme);

    showScreen('game');
    displaySituation(data);
    startAmbiance(theme);
  } catch (err) {
    showError(`Impossible de démarrer la partie : ${err.message}`);
  } finally {
    ui.btnStart.disabled = false;
  }
}

async function sendChoice(choiceId) {
  if (!gameState.playerId) return;
  disableChoices();
  hideChoices();
  ui.loading.classList.remove('hidden');

  try {
    const data  = await apiPost('/api/game/choice', {
      player_id: gameState.playerId,
      choice_id: choiceId,
    });
    const theme = getThemeFromSituationId(data.situation_id);

    if (theme !== currentThemeKey) {
      await playTransition(theme);
    } else {
      buildScene(theme);
    }

    displaySituation(data);
    startAmbiance(theme);
  } catch (err) {
    ui.loading.classList.add('hidden');
    showError(`Erreur lors du choix : ${err.message}`);
    ui.choicesContainer.classList.remove('hidden');
    ui.choicesList.querySelectorAll('.btn-choice').forEach(b => (b.disabled = false));
  }
}

/* ────────────────────────────────────────────────────────────
   EVENT HANDLERS
──────────────────────────────────────────────────────────── */
ui.form.addEventListener('submit', e => {
  e.preventDefault();
  const nameEl = document.getElementById('input-name');
  const name   = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  const clsEl  = document.querySelector('input[name="character_class"]:checked');
  const cls    = clsEl ? clsEl.value : 'aventurier';
  if (!gameState.audioCtx) initAudio();
  startNewGame(name, cls);
});

function onChoiceClick(id) {
  if (gameState.isTyping) { skipTyping(); return; }
  playClickSound();
  sendChoice(id);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); skipTyping(); }
  else if (e.key === 'm' || e.key === 'M')   { toggleMute(); }
  else if (['1', '2', '3'].includes(e.key)) {
    const btns = ui.choicesList.querySelectorAll('.btn-choice');
    const btn  = btns[parseInt(e.key, 10) - 1];
    if (btn && !btn.disabled) btn.click();
  }
});

function toggleMute() {
  gameState.audioEnabled = !gameState.audioEnabled;
  ui.btnMute.textContent = gameState.audioEnabled ? '🔊' : '🔇';
  if (gameState.audioEnabled) {
    if (!gameState.audioCtx) initAudio();
    startAmbiance(currentThemeKey);
  } else {
    stopAllAudio();
  }
}

ui.btnMute.addEventListener('click', () => {
  if (!gameState.audioCtx) initAudio();
  toggleMute();
});

ui.btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    ui.btnFullscreen.textContent = '✕';
  } else {
    document.exitFullscreen().catch(() => {});
    ui.btnFullscreen.textContent = '⛶';
  }
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) ui.btnFullscreen.textContent = '⛶';
});

/* ────────────────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────────────────── */
(function init() {
  buildScene('title');
  startLoop();
  showScreen('welcome');
})();
