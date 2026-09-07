/* ================================================================
   CINEMATIC SORRY — script.js
   ================================================================

   HOW TO CUSTOMISE (quick reference):
   ─────────────────────────────────────────────────────────────────
   1. PHONE NUMBER  → search: "CORRECT_NUMBER" (line ~20)
   2. OPENING TEXT  → search: "TYPEWRITER_LINES" (line ~120)
   3. MEMORY CARDS  → search: "MEMORY_CARDS" (line ~280)
   4. VIDEO FILE    → assets/video.mp4 (in index.html)
   5. MUSIC FILE    → assets/music.mp3 (in index.html)
   6. THANK-YOU MSG → in index.html → #scene-5 .celeb-body
   ─────────────────────────────────────────────────────────────────

   ARCHITECTURE:
   • currentScene (number): the active scene index (0–5)
   • showScene(n): hides all, shows scene n, starts its logic
   • activeTimers (array): every setTimeout/setInterval ID is
     pushed here; clearAllTimers() clears them all before each
     scene switch to prevent leakage
   ================================================================ */

'use strict';

/* ================================================================
   ██████  CONFIG — EDIT THESE
   ================================================================ */

// ─────────────────────────────────────────────────────────────────
// Allowed phone numbers — add as many as you need.
// Accepts any format: '7505150687', '+917505150687', '07505150687'
// The check normalises all formats to the last 10 digits.
// ─────────────────────────────────────────────────────────────────
const CORRECT_NUMBERS = [
  '7505150687',  // Number 1
  '8924097106',  // Number 2
];

// ─────────────────────────────────────────────────────────────────
// Scene 1 — Typewriter lines.
// Each string types out, then pauses, then erases, then the next
// types. After the last line the scene auto-advances.
// You can add / remove lines freely.
// ─────────────────────────────────────────────────────────────────
const TYPEWRITER_LINES = [
  'I know I hurt you yrrr... 😟💔',
  'And I\'m genuinely sorry yrrr shruti🥺',
  'yrrr, m tumhe bilkul bhi pareshan nhi krna chahta... sch m nhi yrrrr. 💛 Tumse masti karta hoon yrrr, thoda tang karta hoon... par tumhe hurt karne ka kbhi intention nahi hota. 🥺',
  'Aakhir tumhe pareshan karke mujhe milega hi kya yrrr? 😟',
  'Bas tum naraz mat hua karo mujhse... tumari narazgi mujhse dekhi nahi jaati. 🥹',
  'Galti ho gayi yrrr... 😔',
  'please mujhe aise akela mat chhodna yrrrr... 💛',
  'Rok lo yrrr... dubne se. 😑😥',
  'Thoda sa haath pakad lo... baaki m khud sambhal jaunga. 🥺🫶'
];

// ─────────────────────────────────────────────────────────────────
// Scene 3 — Memory card data.
// image: path to photo (null → beautiful gradient placeholder)
// label: small caption above the quote (e.g. "a memory")
// quote: the main handwritten-font emotional line
// ─────────────────────────────────────────────────────────────────
const MEMORY_CARDS = [
  {
    image: null,                 // or 'assets/photo1.jpg'
    gradClass: 'reel-card--grad-1',
    label: 'a memory',
    quote: 'Remember when we laughed\ntill we couldn\'t breathe?',
  },
  {
    image: null,                 // or 'assets/photo2.jpg'
    gradClass: 'reel-card--grad-2',
    label: 'something I carry',
    quote: 'You\'ve been my safe place\nfor longer than you know.',
  },
  {
    image: null,                 // or 'assets/photo3.jpg'
    gradClass: 'reel-card--grad-3',
    label: 'a promise',
    quote: 'I don\'t want to lose you.\nNot over this. Not over anything.',
  },
];

// Duration each memory card is visible (ms)
const MEMORY_CARD_DURATION = 3800;

// Fallback duration for Scene 2 if video file is missing (ms)
const VIDEO_FALLBACK_DURATION = 8000;

// How many times No button dodges before giving up
const NO_DODGE_LIMIT = 6;

// Proximity radius (px) — No button flees when cursor is this close
const DODGE_PROXIMITY = 130;

/* ================================================================
   ██████  SCENE MANAGER
   ================================================================ */

let currentScene = -1;
let activeTimers = [];

