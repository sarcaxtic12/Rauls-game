(function () {
  const FR = (window.FornoRush = window.FornoRush || {});
  const C = FR.Config;

  function getCustomerMood(order) {
    if (order.leaving && order.leaveState) {
      return order.leaveState.mood;
    }
    const r = order.patience / order.maxPatience;
    if (r > 0.56) return 'happy';
    if (r > 0.28) return 'waiting';
    if (r > 0.14) return 'impatient';
    return 'angry';
  }

  function renderPortraitSVG(character, mood) {
    const isAngry = mood === 'angry';
    const isImpatient = mood === 'impatient';
    const isEcstatic = mood === 'ecstatic';
    const isDisappointed = mood === 'disappointed';

    // Hair / headwear layer
    let hairBack = '';
    let hairFront = '';
    switch (character.hairStyle) {
      case 'bob':
        hairBack = `<path d="M16 32 C16 12, 64 12, 64 32 L66 56 Q58 58 55 52 L25 52 Q22 58 14 56 Z" fill="${character.hair}"/>`;
        hairFront = `<path d="M22 28 Q40 16 58 28 Q52 22 40 23 Q28 22 22 28 Z" fill="${character.hair}"/>`;
        break;
      case 'cap':
        hairFront = `
          <path d="M20 28 C21 13, 59 13, 60 28 Z" fill="#d9462f"/>
          <path d="M18 27 Q42 22 68 27 Q62 31 40 29 Q24 29 18 27 Z" fill="#a82c1a"/>
          <circle cx="40" cy="21" r="3" fill="#ffd966"/>
        `;
        break;
      case 'bun':
        hairBack = `<circle cx="40" cy="11" r="9" fill="${character.hair}"/><path d="M19 32 C19 14, 61 14, 61 32 Z" fill="${character.hair}"/>`;
        hairFront = `<path d="M21 29 Q32 20 40 24 Q48 20 59 29 Q54 19 40 19 Q26 19 21 29 Z" fill="${character.hair}"/>`;
        break;
      case 'puffs':
        hairBack = `<circle cx="17" cy="21" r="10" fill="${character.hair}"/><circle cx="63" cy="21" r="10" fill="${character.hair}"/><path d="M20 30 C20 14, 60 14, 60 30 Z" fill="${character.hair}"/>`;
        hairFront = `<path d="M21 27 Q40 20 59 27" stroke="${character.accent}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
        break;
      case 'curly':
        hairBack = `<circle cx="24" cy="20" r="8" fill="${character.hair}"/><circle cx="34" cy="15" r="9" fill="${character.hair}"/><circle cx="46" cy="15" r="9" fill="${character.hair}"/><circle cx="56" cy="20" r="8" fill="${character.hair}"/>`;
        break;
      case 'beret':
        hairBack = `<path d="M22 30 C22 18, 58 18, 58 30 Z" fill="${character.hair}"/>`;
        hairFront = `
          <ellipse cx="42" cy="18" rx="23" ry="8" transform="rotate(-7 42 18)" fill="#2a2433"/>
          <path d="M40 9 L42 13" stroke="#2a2433" stroke-width="2.5" stroke-linecap="round"/>
        `;
        break;
      default: // quiff
        hairBack = `<path d="M20 32 C19 14, 61 14, 60 32 Z" fill="${character.hair}"/>`;
        hairFront = `<path d="M22 27 C24 14, 52 10, 58 24 C50 20, 32 22, 22 27 Z" fill="${character.hair}"/>`;
        break;
    }

    // Eyes
    let eyes = '';
    if (isEcstatic) {
      eyes = `
        <path d="M28 38 L31 35 L34 38" stroke="#2b1b14" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M46 38 L49 35 L52 38" stroke="#2b1b14" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="15" y="25" font-size="11">✨</text>
        <text x="58" y="24" font-size="11">✨</text>
      `;
    } else if (isAngry) {
      eyes = `
        <circle cx="31" cy="39" r="2.7" fill="#2b1b14"/>
        <circle cx="49" cy="39" r="2.7" fill="#2b1b14"/>
        <line x1="25" y1="32" x2="35" y2="35" stroke="#2b1b14" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="55" y1="32" x2="45" y2="35" stroke="#2b1b14" stroke-width="2.6" stroke-linecap="round"/>
      `;
    } else if (isImpatient) {
      eyes = `
        <circle cx="31" cy="39" r="2.6" fill="#2b1b14"/>
        <circle cx="49" cy="39" r="2.6" fill="#2b1b14"/>
        <line x1="26" y1="33" x2="35" y2="34" stroke="#2b1b14" stroke-width="2" stroke-linecap="round"/>
        <line x1="54" y1="33" x2="45" y2="34" stroke="#2b1b14" stroke-width="2" stroke-linecap="round"/>
      `;
    } else {
      eyes = `
        <circle cx="31" cy="38" r="2.7" fill="#2b1b14"/>
        <circle cx="32" cy="37" r="0.9" fill="#ffffff"/>
        <circle cx="49" cy="38" r="2.7" fill="#2b1b14"/>
        <circle cx="50" cy="37" r="0.9" fill="#ffffff"/>
      `;
    }

    // Accessories (Nonna glasses, Critic monocle & mustache)
    let extras = '';
    if (character.id === 'nonna') {
      extras += `
        <circle cx="31" cy="38" r="5.5" fill="none" stroke="#c7954a" stroke-width="1.6"/>
        <circle cx="49" cy="38" r="5.5" fill="none" stroke="#c7954a" stroke-width="1.6"/>
        <line x1="36.5" y1="38" x2="43.5" y2="38" stroke="#c7954a" stroke-width="1.6"/>
      `;
    }
    if (character.id === 'critic') {
      extras += `
        <circle cx="49" cy="38" r="6" fill="rgba(255,255,255,0.18)" stroke="#e3b149" stroke-width="1.8"/>
        <line x1="55" y1="40" x2="57" y2="52" stroke="#e3b149" stroke-width="1.2"/>
        <path d="M33 45 Q37 42 40 45 Q43 42 47 45" stroke="#473d3b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      `;
    }

    // Mouth
    let mouth = '';
    if (isEcstatic) {
      mouth = `<path d="M32 47 Q40 56 48 47 Z" fill="#a82b2b"/><path d="M34 48 Q40 51 46 48" stroke="#fff" stroke-width="1.4" fill="none"/>`;
    } else if (mood === 'happy') {
      mouth = `<path d="M34 47 Q40 53 46 47" stroke="#632b1c" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
    } else if (mood === 'waiting') {
      mouth = `<line x1="35" y1="48" x2="45" y2="48" stroke="#632b1c" stroke-width="2.2" stroke-linecap="round"/>`;
    } else if (isImpatient || isDisappointed) {
      mouth = `<path d="M34 50 Q40 46 46 50" stroke="#632b1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    } else {
      mouth = `<path d="M33 51 Q40 44 47 51" stroke="#6e1616" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    }

    // Emotion FX (sweat drop / anger puff)
    let fx = '';
    if (isImpatient) {
      fx = `<path d="M62 28 Q66 35 62 38 Q58 35 62 28 Z" fill="#6bc5ff" stroke="#2f85c4" stroke-width="1"/>`;
    } else if (isAngry) {
      fx = `
        <circle cx="15" cy="24" r="4" fill="#ff7366" opacity="0.85"/>
        <circle cx="66" cy="23" r="4.5" fill="#ff7366" opacity="0.85"/>
      `;
    }

    const cheekColor = isAngry ? '#ff6454' : '#f28b79';
    const cheekOpacity = isAngry ? '0.58' : '0.32';

    return `
      <svg class="portrait-svg mood-${mood}" viewBox="0 0 80 76" aria-hidden="true">
        <defs>
          <radialGradient id="bg-${character.id}" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="${character.isVip ? '#fff0c2' : '#fff7eb'}"/>
            <stop offset="100%" stop-color="${character.isVip ? '#f2cf7e' : '#f3dfc4'}"/>
          </radialGradient>
        </defs>
        <circle cx="40" cy="40" r="35" fill="url(#bg-${character.id})" stroke="${character.isVip ? '#d99f2b' : '#dfc39e'}" stroke-width="2.5"/>
        ${hairBack}
        <!-- Shoulders -->
        <path d="M14 74 C16 58, 64 58, 66 74 Z" fill="${character.shirt}"/>
        <path d="M33 59 L40 66 L47 59" fill="${character.accent}" opacity="0.9"/>
        <!-- Neck & Head -->
        <rect x="35" y="51" width="10" height="10" rx="4" fill="${character.skin}"/>
        <circle cx="21" cy="39" r="4.2" fill="${character.skin}"/>
        <circle cx="59" cy="39" r="4.2" fill="${character.skin}"/>
        <rect x="22" y="21" width="36" height="35" rx="17" fill="${character.skin}"/>
        <!-- Cheeks -->
        <ellipse cx="28" cy="44" rx="4.2" ry="2.4" fill="${cheekColor}" opacity="${cheekOpacity}"/>
        <ellipse cx="52" cy="44" rx="4.2" ry="2.4" fill="${cheekColor}" opacity="${cheekOpacity}"/>
        ${eyes}
        ${mouth}
        ${extras}
        ${hairFront}
        ${fx}
      </svg>
    `;
  }

  function renderToppingMiniIcon(toppingId, size = 18) {
    const s = size;
    switch (toppingId) {
      case 'pepperoni':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#c72b20" stroke="#851912" stroke-width="1.6"/><circle cx="9" cy="9" r="1.5" fill="#f6bfa8"/><circle cx="15" cy="10" r="1.2" fill="#f6bfa8"/><circle cx="11.5" cy="15.5" r="1.4" fill="#f6bfa8"/></svg>`;
      case 'mushroom':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M4 13 C4 6, 20 6, 20 13 C20 15, 16 15, 15 15 L15 20 L9 20 L9 15 C8 15, 4 15, 4 13 Z" fill="#e5d4be" stroke="#7d644d" stroke-width="1.6"/><path d="M7 13 Q12 15 17 13" stroke="#997c62" stroke-width="1.4" fill="none"/></svg>`;
      case 'basil':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 3 C18 7, 20 15, 12 21 C4 15, 6 7, 12 3 Z" fill="#2d9440" stroke="#185925" stroke-width="1.5"/><line x1="12" y1="6" x2="12" y2="19" stroke="#86e37a" stroke-width="1.4"/></svg>`;
      case 'olive':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#292830" stroke="#141317" stroke-width="1.5"/><circle cx="12" cy="12" r="3.6" fill="#fff6e8"/><path d="M8 7.5 A6 6 0 0 1 13 6" stroke="#6c6a7d" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
      case 'pepper':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M6 16 C6 9, 13 6, 18 9 C19 10, 18 12, 16 12 C13 11, 10 13, 10 16 C10 18, 6 18, 6 16 Z" fill="#34ab43" stroke="#1d6b27" stroke-width="1.6"/></svg>`;
      case 'onion':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#8d3679" stroke-width="3.2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#d99ccb" stroke-width="1.6"/></svg>`;
      case 'sausage':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M7 10 Q9 5 15 7 Q20 9 18 15 Q16 20 10 18 Q5 16 7 10 Z" fill="#824c2e" stroke="#4d2916" stroke-width="1.5"/><circle cx="11" cy="11" r="1.2" fill="#c7956d"/><circle cx="14.5" cy="14" r="1.1" fill="#c7956d"/></svg>`;
      case 'jalapeno':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#46a32e" stroke="#246114" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" fill="#e6f0a5"/><circle cx="10.5" cy="11" r="1" fill="#b5a44c"/><circle cx="13.8" cy="13" r="1" fill="#b5a44c"/></svg>`;
      case 'pineapple':
        return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M5 17 L12 5 L19 17 Z" fill="#f7c831" stroke="#b8850d" stroke-width="1.5" stroke-linejoin="round"/><line x1="9" y1="13" x2="15" y2="13" stroke="#fff2a8" stroke-width="1.4"/></svg>`;
      default:
        return '';
    }
  }

  function renderSliceMiniIcon(slices) {
    const lines = Math.round(slices / 2);
    let paths = '';
    for (let i = 0; i < lines; i++) {
      const a = (i * Math.PI) / lines;
      const x1 = 10 + Math.cos(a) * 8;
      const y1 = 10 + Math.sin(a) * 8;
      const x2 = 10 - Math.cos(a) * 8;
      const y2 = 10 - Math.sin(a) * 8;
      paths += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#7a4c28" stroke-width="1.2"/>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#f5d198" stroke="#99612e" stroke-width="1.4"/>${paths}</svg>`;
  }

  function renderOrderPreviewSVG(order) {
    const sauce = C.SAUCES[order.sauce];
    let itemsSvg = '';
    if (order.isHalfHalf) {
      const left = order.toppings.find((t) => t.side === 'left');
      const right = order.toppings.find((t) => t.side === 'right');
      const lc = left ? C.TOPPING_MAP[left.id].color : 'transparent';
      const rc = right ? C.TOPPING_MAP[right.id].color : 'transparent';
      itemsSvg = `
        <circle cx="13" cy="14" r="3" fill="${lc}"/>
        <circle cx="12" cy="23" r="3" fill="${lc}"/>
        <circle cx="25" cy="14" r="3" fill="${rc}"/>
        <circle cx="26" cy="23" r="3" fill="${rc}"/>
        <line x1="19" y1="4" x2="19" y2="34" stroke="#fff" stroke-width="1.3" stroke-dasharray="2 2"/>
      `;
    } else {
      const pts = [
        [13, 13], [25, 13], [19, 19], [13, 25], [25, 25], [19, 10],
      ];
      order.toppings.forEach((t, ti) => {
        const col = C.TOPPING_MAP[t.id].color;
        for (let k = ti; k < pts.length; k += order.toppings.length) {
          itemsSvg += `<circle cx="${pts[k][0]}" cy="${pts[k][1]}" r="2.7" fill="${col}"/>`;
        }
      });
    }

    return `
      <svg class="ticket-mini-pie" width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r="17" fill="#dfa052" stroke="#9c5f21" stroke-width="1.8"/>
        <circle cx="19" cy="19" r="13.5" fill="${sauce.color}"/>
        <circle cx="19" cy="19" r="12" fill="#fff1c4" opacity="${order.cheese === 'extra' ? '0.92' : '0.68'}"/>
        ${itemsSvg}
      </svg>
    `;
  }

  FR.CustomerRenderer = {
    getCustomerMood,
    renderPortraitSVG,
    renderToppingMiniIcon,
    renderSliceMiniIcon,
    renderOrderPreviewSVG,
  };
})();
