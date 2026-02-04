document.addEventListener("DOMContentLoaded", function () {

  // URL Parameter Check for Secret Test Mode
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('mode') === 'test';

  // 🔹 PUBLIC Apps Script deployment URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRl5JcOXtEcsG8VcXur4kHohpPl634gS0iHp2ginodG-TXXeCJVyyk7r4E8ixjnvb9xg/exec";

  // =========================
  // 1. FORMS (Booking & Inner Circle)
  // =========================
  const bookingForm = document.querySelector('form[name="booking"]');
  const bookingStatus = document.getElementById('form-status');
  if (bookingForm) {
    bookingForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      bookingStatus.style.display = "block";
      bookingStatus.textContent = "Sending...";
      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: new FormData(bookingForm) });
        const data = await res.json();
        bookingStatus.textContent = data.success ? "Booking request sent!" : "Error: " + data.error;
        if (data.success) bookingForm.reset();
      } catch (err) { bookingStatus.textContent = "Oops! Something went wrong."; }
    });
  }

  const innerCircleForm = document.getElementById("innerCircleForm");
  const signupBtn = document.getElementById("submitBtn");
  const signupResponse = document.getElementById("responseMessage");
  if (innerCircleForm) {
    innerCircleForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      signupBtn.innerText = "Joining...";
      try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: new FormData(innerCircleForm) });
        const data = await res.json();
        signupResponse.textContent = data.success ? "Thanks for joining!" : "Signup failed.";
        if (data.success) innerCircleForm.reset();
      } catch (err) { signupResponse.textContent = "Error joining."; }
      finally { signupBtn.innerText = "JOIN"; }
    });
  }

  // =========================
  // 2. UPCOMING SHOWS (CALENDAR)
  // =========================
  const calendarId = "busterthebandslc@gmail.com";
  const apiKey = "AIzaSyAisms0ydY6R8a_dTPNwYMR7bNTs1F5hKM"; 
  const showsList = document.getElementById("shows-list");
  if (showsList) {
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&maxResults=5&orderBy=startTime&singleEvents=true`)
      .then(res => res.json())
      .then(data => {
        if (!data.items || data.items.length === 0) { showsList.innerHTML = "No upcoming shows!"; return; }
        showsList.innerHTML = data.items.map(event => {
          const d = new Date(event.start.dateTime || event.start.date);
          return `<div style="margin-bottom:15px;">🎸 <strong>${event.summary}</strong><br>📍 ${event.location || 'TBA'}<br>🕒 ${d.toLocaleDateString()}</div>`;
        }).join("");
      }).catch(() => { showsList.innerHTML = "Stay tuned for dates!"; });
  }

  // =========================
  // 3. MERCH & CART
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
  let cart = [];

  if (merchList) {
    // If in Test Mode, unlock the CSS via class
    if (isTestMode) merchList.classList.add("active-store");

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
      let val = parseInt(input.value);
      if (e.target.classList.contains("plus")) input.value = val + 1;
      if (e.target.classList.contains("minus") && val > 1) input.value = val - 1;
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      cart = [];
      cartItemsEl.innerHTML = "";
      let total = 0;
      merchItems.forEach(item => {
        const checkbox = merchList.querySelector(`input[type="checkbox"][data-id="${item.id}"]`);
        if (checkbox && checkbox.checked) {
          const qty = parseInt(merchList.querySelector(`.qty-input[data-id="${item.id}"]`).value);
          const size = merchList.querySelector(`.size-select[data-id="${item.id}"]`)?.value || null;
          cart.push({ id: item.id, name: item.name, price: item.price, quantity: qty, size });
          total += (item.price * qty);
          cartItemsEl.innerHTML += `<li>${item.name}${size ? ` (${size})` : ""} × ${qty}</li>`;
        }
      });
      cartEl.style.display = total > 0 ? "block" : "none";
      cartTotalEl.textContent = total.toFixed(2);
    });
  }

  // =========================
  // 4. STRIPE (SECRET SWITCH)
  // =========================
  if (checkoutBtn) {
    if (isTestMode) {
      checkoutBtn.innerText = "Checkout (Secret Test Mode)";
      checkoutBtn.addEventListener("click", async () => {
        if (cart.length === 0) return alert("Cart is empty!");
        try {
          const res = await fetch("https://buster-github-io-git-main-wes-furgasons-projects.vercel.app/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart })
          });
          const session = await res.json();
          const stripe = Stripe('pk_test_51Svqpj1sJKQpz5MMutWZAjn1ZoJju20mtduf945K5ltGkiq8f8epxiN4VvbqgFN3xU94G00zo8LzyRxb9KOeMstX00ZQjUZJIe');
          await stripe.redirectToCheckout({ sessionId: session.id });
        } catch (err) { alert("Checkout error."); }
      });
    } else {
      // Public Preview Behavior
      checkoutBtn.innerText = "Store Opening Soon";
      checkoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Buster Merch drops soon! Join the Inner Circle to get notified.");
        document.getElementById("inner-circle").scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
});