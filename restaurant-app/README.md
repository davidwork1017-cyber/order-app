# 🍜 餐廳點餐系統 (SSR)

生產就緒的餐廳點餐與後台管理系統，使用 **Next.js 16 App Router** + **Prisma 7** + **SQLite/Turso** 建構，支援完整 SSR，可直接部署至 **Vercel**。

## ✨ 功能特色

### 顧客點餐端（`/`）
- 📋 **SSR 菜單** — 每次請求從資料庫即時渲染
- 🔍 **分類篩選 + 關鍵字搜尋**
- 🛒 **購物車** — 持久化（localStorage）
- 🪑 **桌號 / 姓名 / 人數** 輸入
- 🌶️ **品項選項**（辣度、甜度、麵條種類等）
- 📝 **品項備註 + 整單備註**
- 💳 **付款方式**（現金、刷卡、LINE Pay、轉帳）
- 🎉 **下單確認** + 🖨️ **列印收據**

### 後台管理端（`/admin`）
- 🔐 **密碼保護**（預設：`admin123`）
- 📋 **訂單管理** — 狀態追蹤（待處理→製作中→可取餐→已完成）
- 🍽️ **菜單管理** — 新增/編輯/刪除菜品、上架/下架
- ⚙️ **系統設定** — 餐廳名稱、服務費、公告、管理員密碼

---

## 🚀 本地開發

```bash
cd restaurant-app
npm install
npm run db:migrate   # 建立 SQLite schema
npm run db:seed      # 填入預設資料（16 道菜 + 設定）
npm run dev          # http://localhost:3000
```

---

## ☁️ 部署至 Vercel（推薦）

### 前置條件：建立 Turso 資料庫

Vercel 是無伺服器環境，**無法使用本地 SQLite 檔案**。需要使用 [Turso](https://turso.tech)（免費方案即可）作為遠端 libsql 資料庫。

#### 步驟 1：安裝 Turso CLI 並建立資料庫

```bash
# 安裝 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登入
turso auth login

# 建立資料庫（替換 your-restaurant 為你的名稱）
turso db create your-restaurant

# 取得連線資訊
turso db show your-restaurant
# → URL: libsql://your-restaurant-xxx.turso.io

# 建立 auth token
turso db tokens create your-restaurant
# → 複製 token
```

#### 步驟 2：套用 Schema 到 Turso

```bash
# 設定環境變數
export TURSO_DATABASE_URL="libsql://your-restaurant-xxx.turso.io"
export TURSO_AUTH_TOKEN="your-token-here"

# 套用 migrations
npm run db:migrate

# 填入初始資料
npm run db:seed
```

#### 步驟 3：部署到 Vercel

**方法 A：Vercel CLI**
```bash
npm install -g vercel
cd restaurant-app
vercel

# 設定環境變數
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# 重新部署
vercel --prod
```

**方法 B：Vercel Dashboard（推薦）**
1. 前往 [vercel.com](https://vercel.com) → Import Git Repository
2. 選擇你的 GitHub repo
3. **Root Directory** 設為 `restaurant-app`
4. **Build Command** 保持預設（會讀取 `vercel.json`）
5. 在 **Environment Variables** 加入：
   - `TURSO_DATABASE_URL` = `libsql://your-restaurant-xxx.turso.io`
   - `TURSO_AUTH_TOKEN` = `your-token-here`
6. 點擊 Deploy

---

## 🏗️ 技術架構

| 層次 | 技術 |
|------|------|
| 框架 | Next.js 16 App Router (SSR) |
| 語言 | TypeScript |
| ORM | Prisma 7 |
| 資料庫（本地） | SQLite (libsql file) |
| 資料庫（生產） | Turso (libsql cloud) |
| 驗證 | Zod v4 |
| 樣式 | Tailwind CSS v4 + 自訂 CSS |
| 部署 | Vercel (Serverless) |

## 📁 目錄結構

```
restaurant-app/
├── app/
│   ├── page.tsx              # 顧客點餐頁（SSR）
│   ├── admin/page.tsx        # 後台管理頁（SSR）
│   └── api/                  # REST API（全部 server-rendered）
│       ├── menu/             # GET/POST + PATCH/DELETE /[id]
│       ├── orders/           # GET/POST + GET/PATCH/DELETE /[id]
│       ├── settings/         # GET/PATCH
│       └── auth/             # POST
├── components/
│   ├── OrderingClient.tsx    # 顧客端互動元件
│   └── AdminClient.tsx       # 後台管理互動元件
├── lib/
│   ├── prisma.ts             # Prisma 客戶端（自動偵測本地/Turso）
│   └── types.ts              # TypeScript 型別
├── prisma/
│   ├── schema.prisma         # 資料庫 Schema
│   ├── seed.ts               # 初始資料
│   └── migrations/           # SQL migration 歷史
├── public/manifest.json      # PWA 設定
└── vercel.json               # Vercel 部署設定
```

## 🔐 後台入口

1. 點擊頁面右下角 ⚙️
2. 輸入密碼（預設：`admin123`）
3. 跳轉至 `/admin`

## 🌐 環境變數

| 變數 | 說明 | 必填 |
|------|------|------|
| `TURSO_DATABASE_URL` | Turso 資料庫 URL（生產用） | 生產環境必填 |
| `TURSO_AUTH_TOKEN` | Turso 認證 Token | 生產環境必填 |
| `DATABASE_URL` | 自訂資料庫 URL（可選覆蓋） | 選填 |

> 本地開發不需要設定任何環境變數，會自動使用 `prisma/dev.db`。
