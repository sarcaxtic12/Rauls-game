(function () {
  const FR = (window.FornoRush = window.FornoRush || {});
  const C = FR.Config;

  let nextPizzaId = 1;
  let nextGuestId = 1;

  function createEmptyPizza() {
    return {
      id: nextPizzaId++,
      seed: Math.floor(Math.random() * 10000),
      hasDough: false,
      doughPop: 0,
      sauce: null,
      sauceCoverage: 0,
      sauceStrokes: [],
      cheeseLevel: 0,
      cheeseSpecs: [],
      toppings: [],
      bake: 0,
      dingedGolden: false,
      dingedCrispy: false,
      cutLines: [],
      hasSoda: false,
      createdAt: performance.now(),
    };
  }

  function defaultSave() {
    return {
      day: 1,
      coins: 0,
      totalStars: 0,
      totalPizzasServed: 0,
      bestStreak: 0,
      highDayRevenue: 0,
      prestigePoints: 0,
      upgrades: {
        tables: 0,
        ovenSlots: 0,
        turboOven: 0,
        autoSauce: 0,
        sodaFountain: 0,
        goldenCutter: 0,
        espressoBar: 0,
        busboy: 0,
      },
      ownedDecor: {
        floor: ['oak'],
        linens: ['rustic'],
        lighting: ['edison'],
        greenery: ['minimal'],
        ovenFinish: ['brick'],
      },
      equippedDecor: {
        floor: 'oak',
        linens: 'rustic',
        lighting: 'edison',
        greenery: 'minimal',
        ovenFinish: 'brick',
      },
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(C.SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      const base = defaultSave();
      return {
        ...base,
        ...parsed,
        upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
        ownedDecor: {
          floor: parsed.ownedDecor?.floor || base.ownedDecor.floor,
          linens: parsed.ownedDecor?.linens || base.ownedDecor.linens,
          lighting: parsed.ownedDecor?.lighting || base.ownedDecor.lighting,
          greenery: parsed.ownedDecor?.greenery || base.ownedDecor.greenery,
          ovenFinish: parsed.ownedDecor?.ovenFinish || base.ownedDecor.ovenFinish,
        },
        equippedDecor: { ...base.equippedDecor, ...(parsed.equippedDecor || {}) },
      };
    } catch {
      return defaultSave();
    }
  }

  function persistSave(save) {
    try {
      localStorage.setItem(C.SAVE_KEY, JSON.stringify(save));
    } catch {
      // Ignore quota errors
    }
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getTableLayout(count) {
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

  class GameState {
    constructor() {
      this.save = loadSave();
      this.phase = 'title'; // 'title' | 'playing' | 'paused' | 'dayEnd'
      this.activeRoom = 'dining'; // 'dining' | 'kitchen' | 'oven'
      this.dayConfig = C.getDayConfig(this.save.day);
      this.resetShiftState();
    }

    hasExistingProgress() {
      return this.save.day > 1 || this.save.coins > 0 || this.save.totalPizzasServed > 0;
    }

    resetProgress() {
      this.save = defaultSave();
      persistSave(this.save);
      this.dayConfig = C.getDayConfig(1);
      this.resetShiftState();
    }

    getTableCount() {
      return 3 + (this.save.upgrades.tables || 0);
    }

    getOvenSlotCount() {
      return 2 + (this.save.upgrades.ovenSlots || 0);
    }

    getDecorBonuses() {
      let tipBonus = 0;
      let patienceBonus = 0;
      let vipBonus = 0;
      Object.entries(this.save.equippedDecor).forEach(([cat, itemId]) => {
        const spec = C.DECOR_CATALOG[cat]?.items.find((i) => i.id === itemId);
        if (spec) {
          tipBonus += spec.tipBonus || 0;
          patienceBonus += spec.patienceBonus || 0;
          vipBonus += spec.vipBonus || 0;
        }
      });
      return { tipBonus, patienceBonus, vipBonus };
    }

    getPrestigeInfo() {
      const pts = this.save.prestigePoints || 0;
      let current = C.PRESTIGE_RANKS[0];
      let next = C.PRESTIGE_RANKS[1] || null;
      for (let i = 0; i < C.PRESTIGE_RANKS.length; i++) {
        if (pts >= C.PRESTIGE_RANKS[i].minScore) {
          current = C.PRESTIGE_RANKS[i];
          next = C.PRESTIGE_RANKS[i + 1] || null;
        }
      }
      const progress = next
        ? Math.min(1, (pts - current.minScore) / (next.minScore - current.minScore))
        : 1;
      return { pts, current, next, progress };
    }

    getOvenSpeed() {
      const base = 7.4;
      const upgMult = 1 + (this.save.upgrades.turboOven || 0) * 0.18;
      const feverMult = this.feverActive ? 1.28 : 1.0;
      return base * upgMult * feverMult;
    }

    getBakeToleranceBonus() {
      const ovenFinishBonus = this.save.equippedDecor.ovenFinish === 'mosaic' ? 3 : 0;
      return (this.save.upgrades.turboOven || 0) * 3 + ovenFinishBonus;
    }

    resetShiftState() {
      this.dayConfig = C.getDayConfig(this.save.day);
      this.timeLeft = this.dayConfig.durationSec;
      this.elapsed = 0;
      this.spawnTimer = 0.8;

      // Build dining tables
      const tCount = this.getTableCount();
      const layout = getTableLayout(tCount);
      this.tables = layout.map((pos, idx) => ({
        id: idx + 1,
        x: pos.x,
        y: pos.y,
        status: 'empty', // 'empty' | 'reserved' | 'seated' | 'eating' | 'dirty'
        guestId: null,
        servedPizza: null,
        slicesEaten: 0,
        cashWaiting: 0,
        tipWaiting: 0,
        dirtyTimer: 0,
        lastCleanFlash: 0,
      }));

      this.guests = []; // all guests currently in or walking in/out of the restaurant
      this.selectedOrderGuestId = null;

      // Delivery tray visual animations in dining room
      this.deliveries = [];

      // Kitchen Cook Line
      this.prepPizza = createEmptyPizza();
      this.activeTool = { kind: 'dough', id: 'dough' };
      this.toppingPlopCount = 0;

      // Brick Oven & Cutting Pass
      this.ovenSlots = Array.from({ length: this.getOvenSlotCount() }, () => null);
      this.boardPizza = null;
      this.passSlots = []; // hot sliced pizzas waiting on the Serving Pass (max 3)
      this.selectedPassIndex = 0;

      this.streak = 0;
      this.maxDayStreak = 0;
      this.fever = 0;
      this.feverActive = false;
      this.feverTimeLeft = 0;

      this.dayStats = {
        revenue: 0,
        tips: 0,
        greetBonuses: 0,
        served: 0,
        perfect: 0,
        great: 0,
        okay: 0,
        bad: 0,
        walkouts: 0,
        starsEarned: 0,
      };
    }

    startDay(dayNum = this.save.day) {
      this.save.day = dayNum;
      persistSave(this.save);
      this.resetShiftState();
      this.phase = 'playing';
      this.activeRoom = 'dining';
      // First guest immediately walks through the front door!
      this.spawnGuest(this.save.day === 1);
      this.spawnTimer = this.save.day === 1 ? 6.0 : 4.2;
    }

    setRoom(room) {
      if (['dining', 'kitchen', 'oven'].includes(room) && this.activeRoom !== room) {
        this.activeRoom = room;
        FR.Audio.playRoomSwitch();
      }
    }

    getGuestById(id) {
      return this.guests.find((g) => g.id === id) || null;
    }

    getOrderedGuests() {
      return this.guests.filter((g) => g.stage === 'ordered' && g.order);
    }

    getSelectedOrderGuest() {
      let g = this.guests.find((x) => x.id === this.selectedOrderGuestId && x.stage === 'ordered');
      if (!g) {
        g = this.guests.find((x) => x.stage === 'ordered') || null;
        this.selectedOrderGuestId = g ? g.id : null;
      }
      return g;
    }

    selectOrderGuest(guestId) {
      if (this.guests.some((g) => g.id === guestId && g.stage === 'ordered')) {
        this.selectedOrderGuestId = guestId;
      }
    }

    generateOrderSpec(character, isFirstOfDay1 = false) {
      const cfg = this.dayConfig;
      const sauce = isFirstOfDay1 ? 'marinara' : pickRandom(cfg.unlockedSauces);
      const cheese =
        isFirstOfDay1
          ? 'normal'
          : cfg.allowExtraCheese && Math.random() < 0.24
          ? 'extra'
          : 'normal';

      const isHalfHalf = !isFirstOfDay1 && cfg.allowHalfHalf && Math.random() < cfg.halfHalfChance;
      let toppings = [];
      if (isFirstOfDay1) {
        toppings = [{ id: 'pepperoni', side: 'whole' }];
      } else if (isHalfHalf) {
        const picks = shuffle(cfg.unlockedToppings).slice(0, 2);
        toppings = [
          { id: picks[0], side: 'left' },
          { id: picks[1], side: 'right' },
        ];
      } else {
        const count = Math.min(
          cfg.unlockedToppings.length,
          Math.random() < 0.25 ? 1 : Math.random() < 0.74 ? 2 : cfg.maxToppingsPerOrder
        );
        toppings = shuffle(cfg.unlockedToppings)
          .slice(0, count)
          .map((id) => ({ id, side: 'whole' }));
      }

      const bake =
        !isFirstOfDay1 && cfg.allowCrispy && Math.random() < (character.isVip ? 0.5 : 0.34)
          ? 'crispy'
          : 'golden';
      const slices = isFirstOfDay1 ? 4 : pickRandom(cfg.sliceOptions);
      const wantsSoda = !isFirstOfDay1 && this.save.upgrades.sodaFountain > 0 && Math.random() < 0.45;

      let basePrice = C.BASE_PIZZA_PRICE + (C.SAUCES[sauce]?.price || 1.5);
      if (cheese === 'extra') basePrice += 1.5;
      toppings.forEach((t) => {
        basePrice += (C.TOPPING_MAP[t.id]?.price || 1.75) * (t.side === 'whole' ? 1 : 0.75);
      });
      if (character.isVip) basePrice += 5;
      if (wantsSoda) basePrice += C.SODA_PRICE;

      const decor = this.getDecorBonuses();
      const patMult = (1 + (this.save.upgrades.espressoBar || 0) * 0.2 + decor.patienceBonus) * character.patienceMult;
      const maxPatience = Math.round(cfg.basePatienceSec * patMult * (isFirstOfDay1 ? 1.25 : 1));

      return {
        sauce,
        cheese,
        isHalfHalf,
        toppings,
        bake,
        slices,
        wantsSoda,
        basePrice: Math.round(basePrice * 2) / 2,
        patience: maxPatience,
        maxPatience,
      };
    }

    findFreeTable() {
      return this.tables.find((t) => t.status === 'empty') || null;
    }

    spawnGuest(isFirstOfDay1 = false) {
      const queueingCount = this.guests.filter((g) => g.stage === 'queueing' || (g.stage === 'entering' && !g.tableId)).length;
      const freeTable = this.findFreeTable();
      if (!freeTable && queueingCount >= 2) return null;

      const usedChars = new Set(this.guests.filter((g) => g.stage !== 'leaving').map((g) => g.character.id));
      let pool = C.CUSTOMERS.filter((c) => !usedChars.has(c.id));
      const decor = this.getDecorBonuses();
      const vipChance = this.dayConfig.vipChance + decor.vipBonus;

      if (!vipChance || Math.random() > vipChance || isFirstOfDay1) {
        const nonVip = pool.filter((c) => !c.isVip);
        if (nonVip.length > 0) pool = nonVip;
      } else {
        const vip = pool.find((c) => c.isVip);
        if (vip) pool = [vip];
      }
      if (pool.length === 0) pool = C.CUSTOMERS;
      const character = pickRandom(pool);

      const orderSpec = this.generateOrderSpec(character, isFirstOfDay1);
      const guest = {
        id: nextGuestId++,
        character,
        order: orderSpec,
        tableId: null,
        stage: 'entering', // 'entering' | 'queueing' | 'reading' | 'ordered' | 'eating' | 'leaving'
        x: 0.5 + (Math.random() - 0.5) * 0.04,
        y: 1.04,
        targetX: 0.5,
        targetY: 0.87,
        facing: -Math.PI / 2,
        walkPhase: 0,
        speed: 0.24 + Math.random() * 0.03,
        menuTimer: 2.6,
        eatTimer: 7.2,
        eatDuration: 7.2,
        queuePatience: 26,
        greeted: false,
        mood: 'happy',
        speechBubble: null, // { text, timer, tone }
        serveResult: null,
      };

      if (freeTable) {
        freeTable.status = 'reserved';
        freeTable.guestId = guest.id;
        guest.tableId = freeTable.id;
        guest.targetX = freeTable.x;
        guest.targetY = freeTable.y + 0.085;
      } else {
        const qSlot = queueingCount === 0 ? 0.36 : 0.64;
        guest.targetX = qSlot;
        guest.targetY = 0.86;
      }

      this.guests.push(guest);
      FR.Audio.playDoorChime();
      return guest;
    }

    greetTable(tableId) {
      const table = this.tables.find((t) => t.id === tableId);
      if (!table || !table.guestId) return { ok: false };
      const guest = this.getGuestById(table.guestId);
      if (!guest || guest.stage !== 'reading') return { ok: false };

      guest.greeted = true;
      guest.stage = 'ordered';
      guest.menuTimer = 0;
      guest.speechBubble = { text: 'Warm welcome! +$2', timer: 1.8, tone: 'good' };
      this.save.coins = Math.round((this.save.coins + C.GREET_BONUS) * 2) / 2;
      this.dayStats.revenue = Math.round((this.dayStats.revenue + C.GREET_BONUS) * 2) / 2;
      this.dayStats.greetBonuses = Math.round((this.dayStats.greetBonuses + C.GREET_BONUS) * 2) / 2;
      persistSave(this.save);
      if (!this.selectedOrderGuestId) this.selectedOrderGuestId = guest.id;
      FR.Audio.playGreetGuest();
      return { ok: true, guest, bonus: C.GREET_BONUS };
    }

    busTable(tableId) {
      const table = this.tables.find((t) => t.id === tableId);
      if (!table || table.status !== 'dirty') return { ok: false };

      const collected = Math.round((table.cashWaiting + table.tipWaiting) * 2) / 2;
      if (collected > 0) {
        this.save.coins = Math.round((this.save.coins + collected) * 2) / 2;
        this.dayStats.revenue = Math.round((this.dayStats.revenue + collected) * 2) / 2;
        this.dayStats.tips = Math.round((this.dayStats.tips + table.tipWaiting) * 2) / 2;
        persistSave(this.save);
      }

      table.status = 'empty';
      table.guestId = null;
      table.servedPizza = null;
      table.slicesEaten = 0;
      table.cashWaiting = 0;
      table.tipWaiting = 0;
      table.dirtyTimer = 0;
      table.lastCleanFlash = performance.now();

      FR.Audio.playTableBus();
      this.assignWaitingGuestToTable(table);
      return { ok: true, collected, table };
    }

    assignWaitingGuestToTable(table) {
      if (table.status !== 'empty') return;
      const waiter = this.guests.find((g) => g.stage === 'queueing');
      if (!waiter) return;
      table.status = 'reserved';
      table.guestId = waiter.id;
      waiter.tableId = table.id;
      waiter.stage = 'entering';
      waiter.targetX = table.x;
      waiter.targetY = table.y + 0.085;
    }

    /* ===== COOK LINE ACTIONS ===== */
    tossDough() {
      if (this.prepPizza.hasDough) return false;
      this.prepPizza = createEmptyPizza();
      this.prepPizza.hasDough = true;
      this.prepPizza.doughPop = 1;
      this.toppingPlopCount = 0;
      const sel = this.getSelectedOrderGuest();
      this.activeTool = { kind: 'sauce', id: sel ? sel.order.sauce : 'marinara' };
      FR.Audio.playDoughSlap();
      return true;
    }

    applySauceAt(nx, ny, isClick = false, sauceOverride = null) {
      const p = this.prepPizza;
      if (!p.hasDough) return false;
      const sauceId = sauceOverride || this.activeTool.id;
      if (!C.SAUCES[sauceId]) return false;

      if (p.sauce && p.sauce !== sauceId) {
        p.sauceStrokes = [];
        p.sauceCoverage = 0;
      }
      p.sauce = sauceId;

      if (this.save.upgrades.autoSauce > 0 && isClick) {
        p.sauceCoverage = 1;
        p.sauceStrokes = [];
        for (let a = 0; a < Math.PI * 5; a += 0.28) {
          const r = (a / (Math.PI * 5)) * 0.77;
          p.sauceStrokes.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, r: 0.24 });
        }
        FR.Audio.playSauceSwirl();
        return true;
      }

      if (Math.hypot(nx, ny) > 0.86) return false;
      p.sauceStrokes.push({ x: nx, y: ny, r: isClick ? 0.34 : 0.22 });
      if (p.sauceStrokes.length > 65) p.sauceStrokes.shift();
      p.sauceCoverage = Math.min(1, p.sauceCoverage + (isClick ? 0.38 : 0.095));
      FR.Audio.playSauceSwirl();
      return true;
    }

    applyCheeseAt(nx, ny, isClick = false) {
      const p = this.prepPizza;
      if (!p.hasDough) return false;
      if (Math.hypot(nx, ny) > 0.88) return false;

      if (this.save.upgrades.autoSauce > 0 && isClick) {
        const target = p.cheeseLevel < 0.95 ? 1.0 : 2.0;
        const count = target === 1.0 ? 34 : 26;
        for (let i = 0; i < count; i++) {
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.sqrt(Math.random()) * 0.76;
          p.cheeseSpecs.push({
            x: Math.cos(ang) * rad,
            y: Math.sin(ang) * rad,
            angle: Math.random() * Math.PI,
            len: 0.065 + Math.random() * 0.055,
            extra: target > 1,
          });
        }
        p.cheeseLevel = Math.min(2.0, target);
        FR.Audio.playCheeseSprinkle();
        return true;
      }

      const pieces = isClick ? 12 : 4;
      for (let i = 0; i < pieces; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * (isClick ? 0.34 : 0.18);
        const sx = nx + Math.cos(a) * r;
        const sy = ny + Math.sin(a) * r;
        if (Math.hypot(sx, sy) <= 0.82) {
          p.cheeseSpecs.push({
            x: sx,
            y: sy,
            angle: Math.random() * Math.PI,
            len: 0.065 + Math.random() * 0.055,
            extra: p.cheeseLevel >= 1.0,
          });
        }
      }
      if (p.cheeseSpecs.length > 140) p.cheeseSpecs.splice(0, p.cheeseSpecs.length - 140);
      p.cheeseLevel = Math.min(2.0, p.cheeseLevel + (isClick ? 0.42 : 0.11));
      FR.Audio.playCheeseSprinkle();
      return true;
    }

    placeToppingAt(nx, ny, toppingId = this.activeTool.id) {
      const p = this.prepPizza;
      if (!p.hasDough || !C.TOPPING_MAP[toppingId]) return false;
      if (Math.hypot(nx, ny) > 0.8 || p.toppings.length >= 42) return false;
      p.toppings.push({
        id: toppingId,
        x: nx,
        y: ny,
        angle: (Math.random() - 0.5) * Math.PI * 1.6,
        scale: 1,
        bornAt: performance.now(),
      });
      FR.Audio.playToppingPlop(this.toppingPlopCount++);
      return true;
    }

    trashPrepPizza() {
      if (!this.prepPizza.hasDough) return false;
      this.prepPizza = createEmptyPizza();
      this.activeTool = { kind: 'dough', id: 'dough' };
      FR.Audio.playTrash();
      return true;
    }

    /* ===== OVEN, BOARD & PASS ACTIONS ===== */
    sendToOven(preferredSlot = -1) {
      if (!this.prepPizza.hasDough) return { ok: false, reason: 'Grab dough from the tray first.' };
      let idx = preferredSlot;
      if (idx < 0 || idx >= this.ovenSlots.length || this.ovenSlots[idx] !== null) {
        idx = this.ovenSlots.findIndex((s) => s === null);
      }
      if (idx === -1) return { ok: false, reason: 'All hearths are occupied.' };

      this.ovenSlots[idx] = this.prepPizza;
      this.prepPizza = createEmptyPizza();
      this.activeTool = { kind: 'dough', id: 'dough' };
      FR.Audio.playOvenSlide();
      return { ok: true, slotIndex: idx };
    }

    pullFromOven(slotIndex) {
      const pizza = this.ovenSlots[slotIndex];
      if (!pizza) return { ok: false, reason: 'Hearth is open.' };
      if (this.boardPizza !== null) {
        return { ok: false, reason: 'Plate or clear the cutting board first.' };
      }
      this.boardPizza = pizza;
      this.ovenSlots[slotIndex] = null;
      FR.Audio.playOvenSlide();
      return { ok: true, pizza };
    }

    addCutLine(angle) {
      if (!this.boardPizza || this.boardPizza.cutLines.length >= 4) return false;
      this.boardPizza.cutLines.push(angle);
      FR.Audio.playSliceCrunch();
      return true;
    }

    quickSliceBoard(targetSlices = null) {
      if (!this.boardPizza || this.boardPizza.cutLines.length >= 4) return false;
      if (this.save.upgrades.goldenCutter > 0 && targetSlices) {
        const neededLines = Math.max(2, Math.min(4, Math.round(targetSlices / 2)));
        this.boardPizza.cutLines = [];
        for (let i = 0; i < neededLines; i++) {
          this.boardPizza.cutLines.push((i * Math.PI) / neededLines);
        }
        FR.Audio.playSliceCrunch();
        return true;
      }
      const nextCount = Math.min(4, this.boardPizza.cutLines.length + 1);
      this.boardPizza.cutLines = [];
      for (let i = 0; i < nextCount; i++) {
        this.boardPizza.cutLines.push((i * Math.PI) / nextCount);
      }
      FR.Audio.playSliceCrunch();
      return true;
    }

    toggleBoardSoda() {
      if (!this.boardPizza || this.save.upgrades.sodaFountain <= 0) return false;
      this.boardPizza.hasSoda = !this.boardPizza.hasSoda;
      if (this.boardPizza.hasSoda) FR.Audio.playSodaPour();
      else FR.Audio.playButtonClick();
      return true;
    }

    trashBoardPizza() {
      if (!this.boardPizza) return false;
      this.boardPizza = null;
      FR.Audio.playTrash();
      return true;
    }

    sendBoardToPass() {
      if (!this.boardPizza) return { ok: false, reason: 'No pizza on the cutting board.' };
      if (this.passSlots.length >= C.MAX_PASS_SLOTS) {
        return { ok: false, reason: 'Serving Pass is full — deliver a pie in the Dining Room!' };
      }
      const pie = this.boardPizza;
      this.boardPizza = null;
      this.passSlots.push(pie);
      this.selectedPassIndex = this.passSlots.length - 1;
      FR.Audio.playOvenDing();
      return { ok: true, pizza: pie };
    }

    evaluatePizza(pizza, guest) {
      const order = guest.order;
      const tol = this.getBakeToleranceBonus();

      let basePts = 0;
      if (pizza.sauce === order.sauce) {
        basePts += 14 * Math.min(1, pizza.sauceCoverage / 0.72);
      } else if (pizza.sauce) {
        basePts += 3;
      }

      if (order.cheese === 'normal') {
        basePts += pizza.cheeseLevel >= 0.72 ? 11 : 11 * (pizza.cheeseLevel / 0.72);
      } else {
        basePts += pizza.cheeseLevel >= 1.45 ? 11 : pizza.cheeseLevel >= 0.75 ? 7.5 : 4 * (pizza.cheeseLevel / 0.75);
      }

      const reqIds = new Set(order.toppings.map((t) => t.id));
      const perWeight = order.toppings.length > 0 ? 35 / order.toppings.length : 35;
      let earnedTop = 0;

      order.toppings.forEach((req) => {
        const placed = pizza.toppings.filter((p) => p.id === req.id);
        if (req.side === 'whole') {
          earnedTop += perWeight * Math.min(1, placed.length / 5);
        } else {
          const onSide = placed.filter((p) => (req.side === 'left' ? p.x <= 0.14 : p.x >= -0.14));
          const wrongSide = placed.length - onSide.length;
          earnedTop += perWeight * Math.max(0, Math.min(1, onSide.length / 3) - Math.min(0.45, wrongSide * 0.14));
        }
      });

      const wrongCount = pizza.toppings.filter((p) => !reqIds.has(p.id)).length;
      const toppingPts = Math.max(0, earnedTop - Math.min(20, wrongCount * 4.5));

      const bakeSpec = C.BAKE_LEVELS[order.bake];
      const minOk = Math.max(38, bakeSpec.min - tol);
      const maxOk = Math.min(93, bakeSpec.max + tol);
      let bakePts = 0;
      let bakeNote = bakeSpec.short;

      if (pizza.bake >= 94) {
        bakePts = 0;
        bakeNote = 'Burnt';
      } else if (pizza.bake < 38) {
        bakePts = 2;
        bakeNote = 'Raw';
      } else if (pizza.bake >= minOk && pizza.bake <= maxOk) {
        bakePts = 22;
        bakeNote = `${bakeSpec.short} Perfection`;
      } else {
        const dist = pizza.bake < minOk ? minOk - pizza.bake : pizza.bake - maxOk;
        bakePts = Math.max(4, 22 - dist * 0.9);
        bakeNote = pizza.bake < minOk ? 'Underbaked' : 'Overbaked';
      }

      const actualSlices = pizza.cutLines.length === 0 ? 1 : pizza.cutLines.length * 2;
      let slicePts = actualSlices === order.slices ? 10 : actualSlices > 1 && Math.abs(actualSlices - order.slices) === 2 ? 6 : actualSlices > 1 ? 3 : 0;

      const patRatio = Math.max(0, order.patience / order.maxPatience);
      const speedPts = 8 * Math.min(1, patRatio * 1.25);

      let totalScore = Math.round(Math.min(100, Math.max(0, basePts + toppingPts + bakePts + slicePts + speedPts)));

      let sodaBonus = 0;
      if (order.wantsSoda) {
        if (pizza.hasSoda) sodaBonus = C.SODA_PRICE;
        else totalScore = Math.max(0, totalScore - 7);
      }

      if (pizza.bake >= 94) totalScore = Math.min(totalScore, 36);
      else if (pizza.bake < 38) totalScore = Math.min(totalScore, 40);

      let tier = 'bad';
      if (totalScore >= 90) tier = 'perfect';
      else if (totalScore >= 74) tier = 'great';
      else if (totalScore >= 52) tier = 'okay';
      if (guest.character.isVip && tier === 'perfect' && totalScore < 93) tier = 'great';

      const decor = this.getDecorBonuses();
      const decorMult = 1 + decor.tipBonus;
      const feverMult = this.feverActive ? 2.0 : 1.0;
      const streakMult = 1 + Math.min(1.0, this.streak * 0.12);

      const basePay = order.basePrice - (order.wantsSoda ? C.SODA_PRICE : 0);
      const payRatio = tier === 'perfect' || tier === 'great' ? 1.0 : tier === 'okay' ? 0.8 : 0.35;
      const payout = Math.round(basePay * payRatio * 2) / 2 + sodaBonus;

      let rawTip = 0;
      if (tier === 'perfect') rawTip = (5.0 + patRatio * 4.5) * guest.character.tipMult;
      else if (tier === 'great') rawTip = (2.8 + patRatio * 2.5) * guest.character.tipMult;
      else if (tier === 'okay') rawTip = 1.0 * guest.character.tipMult;

      const tip = Math.round(rawTip * decorMult * streakMult * feverMult * 2) / 2;
      const comment =
        tier === 'perfect' || tier === 'great'
          ? pickRandom(guest.character.happyLines)
          : tier === 'okay'
          ? pickRandom(guest.character.okLines)
          : pickRandom(guest.character.badLines);

      return {
        totalScore,
        tier,
        payout,
        tip,
        totalEarned: Math.round((payout + tip) * 2) / 2,
        bakeNote,
        actualSlices,
        comment,
      };
    }

    findBestGuestForPizza(pizza) {
      if (!pizza) return null;
      const waiting = this.getOrderedGuests();
      if (waiting.length === 0) return null;
      let best = null;
      for (const g of waiting) {
        const ev = this.evaluatePizza(pizza, g);
        if (!best || ev.totalScore > best.evaluation.totalScore) {
          best = { guest: g, evaluation: ev };
        }
      }
      return best;
    }

    findBestPassIndexForGuest(guest) {
      if (this.passSlots.length === 0) return -1;
      let bestIdx = 0;
      let bestScore = -1;
      this.passSlots.forEach((pie, i) => {
        const ev = this.evaluatePizza(pie, guest);
        if (ev.totalScore > bestScore) {
          bestScore = ev.totalScore;
          bestIdx = i;
        }
      });
      return bestIdx;
    }

    deliverPassToTable(tableId, forcedPassIdx = -1) {
      const table = this.tables.find((t) => t.id === tableId);
      if (!table || !table.guestId) return { ok: false, reason: 'No guest seated here.' };
      const guest = this.getGuestById(table.guestId);
      if (!guest || guest.stage !== 'ordered') {
        return { ok: false, reason: 'This guest is not waiting for a pizza.' };
      }
      if (this.passSlots.length === 0) {
        return { ok: false, reason: 'No finished pizza on the Serving Pass yet.' };
      }

      const passIdx =
        forcedPassIdx >= 0 && forcedPassIdx < this.passSlots.length
          ? forcedPassIdx
          : this.findBestPassIndexForGuest(guest);

      const pizza = this.passSlots.splice(passIdx, 1)[0];
      if (this.selectedPassIndex >= this.passSlots.length) {
        this.selectedPassIndex = Math.max(0, this.passSlots.length - 1);
      }

      const result = this.evaluatePizza(pizza, guest);

      // Update streak, fever & prestige immediately on great service
      if (result.tier === 'perfect' || result.tier === 'great') {
        this.streak++;
        if (this.streak > this.maxDayStreak) this.maxDayStreak = this.streak;
        if (this.streak > this.save.bestStreak) this.save.bestStreak = this.streak;
        this.save.prestigePoints += result.tier === 'perfect' ? (guest.character.isVip ? 28 : 16) : 10;

        if (!this.feverActive) {
          this.fever = Math.min(C.FEVER_MAX, this.fever + (result.tier === 'perfect' ? 36 : 24));
          if (this.fever >= C.FEVER_MAX) {
            this.feverActive = true;
            this.feverTimeLeft = C.FEVER_DURATION;
            FR.Audio.setFever(true);
            FR.Audio.playFeverStart();
          }
        } else {
          this.feverTimeLeft = Math.min(C.FEVER_DURATION, this.feverTimeLeft + 1.5);
        }
      } else {
        this.streak = 0;
        if (!this.feverActive) this.fever = Math.max(0, this.fever - 16);
      }

      this.save.totalPizzasServed++;
      this.dayStats.served++;
      this.dayStats[result.tier]++;
      persistSave(this.save);

      // Sound feedback
      if (result.tier === 'perfect') FR.Audio.playServePerfect();
      else if (result.tier === 'great') FR.Audio.playServeGreat();
      else if (result.tier === 'okay') FR.Audio.playServeOkay();
      else FR.Audio.playServeBad();

      // Transition table & guest into eating!
      table.status = 'eating';
      table.servedPizza = pizza;
      table.slicesEaten = 0;
      table.cashWaiting = result.payout;
      table.tipWaiting = result.tip;

      guest.stage = 'eating';
      guest.eatDuration = result.tier === 'bad' ? 3.5 : 7.5;
      guest.eatTimer = guest.eatDuration;
      guest.serveResult = result;
      guest.mood = result.tier === 'perfect' || result.tier === 'great' ? 'ecstatic' : result.tier === 'okay' ? 'happy' : 'disappointed';
      guest.speechBubble = {
        text: `${result.tier === 'perfect' ? '★ ' : ''}${result.comment}`,
        timer: 3.0,
        tone: result.tier === 'perfect' || result.tier === 'great' ? 'good' : result.tier === 'okay' ? 'warn' : 'bad',
      };

      // Visual gliding tray animation from top pass counter to table
      this.deliveries.push({
        fromX: 0.5,
        fromY: 0.14,
        toX: table.x,
        toY: table.y,
        t: 0,
        pizza,
      });

      if (this.selectedOrderGuestId === guest.id) {
        const nextOrd = this.getOrderedGuests()[0];
        this.selectedOrderGuestId = nextOrd ? nextOrd.id : null;
      }

      return { ok: true, guest, table, result };
    }

    /* ===== SHOP & CUSTOMIZATION ===== */
    buyUpgrade(upgradeId) {
      const spec = C.UPGRADES.find((u) => u.id === upgradeId);
      if (!spec) return false;
      const lvl = this.save.upgrades[upgradeId] || 0;
      if (lvl >= spec.maxLevel) return false;
      const cost = spec.costs[lvl];
      if (this.save.coins < cost) return false;

      this.save.coins = Math.round((this.save.coins - cost) * 2) / 2;
      this.save.upgrades[upgradeId] = lvl + 1;
      this.save.prestigePoints += 22;
      persistSave(this.save);
      FR.Audio.playUpgradeBuy();
      return true;
    }

    buyOrEquipDecor(category, itemId) {
      const cat = C.DECOR_CATALOG[category];
      if (!cat) return false;
      const item = cat.items.find((i) => i.id === itemId);
      if (!item) return false;

      const owned = this.save.ownedDecor[category] || [];
      if (owned.includes(itemId)) {
        this.save.equippedDecor[category] = itemId;
        persistSave(this.save);
        FR.Audio.playButtonClick();
        return true;
      }

      if (this.save.coins < item.cost) return false;
      this.save.coins = Math.round((this.save.coins - item.cost) * 2) / 2;
      owned.push(itemId);
      this.save.ownedDecor[category] = owned;
      this.save.equippedDecor[category] = itemId;
      this.save.prestigePoints += Math.round(item.cost * 0.45);
      persistSave(this.save);
      FR.Audio.playUpgradeBuy();
      return true;
    }

    finishDay() {
      if (this.phase === 'dayEnd') return;
      // Auto-sweep any remaining table cash left on tables at closing time
      this.tables.forEach((t) => {
        if (t.status === 'dirty' && (t.cashWaiting > 0 || t.tipWaiting > 0)) {
          const c = Math.round((t.cashWaiting + t.tipWaiting) * 2) / 2;
          this.save.coins = Math.round((this.save.coins + c) * 2) / 2;
          this.dayStats.revenue = Math.round((this.dayStats.revenue + c) * 2) / 2;
          this.dayStats.tips = Math.round((this.dayStats.tips + t.tipWaiting) * 2) / 2;
          t.cashWaiting = 0;
          t.tipWaiting = 0;
          t.status = 'empty';
        }
      });

      this.phase = 'dayEnd';
      this.feverActive = false;
      FR.Audio.setFever(false);

      const target = this.dayConfig.targetRevenue;
      let stars = 0;
      if (this.dayStats.revenue >= target * 1.4 && this.dayStats.walkouts <= 1) stars = 3;
      else if (this.dayStats.revenue >= target) stars = 2;
      else if (this.dayStats.revenue >= target * 0.6 || this.dayStats.served >= 2) stars = 1;

      this.dayStats.starsEarned = stars;
      this.save.totalStars += stars;
      this.save.prestigePoints += stars * 18;
      if (this.dayStats.revenue > this.save.highDayRevenue) {
        this.save.highDayRevenue = this.dayStats.revenue;
      }
      persistSave(this.save);
      FR.Audio.playDayComplete();
    }

    /* ===== SIMULATION TICK ===== */
    tick(dt) {
      if (this.phase !== 'playing') return { events: [] };
      const events = [];

      this.elapsed += dt;
      if (this.timeLeft > 0) {
        this.timeLeft = Math.max(0, this.timeLeft - dt);
      }

      if (this.prepPizza.doughPop > 0) {
        this.prepPizza.doughPop = Math.max(0, this.prepPizza.doughPop - dt * 5);
      }

      // Fever timer
      if (this.feverActive) {
        this.feverTimeLeft -= dt;
        this.fever = Math.max(0, (this.feverTimeLeft / C.FEVER_DURATION) * C.FEVER_MAX);
        if (this.feverTimeLeft <= 0) {
          this.feverActive = false;
          this.fever = 0;
          FR.Audio.setFever(false);
        }
      }

      // Tray delivery animations
      for (let i = this.deliveries.length - 1; i >= 0; i--) {
        this.deliveries[i].t += dt * 2.6;
        if (this.deliveries[i].t >= 1) {
          FR.Audio.playPlateDown();
          this.deliveries.splice(i, 1);
        }
      }

      // Oven baking
      const ovenSpeed = this.getOvenSpeed();
      this.ovenSlots.forEach((pizza, idx) => {
        if (!pizza) return;
        const prevBake = pizza.bake;
        pizza.bake = Math.min(100, pizza.bake + ovenSpeed * dt);
        if (!pizza.dingedGolden && prevBake < 56 && pizza.bake >= 56) {
          pizza.dingedGolden = true;
          FR.Audio.playOvenDing();
          events.push({ type: 'ovenGolden', slotIndex: idx });
        }
        if (!pizza.dingedCrispy && prevBake < 77 && pizza.bake >= 77) {
          pizza.dingedCrispy = true;
          FR.Audio.playOvenDing();
          events.push({ type: 'ovenCrispy', slotIndex: idx });
        }
        if (pizza.bake >= 91 && pizza.bake < 99) {
          FR.Audio.playBurnWarn();
        }
      });

      // Auto-busser upgrade on dirty tables
      if (this.save.upgrades.busboy > 0) {
        this.tables.forEach((t) => {
          if (t.status === 'dirty') {
            t.dirtyTimer += dt;
            if (t.dirtyTimer >= 3.8) {
              const res = this.busTable(t.id);
              if (res.ok) events.push({ type: 'autoBus', table: t, collected: res.collected });
            }
          }
        });
      }

      // Guest walking, seating, ordering, eating & leaving
      for (let i = this.guests.length - 1; i >= 0; i--) {
        const g = this.guests[i];
        if (g.speechBubble) {
          g.speechBubble.timer -= dt;
          if (g.speechBubble.timer <= 0) g.speechBubble = null;
        }

        if (g.stage === 'entering' || g.stage === 'leaving') {
          const dx = g.targetX - g.x;
          const dy = g.targetY - g.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.008) {
            const step = Math.min(dist, g.speed * dt);
            g.x += (dx / dist) * step;
            g.y += (dy / dist) * step;
            g.facing = Math.atan2(dy, dx);
            g.walkPhase += dt * 9.5;
          } else {
            g.x = g.targetX;
            g.y = g.targetY;
            if (g.stage === 'leaving') {
              this.guests.splice(i, 1);
              continue;
            }
            if (g.tableId) {
              const table = this.tables.find((t) => t.id === g.tableId);
              if (table) {
                table.status = 'seated';
                g.stage = 'reading';
                g.facing = -Math.PI / 2;
                g.menuTimer = 2.6;
              }
            } else {
              g.stage = 'queueing';
              g.facing = -Math.PI / 2;
            }
          }
        } else if (g.stage === 'queueing') {
          const freeTable = this.findFreeTable();
          if (freeTable) {
            freeTable.status = 'reserved';
            freeTable.guestId = g.id;
            g.tableId = freeTable.id;
            g.stage = 'entering';
            g.targetX = freeTable.x;
            g.targetY = freeTable.y + 0.085;
          } else {
            g.queuePatience -= dt;
            g.mood = g.queuePatience < 10 ? 'impatient' : 'waiting';
            if (g.queuePatience <= 0) {
              g.stage = 'leaving';
              g.targetX = 0.5;
              g.targetY = 1.08;
              g.mood = 'angry';
              g.speechBubble = { text: 'No open tables...', timer: 1.8, tone: 'bad' };
              this.dayStats.walkouts++;
              FR.Audio.playServeBad();
              events.push({ type: 'walkout', guest: g });
            }
          }
        } else if (g.stage === 'reading') {
          g.menuTimer -= dt;
          if (g.menuTimer <= 0) {
            g.stage = 'ordered';
            if (!this.selectedOrderGuestId) this.selectedOrderGuestId = g.id;
            events.push({ type: 'newOrder', guest: g });
          }
        } else if (g.stage === 'ordered') {
          const drain = this.feverActive ? 0.35 : 1.0;
          g.order.patience = Math.max(0, g.order.patience - dt * drain);
          const ratio = g.order.patience / g.order.maxPatience;
          g.mood = ratio > 0.55 ? 'happy' : ratio > 0.28 ? 'waiting' : ratio > 0.14 ? 'impatient' : 'angry';
          if (g.order.patience <= 0) {
            const table = this.tables.find((t) => t.id === g.tableId);
            if (table) {
              table.status = 'empty';
              table.guestId = null;
              this.assignWaitingGuestToTable(table);
            }
            g.tableId = null;
            g.stage = 'leaving';
            g.targetX = 0.5;
            g.targetY = 1.08;
            g.mood = 'angry';
            g.speechBubble = { text: 'Waited too long!', timer: 2.0, tone: 'bad' };
            this.streak = 0;
            this.dayStats.walkouts++;
            FR.Audio.playServeBad();
            if (this.selectedOrderGuestId === g.id) {
              const nextOrd = this.getOrderedGuests()[0];
              this.selectedOrderGuestId = nextOrd ? nextOrd.id : null;
            }
            events.push({ type: 'walkout', guest: g });
          }
        } else if (g.stage === 'eating') {
          g.eatTimer -= dt;
          const table = this.tables.find((t) => t.id === g.tableId);
          if (table && table.servedPizza) {
            const totalSlices = Math.max(4, table.servedPizza.cutLines.length * 2 || 4);
            const progress = 1 - Math.max(0, g.eatTimer / g.eatDuration);
            table.slicesEaten = Math.min(totalSlices, Math.floor(progress * totalSlices));
          }
          if (g.eatTimer <= 0) {
            if (table) {
              table.status = 'dirty';
              table.guestId = null;
              table.dirtyTimer = 0;
            }
            g.tableId = null;
            g.stage = 'leaving';
            g.targetX = 0.5;
            g.targetY = 1.08;
            events.push({ type: 'tableReadyToBus', table });
          }
        }
      }

      // Guest arrivals during open hours
      if (this.timeLeft > 6) {
        this.spawnTimer -= dt;
        const activeGuests = this.guests.filter((g) => g.stage !== 'leaving').length;
        if (activeGuests === 0 && this.spawnTimer > 1.6) {
          this.spawnTimer = 1.6;
        }
        if (this.spawnTimer <= 0) {
          this.spawnGuest(false);
          const minS = this.dayConfig.spawnIntervalMin;
          const maxS = this.dayConfig.spawnIntervalMax;
          this.spawnTimer = minS + Math.random() * (maxS - minS);
        }
      } else {
        const remaining = this.guests.filter((g) => g.stage !== 'leaving').length;
        const dirtyLeft = this.tables.some((t) => t.status === 'dirty');
        if (this.timeLeft <= 0 && remaining === 0 && !dirtyLeft) {
          this.finishDay();
          events.push({ type: 'dayEnd' });
        } else if (this.timeLeft <= 0 && remaining === 0 && dirtyLeft) {
          // Finish cleanly once tables are bussed or after 5s grace
          this.finishDay();
          events.push({ type: 'dayEnd' });
        }
      }

      return { events };
    }
  }

  FR.GameState = GameState;
  FR.createEmptyPizza = createEmptyPizza;
})();
