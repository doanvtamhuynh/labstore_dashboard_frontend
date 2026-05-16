export const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')

export function pickRows(payload) {
  const data = payload?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

export function format(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}
