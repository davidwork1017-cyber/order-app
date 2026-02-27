'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Order, MenuItem, Category, Settings } from '@/lib/types'
import { ORDER_STATUS_CONFIG, PAYMENT_LABELS } from '@/lib/types'

interface Props { orders: Order[]; menuItems: MenuItem[]; categories: Category[]; settings: Settings }

function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: string }>>([])
  const show = useCallback((msg: string, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])
  return { toasts, show }
}

export default function AdminClient({ orders: initialOrders, menuItems: initialItems, categories, settings: initialSettings }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialItems)
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [adminPwd, setAdminPwd] = useState('')
  const { toasts, show: showToast } = useToast()

  // Auth check
  useEffect(() => {
    const pwd = sessionStorage.getItem('adminAuth')
    if (!pwd) { window.location.href = '/' }
    else setAdminPwd(pwd)
  }, [])

  // Auto-refresh orders
  useEffect(() => {
    const interval = setInterval(async () => {
      if (activeTab === 'orders') {
        try {
          const res = await fetch('/api/orders')
          if (res.ok) setOrders(await res.json())
        } catch {}
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  async function refreshOrders() {
    try {
      const res = await fetch(`/api/orders${statusFilter !== 'all' ? '?status=' + statusFilter : ''}`)
      if (res.ok) { setOrders(await res.json()); showToast('已重新整理') }
    } catch { showToast('重新整理失敗', 'error') }
  }

  async function advanceStatus(id: string, nextStatus: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      if (res.ok) {
        const updated = await res.json()
        setOrders(prev => prev.map(o => o.id === id ? updated : o))
        showToast(`訂單狀態已更新`)
      }
    } catch { showToast('更新失敗', 'error') }
  }

  async function cancelOrder(id: string) {
    if (!confirm(`確定要取消訂單？`)) return
    await advanceStatus(id, 'CANCELLED')
  }

  async function clearDoneOrders() {
    if (!confirm('確定要清除所有已完成和已取消的訂單？')) return
    const toDelete = orders.filter(o => o.status === 'DONE' || o.status === 'CANCELLED')
    await Promise.all(toDelete.map(o => fetch(`/api/orders/${o.id}`, { method: 'DELETE' })))
    setOrders(prev => prev.filter(o => o.status !== 'DONE' && o.status !== 'CANCELLED'))
    showToast('已清除完成訂單')
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

  async function toggleAvailability(item: MenuItem) {
    try {
      const res = await fetch(`/api/menu/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !item.available }) })
      if (res.ok) {
        const updated = await res.json()
        setMenuItems(prev => prev.map(m => m.id === item.id ? updated : m))
        showToast(`${item.name} 已${!item.available ? '上架' : '下架'}`)
      }
    } catch { showToast('操作失敗', 'error') }
  }

  async function deleteMenuItem(item: MenuItem) {
    if (!confirm(`確定要刪除「${item.name}」？`)) return
    try {
      const res = await fetch(`/api/menu/${item.id}`, { method: 'DELETE' })
      if (res.ok) { setMenuItems(prev => prev.filter(m => m.id !== item.id)); showToast(`已刪除 ${item.name}`) }
    } catch { showToast('刪除失敗', 'error') }
  }

  async function saveMenuItem(data: Partial<MenuItem> & { options: string[] }) {
    try {
      if (isNew) {
        const res = await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { const item = await res.json(); setMenuItems(prev => [...prev, item]); showToast(`已新增 ${data.name}`) }
      } else if (editItem) {
        const res = await fetch(`/api/menu/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { const item = await res.json(); setMenuItems(prev => prev.map(m => m.id === editItem.id ? item : m)); showToast(`已更新 ${data.name}`) }
      }
      setEditOpen(false)
    } catch { showToast('儲存失敗', 'error') }
  }

  async function saveSettings(data: Partial<Settings> & { adminPassword?: string }) {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, currentPassword: adminPwd }),
      })
      if (res.ok) {
        setSettings(prev => ({ ...prev, ...data }))
        if (data.adminPassword) { sessionStorage.setItem('adminAuth', data.adminPassword); setAdminPwd(data.adminPassword) }
        showToast('設定已儲存')
      } else { showToast('儲存失敗', 'error') }
    } catch { showToast('儲存失敗', 'error') }
  }

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  return (
    <div>
      <header className="header admin-header">
        <div className="header-inner">
          <div className="logo">⚙️ 後台管理</div>
          <button className="icon-btn" onClick={() => { sessionStorage.removeItem('adminAuth'); window.location.href = '/' }}>🚪 登出</button>
        </div>
      </header>

      <div className="admin-tabs">
        {(['orders', 'menu', 'settings'] as const).map(tab => (
          <button key={tab} className={`admin-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'orders' ? '📋 訂單管理' : tab === 'menu' ? '🍽️ 菜單管理' : '⚙️ 設定'}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="admin-panel">
          <div className="admin-toolbar">
            <h2>訂單管理</h2>
            <div className="admin-toolbar-actions">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">全部狀態</option>
                {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button className="btn-primary" onClick={refreshOrders}>🔄 重新整理</button>
              <button className="btn-danger" onClick={clearDoneOrders}>🗑️ 清除已完成</button>
            </div>
          </div>
          <div className="orders-grid">
            {filteredOrders.length === 0 ? <p className="no-orders">目前沒有訂單</p> : filteredOrders.map(order => {
              const st = ORDER_STATUS_CONFIG[order.status]
              const time = new Date(order.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-card-id">{order.orderNumber}</div>
                    <div className="order-card-time">{time}</div>
                    <div className="order-status-badge" style={{ background: st.color }}>{st.label}</div>
                  </div>
                  <div className="order-card-table">桌號：<strong>{order.tableNumber}</strong>{order.customerName ? '  ' + order.customerName : ''}  {order.guestCount}人</div>
                  <div className="order-items-list">
                    {order.items.map(i => <div key={i.id} className="order-item-line">{i.emoji} {i.name}{i.option ? ` [${i.option}]` : ''} × {i.qty}{i.note ? <em> ({i.note})</em> : ''}</div>)}
                  </div>
                  {order.notes && <div className="order-notes-display">📝 {order.notes}</div>}
                  <div className="order-card-footer">
                    <span className="order-total">NT$ {order.total}  {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                    <div className="order-actions">
                      {st.next && <button className="btn-status" onClick={() => advanceStatus(order.id, st.next!)}>→ {ORDER_STATUS_CONFIG[st.next].label}</button>}
                      {order.status !== 'CANCELLED' && order.status !== 'DONE' && <button className="btn-cancel" onClick={() => cancelOrder(order.id)}>取消</button>}
                      <button className="btn-print-order" onClick={() => printReceipt(order)}>🖨️</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === 'menu' && (
        <div className="admin-panel">
          <div className="admin-toolbar">
            <h2>菜單管理</h2>
            <button className="btn-primary" onClick={() => { setIsNew(true); setEditItem(null); setEditOpen(true) }}>＋ 新增菜品</button>
          </div>
          <div className="menu-admin-grid">
            {menuItems.map(item => (
              <div key={item.id} className={`menu-admin-card${!item.available ? ' unavailable' : ''}`}>
                <div className="menu-admin-emoji">{item.emoji}</div>
                <div className="menu-admin-info">
                  <div className="menu-admin-name">{item.name} <span className="menu-admin-cat">{item.category?.label}</span></div>
                  <div className="menu-admin-price">NT$ {item.price}</div>
                  <div className="menu-admin-status">{item.available ? '✅ 供應中' : '❌ 售完'}</div>
                </div>
                <div className="menu-admin-actions">
                  <button className="btn-edit" onClick={() => { setIsNew(false); setEditItem(item); setEditOpen(true) }}>✏️</button>
                  <button className="btn-toggle-avail" onClick={() => toggleAvailability(item)}>{item.available ? '下架' : '上架'}</button>
                  <button className="btn-delete-item" onClick={() => deleteMenuItem(item)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <SettingsForm settings={settings} onSave={saveSettings} />
      )}

      {/* Edit Modal */}
      {editOpen && (
        <MenuEditModal
          item={editItem}
          categories={categories}
          isNew={isNew}
          onSave={saveMenuItem}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type} show`}>{t.msg}</div>)}
      </div>
    </div>
  )
}

