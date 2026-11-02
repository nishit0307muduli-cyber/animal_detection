import { History, Trash2, Image, Film, AlertTriangle, Check, Clock } from 'lucide-react'

const ALERT_STYLES = {
  danger:  { dot: 'bg-alert-500',  label: 'Danger', text: 'text-alert-400' },
  warning: { dot: 'bg-warn-500',   label: 'Alert',  text: 'text-warn-400'  },
  none:    { dot: 'bg-safe-500',   label: 'Clear',  text: 'text-safe-400'  },
  error:   { dot: 'bg-slate-500',  label: 'Error',  text: 'text-slate-400' },
}

function HistoryItem({ entry }) {
  const cfg = ALERT_STYLES[entry.alertLevel] ?? ALERT_STYLES.none
  return (
    <div className="flex items-start gap-3 p-3 bg-navy-700/50 rounded-xl border border-navy-600
                    hover:border-navy-500 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${entry.type === 'image' ? 'bg-rail-500/15' : 'bg-purple-500/15'}`}>
        {entry.type === 'image'
          ? <Image className="w-4 h-4 text-rail-400" />
          : <Film  className="w-4 h-4 text-purple-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{entry.filename}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-xs text-slate-500">
            {entry.count} detection{entry.count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HistorySection({ history, onClear }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-title flex items-center gap-2 mb-0">
          <History className="w-3.5 h-3.5" /> Processing History
        </p>
        {history.length > 0 && (
          <button
            id="clear-history-btn"
            className="btn-secondary text-xs py-1 px-3"
            onClick={onClear}
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-600">
          <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No processing history yet.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {history.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
