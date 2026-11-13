import { useRef, useEffect, useState } from 'react'
import { MapPin, RotateCcw, Trash2, Check, Crosshair, HelpCircle, Layers } from 'lucide-react'

const DEFAULT_ZONE = [
  { x: 0,   y: 35 },
  { x: 100, y: 35 },
  { x: 100, y: 65 },
  { x: 0,   y: 65 },
]

const WIDE_ZONE = [
  { x: 0,   y: 20 },
  { x: 100, y: 20 },
  { x: 100, y: 80 },
  { x: 0,   y: 80 },
]

const NARROW_ZONE = [
  { x: 0,   y: 42 },
  { x: 100, y: 42 },
  { x: 100, y: 58 },
  { x: 0,   y: 58 },
]

export default function DangerZoneConfig({ imagePreviewUrl, dangerZone, onZoneChange, disabled }) {
  const canvasRef   = useRef(null)
  const imageRef    = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [localPts, setLocalPts] = useState(dangerZone ?? DEFAULT_ZONE)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Sync external zone
  useEffect(() => {
    setLocalPts(dangerZone ?? DEFAULT_ZONE)
  }, [dangerZone])

  // Redraw canvas whenever points or image change
  useEffect(() => {
    if (!imgLoaded) return
    drawCanvas()
  }, [localPts, imgLoaded, drawing])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img    = imageRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    canvas.width  = img.clientWidth
    canvas.height = img.clientHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (localPts.length < 2) return
    const w = canvas.width
    const h = canvas.height

    const pxPts = localPts.map((p) => ({ x: (p.x / 100) * w, y: (p.y / 100) * h }))

    // Draw polygon fill with neon gradient feel
    ctx.beginPath()
    ctx.moveTo(pxPts[0].x, pxPts[0].y)
    pxPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()

    // Semi-transparent danger zone overlay
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)'
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2.5
    ctx.setLineDash([8, 4])
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([]) // Reset dash

    // Draw glowing vertices
    pxPts.forEach((p, i) => {
      // Glow circle
      ctx.beginPath()
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'
      ctx.fill()

      // Vertex pin
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.fill()
      ctx.stroke()

      // Node number label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${i + 1}`, p.x, p.y - 8)
    })

    // Central Danger Corridor HUD Label
    if (localPts.length >= 3) {
      const cx = pxPts.reduce((s, p) => s + p.x, 0) / pxPts.length
      const cy = pxPts.reduce((s, p) => s + p.y, 0) / pxPts.length

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1
      const textWidth = 140
      ctx.fillRect(cx - textWidth / 2, cy - 12, textWidth, 24)
      ctx.strokeRect(cx - textWidth / 2, cy - 12, textWidth, 24)

      ctx.fillStyle = '#f87171'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⚠ DANGER PERIMETER', cx, cy)
    }
  }

  const handleCanvasClick = (e) => {
    if (!drawing || disabled) return
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    const newPts = [...localPts, { x: +x.toFixed(1), y: +y.toFixed(1) }]
    setLocalPts(newPts)
  }

  const commitZone = () => {
    setDrawing(false)
    onZoneChange(localPts)
  }

  const applyPreset = (zone) => {
    setLocalPts(zone)
    onZoneChange(zone)
    setDrawing(false)
  }

  const clearZone = () => {
    setLocalPts([])
    onZoneChange([])
    setDrawing(false)
  }

  return (
    <div className="glass-card p-5 space-y-4 border border-navy-700/80 shadow-2xl relative">
      <div className="flex items-center justify-between">
        <p className="section-title">
          <MapPin className="w-3.5 h-3.5 text-alert-400" />
          <span>Danger Zone Polygon Geometry</span>
        </p>
        <span className="badge bg-alert-500/15 text-alert-300 border border-alert-500/30 text-[11px] font-mono">
          {localPts.length} Node{localPts.length !== 1 ? 's' : ''} Active
        </span>
      </div>

      {imagePreviewUrl ? (
        <div className="space-y-3">
          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_ZONE)}
              disabled={disabled || drawing}
              className="py-1 px-2 rounded-lg text-[10px] font-mono bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 hover:border-slate-500 transition-all text-center"
            >
              Center Track (Std)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(WIDE_ZONE)}
              disabled={disabled || drawing}
              className="py-1 px-2 rounded-lg text-[10px] font-mono bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 hover:border-slate-500 transition-all text-center"
            >
              Wide Corridor
            </button>
            <button
              type="button"
              onClick={() => applyPreset(NARROW_ZONE)}
              disabled={disabled || drawing}
              className="py-1 px-2 rounded-lg text-[10px] font-mono bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 hover:border-slate-500 transition-all text-center"
            >
              Narrow Gauge
            </button>
          </div>

          {/* Interactive Canvas Overlay */}
          <div className="relative rounded-xl overflow-hidden border border-navy-700/80 bg-navy-950/60 shadow-inner group">
            {drawing && (
              <div className="absolute top-2 left-2 z-10 bg-alert-500/90 text-white text-[11px] font-mono px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 animate-pulse">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Click image to plot polygon nodes</span>
              </div>
            )}

            <img
              ref={imageRef}
              src={imagePreviewUrl}
              alt="Zone preview"
              className="w-full object-contain max-h-64"
              onLoad={() => { setImgLoaded(true); drawCanvas() }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ cursor: drawing ? 'crosshair' : 'default' }}
              onClick={handleCanvasClick}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {!drawing ? (
                <button
                  id="draw-zone-btn"
                  className="btn-secondary text-xs py-1.5 px-3 bg-navy-800 hover:bg-navy-750 text-cyan-300 border-cyan-500/30"
                  onClick={() => { setLocalPts([]); setDrawing(true) }}
                  disabled={disabled}
                >
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Draw Custom Zone</span>
                </button>
              ) : (
                <button
                  id="confirm-zone-btn"
                  className="btn-primary text-xs py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  onClick={commitZone}
                  disabled={localPts.length < 3}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lock Zone ({localPts.length} pts)</span>
                </button>
              )}

              <button
                className="btn-secondary text-xs py-1.5 px-3"
                onClick={() => applyPreset(DEFAULT_ZONE)}
                disabled={disabled}
                title="Reset to standard center track"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <button
              className="btn-secondary text-xs py-1.5 px-2.5 text-slate-400 hover:text-red-400 hover:border-red-500/40"
              onClick={clearZone}
              disabled={disabled}
              title="Disable danger zone filter"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-navy-950/40 border border-navy-800/80">
          <Crosshair className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-300">Danger Zone Configurator Ready</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
            Select a sample benchmark scenario or upload a railway track photo to customize the collision danger polygon.
          </p>
        </div>
      )}
    </div>
  )
}
