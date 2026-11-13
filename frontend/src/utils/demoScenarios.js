// Preset Interactive Demonstrations for Railway Animal Detection
// Allows instant testing of all system capabilities without uploading files.

function createTrackSvg({ animals = [], dangerZone = true }) {
  // SVG drawing of realistic perspective railway track with optional animal silhouette and bounding boxes
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="60%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0b1329" />
      </linearGradient>
      <linearGradient id="railGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#64748b" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Sky -->
    <rect width="800" height="260" fill="url(#sky)" />

    <!-- Horizon Mountains / Forest -->
    <polygon points="0,260 120,220 280,250 400,210 560,245 700,215 800,260" fill="#090d16" opacity="0.8" />
    <polygon points="0,260 80,235 220,255 350,230 480,250 640,225 800,260" fill="#111827" opacity="0.9" />

    <!-- Distant Signal Lights -->
    <circle cx="430" cy="230" r="3" fill="#22c55e" filter="url(#glow)" />
    <line x1="430" y1="230" x2="430" y2="260" stroke="#475569" stroke-width="2" />

    <!-- Ground & Ballast Bed -->
    <rect y="260" width="800" height="240" fill="url(#ground)" />
    <!-- Ballast Bed Trapezoid -->
    <polygon points="360,260 440,260 680,500 120,500" fill="#1e2433" stroke="#334155" stroke-width="1" />

    <!-- Sleepers (Ties) in perspective -->
    <line x1="375" y1="270" x2="425" y2="270" stroke="#374151" stroke-width="3" />
    <line x1="365" y1="285" x2="435" y2="285" stroke="#374151" stroke-width="4" />
    <line x1="352" y1="305" x2="448" y2="305" stroke="#374151" stroke-width="5" />
    <line x1="335" y1="330" x2="465" y2="330" stroke="#475569" stroke-width="6" />
    <line x1="312" y1="360" x2="488" y2="360" stroke="#475569" stroke-width="7" />
    <line x1="282" y1="400" x2="518" y2="400" stroke="#4b5563" stroke-width="9" />
    <line x1="242" y1="450" x2="558" y2="450" stroke="#4b5563" stroke-width="11" />
    <line x1="190" y1="510" x2="610" y2="510" stroke="#4b5563" stroke-width="14" />

    <!-- Rails with metallic specular highlights -->
    <!-- Left Rail -->
    <line x1="380" y1="260" x2="220" y2="500" stroke="url(#railGlow)" stroke-width="5" />
    <line x1="379" y1="260" x2="216" y2="500" stroke="#94a3b8" stroke-width="2" />
    <!-- Right Rail -->
    <line x1="420" y1="260" x2="580" y2="500" stroke="url(#railGlow)" stroke-width="5" />
    <line x1="421" y1="260" x2="584" y2="500" stroke="#94a3b8" stroke-width="2" />

    <!-- Catenary / Overhead Line Poles -->
    <line x1="160" y1="200" x2="160" y2="420" stroke="#475569" stroke-width="4" />
    <line x1="140" y1="200" x2="180" y2="200" stroke="#64748b" stroke-width="3" />
    <line x1="640" y1="200" x2="640" y2="420" stroke="#475569" stroke-width="4" />
    <line x1="620" y1="200" x2="660" y2="200" stroke="#64748b" stroke-width="3" />
    <path d="M 160 200 Q 400 230 640 200" fill="none" stroke="#64748b" stroke-width="1.5" />

    ${dangerZone ? `
    <!-- Danger Corridor Overlay -->
    <polygon points="360,260 440,260 620,460 180,460" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.4)" stroke-dasharray="6,4" stroke-width="2" />
    <text x="400" y="380" fill="rgba(239, 68, 68, 0.85)" font-family="Inter, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="2">TRACK DANGER ZONE</text>
    ` : ''}

    ${animals.map(a => `
      <!-- ${a.label} Silhouette -->
      <g transform="translate(${a.x}, ${a.y}) scale(${a.scale || 1})">
        ${a.svgContent}
      </g>
    `).join('')}

    <!-- Visual HUD Stamp -->
    <rect x="20" y="20" width="180" height="46" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(71, 85, 105, 0.6)" stroke-width="1" />
    <circle cx="36" cy="35" r="4" fill="#38bdf8" filter="url(#glow)" />
    <text x="50" y="38" fill="#e2e8f0" font-family="monospace" font-size="11" font-weight="bold">RAIL-CAM 04</text>
    <text x="50" y="54" fill="#94a3b8" font-family="monospace" font-size="9">KM 142.8 • UP-LINE</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Animal SVG representations
const ELEPHANT_SVG = `
  <path d="M 40 45 C 30 40 10 40 5 55 C 0 70 5 95 10 110 L 15 110 C 18 90 20 80 25 80 C 28 80 28 100 30 110 L 38 110 C 38 90 45 80 55 80 L 60 110 L 68 110 C 68 95 72 80 78 80 L 82 110 L 90 110 C 92 85 95 70 85 55 C 75 40 55 45 40 45 Z" fill="#475569" stroke="#94a3b8" stroke-width="1.5" />
  <circle cx="20" cy="55" r="2.5" fill="#f8fafc" />
  <path d="M 8 75 Q -5 95 2 115 Q 8 118 10 110 Q 5 95 12 78 Z" fill="#64748b" />
`

const COW_SVG = `
  <path d="M 20 30 C 15 25 5 25 2 35 C -2 45 3 60 5 75 L 10 75 C 12 60 14 55 20 55 C 25 55 25 65 28 75 L 35 75 C 36 60 40 55 50 55 L 53 75 L 60 75 C 60 60 62 50 65 40 C 60 30 45 30 35 30 Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.5" />
  <path d="M 28 35 Q 35 32 40 42 Q 32 48 28 35 Z" fill="#1e293b" />
  <path d="M 12 32 Q 5 28 2 30 Q 3 36 8 36 Z" fill="#94a3b8" />
  <circle cx="8" cy="35" r="1.5" fill="#0f172a" />
`

const DOG_SVG = `
  <path d="M 15 20 C 10 15 5 18 3 24 C 1 30 4 45 5 55 L 9 55 C 10 45 12 40 18 40 C 22 40 22 48 24 55 L 29 55 C 30 44 32 40 40 40 L 42 55 L 47 55 C 47 42 48 32 45 28 C 38 22 28 22 22 22 Z" fill="#d97706" stroke="#b45309" stroke-width="1.5" />
  <polygon points="12,18 16,10 19,17" fill="#92400e" />
  <path d="M 44 30 Q 52 20 48 18" stroke="#d97706" stroke-width="2.5" fill="none" stroke-linecap="round" />
`

export const DEMO_SCENARIOS = [
  {
    id: 'demo-elephant',
    title: 'Elephant Herd Crossing',
    subtitle: 'Corridor Breach • High Danger',
    species: 'Elephant',
    icon: '🐘',
    riskLevel: 'danger',
    alertMessage: '⚠️ CRITICAL ALERT: Elephant detected directly within the track danger corridor! Automatic train approach warning triggered.',
    imageUrl: createTrackSvg({
      animals: [
        { label: 'elephant', x: 310, y: 270, scale: 1.4, svgContent: ELEPHANT_SVG },
        { label: 'elephant', x: 470, y: 260, scale: 1.1, svgContent: ELEPHANT_SVG },
      ],
      dangerZone: true,
    }),
    result: {
      status: 'completed',
      filename: 'sample_elephant_corridor_km142.jpg',
      count: 2,
      alert_level: 'danger',
      alert_message: 'CRITICAL ALERT: Elephant detected directly within the track danger corridor at KM 142.8!',
      image_size: { width: 800, height: 500 },
      processing_time: 0.042,
      confidence_threshold: 0.40,
      detections: [
        {
          label: 'elephant',
          confidence: 0.94,
          in_danger_zone: true,
          bbox: { x1: 300, y1: 290, x2: 440, y2: 440 }
        },
        {
          label: 'elephant',
          confidence: 0.88,
          in_danger_zone: true,
          bbox: { x1: 460, y1: 280, x2: 575, y2: 410 }
        }
      ]
    }
  },
  {
    id: 'demo-cattle',
    title: 'Cattle Grazing Approach',
    subtitle: 'Perimeter Warning • Near Rails',
    species: 'Cow',
    icon: '🐄',
    riskLevel: 'warning',
    alertMessage: '🔔 WARNING: Cattle detected in track proximity (approach embankment). Monitor clearance.',
    imageUrl: createTrackSvg({
      animals: [
        { label: 'cow', x: 190, y: 310, scale: 1.1, svgContent: COW_SVG },
        { label: 'cow', x: 130, y: 300, scale: 0.9, svgContent: COW_SVG }
      ],
      dangerZone: true,
    }),
    result: {
      status: 'completed',
      filename: 'sample_cattle_crossing_junction.jpg',
      count: 2,
      alert_level: 'warning',
      alert_message: 'WARNING: 2 cows detected adjacent to track embankment at Section B.',
      image_size: { width: 800, height: 500 },
      processing_time: 0.038,
      confidence_threshold: 0.40,
      detections: [
        {
          label: 'cow',
          confidence: 0.87,
          in_danger_zone: false,
          bbox: { x1: 180, y1: 320, x2: 260, y2: 410 }
        },
        {
          label: 'cow',
          confidence: 0.79,
          in_danger_zone: false,
          bbox: { x1: 125, y1: 310, x2: 190, y2: 385 }
        }
      ]
    }
  },
  {
    id: 'demo-dog',
    title: 'Stray Dog on Track Bed',
    subtitle: 'Ballast Center • Zone Hazard',
    species: 'Dog',
    icon: '🐕',
    riskLevel: 'danger',
    alertMessage: '⚠️ DANGER: Domestic animal (Dog) detected on center line between rails.',
    imageUrl: createTrackSvg({
      animals: [
        { label: 'dog', x: 380, y: 340, scale: 1.0, svgContent: DOG_SVG }
      ],
      dangerZone: true,
    }),
    result: {
      status: 'completed',
      filename: 'sample_station_approach_dog.jpg',
      count: 1,
      alert_level: 'danger',
      alert_message: 'DANGER: Stray dog detected in center ballast zone.',
      image_size: { width: 800, height: 500 },
      processing_time: 0.031,
      confidence_threshold: 0.40,
      detections: [
        {
          label: 'dog',
          confidence: 0.91,
          in_danger_zone: true,
          bbox: { x1: 370, y1: 340, x2: 430, y2: 405 }
        }
      ]
    }
  },
  {
    id: 'demo-clear',
    title: 'Clear High-Speed Track',
    subtitle: 'All Clear • Safe Passage',
    species: 'None',
    icon: '🛤️',
    riskLevel: 'none',
    alertMessage: '✅ TRACK CLEAR: High-speed corridor verified free of animal obstructions.',
    imageUrl: createTrackSvg({
      animals: [],
      dangerZone: true,
    }),
    result: {
      status: 'completed',
      filename: 'sample_express_corridor_clear.jpg',
      count: 0,
      alert_level: 'none',
      alert_message: 'TRACK CLEAR: Zero animal obstructions detected across all track zones.',
      image_size: { width: 800, height: 500 },
      processing_time: 0.029,
      confidence_threshold: 0.40,
      detections: []
    }
  }
]
