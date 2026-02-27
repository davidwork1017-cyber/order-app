import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).max(30).optional(), description: z.string().max(80).optional(),
  emoji: z.string().max(4).optional(), price: z.number().int().min(0).optional(),
  categoryId: z.string().optional(), available: z.boolean().optional(),
  options: z.array(z.string()).optional(), sortOrder: z.number().int().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = UpdateSchema.parse(await request.json())
    const updateData: Record<string, unknown> = { ...data }
    if (data.price !== undefined) updateData.price = Math.round(data.price * 100)
    if (data.options !== undefined) updateData.options = JSON.stringify(data.options)
    const item = await prisma.menuItem.update({ where: { id }, data: updateData, include: { category: true } })
    return NextResponse.json({ ...item, price: item.price / 100, options: JSON.parse(item.options) })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.menuItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
