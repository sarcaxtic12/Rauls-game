(function () {
  const FR = (window.FornoRush = window.FornoRush || {});
  const C = FR.Config;
  const Tex = FR.Textures;

  function resizeHiDPI(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const tw = Math.round(rect.width * dpr);
    const th = Math.round(rect.height * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawRealisticPerson(ctx, guest, px, py, scale, now) {
    const ch = guest.character;
    const isWalking = guest.stage === 'entering' || guest.stage === 'leaving';
    const stride = isWalking ? Math.sin(guest.walkPhase) : 0;
    const bob = isWalking ? Math.abs(Math.cos(guest.walkPhase)) * 2.2 : Math.sin(now * 0.0025 + guest.id) * 0.8;

    ctx.save();
    ctx.translate(px, py - bob);

    // Soft grounded floor shadow
    ctx.fillStyle = 'rgba(18, 9, 4, 0.36)';
    ctx.beginPath();
    ctx.ellipse(0, 12 * scale, 22 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate body subtly toward movement or table
    ctx.save();
    const bodyRot = isWalking ? guest.facing + Math.PI / 2 : 0;
    ctx.rotate(bodyRot);

    // Subtle shoes stepping when walking
    if (isWalking) {
      ctx.fillStyle = '#241812';
      ctx.beginPath();
      ctx.ellipse(-7 * scale, stride * 8 * scale, 4.5 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(7 * scale, -stride * 8 * scale, 4.5 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swinging arms / resting hands
    ctx.fillStyle = ch.coat;
    const armL = isWalking ? -stride * 6 * scale : guest.stage === 'eating' ? -6 * scale : -2 * scale;
    const armR = isWalking ? stride * 6 * scale : guest.stage === 'eating' ? -6 * scale : -2 * scale;
    ctx.beginPath();
    ctx.ellipse(-18 * scale, armL, 6.5 * scale, 10 * scale, 0.25, 0, Math.PI * 2);
    ctx.ellipse(18 * scale, armR, 6.5 * scale, 10 * scale, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Hands (holding leather menu when reading or cutlery when eating)
    ctx.fillStyle = ch.skin;
    ctx.beginPath();
    ctx.arc(-16 * scale, armL - 6 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.arc(16 * scale, armR - 6 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (guest.stage === 'reading') {
      // Leather wine/pizza menu held open in front
      ctx.fillStyle = '#5e241b';
      ctx.strokeStyle = '#d4a854';
      ctx.lineWidth = 1.2;
      drawRoundedRect(ctx, -13 * scale, -20 * scale, 26 * scale, 13 * scale, 3);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 240, 210, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, -19 * scale);
      ctx.lineTo(0, -8 * scale);
      ctx.stroke();
    }

    // Tailored shoulders & coat with realistic overhead lighting gradient
    const coatGrad = ctx.createLinearGradient(-20 * scale, -10 * scale, 20 * scale, 12 * scale);
    coatGrad.addColorStop(0, ch.coat);
    coatGrad.addColorStop(1, '#1a1210');
    ctx.fillStyle = coatGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale, 21 * scale, 12.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shirt collar / draped scarf
    if (ch.scarf) {
      ctx.strokeStyle = ch.scarf;
      ctx.lineWidth = 5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 11.5 * scale, 0.25, Math.PI - 0.25);
      ctx.stroke();
    } else {
      ctx.fillStyle = ch.shirt;
      ctx.beginPath();
      ctx.ellipse(0, -2 * scale, 9 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head with natural shading
    const headGrad = ctx.createRadialGradient(-3 * scale, -5 * scale, 2 * scale, 0, -2 * scale, 13 * scale);
    headGrad.addColorStop(0, ch.skin);
    headGrad.addColorStop(1, ch.skinShade);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -2 * scale, 11.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Realistic overhead hair styling
    ctx.fillStyle = ch.hair;
    if (ch.hairStyle === 'bun' || ch.hairStyle === 'chignon') {
      ctx.beginPath();
      ctx.arc(0, -1 * scale, 11.6 * scale, -0.35, Math.PI + 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 10 * scale, 5.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (ch.hairStyle === 'cap') {
      ctx.fillStyle = '#8c2d1f';
      ctx.beginPath();
      ctx.arc(0, -2 * scale, 11.6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5e1a10';
      ctx.beginPath();
      ctx.ellipse(0, -12 * scale, 9.5 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (ch.hairStyle === 'beret') {
      ctx.fillStyle = '#242029';
      ctx.beginPath();
      ctx.ellipse(1.5 * scale, -2 * scale, 13 * scale, 11 * scale, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Gold VIP ring subtle glint
      ctx.strokeStyle = '#d9a441';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -2 * scale, 13.5 * scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ch.hairStyle === 'braids') {
      ctx.beginPath();
      ctx.arc(0, 0, 11.5 * scale, -0.3, Math.PI + 0.3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-10 * scale, 6 * scale, 4.5 * scale, 0, Math.PI * 2);
      ctx.arc(10 * scale, 6 * scale, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Natural short/wavy parted hair
      ctx.beginPath();
      ctx.arc(0, 0.5 * scale, 11.5 * scale, -0.2, Math.PI + 0.2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(-3 * scale, 2 * scale, 5 * scale, 2.5 * scale, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Subtle VIP badge pill on Inspector
    if (ch.isVip) {
      ctx.fillStyle = 'rgba(24, 18, 12, 0.84)';
      drawRoundedRect(ctx, -17, 16 * scale, 34, 14, 7);
      ctx.fill();
      ctx.strokeStyle = '#e0ad42';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffd978';
      ctx.font = '800 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIP', 0, 16 * scale + 10.5);
    }

    ctx.restore();
  }

  function drawTable(ctx, table, state, cx, cy, tableR, isHovered, hasReadyPass, now) {
    const linen = state.save.equippedDecor.linens || 'rustic';
    const guest = table.guestId ? state.getGuestById(table.guestId) : null;

    ctx.save();
    ctx.translate(cx, cy);

    // Subtle wooden chairs (top & bottom of table)
    const drawChair = (ox, oy) => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = 'rgba(15, 7, 3, 0.32)';
      ctx.beginPath();
      ctx.ellipse(0, 3, tableR * 0.44, tableR * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4f2e1a';
      ctx.strokeStyle = '#2d180c';
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, -tableR * 0.38, -tableR * 0.28, tableR * 0.76, tableR * 0.56, 8);
      ctx.fill();
      ctx.stroke();
      // Upholstered leather seat cushion
      ctx.fillStyle = linen === 'velvet' ? '#5e2420' : '#7a4528';
      drawRoundedRect(ctx, -tableR * 0.3, -tableR * 0.2, tableR * 0.6, tableR * 0.4, 6);
      ctx.fill();
      ctx.restore();
    };
    drawChair(0, -tableR * 1.1);
    drawChair(0, tableR * 1.1);

    // Interactive warm aura ring (when actionable!)
    const canGreet = guest && guest.stage === 'reading';
    const canDeliver = guest && guest.stage === 'ordered' && hasReadyPass;
    const canBus = table.status === 'dirty';

    if (canDeliver || canGreet || canBus || isHovered) {
      const pulse = 0.7 + Math.sin(now * 0.0055) * 0.3;
      ctx.save();
      ctx.strokeStyle = canDeliver
        ? `rgba(72, 214, 114, ${0.55 + pulse * 0.35})`
        : canBus
        ? `rgba(255, 206, 77, ${0.55 + pulse * 0.35})`
        : canGreet
        ? `rgba(116, 198, 255, ${0.5 + pulse * 0.35})`
        : 'rgba(255, 224, 178, 0.38)';
      ctx.lineWidth = isHovered ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, tableR + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Table ground shadow
    ctx.fillStyle = 'rgba(12, 5, 2, 0.42)';
    ctx.beginPath();
    ctx.arc(2, 6, tableR + 2, 0, Math.PI * 2);
    ctx.fill();

    // Table Surface based on equipped Linen customization!
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, tableR, 0, Math.PI * 2);
    ctx.clip();

    if (linen === 'rustic') {
      const wg = ctx.createRadialGradient(-tableR * 0.25, -tableR * 0.25, 6, 0, 0, tableR);
      wg.addColorStop(0, '#96613a');
      wg.addColorStop(1, '#5e381e');
      ctx.fillStyle = wg;
      ctx.fillRect(-tableR, -tableR, tableR * 2, tableR * 2);
      // Grain lines
      ctx.strokeStyle = 'rgba(40, 20, 8, 0.16)';
      ctx.lineWidth = 1.2;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-tableR, i * (tableR * 0.22));
        ctx.lineTo(tableR, i * (tableR * 0.22) + 3);
        ctx.stroke();
      }
    } else if (linen === 'gingham') {
      ctx.fillStyle = '#faf3e8';
      ctx.fillRect(-tableR, -tableR, tableR * 2, tableR * 2);
      ctx.fillStyle = 'rgba(182, 46, 36, 0.42)';
      const step = 12;
      for (let x = -tableR; x < tableR; x += step * 2) ctx.fillRect(x, -tableR, step, tableR * 2);
      for (let y = -tableR; y < tableR; y += step * 2) ctx.fillRect(-tableR, y, tableR * 2, step);
    } else if (linen === 'ivory') {
      const ig = ctx.createRadialGradient(-tableR * 0.2, -tableR * 0.2, 5, 0, 0, tableR);
      ig.addColorStop(0, '#fffcf5');
      ig.addColorStop(1, '#e6dac6');
      ctx.fillStyle = ig;
      ctx.fillRect(-tableR, -tableR, tableR * 2, tableR * 2);
    } else if (linen === 'velvet') {
      const vg = ctx.createRadialGradient(-tableR * 0.2, -tableR * 0.2, 5, 0, 0, tableR);
      vg.addColorStop(0, '#4f2c29');
      vg.addColorStop(1, '#291413');
      ctx.fillStyle = vg;
      ctx.fillRect(-tableR, -tableR, tableR * 2, tableR * 2);
      ctx.strokeStyle = 'rgba(218, 174, 78, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, tableR - 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Wood / Brass table rim
    ctx.strokeStyle = linen === 'velvet' ? '#cfa044' : linen === 'ivory' ? '#d4c3a8' : '#3d2111';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, tableR, 0, Math.PI * 2);
    ctx.stroke();

    // Tiny table number plaque on edge
    ctx.fillStyle = 'rgba(30, 16, 10, 0.72)';
    ctx.beginPath();
    ctx.arc(-tableR * 0.72, -tableR * 0.62, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5dfb8';
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`T${table.id}`, -tableR * 0.72, -tableR * 0.62);
    ctx.textBaseline = 'alphabetic';

    // Flickering beeswax candle + wine glass (when empty or seated)
    const candleX = tableR * 0.56;
    const candleY = -tableR * 0.44;
    const flameFlicker = 0.85 + Math.sin(now * 0.012 + table.id * 2) * 0.15;
    const cGlow = ctx.createRadialGradient(candleX, candleY, 1, candleX, candleY, 22 * flameFlicker);
    cGlow.addColorStop(0, 'rgba(255, 206, 94, 0.55)');
    cGlow.addColorStop(1, 'rgba(255, 170, 50, 0)');
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(candleX, candleY, 22 * flameFlicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4a448';
    ctx.beginPath();
    ctx.arc(candleX, candleY, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff5bd';
    ctx.beginPath();
    ctx.arc(candleX, candleY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Wine glass rim glint
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-tableR * 0.48, tableR * 0.36, 5.5, 0, Math.PI * 2);
    ctx.stroke();

    // If EATING: draw real steaming pizza on a wooden board, with slices vanishing!
    if (table.status === 'eating' && table.servedPizza) {
      const pieR = tableR * 0.54;
      // Ceramic / wood platter
      ctx.fillStyle = '#f5eee4';
      ctx.beginPath();
      ctx.arc(0, 0, pieR + 4, 0, Math.PI * 2);
      ctx.fill();

      const totalSlices = Math.max(4, table.servedPizza.cutLines.length * 2 || 4);
      const remaining = Math.max(0, totalSlices - table.slicesEaten);
      if (remaining > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const startA = -Math.PI / 2;
        const endA = startA + (remaining / totalSlices) * Math.PI * 2;
        ctx.arc(0, 0, pieR + 2, startA, endA);
        ctx.closePath();
        ctx.clip();
        FR.PizzaRenderer.drawPizza(ctx, table.servedPizza, 0, 0, pieR, { now });
        ctx.restore();
      }

      if (table.servedPizza.hasSoda) {
        ctx.fillStyle = '#e85d22';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(tableR * 0.58, tableR * 0.32, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // If DIRTY: draw empty ceramic plate + crisp cash bills + gleaming gold tip coins!
    if (table.status === 'dirty') {
      // Used plate with crumbs
      ctx.fillStyle = '#ece3d5';
      ctx.strokeStyle = '#c4b69f';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-8, 2, tableR * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c4833e';
      ctx.beginPath();
      ctx.arc(-11, 0, 2, 0, Math.PI * 2);
      ctx.arc(-4, 6, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Cash & gold tip coins stacked neatly
      const total = table.cashWaiting + table.tipWaiting;
      if (total > 0) {
        ctx.save();
        ctx.translate(tableR * 0.34, 4);
        ctx.rotate(-0.18);
        ctx.fillStyle = '#3f8a4b';
        ctx.strokeStyle = '#24592c';
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, -13, -7, 26, 14, 2.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d9f5dd';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 3);
        ctx.restore();

        // Gold coins
        ctx.fillStyle = '#f5c23b';
        ctx.strokeStyle = '#9c6c0b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(tableR * 0.45, -8, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tableR * 0.3, -12, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Clean action chip above table
      ctx.fillStyle = 'rgba(30, 18, 10, 0.88)';
      drawRoundedRect(ctx, -44, -tableR - 24, 88, 20, 10);
      ctx.fill();
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = '#ffe58f';
      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Collect $${total.toFixed(0)} & Bus`, 0, -tableR - 10.5);
    }

    // Sparkle wipe animation when freshly cleaned
    const cleanAge = (now - (table.lastCleanFlash || 0)) / 1000;
    if (cleanAge < 0.6) {
      ctx.strokeStyle = `rgba(255, 248, 210, ${(1 - cleanAge / 0.6) * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, tableR * (0.4 + cleanAge * 1.1), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGuestBubble(ctx, guest, px, py, state, hasReadyPass) {
    // Minimal, calm status tag above seated/waiting guests (low visual noise!)
    let label = null;
    let accent = '#d9b98c';
    let bg = 'rgba(28, 17, 12, 0.88)';
    let patRatio = null;

    if (guest.speechBubble) {
      label = guest.speechBubble.text;
      accent = guest.speechBubble.tone === 'good' ? '#58cf79' : guest.speechBubble.tone === 'bad' ? '#e85d51' : '#e8a84a';
    } else if (guest.stage === 'reading') {
      label = '👋 Click to Greet (+$2)';
      accent = '#7dc8ff';
    } else if (guest.stage === 'queueing') {
      label = 'Waiting for clean table...';
      accent = '#f2b84b';
    } else if (guest.stage === 'ordered') {
      patRatio = guest.order.patience / guest.order.maxPatience;
      const topNames = guest.order.toppings.map((t) => C.TOPPING_MAP[t.id].short).join(' + ');
      label = hasReadyPass ? `🍕 Deliver to T${guest.tableId}` : `${C.SAUCES[guest.order.sauce].short} • ${topNames}`;
      accent = hasReadyPass ? '#4dd473' : patRatio > 0.5 ? '#59c973' : patRatio > 0.25 ? '#f0a832' : '#e84c3d';
    } else if (guest.stage === 'eating') {
      label = 'Enjoying pizza...';
      accent = '#d4b483';
    }

    if (!label) return;

    ctx.save();
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    const tw = Math.min(185, Math.max(84, ctx.measureText(label).width + 20));
    const bx = px - tw / 2;
    const by = py - 56;
    const bh = patRatio !== null ? 26 : 21;

    ctx.fillStyle = bg;
    drawRoundedRect(ctx, bx, by, tw, bh, 9);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#fff5e6';
    ctx.textAlign = 'center';
    ctx.fillText(label, px, by + 14);

    if (patRatio !== null) {
      const barW = tw - 16;
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      drawRoundedRect(ctx, bx + 8, by + 19, barW, 3.5, 2);
      ctx.fill();
      ctx.fillStyle = accent;
      drawRoundedRect(ctx, bx + 8, by + 19, Math.max(2, barW * patRatio), 3.5, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function renderDiningRoom(canvas, state, hoverInfo, now) {
    const info = resizeHiDPI(canvas);
    if (!info) return null;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const floorKey = `floor-${state.save.equippedDecor.floor || 'oak'}`;
    const lighting = state.save.equippedDecor.lighting || 'edison';
    const greenery = state.save.equippedDecor.greenery || 'minimal';

    // 1. Textured Dining Room Floor
    ctx.fillStyle = Tex.getPattern(ctx, floorKey);
    ctx.fillRect(0, 0, w, h);

    // Subtle warm room vignette for photographic depth
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(255, 212, 155, 0.08)');
    vig.addColorStop(1, 'rgba(12, 6, 3, 0.46)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // 2. Top Kitchen Pass Counter & Portals (y: 0..h*0.18)
    const passH = Math.max(66, h * 0.175);
    const passGrad = ctx.createLinearGradient(0, 0, 0, passH);
    passGrad.addColorStop(0, '#2a1811');
    passGrad.addColorStop(0.72, '#4a2b1a');
    passGrad.addColorStop(1, '#26140c');
    ctx.fillStyle = passGrad;
    ctx.fillRect(0, 0, w, passH);

    // Marble serving ledge
    ctx.fillStyle = '#e8dfd1';
    ctx.fillRect(w * 0.24, passH - 12, w * 0.52, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, passH, w, 6);

    // Left Portal -> Cook Line
    const kitchenPortal = { x: 16, y: 12, w: Math.min(180, w * 0.19), h: passH - 22 };
    const ovenPortal = { x: w - Math.min(180, w * 0.19) - 16, y: 12, w: Math.min(180, w * 0.19), h: passH - 22 };

    const drawPortal = (rect, title, sub, isHov, warmGlow) => {
      ctx.save();
      ctx.fillStyle = warmGlow
        ? 'rgba(166, 60, 20, 0.34)'
        : 'rgba(255, 240, 218, 0.09)';
      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 11);
      ctx.fill();
      ctx.strokeStyle = isHov ? '#ffd27a' : warmGlow ? 'rgba(245, 140, 56, 0.55)' : 'rgba(255, 224, 180, 0.25)';
      ctx.lineWidth = isHov ? 2 : 1.3;
      ctx.stroke();

      ctx.fillStyle = '#fff2dc';
      ctx.font = '700 12px "Fredoka", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, rect.x + rect.w / 2, rect.y + rect.h * 0.45);
      ctx.fillStyle = '#d4b89c';
      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h * 0.72);
      ctx.restore();
    };

    const bakingCount = state.ovenSlots.filter(Boolean).length;
    drawPortal(
      kitchenPortal,
      '👨‍🍳 Cook Line →',
      state.prepPizza.hasDough ? 'Pie in progress' : 'Grab ingredients',
      hoverInfo?.type === 'portal-kitchen',
      false
    );
    drawPortal(
      ovenPortal,
      '🔥 Brick Forno →',
      bakingCount > 0 ? `${bakingCount} baking now` : 'Oven & slicing',
      hoverInfo?.type === 'portal-oven',
      bakingCount > 0
    );

    // Center Serving Pass slots showing physical hot plated pizzas!
    ctx.fillStyle = '#d9bfa0';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERVING PASS — HOT PIES READY TO DELIVER', w * 0.5, 16);

    const passSlotHits = [];
    const passCount = C.MAX_PASS_SLOTS;
    const passSpacing = Math.min(92, (w * 0.46) / passCount);
    const passStartX = w * 0.5 - ((passCount - 1) * passSpacing) / 2;
    const passCy = passH * 0.57;
    const passR = Math.min(25, passH * 0.31);

    for (let i = 0; i < passCount; i++) {
      const sx = passStartX + i * passSpacing;
      const pie = state.passSlots[i];
      const isSel = i === state.selectedPassIndex && !!pie;

      // Brass heat lamp pool
      const lamp = ctx.createRadialGradient(sx, passCy, 2, sx, passCy, passR + 12);
      lamp.addColorStop(0, pie ? 'rgba(255, 198, 92, 0.32)' : 'rgba(255, 200, 120, 0.1)');
      lamp.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = lamp;
      ctx.beginPath();
      ctx.arc(sx, passCy, passR + 12, 0, Math.PI * 2);
      ctx.fill();

      // Empty wooden pass coaster or real hot pizza
      ctx.fillStyle = 'rgba(24, 12, 6, 0.48)';
      ctx.strokeStyle = isSel ? '#59d97d' : 'rgba(255, 224, 178, 0.22)';
      ctx.lineWidth = isSel ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.arc(sx, passCy, passR + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (pie) {
        FR.PizzaRenderer.drawPizza(ctx, pie, sx, passCy, passR, { now });
      }
      passSlotHits.push({ index: i, x: sx, y: passCy, r: passR + 6 });
    }

    // 3. Greenery & Wine Rack Customization along side walls!
    if (greenery === 'olives' || greenery === 'cellar') {
      const drawOlivePot = (px, py) => {
        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = 'rgba(12, 6, 3, 0.36)';
        ctx.beginPath();
        ctx.ellipse(2, 4, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a85032';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        const leafCols = ['#4d7543', '#618f54', '#395e33', '#7ea86c'];
        for (let i = 0; i < 9; i++) {
          const a = i * 0.72 + Math.sin(now * 0.001 + i) * 0.05;
          ctx.fillStyle = leafCols[i % leafCols.length];
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 10, Math.sin(a) * 10, 9, 4.5, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      drawOlivePot(34, passH + 34);
      drawOlivePot(w - 34, passH + 34);
      drawOlivePot(34, h - 54);
      drawOlivePot(w - 34, h - 54);
    }

    if (greenery === 'cellar') {
      // Illuminated vintage wine rack along left wall
      ctx.save();
      ctx.fillStyle = '#2e1812';
      ctx.strokeStyle = '#a87d3e';
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, 10, h * 0.36, 22, h * 0.28, 6);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#6e1c28' : '#284a2a';
        ctx.beginPath();
        ctx.arc(21, h * 0.39 + i * (h * 0.042), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Bottom Streetfront Windows & Glass Door (Dynamic Daylight -> Sunset -> Evening!)
    const dayProg = 1 - Math.max(0, state.timeLeft / Math.max(1, state.dayConfig.durationSec));
    const streetH = 26;
    const skyCol = dayProg < 0.5 ? '#c79a6b' : dayProg < 0.8 ? '#8c4b3e' : '#21253b';
    ctx.fillStyle = skyCol;
    ctx.fillRect(0, h - streetH, w, streetH);
    ctx.fillStyle = '#2a1811';
    ctx.fillRect(0, h - streetH - 6, w, 6);

    // Glass entrance doors at bottom center
    const doorW = 86;
    const doorX = w * 0.5 - doorW / 2;
    ctx.fillStyle = 'rgba(255, 232, 188, 0.24)';
    ctx.fillRect(doorX, h - streetH - 6, doorW, streetH + 6);
    ctx.strokeStyle = '#cfa04c';
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, h - streetH - 5, doorW, streetH + 4);
    ctx.fillStyle = 'rgba(255, 240, 210, 0.72)';
    ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ENTRANCE', w * 0.5, h - 9);

    // 5. Render Tables
    const tableR = Math.min(46, Math.max(32, Math.min(w / 14, h / 9.2)));
    const hasReadyPass = state.passSlots.length > 0;
    const tableHits = [];

    state.tables.forEach((t) => {
      const tx = t.x * w;
      const ty = t.y * h;
      const isHov = hoverInfo?.type === 'table' && hoverInfo.id === t.id;
      drawTable(ctx, t, state, tx, ty, tableR, isHov, hasReadyPass, now);
      tableHits.push({ id: t.id, x: tx, y: ty, r: tableR + 14 });
    });

    // 6. Render Realistic Articulated Guests (sorted by Y for proper overlap!)
    const personScale = Math.max(0.82, Math.min(1.08, tableR / 42));
    const sortedGuests = state.guests.slice().sort((a, b) => a.y - b.y);
    sortedGuests.forEach((g) => {
      drawRealisticPerson(ctx, g, g.x * w, g.y * h, personScale, now);
    });

    // 7. Gliding Pizza Delivery Trays
    state.deliveries.forEach((d) => {
      const ease = 1 - Math.pow(1 - Math.min(1, d.t), 3);
      const x = (d.fromX + (d.toX - d.fromX) * ease) * w;
      const y = (d.fromY + (d.toY - d.fromY) * ease) * h;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      FR.PizzaRenderer.drawPizza(ctx, d.pizza, x, y, tableR * 0.5, { now });
      ctx.restore();
    });

    // 8. Customized Overhead Lighting Pools (Warm Edison / Fairy String Lights / Murano Chandeliers!)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    state.tables.forEach((t) => {
      const tx = t.x * w;
      const ty = t.y * h;
      const radius = lighting === 'murano' ? tableR * 2.5 : tableR * 2.0;
      const intensity = lighting === 'murano' ? 0.22 : lighting === 'string' ? 0.16 : 0.13;
      const g = ctx.createRadialGradient(tx, ty, 6, tx, ty, radius);
      g.addColorStop(0, `rgba(255, 208, 122, ${intensity})`);
      g.addColorStop(1, 'rgba(255, 180, 90, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, ty, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    if (lighting === 'string') {
      // Delicate golden courtyard fairy light garlands draped overhead
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 224, 150, 0.24)';
      ctx.lineWidth = 1;
      for (let row = 0; row < 2; row++) {
        const yBase = passH + (row === 0 ? h * 0.14 : h * 0.44);
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        ctx.quadraticCurveTo(w * 0.5, yBase + 38, w, yBase);
        ctx.stroke();
        for (let b = 1; b <= 9; b++) {
          const u = b / 10;
          const bx = u * w;
          const by = (1 - u) * (1 - u) * yBase + 2 * (1 - u) * u * (yBase + 38) + u * u * yBase;
          const tw = 0.7 + Math.sin(now * 0.004 + b + row * 3) * 0.3;
          ctx.fillStyle = `rgba(255, 232, 148, ${0.75 * tw})`;
          ctx.beginPath();
          ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (lighting === 'murano') {
      // Subtle warm Venetian chandelier halos at ceiling corners
      [[w * 0.34, passH + 34], [w * 0.66, passH + 34]].forEach(([mx, my]) => {
        const mg = ctx.createRadialGradient(mx, my, 2, mx, my, 46);
        mg.addColorStop(0, 'rgba(255, 226, 140, 0.38)');
        mg.addColorStop(1, 'rgba(255, 190, 80, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, 46, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 9. Clean Minimal Status Bubbles on top of lighting so always crisp & readable
    sortedGuests.forEach((g) => {
      if (g.stage !== 'entering' && g.stage !== 'leaving') {
        drawGuestBubble(ctx, g, g.x * w, g.y * h, state, hasReadyPass);
      } else if (g.speechBubble) {
        drawGuestBubble(ctx, g, g.x * w, g.y * h, state, false);
      }
    });

    return {
      w,
      h,
      tableHits,
      passSlotHits,
      kitchenPortal,
      ovenPortal,
    };
  }

  FR.DiningRenderer = { renderDiningRoom };
})();