/**
 * Push a setTimeout or setInterval ID so it can be cleared later.
 * Usage: addTimer(setTimeout(fn, delay))
 */
function addTimer(id) {
  activeTimers.push(id);
  return id;
}

/** Clear every pending timer — called before switching scenes. */
function clearAllTimers() {
  activeTimers.forEach(id => {
    clearTimeout(id);
    clearInterval(id);
  });
  activeTimers = [];
}

/**
 * showScene(n) — the core of the state machine.
 * 1. Clears all pending timers from the previous scene.
 * 2. Marks previous scene as exiting (fade-out CSS class).
 * 3. Removes exit class after transition duration.
 * 4. Activates scene n.
 * 5. Calls the scene's init function.
 */
function showScene(n) {
  clearAllTimers();

  const prev = document.querySelector('.scene--active');
  if (prev) {
    prev.classList.remove('scene--active');
    prev.classList.add('scene--exit');
    prev.setAttribute('aria-hidden', 'true');
    // Remove exit class after transition completes (900ms)
    setTimeout(() => prev.classList.remove('scene--exit'), 950);
  }

  const next = document.getElementById(`scene-${n}`);
  if (!next) return;

  // Small delay so opacity transition from 0→1 is visible
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      next.classList.add('scene--active');
      next.removeAttribute('aria-hidden');
    });
  });

  currentScene = n;

  // Run the scene's specific init logic
  const sceneInits = [
    initScene0,
    initScene1,
    initScene2,
    initScene3,
    initScene4,
    initScene5,
  ];
  if (sceneInits[n]) sceneInits[n]();
}

/* ================================================================
   ██████  SCENE 0 — AUTHENTICATION GATE
   ================================================================ */
function initScene0() {
  const input = document.getElementById('number-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const gateForm = document.getElementById('gate-form');
  const gateError = document.getElementById('gate-error');

  // Clear input and error on replay
  if (input) input.value = '';
  if (gateError) {
    gateError.classList.remove('gate-error--visible');
  }

  // Focus the input after scene transition settles
  addTimer(setTimeout(() => {
    if (input) input.focus();
  }, 900));

  /** Normalise any phone format to the last 10 digits */
  function normalise(raw) {
    return raw.replace(/\D/g, '').slice(-10);
  }

  function handleUnlock() {
    const entered = normalise(input.value);
    const isCorrect = CORRECT_NUMBERS.some(n => normalise(n) === entered);

    if (isCorrect) {
      // ✅ Correct — start music (MUST be inside user-click handler
      //    for browser autoplay policy) then transition
      music.play().catch(() => {
        // Autoplay blocked — music will try again on next user action
      });

      // ── PRE-ACTIVATE VIDEO AUDIO ────────────────────────────────
      // Browsers only allow audio if triggered by a direct user gesture.
      // By the time Scene 2 loads (after typewriter delays) the gesture
      // context from this Unlock click will have expired.
      // Solution: play + immediately pause the video RIGHT HERE, while
      // we are still inside the click handler. This "unlocks" the video
      // element for future unmuted playback without needing another tap.
      const videoEl = document.getElementById('scene2-video');
      if (videoEl) {
        videoEl.muted = false;
        videoEl.play()
          .then(() => videoEl.pause())
          .catch(() => {
            // Pre-activation failed (e.g. strict browser policy).
            // Scene 2 will fall back to muted + show the tap hint.
            videoEl.muted = true;
          });
      }
      // ────────────────────────────────────────────────────────────

      // Show mute button
      muteBtn.hidden = false;

      // Graceful crossfade to Scene 1
      showScene(1);

    } else {
      // ❌ Wrong — shake the form + show error
      gateForm.classList.remove('shake');

      // Force reflow so re-adding the class triggers animation again
      void gateForm.offsetWidth;
      gateForm.classList.add('shake');
      gateError.classList.add('gate-error--visible');

      input.select();
    }
  }

  // Enter key on input
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUnlock();
    });
  }

  if (unlockBtn) {
    unlockBtn.addEventListener('click', handleUnlock);
  }
}

/* ================================================================
   ██████  SCENE 1 — TYPEWRITER
   ================================================================ */
