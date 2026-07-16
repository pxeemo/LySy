<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import { AnimationManager } from './utils/previewAnimation'
import { generateLrc, parseLrc, stripLrc } from './utils/fileformat/lrc'
import { formatTime, deformatTime } from './utils/helpers'

// Assets
import fastRewindIcon from './assets/fast_rewind.svg'
import playArrowIcon from './assets/play_arrow.svg'
import pauseIcon from './assets/pause.svg'
import fastForwardIcon from './assets/fast_forward.svg'
import closeIcon from './assets/close.svg'
import editIconSvg from './assets/edit.svg'

// Interfaces
interface WordItem {
    type?: string
    text: string
    beginTime?: number
    endTime?: number
    actived?: boolean
}

interface LyricItem {
    text: string
    isBg?: boolean
    time?: number
    vocalist?: number
    words: WordItem[]
    // For rendering class list dynamically
    activeStyle?: boolean
    selectedStyle?: boolean
    normalStyle?: boolean
    // Store DOM elements when generated for preview animation
    el?: HTMLElement | null
}

// State
const lyricInput = ref('')
const isWordByWord = ref(false)
const isCharByChar = ref(false)
const isDuet = ref(false)
const offsetInput = ref(0)
const itemsList = ref<LyricItem[]>([])
const currentItemIndex = ref(-1)
const currentWordIndex = ref(-1)
const isPlaying = ref(false)
const currentTimeText = ref('0:00')
const durationText = ref('0:00')
const hasAudio = ref(false)
const zoomLevel = ref(50)
const playbackSpeed = ref('1')
const showSyncer = ref(false)

// File handling
const fileInputRef = ref<HTMLInputElement | null>(null)
const lrcFileInputRef = ref<HTMLInputElement | null>(null)

// WaveSurfer and Animation manager instances
let wavesurfer: WaveSurfer | null = null
const previewAnim = new AnimationManager()

// Modal states
const editItemModal = ref<HTMLDialogElement | null>(null)
const editItemIndex = ref<number | null>(null)
const editItemText = ref('')
const markAsBg = ref(false)
const editItemTimes = ref<{ begin: string; end: string }[]>([])
const editItemLineTime = ref('00:00.000')

// DOM templates for timing
const itemRefs = ref<(HTMLElement | null)[]>([])

const rtlCharsPattern = /^[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

// Setup wavesurfer
onMounted(() => {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
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

    wavesurfer.on('timeupdate', () => {
        if (wavesurfer) {
            currentTimeText.value = formatTime(wavesurfer.getCurrentTime(), false)
        }
    })

    wavesurfer.on('decode', () => {
        if (wavesurfer) {
            durationText.value = formatTime(wavesurfer.getDuration(), false)
        }
    })

    wavesurfer.on('play', () => {
        isPlaying.value = true
        if (wavesurfer) {
            previewAnim.play(
                wavesurfer.getCurrentTime(),
                1 / wavesurfer.getPlaybackRate(),
            )
        }
    })

    wavesurfer.on('pause', () => {
        isPlaying.value = false
        previewAnim.pause()
    })

    // Setup wheel zoom event
    const waveformEl = document.getElementById('waveform')
    if (waveformEl) {
        waveformEl.addEventListener('wheel', handleWaveformWheel, { passive: false })
    }

    // Setup global spacebar hotkey
    window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
    if (wavesurfer) {
        wavesurfer.destroy()
    }
    const waveformEl = document.getElementById('waveform')
    if (waveformEl) {
        waveformEl.removeEventListener('wheel', handleWaveformWheel)
    }
    window.removeEventListener('keydown', handleGlobalKeydown)
})

const handleWaveformWheel = (e: WheelEvent) => {
    if (!wavesurfer) return
    const absX = Math.abs(e.deltaX)
    const absY = Math.abs(e.deltaY)
    if (absX > absY || e.shiftKey) return
    e.preventDefault()
    let level = zoomLevel.value - Math.sign(e.deltaY) * Math.ceil(zoomLevel.value / 10)
    level = Math.min(300, Math.max(1, level))
    zoomLevel.value = level
    wavesurfer.zoom(level)
}

const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.nodeName || '')
    ) {
        e.preventDefault()
        if (e.shiftKey) {
            prevItem()
        } else {
            if (!hasAudio.value) {
                fileInputRef.value?.click()
            } else if (itemsList.value.length === 0) {
                plainLyricParser()
            } else {
                next()
            }
        }
    }
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

