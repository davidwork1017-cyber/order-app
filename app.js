/* ============================================================
   餐廳點餐系統 - Production App
   ============================================================ */

// ===== Default Menu Data =====
const DEFAULT_MENU = [
  // 飯類
  { id: 1,  cat: 'rice',   emoji: '🍱', name: '招牌便當',     desc: '精選豬排 + 白飯 + 三樣配菜，份量十足',       price: 120, available: true, options: [] },
  { id: 2,  cat: 'rice',   emoji: '🍛', name: '咖哩雞飯',     desc: '濃郁日式咖哩，搭配嫩雞腿肉',               price: 110, available: true, options: ['微辣','中辣','大辣'] },
  { id: 3,  cat: 'rice',   emoji: '🥩', name: '牛肉燴飯',     desc: '慢燉牛腩，醬汁濃郁入味',                   price: 150, available: true, options: [] },
  { id: 4,  cat: 'rice',   emoji: '🍳', name: '荷包蛋炒飯',   desc: '蛋香四溢，粒粒分明的黃金炒飯',             price: 80,  available: true, options: ['加蛋','加肉'] },
  // 麵類
  { id: 5,  cat: 'noodle', emoji: '🍜', name: '紅燒牛肉麵',   desc: '手工麵條，大塊牛腱，湯頭濃郁',             price: 160, available: true, options: ['細麵','粗麵','刀削麵'] },
  { id: 6,  cat: 'noodle', emoji: '🍝', name: '番茄肉醬麵',   desc: '義式風味，新鮮番茄熬製肉醬',               price: 130, available: true, options: [] },
  { id: 7,  cat: 'noodle', emoji: '🍲', name: '麻辣乾麵',     desc: '四川風味，麻辣鮮香，可選辣度',             price: 100, available: true, options: ['微辣','中辣','大辣','超辣'] },
  { id: 8,  cat: 'noodle', emoji: '🥣', name: '清燉排骨湯麵', desc: '清甜骨湯，軟嫩排骨，暖胃首選',             price: 140, available: true, options: ['細麵','粗麵'] },
  // 小吃
  { id: 9,  cat: 'snack',  emoji: '🥟', name: '煎餃（10顆）', desc: '豬肉高麗菜內餡，底部酥脆',                 price: 70,  available: true, options: [] },
  { id: 10, cat: 'snack',  emoji: '🌮', name: '蔥油餅',       desc: '手工擀製，層次分明，外酥內軟',             price: 40,  available: true, options: ['加蛋'] },
  { id: 11, cat: 'snack',  emoji: '🍢', name: '關東煮（5串）',desc: '自選五串，湯頭清甜鮮美',                   price: 60,  available: true, options: [] },
  { id: 12, cat: 'snack',  emoji: '🥚', name: '滷蛋（2顆）',  desc: '入味滷蛋，Q彈好吃',                       price: 20,  available: true, options: [] },
  // 飲料
  { id: 13, cat: 'drink',  emoji: '🧋', name: '珍珠奶茶',     desc: '手搖現做，Q彈珍珠，甜度可調',             price: 65,  available: true, options: ['少糖','半糖','全糖','無糖'] },
  { id: 14, cat: 'drink',  emoji: '🍵', name: '熱綠茶',       desc: '台灣高山茶，清香回甘',                     price: 30,  available: true, options: [] },
  { id: 15, cat: 'drink',  emoji: '🥤', name: '冬瓜檸檬',     desc: '清涼消暑，酸甜適中',                       price: 45,  available: true, options: ['少冰','去冰','正常冰'] },
  { id: 16, cat: 'drink',  emoji: '☕', name: '美式咖啡',     desc: '精選咖啡豆，香醇不苦澀',                   price: 55,  available: true, options: ['熱','冰'] },
];

const DEFAULT_CATEGORIES = [
  { id: 'all',    label: '全部',  emoji: '🍽️' },
  { id: 'rice',   label: '飯類',  emoji: '🍚' },
  { id: 'noodle', label: '麵類',  emoji: '🍜' },
  { id: 'snack',  label: '小吃',  emoji: '🥟' },
  { id: 'drink',  label: '飲料',  emoji: '🧋' },
];

