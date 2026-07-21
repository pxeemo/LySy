<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWaveSurfer } from './composables/useWaveSurfer'
import { useLyrics } from './composables/useLyrics'
import { useLyricEditor } from './composables/useLyricEditor'
import AudioPlayer from './components/AudioPlayer.vue'

// Assets
import editIconSvg from './assets/edit.svg'

// Composables
const {
  hasAudio,
} = useWaveSurfer()

const {
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
  rtlCharsPattern,
  plainLyricParser,
  handleAudioSeek,
  handleItemClick,
  wordEnd,
  next,
  prevItem,
  handleSwitchVocalistBtn,
  handleDownload,
} = useLyrics()

const {
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
} = useLyricEditor()

// File handling
const lrcFileInputRef = ref<HTMLInputElement | null>(null)

// Setup global spacebar hotkey
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.code !== 'Space') return
  const activeNode = (document.activeElement as HTMLElement)?.nodeName || ''
  if (['INPUT', 'TEXTAREA'].includes(activeNode)) return
  e.preventDefault()
  if (e.shiftKey) {
    prevItem()
  } else if (!hasAudio.value) {
    const chooseBtn = document.querySelector('#fileChooser label') as HTMLElement
    chooseBtn?.click()
  } else if (itemsList.value.length === 0) {
    plainLyricParser()
  } else {
    next()
  }
}

