import { AnimationManager } from '/src/utils/previewAnimation'
import { generateLrc } from '/src/utils/fileformat/lrc'
import { formatTime, deformatTime } from '/src/utils/helpers'

const fileInput = document.getElementById('file')
const removeSongBtn = document.getElementById('removeSongBtn')
const audio = document.getElementById('audio')
const playPauseBtn = document.getElementById('playPauseBtn')
const seekBar = document.getElementById('seekBar')
const miniPlayer = document.getElementById('player')
const fileChooser = document.getElementById('fileChooser')
const currentTimeDisplay = document.getElementById('currentTime')
const durationDisplay = document.getElementById('duration')
const wordByWordCheckbox = document.getElementById('isWordByWord')
const charByCharCheckbox = document.getElementById('isCharByChar')
const duetCheckbox = document.getElementById('isDuet')
const switchVocalistBtn = document.getElementById('switchVocalistBtn')
const wordEndBtn = document.getElementById('wordEndBtn')
let isWordByWord = wordByWordCheckbox.checked
let isCharByChar = charByCharCheckbox.checked
let isDuet = duetCheckbox.checked
const rtlCharsPattern = /^[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

wordByWordCheckbox.addEventListener('change', (e) => {
    isWordByWord = e.target.checked
    if (itemsList.length != 0) plainLyricParser()
    if (isCharByChar && !isWordByWord) charByCharCheckbox.click()
    raiseFab(switchVocalistBtn, isDuet, isWordByWord ? 2 : 1)
    raiseFab(wordEndBtn, isWordByWord, 1)
})

charByCharCheckbox.addEventListener('change', (e) => {
    isCharByChar = e.target.checked
    if (isCharByChar && !isWordByWord) wordByWordCheckbox.click()
})

function raiseFab(button, raise, step = 1) {
    button.classList.remove('bottom-[-2rem]', 'bottom-16', 'bottom-32')
    if (raise) button.classList.add(step == 1 ? 'bottom-16' : 'bottom-32')
    else button.classList.add('bottom-[-2rem]')
}

raiseFab(switchVocalistBtn, isDuet, isWordByWord ? 2 : 1)
raiseFab(wordEndBtn, isWordByWord, 1)
duetCheckbox.addEventListener('change', (e) => {
    isDuet = e.target.checked
    if (itemsList.length != 0) plainLyricParser()
    raiseFab(switchVocalistBtn, isDuet, isWordByWord ? 2 : 1)
    raiseFab(wordEndBtn, isWordByWord, 1)
})

function sourceFile() {
    const file = fileInput.files[0]
    if (file) {
        const audioURL = URL.createObjectURL(file)
        audio.src = audioURL
        fileChooser.classList.add('hidden')
        miniPlayer.classList.remove('hidden')
        miniPlayer.classList.add('flex')
    }
}

sourceFile()
fileInput.addEventListener('change', sourceFile)
removeSongBtn.addEventListener('click', () => {
    miniPlayer.classList.remove('flex')
    miniPlayer.classList.add('hidden')
    fileChooser.classList.remove('hidden')
    audio.pause()
})

const backwardBtn = document.getElementById('backwardBtn')
backwardBtn.addEventListener('click', () => {
    audio.currentTime -= 6 * audio.playbackRate
    previewAnim.refresh(audio.currentTime, 1 / audio.playbackRate)
})

const forwardBtn = document.getElementById('forwardBtn')
forwardBtn.addEventListener('click', () => {
    audio.currentTime += 5 * audio.playbackRate
    previewAnim.refresh(audio.currentTime, 1 / audio.playbackRate)
})

// Update seek bar as the audio plays
audio.addEventListener('timeupdate', () => {
    seekBar.value = (audio.currentTime / audio.duration) * 100
    currentTimeDisplay.textContent = formatTime(audio.currentTime, false)
})

// Update duration once metadata is loaded
audio.addEventListener('loadedmetadata', () => {
    durationDisplay.textContent = formatTime(audio.duration, false)
})

// Seek when seek bar is changed
seekBar.addEventListener('input', () => {
    audio.currentTime = (seekBar.value / 100) * audio.duration
    previewAnim.refresh(audio.currentTime, 1 / audio.playbackRate)
})

// Play/pause button click event
playPauseBtn.addEventListener('click', () => {
    audio.paused ? audio.play() : audio.pause()
})

const previewAnim = new AnimationManager()

const lyricInput = document.getElementById('lyricInput')
const parseBtn = document.getElementById('plainInputParser')
const lyricList = document.getElementById('lyricList')
const nextItemBtn = document.getElementById('nextItemBtn')
const prevItemBtn = document.getElementById('prevItemBtn')

import editIconSvg from '/src/assets/edit.svg'
const editItemModal = document.getElementById('editItemModal')
const editItemContent = document.getElementById('editItemContent')
const editItemInput = document.getElementById('editItemInput')
const editItemRemove = document.getElementById('editItemRemove')
const editItemDone = document.getElementById('editItemDone')
const editItemIndex = document.getElementById('editItemIndex')
const addItemAboveBtn = document.getElementById('addItemAboveBtn')
const addItemBelowBtn = document.getElementById('addItemBelowBtn')
const markAsBg = document.getElementById('markAsBg')

let itemsList = []
let currentItemIndex = -1
let currentWordIndex = -1

// Function to update the style of timestamped item
function updateSelection(item, mode) {
    const activeStyle = [
        'text-zinc-100',
        'cursor-pointer',
        'border-zinc-900',
        'bg-zinc-800',
    ]
    const selectedStyle = ['border-orange-400', 'rounded-b-2xl']
    const normalStyle = ['border-zinc-900', 'text-zinc-400']
    item.classList.remove(...activeStyle, ...selectedStyle, ...normalStyle)
    if (mode == 'active') item.classList.add(...activeStyle)
    else if (mode == 'selected') item.classList.add(...selectedStyle)
    else if (mode == 'normal') item.classList.add(...normalStyle)
}

function scrollToItem(item) {
    item.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function createWordPartElement(text) {
    const partEl = document.createElement('span')
    partEl.innerText = text
    partEl.classList.add('word')
    if (rtlCharsPattern.test(text)) partEl.classList.add('rtl')
    partEl.dataset.type = 'part'
    return partEl
}

function splitLineIntoChars(line, lineEl) {
    Array.from(line).forEach((char) => {
        if (char == '') return
        // ignore if it's not a word char (symbols and spaces)
        if (/\W/.test(char)) {
            lineEl.lastChild.innerText += char
            return
        }
        lineEl.appendChild(createWordPartElement(char))
    })
}

function splitLineIntoWords(line, lineEl) {
    line.split(' ').forEach((word) => {
        if (word == '') return
        word.split(/(-)|<>/).forEach((part) => {
            if (typeof part == 'undefined' || part == '') return
            if (part == '-') {
                lineEl.lastChild.innerText += part
                return
            }
            lineEl.appendChild(createWordPartElement(part))
        })
        lineEl.lastChild.dataset.type = 'word'
        lineEl.innerHTML += ' '
    })
}

function createInputElement(type = null) {
    const inputEl = document.createElement('input')
    inputEl.classList.add(
        'h-8',
        'outline-none',
        'rounded-md',
        'p-1',
        'transition-all',
        'ease-in-out',
        'duration-300',
        'border-2',
        'focus:border-orange-400',
    )
    if (type != null) inputEl.dataset.type = type
    return inputEl
}

function createTimedWordEditor(wordEl) {
    const row = document.createElement('div')
    row.classList.add('w-full', 'flex', 'gap-2', 'my-2', 'mx-1')

    const beginTimeEl = createInputElement()
    beginTimeEl.classList.add(
        'w-22',
        'bg-zinc-800',
        'text-zinc-100',
        'border-zinc-800',
        'text-center',
        'text-sm',
    )
    beginTimeEl.value = formatTime(wordEl.dataset.beginTime)
    row.appendChild(beginTimeEl)

    const textEl = createInputElement(wordEl.dataset.type)
    textEl.value = wordEl.innerText
    textEl.setAttribute('dir', 'auto')
    textEl.dataset.type = wordEl.dataset.type
    textEl.classList.add(
        'grow',
        'min-w-28',
        'bg-zinc-900',
        'text-zinc-100',
        'border-zinc-700',
        textEl.dataset.type == 'word' ? 'text-start' : 'text-end',
    )
    row.appendChild(textEl)

    const endTimeEl = createInputElement()
    endTimeEl.classList.add(
        'w-22',
        'bg-zinc-800',
        'text-zinc-100',
        'border-zinc-800',
        'text-center',
        'text-sm',
    )
    endTimeEl.value = formatTime(wordEl.dataset.endTime)
    row.appendChild(endTimeEl)

    return row
}

function createItemElement(line, isBg = false) {
    const item = document.createElement('li')
    const lineEl = document.createElement('p')
    const editIcon = document.createElement('img')
    item.dataset.type = isBg ? 'bg' : 'normal'
    item.classList.add(
        'flex',
        isBg ? 'py-2' : 'py-4',
        'px-5',
        'gap-2',
        'text-zinc-400',
        'items-center',
        'rounded',
        'first:rounded-t-2xl',
        'last:rounded-b-2xl',
        'border-1',
        'border-zinc-900',
        'duration-300',
        'ease-out',
        'transition-all',
        'scroll-mt-[20svh]',
    )

    if (isWordByWord) {
        if (line.trim() == '') return
        if (isCharByChar) splitLineIntoChars(line, lineEl)
        else splitLineIntoWords(line, lineEl)
    } else lineEl.innerText = line
    if (isDuet) item.dataset.vocalist = 1
    lineEl.classList.add(
        'grow',
        isBg ? null : 'text-2xl',
        'transition-all',
        'duration-300',
    )
    if (rtlCharsPattern.test(line)) lineEl.setAttribute('dir', 'rtl')

    editIcon.classList.add('mx-2', 'cursor-pointer')
    editIcon.src = editIconSvg
    editIcon.width = 20
    editIcon.addEventListener('click', (e) => {
        e.stopPropagation()
        const target = e.currentTarget.previousElementSibling
        const index = itemsList.indexOf(e.currentTarget.parentNode)
        let text = ''
        editItemContent.innerHTML = ''
        if (isWordByWord) {
            editItemContent.appendChild(editItemInput)
            const isTimed =
                typeof target.lastElementChild.dataset.endTime != 'undefined'
            Array.from(target.children).forEach((e) => {
                text += e.innerText
                text += e.dataset.type == 'word' ? ' ' : '<>'
                if (isTimed) {
                    const row = createTimedWordEditor(e)
                    editItemContent.appendChild(row)
                }
            })
            editItemInput.value = text.trimEnd()
        } else {
            if (typeof target.parentElement.dataset.time != 'undefined') {
                const timeEl = createInputElement()
                timeEl.classList.add(
                    'w-24',
                    'my-2',
                    'mx-1',
                    'text-center',
                    'bg-zinc-800',
                    'text-zinc-100',
                    'border-zinc-800',
                )
                timeEl.value = formatTime(target.parentElement.dataset.time)
                editItemContent.appendChild(timeEl)
            }
            editItemInput.value = target.innerText
            editItemContent.appendChild(editItemInput)
        }
        markAsBg.checked = target.parentElement.dataset.type == 'bg'
        addItemAboveBtn.disabled = index <= currentItemIndex
        addItemBelowBtn.disabled = index < currentItemIndex
        editItemInput.disabled = isWordByWord && index < currentItemIndex
        editItemModal.showModal()
        editItemIndex.value = index
        editItemInput.focus()
    })

    item.appendChild(lineEl)
    item.appendChild(editIcon)

    return item
}

function plainLyricParser() {
    const plainLyric = lyricInput.value
    lyricList.innerHTML = ''
    itemsList = []
    currentItemIndex = -1
    plainLyric.split('\n').forEach((line) => {
        if (isWordByWord && line.trim() == '') return
        const item = createItemElement(line)
        lyricList.appendChild(item)
        itemsList.push(item)
    })

    const syncer = document.getElementById('syncer')
    syncer.classList.remove('hidden')
    scrollToItem(itemsList[0])
    if (isWordByWord) {
        updateSelection(itemsList[0], 'selected')
    }

    raiseFab(nextItemBtn, true, 1)
    raiseFab(prevItemBtn, true, 2)
}
parseBtn.addEventListener('click', plainLyricParser)

function timestampItem(item, currentTime) {
    item.dataset.time = currentTime
    item.addEventListener('click', () => {
        if (typeof item.dataset.time == 'undefined') return
        audio.currentTime = item.dataset.time
        previewAnim.refresh(audio.currentTime, 1 / audio.playbackRate)
    })
}

function wordEnd() {
    const lineEl = itemsList[currentItemIndex].children[0]
    const wordEl = lineEl.children[currentWordIndex]
    if (typeof wordEl?.dataset?.beginTime == 'undefined') return
    wordEl.dataset.endTime = audio.currentTime
    wordEl.classList.add('active')
    if (currentWordIndex + 1 >= lineEl.childElementCount) {
        // end of line
        previewAnim.addElement(
            wordEl,
            Number(wordEl.dataset.beginTime),
            audio.currentTime,
            Number(wordEl.dataset.endTime) - Number(wordEl.dataset.beginTime),
        )
        updateSelection(itemsList[currentItemIndex], 'active')
        if (currentItemIndex <= itemsList.length - 1) {
            currentWordIndex = -1
            currentItemIndex++
            if (currentItemIndex != itemsList.length) {
                updateSelection(itemsList[currentItemIndex], 'selected')
                scrollToItem(itemsList[currentItemIndex])
            }
        }
    }
}

function next() {
    const currentTime = audio.currentTime
    if (isWordByWord) {
        // First item is not selected yet
        if (currentItemIndex == -1) {
            currentItemIndex++
            currentWordIndex = -1
        }
        const prevWord =
            itemsList[currentItemIndex].children[0].children[currentWordIndex]

        if (typeof prevWord != 'undefined') {
            const dataset = prevWord.dataset
            if (typeof dataset.endTime == 'undefined')
                dataset.endTime = currentTime
            previewAnim.addElement(
                prevWord,
                Number(dataset.beginTime),
                audio.currentTime,
                Number(dataset.endTime) - Number(dataset.beginTime),
            )
        }

        currentWordIndex++

        // end of line
        if (
            currentWordIndex >=
            itemsList[currentItemIndex].children[0].childElementCount
        ) {
            updateSelection(itemsList[currentItemIndex], 'active')
            if (currentItemIndex <= itemsList.length - 1) {
                currentItemIndex++
                if (currentItemIndex != itemsList.length) {
                    updateSelection(itemsList[currentItemIndex], 'selected')
                    scrollToItem(itemsList[currentItemIndex])
                    currentWordIndex = 0
                } else {
                    currentWordIndex = -1
                    return
                }
            }
        }

        const item = itemsList[currentItemIndex]
        const line = item.children[0]
        const word = line.children[currentWordIndex]
        word.dataset.beginTime = currentTime
        word.classList.add('actived')
        if (currentWordIndex == 0) {
            timestampItem(item, currentTime)
            previewAnim.addElement(
                item,
                Number(item.dataset.time),
                audio.currentTime,
            )
        }
    } else if (currentItemIndex < itemsList.length - 1) {
        // is line-by-line
        currentItemIndex++
        const item = itemsList[currentItemIndex]
        updateSelection(item, 'active')
        scrollToItem(item)
        timestampItem(item, currentTime)
        previewAnim.addElement(
            item,
            Number(item.dataset.time),
            audio.currentTime,
        )
    }
}

function clearLine(item) {
    previewAnim.removeElement(item)
    delete item.dataset.time
    if (isWordByWord) {
        Array.from(item.children[0].children).forEach((wordEl) => {
            if (typeof wordEl?.dataset?.beginTime == 'undefined') return
            if (typeof wordEl?.dataset?.endTime != 'undefined')
                previewAnim.removeElement(wordEl)
            delete wordEl.dataset.beginTime
            delete wordEl.dataset.endTime
            wordEl.classList.remove('actived')
            wordEl.style.animationName = ''
        })
    }
}

function prevItem() {
    if (currentItemIndex < 0) return
    const item = itemsList[currentItemIndex]
    if (isWordByWord) {
        if (currentWordIndex == -1 && currentItemIndex != 0) {
            const prevItem = itemsList[currentItemIndex - 1]
            updateSelection(prevItem, 'selected')
            scrollToItem(prevItem)
            audio.currentTime = Math.max(0, prevItem.dataset.time - 1.5)
            clearLine(prevItem)
            if (currentItemIndex != itemsList.length)
                updateSelection(item, 'normal')
            currentItemIndex--
        } else if (currentWordIndex != -1) {
            // we are in the middle of line
            audio.currentTime = Math.max(0, item.dataset.time - 1.5)
            clearLine(item)
            currentWordIndex = -1
        }
    } else {
        const prevItem = itemsList[currentItemIndex - 1]
        currentItemIndex--
        scrollToItem(currentItemIndex == -1 ? itemsList[0] : prevItem)
        audio.currentTime = Math.max(0, item.dataset.time - 1.5)
        updateSelection(item, 'normal')
        clearLine(item)
    }
    previewAnim.refresh(audio.currentTime, 1 / audio.playbackRate)
}

// Add keyboard event listener for spacebar
window.addEventListener('keydown', (e) => {
    if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName)
    ) {
        e.preventDefault()
        if (e.shiftKey) {
            prevItem()
        } else {
            if (fileInput.files.length == 0) fileInput.click()
            else if (itemsList.length == 0) plainLyricParser()
            else next()
        }
    }
})

