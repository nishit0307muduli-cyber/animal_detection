import { useState, useEffect } from 'react'
import {
  Train, Activity, AlertTriangle, CheckCircle2, Loader2, Wifi, WifiOff,
  Volume2, VolumeX, Shield, Info, Server, Settings, ExternalLink, RefreshCw
} from 'lucide-react'
import { getApiBaseUrl, setApiBaseUrl } from '../services/api'

const STATUS_CONFIG = {
  idle:       { label: 'System Ready',    color: 'text-safe-400',  bg: 'bg-safe-500/10',  border: 'border-safe-500/30',  dot: 'bg-safe-400',  Icon: CheckCircle2 },
  uploading:  { label: 'Uploading Feed',  color: 'text-cyan-400',  bg: 'bg-cyan-500/10',  border: 'border-cyan-500/30',  dot: 'bg-cyan-400',  Icon: Loader2, spin: true },
  processing: { label: 'Inference Active',color: 'text-warn-400',  bg: 'bg-warn-500/10',  border: 'border-warn-500/30',  dot: 'bg-warn-400',  Icon: Activity, pulse: true },
  completed:  { label: 'Analysis Complete',color: 'text-safe-400', bg: 'bg-safe-500/10',  border: 'border-safe-500/30',  dot: 'bg-safe-400',  Icon: CheckCircle2 },
  error:      { label: 'System Alert',    color: 'text-alert-400', bg: 'bg-alert-500/10', border: 'border-alert-500/30', dot: 'bg-alert-400', Icon: AlertTriangle },
}

