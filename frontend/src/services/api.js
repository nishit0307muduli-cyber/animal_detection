import axios from 'axios'

// Get configured backend URL from localStorage, env, or relative path
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('railguard_api_url')
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '')
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  }
  return ''
}

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('railguard_api_url')
    } else {
      localStorage.setItem('railguard_api_url', url.trim().replace(/\/$/, ''))
    }
  }
}

// Create Axios client with 45s timeout to handle Render cold-starts gracefully
const api = axios.create({
  timeout: 45000,
})

// Dynamically attach baseURL for every request
api.interceptors.request.use((config) => {
  const base = getApiBaseUrl()
  config.baseURL = base ? `${base}/api` : '/api'
  return config
})

/** GET /api/health (with configurable timeout) */
export const getHealth = (timeout = 25000) => api.get('/health', { timeout })

/**
 * POST /api/detect/image
 * @param {File} file
 * @param {object} settings  { confidence, showLabels, showConf, dangerZone }
 */
export const detectImage = (file, settings = {}) => {
  const fd = new FormData()
  fd.append('file',        file)
  fd.append('confidence',  settings.confidence  ?? 0.40)
  fd.append('show_labels', settings.showLabels  ?? true)
  fd.append('show_conf',   settings.showConf    ?? true)
  fd.append('danger_zone', JSON.stringify(settings.dangerZone ?? []))
  return api.post('/detect/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

/**
 * POST /api/detect/video
 * @param {File} file
 * @param {object} settings
 * @param {function} onProgress  (pct: number) => void
 */
export const detectVideo = (file, settings = {}, onProgress) => {
  const fd = new FormData()
  fd.append('file',        file)
  fd.append('confidence',  settings.confidence  ?? 0.40)
  fd.append('show_labels', settings.showLabels  ?? true)
  fd.append('show_conf',   settings.showConf    ?? true)
  fd.append('sample_rate', settings.sampleRate  ?? 1)
  fd.append('danger_zone', JSON.stringify(settings.dangerZone ?? []))
  return api.post('/detect/video', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => { if (e.total) onProgress(Math.round((e.loaded / e.total) * 100)) }
      : undefined,
  })
}

/** GET /api/jobs/:jobId */
export const pollJob = (jobId) => api.get(`/jobs/${jobId}`)

/** GET /api/results/:jobId */
export const getResults = (jobId) => api.get(`/results/${jobId}`)

/** GET /api/download/:jobId — returns full download URL */
export const downloadUrl = (jobId) => {
  const base = getApiBaseUrl()
  return `${base}/api/download/${jobId}`
}
