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
        })
        element.style.animationDuration = `${duration}s`
    }

    removeElement(element) {
        const anim = this.animations.get(element)
        if (typeof anim == 'undefined') return
        clearTimeout(anim.startTimeout)
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
        }, anim.remainingDelay * 1000)
    }

    clearCompletion(element) {
        if (element.nodeName == 'LI') {
            element.classList.remove('text-zinc-100')
            element.classList.add('text-zinc-400')
        } else if (element.nodeName == 'SPAN') {
            element.classList.remove('actived')
            element.style.animationName = ''
        }
    }

    play(currentTime, playbackSpeed) {
        if (!this.isPaused) return
        this.animations.forEach((anim, element) => {
            anim.remainingDelay = (anim.delay - currentTime) * playbackSpeed
            if (anim.delay + anim.duration < currentTime) {
                element.style.animationDuration = '0'
                element.style.animationName = ''
                element.classList.add('actived')
            } else if (anim.delay < currentTime) {
                element.style.animationDuration = `${(anim.duration + anim.remainingDelay) * playbackSpeed}s`
                element.style.animationPlayState = 'running'
            } else {
                element.style.animationDuration = `${anim.duration * playbackSpeed}s`
                this.clearCompletion(element)
                this.setAnimationTimeout(anim, element)
            }
        })
        this.isPaused = false
    }

    pause() {
        if (this.isPaused) return
        this.isPaused = true
        this.animations.forEach((anim, element) => {
            element.style.animationPlayState = 'paused'
            clearTimeout(anim.startTimeout)
        })
    }

    refresh(currentTime, playbackSpeed) {
        this.animations.forEach((anim, element) => {
            anim.remainingDelay = (anim.delay - currentTime) * playbackSpeed
            if (anim.delay + anim.duration <= currentTime) {
                element.style.animationDuration = '0'
                element.style.animationName = ''
                element.classList.add('actived')
            } else if (anim.delay < currentTime) {
                element.style.animationDuration = `${(anim.duration + anim.remainingDelay) * playbackSpeed}s`
                element.style.animationPlayState = 'running'
            } else {
                element.style.animationDuration = `${anim.duration * playbackSpeed}s`
                this.clearCompletion(element)
                clearTimeout(anim.startTimeout)
                if (!this.isPaused) this.setAnimationTimeout(anim, element)
            }
        })
    }
}
