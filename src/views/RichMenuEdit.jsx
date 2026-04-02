import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AreaRegionPanel from '../components/AreaRegionPanel'
import { richMenuApi } from '../api/richMenu'
import {
  CANVAS_W,
  COMPACT_CANVAS_H,
  FULL_CANVAS_H,
  getDefaultBoundsForNewArea,
  normalizeAction,
  sanitizeActionForPayload,
  validateAction
} from '../utils/richMenuAreaActions'

/** 完整版：由左至右 1、2、3、4、6 區；第一項為預設版型 */
const fullLayouts = [
  {
    id: 'layout-1',
    rows: 1,
    cols: 1,
    areas: [{ bounds: { x: 0, y: 0, width: CANVAS_W, height: FULL_CANVAS_H } }]
  },
  {
    id: 'layout-2',
    rows: 1,
    cols: 2,
    areas: [
      { bounds: { x: 0, y: 0, width: 1250, height: FULL_CANVAS_H } },
      { bounds: { x: 1250, y: 0, width: 1250, height: FULL_CANVAS_H } }
    ]
  },
  {
    id: 'layout-3',
    rows: 1,
    cols: 3,
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: FULL_CANVAS_H } },
      { bounds: { x: 833, y: 0, width: 834, height: FULL_CANVAS_H } },
      { bounds: { x: 1667, y: 0, width: 833, height: FULL_CANVAS_H } }
    ]
  },
  {
    id: 'layout-4',
    rows: 2,
    cols: 2,
    areas: [
      { bounds: { x: 0, y: 0, width: 1250, height: 843 } },
      { bounds: { x: 1250, y: 0, width: 1250, height: 843 } },
      { bounds: { x: 0, y: 843, width: 1250, height: 843 } },
      { bounds: { x: 1250, y: 843, width: 1250, height: 843 } }
    ]
  },
  {
    id: 'layout-6',
    rows: 2,
    cols: 3,
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: 843 } },
      { bounds: { x: 833, y: 0, width: 834, height: 843 } },
      { bounds: { x: 1667, y: 0, width: 833, height: 843 } },
      { bounds: { x: 0, y: 843, width: 833, height: 843 } },
      { bounds: { x: 833, y: 843, width: 834, height: 843 } },
      { bounds: { x: 1667, y: 843, width: 833, height: 843 } }
    ]
  }
]

/** 精簡版：僅 1、2、3 格（高度 843） */
const compactLayouts = [
  {
    id: 'layout-1',
    rows: 1,
    cols: 1,
    areas: [{ bounds: { x: 0, y: 0, width: CANVAS_W, height: COMPACT_CANVAS_H } }]
  },
  {
    id: 'layout-2',
    rows: 1,
    cols: 2,
    areas: [
      { bounds: { x: 0, y: 0, width: 1250, height: COMPACT_CANVAS_H } },
      { bounds: { x: 1250, y: 0, width: 1250, height: COMPACT_CANVAS_H } }
    ]
  },
  {
    id: 'layout-3',
    rows: 1,
    cols: 3,
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: COMPACT_CANVAS_H } },
      { bounds: { x: 833, y: 0, width: 834, height: COMPACT_CANVAS_H } },
      { bounds: { x: 1667, y: 0, width: 833, height: COMPACT_CANVAS_H } }
    ]
  }
]

function layoutsForMenuSize(menuSize) {
  return menuSize === 'compact' ? compactLayouts : fullLayouts
}

function areasFromLayout(layout) {
  return layout.areas.map((area) => ({
    bounds: { ...area.bounds },
    areaName: '',
    action: { type: 'message', text: '' }
  }))
}

function hasAreaFilledData(area) {
  if (!area || typeof area !== 'object') return false
  if ((area.areaName || '').trim()) return true
  const action = normalizeAction(area.action)
  switch (action.type) {
    case 'message':
      return Boolean(action.text?.trim())
    case 'uri':
      return Boolean(action.uri?.trim())
    case 'postback':
      return Boolean(action.data?.trim() || action.displayText?.trim())
    case 'richmenuswitch':
      return Boolean(action.richMenuAliasId?.trim() || action.data?.trim())
    default:
      return false
  }
}

