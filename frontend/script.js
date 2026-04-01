/* =====================================================
   PEAKMALE — script.js  (Full-Stack Version)
   Consumes the PeakMale REST API
   ===================================================== */

'use strict';

// ==================== API CONFIG ====================
// In production this is your Render.com backend URL
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://peakmale-api.onrender.com/api'; // ← change after deploy

// ==================== STATE ====================
let products      = [];   // fetched from API
let cart          = [];   // local cart (synced to backend if logged in)
let currentFilter = 'all';
let authToken     = null;
let currentUser   = null;

// ==================== DOM REFS ====================
const navbar       = document.getElementById('navbar');
const hamburger    = document.getElementById('hamburger');
const navLinks     = document.getElementById('navLinks');
const cartBtn      = document.getElementById('cartBtn');
const cartBadge    = document.getElementById('cartBadge');
const cartClose    = document.getElementById('cartClose');
const cartSidebar  = document.getElementById('cartSidebar');
const cartOverlay  = document.getElementById('cartOverlay');
const cartItems    = document.getElementById('cartItems');
const cartFooter   = document.getElementById('cartFooter');
const cartCountTxt = document.getElementById('cartCountText');
const productsGrid = document.getElementById('productsGrid');
const filterTabs   = document.querySelectorAll('.filter-tab');
const toastCont    = document.getElementById('toastContainer');
const heroParticles= document.getElementById('heroParticles');

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalCart();
  loadAuth();
  initNavbar();
  initHamburger();
  initCartEvents();
  initCountdown();
  initNewsletter();
  initCategoryCards();
  spawnParticles();
  initScrollReveal();
  updateCartUI();
  updateAuthUI();

  // Fetch products from API
  await fetchAndRenderProducts('all');
  initFilterTabs();
});

// ==================== AUTH HELPERS ====================
function loadAuth() {
  try {
    authToken   = localStorage.getItem('pm_token');
    const saved = localStorage.getItem('pm_user');
    currentUser = saved ? JSON.parse(saved) : null;
  } catch (e) {
    authToken   = null;
    currentUser = null;
  }
}

function saveAuth(token, user) {
  authToken   = token;
  currentUser = user;
  try {
    localStorage.setItem('pm_token', token);
    localStorage.setItem('pm_user', JSON.stringify(user));
  } catch (e) {}
}

function clearAuth() {
  authToken   = null;
  currentUser = null;
  try {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
  } catch (e) {}
}

