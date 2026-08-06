# Ly<sub><sup><sub>rics </sub></sup></sub>Sy<sub><sup><sub>ncer</sub></sup></sub> - Modularization & Refactoring Roadmap

This document outlines a phased strategy for migrating the single-file, monolithic structure of **Lyrics Syncer** (primarily concentrated in `src/App.vue`) into a robust, highly modular, and component-based Vue 3 application using TypeScript, Composition API (`<script setup>`), and Vue custom composables.

---

## 🎯 Architecture Vision

- **Clean Single-Responsibility Components**: Break down the view into self-contained presentational or state-bound SFC components under `src/components/`.
- **Re-useable Business Logic via Composables**: Isolate complex UI-independent logic (such as WaveSurfer.js player control, LRC file handling/parsing, animation scheduling, and sync flows) into `src/composables/`.
- **Shared Reactive State**: Use composables returning unified/shared reactive state references to easily coordinate state across isolated components without the bloat of a heavy global state manager.
- **Strict TypeScript & Type Safety**: Centralize types and interfaces in `src/types/` to prevent contract mismatch between components and helpers.

---

## 🗺️ Architectural Phase Breakdown

### Phase 1: Modular Audio Player & Player Composable (Active/Current Step)
- **Goal**: Separate the entire WaveSurfer.js setup and playback toolbar from the core lyrics loading/syncing logic.
- **Actions**:
  1. Create `src/composables/useWaveSurfer.ts` to manage WaveSurfer instances, playback speed, time formats, zoom state, and event bindings.
  2. Create `src/components/AudioPlayer.vue` using the Tailwind template from `App.vue`'s bottom container.
  3. Refactor `App.vue` to render `<AudioPlayer />` and bind synchronization events directly using the shared composable state.

### Phase 2: Lyrics State and Parsing Logic Composable
- **Goal**: Extract lyric loading, parsing, timing updates, line additions, deletions, and downloading triggers.
- **Actions**:
  1. Create `src/composables/useLyrics.ts`.
  2. Extract state such as `lyricInput`, `itemsList`, `currentItemIndex`, `currentWordIndex`, `isWordByWord`, `isCharByChar`, `isDuet`, and `offsetInput`.
  3. Relocate functions like `plainLyricParser`, `next`, `wordEnd`, `prevItem`, `clearLine`, and `handleDownload` into this composable.
  4. Integrate the existing `AnimationManager` / `previewAnim` triggers gracefully.

### Phase 3: Lyric Input Area Component
- **Goal**: Isolate the lyric paste textbox, setting toggles (Word-by-word, Char-based, Duet), offset input, upload lyrics button, and load button.
- **Actions**:
  1. Create `src/components/LyricInputArea.vue`.
  2. Connect inputs directly to reactive variables exposed by `useLyrics.ts`.
  3. Keep the file import logic cleaner by containing the `<input type="file" accept=".lrc">` tag inside this component.

### Phase 4: Lyric Syncer/List Component
- **Goal**: Move the rendered list of lines/words and their corresponding CSS animations/classes to its own view.
- **Actions**:
  1. Create `src/components/LyricSyncList.vue`.
  2. Implement item rendering logic with dynamic bindings for active/selected/default styles, vocalist layouts (duet), RTL parsing support, and list items scroll mechanics.
  3. Coordinate the DOM reference binding for `AnimationManager` gracefully.

### Phase 5: Floating Actions / Hotkey Bar Component
- **Goal**: Clean up the fixed-position bottom-right/bottom-left buttons (Back, Next, Word End, Switch Vocalist) and keyboard triggers (Space / Shift+Space).
- **Actions**:
  1. Create `src/components/FloatingControls.vue`.
  2. Bind hotkey event listeners (`keydown`) cleanly within a central hotkey manager composable or inside this component using standard Vue lifecycle hooks.

### Phase 6: Edit Item Dialog Component
- **Goal**: Extract the modal dialog (`<dialog id="editItemModal">`) for editing line/word text, timestamps, and background vocal status.
- **Actions**:
  1. Create `src/components/LyricEditModal.vue`.
  2. Provide a clean `ref` interface or simple props/emits to open and edit properties of a selected lyric item.

---

## 🛠️ Benefits of this Design

1. **Testability**: Logic can be isolated and unit-tested directly via composable tests (e.g., using Vitest).
2. **Maintainability**: Enhancing features (like SRT or TTML exports) will touch a single composable or parser file instead of a massive `App.vue`.
3. **Performance**: Smaller components render more efficiently. Changes to the Audio waveform won't trigger re-renders of the entire lyric list unless specifically needed.
