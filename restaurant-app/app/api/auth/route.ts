import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const setting = await prisma.setting.findUnique({ where: { key: 'adminPassword' } })
    if (setting?.value === password) return NextResponse.json({ success: true })
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
