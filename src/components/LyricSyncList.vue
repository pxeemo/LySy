<script setup lang="ts">
import wave from 'v-wave'

import { useLyrics } from '../composables/useLyrics'
import { useLyricEditor } from '../composables/useLyricEditor'

import editIconSvg from '../assets/edit.svg'

const {
  isWordByWord,
  isDuet,
  itemsList,
  showSyncer,
  itemRefs,
  rtlCharsPattern,
  handleItemClick,
  handleDownload,
} = useLyrics()

const {
  openEditModal,
} = useLyricEditor()

const triggers = new Map<string, ReturnType<typeof wave.createTrigger>>()

function getTrigger(id: number) {
  let trigger = triggers.get(String(id))
  if (!trigger) {
    trigger = wave.createTrigger()
    triggers.set(String(id), trigger)
  }
  return trigger
}
</script>

<template>
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
        v-wave="{ trigger: getTrigger(index) }"
        class="flex px-5 gap-2 items-center rounded first:rounded-t-2xl last:rounded-b-2xl border duration-300 ease-out transition-all scroll-mt-[20svh]"
        :class="[
          {
            'text-zinc-100 cursor-pointer border-zinc-900 bg-zinc-800': item.mode === 'active',
            'border-orange-400 text-zinc-400 rounded-b-2xl': item.mode === 'selected',
            'border-zinc-900 text-zinc-400': item.mode === 'default',
          },
        ]"
        @click="handleItemClick(item)"
        @pointerdown.self="e => { if (item.mode === 'active') getTrigger(index).press(e) }"
        @pointerup.self="() => { if (item.mode === 'active') getTrigger(index).release() }"
        @pointercancel.self="() => { if (item.mode === 'active') getTrigger(index).release() }"
      >
        <p
          class="grow text-start transition-all duration-300"
          :class="[
            item.isBg ? 'my-2' : 'my-4 text-2xl',
            isDuet && item.vocalist === 2
              ? 'text-end'
              : 'text-start',
          ]"
          :dir="rtlCharsPattern.test(item.text) ? 'rtl' : 'auto'"
          @pointerdown="e => { if (item.mode === 'active') getTrigger(index).press(e) }"
          @pointerup="() => { if (item.mode === 'active') getTrigger(index).release() }"
          @pointercancel="() => { if (item.mode === 'active') getTrigger(index).release() }"
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
        <div
          class="p-2 rounded-full transition-colors hover:bg-zinc-700"
          @click.stop="openEditModal(item, index)"
        >
          <img
            class="cursor-pointer"
            :src="editIconSvg"
            :width="20"
          >
        </div>
      </li>
    </ul>

    <button
      id="dlFile"
      v-wave
      class="h-8 bg-orange-400 text-black font-medium rounded-full px-5 my-2 cursor-pointer"
      @click="handleDownload"
    >
      Save
    </button>
  </div>
</template>
