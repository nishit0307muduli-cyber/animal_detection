import { useState, useEffect, useCallback, useRef } from 'react'
import { getHealth } from './services/api'
import { useDetection } from './hooks/useDetection'
import Header          from './components/Header'
import UploadSection   from './components/UploadSection'
import DetectionSettings from './components/DetectionSettings'
import DangerZoneConfig  from './components/DangerZoneConfig'
import ResultsSection    from './components/ResultsSection'
import AlertSection      from './components/AlertSection'
import HistorySection    from './components/HistorySection'

// Default danger zone — horizontal strip 35–65% of image height
const DEFAULT_ZONE = [
  { x: 0,   y: 35 }, { x: 100, y: 35 },
  { x: 100, y: 65 }, { x: 0,   y: 65 },
]

export default function App() {
  // ── Backend health ─────────────────────────────────────────
  const [backendOnline, setBackendOnline] = useState(false)
  useEffect(() => {
    const check = async () => {
      try { await getHealth(); setBackendOnline(true) }
      catch { setBackendOnline(false) }
    }
    check()
    const id = setInterval(check, 15_000)
    return () => clearInterval(id)
  }, [])

  // ── Detection state ────────────────────────────────────────
  const {
    status, error, uploadPct,
    imageResult, videoJob, videoResult,
    runImageDetection, runVideoDetection, reset,
  } = useDetection()

  // ── UI state ───────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState('image')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl,  setPreviewUrl]  = useState(null)
  const [settings,    setSettings]    = useState({
    confidence:  0.40,
    showLabels:  true,
    showConf:    true,
    sampleRate:  1,
    dangerZone:  DEFAULT_ZONE,
  })
  const [history, setHistory] = useState([])
  const runRef = useRef(false)

  // ── When a file is selected → preview + auto-run ───────────
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return
    reset()
    setUploadedFile(file)

    // Build preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Auto-run detection
    runRef.current = true
    if (activeTab === 'image') {
      await runImageDetection(file, settings)
    } else {
      await runVideoDetection(file, settings)
    }
  }, [activeTab, settings, reset, runImageDetection, runVideoDetection])

  // ── Add completed result to history ───────────────────────
  useEffect(() => {
    if (status !== 'completed' || !uploadedFile) return

    const alertLevel =
      (activeTab === 'image'  ? imageResult?.alert_level  : videoResult?.alert_level) ?? 'none'
    const count =
      (activeTab === 'image'  ? imageResult?.count         : videoResult?.alert_frames) ?? 0

    setHistory((prev) => [
      {
        id:         Date.now(),
        filename:   uploadedFile.name,
        type:       activeTab,
        timestamp:  new Date().toISOString(),
        alertLevel,
        count,
      },
      ...prev.slice(0, 49),          // keep last 50
    ])
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Settings update ────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  // ── Tab change ─────────────────────────────────────────────
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    reset()
    setUploadedFile(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
  }, [reset, previewUrl])

  // ── Reset / Upload another ─────────────────────────────────
  const handleReset = useCallback(() => {
    reset()
    setUploadedFile(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
  }, [reset, previewUrl])

  // ── Determine alert level ──────────────────────────────────
  const alertLevel = status === 'completed'
    ? (activeTab === 'image' ? imageResult?.alert_level : videoResult?.alert_level) ?? 'none'
    : null
  const alertMessage = status === 'completed'
    ? (activeTab === 'image' ? imageResult?.alert_message : videoResult?.alert_message) ?? ''
    : null

  const isProcessing = status === 'uploading' || status === 'processing'

  return (
    <div className="min-h-screen">
      <Header status={status} backendOnline={backendOnline} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column: controls ─────────────────────── */}
          <div className="space-y-5">
            <UploadSection
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
            />

            <DetectionSettings
              settings={settings}
              onChange={updateSettings}
              disabled={isProcessing}
            />

            {activeTab === 'image' && (
              <DangerZoneConfig
                imagePreviewUrl={previewUrl}
                dangerZone={settings.dangerZone}
                onZoneChange={(zone) => updateSettings({ dangerZone: zone })}
                disabled={isProcessing}
              />
            )}
          </div>

          {/* ── Center Column: results + alert ────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Alert card — always visible once completed */}
            {(status === 'completed' || status === 'error') && (
              <AlertSection
                alertLevel={alertLevel}
                alertMessage={alertMessage}
                error={error}
              />
            )}

            {/* Results */}
            <ResultsSection
              activeTab={activeTab}
              status={status}
              imageResult={imageResult}
              videoResult={videoResult}
              videoJob={videoJob}
              uploadPct={uploadPct}
              previewUrl={previewUrl}
              onReset={handleReset}
            />

            {/* Placeholder when idle */}
            {status === 'idle' && (
              <div className="card p-10 flex flex-col items-center justify-center gap-4 text-center min-h-64">
                <div className="w-16 h-16 rounded-2xl bg-navy-700 flex items-center justify-center">
                  <span className="text-3xl">🚂</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-300">
                    Railway Animal Detection
                  </p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Upload an image or video of a railway track.
                    The AI model will detect animals and alert you
                    if any are found in the configured danger zone.
                  </p>
                </div>
                {!backendOnline && (
                  <div className="text-xs text-alert-400 bg-alert-500/10 border border-alert-500/30 px-4 py-2 rounded-lg">
                    ⚠️ Backend server not reachable — start the FastAPI server first.
                  </div>
                )}
              </div>
            )}

            {/* History */}
            <HistorySection
              history={history}
              onClear={() => setHistory([])}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