const DEFAULT_SETTINGS = {
  restaurantName: '美食餐廳',
  restaurantEmoji: '🍜',
  serviceCharge: false,
  adminPassword: 'admin123',
  announcement: '',
};

// ===== Storage Helpers =====
const Storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

// ===== App State =====
let menuItems   = Storage.get('menuItems', DEFAULT_MENU);
let categories  = Storage.get('categories', DEFAULT_CATEGORIES);
let settings    = Storage.get('settings', DEFAULT_SETTINGS);
let orders      = Storage.get('orders', []);
let cart        = Storage.get('cart', []);
let currentCat  = 'all';
let searchQuery = '';
let isAdmin     = false;

// Item being viewed in detail modal
let activeItemId = null;
let activeItemQty = 1;

// ===== DOM References =====
const $ = id => document.getElementById(id);

// ===== Toast Notifications =====
function showToast(msg, type = 'success', duration = 2500) {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ===== Settings =====
function loadSettings() {
  settings = Storage.get('settings', DEFAULT_SETTINGS);
  // Apply restaurant name
  $('restaurantName').textContent = settings.restaurantName;
  $('restaurantLogo').firstChild.textContent = settings.restaurantEmoji + ' ';
  document.title = settings.restaurantName + ' 點餐';
  // Announcement
  if (settings.announcement) {
    $('announcementBar').style.display = 'flex';
    $('announcementText').textContent = settings.announcement;
  } else {
    $('announcementBar').style.display = 'none';
  }
}

// ===== Category Nav =====
function renderCategoryNav() {
  const nav = $('categoryNav');
  nav.innerHTML = categories.map(cat => `
    <button class="cat-btn${currentCat === cat.id ? ' active' : ''}" data-cat="${cat.id}">
      ${cat.emoji} ${cat.label}
    </button>
  `).join('');
  nav.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.cat;
      searchQuery = '';
      $('searchInput').value = '';
      renderCategoryNav();
      renderMenu();
    });
  });
}

// ===== Menu Rendering =====
function getFilteredMenu() {
  let items = currentCat === 'all'
    ? menuItems
    : menuItems.filter(i => i.cat === currentCat);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.desc.toLowerCase().includes(q)
    );
  }
  return items;
}

function renderMenu() {
  const items = getFilteredMenu();
  const grid = $('menuGrid');
  const noResults = $('noResults');

  if (items.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  grid.innerHTML = items.map(item => {
    const inCart = cart.find(c => c.itemId === item.id);
    const cartQty = inCart ? inCart.qty : 0;
    const unavailable = !item.available;
    return `
      <div class="menu-card${unavailable ? ' unavailable' : ''}" data-id="${item.id}" role="listitem">
        <div class="menu-card-img" aria-hidden="true">${item.emoji}</div>
        <div class="menu-card-body">
          <div class="menu-card-name">${item.name}${unavailable ? ' <span class="sold-out-tag">售完</span>' : ''}</div>
          <div class="menu-card-desc">${item.desc}</div>
          <div class="menu-card-footer">
            <span class="menu-card-price">NT$ ${item.price}</span>
            ${unavailable
              ? `<span class="sold-out-btn">售完</span>`
              : `<button class="add-btn${cartQty > 0 ? ' in-cart' : ''}" data-id="${item.id}" aria-label="加入 ${item.name}">
                  ${cartQty > 0 ? `<span class="add-btn-qty">${cartQty}</span>` : '＋'}
                </button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.menu-card:not(.unavailable)').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-btn') || e.target.classList.contains('add-btn-qty')) return;
      openItemModal(Number(card.dataset.id));
    });
  });

  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      const item = menuItems.find(i => i.id === id);
      if (item && item.options && item.options.length > 0) {
        openItemModal(id);
      } else {
        quickAddToCart(id);
      }
    });
  });
}