const MIN_AREA_SIZE = 40

/** 依預覽 DOM 像素換算為圖文選單座標系 (2500×H) 的位移 */
function clientDeltaToCanvas(clientDx, clientDy, previewRect, canvasH) {
  if (!previewRect || previewRect.width <= 0 || previewRect.height <= 0) {
    return { dx: 0, dy: 0 }
  }
  return {
    dx: (clientDx / previewRect.width) * CANVAS_W,
    dy: (clientDy / previewRect.height) * canvasH
  }
}

/** 拖曳四角之一時，固定對角、計算新 bounds */
function computeResizedBounds(corner, start, canvasDx, canvasDy, canvasH) {
  const x0 = start.x
  const y0 = start.y
  const x1 = start.x + start.width
  const y1 = start.y + start.height

  switch (corner) {
    case 'nw': {
      let nx0 = x0 + canvasDx
      let ny0 = y0 + canvasDy
      nx0 = Math.max(0, Math.min(nx0, x1 - MIN_AREA_SIZE))
      ny0 = Math.max(0, Math.min(ny0, y1 - MIN_AREA_SIZE))
      return {
        x: Math.round(nx0),
        y: Math.round(ny0),
        width: Math.round(x1 - nx0),
        height: Math.round(y1 - ny0)
      }
    }
    case 'ne': {
      let nx1 = x1 + canvasDx
      let ny0 = y0 + canvasDy
      nx1 = Math.min(CANVAS_W, Math.max(x0 + MIN_AREA_SIZE, nx1))
      ny0 = Math.max(0, Math.min(ny0, y1 - MIN_AREA_SIZE))
      return {
        x: Math.round(x0),
        y: Math.round(ny0),
        width: Math.round(nx1 - x0),
        height: Math.round(y1 - ny0)
      }
    }
    case 'sw': {
      let nx0 = x0 + canvasDx
      let ny1 = y1 + canvasDy
      nx0 = Math.max(0, Math.min(nx0, x1 - MIN_AREA_SIZE))
      ny1 = Math.min(canvasH, Math.max(y0 + MIN_AREA_SIZE, ny1))
      return {
        x: Math.round(nx0),
        y: Math.round(y0),
        width: Math.round(x1 - nx0),
        height: Math.round(ny1 - y0)
      }
    }
    case 'se': {
      let nx1 = x1 + canvasDx
      let ny1 = y1 + canvasDy
      nx1 = Math.min(CANVAS_W, Math.max(x0 + MIN_AREA_SIZE, nx1))
      ny1 = Math.min(canvasH, Math.max(y0 + MIN_AREA_SIZE, ny1))
      return {
        x: Math.round(x0),
        y: Math.round(y0),
        width: Math.round(nx1 - x0),
        height: Math.round(ny1 - y0)
      }
    }
    default:
      return { ...start }
  }
}

