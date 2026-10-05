(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const closeMenu = () => {
    if (!header || !toggle) return;
    header.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  if (header && toggle) {
    toggle.addEventListener('click', () => {
      const open = !header.classList.contains('is-open');
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-34% 0px -58% 0px', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  }

  const safePlay = (video) => {
    if (reducedMotion.matches) return;
    video.muted = true;
    const result = video.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  };

  const videos = [...document.querySelectorAll('.auto-video')];
  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
  });

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) safePlay(entry.target);
        else entry.target.pause();
      });
    }, { threshold: [0, 0.35, 0.75] });
    videos.forEach((video) => videoObserver.observe(video));
  } else {
    videos.forEach(safePlay);
  }

  const lifeCarousel = document.querySelector('[data-life-carousel]');
  if (lifeCarousel) {
    const track = lifeCarousel.querySelector('[data-life-track]');
    const slides = [...lifeCarousel.querySelectorAll('[data-life-slide]')];
    const previous = lifeCarousel.querySelector('[data-life-prev]');
    const next = lifeCarousel.querySelector('[data-life-next]');
    const currentCount = lifeCarousel.querySelector('[data-life-count]');
    const currentName = lifeCarousel.querySelector('[data-life-name]');
    const names = ['游戏', '健身', '篮球', 'AIGC 创作', '音乐'];
    let activeIndex = 0;
    let scrollFrame = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragDelta = 0;
    let isNavigating = false;
    let navigationTimer = 0;

    const updateLifeState = (index) => {
      activeIndex = index;
      slides.forEach((slide, slideIndex) => {
        let offset = slideIndex - index;
        if (offset > slides.length / 2) offset -= slides.length;
        if (offset < -slides.length / 2) offset += slides.length;
        slide.dataset.offset = String(offset);
        slide.classList.toggle('is-active', slideIndex === index);
      });
      if (currentCount) currentCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (currentName) currentName.textContent = names[index] || '';
    };

    const goToLifeSlide = (index) => {
      const targetIndex = (index + slides.length) % slides.length;
      isNavigating = true;
      clearTimeout(navigationTimer);
      updateLifeState(targetIndex);
      if (window.matchMedia('(min-width: 761px)').matches) {
        isNavigating = false;
        return;
      }
      const targetSlide = slides[targetIndex];
      const targetLeft = targetSlide.offsetLeft - (track.clientWidth - targetSlide.offsetWidth) / 2;
      track.scrollTo({
        left: targetLeft,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
      navigationTimer = window.setTimeout(() => {
        isNavigating = false;
        syncLifeSlide();
      }, reducedMotion.matches ? 0 : 520);
    };

    const syncLifeSlide = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        if (isNavigating || window.matchMedia('(min-width: 761px)').matches) return;
        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        slides.forEach((slide, index) => {
          const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
          const distance = Math.abs(slideCenter - trackCenter);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        if (nearestIndex !== activeIndex) updateLifeState(nearestIndex);
      });
    };

    if (previous) {
      previous.dataset.lifeBound = 'true';
      previous.onclick = () => goToLifeSlide(activeIndex - 1);
    }
    if (next) {
      next.dataset.lifeBound = 'true';
      next.onclick = () => goToLifeSlide(activeIndex + 1);
    }
    track?.addEventListener('scroll', syncLifeSlide, { passive: true });
    track?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToLifeSlide(activeIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToLifeSlide(activeIndex + 1);
      }
    });
    track?.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartScroll = track.scrollLeft;
      dragDelta = 0;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    });
    track?.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      event.preventDefault();
      dragDelta = event.clientX - dragStartX;
      if (!window.matchMedia('(min-width: 761px)').matches) {
        track.scrollLeft = dragStartScroll - dragDelta;
      }
    });
    const stopDragging = (event) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      if (window.matchMedia('(min-width: 761px)').matches && Math.abs(dragDelta) > 48) {
        goToLifeSlide(activeIndex + (dragDelta < 0 ? 1 : -1));
        return;
      }
      goToLifeSlide(activeIndex);
    };
    track?.addEventListener('pointerup', stopDragging);
    track?.addEventListener('pointercancel', stopDragging);
    lifeCarousel.dataset.lifeReady = 'true';
    updateLifeState(0);
  }

  const form = document.querySelector('[data-message-form]');
  const viewport = document.querySelector('[data-notes-wall]');
  const wall = document.querySelector('[data-notes-canvas]');
  const count = document.querySelector('[data-count]');
  const status = document.querySelector('[data-form-status]');
  const scaleLabel = document.querySelector('[data-canvas-scale]');
  const zoomInButton = document.querySelector('[data-canvas-zoom-in]');
  const zoomOutButton = document.querySelector('[data-canvas-zoom-out]');
  const resetButton = document.querySelector('[data-canvas-reset]');
  const messagesEndpoint = '/api/messages';
  const canvasWidth = 2800;
  const slotPageHeight = 1480;
  const minScale = 0.34;
  const maxScale = 1.6;

  const noteSlots = [
    [180, 190, -3.4, 390], [820, 80, 2.2, 340], [1450, 300, -1.4, 420], [2150, 110, 3.1, 360],
    [430, 720, 1.8, 350], [1090, 650, -2.7, 300], [1740, 820, 1.1, 380], [2310, 720, -3.6, 320],
    [110, 1180, -1.8, 330], [760, 1090, 3.2, 390], [1390, 1210, -3.1, 320], [2020, 1140, 1.7, 370]
  ];

  const view = { x: 0, y: 0, scale: 0.7 };
  const pointers = new Map();
  let gesture = null;

  const escapeText = (value) => value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const formatNoteDate = (createdAt) => {
    const date = createdAt ? new Date(createdAt) : new Date();
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date);
  };

  const makeNote = ({ name, message, createdAt }) => {
    const note = document.createElement('article');
    note.className = 'note';
    const safeName = escapeText(name || '匿名访客');
    const safeMessage = escapeText(message);
    const dateText = formatNoteDate(createdAt);
    note.innerHTML = `<span class="note-pin" aria-hidden="true"></span><header><strong>${safeName}</strong><time datetime="${new Date(createdAt || Date.now()).toISOString()}">${dateText}</time></header><p>${safeMessage}</p>`;
    return note;
  };

  const clampScale = (value) => Math.min(maxScale, Math.max(minScale, value));

  const renderCanvas = (animate = false) => {
    if (!wall) return;
    wall.classList.toggle('is-animating', animate);
    wall.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
    if (scaleLabel) scaleLabel.textContent = `${Math.round(view.scale * 100)}%`;
    if (animate) window.setTimeout(() => wall.classList.remove('is-animating'), 440);
  };

  const layoutNotes = () => {
    if (!wall) return;
    const notes = [...wall.querySelectorAll('.note')];
    notes.forEach((note, index) => {
      const page = Math.floor(index / noteSlots.length);
      const slot = noteSlots[index % noteSlots.length];
      const x = slot[0] + (page % 2 ? 110 : 0);
      const y = slot[1] + page * slotPageHeight;
      note.style.left = `${x}px`;
      note.style.top = `${y}px`;
      note.style.setProperty('--note-rotate', `${slot[2]}deg`);
      note.style.setProperty('--note-width', `${slot[3]}px`);
      note.dataset.noteIndex = String(index);
    });
    const pages = Math.max(1, Math.ceil(notes.length / noteSlots.length));
    wall.style.height = `${pages * slotPageHeight + 220}px`;
  };

  const getBounds = () => {
    if (!wall) return null;
    const notes = [...wall.querySelectorAll('.note')];
    if (!notes.length) return null;
    return notes.reduce((bounds, note) => ({
      minX: Math.min(bounds.minX, note.offsetLeft),
      minY: Math.min(bounds.minY, note.offsetTop),
      maxX: Math.max(bounds.maxX, note.offsetLeft + note.offsetWidth),
      maxY: Math.max(bounds.maxY, note.offsetTop + note.offsetHeight)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  };

  const fitAllNotes = () => {
    if (!viewport) return;
    const bounds = getBounds();
    if (!bounds) return;
    const padding = window.innerWidth <= 760 ? 34 : 80;
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    view.scale = clampScale(Math.min(
      (viewport.clientWidth - padding * 2) / width,
      (viewport.clientHeight - padding * 2) / height,
      0.92
    ));
    view.x = (viewport.clientWidth - width * view.scale) / 2 - bounds.minX * view.scale;
    view.y = (viewport.clientHeight - height * view.scale) / 2 - bounds.minY * view.scale;
    renderCanvas(true);
  };

  const setOpeningView = () => {
    if (!viewport) return;
    if (window.innerWidth <= 760) {
      view.scale = 0.84;
      view.x = 22 - noteSlots[0][0] * view.scale;
      view.y = 92 - noteSlots[0][1] * view.scale;
    } else {
      const firstRowWidth = 2380;
      view.scale = clampScale(Math.min(0.72, (viewport.clientWidth - 96) / firstRowWidth));
      view.x = (viewport.clientWidth - firstRowWidth * view.scale) / 2 - 120 * view.scale;
      view.y = Math.max(70, (viewport.clientHeight - 470 * view.scale) / 2 - 90 * view.scale);
    }
    renderCanvas();
  };

  const zoomAt = (nextScale, clientX, clientY, animate = false) => {
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const worldX = (localX - view.x) / view.scale;
    const worldY = (localY - view.y) / view.scale;
    view.scale = clampScale(nextScale);
    view.x = localX - worldX * view.scale;
    view.y = localY - worldY * view.scale;
    renderCanvas(animate);
  };

  const zoomFromCenter = (factor) => {
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAt(view.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
  };

  const focusNote = (note) => {
    if (!viewport || !note) return;
    view.scale = clampScale(Math.max(view.scale, window.innerWidth <= 760 ? 0.86 : 0.72));
    view.x = viewport.clientWidth / 2 - (note.offsetLeft + note.offsetWidth / 2) * view.scale;
    view.y = viewport.clientHeight / 2 - (note.offsetTop + note.offsetHeight / 2) * view.scale;
    renderCanvas(true);
  };

  let sharedMessages = [];

  const renderSharedMessages = (messages) => {
    if (!wall) return;
    wall.querySelectorAll('.note:not(.note-seed)').forEach((note) => note.remove());
    messages.forEach((item) => wall.append(makeNote(item)));
    layoutNotes();
    window.requestAnimationFrame(setOpeningView);
  };

  const loadSharedMessages = async () => {
    if (!wall) return;
    try {
      const response = await fetch(messagesEndpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error('message request failed');
      const data = await response.json();
      sharedMessages = Array.isArray(data.messages) ? data.messages.slice(-120) : [];
      renderSharedMessages(sharedMessages);
    } catch (_) {
      layoutNotes();
      window.requestAnimationFrame(setOpeningView);
      if (status) status.textContent = '共享留言暂时无法读取，请稍后刷新。';
    }
  };

  loadSharedMessages();

  if (viewport && wall) {
    const relativePoint = (event) => {
      const rect = viewport.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const pinchData = () => {
      const points = [...pointers.values()];
      if (points.length < 2) return null;
      const [a, b] = points;
      return {
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2
      };
    };

    viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0012);
      zoomAt(view.scale * factor, event.clientX, event.clientY);
    }, { passive: false });

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      viewport.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, relativePoint(event));
      viewport.classList.add('is-panning');
      if (pointers.size === 1) {
        const point = pointers.get(event.pointerId);
        gesture = { type: 'pan', startX: point.x, startY: point.y, originX: view.x, originY: view.y };
      } else if (pointers.size === 2) {
        const pinch = pinchData();
        gesture = {
          type: 'pinch',
          startDistance: pinch.distance,
          startScale: view.scale,
          worldX: (pinch.midX - view.x) / view.scale,
          worldY: (pinch.midY - view.y) / view.scale
        };
      }
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, relativePoint(event));
      if (pointers.size >= 2 && gesture?.type === 'pinch') {
        const pinch = pinchData();
        view.scale = clampScale(gesture.startScale * pinch.distance / Math.max(1, gesture.startDistance));
        view.x = pinch.midX - gesture.worldX * view.scale;
        view.y = pinch.midY - gesture.worldY * view.scale;
        renderCanvas();
      } else if (pointers.size === 1 && gesture?.type === 'pan') {
        const point = pointers.get(event.pointerId);
        view.x = gesture.originX + point.x - gesture.startX;
        view.y = gesture.originY + point.y - gesture.startY;
        renderCanvas();
      }
    });

    const releasePointer = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 1) {
        const point = [...pointers.values()][0];
        gesture = { type: 'pan', startX: point.x, startY: point.y, originX: view.x, originY: view.y };
      } else if (pointers.size === 0) {
        gesture = null;
        viewport.classList.remove('is-panning');
      }
    };

    viewport.addEventListener('pointerup', releasePointer);
    viewport.addEventListener('pointercancel', releasePointer);
    viewport.addEventListener('dblclick', fitAllNotes);
    viewport.addEventListener('keydown', (event) => {
      const panStep = event.shiftKey ? 120 : 60;
      if (event.key === 'ArrowLeft') view.x += panStep;
      else if (event.key === 'ArrowRight') view.x -= panStep;
      else if (event.key === 'ArrowUp') view.y += panStep;
      else if (event.key === 'ArrowDown') view.y -= panStep;
      else if (event.key === '+' || event.key === '=') zoomFromCenter(1.15);
      else if (event.key === '-' || event.key === '_') zoomFromCenter(0.87);
      else if (event.key === '0') fitAllNotes();
      else return;
      event.preventDefault();
      renderCanvas();
    });

    zoomInButton?.addEventListener('click', () => zoomFromCenter(1.18));
    zoomOutButton?.addEventListener('click', () => zoomFromCenter(0.84));
    resetButton?.addEventListener('click', fitAllNotes);

    let resizeFrame = 0;
    window.addEventListener('resize', () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(setOpeningView);
    });
  }

  if (form && wall) {
    const textarea = form.elements.message;
    textarea.addEventListener('input', () => {
      if (count) count.textContent = `${textarea.value.length} / 500`;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const message = textarea.value.trim();
      if (!message) {
        if (status) status.textContent = '先写下一句话，再把它贴上来。';
        textarea.focus();
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      if (status) status.textContent = '正在贴上留言……';

      try {
        const response = await fetch(messagesEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, message, website: form.elements.website?.value || '' })
        });
        const data = await response.json();
        if (!response.ok || !data.message) throw new Error(data.error || '留言提交失败');
        sharedMessages = [...sharedMessages, data.message].slice(-120);
        const note = makeNote(data.message);
        wall.append(note);
        layoutNotes();
        window.requestAnimationFrame(() => focusNote(note));
        form.reset();
        if (count) count.textContent = '0 / 500';
        if (status) status.textContent = '留言已公开贴到画布上，其他访客也能看到。';
      } catch (error) {
        if (status) status.textContent = error.message || '留言暂时没有保存成功，请稍后重试。';
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
})();