nextItemBtn.addEventListener('click', next)
prevItemBtn.addEventListener('click', prevItem)
wordEndBtn.addEventListener('click', wordEnd)

function switchVocalist(item) {
    if (item.dataset.vocalist == 1) {
        item.dataset.vocalist = 2
        item.children[0].classList.remove('text-start')
        item.children[0].classList.add('text-end')
    } else {
        item.dataset.vocalist = 1
        item.children[0].classList.remove('text-end')
        item.children[0].classList.add('text-start')
    }
}
switchVocalistBtn.addEventListener('click', () => {
    if (itemsList.length == 0) return
    itemsList.slice(Math.max(0, currentItemIndex)).forEach((item) => {
        switchVocalist(item)
    })
})

document.getElementById('playbackSpeed').addEventListener('change', (e) => {
    audio.playbackRate = e.target.selectedOptions[0].value
    previewAnim.refresh(audio.currentTime, 1 / audio.playbackRate)
})

// editItemModal.addEventListener('close', (e) => console.log(e))

function addNewItem(above) {
    const index = Number(editItemIndex.value)
    const newItem = createItemElement(editItemInput.value, markAsBg.checked)
    if (itemsList[index].dataset.vocalist == 2) switchVocalist(newItem)
    if (above) {
        itemsList[index].insertAdjacentElement('beforebegin', newItem)
        itemsList.splice(index, 0, newItem)
    } else {
        itemsList[index].insertAdjacentElement('afterend', newItem)
        itemsList.splice(index + 1, 0, newItem)
    }
}

