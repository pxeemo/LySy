<script setup lang="ts">
import wave from 'v-wave';
import MdSwitch from './MdSwitch.vue';

const model = defineModel<boolean>()
const trigger = wave.createTrigger()
</script>

<template>
  <label
    v-wave="{ trigger }"
    class="flex p-2 my-0.5 bg-zinc-800 rounded first:rounded-t-2xl last:rounded-b-2xl cursor-pointer items-center justify-between"
    @pointerdown.self="trigger.press"
    @pointerup.self="trigger.release"
  >
    <p
      class="ps-2 text-lg text-start"
      @pointerdown="trigger.press"
      @pointerup="trigger.release"
    ><slot /></p>
    <MdSwitch v-model="model" />
  </label>
</template>
