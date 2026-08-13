<script setup lang="ts">
const model = defineModel<boolean>()
</script>
<template>
  <label>
    <input
      v-model="model"
      class="hidden peer"
      type="checkbox"
    >
    <div
      :class="[
        'group flex items-center min-w-12 h-8 cursor-pointer border-2',
        model
          ? 'border-orange-400 bg-orange-400'
          : 'border-zinc-500 bg-zinc-800',
        'rounded-full duration-150 ease-in-out transition',
      ]"
      for="switch"
    >
      <div
        :class="[
          'duration-150 ease-in-out transition-all rounded-full group-active:h-7 group-active:w-7',
          model
            ? 'h-6 w-6 ms-4.5 bg-orange-950 group-active:ms-4'
            : 'h-4 w-4 ms-1.75 bg-zinc-400 group-active:ms-0',
        ]"
      />
    </div>
  </label>
</template>