// Navigation & Actions
const triggerFileInput = () => {
    fileInputRef.value?.click()
}

const triggerLrcFileInput = () => {
    lrcFileInputRef.value?.click()
}

const sourceFile = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file && wavesurfer) {
        const audioURL = URL.createObjectURL(file)
        wavesurfer.load(audioURL)
        hasAudio.value = true
    }
}

const handleLrcUpload = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
            if (event.target?.result) {
                lyricInput.value = event.target.result as string
            }
        }
        reader.readAsText(file)
    }
}

const removeSong = () => {
    if (wavesurfer) {
        wavesurfer.empty()
    }
    hasAudio.value = false
}

const backward = () => {
    if (!wavesurfer) return
    const duration = wavesurfer.getDuration()
    if (!duration) return
    const current = wavesurfer.getCurrentTime()
    let target = current - 6 * wavesurfer.getPlaybackRate()
    target = Math.min(duration, Math.max(0, target))
    wavesurfer.setTime(target)
    previewAnim.refresh(target, 1 / wavesurfer.getPlaybackRate())
}

const forward = () => {
    if (!wavesurfer) return
    const duration = wavesurfer.getDuration()
    if (!duration) return
    const current = wavesurfer.getCurrentTime()
    let target = current + 5 * wavesurfer.getPlaybackRate()
    target = Math.max(0, Math.min(duration, target))
    wavesurfer.setTime(target)
    previewAnim.refresh(target, 1 / wavesurfer.getPlaybackRate())
}

const playPause = () => {
    if (wavesurfer) {
        wavesurfer.playPause()
    }
}

const changePlaybackSpeed = (e: Event) => {
    const target = e.target as HTMLSelectElement
    playbackSpeed.value = target.value
    if (wavesurfer) {
        wavesurfer.setPlaybackRate(parseFloat(playbackSpeed.value))
        previewAnim.refresh(
            wavesurfer.getCurrentTime(),
            1 / wavesurfer.getPlaybackRate(),
        )
    }
}

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
                time: lineData.time,
                vocalist: lineData.vocalist || 1,
                words,
                activeStyle: false,
                selectedStyle: false,
                normalStyle: true
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
                currentWordIndex.value = activedIndices.length > 0 ? activedIndices[activedIndices.length - 1] : -1
            }
        }

        // Apply active/selected styles
        updateSelections()

    } else {
        const plainLyric = stripLrc(inputText)
        plainLyric.split('\n').forEach((line: string) => {
            if (isWordByWord.value && line.trim() === '') return
            itemsList.value.push({
                text: line,
                isBg: false,
                words: isWordByWord.value ? getWordsFromLine(line) : [],
                activeStyle: false,
                selectedStyle: false,
                normalStyle: true
            })
        })
    }

    showSyncer.value = true

    // Next tick: register elements to previewAnim and scroll
    nextTick(() => {
        // Register preview animations
        itemsList.value.forEach((item, index) => {
            const el = itemRefs.value[index]
            if (!el) return
            item.el = el

            if (item.time !== undefined) {
                previewAnim.addElement(el, Number(item.time), wavesurfer ? wavesurfer.getCurrentTime() : 0)
            }

            if (isWordByWord.value && item.words.length > 0) {
                const spanEls = el.querySelectorAll('span.word')
                let spanIdx = 0
                item.words.forEach((word) => {
                    const spanEl = spanEls[spanIdx] as HTMLElement
                    if (spanEl && word.beginTime !== undefined && word.endTime !== undefined) {
                        previewAnim.addElement(
                            spanEl,
                            Number(word.beginTime),
                            wavesurfer ? wavesurfer.getCurrentTime() : 0,
                            Number(word.endTime) - Number(word.beginTime)
                        )
                        spanIdx++
                    }
                })
            }
        })

        // Scroll
        const scrollTarget = currentItemIndex.value >= 0 && currentItemIndex.value < itemsList.value.length
            ? itemRefs.value[currentItemIndex.value]
            : itemRefs.value[0]
        if (scrollTarget) {
            scrollToItem(scrollTarget)
        }
    })
}

