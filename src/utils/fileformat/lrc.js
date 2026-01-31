import { formatTime, deformatTime } from '/src/utils/helpers'

export function stripLrc(text) {
    return text
        .replaceAll(/<\d{1,2}(:\d{1,2})+(\.\d{1,3})>/g, '')
        .replaceAll(/ ?\[bg: ?(.+?)\]\n?/g, '\n$1\n')
        .replaceAll(/\[\d{1,2}(:\d{1,2})+(\.\d{1,3})?\]( |v\d+:)*/g, '')
        .replaceAll(/^(\[[a-zA-Z]+:.+?\]\n)+/g, '\n')
}

export function parseLrc(text) {
    const lines = []
    const lrcLines = text.split('\n')
    
    for (const line of lrcLines) {
        // Skip metadata and empty lines
        if (!line.trim() || /^\[[a-zA-Z]+:.+?\]$/.test(line)) continue
        
        // Check for background vocal
        const bgMatch = line.match(/\[bg: ?(.+?)\]/)
        if (bgMatch) {
            lines.push({ text: bgMatch[1], isBg: true, words: [] })
            continue
        }
        
        // Match line timestamp
        const lineTimeMatch = line.match(/^\[(\d{2}(:\d{2})+(\.\d{1,3})?)\]/)
        if (!lineTimeMatch) {
            // No timestamp, plain text
            lines.push({ text: line, words: [] })
            continue
        }
        
        const lineTime = deformatTime(lineTimeMatch[1])
        let remainingText = line.slice(lineTimeMatch[0].length)
        
        // Check for vocalist marker
        let vocalist = 1
        const vocalistMatch = remainingText.match(/^v(\d+):/)
        if (vocalistMatch) {
            vocalist = parseInt(vocalistMatch[1])
            remainingText = remainingText.slice(vocalistMatch[0].length)
        }
        
        // Check for word-by-word timestamps
        const wordTimestampPattern = /<(\d{1,2}(:\d{1,2})+(\.\d{1,3})?)>/g
        const hasWordTimestamps = wordTimestampPattern.test(remainingText)
        
        if (hasWordTimestamps) {
            // Parse word-by-word timestamps
            const words = []
            const parts = remainingText.split(/<(\d{1,2}(:\d{1,2})+(\.\d{1,3})?)>/)
            
            let currentTime = null
            let textBuffer = ''
            
            for (let i = 0; i < parts.length; i++) {
                if (i % 4 === 1) {
                    // This is a timestamp
                    const timestamp = deformatTime(parts[i])
                    if (textBuffer && currentTime !== null) {
                        // We have text to save
                        words.push({
                            text: textBuffer,
                            beginTime: currentTime,
                            endTime: timestamp
                        })
                        textBuffer = ''
                    }
                    currentTime = timestamp
                } else if (i % 4 === 0 && parts[i]) {
                    // This is text
                    textBuffer = parts[i]
                }
            }
            
            lines.push({ 
                text: remainingText.replace(/<\d{1,2}(:\d{1,2})+(\.\d{1,3})>/g, ''),
                time: lineTime, 
                vocalist, 
                words 
            })
        } else {
            // Line-by-line only
            lines.push({ 
                text: remainingText, 
                time: lineTime, 
                vocalist,
                words: [] 
            })
        }
    }
    
    return lines
}

export function generateLrc(itemsList, isWordByWord, isDuet) {
    let text = '[by:Generated using LySy]\n'
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
