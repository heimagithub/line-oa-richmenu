/** LINE 圖文選單區域動作：正規化、摘要標籤、送出前整理 */

export const CANVAS_W = 2500
/** 完整版圖文選單高度（LINE 規格 2500×1686） */
export const FULL_CANVAS_H = 1686
/** 精簡版圖文選單高度（LINE 規格 2500×843） */
export const COMPACT_CANVAS_H = 843
/** @deprecated 請改用 FULL_CANVAS_H 或依選單尺寸傳入高度 */
export const CANVAS_H = FULL_CANVAS_H

/** 新增區域時的預設可拖曳區塊（與既有區塊略為錯開） */
export function getDefaultBoundsForNewArea(index, canvasH = FULL_CANVAS_H) {
  const w = 560
  const h = 360
  const step = 48
  const x = Math.min(60 + (index % 10) * step, CANVAS_W - w - 16)
  const y = Math.min(60 + (index % 10) * step, canvasH - h - 16)
  return { x, y, width: w, height: h }
}

export const ACTION_TYPE_OPTIONS = [
  { id: 'none', label: '無動作' },
  { id: 'message', label: '傳送訊息' },
  { id: 'uri', label: '開啟網址' },
  { id: 'postback', label: 'Postback' },
  { id: 'richmenuswitch', label: '切換圖文選單' }
]

export function getActionTypeLabel(type) {
  const found = ACTION_TYPE_OPTIONS.find((o) => o.id === type)
  return found ? found.label : type || 'none'
}

export function normalizeAction(raw) {
  if (!raw || typeof raw !== 'object') return { type: 'none' }
  const t = raw.type || 'none'
  switch (t) {
    case 'message':
      return { type: 'message', text: raw.text ?? '' }
    case 'uri':
      return { type: 'uri', uri: raw.uri ?? '' }
    case 'postback':
      return {
        type: 'postback',
        data: raw.data ?? '',
        displayText: raw.displayText ?? ''
      }
    case 'richmenuswitch':
      return {
        type: 'richmenuswitch',
        richMenuAliasId: raw.richMenuAliasId ?? '',
        data: raw.data ?? ''
      }
    case 'none':
    default:
      return { type: 'none' }
  }
}

/** 切換動作類型時重置對應欄位 */
export function createActionForType(type) {
  switch (type) {
    case 'message':
      return { type: 'message', text: '' }
    case 'uri':
      return { type: 'uri', uri: '' }
    case 'postback':
      return { type: 'postback', data: '', displayText: '' }
    case 'richmenuswitch':
      return { type: 'richmenuswitch', richMenuAliasId: '', data: '' }
    default:
      return { type: 'none' }
  }
}

export function validateAction(action) {
  if (!action || action.type === 'none') return null
  switch (action.type) {
    case 'message':
      return action.text?.trim() ? null : '「傳送訊息」需填寫訊息文字'
    case 'uri':
      return action.uri?.trim() ? null : '「開啟網址」需填寫連結網址'
    case 'postback':
      return action.data?.trim() ? null : '「Postback」的資料 (data) 為必填'
    case 'richmenuswitch':
      if (!action.richMenuAliasId?.trim()) return '「切換圖文選單」需填寫圖文選單別名'
      return null
    default:
      return null
  }
}

/** 送出 API 用：移除多餘欄位 */
export function sanitizeActionForPayload(action) {
  if (!action || action.type === 'none') return { type: 'none' }
  switch (action.type) {
    case 'message':
      return { type: 'message', text: action.text?.trim() || '' }
    case 'uri':
      return { type: 'uri', uri: action.uri?.trim() || '' }
    case 'postback': {
      const out = { type: 'postback', data: action.data?.trim() || '' }
      const dt = action.displayText?.trim()
      if (dt) out.displayText = dt
      return out
    }
    case 'richmenuswitch':
      return {
        type: 'richmenuswitch',
        richMenuAliasId: action.richMenuAliasId?.trim() || '',
        data: action.data?.trim() || ''
      }
    default:
      return { type: 'none' }
  }
}
