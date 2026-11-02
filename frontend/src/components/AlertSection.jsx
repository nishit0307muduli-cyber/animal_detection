import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

const CONFIGS = {
  danger: {
    bg:      'bg-alert-500/10',
    border:  'border-alert-500/40',
    iconBg:  'bg-alert-500/20',
    icon:    <AlertTriangle className="w-6 h-6 text-alert-400" />,
    title:   '⚠️ Danger Zone Alert',
    titleCls:'text-alert-400',
    pulse:   true,
  },
  warning: {
    bg:      'bg-warn-500/10',
    border:  'border-warn-500/30',
    iconBg:  'bg-warn-500/20',
    icon:    <Info className="w-6 h-6 text-warn-400" />,
    title:   '🔔 Animal Detected',
    titleCls:'text-warn-400',
    pulse:   false,
  },
  none: {
    bg:      'bg-safe-500/8',
    border:  'border-safe-500/25',
    iconBg:  'bg-safe-500/15',
    icon:    <CheckCircle className="w-6 h-6 text-safe-400" />,
    title:   '✅ Track Clear',
    titleCls:'text-safe-400',
    pulse:   false,
  },
  error: {
    bg:      'bg-alert-500/10',
    border:  'border-alert-500/40',
    iconBg:  'bg-alert-500/20',
    icon:    <XCircle className="w-6 h-6 text-alert-400" />,
    title:   '❌ Processing Error',
    titleCls:'text-alert-400',
    pulse:   false,
  },
}

export default function AlertSection({ alertLevel, alertMessage, error }) {
  // Show error card if there's an error
  const level = error ? 'error' : alertLevel

  if (!level || level === 'idle') return null

  const cfg = CONFIGS[level] ?? CONFIGS.none
  const message = error || alertMessage

  return (
    <div
      id={`alert-${level}`}
      className={`
        card p-5 border ${cfg.bg} ${cfg.border}
        ${cfg.pulse ? 'animate-pulse-slow' : ''} animate-slide-up
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${cfg.iconBg}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base ${cfg.titleCls}`}>{cfg.title}</h3>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{message}</p>

          {level === 'danger' && (
            <p className="text-xs text-slate-500 mt-2 italic">
              ⚠️ This is a research prototype. Do not use for certified railway safety decisions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
