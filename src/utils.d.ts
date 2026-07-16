declare module './utils/previewAnimation' {
  export class AnimationManager {
    animations: Map<any, any>;
    isPaused: boolean;
    constructor();
    addElement(element: HTMLElement, delay: number, currentTime: number, duration?: number): void;
    removeElement(element: HTMLElement): void;
    setAnimationTimeout(anim: any, element: HTMLElement): void;
    clearCompletion(element: HTMLElement): void;
    play(currentTime: number, playbackSpeed: number): void;
    pause(): void;
    refresh(currentTime: number, playbackSpeed: number): void;
  }
}

declare module './utils/fileformat/lrc' {
  export function stripLrc(text: string): string;
  export function parseLrc(text: string): any[];
  export function generateLrc(itemsList: any[], isWordByWord: boolean, isDuet: boolean): string;
}

declare module './utils/helpers' {
  export function formatTime(seconds: number, lrcformat?: boolean): string;
  export function deformatTime(timeText: string): number;
}
