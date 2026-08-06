<script setup lang="ts">
import { useLyrics } from '../composables/useLyrics'
import { useLyricEditor } from '../composables/useLyricEditor'

const {
  isWordByWord,
  itemsList,
  currentItemIndex,
} = useLyrics()

const {
  editItemModal,
  editItemIndex,
  editItemText,
  markAsBg,
  editItemTimes,
  editItemLineTime,
  handleAddNewItem,
  handleRemoveItem,
  handleSaveItemEdit,
} = useLyricEditor()
</script>

<template>
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
          class="px-2 py-0.5 text-orange-400 not-disabled:hover:bg-orange-300/20 rounded-full disabled:text-gray-400 transition-colors duration-200 cursor-pointer"
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
          class="px-2 py-0.5 text-orange-400 not-disabled:hover:bg-orange-300/20 rounded-full disabled:text-gray-400 transition-colors duration-200 cursor-pointer"
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
          class="px-2 py-0.5 text-red-500 not-disabled:hover:bg-red-400/20 rounded-full transition-all duration-200 cursor-pointer"
          @click="handleRemoveItem"
        >
          Remove
        </button>
      </div>
      <div class="flex justify-end">
        <button
          id="editItemCancel"
          class="m-1 px-3 py-1 text-orange-400 hover:bg-orange-300/20 rounded-full transition-colors duration-200 cursor-pointer"
          @click="editItemModal?.close()"
        >
          Cancel
        </button>
        <button
          id="editItemDone"
          class="m-1 px-3 py-1 font-medium text-black bg-orange-400 rounded-full transition-colors duration-200 cursor-pointer"
          @click="handleSaveItemEdit"
        >
          Save
        </button>
      </div>
      <input
        id="editItemIndex"
        type="hidden"
        name="editItemIndex"
        :value="editItemIndex ?? undefined"
      >
    </form>
  </dialog>
</template>