// ===== Item Detail Modal =====
function openItemModal(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;
  activeItemId = id;
  activeItemQty = 1;

  $('itemModalEmoji').textContent = item.emoji;
  $('itemModalName').textContent = item.name;
  $('itemModalDesc').textContent = item.desc;
  $('itemModalPrice').textContent = `NT$ ${item.price}`;
  $('itemQtyNum').textContent = '1';
  $('itemNote').value = '';

  // Options
  const optWrap = $('itemOptions');
  if (item.options && item.options.length > 0) {
    optWrap.innerHTML = `
      <div class="option-group">
        <label class="option-group-label">選項</label>
        <div class="option-btns">
          ${item.options.map((opt, i) => `
            <label class="opt-btn">
              <input type="radio" name="itemOpt" value="${opt}" ${i === 0 ? 'checked' : ''} />
              ${opt}
            </label>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    optWrap.innerHTML = '';
  }

  $('itemModalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeItemModal() {
  $('itemModalOverlay').style.display = 'none';
  document.body.style.overflow = '';
  activeItemId = null;
}

$('itemModalClose').addEventListener('click', closeItemModal);
$('itemModalOverlay').addEventListener('click', e => {
  if (e.target === $('itemModalOverlay')) closeItemModal();
});

$('itemQtyMinus').addEventListener('click', () => {
  if (activeItemQty > 1) {
    activeItemQty--;
    $('itemQtyNum').textContent = activeItemQty;
  }
});
$('itemQtyPlus').addEventListener('click', () => {
  if (activeItemQty < 99) {
    activeItemQty++;
    $('itemQtyNum').textContent = activeItemQty;
  }
});

$('itemAddToCartBtn').addEventListener('click', () => {
  if (!activeItemId) return;
  const item = menuItems.find(i => i.id === activeItemId);
  if (!item) return;

  const selectedOpt = item.options && item.options.length > 0
    ? (document.querySelector('input[name="itemOpt"]:checked') || {}).value || ''
    : '';
  const note = $('itemNote').value.trim();

  addToCart(activeItemId, activeItemQty, selectedOpt, note);
  closeItemModal();
  showToast(`已加入 ${item.name} × ${activeItemQty}`);
});

// ===== Cart Logic =====
function quickAddToCart(id) {
  addToCart(id, 1, '', '');
  const item = menuItems.find(i => i.id === id);
  if (item) showToast(`已加入 ${item.name}`);
}

function addToCart(id, qty, option, note) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  // Each unique (id + option) is a separate cart line
  const key = `${id}__${option}`;
  const existing = cart.find(c => c.key === key && c.note === note);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ key, itemId: id, qty, option, note });
  }

  saveCart();
  updateCartUI();
  bumpBadge();
  renderMenu(); // refresh add-btn states
}

function changeQty(key, delta) {
  const idx = cart.findIndex(c => c.key === key);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart();
  updateCartUI();
  renderMenu();
}

function removeCartLine(key) {
  cart = cart.filter(c => c.key !== key);
  saveCart();
  updateCartUI();
  renderMenu();
}

function saveCart() {
  Storage.set('cart', cart);
}

function calcTotals() {
  const subtotal = cart.reduce((s, c) => {
    const item = menuItems.find(i => i.id === c.itemId);
    return s + (item ? item.price * c.qty : 0);
  }, 0);
  const serviceCharge = settings.serviceCharge ? Math.round(subtotal * 0.1) : 0;
  return { subtotal, serviceCharge, total: subtotal + serviceCharge };
}