// Update reactive style states based on currentItemIndex and currentWordIndex
const updateSelections = () => {
    itemsList.value.forEach((item, idx) => {
        item.activeStyle = false
        item.selectedStyle = false
        item.normalStyle = false

        if (idx < currentItemIndex.value) {
            item.activeStyle = true
        } else if (idx === currentItemIndex.value) {
            if (isWordByWord.value) {
                item.activeStyle = true
            } else {
                item.activeStyle = true
            }
        } else if (idx === currentItemIndex.value + 1) {
            if (isWordByWord.value) {
                item.selectedStyle = true
            } else {
                item.normalStyle = true
            }
        } else {
            item.normalStyle = true
        }
    })

    if (currentItemIndex.value === -1 && isWordByWord.value && itemsList.value.length > 0) {
        itemsList.value[0].selectedStyle = true
    }
}

const scrollToItem = (el: HTMLElement) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleItemClick = (item: LyricItem) => {
    if (item.time === undefined || !wavesurfer) return
    wavesurfer.setTime(item.time)
    previewAnim.refresh(item.time, 1 / wavesurfer.getPlaybackRate())
}

const wordEnd = () => {
    if (!wavesurfer || currentItemIndex.value === -1) return
    const currentItem = itemsList.value[currentItemIndex.value]
    if (!currentItem || currentItem.words.length === 0) return

    const wordEl = currentItem.words[currentWordIndex.value]
    if (!wordEl || wordEl.beginTime === undefined) return

    const offset = offsetInput.value / 1000
    const currentTime = Math.max(0, wavesurfer.getCurrentTime() + offset)
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
                Number(wordEl.endTime) - Number(wordEl.beginTime)
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
    if (!wavesurfer) return
    const offset = offsetInput.value / 1000
    const currentTime = Math.max(0, wavesurfer.getCurrentTime() + offset)

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
                        Number(prevWord.endTime) - Number(prevWord.beginTime)
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
            activeItem.time = currentTime
            const el = activeItem.el
            if (el) {
                previewAnim.addElement(el, Number(activeItem.time), currentTime)
            }
        }
    } else if (currentItemIndex.value < itemsList.value.length - 1) {
        currentItemIndex.value++
        const item = itemsList.value[currentItemIndex.value]
        if (!item) return
        item.time = currentTime
        updateSelections()
        nextTick(() => {
            const el = itemRefs.value[currentItemIndex.value]
            if (el) {
                scrollToItem(el)
                previewAnim.addElement(el, Number(item.time), currentTime)
            }
        })
    }
}

