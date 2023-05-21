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

export function getLogicalOperator(word: string): LOGICAL_OPERATORS {
    if (isLogicalOperator(word)) {
        return word
    } else {
        throw new Error(`Invalid logical operator ${word}`)
    }
}