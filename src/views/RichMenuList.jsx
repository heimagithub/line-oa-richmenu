import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { richMenuApi } from '../api/richMenu'

export default function RichMenuList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState(null)
  const [publishType, setPublishType] = useState('instant')
  const [publishDate, setPublishDate] = useState('')
  const [publishTime, setPublishTime] = useState('')
  const [publishing, setPublishing] = useState(false)

  const fetchList = async () => {
    setLoading(true)
    try {
      const data = await richMenuApi.getList({ search: searchKeyword, page_size: pageSize })
      setList(Array.isArray(data) ? data : data?.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [pageSize])

  const handleDelete = async (item) => {
    if (!window.confirm(`確定刪除「${item.name}」？`)) return
    try {
      await richMenuApi.deleteRichMenu(item.id)
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

  const setDefaultMark = (item, isDefault) => ({
    ...item,
    is_default: isDefault,
    isDefault: isDefault,
    default: isDefault
  })

  const handleToggleDefault = (targetId) => {
    setList((prev) => {
      const target = prev.find((item) => item.id === targetId)
      if (!target) return prev
      const willSetAsDefault = !getDefaultMark(target)
      return prev.map((item) => setDefaultMark(item, willSetAsDefault && item.id === targetId))
    })
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
    setPublishType('instant')
    setPublishDate('')
    setPublishTime('')
  }

  const openPublishDialog = (item) => {
    const now = new Date()
    const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const timeText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setPublishTarget(item)
    setPublishType('instant')
    setPublishDate(dateText)
    setPublishTime(timeText)
    setPublishDialogOpen(true)
  }

  const handlePublishSubmit = async () => {
    if (!publishTarget) return
    if (publishType === 'scheduled' && (!publishDate || !publishTime)) {
      alert('請設定排程日期與時間')
      return
    }

    let scheduledAt = null
    if (publishType === 'scheduled') {
      scheduledAt = `${publishDate} ${publishTime}`
      const dt = new Date(`${publishDate}T${publishTime}:00`)
      if (Number.isNaN(dt.getTime())) {
        alert('排程日期或時間格式不正確')
        return
      }
      if (dt.getTime() <= Date.now()) {
        alert('排程時間需晚於目前時間')
        return
      }
    }

    setPublishing(true)
    try {
      await richMenuApi.publishRichMenu(publishTarget.id, {
        mode: publishType,
        scheduledAt
      })
      await fetchList()
      closePublishDialog()
    } catch (error) {
      alert('發佈失敗')
    } finally {
      setPublishing(false)
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
          />
          <button className="btn btn-light toolbar-search-btn" onClick={fetchList}>搜尋</button>
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
              <tr><td colSpan={6}>載入中...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6}>目前沒有圖文選單</td></tr>
            )}
            {!loading && list.map((item) => (
              <tr key={item.id}>
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
                  <button
                    type="button"
                    className={`default-star ${getDefaultMark(item) ? 'is-default' : ''}`}
                    aria-label={getDefaultMark(item) ? '預設圖文選單' : '非預設圖文選單'}
                    onClick={() => handleToggleDefault(item.id)}
                  >
                    ★
                  </button>
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
              <h3>發佈圖文選單</h3>
              <button type="button" className="btn btn-light" onClick={closePublishDialog} disabled={publishing}>關閉</button>
            </div>
            <div className="modal-content">
              <div className="publish-target-name">{publishTarget?.name || '-'}</div>
              <div className="publish-option-list">
                <label className="publish-option-item">
                  <input
                    type="radio"
                    name="publish-type"
                    checked={publishType === 'instant'}
                    onChange={() => setPublishType('instant')}
                  />
                  <span className="publish-option-text">
                    <span className="publish-option-title">即時發佈</span>
                    <span className="publish-option-desc">儲存後立即套用到目前圖文選單</span>
                  </span>
                </label>
                <label className="publish-option-item">
                  <input
                    type="radio"
                    name="publish-type"
                    checked={publishType === 'scheduled'}
                    onChange={() => setPublishType('scheduled')}
                  />
                  <span className="publish-option-text">
                    <span className="publish-option-title">排程發佈</span>
                    <span className="publish-option-desc">設定日期與時間後自動發佈</span>
                  </span>
                </label>
              </div>

              {publishType === 'scheduled' && (
                <div className="publish-schedule-grid">
                  <div className="publish-field">
                    <label className="publish-field-label">日期</label>
                    <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
                  </div>
                  <div className="publish-field">
                    <label className="publish-field-label">時間</label>
                    <input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={closePublishDialog} disabled={publishing}>
                取消
              </button>
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