function updateCartUI() {
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  $('cartBadge').textContent = totalQty;

  const { subtotal, serviceCharge, total } = calcTotals();

  if (cart.length === 0) {
    $('cartItems').innerHTML = '<p class="cart-empty">購物車是空的，快去點餐吧！</p>';
    $('cartFooter').style.display = 'none';
    $('cartNotesWrap').style.display = 'none';
  } else {
    $('cartItems').innerHTML = cart.map(c => {
      const item = menuItems.find(i => i.id === c.itemId);
      if (!item) return '';
      return `
        <div class="cart-item">
          <div class="cart-item-emoji">${item.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}${c.option ? ` <span class="cart-opt-tag">${c.option}</span>` : ''}</div>
            ${c.note ? `<div class="cart-item-note">📝 ${c.note}</div>` : ''}
            <div class="cart-item-price">NT$ ${item.price} × ${c.qty} = <strong>NT$ ${item.price * c.qty}</strong></div>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn" data-key="${c.key}" data-delta="-1" aria-label="減少數量">－</button>
            <span class="qty-num">${c.qty}</span>
            <button class="qty-btn" data-key="${c.key}" data-delta="1" aria-label="增加數量">＋</button>
            <button class="remove-btn" data-key="${c.key}" aria-label="移除">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    $('cartItems').querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () =>
        changeQty(btn.dataset.key, Number(btn.dataset.delta))
      );
    });
    $('cartItems').querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => removeCartLine(btn.dataset.key));
    });

    $('cartFooter').style.display = 'block';
    $('cartNotesWrap').style.display = 'block';
    $('cartSubtotal').textContent = `NT$ ${subtotal}`;

    if (settings.serviceCharge) {
      $('serviceChargeRow').style.display = 'flex';
      $('serviceChargeAmt').textContent = `NT$ ${serviceCharge}`;
    } else {
      $('serviceChargeRow').style.display = 'none';
    }
    $('cartTotal').textContent = `NT$ ${total}`;
  }
}

function bumpBadge() {
  const badge = $('cartBadge');
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 300);
}

// ===== Cart Sidebar =====
function openCart() {
  $('cartSidebar').classList.add('open');
  $('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Restore saved table/name
  $('tableInput').value = Storage.get('tableNumber', '');
  $('customerName').value = Storage.get('customerName', '');
  $('guestCount').value = Storage.get('guestCount', 1);
}

function closeCart() {
  $('cartSidebar').classList.remove('open');
  $('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
  // Save table info
  Storage.set('tableNumber', $('tableInput').value.trim());
  Storage.set('customerName', $('customerName').value.trim());
  Storage.set('guestCount', $('guestCount').value);
  updateTableBar();
}

function updateTableBar() {
  const table = Storage.get('tableNumber', '');
  const name  = Storage.get('customerName', '');
  if (table) {
    $('tableDisplay').textContent = `桌號：${table}${name ? '  姓名：' + name : ''}`;
  } else {
    $('tableDisplay').textContent = '請輸入桌號';
  }
}

$('cartToggle').addEventListener('click', openCart);
$('closeCart').addEventListener('click', closeCart);
$('cartOverlay').addEventListener('click', closeCart);
$('tableEditBtn').addEventListener('click', openCart);

// ===== Checkout =====
$('checkoutBtn').addEventListener('click', () => {
  const tableNum = $('tableInput').value.trim();
  if (!tableNum) {
    showToast('請先輸入桌號', 'error');
    $('tableInput').focus();
    return;
  }
  if (cart.length === 0) {
    showToast('購物車是空的', 'error');
    return;
  }

  const { subtotal, serviceCharge, total } = calcTotals();
  const paymentMethod = (document.querySelector('input[name="payment"]:checked') || {}).value || 'cash';
  const paymentLabels = { cash: '現金', card: '刷卡', linepay: 'LINE Pay', transfer: '轉帳' };

  const order = {
    id: 'ORD-' + Date.now().toString().slice(-8),
    timestamp: new Date().toISOString(),
    table: tableNum,
    customerName: $('customerName').value.trim(),
    guestCount: Number($('guestCount').value) || 1,
    items: cart.map(c => {
      const item = menuItems.find(i => i.id === c.itemId);
      return {
        name: item ? item.name : '未知',
        emoji: item ? item.emoji : '❓',
        price: item ? item.price : 0,
        qty: c.qty,
        option: c.option,
        note: c.note,
        subtotal: (item ? item.price : 0) * c.qty,
      };
    }),
    notes: $('orderNotes').value.trim(),
    subtotal,
    serviceCharge,
    total,
    paymentMethod,
    paymentLabel: paymentLabels[paymentMethod] || paymentMethod,
    status: 'pending',
  };

  orders.push(order);
  Storage.set('orders', orders);

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  closeCart();

  // Show success modal
  $('successOrderId').textContent = `訂單編號：${order.id}`;
  $('successTableInfo').textContent = `桌號：${order.table}  合計：NT$ ${order.total}  付款：${order.paymentLabel}`;
  $('successModalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Store last order for printing
  Storage.set('lastOrder', order);
});

$('successCloseBtn').addEventListener('click', () => {
  $('successModalOverlay').style.display = 'none';
  document.body.style.overflow = '';
});
$('successModalOverlay').addEventListener('click', e => {
  if (e.target === $('successModalOverlay')) {
    $('successModalOverlay').style.display = 'none';
    document.body.style.overflow = '';
  }
});

// ===== Print Receipt =====
$('printReceiptBtn').addEventListener('click', () => {
  const order = Storage.get('lastOrder');
  if (!order) return;
  printReceipt(order);
});

function printReceipt(order) {
  const lines = order.items.map(i =>
    `${i.emoji} ${i.name}${i.option ? ' [' + i.option + ']' : ''} × ${i.qty}  NT$ ${i.subtotal}${i.note ? '\n   備註：' + i.note : ''}`
  ).join('\n');

  const content = `
    <div style="font-family:monospace;max-width:300px;margin:0 auto;padding:20px;font-size:13px;">
      <h2 style="text-align:center;margin-bottom:4px;">${settings.restaurantEmoji} ${settings.restaurantName}</h2>
      <p style="text-align:center;color:#888;margin-bottom:12px;">${new Date(order.timestamp).toLocaleString('zh-TW')}</p>
      <hr/>
      <p>訂單：${order.id}</p>
      <p>桌號：${order.table}${order.customerName ? '  姓名：' + order.customerName : ''}</p>
      <p>人數：${order.guestCount}</p>
      <hr/>
      <pre style="white-space:pre-wrap;">${lines}</pre>
      <hr/>
      ${order.serviceCharge ? `<p>小計：NT$ ${order.subtotal}</p><p>服務費：NT$ ${order.serviceCharge}</p>` : ''}
      <p style="font-size:16px;font-weight:bold;">合計：NT$ ${order.total}</p>
      <p>付款：${order.paymentLabel}</p>
      ${order.notes ? `<p>備註：${order.notes}</p>` : ''}
      <hr/>
      <p style="text-align:center;">謝謝光臨！</p>
    </div>
  `;

  const win = window.open('', '_blank', 'width=400,height=600');
  if (win) {
    win.document.write(`<!DOCTYPE html><html><head><title>收據</title></head><body>${content}<script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
  }
}

// ===== Announcement =====
$('annCloseBtn').addEventListener('click', () => {
  $('announcementBar').style.display = 'none';
});

// ===== Admin Panel =====
let adminLoginCallback = null;

function requireAdmin(callback) {
  if (isAdmin) { callback(); return; }
  adminLoginCallback = callback;
  $('adminPasswordInput').value = '';
  $('adminLoginError').style.display = 'none';
  $('adminLoginOverlay').style.display = 'flex';
  setTimeout(() => $('adminPasswordInput').focus(), 100);
}

$('adminLoginConfirmBtn').addEventListener('click', () => {
  const pwd = $('adminPasswordInput').value;
  if (pwd === settings.adminPassword) {
    isAdmin = true;
    $('adminLoginOverlay').style.display = 'none';
    if (adminLoginCallback) { adminLoginCallback(); adminLoginCallback = null; }
  } else {
    $('adminLoginError').style.display = 'block';
    $('adminPasswordInput').value = '';
    $('adminPasswordInput').focus();
  }
});

$('adminPasswordInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('adminLoginConfirmBtn').click();
});

$('adminLoginCancelBtn').addEventListener('click', () => {
  $('adminLoginOverlay').style.display = 'none';
  adminLoginCallback = null;
});

$('adminTrigger').addEventListener('click', () => {
  requireAdmin(openAdminPanel);
});

function openAdminPanel() {
  $('customerView').style.display = 'none';
  $('adminView').style.display = 'block';
  document.querySelector('.app-footer').style.display = 'none';
  $('announcementBar').style.display = 'none';
  renderAdminOrders();
  renderAdminMenu();
  loadAdminSettings();
}

$('adminLogoutBtn').addEventListener('click', () => {
  isAdmin = false;
  $('adminView').style.display = 'none';
  $('customerView').style.display = 'block';
  document.querySelector('.app-footer').style.display = 'block';
  loadSettings();
});

// Admin Tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $('adminOrders').style.display = 'none';
    $('adminMenu').style.display = 'none';
    $('adminSettings').style.display = 'none';
    $(`admin${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`).style.display = 'block';
  });
});

