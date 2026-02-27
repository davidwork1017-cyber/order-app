import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orders = await prisma.order.findMany({
      where: status && status !== 'all' ? { status: status.toUpperCase() as never } : {},
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })
    return NextResponse.json(orders.map(o => ({
      ...o,
      subtotal: o.subtotal / 100, serviceCharge: o.serviceCharge / 100, total: o.total / 100,
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
      items: o.items.map(i => ({ ...i, price: i.price / 100, subtotal: i.subtotal / 100 })),
    })))
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

const ItemSchema = z.object({
  menuItemId: z.string(), qty: z.number().int().min(1),
  option: z.string().default(''), note: z.string().max(100).default(''),
})
const CreateSchema = z.object({
  tableNumber: z.string().min(1).max(20), customerName: z.string().max(30).default(''),
  guestCount: z.number().int().min(1).default(1), notes: z.string().max(200).default(''),
  paymentMethod: z.enum(['cash', 'card', 'linepay', 'transfer']).default('cash'),
  items: z.array(ItemSchema).min(1),
})

export async function POST(request: Request) {
  try {
    const data = CreateSchema.parse(await request.json())
    const ids = [...new Set(data.items.map(i => i.menuItemId))]
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids }, available: true } })
    if (menuItems.length !== ids.length) return NextResponse.json({ error: 'Some items unavailable' }, { status: 400 })
    const map = new Map(menuItems.map(m => [m.id, m]))
    const orderItems = data.items.map(i => {
      const m = map.get(i.menuItemId)!
      return { menuItemId: i.menuItemId, name: m.name, emoji: m.emoji, price: m.price, qty: i.qty, option: i.option, note: i.note, subtotal: m.price * i.qty }
    })
    const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0)
    const sc = await prisma.setting.findUnique({ where: { key: 'serviceCharge' } })
    const serviceCharge = sc?.value === 'true' ? Math.round(subtotal * 0.1) : 0
    const count = await prisma.order.count()
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${String(count + 1).padStart(6, '0')}`,
        tableNumber: data.tableNumber, customerName: data.customerName,
        guestCount: data.guestCount, notes: data.notes, paymentMethod: data.paymentMethod,
        subtotal, serviceCharge, total: subtotal + serviceCharge,
        items: { create: orderItems },
      },
      include: { items: true },
    })
    return NextResponse.json({
      ...order, subtotal: order.subtotal / 100, serviceCharge: order.serviceCharge / 100, total: order.total / 100,
      createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(),
      items: order.items.map(i => ({ ...i, price: i.price / 100, subtotal: i.subtotal / 100 })),
    }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
