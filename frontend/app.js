/* ─────────────────────────────────────────────────────────────
   RailGuard AI — app.js
   Handles: image upload, video upload, webcam capture,
            WebSocket streaming, history, stats, alerts
   ───────────────────────────────────────────────────────────── */

const API = '';          // same origin; set to 'http://localhost:8000' if needed
const WS_BASE = `ws://${location.host}`;

// ─── State ──────────────────────────────────────────────────
let currentMode   = 'image';
let wsStream      = null;   // WebSocket for live camera
let wsBoard       = null;   // WebSocket for dashboard alerts
let cameraStream  = null;   // MediaStream
let captureTimer  = null;   // setInterval handle
let frameCount    = 0;
let lastFrameTime = Date.now();
let totalAlerts   = 0;
let historyItems  = [];

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  connectDashboardWS();
  refreshStats();
  loadHistory();
  startUptimeTick();
  makeScanActive();
});

function makeScanActive() {
  // CSS trick: show scan-line once video starts
  document.querySelector('.scan-line').style.opacity = '0';
}

// ═══════════════════════════════════════════════════════════
// Mode Switching
// ═══════════════════════════════════════════════════════════
function switchMode(mode) {
  if (currentMode === mode) return;
  if (currentMode === 'camera') stopCamera();

  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mode-view').forEach(v => v.classList.remove('active'));

  document.getElementById(`mode${capitalize(mode)}`).classList.add('active');
  document.getElementById(`${mode}Mode`).classList.add('active');
}

// ═══════════════════════════════════════════════════════════
// IMAGE DETECTION
// ═══════════════════════════════════════════════════════════
function handleImageDrop(e) {
  e.preventDefault();
  document.getElementById('imageDropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processImage(file);
}

function handleImageFile(e) {
  const file = e.target.files[0];
  if (file) processImage(file);
}

async function processImage(file) {
  const originalURL = URL.createObjectURL(file);
  document.getElementById('imgOriginal').src = originalURL;
  document.getElementById('imageResult').classList.remove('hidden');
  document.getElementById('imageDetectionList').innerHTML = '';

  showLoading('Analyzing image…');
  const conf = document.getElementById('confSlider').value / 100;

  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('conf', conf);

    const resp = await fetch(`${API}/api/detect/image?conf=${conf}`, {
      method: 'POST', body: fd,
    });
    const data = await resp.json();
    hideLoading();

    // Show annotated
    document.getElementById('imgAnnotated').src = `data:image/jpeg;base64,${data.annotated_image}`;

    // Detection chips
    const listEl = document.getElementById('imageDetectionList');
    if (data.detections.length === 0) {
      listEl.innerHTML = '<span class="det-chip none">✅ No animals detected</span>';
    } else {
      playAlert();
      showToast(`⚠️ ${data.count} animal(s) detected on track!`, 'alert');
      data.detections.forEach(det => {
        listEl.innerHTML += `
          <span class="det-chip">
            🐾 ${det.label} · ${det.confidence}%
          </span>`;
      });
      addToHistory(data.detections, 'image', file.name);
      updateStats();
    }
  } catch (err) {
    hideLoading();
    showToast('❌ Detection failed. Is the server running?', 'alert');
    console.error(err);
  }
}

