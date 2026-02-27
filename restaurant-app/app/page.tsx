/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'
import type { Category, MenuItem, Settings } from '@/lib/types'
import OrderingClient from '@/components/OrderingClient'

export const dynamic = 'force-dynamic'

async function getData() {
  const [itemsRaw, cats, settingsRaw] = await Promise.all([
    prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.setting.findMany(),
  ])

  const items: MenuItem[] = (itemsRaw as any[]).map((i: any) => ({
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

  return { items, categories, settings }
}

export default async function HomePage() {
  const { items, categories, settings } = await getData()
  return (
    <OrderingClient
      initialMenuItems={items}
      categories={categories}
      settings={settings}
    />
  )
}
