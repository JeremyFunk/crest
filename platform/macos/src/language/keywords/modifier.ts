export type MODIFIER_KEYWORDS =
    'const'

export const MODIFIER_KEYWORDS = {
    'const': 'const',
}

export function isModifierKeyword(word: string): word is MODIFIER_KEYWORDS {
    return word in MODIFIER_KEYWORDS
}
