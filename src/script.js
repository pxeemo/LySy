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
    const lengthInSeconds = audio.duration;
    console.log(`Length: ${lengthInSeconds.toFixed(2)} seconds`);
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

let itemsList = [];
let currentIndex = 0;

// Function to format seconds into MM:SS.MMM
function formatTimeMilis(seconds) {
    const hours = (seconds / 3600).toFixed();
    const minutes = ((seconds % 3600) / 60).toFixed().toString().padStart(2, "0");
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
function updateSelection() {
    itemsList.forEach((item, index) => {
        if (index === currentIndex) {
            item.classList.remove("border-zinc-700", "text-zinc-400");
            item.classList.add("border-orange-400", "bg-orange-900", "text-zinc-100", "cursor-pointer");
        }
    });
}

parseBtn.addEventListener('click', () => {
    const plainLyric = lyricInput.value;
    lyricList.innerHTML = '';
    itemsList = [];
    currentIndex = 0;
    plainLyric.split("\n").forEach(line => {
        const item = document.createElement("li")
        const timestamp = document.createElement("span")
        const text = document.createElement("span")
        item.classList.add("my-2", "rounded-md", "text-zinc-400",
            "border-2", "border-zinc-700", "duration-500", "ease-out", "transition-color", "scroll-mt-24")
        timestamp.innerText = "--:--.---"
        timestamp.dataset.time = null
        timestamp.classList.add("font-mono", "px-1", "mr-1")
        text.innerText = line
        item.appendChild(timestamp)
        item.appendChild(text)

        lyricList.appendChild(item)
        itemsList.push(item)
    })

    const target = document.getElementById('syncer');
    target.classList.remove("hidden")
    itemsList[0].scrollIntoView({ behavior: 'smooth', block: "start" });

    nextItemBtn.classList.remove('bottom-0')
    nextItemBtn.classList.add('bottom-14')
});

function nextItem() {
    if (currentIndex < itemsList.length) {
        const currentTime = audio.currentTime;
        console.log(`Current Time: ${currentTime}`)
        const item = itemsList[currentIndex]
        item.children[0].innerText = formatTimeMilis(currentTime)
        item.dataset.time = currentTime
        item.addEventListener('click', () => {
            audio.currentTime = item.dataset.time
        })
        item.scrollIntoView({ behavior: 'smooth', block: "start" });

        updateSelection();
        currentIndex += 1;
    }
}

// Add keyboard event listener for spacebar
window.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement != lyricInput) {
        e.preventDefault();
        if (fileInput.files.length == 0) {
            fileInput.click()
        } else {
            nextItem();
        }
    }
});

nextItemBtn.addEventListener('click', () => {
    nextItem()
})

document.getElementById('playbackSpeed').addEventListener('change', e => {
    audio.playbackRate = e.target.selectedOptions[0].value
})

document.getElementById('dlFile').addEventListener('click', () => {
    let text = "";
    itemsList.forEach(e => {
        const time = e.dataset.time
        if (time != null) {
            text += `[${formatTimeMilis(time)}]${e.children[1].innerText}\n`
        } else {
            text += `${e.children[1].innerText}\n`
        }
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