// ===== Order Management =====
const ORDER_STATUS = {
  pending:   { label: '待處理', color: '#f59e0b', next: 'preparing' },
  preparing: { label: '製作中', color: '#3b82f6', next: 'ready' },
  ready:     { label: '可取餐', color: '#10b981', next: 'done' },
  done:      { label: '已完成', color: '#6b7280', next: null },
  cancelled: { label: '已取消', color: '#ef4444', next: null },
};

function renderAdminOrders() {
  orders = Storage.get('orders', []);
  const filter = $('orderStatusFilter').value;
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const grid = $('ordersGrid');

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-orders">目前沒有訂單</p>';
    return;
  }

  // Sort: newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  grid.innerHTML = sorted.map(order => {
    const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
    const time = new Date(order.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    const itemLines = order.items.map(i =>
      `<div class="order-item-line">${i.emoji} ${i.name}${i.option ? ' [' + i.option + ']' : ''} × ${i.qty}${i.note ? ' <em>(' + i.note + ')</em>' : ''}</div>`
    ).join('');

    return `
      <div class="order-card" data-id="${order.id}">
        <div class="order-card-header">
          <div class="order-card-id">${order.id}</div>
          <div class="order-card-time">${time}</div>
          <div class="order-status-badge" style="background:${st.color}">${st.label}</div>
        </div>
        <div class="order-card-table">桌號：<strong>${order.table}</strong>${order.customerName ? '  ' + order.customerName : ''}  ${order.guestCount}人</div>
        <div class="order-items-list">${itemLines}</div>
        ${order.notes ? `<div class="order-notes-display">📝 ${order.notes}</div>` : ''}
        <div class="order-card-footer">
          <span class="order-total">NT$ ${order.total}  ${order.paymentLabel}</span>
          <div class="order-actions">
            ${st.next ? `<button class="btn-status" data-id="${order.id}" data-action="advance">→ ${ORDER_STATUS[st.next].label}</button>` : ''}
            ${order.status !== 'cancelled' && order.status !== 'done'
              ? `<button class="btn-cancel" data-id="${order.id}" data-action="cancel">取消</button>` : ''}
            <button class="btn-print-order" data-id="${order.id}">🖨️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-action="advance"]').forEach(btn => {
    btn.addEventListener('click', () => advanceOrderStatus(btn.dataset.id));
  });
  grid.querySelectorAll('[data-action="cancel"]').forEach(btn => {
    btn.addEventListener('click', () => cancelOrder(btn.dataset.id));
  });
  grid.querySelectorAll('.btn-print-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = orders.find(o => o.id === btn.dataset.id);
      if (order) printReceipt(order);
    });
  });
}

function advanceOrderStatus(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  const st = ORDER_STATUS[order.status];
  if (st && st.next) {
    order.status = st.next;
    Storage.set('orders', orders);
    renderAdminOrders();
    showToast(`訂單 ${id} 已更新為「${ORDER_STATUS[order.status].label}」`);
  }
}

function cancelOrder(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  if (!confirm(`確定要取消訂單 ${id}？`)) return;
  order.status = 'cancelled';
  Storage.set('orders', orders);
  renderAdminOrders();
  showToast(`訂單 ${id} 已取消`, 'error');
}

$('orderStatusFilter').addEventListener('change', renderAdminOrders);
$('refreshOrdersBtn').addEventListener('click', () => { renderAdminOrders(); showToast('已重新整理'); });
$('clearDoneOrdersBtn').addEventListener('click', () => {
  if (!confirm('確定要清除所有已完成和已取消的訂單？')) return;
  orders = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled');
  Storage.set('orders', orders);
  renderAdminOrders();
  showToast('已清除完成訂單');
});

// ===== Menu Management =====
function renderAdminMenu() {
  menuItems = Storage.get('menuItems', DEFAULT_MENU);
  const grid = $('menuAdminGrid');
  grid.innerHTML = menuItems.map(item => `
    <div class="menu-admin-card${!item.available ? ' unavailable' : ''}">
      <div class="menu-admin-emoji">${item.emoji}</div>
      <div class="menu-admin-info">
        <div class="menu-admin-name">${item.name} <span class="menu-admin-cat">${item.cat}</span></div>
        <div class="menu-admin-price">NT$ ${item.price}</div>
        <div class="menu-admin-status">${item.available ? '✅ 供應中' : '❌ 售完'}</div>
      </div>
      <div class="menu-admin-actions">
        <button class="btn-edit" data-id="${item.id}">✏️</button>
        <button class="btn-toggle-avail" data-id="${item.id}">${item.available ? '下架' : '上架'}</button>
        <button class="btn-delete-item" data-id="${item.id}">🗑️</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openMenuEditModal(Number(btn.dataset.id)));
  });
  grid.querySelectorAll('.btn-toggle-avail').forEach(btn => {
    btn.addEventListener('click', () => toggleItemAvailability(Number(btn.dataset.id)));
  });
  grid.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', () => deleteMenuItem(Number(btn.dataset.id)));
  });
}

