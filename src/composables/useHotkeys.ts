import { onMounted, onUnmounted } from 'vue'
import { useWaveSurfer } from './useWaveSurfer'
import { useLyrics } from './useLyrics'

export function useHotkeys() {
  const { hasAudio } = useWaveSurfer()
  const { itemsList, prevItem, plainLyricParser, next } = useLyrics()

  const handleGlobalKeydown = (e: KeyboardEvent) => {
    const activeNode = document.activeElement?.tagName?.toLowerCase() || ''
    if (['input', 'textarea'].includes(activeNode)) return
    if (e.code === 'Space') {
      e.preventDefault()
      if (e.shiftKey) {
        prevItem()
      } else if (!hasAudio.value) {
        const chooseBtn = document.querySelector('#fileChooser label') as HTMLElement
        chooseBtn?.click()
      } else if (itemsList.value.length === 0) {
        plainLyricParser()
      } else {
        next()
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown)
  })
}
