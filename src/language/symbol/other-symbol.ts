import { TOKENS_TYPE, TokenDefinition } from "../../tokenizer/tokenizer"

export type OTHER_SYMBOLS =
    ',' |
    ';' |
    ':' |
    '.'

export const OTHER_SYMBOLS: Record<OTHER_SYMBOLS, string> = {
    ',': ',',
    ';': ';',
    ':': ':',
    '.': '.',
}

export const OTHER_SYMBOLS_LIST = Object.values(OTHER_SYMBOLS)

export function isOtherSymbol(word: string): word is OTHER_SYMBOLS {
    return word in OTHER_SYMBOLS
}

export function getOtherSymbolTokenType(word: OTHER_SYMBOLS) {
    switch (word) {
        case ',':
            return 'comma'
        case ';':
            return 'semicolon'
        case ':':
            return 'colon'
        case '.':
            return 'dot'
    }
    return 'unknown'       
}