const triggerLrcFileInput = () => {
  lrcFileInputRef.value?.click()
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

const handleAudioLoaded = (file: File) => {
  // Handled inside AudioPlayer via useWaveSurfer, but we can hook into it if needed
}

const handleAudioRemoved = () => {
  // Handled inside AudioPlayer via useWaveSurfer, but we can hook into it if needed
}
</script>

<template>
  <div>
    <!-- Render the isolated AudioPlayer component -->
    <AudioPlayer
      @audio-seek="handleAudioSeek"
      @audio-loaded="handleAudioLoaded"
      @audio-removed="handleAudioRemoved"
    />

    <!-- Inputs and Controls Container -->
    <div
      class="container container-md p-4 h-[calc(100svh-3rem)] text-center"
    >
      <textarea
        id="lyricInput"
        v-model="lyricInput"
        dir="auto"
        class="w-full max-w-3xl h-[calc(100%-13rem)] py-3 px-4 outline-none bg-zinc-950 rounded-3xl focus:shadow-orange-400 focus:shadow-[0_0_2px_0_#fff] border-zinc-700 transition-all ease-in-out duration-300 focus:border-orange-400 border-2 resize-none"
        rows="20"
        placeholder="Enter your lyric text here"
        required
      />

      <div class="max-w-lg px-6 my-2 mx-auto">
        <label
          class="flex p-2 my-0.5 bg-zinc-800 rounded rounded-t-2xl cursor-pointer items-center justify-between"
          for="isWordByWord"
        >
          <p class="ps-2 text-lg text-start">Sync word-by-word</p>
          <input
            id="isWordByWord"
            v-model="isWordByWord"
            class="hidden peer"
            type="checkbox"
            name="isWordByWord"
          >
          <label
            class="relative inline-block min-w-12 h-8 cursor-pointer border-zinc-500 border-2 bg-zinc-800 peer-checked:bg-orange-400 rounded-full duration-500 transition before:duration-50 before:ease-out before:transition-all before:absolute before:content-[''] before:bg-zinc-400 before:aspect-square before:left-1.5 before:top-1.5 before:bottom-1.5 peer-checked:before:left-4.5 peer-checked:before:bottom-0.5 peer-checked:before:top-0.5 peer-checked:border-orange-400 peer-checked:before:bg-zinc-800 before:rounded-full"
            for="isWordByWord"
          />
        </label>
        <label
          class="flex p-2 my-0.5 bg-zinc-800 rounded cursor-pointer items-center justify-between"
          for="isCharByChar"
        >
          <p class="ps-2 text-lg text-start">
            Character-based syncing
          </p>
          <input
            id="isCharByChar"
            v-model="isCharByChar"
            class="hidden peer"
            type="checkbox"
            name="isCharByChar"
          >
          <label
            class="relative inline-block min-w-12 h-8 cursor-pointer border-zinc-500 border-2 bg-zinc-800 peer-checked:bg-orange-400 rounded-full duration-500 transition before:duration-50 before:ease-out before:transition-all before:absolute before:content-[''] before:bg-zinc-400 before:aspect-square before:left-1.5 before:top-1.5 before:bottom-1.5 peer-checked:before:left-4.5 peer-checked:before:bottom-0.5 peer-checked:before:top-0.5 peer-checked:border-orange-400 peer-checked:before:bg-zinc-800 before:rounded-full"
            for="isCharByChar"
          />
        </label>
        <label
          class="flex p-2 my-0.5 bg-zinc-800 rounded rounded-b-2xl cursor-pointer items-center justify-between"
          for="isDuet"
        >
          <p class="ps-2 text-lg text-start">Enable duet</p>
          <input
            id="isDuet"
            v-model="isDuet"
            class="hidden peer"
            type="checkbox"
            name="isDuet"
          >
          <label
            class="relative inline-block min-w-12 h-8 cursor-pointer border-zinc-500 border-2 bg-zinc-800 peer-checked:bg-orange-400 rounded-full duration-500 transition before:duration-50 before:ease-out before:transition-all before:absolute before:content-[''] before:bg-zinc-400 before:aspect-square before:left-1.5 before:top-1.5 before:bottom-1.5 peer-checked:before:left-4.5 peer-checked:before:bottom-0.5 peer-checked:before:top-0.5 peer-checked:border-orange-400 peer-checked:before:bg-zinc-800 before:rounded-full"
            for="isDuet"
          />
        </label>
      </div>

      <div class="flex gap-2 justify-center items-center">
        <div class="flex gap-2 items-center">
          <label
            for="offsetInput"
            class="text-zinc-300 text-sm"
          >Offset (ms):</label>
          <input
            id="offsetInput"
            v-model.number="offsetInput"
            type="number"
            class="w-24 h-8 bg-zinc-800 text-zinc-100 border-2 border-zinc-700 rounded-lg px-2 text-center outline-none focus:border-orange-400 transition-all"
            step="10"
          >
        </div>
        <input
          id="lrcFile"
          ref="lrcFileInputRef"
          type="file"
          name="lrcFileInput"
          class="hidden"
          accept=".lrc"
          @change="handleLrcUpload"
        >
        <label
          for="lrcFile"
          class="h-8 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-full px-5 leading-8 cursor-pointer transition-colors"
          @click.prevent="triggerLrcFileInput"
        >
          Upload Lyrics
        </label>
        <button
          id="plainInputParser"
          class="h-8 bg-orange-400 text-black font-medium rounded-full px-5"
          @click="plainLyricParser"
        >
          Load
        </button>
      </div>
    </div>

    <!-- Lyrics list container -->
    <div
      v-show="showSyncer"
      id="syncer"
      class="container container-md max-w-3xl p-4 my-28 text-center"
    >
      <ul
        id="lyricList"
        class="w-full text-start font-bold overflow-clip"
      >
        <li
          v-for="(item, index) in itemsList"
          :key="index"
          :ref="
            (el) => {
              if (el) itemRefs[index] = el as HTMLElement
            }
          "
          class="flex px-5 gap-2 items-center rounded first:rounded-t-2xl last:rounded-b-2xl border duration-300 ease-out transition-all scroll-mt-[20svh]"
          :class="[
            item.isBg ? 'py-2' : 'py-4',
            {
              'text-zinc-100 cursor-pointer border-zinc-900 bg-zinc-800': item.mode === 'active',
              'border-orange-400 text-zinc-400 rounded-b-2xl': item.mode === 'selected',
              'border-zinc-900 text-zinc-400': item.mode === 'default',
            },
          ]"
          @click="handleItemClick(item)"
        >
          <p
            class="grow text-start transition-all duration-300"
            :class="[
              item.isBg ? '' : 'text-2xl',
              isDuet && item.vocalist === 2
                ? 'text-end'
                : 'text-start',
            ]"
            :dir="rtlCharsPattern.test(item.text) ? 'rtl' : 'auto'"
          >
            <!-- Render words if word-by-word is enabled -->
            <template v-if="isWordByWord && item.words.length > 0">
              <span
                v-for="(word, wordIdx) in item.words"
                :key="wordIdx"
                class="word"
                :class="[
                  { rtl: rtlCharsPattern.test(word.text) },
                  { actived: word.actived },
                ]"
                :data-type="word.type"
                :data-begin-time="word.beginTime"
                :data-end-time="word.endTime"
              >
                {{ word.text }}
              </span>
            </template>
            <!-- Render simple text otherwise -->
            <template v-else>
              {{ item.text }}
            </template>
          </p>
          <img
            class="mx-2 cursor-pointer"
            :src="editIconSvg"
            :width="20"
            @click.stop="openEditModal(item, index)"
          >
        </li>
      </ul>

      <button
        id="dlFile"
        class="h-8 bg-orange-400 text-black font-medium rounded-full px-5 my-2"
        @click="handleDownload"
      >
        Save
      </button>
    </div>

    <!-- Floating action buttons -->
    <button
      id="switchVocalistBtn"
      class="fixed left-4 h-14 w-14 text-xs/3 bg-zinc-800 border-orange-400 border shadow-xl/30 text-zinc-100 rounded-xl transition-all"
      :class="[
        isDuet
          ? isWordByWord
            ? 'sm:bottom-37 bottom-51'
            : 'sm:bottom-20 bottom-34'
          : 'bottom-0',
      ]"
      @click="handleSwitchVocalistBtn"
    >
      Switch Vocalist
    </button>
    <button
      id="wordEndBtn"
      class="fixed left-4 h-14 w-14 text-sm/4 bg-zinc-800 border-orange-400 border shadow-xl/30 text-zinc-100 rounded-xl transition-all"
      :class="[isWordByWord ? 'sm:bottom-20 bottom-34' : 'bottom-0']"
      @click="wordEnd"
    >
      Word End
    </button>
    <button
      id="prevItemBtn"
      class="fixed right-4 h-14 w-14 bg-zinc-800 border-orange-400 border shadow-2xl/30 text-zinc-100 rounded-xl transition-all delay-150 sm:bottom-37 bottom-51"
      @click="prevItem"
    >
      Back
    </button>
    <button
      id="nextItemBtn"
      class="fixed right-4 h-14 w-14 font-semibold bg-orange-400 shadow-2xl/30 text-black rounded-xl transition-all sm:bottom-20 bottom-34"
      @click="next"
    >
      Next
    </button>

    <!-- Edit Item Modal -->
    <dialog
      id="editItemModal"
      ref="editItemModal"
      class="backdrop:bg-black/80 m-auto p-4 rounded-lg bg-zinc-900 text-zinc-100"
    >
      <form
        method="dialog"
        @submit.prevent
      >
        <div
          id="editItemContent"
          class="text-zinc-100 mb-2"
        >
          <!-- Standard text/timestamp input -->
          <textarea
            id="editItemInput"
            v-model="editItemText"
            rows="1"
            type="text"
            name="editItemInput"
            dir="auto"
            class="w-full min-w-80 bg-zinc-900 text-zinc-100 disabled:text-zinc-400 disabled:bg-zinc-800 outline-none rounded-md m-1 p-2 border-zinc-700 transition-all ease-in-out duration-300 focus:border-orange-400 border-2 resize-none"
            :disabled="
              isWordByWord &&
                editItemIndex !== null &&
                editItemIndex < currentItemIndex
            "
          />

          <!-- Render dynamic word timing inputs if Word-by-word is enabled and active -->
          <template
            v-if="
              isWordByWord &&
                editItemIndex !== null &&
                editItemIndex < currentItemIndex &&
                editItemTimes.length > 0
            "
          >
            <div
              v-for="(t, i) in editItemTimes"
              :key="i"
              class="w-full flex gap-2 my-2 mx-1"
            >
              <input
                v-model="t.begin"
                type="text"
                class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 w-22 bg-zinc-800 text-zinc-100 border-zinc-800 text-center text-sm"
              >
              <input
                v-model="editItemTimes[i].begin"
                type="text"
                class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 grow min-w-28 bg-zinc-900 text-zinc-100 border-zinc-700 text-start"
                style="display: none"
              >
              <!-- Helper placeholder to match original -->
              <input
                type="text"
                class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 grow min-w-28 bg-zinc-900 text-zinc-100 border-zinc-700 text-start"
                :value="itemsList[editItemIndex]?.words[i]?.text"
                dir="auto"
                disabled
              >
              <input
                v-model="t.end"
                type="text"
                class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 w-22 bg-zinc-800 text-zinc-100 border-zinc-800 text-center text-sm"
              >
            </div>
          </template>

          <!-- Render simple line timestamp input if line-by-line has timestamps -->
          <template
            v-if="
              !isWordByWord &&
                editItemIndex !== null &&
                itemsList[editItemIndex]?.beginTime !== undefined
            "
          >
            <input
              v-model="editItemLineTime"
              type="text"
              class="h-8 outline-none rounded-md p-1 transition-all ease-in-out duration-300 border-2 focus:border-orange-400 w-24 my-2 mx-1 text-center bg-zinc-800 text-zinc-100 border-zinc-800"
            >
          </template>
        </div>
        <div class="flex flex-col gap-0.5 items-start">
          <div class="px-2 text-zinc-300 rounded-full">
            <input
              id="markAsBg"
              v-model="markAsBg"
              class="accent-orange-400"
              type="checkbox"
              name="markAsBg"
            >
            <label
              class="px-1"
              for="markAsBg"
            >Mark as background vocal</label>
          </div>
          <button
            id="addItemAboveBtn"
            class="px-2 py-0.5 text-orange-400 not-disabled:hover:bg-orange-300/20 rounded-full disabled:text-gray-400 transition-colors duration-200"
            :disabled="
              editItemIndex === null ||
                editItemIndex <= currentItemIndex
            "
            @click="handleAddNewItem(true)"
          >
            Add Above
          </button>
          <button
            id="addItemBelowBtn"
            class="px-2 py-0.5 text-orange-400 not-disabled:hover:bg-orange-300/20 rounded-full disabled:text-gray-400 transition-colors duration-200"
            :disabled="
              editItemIndex === null ||
                editItemIndex < currentItemIndex
            "
            @click="handleAddNewItem(false)"
          >
            Add Below
          </button>
          <button
            id="editItemRemove"
            class="px-2 py-0.5 text-red-500 not-disabled:hover:bg-red-400/20 rounded-full transition-all duration-200"
            @click="handleRemoveItem"
          >
            Remove
          </button>
        </div>
        <div class="flex justify-end">
          <button
            id="editItemCancel"
            class="m-1 px-3 py-1 text-orange-400 hover:bg-orange-300/20 rounded-full transition-colors duration-200"
            @click="editItemModal?.close()"
          >
            Cancel
          </button>
          <button
            id="editItemDone"
            class="m-1 px-3 py-1 font-medium text-black bg-orange-400 rounded-full transition-colors duration-200"
            @click="handleSaveItemEdit"
          >
            Save
          </button>
        </div>
        <input
          id="editItemIndex"
          type="hidden"
          name="editItemIndex"
          :value="editItemIndex"
        >
      </form>
    </dialog>
  </div>
</template>
