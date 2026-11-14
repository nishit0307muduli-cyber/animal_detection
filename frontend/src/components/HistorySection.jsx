import { useState } from 'react'
import {
  History, Trash2, Image as ImageIcon, Film, Camera, Clock,
  Download, Filter, Search, ShieldCheck, AlertTriangle, FileJson
} from 'lucide-react'

const ALERT_STYLES = {
  danger:  { dot: 'bg-red-500 shadow-glow-red',  label: 'Danger Breach', text: 'text-red-400',  border: 'border-red-500/30 bg-red-500/10' },
  warning: { dot: 'bg-amber-500',                label: 'Perimeter Alert', text: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/10' },
  none:    { dot: 'bg-emerald-500',              label: 'Track Clear',   text: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/10' },
  error:   { dot: 'bg-slate-500',                label: 'Error',         text: 'text-slate-400', border: 'border-slate-500/30 bg-slate-500/10' },
}

function HistoryItem({ entry, isFullView }) {
  const cfg = ALERT_STYLES[entry.alertLevel] ?? ALERT_STYLES.none
  const dateObj = new Date(entry.timestamp)
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <div className={`flex items-center justify-between gap-3 p-3 bg-navy-950/60 rounded-xl border border-navy-800/80 hover:border-navy-700 hover:bg-navy-900/80 transition-all group ${
      isFullView ? 'p-4' : 'p-3'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
          entry.type === 'image'
            ? 'bg-blue-500/15 border-blue-500/30 text-cyan-400'
            : entry.type === 'live'
            ? 'bg-red-500/15 border-red-500/30 text-red-400'
            : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
        }`}>
          {entry.type === 'image' ? <ImageIcon className="w-4 h-4" /> : entry.type === 'live' ? <Camera className="w-4 h-4" /> : <Film className="w-4 h-4" />}
        </div>

        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
            {entry.filename}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{dateStr} {timeStr}</span>
            </span>
            <span>•</span>
            <span className="text-cyan-300/80 font-bold uppercase">{entry.type}</span>
            <span>•</span>
            <span>
              {entry.count} fauna detection{entry.count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 ${cfg.border} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span>{cfg.label}</span>
        </span>
      </div>
    </div>
  )
}

export default function HistorySection({ history = [], onClear, isFullView = false }) {
  const [filter, setFilter] = useState('all') // 'all' | 'danger' | 'warning' | 'none'
  const [searchQuery, setSearchQuery] = useState('')

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filter === 'all' || item.alertLevel === filter
    const matchesSearch = !searchQuery.trim() ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const exportHistoryCsv = () => {
    if (history.length === 0) return
    const headers = ['ID', 'Filename', 'Type', 'AlertLevel', 'DetectionsCount', 'Timestamp']
    const rows = history.map(h => [
      h.id,
      `"${h.filename}"`,
      h.type,
      h.alertLevel,
      h.count,
      h.timestamp
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `railguard_audit_log_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportHistoryJson = () => {
    if (history.length === 0) return
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `railguard_audit_log_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`glass-card space-y-4 border border-navy-700/80 shadow-2xl ${
      isFullView ? 'p-6 sm:p-8 min-h-[500px]' : 'p-5'
    }`}>
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-navy-800/80">
        <div className="flex items-center gap-2">
          <p className="section-title mb-0">
            <History className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-wide">Inspection Audit Log & History</span>
          </p>
          <span className="badge bg-navy-800 text-slate-300 border border-navy-700 font-mono text-xs">
            {history.length} record{history.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={exportHistoryCsv}
                className="btn-secondary text-[11px] py-1 px-2.5 font-mono"
                title="Export Log to CSV"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={exportHistoryJson}
                className="btn-secondary text-[11px] py-1 px-2.5 font-mono"
                title="Export Log to JSON"
              >
                <FileJson className="w-3 h-3 text-cyan-400" />
                <span>JSON</span>
              </button>

              <button
                id="clear-history-btn"
                className="btn-secondary text-[11px] py-1 px-2.5 text-slate-400 hover:text-red-400 font-mono"
                onClick={onClear}
                title="Clear History"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search history by filename or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950/60 border border-navy-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                filter === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-navy-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilter('danger')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                filter === 'danger'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-navy-800 text-slate-400 hover:text-white'
              }`}
            >
              Danger ({history.filter(h => h.alertLevel === 'danger').length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                filter === 'warning'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-navy-800 text-slate-400 hover:text-white'
              }`}
            >
              Caution ({history.filter(h => h.alertLevel === 'warning').length})
            </button>
            <button
              onClick={() => setFilter('none')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                filter === 'none'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-navy-800 text-slate-400 hover:text-white'
              }`}
            >
              Clear ({history.filter(h => h.alertLevel === 'none').length})
            </button>
          </div>
        </div>
      )}

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-600 rounded-xl bg-navy-950/40 border border-navy-800/80">
          <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
          <p className="text-xs sm:text-sm font-semibold text-slate-400">
            {history.length === 0 ? 'No inspections recorded yet' : 'No records match your search/filter'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            All completed image scans, video analyses, and live camera alerts persist here in your browser.
          </p>
        </div>
      ) : (
        <div className={`space-y-2 pr-1 ${isFullView ? 'max-h-[600px] overflow-y-auto' : 'max-h-80 overflow-y-auto'}`}>
          {filteredHistory.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} isFullView={isFullView} />
          ))}
        </div>
      )}
    </div>
  )
}
