const fileInput = document.getElementById('file')
const audio = document.getElementById('audio')
const playPauseBtn = document.getElementById('playPauseBtn')
const seekBar = document.getElementById('seekBar')
const currentTimeDisplay = document.getElementById('currentTime')
const durationDisplay = document.getElementById('duration')

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
        playPauseBtn.children[0].src = './assets/pause.svg'
    } else {
        audio.pause()
        playPauseBtn.children[0].src = './assets/play_arrow.svg'
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
let currentIndex = -1

// Function to update the timestamped item
function updateSelection(item, activate = true) {
    if (activate) {
        item.classList.remove('border-zinc-700', 'text-zinc-400')
        item.classList.add(
            'border-orange-400',
            'bg-orange-900',
            'text-zinc-100',
            'cursor-pointer',
        )
    } else {
        item.classList.remove(
            'border-orange-400',
            'bg-orange-900',
            'text-zinc-100',
            'cursor-pointer',
        )
        item.classList.add('border-zinc-700', 'text-zinc-400')
    }
}

const editItemModal = document.getElementById('editItemModal')
const editItemInput = document.getElementById('editItemInput')
const editItemCancel = document.getElementById('editItemCancel')
const editItemRemove = document.getElementById('editItemRemove')
const editItemDone = document.getElementById('editItemDone')
const editItemIndex = document.getElementById('editItemIndex')
parseBtn.addEventListener('click', () => {
    const plainLyric = lyricInput.value
    lyricList.innerHTML = ''
    itemsList = []
    currentIndex = -1
    plainLyric.split('\n').forEach((line) => {
        const item = document.createElement('li')
        const timestamp = document.createElement('div')
        const updateTimeIcon = document.createElement('img')
        const timestampText = document.createElement('span')
        const text = document.createElement('div')
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
            editItemModal.classList.remove('hidden')
            editItemModal.classList.add('fixed')
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
        // timestamp.dataset.time = null
        timestamp.classList.add('font-mono', 'p-1', 'cursor-pointer')
        timestamp.addEventListener('click', (e) => {
            e.stopPropagation()
            const target = e.currentTarget
            target.children[1].innerText = formatTime(audio.currentTime)
            target, (parentNode.dataset.time = audio.currentTime)
            updateSelection(target.parentNode)
        })

        text.innerHTML = `<p>${line}</p>`
        text.classList.add('grow')

        item.appendChild(timestamp)
        item.appendChild(text)
        item.appendChild(editIcon)

        lyricList.appendChild(item)
        itemsList.push(item)
    })

    const syncer = document.getElementById('syncer')
    syncer.classList.remove('hidden')
    itemsList[0].scrollIntoView({ behavior: 'smooth', block: 'start' })

    nextItemBtn.classList.remove('bottom-0')
    nextItemBtn.classList.add('bottom-14')
    prevItemBtn.classList.remove('bottom-0')
    prevItemBtn.classList.add('bottom-28')
})

function nextItem() {
    if (currentIndex < itemsList.length - 1) {
        currentIndex += 1
        const currentTime = audio.currentTime
        const item = itemsList[currentIndex]
        item.children[0].children[1].innerText = formatTime(currentTime)
        item.dataset.time = currentTime
        item.addEventListener('click', () => {
            if (item.dataset.time !== undefined) {
                audio.currentTime = item.dataset.time
            }
        })
        item.scrollIntoView({ behavior: 'smooth', block: 'start' })
        updateSelection(item)
    }
}

function prevItem() {
    if (currentIndex >= 0) {
        const item = itemsList[currentIndex]
        item.children[0].children[1].innerText = '--:--.---'
        delete item.dataset.time
        // TODO: item.removeEventListener('click', seekToTime)
        updateSelection(item, (activate = false))

        if (currentIndex == 0) {
            item.scrollIntoView({ behavior: 'smooth', block: 'start' })
            audio.currentTime = 0
        } else {
            const prevItemElement = itemsList[currentIndex - 1]
            prevItemElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
            audio.currentTime = prevItemElement.dataset.time
        }
        currentIndex -= 1
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
            } else {
                nextItem()
            }
        }
    }
})

nextItemBtn.addEventListener('click', nextItem)
prevItemBtn.addEventListener('click', prevItem)

document.getElementById('playbackSpeed').addEventListener('change', (e) => {
    audio.playbackRate = e.target.selectedOptions[0].value
})

function hideModal() {
    editItemModal.classList.remove('fixed')
    editItemModal.classList.add('hidden')
}

editItemCancel.addEventListener('click', hideModal)

editItemDone.addEventListener('click', () => {
    const index = editItemIndex.value
    itemsList[index].children[1].innerText = editItemInput.value
    hideModal()
})

editItemRemove.addEventListener('click', () => {
    const index = editItemIndex.value
    itemsList[index].classList.add('hidden')
    itemsList = itemsList.filter((e) => e != itemsList[index])
    if (currentIndex > index) {
        currentIndex -= 1
    }
    hideModal()
})

function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain' })
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
        if (time !== undefined) {
            text += `[${formatTime(time)}]`
        }
        text += `${item.children[1].innerText}\n`
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