export default function RichMenuEdit({ selectedOaId }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isCopyMode = useMemo(
    () => Boolean(id) && searchParams.get('mode') === 'copy',
    [id, searchParams]
  )
  const isEditMode = useMemo(() => Boolean(id) && !isCopyMode, [id, isCopyMode])
  const pageTitle = useMemo(() => {
    if (isCopyMode) return '複製圖文選單'
    return isEditMode ? '編輯圖文選單' : '新增圖文選單'
  }, [isCopyMode, isEditMode])

  const [saving, setSaving] = useState(false)
  const [expandedAreaIndex, setExpandedAreaIndex] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [menuSize, setMenuSize] = useState('full')
  const [activeLayoutId, setActiveLayoutId] = useState(fullLayouts[0].id)
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(null)
  const [dragState, setDragState] = useState(null)
  const [savedRichMenus, setSavedRichMenus] = useState([])
  const previewRef = useRef(null)
  const areaAccordionListRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    chatBarText: '查看更多',
    imageUrl: '',
    areas: areasFromLayout(fullLayouts[0])
  })

  const canvasH = useMemo(
    () => (menuSize === 'compact' ? COMPACT_CANVAS_H : FULL_CANVAS_H),
    [menuSize]
  )
  const visibleLayouts = useMemo(() => layoutsForMenuSize(menuSize), [menuSize])

  useEffect(() => {
    if (!id || !selectedOaId) return
    ;(async () => {
      try {
        const data = await richMenuApi.getRichMenu(id, { oaId: selectedOaId })
        const normalized = data?.data || data
        const { description: _ignoredDesc, ...restNormalized } = normalized
        const rawAreas = restNormalized.areas
        const areas = Array.isArray(rawAreas)
          ? rawAreas.map((a) => ({
              bounds: a.bounds,
              areaName: a.areaName ?? '',
              action: normalizeAction(a.action)
            }))
          : []
        const apiH = normalized.size?.height
        const inferredSize =
          apiH === COMPACT_CANVAS_H || apiH === 843 ? 'compact' : 'full'
        setMenuSize(inferredSize)
        const layoutList = layoutsForMenuSize(inferredSize)
        setFormData((prev) => ({ ...prev, ...restNormalized, areas }))
        const matchedLayout = layoutList.find((l) => l.areas.length === areas.length)
        if (matchedLayout) setActiveLayoutId(matchedLayout.id)
      } catch (error) {
        alert('載入失敗')
      }
    })()
  }, [id, selectedOaId])

  useEffect(() => {
    if (!selectedOaId) {
      setSavedRichMenus([])
      return
    }
    ;(async () => {
      try {
        const list = await richMenuApi.getList({ oaId: selectedOaId })
        setSavedRichMenus(Array.isArray(list) ? list : list?.data || [])
      } catch {
        setSavedRichMenus([])
      }
    })()
  }, [selectedOaId])

  const switchTargetOptions = useMemo(() => {
    return savedRichMenus.filter((item) => String(item.id) !== String(id || ''))
  }, [savedRichMenus, id])

  const applyLayout = (layout) => {
    if (layout.id === activeLayoutId) return
    const hasFilledData = formData.areas.some(hasAreaFilledData)
    if (hasFilledData) {
      const shouldClear = window.confirm(
        '切換模板會清除當前所有按鈕設定，是否要清除？'
      )
      if (!shouldClear) return
    }
    setActiveLayoutId(layout.id)
    setSelectedAreaIndex(null)
    setExpandedAreaIndex(null)
    setFormData((prev) => ({
      ...prev,
      areas: areasFromLayout(layout)
    }))
  }

  const handleMenuSizeChange = (nextSize) => {
    if (nextSize === menuSize) return
    setMenuSize(nextSize)
    const list = layoutsForMenuSize(nextSize)
    const first = list[0]
    setActiveLayoutId(first.id)
    setSelectedAreaIndex(null)
    setExpandedAreaIndex(null)
    setFormData((prev) => ({
      ...prev,
      areas: areasFromLayout(first)
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, imageUrl: event.target?.result || '' }))
    }
    reader.readAsDataURL(file)
  }

  const handleAreaActionChange = (index, action) => {
    setFormData((prev) => {
      const nextAreas = [...prev.areas]
      if (!nextAreas[index]) return prev
      nextAreas[index] = { ...nextAreas[index], action: normalizeAction(action) }
      return { ...prev, areas: nextAreas }
    })
  }

  const handleAreaNameChange = (index, areaName) => {
    setFormData((prev) => {
      const nextAreas = [...prev.areas]
      if (!nextAreas[index]) return prev
      nextAreas[index] = { ...nextAreas[index], areaName }
      return { ...prev, areas: nextAreas }
    })
  }

  const handleAddArea = () => {
    const newIndex = formData.areas.length
    setFormData((prev) => ({
      ...prev,
      areas: [
        ...prev.areas,
        {
          bounds: getDefaultBoundsForNewArea(newIndex, canvasH),
          areaName: '',
          action: { type: 'message', text: '' }
        }
      ]
    }))
    setExpandedAreaIndex(newIndex)
    setSelectedAreaIndex(newIndex)
  }

  const handleToggleExpandArea = (index) => {
    setExpandedAreaIndex((prev) => {
      if (prev === index) return null
      setSelectedAreaIndex(index)
      return index
    })
  }

  const handleDeleteArea = (index) => {
    setExpandedAreaIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
    setSelectedAreaIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== index)
    }))
  }

  const updateAreaBounds = useCallback((index, nextBounds) => {
    setFormData((prev) => {
      const nextAreas = [...prev.areas]
      if (!nextAreas[index]) return prev
      nextAreas[index] = {
        ...nextAreas[index],
        bounds: nextBounds
      }
      return { ...prev, areas: nextAreas }
    })
  }, [])

  const beginDragMove = (event, index) => {
    if (event.button !== 0) return
    const area = formData.areas[index]
    if (!area) return
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    event.preventDefault()
    event.stopPropagation()
    setDragState({
      type: 'move',
      index,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBounds: { ...area.bounds }
    })
  }

  const beginDragResize = (event, index, corner) => {
    if (event.button !== 0) return
    const area = formData.areas[index]
    if (!area) return
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    event.preventDefault()
    event.stopPropagation()
    setActiveTab('area')
    setExpandedAreaIndex(index)
    setSelectedAreaIndex(index)
    setDragState({
      type: 'resize',
      corner,
      index,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBounds: { ...area.bounds }
    })
  }

  useEffect(() => {
    if (!dragState) return
    const onMove = (event) => {
      const rect = previewRef.current?.getBoundingClientRect()
      if (!rect) return
      const clientDx = event.clientX - dragState.startClientX
      const clientDy = event.clientY - dragState.startClientY
      const { dx: canvasDx, dy: canvasDy } = clientDeltaToCanvas(clientDx, clientDy, rect, canvasH)

      if (dragState.type === 'move') {
        const start = dragState.startBounds
        const maxX = CANVAS_W - start.width
        const maxY = canvasH - start.height
        const nextX = Math.max(0, Math.min(maxX, Math.round(start.x + canvasDx)))
        const nextY = Math.max(0, Math.min(maxY, Math.round(start.y + canvasDy)))
        updateAreaBounds(dragState.index, {
          ...start,
          x: nextX,
          y: nextY
        })
        return
      }

      if (dragState.type === 'resize') {
        const next = computeResizedBounds(
          dragState.corner,
          dragState.startBounds,
          canvasDx,
          canvasDy,
          canvasH
        )
        updateAreaBounds(dragState.index, next)
      }
    }
    const onUp = () => setDragState(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragState, updateAreaBounds, canvasH])

  useEffect(() => {
    if (activeTab !== 'area') return
    if (expandedAreaIndex === null) return
    const root = areaAccordionListRef.current
    if (!root) return
    const el = root.querySelector(`[data-area-index="${expandedAreaIndex}"]`)
    if (!el) return
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }, [activeTab, expandedAreaIndex, formData.areas.length])

  const handlePreviewBackgroundMouseDown = (event) => {
    if (event.target !== event.currentTarget) return
    setSelectedAreaIndex(null)
  }

  const renderLayoutIcon = (layout) => {
    const iconCols = Array.from({ length: layout.cols })
    const iconRows = Array.from({ length: layout.rows })
    return (
      <span
        className="layout-icon"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`
        }}
        aria-hidden="true"
      >
        {iconRows.map((_, rowIdx) =>
          iconCols.map((_, colIdx) => (
            <span key={`${layout.id}-${rowIdx}-${colIdx}`} className="layout-icon-cell" />
          ))
        )}
      </span>
    )
  }

  const handleSubmit = async () => {
    if (!selectedOaId) {
      alert('請先選擇 OA 後再儲存')
      return
    }
    if (!formData.name || !formData.imageUrl || formData.areas.length === 0) {
      alert('請完整填寫名稱、圖片與區域')
      return
    }

    for (let i = 0; i < formData.areas.length; i++) {
      const err = validateAction(formData.areas[i]?.action)
      if (err) {
        alert(`區域 ${i + 1}：${err}`)
        setActiveTab('area')
        setExpandedAreaIndex(i)
        setSelectedAreaIndex(i)
        return
      }
    }

    const isDataUrlImage = String(formData.imageUrl || '').startsWith('data:image/')
    const payload = {
      name: formData.name,
      description: '',
      chatBarText: formData.chatBarText,
      ...(isDataUrlImage ? { imageBase64: formData.imageUrl } : { imageUrl: formData.imageUrl }),
      size: { width: CANVAS_W, height: canvasH },
      selected: false,
      oaId: selectedOaId,
      areas: formData.areas.map((a) => ({
        bounds: a.bounds,
        areaName: (a.areaName || '').trim(),
        action: sanitizeActionForPayload(a.action)
      }))
    }

    setSaving(true)
    try {
      if (isEditMode) {
        await richMenuApi.updateRichMenu(id, payload, { oaId: selectedOaId })
      } else {
        await richMenuApi.createRichMenu(payload)
      }
      navigate('/richmenu/list')
    } catch (error) {
      alert('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel richmenu-page">
      <div className="page-head">
        <h2>{pageTitle}</h2>
        <div className="actions">
          <button className="btn btn-light" onClick={() => navigate('/richmenu/list')}>返回</button>
          <button className="btn btn-success" disabled={saving} onClick={handleSubmit}>{saving ? '儲存中...' : (isEditMode ? '儲存變更' : '建立圖文選單')}</button>
        </div>
      </div>

      <div className="richmenu-shell">
        <aside className="card richmenu-sidebar">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              基本設定
            </button>
            <button
              className={`tab-btn ${activeTab === 'area' ? 'active' : ''}`}
              onClick={() => setActiveTab('area')}
            >
              區域設定
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'basic' ? (
              <>
                <label>圖文選單名稱</label>
                <input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
                <label>聊天室選單文字</label>
                <input value={formData.chatBarText} onChange={(e) => setFormData((p) => ({ ...p, chatBarText: e.target.value }))} />
                <label className="menu-size-label">選單大小</label>
                <div className="menu-size-group" role="radiogroup" aria-label="選單大小">
                  <button
                    type="button"
                    className={`menu-size-option ${menuSize === 'full' ? 'active' : ''}`}
                    role="radio"
                    aria-checked={menuSize === 'full'}
                    onClick={() => handleMenuSizeChange('full')}
                  >
                    <span className="menu-size-option-title">完整版</span>
                    <span className="menu-size-option-meta">2500 × 1686</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-size-option ${menuSize === 'compact' ? 'active' : ''}`}
                    role="radio"
                    aria-checked={menuSize === 'compact'}
                    onClick={() => handleMenuSizeChange('compact')}
                  >
                    <span className="menu-size-option-title">精簡版</span>
                    <span className="menu-size-option-meta">2500 × 843</span>
                  </button>
                </div>
                <label>上傳圖片</label>
                <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageChange} />
              </>
            ) : (
              <AreaRegionPanel
                areas={formData.areas}
                switchTargetOptions={switchTargetOptions}
                expandedIndex={expandedAreaIndex}
                selectedIndex={selectedAreaIndex}
                accordionListRef={areaAccordionListRef}
                onToggleExpand={handleToggleExpandArea}
                onAddRegion={handleAddArea}
                onAreaNameChange={handleAreaNameChange}
                onAreaActionChange={handleAreaActionChange}
                onDeleteArea={handleDeleteArea}
              />
            )}
          </div>
        </aside>

        <section className="richmenu-main">
          <div className="card quick-layout-card">
            <h3>快速套用版型範本</h3>
            <div
              className={`layout-grid icon-only${menuSize === 'compact' ? ' layout-grid--compact' : ''}`}
            >
              {visibleLayouts.map((layout) => (
                <button
                  className={`layout-item icon-only ${activeLayoutId === layout.id ? 'active' : ''}`}
                  key={layout.id}
                  onClick={() => applyLayout(layout)}
                  title={layout.id}
                >
                  {renderLayoutIcon(layout)}
                </button>
              ))}
            </div>
          </div>

          <div className="card preview-card">
            <div className="preview-column">
              <div
                className={`preview-inner${menuSize === 'compact' ? ' preview-inner--compact' : ''}`}
              >
                <div className="preview-head">
                  <h3>圖文選單預覽</h3>
                  <span className="hint">
                    2500 × {menuSize === 'compact' ? COMPACT_CANVAS_H : FULL_CANVAS_H}
                  </span>
                </div>
                <div className="preview-stage">
                  <div
                    ref={previewRef}
                    className="menu-preview"
                    style={{
                      ...(formData.imageUrl ? { backgroundImage: `url(${formData.imageUrl})` } : {}),
                      aspectRatio: `${CANVAS_W} / ${canvasH}`
                    }}
                    onMouseDown={handlePreviewBackgroundMouseDown}
                  >
                    {formData.areas.map((_, idx) => (
                      <div
                        key={`preview-area-${idx}`}
                        className={`preview-area-block ${selectedAreaIndex === idx ? 'is-focused' : ''}`}
                        style={{
                          left: `${(formData.areas[idx].bounds.x / CANVAS_W) * 100}%`,
                          top: `${(formData.areas[idx].bounds.y / canvasH) * 100}%`,
                          width: `${(formData.areas[idx].bounds.width / CANVAS_W) * 100}%`,
                          height: `${(formData.areas[idx].bounds.height / canvasH) * 100}%`
                        }}
                      >
                        <div
                          className="preview-area-body"
                          onMouseDown={(event) => {
                            event.stopPropagation()
                            setActiveTab('area')
                            setExpandedAreaIndex(idx)
                            setSelectedAreaIndex(idx)
                            beginDragMove(event, idx)
                          }}
                        >
                          <span className="preview-index">{idx + 1}</span>
                          <span className="preview-name">
                            {(formData.areas[idx].areaName || '').trim() || `區域 ${idx + 1}`}
                          </span>
                          <span
                            className="preview-delete"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteArea(idx)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                handleDeleteArea(idx)
                              }
                            }}
                          >
                            x
                          </span>
                        </div>
                        {selectedAreaIndex === idx && (
                          <>
                            <button
                              type="button"
                              className="preview-handle preview-handle-nw"
                              aria-label="縮放左上"
                              onMouseDown={(e) => beginDragResize(e, idx, 'nw')}
                            />
                            <button
                              type="button"
                              className="preview-handle preview-handle-ne"
                              aria-label="縮放右上"
                              onMouseDown={(e) => beginDragResize(e, idx, 'ne')}
                            />
                            <button
                              type="button"
                              className="preview-handle preview-handle-sw"
                              aria-label="縮放左下"
                              onMouseDown={(e) => beginDragResize(e, idx, 'sw')}
                            />
                            <button
                              type="button"
                              className="preview-handle preview-handle-se"
                              aria-label="縮放右下"
                              onMouseDown={(e) => beginDragResize(e, idx, 'se')}
                            />
                          </>
                        )}
                      </div>
                    ))}
                    {formData.areas.length === 0 && (
                      <div className="preview-empty hint">請先從上方選擇一個版型範本</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

    </section>
  )
}
