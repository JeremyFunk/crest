export type ARITHMETIC_OPERATORS =
    '+' |
    '-' |
    '*' |
    '/' |
    '%'


export const ARITHMETIC_OPERATORS = {
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    '%': '%',
}

export function isArithmeticOperator(word: string): word is ARITHMETIC_OPERATORS {
    return word in ARITHMETIC_OPERATORS
}
