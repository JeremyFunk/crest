export function formatASM(asm: string){
    const lines = asm.split('\n')

    return lines.map(line => {
        let trimmed = line.trim()
        if(trimmed === ''){
            return ''
        }

        if(trimmed.startsWith(';')){
            return trimmed
        }

        // Data directive
        if(trimmed.includes(':') && trimmed.includes('.')){
            const label = trimmed.substring(0, trimmed.indexOf(':') + 1).trim()
            const directive = trimmed.substring(trimmed.indexOf(':') + 1).trim()
            return `${label.padEnd(24)} ${directive}`
        }

        if(trimmed.includes(':') || trimmed.startsWith('.')){
            return trimmed
        }

        let comment = ''
        if(trimmed.includes(';')){
            const parts = trimmed.split(';')
            trimmed = parts[0].trim()
            comment = parts[parts.length - 1].trim()
        }

        const parts = trimmed.split(' ')

        const instruction = parts[0]
        const operands = parts.slice(1).join(' ')

        return `    ${instruction.padEnd(8, ' ')}${operands.padEnd(32)}${comment ? ` ; ${comment}` : ''}`
    }).join('\n')
}

export function alignStack(stack: number){
    return stack % 16 === 0 ? stack : stack + (16 - stack % 16)
}