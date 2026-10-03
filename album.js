(() => {
  'use strict';
  const audio = document.getElementById('audio');
  const tracks = Array.from(document.querySelectorAll('.track'));
  const playButton = document.getElementById('play-ep');
  const status = document.getElementById('player-status');
  let current = 0;
  function update() {
    tracks.forEach((track, index) => {
      track.setAttribute('aria-current', String(index === current));
      track.querySelector('.track-icon').textContent = index === current && !audio.paused ? 'Ⅱ' : '▶';
      track.setAttribute('aria-label', `${index === current && !audio.paused ? 'Pause' : 'Play'} ${track.dataset.title}`);
    });
    playButton.textContent = audio.paused ? '▶ Play EP' : 'Ⅱ Pause';
  }
  async function play(index) {
    status.textContent = '';
    if (index !== current) {
      current = index;
      audio.src = tracks[index].dataset.src;
      document.getElementById('now-playing').textContent = tracks[index].dataset.title;
    }
    update();
    try { await audio.play(); }
    catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Playback could not start. Try the audio controls, or download the song below.';
    }
  }
  tracks.forEach((track, index) => track.addEventListener('click', () => {
    if (index === current && !audio.paused) audio.pause();
    else play(index);
  }));
  playButton.addEventListener('click', () => audio.paused ? play(current) : audio.pause());
  audio.addEventListener('play', update);
  audio.addEventListener('pause', update);
  audio.addEventListener('ended', () => {
    if (current < tracks.length - 1) play(current + 1);
    else { status.textContent = 'Thanks for listening. Hit play to hear the EP again.'; current = 0; audio.src = tracks[0].dataset.src; document.getElementById('now-playing').textContent = tracks[0].dataset.title; update(); }
  });
  audio.addEventListener('error', () => { status.textContent = 'This track could not load. Check your connection and try again, or use the download link.'; });
  const downloadStatus = document.getElementById('download-status');
  document.querySelectorAll('[data-download]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      if (link.getAttribute('aria-busy') === 'true') return;
      link.setAttribute('aria-busy', 'true');
      downloadStatus.textContent = `Preparing ${link.dataset.download}…`;
      try {
        const response = await fetch(link.href);
        if (!response.ok) throw new Error('Download failed');
        const url = URL.createObjectURL(await response.blob());
        const save = document.createElement('a');
        save.href = url; save.download = link.dataset.download;
        document.body.appendChild(save); save.click(); save.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        downloadStatus.textContent = 'Your file is ready. Check your browser’s downloads or save prompt.';
      } catch (error) {
        downloadStatus.replaceChildren(document.createTextNode('Could not prepare the download. '));
        const fallback = document.createElement('a');
        fallback.href = link.href; fallback.textContent = 'Open the MP3 directly';
        downloadStatus.appendChild(fallback);
      } finally { link.removeAttribute('aria-busy'); }
    });
  });
  update();
})();
