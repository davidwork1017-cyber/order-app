'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Category, MenuItem, CartItem, Settings, Order } from '@/lib/types'
import { PAYMENT_LABELS } from '@/lib/types'

interface Props { initialMenuItems: MenuItem[]; categories: Category[]; settings: Settings }

function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: string }>>([])
  const show = useCallback((msg: string, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])
  return { toasts, show }
}

export default function OrderingClient({ initialMenuItems, categories, settings }: Props) {
  const [menuItems] = useState<MenuItem[]>(initialMenuItems)
  const [currentCat, setCurrentCat] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [annDismissed, setAnnDismissed] = useState(false)
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null)
  const [itemQty, setItemQty] = useState(1)
  const [itemOption, setItemOption] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [successOrder, setSuccessOrder] = useState<Order | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const { toasts, show: showToast } = useToast()

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem('cart') || '[]'))
      setTableNumber(localStorage.getItem('tableNumber') || '')
      setCustomerName(localStorage.getItem('customerName') || '')
      setGuestCount(Number(localStorage.getItem('guestCount') || 1))
    } catch {}
  }, [])

  useEffect(() => { try { localStorage.setItem('cart', JSON.stringify(cart)) } catch {} }, [cart])

  const filteredItems = menuItems.filter(item => {
    const catMatch = currentCat === 'all' || item.category?.slug === currentCat
    const qMatch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return catMatch && qMatch
  })

  const cartTotalQty = cart.reduce((s, c) => s + c.qty, 0)
  const subtotal = cart.reduce((s, c) => s + c.menuItem.price * c.qty, 0)
  const serviceCharge = settings.serviceCharge === 'true' ? Math.round(subtotal * 0.1) : 0
  const total = subtotal + serviceCharge

  function addToCart(item: MenuItem, qty: number, option: string, note: string) {
    const key = `${item.id}__${option}`
    setCart(prev => {
      const ex = prev.find(c => c.key === key && c.note === note)
      if (ex) return prev.map(c => c.key === key && c.note === note ? { ...c, qty: c.qty + qty } : c)
      return [...prev, { key, menuItem: item, qty, option, note }]
    })
  }

  function changeQty(key: string, delta: number) {
    setCart(prev => prev.map(c => c.key === key ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0))
  }

  function openCart() { setCartOpen(true); document.body.style.overflow = 'hidden' }
  function closeCart() {
    setCartOpen(false); document.body.style.overflow = ''
    localStorage.setItem('tableNumber', tableNumber)
    localStorage.setItem('customerName', customerName)
    localStorage.setItem('guestCount', String(guestCount))
  }

  async function handleCheckout() {
    if (!tableNumber.trim()) { showToast('請先輸入桌號', 'error'); return }
    if (cart.length === 0) { showToast('購物車是空的', 'error'); return }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: tableNumber.trim(), customerName: customerName.trim(),
          guestCount, notes: orderNotes.trim(), paymentMethod,
          items: cart.map(c => ({ menuItemId: c.menuItem.id, qty: c.qty, option: c.option, note: c.note })),
        }),
      })
      if (!res.ok) { showToast((await res.json()).error || '下單失敗', 'error'); return }
      const order: Order = await res.json()
      setCart([]); setOrderNotes(''); closeCart()
      setSuccessOrder(order); document.body.style.overflow = 'hidden'
    } catch { showToast('網路錯誤，請重試', 'error') }
  }

  function printReceipt(order: Order) {
    const lines = order.items.map(i => `${i.emoji} ${i.name}${i.option ? ' [' + i.option + ']' : ''} × ${i.qty}  NT$ ${i.subtotal}${i.note ? '\n   備註：' + i.note : ''}`).join('\n')
    const win = window.open('', '_blank', 'width=400,height=600')
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>收據</title></head><body>
        <div style="font-family:monospace;max-width:300px;margin:0 auto;padding:20px;font-size:13px;">
          <h2 style="text-align:center;">${settings.restaurantEmoji} ${settings.restaurantName}</h2>
          <p style="text-align:center;color:#888;">${new Date(order.createdAt).toLocaleString('zh-TW')}</p>
          <hr/><p>訂單：${order.orderNumber}</p><p>桌號：${order.tableNumber}${order.customerName ? '  ' + order.customerName : ''}</p>
          <p>人數：${order.guestCount}</p><hr/>
          <pre style="white-space:pre-wrap;">${lines}</pre><hr/>
          ${order.serviceCharge > 0 ? `<p>小計：NT$ ${order.subtotal}</p><p>服務費：NT$ ${order.serviceCharge}</p>` : ''}
          <p style="font-size:16px;font-weight:bold;">合計：NT$ ${order.total}</p>
          <p>付款：${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
          ${order.notes ? `<p>備註：${order.notes}</p>` : ''}
          <hr/><p style="text-align:center;">謝謝光臨！</p>
        </div>
        <script>window.onload=function(){window.print()}<\/script></body></html>`)
      win.document.close()
    }
  }

  return (
    <div>
      {settings.announcement && !annDismissed && (
        <div className="announcement-bar">
          <span>{settings.announcement}</span>
          <button className="ann-close" onClick={() => setAnnDismissed(true)}>✕</button>
        </div>
      )}

      <header className="header">
        <div className="header-inner">
          <div className="logo">{settings.restaurantEmoji} <span>{settings.restaurantName}</span></div>
          <button className="icon-btn" onClick={openCart} aria-label="購物車">
            🛒 <span className="cart-badge">{cartTotalQty}</span>
          </button>
        </div>
      </header>

      <div className="table-bar">
        <span>{tableNumber ? `桌號：${tableNumber}${customerName ? '  ' + customerName : ''}` : '請輸入桌號'}</span>
        <button className="table-edit-btn" onClick={openCart}>✏️ 設定</button>
      </div>

      <nav className="category-nav">
        <button className={`cat-btn${currentCat === 'all' ? ' active' : ''}`} onClick={() => { setCurrentCat('all'); setSearchQuery('') }}>🍽️ 全部</button>
        {categories.map(cat => (
          <button key={cat.id} className={`cat-btn${currentCat === cat.slug ? ' active' : ''}`} onClick={() => { setCurrentCat(cat.slug); setSearchQuery('') }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </nav>

      <div className="search-bar-wrap">
        <input type="search" className="search-bar" placeholder="🔍 搜尋菜品..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <main className="main">
        {filteredItems.length === 0 ? (
          <div className="no-results"><p>😕 找不到符合的菜品</p></div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map(item => {
              const inCart = cart.filter(c => c.menuItem.id === item.id).reduce((s, c) => s + c.qty, 0)
              return (
                <div key={item.id} className={`menu-card${!item.available ? ' unavailable' : ''}`} onClick={() => item.available && setActiveItem(item)}>
                  <div className="menu-card-img">{item.emoji}</div>
                  <div className="menu-card-body">
                    <div className="menu-card-name">{item.name}{!item.available && <span className="sold-out-tag">售完</span>}</div>
                    <div className="menu-card-desc">{item.description}</div>
                    <div className="menu-card-footer">
                      <span className="menu-card-price">NT$ {item.price}</span>
                      {item.available ? (
                        <button className={`add-btn${inCart > 0 ? ' in-cart' : ''}`} onClick={e => { e.stopPropagation(); item.options.length > 0 ? setActiveItem(item) : (addToCart(item, 1, '', ''), showToast(`已加入 ${item.name}`)) }}>
                          {inCart > 0 ? <span className="add-btn-qty">{inCart}</span> : '＋'}
                        </button>
                      ) : <span className="sold-out-btn">售完</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Cart */}
      {cartOpen && <div className="cart-overlay open" onClick={closeCart} />}
      <aside className={`cart-sidebar${cartOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 我的訂單</h2>
          <button className="close-cart" onClick={closeCart}>✕</button>
        </div>
        <div className="cart-customer-info">
          <div className="info-row"><label>桌號</label><input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="例：A3" maxLength={10} /></div>
          <div className="info-row"><label>姓名（選填）</label><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="您的姓名" maxLength={20} /></div>
          <div className="info-row"><label>人數</label><input type="number" value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} min={1} max={99} /></div>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? <p className="cart-empty">購物車是空的，快去點餐吧！</p> : cart.map(c => (
            <div key={c.key} className="cart-item">
              <div className="cart-item-emoji">{c.menuItem.emoji}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{c.menuItem.name}{c.option && <span className="cart-opt-tag">{c.option}</span>}</div>
                {c.note && <div className="cart-item-note">📝 {c.note}</div>}
                <div className="cart-item-price">NT$ {c.menuItem.price} × {c.qty} = <strong>NT$ {c.menuItem.price * c.qty}</strong></div>
              </div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={() => changeQty(c.key, -1)}>－</button>
                <span className="qty-num">{c.qty}</span>
                <button className="qty-btn" onClick={() => changeQty(c.key, 1)}>＋</button>
                <button className="remove-btn" onClick={() => setCart(p => p.filter(x => x.key !== c.key))}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <>
            <div className="cart-notes-wrap">
              <label className="notes-label">備註（整單）</label>
              <textarea className="order-notes" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="例：不要辣..." maxLength={200} rows={2} />
            </div>
            <div className="cart-footer">
              <div className="cart-total"><span>小計</span><span>NT$ {subtotal}</span></div>
              {settings.serviceCharge === 'true' && <div className="cart-total service-charge"><span>服務費 (10%)</span><span>NT$ {serviceCharge}</span></div>}
              <div className="cart-total grand-total"><span>合計</span><span>NT$ {total}</span></div>
              <div className="payment-methods">
                <label className="payment-label">付款方式</label>
                <div className="payment-options">
                  {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
                    <label key={val} className={`pay-opt${paymentMethod === val ? ' selected' : ''}`}>
                      <input type="radio" name="payment" value={val} checked={paymentMethod === val} onChange={() => setPaymentMethod(val)} />{label}
                    </label>
                  ))}
                </div>
              </div>
              <button className="checkout-btn" onClick={handleCheckout}>確認下單</button>
            </div>
          </>
        )}
      </aside>

      {/* Item Modal */}
      {activeItem && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setActiveItem(null) }}>
          <div className="modal item-modal">
            <button className="modal-close-x" onClick={() => setActiveItem(null)}>✕</button>
            <div className="item-modal-emoji">{activeItem.emoji}</div>
            <h2 className="item-modal-name">{activeItem.name}</h2>
            <p className="item-modal-desc">{activeItem.description}</p>
            <div className="item-modal-price">NT$ {activeItem.price}</div>
            {activeItem.options.length > 0 && (
              <div className="item-options">
                <label className="option-group-label">選項</label>
                <div className="option-btns">
                  {activeItem.options.map(opt => (
                    <label key={opt} className={`opt-btn${itemOption === opt ? ' selected' : ''}`}>
                      <input type="radio" name="itemOpt" value={opt} checked={itemOption === opt} onChange={() => setItemOption(opt)} />{opt}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="item-note-wrap">
              <label className="notes-label">備註（此品項）</label>
              <textarea className="order-notes" value={itemNote} onChange={e => setItemNote(e.target.value)} placeholder="例：不要蔥..." maxLength={100} rows={2} />
            </div>
            <div className="item-qty-row">
              <button className="qty-btn" onClick={() => setItemQty(q => Math.max(1, q - 1))}>－</button>
              <span className="qty-num">{itemQty}</span>
              <button className="qty-btn" onClick={() => setItemQty(q => Math.min(99, q + 1))}>＋</button>
            </div>
            <button className="checkout-btn" onClick={() => {
              addToCart(activeItem, itemQty, itemOption, itemNote)
              showToast(`已加入 ${activeItem.name} × ${itemQty}`)
              setActiveItem(null); setItemQty(1); setItemNote('')
            }}>加入購物車</button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successOrder && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setSuccessOrder(null); document.body.style.overflow = '' } }}>
          <div className="modal success-modal">
            <div className="modal-icon">🎉</div>
            <h2>訂單已送出！</h2>
            <p className="order-id-text">訂單編號：{successOrder.orderNumber}</p>
            <p className="modal-sub">桌號：{successOrder.tableNumber}　合計：NT$ {successOrder.total}　{PAYMENT_LABELS[successOrder.paymentMethod] || successOrder.paymentMethod}</p>
            <p className="modal-sub">預計 <strong>20–30 分鐘</strong> 內送達，請耐心等候。</p>
            <div className="success-actions">
              <button className="btn-outline" onClick={() => printReceipt(successOrder)}>🖨️ 列印收據</button>
              <button className="checkout-btn" onClick={() => { setSuccessOrder(null); document.body.style.overflow = '' }}>好的，謝謝！</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin */}
      <footer className="app-footer">
        <span className="admin-trigger" onClick={() => setAdminOpen(true)} title="管理員">⚙️</span>
      </footer>
      {adminOpen && <AdminLoginModal onSuccess={() => { setAdminOpen(false); window.location.href = '/admin' }} onCancel={() => setAdminOpen(false)} />}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type} show`}>{t.msg}</div>)}
      </div>
    </div>
  )
}

function AdminLoginModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  async function login() {
    if (!password) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      if (res.ok) { sessionStorage.setItem('adminAuth', password); onSuccess() }
      else { setError('密碼錯誤，請再試一次'); setPassword(''); ref.current?.focus() }
    } catch { setError('網路錯誤') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <div className="modal-icon">🔐</div>
        <h2>管理員登入</h2>
        <input ref={ref} type="password" className="admin-password-input" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="請輸入密碼" maxLength={30} />
        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px' }}>{error}</p>}
        <div className="success-actions">
          <button className="btn-outline" onClick={onCancel}>取消</button>
          <button className="checkout-btn" onClick={login} disabled={loading}>{loading ? '驗證中...' : '登入'}</button>
        </div>
      </div>
    </div>
  )
}
