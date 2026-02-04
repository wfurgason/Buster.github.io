document.addEventListener("DOMContentLoaded", function () {

  // 🔹 PUBLIC Apps Script deployment URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRl5JcOXtEcsG8VcXur4kHohpPl634gS0iHp2ginodG-TXXeCJVyyk7r4E8ixjnvb9xg/exec";

  // =========================
  // 1. BOOKING FORM
  // =========================
  const bookingForm = document.querySelector('form[name="booking"]');
  const bookingStatus = document.getElementById('form-status');

  if (bookingForm) {
    bookingForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      bookingStatus.style.display = "block";
      bookingStatus.textContent = "Sending...";
      const formData = new FormData(bookingForm);
      formData.append("formType", "booking");

      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          bookingStatus.textContent = "Booking request sent! We'll get back to you soon.";
          bookingStatus.style.color = "#28a745";
          bookingForm.reset();
        } else {
          throw new Error(data.error || "Submission failed");
        }
      } catch (err) {
        bookingStatus.textContent = "Oops! Something went wrong. Please try again.";
        bookingStatus.style.color = "#dc3545";
      }
    });
  }

  // =========================
  // 2. INNER CIRCLE SIGNUP
  // =========================
  const innerCircleForm = document.getElementById("innerCircleForm");
  const signupBtn = document.getElementById("submitBtn");
  const signupResponse = document.getElementById("responseMessage");

  if (innerCircleForm) {
    innerCircleForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const originalText = signupBtn.innerText;
      signupBtn.innerText = "Joining...";
      signupBtn.disabled = true;
      const formData = new FormData(innerCircleForm);
      formData.append("formType", "fan");

      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          signupResponse.textContent = "Thanks for joining the Inner Circle!";
          signupResponse.style.color = "#28a745";
          innerCircleForm.reset();
        } else {
          throw new Error(data.error || "Signup failed");
        }
      } catch (err) {
        signupResponse.textContent = "Error joining. Please try again.";
        signupResponse.style.color = "#dc3545";
      } finally {
        signupBtn.innerText = originalText;
        signupBtn.disabled = false;
      }
    });
  }

  // =========================
  // 3. UPCOMING SHOWS (GOOGLE CALENDAR)
  // =========================
  const calendarId = "busterthebandslc@gmail.com";
  const apiKey = "AIzaSyAisms0ydY6R8a_dTPNwYMR7bNTs1F5hKM"; 
  const maxResults = 5;

  const showsList = Array.from(document.querySelectorAll('li, div, p'))
    .find(el => el.textContent.includes("Loading shows"));

  if (showsList) {
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`)
      .then(res => {
        if (!res.ok) throw new Error("API Key or Permissions Issue");
        return res.json();
      })
      .then(data => {
        if (!data.items || data.items.length === 0) {
          showsList.innerHTML = "No upcoming shows - check back soon!";
          return;
        }
        showsList.innerHTML = data.items.map(event => {
          const title = event.summary || "Buster Show";
          const location = event.location || "TBA";
          const d = new Date(event.start.dateTime || event.start.date);
          const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          const timeStr = event.start.dateTime ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "All Day";
          return `<div style="margin-bottom: 10px;">🎸 <strong>${title}</strong><br>📍 ${location}<br>🕒 ${dateStr} @ ${timeStr}</div>`;
        }).join("");
      })
      .catch(err => {
        showsList.innerHTML = "Stay tuned for upcoming dates!";
        console.error("Calendar Error:", err);
      });
  }

  // =========================
  // 4. MERCH ITEMS
  // =========================
  const merchItems = [
    { id: "sticker", name: "Buster Sticker", price: 3.0, image: "assets/sticker1.png" },
    { id: "tshirt", name: "Buster T-Shirt", price: 20.0, image: "assets/tshirt1.png", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] }
  ];

  const merchList = document.getElementById("merchList");
  const cartEl = document.getElementById("cart");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cart = [];

  if (merchList) {
    merchItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "merch-item";
      const sizeDropdown = item.sizes ? `<select class="size-select" data-id="${item.id}">${item.sizes.map(s => `<option value="${s}">${s}</option>`).join("")}</select>` : "";
      div.innerHTML = `
        <img src="${item.image}" class="sticker-sticker" alt="${item.name}">
        <div class="merch-name">${item.name}</div>
        <div class="merch-price">$${item.price.toFixed(2)}</div>
        ${sizeDropdown}
        <div class="quantity-selector">
          <button class="qty-btn minus" data-id="${item.id}">-</button>
          <input type="number" class="qty-input" value="1" min="1" data-id="${item.id}">
          <button class="qty-btn plus" data-id="${item.id}">+</button>
        </div>
        <label><input type="checkbox" data-id="${item.id}"> Add to cart</label>`;
      merchList.appendChild(div);
    });

    merchList.addEventListener("click", e => {
      if (!e.target.dataset.id) return;
      const input = merchList.querySelector(`.qty-input[data-id="${e.target.dataset.id}"]`);
      let val = parseInt(input.value, 10);
      if (e.target.classList.contains("plus")) val++;
      if (e.target.classList.contains("minus") && val > 1) val--;
      input.value = val;
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      cart.length = 0;
      cartItemsEl.innerHTML = "";
      let total = 0;
      merchItems.forEach(item => {
        const checkbox = merchList.querySelector(`input[type="checkbox"][data-id="${item.id}"]`);
        if (checkbox && checkbox.checked) {
          const qty = parseInt(merchList.querySelector(`.qty-input[data-id="${item.id}"]`).value, 10);
          const size = merchList.querySelector(`.size-select[data-id="${item.id}"]`)?.value || null;
          cart.push({ id: item.id, name: item.name, price: item.price, quantity: qty, size });
          total += (item.price * qty);
          cartItemsEl.innerHTML += `<li>${item.name}${size ? ` (${size})` : ""} × ${qty} — $${(item.price * qty).toFixed(2)}</li>`;
        }
      });
      cartEl.style.display = total > 0 ? "block" : "none";
      cartTotalEl.textContent = total.toFixed(2);
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      if (cart.length === 0) return alert("Your cart is empty!");
      try {
        const res = await fetch("https://buster-github-io-git-main-wes-furgasons-projects.vercel.app/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert("Checkout error.");
      } catch (err) {
        alert("Something went wrong.");
      }
    });
  }

}); // <--- This one closing brace now covers the whole file!