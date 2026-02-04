document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('mode') === 'test';

  // --- 1. & 2. Forms (Keep these as they are) ---
  // [Insert your existing Booking and Inner Circle code here]

  // --- 3. Calendar (Keep as is) ---
  // [Insert your existing Calendar code here]

  // --- 4. Merch Logic ---
  const merchItems = [
    { id: "sticker", name: "Buster Sticker", price: 3.0, image: "assets/sticker1.png" },
    { id: "tshirt", name: "Buster T-Shirt", price: 20.0, image: "assets/tshirt1.png", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] }
  ];

  const merchList = document.getElementById("merchList");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cart = [];

  // If we are in Test Mode, add a class to the container to unlock CSS
  if (isTestMode && merchList) {
    merchList.classList.add("active-store");
  }

  // Render Merch
  if (merchList) {
    merchItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "merch-item";
      // We only show controls if in test mode
      const controlsHtml = isTestMode ? `
        <select class="size-select" data-id="${item.id}">${item.sizes ? item.sizes.map(s => `<option value="${s}">${s}</option>`).join("") : ""}</select>
        <div class="quantity-selector">
          <button class="qty-btn minus" data-id="${item.id}">-</button>
          <input type="number" class="qty-input" value="1" min="1" data-id="${item.id}">
          <button class="qty-btn plus" data-id="${item.id}">+</button>
        </div>
        <label><input type="checkbox" data-id="${item.id}"> Add to cart</label>
      ` : "";

      div.innerHTML = `
        <img src="${item.image}" class="sticker-sticker" alt="${item.name}">
        <div class="merch-name">${item.name}</div>
        <div class="merch-price">$${item.price.toFixed(2)}</div>
        ${controlsHtml}`;
      merchList.appendChild(div);
    });
  }

  // --- 5. Checkout Switch ---
  if (checkoutBtn) {
    if (isTestMode) {
      checkoutBtn.innerText = "Test Checkout (Stripe Active)";
      checkoutBtn.addEventListener("click", async () => {
        // [Insert your full Stripe Fetch & Redirect logic here from your backup]
        alert("Proceeding to Stripe Test Mode...");
      });
    } else {
      checkoutBtn.innerText = "Drops Soon - Join Inner Circle";
      checkoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Store opens soon! Join the Inner Circle for the link.");
        document.getElementById("innerCircleForm").scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
});