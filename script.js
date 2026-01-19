document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     BOOKING FORM VALIDATION
     ========================= */

  const form = document.querySelector('form[name="booking"]');

  if (form) {
    form.addEventListener("submit", function (e) {
      const venue = form.venue.value.trim();
      const email = form.email.value.trim();
      const details = form.details.value.trim();
      const botField = form.querySelector('[name="bot-field"]').value;

      // Honeypot check (bots)
      if (botField !== "") {
        e.preventDefault();
        return;
      }

      // Venue validation
      if (venue.length < 3 || venue.length > 100) {
        alert("Venue name must be between 3 and 100 characters.");
        e.preventDefault();
        return;
      }

      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        e.preventDefault();
        return;
      }

      // Event details validation
      if (details.length < 20 || details.length > 1500) {
        alert("Event details must be at least 20 characters.");
        e.preventDefault();
        return;
      }
    });
  }

  /* =========================
     UPCOMING SHOWS (GOOGLE CAL)
     ========================= */

  const showsList = document.getElementById("shows-list");
  if (!showsList) return;

  const calendarId = "busterthebandslc@gmail.com";
  const apiKey = "AIzaSyA1T5W98T_6UHD4ZUzwPYRrBwt2p2Q4sYw";
  const maxResults = 5;

  const calendarUrl =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
    `?key=${apiKey}` +
    `&singleEvents=true` +
    `&orderBy=startTime` +
    `&timeMin=${new Date().toISOString()}` +
    `&maxResults=${maxResults}`;

  fetch(calendarUrl)
    .then(response => response.json())
    .then(data => {
      showsList.innerHTML = "";

      if (!data.items || data.items.length === 0) {
        showsList.innerHTML = "<li>No upcoming shows.</li>";
        return;
      }

      data.items.forEach(event => {
        const start = event.start.dateTime || event.start.date;
        const date = new Date(start)
      }

