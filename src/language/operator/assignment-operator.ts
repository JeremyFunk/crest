
export type ASSIGNMENT_OPERATORS =
    '=' |
    '+=' |
    '-=' |
    '*=' |
    '/=' |
    '%=' |
    '^='

export const ASSIGNMENT_OPERATORS: Record<ASSIGNMENT_OPERATORS, string> = {
    '=': '=',
    '+=': '+=',
    '-=': '-=',
    '*=': '*=',
    '/=': '/=',
    '%=': '%=',
    '^=': '^=',
}

export function isAssignmentOperator(word: string): word is ASSIGNMENT_OPERATORS {
    return word in ASSIGNMENT_OPERATORS
}