const clearLine = (item: LyricItem) => {
    if (item.el) {
        previewAnim.removeElement(item.el)
    }
    delete item.time
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
    if (currentItemIndex.value < 0 || !wavesurfer) return
    const item = itemsList.value[currentItemIndex.value]
    if (!item) return

    if (isWordByWord.value) {
        if (currentWordIndex.value === -1 && currentItemIndex.value !== 0) {
            const prevItemObj = itemsList.value[currentItemIndex.value - 1]
            if (prevItemObj) {
                const prevEl = itemRefs.value[currentItemIndex.value - 1]
                if (prevEl) scrollToItem(prevEl)
                if (prevItemObj.time !== undefined) {
                    wavesurfer.setTime(Math.max(0, prevItemObj.time - 1.5))
                }
                clearLine(prevItemObj)
                currentItemIndex.value--
                updateSelections()
            }
        } else if (currentWordIndex.value !== -1) {
            if (item.time !== undefined) {
                wavesurfer.setTime(Math.max(0, item.time - 1.5))
            }
            clearLine(item)
            currentWordIndex.value = -1
        }
    } else {
        const prevItemObj = itemsList.value[currentItemIndex.value - 1]
        currentItemIndex.value--
        const targetEl = currentItemIndex.value === -1 ? itemRefs.value[0] : itemRefs.value[currentItemIndex.value]
        if (targetEl) scrollToItem(targetEl)
        if (item.time !== undefined) {
            wavesurfer.setTime(Math.max(0, item.time - 1.5))
        }
        updateSelections()
        clearLine(item)
    }

    previewAnim.refresh(
        wavesurfer.getCurrentTime(),
        1 / wavesurfer.getPlaybackRate(),
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
    itemsList.value.slice(Math.max(0, currentItemIndex.value)).forEach((item) => {
        switchVocalist(item)
    })
}

// Edit Modal helpers
const openEditModal = (item: LyricItem, index: number) => {
    editItemIndex.value = index
    editItemText.value = item.text
    markAsBg.value = item.isBg || false

    editItemTimes.value = []
    editItemLineTime.value = formatTime(item.time || 0)

    if (isWordByWord.value) {
        let text = ''
        item.words.forEach((word) => {
            text += word.text
            text += word.type === 'word' ? ' ' : '<>'
            if (word.beginTime !== undefined && word.endTime !== undefined) {
                editItemTimes.value.push({
                    begin: formatTime(word.beginTime),
                    end: formatTime(word.endTime)
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
        activeStyle: false,
        selectedStyle: false,
        normalStyle: true
    }

    if (above) {
        itemsList.value.splice(index, 0, newItem)
        editItemIndex.value = index + 1
    } else {
        itemsList.value.splice(index + 1, 0, newItem)
    }

    // Update tracking
    nextTick(() => {
        // Register element reference and refresh styling
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
    if (editItemIndex.value === null || !wavesurfer) return
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
                                wavesurfer ? wavesurfer.getCurrentTime() : 0,
                                endVal - beginVal
                            )
                        }
                    }
                }
            })
            if (item.words[0] && item.words[0].beginTime !== undefined) {
                item.time = item.words[0].beginTime
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
        item.time = parsedTime
        if (item.el) {
            previewAnim.addElement(
                item.el,
                parsedTime,
                wavesurfer.getCurrentTime()
            )
        }
    }

    item.isBg = markAsBg.value
    updateSelections()
    editItemModal.value?.close()
}

// Download
const handleDownload = () => {
    if (!hasAudio.value) {
        alert('You need to select an input file first')
        return
    }
    const text = generateLrc(itemsList.value, isWordByWord.value, isDuet.value)
    const inputFileName = fileInputRef.value?.files?.[0]?.name || 'lyrics.mp3'
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
</script>

<template>
    <div>
        <!-- Bottom Audio Player Container -->
        <div class="fixed z-20 w-screen sm:h-16 h-30 bg-zinc-800 bottom-0 px-4 py-2 shadow-[0_0_6px_#111] transition-all">
            <div v-show="hasAudio" class="h-full sm:flex-nowrap flex-wrap gap-4 items-center flex" id="player">
                <div class="min-w-fit sm:m-0 mx-auto">
                    <button class="hover:bg-zinc-700 rounded-full w-8 h-8" id="backwardBtn" @click="backward">
                        <img :src="fastRewindIcon" alt="seek backward icon" class="mx-auto" />
                    </button>
                    <button class="hover:bg-zinc-700 rounded-full w-8 h-8" id="playPauseBtn" @click="playPause">
                        <img :src="playArrowIcon" class="mx-auto" alt="play icon" v-show="!isPlaying" />
                        <img :src="pauseIcon" alt="pause icon" class="mx-auto" v-show="isPlaying" />
                    </button>
                    <button class="hover:bg-zinc-700 rounded-full w-8 h-8" id="forwardBtn" @click="forward">
                        <img :src="fastForwardIcon" alt="song seek forward" class="mx-auto" />
                    </button>
                </div>

                <select name="playbackSpeed" class="bg-zinc-800 text-zinc-100 sm:order-0 -order-1 sm:w-fit w-16"
                    id="playbackSpeed" :value="playbackSpeed" @change="changePlaybackSpeed">
                    <option value="0.25">x0.25</option>
                    <option value="0.5">x0.5</option>
                    <option value="0.75">x0.75</option>
                    <option value="1">x1</option>
                    <option value="1.25">x1.25</option>
                    <option value="1.5">x1.5</option>
                </select>

                <div class="flex sm:order-0 -order-2 sm:grow min-w-full sm:min-w-0 items-center gap-2">
                    <span id="currentTime" class="min-w-10 text-end">{{ currentTimeText }}</span>
                    <div id="waveform" class="min-w-0 w-full"></div>
                    <span id="duration" class="min-w-10">{{ durationText }}</span>
                </div>

                <button class="hover:bg-zinc-700 rounded-full min-w-8 h-8 sm:ms-0 ms-8" id="removeSongBtn"
                    @click="removeSong">
                    <img :src="closeIcon" alt="remove song" class="mx-auto" />
                </button>
            </div>
            <div v-show="!hasAudio" id="fileChooser" class="w-full h-full content-center">
                <input type="file" name="fileInput" id="file" class="hidden" ref="fileInputRef" @change="sourceFile" />
                <label for="file"
                    class="block bg-orange-400 content-center text-center font-medium mx-auto w-3/4 max-w-80 h-5/6 text-black rounded-3xl cursor-pointer"
                    @click.prevent="triggerFileInput">
                    Choose File
                </label>
            </div>
        </div>

        <!-- Inputs and Controls Container -->
        <div class="container container-md p-4 h-[calc(100svh-3rem)] text-center">
            <textarea dir="auto"
                class="w-full max-w-3xl h-[calc(100%-13rem)] py-3 px-4 outline-none bg-zinc-950 rounded-3xl focus:shadow-orange-400 focus:shadow-[0_0_2px_0_#fff] border-zinc-700 transition-all ease-in-out duration-300 focus:border-orange-400 border-2 resize-none"
                id="lyricInput" rows="20" placeholder="Enter your lyric text here" required
                v-model="lyricInput"></textarea>

            <div class="max-w-lg px-6 my-2 mx-auto">
                <label
                    class="flex p-2 my-0.5 bg-zinc-800 rounded rounded-t-2xl cursor-pointer items-center justify-between"
                    for="isWordByWord">
                    <p class="ps-2 text-lg text-start">Sync word-by-word</p>
                    <input class="hidden peer" type="checkbox" id="isWordByWord" name="isWordByWord"
                        v-model="isWordByWord" />
                    <label
                        class="relative inline-block min-w-12 h-8 cursor-pointer border-zinc-500 border-2 bg-zinc-800 peer-checked:bg-orange-400 rounded-full duration-500 transition before:duration-50 before:ease-out before:transition-all before:absolute before:content-[''] before:bg-zinc-400 before:aspect-square before:left-1.5 before:top-1.5 before:bottom-1.5 peer-checked:before:left-4.5 peer-checked:before:bottom-0.5 peer-checked:before:top-0.5 peer-checked:border-orange-400 peer-checked:before:bg-zinc-800 before:rounded-full"
                        for="isWordByWord"></label>
                </label>
                <label class="flex p-2 my-0.5 bg-zinc-800 rounded cursor-pointer items-center justify-between"
                    for="isCharByChar">
                    <p class="ps-2 text-lg text-start">Character-based syncing</p>
                    <input class="hidden peer" type="checkbox" id="isCharByChar" name="isCharByChar"
                        v-model="isCharByChar" />
                    <label
                        class="relative inline-block min-w-12 h-8 cursor-pointer border-zinc-500 border-2 bg-zinc-800 peer-checked:bg-orange-400 rounded-full duration-500 transition before:duration-50 before:ease-out before:transition-all before:absolute before:content-[''] before:bg-zinc-400 before:aspect-square before:left-1.5 before:top-1.5 before:bottom-1.5 peer-checked:before:left-4.5 peer-checked:before:bottom-0.5 peer-checked:before:top-0.5 peer-checked:border-orange-400 peer-checked:before:bg-zinc-800 before:rounded-full"
                        for="isCharByChar"></label>
                </label>
                <label
                    class="flex p-2 my-0.5 bg-zinc-800 rounded rounded-b-2xl cursor-pointer items-center justify-between"
                    for="isDuet">
                    <p class="ps-2 text-lg text-start">Enable duet</p>
                    <input class="hidden peer" type="checkbox" id="isDuet" name="isDuet" v-model="isDuet" />
                    <label
                        class="relative inline-block min-w-12 h-8 cursor-pointer border-zinc-500 border-2 bg-zinc-800 peer-checked:bg-orange-400 rounded-full duration-500 transition before:duration-50 before:ease-out before:transition-all before:absolute before:content-[''] before:bg-zinc-400 before:aspect-square before:left-1.5 before:top-1.5 before:bottom-1.5 peer-checked:before:left-4.5 peer-checked:before:bottom-0.5 peer-checked:before:top-0.5 peer-checked:border-orange-400 peer-checked:before:bg-zinc-800 before:rounded-full"
                        for="isDuet"></label>
                </label>
            </div>

            <div class="flex gap-2 justify-center items-center">
                <div class="flex gap-2 items-center">
                    <label for="offsetInput" class="text-zinc-300 text-sm">Offset (ms):</label>
                    <input type="number" id="offsetInput"
                        class="w-24 h-8 bg-zinc-800 text-zinc-100 border-2 border-zinc-700 rounded-lg px-2 text-center outline-none focus:border-orange-400 transition-all"
                        step="10" v-model.number="offsetInput" />
                </div>
                <input type="file" name="lrcFileInput" id="lrcFile" class="hidden" accept=".lrc" ref="lrcFileInputRef"
                    @change="handleLrcUpload" />
                <label for="lrcFile"
                    class="h-8 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-full px-5 leading-8 cursor-pointer transition-colors"
                    @click.prevent="triggerLrcFileInput">
                    Upload Lyrics
                </label>
                <button class="h-8 bg-orange-400 text-black font-medium rounded-full px-5" id="plainInputParser"
                    @click="plainLyricParser">
                    Load
                </button>
            </div>
        </div>

        <!-- Lyrics list container -->
        <div v-show="showSyncer" class="container container-md max-w-3xl p-4 my-28 text-center" id="syncer">
            <ul class="w-full text-start font-bold overflow-clip" id="lyricList">
                <li v-for="(item, index) in itemsList" :key="index" :ref="el => { if (el) itemRefs[index] = el as HTMLElement }"
                    :data-type="item.isBg ? 'bg' : 'normal'" :data-vocalist="isDuet ? item.vocalist : undefined"
                    :data-time="item.time"
                    class="flex px-5 gap-2 text-zinc-400 items-center rounded first:rounded-t-2xl last:rounded-b-2xl border-1 border-zinc-900 duration-300 ease-out transition-all scroll-mt-[20svh]"
                    :class="[
                        item.isBg ? 'py-2' : 'py-4',
                        {
                            'text-zinc-100 cursor-pointer border-zinc-900 bg-zinc-800': item.activeStyle,
                            'border-orange-400 rounded-b-2xl': item.selectedStyle,
                            'border-zinc-900 text-zinc-400': item.normalStyle
                        }
                    ]" @click="handleItemClick(item)">
                    <p class="grow text-start transition-all duration-300"
                        :class="[item.isBg ? '' : 'text-2xl', isDuet && item.vocalist === 2 ? 'text-end' : 'text-start']"
                        :dir="rtlCharsPattern.test(item.text) ? 'rtl' : 'auto'">
                        <!-- Render words if word-by-word is enabled -->
                        <template v-if="isWordByWord && item.words.length > 0">
                            <span v-for="(word, wordIdx) in item.words" :key="wordIdx" class="word" :class="[
                                { 'rtl': rtlCharsPattern.test(word.text) },
                                { 'actived': word.actived }
                            ]" :data-type="word.type" :data-begin-time="word.beginTime" :data-end-time="word.endTime">
                                {{ word.text }}
                            </span>
                        </template>
                        <!-- Render simple text otherwise -->
                        <template v-else>
                            {{ item.text }}
                        </template>
                    </p>
                    <img class="mx-2 cursor-pointer" :src="editIconSvg" :width="20" @click.stop="openEditModal(item, index)" />
                </li>
            </ul>

            <button class="h-8 bg-orange-400 text-black font-medium rounded-full px-5 my-2" id="dlFile"
                @click="handleDownload">
                Save
            </button>
        </div>

        <!-- Floating action buttons -->
        <button class="fixed left-4 h-14 w-14 text-xs/3 bg-zinc-800 border-orange-400 border-1 shadow-xl/30 text-zinc-100 rounded-xl transition-all"
            id="switchVocalistBtn" :class="[
                isDuet ? (isWordByWord ? 'sm:bottom-37 bottom-51' : 'sm:bottom-20 bottom-34') : 'bottom-0'
            ]" @click="handleSwitchVocalistBtn">
            Switch Vocalist
        </button>
        <button class="fixed left-4 h-14 w-14 text-sm/4 bg-zinc-800 border-orange-400 border-1 shadow-xl/30 text-zinc-100 rounded-xl transition-all"
            id="wordEndBtn" :class="[
                isWordByWord ? 'sm:bottom-20 bottom-34' : 'bottom-0'
            ]" @click="wordEnd">
            Word End
        </button>
        <button class="fixed right-4 bottom-0 h-14 w-14 bg-zinc-800 border-orange-400 border-1 shadow-2xl/30 text-zinc-100 rounded-xl transition-all delay-150 sm:bottom-37 bottom-51"
            id="prevItemBtn" @click="prevItem">
            Back
        </button>
        <button class="fixed right-4 bottom-0 h-14 w-14 font-semibold bg-orange-400 shadow-2xl/30 text-black rounded-xl transition-all sm:bottom-20 bottom-34"
            id="nextItemBtn" @click="next">
            Next
        </button>

        <!-- Edit Item Modal -->
        <dialog class="backdrop:bg-black/80 m-auto p-4 rounded-lg bg-zinc-900 text-zinc-100" id="editItemModal"
            ref="editItemModal">
            <form method="dialog" @submit.prevent>
                <div id="editItemContent" class="text-zinc-100 mb-2">
                    <!-- Standard text/timestamp input -->
                    <textarea rows="1" id="editItemInput" type="text" name="editItemInput" dir="auto"
                        class="w-full min-w-80 bg-zinc-900 text-zinc-100 disabled:text-zinc-400 disabled:bg-zinc-800 outline-none rounded-md m-1 p-2 border-zinc-700 transition-all ease-in-out duration-300 focus:border-orange-400 border-2 resize-none"
                        v-model="editItemText" :disabled="isWordByWord && editItemIndex !== null && editItemIndex < currentItemIndex"></textarea>

                    <!-- Render dynamic word timing inputs if Word-by-word is enabled and active -->
                    <template v-if="isWordByWord && editItemIndex !== null && editItemIndex < currentItemIndex && editItemTimes.length > 0">
                        <div v-for="(t, i) in editItemTimes" :key="i" class="w-full flex gap-2 my-2 mx-1">
                            <input type="text" class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 w-22 bg-zinc-800 text-zinc-100 border-zinc-800 text-center text-sm"
                                v-model="t.begin" />
                            <input type="text" class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 grow min-w-28 bg-zinc-900 text-zinc-100 border-zinc-700 text-start"
                                v-model="editItemTimes[i].begin" style="display: none;" /> <!-- Helper placeholder to match original -->
                            <input type="text" class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 grow min-w-28 bg-zinc-900 text-zinc-100 border-zinc-700 text-start"
                                :value="itemsList[editItemIndex].words[i]?.text" dir="auto" disabled />
                            <input type="text" class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 w-22 bg-zinc-800 text-zinc-100 border-zinc-800 text-center text-sm"
                                v-model="t.end" />
                        </div>
                    </template>

                    <!-- Render simple line timestamp input if line-by-line has timestamps -->
                    <template v-if="!isWordByWord && editItemIndex !== null && itemsList[editItemIndex]?.time !== undefined">
                        <input type="text" class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 w-24 my-2 mx-1 text-center bg-zinc-800 text-zinc-100 border-zinc-800"
                            v-model="editItemLineTime" />
                    </template>
                </div>
                <div class="flex flex-col gap-0.5 items-start">
                    <div class="px-2 text-zinc-300 rounded-full">
                        <input class="accent-orange-400" id="markAsBg" type="checkbox" name="markAsBg"
                            v-model="markAsBg" />
                        <label class="px-1" for="markAsBg">Mark as background vocal</label>
                    </div>
                    <button class="px-2 py-0.5 text-orange-400 not-disabled:hover:bg-orange-300/20 rounded-full disabled:text-gray-400 transition-colors duration-200"
                        id="addItemAboveBtn" :disabled="editItemIndex === null || editItemIndex <= currentItemIndex"
                        @click="handleAddNewItem(true)">
                        Add Above
                    </button>
                    <button class="px-2 py-0.5 text-orange-400 not-disabled:hover:bg-orange-300/20 rounded-full disabled:text-gray-400 transition-colors duration-200"
                        id="addItemBelowBtn" :disabled="editItemIndex === null || editItemIndex < currentItemIndex"
                        @click="handleAddNewItem(false)">
                        Add Below
                    </button>
                    <button class="px-2 py-0.5 text-red-500 not-disabled:hover:bg-red-400/20 rounded-full transition-all duration-200"
                        id="editItemRemove" @click="handleRemoveItem">
                        Remove
                    </button>
                </div>
                <div class="flex justify-end">
                    <button class="m-1 px-3 py-1 text-orange-400 hover:bg-orange-300/20 rounded-full transition-colors duration-200"
                        id="editItemCancel" @click="editItemModal?.close()">
                        Cancel
                    </button>
                    <button class="m-1 px-3 py-1 font-medium text-black bg-orange-400 rounded-full transition-colors duration-200"
                        id="editItemDone" @click="handleSaveItemEdit">
                        Save
                    </button>
                </div>
                <input id="editItemIndex" type="hidden" name="editItemIndex" :value="editItemIndex" />
            </form>
        </dialog>
    </div>
</template>
