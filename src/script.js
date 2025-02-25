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
})

const forwardBtn = document.getElementById('forwardBtn')
forwardBtn.addEventListener('click', () => {
    audio.currentTime += 5 * audio.playbackRate
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
})

// Play/pause button click event
playPauseBtn.addEventListener('click', togglePlayPause)

const lyricInput = document.getElementById('lyricInput')
const parseBtn = document.getElementById('plainInputParser')
const lyricList = document.getElementById('lyricList')
const nextItemBtn = document.getElementById('nextItemBtn')
const prevItemBtn = document.getElementById('prevItemBtn')

const editItemModal = document.getElementById('editItemModal')
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

// Function to update the timestamped item
function updateSelection(item, activate, whiteBorder) {
    if (activate) {
        item.classList.remove(
            'border-zinc-700',
            'text-zinc-400',
            'border-zinc-400',
        )
        item.classList.add(
            'text-zinc-100',
            'cursor-pointer',
            'border-orange-400',
        )
        if (!whiteBorder) {
            item.classList.add('bg-orange-900')
        }
    } else {
        item.classList.remove(
            'border-zinc-400',
            'border-orange-400',
            'bg-orange-900',
            'text-zinc-100',
            'cursor-pointer',
        )
        item.classList.add('border-zinc-700', 'text-zinc-400')
    }
    if (whiteBorder) {
        item.classList.remove('border-orange-400', 'border-zinc-700')
        item.classList.add('border-zinc-400')
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
                partEl.classList.add('text-zinc-400')
                partEl.dataset.type = 'part'
                lineEl.appendChild(partEl)
            }
        })
        lineEl.lastChild.dataset.type = 'word'
        lineEl.innerHTML += ' '
    })
}

function createItemElement(line) {
    const item = document.createElement('li')
    const timestamp = document.createElement('div')
    const updateTimeIcon = document.createElement('img')
    const timestampText = document.createElement('span')
    const lineEl = document.createElement('div')
    const editIcon = document.createElement('img')
    item.dataset.type = 'normal'
    item.classList.add(
        'flex',
        'px-1',
        'gap-1',
        'my-2',
        'rounded-md',
        'text-zinc-400',
        'items-center',
        'border-2',
        'border-zinc-700',
        'duration-500',
        'ease-out',
        'transition-color',
        'scroll-mt-[20svh]',
    )
    updateTimeIcon.classList.add('mx-auto')
    updateTimeIcon.src = './assets/update.svg'
    updateTimeIcon.width = 15
    timestampText.innerText = '--:--.---'

    editIcon.classList.add('mx-2', 'cursor-pointer')
    editIcon.src = './assets/edit.svg'
    editIcon.width = 20
    editIcon.addEventListener('click', (e) => {
        e.stopPropagation()
        const target = e.currentTarget.previousElementSibling
        const index = itemsList.indexOf(e.currentTarget.parentNode)
        editItemInput.value = target.innerText
        markAsBg.checked = target.parentElement.dataset.type == 'bg'
        addItemAboveBtn.disabled = index <= currentItemIndex ? true : false
        addItemBelowBtn.disabled = index < currentItemIndex ? true : false
        editItemInput.disabled =
            isWordByWord && index < currentItemIndex ? true : false
        editItemModal.showModal()
        editItemIndex.value = index
        editItemInput.focus()
    })

    timestamp.classList.add('w-18', 'items-center', 'text-center', 'text-xs')
    timestamp.appendChild(updateTimeIcon)
    timestamp.appendChild(timestampText)
    timestamp.classList.add('font-mono', 'p-1', 'cursor-pointer')
    timestamp.addEventListener('click', (e) => {
        e.stopPropagation()
        const target = e.currentTarget
        target.children[1].innerText = formatTime(audio.currentTime)
        target, (parentNode.dataset.time = audio.currentTime)
        updateSelection(target.parentNode)
    })

    // Regex to detect Hebrew or Arabic characters
    const isRTL = /^[\u0591-\u07FF\uFB1D-\uFEFC]/.test(line)
    if (isWordByWord) {
        if (line.trim() == '') return
        splitLineIntoWords(line, lineEl)
    } else {
        lineEl.innerText = line
    }
    if (isDuet) item.dataset.vocalist = 1
    lineEl.classList.add('grow', 'text-lg', 'text-start', isRTL ? 'rtl' : 'ltr')

    item.appendChild(timestamp)
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
    item.firstChild.children[1].innerText = formatTime(currentTime)
    item.dataset.time = currentTime
    item.addEventListener('click', () => {
        if (typeof item.dataset.time != 'undefined') {
            audio.currentTime = item.dataset.time
        }
    })
}

