import { prisma } from '@/lib/prisma'
import type { Category, MenuItem, Settings } from '@/lib/types'
import OrderingClient from '@/components/OrderingClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [itemsRaw, cats, settingsRaw] = await Promise.all([
    prisma.menuItem.findMany({ include: { category: true }, orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }] }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.setting.findMany(),
  ])
  const items: MenuItem[] = itemsRaw.map(i => ({ ...i, price: i.price / 100, options: JSON.parse(i.options || '[]') }))
  const categories: Category[] = cats
  const sm: Record<string, string> = {}
  for (const s of settingsRaw) sm[s.key] = s.value
  const settings: Settings = {
    restaurantName: sm.restaurantName || '美食餐廳', restaurantEmoji: sm.restaurantEmoji || '🍜',
    serviceCharge: sm.serviceCharge || 'false', announcement: sm.announcement || '',
  }
  return { items, categories, settings }
}

export default async function HomePage() {
  const { items, categories, settings } = await getData()
  return <OrderingClient initialMenuItems={items} categories={categories} settings={settings} />
}
