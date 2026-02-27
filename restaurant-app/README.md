# 🍜 餐廳點餐系統 (SSR)

生產就緒的餐廳點餐與後台管理系統，使用 **Next.js 16 App Router** + **Prisma 7** + **SQLite** 建構，支援完整 SSR。

## ✨ 功能特色

### 顧客點餐端（`/`）
- 📋 **SSR 菜單** — 每次請求從資料庫即時渲染，確保菜單資料最新
- 🔍 **分類篩選 + 關鍵字搜尋**
- 🛒 **購物車** — 持久化（localStorage），重整不遺失
- 🪑 **桌號 / 姓名 / 人數** 輸入
- 🌶️ **品項選項**（辣度、甜度、麵條種類等）
- 📝 **品項備註 + 整單備註**
- 💳 **付款方式**（現金、刷卡、LINE Pay、轉帳）
- 🎉 **下單確認** + 🖨️ **列印收據**

### 後台管理端（`/admin`）
- 🔐 **密碼保護**（預設：`admin123`）
- 📋 **訂單管理** — 狀態追蹤（待處理→製作中→可取餐→已完成）、取消、列印
- 🍽️ **菜單管理** — 新增/編輯/刪除菜品、上架/下架
- ⚙️ **系統設定** — 餐廳名稱、服務費、公告、管理員密碼

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 初始化資料庫
npm run db:migrate

# 填入預設資料
npm run db:seed

# 開發模式
npm run dev

# 生產建置
npm run build
npm start
```

## 🏗️ 技術架構

| 層次 | 技術 |
|------|------|
| 框架 | Next.js 16 App Router (SSR) |
| 語言 | TypeScript |
| ORM | Prisma 7 |
| 資料庫 | SQLite (libsql) |
| 樣式 | Tailwind CSS v4 + 自訂 CSS |
| 驗證 | Zod v4 |
| 部署 | Node.js 伺服器 |

## 📁 目錄結構

```
restaurant-app/
├── app/
│   ├── page.tsx              # 顧客點餐頁（SSR）
│   ├── admin/page.tsx        # 後台管理頁（SSR）
│   ├── api/
│   │   ├── menu/route.ts     # GET/POST 菜單
│   │   ├── menu/[id]/route.ts # PATCH/DELETE 菜品
│   │   ├── orders/route.ts   # GET/POST 訂單
│   │   ├── orders/[id]/route.ts # GET/PATCH/DELETE 訂單
│   │   ├── settings/route.ts # GET/PATCH 設定
│   │   └── auth/route.ts     # POST 管理員驗證
│   └── globals.css
├── components/
│   ├── OrderingClient.tsx    # 顧客端互動元件
│   └── AdminClient.tsx       # 後台管理互動元件
├── lib/
│   ├── prisma.ts             # Prisma 客戶端單例
│   └── types.ts              # TypeScript 型別定義
├── prisma/
│   ├── schema.prisma         # 資料庫 Schema
│   ├── seed.ts               # 初始資料
│   └── dev.db                # SQLite 資料庫（自動生成）
└── public/
    └── manifest.json         # PWA 設定
```

## 🔐 後台入口

1. 點擊頁面右下角 ⚙️
2. 輸入密碼（預設：`admin123`）
3. 跳轉至 `/admin`

## 🌐 部署

### Node.js 伺服器
```bash
npm run build
npm start  # 預設 port 3000
```

### 環境變數（可選）
```env
PORT=3000
NODE_ENV=production
```

> ⚠️ 生產環境建議將 SQLite 替換為 PostgreSQL，修改 `prisma/schema.prisma` 的 `provider` 和 `prisma.config.ts` 的連線字串即可。
