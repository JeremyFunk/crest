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