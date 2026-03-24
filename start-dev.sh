#!/bin/bash

echo "=========================================="
echo "  圖文選單管理系統 - 開發環境啟動腳本"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "📦 偵測到尚未安裝依賴套件,開始安裝..."
  npm install
  
  if [ $? -ne 0 ]; then
    echo "❌ 安裝失敗,請檢查錯誤訊息"
    exit 1
  fi
  
  echo "✅ 依賴套件安裝完成"
  echo ""
fi

echo "🚀 啟動開發伺服器..."
echo "📍 應用程式將在 http://localhost:3000 運行"
echo ""
echo "提示: 按 Ctrl+C 停止伺服器"
echo ""

npm run dev
