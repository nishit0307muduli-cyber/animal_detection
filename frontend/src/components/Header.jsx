import { Train, Activity, AlertTriangle, CheckCircle, Loader2, WifiOff } from 'lucide-react'

const STATUS_CONFIG = {
  idle:       { label: 'Ready',      color: 'text-safe-400',  Icon: CheckCircle,    dot: 'bg-safe-500' },
  uploading:  { label: 'Uploading',  color: 'text-rail-400',  Icon: Loader2,        dot: 'bg-rail-500',  spin: true },
  processing: { label: 'Processing', color: 'text-warn-400',  Icon: Activity,       dot: 'bg-warn-500',  pulse: true },
  completed:  { label: 'Completed',  color: 'text-safe-400',  Icon: CheckCircle,    dot: 'bg-safe-500' },
  error:      { label: 'Error',      color: 'text-alert-400', Icon: AlertTriangle,  dot: 'bg-alert-500' },
}

export default function Header({ status, backendOnline }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle
  const { label, color, Icon, dot, spin, pulse } = cfg

  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur border-b border-navy-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rail-500/20 border border-rail-500/30 flex items-center justify-center">
            <Train className="w-5 h-5 text-rail-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Railway Animal Detection</h1>
            <p className="text-xs text-slate-500 leading-tight">AI Safety Monitoring System</p>
          </div>
        </div>

        {/* Status + Backend */}
        <div className="flex items-center gap-4">
          {/* Backend connectivity */}
          {!backendOnline && (
            <div className="flex items-center gap-1.5 text-xs text-alert-400 bg-alert-500/10 border border-alert-500/30 px-3 py-1.5 rounded-lg">
              <WifiOff className="w-3.5 h-3.5" />
              Backend offline
            </div>
          )}

          {/* Processing status */}
          <div className={`flex items-center gap-2 text-sm font-medium ${color}`}>
            <div className={`w-2 h-2 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} />
            <Icon className={`w-4 h-4 ${spin ? 'animate-spin' : ''}`} />
            <span>{label}</span>
          </div>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="max-w-7xl mx-auto mt-2">
        <p className="text-xs text-slate-600 text-center">
          ⚠️ Research prototype — NOT a certified railway safety or collision-prevention system.
          Do not use for real safety-critical decisions.
        </p>
      </div>
    </header>
  )
}
