import { ref, type Ref } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import { formatTime } from '../utils/helpers'

// We maintain a single WaveSurfer instance in a shared/singleton-like manner
// so different components (AudioPlayer & App / Lyric list) can reference the exact same player and state.
const wavesurferInstance = ref<WaveSurfer | null>(null)
const isPlaying = ref(false)
const currentTimeText = ref('0:00')
const durationText = ref('0:00')
const hasAudio = ref(false)
const zoomLevel = ref(50)
const playbackSpeed = ref('1')

export function useWaveSurfer() {
  const initWaveSurfer = (containerId: string) => {
    if (wavesurferInstance.value) {
      wavesurferInstance.value.destroy()
    }

    const ws = WaveSurfer.create({
      container: containerId,
      waveColor: '#9ca3af',
      progressColor: '#fc792b',
      height: 50,
      dragToSeek: false,
      hideScrollbar: true,
      cursorWidth: 2,
      barWidth: 4,
      barGap: 2,
      barRadius: 99,
      minPxPerSec: 50,
    })

    wavesurferInstance.value = ws

    // Apply current zoom level and playback rate
    try {
      ws.zoom(zoomLevel.value)
    } catch (e) {
      // safe fallback if no audio loaded yet
      console.log(e)
    }
    try {
      ws.setPlaybackRate(parseFloat(playbackSpeed.value))
    } catch (e) {
      // safe fallback if no audio loaded yet
      console.log(e)
    }

    // Set up event listeners
    ws.on('timeupdate', () => {
      currentTimeText.value = formatTime(ws.getCurrentTime(), false)
    })

    ws.on('decode', () => {
      durationText.value = formatTime(ws.getDuration(), false)
    })

    ws.on('play', () => {
      isPlaying.value = true
    })

    ws.on('pause', () => {
      isPlaying.value = false
    })

    return ws
  }

  const loadAudio = (file: File) => {
    if (!wavesurferInstance.value) return
    const audioURL = URL.createObjectURL(file)
    wavesurferInstance.value.load(audioURL)
    hasAudio.value = true
  }

  const removeAudio = () => {
    if (wavesurferInstance.value) {
      wavesurferInstance.value.empty()
    }
    hasAudio.value = false
    isPlaying.value = false
    currentTimeText.value = '0:00'
    durationText.value = '0:00'
  }

  const seekBackward = () => {
    if (!wavesurferInstance.value) return
    const ws = wavesurferInstance.value
    const duration = ws.getDuration()
    if (!duration) return
    const current = ws.getCurrentTime()
    let target = current - 6 * ws.getPlaybackRate()
    target = Math.min(duration, Math.max(0, target))
    ws.setTime(target)
    return target
  }

  const seekForward = () => {
    if (!wavesurferInstance.value) return
    const ws = wavesurferInstance.value
    const duration = ws.getDuration()
    if (!duration) return
    const current = ws.getCurrentTime()
    let target = current + 5 * ws.getPlaybackRate()
    target = Math.max(0, Math.min(duration, target))
    ws.setTime(target)
    return target
  }

  const playPause = () => {
    if (wavesurferInstance.value) {
      wavesurferInstance.value.playPause()
    }
  }

  const changePlaybackSpeed = (speed: string) => {
    playbackSpeed.value = speed
    if (wavesurferInstance.value) {
      wavesurferInstance.value.setPlaybackRate(parseFloat(speed))
    }
  }

  const setZoom = (level: number) => {
    zoomLevel.value = level
    if (wavesurferInstance.value) {
      wavesurferInstance.value.zoom(level)
    }
  }

  const getCurrentTime = () => {
    if (!wavesurferInstance.value) return 0
    try {
      return wavesurferInstance.value.getCurrentTime()
    } catch {
      return 0
    }
  }

  const getDuration = () => {
    if (!wavesurferInstance.value) return 0
    try {
      return wavesurferInstance.value.getDuration()
    } catch {
      return 0
    }
  }

  const getPlaybackRate = () => {
    if (!wavesurferInstance.value) return 1
    try {
      return wavesurferInstance.value.getPlaybackRate()
    } catch {
      return 1
    }
  }

  const setTime = (time: number) => {
    if (wavesurferInstance.value) {
      wavesurferInstance.value.setTime(time)
    }
  }

  const destroy = () => {
    if (wavesurferInstance.value) {
      wavesurferInstance.value.destroy()
      wavesurferInstance.value = null
    }
  }

  return {
    wavesurfer: wavesurferInstance as Ref<WaveSurfer | null>,
    isPlaying,
    currentTimeText,
    durationText,
    hasAudio,
    zoomLevel,
    playbackSpeed,
    initWaveSurfer,
    loadAudio,
    removeAudio,
    seekBackward,
    seekForward,
    playPause,
    changePlaybackSpeed,
    setZoom,
    getCurrentTime,
    getDuration,
    getPlaybackRate,
    setTime,
    destroy,
  }
}
