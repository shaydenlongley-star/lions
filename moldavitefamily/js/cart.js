/* ═══════════════════════════════════════════════════════════
   MOLDAVITE FAMILY — Cart System
   ═══════════════════════════════════════════════════════════ */
(function () {
  const CART_KEY = 'moldavite_cart';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCart();
  }

  function updateCartCount() {
    const n = getCart().reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('.nav-cart-count').forEach(el => el.textContent = n);
  }

  function renderCart() {
    const itemsEl  = document.getElementById('cartItems');
    const totalEl  = document.getElementById('cartTotal');
    const footerEl = document.getElementById('cartFooter');
    if (!itemsEl) return;

    const cart  = getCart();

    if (!cart.length) {
      itemsEl.innerHTML = `<div class="cart-empty">
        <div class="cart-empty-icon">◈</div>
        <p>Your cart is empty — find your stone.</p>
        <a href="shop.html" class="btn btn-outline-gold" style="margin-top:12px;">Shop Now →</a>
      </div>`;
      if (totalEl)  totalEl.textContent  = '$0.00';
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (footerEl) footerEl.style.display = '';

    let total = 0;
    itemsEl.innerHTML = cart.map((item, idx) => {
      const line = (item.price || 0) * (item.qty || 1);
      total += line;
      return `<div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-sku">${item.sku}</div>
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" data-action="dec" data-idx="${idx}" aria-label="Decrease">−</button>
          <span class="cart-qty-num">${item.qty || 1}</span>
          <button class="cart-qty-btn" data-action="inc" data-idx="${idx}" aria-label="Increase">+</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="cart-item-price">$${line.toLocaleString()}</div>
          <button class="cart-remove" data-idx="${idx}" aria-label="Remove">✕</button>
        </div>
      </div>`;
    }).join('');

    if (totalEl) totalEl.textContent = '$' + total.toLocaleString();

    itemsEl.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = getCart(), idx = +btn.dataset.idx;
        if (btn.dataset.action === 'inc') c[idx].qty = (c[idx].qty || 1) + 1;
        else { c[idx].qty = (c[idx].qty || 1) - 1; if (c[idx].qty <= 0) c.splice(idx, 1); }
        saveCart(c);
      });
    });

    itemsEl.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = getCart(); c.splice(+btn.dataset.idx, 1); saveCart(c);
      });
    });
  }

  function openCart() {
    document.getElementById('cartOverlay')?.classList.add('open');
    document.getElementById('cartDrawer')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
  }

  function closeCart() {
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Expose for product page add-to-cart
  window.MFCart = { getCart, saveCart, updateCartCount, openCart, closeCart };

  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Cart icon → open drawer
    document.querySelectorAll('.nav-cart').forEach(el =>
      el.addEventListener('click', e => { e.preventDefault(); openCart(); })
    );

    // Close handlers
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);

    // Add to Cart buttons — capture price
    document.querySelectorAll('.btn-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        let sku, name, price;

        if (card) {
          sku   = card.querySelector('.product-sku')?.textContent?.trim() || 'unknown';
          name  = card.querySelector('.product-name')?.textContent?.trim() || 'Item';
          const priceEl = card.querySelector('.price-now');
          price = priceEl ? parseFloat(priceEl.textContent.replace(/[$,]/g, '')) : 0;
        } else {
          // Product detail page
          sku   = (document.querySelector('.product-info-sku')?.textContent || '').replace(/SKU:\s*/i,'').split('·')[0].trim() || 'unknown';
          name  = document.querySelector('.product-info h1')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || 'Item';
          const priceEl = document.querySelector('.info-price-now');
          price = priceEl ? parseFloat(priceEl.textContent.replace(/[$,]/g,'')) : 0;
        }

        const c = getCart(), existing = c.find(i => i.sku === sku);
        if (existing) existing.qty = (existing.qty || 1) + 1;
        else c.push({ sku, name, qty: 1, price });
        saveCart(c);
        openCart();
      });
    });
  });
})();