// ═══════════════════════════════════════════════════════════
// VIDEO DETECTION
// ═══════════════════════════════════════════════════════════
function handleVideoDrop(e) {
  e.preventDefault();
  document.getElementById('videoDropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) processVideo(file);
}

function handleVideoFile(e) {
  const file = e.target.files[0];
  if (file) processVideo(file);
}

async function processVideo(file) {
  const conf = document.getElementById('confSlider').value / 100;
  document.getElementById('videoProgress').classList.remove('hidden');
  document.getElementById('videoResult').classList.add('hidden');
  document.getElementById('progressBar').style.width = '5%';
  document.getElementById('progressPct').textContent = '5%';

  // Fake progress animation while uploading
  let fakePct = 5;
  const fakeInterval = setInterval(() => {
    fakePct = Math.min(fakePct + Math.random() * 4, 85);
    document.getElementById('progressBar').style.width = fakePct + '%';
    document.getElementById('progressPct').textContent = Math.round(fakePct) + '%';
  }, 400);

  try {
    const fd = new FormData();
    fd.append('file', file);
    const resp = await fetch(`${API}/api/detect/video?conf=${conf}&sample_rate=5`, {
      method: 'POST', body: fd,
    });
    const data = await resp.json();
    clearInterval(fakeInterval);

    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressPct').textContent = '100%';
    await sleep(400);
    document.getElementById('videoProgress').classList.add('hidden');

    // Summary
    const summaryEl = document.getElementById('videoSummary');
    summaryEl.innerHTML = `
      <div class="vs-item"><div class="vs-val">${data.total_frames}</div><div class="vs-key">Total Frames</div></div>
      <div class="vs-item"><div class="vs-val">${data.sampled_frames}</div><div class="vs-key">Sampled</div></div>
      <div class="vs-item"><div class="vs-val" style="color:${data.animal_frames > 0 ? 'var(--red)' : 'var(--green)'}">${data.animal_frames}</div><div class="vs-key">Animal Frames</div></div>
    `;

    // Timeline
    const timelineEl = document.getElementById('videoTimeline');
    timelineEl.innerHTML = '';
    if (data.frame_results.length === 0) {
      timelineEl.innerHTML = '<p style="color:var(--green);text-align:center;padding:1rem;">✅ No animals detected in video</p>';
    } else {
      playAlert();
      data.frame_results.forEach(fr => {
        const chips = fr.detections.map(d =>
          `<span class="tl-chip">🐾 ${d.label} ${d.confidence}%</span>`
        ).join('');
        timelineEl.innerHTML += `
          <div class="timeline-item">
            <span class="tl-time">⏱ ${fr.timestamp_sec}s</span>
            <div class="tl-detections">${chips}</div>
          </div>`;
      });
      // Add to history
      data.frame_results.forEach(fr =>
        fr.detections.forEach(d =>
          historyItems.unshift({...d, source:'video', filename:file.name})
        )
      );
      renderHistory();
    }

    document.getElementById('videoResult').classList.remove('hidden');
    showToast(`🎬 Video analysis complete — ${data.animal_frames} alert frames`, data.animal_frames > 0 ? 'alert' : 'success');
    updateStats();
  } catch (err) {
    clearInterval(fakeInterval);
    document.getElementById('videoProgress').classList.add('hidden');
    showToast('❌ Video processing failed.', 'alert');
    console.error(err);
  }
}

// ═══════════════════════════════════════════════════════════
// CAMERA / LIVE DETECTION
// ═══════════════════════════════════════════════════════════
async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      audio: false,
    });
    const video = document.getElementById('localVideo');
    video.srcObject = cameraStream;
    document.getElementById('camStartBtn').classList.add('hidden');
    document.getElementById('camStopBtn').classList.remove('hidden');
    document.querySelector('.scan-line').style.opacity = '0.6';

    // Open WebSocket for frames
    connectStreamWS();
    captureTimer = setInterval(captureAndSend, 500); // 2 fps to server
  } catch (err) {
    showToast('❌ Camera access denied or unavailable.', 'alert');
    console.error(err);
  }
}

function stopCamera() {
  clearInterval(captureTimer);
  captureTimer = null;
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('annotatedFeed').src = '';
  document.getElementById('animalAlert').classList.add('hidden');
  document.querySelector('.scan-line').style.opacity = '0';
  document.getElementById('camStartBtn').classList.remove('hidden');
  document.getElementById('camStopBtn').classList.add('hidden');
  document.getElementById('camFPS').textContent = '—';
  document.getElementById('camLatency').textContent = '—';
  if (wsStream) { wsStream.close(); wsStream = null; }
}

function connectStreamWS() {
  if (wsStream) { wsStream.close(); }
  wsStream = new WebSocket(`${WS_BASE}/ws/stream`);
  wsStream.binaryType = 'arraybuffer';

  wsStream.onopen = () => console.log('Stream WS connected');
  wsStream.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    handleFrameResult(msg);
  };
  wsStream.onerror = () => { console.error('Stream WS error'); wsStream = null; };
  wsStream.onclose = () => { wsStream = null; };
}

async function captureAndSend() {
  if (!wsStream || wsStream.readyState !== WebSocket.OPEN) return;
  const video = document.getElementById('localVideo');
  const canvas = document.getElementById('captureCanvas');
  if (video.readyState < 2) return;

  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const t0 = Date.now();
  canvas.toBlob(blob => {
    if (!blob || !wsStream || wsStream.readyState !== WebSocket.OPEN) return;
    wsStream._t0 = t0;
    wsStream.send(blob);
  }, 'image/jpeg', 0.8);
}

function handleFrameResult(msg) {
  if (msg.type !== 'frame_result') return;

  // Latency
  const latency = wsStream?._t0 ? Date.now() - wsStream._t0 : 0;
  document.getElementById('camLatency').textContent = latency + 'ms';

  // FPS
  frameCount++;
  const now = Date.now();
  const elapsed = (now - lastFrameTime) / 1000;
  if (elapsed >= 1) {
    document.getElementById('camFPS').textContent = Math.round(frameCount / elapsed);
    frameCount = 0;
    lastFrameTime = now;
  }

  // Show annotated frame
  document.getElementById('annotatedFeed').src = `data:image/jpeg;base64,${msg.annotated_image}`;

  // Alert
  const alertEl = document.getElementById('animalAlert');
  if (msg.has_animal) {
    alertEl.classList.remove('hidden');
    const animals = msg.detections.map(d => d.label).join(', ');
    document.getElementById('alertText').textContent = `⚠️ ANIMAL ON TRACK: ${animals.toUpperCase()}`;
    playAlert();
    msg.detections.forEach(d => historyItems.unshift({...d, source:'camera'}));
    if (historyItems.length % 5 === 0) renderHistory(); // throttle re-render
    updateStats();
  } else {
    alertEl.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD WebSocket (for passive alerts from image/video)
// ═══════════════════════════════════════════════════════════
function connectDashboardWS() {
  wsBoard = new WebSocket(`${WS_BASE}/ws/dashboard`);
  wsBoard.onopen = () => {
    document.getElementById('statusDot').className   = 'status-dot online';
    document.getElementById('statusLabel').textContent = 'System Active';
  };
  wsBoard.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.type === 'alert') {
      showToast(`🚨 Alert: ${msg.detections.map(d=>d.label).join(', ')} detected!`, 'alert');
      updateStats();
      loadHistory();
    } else if (msg.type === 'stats_reset') {
      totalAlerts = 0;
      historyItems = [];
      renderHistory();
      updateStats();
    }
  };
  wsBoard.onerror = wsBoard.onclose = () => {
    document.getElementById('statusDot').className   = 'status-dot offline';
    document.getElementById('statusLabel').textContent = 'Disconnected';
    // Reconnect after 3s
    setTimeout(connectDashboardWS, 3000);
  };
}

