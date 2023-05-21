export type COMPARE_OPERATORS =
    '==' |
    '!=' |
    '<' |
    '>' |
    '<=' |
    '>='

export const COMPARE_OPERATORS: Record<COMPARE_OPERATORS, string> = {
    '==': '==',
    '!=': '!=',
    '<': '<',
    '>': '>',
    '<=': '<=',
    '>=': '>=',
}

export function isCompareOperator(word: string): word is COMPARE_OPERATORS {
    return word in COMPARE_OPERATORS
}

export function getCompareOperator(word: string): COMPARE_OPERATORS {
    if (isCompareOperator(word)) {
        return word
    } else {
        throw new Error(`Invalid compare operator ${word}`)
    }
}