(() => {
  'use strict';

  const releases = [
    {
      title: 'S.O.L In SLC', artwork: 'assets/sol-in-slc.png', path: 'sol-in-slc',
      tracks: [
        ['S.O.L In SLC', '2:59', '01%20-%20S.O.L%20In%20SLC.mp3'], ['4-Family', '2:46', '02%20-%204-Family.mp3'], ['Setting Sun', '3:14', '03%20-%20Setting%20Sun.mp3'], ['Weltanschauung', '3:04', '04%20-%20Weltanschauung.mp3'], ['Cash Motors', '2:20', '05%20-%20Cash%20Motors.mp3']
      ]
    },
    {
      title: 'The Desert', artwork: 'assets/the-desert.jpg', path: 'the-desert',
      tracks: [
        ['The Desert', '3:12', '01%20-%20The%20Desert.mp3'], ['Food of Love', '4:22', '02%20-%20Food%20of%20Love.mp3'], ['Caravan', '3:28', '03%20-%20Caravan.mp3'], ['Kokopelli', '3:14', '04%20-%20Kokopelli.mp3']
      ]
    },
    {
      title: 'Penitent Sinner', artwork: 'assets/penitent-sinner.png', path: 'penitent-sinner',
      tracks: [
        ['Mexico', '5:22', '01%20-%20Mexico.mp3'], ['Chemistry', '3:46', '02%20-%20Chemistry.mp3'], ['Miss You Every Day', '3:14', '03%20-%20Miss%20You%20Every%20Day.mp3'], ['Live A Little', '4:16', '04%20-%20Live%20A%20Little.mp3']
      ]
    }
  ];

  const audio = document.getElementById('public-audio');
  const tracklist = document.getElementById('public-tracklist');
  const nowPlaying = document.getElementById('public-now-playing');
  const artwork = document.getElementById('public-release-art');
  const playToggle = document.getElementById('public-play-toggle');
  const status = document.getElementById('public-player-status');
  const allTracks = releases.flatMap((release, releaseIndex) => release.tracks.map((track, trackIndex) => ({ release, releaseIndex, track, trackIndex })));
  let current = 0;

  function updateControls() {
    tracklist.querySelectorAll('.public-track').forEach((button, index) => {
      const active = index === current;
      button.setAttribute('aria-current', String(active));
      button.setAttribute('aria-label', `${active && !audio.paused ? 'Pause' : 'Play'} ${allTracks[index].track[0]}`);
    });
    playToggle.textContent = audio.paused ? '▶ Play' : 'Ⅱ Pause';
  }

  function loadTrack(index) {
    current = index;
    const { release, track } = allTracks[current];
    audio.src = `https://music.bustertheband.com/${release.path}/${track[2]}`;
    nowPlaying.textContent = `${track[0]} · ${release.title}`;
    artwork.src = release.artwork;
    artwork.alt = `${release.title} cover art`;
    updateControls();
  }

  async function playTrack(index = current) {
    if (index !== current) loadTrack(index);
    status.textContent = '';
    try { await audio.play(); }
    catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Playback could not start. Try the audio controls again.';
    }
  }

  releases.forEach((release, releaseIndex) => {
    const heading = document.createElement('li');
    heading.className = 'public-release-heading';
    heading.textContent = release.title;
    heading.setAttribute('aria-hidden', 'true');
    tracklist.appendChild(heading);
    release.tracks.forEach((track, trackIndex) => {
      const index = allTracks.findIndex(item => item.releaseIndex === releaseIndex && item.trackIndex === trackIndex);
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'public-track';
      button.dataset.index = String(index);
      button.innerHTML = `<span class="public-track-number">${String(trackIndex + 1).padStart(2, '0')}</span><span class="public-track-title"></span><span class="public-track-duration">${track[1]}</span>`;
      button.querySelector('.public-track-title').textContent = track[0];
      item.appendChild(button);
      tracklist.appendChild(item);
    });
  });

  tracklist.addEventListener('click', event => {
    const button = event.target.closest('.public-track');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (index === current && !audio.paused) audio.pause();
    else playTrack(index);
  });
  playToggle.addEventListener('click', () => audio.paused ? playTrack() : audio.pause());
  audio.addEventListener('play', updateControls);
  audio.addEventListener('pause', updateControls);
  audio.addEventListener('ended', () => {
    if (current < allTracks.length - 1) playTrack(current + 1);
    else { status.textContent = 'Thanks for listening.'; loadTrack(0); }
  });
  audio.addEventListener('error', () => { status.textContent = 'This track could not load. Check your connection and try again.'; });

  loadTrack(0);
})();
