import { CONTROL_FLOW_KEYWORDS } from "./control-flow";
import { DEFINITION_KEYWORDS } from "./definition";
import { MODIFIER_KEYWORDS } from "./modifier";
import { PRIMITIVE_TYPE_KEYWORDS } from "./primitive-type";

export type KEYWORDS = 
    DEFINITION_KEYWORDS |
    CONTROL_FLOW_KEYWORDS |
    PRIMITIVE_TYPE_KEYWORDS | 
    MODIFIER_KEYWORDS

export const KEYWORDS = {
    ...DEFINITION_KEYWORDS,
    ...CONTROL_FLOW_KEYWORDS,
    ...PRIMITIVE_TYPE_KEYWORDS,
    ...MODIFIER_KEYWORDS
}

export function isKeyword(word: string): word is KEYWORDS {
    return word in KEYWORDS
}
