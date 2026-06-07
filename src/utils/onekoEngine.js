// Adapted from https://github.com/adryd325/oneko.js (MIT)

const SPRITE = '/assets/oneko.gif';
const SPEECH = ['meow', 'nice portfolio', 'pet me pls', 'i rate this 10/10', '...zzzz', 'wanna see my tricks?'];

const CHARACTER_FILTERS = {
  cat: 'none',
  dog: 'hue-rotate(30deg) saturate(0.8)',
  ghost: 'invert(1) opacity(0.7)',
};

const spriteSets = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
  scratchWallN: [[0, 0], [0, -1]],
  scratchWallS: [[-7, -1], [-6, -2]],
  scratchWallE: [[-2, -2], [-2, -3]],
  scratchWallW: [[-4, 0], [-4, -1]],
  tired: [[-3, -2]],
  sleeping: [[-2, 0], [-2, -1]],
  N: [[-1, -2], [-1, -3]],
  NE: [[0, -2], [0, -3]],
  E: [[-3, 0], [-3, -1]],
  SE: [[-5, -1], [-5, -2]],
  S: [[-6, -3], [-7, -2]],
  SW: [[-5, -3], [-6, -1]],
  W: [[-4, -2], [-4, -3]],
  NW: [[-1, 0], [-1, -1]],
};

