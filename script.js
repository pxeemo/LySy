const fileInput = document.getElementById('file');
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');

function sourceFile() {
    const file = fileInput.files[0];
    if (file) {
        const audioURL = URL.createObjectURL(file);
        audio.src = audioURL;

        // Update playing status
        // audio.addEventListener(['play', 'pause', 'ended']);
        const player = document.getElementById("player");
        const fileChooser = document.getElementById("fileChooser");
        fileChooser.classList.add("hidden");
        player.classList.remove("hidden");
        player.classList.add("flex");
    }
}

// Display audio length when metadata is loaded
audio.addEventListener('loadedmetadata', function() {
    // const lengthInSeconds = audio.duration;
});

sourceFile()
fileInput.addEventListener('change', sourceFile);

// Update play/pause button
function togglePlayPause() {
    if (audio.paused) {
        audio.play();
        playPauseBtn.children[0].src = "./assets/pause.svg";
    } else {
        audio.pause();
        playPauseBtn.children[0].src = "./assets/play_arrow.svg";
    }
}

const backwardBtn = document.getElementById("backwardBtn")
backwardBtn.addEventListener('click', () => {
    audio.currentTime -= 1
})

const forwardBtn = document.getElementById("forwardBtn")
forwardBtn.addEventListener('click', () => {
    audio.currentTime += 2
})

// Format time in MM:SS
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Update seek bar as the audio plays
audio.addEventListener('timeupdate', () => {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
});

// Update duration once metadata is loaded
audio.addEventListener('loadedmetadata', () => {
    durationDisplay.textContent = formatTime(audio.duration);
});

// Seek when seek bar is changed
seekBar.addEventListener('input', () => {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
});

// Play/pause button click event
playPauseBtn.addEventListener('click', togglePlayPause);



const lyricInput = document.getElementById("lyricInput")
const parseBtn = document.getElementById("plainInputParser")
const lyricList = document.getElementById("lyricList")
const nextItemBtn = document.getElementById("nextItemBtn")
const prevItemBtn = document.getElementById("prevItemBtn")

let itemsList = [];
let currentIndex = 0;

