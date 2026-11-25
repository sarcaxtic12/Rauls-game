(function () {
  const FR = (window.FornoRush = window.FornoRush || {});
  const C = FR.Config;
  const CR = FR.CustomerRenderer;
  const PR = FR.PizzaRenderer;
  const DR = FR.DiningRenderer;

  const state = new FR.GameState();
  const prepParticles = new PR.ParticleSystem();
  const boardParticles = new PR.ParticleSystem();

  // DOM references matching index.html contract
  const els = {
    app: document.getElementById('app'),
    hudDayBadge: document.getElementById('hud-day-badge'),
    hudRankBadge: document.getElementById('hud-rank-badge'),
    hudClock: document.getElementById('hud-clock'),
    clockPill: document.querySelector('.clock-pill'),
    hudCoins: document.getElementById('hud-coins'),
    hudCoinBox: document.getElementById('hud-coin-box'),
    hudDayRev: document.getElementById('hud-day-rev'),
    hudDayGoal: document.getElementById('hud-day-goal'),
    goalPill: document.querySelector('.goal-pill'),
    hudFeverPill: document.getElementById('hud-fever-pill'),
    hudStreakLabel: document.getElementById('hud-streak-label'),
    hudFeverStatus: document.getElementById('hud-fever-status'),
    hudFeverFill: document.getElementById('hud-fever-fill'),

    btnDecor: document.getElementById('btn-decor'),
    btnMusic: document.getElementById('btn-music'),
    btnSfx: document.getElementById('btn-sfx'),
    btnHelp: document.getElementById('btn-help'),
    btnPause: document.getElementById('btn-pause'),

    // Multi-Room Nav & Peripheral Monitor Bar
    roomButtons: Array.from(document.querySelectorAll('[data-room]')),
    navDiningBadge: document.getElementById('nav-dining-badge'),
    navKitchenBadge: document.getElementById('nav-kitchen-badge'),
    navOvenBars: document.getElementById('nav-oven-bars'),
    navPassBadge: document.getElementById('nav-pass-badge'),

    // Slim Active Ticket Rail
    ticketStrip: document.getElementById('ticket-strip'),

    // Room views
    roomDining: document.getElementById('room-dining'),
    roomKitchen: document.getElementById('room-kitchen'),
    roomOven: document.getElementById('room-oven'),

    // Room 1: Dining Room
    diningCanvas: document.getElementById('dining-canvas'),
    diningTipBar: document.getElementById('dining-tip-bar'),

    // Room 2: Cook Line
    makelineRail: document.getElementById('makeline-rail'),
    selectedOrderBanner: document.getElementById('selected-order-banner'),
    btnTrashPrep: document.getElementById('btn-trash-prep'),
    prepCanvas: document.getElementById('prep-canvas'),
    prepHintPill: document.getElementById('prep-hint-pill'),
    btnSendOven: document.getElementById('btn-send-oven'),

    // Room 3: Brick-Dome Forno & Cutting Pass
    ovenFinishLabel: document.getElementById('oven-finish-label'),
    ovenHearthGrid: document.getElementById('oven-hearth-grid'),
    boardCanvas: document.getElementById('board-canvas'),
    boardSliceBadge: document.getElementById('board-slice-badge'),
    boardStatusLabel: document.getElementById('board-status-label'),
    boardReadout: document.getElementById('board-readout'),
    btnTrashBoard: document.getElementById('btn-trash-board'),
    btnQuickSlice: document.getElementById('btn-quick-slice'),
    btnSodaTap: document.getElementById('btn-soda-tap'),
    sodaBtnLabel: document.getElementById('soda-btn-label'),
    btnSendPass: document.getElementById('btn-send-pass'),
    btnSendAndDeliver: document.getElementById('btn-send-and-deliver'),
    passPreviewList: document.getElementById('pass-preview-list'),

    // Floating elements & overlays
    heldCursor: document.getElementById('held-cursor'),
    fxLayer: document.getElementById('fx-layer'),

    overlayTitle: document.getElementById('overlay-title'),
    titleSaveBanner: document.getElementById('title-save-banner'),
    btnStartPlay: document.getElementById('btn-start-play'),
    btnResetSave: document.getElementById('btn-reset-save'),

    overlayPause: document.getElementById('overlay-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartDay: document.getElementById('btn-restart-day'),
    btnToTitle: document.getElementById('btn-to-title'),

    overlayHelp: document.getElementById('overlay-help'),
    btnCloseHelp: document.getElementById('btn-close-help'),
    btnCloseHelp2: document.getElementById('btn-close-help-2'),

    overlayDayEnd: document.getElementById('overlay-day-end'),
    dayEndKicker: document.getElementById('day-end-kicker'),
    dayEndTitle: document.getElementById('day-end-title'),
    dayEndStars: document.getElementById('day-end-stars'),
    dayStatsGrid: document.getElementById('day-stats-grid'),
    prestigeBarWrap: document.getElementById('prestige-bar-wrap'),
    nextUnlocksBanner: document.getElementById('next-unlocks-banner'),
    shopCoins: document.getElementById('shop-coins'),
    tabDecor: document.getElementById('tab-decor'),
    tabUpgrades: document.getElementById('tab-upgrades'),
    panelDecor: document.getElementById('panel-decor'),
    panelUpgrades: document.getElementById('panel-upgrades'),
    decorGrid: document.getElementById('decor-grid'),
    shopGrid: document.getElementById('shop-grid'),
    btnReplayDay: document.getElementById('btn-replay-day'),
    btnNextDay: document.getElementById('btn-next-day'),
    btnCloseShowroom: document.getElementById('btn-close-showroom'),
  };

  // Cached interactive canvas geometry
  let diningGeo = null;
  let diningHover = null;
  let prepGeo = { cx: 220, cy: 170, radius: 130 };
  let boardGeo = { cx: 140, cy: 120, radius: 92 };

  // Pointer & drag interaction states
  let prepDragging = false;
  let lastDragToppingPos = null;
  let boardSwipeStart = null;
  let boardSwipeCurr = null;

  const grabState = {
    active: false,
    kind: null,
    id: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
    appliedDuringDrag: false,
    lastTopPos: null,
    panEl: null,
  };

  // Showroom modal state
  let showroomMode = 'dayEnd'; // 'dayEnd' | 'midShift'
  let activeShowroomTab = 'decor'; // 'decor' | 'upgrades'
  let phaseBeforeShowroom = 'playing';
  let phaseBeforeHelp = 'playing';

  // Cached DOM collections & signatures to avoid per-frame DOM thrashing
  let ovenSlotEls = [];
  let navOvenBarEls = [];
  let lastTicketSignature = '';
  let lastPassSignature = '';
  let lastBoardSignature = '';

  /* ===== UTILITIES ===== */
  function fmtMoney(v) {
    return `$${Number(v || 0).toFixed(2)}`;
  }

  function fmtClock(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function showToast(text, x, y, tone = '') {
    if (!els.fxLayer) return;
    const el = document.createElement('div');
    el.className = `float-toast ${tone}`.trim();
    el.textContent = text;
    const clampedX = Math.max(90, Math.min(window.innerWidth - 90, x));
    const clampedY = Math.max(58, Math.min(window.innerHeight - 50, y));
    el.style.left = `${clampedX}px`;
    el.style.top = `${clampedY}px`;
    els.fxLayer.appendChild(el);
    window.setTimeout(() => el.remove(), 1450);
  }

  function triggerShake() {
    if (!els.app) return;
    els.app.classList.remove('screen-shake');
    void els.app.offsetWidth;
    els.app.classList.add('screen-shake');
  }

  function launchCoinsFromPoint(startX, startY, amount, forcedCount = null) {
    if (!els.fxLayer || !els.hudCoinBox) return;
    const targetRect = els.hudCoinBox.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width * 0.5;
    const endY = targetRect.top + targetRect.height * 0.5;
    const count = forcedCount !== null ? forcedCount : Math.max(3, Math.min(9, Math.round(amount / 3)));

    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'flying-coin';
      coin.textContent = '$';
      coin.style.left = '0px';
      coin.style.top = '0px';
      els.fxLayer.appendChild(coin);

      const delay = i * 52;
      const dur = 520 + Math.random() * 140;
      const ctrlX = (startX + endX) * 0.5 + (Math.random() - 0.5) * 130;
      const ctrlY = Math.min(startY, endY) - 65 - Math.random() * 55;
      const t0 = performance.now() + delay;

      function step(now) {
        if (now < t0) {
          coin.style.opacity = '0';
          requestAnimationFrame(step);
          return;
        }
        coin.style.opacity = '1';
        const t = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - t, 3);
        const u = 1 - ease;
        const x = u * u * startX + 2 * u * ease * ctrlX + ease * ease * endX;
        const y = u * u * startY + 2 * u * ease * ctrlY + ease * ease * endY;
        coin.style.transform = `translate(${x - 10}px, ${y - 10}px) scale(${1 - t * 0.22})`;

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          coin.remove();
          els.hudCoinBox.classList.add('pop');
          window.setTimeout(() => els.hudCoinBox.classList.remove('pop'), 150);
          if (i === 0 || i === count - 1) FR.Audio.playCoinTick();
        }
      }
      requestAnimationFrame(step);
    }
  }

  function getTableLayoutCoords(count) {
    if (count <= 3) {
      return [
        { x: 0.24, y: 0.51 },
        { x: 0.5, y: 0.51 },
        { x: 0.76, y: 0.51 },
      ];
    }
    if (count === 4) {
      return [
        { x: 0.28, y: 0.39 },
        { x: 0.72, y: 0.39 },
        { x: 0.28, y: 0.67 },
        { x: 0.72, y: 0.67 },
      ];
    }
    if (count === 5) {
      return [
        { x: 0.23, y: 0.39 },
        { x: 0.5, y: 0.39 },
        { x: 0.77, y: 0.39 },
        { x: 0.35, y: 0.68 },
        { x: 0.65, y: 0.68 },
      ];
    }
    return [
      { x: 0.23, y: 0.39 },
      { x: 0.5, y: 0.39 },
      { x: 0.77, y: 0.39 },
      { x: 0.23, y: 0.68 },
      { x: 0.5, y: 0.68 },
      { x: 0.77, y: 0.68 },
    ];
  }

  function applyMidShiftUpgradeChanges(upgradeId) {
    if (upgradeId === 'ovenSlots') {
      const needed = state.getOvenSlotCount();
      while (state.ovenSlots.length < needed) {
        state.ovenSlots.push(null);
      }
      buildOvenSlots();
      buildNavOvenBars();
    } else if (upgradeId === 'turboOven') {
      buildOvenSlots();
    } else if (upgradeId === 'tables') {
      const needed = state.getTableCount();
      const layout = getTableLayoutCoords(needed);
      // Reposition existing tables cleanly and keep seated/entering guests aligned
      for (let i = 0; i < state.tables.length && i < layout.length; i++) {
        const t = state.tables[i];
        t.x = layout[i].x;
        t.y = layout[i].y;
        if (t.guestId) {
          const g = state.getGuestById(t.guestId);
          if (g) {
            if (g.stage === 'entering') {
              g.targetX = t.x;
              g.targetY = t.y + 0.085;
            } else if (g.stage === 'reading' || g.stage === 'ordered' || g.stage === 'eating') {
              g.x = t.x;
              g.y = t.y + 0.085;
            }
          }
        }
      }
      while (state.tables.length < needed) {
        const idx = state.tables.length;
        const pos = layout[idx] || { x: 0.5, y: 0.68 };
        const newTable = {
          id: idx + 1,
          x: pos.x,
          y: pos.y,
          status: 'empty',
          guestId: null,
          servedPizza: null,
          slicesEaten: 0,
          cashWaiting: 0,
          tipWaiting: 0,
          dirtyTimer: 0,
          lastCleanFlash: performance.now(),
        };
        state.tables.push(newTable);
        state.assignWaitingGuestToTable(newTable);
      }
    }
    syncBoardUI(true);
    syncNavMonitor();
  }

  /* ===== ROOM NAVIGATION ===== */
  const ROOM_ORDER = ['dining', 'kitchen', 'oven'];

  function switchRoom(room, silent = false) {
    if (!ROOM_ORDER.includes(room)) return;
    if (grabState.active) cancelIngredientGrab();
    diningHover = null;
    if (els.diningCanvas) els.diningCanvas.style.cursor = 'default';

    if (silent) {
      state.activeRoom = room;
    } else {
      state.setRoom(room);
    }

    els.roomButtons.forEach((btn) => {
      const isAct = btn.dataset.room === room;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });

    if (els.roomDining) els.roomDining.classList.toggle('active', room === 'dining');
    if (els.roomKitchen) els.roomKitchen.classList.toggle('active', room === 'kitchen');
    if (els.roomOven) els.roomOven.classList.toggle('active', room === 'oven');

    // Immediately measure and paint active canvas so hit-boxes are ready on the very next click
    const now = performance.now();
    if (room === 'dining' && els.diningCanvas) {
      const dGeo = DR.renderDiningRoom(els.diningCanvas, state, diningHover, now);
      if (dGeo) diningGeo = dGeo;
    } else if (room === 'kitchen' && els.prepCanvas) {
      const pGeo = PR.renderPrepStation(els.prepCanvas, state, prepParticles, 0, now);
      if (pGeo) prepGeo = pGeo;
    } else if (room === 'oven') {
      syncOvenVisuals(now);
      if (els.boardCanvas) {
        const bGeo = PR.renderCuttingBoard(els.boardCanvas, state.boardPizza, null, boardParticles, 0, now);
        if (bGeo) boardGeo = bGeo;
      }
    }

    syncMakelineUI();
    syncBoardUI(true);
    syncPassPreview(true);
    syncNavMonitor();
  }

  /* ===== MAKELINE COOK LINE BUILDER ===== */
  function buildMakelineRail() {
    if (!els.makelineRail) return;
    const unlockedSauces = new Set(state.dayConfig.unlockedSauces);
    const unlockedToppings = new Set(state.dayConfig.unlockedToppings);

    const pans = [
      { kind: 'dough', id: 'dough', label: 'Dough', hotkey: 'Space', locked: false, unlockDay: 1 },
      ...Object.values(C.SAUCES).map((s) => ({
        kind: 'sauce',
        id: s.id,
        label: s.short,
        hotkey: s.hotkey,
        locked: !unlockedSauces.has(s.id),
        unlockDay: s.unlockDay,
      })),
      { kind: 'cheese', id: 'mozzarella', label: 'Mozz', hotkey: 'C', locked: false, unlockDay: 1 },
      ...C.TOPPINGS.map((t) => ({
        kind: 'topping',
        id: t.id,
        label: t.short,
        hotkey: '',
        locked: !unlockedToppings.has(t.id),
        unlockDay: t.unlockDay,
      })),
    ];

    els.makelineRail.innerHTML = '';

    pans.forEach((item) => {
      const pan = document.createElement('button');
      pan.type = 'button';
      pan.className = `makeline-pan pan-${item.kind}${item.locked ? ' locked' : ''}`;
      pan.dataset.toolKind = item.kind;
      pan.dataset.toolId = item.id;
      pan.draggable = false;
      if (item.locked) {
        pan.disabled = true;
        pan.title = `${item.label} — Unlocks Day ${item.unlockDay}`;
      } else {
        pan.title = `Grab & drag ${item.label} onto marble (or click to equip)${item.hotkey ? ` [${item.hotkey}]` : ''}`;
      }

      const canvas = document.createElement('canvas');
      canvas.className = 'pan-thumb';
      canvas.width = 88;
      canvas.height = 58;
      canvas.draggable = false;
      PR.renderMakelinePanThumb(canvas, item.kind, item.id);

      const meta = document.createElement('div');
      meta.className = 'pan-meta';

      const nameEl = document.createElement('span');
      nameEl.className = 'pan-label';
      nameEl.textContent = item.label;
      meta.appendChild(nameEl);

      if (item.locked) {
        const lockBadge = document.createElement('span');
        lockBadge.className = 'pan-lock';
        lockBadge.textContent = `D${item.unlockDay}`;
        pan.appendChild(lockBadge);
      } else {
        if (item.hotkey) {
          const keyEl = document.createElement('span');
          keyEl.className = 'pan-key';
          keyEl.textContent = item.hotkey === 'Space' ? 'SPC' : item.hotkey;
          pan.appendChild(keyEl);
        }
        const badge = document.createElement('span');
        badge.className = 'pan-badge hidden';
        badge.dataset.panBadge = `${item.kind}:${item.id}`;
        pan.appendChild(badge);
      }

      pan.appendChild(canvas);
      pan.appendChild(meta);
      els.makelineRail.appendChild(pan);
    });
  }

  /* ===== OVEN HEARTHS & MINI NAV BARS BUILDERS ===== */
  function buildNavOvenBars() {
    if (!els.navOvenBars) return;
    const count = state.getOvenSlotCount();
    els.navOvenBars.innerHTML = '';
    navOvenBarEls = [];

    for (let i = 0; i < count; i++) {
      const bar = document.createElement('div');
      bar.className = 'mini-oven-bar idle';
      bar.dataset.miniOven = String(i);
      bar.title = `Deck ${i + 1} — Click to view Forno`;
      bar.innerHTML = `
        <span class="mini-oven-num">${i + 1}</span>
        <span class="mini-oven-track"><span class="mini-oven-fill" style="width:0%"></span></span>
      `;
      bar.addEventListener('click', (e) => {
        e.stopPropagation();
        FR.Audio.unlock();
        switchRoom('oven');
      });
      els.navOvenBars.appendChild(bar);
      navOvenBarEls.push({
        root: bar,
        fill: bar.querySelector('.mini-oven-fill'),
      });
    }
  }

  function buildOvenSlots() {
    if (!els.ovenHearthGrid) return;
    const count = state.getOvenSlotCount();
    const hotkeys = ['Q', 'W', 'E', 'R'];
    els.ovenHearthGrid.innerHTML = '';
    ovenSlotEls = [];

    const tol = state.getBakeToleranceBonus();
    const gLeft = Math.max(38, C.BAKE_LEVELS.golden.min - tol);
    const gWidth = Math.min(93, C.BAKE_LEVELS.golden.max + tol) - gLeft;
    const cLeft = Math.max(66, C.BAKE_LEVELS.crispy.min - tol);
    const cWidth = Math.min(93, C.BAKE_LEVELS.crispy.max + tol) - cLeft;

    for (let i = 0; i < count; i++) {
      const slot = document.createElement('div');
      slot.className = 'oven-slot';
      slot.dataset.slotIndex = String(i);
      slot.innerHTML = `
        <div class="oven-slot-top">
          <span class="oven-key-badge">HEARTH ${i + 1} <kbd>${hotkeys[i]}</kbd></span>
          <span class="oven-state-pill" data-oven-pill="${i}">OPEN</span>
        </div>
        <canvas class="oven-canvas" data-oven-canvas="${i}"></canvas>
        <div class="oven-gauge-wrap">
          <div class="oven-gauge-track">
            <div class="oven-zone golden" style="left:${gLeft}%;width:${gWidth}%"></div>
            <div class="oven-zone crispy" style="left:${cLeft}%;width:${cWidth}%"></div>
            <div class="oven-zone burn" style="left:93%;width:7%"></div>
            <div class="oven-gauge-needle" data-oven-needle="${i}" style="width:0%"></div>
          </div>
        </div>
      `;

      slot.addEventListener('click', () => handleOvenSlotClick(i));
      els.ovenHearthGrid.appendChild(slot);

      ovenSlotEls.push({
        root: slot,
        canvas: slot.querySelector(`[data-oven-canvas="${i}"]`),
        pill: slot.querySelector(`[data-oven-pill="${i}"]`),
        needle: slot.querySelector(`[data-oven-needle="${i}"]`),
      });
    }

    syncOvenFinishLabel();
  }

  function syncOvenFinishLabel() {
    if (!els.ovenFinishLabel) return;
    const finishId = state.save.equippedDecor.ovenFinish || 'brick';
    const spec = C.DECOR_CATALOG.ovenFinish.items.find((i) => i.id === finishId);
    els.ovenFinishLabel.textContent = spec ? spec.name : 'Classic Firebrick';
  }

  /* ===== PERIPHERAL MONITOR BAR & HUD SYNC ===== */
  function syncHud() {
    if (els.hudDayBadge) {
      els.hudDayBadge.textContent = `DAY ${state.save.day} • ${state.timeLeft > 0 ? 'OPEN' : 'LAST ORDERS'}`;
    }
    if (els.hudRankBadge) {
      const p = state.getPrestigeInfo();
      els.hudRankBadge.textContent = `${p.current.badge} ${p.current.name}`;
    }
    if (els.hudClock) els.hudClock.textContent = fmtClock(state.timeLeft);
    if (els.clockPill) els.clockPill.classList.toggle('urgent', state.timeLeft > 0 && state.timeLeft <= 15);
    if (els.hudCoins) els.hudCoins.textContent = fmtMoney(state.save.coins);
    if (els.hudDayRev) els.hudDayRev.textContent = `$${Math.round(state.dayStats.revenue)}`;
    if (els.hudDayGoal) els.hudDayGoal.textContent = `$${state.dayConfig.targetRevenue}`;
    if (els.goalPill) els.goalPill.classList.toggle('met', state.dayStats.revenue >= state.dayConfig.targetRevenue);

    if (els.hudStreakLabel) els.hudStreakLabel.textContent = `STREAK ×${state.streak}`;
    if (els.hudFeverStatus) {
      els.hudFeverStatus.textContent = state.feverActive ? `2× TIPS (${Math.ceil(state.feverTimeLeft)}s)` : 'FEVER';
    }
    if (els.hudFeverFill) els.hudFeverFill.style.width = `${Math.round(state.fever)}%`;
    if (els.hudFeverPill) els.hudFeverPill.classList.toggle('active', state.feverActive);
    if (els.app) els.app.classList.toggle('fever-active', state.feverActive);
  }

  function syncNavMonitor() {
    const readingCount = state.guests.filter((g) => g.stage === 'reading').length;
    const orderedCount = state.guests.filter((g) => g.stage === 'ordered').length;
    const eatingCount = state.guests.filter((g) => g.stage === 'eating').length;
    const queueingCount = state.guests.filter((g) => g.stage === 'queueing').length;
    const seatedCount = readingCount + orderedCount + eatingCount;
    const dirtyCount = state.tables.filter((t) => t.status === 'dirty').length;
    const passCount = state.passSlots.length;

    // Dining Room monitor badge
    if (els.navDiningBadge) {
      let text = 'Floor quiet';
      let tone = '';
      if (passCount > 0 && orderedCount > 0) {
        text = 'Deliver pie!';
        tone = 'alert-good';
      } else if (dirtyCount > 0) {
        text = seatedCount > 0 ? `${seatedCount} seated • ${dirtyCount} to bus` : `${dirtyCount} to bus`;
        tone = 'alert-gold';
      } else if (readingCount > 0) {
        text = seatedCount > 1 ? `${seatedCount} seated • Ready to greet` : 'Ready to greet';
        tone = 'alert-info';
      } else if (queueingCount > 0) {
        text = `${seatedCount} seated • ${queueingCount} waiting`;
        tone = 'alert-gold';
      } else if (seatedCount > 0) {
        text = `${seatedCount} seated`;
      }
      els.navDiningBadge.textContent = text;
      els.navDiningBadge.className = `nav-badge ${tone}`.trim();
    }

    // Dining room calm bottom tip bar
    if (els.diningTipBar) {
      if (passCount > 0 && orderedCount > 0) {
        els.diningTipBar.textContent = 'Hot pie ready on the Serving Pass — click a seated table to deliver.';
      } else if (dirtyCount > 0) {
        els.diningTipBar.textContent = 'Click tables with cash & plates to collect tips and bus clean.';
      } else if (readingCount > 0) {
        els.diningTipBar.textContent = 'Click guests reading menus to greet them (+$2.00 Hospitality Bonus).';
      } else if (orderedCount > 0) {
        els.diningTipBar.textContent = 'Orders pinned above — enter Cook Line (Tab / F2) or click the Cook Line portal.';
      } else {
        els.diningTipBar.textContent = 'Click Cook Line or Brick Forno portals above, or press Tab / F1–F3 to move between rooms.';
      }
    }

    // Cook Line monitor badge
    if (els.navKitchenBadge) {
      const p = state.prepPizza;
      let kText = 'Bench open';
      let kTone = '';
      if (p.hasDough) {
        if (p.sauce && p.sauceCoverage >= 0.7 && p.cheeseLevel >= 0.72) {
          kText = 'Ready to fire';
          kTone = 'alert-good';
        } else {
          kText = 'Dough ready';
          kTone = 'alert-info';
        }
      }
      els.navKitchenBadge.textContent = kText;
      els.navKitchenBadge.className = `nav-badge ${kTone}`.trim();
    }

    // Always-on Live Mini Oven Bars
    const tol = state.getBakeToleranceBonus();
    const goldenMin = C.BAKE_LEVELS.golden.min - tol;
    const crispyMin = C.BAKE_LEVELS.crispy.min - tol;

    navOvenBarEls.forEach((barObj, idx) => {
      const pizza = state.ovenSlots[idx];
      if (!pizza) {
        barObj.root.className = 'mini-oven-bar idle';
        barObj.fill.style.width = '0%';
        return;
      }
      let stateClass = 'baking';
      if (pizza.bake >= 92) stateClass = 'burn';
      else if (pizza.bake >= crispyMin) stateClass = 'crispy';
      else if (pizza.bake >= goldenMin) stateClass = 'golden';

      barObj.root.className = `mini-oven-bar ${stateClass}`;
      barObj.fill.style.width = `${Math.min(100, pizza.bake).toFixed(1)}%`;
    });

    // Serving Pass badge
    if (els.navPassBadge) {
      els.navPassBadge.textContent = `Pass: ${passCount}/${C.MAX_PASS_SLOTS}`;
      els.navPassBadge.className = `nav-badge pass-badge${passCount > 0 ? ' alert-good' : ''}`;
    }
  }

  /* ===== SLIM ORDER TICKET STRIP ===== */
  function syncTicketStrip(force = false) {
    if (!els.ticketStrip) return;
    const orderedGuests = state.getOrderedGuests();
    const selGuest = state.getSelectedOrderGuest();
    const selId = selGuest ? selGuest.id : null;

    // Check best match for either boardPizza or currently selected pass pizza
    const refPie = state.boardPizza || state.passSlots[state.selectedPassIndex] || null;
    const bestMatch = refPie ? state.findBestGuestForPizza(refPie) : null;
    const bestId = bestMatch ? bestMatch.guest.id : null;

    const sig =
      orderedGuests.map((g) => `${g.id}:${g.tableId}:${g.mood}`).join('|') +
      `|sel:${selId}|best:${bestId}|guests:${state.guests.length}`;

    if (force || sig !== lastTicketSignature) {
      lastTicketSignature = sig;
      if (orderedGuests.length === 0) {
        const arriving = state.guests.some((g) => g.stage === 'entering' || g.stage === 'reading');
        els.ticketStrip.innerHTML = `<div class="ticket-strip-empty">${
          arriving
            ? 'Guests arriving in the Dining Room — click to greet for +$2.00'
            : 'Order rail clear — waiting for seated guests...'
        }</div>`;
        return;
      }

      els.ticketStrip.innerHTML = orderedGuests
        .map((g) => {
          const o = g.order;
          const sauce = C.SAUCES[o.sauce];
          const bake = C.BAKE_LEVELS[o.bake];
          const patPct = Math.max(0, Math.min(100, (o.patience / o.maxPatience) * 100));
          const patTone = patPct > 52 ? 'green' : patPct > 25 ? 'amber' : 'red';
          const isSelected = g.id === selId;
          const isBest = g.id === bestId;

          const sauceChip =
            o.sauce === 'white'
              ? `<span class="t-chip sauce-white">${sauce.short}</span>`
              : `<span class="t-chip sauce-colored" style="background:${sauce.color}">${sauce.short}</span>`;

          const cheeseChip =
            o.cheese === 'extra'
              ? '<span class="t-chip cheese-extra">2×</span>'
              : '<span class="t-chip cheese-reg">Mozz</span>';

          const topIcons = o.toppings
            .map((t) => {
              const half = t.side === 'whole' ? '' : `<span class="t-half">${t.side === 'left' ? 'L' : 'R'}</span>`;
              return `<span class="t-top" title="${C.TOPPING_MAP[t.id].name}">${half}${CR.renderToppingMiniIcon(t.id, 14)}</span>`;
            })
            .join('');

          return `
            <button
              type="button"
              class="ticket-pill${isSelected ? ' selected' : ''}${g.character.isVip ? ' vip' : ''}${isBest ? ' best-match' : ''}"
              data-ticket-guest="${g.id}"
              title="Pin Table ${g.tableId} (${g.character.name}) for prep"
            >
              <div class="ticket-pill-row">
                <span class="t-table">T${g.tableId}</span>
                <span class="t-name">${g.character.name}${g.character.isVip ? ' <span class="t-vip">VIP</span>' : ''}</span>
                ${sauceChip}
                ${cheeseChip}
                <span class="t-tops">${topIcons}</span>
                <span class="t-chip bake-${o.bake}">${bake.short}</span>
                <span class="t-chip t-slices">${o.slices}sl</span>
                ${o.wantsSoda ? '<span class="t-chip t-soda" title="Wants Blood-Orange Soda">🥤</span>' : ''}
              </div>
              <div class="ticket-pat-track">
                <div class="ticket-pat-fill ${patTone}" data-ticket-pat="${g.id}" style="width:${patPct.toFixed(1)}%"></div>
              </div>
            </button>
          `;
        })
        .join('');
    } else {
      // Lightweight live patience bar updates
      orderedGuests.forEach((g) => {
        const bar = els.ticketStrip.querySelector(`[data-ticket-pat="${g.id}"]`);
        if (bar) {
          const pct = Math.max(0, Math.min(100, (g.order.patience / g.order.maxPatience) * 100));
          bar.style.width = `${pct.toFixed(1)}%`;
          bar.className = `ticket-pat-fill ${pct > 52 ? 'green' : pct > 25 ? 'amber' : 'red'}`;
        }
      });
    }
  }

  /* ===== COOK LINE MAKELINE & PREP UI SYNC ===== */
  function syncMakelineUI() {
    const selGuest = state.getSelectedOrderGuest();
    const selOrder = selGuest ? selGuest.order : null;
    const p = state.prepPizza;
    const neededToppings = new Set(selOrder ? selOrder.toppings.map((t) => t.id) : []);

    // Counts per topping on current prep pizza
    const topCounts = {};
    p.toppings.forEach((t) => {
      topCounts[t.id] = (topCounts[t.id] || 0) + 1;
    });

    if (els.makelineRail) {
      els.makelineRail.querySelectorAll('.makeline-pan').forEach((pan) => {
        const kind = pan.dataset.toolKind;
        const id = pan.dataset.toolId;
        const isActive = state.activeTool.kind === kind && state.activeTool.id === id;
        pan.classList.toggle('active', isActive && !pan.disabled);

        // Subtle green highlight on pans needed for the pinned ticket
        let isNeeded = false;
        if (!pan.disabled && selOrder) {
          if (kind === 'dough' && !p.hasDough) isNeeded = true;
          else if (kind === 'sauce' && p.hasDough && selOrder.sauce === id && (p.sauce !== id || p.sauceCoverage < 0.72)) {
            isNeeded = true;
          } else if (kind === 'cheese' && p.hasDough) {
            const targetCheese = selOrder.cheese === 'extra' ? 1.45 : 0.72;
            if (p.cheeseLevel < targetCheese) isNeeded = true;
          } else if (kind === 'topping' && p.hasDough && neededToppings.has(id)) {
            isNeeded = true;
          }
        }
        pan.classList.toggle('needed', isNeeded);

        // Live badge (% / ✓ / 2×✓ / count)
        const badge = pan.querySelector('[data-pan-badge]');
        if (!badge) return;
        let badgeText = '';
        let ready = false;

        if (kind === 'dough') {
          if (p.hasDough) {
            badgeText = '✓';
            ready = true;
          }
        } else if (kind === 'sauce') {
          if (p.sauce === id && p.sauceCoverage > 0) {
            const pct = Math.min(100, Math.round((p.sauceCoverage / 0.72) * 100));
            badgeText = pct >= 100 ? '✓' : `${pct}%`;
            ready = pct >= 100;
          }
        } else if (kind === 'cheese') {
          if (p.cheeseLevel >= 1.45) {
            badgeText = '2×✓';
            ready = true;
          } else if (p.cheeseLevel >= 0.72) {
            badgeText = '✓';
            ready = true;
          } else if (p.cheeseLevel > 0) {
            badgeText = `${Math.round((p.cheeseLevel / 0.72) * 100)}%`;
          }
        } else if (kind === 'topping') {
          const n = topCounts[id] || 0;
          if (n > 0) {
            badgeText = String(n);
            ready = n >= 3;
          }
        }

        badge.textContent = badgeText;
        badge.classList.toggle('hidden', !badgeText);
        badge.classList.toggle('ready', ready);
        pan.classList.toggle('coated-ready', ready);
      });
    }

    // Fire into oven & clear buttons
    const hasOpenDeck = state.ovenSlots.some((s) => s === null);
    if (els.btnSendOven) els.btnSendOven.disabled = !p.hasDough || !hasOpenDeck;
    if (els.btnTrashPrep) els.btnTrashPrep.disabled = !p.hasDough;

    // Contextual prep hint
    if (els.prepHintPill) {
      if (!p.hasDough) {
        els.prepHintPill.textContent = 'Drag Dough onto marble (or click marble / Space)';
      } else if (!p.sauce || p.sauceCoverage < 0.7) {
        els.prepHintPill.textContent =
          state.save.upgrades.autoSauce > 0
            ? 'Drag or tap Sauce on the dough for a full ladle coat'
            : 'Drag Sauce pan over dough (or swirl directly) to coat';
      } else if (p.cheeseLevel < 0.72) {
        els.prepHintPill.textContent = 'Drag Mozzarella onto dough (or press C and sprinkle)';
      } else if (selOrder && selOrder.cheese === 'extra' && p.cheeseLevel < 1.45) {
        els.prepHintPill.textContent = 'Pinned order asks for 2× Extra Mozzarella';
      } else {
        els.prepHintPill.textContent = hasOpenDeck
          ? 'Add toppings from the makeline, then fire INTO FORNO [Enter]'
          : 'All oven hearths occupied — pull a pie in the Forno room';
      }
    }

    // Selected Order Banner
    if (els.selectedOrderBanner) {
      if (selGuest && selOrder) {
        const sauceName = C.SAUCES[selOrder.sauce].name;
        const cheeseText = selOrder.cheese === 'extra' ? '2× Cheese' : 'Mozz';
        const topText = selOrder.toppings
          .map((t) => {
            const n = C.TOPPING_MAP[t.id].short;
            return t.side === 'whole' ? n : `${t.side === 'left' ? 'L' : 'R'}:${n}`;
          })
          .join(' + ');
        const bakeText = C.BAKE_LEVELS[selOrder.bake].short;
        const sodaText = selOrder.wantsSoda ? ' + 🥤' : '';
        els.selectedOrderBanner.textContent = `T${selGuest.tableId} ${selGuest.character.name}: ${sauceName} • ${cheeseText} • ${topText} • ${bakeText} • ${selOrder.slices}sl${sodaText}`;
      } else {
        els.selectedOrderBanner.textContent = 'Prep bench ready — pin any order ticket above';
      }
    }
  }

  /* ===== OVEN, BOARD & PASS UI SYNC ===== */
  function syncOvenVisuals(now) {
    const tol = state.getBakeToleranceBonus();
    const finish = state.save.equippedDecor.ovenFinish || 'brick';
    const goldenMin = C.BAKE_LEVELS.golden.min - tol;
    const crispyMin = C.BAKE_LEVELS.crispy.min - tol;

    ovenSlotEls.forEach((slotObj, idx) => {
      const pizza = state.ovenSlots[idx];
      PR.renderOvenSlotCanvas(slotObj.canvas, pizza, finish, now);

      slotObj.root.classList.remove('state-golden', 'state-crispy', 'state-burn', 'occupied');
      slotObj.pill.classList.remove('golden', 'crispy', 'burn');

      if (!pizza) {
        slotObj.pill.textContent = state.prepPizza.hasDough ? 'SLIDE IN' : 'OPEN';
        slotObj.needle.style.width = '0%';
        return;
      }

      slotObj.root.classList.add('occupied');
      slotObj.needle.style.width = `${Math.min(100, pizza.bake).toFixed(1)}%`;

      if (pizza.bake >= 92) {
        slotObj.root.classList.add('state-burn');
        slotObj.pill.classList.add('burn');
        slotObj.pill.textContent = 'BURN!';
      } else if (pizza.bake >= crispyMin) {
        slotObj.root.classList.add('state-crispy');
        slotObj.pill.classList.add('crispy');
        slotObj.pill.textContent = 'CRISPY ✓';
      } else if (pizza.bake >= goldenMin) {
        slotObj.root.classList.add('state-golden');
        slotObj.pill.classList.add('golden');
        slotObj.pill.textContent = 'GOLDEN ✓';
      } else {
        slotObj.pill.textContent = `BAKING ${Math.round(pizza.bake)}%`;
      }
    });
  }

  function getBakeSummary(bakeVal) {
    if (bakeVal >= 94) return { label: 'Burnt', tone: 'bad' };
    if (bakeVal >= 74) return { label: 'Crispy', tone: 'good' };
    if (bakeVal >= 54) return { label: 'Golden', tone: 'good' };
    if (bakeVal < 38) return { label: 'Raw', tone: 'bad' };
    return { label: 'Light', tone: 'warn' };
  }

  function syncBoardUI(force = false) {
    const p = state.boardPizza;
    const hasPizza = !!p;
    const best = hasPizza ? state.findBestGuestForPizza(p) : null;
    const passFull = state.passSlots.length >= C.MAX_PASS_SLOTS;
    const sodaUnlocked = state.save.upgrades.sodaFountain > 0;
    const goldenCutter = state.save.upgrades.goldenCutter > 0;

    const sig = `${p ? p.id : 0}:${p ? p.cutLines.length : 0}:${p ? p.hasSoda : 0}:${p ? Math.round(p.bake) : 0}|best:${
      best ? `${best.guest.id}:${best.evaluation.totalScore}` : 'none'
    }|pass:${state.passSlots.length}|u:${sodaUnlocked}:${goldenCutter}`;

    if (!force && sig === lastBoardSignature) return;
    lastBoardSignature = sig;

    if (els.btnTrashBoard) els.btnTrashBoard.disabled = !hasPizza;
    if (els.btnQuickSlice) {
      els.btnQuickSlice.disabled = !hasPizza || p.cutLines.length >= 4;
      const span = els.btnQuickSlice.querySelector('span');
      if (span) span.textContent = goldenCutter ? 'Smart Slice' : 'Slice Cut';
    }

    if (els.btnSodaTap) {
      els.btnSodaTap.classList.toggle('locked', !sodaUnlocked);
      els.btnSodaTap.classList.toggle('on', hasPizza && p.hasSoda);
      els.btnSodaTap.disabled = !hasPizza || !sodaUnlocked;
    }
    if (els.sodaBtnLabel) {
      els.sodaBtnLabel.textContent = !sodaUnlocked
        ? '🔒 Italian Soda'
        : hasPizza && p.hasSoda
        ? '🥤 Soda Paired ✓'
        : '🥤 Pair Italian Soda';
    }

    if (els.btnSendPass) els.btnSendPass.disabled = !hasPizza || passFull;
    if (els.btnSendAndDeliver) els.btnSendAndDeliver.disabled = !hasPizza || passFull;

    if (!hasPizza) {
      if (els.boardSliceBadge) els.boardSliceBadge.classList.add('hidden');
      if (els.boardStatusLabel) els.boardStatusLabel.textContent = 'Pull a baked pie from the Forno above';
      if (els.boardReadout) {
        els.boardReadout.innerHTML =
          '<div class="readout-empty">Pull a baked pie from the hearth above to slice &amp; plate onto the Serving Pass.</div>';
      }
      return;
    }

    const slices = p.cutLines.length === 0 ? 1 : p.cutLines.length * 2;
    if (els.boardSliceBadge) {
      els.boardSliceBadge.textContent = slices === 1 ? 'Uncut — Swipe' : `${slices} Slices`;
      els.boardSliceBadge.classList.remove('hidden');
    }

    const bakeInfo = getBakeSummary(p.bake);
    const targetSliceText = best ? ` / wants ${best.guest.order.slices}` : '';
    const matchRow = best
      ? `<div class="readout-row"><span>Best Table</span><span class="readout-badge ${
          best.evaluation.totalScore >= 75 ? 'good' : 'warn'
        }">T${best.guest.tableId} ${best.guest.character.name} • ${best.evaluation.totalScore}%</span></div>`
      : '<div class="readout-row"><span>Waiting</span><span>No seated order yet</span></div>';

    if (els.boardStatusLabel) {
      els.boardStatusLabel.textContent =
        slices === 1 ? 'Swipe across pizza or press [X] to slice' : `${slices} slices cut — ready for Serving Pass`;
    }

    if (els.boardReadout) {
      els.boardReadout.innerHTML = `
        <div class="readout-row"><span>Bake</span><span class="readout-badge ${bakeInfo.tone}">${bakeInfo.label} (${Math.round(p.bake)}%)</span></div>
        <div class="readout-row"><span>Slices</span><span><strong>${slices === 1 ? 'Uncut' : slices}</strong>${targetSliceText}</span></div>
        ${matchRow}
      `;
    }
  }

  function syncPassPreview(force = false) {
    if (!els.passPreviewList) return;
    const sig =
      state.passSlots
        .map((p, i) => {
          const best = state.findBestGuestForPizza(p);
          return `${p.id}:${i === state.selectedPassIndex ? 1 : 0}:${best ? `${best.guest.tableId}:${best.evaluation.totalScore}` : 'none'}`;
        })
        .join('|') + `|len:${state.passSlots.length}`;

    if (!force && sig === lastPassSignature) return;
    lastPassSignature = sig;

    let html = '';
    for (let i = 0; i < C.MAX_PASS_SLOTS; i++) {
      const pie = state.passSlots[i];
      if (!pie) {
        html += `<div class="pass-slot-card empty"><span>Slot ${i + 1}</span><span class="pass-muted">Open</span></div>`;
        continue;
      }
      const sauceName = pie.sauce ? C.SAUCES[pie.sauce].short : 'No sauce';
      const slices = pie.cutLines.length === 0 ? 'Uncut' : `${pie.cutLines.length * 2}sl`;
      const bakeInfo = getBakeSummary(pie.bake);
      const best = state.findBestGuestForPizza(pie);
      const isSel = i === state.selectedPassIndex;

      html += `
        <button type="button" class="pass-slot-card filled${isSel ? ' selected' : ''}" data-pass-select="${i}" title="Select Pass Slot ${i + 1} and view Dining Room">
          <div class="pass-slot-top">
            <strong>#${i + 1} ${sauceName}</strong>
            <span class="pass-tag ${bakeInfo.tone}">${bakeInfo.label} • ${slices}${pie.hasSoda ? ' • 🥤' : ''}</span>
          </div>
          <div class="pass-slot-sub">
            ${best ? `Best: T${best.guest.tableId} ${best.guest.character.name} (${best.evaluation.totalScore}%)` : 'Ready to deliver in Dining Room'}
          </div>
        </button>
      `;
    }
    els.passPreviewList.innerHTML = html;
  }

  /* ===== PHYSICAL COOK-LINE GRAB & DRAG ===== */
  function renderHeldCursorContent(kind, id) {
    if (!els.heldCursor) return;
    if (kind === 'dough') {
      els.heldCursor.innerHTML = `<span class="held-swatch held-dough"></span><span class="held-label">Dough</span>`;
    } else if (kind === 'sauce') {
      const s = C.SAUCES[id];
      els.heldCursor.innerHTML = `<span class="held-swatch" style="background:${s.color}"></span><span class="held-label">${s.short}</span>`;
    } else if (kind === 'cheese') {
      els.heldCursor.innerHTML = `<span class="held-swatch held-cheese"></span><span class="held-label">Mozzarella</span>`;
    } else if (kind === 'topping') {
      const t = C.TOPPING_MAP[id];
      els.heldCursor.innerHTML = `${CR.renderToppingMiniIcon(id, 22)}<span class="held-label">${t.short}</span>`;
    }
  }

  function moveHeldCursor(clientX, clientY) {
    if (!els.heldCursor) return;
    els.heldCursor.style.left = `${clientX}px`;
    els.heldCursor.style.top = `${clientY}px`;
  }

  function cancelIngredientGrab() {
    if (!grabState.active) return;
    if (grabState.panEl) grabState.panEl.classList.remove('grabbed');
    grabState.active = false;
    grabState.panEl = null;
    grabState.lastTopPos = null;
    document.body.classList.remove('grabbing-ingredient');
    if (els.heldCursor) {
      els.heldCursor.classList.add('hidden');
      els.heldCursor.classList.remove('visible');
    }
  }

  function getPrepPointFromClient(clientX, clientY) {
    if (!els.prepCanvas) return null;
    const rect = els.prepCanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const inside =
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const nx = (x - prepGeo.cx) / Math.max(1, prepGeo.radius);
    const ny = (y - prepGeo.cy) / Math.max(1, prepGeo.radius);
    return { inside, x, y, nx, ny, rect };
  }

  if (els.makelineRail) {
    els.makelineRail.addEventListener('pointerdown', (e) => {
      const pan = e.target.closest('.makeline-pan');
      if (!pan || pan.disabled || state.phase !== 'playing') return;
      e.preventDefault();
      FR.Audio.unlock();
      FR.Audio.playGrabIngredient();

      const kind = pan.dataset.toolKind;
      const id = pan.dataset.toolId;

      state.activeTool = { kind, id };
      grabState.active = true;
      grabState.kind = kind;
      grabState.id = id;
      grabState.pointerId = e.pointerId;
      grabState.startX = e.clientX;
      grabState.startY = e.clientY;
      grabState.moved = false;
      grabState.appliedDuringDrag = false;
      grabState.lastTopPos = null;
      grabState.panEl = pan;

      pan.classList.add('grabbed');
      document.body.classList.add('grabbing-ingredient');
      renderHeldCursorContent(kind, id);
      moveHeldCursor(e.clientX, e.clientY);
      if (els.heldCursor) {
        els.heldCursor.classList.remove('hidden');
        els.heldCursor.classList.add('visible');
      }

      syncMakelineUI();
    });
  }

  window.addEventListener('pointermove', (e) => {
    if (!grabState.active || state.phase !== 'playing') return;
    moveHeldCursor(e.clientX, e.clientY);

    if (!grabState.moved && Math.hypot(e.clientX - grabState.startX, e.clientY - grabState.startY) > 6) {
      grabState.moved = true;
    }

    const pt = getPrepPointFromClient(e.clientX, e.clientY);
    if (!pt || !pt.inside) return;

    if (grabState.kind === 'sauce' && state.prepPizza.hasDough) {
      if (state.applySauceAt(pt.nx, pt.ny, false, grabState.id)) {
        grabState.appliedDuringDrag = true;
        syncMakelineUI();
        syncNavMonitor();
      }
    } else if (grabState.kind === 'cheese' && state.prepPizza.hasDough) {
      if (state.applyCheeseAt(pt.nx, pt.ny, false)) {
        grabState.appliedDuringDrag = true;
        syncMakelineUI();
        syncNavMonitor();
      }
    } else if (grabState.kind === 'topping' && state.prepPizza.hasDough) {
      const farEnough =
        !grabState.lastTopPos ||
        Math.hypot(pt.x - grabState.lastTopPos.x, pt.y - grabState.lastTopPos.y) >= 34;
      if (farEnough && state.placeToppingAt(pt.nx, pt.ny, grabState.id)) {
        grabState.lastTopPos = { x: pt.x, y: pt.y };
        grabState.appliedDuringDrag = true;
        prepParticles.spawnPopRing(pt.x, pt.y, C.TOPPING_MAP[grabState.id].accent);
        syncMakelineUI();
      }
    }
  });

  function finishIngredientGrab(e, isCancel = false) {
    if (!grabState.active) return;

    const kind = grabState.kind;
    const id = grabState.id;
    const moved = grabState.moved;
    const lastTopPos = grabState.lastTopPos;
    const appliedDuringDrag = grabState.appliedDuringDrag;

    cancelIngredientGrab();

    if (isCancel || state.phase !== 'playing') return;

    const pt = getPrepPointFromClient(e.clientX, e.clientY);
    if (pt && pt.inside) {
      if (kind === 'dough') {
        if (!state.prepPizza.hasDough) {
          if (state.tossDough()) {
            prepParticles.spawnFlourPuff(prepGeo.cx, prepGeo.cy);
          }
        } else {
          showToast('Dough is already stretched on the marble', e.clientX, e.clientY - 24);
        }
      } else if (!state.prepPizza.hasDough) {
        showToast('Drop Dough onto the marble first', e.clientX, e.clientY - 24, 'warn');
      } else if (kind === 'sauce') {
        const dist = Math.hypot(pt.nx, pt.ny);
        const ax = dist <= 0.85 ? pt.nx : 0;
        const ay = dist <= 0.85 ? pt.ny : 0;
        if (state.applySauceAt(ax, ay, true, id)) {
          prepParticles.spawnPopRing(
            dist <= 0.85 ? pt.x : prepGeo.cx,
            dist <= 0.85 ? pt.y : prepGeo.cy,
            C.SAUCES[id].highlight
          );
        }
      } else if (kind === 'cheese') {
        const dist = Math.hypot(pt.nx, pt.ny);
        const ax = dist <= 0.85 ? pt.nx : 0;
        const ay = dist <= 0.85 ? pt.ny : 0;
        if (state.applyCheeseAt(ax, ay, true)) {
          prepParticles.spawnPopRing(
            dist <= 0.85 ? pt.x : prepGeo.cx,
            dist <= 0.85 ? pt.y : prepGeo.cy,
            '#ffe88a'
          );
        }
      } else if (kind === 'topping') {
        const tooClose = lastTopPos && Math.hypot(pt.x - lastTopPos.x, pt.y - lastTopPos.y) < 18;
        if (!tooClose) {
          const dist = Math.hypot(pt.nx, pt.ny);
          const ax = dist <= 0.78 ? pt.nx : dist <= 1.05 ? (pt.nx / dist) * 0.72 : null;
          const ay = dist <= 0.78 ? pt.ny : dist <= 1.05 ? (pt.ny / dist) * 0.72 : null;
          if (ax !== null && ay !== null && state.placeToppingAt(ax, ay, id)) {
            prepParticles.spawnPopRing(
              prepGeo.cx + ax * prepGeo.radius,
              prepGeo.cy + ay * prepGeo.radius,
              C.TOPPING_MAP[id].accent
            );
          } else if (!appliedDuringDrag && dist > 1.05) {
            // Dropped on marble outside pizza edge — gently place near center so drop never feels ignored
            if (state.placeToppingAt(0, 0, id)) {
              prepParticles.spawnPopRing(prepGeo.cx, prepGeo.cy, C.TOPPING_MAP[id].accent);
            }
          }
        }
      }
    } else if (!moved && kind === 'dough' && !state.prepPizza.hasDough) {
      // Single click on Dough pan tosses dough immediately as a helpful shortcut
      if (state.tossDough()) {
        prepParticles.spawnFlourPuff(prepGeo.cx, prepGeo.cy);
      }
    }

    syncMakelineUI();
    syncNavMonitor();
  }

  window.addEventListener('pointerup', (e) => finishIngredientGrab(e, false));
  window.addEventListener('pointercancel', (e) => finishIngredientGrab(e, true));

  /* ===== DIRECT POINTER INTERACTION ON PREP CANVAS ===== */
  function applyPrepInteraction(pt, isClick) {
    if (state.phase !== 'playing') return;

    if (!state.prepPizza.hasDough) {
      if (isClick && state.tossDough()) {
        prepParticles.spawnFlourPuff(prepGeo.cx, prepGeo.cy);
        syncMakelineUI();
        syncNavMonitor();
      }
      return;
    }

    let tool = state.activeTool;
    if (tool.kind === 'dough') {
      const sel = state.getSelectedOrderGuest();
      state.activeTool = { kind: 'sauce', id: sel ? sel.order.sauce : 'marinara' };
      tool = state.activeTool;
      syncMakelineUI();
    }

    if (tool.kind === 'sauce') {
      if (state.applySauceAt(pt.nx, pt.ny, isClick)) {
        if (isClick) prepParticles.spawnPopRing(pt.x, pt.y, C.SAUCES[tool.id].highlight);
        syncMakelineUI();
        syncNavMonitor();
      }
    } else if (tool.kind === 'cheese') {
      if (state.applyCheeseAt(pt.nx, pt.ny, isClick)) {
        if (isClick) prepParticles.spawnPopRing(pt.x, pt.y, '#ffe88a');
        syncMakelineUI();
        syncNavMonitor();
      }
    } else if (tool.kind === 'topping') {
      if (!isClick && lastDragToppingPos) {
        if (Math.hypot(pt.x - lastDragToppingPos.x, pt.y - lastDragToppingPos.y) < 34) return;
      }
      if (state.placeToppingAt(pt.nx, pt.ny, tool.id)) {
        lastDragToppingPos = { x: pt.x, y: pt.y };
        prepParticles.spawnPopRing(pt.x, pt.y, C.TOPPING_MAP[tool.id].accent);
        syncMakelineUI();
      }
    }
  }

  if (els.prepCanvas) {
    els.prepCanvas.addEventListener('pointerdown', (e) => {
      FR.Audio.unlock();
      if (state.phase !== 'playing' || grabState.active) return;
      els.prepCanvas.setPointerCapture(e.pointerId);
      prepDragging = true;
      lastDragToppingPos = null;
      const pt = getPrepPointFromClient(e.clientX, e.clientY);
      if (pt) applyPrepInteraction(pt, true);
    });

    els.prepCanvas.addEventListener('pointermove', (e) => {
      if (!prepDragging || state.phase !== 'playing') return;
      const pt = getPrepPointFromClient(e.clientX, e.clientY);
      if (pt) applyPrepInteraction(pt, false);
    });

    const endPrepDrag = () => {
      prepDragging = false;
      lastDragToppingPos = null;
    };
    els.prepCanvas.addEventListener('pointerup', endPrepDrag);
    els.prepCanvas.addEventListener('pointercancel', endPrepDrag);
  }

  /* ===== INTERACTIVE 2.5D DINING ROOM ===== */
  function hitTestDiningRoom(clientX, clientY) {
    if (!diningGeo || !els.diningCanvas) return null;
    const rect = els.diningCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const kp = diningGeo.kitchenPortal;
    if (kp && x >= kp.x && x <= kp.x + kp.w && y >= kp.y && y <= kp.y + kp.h) {
      return { type: 'portal-kitchen', x, y, screenX: clientX, screenY: clientY };
    }

    const op = diningGeo.ovenPortal;
    if (op && x >= op.x && x <= op.x + op.w && y >= op.y && y <= op.y + op.h) {
      return { type: 'portal-oven', x, y, screenX: clientX, screenY: clientY };
    }

    if (diningGeo.passSlotHits) {
      for (const s of diningGeo.passSlotHits) {
        if (Math.hypot(x - s.x, y - s.y) <= s.r && state.passSlots[s.index]) {
          return {
            type: 'pass',
            index: s.index,
            x: s.x,
            y: s.y,
            screenX: rect.left + s.x,
            screenY: rect.top + s.y,
          };
        }
      }
    }

    if (diningGeo.tableHits) {
      for (const t of diningGeo.tableHits) {
        if (Math.hypot(x - t.x, y - t.y) <= t.r) {
          return {
            type: 'table',
            id: t.id,
            x: t.x,
            y: t.y,
            screenX: rect.left + t.x,
            screenY: rect.top + t.y,
          };
        }
      }
    }

    return null;
  }

  if (els.diningCanvas) {
    els.diningCanvas.addEventListener('pointermove', (e) => {
      if (state.phase !== 'playing' || state.activeRoom !== 'dining') {
        diningHover = null;
        els.diningCanvas.style.cursor = 'default';
        return;
      }
      diningHover = hitTestDiningRoom(e.clientX, e.clientY);
      els.diningCanvas.style.cursor = diningHover ? 'pointer' : 'default';
    });

    els.diningCanvas.addEventListener('pointerleave', () => {
      diningHover = null;
      els.diningCanvas.style.cursor = 'default';
    });

    els.diningCanvas.addEventListener('click', (e) => {
      FR.Audio.unlock();
      if (state.phase !== 'playing' || state.activeRoom !== 'dining') return;
      const hit = hitTestDiningRoom(e.clientX, e.clientY);
      if (!hit) return;

      if (hit.type === 'portal-kitchen') {
        switchRoom('kitchen');
        return;
      }

      if (hit.type === 'portal-oven') {
        switchRoom('oven');
        return;
      }

      if (hit.type === 'pass') {
        state.selectedPassIndex = hit.index;
        FR.Audio.playButtonClick();
        syncPassPreview(true);
        syncTicketStrip(true);
        showToast(`Pass Pie #${hit.index + 1} selected`, hit.screenX, hit.screenY + 34);
        return;
      }

      if (hit.type === 'table') {
        const table = state.tables.find((t) => t.id === hit.id);
        if (!table) return;
        const guest = table.guestId ? state.getGuestById(table.guestId) : null;

        // 1. Greet reading guest
        if (guest && guest.stage === 'reading') {
          const res = state.greetTable(table.id);
          if (res.ok) {
            showToast(`+${fmtMoney(res.bonus)} Welcome!`, hit.screenX, hit.screenY - 38, 'good');
            launchCoinsFromPoint(hit.screenX, hit.screenY - 12, res.bonus, 2);
            syncHud();
            syncTicketStrip(true);
            syncMakelineUI();
            syncNavMonitor();
          }
          return;
        }

        // 2. Deliver hot pie from Serving Pass to ordered guest
        if (guest && guest.stage === 'ordered' && state.passSlots.length > 0) {
          const passIdx =
            state.selectedPassIndex >= 0 && state.selectedPassIndex < state.passSlots.length
              ? state.selectedPassIndex
              : 0;
          const res = state.deliverPassToTable(table.id, passIdx);
          if (res.ok) {
            const { result } = res;
            const tone =
              result.tier === 'perfect' || result.tier === 'great'
                ? 'good'
                : result.tier === 'okay'
                ? 'warn'
                : 'bad';
            const tierWord =
              result.tier === 'perfect'
                ? '★ Perfect'
                : result.tier === 'great'
                ? 'Great'
                : result.tier === 'okay'
                ? 'Okay'
                : result.bakeNote;
            showToast(`${tierWord} (${result.totalScore}%) — "${result.comment}"`, hit.screenX, hit.screenY - 46, tone);
            if (result.tier === 'bad') triggerShake();
            syncHud();
            syncTicketStrip(true);
            syncPassPreview(true);
            syncBoardUI(true);
            syncMakelineUI();
            syncNavMonitor();
          }
          return;
        }

        // 3. Collect cash & bus dirty table
        if (table.status === 'dirty') {
          const res = state.busTable(table.id);
          if (res.ok) {
            if (res.collected > 0) {
              launchCoinsFromPoint(hit.screenX, hit.screenY, res.collected);
              showToast(`+${fmtMoney(res.collected)} Collected`, hit.screenX, hit.screenY - 34, 'good');
            } else {
              showToast(`Table T${table.id} cleaned`, hit.screenX, hit.screenY - 34, 'good');
            }
            syncHud();
            syncNavMonitor();
          }
          return;
        }

        // 4. Seated ordered guest with empty Serving Pass -> pin order & gently hint
        if (guest && guest.stage === 'ordered' && state.passSlots.length === 0) {
          state.selectOrderGuest(guest.id);
          FR.Audio.playButtonClick();
          showToast(`Prep T${table.id} in Cook Line`, hit.screenX, hit.screenY - 36);
          syncTicketStrip(true);
          syncMakelineUI();
        }
      }
    });
  }

  /* ===== OVEN & CUTTING BOARD HANDLERS ===== */
  function handleSendToOven(preferredSlot = -1) {
    FR.Audio.unlock();
    if (state.phase !== 'playing') return;
    const res = state.sendToOven(preferredSlot);
    const anchor = els.btnSendOven ? els.btnSendOven.getBoundingClientRect() : null;
    const tx = anchor && anchor.width > 0 ? anchor.left + anchor.width * 0.5 : window.innerWidth * 0.5;
    const ty = anchor && anchor.height > 0 ? anchor.top - 12 : window.innerHeight * 0.5;

    if (!res.ok) {
      showToast(res.reason, tx, ty, 'warn');
      triggerShake();
      return;
    }
    showToast(`Firing in Hearth ${res.slotIndex + 1}`, tx, ty, 'good');
    syncMakelineUI();
    syncNavMonitor();
  }

  function handleOvenSlotClick(slotIndex) {
    FR.Audio.unlock();
    if (state.phase !== 'playing') return;
    const pizza = state.ovenSlots[slotIndex];
    const slotRect = ovenSlotEls[slotIndex]?.root.getBoundingClientRect();
    const tx = slotRect ? slotRect.left + slotRect.width * 0.5 : window.innerWidth * 0.5;
    const ty = slotRect ? slotRect.top + 24 : 200;

    if (!pizza) {
      if (state.prepPizza.hasDough) {
        handleSendToOven(slotIndex);
      } else {
        showToast('Build a pie in the Cook Line first', tx, ty, 'warn');
      }
      return;
    }

    const res = state.pullFromOven(slotIndex);
    if (!res.ok) {
      showToast(res.reason, tx, ty, 'warn');
      triggerShake();
      return;
    }
    showToast('On the cutting board — swipe to slice', tx, ty, 'good');
    syncMakelineUI();
    syncBoardUI(true);
    syncTicketStrip(true);
    syncNavMonitor();
  }

  function handleSendToPass(goToDining = false) {
    FR.Audio.unlock();
    if (state.phase !== 'playing') return;
    const btn = goToDining ? els.btnSendAndDeliver : els.btnSendPass;
    const r = btn ? btn.getBoundingClientRect() : null;
    const tx = r && r.width > 0 ? r.left + r.width * 0.5 : window.innerWidth * 0.5;
    const ty = r && r.height > 0 ? r.top - 12 : window.innerHeight * 0.65;

    const res = state.sendBoardToPass();
    if (!res.ok) {
      showToast(res.reason, tx, ty, 'warn');
      triggerShake();
      return;
    }

    syncBoardUI(true);
    syncPassPreview(true);
    syncTicketStrip(true);
    syncNavMonitor();

    if (goToDining) {
      switchRoom('dining');
      showToast('Hot pie on Pass — click table to deliver', window.innerWidth * 0.5, Math.round(window.innerHeight * 0.36), 'good');
    } else {
      showToast('Plated on Serving Pass', tx, ty, 'good');
    }
  }

  // Cutting board swipe & tap-to-slice
  function getBoardPos(e) {
    const rect = els.boardCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  if (els.boardCanvas) {
    els.boardCanvas.addEventListener('pointerdown', (e) => {
      FR.Audio.unlock();
      if (state.phase !== 'playing' || !state.boardPizza) return;
      els.boardCanvas.setPointerCapture(e.pointerId);
      const p = getBoardPos(e);
      boardSwipeStart = p;
      boardSwipeCurr = p;
    });

    els.boardCanvas.addEventListener('pointermove', (e) => {
      if (!boardSwipeStart) return;
      boardSwipeCurr = getBoardPos(e);
    });

    const finishBoardSwipe = () => {
      if (!boardSwipeStart || !boardSwipeCurr || !state.boardPizza) {
        boardSwipeStart = null;
        boardSwipeCurr = null;
        return;
      }
      const dx = boardSwipeCurr.x - boardSwipeStart.x;
      const dy = boardSwipeCurr.y - boardSwipeStart.y;
      const dist = Math.hypot(dx, dy);

      if (dist >= 28) {
        const ang = Math.atan2(dy, dx);
        if (state.addCutLine(ang)) {
          boardParticles.spawnCrumbs(boardSwipeStart.x, boardSwipeStart.y, boardSwipeCurr.x, boardSwipeCurr.y);
          syncBoardUI(true);
          syncTicketStrip(true);
        }
      } else if (dist < 10) {
        const best = state.findBestGuestForPizza(state.boardPizza);
        if (state.quickSliceBoard(best ? best.guest.order.slices : null)) {
          boardParticles.spawnCrumbs(boardGeo.cx - 40, boardGeo.cy, boardGeo.cx + 40, boardGeo.cy);
          syncBoardUI(true);
          syncTicketStrip(true);
        }
      }

      boardSwipeStart = null;
      boardSwipeCurr = null;
    };

    els.boardCanvas.addEventListener('pointerup', finishBoardSwipe);
    els.boardCanvas.addEventListener('pointercancel', () => {
      boardSwipeStart = null;
      boardSwipeCurr = null;
    });
  }

  /* ===== BUTTON & DELEGATED LISTENERS ===== */
  els.roomButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      FR.Audio.unlock();
      switchRoom(btn.dataset.room);
    });
  });

  if (els.ticketStrip) {
    els.ticketStrip.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-ticket-guest]');
      if (!pill || state.phase !== 'playing') return;
      FR.Audio.unlock();
      const gid = Number(pill.dataset.ticketGuest);
      state.selectOrderGuest(gid);
      FR.Audio.playButtonClick();
      syncTicketStrip(true);
      syncMakelineUI();
    });
  }

  if (els.passPreviewList) {
    els.passPreviewList.addEventListener('click', (e) => {
      const card = e.target.closest('[data-pass-select]');
      if (!card || state.phase !== 'playing') return;
      FR.Audio.unlock();
      state.selectedPassIndex = Number(card.dataset.passSelect);
      syncPassPreview(true);
      switchRoom('dining');
    });
  }

  if (els.btnSendOven) els.btnSendOven.addEventListener('click', () => handleSendToOven(-1));

  if (els.btnTrashPrep) {
    els.btnTrashPrep.addEventListener('click', () => {
      FR.Audio.unlock();
      if (state.trashPrepPizza()) {
        triggerShake();
        syncMakelineUI();
        syncNavMonitor();
      }
    });
  }

  if (els.btnTrashBoard) {
    els.btnTrashBoard.addEventListener('click', () => {
      FR.Audio.unlock();
      if (state.trashBoardPizza()) {
        triggerShake();
        syncBoardUI(true);
        syncTicketStrip(true);
      }
    });
  }

  if (els.btnQuickSlice) {
    els.btnQuickSlice.addEventListener('click', () => {
      FR.Audio.unlock();
      if (!state.boardPizza) return;
      const best = state.findBestGuestForPizza(state.boardPizza);
      if (state.quickSliceBoard(best ? best.guest.order.slices : null)) {
        boardParticles.spawnCrumbs(boardGeo.cx - 42, boardGeo.cy, boardGeo.cx + 42, boardGeo.cy);
        syncBoardUI(true);
        syncTicketStrip(true);
      }
    });
  }

  if (els.btnSodaTap) {
    els.btnSodaTap.addEventListener('click', () => {
      FR.Audio.unlock();
      if (state.toggleBoardSoda()) {
        syncBoardUI(true);
        syncTicketStrip(true);
      }
    });
  }

  if (els.btnSendPass) els.btnSendPass.addEventListener('click', () => handleSendToPass(false));
  if (els.btnSendAndDeliver) els.btnSendAndDeliver.addEventListener('click', () => handleSendToPass(true));

  // Top HUD actions
  if (els.btnMusic) {
    els.btnMusic.addEventListener('click', () => {
      FR.Audio.unlock();
      const next = !FR.Audio.musicEnabled;
      FR.Audio.setMusicEnabled(next);
      els.btnMusic.classList.toggle('muted', !next);
      els.btnMusic.textContent = next ? '♫' : '🔇';
    });
  }

  if (els.btnSfx) {
    els.btnSfx.addEventListener('click', () => {
      FR.Audio.unlock();
      const next = !FR.Audio.sfxEnabled;
      FR.Audio.setSfxEnabled(next);
      els.btnSfx.classList.toggle('muted', !next);
      els.btnSfx.textContent = next ? '🔊' : '🔈';
    });
  }

  if (els.btnHelp) {
    els.btnHelp.addEventListener('click', () => {
      FR.Audio.unlock();
      FR.Audio.playButtonClick();
      phaseBeforeHelp = state.phase;
      if (state.phase === 'playing') state.phase = 'paused';
      if (els.overlayHelp) els.overlayHelp.classList.add('visible');
    });
  }

  function closeHelp() {
    if (els.overlayHelp) els.overlayHelp.classList.remove('visible');
    if (phaseBeforeHelp === 'playing') state.phase = 'playing';
  }
  if (els.btnCloseHelp) els.btnCloseHelp.addEventListener('click', closeHelp);
  if (els.btnCloseHelp2) els.btnCloseHelp2.addEventListener('click', closeHelp);

  if (els.btnPause) {
    els.btnPause.addEventListener('click', () => {
      if (state.phase === 'playing') {
        state.phase = 'paused';
        if (els.overlayPause) els.overlayPause.classList.add('visible');
        FR.Audio.playButtonClick();
      } else if (state.phase === 'paused' && els.overlayPause?.classList.contains('visible')) {
        state.phase = 'playing';
        els.overlayPause.classList.remove('visible');
        FR.Audio.playButtonClick();
      }
    });
  }

  if (els.btnResume) {
    els.btnResume.addEventListener('click', () => {
      if (els.overlayPause) els.overlayPause.classList.remove('visible');
      state.phase = 'playing';
      FR.Audio.playButtonClick();
    });
  }

  if (els.btnRestartDay) {
    els.btnRestartDay.addEventListener('click', () => {
      if (els.overlayPause) els.overlayPause.classList.remove('visible');
      beginDay(state.save.day);
    });
  }

  if (els.btnToTitle) {
    els.btnToTitle.addEventListener('click', () => {
      if (els.overlayPause) els.overlayPause.classList.remove('visible');
      state.phase = 'title';
      renderTitleOverlay();
    });
  }

  /* ===== BISTRO LEDGER & 2-TAB TRATTORIA SHOWROOM ===== */
  function setShowroomTab(tab) {
    activeShowroomTab = tab === 'upgrades' ? 'upgrades' : 'decor';
    if (els.tabDecor) {
      els.tabDecor.classList.toggle('active', activeShowroomTab === 'decor');
      els.tabDecor.setAttribute('aria-selected', activeShowroomTab === 'decor' ? 'true' : 'false');
    }
    if (els.tabUpgrades) {
      els.tabUpgrades.classList.toggle('active', activeShowroomTab === 'upgrades');
      els.tabUpgrades.setAttribute('aria-selected', activeShowroomTab === 'upgrades' ? 'true' : 'false');
    }
    if (els.panelDecor) {
      els.panelDecor.classList.toggle('hidden', activeShowroomTab !== 'decor');
      els.panelDecor.classList.toggle('active', activeShowroomTab === 'decor');
    }
    if (els.panelUpgrades) {
      els.panelUpgrades.classList.toggle('hidden', activeShowroomTab !== 'upgrades');
      els.panelUpgrades.classList.toggle('active', activeShowroomTab === 'upgrades');
    }
  }

  function renderPrestigeBar() {
    if (!els.prestigeBarWrap) return;
    const p = state.getPrestigeInfo();
    const decor = state.getDecorBonuses();
    const bonusParts = [];
    if (decor.tipBonus > 0) bonusParts.push(`+${Math.round(decor.tipBonus * 100)}% Tips`);
    if (decor.patienceBonus > 0) bonusParts.push(`+${Math.round(decor.patienceBonus * 100)}% Patience`);
    if (decor.vipBonus > 0) bonusParts.push(`+${Math.round(decor.vipBonus * 100)}% VIP`);
    const bonusStr = bonusParts.length > 0 ? bonusParts.join(' • ') : 'Standard Trattoria Ambience';

    els.prestigeBarWrap.innerHTML = `
      <div class="prestige-head">
        <span class="prestige-rank">${p.current.badge} <strong>${p.current.name}</strong></span>
        <span class="prestige-pts">${p.next ? `${p.pts} / ${p.next.minScore} Prestige → ${p.next.name}` : `${p.pts} Prestige • MAX RANK`}</span>
      </div>
      <div class="prestige-track">
        <div class="prestige-fill" style="width:${Math.round(p.progress * 100)}%"></div>
      </div>
      <div class="prestige-bonuses">${bonusStr}</div>
    `;
  }

  function formatDecorBonus(item) {
    const parts = [];
    if (item.tipBonus > 0) parts.push(`+${Math.round(item.tipBonus * 100)}% Tips`);
    if (item.patienceBonus > 0) parts.push(`+${Math.round(item.patienceBonus * 100)}% Patience`);
    if (item.vipBonus > 0) parts.push(`+${Math.round(item.vipBonus * 100)}% VIP`);
    return parts.length > 0 ? parts.join(' • ') : 'Classic Look';
  }

  function renderDecorShowroom() {
    if (els.shopCoins) els.shopCoins.textContent = fmtMoney(state.save.coins);
    if (!els.decorGrid) return;

    els.decorGrid.innerHTML = Object.entries(C.DECOR_CATALOG)
      .map(([catKey, cat]) => {
        const owned = state.save.ownedDecor[catKey] || [];
        const equipped = state.save.equippedDecor[catKey];

        const cards = cat.items
          .map((item) => {
            const isEquipped = equipped === item.id;
            const isOwned = owned.includes(item.id);
            const canAfford = state.save.coins >= item.cost;

            let btnLabel = fmtMoney(item.cost);
            let btnClass = 'buy-btn';
            let disabled = !canAfford;

            if (isEquipped) {
              btnLabel = 'Equipped ✓';
              btnClass = 'buy-btn equipped-btn';
              disabled = true;
            } else if (isOwned) {
              btnLabel = 'Equip';
              btnClass = 'buy-btn equip-btn';
              disabled = false;
            }

            return `
              <div class="decor-card${isEquipped ? ' equipped' : ''}${isOwned ? ' owned' : ''}">
                <div class="decor-swatch" style="background:${item.preview}"></div>
                <div class="decor-info">
                  <div class="decor-name">${item.name}</div>
                  <div class="decor-desc">${item.desc}</div>
                  <div class="decor-bonus">${formatDecorBonus(item)}</div>
                </div>
                <button
                  type="button"
                  class="${btnClass}"
                  data-decor-cat="${catKey}"
                  data-decor-id="${item.id}"
                  ${disabled ? 'disabled' : ''}
                >
                  ${btnLabel}
                </button>
              </div>
            `;
          })
          .join('');

        return `
          <div class="decor-category">
            <div class="decor-cat-title"><span>${cat.icon}</span> ${cat.label}</div>
            <div class="decor-items-row">${cards}</div>
          </div>
        `;
      })
      .join('');
  }

  function renderUpgradeShop() {
    if (els.shopCoins) els.shopCoins.textContent = fmtMoney(state.save.coins);
    if (!els.shopGrid) return;

    els.shopGrid.innerHTML = C.UPGRADES.map((u) => {
      const lvl = state.save.upgrades[u.id] || 0;
      const isMax = lvl >= u.maxLevel;
      const cost = isMax ? 0 : u.costs[lvl];
      const canAfford = !isMax && state.save.coins >= cost;
      return `
        <div class="upgrade-card ${isMax ? 'maxed' : ''}">
          <div class="upg-left">
            <div class="upg-icon">${u.icon}</div>
            <div>
              <div class="upg-name">${u.name}</div>
              <div class="upg-desc">${u.desc}</div>
              <div class="upg-level">${
                isMax
                  ? `MAXED • ${u.effectLabel(lvl)}`
                  : `Now: ${u.effectLabel(lvl)} → Next: ${u.nextLabel(lvl)}`
              }</div>
            </div>
          </div>
          <button
            type="button"
            class="buy-btn ${isMax ? 'maxed-btn' : ''}"
            data-buy-upgrade="${u.id}"
            ${isMax || !canAfford ? 'disabled' : ''}
          >
            ${isMax ? 'OWNED ✓' : fmtMoney(cost)}
          </button>
        </div>
      `;
    }).join('');
  }

  function renderShowroomStats() {
    if (!els.dayStatsGrid) return;
    const st = state.dayStats;
    const decor = state.getDecorBonuses();
    if (showroomMode === 'midShift') {
      els.dayStatsGrid.innerHTML = `
        <div class="stat-tile money"><div class="k">Wallet</div><div class="v">${fmtMoney(state.save.coins)}</div></div>
        <div class="stat-tile money"><div class="k">Shift Revenue</div><div class="v">${fmtMoney(st.revenue)}</div></div>
        <div class="stat-tile"><div class="k">Pies Served</div><div class="v">${st.served} <span class="stat-sub">(${st.perfect}★)</span></div></div>
        <div class="stat-tile"><div class="k">Decor Tip Boost</div><div class="v">+${Math.round(decor.tipBonus * 100)}%</div></div>
      `;
    } else {
      els.dayStatsGrid.innerHTML = `
        <div class="stat-tile money"><div class="k">Day Revenue</div><div class="v">${fmtMoney(st.revenue)}</div></div>
        <div class="stat-tile money"><div class="k">Tips &amp; Welcomes</div><div class="v">${fmtMoney(st.tips + st.greetBonuses)}</div></div>
        <div class="stat-tile"><div class="k">Pies Served</div><div class="v">${st.served} <span class="stat-sub">(${st.perfect}★)</span></div></div>
        <div class="stat-tile"><div class="k">Best Streak</div><div class="v">×${state.maxDayStreak}</div></div>
      `;
    }
  }

  function openShowroom(mode = 'midShift', tab = 'decor') {
    showroomMode = mode;
    if (mode === 'midShift') {
      phaseBeforeShowroom = state.phase;
      if (state.phase === 'playing') state.phase = 'paused';
      if (els.dayEndKicker) els.dayEndKicker.textContent = `DAY ${state.save.day} • LIVE SHOWROOM`;
      if (els.dayEndTitle) els.dayEndTitle.textContent = 'Trattoria Customizer & Kitchen';
      if (els.dayEndStars) els.dayEndStars.textContent = state.getPrestigeInfo().current.badge;
      if (els.nextUnlocksBanner) els.nextUnlocksBanner.classList.add('hidden');
      if (els.btnReplayDay) els.btnReplayDay.classList.add('hidden');
      if (els.btnNextDay) els.btnNextDay.classList.add('hidden');
      if (els.btnCloseShowroom) els.btnCloseShowroom.classList.remove('hidden');
    } else {
      const st = state.dayStats;
      const stars = '★'.repeat(st.starsEarned) + '☆'.repeat(3 - st.starsEarned);
      if (els.dayEndKicker) {
        els.dayEndKicker.textContent =
          st.revenue >= state.dayConfig.targetRevenue ? 'SHIFT GOAL ACHIEVED' : 'SHIFT COMPLETE';
      }
      if (els.dayEndTitle) els.dayEndTitle.textContent = `Day ${state.save.day} Ledger`;
      if (els.dayEndStars) els.dayEndStars.textContent = stars;

      const nextCfg = C.getDayConfig(state.save.day + 1);
      if (els.nextUnlocksBanner) {
        if (nextCfg.newUnlocks.length > 0) {
          els.nextUnlocksBanner.classList.remove('hidden');
          els.nextUnlocksBanner.textContent = `Unlocking Day ${nextCfg.day}: ${nextCfg.newUnlocks.join(' • ')}`;
        } else {
          els.nextUnlocksBanner.classList.add('hidden');
        }
      }
      if (els.btnReplayDay) els.btnReplayDay.classList.remove('hidden');
      if (els.btnNextDay) {
        els.btnNextDay.classList.remove('hidden');
        els.btnNextDay.textContent = `Open Day ${state.save.day + 1} →`;
      }
      if (els.btnCloseShowroom) els.btnCloseShowroom.classList.add('hidden');
    }

    renderShowroomStats();
    renderPrestigeBar();
    renderDecorShowroom();
    renderUpgradeShop();
    setShowroomTab(tab);

    if (els.overlayDayEnd) els.overlayDayEnd.classList.add('visible');
  }

  function closeShowroom() {
    if (els.overlayDayEnd) els.overlayDayEnd.classList.remove('visible');
    if (showroomMode === 'midShift' && phaseBeforeShowroom === 'playing') {
      state.phase = 'playing';
    }
    syncHud();
    syncOvenFinishLabel();
    syncNavMonitor();
    syncBoardUI(true);
  }

  function renderDayEndOverlay() {
    openShowroom('dayEnd', 'decor');
  }

  if (els.btnDecor) {
    els.btnDecor.addEventListener('click', () => {
      FR.Audio.unlock();
      if (state.phase === 'title') return;
      FR.Audio.playButtonClick();
      if (state.phase === 'dayEnd') {
        setShowroomTab('decor');
        if (els.overlayDayEnd) els.overlayDayEnd.classList.add('visible');
        return;
      }
      if (els.overlayDayEnd?.classList.contains('visible') && showroomMode === 'midShift') {
        closeShowroom();
        return;
      }
      if (els.overlayPause) els.overlayPause.classList.remove('visible');
      openShowroom('midShift', 'decor');
    });
  }

  if (els.tabDecor) {
    els.tabDecor.addEventListener('click', () => {
      FR.Audio.playButtonClick();
      setShowroomTab('decor');
    });
  }

  if (els.tabUpgrades) {
    els.tabUpgrades.addEventListener('click', () => {
      FR.Audio.playButtonClick();
      setShowroomTab('upgrades');
    });
  }

  if (els.btnCloseShowroom) {
    els.btnCloseShowroom.addEventListener('click', () => {
      FR.Audio.playButtonClick();
      closeShowroom();
    });
  }

  if (els.decorGrid) {
    els.decorGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-decor-cat]');
      if (!btn || btn.disabled) return;
      const cat = btn.dataset.decorCat;
      const id = btn.dataset.decorId;
      if (state.buyOrEquipDecor(cat, id)) {
        renderDecorShowroom();
        renderUpgradeShop();
        renderPrestigeBar();
        renderShowroomStats();
        syncOvenFinishLabel();
        syncHud();
        if (cat === 'ovenFinish') buildOvenSlots();
      }
    });
  }

  if (els.shopGrid) {
    els.shopGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-buy-upgrade]');
      if (!btn || btn.disabled) return;
      const upgId = btn.dataset.buyUpgrade;
      if (state.buyUpgrade(upgId)) {
        applyMidShiftUpgradeChanges(upgId);
        renderUpgradeShop();
        renderDecorShowroom();
        renderPrestigeBar();
        renderShowroomStats();
        syncHud();
      }
    });
  }

  /* ===== TITLE & DAY LIFECYCLE ===== */
  function renderTitleOverlay() {
    if (els.overlayTitle) els.overlayTitle.classList.add('visible');
    if (state.hasExistingProgress()) {
      const p = state.getPrestigeInfo();
      if (els.titleSaveBanner) {
        els.titleSaveBanner.classList.remove('hidden');
        els.titleSaveBanner.textContent = `${p.current.badge} ${p.current.name} • Day ${state.save.day} • ${fmtMoney(
          state.save.coins
        )} • ${state.save.totalPizzasServed} Pies Served`;
      }
      if (els.btnStartPlay) els.btnStartPlay.textContent = `Continue Trattoria — Day ${state.save.day}`;
      if (els.btnResetSave) els.btnResetSave.classList.remove('hidden');
    } else {
      if (els.titleSaveBanner) els.titleSaveBanner.classList.add('hidden');
      if (els.btnStartPlay) els.btnStartPlay.textContent = 'Open Kitchen — Day 1';
      if (els.btnResetSave) els.btnResetSave.classList.add('hidden');
    }
  }

  function beginDay(dayNum) {
    FR.Audio.unlock();
    cancelIngredientGrab();
    if (els.overlayTitle) els.overlayTitle.classList.remove('visible');
    if (els.overlayDayEnd) els.overlayDayEnd.classList.remove('visible');
    if (els.overlayPause) els.overlayPause.classList.remove('visible');
    if (els.overlayHelp) els.overlayHelp.classList.remove('visible');

    state.startDay(dayNum);
    buildMakelineRail();
    buildOvenSlots();
    buildNavOvenBars();
    switchRoom('dining', true);
    syncHud();
    syncTicketStrip(true);
    syncMakelineUI();
    syncBoardUI(true);
    syncPassPreview(true);
    syncNavMonitor();
  }

  if (els.btnStartPlay) els.btnStartPlay.addEventListener('click', () => beginDay(state.save.day));
  if (els.btnResetSave) {
    els.btnResetSave.addEventListener('click', () => {
      state.resetProgress();
      syncHud();
      renderTitleOverlay();
    });
  }
  if (els.btnReplayDay) els.btnReplayDay.addEventListener('click', () => beginDay(state.save.day));
  if (els.btnNextDay) els.btnNextDay.addEventListener('click', () => beginDay(state.save.day + 1));

  /* ===== KEYBOARD SHORTCUTS ===== */
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();

    if (key === 'escape') {
      if (els.overlayHelp?.classList.contains('visible')) {
        closeHelp();
      } else if (els.overlayDayEnd?.classList.contains('visible') && showroomMode === 'midShift') {
        closeShowroom();
      } else if (state.phase === 'playing' || state.phase === 'paused') {
        if (els.btnPause) els.btnPause.click();
      }
      return;
    }

    if (state.phase !== 'playing') return;

    if (key === 'tab') {
      e.preventDefault();
      FR.Audio.unlock();
      const idx = ROOM_ORDER.indexOf(state.activeRoom);
      switchRoom(ROOM_ORDER[(idx + 1) % ROOM_ORDER.length]);
      return;
    }

    if (key === 'f1') {
      e.preventDefault();
      FR.Audio.unlock();
      switchRoom('dining');
      return;
    }
    if (key === 'f2') {
      e.preventDefault();
      FR.Audio.unlock();
      switchRoom('kitchen');
      return;
    }
    if (key === 'f3') {
      e.preventDefault();
      FR.Audio.unlock();
      switchRoom('oven');
      return;
    }

    if (key === ' ') {
      if (state.activeRoom === 'kitchen') {
        e.preventDefault();
        FR.Audio.unlock();
        if (state.tossDough()) {
          prepParticles.spawnFlourPuff(prepGeo.cx, prepGeo.cy);
          syncMakelineUI();
          syncNavMonitor();
        }
      }
    } else if (key === '1' || key === '2' || key === '3') {
      const idx = Number(key) - 1;
      const ids = ['marinara', 'pesto', 'white'];
      if (state.dayConfig.unlockedSauces.includes(ids[idx])) {
        state.activeTool = { kind: 'sauce', id: ids[idx] };
        FR.Audio.playButtonClick();
        syncMakelineUI();
      }
    } else if (key === 'c') {
      state.activeTool = { kind: 'cheese', id: 'mozzarella' };
      FR.Audio.playButtonClick();
      syncMakelineUI();
    } else if (key === 'enter' || key === 'b') {
      if (state.prepPizza.hasDough) {
        handleSendToOven(-1);
      }
    } else if (['q', 'w', 'e', 'r'].includes(key)) {
      const slot = ['q', 'w', 'e', 'r'].indexOf(key);
      if (slot < state.ovenSlots.length) handleOvenSlotClick(slot);
    } else if (key === 'x') {
      if (els.btnQuickSlice && !els.btnQuickSlice.disabled) els.btnQuickSlice.click();
    } else if (key === 's') {
      if (els.btnSodaTap && !els.btnSodaTap.disabled) els.btnSodaTap.click();
    } else if (key === 'f') {
      if (els.btnSendPass && !els.btnSendPass.disabled) handleSendToPass(false);
    }
  });

  /* ===== MAIN 60FPS GAME LOOP ===== */
  let lastTime = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;

    if (state.phase === 'playing') {
      const { events } = state.tick(dt);
      for (const ev of events) {
        if (ev.type === 'ovenGolden') {
          const anchor =
            state.activeRoom === 'oven'
              ? ovenSlotEls[ev.slotIndex]?.root.getBoundingClientRect()
              : navOvenBarEls[ev.slotIndex]?.root.getBoundingClientRect();
          const x = anchor && anchor.width > 0 ? anchor.left + anchor.width * 0.5 : window.innerWidth * 0.72;
          const y = anchor && anchor.height > 0 ? anchor.top + 18 : 96;
          showToast(`Hearth ${ev.slotIndex + 1} — Golden ready`, x, y, 'good');
        } else if (ev.type === 'ovenCrispy') {
          const anchor =
            state.activeRoom === 'oven'
              ? ovenSlotEls[ev.slotIndex]?.root.getBoundingClientRect()
              : navOvenBarEls[ev.slotIndex]?.root.getBoundingClientRect();
          const x = anchor && anchor.width > 0 ? anchor.left + anchor.width * 0.5 : window.innerWidth * 0.72;
          const y = anchor && anchor.height > 0 ? anchor.top + 18 : 96;
          showToast(`Hearth ${ev.slotIndex + 1} — Crispy ready`, x, y, 'warn');
        } else if (ev.type === 'autoBus') {
          if (ev.collected > 0) {
            let cx = window.innerWidth * 0.25;
            let cy = 96;
            if (state.activeRoom === 'dining' && diningGeo && els.diningCanvas) {
              const rect = els.diningCanvas.getBoundingClientRect();
              cx = rect.left + ev.table.x * diningGeo.w;
              cy = rect.top + ev.table.y * diningGeo.h;
            }
            launchCoinsFromPoint(cx, cy, ev.collected);
          }
        } else if (ev.type === 'newOrder') {
          syncTicketStrip(true);
          syncMakelineUI();
        } else if (ev.type === 'walkout') {
          triggerShake();
          showToast(`${ev.guest.character.name} left unattended`, window.innerWidth * 0.5, 118, 'bad');
          syncTicketStrip(true);
          syncMakelineUI();
        } else if (ev.type === 'dayEnd') {
          renderDayEndOverlay();
        }
      }

      syncHud();
      syncNavMonitor();
      syncTicketStrip(false);
      syncBoardUI(false);
      syncPassPreview(false);
    }

    // Keep active room canvases crisp & smoothly animated at 60fps
    if (state.activeRoom === 'dining' && els.diningCanvas) {
      const dGeo = DR.renderDiningRoom(els.diningCanvas, state, diningHover, now);
      if (dGeo) diningGeo = dGeo;
    }

    if (state.activeRoom === 'kitchen' && els.prepCanvas) {
      const pGeo = PR.renderPrepStation(els.prepCanvas, state, prepParticles, dt, now);
      if (pGeo) prepGeo = pGeo;
    }

    if (state.activeRoom === 'oven') {
      syncOvenVisuals(now);
      if (els.boardCanvas) {
        const swipePreview =
          boardSwipeStart && boardSwipeCurr
            ? { x1: boardSwipeStart.x, y1: boardSwipeStart.y, x2: boardSwipeCurr.x, y2: boardSwipeCurr.y }
            : null;
        const bGeo = PR.renderCuttingBoard(els.boardCanvas, state.boardPizza, swipePreview, boardParticles, dt, now);
        if (bGeo) boardGeo = bGeo;
      }
    }

    requestAnimationFrame(frame);
  }

  // Initial boot
  buildMakelineRail();
  buildOvenSlots();
  buildNavOvenBars();
  switchRoom('dining', true);
  syncHud();
  syncTicketStrip(true);
  syncMakelineUI();
  syncBoardUI(true);
  syncPassPreview(true);
  syncNavMonitor();
  renderTitleOverlay();
  requestAnimationFrame(frame);
})();
