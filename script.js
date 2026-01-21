document.addEventListener("DOMContentLoaded", function () {
  // --- Booking form validation ---
  const form = document.querySelector('form[name="booking"]');
  if (form) {
    form.addEventListener("submit", function (e) {
      const venue = form.venue.value.trim();
      const email = form.email.value.trim();
      const details = form.details.value.trim();
      const botField = form.querySelector('[name="bot-field"]').value;

      if (botField !== "") { e.preventDefault(); return; }

      if (venue.length < 3 || venue.length > 100) {
        alert("Venue name must be between 3 and 100 characters.");
        e.preventDefault(); return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        e.preventDefault(); return;
      }

      if (details.length < 20 || details.length > 1500) {
        alert("Event details must be at least 20 characters.");
        e.preventDefault(); return;
      }
    });
  }

  // --- Upcoming Shows from Google Calendar ---
  const calendarId = "busterthebandslc@gmail.com"; // replace with your calendar ID
  const apiKey = "AIzaSyA1T5W98T_6UHD4ZUzwPYRrBwt2p2Q4sYw"; // replace with your API key
  const maxResults = 5;

  const showsSection = document.querySelector("#shows");
  const showsList = showsSection ? showsSection.querySelector("ul") : null;

  if (showsList) {
    showsList.innerHTML = "<li>Loading shows...</li>";

    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.items || data.items.length === 0) {
          showsList.innerHTML = "<li>No upcoming shows</li>";
          return;
        }
            let start = "";
            if (event.start.dateTime) {
              const date = new Date(event.start.dateTime);
              const options = { weekday: "short", month: "short", day: "numeric" };
              const dateStr = date.toLocaleDateString(undefined, options);
              const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              start = `${dateStr} – ${timeStr}`;
            } else {
              const date = new Date(event.start.date);
              const options = { weekday: "short", month: "short", day: "numeric" };
              start = date.toLocaleDateString(undefined, options);
            }

            return `<li>🎸 ${title} – 📍 ${location} – 🕒 ${start}</li>`;
          })
          .join("");

        showsList.innerHTML = listItems;
      })
      .catch((err) => {
        console.error("Error fetching calendar events:", err);
        showsList.innerHTML = "<li>Error loading shows</li>";
      });
  }
});
