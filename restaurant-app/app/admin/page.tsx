/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'
import type { Order, MenuItem, Category, Settings } from '@/lib/types'
import AdminClient from '@/components/AdminClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [ordersRaw, itemsRaw, cats, settingsRaw] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 300 }),
    prisma.menuItem.findMany({ include: { category: true }, orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }] }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.setting.findMany(),
  ])

  const orders: Order[] = (ordersRaw as any[]).map((o: any) => ({
    id:            o.id,
    orderNumber:   o.orderNumber,
    tableNumber:   o.tableNumber,
    customerName:  o.customerName,
    guestCount:    o.guestCount,
    notes:         o.notes,
    subtotal:      o.subtotal / 100,
    serviceCharge: o.serviceCharge / 100,
    total:         o.total / 100,
    paymentMethod: o.paymentMethod,
    status:        o.status as Order['status'],
    createdAt:     o.createdAt.toISOString(),
    updatedAt:     o.updatedAt.toISOString(),
    items: (o.items as any[]).map((i: any) => ({
      id:         i.id,
      orderId:    i.orderId,
      menuItemId: i.menuItemId,
      name:       i.name,
      emoji:      i.emoji,
      price:      i.price / 100,
      qty:        i.qty,
      option:     i.option,
      note:       i.note,
      subtotal:   i.subtotal / 100,
    })),
  }))

  const menuItems: MenuItem[] = (itemsRaw as any[]).map((i: any) => ({
    id:          i.id,
    name:        i.name,
    description: i.description,
    emoji:       i.emoji,
    price:       i.price / 100,
    available:   i.available,
    sortOrder:   i.sortOrder,
    options:     JSON.parse(i.options || '[]') as string[],
    categoryId:  i.categoryId,
    category:    i.category,
  }))

  const categories: Category[] = cats as any[]

  const sm: Record<string, string> = {}
  for (const s of settingsRaw as any[]) sm[s.key] = s.value

  const settings: Settings = {
    restaurantName:  sm.restaurantName  || '美食餐廳',
    restaurantEmoji: sm.restaurantEmoji || '🍜',
    serviceCharge:   sm.serviceCharge   || 'false',
    announcement:    sm.announcement    || '',
  }

  return { orders, menuItems, categories, settings }
}

export default async function AdminPage() {
  const data = await getData()
  return <AdminClient {...data} />
}
