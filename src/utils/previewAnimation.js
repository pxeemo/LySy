export class AnimationManager {
    // This class is to manage (add, play,...) synced WYSIWYG animations
    constructor() {
        this.animations = new Map()
        this.isPaused = true
    }

    addElement(element, delay, currentTime, duration = 0.5) {
        this.animations.set(element, {
            delay: delay,
            duration: duration,
            remainingDelay: delay - currentTime,
            isPending: false,
        })
        element.style.animationDuration = `${duration}s`
    }

    removeElement(element) {
        const anim = this.animations.get(element)
        if (typeof anim == 'undefined') return
        if (anim.isPending) clearTimeout(anim.startTimeout)
        this.animations.delete(element)
    }

    setAnimationTimeout(anim, element) {
        anim.startTimeout = setTimeout(() => {
            if (element.nodeName == 'LI') {
                element.classList.remove('text-zinc-400')
                element.classList.add('text-zinc-100')
                if (anim.remainingDelay >= 0)
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    })
            } else if (element.nodeName == 'SPAN') {
                if (anim.remainingDelay >= 0) {
                    element.style.animationName = 'word-gradient'
                    element.style.animationPlayState = 'running'
                }
                element.classList.add('actived')
            }
            anim.isPending = false
        }, anim.remainingDelay * 1000)
    }

    clearCompletion(anim, element, currentTime) {
        anim.isPending = true
        if (element.nodeName == 'LI' && currentTime < anim.delay) {
            element.classList.remove('text-zinc-100')
            element.classList.add('text-zinc-400')
        } else if (
            element.nodeName == 'SPAN' &&
            currentTime < anim.delay + anim.duration
        ) {
            element.classList.remove('actived')
            element.style.animationName = ''
        }
    }

    play(currentTime, playbackSpeed) {
        if (!this.isPaused) return
        this.animations.forEach((anim, element) => {
            anim.remainingDelay = (anim.delay - currentTime) * playbackSpeed
            element.style.animationDuration = `${anim.duration * playbackSpeed}s`
            this.clearCompletion(anim, element, currentTime)
            this.setAnimationTimeout(anim, element)
        })
        this.isPaused = false
    }

    pause() {
        if (this.isPaused) return
        this.isPaused = true
        this.animations.forEach((anim, element) => {
            element.style.animationPlayState = 'paused'
            if (anim.isPending) clearTimeout(anim.startTimeout)
        })
    }

    refresh(currentTime, playbackSpeed) {
        if (this.isPaused) return
        this.animations.forEach((anim, element) => {
            if (anim.isPending) clearTimeout(anim.startTimeout)
            anim.remainingDelay = (anim.delay - currentTime) * playbackSpeed
            element.style.animationDuration = `${anim.duration * playbackSpeed}s`
            this.clearCompletion(anim, element, currentTime)
            this.setAnimationTimeout(anim, element)
        })
    }
}
