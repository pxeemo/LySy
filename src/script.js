const fileInput = document.getElementById('file')
const audio = document.getElementById('audio')
const playPauseBtn = document.getElementById('playPauseBtn')
const seekBar = document.getElementById('seekBar')
const currentTimeDisplay = document.getElementById('currentTime')
const durationDisplay = document.getElementById('duration')
const wordByWordCheckbox = document.getElementById('isWordByWord')
const duetCheckbox = document.getElementById('isDuet')
const switchVocalistBtn = document.getElementById('switchVocalistBtn')
const wordEndBtn = document.getElementById('wordEndBtn')
let isWordByWord = wordByWordCheckbox.checked
let isDuet = duetCheckbox.checked
const rtlCharsPattern = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

wordByWordCheckbox.addEventListener('change', (e) => {
    isWordByWord = e.target.checked
    if (itemsList.length != 0) {
        plainLyricParser()
    }
    raiseFab(switchVocalistBtn, isDuet, isWordByWord ? 2 : 1)
    raiseFab(wordEndBtn, isWordByWord, 1)
})

function raiseFab(button, raise, step = 1) {
    button.classList.remove('bottom-[-2rem]', 'bottom-16', 'bottom-32')
    if (raise) {
        button.classList.add(step == 1 ? 'bottom-16' : 'bottom-32')
    } else {
        button.classList.add('bottom-[-2rem]')
    }
}

raiseFab(switchVocalistBtn, isDuet, isWordByWord ? 2 : 1)
raiseFab(wordEndBtn, isWordByWord, 1)
duetCheckbox.addEventListener('change', (e) => {
    isDuet = e.target.checked
    if (itemsList.length != 0) {
        plainLyricParser()
    }
    raiseFab(switchVocalistBtn, isDuet, isWordByWord ? 2 : 1)
    raiseFab(wordEndBtn, isWordByWord, 1)
})

function sourceFile() {
    const file = fileInput.files[0]
    if (file) {
        const audioURL = URL.createObjectURL(file)
        const player = document.getElementById('player')
        const fileChooser = document.getElementById('fileChooser')
        audio.src = audioURL
        fileChooser.classList.add('hidden')
        player.classList.remove('hidden')
        player.classList.add('flex')
    }
}

sourceFile()
fileInput.addEventListener('change', sourceFile)

function togglePlayPause() {
    if (audio.paused) {
        audio.play()
        playPauseBtn.firstElementChild.src = './assets/pause.svg'
    } else {
        audio.pause()
        playPauseBtn.firstElementChild.src = './assets/play_arrow.svg'
    }
}

const backwardBtn = document.getElementById('backwardBtn')
backwardBtn.addEventListener('click', () => {
    audio.currentTime -= 6 * audio.playbackRate
    manager.refresh()
})

const forwardBtn = document.getElementById('forwardBtn')
forwardBtn.addEventListener('click', () => {
    audio.currentTime += 5 * audio.playbackRate
    manager.refresh()
})

