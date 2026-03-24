public/
└── placeholder.png  (建議準備一張 300x200 的預設圖片)

如果沒有 placeholder 圖片,可以使用以下方式:

1. 線上產生器:
   - https://via.placeholder.com/300x200
   - https://placehold.co/300x200

2. 或建立一個簡單的灰色矩形圖片

3. 或暫時移除 RichMenuList.vue 中的:
   :src="item.thumbnail || '/placeholder.png'"
   
   改為:
   :src="item.thumbnail || 'https://via.placeholder.com/300x200'"
