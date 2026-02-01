document.addEventListener("DOMContentLoaded", function () {

  // 🔹 PUBLIC Apps Script deployment URL (Anyone access)
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwRl5JcOXtEcsG8VcXur4kHohpPl634gS0iHp2ginodG-TXXeCJVyyk7r4E8ixjnvb9xg/exec";

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
      bookingStatus.style.color = "inherit";

      const formData = new FormData(bookingForm);
      formData.append("formType", "booking");

      try {
        const res = await fetch(SCRIPT_URL, {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (data.success) {
          bookingStatus.textContent =
            "Booking request sent! We'll get back to you soon.";
          bookingStatus.style.color = "#28a745";
          bookingForm.reset();
        } else {
          throw new Error(data.error || "Submission failed");
        }

      } catch (err) {
        bookingStatus.textContent =
          "Oops! Something went wrong. Please try again.";
        bookingStatus.style.color = "#dc3545";
        console.error("Booking Error:", err);
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
        const res = await fetch(SCRIPT_URL, {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (data.success) {
          signupResponse.textContent =
            "Thanks for joining the Inner Circle!";
          signupResponse.style.color = "#28a745";
          signupResponse.style.fontWeight = "bold";
          innerCircleForm.reset();
        } else {
          throw new Error(data.error || "Signup failed");
        }

      } catch (err) {
        signupResponse.textContent =
          "Error joining. Please try again.";
        signupResponse.style.color = "#dc3545";
        console.error("Signup Error:", err);

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
  const apiKey = "AIzaSyA1T5W98T_6UHD4ZUzwPYRrBwt2p2Q4sYw";
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
      .then(res => res.json())
      .then(data => {
        if (!data.items || data.items.length === 0) {
          showsList.innerHTML = "<li>No upcoming shows</li>";
          return;
        }

        showsList.innerHTML = data.items.map(event => {
          const title = event.summary || "Buster Show";
          const location = event.location || "TBA";

          let start = "";
          if (event.start.dateTime) {
            const d = new Date(event.start.dateTime);
            start = d.toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
          } else {
            start = new Date(event.start.date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric"
            });
          }

          return `<li>🎸 ${title} – 📍 ${location} – 🕒 ${start}</li>`;
        }).join("");
      })
      .catch(err => {
        console.error("Calendar Error:", err);
        showsList.innerHTML = "<li>Error loading shows</li>";
      });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  // ----------------------
  // MERCH ITEMS
  // ----------------------
  const merchItems = [
    {
      id: "sticker",
      name: "Buster Sticker",
      price: 3.00,
      image: "assets/sticker1.png"
    },
    {
      id: "tshirt",
      name: "Buster T-Shirt",
      price: 20.00,
      image: "assets/tshirt1.png",
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"]
    }
  ];

  const merchList = document.getElementById("merchList");
  const cartEl = document.getElementById("cart");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const cart = [];

  // ----------------------
  // RENDER MERCH ITEMS
  // ----------------------
  merchItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "merch-item";

    const sizeDropdown = item.sizes
      ? `<select class="size-select" data-id="${item.id}">
          ${item.sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
        </select>`
      : "";

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
      <label>
        <input type="checkbox" data-id="${item.id}">
        Add to cart
      </label>
    `;

    merchList.appendChild(div);
  });

  // ----------------------
  // QUANTITY BUTTONS
  // ----------------------
  merchList.addEventListener("click", e => {
    if (!e.target.dataset.id) return;

    const input = merchList.querySelector(`.qty-input[data-id="${e.target.dataset.id}"]`);
    let val = parseInt(input.value, 10);

    if (e.target.classList.contains("plus")) val++;
    if (e.target.classList.contains("minus") && val > 1) val--;

    input.value = val;
  });

  // ----------------------
  // ADD TO CART
  // ----------------------
  addToCartBtn.addEventListener("click", () => {
    cart.length = 0; // clear previous cart
    cartItemsEl.innerHTML = "";
    let total = 0;

    merchItems.forEach(item => {
      const checkbox = merchList.querySelector(`input[type="checkbox"][data-id="${item.id}"]`);
      if (!checkbox.checked) return;

      const qty = parseInt(
        merchList.querySelector(`.qty-input[data-id="${item.id}"]`).value,
        10
      );

      const sizeSelect = merchList.querySelector(`.size-select[data-id="${item.id}"]`);
      const size = sizeSelect ? sizeSelect.value : null;

      const lineTotal = item.price * qty;
      total += lineTotal;

      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: qty,
        size: size
      });

      const sizeLabel = size ? ` (${size})` : "";
      cartItemsEl.innerHTML += `<li>${item.name}${sizeLabel} × ${qty} — $${lineTotal.toFixed(2)}</li>`;
    });

    if (total > 0) {
      cartEl.style.display = "block";
      cartTotalEl.textContent = total.toFixed(2);
    } else {
      cartEl.style.display = "none";
    }
  });

  // ----------------------
  // STRIPE CHECKOUT
  // ----------------------
  async function checkoutWithStripe(cart) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Redirecting...";

    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbwRl5JcOXtEcsG8VcXur4kHohpPl634gS0iHp2ginodG-TXXeCJVyyk7r4E8ixjnvb9xg/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "stripe",
            cart: cart
          })
        }
      );

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment error. Please try again.");
        console.error("Stripe response error:", data);
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Checkout";
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("An error occurred. Please try again.");
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Checkout";
    }
  }

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Please add items to your cart first!");
      return;
    }
    checkoutWithStripe(cart);
  });
});