function formatTime(seconds, lrcformat = true) {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(3)
    if (lrcformat) {
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(6, '0')}`
    } else {
        return `${mins}:${Math.floor(secs).toString().padStart(2, '0')}`
    }
}

function deformatTime(timeText) {
    let time = 0
    timeText
        .split(':')
        .reverse()
        .forEach((t, i) => {
            time += parseFloat(t) * 60 ** i
        })
    return time
}

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
    manager.refresh()
})

// Play/pause button click event
playPauseBtn.addEventListener('click', togglePlayPause)

class AnimationManager {
    constructor() {
        this.animations = new Map() // Tracks all animations
        this.isPaused = true
    }

    // Add element with custom timing
    addElement(element, delay, duration = 0.5) {
        // Store animation data
        this.animations.set(element, {
            delay: delay,
            duration: duration,
            remainingDelay: delay - audio.currentTime,
            isPending: false,
        })

        // set duration css
        element.style.animationDuration = `${duration * 1000}ms`
    }

    setAnimationTimeout(anim, element) {
        anim.startTimeout = setTimeout(() => {
            if (element.nodeName == 'LI') {
                element.classList.remove('text-zinc-400')
                element.classList.add('text-zinc-100')
                if (anim.remainingDelay >= 0)
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    })
            } else if (element.nodeName == 'SPAN') {
                if (anim.remainingDelay >= 0) {
                    element.style.animationName = 'word-gradient'
                    element.style.animationPlayState = 'running'
                }
                element.classList.add('actived')
            }
            anim.isPending = false
        }, anim.remainingDelay * 1000)
    }

    clearCompletion(anim, element, currentTime) {
        anim.isPending = true
        if (element.nodeName == 'LI' && currentTime < anim.delay) {
            element.classList.remove('text-zinc-100')
            element.classList.add('text-zinc-400')
        } else if (
            element.nodeName == 'SPAN' &&
            currentTime < anim.delay + anim.duration
        ) {
            element.classList.remove('actived')
            element.style.animationName = ''
        }
    }

    play() {
        if (!this.isPaused) return

        this.animations.forEach((anim, element) => {
            const currentTime = audio.currentTime
            anim.remainingDelay = anim.delay - currentTime

            this.clearCompletion(anim, element, currentTime)
            this.setAnimationTimeout(anim, element)
        })
        this.isPaused = false
    }

    pause() {
        if (this.isPaused) return
        this.isPaused = true

        this.animations.forEach((anim, element) => {
            // Freeze animation
            element.style.animationPlayState = 'paused'

            if (anim.isPending) clearTimeout(anim.startTimeout)
        })
    }

    refresh() {
        if (this.isPaused) return
        this.animations.forEach((anim, element) => {
            if (anim.isPending) clearTimeout(anim.startTimeout)

            const currentTime = audio.currentTime
            anim.remainingDelay = anim.delay - currentTime

            this.clearCompletion(anim, element, currentTime)
            this.setAnimationTimeout(anim, element)
        })
    }
}

const manager = new AnimationManager()

const lyricInput = document.getElementById('lyricInput')
const parseBtn = document.getElementById('plainInputParser')
const lyricList = document.getElementById('lyricList')
const nextItemBtn = document.getElementById('nextItemBtn')
const prevItemBtn = document.getElementById('prevItemBtn')

const editItemModal = document.getElementById('editItemModal')
const editItemContent = document.getElementById('editItemContent')
const editItemInput = document.getElementById('editItemInput')
const editItemCancel = document.getElementById('editItemCancel')
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
function updateSelection(item, activate, whiteBorder) {
    if (activate) {
        item.classList.remove(
            'bg-orange-900',
            'text-zinc-400',
            'border-zinc-900',
        )
        item.classList.add('text-zinc-100', 'cursor-pointer', 'border-zinc-900')
        if (!whiteBorder) {
            item.classList.add('bg-zinc-800')
        }
    } else {
        item.classList.remove(
            'border-zinc-900',
            'bg-orange-900',
            'bg-zinc-800',
            'text-zinc-100',
            'cursor-pointer',
        )
        item.classList.add('border-zinc-700', 'text-zinc-400')
    }
    if (whiteBorder) {
        item.classList.remove('border-orange-400', 'border-zinc-900')
        item.classList.add('border-zinc-900', 'bg-orange-900')
    }
}

function scrollToItem(item) {
    item.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function splitLineIntoWords(line, lineEl) {
    line.split(' ').forEach((word) => {
        if (word == '') return
        word.split(/(、|-)|<>/).forEach((part) => {
            if (typeof part != 'undefined' && part != '') {
                if (['-', '、'].includes(part)) {
                    lineEl.lastChild.innerText += part
                    return
                }
                const partEl = document.createElement('span')
                partEl.innerText = part
                partEl.classList.add('word')
                if (rtlCharsPattern.test(part)) partEl.classList.add('rtl')

                partEl.dataset.type = 'part'
                lineEl.appendChild(partEl)
            }
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

function createItemElement(line) {
    const item = document.createElement('li')
    const lineEl = document.createElement('p')
    const editIcon = document.createElement('img')
    item.dataset.type = 'normal'
    item.classList.add(
        'flex',
        'p-3',
        'ps-4',
        'gap-2',
        'text-zinc-400',
        'items-center',
        'rounded',
        'border-b-2',
        'border-zinc-800',
        'duration-500',
        'ease-out',
        'transition-color',
        'scroll-mt-[20svh]',
    )

    if (isWordByWord) {
        if (line.trim() == '') return
        splitLineIntoWords(line, lineEl)
    } else lineEl.innerText = line
    if (isDuet) item.dataset.vocalist = 1
    lineEl.classList.add('grow', 'text-xl', 'text-start', 'font-semibold')
    if (rtlCharsPattern.test(line)) lineEl.setAttribute('dir', 'rtl')

    editIcon.classList.add('mx-2', 'cursor-pointer')
    editIcon.src = './assets/edit.svg'
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
        addItemAboveBtn.disabled = index <= currentItemIndex ? true : false
        addItemBelowBtn.disabled = index < currentItemIndex ? true : false
        editItemInput.disabled =
            isWordByWord && index < currentItemIndex ? true : false
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
        item = createItemElement(line)
        lyricList.appendChild(item)
        itemsList.push(item)
    })

    const syncer = document.getElementById('syncer')
    syncer.classList.remove('hidden')
    scrollToItem(itemsList[0])
    if (isWordByWord) {
        updateSelection(itemsList[0], true, true)
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
        manager.refresh()
    })
}

wordEndBtn.addEventListener('click', () => {
    const currentTime = audio.currentTime
    const wordEl =
        itemsList[currentItemIndex]?.children[1]?.children[currentWordIndex]
    if (typeof wordEl?.dataset?.beginTime == 'undefined') return
    wordEl.dataset.endTime = currentTime
})

function next() {
    const currentTime = audio.currentTime
    if (isWordByWord) {
        // First item is not selected yet
        if (currentItemIndex == -1) {
            currentItemIndex++
            currentWordIndex = -1
        }
        const item = itemsList[currentItemIndex]
        const line = item.children[0]
        const prevWord = line.children[currentWordIndex]
        currentWordIndex++

        if (currentWordIndex >= line.childElementCount) {
            // end of line
            updateSelection(item, true, false)
            if (currentItemIndex < itemsList.length - 1) {
                currentWordIndex = -1
                currentItemIndex++
                updateSelection(itemsList[currentItemIndex], true, true)
                scrollToItem(itemsList[currentItemIndex])
            }
            manager.addElement(item, Number(item.dataset.time))
        } else {
            const word = line.children[currentWordIndex]
            word.dataset.beginTime = currentTime
            word.classList.add('actived')
        }
        if (currentWordIndex == 0) timestampItem(item, currentTime)
        if (typeof prevWord != 'undefined') {
            if (typeof prevWord.dataset.endTime == 'undefined')
                prevWord.dataset.endTime = currentTime
            manager.addElement(
                prevWord,
                Number(prevWord.dataset.beginTime),
                currentTime - Number(prevWord.dataset.beginTime),
            )
        }
    } else if (currentItemIndex < itemsList.length - 1) {
        // is line-by-line
        currentItemIndex++
        const item = itemsList[currentItemIndex]
        updateSelection(item, true, false)
        scrollToItem(item)
        timestampItem(item, currentTime)
        manager.addElement(item, Number(item.dataset.time))
    }
}

function clearLine(item) {
    delete item.dataset.time
    item.firstChild.lastChild.innerText = '--:--.---'
    if (isWordByWord) {
        for (let i = 0; i <= item.children[0].childElementCount; i++) {
            const word = item.children[0].children[i]
            if (typeof word != 'undefined' && word.dataset.beginTime) {
                delete word.dataset.beginTime
                delete word.dataset.endTime
                word.classList.remove('actived')
            }
        }
    }
}

function prevItem() {
    if (currentItemIndex >= 0) {
        const item = itemsList[currentItemIndex]
        if (isWordByWord) {
            if (currentWordIndex == -1 && currentItemIndex != 0) {
                const prevItem = itemsList[currentItemIndex - 1]
                updateSelection(item, false, false)
                currentItemIndex--
                updateSelection(prevItem, false, true)
                scrollToItem(prevItem)
                audio.currentTime = Math.max(0, prevItem.dataset.time - 1.5)
            } else {
                updateSelection(item, false, true)
                audio.currentTime = Math.max(0, item.dataset.time - 1.5)
            }
            currentWordIndex = -1
            clearLine(itemsList[currentItemIndex])
        } else {
            const prevItem = itemsList[currentItemIndex - 1]
            currentItemIndex--
            scrollToItem(currentItemIndex == -1 ? itemsList[0] : prevItem)
            audio.currentTime = Math.max(0, item.dataset.time - 1.5)
            updateSelection(item, false, false)
            clearLine(item)
        }
    }
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
            if (fileInput.files.length == 0) {
                fileInput.click()
            } else if (itemsList.length == 0) {
                plainLyricParser()
            } else {
                next()
            }
        }
    }
})

nextItemBtn.addEventListener('click', next)
prevItemBtn.addEventListener('click', prevItem)

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
    if (itemsList.length != 0) {
        for (let i = currentItemIndex; i < itemsList.length; i++) {
            if (i < 0) {
                i++
            }
            switchVocalist(itemsList[i])
        }
    }
})

document.getElementById('playbackSpeed').addEventListener('change', (e) => {
    audio.playbackRate = e.target.selectedOptions[0].value
})

// editItemModal.addEventListener('close', (e) => console.log(e))
// TODO: play audio when the modal gets closed
//
function addNewItem(above) {
    const index = Number(editItemIndex.value)
    newItem = createItemElement(editItemInput.value)
    if (itemsList[index].dataset.vocalist == 2) {
        switchVocalist(newItem)
    }
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
                const beginTime = deformatTime(row.children[0].value)
                const endTime = deformatTime(row.children[2].value)
                wordEl.innerText = row.children[1].value
                wordEl.dataset.beginTime = beginTime
                wordEl.dataset.endTime = endTime
                manager.addElement(wordEl, beginTime, endTime - beginTime)
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
        itemsList[index].children[0].innerText = editItemInput.value
        const time = deformatTime(editItemContent.children[0].value)
        itemsList[index].dataset.time = time
        manager.addElement(itemsList[index], time)
    }
    if (markAsBg.checked) {
        itemsList[index].dataset.type = 'bg'
        itemsList[index].children[0].classList.remove('text-lg')
        itemsList[index].children[0].classList.add('text-sm')
    } else {
        itemsList[index].dataset.type = 'normal'
        itemsList[index].children[0].classList.remove('text-sm')
        itemsList[index].children[0].classList.add('text-lg')
    }
})

function downloadTextFile(filename, text) {
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
    let text = ''
    itemsList.forEach((item) => {
        const time = item.dataset.time
        if (typeof time != 'undefined') {
            if (item.dataset.type == 'normal') {
                text += `[${formatTime(time)}]`
                if (isDuet) text += item.dataset.vocalist == 1 ? 'v1:' : 'v2:'
            } else {
                text = text.slice(0, -1) + ' [bg:'
            }

            if (isWordByWord) {
                text += `<${formatTime(time)}>`
                Array.from(item.children[0].children).forEach((word) => {
                    const beginTime = `<${formatTime(word.dataset.beginTime)}>`
                    text +=
                        `${text.endsWith(beginTime) ? '' : beginTime}` +
                        word.innerText +
                        `${word.dataset.type == 'word' ? ' ' : ''}` +
                        `<${formatTime(word.dataset.endTime)}>`
                })
            } else {
                text += `${item.children[0].innerText}`
            }

            if (item.dataset.type == 'bg') {
                text += ']'
            }
            text += '\n'
        }
    })
    if (fileInput.files.length != 0) {
        const inputFileName = fileInput.files[0].name
        filename = inputFileName.split('.').slice(0, -1).join('.') + '.lrc'
    } else {
        alert('You need to select an input file first')
        return
    }
    downloadTextFile(filename, text)
})

audio.addEventListener('play', () => manager.play())
audio.addEventListener('pause', () => manager.pause())
