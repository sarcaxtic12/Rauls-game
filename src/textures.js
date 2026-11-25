(function () {
  const FR = (window.FornoRush = window.FornoRush || {});

  const cache = {};

  function makeCanvas(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    return c;
  }

  function getPattern(ctx, key) {
    if (!cache[key]) {
      cache[key] = buildTexture(key);
    }
    return ctx.createPattern(cache[key], 'repeat');
  }

  function buildTexture(key) {
    switch (key) {
      case 'marble':
        return makeCanvas(256, 256, (c, w, h) => {
          c.fillStyle = '#f3eee7';
          c.fillRect(0, 0, w, h);
          // Soft mineral clouds
          for (let i = 0; i < 24; i++) {
            const x = (i * 73) % w;
            const y = (i * 109) % h;
            const r = 35 + (i % 5) * 18;
            const g = c.createRadialGradient(x, y, 4, x, y, r);
            g.addColorStop(0, 'rgba(218, 210, 200, 0.22)');
            g.addColorStop(1, 'rgba(243, 238, 231, 0)');
            c.fillStyle = g;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
          }
          // Calacatta gold/taupe mineral veins
          c.strokeStyle = 'rgba(155, 142, 128, 0.18)';
          c.lineWidth = 1.6;
          for (let v = 0; v < 5; v++) {
            c.beginPath();
            let x = (v * 57) % w;
            let y = 0;
            c.moveTo(x, y);
            for (let step = 1; step <= 8; step++) {
              x += Math.sin(step * 1.1 + v) * 20 + 10;
              y = (step / 8) * h;
              c.lineTo(x % (w + 40), y);
            }
            c.stroke();
          }
          c.strokeStyle = 'rgba(196, 174, 138, 0.14)';
          c.lineWidth = 0.9;
          for (let v = 0; v < 4; v++) {
            c.beginPath();
            c.moveTo(0, (v * 68 + 20) % h);
            c.bezierCurveTo(w * 0.3, (v * 68 + 5) % h, w * 0.7, (v * 68 + 42) % h, w, (v * 68 + 20) % h);
            c.stroke();
          }
        });

      case 'floor-oak':
        return makeCanvas(192, 96, (c, w, h) => {
          c.fillStyle = '#5e3d26';
          c.fillRect(0, 0, w, h);
          const plankH = 24;
          for (let row = 0; row < 4; row++) {
            const y = row * plankH;
            const shade = ['#68442a', '#5c3b24', '#634027', '#583721'][row];
            c.fillStyle = shade;
            c.fillRect(0, y, w, plankH - 1);
            // Wood grain streaks
            c.strokeStyle = 'rgba(34, 18, 9, 0.16)';
            c.lineWidth = 1;
            for (let g = 0; g < 5; g++) {
              c.beginPath();
              c.moveTo(0, y + 4 + g * 4);
              c.bezierCurveTo(w * 0.35, y + 3 + g * 4, w * 0.65, y + 6 + g * 4, w, y + 4 + g * 4);
              c.stroke();
            }
            // Staggered plank joints
            const jointX = (row * 64 + 32) % w;
            c.fillStyle = 'rgba(22, 11, 5, 0.35)';
            c.fillRect(jointX, y, 1.5, plankH);
            c.fillRect(0, y + plankH - 1.2, w, 1.2);
          }
        });

      case 'floor-terracotta':
        return makeCanvas(96, 96, (c, w, h) => {
          c.fillStyle = '#4a3529'; // grout
          c.fillRect(0, 0, w, h);
          const tiles = [
            [0, 0, '#9c4c33'], [48, 0, '#91452d'],
            [0, 48, '#8f442c'], [48, 48, '#a15036'],
          ];
          tiles.forEach(([tx, ty, col]) => {
            const g = c.createLinearGradient(tx, ty, tx + 46, ty + 46);
            g.addColorStop(0, col);
            g.addColorStop(1, '#7c3923');
            c.fillStyle = g;
            c.fillRect(tx + 2, ty + 2, 44, 44);
            c.fillStyle = 'rgba(255, 224, 194, 0.08)';
            c.fillRect(tx + 2, ty + 2, 44, 2);
          });
        });

      case 'floor-terrazzo':
        return makeCanvas(128, 128, (c, w, h) => {
          c.fillStyle = '#cdc0ae';
          c.fillRect(0, 0, w, h);
          const chips = ['#735e4d', '#a65d41', '#f2ece1', '#544d47', '#bfa27a', '#3d3936'];
          for (let i = 0; i < 65; i++) {
            const x = (i * 37 + 11) % w;
            const y = (i * 53 + 7) % h;
            const sz = 2.5 + (i % 5) * 1.4;
            c.fillStyle = chips[i % chips.length];
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + sz, y + sz * 0.3);
            c.lineTo(x + sz * 0.6, y + sz);
            c.lineTo(x - sz * 0.3, y + sz * 0.7);
            c.closePath();
            c.fill();
          }
          // Subtle brass divider line
          c.strokeStyle = 'rgba(166, 134, 74, 0.25)';
          c.lineWidth = 1;
          c.strokeRect(0.5, 0.5, w - 1, h - 1);
        });

      case 'floor-herringbone':
        return makeCanvas(96, 96, (c, w, h) => {
          c.fillStyle = '#382216';
          c.fillRect(0, 0, w, h);
          for (let y = 0; y < h; y += 24) {
            for (let x = 0; x < w; x += 24) {
              const alt = ((x + y) / 24) % 2 === 0;
              c.fillStyle = alt ? '#4d301f' : '#402719';
              c.fillRect(x + 1, y + 1, 22, 22);
              c.strokeStyle = 'rgba(255, 220, 180, 0.06)';
              c.beginPath();
              if (alt) {
                c.moveTo(x + 2, y + 22);
                c.lineTo(x + 22, y + 2);
              } else {
                c.moveTo(x + 2, y + 2);
                c.lineTo(x + 22, y + 22);
              }
              c.stroke();
            }
          }
        });

      case 'walnut':
        return makeCanvas(160, 160, (c, w, h) => {
          c.fillStyle = '#6b4024';
          c.fillRect(0, 0, w, h);
          for (let i = 0; i < 28; i++) {
            c.strokeStyle = i % 2 === 0 ? 'rgba(42, 20, 9, 0.16)' : 'rgba(176, 118, 72, 0.11)';
            c.lineWidth = 1.5 + (i % 3);
            const y = (i / 28) * h;
            c.beginPath();
            c.moveTo(0, y);
            c.bezierCurveTo(w * 0.3, y + 4, w * 0.7, y - 4, w, y);
            c.stroke();
          }
        });

      default:
        return makeCanvas(64, 64, (c, w, h) => {
          c.fillStyle = '#3b2418';
          c.fillRect(0, 0, w, h);
        });
    }
  }

  FR.Textures = { getPattern };
})();
