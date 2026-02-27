import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value
    delete map.adminPassword
    return NextResponse.json(map)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

const UpdateSchema = z.object({
  restaurantName: z.string().min(1).max(30).optional(),
  restaurantEmoji: z.string().max(4).optional(),
  serviceCharge: z.boolean().optional(),
  announcement: z.string().max(100).optional(),
  adminPassword: z.string().min(4).max(30).optional(),
  currentPassword: z.string(),
})

export async function PATCH(request: Request) {
  try {
    const data = UpdateSchema.parse(await request.json())
    const pwd = await prisma.setting.findUnique({ where: { key: 'adminPassword' } })
    if (!pwd || pwd.value !== data.currentPassword) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    const updates: Array<{ key: string; value: string }> = []
    if (data.restaurantName  !== undefined) updates.push({ key: 'restaurantName',  value: data.restaurantName })
    if (data.restaurantEmoji !== undefined) updates.push({ key: 'restaurantEmoji', value: data.restaurantEmoji })
    if (data.serviceCharge   !== undefined) updates.push({ key: 'serviceCharge',   value: String(data.serviceCharge) })
    if (data.announcement    !== undefined) updates.push({ key: 'announcement',    value: data.announcement })
    if (data.adminPassword   !== undefined) updates.push({ key: 'adminPassword',   value: data.adminPassword })
    await Promise.all(updates.map(u => prisma.setting.upsert({ where: { key: u.key }, update: { value: u.value }, create: u })))
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
