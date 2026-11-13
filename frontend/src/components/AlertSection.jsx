import { AlertTriangle, AlertCircle, CheckCircle2, XCircle, BellRing, ArrowRight } from 'lucide-react'

const CONFIGS = {
  danger: {
    bg:       'bg-gradient-to-r from-red-950/70 via-red-900/40 to-navy-900/80',
    border:   'border-red-500/60 shadow-glow-red',
    iconBg:   'bg-red-500/20 border border-red-500/40 text-red-400',
    icon:     <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />,
    badgeBg:  'bg-red-500 text-white font-bold',
    statusTag:'CRITICAL PERIMETER BREACH',
    title:    'DANGER ZONE ALERT: FAUNA DETECTED IN TRACK PATH',
    titleCls: 'text-red-400',
    action:   'EMERGENCY TRACTION ADVISORY: Audible Horn Signal & Service Brake Preparation',
    pulse:    true,
  },
  warning: {
    bg:       'bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-navy-900/80',
    border:   'border-amber-500/50 shadow-glow-amber',
    iconBg:   'bg-amber-500/20 border border-amber-500/40 text-amber-400',
    icon:     <AlertCircle className="w-6 h-6 text-amber-400" />,
    badgeBg:  'bg-amber-500 text-navy-950 font-bold',
    statusTag:'TRACK PERIMETER WARNING',
    title:    'CAUTION: ANIMAL OBSERVED IN TRACK VICINITY',
    titleCls: 'text-amber-400',
    action:   'SPEED RESTRICTION ADVISORY: Caution Signal Active, Enhanced Vigilance at Approach',
    pulse:    false,
  },
  none: {
    bg:       'bg-gradient-to-r from-emerald-950/60 via-emerald-900/25 to-navy-900/80',
    border:   'border-emerald-500/40 shadow-glow-green',
    iconBg:   'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400',
    icon:     <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    badgeBg:  'bg-emerald-500 text-navy-950 font-bold',
    statusTag:'ALL CLEAR • NO FAUNA DETECTED',
    title:    'TRACK SAFETY VERIFIED: CLEAR LINE SPEED AUTHORIZED',
    titleCls: 'text-emerald-400',
    action:   'NORMAL OPERATION: Standard Line Speed Authorized Across Monitored Block',
    pulse:    false,
  },
  error: {
    bg:       'bg-gradient-to-r from-rose-950/60 via-red-900/30 to-navy-900/80',
    border:   'border-rose-500/50',
    iconBg:   'bg-rose-500/20 border border-rose-500/40 text-rose-400',
    icon:     <XCircle className="w-6 h-6 text-rose-400" />,
    badgeBg:  'bg-rose-500 text-white font-bold',
    statusTag:'PROCESSING ANOMALY',
    title:    'INFERENCE TELEMETRY ERROR',
    titleCls: 'text-rose-400',
    action:   'FAILSAFE ACTIVE: Check camera stream connection or restart inference worker',
    pulse:    false,
  },
}

export default function AlertSection({ alertLevel, alertMessage, error, onDismiss }) {
  const level = error ? 'error' : alertLevel

  if (!level || level === 'idle') return null

  const cfg = CONFIGS[level] ?? CONFIGS.none
  const message = error || alertMessage

  return (
    <div
      id={`alert-${level}`}
      className={`
        glass-card p-4 sm:p-5 border ${cfg.bg} ${cfg.border}
        ${cfg.pulse ? 'animate-pulse-slow' : ''} animate-slide-up relative overflow-hidden
      `}
    >
      {/* Decorative top beacon bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        level === 'danger' ? 'bg-red-500 animate-pulse' : level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded tracking-wider ${cfg.badgeBg}`}>
            {cfg.statusTag}
          </span>
          <span className="text-slate-400 text-xs font-mono">• PROTOCOL RAIL-7A</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-white px-2 py-0.5">
            Dismiss ✕
          </button>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${cfg.iconBg} shadow-inner`}>
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-black text-sm sm:text-base font-sans tracking-wide uppercase ${cfg.titleCls}`}>
            {cfg.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed font-sans">
            {message}
          </p>

          <div className="mt-2.5 pt-2.5 border-t border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px]">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{cfg.action}</span>
            </div>
            {level === 'danger' && (
              <span className="text-[10px] font-mono text-red-300/80 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                PROTOTYPE SIMULATION
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
