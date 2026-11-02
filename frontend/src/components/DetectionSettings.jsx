import { Settings, Eye, EyeOff, Gauge } from 'lucide-react'

export default function DetectionSettings({ settings, onChange, disabled }) {
  const { confidence, showLabels, showConf, sampleRate } = settings

  return (
    <div className="card p-5 space-y-5">
      <p className="section-title flex items-center gap-2">
        <Settings className="w-3.5 h-3.5" /> Detection Settings
      </p>

      {/* Confidence threshold */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-rail-400" />
            Confidence Threshold
          </label>
          <span className="badge bg-rail-500/20 text-rail-400 font-mono text-xs">
            {(confidence * 100).toFixed(0)}%
          </span>
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
        <div className="flex justify-between text-xs text-slate-600">
          <span>5% (Sensitive)</span>
          <span>95% (Strict)</span>
        </div>
      </div>

      {/* Sample rate (video) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-slate-300">Video Sample Rate</label>
          <span className="badge bg-navy-700 text-slate-400 font-mono text-xs">
            Every {sampleRate} frame{sampleRate > 1 ? 's' : ''}
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
        <p className="text-xs text-slate-600">
          Higher = faster processing, may miss brief appearances.
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Annotation Options</p>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" /> Show Labels
          </span>
          <button
            id="toggle-labels"
            onClick={() => onChange({ showLabels: !showLabels })}
            disabled={disabled}
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative
              ${showLabels ? 'bg-rail-500' : 'bg-navy-600'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
              ${showLabels ? 'left-5' : 'left-0.5'}`} />
          </button>
        </label>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" /> Show Confidence
          </span>
          <button
            id="toggle-conf"
            onClick={() => onChange({ showConf: !showConf })}
            disabled={disabled}
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative
              ${showConf ? 'bg-rail-500' : 'bg-navy-600'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
              ${showConf ? 'left-5' : 'left-0.5'}`} />
          </button>
        </label>
      </div>
    </div>
  )
}