function SettingsForm({ settings, onSave }: { settings: Settings; onSave: (data: Partial<Settings> & { adminPassword?: string }) => void }) {
  const [name, setName] = useState(settings.restaurantName)
  const [emoji, setEmoji] = useState(settings.restaurantEmoji)
  const [sc, setSc] = useState(settings.serviceCharge === 'true')
  const [ann, setAnn] = useState(settings.announcement)
  const [newPwd, setNewPwd] = useState('')

  return (
    <div className="admin-panel">
      <div className="settings-form">
        <h2>餐廳設定</h2>
        <div className="setting-group"><label>餐廳名稱</label><input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={30} /></div>
        <div className="setting-group"><label>餐廳 Emoji</label><input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} /></div>
        <div className="setting-group"><label>服務費</label><label className="toggle-label"><input type="checkbox" checked={sc} onChange={e => setSc(e.target.checked)} /><span>收取 10% 服務費</span></label></div>
        <div className="setting-group"><label>公告訊息</label><textarea value={ann} onChange={e => setAnn(e.target.value)} maxLength={100} rows={2} placeholder="例：本日特餐：牛肉麵 $120" /></div>
        <div className="setting-group"><label>新管理員密碼（留空不更改）</label><input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} maxLength={30} placeholder="留空則不更改" /></div>
        <button className="btn-primary" onClick={() => onSave({ restaurantName: name, restaurantEmoji: emoji, serviceCharge: sc ? 'true' : 'false', announcement: ann, ...(newPwd ? { adminPassword: newPwd } : {}) })}>💾 儲存設定</button>
      </div>
    </div>
  )
}

