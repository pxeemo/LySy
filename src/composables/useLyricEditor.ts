import { ref, nextTick, type Ref } from 'vue'
import { useLyrics } from './useLyrics'
import { useWaveSurfer } from './useWaveSurfer'
import { LyricItem } from '../types/global.type'
import { formatTime, deformatTime } from '../utils/helpers'

// Shared/singleton states for the lyric editor modal
const editItemModal = ref<HTMLDialogElement | null>(null)
const editItemIndex = ref<number | null>(null)
const editItemText = ref('')
const markAsBg = ref(false)
const editItemTimes = ref<{ begin: string; end: string }[]>([])
const editItemLineTime = ref('00:00.000')

export function useLyricEditor() {
  const {
    isWordByWord,
    itemsList,
    currentItemIndex,
    currentWordIndex,
    getWordsFromLine,
    updateSelections,
    previewAnim,
  } = useLyrics()

  const {
    getCurrentTime,
  } = useWaveSurfer()

  const openEditModal = (item: LyricItem, index: number) => {
    editItemIndex.value = index
    editItemText.value = item.text
    markAsBg.value = item.isBg || false

    editItemTimes.value = []
    editItemLineTime.value = formatTime(item.beginTime || 0)

    if (isWordByWord.value) {
      let text = ''
      item.words.forEach((word) => {
        text += word.text
        text += word.type === 'word' ? ' ' : '<>'
        if (word.beginTime !== undefined && word.endTime !== undefined) {
          editItemTimes.value.push({
            begin: formatTime(word.beginTime),
            end: formatTime(word.endTime),
          })
        }
      })
      editItemText.value = text.trimEnd()
    }

    editItemModal.value?.showModal()
  }

  const handleAddNewItem = (above: boolean) => {
    if (editItemIndex.value === null) return
    const index = editItemIndex.value

    const words = isWordByWord.value ? getWordsFromLine(editItemText.value) : []
    const newItem: LyricItem = {
      text: editItemText.value,
      isBg: markAsBg.value,
      vocalist: itemsList.value[index]?.vocalist || 1,
      words,
      mode: 'default',
    }

    if (above) {
      itemsList.value.splice(index, 0, newItem)
      editItemIndex.value = index + 1
    } else {
      itemsList.value.splice(index + 1, 0, newItem)
    }

    nextTick(() => {
      updateSelections()
    })
  }

  const handleRemoveItem = () => {
    if (editItemIndex.value === null) return
    const index = editItemIndex.value

    itemsList.value.splice(index, 1)

    if (currentItemIndex.value >= index) {
      currentItemIndex.value--
      if (currentItemIndex.value === index - 1 && isWordByWord.value) {
        currentWordIndex.value = 99
      }
    }

    updateSelections()
    editItemModal.value?.close()
  }

  const handleSaveItemEdit = () => {
    if (editItemIndex.value === null) return
    const index = editItemIndex.value
    const item = itemsList.value[index]
    if (!item) return

    if (isWordByWord.value) {
      const isAlreadyTimed = editItemTimes.value.length > 0
      if (isAlreadyTimed && index < currentItemIndex.value) {
        // Edit existing timestamps
        editItemTimes.value.forEach((t, i) => {
          const word = item.words[i]
          if (word) {
            const beginVal = deformatTime(t.begin)
            const endVal = deformatTime(t.end)
            word.beginTime = beginVal
            word.endTime = endVal

            // Retrieve span element
            const el = item.el
            if (el) {
              const spanEls = el.querySelectorAll('span.word')
              const spanEl = spanEls[i] as HTMLElement
              if (spanEl) {
                previewAnim.removeElement(spanEl)
                previewAnim.addElement(
                  spanEl,
                  beginVal,
                  getCurrentTime(),
                  endVal - beginVal,
                )
              }
            }
          }
        })
        if (item.words[0] && item.words[0].beginTime !== undefined) {
          item.beginTime = item.words[0].beginTime
        }
      } else {
        // Reparse the words
        item.text = editItemText.value
        item.words = getWordsFromLine(editItemText.value)
        currentWordIndex.value = -1
      }
    } else {
      if (item.el) {
        previewAnim.removeElement(item.el)
      }
      item.text = editItemText.value
      const parsedTime = deformatTime(editItemLineTime.value)
      item.beginTime = parsedTime
      if (item.el) {
        previewAnim.addElement(
          item.el,
          parsedTime,
          getCurrentTime(),
        )
      }
    }

    item.isBg = markAsBg.value
    updateSelections()
    editItemModal.value?.close()
  }

  return {
    editItemModal,
    editItemIndex,
    editItemText,
    markAsBg,
    editItemTimes,
    editItemLineTime,
    openEditModal,
    handleAddNewItem,
    handleRemoveItem,
    handleSaveItemEdit,
  }
}
