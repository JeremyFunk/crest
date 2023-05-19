export type PRIMITIVE_TYPE_KEYWORDS =
    'byte' |
    'short' |
    'int' |
    'long'

export const PRIMITIVE_TYPE_KEYWORDS = {
    'byte': 'byte',
    'short': 'short',
    'int': 'int',
    'long': 'long',
}

export function isPrimitiveType(word: string): word is PRIMITIVE_TYPE_KEYWORDS {
    return word in PRIMITIVE_TYPE_KEYWORDS
}
