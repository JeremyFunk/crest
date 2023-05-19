import { OPERATOR_SYMBOLS } from "./operator/operator";
import { KEYWORDS } from "./keywords/keywords";
import { SYMBOLS_LIST } from "./symbol/symbol";

export function isAnySymbol(word: string) {
    return OPERATOR_SYMBOLS.includes(word) || SYMBOLS_LIST.includes(word);
}

export function isKeyword(word: string) {
    return word in KEYWORDS;
}