import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { oaApi } from '../api/oa'

function textToLogo(name) {
  return (name || 'O').slice(0, 1).toUpperCase()
}

export default function OAManagement({ selectedOaId, onSelectOa, oaOptions, refreshOaList }) {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [channelSecret, setChannelSecret] = useState('')
  const [channelAccessToken, setChannelAccessToken] = useState('')

  const selectedOaName = useMemo(
    () => oaOptions.find((oa) => oa.id === selectedOaId)?.name || '尚未選擇 OA',
    [oaOptions, selectedOaId]
  )

  const closeDialog = () => {
    if (submitting) return
    setDialogOpen(false)
    setChannelSecret('')
    setChannelAccessToken('')
  }

  const handleBind = async () => {
    if (!channelSecret.trim() || !channelAccessToken.trim()) {
      alert('請輸入 Channel Secret 與 Channel Access Token')
      return
    }
    setSubmitting(true)
    try {
      const res = await oaApi.create({
        channelSecret: channelSecret.trim(),
        channelAccessToken: channelAccessToken.trim()
      })
      await refreshOaList()
      if (res?.data?.oaId) {
        onSelectOa(res.data.oaId)
      }
      closeDialog()
    } catch (error) {
      alert(error?.response?.data?.message || '新增綁定 OA 失敗')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateToken = async (item) => {
    const nextSecret = window.prompt('請輸入新的 Channel Secret（可留空）', '')
    const nextAccessToken = window.prompt('請輸入新的 Channel Access Token（可留空）', '')
    if (nextSecret === null || nextAccessToken === null) return
    try {
      await oaApi.updateToken(item.id, {
        channelSecret: nextSecret || undefined,
        channelAccessToken: nextAccessToken || undefined
      })
      await refreshOaList()
      alert('Token 更新成功')
    } catch (error) {
      alert(error?.response?.data?.message || '更新 Token 失敗')
    }
  }

  const handleRemove = async (item) => {
    if (!window.confirm(`確定移除 OA「${item.name}」？`)) return
    try {
      await oaApi.remove(item.id)
      await refreshOaList()
      alert('OA 已移除')
    } catch (error) {
      alert(error?.response?.data?.message || '移除 OA 失敗')
    }
  }

  return (
    <section className="panel oa-management-page">
      <div className="page-head">
        <h2>OA 管理</h2>
        <button type="button" className="btn btn-success" onClick={() => setDialogOpen(true)}>
          + 新增綁定 OA
        </button>
      </div>

      <div className="oa-management-list">
        {oaOptions.map((item) => (
          <article key={item.id} className="oa-card">
            <div className="oa-card-main">
              <div className="oa-logo oa-logo-green">
                {item.pictureUrl ? (
                  <img src={item.pictureUrl} alt={item.name || 'OA'} className="oa-logo-image" />
                ) : (
                  textToLogo(item.name)
                )}
              </div>
              <div className="oa-meta">
                <div className="oa-name-line">
                  <h3>{item.name}</h3>
                  {item.id === selectedOaId && <span className="oa-active-dot" title={`目前選用：${selectedOaName}`} />}
                </div>
                <div className="oa-subline">Official Account ID {item.accountId}</div>
                <div className="oa-subline">綁定時間 {item.boundAt || '-'}</div>
              </div>
            </div>
            <div className="oa-card-actions">
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  onSelectOa(item.id)
                  navigate('/richmenu/list')
                }}
              >
                進入圖文選單管理
              </button>
              <button type="button" className="btn btn-light" onClick={() => handleUpdateToken(item)}>更新 Token</button>
              <button type="button" className="btn btn-light" onClick={() => handleRemove(item)}>移除 OA</button>
            </div>
          </article>
        ))}
      </div>

      {dialogOpen && (
        <div className="modal-backdrop" onMouseDown={closeDialog}>
          <div className="modal-card oa-bind-dialog-card" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>新增綁定 OA</h3>
              <button
                type="button"
                className="publish-dialog-close"
                onClick={closeDialog}
                disabled={submitting}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <label htmlFor="channel-secret">Channel Secret</label>
              <input
                id="channel-secret"
                value={channelSecret}
                onChange={(event) => setChannelSecret(event.target.value)}
                placeholder="請輸入 Channel Secret"
              />

              <label htmlFor="channel-access-token">Channel Access Token</label>
              <textarea
                id="channel-access-token"
                rows={4}
                value={channelAccessToken}
                onChange={(event) => setChannelAccessToken(event.target.value)}
                placeholder="請輸入長效型 Channel Access Token"
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-success" onClick={handleBind} disabled={submitting}>
                {submitting ? (
                  <span className="btn-loading-wrap">
                    <span className="btn-spinner" aria-hidden="true" />
                    綁定中...
                  </span>
                ) : (
                  '確認綁定'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
