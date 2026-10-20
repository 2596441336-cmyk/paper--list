/* 纸上清单 · 数据存储与日期工具
   所有数据只保存在这台设备的浏览器里（localStorage），不会上传到任何地方。 */
(function () {
  const KEY = 'paperlist.v1';

  const pad = (n) => String(n).padStart(2, '0');
  const D = {
    pad,
    key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
    today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); },
    todayKey() { return D.key(D.today()); },
    addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
    /** 从今天到 dateKey 还有几天（今天 = 0，过去为负） */
    daysUntil(dateKey) { return Math.round((D.parse(dateKey) - D.today()) / 86400000); },
    week: ['日', '一', '二', '三', '四', '五', '六'],
    label(dateKey) {
      const d = D.parse(dateKey);
      return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + D.week[d.getDay()];
    },
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  };

  const FOODS = [
    { id: 'kibble',  name: '狗粮',     ico: '🥣', kind: 'meal',  full: 32, mood: 4 },
    { id: 'chicken', name: '鸡胸肉',   ico: '🍗', kind: 'meal',  full: 26, mood: 10 },
    { id: 'beef',    name: '牛肉粒',   ico: '🥩', kind: 'meal',  full: 24, mood: 12 },
    { id: 'salmon',  name: '三文鱼',   ico: '🐟', kind: 'meal',  full: 24, mood: 12 },
    { id: 'egg',     name: '蛋黄',     ico: '🥚', kind: 'meal',  full: 12, mood: 8 },
    { id: 'pumpkin', name: '南瓜泥',   ico: '🎃', kind: 'veg',   full: 14, mood: 6 },
    { id: 'carrot',  name: '胡萝卜',   ico: '🥕', kind: 'veg',   full: 10, mood: 5 },
    { id: 'apple',   name: '苹果片',   ico: '🍎', kind: 'veg',   full: 8,  mood: 7 },
    { id: 'berry',   name: '蓝莓',     ico: '🫐', kind: 'veg',   full: 5,  mood: 7 },
    { id: 'milk',    name: '羊奶',     ico: '🥛', kind: 'veg',   full: 8,  mood: 9 },
    { id: 'bone',    name: '洁齿骨',   ico: '🦴', kind: 'snack', full: 6,  mood: 16 },
    { id: 'jerky',   name: '冻干零食', ico: '🍖', kind: 'snack', full: 6,  mood: 15 },
    { id: 'cake',    name: '狗狗蛋糕', ico: '🎂', kind: 'snack', full: 12, mood: 26 }
  ];

  function exampleData() {
    const t = D.today();
    return {
      ddls: [
        { id: D.uid(), title: '交季度总结报告', due: D.key(D.addDays(t, 3)), time: '18:00', cat: '工作', pri: 3, note: '', sample: true },
        { id: D.uid(), title: '读完《小王子》', due: D.key(D.addDays(t, 12)), time: '', cat: '生活', pri: 1, note: '', sample: true },
        { id: D.uid(), title: '护照续签材料', due: D.key(D.addDays(t, 26)), time: '', cat: '生活', pri: 2, note: '', sample: true }
      ],
      events: [
        { id: D.uid(), title: '和朋友吃火锅', date: D.key(D.addDays(t, 1)), time: '19:00', place: '', repeat: 'none', sample: true },
        { id: D.uid(), title: '健身', date: D.key(t), time: '20:30', place: '', repeat: 'weekly', sample: true }
      ]
    };
  }

  const defaults = () => {
    const ex = exampleData();
    return {
      ddls: ex.ddls,
      done: [],
      events: ex.events,
      shredCount: 0,
      settings: {
        theme: 'auto',        // auto | sunny | cloudy | rain | fog | snow
        tone: 'auto',         // auto | light | dark
        remindTime: '11:00',
        remindMode: 'key',    // key: 7/3/1/当天   daily: 每天
        shredMethod: 'tear',
        sound: true,
        mealTimes: ['08:00', '19:00']
      },
      dog: {
        born: Date.now(),
        last: Date.now(),
        full: 72, mood: 78, water: 80,
        love: 0, chub: 0,
        lastPet: 0, fedToday: 0, fedDay: D.todayKey(),
        customFoods: []
      },
      weather: null
    };
  };

  function merge(base, saved) {
    for (const k in saved) {
      if (saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        base[k] = merge(base[k], saved[k]);
      } else base[k] = saved[k];
    }
    return base;
  }

  let state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
  } catch (e) { state = defaults(); }

  let timer = null;
  function save() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 存储不可用时静默 */ }
    }, 120);
  }

  function replaceAll(obj) {
    state = merge(defaults(), obj);
    window.Store.state = state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    state = defaults();
    window.Store.state = state;
    save();
  }

  window.D = D;
  window.Store = { state, save, replaceAll, reset, FOODS, KEY };
})();
