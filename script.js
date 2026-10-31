document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Background music (unchanged behaviour, plus equaliser state) ---------- */
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  const volumeControl = document.getElementById('volume-control');
  const musicBox = document.querySelector('.music-control');

  bgMusic.volume = 0.18;
  volumeControl.value = 0.18;

  const setPlaying = (playing) => {
    musicToggle.innerHTML = playing ? '<i class="fas fa-pause" aria-hidden="true"></i>' : '<i class="fas fa-music" aria-hidden="true"></i>';
    musicToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    musicBox.classList.toggle('playing', playing);
  };

  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      bgMusic.pause();
      setPlaying(false);
    }
  });

  volumeControl.addEventListener('input', (event) => {
    bgMusic.volume = Number(event.target.value);
  });

  // Start music after the first user interaction if the browser allows it.
  const unlockAudio = () => {
    bgMusic.play().then(() => setPlaying(true)).catch(() => {});
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('scroll', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('scroll', unlockAudio, { once: true, passive: true });

  /* ---------- Tabbed navigation, deep-linked through the URL hash ---------- */
  const links = [...document.querySelectorAll('nav [data-tab]')];
  const sections = [...document.querySelectorAll('main section')];
  const valid = new Set(sections.map(s => s.id));
  const ink = document.querySelector('.nav-ink');
  const wipe = document.querySelector('.wipe');
  const wipeLabel = wipe.querySelector('span');
  let current = 'home';
  let timers = [];

  function moveInk() {
    const active = links.find(l => l.dataset.tab === current);
    if (!active || !ink) return;
    ink.style.width = '100px';
    ink.style.transform = `translateX(${active.offsetLeft}px) scaleX(${active.offsetWidth / 100})`;
  }

  function apply(id) {
    current = id;
    links.forEach(link => {
      const on = link.dataset.tab === id;
      link.classList.toggle('active-btn', on);
      if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    sections.forEach(section => section.classList.toggle('active', section.id === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
    moveInk();
  }

  function go(id, { push = true, instant = false } = {}) {
    if (!valid.has(id) || id === current) return;
    timers.forEach(clearTimeout);
    timers = [];
    wipe.className = 'wipe';
    if (push) history.pushState(null, '', '#' + id);

    if (instant || reduceMotion.matches) { apply(id); return; }

    const label = links.find(l => l.dataset.tab === id);
    wipeLabel.textContent = label ? label.textContent.trim() : '';
    void wipe.offsetWidth;
    wipe.className = 'wipe in';
    timers.push(setTimeout(() => { apply(id); wipe.className = 'wipe out'; }, 430));
    timers.push(setTimeout(() => { wipe.className = 'wipe'; }, 980));
  }

  const isPlainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

  document.querySelectorAll('a[data-tab], a[data-target]').forEach(a => {
    a.addEventListener('click', (e) => {
      if (!isPlainClick(e)) return;
      e.preventDefault();
      go(a.dataset.tab || a.dataset.target);
    });
  });

  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    go(valid.has(id) ? id : 'home', { push: false });
  });

  const initial = location.hash.slice(1);
  if (valid.has(initial) && initial !== 'home') apply(initial);
  else moveInk();
  window.addEventListener('resize', moveInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);

  /* ---------- Staggered entrances, replayed every time a tab opens ---------- */
  sections.forEach(section => {
    section.querySelectorAll('.rv').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 6) * 80 + 'ms'));
  });
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in');
      else if (!entry.target.closest('section.active')) entry.target.classList.remove('in');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv, .rv-lines').forEach(el => revealer.observe(el));

  /* ---------- Scroll progress + gentle background parallax ---------- */
  const progress = document.querySelector('.progress');
  const circles = [...document.querySelectorAll('.circle')];
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : 0);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Fine-pointer effects: flashlight, cursor ring, tilt, magnetic buttons ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    const spot = document.querySelector('.spot');
    const cursor = document.querySelector('.cursor');
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let sx = tx, sy = ty, cx = tx, cy = ty;
    let moved = false;

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!moved) { moved = true; spot.classList.add('on'); cursor.classList.add('on'); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { spot.classList.remove('on'); cursor.classList.remove('on'); moved = false; });
    window.addEventListener('pointerdown', () => cursor.classList.add('down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('down'));

    const hotSelector = 'a, button, input, [role="button"], .tag-list span, .info-row, iframe';
    document.addEventListener('pointerover', (e) => cursor.classList.toggle('hot', !!e.target.closest(hotSelector)));

    const loop = () => {
      sx += (tx - sx) * 0.08; sy += (ty - sy) * 0.08;
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      const nx = (tx / window.innerWidth - 0.5), ny = (ty / window.innerHeight - 0.5);
      circles.forEach((c, i) => { c.style.translate = `${-nx * (24 + i * 18)}px ${-ny * (24 + i * 18)}px`; });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // 3D tilt
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });

    // Light that follows the cursor inside project cards
    document.querySelectorAll('.glow').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      });
    });

    // Magnetic buttons
    document.querySelectorAll('.mag').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        el.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--tx', '0px'); el.style.setProperty('--ty', '0px'); });
    });
  }

  /* ---------- Design archive: lightbox + graceful handling of missing files ---------- */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Image preview');
  modal.innerHTML = '<button class="close-modal" type="button" aria-label="Close image">&times;</button><div class="image-modal-content"><img src="" alt=""></div>';
  document.body.appendChild(modal);
  const modalImage = modal.querySelector('img');
  const closeBtn = modal.querySelector('.close-modal');
  let lastFocus = null;

  const openModal = (image) => {
    lastFocus = document.activeElement;
    modalImage.src = image.src;
    modalImage.alt = image.alt;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  galleryItems.forEach(item => {
    const image = item.querySelector('img');
    const markMissing = () => { item.classList.add('missing'); item.removeAttribute('role'); item.removeAttribute('tabindex'); item.removeAttribute('aria-label'); };
    image.addEventListener('error', markMissing);
    if (image.complete && image.naturalWidth === 0) markMissing();

    const open = () => { if (!item.classList.contains('missing')) openModal(image); };
    item.addEventListener('click', open);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
});
