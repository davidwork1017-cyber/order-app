import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const DB_URL = `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: DB_URL }) })

async function main() {
  console.log('🌱 Seeding...')
  const rice   = await prisma.category.upsert({ where: { slug: 'rice' },   update: {}, create: { slug: 'rice',   label: '飯類', emoji: '🍚', sortOrder: 1 } })
  const noodle = await prisma.category.upsert({ where: { slug: 'noodle' }, update: {}, create: { slug: 'noodle', label: '麵類', emoji: '🍜', sortOrder: 2 } })
  const snack  = await prisma.category.upsert({ where: { slug: 'snack' },  update: {}, create: { slug: 'snack',  label: '小吃', emoji: '🥟', sortOrder: 3 } })
  const drink  = await prisma.category.upsert({ where: { slug: 'drink' },  update: {}, create: { slug: 'drink',  label: '飲料', emoji: '🧋', sortOrder: 4 } })

  if (await prisma.menuItem.count() === 0) {
    await prisma.menuItem.createMany({ data: [
      { name: '招牌便當',     description: '精選豬排 + 白飯 + 三樣配菜，份量十足', emoji: '🍱', price: 12000, categoryId: rice.id,   options: '[]',                           sortOrder: 1 },
      { name: '咖哩雞飯',     description: '濃郁日式咖哩，搭配嫩雞腿肉',           emoji: '🍛', price: 11000, categoryId: rice.id,   options: '["微辣","中辣","大辣"]',        sortOrder: 2 },
      { name: '牛肉燴飯',     description: '慢燉牛腩，醬汁濃郁入味',               emoji: '🥩', price: 15000, categoryId: rice.id,   options: '[]',                           sortOrder: 3 },
      { name: '荷包蛋炒飯',   description: '蛋香四溢，粒粒分明的黃金炒飯',         emoji: '🍳', price: 8000,  categoryId: rice.id,   options: '["加蛋","加肉"]',               sortOrder: 4 },
      { name: '紅燒牛肉麵',   description: '手工麵條，大塊牛腱，湯頭濃郁',         emoji: '🍜', price: 16000, categoryId: noodle.id, options: '["細麵","粗麵","刀削麵"]',      sortOrder: 1 },
      { name: '番茄肉醬麵',   description: '義式風味，新鮮番茄熬製肉醬',           emoji: '🍝', price: 13000, categoryId: noodle.id, options: '[]',                           sortOrder: 2 },
      { name: '麻辣乾麵',     description: '四川風味，麻辣鮮香，可選辣度',         emoji: '🍲', price: 10000, categoryId: noodle.id, options: '["微辣","中辣","大辣","超辣"]',  sortOrder: 3 },
      { name: '清燉排骨湯麵', description: '清甜骨湯，軟嫩排骨，暖胃首選',         emoji: '🥣', price: 14000, categoryId: noodle.id, options: '["細麵","粗麵"]',               sortOrder: 4 },
      { name: '煎餃（10顆）', description: '豬肉高麗菜內餡，底部酥脆',             emoji: '🥟', price: 7000,  categoryId: snack.id,  options: '[]',                           sortOrder: 1 },
      { name: '蔥油餅',       description: '手工擀製，層次分明，外酥內軟',         emoji: '🌮', price: 4000,  categoryId: snack.id,  options: '["加蛋"]',                      sortOrder: 2 },
      { name: '關東煮（5串）',description: '自選五串，湯頭清甜鮮美',               emoji: '🍢', price: 6000,  categoryId: snack.id,  options: '[]',                           sortOrder: 3 },
      { name: '滷蛋（2顆）',  description: '入味滷蛋，Q彈好吃',                   emoji: '🥚', price: 2000,  categoryId: snack.id,  options: '[]',                           sortOrder: 4 },
      { name: '珍珠奶茶',     description: '手搖現做，Q彈珍珠，甜度可調',         emoji: '🧋', price: 6500,  categoryId: drink.id,  options: '["少糖","半糖","全糖","無糖"]',  sortOrder: 1 },
      { name: '熱綠茶',       description: '台灣高山茶，清香回甘',                 emoji: '🍵', price: 3000,  categoryId: drink.id,  options: '[]',                           sortOrder: 2 },
      { name: '冬瓜檸檬',     description: '清涼消暑，酸甜適中',                   emoji: '🥤', price: 4500,  categoryId: drink.id,  options: '["少冰","去冰","正常冰"]',      sortOrder: 3 },
      { name: '美式咖啡',     description: '精選咖啡豆，香醇不苦澀',               emoji: '☕', price: 5500,  categoryId: drink.id,  options: '["熱","冰"]',                   sortOrder: 4 },
    ]})
    console.log('  Created 16 menu items')
  }

  for (const s of [
    { key: 'restaurantName', value: '美食餐廳' }, { key: 'restaurantEmoji', value: '🍜' },
    { key: 'serviceCharge', value: 'false' }, { key: 'adminPassword', value: 'admin123' },
    { key: 'announcement', value: '' },
  ]) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s })
  }
  console.log('✅ Done')
}

main().catch(console.error).finally(() => prisma.$disconnect())
