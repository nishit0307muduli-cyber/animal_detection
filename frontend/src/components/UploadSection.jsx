import { useRef, useState } from 'react'
import { Upload, Image, Film, FolderOpen } from 'lucide-react'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.bmp'
const VIDEO_ACCEPT = '.mp4,.avi,.mov,.mkv'

export default function UploadSection({ activeTab, onTabChange, onFileSelect, disabled }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const accept = activeTab === 'image' ? IMAGE_ACCEPT : VIDEO_ACCEPT

  const handleFile = (file) => {
    if (!file) return
    onFileSelect(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="card p-5 space-y-4">
      <p className="section-title">Upload File</p>

      {/* Tabs */}
      <div className="flex gap-2 bg-navy-900 p-1 rounded-xl w-fit">
        <button
          id="tab-image"
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => onTabChange('image')}
          disabled={disabled}
        >
          <span className="flex items-center gap-2"><Image className="w-4 h-4" />Image</span>
        </button>
        <button
          id="tab-video"
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => onTabChange('video')}
          disabled={disabled}
        >
          <span className="flex items-center gap-2"><Film className="w-4 h-4" />Video</span>
        </button>
      </div>

      {/* Drop zone */}
      <div
        id="drop-zone"
        className={`drop-zone h-44 ${dragging ? 'active' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
          ${dragging ? 'bg-rail-500/30' : 'bg-navy-700'}`}>
          <Upload className={`w-6 h-6 ${dragging ? 'text-rail-400' : 'text-slate-500'}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            {dragging ? 'Release to upload' : 'Drag & drop your file here'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'image'
              ? 'Supports JPG, JPEG, PNG, WEBP, BMP'
              : 'Supports MP4, AVI, MOV, MKV'}
          </p>
        </div>
        <button
          id="browse-btn"
          type="button"
          className="btn-secondary text-sm py-1.5"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          disabled={disabled}
        >
          <FolderOpen className="w-4 h-4" /> Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
