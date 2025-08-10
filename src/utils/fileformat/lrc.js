import { formatTime } from './helpers'

export function generateLrc(itemsList) {
    let text = '[by: Generated using LySy]\n'
    itemsList.forEach((item) => {
        const time = item.dataset.time
        if (typeof time == 'undefined') return

        if (item.dataset.type == 'normal') {
            text += `[${formatTime(time)}]`
            if (isDuet) text += item.dataset.vocalist == 1 ? 'v1:' : 'v2:'
        } else {
            // removes extra line break from the previous loop
            text = text.slice(0, -1) + ' [bg:'
        }

        if (isWordByWord) {
            const words = Array.from(item.children[0].children)
            text += `<${formatTime(time)}>`
            words.forEach((word, index) => {
                const beginTime = `<${formatTime(word.dataset.beginTime)}>`

                // don't duplicate when words share timestamps
                if (!text.endsWith(beginTime)) text += beginTime

                text += word.innerText

                // add space if it's not a syllable
                // and it's not the last word of the line
                if (word.dataset.type == 'word' && index + 1 != words.length)
                    text += ' '

                text += `<${formatTime(word.dataset.endTime)}>`
            })
        } else {
            text += `${item.children[0].innerText}`
        }

        if (item.dataset.type == 'bg') text += ']'
        text += '\n'
    })

    return text
}
