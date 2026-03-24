# 🚀 快速參考指南

## 立即開始

### 1️⃣ 安裝並啟動

\`\`\`bash
cd /home/jhao/office/lychee_backend_web_vuetify/LINE_OA_RichMenu/frontend

# 方法 A: 使用啟動腳本(推薦)
./start-dev.sh

# 方法 B: 手動執行
npm install
npm run dev
\`\`\`

### 2️⃣ 訪問應用

瀏覽器開啟: **http://localhost:3000**

---

## 📂 專案檔案一覽

\`\`\`
frontend/
├── 📄 配置檔案
│   ├── package.json          # 依賴管理
│   ├── vite.config.js        # Vite 配置
│   ├── index.html            # HTML 入口
│   └── .gitignore            # Git 忽略
│
├── 🎯 啟動腳本
│   ├── start-dev.sh          # Linux/Mac 啟動
│   └── start-dev.bat         # Windows 啟動
│
├── 📚 文件
│   ├── README.md             # 專案說明
│   ├── PROJECT_OVERVIEW.md   # 專案總覽
│   └── COMPLETION_REPORT.md  # 完成報告
│
├── 📁 src/
│   ├── main.js               # 應用入口
│   ├── App.vue               # 根元件
│   │
│   ├── 🎨 assets/
│   │   └── main.css          # 全域樣式
│   │
│   ├── 🔧 plugins/
│   │   └── vuetify.js        # Vuetify 配置
│   │
│   ├── 🛣️ router/
│   │   └── index.js          # 路由配置
│   │
│   ├── 🔌 api/
│   │   └── richMenu.js       # 圖文選單 API
│   │
│   ├── 🛠️ utils/
│   │   └── request.js        # Axios 封裝
│   │
│   ├── 🧩 components/
│   │   ├── LayoutSelector.vue    # 版型選擇
│   │   ├── ImageUploader.vue     # 圖片上傳
│   │   └── ActionDialog.vue      # 動作設定
│   │
│   └── 📄 views/
│       ├── RichMenuList.vue      # 列表頁
│       └── RichMenuEdit.vue      # 編輯頁
│
└── 📁 public/
    └── (放置靜態資源)
\`\`\`

---

## 🎯 主要功能快速索引

| 功能 | 檔案位置 | 說明 |
|------|---------|------|
| 圖文選單列表 | \`views/RichMenuList.vue\` | 顯示、搜尋、操作選單 |
| 新增選單 | \`views/RichMenuEdit.vue\` | 5步驟建立流程 |
| 編輯選單 | \`views/RichMenuEdit.vue\` | 修改現有選單 |
| 版型選擇 | \`components/LayoutSelector.vue\` | 6種版型 |
| 圖片上傳 | \`components/ImageUploader.vue\` | 拖曳上傳 |
| 動作設定 | \`components/ActionDialog.vue\` | 設定區域動作 |

---

## 🔗 路由對應

| 路徑 | 元件 | 功能 |
|------|------|------|
| \`/\` | (重定向) | 自動跳轉到列表 |
| \`/richmenu/list\` | RichMenuList | 圖文選單列表 |
| \`/richmenu/create\` | RichMenuEdit | 新增圖文選單 |
| \`/richmenu/edit/:id\` | RichMenuEdit | 編輯圖文選單 |

---

## 🔌 API 使用範例

\`\`\`javascript
import { richMenuApi } from '@/api/richMenu'

// 取得列表
const list = await richMenuApi.getList()

// 取得單筆
const menu = await richMenuApi.getRichMenu(id)

// 建立
const result = await richMenuApi.createRichMenu(data)

// 更新
const result = await richMenuApi.updateRichMenu(id, data)

// 刪除
await richMenuApi.deleteRichMenu(id)

// 上傳圖片
const url = await richMenuApi.uploadImage(file)
\`\`\`

---

## 🎨 版型對照表

| 編號 | 名稱 | 區域數 | 布局 |
|------|------|--------|------|
| 1 | 6個區域 | 6 | 3x2 格式 |
| 2 | 4個區域 | 4 | 2x2 格式 |
| 3 | 3個區域 | 3 | 3x1 橫向 |
| 4 | 3個區域 | 3 | 1上2下 |
| 5 | 2個區域 | 2 | 左右分割 |
| 6 | 2個區域 | 2 | 上下分割 |

---

## 🎬 操作流程

### 建立新圖文選單

1. 進入列表頁 → 點擊「新增圖文選單」
2. **步驟1**: 填寫名稱、描述
3. **步驟2**: 選擇版型
4. **步驟3**: 上傳圖片 (2500x1686)
5. **步驟4**: 點擊每個區域設定動作
6. **步驟5**: 確認並儲存

### 編輯現有選單

1. 列表頁 → 點擊「編輯」圖示
2. 修改任何步驟的內容
3. 儲存變更

### 發佈選單

1. 列表頁 → 點擊「更多」(三個點)
2. 選擇「設定發佈」
3. 選單將套用到 LINE OA

---

## ⚙️ 配置修改

### 修改後端 API 位址

編輯 \`vite.config.js\`:

\`\`\`javascript
server: {
  proxy: {
    '/api': {
      target: 'http://your-backend-url:8000',  // 修改這裡
      changeOrigin: true
    }
  }
}
\`\`\`

### 修改開發伺服器埠號

編輯 \`vite.config.js\`:

\`\`\`javascript
server: {
  port: 3000,  // 修改這裡
  // ...
}
\`\`\`

---

## 🐛 常見問題

### Q: 無法啟動開發伺服器?
**A**: 檢查 Node.js 版本,建議 v18 以上

### Q: 圖片上傳失敗?
**A**: 確認圖片尺寸為 2500x1686,格式為 JPG/PNG,大小 < 1MB

### Q: API 連接失敗?
**A**: 檢查後端是否啟動,確認 proxy 設定正確

### Q: 樣式顯示異常?
**A**: 清除瀏覽器快取,重新整理頁面

---

## 📞 需要幫助?

1. 查看 [README.md](./README.md) - 詳細說明文件
2. 查看 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 專案總覽
3. 查看 [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) - 完成報告

---

## ✅ 檢查清單

啟動前檢查:
- [ ] Node.js 已安裝 (v18+)
- [ ] 進入正確目錄
- [ ] 執行 \`npm install\`
- [ ] 後端 API 已啟動

開發時檢查:
- [ ] 瀏覽器開發者工具檢查錯誤
- [ ] 網路請求是否正常
- [ ] Console 是否有錯誤訊息

---

**最後更新**: 2026-03-23
