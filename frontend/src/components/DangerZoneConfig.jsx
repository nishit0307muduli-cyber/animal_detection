import { useRef, useEffect, useState } from 'react'
import { MapPin, Trash2, Check, ZapOff } from 'lucide-react'

const DEFAULT_ZONE = [
  { x: 0,   y: 35 },
  { x: 100, y: 35 },
  { x: 100, y: 65 },
  { x: 0,   y: 65 },
]

export default function DangerZoneConfig({ imagePreviewUrl, dangerZone, onZoneChange, disabled }) {
  const canvasRef   = useRef(null)
  const imageRef    = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [localPts, setLocalPts] = useState(dangerZone ?? DEFAULT_ZONE)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Sync external zone
  useEffect(() => { setLocalPts(dangerZone ?? DEFAULT_ZONE) }, [dangerZone])

  // Redraw canvas whenever points or image change
  useEffect(() => {
    if (!imgLoaded) return
    drawCanvas()
  }, [localPts, imgLoaded])

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

    // Fill
    ctx.beginPath()
    ctx.moveTo(pxPts[0].x, pxPts[0].y)
    pxPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle   = 'rgba(239,68,68,0.18)'
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth   = 2
    ctx.fill()
    ctx.stroke()

    // Vertices
    pxPts.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
      ctx.fillStyle   = '#ef4444'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 2
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle  = '#fff'
      ctx.font       = 'bold 10px Inter'
      ctx.textAlign  = 'center'
      ctx.fillText(i + 1, p.x, p.y + 4)
    })

    // Label
    if (localPts.length >= 3) {
      const cx = pxPts.reduce((s, p) => s + p.x, 0) / pxPts.length
      const cy = pxPts.reduce((s, p) => s + p.y, 0) / pxPts.length
      ctx.fillStyle  = 'rgba(239,68,68,0.9)'
      ctx.font       = 'bold 11px Inter'
      ctx.textAlign  = 'center'
      ctx.fillText('DANGER ZONE', cx, cy)
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

  const resetZone = () => {
    setLocalPts(DEFAULT_ZONE)
    onZoneChange(DEFAULT_ZONE)
    setDrawing(false)
  }

  const clearZone = () => {
    setLocalPts([])
    onZoneChange([])
    setDrawing(false)
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-title flex items-center gap-2 mb-0">
          <MapPin className="w-3.5 h-3.5 text-alert-400" /> Danger Zone Configuration
        </p>
        <span className="badge bg-alert-500/15 text-alert-400 text-xs">
          {localPts.length} pts
        </span>
      </div>

      {imagePreviewUrl ? (
        <>
          <p className="text-xs text-slate-500">
            {drawing
              ? '🖱️ Click on the image to add polygon vertices. Click "Confirm" when done.'
              : 'Enable "Draw Zone" to redefine the danger area.'}
          </p>
          <div className="relative rounded-xl overflow-hidden border border-navy-600">
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
          <div className="flex flex-wrap gap-2">
            {!drawing ? (
              <button
                id="draw-zone-btn"
                className="btn-secondary text-xs py-1.5"
                onClick={() => { setLocalPts([]); setDrawing(true) }}
                disabled={disabled}
              >
                <MapPin className="w-3.5 h-3.5" /> Draw Zone
              </button>
            ) : (
              <button
                id="confirm-zone-btn"
                className="btn-primary text-xs py-1.5"
                onClick={commitZone}
                disabled={localPts.length < 3}
              >
                <Check className="w-3.5 h-3.5" /> Confirm ({localPts.length} pts)
              </button>
            )}
            <button className="btn-secondary text-xs py-1.5" onClick={resetZone} disabled={disabled}>
              ↺ Default Zone
            </button>
            <button className="btn-secondary text-xs py-1.5" onClick={clearZone} disabled={disabled}>
              <Trash2 className="w-3.5 h-3.5" /> No Zone
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 text-slate-600 py-4">
          <ZapOff className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Upload an image first to configure the danger zone.</p>
        </div>
      )}
    </div>
  )
}