function toggleItemAvailability(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;
  item.available = !item.available;
  Storage.set('menuItems', menuItems);
  renderAdminMenu();
  renderMenu();
  showToast(`${item.name} 已${item.available ? '上架' : '下架'}`);
}

function deleteMenuItem(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`確定要刪除「${item.name}」？`)) return;
  menuItems = menuItems.filter(i => i.id !== id);
  Storage.set('menuItems', menuItems);
  renderAdminMenu();
  renderMenu();
  showToast(`已刪除 ${item.name}`, 'error');
}

function populateCatSelect() {
  const sel = $('editCat');
  sel.innerHTML = categories.filter(c => c.id !== 'all').map(c =>
    `<option value="${c.id}">${c.emoji} ${c.label}</option>`
  ).join('');
}

function openMenuEditModal(id = null) {
  populateCatSelect();
  $('editError').style.display = 'none';

  if (id === null) {
    $('menuEditTitle').textContent = '新增菜品';
    $('editItemId').value = '';
    $('editEmoji').value = '🍽️';
    $('editName').value = '';
    $('editDesc').value = '';
    $('editCat').value = categories.find(c => c.id !== 'all')?.id || 'rice';
    $('editPrice').value = '';
    $('editAvailable').checked = true;
    $('editOptions').value = '';
  } else {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    $('menuEditTitle').textContent = '編輯菜品';
    $('editItemId').value = id;
    $('editEmoji').value = item.emoji;
    $('editName').value = item.name;
    $('editDesc').value = item.desc;
    $('editCat').value = item.cat;
    $('editPrice').value = item.price;
    $('editAvailable').checked = item.available;
    $('editOptions').value = (item.options || []).join(',');
  }

  $('menuEditOverlay').style.display = 'flex';
}

