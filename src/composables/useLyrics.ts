import { ref, watch, nextTick } from 'vue'
import { AnimationManager } from '../utils/previewAnimation'
import { generateLrc, parseLrc, stripLrc } from '../utils/fileformat/lrc'
import { useWaveSurfer } from './useWaveSurfer'
import { LyricItem, WordItem } from '../types/global.type'

// Singletons/module-level states
const lyricInput = ref('')
const isWordByWord = ref(false)
const isCharByChar = ref(false)
const isDuet = ref(false)
const offsetInput = ref(0)
const itemsList = ref<LyricItem[]>([])
const currentItemIndex = ref(-1)
const currentWordIndex = ref(-1)
const showSyncer = ref(false)
const itemRefs = ref<(HTMLElement | null)[]>([])

const previewAnim = new AnimationManager()

const rtlCharsPattern = /^[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

// Setup wavesurfer subscriptions
const {
  wavesurfer,
  getCurrentTime,
  getPlaybackRate,
  setTime,
  hasAudio,
} = useWaveSurfer()

watch(wavesurfer, (ws, oldWs) => {
  if (oldWs) {
    oldWs.un('play', playHandler)
    oldWs.un('pause', pauseHandler)
  }
  if (ws) {
    ws.on('play', playHandler)
    ws.on('pause', pauseHandler)
  }
})

const playHandler = () => {
  if (wavesurfer.value) {
    previewAnim.play(
      wavesurfer.value.getCurrentTime(),
      1 / wavesurfer.value.getPlaybackRate(),
    )
  }
}

const pauseHandler = () => {
  previewAnim.pause()
}

// Watchers
watch(isWordByWord, (newVal) => {
  if (itemsList.value.length !== 0) {
    plainLyricParser()
  }
  if (isCharByChar.value && !newVal) {
    isCharByChar.value = false
  }
})

watch(isCharByChar, (newVal) => {
  if (newVal && !isWordByWord.value) {
    isWordByWord.value = true
  }
})

watch(isDuet, () => {
  if (itemsList.value.length !== 0) {
    plainLyricParser()
  }
})

// Lyric splitting helpers
const getWordsFromLine = (line: string): WordItem[] => {
  const words: WordItem[] = []
  if (isCharByChar.value) {
    Array.from(line).forEach((char) => {
      if (char === '') return
      if (/\W/.test(char) && words.length > 0) {
        words[words.length - 1].text += char
        return
      }
      words.push({ text: char, type: 'part' })
    })
  } else {
    line.split(' ').forEach((word) => {
      if (word === '') return
      word.split(/(-)|<>/).forEach((part) => {
        if (typeof part === 'undefined' || part === '') return
        if (part === '-' && words.length > 0) {
          words[words.length - 1].text += part
          return
        }
        words.push({ text: part, type: 'part' })
      })
      if (words.length > 0) {
        words[words.length - 1].type = 'word'
        words[words.length - 1].text += ' '
      }
    })
  }
  return words
}

// Update reactive style states based on currentItemIndex and currentWordIndex
const updateSelections = () => {
  itemsList.value.forEach((item, idx) => {
    if (idx < currentItemIndex.value) {
      item.mode = 'active'
    } else if (idx === currentItemIndex.value) {
      item.mode = isWordByWord.value ? 'selected' : 'active'
    } else {
      item.mode = 'default'
    }
  })

  if (
    currentItemIndex.value === -1 &&
    isWordByWord.value &&
    itemsList.value.length > 0
  ) {
    itemsList.value[0].mode = 'selected'
  }
}

const scrollToItem = (el: HTMLElement) => {
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Plain Lyric Parser
const plainLyricParser = () => {
  const inputText = lyricInput.value
  itemsList.value = []
  currentItemIndex.value = -1
  currentWordIndex.value = -1
  previewAnim.animations.clear()

  const hasTimestamps = /\[\d{1,2}(:\d{1,2})+(\.\d{1,3})?\]/.test(inputText)

  if (hasTimestamps) {
    const parsedLines = parseLrc(inputText)
    let lastTimestampedIndex = -1

    parsedLines.forEach((lineData) => {
      if (isWordByWord.value && lineData.text.trim() === '') return

      // Generate words if in word-by-word mode
      let words: WordItem[] = []
      if (isWordByWord.value) {
        words = getWordsFromLine(lineData.text)
        // Fill in the matched timestamps from parsed LRC if any
        let parsedWordIndex = 0
        for (const wordData of lineData.words) {
          while (parsedWordIndex < words.length) {
            const word = words[parsedWordIndex]
            if (word.type) {
              word.beginTime = Number(wordData.beginTime)
              word.endTime = Number(wordData.endTime)
              word.actived = true
              lastTimestampedIndex = itemsList.value.length
              parsedWordIndex++
              break
            }
            parsedWordIndex++
          }
        }
      }

      const item: LyricItem = {
        text: lineData.text,
        isBg: lineData.isBg || false,
        beginTime: lineData.time,
        vocalist: lineData.vocalist || 1,
        words,
        mode: 'default',
      }

      if (lineData.time !== undefined) {
        lastTimestampedIndex = itemsList.value.length
      }

      itemsList.value.push(item)
    })

    if (!isWordByWord.value && lastTimestampedIndex >= 0) {
      currentItemIndex.value = lastTimestampedIndex - 1
    } else if (isWordByWord.value && lastTimestampedIndex >= 0) {
      currentItemIndex.value = lastTimestampedIndex
      // Find the last actived word in that item
      const lastItem = itemsList.value[lastTimestampedIndex]
      if (lastItem) {
        const activedIndices = lastItem.words
          .map((w, idx) => (w.actived ? idx : -1))
          .filter((idx) => idx !== -1)
        currentWordIndex.value =
          activedIndices.length > 0
            ? activedIndices[activedIndices.length - 1]
            : -1
      }
    }
  } else {
    const plainLyric = stripLrc(inputText)
    plainLyric.split('\n').forEach((line: string) => {
      if (isWordByWord.value && line.trim() === '') return
      itemsList.value.push({
        text: line,
        isBg: false,
        words: isWordByWord.value ? getWordsFromLine(line) : [],
        mode: 'default',
      })
    })
  }

  updateSelections()
  showSyncer.value = true

  // Next tick: register elements to previewAnim and scroll
  nextTick(() => {
    // Register preview animations
    itemsList.value.forEach((item, index) => {
      const el = itemRefs.value[index]
      if (!el) return
      item.el = el

      if (item.beginTime !== undefined) {
        previewAnim.addElement(
          el,
          item.beginTime,
          getCurrentTime(),
        )
      }

      if (isWordByWord.value && item.words.length > 0) {
        const spanEls = el.querySelectorAll('span.word')
        let spanIdx = 0
        item.words.forEach((word) => {
          const spanEl = spanEls[spanIdx] as HTMLElement
          if (
            spanEl &&
            word.beginTime !== undefined &&
            word.endTime !== undefined
          ) {
            previewAnim.addElement(
              spanEl,
              Number(word.beginTime),
              getCurrentTime(),
              Number(word.endTime) - Number(word.beginTime),
            )
            spanIdx++
          }
        })
      }
    })

    // Scroll
    const scrollTarget =
      currentItemIndex.value >= 0 &&
      currentItemIndex.value < itemsList.value.length
        ? itemRefs.value[currentItemIndex.value]
        : itemRefs.value[0]
    if (scrollTarget) {
      scrollToItem(scrollTarget)
    }
  })
}

const handleAudioSeek = (target: number) => {
  previewAnim.refresh(
    target,
    1 / getPlaybackRate(),
    isWordByWord.value,
  )
}

const handleItemClick = (item: LyricItem) => {
  if (item.beginTime === undefined) return
  setTime(item.beginTime)
  previewAnim.refresh(
    item.beginTime,
    1 / getPlaybackRate(),
    isWordByWord.value,
  )
}

const wordEnd = () => {
  if (currentItemIndex.value === -1) return
  const currentItem = itemsList.value[currentItemIndex.value]
  if (!currentItem || currentItem.words.length === 0) return

  const wordEl = currentItem.words[currentWordIndex.value]
  if (!wordEl || wordEl.beginTime === undefined) return

  const offset = offsetInput.value / 1000
  const currentTime = Math.max(0, getCurrentTime() + offset)
  wordEl.endTime = currentTime
  wordEl.actived = true

  // Find physical span element in parent
  const el = currentItem.el
  if (el) {
    const spanEls = el.querySelectorAll('span.word')
    const spanEl = spanEls[currentWordIndex.value] as HTMLElement
    if (spanEl) {
      previewAnim.addElement(
        spanEl,
        Number(wordEl.beginTime),
        currentTime,
        Number(wordEl.endTime) - Number(wordEl.beginTime),
      )
    }
  }

  if (currentWordIndex.value + 1 >= currentItem.words.length) {
    // End of line
    updateSelections()
    if (currentItemIndex.value <= itemsList.value.length - 1) {
      currentWordIndex.value = -1
      currentItemIndex.value++
      updateSelections()
      if (currentItemIndex.value !== itemsList.value.length) {
        const nextEl = itemRefs.value[currentItemIndex.value]
        if (nextEl) scrollToItem(nextEl)
      }
    }
  }
}

const next = () => {
  const offset = offsetInput.value / 1000
  const currentTime = Math.max(0, getCurrentTime() + offset)

  if (isWordByWord.value) {
    if (currentItemIndex.value === -1) {
      currentItemIndex.value = 0
      currentWordIndex.value = -1
    }

    const currentItem = itemsList.value[currentItemIndex.value]
    if (!currentItem) return

    const prevWord = currentItem.words[currentWordIndex.value]
    if (prevWord) {
      if (prevWord.endTime === undefined) {
        prevWord.endTime = currentTime
      }
      const el = currentItem.el
      if (el) {
        const spanEls = el.querySelectorAll('span.word')
        const spanEl = spanEls[currentWordIndex.value] as HTMLElement
        if (spanEl) {
          previewAnim.addElement(
            spanEl,
            Number(prevWord.beginTime),
            currentTime,
            Number(prevWord.endTime) - Number(prevWord.beginTime),
          )
        }
      }
    }

    currentWordIndex.value++

    // end of line
    if (currentWordIndex.value >= currentItem.words.length) {
      updateSelections()
      if (currentItemIndex.value <= itemsList.value.length - 1) {
        currentItemIndex.value++
        updateSelections()
        if (currentItemIndex.value !== itemsList.value.length) {
          const nextEl = itemRefs.value[currentItemIndex.value]
          if (nextEl) {
            scrollToItem(nextEl)
          }
          currentWordIndex.value = 0
        } else {
          currentWordIndex.value = -1
          return
        }
      }
    }

    const activeItem = itemsList.value[currentItemIndex.value]
    if (!activeItem) return
    const word = activeItem.words[currentWordIndex.value]
    if (!word) return
    word.beginTime = currentTime
    word.actived = true

    if (currentWordIndex.value === 0) {
      activeItem.beginTime = currentTime
      const el = activeItem.el
      if (el) {
        previewAnim.addElement(el, activeItem.beginTime, currentTime)
      }
    }
  } else if (currentItemIndex.value < itemsList.value.length - 1) {
    currentItemIndex.value++
    const item = itemsList.value[currentItemIndex.value]
    if (!item) return
    item.beginTime = currentTime
    updateSelections()
    nextTick(() => {
      const el = itemRefs.value[currentItemIndex.value]
      if (el && item.beginTime !== undefined) {
        scrollToItem(el)
        previewAnim.addElement(el, item.beginTime, currentTime)
      }
    })
  }
}

const clearLine = (item: LyricItem) => {
  if (item.el) {
    previewAnim.removeElement(item.el)
  }
  item.beginTime = undefined
  if (isWordByWord.value) {
    item.words.forEach((word) => {
      if (word.beginTime === undefined) return
      delete word.beginTime
      delete word.endTime
      word.actived = false
    })
    if (item.el) {
      const spanEls = item.el.querySelectorAll('span.word')
      spanEls.forEach((spanEl) => {
        previewAnim.removeElement(spanEl as HTMLElement)
        ;(spanEl as HTMLElement).style.animationName = ''
      })
    }
  }
}

const prevItem = () => {
  if (currentItemIndex.value < 0) return
  const item = itemsList.value[currentItemIndex.value]

  if (isWordByWord.value) {
    if (currentWordIndex.value === -1 && currentItemIndex.value !== 0) {
      const prevItemObj = itemsList.value[currentItemIndex.value - 1]
      if (prevItemObj) {
        const prevEl = itemRefs.value[currentItemIndex.value - 1]
        if (prevEl) scrollToItem(prevEl)
        if (prevItemObj.beginTime !== undefined) {
          setTime(Math.max(0, prevItemObj.beginTime - 1.5))
        }
        clearLine(prevItemObj)
        currentItemIndex.value--
        updateSelections()
      }
    } else if (currentWordIndex.value !== -1) {
      if (item.beginTime !== undefined) {
        setTime(Math.max(0, item.beginTime - 1.5))
      }
      if (item) clearLine(item)
      currentWordIndex.value = -1
    }
  } else {
    currentItemIndex.value--
    const targetEl =
      currentItemIndex.value === -1
        ? itemRefs.value[0]
        : itemRefs.value[currentItemIndex.value]
    if (targetEl) scrollToItem(targetEl)
    if (item.beginTime !== undefined) {
      setTime(Math.max(0, item.beginTime - 1.5))
    }
    updateSelections()
    clearLine(item)
  }

  previewAnim.refresh(
    getCurrentTime(),
    1 / getPlaybackRate(),
    isWordByWord.value,
  )
}

const switchVocalist = (item: LyricItem) => {
  if (item.vocalist === 1) {
    item.vocalist = 2
  } else {
    item.vocalist = 1
  }
}

const handleSwitchVocalistBtn = () => {
  if (itemsList.value.length === 0) return
  itemsList.value
    .slice(Math.max(0, currentItemIndex.value))
    .forEach((item) => {
      switchVocalist(item)
    })
}

const handleDownload = () => {
  if (!hasAudio.value) {
    alert('You need to select an input file first')
    return
  }
  const text = generateLrc(itemsList.value, isWordByWord.value, isDuet.value)
  // Retrieve target filename using DOM elements
  const inputEl = document.querySelector('#file') as HTMLInputElement | null
  const inputFileName = inputEl?.files?.[0]?.name || 'lyrics.mp3'
  const filename = inputFileName.replace(/(\.\w+?)?$/, '.lrc')

  const blob = new Blob([text])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useLyrics() {
  return {
    lyricInput,
    isWordByWord,
    isCharByChar,
    isDuet,
    offsetInput,
    itemsList,
    currentItemIndex,
    currentWordIndex,
    showSyncer,
    itemRefs,
    previewAnim,
    rtlCharsPattern,
    plainLyricParser,
    handleAudioSeek,
    handleItemClick,
    wordEnd,
    next,
    clearLine,
    prevItem,
    switchVocalist,
    handleSwitchVocalistBtn,
    handleDownload,
    getWordsFromLine,
    updateSelections,
    scrollToItem,
  }
}
