import { useState, useId } from 'react'
import {
  Download, Image as ImageIcon, Film, Clock, Cpu, Target,
  ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Crosshair,
  BarChart2, FileJson, Sparkles, Layers, Sliders, ExternalLink
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, AreaChart, Area
} from 'recharts'

const ANIMAL_EMOJIS = {
  bird: '🦅', cat: '🐈', dog: '🐕', horse: '🐴', sheep: '🐑',
  cow: '🐄', elephant: '🐘', bear: '🐻', zebra: '🦓', giraffe: '🦒',
}

/* ── Individual Stat Box ─────────────────────────────────────── */
function StatBox({ icon, label, value, sub, color = 'text-cyan-400', glow = '' }) {
  return (
    <div className={`bg-navy-950/60 rounded-xl p-3 sm:p-4 flex flex-col justify-between border border-navy-700/70 shadow-sm relative overflow-hidden group ${glow}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono text-slate-400">{label}</span>
        {icon && <div className="p-1 rounded-lg bg-navy-800/80">{icon}</div>}
      </div>
      <div>
        <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${color}`}>{value}</span>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Image Results ─────────────────────────────────────────── */
function ImageResults({ result, previewUrl }) {
  const [viewMode, setViewMode] = useState('annotated') // 'annotated' | 'original'
  const [hoveredDet, setHoveredDet] = useState(null)
  const [showJson, setShowJson] = useState(false)

  const detections = result.detections ?? []
  const hasDanger = detections.some((d) => d.in_danger_zone)

  // Chart data: detections with confidence
  const chartData = detections.map((d, i) => ({
    name: `${d.label.toUpperCase()} #${i + 1}`,
    confidence: Math.round(d.confidence * 100),
    inDanger: d.in_danger_zone,
  }))

  const downloadJsonReport = () => {
    const report = {
      system: 'RailGuard AI Animal Detection System',
      timestamp: new Date().toISOString(),
      summary: {
        total_detections: result.count,
        alert_level: result.alert_level,
        danger_zone_breaches: detections.filter(d => d.in_danger_zone).length,
        processing_latency_ms: (result.processing_time * 1000).toFixed(1),
        confidence_threshold: result.confidence_threshold,
      },
      detections: result.detections,
      image_dimensions: result.image_size,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `railguard_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Determine image source
  const imageSrc =
    viewMode === 'original' && previewUrl
      ? previewUrl
      : result.annotated_image?.startsWith('data:')
      ? result.annotated_image
      : `data:image/jpeg;base64,${result.annotated_image}`

  return (
    <div className="space-y-5 animate-fade-in">
      {/* View Mode Switcher & Stats Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-950/40 p-2.5 rounded-xl border border-navy-800">
        <div className="flex items-center gap-1 bg-navy-900/90 p-1 rounded-lg border border-navy-700/80">
          <button
            onClick={() => setViewMode('annotated')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'annotated'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Neural Annotated</span>
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'original'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Raw Camera Feed</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            RES: {result.image_size?.width ?? 800}×{result.image_size?.height ?? 500}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] font-mono text-cyan-400">
            YOLOv8n
          </span>
        </div>
      </div>

      {/* Main Image Viewport with HUD Elements */}
      <div className="rounded-2xl overflow-hidden border border-navy-700/90 bg-navy-950 relative shadow-2xl group">
        {/* Top telemetry bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="badge bg-navy-900/90 backdrop-blur-md border border-navy-700/80 text-cyan-300 text-[11px] font-mono px-3 py-1 shadow-lg">
            {viewMode === 'annotated' ? '🟢 YOLOv8 NEURAL OVERLAY' : '⚪ SENSOR RAW FEED'}
          </div>
          {hasDanger && (
            <div className="badge bg-red-600/90 backdrop-blur-md text-white text-[11px] font-mono font-bold px-3 py-1 animate-pulse shadow-glow-red">
              ⚠️ DANGER ZONE BREACH
            </div>
          )}
        </div>

        {/* The Image */}
        <div className="relative flex items-center justify-center min-h-64 max-h-[520px] bg-navy-950 overflow-hidden">
          <img
            src={imageSrc}
            alt="Railway detection inspection"
            className="w-full h-full object-contain max-h-[520px] transition-transform duration-300"
          />

          {/* Interactive crosshair reticle when an animal card is hovered */}
          {hoveredDet && hoveredDet.bbox && result.image_size && (
            <div
              className="absolute border-2 border-red-500 bg-red-500/25 pointer-events-none transition-all duration-200 shadow-glow-red flex items-start justify-end p-1"
              style={{
                left: `${(hoveredDet.bbox.x1 / result.image_size.width) * 100}%`,
                top: `${(hoveredDet.bbox.y1 / result.image_size.height) * 100}%`,
                width: `${((hoveredDet.bbox.x2 - hoveredDet.bbox.x1) / result.image_size.width) * 100}%`,
                height: `${((hoveredDet.bbox.y2 - hoveredDet.bbox.y1) / result.image_size.height) * 100}%`,
              }}
            >
              <span className="text-[10px] font-mono bg-red-600 text-white font-bold px-1 rounded shadow">
                TARGET #{hoveredDet.label.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Bottom scanner info banner */}
        <div className="p-3 bg-navy-950/90 backdrop-blur-md border-t border-navy-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="truncate max-w-xs">{result.filename ?? 'surveillance_capture.jpg'}</span>
          <span className="text-cyan-400">FPS EQUIV: ~{((1 / (result.processing_time || 0.035))).toFixed(0)} FPS</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          icon={<Target className="w-4 h-4 text-cyan-400" />}
          label="FAUNA DETECTED"
          value={result.count}
          sub={`${detections.filter(d => d.in_danger_zone).length} within danger zone`}
          color={result.count > 0 ? (hasDanger ? 'text-red-400' : 'text-amber-400') : 'text-emerald-400'}
        />
        <StatBox
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          label="INFERENCE SPEED"
          value={`${((result.processing_time || 0.04) * 1000).toFixed(0)} ms`}
          sub="YOLOv8 Edge Neural Engine"
          color="text-amber-300"
        />
        <StatBox
          icon={<Cpu className="w-4 h-4 text-cyan-400" />}
          label="CONFIDENCE FILTER"
          value={`${((result.confidence_threshold || 0.4) * 100).toFixed(0)}%`}
          sub="Rejection Floor"
          color="text-cyan-300"
        />
        <StatBox
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          label="TRACK SAFETY"
          value={hasDanger ? 'CRITICAL' : detections.length > 0 ? 'CAUTION' : 'CLEAR'}
          sub="Perimeter Assessment"
          color={hasDanger ? 'text-red-400' : detections.length > 0 ? 'text-amber-400' : 'text-emerald-400'}
        />
      </div>

      {/* Detected Animals Interactive List */}
      {detections.length > 0 ? (
        <div className="space-y-3 bg-navy-950/40 p-4 rounded-2xl border border-navy-800/80">
          <div className="flex items-center justify-between">
            <p className="section-title">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Animal Detections ({detections.length})</span>
            </p>
            <span className="text-[11px] text-slate-400 font-mono">Hover to spotlight target</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {detections.map((det, i) => {
              const inZone = det.in_danger_zone
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredDet(det)}
                  onMouseLeave={() => setHoveredDet(null)}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    inZone
                      ? 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20 shadow-sm shadow-red-950'
                      : 'bg-navy-800/70 border-navy-700/80 hover:bg-navy-750 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1 bg-navy-900 rounded-lg border border-navy-700/80">
                      {ANIMAL_EMOJIS[det.label] ?? '🐾'}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-200 capitalize font-sans">{det.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">#{i + 1}</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Pos: [{det.bbox?.x1 ?? 0}, {det.bbox?.y1 ?? 0}]
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      inZone ? 'bg-red-500 text-white' : 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                    }`}>
                      {(det.confidence * 100).toFixed(0)}%
                    </span>
                    {inZone ? (
                      <span className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-0.5 animate-pulse">
                        ⚠️ IN DANGER
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        Perimeter
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center flex flex-col items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2" />
          <h4 className="font-bold text-emerald-300">Track Clearance Confirmed</h4>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            The neural inference engine scanned the full camera frame with a confidence threshold of{' '}
            {((result.confidence_threshold || 0.4) * 100).toFixed(0)}% and detected 0 animals.
          </p>
        </div>
      )}

      {/* Visual Analytics Chart (Recharts) */}
      {chartData.length > 0 && (
        <div className="space-y-3 bg-navy-950/40 p-4 rounded-2xl border border-navy-800/80">
          <div className="flex items-center justify-between">
            <p className="section-title">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fauna Detection Confidence Distribution</span>
            </p>
            <span className="text-[11px] font-mono text-slate-400">Confidence %</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1329',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(val) => [`${val}%`, 'Confidence']}
                />
                <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.inDanger ? '#ef4444' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Action Buttons: Download, Export Report, Inspect JSON */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {result.annotated_image && (
            <a
              href={result.annotated_image.startsWith('data:') ? result.annotated_image : `data:image/jpeg;base64,${result.annotated_image}`}
              download={`railguard_detection_${result.filename || 'frame'}.jpg`}
              className="btn-primary text-xs py-2 px-4"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Annotated Frame</span>
            </a>
          )}

          <button
            onClick={downloadJsonReport}
            className="btn-secondary text-xs py-2 px-3.5"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Incident Telemetry (JSON)</span>
          </button>
        </div>

        <button
          onClick={() => setShowJson(!showJson)}
          className="text-xs text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1"
        >
          <span>{showJson ? 'Hide Raw Telemetry' : 'View Raw Telemetry'}</span>
          {showJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Raw Telemetry Data View */}
      {showJson && (
        <pre className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 font-mono text-[11px] text-cyan-300/90 overflow-x-auto max-h-56 leading-relaxed">
          {JSON.stringify({ ...result, annotated_image: '[TRUNCATED BASE64]' }, null, 2)}
        </pre>
      )}
    </div>
  )
}

/* ── Video Results ─────────────────────────────────────────── */
function VideoResults({ result, jobId }) {
  const [expanded, setExpanded] = useState(false)
  const frames = result.frame_detections ?? []
  const alertFrames = result.alert_frames ?? 0
  const totalFrames = result.total_frames ?? 0

  // Timeline chart data
  const timelineData = frames.map((f) => ({
    time: `${f.timestamp_sec.toFixed(1)}s`,
    detections: f.detections?.length ?? 0,
    hasDanger: f.detections?.some((d) => d.in_danger_zone),
  }))

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="TOTAL FRAMES" value={totalFrames} sub="Captured stream" />
        <StatBox label="SAMPLED FRAMES" value={result.sampled_frames} sub="Processed frames" />
        <StatBox
          label="ALERT FRAMES"
          value={alertFrames}
          sub="Risk events flagged"
          color={alertFrames > 0 ? 'text-red-400' : 'text-emerald-400'}
        />
        <StatBox
          label="PROCESSING TIME"
          value={`${result.processing_time}s`}
          sub="Overall duration"
          color="text-amber-400"
        />
      </div>

      {/* Unique Animals Tag Cloud */}
      {result.unique_animals?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-navy-950/40 rounded-xl border border-navy-800">
          <span className="text-xs font-mono text-slate-400 mr-2">Identified Fauna:</span>
          {result.unique_animals.map((a) => (
            <span key={a} className="badge bg-blue-500/15 border border-blue-500/30 text-cyan-300 py-1 px-3 text-xs">
              {ANIMAL_EMOJIS[a] ?? '🐾'} <span className="capitalize font-semibold">{a}</span>
            </span>
          ))}
        </div>
      )}

      {/* Video Preview Player */}
      {result.output_video_url && (
        <div className="rounded-2xl overflow-hidden border border-navy-700/80 bg-navy-950 shadow-2xl relative">
          <video
            src={result.output_video_url}
            controls
            className="w-full max-h-96 object-contain bg-black"
            preload="metadata"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {result.output_video_url && (
          <a
            href={`/api/download/${jobId}`}
            download
            className="btn-primary text-xs py-2.5 px-4"
          >
            <Download className="w-4 h-4" />
            <span>Download Annotated Video (.mp4)</span>
          </a>
        )}
      </div>

      {/* Video Detection Timeline Chart */}
      {timelineData.length > 0 && (
        <div className="space-y-2 bg-navy-950/40 p-4 rounded-2xl border border-navy-800/80">
          <div className="flex items-center justify-between">
            <p className="section-title">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Temporal Detection Timeline (Occurrences / Second)</span>
            </p>
            <span className="text-[11px] font-mono text-slate-400">Video Duration</span>
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#38bdf8" stop-opacity={0.4}/>
                    <stop offset="95%" stop-color="#38bdf8" stop-opacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1329',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Area type="monotone" dataKey="detections" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorDetections)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Collapsible Frame Event Details */}
      {frames.length > 0 && (
        <div className="space-y-2">
          <button
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Inspected Video Keyframes ({frames.length} events logged)</span>
          </button>
          {expanded && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {frames.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-navy-800/60 rounded-xl text-xs border border-navy-700/60">
                  <span className="font-mono text-cyan-400 whitespace-nowrap">
                    {f.timestamp_sec.toFixed(1)}s / #{f.frame_index}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {f.detections.map((d, j) => (
                      <span key={j} className={`badge py-0.5 ${d.in_danger_zone ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-navy-700 text-slate-300'}`}>
                        {ANIMAL_EMOJIS[d.label] ?? '🐾'} {d.label} {(d.confidence * 100).toFixed(0)}%
                        {d.in_danger_zone ? ' ⚠️ ZONE' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Progress Card ─────────────────────────────────────────── */
function VideoProgress({ job, uploadPct, status }) {
  const isUploading = status === 'uploading'
  const pct = isUploading
    ? uploadPct
    : Math.round((job?.progress ?? 0) * 100)
  const label = isUploading ? 'Uploading Video Stream…' : (job?.message ?? 'Processing Neural Inference…')

  return (
    <div className="space-y-3 animate-fade-in p-5 bg-navy-950/60 rounded-2xl border border-navy-700/80 shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{label}</span>
        </span>
        <span className="font-bold text-cyan-300 text-sm">{pct}%</span>
      </div>

      <div className="h-2.5 bg-navy-900 rounded-full overflow-hidden p-0.5 border border-navy-700/80">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-glow-cyan"
          style={{ width: `${pct}%` }}
        />
      </div>

      {job && (
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
          <span>Processed: {job.frames_processed} / {job.total_frames || '?'} frames</span>
          <span className="text-cyan-400 animate-pulse">Running YOLOv8 frame extractor</span>
        </div>
      )}
    </div>
  )
}

/* ── Main Export ───────────────────────────────────────────── */
export default function ResultsSection({
  activeTab, status, imageResult, videoResult,
  videoJob, uploadPct, previewUrl, onReset,
}) {
  if (status === 'idle') return null

  return (
    <div className="glass-card p-5 space-y-5 border border-navy-700/80 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="section-title">
          {activeTab === 'image'
            ? <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            : <Film  className="w-3.5 h-3.5 text-cyan-400" />}
          <span>Neural Vision Telemetry Results</span>
        </p>
        <button id="reset-btn" className="btn-secondary text-xs py-1 px-3" onClick={onReset}>
          Analyze Another Track
        </button>
      </div>

      {/* Video Progress Bar */}
      {(status === 'uploading' || status === 'processing') && activeTab === 'video' && (
        <VideoProgress job={videoJob} uploadPct={uploadPct} status={status} />
      )}

      {/* Image Uploading / Processing Spinner */}
      {status === 'uploading' && activeTab === 'image' && (
        <div className="flex flex-col items-center justify-center gap-3 text-slate-300 py-12 rounded-xl bg-navy-950/40 border border-navy-800">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <Target className="w-4 h-4 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center font-mono text-xs">
            <p className="font-semibold text-slate-200">Executing YOLOv8 Inference…</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Scanning ballast bed & boundary polygon</p>
          </div>
        </div>
      )}

      {status === 'completed' && activeTab === 'image' && imageResult && (
        <ImageResults result={imageResult} previewUrl={previewUrl} />
      )}

      {status === 'completed' && activeTab === 'video' && videoResult && (
        <VideoResults result={videoResult} jobId={videoJob?.jobId} />
      )}
    </div>
  )
}
