import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

/** GET /api/health */
export const getHealth = () => api.get('/health')

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

/** GET /api/download/:jobId  — returns a URL */
export const downloadUrl = (jobId) => `/api/download/${jobId}`
