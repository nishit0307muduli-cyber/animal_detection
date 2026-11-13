import { Sliders, Eye, EyeOff, Gauge, Zap, Layers, Sparkles } from 'lucide-react'

const COCO_ANIMALS = [
  { name: 'Dog', icon: '🐕' },
  { name: 'Cat', icon: '🐈' },
  { name: 'Bird', icon: '🦅' },
  { name: 'Horse', icon: '🐴' },
  { name: 'Sheep', icon: '🐑' },
  { name: 'Cow', icon: '🐄' },
  { name: 'Elephant', icon: '🐘' },
  { name: 'Bear', icon: '🐻' },
  { name: 'Zebra', icon: '🦓' },
  { name: 'Giraffe', icon: '🦒' },
]

export default function DetectionSettings({ settings, onChange, disabled }) {
  const { confidence, showLabels, showConf, sampleRate } = settings

  const setPreset = (val) => {
    if (!disabled) onChange({ confidence: val })
  }

  return (
    <div className="glass-card p-5 space-y-5 border border-navy-700/80 shadow-2xl relative">
      <div className="flex items-center justify-between">
        <p className="section-title">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Inference Telemetry & Tuning</span>
        </p>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
          YOLOv8 Engine
        </span>
      </div>

      {/* Confidence threshold & Quick Presets */}
      <div className="space-y-3 bg-navy-950/40 p-3.5 rounded-xl border border-navy-800/80">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>Confidence Threshold</span>
          </label>
          <span className="badge bg-blue-500/15 text-cyan-300 border border-blue-500/30 font-mono text-xs font-bold px-2 py-0.5">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>

        {/* Quick Sensitivity Preset Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setPreset(0.25)}
            disabled={disabled}
            className={`py-1 px-2 rounded-lg text-[11px] font-mono font-medium transition-all ${
              Math.round(confidence * 100) === 25
                ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm'
                : 'bg-navy-800/90 text-slate-400 hover:text-slate-200 hover:bg-navy-700'
            }`}
          >
            Sensitive (25%)
          </button>
          <button
            type="button"
            onClick={() => setPreset(0.40)}
            disabled={disabled}
            className={`py-1 px-2 rounded-lg text-[11px] font-mono font-medium transition-all ${
              Math.round(confidence * 100) === 40
                ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm'
                : 'bg-navy-800/90 text-slate-400 hover:text-slate-200 hover:bg-navy-700'
            }`}
          >
            Balanced (40%)
          </button>
          <button
            type="button"
            onClick={() => setPreset(0.65)}
            disabled={disabled}
            className={`py-1 px-2 rounded-lg text-[11px] font-mono font-medium transition-all ${
              Math.round(confidence * 100) === 65
                ? 'bg-cyan-500 text-navy-950 font-bold shadow-sm'
                : 'bg-navy-800/90 text-slate-400 hover:text-slate-200 hover:bg-navy-700'
            }`}
          >
            Strict (65%)
          </button>
        </div>

        <input
          id="conf-slider"
          type="range"
          min="5" max="95" step="1"
          value={Math.round(confidence * 100)}
          onChange={(e) => onChange({ confidence: Number(e.target.value) / 100 })}
          className="input-range"
          disabled={disabled}
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>5% (High Recall)</span>
          <span>95% (High Precision)</span>
        </div>
      </div>

      {/* Video sample rate */}
      <div className="space-y-2 bg-navy-950/40 p-3.5 rounded-xl border border-navy-800/80">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Video Temporal Sampling</span>
          </label>
          <span className="badge bg-navy-800 text-slate-300 font-mono text-xs border border-navy-700">
            1 in {sampleRate} frame{sampleRate > 1 ? 's' : ''}
          </span>
        </div>
        <input
          type="range"
          min="1" max="10" step="1"
          value={sampleRate}
          onChange={(e) => onChange({ sampleRate: Number(e.target.value) })}
          className="input-range"
          disabled={disabled}
        />
        <p className="text-[11px] text-slate-400">
          {sampleRate === 1
            ? '⚡ Every frame analyzed — highest accuracy for fast-moving targets.'
            : `⏩ Skipping ${sampleRate - 1} frames — ~${sampleRate}x faster inference throughput.`}
        </p>
      </div>

      {/* Annotation Overlay Toggles */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>Visual HUD Overlays</span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Toggle Labels */}
          <button
            type="button"
            id="toggle-labels"
            onClick={() => onChange({ showLabels: !showLabels })}
            disabled={disabled}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
              showLabels
                ? 'bg-blue-600/15 border-blue-500/40 text-cyan-300'
                : 'bg-navy-950/40 border-navy-800 text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Bounding Labels</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${showLabels ? 'bg-cyan-400 shadow-glow-cyan' : 'bg-slate-700'}`} />
          </button>

          {/* Toggle Confidence */}
          <button
            type="button"
            id="toggle-conf"
            onClick={() => onChange({ showConf: !showConf })}
            disabled={disabled}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
              showConf
                ? 'bg-blue-600/15 border-blue-500/40 text-cyan-300'
                : 'bg-navy-950/40 border-navy-800 text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confidence %</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${showConf ? 'bg-cyan-400 shadow-glow-cyan' : 'bg-slate-700'}`} />
          </button>
        </div>
      </div>

      {/* Detectable Fauna Catalog */}
      <div className="space-y-2">
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Classified Fauna Targets (COCO-10)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COCO_ANIMALS.map((animal) => (
            <span
              key={animal.name}
              className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-navy-800/80 text-slate-300 border border-navy-700/60 inline-flex items-center gap-1 hover:border-cyan-500/40 transition-colors"
            >
              <span>{animal.icon}</span>
              <span>{animal.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
