import { useState, useEffect, useCallback } from 'react'
import { getHealth } from './services/api'
import { useDetection } from './hooks/useDetection'
import { playSound } from './utils/audioAlert'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import DetectionSettings from './components/DetectionSettings'
import DangerZoneConfig from './components/DangerZoneConfig'
import ResultsSection from './components/ResultsSection'
import AlertSection from './components/AlertSection'
import HistorySection from './components/HistorySection'
import LiveCameraSection from './components/LiveCameraSection'
import { ShieldAlert, Zap, Radio, Train, Camera } from 'lucide-react'

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
      try {
        await getHealth()
        setBackendOnline(true)
      } catch {
        setBackendOnline(false)
      }
    }
    check()
    const id = setInterval(check, 15_000)
    return () => clearInterval(id)
  }, [])

  // ── Sound alert setting ───────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('railguard_sound')
    return saved !== null ? saved === 'true' : true
  })

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem('railguard_sound', String(next))
      if (next) playSound('ping', true)
      return next
    })
  }, [])

  // ── Detection state ────────────────────────────────────────
  const {
    status: hookStatus, error: hookError, uploadPct,
    imageResult: hookImageResult, videoJob, videoResult,
    runImageDetection, runVideoDetection, reset: hookReset,
  } = useDetection()

  // Custom demo override state (for instantaneous testing)
  const [demoState, setDemoState] = useState(null)

  // Combined status & result
  const status = demoState ? demoState.status : hookStatus
  const error = demoState ? null : hookError
  const imageResult = demoState ? demoState.result : hookImageResult

  // ── UI state ───────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('image') // 'image' | 'video' | 'live'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [settings,     setSettings]     = useState({
    confidence:  0.40,
    showLabels:  true,
    showConf:    true,
    sampleRate:  1,
    dangerZone:  DEFAULT_ZONE,
  })
  const [history, setHistory] = useState([])
  const [dismissAlert, setDismissAlert] = useState(false)

  // ── Handle Demo Scenario Selection ────────────────────────
  const handleSelectDemo = useCallback((demo) => {
    hookReset()
    setDismissAlert(false)
    setUploadedFile({ name: demo.result.filename })
    setPreviewUrl(demo.imageUrl)
    setDemoState({
      status: 'completed',
      result: {
        ...demo.result,
        confidence_threshold: settings.confidence,
      }
    })

    // Play tactile sound
    if (demo.riskLevel === 'danger') {
      playSound('danger', soundEnabled)
    } else if (demo.riskLevel === 'warning') {
      playSound('warning', soundEnabled)
    } else {
      playSound('clear', soundEnabled)
    }

    // Add to history
    setHistory((prev) => [
      {
        id: Date.now(),
        filename: demo.result.filename,
        type: 'image',
        timestamp: new Date().toISOString(),
        alertLevel: demo.result.alert_level,
        count: demo.result.count,
      },
      ...prev.slice(0, 49),
    ])
  }, [hookReset, settings.confidence, soundEnabled])

  // ── When a real file is selected → preview + run ───────────
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return
    hookReset()
    setDemoState(null)
    setDismissAlert(false)
    setUploadedFile(file)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    if (activeTab === 'image') {
      await runImageDetection(file, settings)
    } else {
      await runVideoDetection(file, settings)
    }
  }, [activeTab, settings, hookReset, runImageDetection, runVideoDetection])

  // ── Add completed real result to history & trigger sound ────
  useEffect(() => {
    if (demoState) return
    if (hookStatus !== 'completed' || !uploadedFile) return

    const alertLevel =
      (activeTab === 'image' ? hookImageResult?.alert_level : videoResult?.alert_level) ?? 'none'
    const count =
      (activeTab === 'image' ? hookImageResult?.count : videoResult?.alert_frames) ?? 0

    // Play sound notification
    if (alertLevel === 'danger') {
      playSound('danger', soundEnabled)
    } else if (alertLevel === 'warning') {
      playSound('warning', soundEnabled)
    } else {
      playSound('clear', soundEnabled)
    }

    setHistory((prev) => [
      {
        id:         Date.now(),
        filename:   uploadedFile.name,
        type:       activeTab,
        timestamp:  new Date().toISOString(),
        alertLevel,
        count,
      },
      ...prev.slice(0, 49),
    ])
  }, [hookStatus, hookImageResult, videoResult, uploadedFile, activeTab, demoState, soundEnabled])

  // ── Settings update ────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  // ── Tab change ─────────────────────────────────────────────
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    hookReset()
    setDemoState(null)
    setUploadedFile(null)
    if (previewUrl && !previewUrl.startsWith('data:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setDismissAlert(false)
  }, [hookReset, previewUrl])

  // ── Reset / Upload another ─────────────────────────────────
  const handleReset = useCallback(() => {
    hookReset()
    setDemoState(null)
    setUploadedFile(null)
    if (previewUrl && !previewUrl.startsWith('data:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setDismissAlert(false)
  }, [hookReset, previewUrl])

  // ── Determine alert level ──────────────────────────────────
  const alertLevel = status === 'completed'
    ? (activeTab === 'image' ? imageResult?.alert_level : videoResult?.alert_level) ?? 'none'
    : null
  const alertMessage = status === 'completed'
    ? (activeTab === 'image' ? imageResult?.alert_message : videoResult?.alert_message) ?? ''
    : null

  const isProcessing = status === 'uploading' || status === 'processing'

  return (
    <div className="min-h-screen rail-grid-bg pb-16 selection:bg-cyan-500 selection:text-navy-950">
      <Header
        status={activeTab === 'live' ? 'processing' : status}
        backendOnline={backendOnline}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Operational Quick Telemetry Strip ──────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-3 sm:p-4 flex items-center justify-between border-navy-700/60">
            <div>
              <p className="text-[11px] font-mono text-slate-400">SURVEILLANCE MODE</p>
              <p className="text-sm sm:text-base font-bold text-slate-200 mt-0.5">
                {activeTab === 'image' ? 'Static Frame Sensor' : activeTab === 'video' ? 'Recorded Stream' : 'Live Optical Feed'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
              {activeTab === 'live' ? <Camera className="w-4 h-4 text-red-400 animate-pulse" /> : <Radio className="w-4 h-4 animate-pulse" />}
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 flex items-center justify-between border-navy-700/60">
            <div>
              <p className="text-[11px] font-mono text-slate-400">NEURAL ENGINE</p>
              <p className="text-sm sm:text-base font-bold text-cyan-400 mt-0.5">
                YOLOv8 Nano
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 flex items-center justify-between border-navy-700/60">
            <div>
              <p className="text-[11px] font-mono text-slate-400">SESSION INSPECTIONS</p>
              <p className="text-sm sm:text-base font-bold text-slate-200 mt-0.5 font-mono">
                {history.length} Scan{history.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Train className="w-4 h-4" />
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 flex items-center justify-between border-navy-700/60">
            <div>
              <p className="text-[11px] font-mono text-slate-400">THREATS FLAGGED</p>
              <p className="text-sm sm:text-base font-bold text-red-400 mt-0.5 font-mono">
                {history.filter((h) => h.alertLevel === 'danger').length} Critical
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ── Main Workspace Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left Column: Controls & Configuration (5 cols) ── */}
          <div className="lg:col-span-5 space-y-5">
            <UploadSection
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onFileSelect={handleFileSelect}
              onSelectDemo={handleSelectDemo}
              disabled={isProcessing}
            />

            <DetectionSettings
              settings={settings}
              onChange={updateSettings}
              disabled={isProcessing}
            />

            {activeTab !== 'video' && (
              <DangerZoneConfig
                imagePreviewUrl={previewUrl}
                dangerZone={settings.dangerZone}
                onZoneChange={(zone) => updateSettings({ dangerZone: zone })}
                disabled={isProcessing}
              />
            )}
          </div>

          {/* ── Right Column: Visual Telemetry & Alerts (7 cols) ─ */}
          <div className="lg:col-span-7 space-y-5">

            {/* LIVE CAMERA MODE */}
            {activeTab === 'live' ? (
              <LiveCameraSection
                settings={settings}
                backendOnline={backendOnline}
                soundEnabled={soundEnabled}
                onAlertChange={(lvl, msg) => {
                  if (lvl === 'danger' || lvl === 'warning') {
                    setHistory((prev) => [
                      {
                        id: Date.now(),
                        filename: 'Live Camera Feed',
                        type: 'live',
                        timestamp: new Date().toISOString(),
                        alertLevel: lvl,
                        count: 1,
                      },
                      ...prev.slice(0, 49),
                    ])
                  }
                }}
              />
            ) : (
              <>
                {/* Emergency Alert Banner */}
                {!dismissAlert && (status === 'completed' || status === 'error') && (
                  <AlertSection
                    alertLevel={alertLevel}
                    alertMessage={alertMessage}
                    error={error}
                    onDismiss={() => setDismissAlert(true)}
                  />
                )}

                {/* Results Inspection View */}
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

                {/* Standby / Idle Welcome Hero */}
                {status === 'idle' && (
                  <div className="glass-card p-8 sm:p-12 flex flex-col items-center justify-center gap-5 text-center min-h-[380px] relative overflow-hidden border border-navy-700/80">
                    {/* Decorative radar background */}
                    <div className="w-28 h-28 rounded-full border border-cyan-500/20 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border border-blue-500/10 animate-ping" />
                      <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center bg-navy-900/80 shadow-glow-cyan">
                        <Train className="w-9 h-9 text-cyan-400" />
                      </div>
                    </div>

                    <div className="space-y-2 max-w-md">
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-wide font-sans">
                        Railway Safety Surveillance Console
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                        Monitor railway tracks for fauna intrusions. Upload footage, switch to{' '}
                        <strong className="text-cyan-300 font-semibold">Live Cam</strong> to connect physical cameras, or select a
                        <strong className="text-cyan-300 font-semibold"> Quick Benchmark Scenario</strong> on the left
                        to test instant YOLOv8 animal detection, danger zone boundary checks, and collision risk alerts.
                      </p>
                    </div>

                    {/* Quick start pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                        📹 Live Camera Support (Webcam & RTSP)
                      </span>
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                        ⚡ 10 Animal Classes Supported
                      </span>
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                        🎯 Interactive Polygon Danger Zone
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* History & Audit Log */}
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
