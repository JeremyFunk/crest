export type STRING_SYMBOLS =
    '"' |
    '\`'

export const STRING_SYMBOLS: Record<STRING_SYMBOLS, string> = {
    '"': '"',
    '\`': '\`'
}

export const STRING_SYMBOLS_LIST = Object.values(STRING_SYMBOLS)

export function isStringSymbol(word: string): word is STRING_SYMBOLS {
    return word in STRING_SYMBOLS
}

export function isString(word: string): boolean {
    return isPureString(word) || isTemplateString(word)
}

export function isPureString(word: string): boolean {
    return word.startsWith('"') && word.endsWith('"')
}

export function isTemplateString(word: string): boolean {
    return word.startsWith('\`') && word.endsWith('\`')
}
