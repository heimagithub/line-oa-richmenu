import {
  ACTION_TYPE_OPTIONS,
  createActionForType,
  getActionTypeLabel,
  normalizeAction
} from '../utils/richMenuAreaActions'

function AreaActionFields({ action, onChange, switchTargetOptions = [] }) {
  const type = action?.type || 'none'

  const setType = (nextType) => {
    onChange(createActionForType(nextType))
  }

  const patch = (partial) => {
    onChange({ ...normalizeAction(action), ...partial })
  }

  return (
    <div className="area-action-form">
      <div className="action-type-row" role="group" aria-label="動作類型">
        {ACTION_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`action-type-btn ${type === opt.id ? 'is-active' : ''}`}
            onClick={() => setType(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {type === 'message' && (
        <label className="area-field-block">
          <span className="area-field-label">傳送訊息文字 (text)</span>
          <textarea
            rows={3}
            value={action.text || ''}
            onChange={(e) => patch({ type: 'message', text: e.target.value })}
            placeholder="用戶點擊後自動傳送此訊息"
          />
        </label>
      )}

      {type === 'uri' && (
        <label className="area-field-block">
          <span className="area-field-label">連結網址 (uri)</span>
          <input
            value={action.uri || ''}
            onChange={(e) => patch({ type: 'uri', uri: e.target.value })}
            placeholder="https:// 或 tel: 等"
          />
        </label>
      )}

      {type === 'postback' && (
        <>
          <label className="area-field-block">
            <span className="area-field-label">資料 (data) <span className="req">*</span></span>
            <input
              value={action.data || ''}
              onChange={(e) => patch({ type: 'postback', data: e.target.value, displayText: action.displayText })}
              placeholder="Webhook 收到的字串"
            />
          </label>
          <label className="area-field-block">
            <span className="area-field-label">顯示文字 (displayText)（選填）</span>
            <input
              value={action.displayText || ''}
              onChange={(e) => patch({ type: 'postback', data: action.data, displayText: e.target.value })}
              placeholder="點擊後在聊天室顯示的文字"
            />
          </label>
        </>
      )}

      {type === 'richmenuswitch' && (
        <>
          <label className="area-field-block">
            <span className="area-field-label">切換目標圖文選單 <span className="req">*</span></span>
            <select
              value={action.richMenuAliasId || ''}
              onChange={(e) =>
                patch({
                  type: 'richmenuswitch',
                  richMenuAliasId: e.target.value,
                  data: ''
                })
              }
            >
              <option value="">請選擇已儲存圖文選單</option>
              {switchTargetOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.id}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {type === 'none' && <p className="hint area-none-hint">此區域不會有任何動作</p>}
    </div>
  )
}

export default function AreaRegionPanel({
  areas,
  switchTargetOptions,
  expandedIndex,
  selectedIndex,
  accordionListRef,
  onToggleExpand,
  onAddRegion,
  onAreaNameChange,
  onAreaActionChange,
  onDeleteArea
}) {
  return (
    <div className="area-region-panel">
      <div className="area-accordion-list" ref={accordionListRef}>
        {areas.map((area, idx) => {
          const isOpen = expandedIndex === idx
          const isSelected = selectedIndex === idx
          const displayName = (area.areaName || '').trim() || `區域 ${idx + 1}`
          const actionLabel = getActionTypeLabel(area.action?.type)

          return (
            <div
              key={`area-acc-${idx}`}
              className={`area-accordion-item ${isOpen ? 'is-open' : ''}`}
            >
              <button
                type="button"
                className={`area-accordion-header ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onToggleExpand(idx)}
                aria-expanded={isOpen}
                data-area-index={idx}
              >
                <span className="area-accordion-title">
                  {displayName} — {actionLabel}
                </span>
                <span className={`area-accordion-chevron ${isOpen ? 'is-open' : ''}`} aria-hidden>
                  ▼
                </span>
              </button>

              <div className="area-accordion-body" hidden={!isOpen}>
                <div className="area-accordion-inner">
                  <label className="area-field-block area-name-row">
                    <span className="area-field-label">區域名稱</span>
                    <input
                      value={area.areaName ?? ''}
                      onChange={(e) => onAreaNameChange(idx, e.target.value)}
                      placeholder={`區域 ${idx + 1}`}
                    />
                  </label>

                  <AreaActionFields
                    action={normalizeAction(area.action)}
                    switchTargetOptions={switchTargetOptions}
                    onChange={(next) => onAreaActionChange(idx, next)}
                  />

                  <div className="area-accordion-footer">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => onDeleteArea(idx)}
                    >
                      移除此區域
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button type="button" className="btn btn-add-region" onClick={onAddRegion}>
        + 新增區域
      </button>

      {areas.length === 0 && (
        <p className="hint area-empty-hint">請先選擇右側版型建立區域，或點「新增區域」手動加入。</p>
      )}
    </div>
  )
}
