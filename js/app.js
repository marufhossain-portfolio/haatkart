/* ============================================================
   HaatKart - shared app logic
   - Loads products from products.json (fallback: data-fallback.js)
   - Cart in localStorage
   - Shared header / footer / toast / product-card rendering
   ============================================================ */

/* ---------- global state ---------- */
const HK = {
  products: [],
  loaded: false,
  source: 'loading',
  settings: { email: 'hello@haatkart.com.bd', whatsapp: '8801700000000', freeAbove: 2000, shipFee: 80, vat: 5 }
};

/* ---------- storage helpers ---------- */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
};

/* ---------- number helpers ---------- */
function money(n) {
  return '৳' + Number(n || 0).toLocaleString('en-BD');
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function qs(name) {
  return new URLSearchParams(location.search).get(name);
}
function stars(r) {
  const full = Math.round(Number(r) || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
function orderId() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return 'HK' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
         '-' + String(Math.floor(1000 + Math.random() * 9000));
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.className = type;
  el.innerHTML = (type === 'ok' ? '✓ ' : type === 'err' ? '⚠ ' : '') + esc(msg);
  requestAnimationFrame(() => el.classList.add('on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}

/* ---------- cart ---------- */
const Cart = {
  key: 'hk_cart',
  all() { return store.get(this.key, []); },
  count() { return this.all().reduce((s, i) => s + i.qty, 0); },
  save(items) {
    store.set(this.key, items);
    this.badge();
    document.dispatchEvent(new CustomEvent('cart:change'));
  },
  add(id, qty = 1) {
    const items = this.all();
    const p = HK.products.find(x => x.id === id);
    if (!p) return false;
    if (p.stock <= 0) { toast('Ei product-ta ekhon stock-e nei', 'err'); return false; }
    const row = items.find(i => i.id === id);
    if (row) row.qty = Math.min(row.qty + qty, p.stock);
    else items.push({ id, qty: Math.min(qty, p.stock) });
    this.save(items);
    toast(p.name + ' cart-e add holo', 'ok');
    return true;
  },
  setQty(id, qty) {
    const p = HK.products.find(x => x.id === id);
    const max = p ? p.stock : 999;
    let items = this.all();
    const row = items.find(i => i.id === id);
    if (!row) return;
    row.qty = Math.max(1, Math.min(Number(qty) || 1, max));
    this.save(items);
  },
  remove(id) {
    this.save(this.all().filter(i => i.id !== id));
    toast('Item cart theke soriye fela holo');
  },
  clear() { this.save([]); },
  badge() {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      const n = this.count();
      el.textContent = n;
      el.style.display = n > 0 ? 'grid' : 'none';
    });
  },
  lines() {
    return this.all()
      .map(i => ({ ...i, p: HK.products.find(x => x.id === i.id) }))
      .filter(i => i.p);
  },
  subtotal() { return this.lines().reduce((s, i) => s + i.p.price * i.qty, 0); }
};

/* ---------- product image / placeholder ---------- */
function productImg(p, cls = '') {
  if (p.img) {
    return `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" class="${cls}">`;
  }
  const icon = catIcon(p.cat);
  return `<div class="ph ${cls}"><span>${icon}</span><small>${esc(p.brand || '')}</small></div>`;
}
function catIcon(cat) {
  const m = {
    'Food & Groceries': '🌾',
    'Lubricants': '🛢️',
    'Electrical': '💡',
    'Home Appliance': '🍳'
  };
  return m[cat] || '🛍️';
}

/* ---------- product card ---------- */
function card(p) {
  const out = p.stock <= 0;
  const badge = out
    ? '<span class="badge out">Sold Out</span>'
    : p.badge ? `<span class="badge${p.badge.toLowerCase().includes('new') ? ' new' : ''}">${esc(p.badge)}</span>` : '';
  return `
  <article class="card reveal">
    <a class="card-media" href="product.html?id=${encodeURIComponent(p.id)}">
      ${badge}
      <button class="wish" data-wish="${esc(p.id)}" aria-label="Wishlist" title="Wishlist">♡</button>
      ${productImg(p)}
    </a>
    <div class="card-body">
      <span class="card-cat">${esc(p.cat)}</span>
      <a class="card-title" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
      <div class="stars">${stars(p.rating)}<span>(${p.reviews || 0})</span></div>
      <div class="card-foot">
        <div>
          <span class="price tk">${Number(p.price).toLocaleString('en-BD')}</span>
          ${p.old > p.price ? `<span class="old tk">${Number(p.old).toLocaleString('en-BD')}</span>` : ''}
        </div>
        <button class="add" data-add="${esc(p.id)}" ${out ? 'disabled title="Stock-e nei"' : 'title="Cart-e add"'}>+</button>
      </div>
      <span class="stock ${out ? '' : 'in'}">${out ? 'Stock-e nei' : 'Stock: ' + p.stock}</span>
    </div>
  </article>`;
}

function gridHTML(list) {
  if (!list.length) {
    return `<div class="empty"><div class="ico">🔍</div><h3>Kono product pawa jay nai</h3>
      <p>Filter bad diye abar try korun, ba notun product dekhte asun.</p></div>`;
  }
  return list.map(card).join('');
}

/* ---------- shared chrome (header + footer) ---------- */
const NAV = [
  { name: 'Home', href: 'index.html' },
  {
    name: 'Food & Groceries', href: 'shop.html?cat=' + encodeURIComponent('Food & Groceries'),
    sub: [
      { n: 'Groceries', href: 'shop.html?cat=' + encodeURIComponent('Food & Groceries') + '&sub=Groceries' },
      { n: 'Processed Food', href: 'shop.html?cat=' + encodeURIComponent('Food & Groceries') + '&sub=Processed Food' },
      { n: 'Fruits', href: 'shop.html?cat=' + encodeURIComponent('Food & Groceries') + '&sub=Fruits' }
    ]
  },
  {
    name: 'Lubricants', href: 'shop.html?cat=' + encodeURIComponent('Lubricants'),
    sub: [
      { n: 'Motorcycle Oil', href: 'shop.html?cat=Lubricants&sub=' + encodeURIComponent('Motorcycle Oil') },
      { n: 'Passenger Car Oil', href: 'shop.html?cat=Lubricants&sub=' + encodeURIComponent('Passenger Car Oil') },
      { n: 'Commercial Vehicle Oil', href: 'shop.html?cat=Lubricants&sub=' + encodeURIComponent('Commercial Vehicle Oil') },
      { n: 'ATF', href: 'shop.html?cat=Lubricants&sub=ATF' },
      { n: 'Gear Oil', href: 'shop.html?cat=Lubricants&sub=' + encodeURIComponent('Gear Oil') },
      { n: 'Hydraulic Oil', href: 'shop.html?cat=Lubricants&sub=' + encodeURIComponent('Hydraulic Oil') }
    ]
  },
  {
    name: 'Electrical', href: 'shop.html?cat=Electrical',
    sub: [
      { n: 'Lights', href: 'shop.html?cat=Electrical&sub=Lights' },
      { n: 'Electrical Accessories', href: 'shop.html?cat=Electrical&sub=' + encodeURIComponent('Electrical Accessories') },
      { n: 'Fan', href: 'shop.html?cat=Electrical&sub=Fan' }
    ]
  },
  {
    name: 'Home Appliance', href: 'shop.html?cat=' + encodeURIComponent('Home Appliance'),
    sub: [
      { n: 'Induction & Infrared Cooker', href: 'shop.html?cat=' + encodeURIComponent('Home Appliance') + '&sub=' + encodeURIComponent('Induction & Infrared Cooker') },
      { n: 'Rice Cooker', href: 'shop.html?cat=' + encodeURIComponent('Home Appliance') + '&sub=Rice Cooker' },
      { n: 'Electric Kettle', href: 'shop.html?cat=' + encodeURIComponent('Home Appliance') + '&sub=' + encodeURIComponent('Electric Kettle') },
      { n: 'Gas Stove', href: 'shop.html?cat=' + encodeURIComponent('Home Appliance') + '&sub=' + encodeURIComponent('Gas Stove') },
      { n: 'Electric Iron', href: 'shop.html?cat=' + encodeURIComponent('Home Appliance') + '&sub=' + encodeURIComponent('Electric Iron') }
    ]
  }
];

function mountHeader() {
  const host = document.getElementById('site-header');
  if (!host) return;
  const q = qs('q') || '';
  host.innerHTML = `
  <div class="topbar">
    <div class="wrap">
      <div>🚚 <b>Free delivery</b> - ৳2,000 er upore Dhaka city-wide</div>
      <div>🕐 Service: Saturday-Thursday, 9:00 AM - 6:00 PM &nbsp;|&nbsp; 📞 <b>08000-555777</b> (Toll Free)</div>
    </div>
  </div>
  <div class="header">
    <div class="wrap header-main">
      <a class="logo" href="index.html">
        <span class="logo-mark">H</span>Haat<span>Kart</span>
      </a>
      <form class="search" id="head-search" role="search">
        <input type="search" name="q" value="${esc(q)}" placeholder="Rice, LED bulb, engine oil..." aria-label="Search products">
        <button type="submit" aria-label="Search">🔍</button>
      </form>
      <div class="head-actions">
        <a class="head-btn" href="admin.html" title="Admin panel">
          <span class="ico">👤</span><span class="lbl">Admin</span>
        </a>
        <a class="head-btn" href="cart.html" title="Cart">
          <span class="ico">🛒</span><span class="lbl">Cart</span>
          <span class="cart-count" data-cart-count style="display:none">0</span>
        </a>
      </div>
    </div>
  </div>
  <nav class="nav" aria-label="Main">
    <div class="wrap">
      ${NAV.map(it => `
        <div class="nav-item">
          <a class="nav-link" href="${it.href}">${esc(it.name)}${it.sub ? ' <span class="caret">▼</span>' : ''}</a>
          ${it.sub ? `<div class="mega"><h4>${esc(it.name)}</h4>${it.sub.map(s => `<a href="${s.href}">${esc(s.n)}</a>`).join('')}</div>` : ''}
        </div>`).join('')}
      <div class="nav-item"><a class="nav-link" href="shop.html">🛒 All Products</a></div>
    </div>
  </nav>`;

  const f = document.getElementById('head-search');
  if (f) f.addEventListener('submit', e => {
    e.preventDefault();
    const v = f.querySelector('input').value.trim();
    location.href = 'shop.html' + (v ? '?q=' + encodeURIComponent(v) : '');
  });
}

function mountFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  host.innerHTML = `
  <section class="newsletter">
    <div class="wrap">
      <div>
        <h2>Notun offer jante chao?</h2>
        <p>Email dao - amra notun deal, combo pack ar price drop er songe e-mail korbo.</p>
      </div>
      <form class="news-form" id="news-form">
        <input type="email" placeholder="tomar@email.com" required aria-label="Email">
        <button class="btn btn-accent" type="submit">Subscribe</button>
      </form>
    </div>
  </section>
  <footer class="footer">
    <div class="wrap">
      <div class="foot-grid">
        <div>
          <a class="logo" href="index.html"><span class="logo-mark">H</span>Haat<span>Kart</span></a>
          <p>Bangladesh-er joto dorkar - rice theke engine oil, LED bulb theke rice cooker - sob kichu ek jaygay. 100% authentic product, brand warranty niye.</p>
          <div class="social">
            <a href="#" title="Facebook" aria-label="Facebook">f</a>
            <a href="#" title="LinkedIn" aria-label="LinkedIn">in</a>
            <a href="#" title="WhatsApp" aria-label="WhatsApp">✆</a>
            <a href="#" title="Instagram" aria-label="Instagram">◎</a>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="shop.html">All Products</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Shipping & Delivery</a></li>
            <li><a href="#">Return & Refund Policy</a></li>
            <li><a href="#">Terms and Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
        <div>
          <h4>Get Help</h4>
          <ul>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">How to Shop</a></li>
            <li><a href="#">Track Order</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Product Reviews</a></li>
            <li><a href="#">Career</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul class="foot-contact">
            <li><span>📞</span><div><b style="color:#fff">08000-555777</b><br>Toll Free</div></li>
            <li><span>✉️</span><div>hello@haatkart.com.bd</div></li>
            <li><span>📍</span><div>Bashundhara R/A,<br>Dhaka 1229, Bangladesh</div></li>
            <li><span>🕐</span><div>Sat-Thu, 9:00 AM - 6:00 PM</div></li>
          </ul>
          <h4 style="margin-top:18px">Pay with</h4>
          <div class="pay"><span>bKash</span><span>Nagad</span><span>Rocket</span><span>VISA</span><span>COD</span></div>
        </div>
      </div>
      <div class="foot-bottom">
        <div>© ${new Date().getFullYear()} HaatKart (demo). All Rights Reserved.</div>
        <div>Built by <b style="color:#fff">Md. Maruf Hossain</b> · <a href="https://marufhossain-portfolio.github.io/">Portfolio</a></div>
      </div>
    </div>
  </footer>`;

  const nf = document.getElementById('news-form');
  if (nf) nf.addEventListener('submit', e => {
    e.preventDefault();
    nf.reset();
    toast('Subscribe hoye geche! Dhonnobad.', 'ok');
  });
}

/* ---------- delegated click handling ---------- */
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) {
    e.preventDefault();
    if (Cart.add(add.dataset.add)) {
      add.classList.add('added');
      add.textContent = '✓';
      setTimeout(() => { add.classList.remove('added'); add.textContent = '+'; }, 1200);
    }
    return;
  }
  const wish = e.target.closest('[data-wish]');
  if (wish) {
    e.preventDefault();
    wish.classList.toggle('on');
    wish.textContent = wish.classList.contains('on') ? '♥' : '♡';
    toast(wish.classList.contains('on') ? 'Wishlist-e add holo' : 'Wishlist theke soriye fela holo');
    return;
  }
  const rm = e.target.closest('[data-remove]');
  if (rm) { e.preventDefault(); Cart.remove(rm.dataset.remove); }
});

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -40px' });

function observeReveals() {
  document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
}

/* ---------- product loading ---------- */
async function loadProducts() {
  if (HK.loaded) return HK.products;
  try {
    const res = await fetch('js/products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    HK.products = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
    if (data.settings) Object.assign(HK.settings, data.settings);
    HK.source = 'products.json';
  } catch (err) {
    // file:// preview or missing file -> use bundled fallback
    if (typeof FALLBACK_PRODUCTS !== 'undefined') {
      HK.products = FALLBACK_PRODUCTS;
      if (typeof FALLBACK_SETTINGS !== 'undefined') Object.assign(HK.settings, FALLBACK_SETTINGS);
      HK.source = 'fallback';
    } else {
      HK.products = [];
      HK.source = 'error';
    }
  }
  HK.loaded = true;
  return HK.products;
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  mountHeader();
  mountFooter();
  Cart.badge();
  observeReveals();
});
