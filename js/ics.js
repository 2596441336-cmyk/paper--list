/* 生成 iPhone 日历可以直接导入的 .ics 文件。
   DDL：截止当天一条全天事件（当天和前一天在提醒时间各响一次），
   另外在倒数第 7、3 天（或每天）各生成一条「还剩 N 天」的全天提醒。 */
(function () {
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const dk = (key) => key.replace(/-/g, '');
  const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

  function fold(line) {
    // RFC 5545：每行不超过 75 字节
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 74) return line;
    const out = []; let cur = '';
    for (const ch of line) {
      if (enc.encode(cur + ch).length > 73) { out.push(cur); cur = ' ' + ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n');
  }

  function minutesOf(hhmm) { const [h, m] = (hhmm || '11:00').split(':').map(Number); return h * 60 + (m || 0); }

  function alarm(trigger, text) {
    return ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(text), 'TRIGGER:' + trigger, 'END:VALARM'];
  }

  function allDay(uid, dateKey, summary, desc, alarms) {
    const next = D.key(D.addDays(D.parse(dateKey), 1));
    let L = ['BEGIN:VEVENT', 'UID:' + uid + '@paperlist', 'DTSTAMP:' + stamp(), 'DTSTART;VALUE=DATE:' + dk(dateKey), 'DTEND;VALUE=DATE:' + dk(next), 'SUMMARY:' + esc(summary), 'TRANSP:TRANSPARENT'];
    if (desc) L.push('DESCRIPTION:' + esc(desc));
    alarms.forEach((a) => { L = L.concat(a); });
    L.push('END:VEVENT');
    return L;
  }

  function ddlEvents(ddl) {
    const s = Store.state.settings;
    const m = minutesOf(s.remindTime);
    const left = D.daysUntil(ddl.due);
    const out = [];
    const timeTxt = ddl.time ? ' ' + ddl.time : '';
    // 截止当天：当天提醒 + 前一天提醒
    const al = [alarm('PT' + m + 'M', '今天截止：' + ddl.title + timeTxt)];
    if (left >= 1) al.push(alarm('-PT' + (1440 - m) + 'M', '明天截止：' + ddl.title));
    out.push(allDay(ddl.id + '-due', ddl.due, '⏰ 截止：' + ddl.title + timeTxt, (ddl.cat ? '分类：' + ddl.cat + '\n' : '') + (ddl.note || '') + '\n来自 纸上清单', al));
    // 倒计时提醒
    let marks = [];
    if (s.remindMode === 'daily') { for (let i = 2; i <= Math.min(left, 30); i++) marks.push(i); }
    else marks = [7, 3].filter((i) => i <= left);
    marks.forEach((n) => {
      const day = D.key(D.addDays(D.parse(ddl.due), -n));
      out.push(allDay(ddl.id + '-d' + n, day, '还剩 ' + n + ' 天｜' + ddl.title, '截止日期：' + D.label(ddl.due), [alarm('PT' + m + 'M', '距离「' + ddl.title + '」截止还有 ' + n + ' 天')]));
    });
    return out;
  }

  function timedEvent(ev) {
    const start = dk(ev.date) + 'T' + (ev.time || '09:00').replace(':', '') + '00';
    const endD = new Date(D.parse(ev.date).getTime());
    const [h, mi] = (ev.time || '09:00').split(':').map(Number);
    endD.setHours(h + 1, mi);
    const end = D.key(endD).replace(/-/g, '') + 'T' + D.pad(endD.getHours()) + D.pad(endD.getMinutes()) + '00';
    let L = ['BEGIN:VEVENT', 'UID:' + ev.id + '@paperlist', 'DTSTAMP:' + stamp(), 'DTSTART:' + start, 'DTEND:' + end, 'SUMMARY:' + esc(ev.title)];
    if (!ev.time) L = ['BEGIN:VEVENT', 'UID:' + ev.id + '@paperlist', 'DTSTAMP:' + stamp(), 'DTSTART;VALUE=DATE:' + dk(ev.date), 'DTEND;VALUE=DATE:' + dk(D.key(D.addDays(D.parse(ev.date), 1))), 'SUMMARY:' + esc(ev.title)];
    if (ev.place) L.push('LOCATION:' + esc(ev.place));
    const rr = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' }[ev.repeat];
    if (rr) L.push('RRULE:FREQ=' + rr);
    L = L.concat(alarm(ev.time ? '-PT15M' : 'PT' + minutesOf(Store.state.settings.remindTime) + 'M', ev.title));
    L.push('END:VEVENT');
    return L;
  }

  function mealEvents(times) {
    return times.map((t, i) => {
      const start = dk(D.todayKey()) + 'T' + t.replace(':', '') + '00';
      let L = ['BEGIN:VEVENT', 'UID:bertholdt-meal-' + i + '@paperlist', 'DTSTAMP:' + stamp(), 'DTSTART:' + start, 'DURATION:PT15M', 'RRULE:FREQ=DAILY', 'SUMMARY:该喂 Bertholdt 了', 'DESCRIPTION:打开纸上清单，去给 Bertholdt 添饭'];
      L = L.concat(alarm('PT0M', 'Bertholdt 饿了，记得喂它'));
      L.push('END:VEVENT');
      return L;
    });
  }

  function build(eventLines, calName) {
    let L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PaperList//ZH', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + esc(calName || '纸上清单')];
    eventLines.forEach((e) => { L = L.concat(e); });
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  }

  function deliver(text, filename) {
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  window.ICS = {
    ddl(d) { deliver(build(ddlEvents(d)), 'ddl-' + d.id + '.ics'); },
    allDdls(list) { let ev = []; list.forEach((d) => { ev = ev.concat(ddlEvents(d)); }); deliver(build(ev), 'paperlist-ddl.ics'); },
    event(ev) { deliver(build([timedEvent(ev)]), 'event-' + ev.id + '.ics'); },
    meals(times) { deliver(build(mealEvents(times), 'Bertholdt'), 'bertholdt-meals.ics'); },
    _build: build, _ddlEvents: ddlEvents
  };
})();
