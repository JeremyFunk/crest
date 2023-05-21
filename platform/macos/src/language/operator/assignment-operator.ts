
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

export function getAssignmentOperator(word: string): ASSIGNMENT_OPERATORS {
    if (isAssignmentOperator(word)) {
        return word
    } else {
        throw new Error(`Invalid assignment operator ${word}`)
    }
}