document.addEventListener("DOMContentLoaded", function () {

  // 🔹 PUBLIC Apps Script deployment URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxE2pyBVgn0gy9WjgIPbu7aWXYQU1wbkkGCG9LRKamAAeWmPffWet_qwocW3nYv5x0D-g/exec";

  // URL Parameter Check for Secret Test Mode
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('mode') === 'test';

  // =========================
  // 1. UNIVERSAL FORM HANDLER (GAS)
  // =========================
  async function handleFormSubmit(formElement, statusElement, buttonElement, successMsg) {
    const formData = new FormData(formElement);
    const urlEncodedData = new URLSearchParams(formData);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: urlEncodedData.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const data = await res.json();

      if (data.success) {
        if (statusElement) {
          statusElement.textContent = successMsg;
          statusElement.style.display = "block";
          statusElement.style.color = "#4CAF50";
        }
        formElement.reset();
        if (buttonElement && formElement.id === "innerCircleForm") {
          buttonElement.innerText = "JOINED!";
        }
      } else {
        throw new Error(data.error || "Server error");
      }
    } catch (err) {
      console.error("Form Error:", err);
      if (statusElement) {
        statusElement.textContent = "Oops! Something went wrong.";
        statusElement.style.display = "block";
        statusElement.style.color = "#ff4444";
      }
    } finally {
      if (buttonElement && formElement.id === "innerCircleForm") {
        setTimeout(() => { buttonElement.innerText = "JOIN"; }, 3000);
      }
    }
  }

  // =========================
  // 2. BOOKING FORM
  // =========================
  const bookingForm = document.querySelector('form[name="booking"]');
  const bookingStatus = document.getElementById('form-status');

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      bookingStatus.style.display = "block";
      bookingStatus.textContent = "Sending...";
      handleFormSubmit(bookingForm, bookingStatus, null, "Booking request sent!");
    });
  }

  // =========================
  // 3. INNER CIRCLE FORM
  // =========================
  const innerCircleForm = document.getElementById("innerCircleForm");
  const signupBtn = document.getElementById("submitBtn");
  const signupResponse = document.getElementById("responseMessage");

  if (innerCircleForm) {
    innerCircleForm.addEventListener("submit", function (e) {
      e.preventDefault();
      signupBtn.innerText = "Joining...";
      signupResponse.classList.remove("success-glow");

      handleFormSubmit(innerCircleForm, signupResponse, signupBtn, "Thanks for joining!")
        .then(() => signupResponse.classList.add("success-glow"));
    });
  }

  // =========================
  // 4. SONG POLL HANDLER 
  // =========================
  const pollForm = document.getElementById('busterPollForm');
  const pollBtn = document.getElementById('pollSubmitBtn');
  const pollResponse = document.getElementById('pollResponse');

  if (pollForm) {
    pollForm.addEventListener("submit", function (e) {
      e.preventDefault();

      pollBtn.disabled = true;
      pollBtn.innerText = "RECORDING VOTE...";

      const formData = new FormData(pollForm);
      const params = new URLSearchParams(formData);

      fetch(SCRIPT_URL, {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          pollResponse.innerText = "Voted! We'll see you at the show.";
          pollResponse.style.color = "#4CAF50";
          pollBtn.innerText = "VOTE CAST";
        } else {
          throw new Error(data.error);
        }
      })
      .catch(err => {
        console.error("Poll Error:", err);
        pollResponse.innerText = "Oops! Try again?";
        pollResponse.style.color = "#ff4444";
        pollBtn.disabled = false;
        pollBtn.innerText = "CAST VOTE";
      });
    });
  }
  // =========================
  // 4. TOP SONG HANDLER 
  // =========================
  const pollLeaderEl = document.getElementById("pollLeader");

async function updatePollLeader() {
  try {
    const res = await fetch(
      SCRIPT_URL + "?mode=pollResults"
    );
    const data = await res.json();

    if (data.success && data.leader) {
      pollLeaderEl.innerHTML = `🔥 Fan Favorite Right Now: <strong>${data.leader}</strong>`;
    } else {
      pollLeaderEl.innerText = "Be the first to vote!";
    }
  } catch (err) {
    console.error("Poll Leader Error:", err);
  }
}

