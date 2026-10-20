/* 纸上清单 · 主程序 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const S = () => Store.state;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const METHOD_NAMES = { tear: '撕碎', crumple: '揉团扔掉', burn: '烧掉', plane: '纸飞机', random: '随机' };
  const CATS = ['工作', '学习', '生活', '其他'];
  const REPEAT = { none: '不重复', daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' };

  /* ---------------- 通用 ---------------- */
  let toastT = 0;
  function toast(t, ms) {
    const el = $('#toast'); el.textContent = t; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms || 2600);
  }

  const sheetWrap = $('#sheetWrap'), sheet = $('#sheet');
  function openSheet(html, mount) {
    sheet.innerHTML = '<div class="grab"></div>' + html;
    sheetWrap.hidden = false;
    requestAnimationFrame(() => sheetWrap.classList.add('on'));
    paintIcons(sheet);
    $$('[data-close]', sheet).forEach((b) => b.addEventListener('click', closeSheet));
    if (mount) mount(sheet);
  }
  function closeSheet() {
    sheetWrap.classList.remove('on');
    setTimeout(() => { sheetWrap.hidden = true; sheet.innerHTML = ''; }, 280);
  }
  $('#sheetBack').addEventListener('click', closeSheet);
  // 下拉关闭
  (function () {
    let y0 = null, dy = 0;
    sheet.addEventListener('touchstart', (e) => { if (sheet.scrollTop <= 0 && e.target.closest('.grab, .sheet-title')) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sheet.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    sheet.addEventListener('touchend', () => { if (y0 == null) return; sheet.style.transform = ''; if (dy > 90) closeSheet(); y0 = null; });
  })();

  function seg(name, options, value) {
    return '<div class="seg" data-seg="' + name + '">' + Object.keys(options).map((k) => '<button type="button" data-v="' + k + '"' + (k === value ? ' class="on"' : '') + '>' + options[k] + '</button>').join('') + '</div>';
  }
  function bindSeg(root, name, fn) {
    const el = $('[data-seg="' + name + '"]', root); if (!el) return;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', el).forEach((x) => x.classList.toggle('on', x === b));
      fn(b.dataset.v);
    });
  }

  /* ---------------- 顶部日期与天气 ---------------- */
  function renderTop() {
    const d = new Date();
    $('#todayMain').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日';
    const endY = new Date(d.getFullYear(), 11, 31);
    const left = Math.round((endY - D.today()) / 86400000);
    $('#todaySub').textContent = '星期' + D.week[d.getDay()] + ' · 今年还剩 ' + left + ' 天';
  }
  function renderWeatherChip(cur) {
    const ico = $('#wIcon'), tx = $('#wText');
    if (!cur) return;
    const live = S().weather;
    let k = cur.kind;
    if (cur.storm) k = 'storm';
    if (k === 'sunny' && cur.isDay === false) k = 'night';
    ico.innerHTML = Icons[k] || Icons.sunny;
    if (S().settings.theme === 'auto' && !live) tx.textContent = '开启天气';
    else {
      const parts = [];
      if (live && live.temp != null) parts.push(live.temp + '°');
      parts.push(cur.manual ? Weather.NAMES[cur.kind] + '（手动）' : (cur.text || Weather.NAMES[cur.kind]));
      if (live && live.city && !cur.manual) parts.push(live.city);
      tx.textContent = parts.join(' ');
    }
  }
  $('#weatherChip').addEventListener('click', openWeatherSheet);

  function openWeatherSheet() {
    const st = S().settings, live = S().weather;
    const when = live ? new Date(live.at) : null;
    openSheet(
      '<h3 class="sheet-title">天气与外观</h3>' +
      '<p class="sheet-note">' + (live ? '当前位置' + (live.city ? '（' + esc(live.city) + '）' : '') + '：' + esc(live.text) + '，' + live.temp + '°C。更新于 ' + D.pad(when.getHours()) + ':' + D.pad(when.getMinutes()) + '。' : '还没有获取天气。允许定位后，页面会跟着你所在地的天气变化。') + '</p>' +
      '<button type="button" class="big-btn" id="wLocate">' + (live ? '重新获取天气' : '允许定位，获取天气') + '</button>' +
      '<div class="field"><span class="f-label">页面主题</span>' + seg('theme', { auto: '跟随天气', sunny: '晴', cloudy: '多云', rain: '雨', fog: '雾', snow: '雪' }, st.theme) + '</div>' +
      '<div class="field"><span class="f-label">深色模式</span>' + seg('tone', { auto: '自动', light: '浅色', dark: '深色' }, st.tone) + '<span class="f-hint">自动：天黑后或系统为深色时切换。</span></div>' +
      '<p class="sheet-note small">天气数据来自 Open-Meteo。你的位置只用来查询天气，不会被保存或上传到别处。</p>',
      (root) => {
        bindSeg(root, 'theme', (v) => { st.theme = v; Store.save(); Weather.apply(); });
        bindSeg(root, 'tone', (v) => { st.tone = v; Store.save(); Weather.apply(); });
        $('#wLocate', root).addEventListener('click', locate);
      }
    );
  }
  function locate() {
    toast('正在获取天气……');
    geoOk = true;
    try { localStorage.setItem('paperlist.geo', '1'); } catch (e) {}
    Weather.refresh(true).then(() => { toast('天气已更新'); closeSheet(); }).catch((e) => {
      if (e && e.code === 1) toast('没有定位权限。可以在「设置 → 隐私与安全性 → 定位服务 → Safari 网站」里打开，或者手动选择主题。', 5200);
      else toast('暂时获取不到天气，稍后再试，或者手动选择主题。', 4000);
    });
  }

  /* ---------------- 标签页 ---------------- */
  let curTab = 'ddl';
  function showTab(t) {
    curTab = t;
    $$('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    $$('.view').forEach((v) => { v.hidden = v.dataset.view !== t; });
    if (t === 'ddl') renderDDL();
    if (t === 'sched') renderSched();
    if (t === 'shred') renderShred();
    if (t === 'dog') Dog.render();
    if (t === 'settings') renderSettings();
    window.scrollTo(0, 0);
    try { sessionStorage.setItem('paperlist.tab', t); } catch (e) {}
  }
  $$('.tabbar button').forEach((b) => b.addEventListener('click', () => { Sound.unlock(); showTab(b.dataset.tab); }));

  /* ---------------- 要事 DDL ---------------- */
  function urgency(left) { return left < 0 ? 'u-over' : left === 0 ? 'u-today' : left <= 3 ? 'u-soon' : left <= 7 ? 'u-week' : 'u-calm'; }
  function countHTML(left) {
    if (left < 0) return '<span class="c-pre">逾期</span><span class="num">' + (-left) + '</span><span class="c-unit">天</span>';
    if (left === 0) return '<span class="c-pre">就是</span><span class="num today">今天</span><span class="c-unit">截止</span>';
    return '<span class="c-pre">还剩</span><span class="num">' + left + '</span><span class="c-unit">天</span>';
  }
  function sortedDDL() { return S().ddls.slice().sort((a, b) => (a.due + (a.time || '99')).localeCompare(b.due + (b.time || '99')) || b.pri - a.pri); }

  function renderBrief() {
    const ddls = S().ddls;
    const today = D.todayKey();
    const over = ddls.filter((d) => D.daysUntil(d.due) < 0).length;
    const dueToday = ddls.filter((d) => d.due === today);
    const soon = ddls.filter((d) => { const l = D.daysUntil(d.due); return l >= 1 && l <= 3; });
    const evs = eventsOn(today);
    const parts = [];
    if (over) parts.push('<b class="t-red">' + over + ' 件已逾期</b>');
    if (dueToday.length) parts.push('<b class="t-red">' + dueToday.length + ' 件今天截止</b>');
    if (soon.length) parts.push('<b class="t-orange">' + soon.length + ' 件三天内截止</b>');
    if (evs.length) parts.push('今天有 ' + evs.length + ' 个日程');
    let html = '<div class="brief-line">' + (parts.length ? parts.join('，') + '。' : '今天没有要截止的事，轻松一天。') + '</div>';
    if (evs.length) html += '<div class="brief-evs">' + evs.slice(0, 3).map((e) => '<span>' + (e.time ? esc(e.time) + ' ' : '') + esc(e.title) + '</span>').join('') + '</div>';
    if (S().settings.theme === 'auto' && !S().weather) html += '<button type="button" class="brief-tip" id="briefWeather">点这里开启实时天气，页面会跟着天气变化</button>';
    if (ddls.some((d) => d.sample) || S().events.some((e) => e.sample)) html += '<div class="brief-tip muted">带「示例」标记的条目是演示用的，点开就能删除。</div>';
    $('#brief').innerHTML = html;
    const bw = $('#briefWeather'); if (bw) bw.addEventListener('click', locate);
  }

  function renderDDL() {
    renderBrief();
    const list = $('#ddlList');
    const items = sortedDDL();
    if (!items.length) {
      list.innerHTML = '<div class="empty"><p>还没有要事。</p><p class="muted">点右上角的 ＋ 记下第一件有截止日期的事。</p></div>';
    } else {
      list.innerHTML = items.map((d, i) => {
        const left = D.daysUntil(d.due);
        return '<article class="ddl-card ' + urgency(left) + '" data-id="' + d.id + '" style="--tilt:' + ((i % 3) - 1) * 0.35 + 'deg;--i:' + i + '" tabindex="0"><div class="ticket">' +
          '<div class="ddl-count">' + countHTML(left) + '</div>' +
          '<div class="ddl-main"><h3>' + esc(d.title) + (d.sample ? '<em class="sample">示例</em>' : '') + '</h3>' +
          '<div class="ddl-meta">' + D.label(d.due) + (d.time ? ' ' + esc(d.time) : '') + (d.cat ? '<span class="tag">' + esc(d.cat) + '</span>' : '') + '<span class="pri" aria-label="重要程度 ' + d.pri + '">' + '●'.repeat(d.pri) + '<i>' + '●'.repeat(3 - d.pri) + '</i></span></div></div>' +
          '</div></article>';
      }).join('');
    }
    $$('.ddl-card', list).forEach((c) => c.addEventListener('click', () => openDDL(c.dataset.id)));
    const done = S().done;
    $('#ddlDoneCount').textContent = done.length;
    $('#ddlHistory').hidden = !done.length;
    $('#ddlDoneList').innerHTML = done.slice(0, 40).map((d) => '<li><span>' + esc(d.title) + '</span><small>' + new Date(d.doneAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' 用' + (METHOD_NAMES[d.method] || '') + '送走</small></li>').join('');
  }
  $('#ddlAdd').addEventListener('click', () => ddlForm());
  $('#ddlAllCal').addEventListener('click', () => {
    const list = S().ddls.filter((d) => D.daysUntil(d.due) >= 0);
    if (!list.length) { toast('没有未截止的要事'); return; }
    ICS.allDdls(list);
    toast('已生成 ' + list.length + ' 件要事的日历提醒，在弹出的页面里点「全部添加」', 4200);
  });

  function catChips(cur) {
    const all = Array.from(new Set(CATS.concat(S().ddls.map((d) => d.cat).filter(Boolean))));
    return '<div class="chips" id="catChips">' + all.map((c) => '<button type="button" class="chip' + (c === cur ? ' on' : '') + '" data-v="' + esc(c) + '">' + esc(c) + '</button>').join('') + '<input id="catNew" class="chip-input" placeholder="自定义" maxlength="6"></div>';
  }

  function ddlForm(id) {
    const d = id ? S().ddls.find((x) => x.id === id) : null;
    const dueDef = d ? d.due : D.key(D.addDays(D.today(), 7));
    openSheet(
      '<h3 class="sheet-title">' + (d ? '编辑要事' : '新的要事') + '</h3>' +
      '<form id="ddlF" autocomplete="off">' +
      '<label class="field"><span class="f-label">要做什么</span><input id="fTitle" required maxlength="40" value="' + esc(d ? d.title : '') + '" placeholder="比如：交课程论文"></label>' +
      '<div class="field-row"><label class="field"><span class="f-label">截止日期</span><input id="fDue" type="date" required value="' + dueDef + '"></label>' +
      '<label class="field"><span class="f-label">时间（可不填）</span><input id="fTime" type="time" value="' + esc(d ? d.time : '') + '"></label></div>' +
      '<div class="field"><span class="f-label">分类</span>' + catChips(d ? d.cat : '工作') + '</div>' +
      '<div class="field"><span class="f-label">重要程度</span>' + seg('pri', { 1: '一般', 2: '重要', 3: '非常重要' }, String(d ? d.pri : 2)) + '</div>' +
      '<label class="field"><span class="f-label">备注</span><textarea id="fNote" rows="2" maxlength="200" placeholder="可不填">' + esc(d ? d.note : '') + '</textarea></label>' +
      '<div class="sheet-actions"><button type="button" class="ghost-btn" data-close>取消</button><button type="submit" class="big-btn">保存</button></div>' +
      '</form>',
      (root) => {
        let pri = d ? d.pri : 2, cat = d ? d.cat : '工作';
        bindSeg(root, 'pri', (v) => { pri = Number(v); });
        const chips = $('#catChips', root);
        chips.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; cat = b.dataset.v; $$('.chip', chips).forEach((x) => x.classList.toggle('on', x === b)); $('#catNew', root).value = ''; });
        $('#catNew', root).addEventListener('input', (e) => { if (e.target.value.trim()) { cat = e.target.value.trim(); $$('.chip', chips).forEach((x) => x.classList.remove('on')); } });
        if (!d) setTimeout(() => $('#fTitle', root).focus(), 320);
        $('#ddlF', root).addEventListener('submit', (e) => {
          e.preventDefault();
          const title = $('#fTitle', root).value.trim(); const due = $('#fDue', root).value;
          if (!title || !due) { toast('请填写事情和截止日期'); return; }
          const rec = { title, due, time: $('#fTime', root).value, cat, pri, note: $('#fNote', root).value.trim() };
          if (d) { Object.assign(d, rec); d.sample = false; } else S().ddls.push(Object.assign({ id: D.uid() }, rec));
          Store.save(); closeSheet(); renderDDL();
          const left = D.daysUntil(due);
          toast(d ? '已更新' : (left > 0 ? '记下了，还有 ' + left + ' 天。点开它可以加入日历提醒。' : left === 0 ? '记下了，今天就截止，加油。' : '记下了'), 3200);
        });
      }
    );
  }

  function methodPicker(name, cur) {
    return '<div class="method-mini" data-seg="' + name + '">' + ['tear', 'crumple', 'burn', 'plane', 'random'].map((m) => '<button type="button" data-v="' + m + '"' + (m === cur ? ' class="on"' : '') + '><span data-ico="' + m + '"></span>' + METHOD_NAMES[m] + '</button>').join('') + '</div>';
  }

  function openDDL(id) {
    const d = S().ddls.find((x) => x.id === id); if (!d) return;
    const left = D.daysUntil(d.due);
    const sm = S().settings.shredMethod;
    openSheet(
      '<div class="detail-head ' + urgency(left) + '"><div class="ddl-count big">' + countHTML(left) + '</div>' +
      '<div><h3 class="sheet-title">' + esc(d.title) + '</h3><div class="ddl-meta">' + D.label(d.due) + (d.time ? ' ' + esc(d.time) : '') + (d.cat ? '<span class="tag">' + esc(d.cat) + '</span>' : '') + '</div></div></div>' +
      (d.note ? '<p class="detail-note">' + esc(d.note) + '</p>' : '') +
      '<div class="field"><span class="f-label">完成了？选一种方式送走它</span>' + methodPicker('dm', sm) + '</div>' +
      '<button type="button" class="big-btn" id="dDone"><span data-ico="check"></span>完成，送走它</button>' +
      '<div class="detail-actions">' +
      '<button type="button" class="ghost-btn" id="dCal"><span data-ico="cal"></span>加入日历</button>' +
      '<button type="button" class="ghost-btn" id="dEdit"><span data-ico="edit"></span>编辑</button>' +
      '<button type="button" class="ghost-btn danger" id="dDel"><span data-ico="trash"></span>删除</button></div>' +
      '<p class="sheet-note small" id="dCalNote">加入日历后，iPhone 会在 ' + esc(S().settings.remindTime) + ' 提醒你：' + (S().settings.remindMode === 'daily' ? '截止前每天一次' : '截止前 7 天、3 天、1 天和当天') + '。</p>',
      (root) => {
        let method = sm;
        bindSeg(root, 'dm', (v) => { method = v; });
        $('#dDone', root).addEventListener('click', async () => {
          closeSheet();
          await new Promise((r) => setTimeout(r, 300));
          const used = await Destroy.run(method, { text: '✓ ' + d.title + '\n' + D.label(d.due) + (d.note ? '\n' + d.note : ''), done: true, title: d.title, sub: 'Bertholdt 也替你高兴，亲密度 +3' });
          S().ddls = S().ddls.filter((x) => x.id !== d.id);
          S().done.unshift({ title: d.title, due: d.due, doneAt: Date.now(), method: used });
          S().done = S().done.slice(0, 200);
          Dog.reward(3); Store.save(); renderDDL();
        });
        $('#dCal', root).addEventListener('click', () => {
          if (left < 0) { toast('这件事已经过了截止日期'); return; }
          ICS.ddl(d); toast('在弹出的页面里点「全部添加」，提醒就会出现在 iPhone 日历里', 4200);
        });
        $('#dEdit', root).addEventListener('click', () => { closeSheet(); setTimeout(() => ddlForm(d.id), 300); });
        const del = $('#dDel', root);
        del.addEventListener('click', () => {
          if (!del.classList.contains('armed')) { del.classList.add('armed'); del.lastChild.textContent = '再点一次删除'; setTimeout(() => { if (del.isConnected) { del.classList.remove('armed'); del.lastChild.textContent = '删除'; } }, 3000); return; }
          S().ddls = S().ddls.filter((x) => x.id !== d.id); Store.save(); closeSheet(); renderDDL(); toast('已删除');
        });
      }
    );
  }

  /* ---------------- 日程 ---------------- */
  let selDay = D.todayKey();
  function occursOn(e, key) {
    if (key < e.date) return false;
    if (e.repeat === 'none' || !e.repeat) return key === e.date;
    const a = D.parse(e.date), b = D.parse(key);
    if (e.repeat === 'daily') return true;
    if (e.repeat === 'weekly') return a.getDay() === b.getDay();
    if (e.repeat === 'monthly') return a.getDate() === b.getDate();
    if (e.repeat === 'yearly') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
    return false;
  }
  function eventsOn(key) { return S().events.filter((e) => occursOn(e, key)).sort((a, b) => (a.time || '00').localeCompare(b.time || '00')); }

  function renderSched() {
    const strip = $('#dateStrip');
    const t = D.today();
    let html = '';
    for (let i = -7; i <= 45; i++) {
      const d = D.addDays(t, i), k = D.key(d);
      const has = eventsOn(k).length, dd = S().ddls.some((x) => x.due === k);
      html += '<button type="button" class="day' + (k === selDay ? ' on' : '') + (i === 0 ? ' is-today' : '') + (d.getDay() === 0 || d.getDay() === 6 ? ' wkend' : '') + '" data-k="' + k + '">' +
        '<span class="dw">' + (i === 0 ? '今天' : '周' + D.week[d.getDay()]) + '</span><span class="dn">' + d.getDate() + '</span>' +
        '<span class="dots">' + (has ? '<i class="ev"></i>' : '') + (dd ? '<i class="dl"></i>' : '') + '</span>' +
        (d.getDate() === 1 ? '<span class="mo">' + (d.getMonth() + 1) + '月</span>' : '') + '</button>';
    }
    strip.innerHTML = html;
    const on = $('.day.on', strip);
    if (on) strip.scrollLeft = on.offsetLeft - strip.clientWidth / 2 + on.clientWidth / 2;
    $$('.day', strip).forEach((b) => b.addEventListener('click', () => { selDay = b.dataset.k; $$('.day', strip).forEach((x) => x.classList.toggle('on', x === b)); renderDay(); }));
    renderDay();
  }
  function renderDay() {
    const sd = D.parse(selDay);
    $('#schedMonth').textContent = sd.getFullYear() + '年' + (sd.getMonth() + 1) + '月';
    const left = D.daysUntil(selDay);
    $('#schedDayTitle').textContent = D.label(selDay) + (left === 0 ? ' · 今天' : left === 1 ? ' · 明天' : left === -1 ? ' · 昨天' : left > 0 ? ' · ' + left + ' 天后' : '');
    const evs = eventsOn(selDay);
    const dls = S().ddls.filter((d) => d.due === selDay);
    let html = '';
    dls.forEach((d) => { html += '<div class="sched-item is-ddl" data-ddl="' + d.id + '"><div class="s-time">截止</div><div class="s-main"><b>' + esc(d.title) + '</b><small>要事' + (d.time ? ' · ' + esc(d.time) : '') + '</small></div></div>'; });
    evs.forEach((e) => {
      html += '<div class="sched-item" data-id="' + e.id + '" tabindex="0"><div class="s-time">' + (e.time ? esc(e.time) : '全天') + '</div><div class="s-main"><b>' + esc(e.title) + (e.sample ? '<em class="sample">示例</em>' : '') + '</b><small>' +
        (e.place ? '<span data-ico="pin"></span>' + esc(e.place) : '') + (e.repeat && e.repeat !== 'none' ? '<span data-ico="repeat"></span>' + REPEAT[e.repeat] : '') + '</small></div></div>';
    });
    if (!html) html = '<div class="empty"><p>这天没有安排。</p><p class="muted">点 ＋ 添加，比如开会、看牙、朋友生日。</p></div>';
    $('#schedList').innerHTML = html;
    paintIcons($('#schedList'));
    $$('.sched-item[data-id]').forEach((el) => el.addEventListener('click', () => openEvent(el.dataset.id)));
    $$('.sched-item[data-ddl]').forEach((el) => el.addEventListener('click', () => openDDL(el.dataset.ddl)));
  }
  $('#schedAdd').addEventListener('click', () => eventForm());
  $('#schedToday').addEventListener('click', () => { selDay = D.todayKey(); renderSched(); });

  function eventForm(id) {
    const e = id ? S().events.find((x) => x.id === id) : null;
    openSheet(
      '<h3 class="sheet-title">' + (e ? '编辑日程' : '新的日程') + '</h3>' +
      '<form id="evF" autocomplete="off">' +
      '<label class="field"><span class="f-label">做什么</span><input id="eTitle" required maxlength="40" value="' + esc(e ? e.title : '') + '" placeholder="比如：看牙医"></label>' +
      '<div class="field-row"><label class="field"><span class="f-label">日期</span><input id="eDate" type="date" required value="' + (e ? e.date : selDay) + '"></label>' +
      '<label class="field"><span class="f-label">时间（不填为全天）</span><input id="eTime" type="time" value="' + esc(e ? e.time : '') + '"></label></div>' +
      '<label class="field"><span class="f-label">地点（可不填）</span><input id="ePlace" maxlength="40" value="' + esc(e ? e.place : '') + '"></label>' +
      '<div class="field"><span class="f-label">重复</span>' + seg('rep', REPEAT, e ? e.repeat : 'none') + '</div>' +
      '<div class="sheet-actions"><button type="button" class="ghost-btn" data-close>取消</button><button type="submit" class="big-btn">保存</button></div></form>',
      (root) => {
        let rep = e ? e.repeat : 'none';
        bindSeg(root, 'rep', (v) => { rep = v; });
        if (!e) setTimeout(() => $('#eTitle', root).focus(), 320);
        $('#evF', root).addEventListener('submit', (ev) => {
          ev.preventDefault();
          const rec = { title: $('#eTitle', root).value.trim(), date: $('#eDate', root).value, time: $('#eTime', root).value, place: $('#ePlace', root).value.trim(), repeat: rep };
          if (!rec.title || !rec.date) { toast('请填写事情和日期'); return; }
          if (e) { Object.assign(e, rec); e.sample = false; } else S().events.push(Object.assign({ id: D.uid() }, rec));
          Store.save(); selDay = rec.date; closeSheet(); renderSched(); toast(e ? '已更新' : '已添加');
        });
      }
    );
  }
  function openEvent(id) {
    const e = S().events.find((x) => x.id === id); if (!e) return;
    openSheet(
      '<h3 class="sheet-title">' + esc(e.title) + '</h3>' +
      '<div class="ddl-meta">' + D.label(e.date) + ' ' + (e.time ? esc(e.time) : '全天') + (e.repeat !== 'none' ? '<span class="tag">' + REPEAT[e.repeat] + '</span>' : '') + '</div>' +
      (e.place ? '<p class="detail-note"><span data-ico="pin" class="inline-ico"></span>' + esc(e.place) + '</p>' : '') +
      '<button type="button" class="big-btn" id="eCal"><span data-ico="cal"></span>加入 iPhone 日历</button>' +
      '<div class="detail-actions"><button type="button" class="ghost-btn" id="eEdit"><span data-ico="edit"></span>编辑</button><button type="button" class="ghost-btn danger" id="eDel"><span data-ico="trash"></span>删除</button></div>' +
      '<p class="sheet-note small">' + (e.time ? '加入日历后会提前 15 分钟提醒。' : '全天日程会在 ' + esc(S().settings.remindTime) + ' 提醒。') + '</p>',
      (root) => {
        $('#eCal', root).addEventListener('click', () => { ICS.event(e); toast('在弹出的页面里点「添加」即可', 3600); });
        $('#eEdit', root).addEventListener('click', () => { closeSheet(); setTimeout(() => eventForm(e.id), 300); });
        const del = $('#eDel', root);
        del.addEventListener('click', () => {
          if (!del.classList.contains('armed')) { del.classList.add('armed'); del.lastChild.textContent = '再点一次删除'; return; }
          S().events = S().events.filter((x) => x.id !== e.id); Store.save(); closeSheet(); renderSched(); toast('已删除');
        });
      }
    );
  }

  /* ---------------- 烦恼粉碎 ---------------- */
  function renderShred() {
    const n = S().shredCount;
    $('#shredCount').textContent = n ? '已经放下 ' + n + ' 件烦恼' : '';
    const m = S().settings.shredMethod;
    $$('#methodRow button').forEach((b) => { const on = b.dataset.method === m; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  }
  $('#methodRow').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S().settings.shredMethod = b.dataset.method; Store.save(); renderShred();
  });
  $('#shredGo').addEventListener('click', async () => {
    Sound.unlock();
    const ta = $('#worryText');
    const text = ta.value.trim();
    if (!text) { toast('先写下一点什么吧'); ta.focus(); return; }
    ta.blur();
    await new Promise((r) => setTimeout(r, 250));
    const p = Destroy.run(S().settings.shredMethod, { text, sub: S().shredCount + 1 === 1 ? '第一件烦恼，已经处理掉了' : '这是你放下的第 ' + (S().shredCount + 1) + ' 件烦恼' });
    ta.value = '';
    await p;
    S().shredCount += 1; Dog.reward(1); Store.save(); renderShred();
  });

  /* ---------------- 喂食 ---------------- */
  function allFoods() { return Store.FOODS.concat(S().dog.customFoods || []); }
  function openFeed() {
    if (Dog.isBusy()) return;
    const groups = { meal: '主食', veg: '蔬果与饮品', snack: '零食' };
    const foods = allFoods();
    openSheet(
      '<h3 class="sheet-title">给 Bertholdt 喂点什么</h3>' +
      '<p class="sheet-note small">零食最开心，但吃多了会胖；蔬果能帮它瘦回来。</p>' +
      Object.keys(groups).map((g) => {
        const fs = foods.filter((f) => f.kind === g); if (!fs.length) return '';
        return '<div class="food-group"><span class="f-label">' + groups[g] + '</span><div class="food-grid">' + fs.map((f) =>
          '<button type="button" class="food" data-id="' + esc(f.id) + '"><span class="f-ico">' + esc(f.ico) + '</span><span class="f-name">' + esc(f.name) + '</span><span class="f-stat">饱 +' + f.full + ' · 乐 +' + f.mood + '</span></button>').join('') + '</div></div>';
      }).join('') +
      '<button type="button" class="link-btn" id="addFood">＋ 加一种新食物</button>',
      (root) => {
        $$('.food', root).forEach((b) => b.addEventListener('click', () => {
          const f = allFoods().find((x) => x.id === b.dataset.id);
          closeSheet(); if (curTab !== 'dog') showTab('dog');
          setTimeout(() => Dog.feed(f), 320);
        }));
        $('#addFood', root).addEventListener('click', () => { closeSheet(); setTimeout(foodForm, 300); });
      }
    );
  }
  function foodForm() {
    openSheet(
      '<h3 class="sheet-title">新食物</h3><form id="foodF" autocomplete="off">' +
      '<div class="field-row"><label class="field narrow"><span class="f-label">图标</span><input id="ffIco" maxlength="2" value="🍠"></label>' +
      '<label class="field"><span class="f-label">名字</span><input id="ffName" required maxlength="8" placeholder="比如：烤红薯"></label></div>' +
      '<div class="field"><span class="f-label">种类</span>' + seg('fk', { meal: '主食', veg: '蔬果饮品', snack: '零食' }, 'veg') + '</div>' +
      '<p class="sheet-note small">提醒：葡萄、巧克力、洋葱、木糖醇对真的狗狗有毒。</p>' +
      '<div class="sheet-actions"><button type="button" class="ghost-btn" data-close>取消</button><button type="submit" class="big-btn">添加</button></div></form>',
      (root) => {
        let kind = 'veg'; bindSeg(root, 'fk', (v) => { kind = v; });
        $('#foodF', root).addEventListener('submit', (e) => {
          e.preventDefault();
          const name = $('#ffName', root).value.trim(); if (!name) return;
          const stat = { meal: [24, 8], veg: [10, 6], snack: [6, 15] }[kind];
          S().dog.customFoods.push({ id: 'c' + D.uid(), name, ico: $('#ffIco', root).value.trim() || '🍽️', kind, full: stat[0], mood: stat[1] });
          Store.save(); closeSheet(); toast('添加好了'); setTimeout(openFeed, 320);
        });
      }
    );
  }
  $('#actFeed').addEventListener('click', openFeed);
  $('#actWater').addEventListener('click', () => Dog.water());
  $('#actPet').addEventListener('click', () => Dog.pet());
  $('#actBall').addEventListener('click', () => Dog.play());

  /* ---------------- 设置 ---------------- */
  function renderSettings() {
    const st = S().settings;
    const meals = st.mealTimes;
    const custom = S().dog.customFoods || [];
    $('#settings').innerHTML =
      '<section class="set-group"><h4>外观</h4>' +
      '<div class="field"><span class="f-label">页面主题</span>' + seg('theme', { auto: '跟随天气', sunny: '晴', cloudy: '多云', rain: '雨', fog: '雾', snow: '雪' }, st.theme) + '</div>' +
      '<div class="field"><span class="f-label">深色模式</span>' + seg('tone', { auto: '自动', light: '浅色', dark: '深色' }, st.tone) + '</div>' +
      '<button type="button" class="ghost-btn" id="sLocate">重新获取天气</button></section>' +

      '<section class="set-group"><h4>截止提醒</h4>' +
      '<p class="sheet-note small">「加入日历」后，提醒由 iPhone 自带的日历发出，就算不打开这个应用也会准时弹出。</p>' +
      '<div class="field-row"><label class="field"><span class="f-label">提醒时间</span><input id="sTime" type="time" value="' + esc(st.remindTime) + '"></label></div>' +
      '<div class="field"><span class="f-label">提醒频率</span>' + seg('mode', { key: '截止前 7、3、1 天和当天', daily: '每天一次' }, st.remindMode) + '<span class="f-hint">修改后，需要重新把要事加入日历才会生效。</span></div></section>' +

      '<section class="set-group"><h4>Bertholdt</h4>' +
      '<div class="field"><span class="f-label">饭点</span><div class="meal-times" id="mealTimes">' + meals.map((t, i) => '<span class="meal"><input type="time" value="' + esc(t) + '" data-i="' + i + '" aria-label="第 ' + (i + 1) + ' 顿">' + (meals.length > 1 ? '<button type="button" data-rm="' + i + '" aria-label="删除这顿">×</button>' : '') + '</span>').join('') +
      (meals.length < 4 ? '<button type="button" class="chip" id="mealAdd">＋ 加一顿</button>' : '') + '</div></div>' +
      '<button type="button" class="ghost-btn" id="mealCal"><span data-ico="cal"></span>把饭点提醒加入日历</button>' +
      (custom.length ? '<div class="field"><span class="f-label">自己加的食物</span><div class="chips">' + custom.map((f) => '<button type="button" class="chip" data-rmfood="' + esc(f.id) + '">' + esc(f.ico + ' ' + f.name) + ' ×</button>').join('') + '</div></div>' : '') +
      '</section>' +

      '<section class="set-group"><h4>其他</h4>' +
      '<label class="toggle"><input type="checkbox" id="sSound"' + (st.sound ? ' checked' : '') + '><span>音效</span></label>' +
      '<div class="field"><span class="f-label">数据都只存在这台手机里。换手机前记得备份。</span>' +
      '<div class="detail-actions"><button type="button" class="ghost-btn" id="sExport">导出备份</button><label class="ghost-btn file-btn">导入备份<input type="file" id="sImport" accept="application/json,.json"></label><button type="button" class="ghost-btn danger" id="sReset">清空全部数据</button></div></div>' +
      '</section>' +
      '<p class="about">纸上清单 · 开源项目<br><a href="https://github.com/2596441336-cmyk/paper--list" target="_blank" rel="noopener">github.com/2596441336-cmyk/paper--list</a></p>';
    const root = $('#settings');
    paintIcons(root);
    bindSeg(root, 'theme', (v) => { st.theme = v; Store.save(); Weather.apply(); });
    bindSeg(root, 'tone', (v) => { st.tone = v; Store.save(); Weather.apply(); });
    bindSeg(root, 'mode', (v) => { st.remindMode = v; Store.save(); });
    $('#sLocate').addEventListener('click', locate);
    $('#sTime').addEventListener('change', (e) => { if (e.target.value) { st.remindTime = e.target.value; Store.save(); toast('提醒时间改为 ' + st.remindTime); } });
    $$('#mealTimes input').forEach((inp) => inp.addEventListener('change', () => { if (inp.value) { st.mealTimes[Number(inp.dataset.i)] = inp.value; Store.save(); } }));
    $$('#mealTimes [data-rm]').forEach((b) => b.addEventListener('click', () => { st.mealTimes.splice(Number(b.dataset.rm), 1); Store.save(); renderSettings(); }));
    const ma = $('#mealAdd'); if (ma) ma.addEventListener('click', () => { st.mealTimes.push('12:30'); Store.save(); renderSettings(); });
    $('#mealCal').addEventListener('click', () => { ICS.meals(st.mealTimes); toast('在弹出的页面里点「全部添加」', 3600); });
    $$('[data-rmfood]', root).forEach((b) => b.addEventListener('click', () => { S().dog.customFoods = S().dog.customFoods.filter((f) => f.id !== b.dataset.rmfood); Store.save(); renderSettings(); }));
    $('#sSound').addEventListener('change', (e) => { st.sound = e.target.checked; Store.save(); });
    $('#sExport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'paperlist-backup-' + D.todayKey() + '.json';
      document.body.appendChild(a); a.click(); a.remove(); toast('备份文件已生成');
    });
    $('#sImport').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const obj = JSON.parse(r.result); if (!obj || !Array.isArray(obj.ddls)) throw 0; Store.replaceAll(obj); toast('已恢复备份'); Weather.apply(); renderSettings(); } catch (err) { toast('这个文件不是纸上清单的备份'); } };
      r.readAsText(f);
    });
    const rs = $('#sReset');
    rs.addEventListener('click', () => {
      if (!rs.classList.contains('armed')) { rs.classList.add('armed'); rs.textContent = '确定清空？再点一次'; return; }
      Store.reset(); Weather.apply(); toast('已清空，回到初始状态'); showTab('ddl');
    });
  }

  /* ---------------- 启动 ---------------- */
  window.App = { toast, openFeed, showTab };
  paintIcons();
  renderTop();
  Weather.onChange((cur) => {
    renderWeatherChip(cur);
    if (curTab === 'dog' && !Dog.isBusy()) Dog.render();
  });
  Weather.apply();
  let geoOk = false; try { geoOk = localStorage.getItem('paperlist.geo') === '1'; } catch (e) {}
  if (S().settings.theme === 'auto' && geoOk) Weather.refresh(false).catch(() => {});
  let startTab = 'ddl'; try { startTab = sessionStorage.getItem('paperlist.tab') || 'ddl'; } catch (e) {}
  showTab(startTab);
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => Weather.apply());

  // 回到前台时刷新日期、倒计时和天气
  let lastDay = D.todayKey();
  function wake() {
    if (D.todayKey() !== lastDay) { lastDay = D.todayKey(); selDay = lastDay; }
    renderTop();
    if (curTab === 'ddl') renderDDL();
    if (curTab === 'dog' && !Dog.isBusy()) Dog.render();
    if (S().settings.theme === 'auto' && geoOk && Weather.stale()) Weather.refresh(false).catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  setInterval(() => { if (!document.hidden) { renderTop(); if (curTab === 'dog' && !Dog.isBusy()) Dog.renderMeta(); } }, 60000);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
