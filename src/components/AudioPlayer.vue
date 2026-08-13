<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWaveSurfer } from '../composables/useWaveSurfer'

// Assets
import fastRewindIcon from '../assets/fast_rewind.svg'
import playArrowIcon from '../assets/play_arrow.svg'
import pauseIcon from '../assets/pause.svg'
import fastForwardIcon from '../assets/fast_forward.svg'
import closeIcon from '../assets/close.svg'

const emit = defineEmits<{
  (e: 'audio-seek', target: number): void
  (e: 'audio-loaded', file: File): void
  (e: 'audio-removed'): void
}>()

const {
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
} = useWaveSurfer()

const fileInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  initWaveSurfer('#waveform')

  // Setup wheel zoom event
  const waveformEl = document.getElementById('waveform')
  if (waveformEl) {
    waveformEl.addEventListener('wheel', handleWaveformWheel, {
      passive: false,
    })
  }
})

onUnmounted(() => {
  const waveformEl = document.getElementById('waveform')
  if (waveformEl) {
    waveformEl.removeEventListener('wheel', handleWaveformWheel)
  }
})

const handleWaveformWheel = (e: WheelEvent) => {
  const absX = Math.abs(e.deltaX)
  const absY = Math.abs(e.deltaY)
  if (absX > absY || e.shiftKey) return
  e.preventDefault()
  let level =
    zoomLevel.value - Math.sign(e.deltaY) * Math.ceil(zoomLevel.value / 10)
  level = Math.min(300, Math.max(1, level))
  setZoom(level)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const sourceFile = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    loadAudio(file)
    emit('audio-loaded', file)
  }
}

const handleRemoveSong = () => {
  removeAudio()
  emit('audio-removed')
}

const handleBackward = () => {
  const target = seekBackward()
  if (target !== undefined) {
    emit('audio-seek', target)
  }
}

const handleForward = () => {
  const target = seekForward()
  if (target !== undefined) {
    emit('audio-seek', target)
  }
}

const handlePlaybackSpeedChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  changePlaybackSpeed(target.value)
  emit('audio-seek', useWaveSurfer().getCurrentTime())
}
</script>

<template>
  <div
    class="w-screen z-10 sm:h-16 h-30 bg-zinc-800 px-4 py-2 shadow-[0_0_25px_black] transition-all"
  >
    <div
      v-show="hasAudio"
      id="player"
      class="h-full sm:flex-nowrap flex-wrap gap-4 items-center flex"
    >
      <div class="min-w-fit sm:m-0 mx-auto">
        <button
          id="backwardBtn"
          class="hover:bg-zinc-700 rounded-full w-8 h-8"
          @click="handleBackward"
        >
          <img
            :src="fastRewindIcon"
            alt="seek backward icon"
            class="mx-auto"
          >
        </button>
        <button
          id="playPauseBtn"
          class="hover:bg-zinc-700 rounded-full w-8 h-8"
          @click="playPause"
        >
          <img
            v-show="!isPlaying"
            :src="playArrowIcon"
            class="mx-auto"
            alt="play icon"
          >
          <img
            v-show="isPlaying"
            :src="pauseIcon"
            alt="pause icon"
            class="mx-auto"
          >
        </button>
        <button
          id="forwardBtn"
          class="hover:bg-zinc-700 rounded-full w-8 h-8"
          @click="handleForward"
        >
          <img
            :src="fastForwardIcon"
            alt="song seek forward"
            class="mx-auto"
          >
        </button>
      </div>

      <select
        id="playbackSpeed"
        name="playbackSpeed"
        class="bg-zinc-800 text-zinc-100 sm:order-0 -order-1 sm:w-fit w-16"
        :value="playbackSpeed"
        @change="handlePlaybackSpeedChange"
      >
        <option value="0.25">
          x0.25
        </option>
        <option value="0.5">
          x0.5
        </option>
        <option value="0.75">
          x0.75
        </option>
        <option value="1">
          x1
        </option>
        <option value="1.25">
          x1.25
        </option>
        <option value="1.5">
          x1.5
        </option>
      </select>

      <div
        class="flex sm:order-0 -order-2 sm:grow min-w-full sm:min-w-0 items-center gap-2"
      >
        <span
          id="currentTime"
          class="min-w-10 text-end"
        >{{
          currentTimeText
        }}</span>
        <div
          id="waveform"
          class="min-w-0 w-full"
        />
        <span
          id="duration"
          class="min-w-10"
        >{{
          durationText
        }}</span>
      </div>

      <button
        id="removeSongBtn"
        class="hover:bg-zinc-700 rounded-full min-w-8 h-8 sm:ms-0 ms-8"
        @click="handleRemoveSong"
      >
        <img
          :src="closeIcon"
          alt="remove song"
          class="mx-auto"
        >
      </button>
    </div>
    <div
      v-show="!hasAudio"
      id="fileChooser"
      class="w-full h-full content-center"
    >
      <input
        id="file"
        ref="fileInputRef"
        type="file"
        name="fileInput"
        class="hidden"
        @change="sourceFile"
      >
      <label
        v-wave
        for="file"
        class="block bg-orange-400 content-center text-center font-medium mx-auto w-3/4 max-w-80 h-5/6 text-black rounded-3xl cursor-pointer"
        @click.prevent="triggerFileInput"
      >
        Choose Audio File
      </label>
    </div>
  </div>
</template>
