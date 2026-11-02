import { Download, Image, Film, Clock, Cpu, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { downloadUrl } from '../services/api'

const ANIMAL_EMOJIS = {
  bird:'🦅', cat:'🐈', dog:'🐕', horse:'🐴', sheep:'🐑',
  cow:'🐄', elephant:'🐘', bear:'🐻', zebra:'🦓', giraffe:'🦒',
}

/* ── Image Results ─────────────────────────────────────────── */
function ImageResults({ result }) {
  const [showOriginal, setShowOriginal] = useState(false)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Annotated image */}
      <div className="rounded-xl overflow-hidden border border-navy-600 relative">
        <span className="absolute top-2 left-2 badge bg-rail-500/80 text-white text-xs z-10">
          Annotated
        </span>
        <img
          src={`data:image/jpeg;base64,${result.annotated_image}`}
          alt="Annotated detection result"
          className="w-full object-contain max-h-96"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox icon={<Target className="w-4 h-4 text-rail-400" />} label="Detections" value={result.count} />
        <StatBox icon={<Clock className="w-4 h-4 text-warn-400" />}  label="Inference" value={`${(result.processing_time * 1000).toFixed(0)}ms`} />
        <StatBox icon={<Cpu className="w-4 h-4 text-safe-400" />}    label="Threshold" value={`${(result.confidence_threshold * 100).toFixed(0)}%`} />
      </div>

      {/* Detection list */}
      {result.detections?.length > 0 && (
        <div className="space-y-2">
          <p className="section-title">Detected Animals</p>
          <div className="flex flex-wrap gap-2">
            {result.detections.map((det, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium
                ${det.in_danger_zone
                  ? 'bg-alert-500/15 border-alert-500/40 text-alert-300'
                  : 'bg-navy-700 border-navy-600 text-slate-300'
                }`}>
                <span>{ANIMAL_EMOJIS[det.label] ?? '🐾'}</span>
                <span className="capitalize">{det.label}</span>
                <span className="text-xs opacity-70 font-mono">
                  {(det.confidence * 100).toFixed(0)}%
                </span>
                {det.in_danger_zone && (
                  <span className="text-xs text-alert-400">⚠️ ZONE</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download annotated image */}
      <a
        href={`data:image/jpeg;base64,${result.annotated_image}`}
        download={`detected_${result.filename ?? 'result'}`}
        className="btn-secondary text-sm w-fit"
      >
        <Download className="w-4 h-4" /> Download Annotated Image
      </a>
    </div>
  )
}

/* ── Video Results ─────────────────────────────────────────── */
function VideoResults({ result, jobId }) {
  const [expanded, setExpanded] = useState(false)
  const frames = result.frame_detections ?? []

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Total Frames"    value={result.total_frames}   />
        <StatBox label="Sampled"         value={result.sampled_frames} />
        <StatBox label="Alert Frames"    value={result.alert_frames}   color="text-alert-400" />
        <StatBox label="Time"            value={`${result.processing_time}s`} />
      </div>

      {/* Unique animals */}
      {result.unique_animals?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.unique_animals.map((a) => (
            <span key={a} className="badge bg-navy-700 border border-navy-600 text-slate-300 py-1 px-3">
              {ANIMAL_EMOJIS[a] ?? '🐾'} {a}
            </span>
          ))}
        </div>
      )}

      {/* Video preview + download */}
      {result.output_video_url && (
        <div className="rounded-xl overflow-hidden border border-navy-600">
          <video
            src={result.output_video_url}
            controls
            className="w-full max-h-80"
            preload="metadata"
          />
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {result.output_video_url && (
          <a
            href={`/api/download/${jobId}`}
            download
            className="btn-primary text-sm"
          >
            <Download className="w-4 h-4" /> Download Video
          </a>
        )}
      </div>

      {/* Detection timeline (collapsible) */}
      {frames.length > 0 && (
        <div className="space-y-2">
          <button
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Detection Timeline ({frames.length} events)
          </button>
          {expanded && (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {frames.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-navy-700/50 rounded-lg text-xs border border-navy-600">
                  <span className="font-mono text-rail-400 whitespace-nowrap">
                    {f.timestamp_sec}s / #{f.frame_index}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {f.detections.map((d, j) => (
                      <span key={j} className={`badge py-0.5 ${d.in_danger_zone ? 'bg-alert-500/20 text-alert-400' : 'bg-navy-600 text-slate-400'}`}>
                        {ANIMAL_EMOJIS[d.label] ?? '🐾'} {d.label} {(d.confidence*100).toFixed(0)}%
                        {d.in_danger_zone ? ' ⚠️' : ''}
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

function StatBox({ icon, label, value, color = 'text-rail-400' }) {
  return (
    <div className="bg-navy-700/60 rounded-xl p-3 flex flex-col gap-1 border border-navy-600">
      {icon && <div className="mb-0.5">{icon}</div>}
      <span className={`text-lg font-bold font-mono ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

/* ── Progress ──────────────────────────────────────────────── */
function VideoProgress({ job, uploadPct, status }) {
  const isUploading = status === 'uploading'
  const pct = isUploading
    ? uploadPct
    : Math.round((job?.progress ?? 0) * 100)
  const label = isUploading ? 'Uploading…' : (job?.message ?? 'Processing…')

  return (
    <div className="space-y-3 animate-fade-in p-4 bg-navy-700/40 rounded-xl border border-navy-600">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-rail-400">{pct}%</span>
      </div>
      <div className="h-2 bg-navy-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rail-500 to-rail-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {job && (
        <p className="text-xs text-slate-500 font-mono">
          {job.frames_processed} / {job.total_frames || '?'} frames
        </p>
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
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="section-title flex items-center gap-2 mb-0">
          {activeTab === 'image'
            ? <Image className="w-3.5 h-3.5" />
            : <Film  className="w-3.5 h-3.5" />}
          Results
        </p>
        <button id="reset-btn" className="btn-secondary text-xs py-1.5" onClick={onReset}>
          Upload Another File
        </button>
      </div>

      {/* Video progress bar */}
      {(status === 'uploading' || status === 'processing') && activeTab === 'video' && (
        <VideoProgress job={videoJob} uploadPct={uploadPct} status={status} />
      )}

      {/* Image uploading spinner */}
      {status === 'uploading' && activeTab === 'image' && (
        <div className="flex items-center gap-3 text-slate-400 text-sm p-4">
          <div className="w-5 h-5 border-2 border-rail-500 border-t-transparent rounded-full animate-spin" />
          Analysing image…
        </div>
      )}

      {status === 'completed' && activeTab === 'image'  && imageResult  && <ImageResults result={imageResult} />}
      {status === 'completed' && activeTab === 'video'  && videoResult  && <VideoResults result={videoResult} jobId={videoJob?.jobId} />}
    </div>
  )
}
