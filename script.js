document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector('form[name="booking"]');

  if (!form) return;

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
});

