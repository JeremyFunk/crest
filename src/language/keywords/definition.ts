export type DEFINITION_KEYWORDS =
    'function' |
    'main' |
    'transformer'


export const DEFINITION_KEYWORDS: Record<DEFINITION_KEYWORDS, string> = {
    'function': 'function',
    'main': 'main',
    'transformer': 'transformer',
}

export function isDefinitionKeyword(word: string): word is DEFINITION_KEYWORDS {
    return word in DEFINITION_KEYWORDS
}
