(function () {
  const FR = (window.FornoRush = window.FornoRush || {});
  const C = FR.Config;
  const Tex = FR.Textures;

  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  function lerpColor(hexA, hexB, t) {
    const k = Math.max(0, Math.min(1, t));
    const a = parseInt(hexA.slice(1), 16);
    const b = parseInt(hexB.slice(1), 16);
    const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, k));
    const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, k));
    const bl = Math.round(lerp(a & 255, b & 255, k));
    return `rgb(${r},${g},${bl})`;
  }

  function getCrustColors(bake) {
    if (bake <= 55) {
      const t = bake / 55;
      return {
        outer: lerpColor('#efe0c5', '#dc9640', t),
        inner: lerpColor('#f7ecda', '#e8b364', t),
        rimDark: lerpColor('#cfb489', '#9c5218', t),
      };
    }
    if (bake <= 85) {
      const t = (bake - 55) / 30;
      return {
        outer: lerpColor('#dc9640', '#ad4f16', t),
        inner: lerpColor('#e8b364', '#c46c24', t),
        rimDark: lerpColor('#9c5218', '#5e2308', t),
      };
    }
    const t = (bake - 85) / 15;
    return {
      outer: lerpColor('#ad4f16', '#241815', t),
      inner: lerpColor('#c46c24', '#38241d', t),
      rimDark: lerpColor('#5e2308', '#120b09', t),
    };
  }

  // Subtle organic hand-stretched Neapolitan dough contour!
  function traceOrganicCircle(ctx, radius, seed = 1, wobble = 0.028) {
    const steps = 40;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const n =
        Math.sin(a * 3 + seed * 0.7) * 0.5 +
        Math.cos(a * 5 - seed * 1.3) * 0.35 +
        Math.sin(a * 7 + seed * 2.1) * 0.15;
      const rr = radius * (1 + n * wobble);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawToppingItem(ctx, item, cx, cy, radius, bake, now) {
    const x = cx + item.x * radius;
    const y = cy + item.y * radius;
    const age = (now - (item.bornAt || 0)) / 1000;
    let bounce = 1;
    if (age < 0.22) {
      const p = age / 0.22;
      bounce = p < 0.55 ? lerp(1.3, 0.93, p / 0.55) : lerp(0.93, 1.0, (p - 0.55) / 0.45);
    }

    const s = radius * 0.145 * bounce * (item.scale || 1);
    const bakeRoast = Math.max(0, Math.min(1, (bake - 28) / 62));
    const burnDark = Math.max(0, Math.min(1, (bake - 86) / 14));

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(item.angle || 0);

    ctx.shadowColor = 'rgba(28, 12, 4, 0.32)';
    ctx.shadowBlur = Math.max(1.8, s * 0.22);
    ctx.shadowOffsetY = Math.max(1, s * 0.12);

    switch (item.id) {
      case 'pepperoni': {
        const body = lerpColor('#be2a1f', '#78140d', bakeRoast);
        const rim = lerpColor('#7d160e', '#360704', bakeRoast);
        const pGrad = ctx.createRadialGradient(-s * 0.2, -s * 0.2, s * 0.1, 0, 0, s * 0.95);
        pGrad.addColorStop(0, burnDark > 0 ? lerpColor(body, '#1f1210', burnDark) : body);
        pGrad.addColorStop(1, burnDark > 0 ? '#140b0a' : rim);
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * (0.96 - bakeRoast * 0.08), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        // Crisp cupped char rim when roasted
        ctx.strokeStyle = rim;
        ctx.lineWidth = Math.max(1.2, s * (0.13 + bakeRoast * 0.08));
        ctx.stroke();

        // Marbling fat specks
        ctx.fillStyle = `rgba(255, 214, 194, ${0.72 - bakeRoast * 0.32})`;
        [[-0.32, -0.24, 0.14], [0.28, -0.14, 0.12], [-0.08, 0.32, 0.13], [0.22, 0.26, 0.1]].forEach(([dx, dy, dr]) => {
          ctx.beginPath();
          ctx.arc(dx * s, dy * s, dr * s, 0, Math.PI * 2);
          ctx.fill();
        });
        // Glistening rendered oil pool inside cupped pepperoni
        if (bake > 40 && burnDark < 0.55) {
          ctx.fillStyle = 'rgba(255, 214, 150, 0.32)';
          ctx.beginPath();
          ctx.ellipse(-s * 0.14, -s * 0.18, s * 0.36, s * 0.22, -0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'mushroom': {
        const cap = lerpColor('#e2d0b8', '#ad8760', bakeRoast);
        const gill = lerpColor('#82654c', '#4a3322', bakeRoast);
        ctx.fillStyle = burnDark > 0 ? lerpColor(cap, '#261b16', burnDark) : cap;
        ctx.beginPath();
        ctx.moveTo(-s * 0.95, s * 0.08);
        ctx.bezierCurveTo(-s * 0.95, -s * 0.92, s * 0.95, -s * 0.92, s * 0.95, s * 0.08);
        ctx.bezierCurveTo(s * 0.95, s * 0.34, s * 0.44, s * 0.34, s * 0.36, s * 0.34);
        ctx.lineTo(s * 0.32, s * 0.88);
        ctx.lineTo(-s * 0.32, s * 0.88);
        ctx.lineTo(-s * 0.36, s * 0.34);
        ctx.bezierCurveTo(-s * 0.44, s * 0.34, -s * 0.95, s * 0.34, -s * 0.95, s * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = gill;
        ctx.lineWidth = Math.max(1, s * 0.11);
        ctx.stroke();

        ctx.fillStyle = gill;
        ctx.beginPath();
        ctx.ellipse(-s * 0.55, s * 0.08, s * 0.24, s * 0.12, 0.24, 0, Math.PI * 2);
        ctx.ellipse(s * 0.55, s * 0.08, s * 0.24, s * 0.12, -0.24, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'basil': {
        const leaf = lerpColor('#2d8f3f', '#1c5224', bakeRoast);
        const lGrad = ctx.createLinearGradient(-s, -s, s, s);
        lGrad.addColorStop(0, burnDark > 0 ? '#182115' : lerpColor('#44ad53', '#235929', bakeRoast));
        lGrad.addColorStop(1, burnDark > 0 ? '#10140e' : leaf);
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.05);
        ctx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.85, s * 0.55, 0, s * 1.0);
        ctx.bezierCurveTo(-s * 0.85, s * 0.55, -s * 0.9, -s * 0.5, 0, -s * 1.05);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(176, 240, 158, 0.65)';
        ctx.lineWidth = Math.max(0.9, s * 0.1);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.72);
        ctx.lineTo(0, s * 0.82);
        ctx.moveTo(0, -s * 0.12);
        ctx.lineTo(s * 0.36, -s * 0.36);
        ctx.moveTo(0, s * 0.22);
        ctx.lineTo(-s * 0.34, -s * 0.04);
        ctx.stroke();
        break;
      }

      case 'olive': {
        ctx.fillStyle = '#23212a';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.74, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#e8cfa6';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.31, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(204, 200, 224, 0.55)';
        ctx.lineWidth = Math.max(1, s * 0.12);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.52, -2.5, -1.1);
        ctx.stroke();
        break;
      }

      case 'pepper': {
        const col = lerpColor('#32a641', '#226b2a', bakeRoast);
        ctx.strokeStyle = burnDark > 0 ? lerpColor(col, '#1c2418', burnDark) : col;
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2.6, s * 0.36);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.72, -Math.PI * 0.75, Math.PI * 0.25);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(195, 252, 169, 0.55)';
        ctx.lineWidth = Math.max(1, s * 0.1);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.72, -Math.PI * 0.65, Math.PI * 0.15);
        ctx.stroke();
        break;
      }

      case 'onion': {
        const outer = lerpColor('#873072', '#5e1e4f', bakeRoast);
        ctx.strokeStyle = burnDark > 0 ? lerpColor(outer, '#2b1826', burnDark) : outer;
        ctx.lineWidth = Math.max(2, s * 0.24);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.78, 0, Math.PI * 1.45);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(243, 212, 236, 0.82)';
        ctx.lineWidth = Math.max(1.2, s * 0.14);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.55, 0.15, Math.PI * 1.35);
        ctx.stroke();
        break;
      }

      case 'sausage': {
        const col = lerpColor('#824b2d', '#4d2713', bakeRoast);
        ctx.fillStyle = burnDark > 0 ? lerpColor(col, '#1f1511', burnDark) : col;
        ctx.beginPath();
        ctx.moveTo(-s * 0.68, -s * 0.25);
        ctx.quadraticCurveTo(-s * 0.2, -s * 0.85, s * 0.55, -s * 0.52);
        ctx.quadraticCurveTo(s * 0.92, 0.05, s * 0.45, s * 0.68);
        ctx.quadraticCurveTo(-s * 0.25, s * 0.88, -s * 0.74, s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#cf9c72';
        ctx.beginPath();
        ctx.arc(-s * 0.15, -s * 0.15, s * 0.13, 0, Math.PI * 2);
        ctx.arc(s * 0.24, s * 0.2, s * 0.11, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'jalapeno': {
        const col = lerpColor('#409c28', '#2a6319', bakeRoast);
        ctx.fillStyle = burnDark > 0 ? lerpColor(col, '#1e2618', burnDark) : col;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.78, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#e8f2a2';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b5a23a';
        [[-0.16, -0.14], [0.18, -0.06], [0, 0.18]].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'pineapple': {
        const col = lerpColor('#f5c631', '#cc8a12', bakeRoast);
        ctx.fillStyle = burnDark > 0 ? lerpColor(col, '#422c0c', burnDark) : col;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.86);
        ctx.lineTo(s * 0.82, s * 0.68);
        ctx.lineTo(-s * 0.82, s * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#fff5b5';
        ctx.lineWidth = Math.max(1, s * 0.12);
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, s * 0.12);
        ctx.lineTo(s * 0.35, s * 0.12);
        ctx.moveTo(-s * 0.48, s * 0.42);
        ctx.lineTo(s * 0.48, s * 0.42);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  function drawPizza(ctx, pizza, cx, cy, radius, opts = {}) {
    if (!pizza || !pizza.hasDough) return;
    const now = opts.now || performance.now();
    const bake = pizza.bake || 0;
    const seed = pizza.seed || pizza.id || 1;
    const popScale = 1 + Math.sin((pizza.doughPop || 0) * Math.PI) * 0.11;
    const r = radius * popScale;
    const crust = getCrustColors(bake);

    ctx.save();
    ctx.translate(cx, cy);

    // Rich grounded shadow
    ctx.save();
    ctx.shadowColor = 'rgba(26, 12, 4, 0.42)';
    ctx.shadowBlur = r * 0.18;
    ctx.shadowOffsetY = r * 0.07;
    ctx.fillStyle = crust.outer;
    traceOrganicCircle(ctx, r, seed, 0.025);
    ctx.fill();
    ctx.restore();

    // Hand-stretched puffy cornicione rim with warm directional shading
    const rimGrad = ctx.createRadialGradient(-r * 0.22, -r * 0.22, r * 0.45, 0, 0, r * 1.04);
    rimGrad.addColorStop(0, crust.inner);
    rimGrad.addColorStop(0.78, crust.outer);
    rimGrad.addColorStop(1, crust.rimDark);
    ctx.fillStyle = rimGrad;
    traceOrganicCircle(ctx, r, seed, 0.025);
    ctx.fill();

    // Puffed crust highlight lip + dusted raw semolina flour sheen
    ctx.strokeStyle = bake > 82 ? 'rgba(80, 50, 35, 0.24)' : 'rgba(255, 247, 232, 0.46)';
    ctx.lineWidth = Math.max(2, r * 0.06);
    traceOrganicCircle(ctx, r * 0.91, seed, 0.022);
    ctx.stroke();

    // Inner dough bed
    ctx.fillStyle = crust.inner;
    traceOrganicCircle(ctx, r * 0.84, seed, 0.02);
    ctx.fill();

    // Authentic Neapolitan wood-fired leoparding blisters along the puffed rim!
    if (bake > 38) {
      const bAlpha = Math.min(0.88, (bake - 38) / 46);
      ctx.fillStyle = `rgba(34, 15, 7, ${bAlpha * 0.78})`;
      for (let i = 0; i < 18; i++) {
        const ang = i * 2.39996 + (seed % 9) * 0.27;
        const dist = r * (0.86 + (i % 3) * 0.036);
        const br = r * (0.024 + (i % 4) * 0.013) * Math.min(1.45, bake / 58);
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * dist, Math.sin(ang) * dist, br * 1.35, br * 0.85, ang, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sauce layer
    if (pizza.sauce && pizza.sauceCoverage > 0) {
      const sauceSpec = C.SAUCES[pizza.sauce];
      const bakeShift = Math.max(0, Math.min(1, (bake - 25) / 65));
      const sauceCol =
        bake >= 88
          ? lerpColor(sauceSpec.dark, '#22110d', (bake - 88) / 12)
          : lerpColor(sauceSpec.color, sauceSpec.dark, bakeShift * 0.42);

      ctx.save();
      traceOrganicCircle(ctx, r * 0.83, seed, 0.018);
      ctx.clip();

      if (pizza.sauceCoverage > 0.22) {
        const baseAlpha = Math.min(0.96, (pizza.sauceCoverage - 0.12) * 1.15);
        const sGrad = ctx.createRadialGradient(-r * 0.1, -r * 0.1, r * 0.08, 0, 0, r * 0.84);
        sGrad.addColorStop(0, sauceSpec.highlight);
        sGrad.addColorStop(1, sauceCol);
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.36 + pizza.sauceCoverage * 0.48), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 0.88;
      ctx.fillStyle = sauceCol;
      for (const st of pizza.sauceStrokes) {
        ctx.beginPath();
        ctx.arc(st.x * r, st.y * r, st.r * r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crushed San Marzano tomato pulp & herb flecks
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = pizza.sauce === 'marinara' ? '#2c5c22' : pizza.sauce === 'pesto' ? '#dbe3aa' : '#6e5c47';
      for (let i = 0; i < 20; i++) {
        const a = i * 2.1 + 0.4;
        const d = r * (0.14 + ((i * 37) % 62) / 100);
        if (d < r * 0.78 * Math.min(1, pizza.sauceCoverage + 0.15)) {
          ctx.beginPath();
          ctx.arc(Math.cos(a) * d, Math.sin(a) * d, Math.max(1, r * 0.013), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Fior di Latte Melted Mozzarella Pools (lets rich red/green sauce peek through!)
    if (pizza.cheeseLevel > 0) {
      const melt = Math.max(0, Math.min(1, (bake - 10) / 48));
      const toast = Math.max(0, Math.min(1, (bake - 50) / 40));
      const burn = Math.max(0, Math.min(1, (bake - 88) / 12));

      ctx.save();
      traceOrganicCircle(ctx, r * 0.8, seed, 0.016);
      ctx.clip();

      if (melt > 0.05 || pizza.cheeseLevel >= 0.65) {
        const meltCol = burn > 0 ? lerpColor('#d99434', '#2e1d14', burn) : lerpColor('#fff7db', '#f7ce68', toast * 0.82);
        const edgeCol = burn > 0 ? lerpColor('#b8701c', '#1c100a', burn) : lerpColor('#f5e0a3', '#e0a034', toast * 0.85);

        ctx.fillStyle = meltCol;
        ctx.globalAlpha = Math.min(0.48, (0.14 + melt * 0.3) * Math.min(1.2, pizza.cheeseLevel));
        ctx.beginPath();
        ctx.arc(0, 0, r * Math.min(0.75, 0.36 + pizza.cheeseLevel * 0.34), 0, Math.PI * 2);
        ctx.fill();

        const poolCount = pizza.cheeseLevel >= 1.4 ? 14 : 10;
        ctx.globalAlpha = Math.min(0.86, (0.34 + melt * 0.48) * Math.min(1.15, pizza.cheeseLevel));
        for (let i = 0; i < poolCount; i++) {
          const ang = i * 2.39996 + (seed % 5) * 0.45;
          const dist = r * (i === 0 ? 0.08 : 0.24 + ((i * 31) % 44) / 100);
          const pr = r * (0.135 + (i % 3) * 0.042) * (0.75 + melt * 0.3);
          const px = Math.cos(ang) * dist;
          const py = Math.sin(ang) * dist;
          const pGrad = ctx.createRadialGradient(px - pr * 0.2, py - pr * 0.2, pr * 0.1, px, py, pr);
          pGrad.addColorStop(0, meltCol);
          pGrad.addColorStop(1, edgeCol);
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.ellipse(px, py, pr * 1.12, pr * 0.88, ang, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Raw/semi-melted shreds
      ctx.globalAlpha = Math.max(0.16, 1 - melt * 0.76);
      ctx.lineCap = 'round';
      for (const ch of pizza.cheeseSpecs) {
        ctx.strokeStyle = ch.extra ? '#fffbe8' : '#fff3c4';
        ctx.lineWidth = Math.max(1.8, r * (0.023 + melt * 0.015));
        ctx.save();
        ctx.translate(ch.x * r, ch.y * r);
        ctx.rotate(ch.angle);
        ctx.beginPath();
        ctx.moveTo(-ch.len * r * 0.5, 0);
        ctx.lineTo(ch.len * r * 0.5, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Caramelized golden-brown cheese blisters & olive oil shine when baked
      if (bake > 46) {
        const spotAlpha = Math.min(0.75, (bake - 46) / 42);
        ctx.globalAlpha = spotAlpha;
        ctx.fillStyle = burn > 0 ? '#24140d' : '#bf6717';
        for (let i = 0; i < 18; i++) {
          const a = i * 2.5 + (seed % 5) * 0.6;
          const d = r * (0.12 + ((i * 29) % 58) / 100);
          const sr = r * (0.021 + (i % 3) * 0.013);
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, sr * 1.25, sr * 0.85, a, 0, Math.PI * 2);
          ctx.fill();
        }
        if (burn < 0.4) {
          ctx.globalAlpha = spotAlpha * 0.36;
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 9; i++) {
            const a = i * 1.9 + 0.5;
            const d = r * (0.18 + ((i * 23) % 45) / 100);
            ctx.beginPath();
            ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.017, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // Half-and-Half divider hint on prep slab
    if (opts.showHalfLine) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(0, r * 0.85);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `700 ${Math.max(10, Math.round(r * 0.1))}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = 'rgba(45, 27, 20, 0.72)';
      ctx.textAlign = 'center';
      ctx.fillText('LEFT', -r * 0.44, -r * 0.62);
      ctx.fillText('RIGHT', r * 0.44, -r * 0.62);
      ctx.restore();
    }

    // Toppings
    for (const item of pizza.toppings) {
      drawToppingItem(ctx, item, 0, 0, r, bake, now);
    }

    // Burnt char haze
    if (bake >= 92) {
      ctx.fillStyle = `rgba(18, 11, 9, ${Math.min(0.65, (bake - 92) / 10)})`;
      traceOrganicCircle(ctx, r, seed, 0.025);
      ctx.fill();
    }

    // Crisp sliced seams
    if (pizza.cutLines && pizza.cutLines.length > 0) {
      ctx.save();
      traceOrganicCircle(ctx, r * 0.99, seed, 0.025);
      ctx.clip();
      for (const ang of pizza.cutLines) {
        const x1 = Math.cos(ang) * r * 1.06;
        const y1 = Math.sin(ang) * r * 1.06;
        ctx.strokeStyle = 'rgba(38, 19, 8, 0.75)';
        ctx.lineWidth = Math.max(2, r * 0.025);
        ctx.beginPath();
        ctx.moveTo(-x1, -y1);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 240, 208, 0.34)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-x1 + 1, -y1 + 1);
        ctx.lineTo(x1 + 1, y1 + 1);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  function resizeCanvasHiDPI(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  class ParticleSystem {
    constructor() {
      this.items = [];
    }

    spawnFlourPuff(x, y) {
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 35 + Math.random() * 88;
        this.items.push({
          kind: 'flour',
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          r: 6 + Math.random() * 13,
          alpha: 0.72,
          life: 0.45 + Math.random() * 0.25,
          age: 0,
        });
      }
    }

    spawnPopRing(x, y, color = '#f2c866') {
      this.items.push({
        kind: 'ring',
        x,
        y,
        r: 6,
        maxR: 24,
        color,
        life: 0.26,
        age: 0,
      });
    }

    spawnCrumbs(x1, y1, x2, y2) {
      for (let i = 0; i < 12; i++) {
        const t = Math.random();
        const x = lerp(x1, x2, t);
        const y = lerp(y1, y2, t);
        const a = Math.random() * Math.PI * 2;
        const sp = 25 + Math.random() * 65;
        this.items.push({
          kind: 'crumb',
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 20,
          r: 2 + Math.random() * 2.8,
          color: Math.random() < 0.5 ? '#df9a42' : '#fff0c2',
          life: 0.38 + Math.random() * 0.24,
          age: 0,
        });
      }
    }

    updateAndDraw(ctx, dt) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const p = this.items[i];
        p.age += dt;
        if (p.age >= p.life) {
          this.items.splice(i, 1);
          continue;
        }
        const k = p.age / p.life;
        ctx.save();
        if (p.kind === 'flour') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.91;
          p.vy *= 0.91;
          ctx.fillStyle = `rgba(255, 251, 242, ${(1 - k) * p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + k * 0.8), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - k) * 0.78;
          ctx.lineWidth = 2.2 * (1 - k * 0.5);
          ctx.beginPath();
          ctx.arc(p.x, p.y, lerp(p.r, p.maxR, k), 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 'crumb') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 120 * dt;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  // Render genuine piled ingredients inside each stainless steel makeline GN pan!
  function renderMakelinePanThumb(canvas, kind, id) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Chilled steel interior shadow
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#cfd4d9');
    bg.addColorStop(1, '#eef1f4');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (kind === 'dough') {
      // Two plump flour-dusted rising artisan dough balls in wood tray
      ctx.fillStyle = '#c49d72';
      ctx.fillRect(0, 0, w, h);
      [w * 0.34, w * 0.68].forEach((dx) => {
        const g = ctx.createRadialGradient(dx - 4, h * 0.42, 2, dx, h * 0.52, 20);
        g.addColorStop(0, '#fffaf0');
        g.addColorStop(1, '#e0c69c');
        ctx.fillStyle = g;
        ctx.shadowColor = 'rgba(42, 24, 10, 0.28)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(dx, h * 0.54, Math.min(w, h) * 0.34, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    if (kind === 'sauce') {
      const s = C.SAUCES[id];
      const sg = ctx.createRadialGradient(w * 0.38, h * 0.38, 4, w * 0.5, h * 0.5, w * 0.65);
      sg.addColorStop(0, s.highlight);
      sg.addColorStop(1, s.dark);
      ctx.fillStyle = sg;
      ctx.fillRect(3, 3, w - 6, h - 6);
      // Gleaming stainless steel ladle resting inside pan!
      ctx.save();
      ctx.strokeStyle = '#e6ebef';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.55, h * 0.55);
      ctx.lineTo(w * 0.88, h * 0.14);
      ctx.stroke();
      ctx.fillStyle = '#cfd7de';
      ctx.beginPath();
      ctx.arc(w * 0.48, h * 0.62, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(w * 0.48, h * 0.62, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (kind === 'cheese') {
      ctx.fillStyle = '#f5eedc';
      ctx.fillRect(2, 2, w - 4, h - 4);
      ctx.lineCap = 'round';
      for (let i = 0; i < 42; i++) {
        const x = 8 + ((i * 23) % (w - 16));
        const y = 8 + ((i * 17) % (h - 16));
        const a = (i * 1.1) % Math.PI;
        ctx.strokeStyle = i % 3 === 0 ? '#fffdf5' : '#f7df99';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7);
        ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
        ctx.stroke();
      }
      return;
    }

    // Toppings: render dense appetizing mound inside stainless GN pan!
    const coords = [
      [0.24, 0.3], [0.54, 0.28], [0.78, 0.34],
      [0.34, 0.58], [0.64, 0.6], [0.22, 0.76],
      [0.5, 0.78], [0.78, 0.74], [0.46, 0.46],
    ];
    coords.forEach(([ux, uy], i) => {
      drawToppingItem(
        ctx,
        { id, x: 0, y: 0, angle: i * 0.85, scale: 1.05, bornAt: 0 },
        ux * w,
        uy * h,
        Math.min(w, h) * 1.08,
        0,
        10000
      );
    });
  }

  function renderPrepStation(canvas, state, particles, dt, now) {
    const info = resizeCanvasHiDPI(canvas);
    if (!info) return null;
    const { ctx, width, height } = info;
    ctx.clearRect(0, 0, width, height);

    // Real procedural Calacatta honed marble benchtop
    ctx.fillStyle = Tex.getPattern(ctx, 'marble');
    ctx.fillRect(0, 0, width, height);

    // Warm overhead pendant light pool
    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width, height) * 0.41;

    const spot = ctx.createRadialGradient(cx, cy * 0.9, radius * 0.2, cx, cy, Math.max(width, height) * 0.7);
    spot.addColorStop(0, 'rgba(255, 245, 224, 0.22)');
    spot.addColorStop(1, 'rgba(48, 30, 18, 0.22)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, width, height);

    // Soft dusted semolina flour patch on marble
    const dust = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.15);
    dust.addColorStop(0, 'rgba(255, 250, 240, 0.62)');
    dust.addColorStop(0.75, 'rgba(255, 248, 234, 0.18)');
    dust.addColorStop(1, 'rgba(255, 248, 234, 0)');
    ctx.fillStyle = dust;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Fine wooden peel ring subtle etching
    ctx.save();
    ctx.strokeStyle = 'rgba(130, 96, 68, 0.2)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.04, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (!state.prepPizza.hasDough) {
      ctx.save();
      ctx.fillStyle = 'rgba(92, 60, 38, 0.78)';
      ctx.font = '700 15.5px "Fredoka", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Grab Dough from the Makeline above — or click here', cx, cy - 4);
      ctx.fillStyle = 'rgba(128, 86, 56, 0.72)';
      ctx.font = '600 12.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Drag any pan straight onto the marble to build your pie', cx, cy + 17);
      ctx.restore();
    } else {
      const selGuest = state.getSelectedOrderGuest();
      const showHalf = !!(selGuest && selGuest.order.isHalfHalf);
      drawPizza(ctx, state.prepPizza, cx, cy, radius, { now, showHalfLine: showHalf });
    }

    particles.updateAndDraw(ctx, dt);
    return { cx, cy, radius };
  }

  function renderOvenSlotCanvas(canvas, pizza, ovenFinish, now) {
    const info = resizeCanvasHiDPI(canvas);
    if (!info) return;
    const { ctx, width, height } = info;
    ctx.clearRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.58;
    const radius = Math.min(width, height) * 0.35;

    // Stone Biscotto hearth deck backdrop
    const domeBg = ctx.createRadialGradient(cx, height * 0.22, 8, cx, height * 0.55, Math.max(width, height) * 0.75);
    domeBg.addColorStop(0, '#78260e');
    domeBg.addColorStop(0.5, '#3b150c');
    domeBg.addColorStop(1, '#190805');
    ctx.fillStyle = domeBg;
    ctx.fillRect(0, 0, width, height);

    // Subtle stone floor ellipse
    ctx.fillStyle = 'rgba(92, 52, 34, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.12, width * 0.46, height * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Roaring oak firewood & animated multi-layered wood fire at rear hearth arch!
    const fFlicker = Math.sin(now * 0.013 + cx) * 0.14 + Math.cos(now * 0.021) * 0.08;
    const fireX = cx;
    const fireY = height * 0.16;

    // Warm volumetric fire radiance across stone floor
    const glow = ctx.createRadialGradient(fireX, fireY + 8, 4, fireX, cy, Math.max(width, height) * 0.65);
    glow.addColorStop(0, `rgba(255, 188, 66, ${0.42 + fFlicker})`);
    glow.addColorStop(0.45, `rgba(224, 78, 22, ${0.24 + fFlicker * 0.5})`);
    glow.addColorStop(1, 'rgba(20, 8, 4, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Charred oak logs
    ctx.save();
    ctx.strokeStyle = '#29120a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 28, fireY + 12);
    ctx.lineTo(cx + 22, fireY + 6);
    ctx.moveTo(cx - 18, fireY + 5);
    ctx.lineTo(cx + 28, fireY + 14);
    ctx.stroke();

    // Animated dancing flames
    for (let f = -2; f <= 2; f++) {
      const sway = Math.sin(now * 0.012 + f * 1.7) * 5;
      const fh = (18 + (2 - Math.abs(f)) * 7) * (1 + fFlicker);
      const fx = cx + f * 11;
      const fg = ctx.createLinearGradient(fx, fireY + 10, fx + sway, fireY - fh);
      fg.addColorStop(0, '#ff6814');
      fg.addColorStop(0.55, '#ffb72b');
      fg.addColorStop(1, 'rgba(255, 245, 180, 0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(fx - 7, fireY + 10);
      ctx.quadraticCurveTo(fx - 2 + sway, fireY - fh * 0.4, fx + sway, fireY - fh);
      ctx.quadraticCurveTo(fx + 5 + sway, fireY - fh * 0.4, fx + 7, fireY + 10);
      ctx.fill();
    }
    ctx.restore();

    // Rising glowing embers
    for (let i = 0; i < 6; i++) {
      const phase = (now * 0.0009 + i * 0.37) % 1;
      const ex = cx + (i - 2.5) * 26 + Math.sin(now * 0.004 + i) * 7;
      const ey = height * (0.38 - phase * 0.34);
      ctx.fillStyle = `rgba(255, 214, 102, ${(1 - phase) * 0.72})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5 + (1 - phase) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Signature Dome rim tint (brick / hammered copper / gold mosaic)
    const rimCol =
      ovenFinish === 'mosaic'
        ? 'rgba(232, 182, 62, 0.45)'
        : ovenFinish === 'copper'
        ? 'rgba(214, 126, 74, 0.42)'
        : 'rgba(156, 76, 44, 0.32)';
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, height * 0.65, width * 0.48, Math.PI, 0);
    ctx.stroke();

    if (!pizza) {
      ctx.fillStyle = 'rgba(255, 224, 188, 0.45)';
      ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT STONE READY', cx, cy + 8);
      return;
    }

    drawPizza(ctx, pizza, cx, cy, radius, { now });

    // Smoke wisps when nearing burn
    if (pizza.bake >= 86) {
      const intensity = Math.min(1, (pizza.bake - 86) / 10);
      for (let i = 0; i < 5; i++) {
        const p = (now * 0.0014 + i * 0.21) % 1;
        const sx = cx + Math.sin(now * 0.005 + i * 2) * radius * 0.42;
        const sy = cy - p * radius * 1.1;
        ctx.fillStyle = `rgba(30, 24, 22, ${(1 - p) * 0.55 * intensity})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 6 + p * 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderCuttingBoard(canvas, pizza, dragLine, particles, dt, now) {
    const info = resizeCanvasHiDPI(canvas);
    if (!info) return null;
    const { ctx, width, height } = info;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = Tex.getPattern(ctx, 'walnut');
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width, height) * 0.4;

    // Circular butcher-block wooden serving peel
    ctx.save();
    const boardGrad = ctx.createRadialGradient(cx - radius * 0.22, cy - radius * 0.22, radius * 0.15, cx, cy, radius * 1.15);
    boardGrad.addColorStop(0, '#c28b54');
    boardGrad.addColorStop(1, '#8c5628');
    ctx.fillStyle = boardGrad;
    ctx.shadowColor = 'rgba(18, 8, 3, 0.42)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!pizza) {
      ctx.fillStyle = 'rgba(255, 241, 218, 0.78)';
      ctx.font = '700 13.5px "Fredoka", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click a baked pie in the Forno above', cx, cy - 4);
      ctx.font = '600 11.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 241, 218, 0.55)';
      ctx.fillText('to pull it onto the walnut cutting pass', cx, cy + 15);
      return { cx, cy, radius };
    }

    drawPizza(ctx, pizza, cx, cy, radius, { now });

    // Hot rising steam wisps
    if (pizza.bake >= 45 && pizza.bake < 94) {
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const p = (now * 0.00065 + i * 0.27) % 1;
        const sx = cx + (i - 1.5) * radius * 0.36 + Math.sin(now * 0.003 + i) * 6;
        const sy = cy - p * radius * 0.95;
        ctx.strokeStyle = `rgba(255, 250, 240, ${(1 - p) * 0.38})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy + 12);
        ctx.quadraticCurveTo(sx + 6, sy + 5, sx - 2, sy - 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (dragLine) {
      ctx.save();
      ctx.strokeStyle = '#fff9d6';
      ctx.shadowColor = '#f5a623';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.8;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(dragLine.x1, dragLine.y1);
      ctx.lineTo(dragLine.x2, dragLine.y2);
      ctx.stroke();
      ctx.restore();
    }

    particles.updateAndDraw(ctx, dt);
    return { cx, cy, radius };
  }

  FR.PizzaRenderer = {
    drawPizza,
    renderMakelinePanThumb,
    renderPrepStation,
    renderOvenSlotCanvas,
    renderCuttingBoard,
    ParticleSystem,
  };
})();
