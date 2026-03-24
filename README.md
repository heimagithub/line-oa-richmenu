# 圖文選單管理系統

LINE OA 圖文選單管理的前端應用程式,使用 Vue 3 + Vite + Vuetify 3 開發。

## 功能特色

### 1. 圖文選單列表
- 顯示所有圖文選單列表
- 支援搜尋功能
- 可調整每頁顯示筆數
- 縮圖預覽
- 狀態標籤顯示(已發佈、未發佈、草稿等)
- 收藏功能
- 快速操作:編輯、刪除、設定發佈、取消連結、複製

### 2. 新增/編輯圖文選單
採用步驟式流程設計:

**步驟 1: 基本資料**
- 圖文選單名稱(必填)
- 描述(選填)
- 聊天室選單文字

**步驟 2: 選擇版型**
提供 6 種預設版型:
- 6個區域 (3x2)
- 4個區域 (2x2)
- 3個區域 (3x1)
- 3個區域 (1上2下)
- 2個區域 (左右分割)
- 2個區域 (上下分割)

**步驟 3: 上傳圖片**
- 支援拖曳上傳
- 圖片規格: 2500 x 1686 px
- 格式: JPG, PNG
- 檔案大小: 1MB 以內

**步驟 4: 設定區域動作**
每個區域可設定:
- 連結(URI)
- 文字訊息(Message)
- 無動作(None)

**步驟 5: 預覽與確認**
- 檢視所有設定
- 圖文選單預覽
- 區域動作列表

## 技術棧

- **前端框架**: Vue 3 (Composition API)
- **建置工具**: Vite
- **UI 框架**: Vuetify 3
- **路由**: Vue Router 4
- **狀態管理**: Pinia
- **HTTP 請求**: Axios
- **圖標**: Material Design Icons

## 安裝步驟

### 1. 安裝依賴套件

\`\`\`bash
npm install
\`\`\`

### 2. 開發模式

\`\`\`bash
npm run dev
\`\`\`

應用程式將在 http://localhost:3000 啟動

### 3. 建置生產版本

\`\`\`bash
npm run build
\`\`\`

### 4. 預覽生產版本

\`\`\`bash
npm run preview
\`\`\`

## 目錄結構

\`\`\`
frontend/
├── public/              # 靜態資源
├── src/
│   ├── api/            # API 服務層
│   │   └── richMenu.js
│   ├── assets/         # 資源檔案
│   │   └── main.css
│   ├── components/     # 共用元件
│   │   ├── ActionDialog.vue      # 區域動作設定對話框
│   │   ├── ImageUploader.vue     # 圖片上傳元件
│   │   └── LayoutSelector.vue    # 版型選擇元件
│   ├── plugins/        # 插件配置
│   │   └── vuetify.js
│   ├── router/         # 路由配置
│   │   └── index.js
│   ├── utils/          # 工具函數
│   │   └── request.js  # Axios 封裝
│   ├── views/          # 頁面元件
│   │   ├── RichMenuList.vue      # 圖文選單列表
│   │   └── RichMenuEdit.vue      # 新增/編輯圖文選單
│   ├── App.vue         # 根元件
│   └── main.js         # 應用程式入口
├── index.html
├── package.json
├── vite.config.js
└── README.md
\`\`\`

## API 端點

應用程式使用以下 API:

### 圖文選單管理
- \`GET /api/bot_management/get_rich_menu_list/\` - 取得圖文選單列表
- \`GET /api/bot_management/get_rm/:id/\` - 取得單一圖文選單
- \`POST /api/bot_management/save_rm/\` - 建立/更新圖文選單
- \`DELETE /api/bot_management/del_richmenu/:id/\` - 刪除圖文選單
- \`GET /api/bot_management/get_rm_status/\` - 取得圖文選單狀態
- \`POST /api/bot_management/set_rm_to_line/\` - 設定圖文選單發佈
- \`POST /api/bot_management/richmenu_unlink/\` - 取消圖文選單連結
- \`POST /api/bot_management/close_all_rm/\` - 關閉所有圖文選單
- \`POST /api/bot_management/remove_all_rm_api/\` - 移除所有圖文選單

### 檔案上傳
- \`POST /api/upload/image/\` - 上傳圖片

## 後端 API 設定

在 \`vite.config.js\` 中可以修改後端 API 位址:

\`\`\`javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',  // 修改為你的後端位址
      changeOrigin: true
    }
  }
}
\`\`\`

## 瀏覽器支援

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 開發指南

### 新增元件
元件放在 \`src/components/\` 目錄下

### 新增頁面
頁面放在 \`src/views/\` 目錄下,並在 \`src/router/index.js\` 註冊路由

### API 呼叫
使用 \`src/api/richMenu.js\` 中定義的方法

範例:
\`\`\`javascript
import { richMenuApi } from '@/api/richMenu'

const fetchList = async () => {
  const response = await richMenuApi.getList()
  console.log(response.data)
}
\`\`\`

## 授權

© 2026 All rights reserved.
