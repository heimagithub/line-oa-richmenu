import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { richMenuApi } from '../api/richMenu'
import { paymentApi } from '../api/payment'

export default function RichMenuList({ selectedOaId }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState(null)
  const [publishType, setPublishType] = useState('set_default')
  const [publishing, setPublishing] = useState(false)
  const [unpaidPublishDialogOpen, setUnpaidPublishDialogOpen] = useState(false)
  const [unlinkingDefault, setUnlinkingDefault] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [removingRichMenus, setRemovingRichMenus] = useState(false)
  const [removingAllRichMenus, setRemovingAllRichMenus] = useState(false)
  const [bindOaDialogOpen, setBindOaDialogOpen] = useState(false)

  const fetchList = async (resetPage = false) => {
    if (!selectedOaId) {
      setList([])
      return
    }
    if (resetPage) setPage(1)
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
    fetchList(true)
  }, [pageSize, selectedOaId])

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [list, page, pageSize])

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
    setUnpaidPublishDialogOpen(false)
  }

  const openPublishDialog = (item) => {
    setPublishTarget(item)
    setPublishType('set_default')
    setPublishDialogOpen(true)
    setUnpaidPublishDialogOpen(false)
  }

  const handlePublishSubmit = async () => {
    if (!publishTarget) return

    setPublishing(true)
    try {
      const checkRes = await paymentApi.check()
      const isPaid = Boolean(checkRes?.data?.isPaid)
      if (!isPaid) {
        setUnpaidPublishDialogOpen(true)
        return
      }
      await richMenuApi.publishRichMenu(publishTarget.id, {
        mode: 'publish',
        setAsDefault: publishType === 'set_default',
        oaId: selectedOaId
      })
      setSelectedIds([])
      await fetchList()
      closePublishDialog()
    } catch (error) {
      alert('發佈失敗')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpaidPublishTest = async () => {
    if (!publishTarget) return

    setPublishing(true)
    try {
      await richMenuApi.publishRichMenu(publishTarget.id, {
        mode: 'publish',
        setAsDefault: publishType === 'set_default',
        oaId: selectedOaId,
        testPublishWithoutPayment: true
      })
      setUnpaidPublishDialogOpen(false)
      setSelectedIds([])
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

  const visibleIds = paginatedList.map((item) => item.id)
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

  const handleCreateRichMenu = () => {
    if (!selectedOaId) {
      setBindOaDialogOpen(true)
      return
    }
    navigate('/richmenu/create')
  }

  const closeBindOaDialog = () => {
    setBindOaDialogOpen(false)
  }

  const handleGoToOaManagement = () => {
    setBindOaDialogOpen(false)
    navigate('/oa-management')
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
          <button className="btn btn-success" onClick={handleCreateRichMenu}>新增圖文選單</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="toolbar-search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="請輸入圖文選單名稱關鍵字"
            disabled={!selectedOaId}
          />
          <button
            type="button"
            className="btn btn-light toolbar-search-btn"
            onClick={() => fetchList(true)}
            disabled={!selectedOaId}
          >
            搜尋
          </button>
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
            {!loading && paginatedList.map((item) => (
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

      {!loading && selectedOaId && list.length > 0 && (
        <div className="list-pagination" role="navigation" aria-label="圖文選單列表分頁">
          <span className="list-pagination-info">
            顯示第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, list.length)} 筆，共 {list.length} 筆
          </span>
          <div className="list-pagination-controls">
            <button
              type="button"
              className="btn btn-light list-pagination-btn"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              第一頁
            </button>
            <button
              type="button"
              className="btn btn-light list-pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              上一頁
            </button>
            <span className="list-pagination-page">
              第 {page} / {totalPages} 頁
            </span>
            <button
              type="button"
              className="btn btn-light list-pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              下一頁
            </button>
            <button
              type="button"
              className="btn btn-light list-pagination-btn"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              最末頁
            </button>
          </div>
        </div>
      )}

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

      {unpaidPublishDialogOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => {
            if (publishing) return
            setUnpaidPublishDialogOpen(false)
          }}
        >
          <div className="modal-card publish-dialog-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>尚未完成付費</h3>
              <button
                type="button"
                className="publish-dialog-close"
                onClick={() => {
                  if (publishing) return
                  setUnpaidPublishDialogOpen(false)
                }}
                disabled={publishing}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="publish-dialog-hint">請付費完即可發佈圖文選單。</div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  if (publishing) return
                  setUnpaidPublishDialogOpen(false)
                  navigate('/pricing')
                }}
                disabled={publishing}
              >
                前往方案付費
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleUnpaidPublishTest}
                disabled={publishing}
              >
                沒付費發佈（測試階段）
              </button>
            </div>
          </div>
        </div>
      )}

      {bindOaDialogOpen && (
        <div className="modal-backdrop" onMouseDown={closeBindOaDialog}>
          <div className="modal-card publish-dialog-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>尚未綁定 LINE OA</h3>
              <button
                type="button"
                className="publish-dialog-close"
                onClick={closeBindOaDialog}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="publish-dialog-hint">
                目前尚未綁定 LINE OA，請先至 OA 管理完成綁定後，再新增圖文選單。
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={closeBindOaDialog}>
                取消
              </button>
              <button type="button" className="btn btn-success" onClick={handleGoToOaManagement}>
                前往 OA 管理
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
