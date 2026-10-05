(() => {
  const body = document.body;
  const stage = document.querySelector('.project-stage');
  const tabs = [...document.querySelectorAll('[data-project-target]')];
  const panels = [...document.querySelectorAll('[data-project-panel]')];
  const summaries = [...document.querySelectorAll('[data-project-summary]')];
  const progressBar = document.querySelector('.scroll-progress i');
  const progressText = document.querySelector('.scroll-percent');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || tabs.length === 0) return;

  const videos = [...document.querySelectorAll('.portfolio-video')];

  const safePlay = (video) => {
    if (reducedMotion.matches) return;
    video.muted = true;
    const result = video.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  };

  const videoObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const activePanel = video.closest('[data-project-panel]:not([hidden])');
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35 && activePanel) safePlay(video);
          else video.pause();
        });
      }, { root: window.innerWidth > 900 ? stage : null, threshold: [0, 0.35, 0.7] })
    : null;

  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    if (videoObserver) videoObserver.observe(video);
  });

  const updateProgress = () => {
    const desktop = window.innerWidth > 900;
    const current = desktop ? stage.scrollTop : window.scrollY;
    const total = desktop
      ? stage.scrollHeight - stage.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${percent / 100})`;
    if (progressText) progressText.textContent = `${String(Math.round(percent)).padStart(2, '0')}%`;
  };

  const setProject = (requestedName, { updateHash = true } = {}) => {
    const name = panels.some((panel) => panel.dataset.projectPanel === requestedName) ? requestedName : 'satisfy';

    tabs.forEach((tab) => {
      const isActive = tab.dataset.projectTarget === name;
      tab.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.projectPanel === name;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
      panel.querySelectorAll('video').forEach((video) => {
        if (!isActive) video.pause();
      });
    });

    summaries.forEach((summary) => {
      const isActive = summary.dataset.projectSummary === name;
      summary.hidden = !isActive;
      summary.classList.toggle('is-active', isActive);
    });

    body.dataset.activeProject = name;
    stage.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateProgress();

    const activeVideo = document.querySelector(`[data-project-panel="${name}"] video`);
    if (activeVideo) safePlay(activeVideo);

    if (updateHash) history.replaceState(null, '', `#${name}`);
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => setProject(tab.dataset.projectTarget)));
  stage.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  window.addEventListener('hashchange', () => setProject(location.hash.slice(1), { updateHash: false }));

  setProject(location.hash.slice(1) || 'satisfy', { updateHash: false });
})();
