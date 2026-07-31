(() => {
  const enabled = new URLSearchParams(window.location.search).get('aipro') === 'on';
  if (!enabled) return;

  document.body.classList.add('aipro-enabled');

  const button = document.getElementById('askProBtn');
  const preview = document.getElementById('proPreview');

  function openPreview() {
    preview.hidden = false;
  }

  function closePreview() {
    preview.hidden = true;
  }

  button?.addEventListener('click', openPreview);
  document.querySelectorAll('[data-close-pro]').forEach(element => {
    element.addEventListener('click', closePreview);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !preview.hidden) closePreview();
  });
})();