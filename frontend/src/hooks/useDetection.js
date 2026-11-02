import { useState, useCallback, useRef } from 'react'
import { detectImage, detectVideo, pollJob, getResults } from '../services/api'

const POLL_INTERVAL = 1500   // ms

export function useDetection() {
  const [status,        setStatus]      = useState('idle')  // idle|uploading|processing|completed|error
  const [imageResult,   setImageResult] = useState(null)
  const [videoJob,      setVideoJob]    = useState(null)    // { jobId, progress, status, message }
  const [videoResult,   setVideoResult] = useState(null)
  const [error,         setError]       = useState(null)
  const [uploadPct,     setUploadPct]   = useState(0)
  const pollRef = useRef(null)

  const _stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const _startPoll = useCallback((jobId) => {
    _stopPoll()
    pollRef.current = setInterval(async () => {
      try {
        const { data: jobStatus } = await pollJob(jobId)
        setVideoJob((prev) => ({ ...prev, ...jobStatus }))

        if (jobStatus.status === 'completed') {
          _stopPoll()
          const { data: result } = await getResults(jobId)
          setVideoResult(result)
          setStatus('completed')
        } else if (jobStatus.status === 'error') {
          _stopPoll()
          setError(jobStatus.error || 'Video processing failed.')
          setStatus('error')
        }
      } catch (e) {
        // Keep polling; transient network errors happen
        console.warn('Poll error:', e.message)
      }
    }, POLL_INTERVAL)
  }, [])

  const runImageDetection = useCallback(async (file, settings) => {
    _stopPoll()
    setStatus('uploading')
    setError(null)
    setImageResult(null)
    setVideoResult(null)
    setVideoJob(null)
    try {
      const { data } = await detectImage(file, settings)
      setImageResult(data)
      setStatus('completed')
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Detection failed.'
      setError(msg)
      setStatus('error')
    }
  }, [])

  const runVideoDetection = useCallback(async (file, settings) => {
    _stopPoll()
    setStatus('uploading')
    setError(null)
    setImageResult(null)
    setVideoResult(null)
    setUploadPct(0)
    try {
      const { data } = await detectVideo(file, settings, setUploadPct)
      const jobId = data.job_id
      setVideoJob({ jobId, status: 'queued', progress: 0, message: 'Queued…' })
      setStatus('processing')
      _startPoll(jobId)
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Upload failed.'
      setError(msg)
      setStatus('error')
    }
  }, [_startPoll])

  const reset = useCallback(() => {
    _stopPoll()
    setStatus('idle')
    setError(null)
    setImageResult(null)
    setVideoResult(null)
    setVideoJob(null)
    setUploadPct(0)
  }, [])

  return {
    status, error, uploadPct,
    imageResult, videoJob, videoResult,
    runImageDetection, runVideoDetection, reset,
  }
}
