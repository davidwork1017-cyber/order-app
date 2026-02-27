export interface Category {
  id: string; slug: string; label: string; emoji: string; sortOrder: number
}
export interface MenuItem {
  id: string; name: string; description: string; emoji: string
  price: number; available: boolean; sortOrder: number
  options: string[]; categoryId: string; category?: Category
}
export interface CartItem {
  key: string; menuItem: MenuItem; qty: number; option: string; note: string
}
export interface OrderItem {
  id: string; orderId: string; menuItemId: string
  name: string; emoji: string; price: number; qty: number
  option: string; note: string; subtotal: number
}
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DONE' | 'CANCELLED'
export interface Order {
  id: string; orderNumber: string; tableNumber: string; customerName: string
  guestCount: number; notes: string; subtotal: number; serviceCharge: number
  total: number; paymentMethod: string; status: OrderStatus
  createdAt: string; updatedAt: string; items: OrderItem[]
}
export interface Settings {
  restaurantName: string; restaurantEmoji: string
  serviceCharge: string; announcement: string
}
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next: OrderStatus | null }> = {
  PENDING:   { label: '待處理', color: '#f59e0b', next: 'PREPARING' },
  PREPARING: { label: '製作中', color: '#3b82f6', next: 'READY' },
  READY:     { label: '可取餐', color: '#10b981', next: 'DONE' },
  DONE:      { label: '已完成', color: '#6b7280', next: null },
  CANCELLED: { label: '已取消', color: '#ef4444', next: null },
}
export const PAYMENT_LABELS: Record<string, string> = {
  cash: '現金', card: '刷卡', linepay: 'LINE Pay', transfer: '轉帳'
}
