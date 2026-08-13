<script setup lang="ts">
import { ref } from 'vue'
import { useLyrics } from '../composables/useLyrics'
import MdSwitchItem from './ui/MdSwitchItem.vue'

const {
  lyricInput,
  isWordByWord,
  isCharByChar,
  isDuet,
  offsetInput,
  plainLyricParser,
} = useLyrics()

// File handling
const lrcFileInputRef = ref<HTMLInputElement | null>(null)

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
</script>

<template>
  <div
    class="container container-md p-4 text-center"
  >
    <textarea
      id="lyricInput"
      v-model="lyricInput"
      dir="auto"
      class="w-full max-w-3xl py-3 px-4 outline-none bg-zinc-950 rounded-3xl focus:shadow-orange-400 focus:shadow-[0_0_2px_0_#fff] border-zinc-700 transition-all ease-in-out duration-300 focus:border-orange-400 border-2 resize-none"
      rows="20"
      placeholder="Enter your lyric text here"
      required
    />

    <div class="max-w-lg px-6 my-2 mx-auto">
      <MdSwitchItem v-model="isWordByWord">
        Sync word-by-word
      </MdSwitchItem>
      <MdSwitchItem v-model="isCharByChar">
        Character-based syncing
      </MdSwitchItem>
      <MdSwitchItem v-model="isDuet">
        Enable duet
      </MdSwitchItem>
    </div>

    <div class="flex flex-wrap gap-2 justify-center items-center">
      <div class="flex gap-2 items-center">
        <label
          for="offsetInput"
          class="text-zinc-300 text-sm"
        >Offset (ms):</label>
        <input
          id="offsetInput"
          v-model.number="offsetInput"
          type="number"
          class="w-22 h-8 bg-zinc-800 text-zinc-100 border-2 border-zinc-700 rounded-lg px-2 text-center outline-none focus:border-orange-400 transition-all"
          step="10"
        >
      </div>
      <div class="flex gap-2">
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
          v-wave
          for="lrcFile"
          class="h-8 bg-zinc-800 hover:bg-zinc-700/70 content-center rounded-full px-5 cursor-pointer transition-colors"
          @click.prevent="triggerLrcFileInput"
        >
          Load File
        </label>
        <button
          id="plainInputParser"
          v-wave
          class="h-8 bg-orange-400 text-black font-medium rounded-full px-5 cursor-pointer"
          @click="plainLyricParser"
        >
          Load
        </button>
      </div>
    </div>
  </div>
</template>
