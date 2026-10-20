/* 天气：用手机定位 + Open-Meteo（免费、无需密钥）查询当地实时天气，并绘制动态背景。
   位置只在你的手机和天气服务之间传递，不会被保存到别处。 */
(function () {
  const CODE = (c) => {
    if (c === 0 || c === 1) return { kind: 'sunny', text: c === 0 ? '晴' : '晴间少云' };
    if (c === 2) return { kind: 'cloudy', text: '多云' };
    if (c === 3) return { kind: 'cloudy', text: '阴' };
    if (c === 45 || c === 48) return { kind: 'fog', text: '雾' };
    if (c >= 51 && c <= 57) return { kind: 'rain', text: '毛毛雨' };
    if (c >= 61 && c <= 67) return { kind: 'rain', text: c >= 65 ? '大雨' : c >= 63 ? '中雨' : '小雨' };
    if (c >= 71 && c <= 77) return { kind: 'snow', text: c >= 75 ? '大雪' : '小雪' };
    if (c >= 80 && c <= 82) return { kind: 'rain', text: '阵雨' };
    if (c === 85 || c === 86) return { kind: 'snow', text: '阵雪' };
    if (c >= 95) return { kind: 'rain', text: '雷雨', storm: true };
    return { kind: 'cloudy', text: '多云' };
  };
  const NAMES = { sunny: '晴', cloudy: '多云', rain: '雨', fog: '雾', snow: '雪' };

  const W = {
    current: null, // 实际生效的 {kind, storm, isDay, text, temp, city}
    NAMES,
    listeners: [],
    onChange(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach((f) => { try { f(this.current); } catch (e) {} }); },

    apply() {
      const st = Store.state;
      const s = st.settings;
      const live = st.weather;
      let cur;
      if (s.theme === 'auto' && live) cur = Object.assign({}, live);
      else if (s.theme === 'auto') cur = { kind: 'sunny', text: '', isDay: true, pending: true };
      else cur = { kind: s.theme, text: NAMES[s.theme], isDay: live ? live.isDay : isDaytimeGuess(), manual: true, temp: live && live.temp, city: live && live.city };
      if (s.theme !== 'auto' && cur.kind === 'rain') cur.storm = false;
      const sysDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
      let dark;
      if (s.tone === 'dark') dark = true;
      else if (s.tone === 'light') dark = false;
      else dark = sysDark || (cur.isDay === false);
      cur.dark = dark;
      this.current = cur;
      const r = document.documentElement;
      r.dataset.weather = cur.kind;
      r.dataset.tone = dark ? 'dark' : 'light';
      r.dataset.storm = cur.storm ? '1' : '0';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = getComputedStyle(r).getPropertyValue('--sky1').trim() || '#f3ead8';
      Sky.setKind(cur.kind, dark, !!cur.storm);
      this.emit();
    },

    stale() {
      const w = Store.state.weather;
      return !w || (Date.now() - w.at > 30 * 60 * 1000);
    },

    refresh(force) {
      if (!force && !this.stale()) { this.apply(); return Promise.resolve(); }
      if (!('geolocation' in navigator)) { this.apply(); return Promise.reject(new Error('nogeo')); }
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const lat = pos.coords.latitude.toFixed(3), lon = pos.coords.longitude.toFixed(3);
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code,is_day&timezone=auto';
            const res = await fetch(url);
            if (!res.ok) throw new Error('http ' + res.status);
            const j = await res.json();
            const c = j.current || {};
            const m = CODE(c.weather_code);
            const prev = Store.state.weather;
            let city = prev && prev.lat === lat && prev.lon === lon ? prev.city : '';
            Store.state.weather = { kind: m.kind, text: m.text, storm: !!m.storm, isDay: c.is_day !== 0, temp: Math.round(c.temperature_2m), code: c.weather_code, at: Date.now(), lat, lon, city };
            Store.save();
            this.apply();
            resolve();
            if (!city) this.lookupCity(lat, lon);
          } catch (e) { this.apply(); reject(e); }
        }, (err) => { this.apply(); reject(err); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 20 * 60 * 1000 });
      });
    },

    async lookupCity(lat, lon) {
      try {
        const r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=zh');
        if (!r.ok) return;
        const j = await r.json();
        const name = j.city || j.locality || j.principalSubdivision || '';
        if (name && Store.state.weather) { Store.state.weather.city = name.replace(/市$/, ''); Store.save(); this.apply(); }
      } catch (e) {}
    }
  };

  function isDaytimeGuess() { const h = new Date().getHours(); return h >= 6 && h < 18; }

  /* ---------------- 动态天空 ---------------- */
  const Sky = (function () {
    const cv = document.getElementById('sky');
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, kind = 'sunny', dark = false, storm = false;
    let parts = [], clouds = [], raf = 0, flash = 0, nextFlash = 0, last = 0;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    const rnd = (a, b) => a + Math.random() * (b - a);

    function seed() {
      parts = []; clouds = [];
      const area = w * h / (390 * 844);
      if (kind === 'rain') {
        const n = Math.round((storm ? 170 : 120) * area);
        for (let i = 0; i < n; i++) parts.push({ x: rnd(-50, w + 50), y: rnd(-h, h), l: rnd(10, 22), v: rnd(560, 900), a: rnd(0.25, 0.6) });
      } else if (kind === 'snow') {
        const n = Math.round(90 * area);
        for (let i = 0; i < n; i++) parts.push({ x: rnd(0, w), y: rnd(-h, h), r: rnd(1.2, 3.6), v: rnd(22, 60), s: rnd(0, 6.28), sw: rnd(0.4, 1.4) });
      } else if (kind === 'sunny') {
        const n = Math.round((dark ? 120 : 26) * area);
        for (let i = 0; i < n; i++) parts.push(dark
          ? { x: rnd(0, w), y: rnd(0, h * 0.7), r: rnd(0.4, 1.4), tw: rnd(0, 6.28), sp: rnd(0.6, 2) }
          : { x: rnd(0, w), y: rnd(0, h), r: rnd(2, 7), v: rnd(4, 12), a: rnd(0.08, 0.22), s: rnd(0, 6.28) });
      }
      const nc = kind === 'cloudy' ? 6 : (kind === 'rain' || kind === 'snow') ? 5 : kind === 'fog' ? 0 : 2;
      for (let i = 0; i < nc; i++) {
        const sz = rnd(70, 150);
        const puffs = [];
        for (let k = 0; k < 6; k++) puffs.push({ dx: rnd(-sz, sz), dy: rnd(-sz * 0.25, sz * 0.2), r: rnd(sz * 0.4, sz * 0.75) });
        clouds.push({ x: rnd(-100, w + 100), y: rnd(-20, h * (kind === 'cloudy' ? 0.45 : 0.22)), v: rnd(4, 12), puffs });
      }
    }

    function cloudColor() {
      if (kind === 'rain') return dark ? 'rgba(70,82,98,' : 'rgba(150,165,178,';
      if (kind === 'snow') return dark ? 'rgba(90,100,120,' : 'rgba(225,232,240,';
      return dark ? 'rgba(80,92,112,' : 'rgba(255,255,255,';
    }

    function draw(dt, t) {
      ctx.clearRect(0, 0, w, h);
      // 太阳 / 月亮的光晕
      if (kind === 'sunny') {
        const gx = w * 0.88, gy = h * 0.04;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.75);
        if (dark) { g.addColorStop(0, 'rgba(255,236,190,0.18)'); g.addColorStop(0.08, 'rgba(255,236,190,0.06)'); g.addColorStop(1, 'rgba(255,236,190,0)'); }
        else { g.addColorStop(0, 'rgba(255,214,140,0.55)'); g.addColorStop(0.25, 'rgba(255,214,140,0.16)'); g.addColorStop(1, 'rgba(255,214,140,0)'); }
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        if (!dark) {
          ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * 0.00003);
          for (let i = 0; i < 9; i++) {
            ctx.rotate(Math.PI * 2 / 9);
            const rg = ctx.createLinearGradient(0, 0, 0, h * 0.9);
            rg.addColorStop(0, 'rgba(255,230,170,0.12)'); rg.addColorStop(1, 'rgba(255,230,170,0)');
            ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-38, h * 0.9); ctx.lineTo(38, h * 0.9); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(250,240,215,0.9)'; ctx.beginPath(); ctx.arc(gx - 6, gy + 34, 15, 0, 6.283); ctx.fill();
          ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(gx + 1, gy + 29, 13, 0, 6.283); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
        }
      }
      // 云
      const cc = cloudColor();
      clouds.forEach((c) => {
        c.x += c.v * dt; if (c.x - 260 > w) c.x = -260;
        c.puffs.forEach((p) => {
          const g = ctx.createRadialGradient(c.x + p.dx, c.y + p.dy, 0, c.x + p.dx, c.y + p.dy, p.r);
          const a = kind === 'cloudy' ? 0.5 : 0.42;
          g.addColorStop(0, cc + a + ')'); g.addColorStop(1, cc + '0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x + p.dx, c.y + p.dy, p.r, 0, 6.283); ctx.fill();
        });
      });
      // 粒子
      if (kind === 'rain') {
        ctx.lineCap = 'round';
        const ang = 0.18;
        ctx.strokeStyle = dark ? 'rgba(170,195,220,1)' : 'rgba(70,100,130,1)';
        parts.forEach((p) => {
          p.y += p.v * dt; p.x += p.v * dt * ang;
          if (p.y > h + 20) { p.y = rnd(-80, -10); p.x = rnd(-80, w); if (Math.random() < 0.5) splashes.push({ x: p.x + (h + 20) * ang * 0, y: h - rnd(4, 60), t: 0 }); }
          ctx.globalAlpha = p.a * 0.55; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.l * ang, p.y - p.l); ctx.stroke();
        });
        ctx.globalAlpha = 1;
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i]; s.t += dt;
          if (s.t > 0.35) { splashes.splice(i, 1); continue; }
          ctx.globalAlpha = (1 - s.t / 0.35) * 0.35; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(s.x, s.y, 2 + s.t * 30, 1 + s.t * 6, 0, 0, 6.283); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (storm) {
          if (t > nextFlash) { flash = 1; nextFlash = t + rnd(5000, 14000); }
          if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (flash * (dark ? 0.35 : 0.55)) + ')'; ctx.fillRect(0, 0, w, h); flash -= dt * (flash > 0.6 ? 6 : 2.2); }
        }
      } else if (kind === 'snow') {
        ctx.fillStyle = dark ? 'rgba(235,240,250,0.85)' : 'rgba(255,255,255,0.95)';
        parts.forEach((p) => {
          p.y += p.v * dt; p.s += dt * p.sw; p.x += Math.sin(p.s) * 0.35;
          if (p.y > h + 6) { p.y = -6; p.x = rnd(0, w); }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        });
        if (!dark) { ctx.strokeStyle = 'rgba(140,160,190,0.25)'; parts.forEach((p) => { if (p.r > 2.6) { ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke(); } }); }
      } else if (kind === 'sunny') {
        if (dark) {
          parts.forEach((p) => { p.tw += dt * p.sp; ctx.fillStyle = 'rgba(255,250,230,' + (0.35 + 0.45 * Math.abs(Math.sin(p.tw))) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); });
        } else {
          parts.forEach((p) => {
            p.y -= p.v * dt; p.s += dt * 0.6; p.x += Math.sin(p.s) * 0.15;
            if (p.y < -10) { p.y = h + 10; p.x = rnd(0, w); }
            ctx.fillStyle = 'rgba(255,225,160,' + p.a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
          });
        }
      }
    }
    const splashes = [];

    function loop(t) {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      draw(dt, t);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      cancelAnimationFrame(raf); last = 0;
      if (reduce) { draw(0, 0); return; }
      raf = requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
    window.addEventListener('resize', () => { resize(); if (reduce) draw(0, 0); });

    return {
      setKind(k, d, s) {
        const changed = k !== kind || d !== dark || s !== storm || !w;
        kind = k; dark = d; storm = s;
        if (changed) { resize(); start(); }
      }
    };
  })();

  window.Weather = W;
})();