// Initial load
if (pollLeaderEl) {
  updatePollLeader();
  setInterval(updatePollLeader, 20000); // every 20 seconds
}


  // =========================
  // 5. UPCOMING SHOWS
  // =========================
  const calendarId = "busterthebandslc@gmail.com";
  const apiKey = "AIzaSyAisms0ydY6R8a_dTPNwYMR7bNTs1F5hKM";
  const showsList = document.getElementById("shows-list");

  if (showsList) {
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&maxResults=5&orderBy=startTime&singleEvents=true`)
      .then(res => res.json())
      .then(data => {
        if (!data.items || data.items.length === 0) {
          showsList.innerHTML = "No upcoming shows!";
          return;
        }
        showsList.innerHTML = data.items.map(event => {
          const d = new Date(event.start.dateTime || event.start.date);
          return `<div style="margin-bottom:15px;">🎸 <strong>${event.summary}</strong><br>📍 ${event.location || 'TBA'}<br>🕒 ${d.toLocaleDateString()}</div>`;
        }).join("");
      })
      .catch(() => {
        showsList.innerHTML = "Stay tuned for dates!";
      });
  }

  // =========================
  // 6. MERCH + CART
  // =========================
  const merchItems = [
    { id: "sticker", name: "Buster Sticker", price: 3.0, image: "assets/sticker1.png" },
    { id: "tshirt", name: "Buster T-Shirt", price: 20.0, image: "assets/tshirt1.png", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] }
  ];

  const merchList = document.getElementById("merchList");
  const merchSection = document.getElementById("merch");
  const cartEl = document.getElementById("cart");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const addToCartBtn = document.getElementById("addToCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  let cart = [];

  if (isTestMode) {
    merchList?.classList.add("active-store");
    merchSection?.classList.add("active-store");
    document.body.classList.add("test-mode-active");
  }

  if (merchList) {
    merchItems.forEach(item => {
      const div = document.createElement("div");
      const sizeDropdown = item.sizes
        ? `<select class="size-select" data-id="${item.id}">${item.sizes.map(s => `<option value="${s}">${s}</option>`).join("")}</select>`
        : "";

      div.className = "merch-item";
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="merch-name">${item.name}</div>
        <div class="merch-price">$${item.price.toFixed(2)}</div>
        ${sizeDropdown}
        <div class="quantity-selector">
          <button class="qty-btn minus" data-id="${item.id}">-</button>
          <input type="number" class="qty-input" value="1" min="1" data-id="${item.id}">
          <button class="qty-btn plus" data-id="${item.id}">+</button>
        </div>
        <label><input type="checkbox" data-id="${item.id}"> Add to cart</label>
      `;
      merchList.appendChild(div);
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      cart = [];
      cartItemsEl.innerHTML = "";
      let total = 0;

      merchItems.forEach(item => {
        const checkbox = merchList.querySelector(`input[type="checkbox"][data-id="${item.id}"]`);
        if (checkbox?.checked) {
          const qty = parseInt(merchList.querySelector(`.qty-input[data-id="${item.id}"]`).value);
          const size = merchList.querySelector(`.size-select[data-id="${item.id}"]`)?.value || null;
          cart.push({ id: item.id, name: item.name, price: item.price, quantity: qty, size });
          total += item.price * qty;
          cartItemsEl.innerHTML += `<li>${item.name}${size ? ` (${size})` : ""} × ${qty}</li>`;
        }
      });

      cartEl.style.display = total > 0 ? "block" : "none";
      cartTotalEl.textContent = total.toFixed(2);
    });
  }

  // =========================
  // 7. STRIPE / STORE MODE
  // =========================
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", e => {
      e.preventDefault();
      alert("Buster Merch drops soon! Join the Inner Circle to get notified.");
      document.getElementById("inner-circle").scrollIntoView({ behavior: "smooth" });
    });
  }

});