$('addMenuItemBtn').addEventListener('click', () => openMenuEditModal(null));
$('menuEditCancelBtn').addEventListener('click', () => { $('menuEditOverlay').style.display = 'none'; });
$('menuEditOverlay').addEventListener('click', e => {
  if (e.target === $('menuEditOverlay')) $('menuEditOverlay').style.display = 'none';
});

$('menuEditSaveBtn').addEventListener('click', () => {
  const name  = $('editName').value.trim();
  const price = Number($('editPrice').value);
  const cat   = $('editCat').value;

  if (!name) { showEditError('請輸入菜品名稱'); return; }
  if (!price || price < 0) { showEditError('請輸入有效價格'); return; }
  if (!cat) { showEditError('請選擇分類'); return; }

  const options = $('editOptions').value.split(',').map(s => s.trim()).filter(Boolean);
  const idVal = $('editItemId').value;

  if (idVal) {
    // Edit existing
    const item = menuItems.find(i => i.id === Number(idVal));
    if (item) {
      item.emoji     = $('editEmoji').value.trim() || '🍽️';
      item.name      = name;
      item.desc      = $('editDesc').value.trim();
      item.cat       = cat;
      item.price     = price;
      item.available = $('editAvailable').checked;
      item.options   = options;
    }
    showToast(`已更新 ${name}`);
  } else {
    // New item
    const newId = Math.max(0, ...menuItems.map(i => i.id)) + 1;
    menuItems.push({
      id: newId,
      emoji: $('editEmoji').value.trim() || '🍽️',
      name,
      desc: $('editDesc').value.trim(),
      cat,
      price,
      available: $('editAvailable').checked,
      options,
    });
    showToast(`已新增 ${name}`);
  }

  Storage.set('menuItems', menuItems);
  $('menuEditOverlay').style.display = 'none';
  renderAdminMenu();
  renderMenu();
});