function updateAuthUI() {
  // Update nav to show user name or login link
  const authArea = document.getElementById('navAuthArea');
  if (!authArea) return;
  if (currentUser) {
    authArea.innerHTML = `
      <span class="nav-user-name">Hi, ${currentUser.name.split(' ')[0]}</span>
      <button class="nav-logout-btn" id="logoutBtn">Logout</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  } else {
    authArea.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
  }
}

function handleLogout() {
  clearAuth();
  loadLocalCart();
  updateCartUI();
  updateAuthUI();
  showToast('Logged out successfully.');
}

// ==================== API HELPER ====================
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
  } catch (err) {
    console.error(`API error [${endpoint}]:`, err.message);
    throw err;
  }
}

// ==================== PRODUCT FETCHING ====================
async function fetchAndRenderProducts(filter) {
  showProductsLoading();
  try {
    const params = filter !== 'all' ? `?category=${filter}` : '';
    const data   = await apiFetch(`/products${params}`);
    products     = data.data;
    renderProducts(filter, products);
  } catch (err) {
    showProductsError();
  }
}

function showProductsLoading() {
  if (!productsGrid) return;
  productsGrid.innerHTML = `
    <div class="products-loading" style="grid-column:1/-1;text-align:center;padding:60px 0;color:#666;">
      <div class="loading-spinner" style="width:40px;height:40px;border:3px solid rgba(232,213,176,0.2);border-top-color:#e8d5b0;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
      <p style="font-family:'DM Mono',monospace;font-size:12px;letter-spacing:0.1em;">LOADING PRODUCTS...</p>
    </div>
  `;
}

function showProductsError() {
  if (!productsGrid) return;
  productsGrid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#666;">
      <p style="font-size:32px;margin-bottom:12px;">⚠️</p>
      <p>Could not load products. Please refresh the page.</p>
      <button onclick="fetchAndRenderProducts('all')" style="margin-top:16px;padding:10px 24px;background:#e8d5b0;color:#080808;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Retry</button>
    </div>
  `;
}

// ==================== NAVBAR ====================
function initNavbar() {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ==================== HAMBURGER MENU ====================
function initHamburger() {
  hamburger?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navLinks?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// ==================== PARTICLES ====================
function spawnParticles() {
  if (!heroParticles) return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const count    = isMobile ? 12 : 30;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p    = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 3 + 1;
    p.style.cssText = `left:${Math.random()*100}%;width:${size}px;height:${size}px;animation-delay:${Math.random()*15}s;animation-duration:${Math.random()*10+8}s;`;
    fragment.appendChild(p);
  }
  heroParticles.appendChild(fragment);
}

// ==================== PRODUCT RENDERING ====================
function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= rating ? '★' : '☆';
  return s;
}

function formatPrice(price) {
  return '₹' + price.toLocaleString('en-IN');
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.classList.add('product-card');
  card.setAttribute('data-id', product._id);
  card.setAttribute('data-category', product.category);
  card.setAttribute('aria-label', `${product.name} - ${formatPrice(product.price)}`);

  const discount = product.discountPercent || 0;

  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${product.image}" alt="${product.name}" loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1629654291663-b91ad427698f?w=500&q=80'" />
      <span class="product-cat-badge ${product.category}" aria-hidden="true">${product.badge || ''}</span>
      ${discount > 0 ? `<span class="product-discount-badge" aria-label="${discount}% off">-${discount}%</span>` : ''}
      <div class="product-overlay" aria-hidden="true">
        <button class="quick-add" data-id="${product._id}" aria-label="Quick add ${product.name} to cart">+ Add to Cart</button>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-desc">${product.description}</p>
      <div class="product-rating" aria-label="${product.rating} out of 5 stars">
        <span>${renderStars(product.rating)}</span>
        <span class="product-rating-count">(${product.ratingCount})</span>
      </div>
      <div class="product-price-row">
        <span class="product-price">${formatPrice(product.price)}</span>
        ${product.comparePrice ? `<span class="product-compare-price">${formatPrice(product.comparePrice)}</span>` : ''}
        <button class="add-to-cart" data-id="${product._id}" aria-label="Add ${product.name} to cart">Add +</button>
      </div>
      ${product.stock < 10 && product.stock > 0 ? `<p class="product-low-stock">⚠️ Only ${product.stock} left!</p>` : ''}
    </div>
  `;
  return card;
}

function renderProducts(filter, productList) {
  currentFilter = filter;
  if (!productsGrid) return;

  const filtered = filter === 'all' ? productList : productList.filter(p => p.category === filter);
  productsGrid.innerHTML = '';
  if (filtered.length === 0) {
    productsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px;color:#666;">No products found in this category.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((product, index) => {
    const card = createProductCard(product);
    card.style.transitionDelay = `${index * 0.06}s`;
    fragment.appendChild(card);
  });
  productsGrid.appendChild(fragment);
  observeProductCards();
}

// ==================== FILTER TABS ====================
function initFilterTabs() {
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const filter = tab.getAttribute('data-filter');
      fetchAndRenderProducts(filter);
    });
  });
}

// ==================== CATEGORY CARDS ====================
function initCategoryCards() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.getAttribute('data-cat');
      filterTabs.forEach(tab => {
        const match = tab.getAttribute('data-filter') === cat;
        tab.classList.toggle('active', match);
        tab.setAttribute('aria-selected', match ? 'true' : 'false');
      });
      fetchAndRenderProducts(cat);
    });
  });
}

// ==================== INTERSECTION OBSERVER ====================
function observeProductCards() {
  const cards    = productsGrid.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
  cards.forEach(c => observer.observe(c));
}

function initScrollReveal() {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ==================== CART (localStorage for guests, API for logged-in) ====================
function saveLocalCart() {
  try { localStorage.setItem('peakmale_cart', JSON.stringify(cart)); } catch (e) {}
}

function loadLocalCart() {
  try {
    const saved = localStorage.getItem('peakmale_cart');
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) { cart = []; }
}

async function addToCart(productId) {
  // Find product in fetched list
  const product = products.find(p => p._id === productId);
  if (!product) return;

  // If logged in — sync to backend
  if (authToken) {
    try {
      await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, qty: 1 }),
      });
      showToast(`${product.name} added to cart ✓`);
      animateCartIcon();
      await syncCartFromBackend();
      return;
    } catch (err) {
      showToast('Could not add to cart. Please try again.', 2000);
      return;
    }
  }

  // Guest: store locally
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, name: product.name, price: product.price, image: product.image, category: product.category, qty: 1 });
  }
  saveLocalCart();
  updateCartUI();
  showToast(`${product.name} added to cart ✓`);
  animateCartIcon();
}

async function syncCartFromBackend() {
  if (!authToken) return;
  try {
    const data = await apiFetch('/cart');
    // Map backend cart items to local format
    cart = (data.data.items || []).map(item => ({
      id:       item.product._id,
      name:     item.product.name,
      price:    item.priceAtAdd,
      image:    item.product.image,
      category: item.product.category,
      qty:      item.qty,
    }));
    updateCartUI();
  } catch (err) {
    console.error('Failed to sync cart:', err);
  }
}

async function removeFromCart(productId) {
  if (authToken) {
    try {
      await apiFetch(`/cart/${productId}`, { method: 'DELETE' });
      await syncCartFromBackend();
      return;
    } catch (err) {}
  }
  cart = cart.filter(item => item.id !== productId);
  saveLocalCart();
  updateCartUI();
}

async function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) { await removeFromCart(productId); return; }

  if (authToken) {
    try {
      await apiFetch('/cart', { method: 'POST', body: JSON.stringify({ productId, qty: newQty }) });
      await syncCartFromBackend();
      return;
    } catch (err) {}
  }

  item.qty = newQty;
  saveLocalCart();
  updateCartUI();
}

// ==================== CART UI ====================
function animateCartIcon() {
  cartBtn.classList.remove('bump');
  void cartBtn.offsetWidth;
  cartBtn.classList.add('bump');
}

function getCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function getCartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();

  cartBadge.textContent    = count;
  cartBadge.style.transform = count > 0 ? 'scale(1)' : 'scale(0.7)';
  if (cartCountTxt) cartCountTxt.textContent = `${count} item${count !== 1 ? 's' : ''}`;

  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><h3>Your cart is empty</h3><p>Add some bold gear to get started.</p></div>`;
    cartFooter.innerHTML = '';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1629654291663-b91ad427698f?w=100&q=80'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease qty">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase qty">+</button>
        </div>
        <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
      </div>
    `).join('');

    const freeShippingLeft = 999 - total;
    cartFooter.innerHTML = `
      ${freeShippingLeft > 0 ? `<p class="cart-free-ship-hint">Add <strong>${formatPrice(freeShippingLeft)}</strong> more for free shipping!</p>` : '<p class="cart-free-ship-hint free">🎉 You qualify for free shipping!</p>'}
      <div class="cart-subtotal">
        <span>Subtotal</span>
        <strong>${formatPrice(total)}</strong>
      </div>
      <p class="cart-note">Taxes & shipping calculated at checkout</p>
      <button class="btn btn-primary cart-checkout-btn" id="checkoutBtn">Proceed to Checkout →</button>
      <button class="cart-continue-btn" id="continueShoppingBtn">Continue Shopping</button>
    `;

    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
      showToast('🚀 Redirecting to checkout...');
      closeCart();
      // Pass cart to checkout via sessionStorage
      try { sessionStorage.setItem('pm_checkout_cart', JSON.stringify(cart)); } catch (e) {}
      setTimeout(() => { window.location.href = 'checkout.html'; }, 500);
    });
    document.getElementById('continueShoppingBtn')?.addEventListener('click', closeCart);
  }
}

// ==================== CART EVENTS ====================
function initCartEvents() {
  cartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
  document.addEventListener('click', e => {
    if (e.target.matches('.add-to-cart, .quick-add')) { addToCart(e.target.getAttribute('data-id')); return; }
    if (e.target.matches('.qty-btn')) {
      const id = e.target.getAttribute('data-id');
      changeQty(id, e.target.getAttribute('data-action') === 'increase' ? 1 : -1);
      return;
    }
    if (e.target.matches('.cart-item-remove')) { removeFromCart(e.target.getAttribute('data-id')); return; }
  });
}

function openCart() {
  cartSidebar.classList.add('open'); cartOverlay.classList.add('open');
  cartSidebar.setAttribute('aria-hidden', 'false'); cartOverlay.setAttribute('aria-hidden', 'false');
  cartBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
  if (authToken) syncCartFromBackend();
}

function closeCart() {
  cartSidebar.classList.remove('open'); cartOverlay.classList.remove('open');
  cartSidebar.setAttribute('aria-hidden', 'true'); cartOverlay.setAttribute('aria-hidden', 'true');
  cartBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
}

// ==================== TOAST ====================
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="toast-icon">✓</span><span>${message}</span>`;
  toastCont?.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ==================== COUNTDOWN ====================
function initCountdown() {
  let target;
  try {
    const stored = sessionStorage.getItem('peakmale_countdown');
    target = stored ? parseInt(stored) : Date.now() + 3 * 24 * 60 * 60 * 1000;
    if (!stored) sessionStorage.setItem('peakmale_countdown', target);
  } catch (e) { target = Date.now() + 3 * 24 * 60 * 60 * 1000; }

  const els = {
    days:  document.getElementById('countDays'),
    hours: document.getElementById('countHours'),
    mins:  document.getElementById('countMins'),
    secs:  document.getElementById('countSecs'),
  };
  if (!els.days) return;

  function tick() {
    const remaining = target - Date.now();
    if (remaining <= 0) { Object.values(els).forEach(el => { el.textContent = '00'; }); return; }
    const d = Math.floor(remaining / 864e5);
    const h = Math.floor((remaining % 864e5) / 36e5);
    const m = Math.floor((remaining % 36e5) / 6e4);
    const s = Math.floor((remaining % 6e4) / 1e3);
    els.days.textContent  = String(d).padStart(2, '0');
    els.hours.textContent = String(h).padStart(2, '0');
    els.mins.textContent  = String(m).padStart(2, '0');
    els.secs.textContent  = String(s).padStart(2, '0');
  }
  tick(); setInterval(tick, 1000);
}

// ==================== NEWSLETTER ====================
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const btn  = document.getElementById('subscribeBtn');
  const inp  = document.getElementById('emailInput');
  const ok   = document.getElementById('newsletterSuccess');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inp.value.trim();
    if (!email) return;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Use API to store newsletter subscription
    try {
      await apiFetch('/users/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
    } catch (_) {}

    setTimeout(() => {
      btn.textContent = 'SUBSCRIBED ✓';
      if (ok) ok.hidden = false;
      inp.value = '';
    }, 600);
  });
}

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ==================== SPIN ANIMATION (for loading) ====================
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
