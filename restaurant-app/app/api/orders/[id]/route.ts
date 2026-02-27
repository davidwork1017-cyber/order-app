import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const fmt = (o: { subtotal: number; serviceCharge: number; total: number; createdAt: Date; updatedAt: Date; items: Array<{ price: number; subtotal: number }> }) => ({
  ...o, subtotal: o.subtotal / 100, serviceCharge: o.serviceCharge / 100, total: o.total / 100,
  createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
  items: o.items.map(i => ({ ...i, price: i.price / 100, subtotal: i.subtotal / 100 })),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(fmt(order))
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

const UpdateSchema = z.object({ status: z.enum(['PENDING', 'PREPARING', 'READY', 'DONE', 'CANCELLED']) })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = UpdateSchema.parse(await request.json())
    const order = await prisma.order.update({ where: { id }, data: { status }, include: { items: true } })
    return NextResponse.json(fmt(order))
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