wordEndBtn.addEventListener('click', () => {
    const currentTime = audio.currentTime
    const word =
        itemsList[currentItemIndex]?.children[1]?.children[currentWordIndex]
    if (typeof word == 'undefined') return
    word.dataset.endTime = currentTime
    word.classList.remove('text-unfinished')
    word.classList.add('text-zinc-100')
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
        const line = item.children[1]
        const prevWord = line.children[currentWordIndex]
        currentWordIndex++

        if (currentWordIndex >= line.childElementCount) {
            updateSelection(item, true, false)
            if (currentItemIndex < itemsList.length - 1) {
                currentWordIndex = -1
                currentItemIndex++
                updateSelection(itemsList[currentItemIndex], true, true)
                scrollToItem(itemsList[currentItemIndex])
            }
        } else {
            const word = line.children[currentWordIndex]
            word.dataset.beginTime = currentTime
            word.classList.remove('text-zinc-400')
            word.classList.add('text-unfinished')
        }
        prevWord?.classList.remove('text-unfinished')
        prevWord?.classList.add('text-zinc-100')
        if (currentWordIndex == 0) {
            timestampItem(item, currentTime)
        }
        if (
            typeof prevWord != 'undefined' &&
            typeof prevWord.dataset.endTime == 'undefined'
        ) {
            prevWord.dataset.endTime = currentTime
        }
    } else if (currentItemIndex < itemsList.length - 1) {
        currentItemIndex++
        const item = itemsList[currentItemIndex]
        updateSelection(item, true, false)
        scrollToItem(item)
        timestampItem(item, currentTime)
    }
}

function clearLine(item) {
    delete item.dataset.time
    item.firstChild.lastChild.innerText = '--:--.---'
    if (isWordByWord) {
        for (let i = 0; i <= item.children[1].childElementCount; i++) {
            const word = item.children[1].children[i]
            if (typeof word != 'undefined' && word.dataset.beginTime) {
                delete word.dataset.beginTime
                delete word.dataset.endTime
                word.classList.remove('text-zinc-100', 'text-unfinished')
                word.classList.add('text-zinc-400')
            }
        }
    }
}

function prevItem() {
    if (currentItemIndex >= 0) {
        const item = itemsList[currentItemIndex]
        if (isWordByWord) {
            if (currentWordIndex == -1 && currentItemIndex != 0) {
                const prevItemElement = itemsList[currentItemIndex - 1]
                updateSelection(item, false, false)
                currentItemIndex--
                updateSelection(prevItemElement, false, true)
                scrollToItem(prevItemElement)
                audio.currentTime = Math.max(
                    0,
                    prevItemElement.dataset.time - 1.5,
                )
            } else {
                updateSelection(item, false, true)
                audio.currentTime = Math.max(0, item.dataset.time - 1.5)
            }
            currentWordIndex = -1
            clearLine(itemsList[currentItemIndex])
        } else {
            const prevItemElement = itemsList[currentItemIndex - 1]
            currentItemIndex--
            scrollToItem(
                currentItemIndex == -1 ? itemsList[0] : prevItemElement,
            )
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
        item.children[1].classList.remove('text-start')
        item.children[1].classList.add('text-end')
    } else {
        item.dataset.vocalist = 1
        item.children[1].classList.remove('text-end')
        item.children[1].classList.add('text-start')
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
        itemsList[index].children[1].innerHTML = ''
        splitLineIntoWords(editItemInput.value, itemsList[index].children[1])
        currentWordIndex = -1
    } else {
        itemsList[index].children[1].innerText = editItemInput.value
    }
    if (markAsBg.checked) {
        itemsList[index].dataset.type = 'bg'
        itemsList[index].children[1].classList.remove('text-lg')
        itemsList[index].children[1].classList.add('text-sm')
    } else {
        itemsList[index].dataset.type = 'normal'
        itemsList[index].children[1].classList.remove('text-sm')
        itemsList[index].children[1].classList.add('text-lg')
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
                Array.from(item.children[1].children).forEach((word) => {
                    const beginTime = `<${formatTime(word.dataset.beginTime)}>`
                    text +=
                        `${text.endsWith(beginTime) ? '' : beginTime}` +
                        word.innerText +
                        `${word.dataset.type == 'word' ? ' ' : ''}` +
                        `<${formatTime(word.dataset.endTime)}>`
                })
            } else {
                text += `${item.children[1].innerText}`
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
