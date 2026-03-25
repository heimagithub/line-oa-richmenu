import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { richMenuApi } from '../api/richMenu'

export default function RichMenuList({ selectedOaId }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState(null)
  const [publishType, setPublishType] = useState('set_default')
  const [publishing, setPublishing] = useState(false)
  const [unlinkingDefault, setUnlinkingDefault] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [removingRichMenus, setRemovingRichMenus] = useState(false)
  const [removingAllRichMenus, setRemovingAllRichMenus] = useState(false)

  const fetchList = async () => {
    if (!selectedOaId) {
      setList([])
      return
    }
    setLoading(true)
    try {
      const data = await richMenuApi.getList({
        search: searchKeyword,
        page_size: pageSize,
        oaId: selectedOaId
      })
      setList(Array.isArray(data) ? data : data?.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [pageSize, selectedOaId])

  useEffect(() => {
    const allowedIds = new Set((list || []).map((item) => item.id))
    setSelectedIds((prev) => prev.filter((id) => allowedIds.has(id)))
  }, [list])

  const handleDelete = async (item) => {
    if (!window.confirm(`確定刪除「${item.name}」？`)) return
    try {
      await richMenuApi.deleteRichMenu(item.id, { oaId: selectedOaId })
      await fetchList()
    } catch (error) {
      alert('刪除失敗')
    }
  }

  const getStatusMeta = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (['published', 'active', '已發佈', '已發布'].includes(normalized)) {
      return { text: '已發佈', className: 'status-published' }
    }
    if (['scheduled', '排程中', '排程發佈'].includes(normalized)) {
      return { text: '排程中', className: 'status-scheduled' }
    }
    if (['failed', 'publish_failed', '發佈失敗', '發布失敗'].includes(normalized)) {
      return { text: '發佈失敗', className: 'status-failed' }
    }
    return { text: '草稿', className: 'status-draft' }
  }

  const getDefaultMark = (item) => {
    return Boolean(item?.is_default || item?.isDefault || item?.default)
  }

  const getUpdatedAtText = (item) => {
    return item?.updated_at || item?.updatedAt || '2026/03/19 14:32'
  }

  const getSubTitle = (item) => {
    return item?.description || '完整版 - 開啟選單'
  }

  const getPreviewImage = (item) => {
    return item?.preview_url || item?.image_url || item?.imageUrl || ''
  }

  const closePublishDialog = () => {
    if (publishing) return
    setPublishDialogOpen(false)
    setPublishTarget(null)
    setPublishType('set_default')
  }

  const openPublishDialog = (item) => {
    setPublishTarget(item)
    setPublishType('set_default')
    setPublishDialogOpen(true)
  }

  const handlePublishSubmit = async () => {
    if (!publishTarget) return

    setPublishing(true)
    try {
      await richMenuApi.publishRichMenu(publishTarget.id, {
        mode: 'publish',
        setAsDefault: publishType === 'set_default',
        oaId: selectedOaId
      })
      await fetchList()
      closePublishDialog()
    } catch (error) {
      alert('發佈失敗')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnlinkDefault = async () => {
    if (!selectedOaId) return
    if (!window.confirm('確定要關閉目前 OA 的預設圖文選單嗎？')) return
    setUnlinkingDefault(true)
    try {
      await richMenuApi.unlinkRichMenu({ oaId: selectedOaId })
      await fetchList()
      alert('已關閉預設圖文選單')
    } catch (error) {
      alert('關閉預設圖文選單失敗')
    } finally {
      setUnlinkingDefault(false)
    }
  }

  const visibleIds = list.map((item) => item.id)
  const hasAnyItem = visibleIds.length > 0
  const allVisibleSelected = hasAnyItem && visibleIds.every((id) => selectedIds.includes(id))
  const hasSelected = selectedIds.length > 0
  const activeDefaultId = list.find((item) => getDefaultMark(item))?.id || null

  const handleToggleSelectAll = () => {
    if (!hasAnyItem) return
    if (allVisibleSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(visibleIds)
  }

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]))
  }

  const handleRemoveSelected = async () => {
    if (!selectedOaId || !hasSelected) return
    if (!window.confirm(`確定要移除已勾選的 ${selectedIds.length} 個圖文選單嗎？`)) return
    setRemovingRichMenus(true)
    try {
      const result = await richMenuApi.bulkDeleteRichMenu({
        oaId: selectedOaId,
        richMenuIds: selectedIds
      })
      const data = result?.data || {}
      const removedCount = Number(data.removedCount || 0)
      const failedCount = Number(data.failedCount || 0)
      setSelectedIds([])
      await fetchList()
      if (failedCount > 0) {
        alert(`已從 LINE 移除 ${removedCount} 個圖文選單，${failedCount} 個未移除。`)
      } else {
        alert(`已從 LINE 移除 ${removedCount} 個圖文選單`)
      }
    } catch (error) {
      alert('移除圖文選單失敗')
    } finally {
      setRemovingRichMenus(false)
    }
  }

  const handleRemoveAllRichMenus = async () => {
    if (!selectedOaId) return
    if (!window.confirm('確定要移除 LINE 上的所有圖文選單嗎？（不會刪除本地資料）')) return
    setRemovingAllRichMenus(true)
    try {
      const result = await richMenuApi.removeAllLineRichMenu({ oaId: selectedOaId })
      const data = result?.data || {}
      const removedCount = Number(data.removedCount || 0)
      const failedCount = Number(data.failedCount || 0)
      await fetchList()
      if (failedCount > 0) {
        alert(`LINE 圖文選單已移除 ${removedCount} 個，${failedCount} 個移除失敗。`)
      } else {
        alert(`LINE 圖文選單已移除 ${removedCount} 個`)
      }
    } catch (error) {
      alert('移除所有圖文選單失敗')
    } finally {
      setRemovingAllRichMenus(false)
    }
  }

  return (
    <section className="panel richmenu-list-page">
      <div className="page-head">
        <h2>圖文選單管理</h2>
        <div className="actions actions--match-edit">
          <button
            type="button"
            className="btn btn-light btn-placeholder"
            tabIndex={-1}
            aria-hidden="true"
          >
            返回
          </button>
          <button
            className="btn btn-danger"
            onClick={handleRemoveSelected}
            disabled={!selectedOaId || removingRichMenus || !hasSelected}
          >
            {removingRichMenus ? '處理中...' : '移除圖文選單'}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleRemoveAllRichMenus}
            disabled={!selectedOaId || removingAllRichMenus}
          >
            {removingAllRichMenus ? '處理中...' : '移除所有圖文選單'}
          </button>
          <button
            className="btn btn-light"
            onClick={handleUnlinkDefault}
            disabled={!selectedOaId || unlinkingDefault}
          >
            {unlinkingDefault ? '處理中...' : '關閉預設圖文選單'}
          </button>
          <button className="btn btn-success" onClick={() => navigate('/richmenu/create')}>新增圖文選單</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">搜尋：</span>
          <input
            className="toolbar-search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="請輸入圖文選單名稱關鍵字"
            disabled={!selectedOaId}
          />
          <button className="btn btn-light toolbar-search-btn" onClick={fetchList} disabled={!selectedOaId}>搜尋</button>
        </div>
        <div className="toolbar-right">
          <span className="toolbar-label">每頁筆數：</span>
          <select
            className="toolbar-page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleToggleSelectAll}
                  disabled={!hasAnyItem || !selectedOaId}
                  aria-label="全選圖文選單"
                />
              </th>
              <th>預覽圖</th>
              <th>圖文選單名稱</th>
              <th>狀態</th>
              <th>預設</th>
              <th>最後更新時間</th>
              <th className="action-header">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7}>載入中...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={7}>目前沒有圖文選單</td></tr>
            )}
            {!loading && list.map((item) => (
              <tr key={item.id}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleToggleSelectOne(item.id)}
                    aria-label={`選取${item.name}`}
                  />
                </td>
                <td>
                  <div className="preview-thumb-wrap">
                    {getPreviewImage(item) ? (
                      <img src={getPreviewImage(item)} alt={item.name} className="preview-thumb-img" />
                    ) : (
                      <div className="preview-thumb-placeholder">預覽</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="menu-name-cell">
                    <div className="menu-name-title">{item.name}</div>
                    <div className="menu-name-subtitle">{getSubTitle(item)}</div>
                  </div>
                </td>
                <td>
                  {(() => {
                    const statusMeta = getStatusMeta(item.status)
                    return (
                      <span className={`status-pill ${statusMeta.className}`}>
                        <span className="status-dot" />
                        {statusMeta.text}
                      </span>
                    )
                  })()}
                </td>
                <td>
                  <span
                    className={`default-star ${activeDefaultId === item.id ? 'is-default' : ''}`}
                    aria-label={activeDefaultId === item.id ? '預設圖文選單' : '非預設圖文選單'}
                  >
                    ★
                  </span>
                </td>
                <td>{getUpdatedAtText(item)}</td>
                <td className="action-cell">
                  <div className="action-group">
                    <button className="action-link" onClick={() => navigate(`/richmenu/edit/${item.id}`)}>編輯</button>
                    <button className="action-link" onClick={() => navigate(`/richmenu/edit/${item.id}?mode=copy`)}>複製</button>
                    <button className="action-link" onClick={() => openPublishDialog(item)}>發佈</button>
                    <button className="action-link action-link-danger" onClick={() => handleDelete(item)}>刪除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {publishDialogOpen && (
        <div className="modal-backdrop" onMouseDown={closePublishDialog}>
          <div className="modal-card publish-dialog-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 title={publishTarget?.name || ''}>
                發佈圖文選單（{publishTarget?.name || '-'}）
              </h3>
              <button
                type="button"
                className="publish-dialog-close"
                onClick={closePublishDialog}
                disabled={publishing}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="publish-dialog-hint">請選擇此次發佈方式：</div>
              <div className="publish-option-list">
                <label className="publish-option-item">
                  <input
                    type="radio"
                    name="publish-type"
                    checked={publishType === 'set_default'}
                    onChange={() => setPublishType('set_default')}
                  />
                  <span className="publish-option-text">
                    <span className="publish-option-title">設為預設圖文選單並發佈</span>
                    <span className="publish-option-desc">發佈到 LINE，並設為此 OA 的預設圖文選單</span>
                  </span>
                </label>
                <label className="publish-option-item">
                  <input
                    type="radio"
                    name="publish-type"
                    checked={publishType === 'simple_publish'}
                    onChange={() => setPublishType('simple_publish')}
                  />
                  <span className="publish-option-text">
                    <span className="publish-option-title">單純發佈</span>
                    <span className="publish-option-desc">發佈到 LINE，但不設為預設，供切換使用</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-success" onClick={handlePublishSubmit} disabled={publishing}>
                {publishing ? '處理中...' : '確認發佈'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