// Function to format seconds into MM:SS.MMM
function formatTimeMilis(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toFixed(3).toString().padStart(6, "0");

    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${minutes}:${secs}`;
};

function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Specify the filename for the download
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to update the timestamped item
function updateSelection(item, activate = true) {
    if (activate) {
        item.classList.remove("border-zinc-700", "text-zinc-400");
        item.classList.add("border-orange-400", "bg-orange-900", "text-zinc-100", "cursor-pointer");
    } else {
        item.classList.remove("border-orange-400", "bg-orange-900", "text-zinc-100", "cursor-pointer");
        item.classList.add("border-zinc-700", "text-zinc-400");
    }
}

const editItemModal = document.getElementById("editItemModal")
const editItemInput = document.getElementById("editItemInput")
const editItemCancel = document.getElementById("editItemCancel")
const editItemRemove = document.getElementById("editItemRemove")
const editItemDone = document.getElementById("editItemDone")
const editItemIndex = document.getElementById("editItemIndex")
parseBtn.addEventListener('click', () => {
    const plainLyric = lyricInput.value;
    lyricList.innerHTML = '';
    itemsList = [];
    currentIndex = 0;
    plainLyric.split("\n").forEach(line => {
        const item = document.createElement("li")
        const timestamp = document.createElement("div")
        const updateTimeIcon = document.createElement("img")
        const timestampText = document.createElement("span")
        const text = document.createElement("div")
        const editIcon = document.createElement("img")
        item.classList.add("flex", "px-1", "gap-1", "my-2", "rounded-md", "text-zinc-400", "items-center",
            "border-2", "border-zinc-700", "duration-500", "ease-out", "transition-color", "scroll-mt-24")
        updateTimeIcon.classList.add("mx-auto")
        updateTimeIcon.src = "./assets/update.svg"
        updateTimeIcon.width = 15
        timestampText.innerText = "--:--.---"

        editIcon.classList.add("mx-2", "cursor-pointer")
        editIcon.src = "./assets/edit.svg"
        editIcon.width = 20
        editIcon.addEventListener('click', e => {
            e.stopPropagation()
            const target = e.currentTarget.previousElementSibling
            editItemInput.value = target.innerText
            editItemModal.classList.remove("hidden")
            editItemModal.classList.add("fixed")
            editItemIndex.value = itemsList.indexOf(e.currentTarget.parentNode)
            editItemInput.focus()
        })

        timestamp.classList.add("w-18", "items-center", "text-center", "text-xs")
        timestamp.appendChild(updateTimeIcon)
        timestamp.appendChild(timestampText)
        // timestamp.dataset.time = null
        timestamp.classList.add("font-mono", "p-1", "cursor-pointer")
        timestamp.addEventListener('click', e => {
            e.stopPropagation()
            const target = e.currentTarget
            target.children[1].innerText = formatTimeMilis(audio.currentTime)
            target, parentNode.dataset.time = audio.currentTime
            updateSelection(target.parentNode)
        })

        text.innerHTML = `<p>${line}</p>`
        text.classList.add("grow")

        item.appendChild(timestamp)
        item.appendChild(text)
        item.appendChild(editIcon)

        lyricList.appendChild(item)
        itemsList.push(item)
    })

    const syncer = document.getElementById('syncer');
    syncer.classList.remove("hidden")
    itemsList[0].scrollIntoView({ behavior: 'smooth', block: "start" });

    nextItemBtn.classList.remove('bottom-0')
    nextItemBtn.classList.add('bottom-14')
    prevItemBtn.classList.remove('bottom-0')
    prevItemBtn.classList.add('bottom-28')
});

function nextItem() {
    if (currentIndex < itemsList.length) {
        const currentTime = audio.currentTime;
        const item = itemsList[currentIndex]
        item.children[0].children[1].innerText = formatTimeMilis(currentTime)
        item.dataset.time = currentTime
        item.addEventListener('click', () => {
            if (item.dataset.time !== undefined) {
                audio.currentTime = item.dataset.time
            }
        })
        item.scrollIntoView({ behavior: 'smooth', block: "start" });

        updateSelection(item);
        currentIndex += 1;
    }
}

function prevItem() {
    if (currentIndex != 1) {
        currentIndex -= 1;
        const item = itemsList[currentIndex]
        const prevItemElement = itemsList[currentIndex - 1]
        item.children[0].children[1].innerText = '--:--.---'
        delete item.dataset.time
        // item.removeEventListener('click', seekToTime)
        prevItemElement.scrollIntoView({ behavior: 'smooth', block: "start" });

        updateSelection(item, activate = false);
        audio.currentTime = prevItemElement.dataset.time
    }
}

// Add keyboard event listener for spacebar
window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !["INPUT", "TEXTAREA"].includes(document.activeElement.nodeName)) {
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
});

nextItemBtn.addEventListener('click', nextItem)
prevItemBtn.addEventListener('click', prevItem)

document.getElementById('playbackSpeed').addEventListener('change', e => {
    audio.playbackRate = e.target.selectedOptions[0].value
})

function hideModal() {
    editItemModal.classList.remove("fixed")
    editItemModal.classList.add("hidden")
}

editItemCancel.addEventListener('click', hideModal)

editItemDone.addEventListener('click', () => {
    const index = editItemIndex.value
    itemsList[index].children[1].innerText = editItemInput.value
    hideModal()
})

editItemRemove.addEventListener('click', () => {
    const index = editItemIndex.value
    itemsList[index].classList.add("hidden")
    itemsList = itemsList.filter(e => e != itemsList[index])
    if (currentIndex > index) {
        currentIndex -= 1
    }
    hideModal()
})

document.getElementById('dlFile').addEventListener('click', () => {
    let text = "";
    itemsList.forEach(item => {
        const time = item.dataset.time
        if (time !== undefined) {
            text += `[${formatTimeMilis(time)}]`
        }
        text += `${item.children[1].innerText}\n`
    })
    if (fileInput.files.length != 0) {
        const inputFileName = fileInput.files[0].name
        filename = inputFileName.split(".").slice(0, -1).join(".") + '.lrc';
    } else {
        alert("You need to select an input file first")
        return
    }
    downloadTextFile(filename, text)
});