function initScene1() {
  const lineEl = document.getElementById('typewriter-line');
  const cursorEl = document.getElementById('typewriter-cursor');

  if (!lineEl) return;

  lineEl.textContent = '';
  let lineIndex = 0;
  let charIndex = 0;
  let isErasing = false;
  let typingTimer = null;

  const TYPE_SPEED = 55;  // ms per character when typing
  const ERASE_SPEED = 30;  // ms per character when erasing
  const PAUSE_AFTER = 2000; // ms to pause at end of each line
  const PAUSE_BEFORE = 300;  // ms before starting to erase

  function tick() {
    const currentLine = TYPEWRITER_LINES[lineIndex];

    if (!isErasing) {
      // Typing forward
      if (charIndex < currentLine.length) {
        lineEl.textContent = currentLine.slice(0, charIndex + 1);
        charIndex++;
        typingTimer = addTimer(setTimeout(tick, TYPE_SPEED));
      } else {
        // Finished typing this line
        const isLast = lineIndex === TYPEWRITER_LINES.length - 1;
        if (isLast) {
          // Last line — pause cursor, then auto-advance to Scene 2
          if (cursorEl) cursorEl.style.animationPlayState = 'paused';
          addTimer(setTimeout(() => showScene(2), PAUSE_AFTER + 800));
        } else {
          // Pause then start erasing
          typingTimer = addTimer(setTimeout(() => {
            isErasing = true;
            tick();
          }, PAUSE_AFTER));
        }
      }
    } else {
      // Erasing
      if (charIndex > 0) {
        charIndex--;
        lineEl.textContent = currentLine.slice(0, charIndex);
        typingTimer = addTimer(setTimeout(tick, ERASE_SPEED));
      } else {
        // Done erasing — move to next line
        isErasing = false;
        lineIndex++;
        typingTimer = addTimer(setTimeout(tick, PAUSE_BEFORE));
      }
    }
  }

  // Start typing after a short scene-in delay
  addTimer(setTimeout(tick, 600));
}

/* ================================================================
   ██████  SCENE 2 — VIDEO
   ================================================================ */
function initScene2() {
  const video = document.getElementById('scene2-video');
  const placeholder = document.getElementById('video-placeholder');
  const soundBtn = document.getElementById('video-sound-btn');

  if (!video) return;

  let advancedAlready = false;

  function advanceToScene3() {
    if (advancedAlready) return;
    advancedAlready = true;
    showScene(3);
  }

  // Play unmuted — audio was pre-activated in the Unlock click handler.
  // If the pre-activation succeeded, this plays with sound immediately.
  // If it failed (strict browser), video.muted is still true and the
  // tap-for-sound fallback below handles it.
  video.muted = false;
  const playPromise = video.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        // Video is playing with sound — hide placeholder and sound hint
        if (placeholder) placeholder.classList.add('hidden');
        if (soundBtn) soundBtn.classList.add('video-sound-btn--hidden');
      })
      .catch(() => {
        // Unmuted play blocked — mute and retry (always allowed)
        video.muted = true;
        const mutedPlay = video.play();
        if (mutedPlay !== undefined) {
          mutedPlay
            .then(() => {
              if (placeholder) placeholder.classList.add('hidden');
              // Sound hint stays visible so user can tap to unmute
            })
            .catch(() => {
              // Video file missing — keep placeholder, advance after fallback
              addTimer(setTimeout(advanceToScene3, VIDEO_FALLBACK_DURATION));
            });
        }
      });
  }

  // Advance when video finishes
  video.addEventListener('ended', advanceToScene3, { once: true });

  // Safety net: advance after 3 minutes max (very long video guard)
  addTimer(setTimeout(advanceToScene3, 3 * 60 * 1000));

  // "Tap for sound" button — shown only if unmuted play was blocked above
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      video.muted = false;
      soundBtn.classList.add('video-sound-btn--hidden');
    }, { once: true });

    // Auto-hide after 5 s even if not tapped
    addTimer(setTimeout(() => {
      soundBtn.classList.add('video-sound-btn--hidden');
    }, 5000));
  }
}

/* ================================================================
   ██████  SCENE 3 — MEMORY REEL
   ================================================================ */
