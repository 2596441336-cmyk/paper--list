/* Bertholdt —— 一只原创形象的伯恩山小男孩。住在院子里的小窝，跟着天气和你的行动做出反应。 */
(function () {
  const C = { fur: '#1e1a19', fur2: '#2b2523', rust: '#b4632c', rust2: '#93501f', white: '#f7f2e9', white2: '#e3dacb', nose: '#141010', eye: '#2b170c', tongue: '#e27b78' };

  /* ---------- 狗狗本体（坐姿正面），返回 <g> 片段 ---------- */
  function dogParts(o) {
    o = o || {};
    const stage = o.stage || 'adult';
    const head = stage === 'puppy' ? 1.17 : stage === 'young' ? 1.07 : 1;
    const body = stage === 'puppy' ? 0.8 : stage === 'young' ? 0.92 : 1;
    const chub = 1 + Math.min(0.18, (o.chub || 0) / 100 * 0.18);
    const leg = (x, flip) => {
      const x2 = x + 18;
      return '<path d="M' + x + ' 156Q' + (x - 2) + ' 176 ' + (x + 2) + ' 195L' + (x2 - 2) + ' 195Q' + (x2 + 1) + ' 176 ' + x2 + ' 156Q' + (x + 9) + ' 150 ' + x + ' 156Z" fill="' + C.fur + '"/>' +
        '<path d="M' + (x + 0.6) + ' 168Q' + (x) + ' 184 ' + (x + 2) + ' 195L' + (x2 - 2) + ' 195Q' + (x2) + ' 184 ' + (x2 - 0.6) + ' 168Q' + (x + 9) + ' 163 ' + (x + 0.6) + ' 168Z" fill="' + C.rust + '"/>' +
        '<ellipse cx="' + (x + 9) + '" cy="198" rx="12.5" ry="7" fill="' + C.white + '"/>' +
        '<path d="M' + (x + 5) + ' 199v4M' + (x + 9) + ' 199.5v4M' + (x + 13) + ' 199v4" stroke="' + C.white2 + '" stroke-width="1.2" stroke-linecap="round"/>';
    };
    return '' +
      '<g class="d-tail"><path d="M134 176C158 172 176 156 182 132C185 121 176 116 171 126C164 144 150 158 130 162Z" fill="' + C.fur + '"/>' +
      '<path d="M182 132C185 121 176 116 171 126C172 131 178 134 182 132Z" fill="' + C.white + '"/></g>' +
      '<g class="d-bodyparts" style="transform:scale(' + (body * chub) + ',' + body + ')">' +
        '<ellipse cx="62" cy="174" rx="31" ry="26" fill="' + C.fur + '"/><ellipse cx="138" cy="174" rx="31" ry="26" fill="' + C.fur + '"/>' +
        '<path d="M40 168Q52 162 62 172" stroke="' + C.fur2 + '" stroke-width="2" fill="none"/><path d="M160 168Q148 162 138 172" stroke="' + C.fur2 + '" stroke-width="2" fill="none"/>' +
        '<ellipse cx="45" cy="199" rx="15" ry="7" fill="' + C.white + '"/><ellipse cx="155" cy="199" rx="15" ry="7" fill="' + C.white + '"/>' +
        '<ellipse cx="45" cy="194" rx="11" ry="4" fill="' + C.rust + '"/><ellipse cx="155" cy="194" rx="11" ry="4" fill="' + C.rust + '"/>' +
        '<path d="M57 118C50 150 55 188 72 199L128 199C145 188 150 150 143 118C132 99 68 99 57 118Z" fill="' + C.fur + '"/>' +
        '<path d="M80 106C74 120 72 134 78 146C82 160 84 176 88 192L112 192C116 176 118 160 122 146C128 134 126 120 120 106C110 100 90 100 80 106Z" fill="' + C.white + '"/>' +
        '<path d="M92 120Q100 126 108 120M90 134Q100 140 110 134" stroke="' + C.white2 + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
        leg(73) + leg(109) +
      '</g>' +
      '<g class="d-head" style="--hs:' + head + ';--hy:' + (o.headOnly ? 0 : Math.round((1 - body) * 88)) + 'px">' +
        '<path class="d-neck" d="M66 96C66 118 76 128 100 128C124 128 134 118 134 96Z" fill="' + C.fur + '"/>' +
        (stage === 'puppy' ? '<path d="M90 102C89 114 84 122 75 130L125 130C116 122 111 114 110 102Z" fill="' + C.white + '"/>'
          : stage === 'young' ? '<path d="M90 102C89 114 84 124 78 134L122 134C116 124 111 114 110 102Z" fill="' + C.white + '"/>'
          : '<path d="M90 102C89 114 82 126 75.5 140L124.5 140C118 126 111 114 110 102Z" fill="' + C.white + '"/>') +
        '<g class="d-ear-l"><path d="M68 44C52 46 42 62 44 84C45 94 57 95 62 86C67 74 71 60 74 50Z" fill="' + C.fur2 + '"/></g>' +
        '<g class="d-ear-r"><path d="M132 44C148 46 158 62 156 84C155 94 143 95 138 86C133 74 129 60 126 50Z" fill="' + C.fur2 + '"/></g>' +
        '<path d="M100 25C129 25 147 43 147 68C147 93 128 109 100 109C72 109 53 93 53 68C53 43 71 25 100 25Z" fill="' + C.fur + '"/>' +
        '<ellipse cx="78" cy="88" rx="13" ry="10.5" fill="' + C.rust + '"/><ellipse cx="122" cy="88" rx="13" ry="10.5" fill="' + C.rust + '"/>' +
        '<path d="M100 33C96 33 94.5 40 94.5 50C94.5 60 90 70 84 78L116 78C110 70 105.5 60 105.5 50C105.5 40 104 33 100 33Z" fill="' + C.white + '"/>' +
        '<ellipse cx="100" cy="89" rx="22" ry="16.5" fill="' + C.white + '"/>' +
        '<path d="M86 100Q100 108 114 100" stroke="' + C.white2 + '" stroke-width="1.4" fill="none"/>' +
        '<ellipse cx="82" cy="55.5" rx="5.2" ry="3.4" transform="rotate(-12 82 55.5)" fill="' + C.rust + '"/><ellipse cx="118" cy="55.5" rx="5.2" ry="3.4" transform="rotate(12 118 55.5)" fill="' + C.rust + '"/>' +
        '<g class="d-eyes-open"><g class="d-eyes"><ellipse cx="83" cy="67" rx="5.2" ry="5.8" fill="' + C.eye + '"/><ellipse cx="117" cy="67" rx="5.2" ry="5.8" fill="' + C.eye + '"/>' +
          '<circle cx="85" cy="64.8" r="1.7" fill="#fff"/><circle cx="119" cy="64.8" r="1.7" fill="#fff"/><circle cx="81.6" cy="69" r=".8" fill="#fff" opacity=".6"/><circle cx="115.6" cy="69" r=".8" fill="#fff" opacity=".6"/></g></g>' +
        '<g class="d-eyes-closed"><path d="M77.5 67.5Q83 72 88.5 67.5M111.5 67.5Q117 72 122.5 67.5" stroke="' + C.white2 + '" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
        '<g class="d-eyes-happy"><path d="M77.5 69Q83 62.5 88.5 69M111.5 69Q117 62.5 122.5 69" stroke="' + C.white2 + '" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
        '<path d="M91.5 80C91.5 76 108.5 76 108.5 80C108.5 85 102.5 88.5 100 88.5C97.5 88.5 91.5 85 91.5 80Z" fill="' + C.nose + '"/>' +
        '<ellipse cx="97" cy="78.8" rx="3" ry="1.3" fill="#fff" opacity=".35"/>' +
        '<g class="d-tongue"><path d="M94.5 94C94.5 108 105.5 108 105.5 94Z" fill="' + C.tongue + '"/><path d="M100 96V103" stroke="#c45d5b" stroke-width="1"/></g>' +
        '<path d="M100 88.5V93.5M100 93.5C96 98 90.5 97.5 88 94.5M100 93.5C104 98 109.5 97.5 112 94.5" stroke="' + C.nose + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
        '<g class="d-mouthball"><circle cx="100" cy="100" r="9" fill="#d9e36a"/><path d="M92 97Q100 103 108 97" stroke="#fff" stroke-width="1.4" fill="none"/></g>' +
      '</g>';
  }

  function headOnlySVG(size) {
    return '<svg viewBox="40 20 120 95" width="' + size + '" height="' + Math.round(size * 95 / 120) + '" class="dog-svg pose-happy only-head" aria-hidden="true">' + dogParts({ stage: stageName(), headOnly: true }).replace(/<g class="d-tail">[\s\S]*?<\/g><g class="d-bodyparts"[\s\S]*?<\/g><g class="d-head"/, '<g class="d-head"') + '</svg>';
  }

  /* ---------- 状态 ---------- */
  const S = () => Store.state.dog;
  const clamp = (v) => Math.max(0, Math.min(100, v));
  function dogScale(stg) { return stg === 'puppy' ? 0.56 : stg === 'young' ? 0.63 : 0.7; }
  function stageName() { const l = S().love; return l < 150 ? 'puppy' : l < 500 ? 'young' : 'adult'; }
  const STAGE_TXT = { puppy: '幼犬', young: '少年', adult: '成年' };
  const STAGE_NEXT = { puppy: 150, young: 500, adult: null };

  function tick() {
    const d = S(); const now = Date.now();
    const h = Math.max(0, (now - d.last) / 3600000);
    if (h > 0) {
      d.full = clamp(d.full - 5 * h);
      d.water = clamp(d.water - 6 * h);
      d.mood = clamp(d.mood - (d.full < 30 || d.water < 25 ? 5 : 2.2) * h);
      d.chub = Math.max(0, d.chub - 2.2 * h / 24 * 4);
      d.last = now;
    }
    if (d.fedDay !== D.todayKey()) { d.fedDay = D.todayKey(); d.fedToday = 0; }
    Store.save();
  }
  function addLove(n) { S().love += n; Store.save(); }

  /* ---------- 院子场景 ---------- */
  const yard = () => document.getElementById('yard');
  let tempOut = 0, busy = false, bubbleT = 0;

  function sceneState() {
    const w = Weather.current || { kind: 'sunny', isDay: true };
    const night = w.isDay === false;
    const inside = (w.kind === 'rain' || night) && Date.now() > tempOut;
    return { w, night, inside, sleep: inside && night && !busy };
  }

  function buildYard() {
    const st = sceneState();
    const kind = st.w.kind;
    const stg = stageName();
    const sc = dogScale(stg);
    const fence = [];
    for (let x = -6; x < 370; x += 22) fence.push('<path d="M' + x + ' 178V128l8-9 8 9v50z" fill="var(--fence)" stroke="var(--fence-line)" stroke-width="1"/>');
    let weatherBits = '';
    if (kind === 'rain') weatherBits = '<ellipse cx="196" cy="236" rx="40" ry="5" fill="var(--puddle)"/><ellipse cx="318" cy="250" rx="26" ry="4" fill="var(--puddle)"/><ellipse cx="40" cy="244" rx="22" ry="3.5" fill="var(--puddle)"/>';
    let roofSnow = '';
    if (kind === 'snow') { weatherBits = '<path d="M0 196Q90 186 180 194T360 190V260H0z" fill="var(--snowcap)" opacity=".85"/>'; roofSnow = '<path d="M12 120L90 58L168 120L162 122Q140 112 126 100Q110 92 90 70Q70 92 54 100Q40 112 18 122Z" fill="var(--snowcap)"/>'; }
    if (kind === 'sunny' && !st.night) weatherBits = '<ellipse cx="226" cy="232" rx="70" ry="14" fill="var(--sunpatch)"/>';
    const dogX = 222, dogY = 236;
    const outDog = '<g class="dog-pos" id="dogPos" style="transform:translate(' + (dogX - 100 * sc) + 'px,' + (dogY - 200 * sc) + 'px) scale(' + sc + ')"><g class="dog-svg" id="dogSvg">' + dogParts({ stage: stg, chub: S().chub }) + '</g></g>';
    const inDog = '<g class="dog-pos" id="dogPos" style="transform:translate(' + (90 - 100 * 0.5) + 'px,' + (142) + 'px) scale(.5)"><g class="dog-svg" id="dogSvg">' + dogParts({ stage: stg, chub: S().chub }) + '</g></g>';
    const d = S();
    const food = d.bowlFood ? '<g class="bowl-food"><ellipse cx="272" cy="229" rx="17" ry="4.5" fill="#b07a45"/><circle cx="264" cy="227" r="2.6" fill="#8a5a2c"/><circle cx="271" cy="226" r="2.6" fill="#9c6a38"/><circle cx="279" cy="227.5" r="2.6" fill="#8a5a2c"/><circle cx="268" cy="230" r="2.4" fill="#a8743f"/></g>' : '';
    const wl = Math.max(0.05, d.water / 100);
    return '<svg viewBox="0 0 360 262" class="yard-svg" role="img" aria-label="Bertholdt 的院子">' +
      '<defs><clipPath id="doorClip"><path d="M64 212V160A26 26 0 0 1 116 160V212z"/></clipPath></defs>' +
      '<rect width="360" height="262" fill="var(--yard-sky)"/>' +
      fence.join('') +
      '<path d="M0 182Q90 172 180 180T360 176V262H0z" fill="var(--ground)"/>' +
      '<path d="M0 206Q120 198 220 206T360 202" stroke="var(--ground-line)" stroke-width="1.5" fill="none"/>' +
      weatherBits +
      // 小窝：后墙与门洞
      '<g class="kennel" id="kennel">' +
        '<path d="M28 116H152V212H28z" fill="var(--wood-dark)"/>' +
        '<path d="M64 212V160A26 26 0 0 1 116 160V212z" fill="#24180f"/>' +
        (st.inside ? '<g clip-path="url(#doorClip)">' + inDog + '</g>' : '') +
        '<path fill-rule="evenodd" d="M28 116H152V212H28zM64 212V160A26 26 0 0 1 116 160V212z" fill="var(--wood)"/>' +
        '<path d="M28 140H64M116 140H152M28 164H64M116 164H152M28 188H64M116 188H152" stroke="var(--wood-dark)" stroke-width="1.4" opacity=".55"/>' +
        '<path d="M14 122L90 62L166 122L158 128L90 74L22 128Z" fill="var(--roof)"/>' +
        '<path d="M22 128L90 74L158 128" fill="none" stroke="var(--roof-dark)" stroke-width="2"/>' +
        '<rect x="66" y="122" width="48" height="15" rx="2.5" fill="var(--plate)"/>' +
        '<text x="90" y="133" text-anchor="middle" font-size="7.6" font-family="Young Serif, Georgia, serif" fill="var(--plate-ink)" letter-spacing=".6">BERTHOLDT</text>' +
        '<path d="M64 212V160A26 26 0 0 1 116 160V212" fill="none" stroke="var(--wood-dark)" stroke-width="3"/>' +
        roofSnow +
      '</g>' +
      (st.inside ? '' : outDog) +
      // 饭碗与水碗
      '<g class="bowl" id="foodBowl"><path d="M250 226h44l-5 15h-34z" fill="var(--bowl)"/><ellipse cx="272" cy="226" rx="22" ry="6" fill="var(--bowl-rim)"/><ellipse cx="272" cy="227" rx="18" ry="4.3" fill="var(--bowl-in)"/>' + food + '<text x="272" y="238.5" text-anchor="middle" font-size="6" fill="var(--bowl-ink)" font-family="Young Serif, Georgia, serif">B</text></g>' +
      '<g class="bowl" id="waterBowl"><path d="M304 232h38l-4 13h-30z" fill="var(--bowl2)"/><ellipse cx="323" cy="232" rx="19" ry="5.2" fill="var(--bowl-rim)"/><ellipse cx="323" cy="233" rx="15.5" ry="3.8" fill="var(--bowl-in)"/><ellipse class="water-fill" cx="323" cy="233" rx="' + (15.5 * Math.sqrt(wl)).toFixed(1) + '" ry="' + (3.8 * Math.sqrt(wl)).toFixed(1) + '" fill="#7fb6d6"/></g>' +
      '<g id="yardBall"></g>' +
      (st.sleep ? '<g class="zzz"><text x="122" y="150">z</text><text x="132" y="138">z</text><text x="144" y="124">Z</text></g>' : '') +
      '</svg>' +
      '<div class="bubble" id="dogBubble" hidden></div>';
  }

  function poseClass() {
    const st = sceneState(); const d = S();
    if (st.sleep) return 'pose-sleep';
    if (d.full < 30 || d.water < 20 || d.mood < 30) return 'pose-sad';
    if (d.mood > 80) return 'pose-content';
    return 'pose-sit';
  }

  function render() {
    tick();
    const y = yard(); if (!y) return;
    y.innerHTML = buildYard();
    const svg = document.getElementById('dogSvg');
    if (svg) svg.setAttribute('class', 'dog-svg ' + poseClass());
    y.querySelector('#dogPos') && y.querySelector('#dogPos').addEventListener('click', pet);
    y.querySelector('#kennel').addEventListener('click', () => { if (sceneState().inside) comeOut(); });
    y.querySelector('#foodBowl').addEventListener('click', () => App.openFeed());
    y.querySelector('#waterBowl').addEventListener('click', water);
    renderMeta();
  }

  function renderMeta() {
    const d = S(); const st = sceneState(); const stg = stageName();
    const days = Math.floor((D.today() - new Date(new Date(d.born).toDateString())) / 86400000) + 1;
    const age = document.getElementById('dogAge');
    if (age) age.textContent = STAGE_TXT[stg] + ' · 相处第 ' + days + ' 天';
    let line;
    const k = st.w.kind;
    if (st.sleep) line = '夜深了，Bertholdt 在小窝里睡着了。';
    else if (st.inside && k === 'rain') line = '外面在下雨，Bertholdt 趴在小窝门口看雨。';
    else if (st.inside) line = '天黑了，Bertholdt 窝在小窝里。';
    else if (k === 'snow') line = '下雪了！伯恩山最喜欢雪，Bertholdt 在雪地里打滚。';
    else if (k === 'fog') line = '雾有点大，Bertholdt 竖着耳朵听院子外的动静。';
    else if (k === 'sunny') line = '太阳很好，Bertholdt 在院子里晒太阳。';
    else line = '阴天，Bertholdt 在院子里慢慢溜达。';
    const extra = [];
    if (d.full < 30) extra.push('它饿了，一直盯着饭碗。');
    else if (d.full > 92) extra.push('刚吃饱，肚子圆滚滚的。');
    if (d.water < 25) extra.push('水碗快空了。');
    if (d.chub > 55) extra.push('最近零食吃得有点多。');
    const ds = document.getElementById('dogStatus');
    if (ds) ds.textContent = line + (extra.length ? ' ' + extra.join(' ') : '');
    const next = STAGE_NEXT[stg];
    const prev = stg === 'puppy' ? 0 : stg === 'young' ? 150 : 500;
    const lovePct = next ? (d.love - prev) / (next - prev) * 100 : 100;
    const meter = (label, v, cls, txt) => '<div class="meter ' + cls + (v < 30 ? ' low' : '') + '"><span class="m-label">' + label + '</span><span class="m-bar"><i style="width:' + Math.max(2, v).toFixed(0) + '%"></i></span><span class="m-val">' + txt + '</span></div>';
    const m = document.getElementById('meters');
    if (m) m.innerHTML = meter('饱腹', d.full, 'm-full', Math.round(d.full)) + meter('心情', d.mood, 'm-mood', Math.round(d.mood)) + meter('饮水', d.water, 'm-water', Math.round(d.water)) +
      meter('亲密', lovePct, 'm-love', next ? (d.love + ' / ' + next) : d.love + ' · 满级');
    const mn = document.getElementById('mealNote');
    if (mn) {
      const times = Store.state.settings.mealTimes.slice().sort();
      const nowM = new Date().getHours() * 60 + new Date().getMinutes();
      const nx = times.find((t) => { const [h, mi] = t.split(':').map(Number); return h * 60 + mi > nowM; }) || times[0];
      mn.innerHTML = '';
      const p = document.createElement('span');
      p.textContent = '饭点：' + times.join(' / ') + (nx ? '　下一顿 ' + nx : '') + '　今天喂了 ' + d.fedToday + ' 次';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'link-btn'; b.textContent = '饭点提醒加入日历';
      b.addEventListener('click', () => { ICS.meals(Store.state.settings.mealTimes); App.toast('已生成喂饭提醒，在弹出的页面里点「全部添加」'); });
      mn.append(p, b);
    }
  }

  function say(text, ms) {
    const b = document.getElementById('dogBubble'); if (!b) return;
    b.textContent = text; b.hidden = false;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    clearTimeout(bubbleT); bubbleT = setTimeout(() => { b.hidden = true; }, ms || 2200);
  }
  function setPose(p) { const s = document.getElementById('dogSvg'); if (s) s.setAttribute('class', 'dog-svg ' + p); }
  function hearts(n) {
    const y = yard(); if (!y) return;
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span'); h.className = 'heart';
      h.style.left = (56 + Math.random() * 18) + '%'; h.style.top = (52 + Math.random() * 12) + '%';
      h.style.animationDelay = (i * 0.12) + 's';
      h.textContent = '♥';
      y.appendChild(h); setTimeout(() => h.remove(), 1600 + i * 120);
    }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function comeOut(ms) {
    tempOut = Date.now() + (ms || 12000);
    render();
    say(sceneState().w.kind === 'rain' ? '出来一会儿，就一会儿。' : '汪？', 1600);
    setTimeout(() => { if (!busy) render(); }, (ms || 12000) + 200);
  }

  /* ---------- 互动 ---------- */
  let lastPetLove = 0;
  function pet() {
    if (busy) return;
    Sound.unlock();
    const d = S(); const st = sceneState();
    if (st.sleep) { say('呼……呼……（睡得正香）'); return; }
    d.mood = clamp(d.mood + 6);
    if (Date.now() - lastPetLove > 30000) { addLove(1); lastPetLove = Date.now(); }
    Store.save();
    setPose('pose-happy'); hearts(3);
    say(['汪！', '再摸摸～', '（尾巴摇成螺旋桨）', '最喜欢你了'][Math.floor(Math.random() * 4)]);
    setTimeout(() => { if (!busy) { setPose(poseClass()); renderMeta(); } }, 1600);
    renderMeta();
  }

  async function feed(food) {
    if (busy) return;
    Sound.unlock();
    const d = S();
    tick();
    if (d.full >= 95) {
      if (sceneState().inside) await comeOut(6000);
      setPose('pose-full'); say('吃不下啦，肚子要撑破了。', 2400);
      setTimeout(() => setPose(poseClass()), 2400);
      return;
    }
    busy = true;
    const wasIn = sceneState().inside;
    if (wasIn) tempOut = Date.now() + 10000;
    d.bowlFood = food.id;
    render();
    // 食物掉进碗里
    const y = yard();
    const drop = document.createElement('span'); drop.className = 'food-drop'; drop.textContent = food.ico;
    y.appendChild(drop);
    Sound.pop();
    await wait(650); drop.remove();
    // 走到碗边吃
    const pos = document.getElementById('dogPos');
    const stg = stageName(); const sc = dogScale(stg);
    pos.style.transition = 'transform .7s cubic-bezier(.4,0,.3,1)';
    pos.style.transform = 'translate(' + (272 - 100 * sc) + 'px,' + (226 - 200 * sc) + 'px) scale(' + sc + ')';
    // 让碗画在狗前面
    const bowl = document.getElementById('foodBowl'); bowl.parentNode.appendChild(bowl);
    await wait(700);
    setPose('pose-eat'); Sound.crunch();
    await wait(2100);
    d.full = clamp(d.full + food.full);
    d.mood = clamp(d.mood + food.mood);
    d.chub = Math.max(0, Math.min(100, d.chub + (food.kind === 'snack' ? 7 : food.kind === 'veg' ? -2 : 1)));
    if (d.fedToday < 6) addLove(2);
    d.fedToday += 1; d.bowlFood = null;
    Store.save();
    const fb = document.querySelector('.bowl-food'); if (fb) fb.remove();
    setPose('pose-happy');
    const lines = food.kind === 'snack' ? ['零食！是零食！', '还有吗还有吗'] : food.kind === 'veg' ? ['嗯……健康的味道。', '嚼嚼嚼，还行'] : ['好吃！', '吃饱饱，汪！'];
    say(lines[Math.floor(Math.random() * lines.length)]);
    hearts(2);
    await wait(1300);
    pos.style.transform = 'translate(' + (222 - 100 * sc) + 'px,' + (236 - 200 * sc) + 'px) scale(' + sc + ')';
    await wait(700);
    busy = false;
    if (wasIn) tempOut = Date.now() + 3000;
    render();
  }

  async function water() {
    if (busy) return;
    Sound.unlock();
    const d = S(); d.water = 100; d.mood = clamp(d.mood + 2); Store.save();
    Sound.splash();
    const f = document.querySelector('.water-fill');
    if (f) { f.setAttribute('rx', '15.5'); f.setAttribute('ry', '3.8'); f.classList.add('ripple'); }
    say('咕嘟咕嘟。', 1500);
    renderMeta();
  }

  async function play() {
    if (busy) return;
    Sound.unlock();
    const st = sceneState();
    if (st.sleep) { say('嘘，它在睡觉。'); return; }
    busy = true;
    if (st.inside) { tempOut = Date.now() + 9000; render(); await wait(300); }
    const ball = document.getElementById('yardBall');
    ball.innerHTML = '<circle r="8" fill="#d9e36a"/><path d="M-7 -2Q0 4 7 -2" stroke="#fff" stroke-width="1.3" fill="none"/>';
    const anim = ball.animate([{ transform: 'translate(330px,250px)' }, { transform: 'translate(220px,60px)', offset: 0.45 }, { transform: 'translate(110px,120px)', offset: 0.7 }, { transform: 'translate(-30px,230px)' }], { duration: 1100, easing: 'cubic-bezier(.3,.1,.5,1)', fill: 'forwards' });
    setPose('pose-happy'); Sound.bark();
    await wait(400);
    const pos = document.getElementById('dogPos');
    const stg = stageName(); const sc = dogScale(stg);
    pos.style.transition = 'transform .8s cubic-bezier(.5,0,.6,1)';
    pos.style.transform = 'translate(' + (-200) + 'px,' + (236 - 200 * sc) + 'px) scale(' + sc + ')';
    await anim.finished; ball.innerHTML = '';
    await wait(900);
    const svg = document.getElementById('dogSvg'); svg.classList.add('has-ball');
    pos.style.transition = 'transform 1s cubic-bezier(.3,0,.3,1)';
    pos.style.transform = 'translate(' + (222 - 100 * sc) + 'px,' + (236 - 200 * sc) + 'px) scale(' + sc + ')';
    await wait(1000);
    const d = S(); d.mood = clamp(d.mood + 12); d.full = clamp(d.full - 3);
    if (Date.now() - (d.lastPlay || 0) > 60000) { addLove(2); d.lastPlay = Date.now(); }
    Store.save();
    say('捡回来啦！再扔一次！'); hearts(2);
    await wait(1500);
    svg.classList.remove('has-ball');
    busy = false; setPose(poseClass()); renderMeta();
  }

  window.Dog = {
    render, renderMeta, tick, feed, water, pet, play, say,
    stageName,
    reward(n) { tick(); S().mood = clamp(S().mood + n * 3); addLove(n); },
    cheerHTML() { return headOnlySVG(74) + '<span class="cheer-bubble">汪！</span>'; },
    isBusy: () => busy
  };
})();
