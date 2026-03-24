# 圖文選單管理系統 - 專案總覽

## 📋 專案資訊

- **專案名稱**: 圖文選單管理系統
- **技術棧**: Vue 3 + Vite + Vuetify 3
- **開發日期**: 2026-03-23
- **用途**: LINE OA 圖文選單管理

## 🎯 功能清單

### ✅ 已完成功能

1. **圖文選單列表頁面** (`/richmenu/list`)
   - [x] 顯示圖文選單列表(表格模式)
   - [x] 縮圖預覽
   - [x] 搜尋功能
   - [x] 分頁控制
   - [x] 狀態標籤(已發佈/未發佈/草稿)
   - [x] 收藏功能
   - [x] 快速操作選單
     - 編輯
     - 刪除
     - 設定發佈
     - 取消連結
     - 複製

2. **新增圖文選單頁面** (`/richmenu/create`)
   - [x] 步驟 1: 基本資料輸入
   - [x] 步驟 2: 版型選擇(6種)
   - [x] 步驟 3: 圖片上傳
   - [x] 步驟 4: 區域動作設定
   - [x] 步驟 5: 預覽與確認

3. **編輯圖文選單頁面** (`/richmenu/edit/:id`)
   - [x] 載入現有資料
   - [x] 修改所有設定
   - [x] 更新儲存

4. **共用元件**
   - [x] LayoutSelector - 版型選擇器
   - [x] ImageUploader - 圖片上傳器
   - [x] ActionDialog - 動作設定對話框

5. **API 整合**
   - [x] 完整的 API Service 層
   - [x] Axios 請求攔截器
   - [x] 錯誤處理機制

## 📁 專案結構

\`\`\`
frontend/
├── public/                    # 靜態資源
├── src/
│   ├── api/                  # API 服務
│   │   └── richMenu.js       # 圖文選單 API
│   ├── assets/               # 樣式與資源
│   │   └── main.css          # 全域樣式
│   ├── components/           # 共用元件
│   │   ├── ActionDialog.vue       # 動作設定對話框
│   │   ├── ImageUploader.vue      # 圖片上傳元件
│   │   └── LayoutSelector.vue     # 版型選擇元件
│   ├── plugins/              # 插件配置
│   │   └── vuetify.js        # Vuetify 配置
│   ├── router/               # 路由配置
│   │   └── index.js          # 路由定義
│   ├── utils/                # 工具函數
│   │   └── request.js        # Axios 封裝
│   ├── views/                # 頁面元件
│   │   ├── RichMenuList.vue       # 列表頁
│   │   └── RichMenuEdit.vue       # 編輯頁
│   ├── App.vue               # 根元件
│   └── main.js               # 應用入口
├── .gitignore
├── index.html
├── package.json
├── README.md
├── start-dev.sh              # Linux/Mac 啟動腳本
├── start-dev.bat             # Windows 啟動腳本
└── vite.config.js            # Vite 配置
\`\`\`

## 🚀 快速開始

### 方法 1: 使用啟動腳本

**Linux/Mac:**
\`\`\`bash
./start-dev.sh
\`\`\`

**Windows:**
\`\`\`cmd
start-dev.bat
\`\`\`

### 方法 2: 手動執行

1. 安裝依賴:
\`\`\`bash
npm install
\`\`\`

2. 啟動開發伺服器:
\`\`\`bash
npm run dev
\`\`\`

3. 開啟瀏覽器訪問: http://localhost:3000

## 🎨 UI 設計特色

1. **現代化設計**: 採用 Material Design 設計語言
2. **響應式布局**: 支援桌面、平板、手機
3. **直覺式操作**: 步驟式流程,降低學習成本
4. **視覺化預覽**: 即時預覽圖文選單效果
5. **互動式設定**: 點擊區域直接設定動作

## 🔧 技術細節

### 版型配置

系統提供 6 種預設版型:

1. **6個區域** (3x2): 適合多功能選單
2. **4個區域** (2x2): 平衡的四宮格
3. **3個區域** (3x1): 橫向三分割
4. **3個區域** (1上2下): 主要功能+兩個次要功能
5. **2個區域** (左右): 簡單的兩個選項
6. **2個區域** (上下): 垂直分割

### 動作類型

每個區域支援三種動作:

1. **連結 (URI)**
   - 開啟網頁連結
   - 需提供完整 URL
   - 可自訂按鈕標籤

2. **文字訊息 (Message)**
   - 發送預設文字
   - 觸發自動回覆
   - 可自訂顯示標籤

3. **無動作 (None)**
   - 純裝飾區域
   - 不可點擊

## 📡 API 端點

### 圖文選單管理
- \`GET /api/bot_management/get_rich_menu_list/\` - 列表
- \`GET /api/bot_management/get_rm/:id/\` - 詳情
- \`POST /api/bot_management/save_rm/\` - 建立/更新
- \`DELETE /api/bot_management/del_richmenu/:id/\` - 刪除
- \`POST /api/bot_management/set_rm_to_line/\` - 發佈
- \`POST /api/bot_management/richmenu_unlink/\` - 取消連結
- \`POST /api/bot_management/close_all_rm/\` - 關閉所有
- \`POST /api/bot_management/remove_all_rm_api/\` - 移除所有

### 檔案上傳
- \`POST /api/upload/image/\` - 圖片上傳

## 🎯 使用流程

### 建立新圖文選單

1. 點擊「新增圖文選單」按鈕
2. 填寫基本資料(名稱、描述、聊天室文字)
3. 選擇適合的版型
4. 上傳符合規格的圖片 (2500x1686 px)
5. 為每個區域設定動作
6. 預覽並確認所有設定
7. 儲存圖文選單

### 編輯現有圖文選單

1. 在列表中點擊「編輯」按鈕
2. 修改任何步驟的設定
3. 儲存變更

### 發佈圖文選單

1. 在列表中點擊「更多」選單
2. 選擇「設定發佈」
3. 圖文選單將套用到 LINE OA

## 📝 開發注意事項

1. **圖片規格**: 必須嚴格符合 2500x1686 px
2. **檔案大小**: 圖片不可超過 1MB
3. **區域動作**: 所有區域都必須設定動作才能儲存
4. **URL 格式**: 連結必須包含 http:// 或 https://

## 🐛 除錯指南

### 問題: 無法連接後端 API
**解決方案**: 檢查 \`vite.config.js\` 中的 proxy 設定

### 問題: 圖片上傳失敗
**解決方案**: 
- 確認圖片尺寸正確
- 檢查檔案大小
- 確認後端 API 正常運作

### 問題: 無法安裝依賴
**解決方案**: 
- 檢查 Node.js 版本 (建議 v18 以上)
- 清除 npm cache: \`npm cache clean --force\`
- 刪除 node_modules 重新安裝

## 📞 支援

如有任何問題,請聯繫開發團隊。

---

**最後更新**: 2026-03-23