// ═══════════════════════════════════════════════════════════
// STATS & HISTORY
// ═══════════════════════════════════════════════════════════
const ANIMAL_EMOJIS = {
  cow:'🐄', bird:'🦅', cat:'🐈', dog:'🐕', horse:'🐴',
  sheep:'🐑', elephant:'🐘', bear:'🐻', zebra:'🦓', giraffe:'🦒',
};

async function refreshStats() {
  try {
    const resp = await fetch(`${API}/api/stats`);
    const data = await resp.json();
    totalAlerts = data.total_detections;

    document.getElementById('statTotal').textContent = data.total_detections;
    document.getElementById('navTotal').textContent  = data.total_detections;

    // Animal breakdown
    const countsEl = document.getElementById('animalCounts');
    countsEl.innerHTML = '';
    Object.entries(data.detections_by_animal).forEach(([animal, cnt]) => {
      countsEl.innerHTML += `
        <div class="animal-row">
          <span class="animal-row-name">${ANIMAL_EMOJIS[animal] || '🐾'} ${animal}</span>
          <span class="animal-row-count">${cnt}</span>
        </div>`;
    });

    // Uptime
    const upEl = document.getElementById('navUptime');
    upEl.textContent = formatUptime(data.uptime_seconds);

    document.getElementById('historyBadge').textContent = data.history_count;
  } catch (_) {}
}

function updateStats() { refreshStats(); }

async function loadHistory() {
  try {
    const resp = await fetch(`${API}/api/history?limit=50`);
    const data = await resp.json();
    historyItems = data.history;
    renderHistory();
  } catch (_) {}
}

function renderHistory() {
  const el = document.getElementById('historyList');
  if (!historyItems.length) {
    el.innerHTML = `<div class="history-empty">
      <div class="empty-icon">🦎</div>
      <p>No detections yet.<br/>Upload an image or start the camera.</p>
    </div>`;
    return;
  }
  document.getElementById('historyBadge').textContent = historyItems.length;
  el.innerHTML = historyItems.slice(0, 50).map(item => `
    <div class="history-item">
      <div class="hi-top">
        <span class="hi-animal">${ANIMAL_EMOJIS[item.label] || '🐾'} ${item.label}</span>
        <span class="hi-conf">${item.confidence}%</span>
      </div>
      <div class="hi-meta">
        <span class="hi-source">${item.source}</span>
        <span>${formatTime(item.timestamp)}</span>
        ${item.filename ? `<span>${truncate(item.filename, 16)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function addToHistory(detections, source, filename) {
  detections.forEach(d => historyItems.unshift({...d, source, filename}));
  renderHistory();
}

async function clearHistory() {
  await fetch(`${API}/api/history`, {method:'DELETE'});
  historyItems = [];
  renderHistory();
  document.getElementById('statTotal').textContent = '0';
  document.getElementById('navTotal').textContent  = '0';
  document.getElementById('animalCounts').innerHTML = '';
  showToast('🗑️ History cleared', 'success');
}

// ═══════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════
function showLoading(text='Processing…') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

let toastTimeout;
function showToast(msg, type='success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type === 'alert' ? 'alert-toast' : 'success-toast'}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 4000);
}

let alertCooldown = false;
function playAlert() {
  if (alertCooldown) return;
  alertCooldown = true;
  setTimeout(() => alertCooldown = false, 3000);

  // Web Audio API beep
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.30].forEach((delay, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 2 ? 880 : 660;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.14);
    });
  } catch (_) {}
}

function startUptimeTick() {
  setInterval(refreshStats, 10000);
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}m`;
  return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString();
  } catch { return iso; }
}

function truncate(str, n) { return str.length > n ? str.slice(0, n) + '…' : str; }
function capitalize(s)    { return s.charAt(0).toUpperCase() + s.slice(1); }
function sleep(ms)        { return new Promise(r => setTimeout(r, ms)); }
