export type LOGICAL_OPERATORS =
    '&&' |
    '||'

export const LOGICAL_OPERATORS = {
    '&&': '&&',
    '||': '||',
}

export function isLogicalOperator(word: string): word is LOGICAL_OPERATORS {
    return word in LOGICAL_OPERATORS
}
