import { ARITHMETIC_OPERATORS } from "./arithmetic-operator";
import { ASSIGNMENT_OPERATORS } from "./assignment-operator";
import { COMPARE_OPERATORS } from "./compare-operator";
import { LOGICAL_OPERATORS } from "./logical-operator";

export type OPERATORS =
    COMPARE_OPERATORS |
    ARITHMETIC_OPERATORS |
    LOGICAL_OPERATORS |
    ASSIGNMENT_OPERATORS

export const OPERATORS: Record<OPERATORS, string> = {
    ...COMPARE_OPERATORS,
    ...ARITHMETIC_OPERATORS,
    ...LOGICAL_OPERATORS,
    ...ASSIGNMENT_OPERATORS,
}

export const OPERATOR_SYMBOLS = Object.values(OPERATORS).map(operator => operator[0])

export function isOperator(word: string): word is OPERATORS {
    return word in OPERATORS
}

export function isCompoundOperator(symbol: string, nextSymbol: string): symbol is OPERATORS {
    if(OPERATOR_SYMBOLS.includes(symbol)) {
        for(let operator in OPERATORS) {
            if(operator === symbol + nextSymbol) {
                return true
            }
        }
    }
    return false
}