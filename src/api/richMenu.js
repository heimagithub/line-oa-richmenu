const STORAGE_KEY = 'line-richmenu-items-v1'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function toTimestampString(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${hh}:${mm}`
}

function normalizeRichMenuRecord(record) {
  const imageUrl = record.imageUrl || record.image_url || record.preview_url || ''
  return {
    ...record,
    imageUrl,
    image_url: imageUrl,
    preview_url: imageUrl,
    updatedAt: record.updatedAt || record.updated_at || toTimestampString(),
    updated_at: record.updated_at || record.updatedAt || toTimestampString(),
    status: record.status || 'draft',
    isDefault: Boolean(record.isDefault || record.is_default || record.default),
    is_default: Boolean(record.isDefault || record.is_default || record.default)
  }
}

function createId() {
  return `rm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const richMenuApi = {
  async getList(params = {}) {
    const { search = '', page_size: pageSize } = params
    const keyword = String(search).trim().toLowerCase()
    let list = readAll().map(normalizeRichMenuRecord)
    if (keyword) {
      list = list.filter((item) => String(item.name || '').toLowerCase().includes(keyword))
    }
    list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    if (Number.isFinite(Number(pageSize)) && Number(pageSize) > 0) {
      list = list.slice(0, Number(pageSize))
    }
    return list
  },

  async getRichMenu(id) {
    const list = readAll().map(normalizeRichMenuRecord)
    const found = list.find((item) => String(item.id) === String(id))
    if (!found) throw new Error('Rich menu not found')
    return found
  },

  async createRichMenu(data) {
    const list = readAll()
    const now = toTimestampString()
    const record = normalizeRichMenuRecord({
      ...data,
      id: createId(),
      status: data?.status || 'draft',
      updatedAt: now,
      updated_at: now
    })
    list.unshift(record)
    writeAll(list)
    return record
  },

  async updateRichMenu(id, data) {
    const list = readAll()
    const idx = list.findIndex((item) => String(item.id) === String(id))
    if (idx < 0) throw new Error('Rich menu not found')
    const now = toTimestampString()
    const next = normalizeRichMenuRecord({
      ...list[idx],
      ...data,
      id: list[idx].id,
      updatedAt: now,
      updated_at: now
    })
    list[idx] = next
    writeAll(list)
    return next
  },

  async deleteRichMenu(id) {
    const list = readAll()
    const nextList = list.filter((item) => String(item.id) !== String(id))
    writeAll(nextList)
    return { success: true }
  },

  async getRichMenuStatus(id) {
    const item = await this.getRichMenu(id)
    return { id: item.id, status: item.status || 'draft' }
  },

  async setRichMenuToLine(data) {
    return { success: true, data }
  },

  async publishRichMenu(id, data = {}) {
    const list = readAll()
    const idx = list.findIndex((item) => String(item.id) === String(id))
    if (idx < 0) throw new Error('Rich menu not found')

    const mode = data?.mode === 'scheduled' ? 'scheduled' : 'instant'
    const now = toTimestampString()
    const next = normalizeRichMenuRecord({
      ...list[idx],
      status: mode === 'scheduled' ? 'scheduled' : 'published',
      scheduledAt: mode === 'scheduled' ? data?.scheduledAt || '' : '',
      scheduled_at: mode === 'scheduled' ? data?.scheduledAt || '' : '',
      updatedAt: now,
      updated_at: now
    })

    list[idx] = next
    writeAll(list)
    return next
  },

  async unlinkRichMenu(data) {
    return { success: true, data }
  },

  async closeAllRichMenu(data) {
    return { success: true, data }
  },

  async removeAllRichMenu() {
    writeAll([])
    return { success: true }
  },

  async uploadImage(file) {
    return file
  }
}