function initScene3() {
  const stage = document.getElementById('reel-stage');
  const dotsEl = document.getElementById('reel-dots');

  if (!stage) return;

  // Build card DOM elements from MEMORY_CARDS config
  stage.innerHTML = '';
  const cards = MEMORY_CARDS.map((data, i) => {
    const card = document.createElement('div');
    card.className = `reel-card ${data.gradClass || ''}`;

    // Background (image or gradient)
    const bg = document.createElement('div');
    bg.className = 'reel-card__bg';
    if (data.image) {
      bg.style.backgroundImage = `url('${data.image}')`;
    }
    card.appendChild(bg);

    // Dark overlay
    const overlay = document.createElement('div');
    overlay.className = 'reel-card__overlay';
    card.appendChild(overlay);

    // Text block
    const text = document.createElement('div');
    text.className = 'reel-card__text';

    const label = document.createElement('p');
    label.className = 'reel-card__label';
    label.textContent = data.label;

    const quote = document.createElement('p');
    quote.className = 'reel-card__quote';
    // Support newline \n in quotes
    quote.innerHTML = data.quote.replace(/\n/g, '<br/>');

    text.appendChild(label);
    text.appendChild(quote);
    card.appendChild(text);

    stage.appendChild(card);
    return card;
  });

  // Update progress dots
  const dots = dotsEl ? dotsEl.querySelectorAll('.reel-dot') : [];

  let currentCard = 0;

  function showCard(index) {
    cards.forEach((c, i) => {
      c.classList.toggle('reel-card--active', i === index);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('reel-dot--active', i === index);
    });
  }

  function nextCard() {
    currentCard++;
    if (currentCard < cards.length) {
      showCard(currentCard);
      addTimer(setTimeout(nextCard, MEMORY_CARD_DURATION));
    } else {
      // All cards shown — advance to Scene 4
      addTimer(setTimeout(() => showScene(4), 600));
    }
  }

  // Show first card immediately
  showCard(0);
  addTimer(setTimeout(nextCard, MEMORY_CARD_DURATION));
}

/* ================================================================
   ██████  SCENE 4 — INTERACTIVE FORGIVENESS (DODGE LOGIC)
   ================================================================ */
