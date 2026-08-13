<script setup lang="ts">
import { useLyrics } from '../composables/useLyrics'
import { useHotkeys } from '../composables/useHotkeys'

const {
  isWordByWord,
  isDuet,
  wordEnd,
  next,
  prevItem,
  handleSwitchVocalistBtn,
  itemsList,
} = useLyrics()

// Initialize hotkeys
useHotkeys()
</script>

<template>
  <div>
    <button
      id="switchVocalistBtn"
      v-wave
      class="fixed left-4 h-14 w-14 text-xs/3 bg-zinc-800 border-orange-400 border shadow-xl/30 text-zinc-100 rounded-xl transition-all cursor-pointer"
      :class="[
        isDuet
          ? isWordByWord
            ? 'sm:bottom-37 bottom-51'
            : 'sm:bottom-20 bottom-34'
          : 'opacity-0 bottom-0',
      ]"
      @click="handleSwitchVocalistBtn"
    >
      Switch Vocalist
    </button>
    <button
      id="wordEndBtn"
      v-wave
      class="fixed left-4 h-14 w-14 text-sm/4 bg-zinc-800 border-orange-400 border shadow-xl/30 text-zinc-100 rounded-xl transition-all cursor-pointer"
      :class="[isWordByWord ? 'sm:bottom-20 bottom-34' : 'opacity-0 bottom-0']"
      @click="wordEnd"
    >
      Word End
    </button>
    <button
      id="prevItemBtn"
      v-wave
      class="fixed right-4 h-14 w-14 bg-zinc-800 border-orange-400 border shadow-2xl/30 text-zinc-100 rounded-xl transition-all delay-150 cursor-pointer"
      :class="[itemsList.length ? 'sm:bottom-37 bottom-51' : 'opacity-0 bottom-0']"
      @click="prevItem"
    >
      Back
    </button>
    <button
      id="nextItemBtn"
      v-wave
      class="fixed right-4 h-14 w-14 font-semibold bg-orange-400 shadow-2xl/30 text-black rounded-xl transition-all cursor-pointer"
      :class="[itemsList.length ? 'sm:bottom-20 bottom-34' : 'opacity-0 bottom-0']"
      @click="next"
    >
      Next
    </button>
  </div>
</template>
