export type CONTROL_FLOW_KEYWORDS =
    'if' |
    'else' |
    'else if' |
    'for' |
    'while' |
    'do' |
    'break' |
    'continue' |
    'return'

export const CONTROL_FLOW_KEYWORDS = {
    'if': 'if',
    'else': 'else',
    'else if': 'else if',
    'for': 'for',
    'while': 'while',
    'do': 'do',
    'break': 'break',
    'continue': 'continue',
    'return': 'return',
}

const CONTROL_FLOW_KEYWORDS_LIST = Object.keys(CONTROL_FLOW_KEYWORDS)

export function isControlFlowKeyword(word: string): word is CONTROL_FLOW_KEYWORDS {
    return CONTROL_FLOW_KEYWORDS_LIST.includes(word)
}