function initScene4() {
  const arena = document.getElementById('ask-arena');
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const tiredMsg = document.getElementById('ask-tired-msg');

  if (!yesBtn || !noBtn || !arena) return;

  // Reset state (in case of replay)
  let dodgeCount = 0;
  let isAbsolute = false;
  let isTired = false;

  noBtn.style.fontSize = '';
  noBtn.style.opacity = '1';
  noBtn.classList.remove('ask-btn--no--absolute', 'ask-btn--no--tired');
  yesBtn.style.fontSize = '';
  if (tiredMsg) {
    tiredMsg.classList.remove('ask-tired-msg--visible');
    tiredMsg.style.opacity = '';
  }

  // Yes button font sizes grow array
  const YES_SIZES = [1.0, 1.08, 1.18, 1.28, 1.4, 1.55];
  const NO_SIZES = [0.95, 0.88, 0.78, 0.68, 0.58, 0.0];

  /**
   * Convert noBtn from flow to absolutely-positioned within arena.
   * This lets us freely set left/top to move it around.
   */
  function makeAbsolute() {
    if (isAbsolute) return;

    const arenaRect = arena.getBoundingClientRect();
    const noBtnRect = noBtn.getBoundingClientRect();

    // Capture current natural size before switching
    const w = noBtn.offsetWidth;
    const h = noBtn.offsetHeight;

    // Absolute position matching current layout position
    const initLeft = noBtnRect.left - arenaRect.left;
    const initTop = noBtnRect.top - arenaRect.top;

    noBtn.style.width = w + 'px';
    noBtn.style.height = h + 'px';
    noBtn.style.left = initLeft + 'px';
    noBtn.style.top = initTop + 'px';
    noBtn.style.margin = '0';

    noBtn.classList.add('ask-btn--no--absolute');

    // Ensure arena is tall enough for movement
    arena.style.minHeight = (arenaRect.height + 120) + 'px';
    arena.style.position = 'relative';

    isAbsolute = true;
  }

  /**
   * Calculate a new random position for No that is:
   * - Within the arena bounds (with margin)
   * - Far from the Yes button (so they don't overlap)
   * - Far from the cursor
   */
  function dodge(cursorX, cursorY) {
    if (isTired) return;

    if (!isAbsolute) makeAbsolute();

    const arenaRect = arena.getBoundingClientRect();
    const bW = noBtn.offsetWidth || 70;
    const bH = noBtn.offsetHeight || 44;
    const margin = 16;

    const maxX = arenaRect.width - bW - margin;
    const maxY = arenaRect.height - bH - margin;

    // Get cursor position relative to arena
    const relCX = cursorX - arenaRect.left;
    const relCY = cursorY - arenaRect.top;

    let bestX, bestY, bestDist = -1;

    // Try 20 random positions; pick the one farthest from cursor
    for (let i = 0; i < 20; i++) {
      const tx = rand(margin, maxX);
      const ty = rand(margin, maxY);
      const cx = tx + bW / 2;
      const cy = ty + bH / 2;
      const dist = Math.hypot(cx - relCX, cy - relCY);
      if (dist > bestDist) {
        bestDist = dist;
        bestX = tx;
        bestY = ty;
      }
    }

    noBtn.style.left = bestX + 'px';
    noBtn.style.top = bestY + 'px';

    dodgeCount++;

    // Visual nudge: Yes grows, No shrinks
    const yIdx = Math.min(dodgeCount - 1, YES_SIZES.length - 1);
    const nIdx = Math.min(dodgeCount - 1, NO_SIZES.length - 1);
    yesBtn.style.fontSize = YES_SIZES[yIdx] + 'rem';

    if (NO_SIZES[nIdx] > 0) {
      noBtn.style.fontSize = NO_SIZES[nIdx] + 'rem';
    }

    // After DODGE_LIMIT, No gives up and fades out
    if (dodgeCount >= NO_DODGE_LIMIT) {
      isTired = true;
      noBtn.classList.add('ask-btn--no--tired');
      if (tiredMsg) tiredMsg.classList.add('ask-tired-msg--visible');
    }
  }

  // ── DESKTOP: mousemove proximity detection ──────────────────────
  // Listen on the whole document so we catch cursor approach from any angle
  function handleMouseMove(e) {
    if (isTired) return;

    const rect = noBtn.getBoundingClientRect();
    const btnCX = rect.left + rect.width / 2;
    const btnCY = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - btnCX, e.clientY - btnCY);

    if (dist < DODGE_PROXIMITY) {
      dodge(e.clientX, e.clientY);
    }
  }

  // ── MOBILE: touchstart on button ────────────────────────────────
  function handleTouch(e) {
    if (isTired) return;
    e.preventDefault(); // prevent ghost click
    const touch = e.touches[0];
    if (touch) dodge(touch.clientX, touch.clientY);
  }

  document.addEventListener('mousemove', handleMouseMove);
  noBtn.addEventListener('touchstart', handleTouch, { passive: false });

  // ── YES BUTTON ──────────────────────────────────────────────────
  yesBtn.addEventListener('click', () => {
    document.removeEventListener('mousemove', handleMouseMove);
    noBtn.removeEventListener('touchstart', handleTouch);
    showScene(5);
  });
}

/* ================================================================
   ██████  SCENE 5 — CELEBRATION
   ================================================================ */
function initScene5() {
  // Start confetti
  launchConfetti();

  // Second burst for extra drama
  addTimer(setTimeout(launchConfetti, 1200));
  addTimer(setTimeout(launchConfetti, 2600));

  // Replay button
  const replayBtn = document.getElementById('replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', replayExperience, { once: true });
  }

  // Optionally bring music back to full volume if it was dimmed
  if (music && !music.paused) {
    music.volume = 1;
  }
}

/* ================================================================
   ██████  CONFETTI — pure canvas, no external library
   ================================================================ */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COUNT = 180;
  const COLORS = [
    '#f4a9c8', '#e87bac', '#ff8fab', '#f9b8d4',  // hot pinks
    '#c96ea8', '#e8a0c0', '#ffb3cb', '#d46a9f',  // deep rose
    '#f0c0dc', '#f8d7e8', '#ffffff', '#fce4ec',  // soft blush / white
  ];

  let particles = Array.from({ length: COUNT }, () => ({
    x: canvas.width * Math.random(),
    y: canvas.height * Math.random() * 0.5 - canvas.height * 0.5,
    vx: rand(-3.5, 3.5),
    vy: rand(2, 7),
    size: rand(5, 13),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: ['circle', 'rect', 'star'][Math.floor(Math.random() * 3)],
    angle: rand(0, Math.PI * 2),
    angV: rand(-0.1, 0.1),
    alpha: 1,
    decay: rand(0.007, 0.014),
  }));

  function drawStar(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI / 2.5) * i - Math.PI / 2;
      const ai = a + Math.PI / 5;
      i === 0
        ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(ai) * r * 0.42, cy + Math.sin(ai) * r * 0.42);
    }
    ctx.closePath();
  }

  let animId;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let anyAlive = false;

    particles.forEach(p => {
      if (p.alpha <= 0) return;
      anyAlive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;          // gravity
      p.angle += p.angV;
      p.alpha = Math.max(0, p.alpha - p.decay);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        drawStar(0, 0, p.size / 2);
        ctx.fill();
      }

      ctx.restore();
    });

    if (anyAlive) {
      animId = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  if (animId) cancelAnimationFrame(animId);
  tick();
}

