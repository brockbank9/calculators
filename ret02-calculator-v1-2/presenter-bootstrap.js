(() => {
  const config = window.AI_PRO_CONFIG;
  if (!config) return;

  function applyPresenter() {
    const avatar = document.getElementById('proAvatar');
    if (!avatar) return;

    Object.values(config.presenters || {}).forEach(item => {
      if (item?.cssClass) avatar.classList.remove(item.cssClass);
    });

    const selected = config.presenters?.[config.presenter];
    if (selected?.cssClass) avatar.classList.add(selected.cssClass);
    avatar.dataset.presenter = config.presenter;
    avatar.setAttribute('aria-label', 'AI professional presenter');
  }

  const target = document.getElementById('proPreview');
  if (!target) return;

  applyPresenter();
  new MutationObserver(applyPresenter).observe(target, { childList: true, subtree: true });
})();
