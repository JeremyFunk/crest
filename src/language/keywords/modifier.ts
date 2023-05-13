export type MODIFIER_KEYWORDS =
    'var' |
    'const'

export const MODIFIER_KEYWORDS = {
    'var': 'var',
    'const': 'const',
}

export function isModifierKeyword(word: string): word is MODIFIER_KEYWORDS {
    return word in MODIFIER_KEYWORDS
}
