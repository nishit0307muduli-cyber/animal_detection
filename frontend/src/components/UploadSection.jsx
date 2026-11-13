import { useRef, useState } from 'react'
import { Upload, Image as ImageIcon, Film, Camera, FolderOpen, Sparkles } from 'lucide-react'
import { DEMO_SCENARIOS } from '../utils/demoScenarios'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.bmp'
const VIDEO_ACCEPT = '.mp4,.avi,.mov,.mkv'

export default function UploadSection({
  activeTab,
  onTabChange,
  onFileSelect,
  onSelectDemo,
  disabled
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const accept = activeTab === 'image' ? IMAGE_ACCEPT : VIDEO_ACCEPT

  const handleFile = (file) => {
    if (!file) return
    onFileSelect(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="glass-card p-5 space-y-5 border border-navy-700/80 shadow-2xl relative overflow-hidden">
      {/* Ambient background glow accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="section-title">
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Surveillance Input Feed</span>
        </p>

        {/* Media Type Tabs: Image, Video, Live Cam */}
        <div className="flex gap-1 bg-navy-950/80 p-1 rounded-xl border border-navy-800">
          <button
            id="tab-image"
            className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => onTabChange('image')}
            disabled={disabled}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image</span>
          </button>
          <button
            id="tab-video"
            className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => onTabChange('video')}
            disabled={disabled}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
          <button
            id="tab-live"
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => onTabChange('live')}
            disabled={disabled}
          >
            <Camera className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Live Cam</span>
          </button>
        </div>
      </div>

      {/* When in Live Cam mode, show quick live switcher info */}
      {activeTab === 'live' && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-cyan-300 flex items-center gap-1.5 font-mono">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPTICAL DETECTING CAMERA ACTIVE</span>
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Real-time optical detection is active on the right panel.
            You can connect your USB track surveillance camera, laptop webcam, or simulated CCTV stream.
          </p>
        </div>
      )}

      {/* Interactive Quick-Test Demo Scenarios (Image mode) */}
      {activeTab === 'image' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TEST BENCHMARK SCENARIOS</span>
            </span>
            <span className="text-[11px] text-slate-500">1-Click Live Test</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_SCENARIOS.map((demo) => {
              const isDanger = demo.riskLevel === 'danger'
              const isWarning = demo.riskLevel === 'warning'
              const badgeCls = isDanger
                ? 'bg-alert-500/15 text-alert-400 border-alert-500/30'
                : isWarning
                ? 'bg-warn-500/15 text-warn-400 border-warn-500/30'
                : 'bg-safe-500/15 text-safe-400 border-safe-500/30'

              return (
                <button
                  key={demo.id}
                  onClick={() => onSelectDemo(demo)}
                  disabled={disabled}
                  className="flex flex-col text-left p-2.5 rounded-xl bg-navy-800/60 hover:bg-navy-750/90 border border-navy-700/60 hover:border-cyan-500/50 transition-all duration-200 group active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                      {demo.icon}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${badgeCls}`}>
                      {demo.riskLevel}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                    {demo.title}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate mt-0.5">
                    {demo.subtitle}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Drag & Drop File Zone (Image & Video modes) */}
      {activeTab !== 'live' && (
        <div className="space-y-2">
          <div
            id="drop-zone"
            className={`drop-zone relative h-44 group ${dragging ? 'active' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            {/* Cyberpunk corner brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-slate-600 group-hover:border-cyan-400 transition-colors" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-slate-600 group-hover:border-cyan-400 transition-colors" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-slate-600 group-hover:border-cyan-400 transition-colors" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-slate-600 group-hover:border-cyan-400 transition-colors" />

            {/* Icon with glowing pulse */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
              ${dragging ? 'bg-cyan-500/25 text-cyan-300 scale-110' : 'bg-navy-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-navy-750'}`}>
              <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
            </div>

            <div className="text-center px-4">
              <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                {dragging ? 'Release to upload immediately' : 'Drop track camera feed here'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {activeTab === 'image'
                  ? 'JPG • PNG • WEBP • BMP (Up to 20MB)'
                  : 'MP4 • AVI • MOV • MKV (Up to 100MB)'}
              </p>
            </div>

            <button
              id="browse-btn"
              type="button"
              className="btn-secondary text-xs py-1.5 px-3.5 bg-navy-800/90 hover:bg-navy-700"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              disabled={disabled}
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Local File</span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}
