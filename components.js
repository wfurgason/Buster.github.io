/************************************************
 * BUSTER | SHARED COMPONENTS
 * Injects header and footer into every page.
 ************************************************/
(function () {

  var isEPK = window.location.pathname.indexOf('epk') !== -1;
  var prefix = isEPK ? 'index.html' : '';

  // ── HEADER ──────────────────────────────────────────────
  var header = document.querySelector('header');
  if (header) {
    header.innerHTML = [
      '<a class="logo" href="index.html">Buster</a>',
      '<button class="hamburger" id="hamburgerBtn" aria-label="Toggle navigation" aria-expanded="false">',
      '  <span></span><span></span><span></span>',
      '</button>',
      '<nav id="mainNav" aria-label="Main navigation">',
      '  <a href="' + prefix + '#about">About</a>',
      '  <a href="' + prefix + '#music-poll-section">Music</a>',
      '  <a href="' + prefix + '#shows">Shows</a>',
      '  <a href="' + prefix + '#merch">Merch</a>',
      '  <a href="' + prefix + '#booking">Booking</a>',
      '  <a href="epk.html">EPK</a>',
      '</nav>'
    ].join('\n');

    // Hamburger toggle
    var btn = document.getElementById('hamburgerBtn');
    var nav = document.getElementById('mainNav');
    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── FOOTER ──────────────────────────────────────────────
  var footer = document.querySelector('footer');
  if (footer) {
    footer.innerHTML = [
      '<div class="footer-container">',
      '  <h2 class="footer-logo">BUSTER</h2>',
      '  <div class="social-links">',
      '    <a href="https://www.instagram.com/bustertheband/" target="_blank" class="social-icon">Instagram</a>',
      '    <a href="https://www.youtube.com/@bustertheband" target="_blank" class="social-icon">YouTube</a>',
      '    <a href="https://open.spotify.com/artist/3exYjJhkzwnv436LMtWAGI" target="_blank" class="social-icon">Spotify</a>',
      '  </div>',
      '  <div class="footer-contact">',
      '    <p>Booking &amp; Press: <a href="mailto:buster@bustertheband.com">buster@bustertheband.com</a></p>',
      '  </div>',
      '  <p class="copyright">&copy; 2026 BUSTER. All Rights Reserved.</p>',
      '</div>'
    ].join('\n');
  }

  // ── BACK TO TOP ──────────────────────────────────────────
  var topBtn = document.getElementById('backToTop');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.style.display = (window.pageYOffset > 300) ? 'block' : 'none';
    });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();
