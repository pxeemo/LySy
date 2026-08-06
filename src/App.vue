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
  <div>
    <AudioPlayer @audio-seek="handleAudioSeek" />
    <LyricInputArea />
    <LyricSyncList />
    <FloatingControls />
    <LyricEditModal />
  </div>
</template>
