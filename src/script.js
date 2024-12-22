const fileInput = document.getElementById('file')
const audio = document.getElementById('audio')
const playPauseBtn = document.getElementById('playPauseBtn')
const seekBar = document.getElementById('seekBar')
const currentTimeDisplay = document.getElementById('currentTime')
const durationDisplay = document.getElementById('duration')
const wordByWordCheckbox = document.getElementById('isWordByWord')
let isWordByWord = wordByWordCheckbox.checked

wordByWordCheckbox.addEventListener('change', (e) => {
    isWordByWord = e.target.checked
    if (itemsList.length != 0) {
        plainLyricParser()
    }
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
        playPauseBtn.firstChild.src = './assets/pause.svg'
    } else {
        audio.pause()
        playPauseBtn.firstChild.src = './assets/play_arrow.svg'
    }
}

const backwardBtn = document.getElementById('backwardBtn')
backwardBtn.addEventListener('click', () => {
    audio.currentTime -= 6
})

const forwardBtn = document.getElementById('forwardBtn')
forwardBtn.addEventListener('click', () => {
    audio.currentTime += 5
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
        word.split(/([,،、]|-)|<>/).forEach((part) => {
            if (typeof part != 'undefined' && part != '') {
                if (part == '-') {
                    lineEl.lastChild.innerText += '-'
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

const editItemModal = document.getElementById('editItemModal')
const editItemInput = document.getElementById('editItemInput')
const editItemCancel = document.getElementById('editItemCancel')
const editItemRemove = document.getElementById('editItemRemove')
const editItemDone = document.getElementById('editItemDone')
const editItemIndex = document.getElementById('editItemIndex')
function plainLyricParser() {
    const plainLyric = lyricInput.value
    lyricList.innerHTML = ''
    itemsList = []
    currentItemIndex = -1
    plainLyric.split('\n').forEach((line) => {
        const item = document.createElement('li')
        const timestamp = document.createElement('div')
        const updateTimeIcon = document.createElement('img')
        const timestampText = document.createElement('span')
        const lineEl = document.createElement('div')
        const editIcon = document.createElement('img')
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
            editItemInput.value = target.innerText
            editItemModal.showModal()
            editItemIndex.value = itemsList.indexOf(e.currentTarget.parentNode)
            editItemInput.focus()
        })

        timestamp.classList.add(
            'w-18',
            'items-center',
            'text-center',
            'text-xs',
        )
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

        if (isWordByWord) {
            if (line.trim() == '') return
            splitLineIntoWords(line, lineEl)
        } else {
            lineEl.innerText = line
        }
        lineEl.classList.add('grow')

        item.appendChild(timestamp)
        item.appendChild(lineEl)
        item.appendChild(editIcon)

        lyricList.appendChild(item)
        itemsList.push(item)
    })

    const syncer = document.getElementById('syncer')
    syncer.classList.remove('hidden')
    scrollToItem(itemsList[0])
    if (isWordByWord) {
        updateSelection(itemsList[0], true, true)
    }

    nextItemBtn.classList.remove('bottom-0')
    nextItemBtn.classList.add('bottom-14')
    prevItemBtn.classList.remove('bottom-0')
    prevItemBtn.classList.add('bottom-28')
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
            word.classList.add('text-zinc-100')
        }
        if (currentWordIndex == 0) {
            timestampItem(item, currentTime)
        }
        if (typeof prevWord != 'undefined') {
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
                word.classList.remove('text-zinc-100')
                word.classList.add('text-zinc-400')
            }
        }
    }
}

function prevItem() {
    if (currentItemIndex >= 0) {
        if (isWordByWord) {
            if (currentWordIndex == -1 && currentItemIndex != 0) {
                updateSelection(itemsList[currentItemIndex], false, false)
                currentItemIndex--
                const prevItemElement = itemsList[currentItemIndex]
                updateSelection(prevItemElement, false, true)
                scrollToItem(prevItemElement)
            } else {
                updateSelection(itemsList[currentItemIndex], false, true)
            }
            currentWordIndex = -1
            clearLine(itemsList[currentItemIndex])
        } else {
            updateSelection(itemsList[currentItemIndex], false, false)
            clearLine(itemsList[currentItemIndex])

            currentItemIndex--
            if (currentItemIndex == -1) {
                scrollToItem(itemsList[0])
                audio.currentTime = 0
            } else {
                const prevItemElement = itemsList[currentItemIndex]
                scrollToItem(prevItemElement)
                audio.currentTime = prevItemElement.dataset.time
            }
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

document.getElementById('playbackSpeed').addEventListener('change', (e) => {
    audio.playbackRate = e.target.selectedOptions[0].value
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
})

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
            text += `[${formatTime(time)}]`
        }
        if (isWordByWord) {
            text += `<${formatTime(time)}>`
            Array.from(item.children[1].children).forEach((word) => {
                text +=
                    word.innerText +
                    `${word.dataset.type == 'word' ? ' ' : ''}` +
                    `<${formatTime(word.dataset.endTime)}>`
            })
            text += '\n'
        } else {
            text += `${item.children[1].innerText}\n`
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
