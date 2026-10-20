/* 四种消除动画：撕碎 tear / 揉团扔进垃圾桶 crumple / 焚烧 burn / 纸飞机 plane */
(function () {
  const stage = document.getElementById('stage');
  const layer = document.getElementById('stageLayer');
  const caption = document.getElementById('stageCaption');
  const cv = document.getElementById('stageCanvas');
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let geo = null; // 纸张在屏幕上的位置

  function setupGeo() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const W = Math.min(vw - 72, 300), H = Math.round(W * 1.3);
    geo = { vw, vh, W, H, x: Math.round((vw - W) / 2), y: Math.round(Math.max(70, vh * 0.42 - H / 2)) };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = vw * dpr; cv.height = vh * dpr; cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
  }

  /* ---- 把文字画到一张横线纸上 ---- */
  function paperCanvas(text, W, H, scale) {
    const c = document.createElement('canvas');
    c.width = Math.round(W * scale); c.height = Math.round(H * scale);
    const g = c.getContext('2d');
    g.scale(scale, scale);
    g.fillStyle = css('--paper') || '#fffaf0';
    g.fillRect(0, 0, W, H);
    // 纸张纹理
    for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(120,100,70,' + rnd(0.015, 0.05) + ')'; g.fillRect(rnd(0, W), rnd(0, H), rnd(0.5, 1.5), rnd(0.5, 1.5)); }
    const lh = 30, top = 58;
    g.strokeStyle = css('--rule') || 'rgba(90,130,170,0.25)'; g.lineWidth = 1;
    for (let y = top; y < H - 14; y += lh) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    g.strokeStyle = css('--margin') || 'rgba(200,80,70,0.45)';
    g.beginPath(); g.moveTo(34.5, 0); g.lineTo(34.5, H); g.stroke();
    // 文字
    g.fillStyle = css('--ink') || '#33291f';
    g.font = '19px "LXGW WenKai", "Kaiti SC", "STKaiti", serif';
    g.textBaseline = 'alphabetic';
    const maxW = W - 34 - 18;
    const lines = [];
    String(text || '').split(/\n/).forEach((para) => {
      let cur = '';
      for (const ch of para) {
        if (g.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
      }
      lines.push(cur);
    });
    lines.slice(0, Math.floor((H - top) / lh)).forEach((ln, i) => g.fillText(ln, 44, top + i * lh - 7));
    // 日期角标
    g.font = '12px "Young Serif", Georgia, serif';
    g.fillStyle = css('--ink-soft') || '#8a7a66';
    const d = new Date();
    g.fillText(d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate(), 44, 30);
    return c;
  }

  function showStage() {
    stage.hidden = false;
    caption.textContent = ''; caption.classList.remove('on');
    layer.innerHTML = '';
    requestAnimationFrame(() => stage.classList.add('on'));
  }
  function hideStage() {
    stage.classList.remove('on');
    return wait(320).then(() => { stage.hidden = true; layer.innerHTML = ''; ctx.clearRect(0, 0, geo.vw, geo.vh); });
  }

  /* ================= 撕碎 ================= */
  async function tear(img) {
    const { W, H, x, y } = geo;
    const url = img.toDataURL('image/png');
    // 竖向撕口
    const V = []; let vx = 50 + rnd(-4, 4);
    for (let yy = 0; yy <= 100; yy += rnd(2.5, 5)) { vx += rnd(-2.2, 2.2); vx = Math.max(42, Math.min(58, vx)); V.push([vx, yy]); }
    V.push([vx + rnd(-1.5, 1.5), 100]);
    const vAt = (yy) => { for (let i = 1; i < V.length; i++) { if (V[i][1] >= yy) { const a = V[i - 1], b = V[i]; const t = (yy - a[1]) / ((b[1] - a[1]) || 1); return a[0] + (b[0] - a[0]) * t; } } return V[V.length - 1][0]; };
    const vBetween = (y1, y2) => V.filter((p) => p[1] > Math.min(y1, y2) && p[1] < Math.max(y1, y2));
    function hcut(x1, x2, yc) { const pts = []; const n = Math.max(3, Math.round(Math.abs(x2 - x1) / 4)); for (let i = 0; i <= n; i++) { const xx = x1 + (x2 - x1) * i / n; pts.push([xx, (i === n ? yc : yc + rnd(-2.2, 2.2))]); } return pts; }
    const pieces = [];
    ['L', 'R'].forEach((side) => {
      const cuts = [35 + rnd(-9, 6), 68 + rnd(-6, 9)];
      if (Math.random() < 0.35) cuts.splice(Math.floor(Math.random() * 2), 1);
      const ys = [0].concat(cuts, [100]);
      for (let k = 0; k < ys.length - 1; k++) {
        const ya = ys[k], yb = ys[k + 1];
        let top, bot;
        if (side === 'L') {
          top = k === 0 ? [[0, 0], [vAt(0), 0]] : hcut(0, vAt(ya), ya);
          bot = k === ys.length - 2 ? [[0, 100], [vAt(100), 100]] : hcut(0, vAt(yb), yb);
          var poly = top.concat(vBetween(ya, yb), bot.slice().reverse());
        } else {
          top = k === 0 ? [[vAt(0), 0], [100, 0]] : hcut(vAt(ya), 100, ya);
          bot = k === ys.length - 2 ? [[vAt(100), 100], [100, 100]] : hcut(vAt(yb), 100, yb);
          var poly = top.concat(bot.slice().reverse(), vBetween(ya, yb).reverse());
        }
        const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
        pieces.push({ side, poly, cx: cx / 100 * W, cy: cy / 100 * H });
      }
    });
    const els = pieces.map((p) => {
      const wrap = document.createElement('div');
      wrap.className = 'piece-wrap';
      wrap.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + W + 'px;height:' + H + 'px;transform-origin:' + p.cx + 'px ' + p.cy + 'px';
      const inner = document.createElement('div');
      inner.className = 'piece';
      inner.style.backgroundImage = 'url(' + url + ')';
      inner.style.clipPath = 'polygon(' + p.poly.map((q) => q[0].toFixed(2) + '% ' + q[1].toFixed(2) + '%').join(',') + ')';
      wrap.appendChild(inner); layer.appendChild(wrap);
      p.el = wrap; p.x = 0; p.y = 0; p.r = 0;
      return wrap;
    });
    if (reduce) { els.forEach((e) => { e.style.transition = 'opacity .6s'; e.style.opacity = 0; }); await wait(700); return; }
    await wait(350);
    // 第一下：从中间撕开
    Sound.rip(0.5);
    const pivotY = H; const t0 = performance.now();
    await new Promise((res) => {
      function f(now) {
        const k = Math.min(1, (now - t0) / 420), e = easeOut(k);
        pieces.forEach((p) => {
          const s = p.side === 'L' ? -1 : 1;
          const a = s * 5 * e * Math.PI / 180;
          const px = (p.side === 'L' ? 0.47 : 0.53) * W, py = pivotY;
          const dx = p.cx - px, dy = p.cy - py;
          const nx = px + dx * Math.cos(a) - dy * Math.sin(a), ny = py + dx * Math.sin(a) + dy * Math.cos(a);
          p.x = nx - p.cx + s * 16 * e; p.y = ny - p.cy; p.r = a * 180 / Math.PI;
          p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.r + 'deg)';
        });
        spawnFibers(x + vAt(rnd(0, 100)) / 100 * W, y + rnd(0, H) * k, 2);
        if (k < 1) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
    await wait(260);
    // 第二下：碎成几片落下
    Sound.rip(0.35);
    pieces.forEach((p) => { const s = p.side === 'L' ? -1 : 1; p.vx = s * rnd(30, 150); p.vy = rnd(-260, -60); p.vr = rnd(-260, 260); });
    const t1 = performance.now(); let last = t1;
    await new Promise((res) => {
      function f(now) {
        const dt = Math.min(0.04, (now - last) / 1000); last = now;
        const el = (now - t1) / 1000;
        pieces.forEach((p) => {
          p.vy += 1500 * dt; p.vx *= 0.995; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.r + 'deg)';
          p.el.style.opacity = Math.max(0, 1 - Math.max(0, el - 0.6) * 1.6);
        });
        drawFibers(dt);
        if (el < 1.35) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
  }
  let fibers = [];
  function spawnFibers(fx, fy, n) {
    for (let i = 0; i < n; i++) fibers.push({ x: fx, y: fy, vx: rnd(-60, 60), vy: rnd(-80, 10), r: rnd(0, 6), s: rnd(2, 5), life: 1 });
    drawFibers(0.016);
  }
  function drawFibers(dt) {
    ctx.clearRect(0, 0, geo.vw, geo.vh);
    ctx.fillStyle = css('--paper') || '#fff';
    ctx.strokeStyle = css('--ink-soft') || '#888';
    fibers.forEach((f) => { f.vy += 500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += dt * 6; f.life -= dt * 0.9; ctx.save(); ctx.globalAlpha = Math.max(0, f.life); ctx.translate(f.x, f.y); ctx.rotate(f.r); ctx.fillRect(-f.s / 2, -f.s / 4, f.s, f.s / 2); ctx.lineWidth = 0.4; ctx.strokeRect(-f.s / 2, -f.s / 4, f.s, f.s / 2); ctx.restore(); });
    fibers = fibers.filter((f) => f.life > 0 && f.y < geo.vh + 20);
  }

  /* ================= 揉团扔进垃圾桶 ================= */
  function ballSVG(size) {
    const paper = css('--paper') || '#fffaf0', ink = css('--ink') || '#333';
    const n = 13, R = 46, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const r = R * rnd(0.82, 1.02); pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]); }
    let facets = '';
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const c = [50 + rnd(-10, 10), 50 + rnd(-10, 10)];
      const sh = rnd(0, 1);
      facets += '<path d="M' + a + 'L' + b + 'L' + c + 'Z" fill="' + (sh > 0.5 ? 'rgba(255,255,255,' + rnd(0.1, 0.35) + ')' : 'rgba(60,40,20,' + rnd(0.06, 0.2) + ')') + '"/>';
    }
    let creases = '';
    for (let i = 0; i < 9; i++) { const a = rnd(0, 6.28), r = rnd(5, 34); creases += '<path d="M' + (50 + Math.cos(a) * r) + ' ' + (50 + Math.sin(a) * r) + 'l' + rnd(-16, 16) + ' ' + rnd(-16, 16) + 'l' + rnd(-12, 12) + ' ' + rnd(-12, 12) + '" stroke="rgba(60,40,20,.28)" stroke-width="1" fill="none"/>'; }
    let lines = '';
    for (let i = 0; i < 5; i++) lines += '<path d="M' + rnd(12, 40) + ' ' + rnd(20, 80) + 'l' + rnd(20, 40) + ' ' + rnd(-6, 6) + '" stroke="' + ink + '" stroke-opacity=".25" stroke-width="1.2"/>';
    return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '"><defs><radialGradient id="bs" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs><path d="M' + pts.join('L') + 'Z" fill="' + paper + '" stroke="rgba(60,40,20,.35)" stroke-width="1"/>' + facets + lines + creases + '<path d="M' + pts.join('L') + 'Z" fill="url(#bs)"/></svg>';
  }
  function binSVG() {
    return '<svg class="bin-svg" viewBox="0 0 120 150" width="120" height="150" aria-hidden="true">' +
      '<g class="bin-lid"><rect x="6" y="20" width="108" height="11" rx="4" fill="var(--bin-dark)"/><path d="M48 20v-7a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v7" fill="none" stroke="var(--bin-dark)" stroke-width="5"/></g>' +
      '<g class="bin-body"><path d="M14 36h92l-9 108H23z" fill="var(--bin)"/><path d="M14 36h92l-1 10H15z" fill="var(--bin-dark)" opacity=".5"/>' +
      '<path d="M37 52l3 80M60 52v80M83 52l-3 80" stroke="var(--bin-dark)" stroke-width="4" stroke-linecap="round" opacity=".55"/></g></svg>';
  }
  async function crumple(img) {
    const { W, H, x, y, vw, vh } = geo;
    const sheet = document.createElement('div');
    sheet.className = 'stage-sheet';
    sheet.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + W + 'px;height:' + H + 'px;background-image:url(' + img.toDataURL('image/png') + ')';
    let cr = '';
    for (let i = 0; i < 26; i++) { const sx = rnd(0, 100), sy = rnd(0, 130); cr += '<path d="M' + sx + ' ' + sy + 'l' + rnd(-30, 30) + ' ' + rnd(-30, 30) + 'l' + rnd(-20, 20) + ' ' + rnd(-20, 20) + '" stroke="rgba(' + (i % 2 ? '60,40,20,.35' : '255,255,255,.7') + ')" stroke-width="' + rnd(0.6, 1.4) + '" fill="none"/>'; }
    sheet.innerHTML = '<svg class="creases" viewBox="0 0 100 130" preserveAspectRatio="none">' + cr + '</svg>';
    layer.appendChild(sheet);
    await wait(300);
    Sound.crumple();
    const creases = sheet.querySelector('.creases');
    creases.animate([{ opacity: 0 }, { opacity: 0.6, offset: 0.3 }, { opacity: 1 }], { duration: 1000, fill: 'forwards' });
    const a = sheet.animate([
      { transform: 'none', borderRadius: '3px', filter: 'brightness(1)' },
      { transform: 'scale(.92,.8) rotate(-5deg) skewX(5deg)', borderRadius: '10% 6% 14% 8%', offset: 0.22 },
      { transform: 'scale(.66,.58) rotate(9deg) skewY(-6deg)', borderRadius: '30% 22% 34% 26%', offset: 0.48 },
      { transform: 'scale(.4,.38) rotate(-16deg)', borderRadius: '42% 40% 46% 38%', filter: 'brightness(.95)', offset: 0.74 },
      { transform: 'scale(.24) rotate(40deg)', borderRadius: '50%', filter: 'brightness(.92)' }
    ], { duration: reduce ? 300 : 1000, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
    // 垃圾桶从下方出现
    const binX = Math.round(vw / 2 + Math.min(70, vw * 0.16)), binY = vh - 190;
    const bin = document.createElement('div'); bin.className = 'bin'; bin.style.cssText = 'left:' + (binX - 60) + 'px;top:' + binY + 'px'; bin.innerHTML = binSVG();
    const front = document.createElement('div'); front.className = 'bin bin-front'; front.style.cssText = bin.style.cssText;
    front.innerHTML = '<svg viewBox="0 0 120 150" width="120" height="150"><path d="M14 46h92l-8 98H22z" fill="var(--bin)"/><path d="M37 52l3 80M60 52v80M83 52l-3 80" stroke="var(--bin-dark)" stroke-width="4" stroke-linecap="round" opacity=".55"/></svg>';
    layer.appendChild(bin);
    const binIn = [{ transform: 'translateY(220px)' }, { transform: 'translateY(0)' }];
    bin.animate(binIn, { duration: 450, delay: 400, easing: 'cubic-bezier(.2,1.3,.4,1)', fill: 'both' });
    await a.finished;
    // 换成纸团
    const bs = Math.round(W * 0.26);
    const ball = document.createElement('div'); ball.className = 'ball';
    const bx0 = x + W / 2 - bs / 2, by0 = y + H / 2 - bs / 2;
    ball.style.cssText = 'left:' + bx0 + 'px;top:' + by0 + 'px;width:' + bs + 'px;height:' + bs + 'px';
    ball.innerHTML = ballSVG(bs);
    layer.appendChild(ball); sheet.remove();
    layer.appendChild(front);
    front.animate(binIn, { duration: 1, fill: 'both' });
    await ball.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08,.92)' }, { transform: 'scale(1)' }], { duration: 220 }).finished;
    // 抛物线投篮
    const tx = binX - bs / 2, ty = binY + 22 - bs / 2;
    const peak = Math.min(180, by0 - 40);
    const frames = [];
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      const fx = (tx - bx0) * s, fy = (ty - by0) * s - 4 * peak * s * (1 - s);
      frames.push({ transform: 'translate(' + fx + 'px,' + fy + 'px) rotate(' + (s * 600) + 'deg) scale(' + (1 - s * 0.18) + ')' });
    }
    const lid = bin.querySelector('.bin-lid');
    setTimeout(() => lid.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-62deg)' }], { duration: 220, fill: 'forwards', easing: 'ease-out' }), 380);
    await ball.animate(frames, { duration: reduce ? 200 : 760, easing: 'cubic-bezier(.35,0,.65,1)', fill: 'forwards' }).finished;
    // 落入桶中
    const last = frames[frames.length - 1].transform;
    await ball.animate([{ transform: last }, { transform: last.replace(/translate\(([^,]+),([^)]+)\)/, (m, a1, b1) => 'translate(' + a1 + ',' + (parseFloat(b1) + 60) + 'px)') }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished;
    ball.remove();
    Sound.thud();
    lid.animate([{ transform: 'rotate(-62deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 420, fill: 'forwards', easing: 'ease-in' });
    const wob = [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0)' }];
    bin.firstChild.animate(wob, { duration: 520 }); front.firstChild.animate(wob, { duration: 520 });
    await wait(700);
    const out = [{ transform: 'translateY(0)' }, { transform: 'translateY(240px)' }];
    bin.animate(out, { duration: 380, easing: 'ease-in', fill: 'forwards' });
    await front.animate(out, { duration: 380, easing: 'ease-in', fill: 'forwards' }).finished;
  }

  /* ================= 焚烧 ================= */
  function valueNoise(gw, gh) {
    const g = new Float32Array((gw + 1) * (gh + 1)).map(() => Math.random());
    return (u, v) => { // u,v in [0,1]
      const fx = u * gw, fy = v * gh; const ix = Math.floor(fx), iy = Math.floor(fy); const tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const i0 = iy * (gw + 1) + ix;
      const a = g[i0], b = g[i0 + 1], c = g[i0 + gw + 1], d = g[i0 + gw + 2];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }
  async function burn(img) {
    const { W, H, x, y, vw, vh } = geo;
    const pw = img.width, ph = img.height;
    const src = img.getContext('2d').getImageData(0, 0, pw, ph).data;
    const off = document.createElement('canvas'); off.width = pw; off.height = ph;
    const octx = off.getContext('2d');
    const out = octx.createImageData(pw, ph); const od = out.data;
    const n1 = valueNoise(5, 6), n2 = valueNoise(16, 20), n3 = valueNoise(40, 52);
    const ox = Math.random() < 0.5 ? rnd(0.05, 0.3) : rnd(0.7, 0.95), oy = 1.02;
    const thr = new Float32Array(pw * ph);
    const maxD = Math.hypot(Math.max(ox, 1 - ox), oy * 1.3);
    for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) {
      const u = i / pw, v = j / ph;
      const dist = Math.hypot(u - ox, (v - oy) * 1.3) / maxD;
      thr[j * pw + i] = dist * 0.82 + n1(u, v) * 0.22 + n2(u, v) * 0.08 + n3(u, v) * 0.03;
    }
    const flames = [], embers = [], ash = [];
    const sx = W / pw, sy = H / ph;
    const DUR = reduce ? 1.2 : 3.6;
    Sound.fire(DUR + 0.6);
    const t0 = performance.now(); let last = t0;
    await new Promise((res) => {
      function frame(now) {
        const dt = Math.min(0.04, (now - last) / 1000); last = now;
        const el = (now - t0) / 1000;
        const k = Math.min(1, el / DUR);
        const T = -0.04 + Math.pow(k, 1.15) * 1.42;
        let edgeCount = 0;
        for (let p = 0, q = 0; p < thr.length; p++, q += 4) {
          const d = thr[p] - T;
          if (d < -0.06) { od[q + 3] = 0; continue; }
          if (d < 0) { const a = (d + 0.06) / 0.06; od[q] = 26; od[q + 1] = 20; od[q + 2] = 17; od[q + 3] = 235 * a * a; continue; }
          if (d < 0.016) {
            const f = d / 0.016; const fl = 0.85 + Math.random() * 0.15;
            od[q] = 255 * fl; od[q + 1] = (120 + 110 * (1 - Math.abs(f - 0.5) * 2)) * fl; od[q + 2] = 40 + 60 * (1 - f); od[q + 3] = 255;
            if ((edgeCount++ & 31) === 0 && Math.random() < 0.6 && flames.length < 260) flames.push({ x: x + (p % pw) * sx, y: y + Math.floor(p / pw) * sy, vx: rnd(-12, 12), vy: rnd(-70, -140), life: rnd(0.35, 0.8), m: 0, r: rnd(5, 13) });
            continue;
          }
          if (d < 0.075) {
            const s = 1 - (d - 0.016) / 0.059; const s2 = s * s;
            od[q] = src[q] * (1 - s2 * 0.75) + 70 * s2 * 0.75; od[q + 1] = src[q + 1] * (1 - s2 * 0.8) + 38 * s2 * 0.8; od[q + 2] = src[q + 2] * (1 - s2 * 0.9) + 14 * s2 * 0.9; od[q + 3] = 255;
            continue;
          }
          od[q] = src[q]; od[q + 1] = src[q + 1]; od[q + 2] = src[q + 2]; od[q + 3] = 255;
        }
        octx.putImageData(out, 0, 0);
        ctx.clearRect(0, 0, vw, vh);
        // 地面光晕
        const glowA = Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.5;
        if (glowA > 0.01) { const g = ctx.createRadialGradient(x + W / 2, y + H * (1 - k * 0.6), 10, x + W / 2, y + H * (1 - k * 0.6), W * 1.1); g.addColorStop(0, 'rgba(255,140,40,' + glowA + ')'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh); }
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
        ctx.drawImage(off, x, y, W, H); ctx.restore();
        // 火焰
        ctx.globalCompositeOperation = 'lighter';
        for (let i = flames.length - 1; i >= 0; i--) {
          const f = flames[i]; f.m += dt; const lf = f.m / f.life;
          if (lf >= 1) { flames.splice(i, 1); if (Math.random() < 0.25) embers.push({ x: f.x, y: f.y, vx: rnd(-25, 25), vy: rnd(-60, -120), life: rnd(0.8, 1.8), m: 0 }); if (Math.random() < 0.2) ash.push({ x: f.x, y: f.y + 6, vx: rnd(-15, 15), vy: rnd(-25, -55), r: rnd(0, 6), vr: rnd(-4, 4), s: rnd(2, 5), life: rnd(1.4, 2.6), m: 0 }); continue; }
          f.x += f.vx * dt + Math.sin((now / 90) + i) * 0.3; f.y += f.vy * dt; f.vy -= 40 * dt;
          const r = f.r * (1 - lf * 0.6);
          const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
          g.addColorStop(0, 'rgba(255,236,170,' + (0.55 * (1 - lf)) + ')');
          g.addColorStop(0.4, 'rgba(255,150,40,' + (0.4 * (1 - lf)) + ')');
          g.addColorStop(1, 'rgba(220,60,10,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 6.283); ctx.fill();
        }
        for (let i = embers.length - 1; i >= 0; i--) {
          const e = embers[i]; e.m += dt; if (e.m > e.life) { embers.splice(i, 1); continue; }
          e.x += e.vx * dt + Math.sin(now / 200 + i) * 0.4; e.y += e.vy * dt;
          ctx.fillStyle = 'rgba(255,' + (170 + Math.random() * 60) + ',80,' + (1 - e.m / e.life) + ')';
          ctx.fillRect(e.x, e.y, 1.8, 1.8);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (let i = ash.length - 1; i >= 0; i--) {
          const a = ash[i]; a.m += dt; if (a.m > a.life) { ash.splice(i, 1); continue; }
          a.x += a.vx * dt + Math.sin(now / 400 + i) * 0.5; a.y += a.vy * dt; a.r += a.vr * dt;
          ctx.save(); ctx.globalAlpha = 0.75 * (1 - a.m / a.life); ctx.translate(a.x, a.y); ctx.rotate(a.r); ctx.fillStyle = '#2a2420'; ctx.fillRect(-a.s / 2, -a.s / 3, a.s, a.s * 0.66); ctx.restore();
        }
        if (k < 1 || flames.length || embers.length || ash.length) requestAnimationFrame(frame); else res();
      }
      requestAnimationFrame(frame);
    });
    ctx.clearRect(0, 0, vw, vh);
  }

  /* ================= 纸飞机 ================= */
  function planeSVG() {
    return '<svg viewBox="0 0 100 60" width="100%" height="100%" aria-hidden="true">' +
      '<path d="M98 30L2 3l26 27z" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".9" stroke-linejoin="round"/>' +
      '<path d="M98 30L2 57l26-27z" fill="var(--paper-shade)" stroke="var(--ink-soft)" stroke-width=".9" stroke-linejoin="round"/>' +
      '<path d="M98 30H28l-10 12z" fill="var(--paper-deep)" stroke="var(--ink-soft)" stroke-width=".9" stroke-linejoin="round"/>' +
      '<path d="M98 30L28 30" stroke="var(--ink-soft)" stroke-width=".6"/></svg>';
  }
  async function plane(img) {
    const { W, H, x, y, vw, vh } = geo;
    const url = img.toDataURL('image/png');
    const box = document.createElement('div'); box.className = 'fold-box';
    box.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + W + 'px;height:' + H + 'px';
    box.innerHTML = '<div class="fold-half left" style="background-image:url(' + url + ');background-size:' + W + 'px ' + H + 'px"></div>' +
      '<div class="fold-half right"><div class="face front" style="background-image:url(' + url + ');background-size:' + W + 'px ' + H + 'px;background-position:-' + (W / 2) + 'px 0"></div><div class="face back"></div></div>';
    layer.appendChild(box);
    await wait(320);
    Sound.whoosh(0.35);
    const right = box.querySelector('.fold-half.right');
    await right.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: reduce ? 200 : 560, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).finished;
    // 再折两角，然后变成纸飞机
    const ps = Math.min(150, W * 0.55);
    const pl = document.createElement('div'); pl.className = 'plane';
    const cx = x + W / 4, cy = y + H / 2;
    pl.style.cssText = 'width:' + ps + 'px;height:' + (ps * 0.6) + 'px;left:' + (cx - ps / 2) + 'px;top:' + (cy - ps * 0.3) + 'px;opacity:0';
    pl.innerHTML = planeSVG();
    layer.appendChild(pl);
    Sound.whoosh(0.3);
    box.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.7,.55) rotate(-90deg)', opacity: 0.3, offset: 0.5 }, { transform: 'scale(.3,.25) rotate(-90deg)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
    await pl.animate([{ opacity: 0, transform: 'scale(.5) rotate(-50deg)' }, { opacity: 1, transform: 'scale(1.06) rotate(-8deg)', offset: 0.7 }, { opacity: 1, transform: 'scale(1) rotate(-12deg)' }], { duration: 560, delay: 220, easing: 'ease-out', fill: 'forwards' }).finished;
    box.remove();
    // 向后蓄力
    await pl.animate([{ transform: 'scale(1) rotate(-12deg)' }, { transform: 'translate(-18px,8px) scale(1) rotate(-4deg)' }], { duration: 260, easing: 'ease-out', fill: 'forwards' }).finished;
    // 起飞：沿贝塞尔曲线飞出屏幕
    Sound.whoosh(1.4);
    const P0 = [cx - 18, cy + 8], P1 = [cx + vw * 0.12, cy + 70], P2 = [vw * 0.55, cy - 240], P3 = [vw + 140, -170];
    const bz = (t, i) => { const u = 1 - t; return u * u * u * P0[i] + 3 * u * u * t * P1[i] + 3 * u * t * t * P2[i] + t * t * t * P3[i]; };
    const bd = (t, i) => { const u = 1 - t; return 3 * u * u * (P1[i] - P0[i]) + 6 * u * t * (P2[i] - P1[i]) + 3 * t * t * (P3[i] - P2[i]); };
    const trail = [];
    const DUR = reduce ? 600 : 1900; const t0 = performance.now();
    pl.getAnimations().forEach((a) => a.cancel());
    pl.style.left = '0px'; pl.style.top = '0px'; pl.style.opacity = 1;
    await new Promise((res) => {
      function f(now) {
        const k = Math.min(1, (now - t0) / DUR), t = easeInOut(k) * 0.55 + k * 0.45;
        const px = bz(t, 0), py = bz(t, 1);
        const ang = Math.atan2(bd(t, 1), bd(t, 0)) * 180 / Math.PI;
        const sc = 1 - t * 0.55;
        const roll = Math.sin(t * Math.PI * 2) * 18;
        pl.style.transform = 'translate(' + (px - ps / 2) + 'px,' + (py - ps * 0.3) + 'px) rotate(' + ang + 'deg) scale(' + sc + ',' + (sc * (1 - Math.abs(roll) / 60)) + ')';
        trail.push([px - Math.cos(ang * Math.PI / 180) * ps * 0.45 * sc, py - Math.sin(ang * Math.PI / 180) * ps * 0.45 * sc, now]);
        ctx.clearRect(0, 0, vw, vh);
        ctx.setLineDash([6, 9]); ctx.lineCap = 'round'; ctx.lineWidth = 2;
        for (let i = 1; i < trail.length; i++) {
          const age = (now - trail[i][2]) / 900; if (age > 1) continue;
          ctx.strokeStyle = 'rgba(' + (css('--trail') || '120,110,95') + ',' + (0.55 * (1 - age)) + ')';
          ctx.beginPath(); ctx.moveTo(trail[i - 1][0], trail[i - 1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke();
        }
        ctx.setLineDash([]);
        if (k < 1) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
    // 尾迹散去
    const tEnd = performance.now();
    await new Promise((res) => { function f(now) { const a = 1 - (now - tEnd) / 500; ctx.clearRect(0, 0, vw, vh); if (a > 0) { ctx.globalAlpha = a; ctx.setLineDash([6, 9]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(' + (css('--trail') || '120,110,95') + ',.3)'; ctx.beginPath(); trail.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; requestAnimationFrame(f); } else res(); } requestAnimationFrame(f); });
  }

  const LINES = {
    tear: ['撕成碎片了。', '碎了，就不用再拼回去。', '撕掉，到此为止。'],
    crumple: ['扔进垃圾桶了。', '团一团，丢掉。', '投中了，三分。'],
    burn: ['烧成灰，随风散了。', '烧干净了。', '只剩一点灰。'],
    plane: ['让它飞走吧。', '飞远了，看不见了。', '一路顺风，别回来。']
  };
  const DONE_LINES = { tear: '撕掉这一页，翻篇。', crumple: '完成的事，扔进历史。', burn: '烧掉清单，轻装上阵。', plane: '送它起飞，你自由了。' };

  const Destroy = {
    busy: false,
    methods: ['tear', 'crumple', 'burn', 'plane'],
    async run(method, opts) {
      if (this.busy) return;
      this.busy = true;
      opts = opts || {};
      if (method === 'random' || !this.methods.includes(method)) method = this.methods[Math.floor(Math.random() * 4)];
      try { await document.fonts.load('19px "LXGW WenKai"'); } catch (e) {}
      setupGeo();
      showStage();
      fibers = [];
      const scale = Math.min(window.devicePixelRatio || 1, method === 'burn' ? 1.5 : 2);
      const img = paperCanvas(opts.text, geo.W, geo.H, scale);
      try {
        await ({ tear, crumple, burn, plane })[method](img);
      } catch (e) { console.error(e); }
      ctx.clearRect(0, 0, geo.vw, geo.vh);
      const lines = LINES[method];
      caption.innerHTML = '';
      const p = document.createElement('p'); p.textContent = opts.done ? (opts.title ? '「' + opts.title + '」完成了。' : '') + DONE_LINES[method] : lines[Math.floor(Math.random() * lines.length)];
      caption.appendChild(p);
      if (opts.sub) { const s = document.createElement('small'); s.textContent = opts.sub; caption.appendChild(s); }
      if (window.Dog && Dog.cheerHTML) { const d = document.createElement('div'); d.className = 'stage-dog'; d.innerHTML = Dog.cheerHTML(); caption.appendChild(d); Sound.bark(); }
      caption.classList.add('on');
      await new Promise((res) => {
        let done = false;
        const fin = () => { if (done) return; done = true; stage.removeEventListener('click', fin); res(); };
        stage.addEventListener('click', fin);
        setTimeout(fin, 2400);
      });
      await hideStage();
      this.busy = false;
      return method;
    }
  };
  window.Destroy = Destroy;
})();
