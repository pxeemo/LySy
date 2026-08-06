<script setup lang="ts">
import { ref } from 'vue'
import { useLyrics } from '../composables/useLyrics'

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
        class="h-8 bg-orange-400 text-black font-medium rounded-full px-5 cursor-pointer"
        @click="plainLyricParser"
      >
        Load
      </button>
    </div>
  </div>
</template>
