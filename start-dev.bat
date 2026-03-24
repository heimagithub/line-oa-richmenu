@echo off
echo ==========================================
echo   圖文選單管理系統 - 開發環境啟動腳本
echo ==========================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
  echo 📦 偵測到尚未安裝依賴套件,開始安裝...
  call npm install
  
  if errorlevel 1 (
    echo ❌ 安裝失敗,請檢查錯誤訊息
    pause
    exit /b 1
  )
  
  echo ✅ 依賴套件安裝完成
  echo.
)

echo 🚀 啟動開發伺服器...
echo 📍 應用程式將在 http://localhost:3000 運行
echo.
echo 提示: 按 Ctrl+C 停止伺服器
echo.

call npm run dev
pause
