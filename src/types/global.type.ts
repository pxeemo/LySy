export interface WordItem {
    type: 'part' | 'word'
    text: string
    beginTime?: number
    endTime?: number
    actived?: boolean
}

export interface LyricItem {
    text: string
    isBg: boolean
    time?: number
    vocalist?: number
    words: WordItem[]
    mode: 'active' | 'selected' | 'default'
    el?: HTMLElement | null
}
