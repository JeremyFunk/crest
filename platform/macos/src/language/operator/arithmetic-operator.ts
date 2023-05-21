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

export function getArithmeticOperator(word: string): ARITHMETIC_OPERATORS {
    if (isArithmeticOperator(word)) {
        return word
    } else {
        throw new Error(`Invalid arithmetic operator ${word}`)
    }
}