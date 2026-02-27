// ===== Menu Data =====
const menuItems = [
  // 飯類
  { id: 1, cat: 'rice', emoji: '🍱', name: '招牌便當', desc: '精選豬排 + 白飯 + 三樣配菜，份量十足', price: 120 },
  { id: 2, cat: 'rice', emoji: '🍛', name: '咖哩雞飯', desc: '濃郁日式咖哩，搭配嫩雞腿肉', price: 110 },
  { id: 3, cat: 'rice', emoji: '🥩', name: '牛肉燴飯', desc: '慢燉牛腩，醬汁濃郁入味', price: 150 },
  { id: 4, cat: 'rice', emoji: '🍳', name: '荷包蛋炒飯', desc: '蛋香四溢，粒粒分明的黃金炒飯', price: 80 },

  // 麵類
  { id: 5, cat: 'noodle', emoji: '🍜', name: '紅燒牛肉麵', desc: '手工麵條，大塊牛腱，湯頭濃郁', price: 160 },
  { id: 6, cat: 'noodle', emoji: '🍝', name: '番茄肉醬麵', desc: '義式風味，新鮮番茄熬製肉醬', price: 130 },
  { id: 7, cat: 'noodle', emoji: '🍲', name: '麻辣乾麵', desc: '四川風味，麻辣鮮香，可選辣度', price: 100 },
  { id: 8, cat: 'noodle', emoji: '🥣', name: '清燉排骨湯麵', desc: '清甜骨湯，軟嫩排骨，暖胃首選', price: 140 },

  // 小吃
  { id: 9,  cat: 'snack', emoji: '🥟', name: '煎餃（10顆）', desc: '豬肉高麗菜內餡，底部酥脆', price: 70 },
  { id: 10, cat: 'snack', emoji: '🌮', name: '蔥油餅', desc: '手工擀製，層次分明，外酥內軟', price: 40 },
  { id: 11, cat: 'snack', emoji: '🍢', name: '關東煮（5串）', desc: '自選五串，湯頭清甜鮮美', price: 60 },
  { id: 12, cat: 'snack', emoji: '🥚', name: '滷蛋（2顆）', desc: '入味滷蛋，Q彈好吃', price: 20 },

  // 飲料
  { id: 13, cat: 'drink', emoji: '🧋', name: '珍珠奶茶', desc: '手搖現做，Q彈珍珠，甜度可調', price: 65 },
  { id: 14, cat: 'drink', emoji: '🍵', name: '熱綠茶', desc: '台灣高山茶，清香回甘', price: 30 },
  { id: 15, cat: 'drink', emoji: '🥤', name: '冬瓜檸檬', desc: '清涼消暑，酸甜適中', price: 45 },
  { id: 16, cat: 'drink', emoji: '☕', name: '美式咖啡', desc: '精選咖啡豆，香醇不苦澀', price: 55 },
];

// ===== State =====
let cart = []; // [{ item, qty }]
let currentCat = 'all';

// ===== DOM References =====
const menuGrid     = document.getElementById('menuGrid');
const cartBadge    = document.getElementById('cartBadge');
const cartItems    = document.getElementById('cartItems');
const cartTotal    = document.getElementById('cartTotal');
const cartFooter   = document.getElementById('cartFooter');
const cartSidebar  = document.getElementById('cartSidebar');
const cartOverlay  = document.getElementById('cartOverlay');
const modalOverlay = document.getElementById('modalOverlay');
const modalOrderId = document.getElementById('modalOrderId');
const categoryNav  = document.getElementById('categoryNav');

// ===== Render Menu =====
function renderMenu() {
  const filtered = currentCat === 'all'
    ? menuItems
    : menuItems.filter(i => i.cat === currentCat);

  menuGrid.innerHTML = filtered.map(item => `
    <div class="menu-card" data-id="${item.id}">
      <div class="menu-card-img">${item.emoji}</div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.desc}</div>
        <div class="menu-card-footer">
          <span class="menu-card-price">NT$ ${item.price}</span>
          <button class="add-btn" data-id="${item.id}" title="加入購物車">＋</button>
        </div>
      </div>
    </div>
  `).join('');

  // Bind add buttons
  menuGrid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCart(Number(btn.dataset.id)));
  });
}

// ===== Cart Logic =====
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  const existing = cart.find(c => c.item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ item, qty: 1 });
  }

  updateCartUI();
  bumpBadge();
}

function changeQty(id, delta) {
  const idx = cart.findIndex(c => c.item.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCartUI();
}

function updateCartUI() {
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.item.price * c.qty, 0);

  // Badge
  cartBadge.textContent = totalQty;

  // Items
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">購物車是空的，快去點餐吧！</p>';
    cartFooter.style.display = 'none';
  } else {
    cartItems.innerHTML = cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-emoji">${c.item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${c.item.name}</div>
          <div class="cart-item-price">NT$ ${c.item.price} × ${c.qty}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-id="${c.item.id}" data-delta="-1">－</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" data-id="${c.item.id}" data-delta="1">＋</button>
        </div>
      </div>
    `).join('');

    cartItems.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () =>
        changeQty(Number(btn.dataset.id), Number(btn.dataset.delta))
      );
    });

    cartFooter.style.display = 'block';
    cartTotal.textContent = `NT$ ${totalPrice}`;
  }
}

function bumpBadge() {
  cartBadge.classList.remove('bump');
  void cartBadge.offsetWidth; // reflow
  cartBadge.classList.add('bump');
  setTimeout(() => cartBadge.classList.remove('bump'), 300);
}

// ===== Cart Sidebar Toggle =====
function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ===== Checkout =====
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) return;

  const orderId = 'ORD-' + Date.now().toString().slice(-6);
  modalOrderId.textContent = `訂單編號：${orderId}`;
  modalOverlay.style.display = 'flex';
  closeCart();

  // Clear cart
  cart = [];
  updateCartUI();
});

document.getElementById('modalCloseBtn').addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

// Close modal on overlay click
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});

// ===== Category Filter =====
categoryNav.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    categoryNav.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    renderMenu();
  });
});

// ===== Init =====
renderMenu();
updateCartUI();
