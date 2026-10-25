(() => {
  'use strict';

  const releases = [
    {
      title: 'S.O.L In SLC',
      tracks: [
        ['S.O.L In SLC', '2:59', '01%20-%20S.O.L%20In%20SLC.mp3'],
        ['4-Family', '2:46', '02%20-%204-Family.mp3'],
        ['Setting Sun', '3:14', '03%20-%20Setting%20Sun.mp3'],
        ['Weltanschauung', '3:04', '04%20-%20Weltanschauung.mp3'],
        ['Cash Motors', '2:20', '05%20-%20Cash%20Motors.mp3']
      ],
      path: 'sol-in-slc'
    },
    {
      title: 'The Desert',
      tracks: [
        ['The Desert', '3:12', '01%20-%20The%20Desert.mp3'],
        ['Food of Love', '4:22', '02%20-%20Food%20of%20Love.mp3'],
        ['Caravan', '3:28', '03%20-%20Caravan.mp3'],
        ['Kokopelli', '3:14', '04%20-%20Kokopelli.mp3']
      ],
      path: 'the-desert'
    },
    {
      title: 'Penitent Sinner',
      tracks: [
        ['Mexico', '5:22', '01%20-%20Mexico.mp3'],
        ['Chemistry', '3:46', '02%20-%20Chemistry.mp3'],
        ['Miss You Every Day', '3:14', '03%20-%20Miss%20You%20Every%20Day.mp3'],
        ['Live A Little', '4:16', '04%20-%20Live%20A%20Little.mp3']
      ],
      path: 'penitent-sinner'
    }
  ];

  const audio = document.getElementById('public-audio');
  const select = document.getElementById('public-release-select');
  const tracklist = document.getElementById('public-tracklist');
  const nowPlaying = document.getElementById('public-now-playing');
  const playToggle = document.getElementById('public-play-toggle');
  const status = document.getElementById('public-player-status');
  let releaseIndex = 0;
  let trackIndex = 0;

  const sourceFor = (release, track) => `https://music.bustertheband.com/${release.path}/${track[2]}`;

  function updateControls() {
    const buttons = tracklist.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const active = index === trackIndex;
      button.setAttribute('aria-current', String(active));
      button.setAttribute('aria-label', `${active && !audio.paused ? 'Pause' : 'Play'} ${releases[releaseIndex].tracks[index][0]}`);
    });
    playToggle.textContent = audio.paused ? '▶ Play' : 'Ⅱ Pause';
  }

  function renderRelease() {
    const release = releases[releaseIndex];
    select.value = String(releaseIndex);
    tracklist.replaceChildren();
    release.tracks.forEach((track, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'public-track';
      button.dataset.index = String(index);
      button.innerHTML = `<span class="public-track-number">${String(index + 1).padStart(2, '0')}</span><span class="public-track-title"></span><span class="public-track-duration">${track[1]}</span>`;
      button.querySelector('.public-track-title').textContent = track[0];
      item.appendChild(button);
      tracklist.appendChild(item);
    });
    loadTrack(0);
  }

  function loadTrack(index) {
    const release = releases[releaseIndex];
    trackIndex = index;
    const track = release.tracks[trackIndex];
    audio.src = sourceFor(release, track);
    nowPlaying.textContent = `${track[0]} · ${release.title}`;
    updateControls();
  }

  async function playTrack(index = trackIndex) {
    if (index !== trackIndex) loadTrack(index);
    status.textContent = '';
    try {
      await audio.play();
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Playback could not start. Try the audio controls again.';
    }
  }

  releases.forEach((release, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = release.title;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    audio.pause();
    releaseIndex = Number(select.value);
    status.textContent = '';
    renderRelease();
  });
  tracklist.addEventListener('click', event => {
    const button = event.target.closest('.public-track');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (index === trackIndex && !audio.paused) audio.pause();
    else playTrack(index);
  });
  playToggle.addEventListener('click', () => audio.paused ? playTrack() : audio.pause());
  audio.addEventListener('play', updateControls);
  audio.addEventListener('pause', updateControls);
  audio.addEventListener('ended', () => {
    if (trackIndex < releases[releaseIndex].tracks.length - 1) playTrack(trackIndex + 1);
    else {
      status.textContent = 'Thanks for listening.';
      loadTrack(0);
    }
  });
  audio.addEventListener('error', () => { status.textContent = 'This track could not load. Check your connection and try again.'; });

  renderRelease();
})();