export function createOnekoPet({ mountEl, onCharacterMenu }) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { destroy: () => {}, setVisible: () => {}, setCharacter: () => {}, spin: () => {} };
  }

  let nekoPosX = 80;
  let nekoPosY = window.innerHeight - 120;
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  let lastFrameTimestamp = 0;
  let visible = false;
  let character = 'cat';
  let dragging = false;
  let dragMoved = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let pinnedTitlebar = null;
  let spinUntil = 0;
  let bubbleUntil = 0;
  let rafId = 0;

  const nekoEl = document.createElement('div');
  nekoEl.id = 'oneko-pet';
  nekoEl.className = 'oneko-pet';
  nekoEl.setAttribute('aria-hidden', 'true');
  nekoEl.style.cssText =
    'width:32px;height:32px;position:fixed;pointer-events:auto;image-rendering:pixelated;cursor:grab;z-index:3;display:none;';
  nekoEl.style.backgroundImage = `url(${SPRITE})`;

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'oneko-bubble';
  bubbleEl.style.cssText =
    'position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:4px;padding:3px 8px;font-size:11px;white-space:nowrap;background:#fff;color:#111;border-radius:8px;opacity:0;pointer-events:none;transition:opacity 0.15s;font-family:system-ui,sans-serif;';
  nekoEl.appendChild(bubbleEl);

  const menuEl = document.createElement('div');
  menuEl.className = 'oneko-menu';
  menuEl.style.cssText =
    'position:fixed;display:none;flex-direction:column;gap:2px;padding:4px;background:rgba(30,30,32,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:8px;z-index:9999;font-size:12px;';
  ['cat', 'dog', 'ghost'].forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = key === 'dog' ? 'Dog (coming soon)' : key.charAt(0).toUpperCase() + key.slice(1);
    btn.style.cssText =
      'padding:6px 12px;border:none;background:transparent;color:#fff;text-align:left;border-radius:4px;cursor:pointer;';
    btn.onmouseenter = () => {
      btn.style.background = 'rgba(13,155,168,0.2)';
    };
    btn.onmouseleave = () => {
      btn.style.background = 'transparent';
    };
    btn.onclick = () => {
      setCharacter(key);
      menuEl.style.display = 'none';
      onCharacterMenu?.(key);
    };
    menuEl.appendChild(btn);
  });
  document.body.appendChild(menuEl);

  mountEl.appendChild(nekoEl);

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function applyPosition() {
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  function setCharacter(next) {
    character = next;
    nekoEl.style.filter = CHARACTER_FILTERS[next] ?? 'none';
  }

  function setVisible(v) {
    visible = v;
    nekoEl.style.display = v ? 'block' : 'none';
    if (v) applyPosition();
  }

  function showBubble(text) {
    bubbleEl.textContent = text;
    bubbleEl.style.opacity = '1';
    bubbleUntil = Date.now() + 2000;
  }

  function spin() {
    spinUntil = Date.now() + 500;
    nekoEl.style.transition = 'transform 0.5s ease';
    nekoEl.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      nekoEl.style.transition = '';
      nekoEl.style.transform = '';
    }, 500);
    showBubble(SPEECH[Math.floor(Math.random() * SPEECH.length)]);
  }

  function idle() {
    idleTime += 1;
    if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnimation == null) {
      const options = ['sleeping', 'scratchSelf'];
      idleAnimation = options[Math.floor(Math.random() * options.length)];
    }

    switch (idleAnimation) {
      case 'sleeping':
        if (idleAnimationFrame < 8) {
          setSprite('tired', 0);
          break;
        }
        setSprite('sleeping', Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case 'scratchSelf':
        setSprite('scratchSelf', idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite('idle', 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    if (!visible) return;

    if (Date.now() < bubbleUntil) {
      bubbleEl.style.opacity = '1';
    } else {
      bubbleEl.style.opacity = '0';
    }

    if (pinnedTitlebar?.isConnected) {
      const rect = pinnedTitlebar.getBoundingClientRect();
      nekoPosX = rect.left + rect.width - 40;
      nekoPosY = rect.top + rect.height / 2;
      applyPosition();
      setSprite('idle', 0);
      return;
    }

    if (dragging) return;

    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < 10 || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite('alert', 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = '';
    direction += diffY / distance > 0.5 ? 'N' : '';
    direction += diffY / distance < -0.5 ? 'S' : '';
    direction += diffX / distance > 0.5 ? 'W' : '';
    direction += diffX / distance < -0.5 ? 'E' : '';
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * 10;
    nekoPosY -= (diffY / distance) * 10;
    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);
    applyPosition();
  }

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;
    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    rafId = window.requestAnimationFrame(onAnimationFrame);
  }

  const onMouseMove = (e) => {
    mousePosX = e.clientX;
    mousePosY = e.clientY;
    if (dragging) {
      nekoPosX = e.clientX - dragOffsetX;
      nekoPosY = e.clientY - dragOffsetY;
      if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) dragMoved = true;
      applyPosition();
    }
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    dragMoved = false;
    pinnedTitlebar = null;
    dragOffsetX = e.clientX - nekoPosX;
    dragOffsetY = e.clientY - nekoPosY;
    nekoEl.style.cursor = 'grabbing';
  };

  const onMouseUp = (e) => {
    if (!dragging) return;
    dragging = false;
    nekoEl.style.cursor = 'grab';
    const titlebar = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-window-titlebar]');
    if (titlebar) {
      pinnedTitlebar = titlebar;
    }
  };

  const onClick = (e) => {
    if (dragMoved) return;
    if (e.detail === 1) spin();
  };

  const onContextMenu = (e) => {
    e.preventDefault();
    menuEl.style.display = 'flex';
    menuEl.style.left = `${e.clientX}px`;
    menuEl.style.top = `${e.clientY}px`;
  };

  const onDocClick = (e) => {
    if (!menuEl.contains(e.target)) menuEl.style.display = 'none';
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('click', onDocClick);
  nekoEl.addEventListener('mousedown', onMouseDown);
  nekoEl.addEventListener('click', onClick);
  nekoEl.addEventListener('contextmenu', onContextMenu);

  setCharacter('cat');
  applyPosition();
  rafId = window.requestAnimationFrame(onAnimationFrame);

  return {
    destroy: () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('click', onDocClick);
      nekoEl.remove();
      menuEl.remove();
    },
    setVisible,
    setCharacter,
    spin,
    showBubble,
  };
}
