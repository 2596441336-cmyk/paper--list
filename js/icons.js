/* 线描图标，颜色跟随文字 */
(function () {
  const s = (p, extra) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + p + '</svg>';
  const I = {
    'tab-ddl': s('<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9"/><path d="M10 18h4" />'),
    'tab-sched': s('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="1" fill="currentColor"/><circle cx="12" cy="14.5" r="1" fill="currentColor"/>'),
    'tab-shred': s('<path d="M6 3h9l3 3v6"/><path d="M6 3v9"/><path d="M6 12l2 2 2-2 2 2 2-2 2 2 2-2"/><path d="M7 17l-1 4M11 17l.5 4M15 17l1 4"/>'),
    'tab-dog': s('<path d="M5 9c-1.5 2-1.5 5 0 6l2-1M19 9c1.5 2 1.5 5 0 6l-2-1"/><path d="M7 7.5C8 6 10 5.5 12 5.5s4 .5 5 2c1 1.6 1 5-.5 7.5-1.2 2-3 3.5-4.5 3.5s-3.3-1.5-4.5-3.5C6 12.5 6 9.1 7 7.5z"/><circle cx="10" cy="11" r=".9" fill="currentColor"/><circle cx="14" cy="11" r=".9" fill="currentColor"/><path d="M11 14.5h2l-1 1z" fill="currentColor"/>'),
    'tab-set': s('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    tear: s('<path d="M5 3h6l-1 4 2 3-1 4 2 3-1 4H5z"/><path d="M14 3h5v18h-4l1-4-2-3 1-4-2-3z"/>'),
    crumple: s('<path d="M12 4l3 2 4-1-1 4 2 3-3 2 1 4-4-1-3 3-2-3-4 1 1-4-3-2 3-3-1-4 4 1z"/><path d="M9 10l3 2 3-3M10 15l2-3"/>'),
    burn: s('<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.6 3-5.6 3.5-9 2 1.3 3 3.2 3 5 1-.6 1.7-1.6 2-3 2 1.6 3.5 4.2 3.5 7 0 3.4-2.5 6-5.5 6z"/><path d="M12 21c-1.7 0-3-1.2-3-3 0-1.9 1.6-2.8 2-4.5 1.6 1 3 2.4 3 4.5 0 1.8-.6 3-2 3z"/>'),
    plane: s('<path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/>'),
    random: s('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor"/>'),
    bowl: s('<path d="M3 12h18c0 4-3.5 7-9 7s-9-3-9-7z"/><path d="M7 12c0-2 1.5-3 2.5-3S11 10 12 10s1.5-2 3-2 2 2 2 4"/>'),
    water: s('<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.5"/>'),
    paw: s('<ellipse cx="12" cy="16" rx="4" ry="3.3"/><circle cx="6.5" cy="11" r="1.7"/><circle cx="9.5" cy="7.5" r="1.7"/><circle cx="14.5" cy="7.5" r="1.7"/><circle cx="17.5" cy="11" r="1.7"/>'),
    ball: s('<circle cx="12" cy="12" r="8"/><path d="M5.5 7.5c3 1.5 4 6 2.5 10M18.5 7.5c-3 1.5-4 6-2.5 10"/>'),
    cal: s('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>'),
    pin: s('<path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
    repeat: s('<path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3"/>'),
    trash: s('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    check: s('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    edit: s('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'),
    sunny: s('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>'),
    cloudy: s('<path d="M7 18.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18.5z"/>'),
    rain: s('<path d="M7 14.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 14.5z"/><path d="M8 17.5l-1 3M12 17.5l-1 3M16 17.5l-1 3"/>'),
    storm: s('<path d="M7 14.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 14.5z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>'),
    fog: s('<path d="M4 9h13M7 12.5h13M4 16h12M8 19.5h9"/><path d="M6 6c1.5-2 4-2.5 6-2.5"/>'),
    snow: s('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M10 4.5l2 1.5 2-1.5M10 19.5l2-1.5 2 1.5"/>'),
    night: s('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>')
  };
  window.Icons = I;
  window.paintIcons = function (root) {
    (root || document).querySelectorAll('[data-ico]').forEach((el) => {
      const k = el.getAttribute('data-ico');
      if (I[k] && !el.firstChild) el.innerHTML = I[k];
    });
  };
})();