function showEditError(msg) {
  $('editError').textContent = msg;
  $('editError').style.display = 'block';
}

// ===== Admin Settings =====
function loadAdminSettings() {
  settings = Storage.get('settings', DEFAULT_SETTINGS);
  $('settingRestaurantName').value = settings.restaurantName;
  $('settingRestaurantEmoji').value = settings.restaurantEmoji;
  $('settingServiceCharge').checked = settings.serviceCharge;
  $('settingAdminPassword').value = '';
  $('settingAnnouncement').value = settings.announcement || '';
}

$('saveSettingsBtn').addEventListener('click', () => {
  const name = $('settingRestaurantName').value.trim();
  if (!name) { showToast('請輸入餐廳名稱', 'error'); return; }

  settings.restaurantName  = name;
  settings.restaurantEmoji = $('settingRestaurantEmoji').value.trim() || '🍜';
  settings.serviceCharge   = $('settingServiceCharge').checked;
  settings.announcement    = $('settingAnnouncement').value.trim();

  const newPwd = $('settingAdminPassword').value;
  if (newPwd) settings.adminPassword = newPwd;

  Storage.set('settings', settings);
  showToast('設定已儲存');
});

$('clearAllOrdersBtn').addEventListener('click', () => {
  if (!confirm('確定要清除所有訂單？此操作無法復原！')) return;
  orders = [];
  Storage.set('orders', orders);
  renderAdminOrders();
  showToast('所有訂單已清除', 'error');
});

$('resetMenuBtn').addEventListener('click', () => {
  if (!confirm('確定要重置菜單為預設？所有自訂菜品將遺失！')) return;
  menuItems = JSON.parse(JSON.stringify(DEFAULT_MENU));
  Storage.set('menuItems', menuItems);
  renderAdminMenu();
  renderMenu();
  showToast('菜單已重置為預設');
});

// ===== Search =====
$('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  renderMenu();
});

// ===== Auto-refresh orders in admin (every 30s) =====
setInterval(() => {
  if (isAdmin && $('adminOrders').style.display !== 'none') {
    renderAdminOrders();
  }
}, 30000);

// ===== Init =====
function init() {
  loadSettings();
  renderCategoryNav();
  renderMenu();
  updateCartUI();
  updateTableBar();
}

init();
