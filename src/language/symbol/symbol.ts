import { OTHER_SYMBOLS } from "./other-symbol";
import { SCOPE_SYMBOLS } from "./scope-symbols";
import { STRING_SYMBOLS } from "./string-symbols";

export type SYMBOLS =
    STRING_SYMBOLS |
    SCOPE_SYMBOLS |
    OTHER_SYMBOLS

export const SYMBOLS: Record<SYMBOLS, string> = {
    ...STRING_SYMBOLS,
    ...SCOPE_SYMBOLS,
    ...OTHER_SYMBOLS,
}

export const SYMBOLS_LIST = Object.values(SYMBOLS)

export function isSymbol(word: string): word is SYMBOLS {
    return word in SYMBOLS
}