function MenuEditModal({ item, categories, isNew, onSave, onClose }: {
  item: MenuItem | null; categories: Category[]; isNew: boolean
  onSave: (data: Partial<MenuItem> & { options: string[] }) => void; onClose: () => void
}) {
  const [name, setName] = useState(item?.name || '')
  const [desc, setDesc] = useState(item?.description || '')
  const [emoji, setEmoji] = useState(item?.emoji || '🍽️')
  const [price, setPrice] = useState(item?.price || 0)
  const [catId, setCatId] = useState(item?.categoryId || categories[0]?.id || '')
  const [available, setAvailable] = useState(item?.available ?? true)
  const [options, setOptions] = useState((item?.options || []).join(','))
  const [error, setError] = useState('')

  function handleSave() {
    if (!name.trim()) { setError('請輸入菜品名稱'); return }
    if (!price || price < 0) { setError('請輸入有效價格'); return }
    if (!catId) { setError('請選擇分類'); return }
    onSave({ name: name.trim(), description: desc.trim(), emoji: emoji.trim() || '🍽️', price, categoryId: catId, available, options: options.split(',').map(s => s.trim()).filter(Boolean) })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal menu-edit-modal">
        <h2>{isNew ? '新增菜品' : '編輯菜品'}</h2>
        <div className="edit-form-group"><label>Emoji</label><input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} /></div>
        <div className="edit-form-group"><label>名稱 *</label><input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={30} /></div>
        <div className="edit-form-group"><label>描述</label><textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={80} rows={2} /></div>
        <div className="edit-form-group"><label>分類 *</label>
          <select value={catId} onChange={e => setCatId(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div className="edit-form-group"><label>價格 (NT$) *</label><input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0} /></div>
        <div className="edit-form-group"><label>狀態</label><label className="toggle-label"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} /><span>供應中</span></label></div>
        <div className="edit-form-group"><label>選項（逗號分隔）</label><input type="text" value={options} onChange={e => setOptions(e.target.value)} placeholder="小辣,中辣,大辣" maxLength={100} /></div>
        {error && <p className="edit-error">{error}</p>}
        <div className="success-actions">
          <button className="btn-outline" onClick={onClose}>取消</button>
          <button className="checkout-btn" onClick={handleSave}>儲存</button>
        </div>
      </div>
    </div>
  )
}