/* ================================================================
   ██████  STARS / PARTICLE BACKGROUND
   Soft floating particle field visible through transparent scenes.
   ================================================================ */
(function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COUNT = 70;
  let W, H, stars;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * (typeof W !== 'undefined' ? W : 1000),
      y: Math.random() * (typeof H !== 'undefined' ? H : 800),
      r: rand(0.8, 3.5),
      alpha: rand(0.08, 0.5),
      dx: rand(-0.15, 0.15),
      dy: rand(-0.08, 0.08),
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.005, 0.02),
    };
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    stars.forEach(s => {
      s.x += s.dx;
      s.y += s.dy;
      s.pulse += s.pulseSpeed;
      if (s.x < 0) s.x = W;
      if (s.x > W) s.x = 0;
      if (s.y < 0) s.y = H;
      if (s.y > H) s.y = 0;

      const a = s.alpha * (0.6 + 0.4 * Math.sin(s.pulse));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      // Alternating hot-pink / soft rose tones
      const hue = (s.x / W > 0.5) ? '328, 80%, 72%' : '345, 70%, 75%';
      ctx.fillStyle = `hsla(${hue}, ${a})`;
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  resize();
  stars = Array.from({ length: COUNT }, mkStar);
  window.addEventListener('resize', () => {
    resize();
    // Clamp existing stars to new bounds
    stars.forEach(s => {
      s.x = Math.min(s.x, W);
      s.y = Math.min(s.y, H);
    });
  });
  animate();
})();

/* ================================================================
   ██████  MUSIC & MUTE TOGGLE
   ================================================================ */
const music = document.getElementById('bg-music');
const muteBtn = document.getElementById('mute-btn');

let musicMuted = false;

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    musicMuted = !musicMuted;
    if (music) music.muted = musicMuted;

    const iconOn = document.getElementById('icon-sound-on');
    const iconOff = document.getElementById('icon-sound-off');

    if (iconOn) iconOn.style.display = musicMuted ? 'none' : 'block';
    if (iconOff) iconOff.style.display = musicMuted ? 'block' : 'none';
  });
}

/* ================================================================
   ██████  REPLAY — resets entire experience
   ================================================================ */
function replayExperience() {
  // Clear confetti
  const confCanvas = document.getElementById('confetti-canvas');
  if (confCanvas) {
    confCanvas.getContext('2d').clearRect(0, 0, confCanvas.width, confCanvas.height);
  }

  // Pause & reset music
  if (music) {
    music.pause();
    music.currentTime = 0;
  }

  // Reset mute button state
  musicMuted = false;
  if (music) music.muted = false;
  const iconOn = document.getElementById('icon-sound-on');
  const iconOff = document.getElementById('icon-sound-off');
  if (iconOn) iconOn.style.display = 'block';
  if (iconOff) iconOff.style.display = 'none';

  // Hide mute button (re-shown after unlock)
  if (muteBtn) muteBtn.hidden = true;

  // Reset video
  const video = document.getElementById('scene2-video');
  if (video) {
    video.pause();
    video.currentTime = 0;
    video.muted = true;
  }
  const placeholder = document.getElementById('video-placeholder');
  if (placeholder) placeholder.classList.remove('hidden');
  const soundBtn = document.getElementById('video-sound-btn');
  if (soundBtn) soundBtn.classList.remove('video-sound-btn--hidden');

  // Clear all pending timers
  clearAllTimers();

  // Go back to Scene 0
  showScene(0);
}

/* ================================================================
   ██████  UTILITY
   ================================================================ */
/** Return a random float between min and max */
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/* ================================================================
   ██████  INITIALISE — show Scene 0 on page load
   ================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  showScene(0);
});
