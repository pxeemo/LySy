<script setup lang="ts">
import { useLyrics } from './composables/useLyrics'
import AudioPlayer from './components/AudioPlayer.vue'
import LyricInputArea from './components/LyricInputArea.vue'
import LyricSyncList from './components/LyricSyncList.vue'
import FloatingControls from './components/FloatingControls.vue'
import LyricEditModal from './components/LyricEditModal.vue'

const { handleAudioSeek } = useLyrics()
</script>

<template>
  <div class="h-dvh grid grid-rows-[minmax(0,1fr)_auto]">
    <main class="min-h-0 overflow-y-auto pb-24">
      <LyricInputArea />
      <LyricSyncList />
      <FloatingControls />
      <LyricEditModal />
    </main>
    <AudioPlayer @audio-seek="handleAudioSeek" />
  </div>
</template>
