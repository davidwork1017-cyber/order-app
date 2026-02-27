import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cat = searchParams.get('cat')
    const q   = searchParams.get('q')
    const items = await prisma.menuItem.findMany({
      where: {
        ...(cat && cat !== 'all' ? { category: { slug: cat } } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    })
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({
      items: items.map(i => ({ ...i, price: i.price / 100, options: JSON.parse(i.options || '[]') })),
      categories,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

const CreateSchema = z.object({
  name: z.string().min(1).max(30), description: z.string().max(80).default(''),
  emoji: z.string().max(4).default('🍽️'), price: z.number().int().min(0),
  categoryId: z.string(), available: z.boolean().default(true),
  options: z.array(z.string()).default([]), sortOrder: z.number().int().default(0),
})

export async function POST(request: Request) {
  try {
    const data = CreateSchema.parse(await request.json())
    const item = await prisma.menuItem.create({
      data: { ...data, price: Math.round(data.price * 100), options: JSON.stringify(data.options) },
      include: { category: true },
    })
    return NextResponse.json({ ...item, price: item.price / 100, options: JSON.parse(item.options) }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
