import { prisma } from '@/lib/prisma'
import type { Order, Settings } from '@/lib/types'
import AdminClient from '@/components/AdminClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [ordersRaw, itemsRaw, cats, settingsRaw] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 300 }),
    prisma.menuItem.findMany({ include: { category: true }, orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }] }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.setting.findMany(),
  ])
  const orders: Order[] = ordersRaw.map(o => ({
    ...o, subtotal: o.subtotal / 100, serviceCharge: o.serviceCharge / 100, total: o.total / 100,
    createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    items: o.items.map(i => ({ ...i, price: i.price / 100, subtotal: i.subtotal / 100 })),
  }))
  const menuItems = itemsRaw.map(i => ({ ...i, price: i.price / 100, options: JSON.parse(i.options || '[]') }))
  const sm: Record<string, string> = {}
  for (const s of settingsRaw) sm[s.key] = s.value
  const settings: Settings = {
    restaurantName: sm.restaurantName || '美食餐廳', restaurantEmoji: sm.restaurantEmoji || '🍜',
    serviceCharge: sm.serviceCharge || 'false', announcement: sm.announcement || '',
  }
  return { orders, menuItems, categories: cats, settings }
}

export default async function AdminPage() {
  const data = await getData()
  return <AdminClient {...data} />
}
