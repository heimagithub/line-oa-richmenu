# 圖片上傳問題排查指南

## 問題: 選擇圖片後出現「上傳失敗 請重試」

### 已修正的問題

1. **API 路徑錯誤** ✅
   - 原本: `/upload/image/`
   - 修正後: `/api/bot_management/upload_richmenu_image/`
   - 備用路徑: `/api/upload/image/`

2. **增強錯誤處理** ✅
   - 新增詳細的 console.log 輸出
   - 更明確的錯誤訊息
   - 自動嘗試多個 API 路徑

3. **開發模式本地預覽** ✅
   - 如果後端 API 不可用,自動使用 Base64 預覽
   - 顯示警告訊息告知使用本地模式

---

## 排查步驟

### 步驟 1: 檢查瀏覽器 Console

1. 開啟瀏覽器開發者工具 (F12)
2. 切換到 Console 標籤
3. 上傳圖片
4. 查看錯誤訊息

**可能的錯誤訊息**:

| 錯誤訊息 | 原因 | 解決方案 |
|---------|------|---------|
| `Network Error` | 後端未啟動 | 啟動後端伺服器 |
| `404 Not Found` | API 路徑錯誤 | 確認後端 API 路徑 |
| `500 Internal Server Error` | 後端程式錯誤 | 檢查後端日誌 |
| `413 Payload Too Large` | 檔案過大 | 壓縮圖片或調整後端限制 |

---

### 步驟 2: 檢查 Network 標籤

1. 在開發者工具中切換到 Network 標籤
2. 上傳圖片
3. 查看 HTTP 請求

**檢查項目**:

```
請求 URL: http://localhost:3000/api/bot_management/upload_richmenu_image/
實際 URL: http://localhost:8000/bot_management/upload_richmenu_image/ (經過 proxy)
請求方法: POST
Content-Type: multipart/form-data
```

**如果看到**:
- 狀態碼 404: API 路徑不存在
- 狀態碼 500: 後端程式錯誤
- 狀態碼 0 或 cancelled: 網路連接失敗

---

### 步驟 3: 確認後端是否啟動

```bash
# 檢查後端是否在運行
curl http://localhost:8000/api/health
# 或
curl http://localhost:8000/
```

如果無法連接,請啟動後端:

```bash
# Django 範例
cd /path/to/backend
python manage.py runserver 8000
```

---

### 步驟 4: 確認後端 API 路徑

根據你的 `好推_Richmenu.md` 文件,可能的 API 路徑有:

1. `/api/bot_management/upload_richmenu_image/`
2. `/api/upload/image/`
3. `/api/richmenu/upload/`

**如何確認正確路徑**:

```bash
# 方法 1: 查看後端 urls.py
cat backend/bot_management/urls.py | grep upload

# 方法 2: 測試 API
curl -X POST http://localhost:8000/api/bot_management/upload_richmenu_image/ \
  -F "file=@test.jpg"
```

---

### 步驟 5: 檢查後端 CORS 設定

如果後端已啟動但仍然失敗,可能是 CORS 問題。

**Django CORS 設定** (django-cors-headers):

```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# 或允許所有來源 (僅開發環境)
CORS_ALLOW_ALL_ORIGINS = True
```

---

### 步驟 6: 測試檔案上傳

使用 curl 直接測試後端:

```bash
# 建立測試圖片
curl -o test.jpg https://via.placeholder.com/2500x1686

# 測試上傳
curl -X POST http://localhost:8000/api/bot_management/upload_richmenu_image/ \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"
```

**預期回應**:
```json
{
  "url": "https://example.com/media/richmenu/xxx.jpg",
  "file_url": "/media/richmenu/xxx.jpg",
  "success": true
}
```

---

## 臨時解決方案

### 方案 1: 使用本地預覽模式 (已內建)

現在程式已自動支援本地預覽模式:
- 如果後端 API 無法連接
- 會顯示警告訊息
- 使用 Base64 作為圖片預覽
- 可以繼續編輯,但儲存時需要再處理圖片

### 方案 2: 修改 API 路徑

如果你知道正確的後端 API 路徑,請修改:

**檔案**: `src/api/richMenu.js`

```javascript
uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/api/你的正確路徑/',  // 修改這裡
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
```

### 方案 3: 修改後端位址

如果後端不在 localhost:8000,請修改:

**檔案**: `vite.config.js`

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://你的後端位址:埠號',  // 修改這裡
      changeOrigin: true
    }
  }
}
```

修改後需要重啟開發伺服器:
```bash
# Ctrl+C 停止
# 重新啟動
npm run dev
```

---

## 後端 API 實作參考

如果後端還沒有實作上傳 API,可以參考以下範例:

### Django 範例

**urls.py**:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('upload_richmenu_image/', views.upload_richmenu_image, name='upload_richmenu_image'),
]
```

**views.py**:
```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings

@csrf_exempt
def upload_richmenu_image(request):
    if request.method == 'POST':
        file = request.FILES.get('file')
        
        if not file:
            return JsonResponse({'error': 'No file provided'}, status=400)
        
        # 驗證檔案類型
        if not file.content_type.startswith('image/'):
            return JsonResponse({'error': 'Invalid file type'}, status=400)
        
        # 儲存檔案
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'richmenu')
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, file.name)
        
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # 回傳檔案 URL
        file_url = f'/media/richmenu/{file.name}'
        
        return JsonResponse({
            'success': True,
            'url': file_url,
            'file_url': file_url,
            'filename': file.name
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
```

**settings.py**:
```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
```

---

## 檢查清單

上傳圖片前請確認:

- [ ] 後端伺服器已啟動 (http://localhost:8000)
- [ ] 圖片格式正確 (JPG/PNG)
- [ ] 圖片大小 < 1MB
- [ ] 瀏覽器 Console 沒有錯誤
- [ ] Network 標籤顯示請求成功
- [ ] 後端 API 路徑正確
- [ ] CORS 設定正確
- [ ] 前端 proxy 設定正確

---

## 常見問題

### Q1: 顯示「網路連接失敗」

**原因**: 後端未啟動或位址錯誤

**解決**:
1. 確認後端啟動在 http://localhost:8000
2. 檢查 vite.config.js 中的 proxy 設定
3. 嘗試直接訪問 http://localhost:8000

### Q2: 顯示「上傳 API 不存在」

**原因**: API 路徑錯誤或後端未實作

**解決**:
1. 確認後端 urls.py 中的路徑
2. 使用 curl 測試 API
3. 修改前端 API 路徑

### Q3: 開發模式顯示「使用本地預覽模式」

**原因**: 後端 API 無法連接,自動啟用本地預覽

**說明**: 這是正常的備用模式,可以繼續編輯,但:
- 圖片使用 Base64 格式
- 儲存時需要確保後端可以處理 Base64
- 建議修復後端連接

### Q4: 圖片預覽正常但儲存失敗

**原因**: 本地預覽模式使用 Base64,但後端不接受

**解決**:
1. 修復後端 API 連接
2. 或修改後端接受 Base64 格式
3. 或在儲存前重新上傳圖片

---

## 需要更多幫助?

請提供以下資訊:

1. 瀏覽器 Console 的完整錯誤訊息
2. Network 標籤中的請求詳情
3. 後端日誌
4. 圖片檔案資訊 (大小、格式)

---

**更新日期**: 2026-03-23  
**問題狀態**: 已修正並增強錯誤處理
