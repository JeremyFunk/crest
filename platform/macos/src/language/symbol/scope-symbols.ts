export type SCOPE_OPEN_SYMBOLS =
    '(' |
    '{' |
    '['

export const SCOPE_OPEN_SYMBOLS: Record<SCOPE_OPEN_SYMBOLS, string> = {
    '(': '(',
    '{': '{',
    '[': '[',
}

export const SCOPE_OPEN_SYMBOLS_LIST = Object.values(SCOPE_OPEN_SYMBOLS)

export function isScopeOpenSymbol(word: string): word is SCOPE_OPEN_SYMBOLS {
    return word in SCOPE_OPEN_SYMBOLS
}

export type SCOPE_CLOSE_SYMBOLS =
    ')' |
    '}' |
    ']'

export const SCOPE_CLOSE_SYMBOLS: Record<SCOPE_CLOSE_SYMBOLS, string> = {
    ')': ')',
    '}': '}',
    ']': ']',
}

export const SCOPE_CLOSE_SYMBOLS_LIST = Object.values(SCOPE_CLOSE_SYMBOLS)

export function isScopeCloseSymbol(word: string): word is SCOPE_CLOSE_SYMBOLS {
    return word in SCOPE_CLOSE_SYMBOLS
}

export type SCOPE_SYMBOLS =
    SCOPE_OPEN_SYMBOLS |
    SCOPE_CLOSE_SYMBOLS

export const SCOPE_SYMBOLS: Record<SCOPE_SYMBOLS, string> = {
    ...SCOPE_OPEN_SYMBOLS,
    ...SCOPE_CLOSE_SYMBOLS,
}

export const SCOPE_SYMBOLS_LIST = Object.values(SCOPE_SYMBOLS)

export function isScopeSymbol(word: string): word is SCOPE_SYMBOLS {
    return word in SCOPE_SYMBOLS
}