addItemAboveBtn.addEventListener('click', () => addNewItem(true))
addItemBelowBtn.addEventListener('click', () => addNewItem(false))
editItemRemove.addEventListener('click', () => {
    const index = editItemIndex.value
    itemsList[index].classList.add('hidden')
    itemsList.splice(index, 1)
    if (currentItemIndex >= index) {
        currentItemIndex--
        if (currentItemIndex == index - 1) {
            currentWordIndex = 99
        }
    }
})

editItemDone.addEventListener('click', () => {
    const index = editItemIndex.value
    if (isWordByWord) {
        if (editItemInput.disabled) {
            Array.from(editItemContent.children).forEach((row, i) => {
                if (row.nodeName == 'TEXTAREA') return
                const wordEl = itemsList[index].children[0].children[i - 1]
                previewAnim.removeElement(wordEl)
                const beginTime = deformatTime(row.children[0].value)
                const endTime = deformatTime(row.children[2].value)
                wordEl.innerText = row.children[1].value
                wordEl.dataset.beginTime = beginTime
                wordEl.dataset.endTime = endTime
                previewAnim.addElement(
                    wordEl,
                    beginTime,
                    audio.currentTime,
                    endTime - beginTime,
                )
            })
            itemsList[index].dataset.time =
                itemsList[index].children[0].children[0].dataset.beginTime
        } else {
            itemsList[index].children[0].innerHTML = ''
            splitLineIntoWords(
                editItemInput.value,
                itemsList[index].children[0],
            )
            currentWordIndex = -1
        }
    } else {
        previewAnim.removeElement(itemsList[index])
        itemsList[index].children[0].innerText = editItemInput.value
        const time = deformatTime(editItemContent.children[0].value)
        itemsList[index].dataset.time = time
        previewAnim.addElement(itemsList[index], time, audio.currentTime)
    }
    if (markAsBg.checked) {
        itemsList[index].dataset.type = 'bg'
        itemsList[index].children[0].classList.remove('text-2xl', 'p-4')
        itemsList[index].classList.remove('py-4')
        itemsList[index].classList.add('py-2')
    } else {
        itemsList[index].dataset.type = 'normal'
        itemsList[index].classList.remove('py-2')
        itemsList[index].classList.add('py-4')
        itemsList[index].children[0].classList.add('text-2xl')
    }
})

function downloadFileRequest(filename, text) {
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

const dlFileBtn = document.getElementById('dlFile')
dlFileBtn.addEventListener('click', () => {
    if (fileInput.files.length == 0) {
        alert('You need to select an input file first')
        return
    }
    const text = generateLrc(itemsList, isWordByWord, isDuet)
    const inputFileName = fileInput.files[0].name
    // change the extension to .lrc
    const filename = inputFileName.replace(/(\.\w+?)?$/, '.lrc')
    downloadFileRequest(filename, text)
})

audio.addEventListener('play', () => {
    previewAnim.play(audio.currentTime, 1 / audio.playbackRate)
    playPauseBtn.firstElementChild.classList.add('hidden')
    playPauseBtn.lastElementChild.classList.remove('hidden')
})
audio.addEventListener('pause', () => {
    previewAnim.pause()
    playPauseBtn.firstElementChild.classList.remove('hidden')
    playPauseBtn.lastElementChild.classList.add('hidden')
})