export default function Header({
  status,
  backendStatus = 'online', // 'online' | 'waking_up' | 'offline'
  onRefreshBackend,
  soundEnabled,
  onToggleSound,
  activeTab,
  onTabChange
}) {
  const [time, setTime] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const [showServerModal, setShowServerModal] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState('')
  const [isPinging, setIsPinging] = useState(false)

  useEffect(() => {
    setServerUrlInput(getApiBaseUrl())
  }, [showServerModal])

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const handleSaveServerUrl = async (e) => {
    e.preventDefault()
    setApiBaseUrl(serverUrlInput)
    setIsPinging(true)
    if (onRefreshBackend) {
      await onRefreshBackend(true)
    }
    setIsPinging(false)
    setShowServerModal(false)
  }

  const handlePingServer = async () => {
    setIsPinging(true)
    if (onRefreshBackend) {
      await onRefreshBackend(true)
    }
    setIsPinging(false)
  }

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle
  const { label, color, bg, border, dot, Icon, spin, pulse } = cfg

  return (
    <header className="sticky top-0 z-50 bg-navy-950/85 backdrop-blur-xl border-b border-navy-800/80 px-4 sm:px-8 py-3.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">

        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                  <Train className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                  RAIL<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">GUARD</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-blue-500/10 text-cyan-400 border border-blue-500/25 ml-1">
                    AI v2.0
                  </span>
                </h1>
              </div>
              <p className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <span>Railway Track Safety & Intrusion Monitoring</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline text-cyan-400/80 font-semibold">YOLOv8 Real-Time</span>
              </p>
            </div>
          </div>

          {/* Quick tab switcher on mobile header */}
          <div className="flex items-center gap-1 md:hidden">
            {onTabChange && (
              <button
                onClick={() => onTabChange(activeTab === 'history' ? 'image' : 'history')}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-navy-700 bg-navy-900 text-cyan-300"
              >
                {activeTab === 'history' ? '← Monitor' : '📜 History'}
              </button>
            )}
          </div>
        </div>

        {/* Telemetry, Controls & Operational Status */}
        <div className="flex items-center flex-wrap justify-end gap-2.5 sm:gap-4 w-full md:w-auto">
          {/* Operations Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900/90 border border-navy-700/60 text-xs font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-500">TRACK TIME:</span>
            <span className="text-cyan-300 font-semibold">{time || '00:00:00'}</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Audio Alerts: Enabled (Click to mute)' : 'Audio Alerts: Muted (Click to enable)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              soundEnabled
                ? 'bg-blue-500/10 text-cyan-400 border-blue-500/30 hover:bg-blue-500/20 shadow-sm shadow-blue-500/10'
                : 'bg-navy-900 text-slate-500 border-navy-700 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-mono text-[11px]">AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">MUTED</span>
              </>
            )}
          </button>

          {/* Interactive Backend Connectivity Status Pill */}
          <button
            onClick={() => setShowServerModal(true)}
            title="Click to configure cloud backend server or check connection"
            className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${
              backendStatus === 'online'
                ? 'bg-safe-500/10 text-safe-300 border-safe-500/30 hover:bg-safe-500/20'
                : backendStatus === 'waking_up'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                : 'bg-alert-500/15 text-alert-400 border-alert-500/30 hover:bg-alert-500/25'
            }`}
          >
            {backendStatus === 'online' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-safe-400" />
                <span className="hidden sm:inline">BACKEND ONLINE</span>
                <span className="sm:hidden">ONLINE</span>
              </>
            ) : backendStatus === 'waking_up' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="hidden sm:inline">WAKING UP SERVER...</span>
                <span className="sm:hidden">WAKING...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-alert-400" />
                <span className="hidden sm:inline">OFFLINE (DEMO ACTIVE)</span>
                <span className="sm:hidden">OFFLINE</span>
              </>
            )}
            <Settings className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Current Processing Status Pill */}
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border ${bg} ${border} ${color}`}>
            <span className={`w-2 h-2 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} />
            <Icon className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
            <span className="font-mono tracking-wider">{label.toUpperCase()}</span>
          </div>

          {/* Research Prototype Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-slate-200 border border-navy-700/60 transition"
            title="System Research Information"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cloud Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border border-navy-700 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Server className="w-4 h-4" />
                <span>Backend Cloud Server Setup</span>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                  backendStatus === 'online'
                    ? 'bg-safe-500/15 text-safe-300 border-safe-500/30'
                    : backendStatus === 'waking_up'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-alert-500/15 text-alert-400 border-alert-500/30'
                }`}>
                  {backendStatus === 'online' ? '🟢 ONLINE & CONNECTED' : backendStatus === 'waking_up' ? '⏳ WAKING UP (~30s)' : '⚠️ OFFLINE'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 text-[11px] text-slate-300 leading-relaxed">
                <p className="font-semibold text-cyan-400 mb-1">Why does it show "OFFLINE (DEMO ACTIVE)"?</p>
                <p>
                  Render's free tier spins down after 15 min of inactivity. When you visit, Render takes ~30–45s to wake up the YOLO model.
                  If you deployed frontend on Vercel, paste your live Render backend URL below so Vercel can reach your backend.
                </p>
              </div>

              <form onSubmit={handleSaveServerUrl} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Backend API URL (Render or Localhost):
                </label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="https://railguard.onrender.com or http://localhost:8000"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                />

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isPinging}
                    className="btn-primary text-xs py-2 px-4 flex-1"
                  >
                    {isPinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save & Connect</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePingServer}
                    disabled={isPinging}
                    className="btn-secondary text-xs py-2 px-3"
                    title="Wake up server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>Ping</span>
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-navy-800/80 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => { setServerUrlInput(''); setApiBaseUrl(''); onRefreshBackend?.(true) }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ↺ Reset to Same-Origin (/api)
                </button>
                <button
                  type="button"
                  onClick={() => { setServerUrlInput('http://localhost:8000'); setApiBaseUrl('http://localhost:8000'); onRefreshBackend?.(true) }}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Localhost:8000
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Safety Disclaimer Card */}
      {showInfo && (
        <div className="max-w-7xl mx-auto mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5 animate-slide-up">
          <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Safety & Research Prototype Disclaimer</p>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              This application is an AI research evaluation prototype powered by YOLOv8 vision models.
              It is designed for exploratory demonstration and academic benchmarking of railway track perimeter safety.
              It is <strong>not</strong> certified by railway safety standards (e.g. SIL-4) for autonomous train braking or critical operations.
            </p>
          </div>
          <button onClick={() => setShowInfo(false)} className="text-amber-400 hover:text-amber-200 text-xs px-2 py-0.5">
            ✕
          </button>
        </div>
      )}
    </header>
  )
}
