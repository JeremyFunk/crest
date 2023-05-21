import { isWhiteSpaceLike } from "typescript";
import { isControlFlowKeyword } from "../language/keywords/control-flow";
import { isDefinitionKeyword } from "../language/keywords/definition";
import { isKeyword } from "../language/keywords/keywords";
import { isModifierKeyword } from "../language/keywords/modifier";
import { isPrimitiveType } from "../language/keywords/primitive-type";
import { isArithmeticOperator } from "../language/operator/arithmetic-operator";
import { isAssignmentOperator } from "../language/operator/assignment-operator";
import { isCompareOperator } from "../language/operator/compare-operator";
import { isLogicalOperator } from "../language/operator/logical-operator";
import { isOperator } from "../language/operator/operator";
import { getOtherSymbolTokenType, isOtherSymbol } from "../language/symbol/other-symbol";
import { isScopeCloseSymbol, isScopeOpenSymbol, isScopeSymbol } from "../language/symbol/scope-symbols";
import { isPureString, isString, isTemplateString } from "../language/symbol/string-symbols";
import { lexerize } from "../lexer/lexer";

type TOKENS_TYPES_DEFAULT =
    'identifier' |
    'type' |
    'control_flow_keyword' |
    'modifier_keyword' |
    'definition_keyword' |
    'compare_operator' |
    'arithmetic_operator' |
    'logical_operator' |
    'assignment_operator' |
    'scope_open_symbol' |
    'scope_close_symbol' |
    'whitespace' |
    'comment' |
    'string' |
    'float' |
    'integer' |
    'boolean' |
    'comma' |
    'semicolon' |
    'colon' |
    'dot' |
    'unknown' |
    'eof'

type TEMPLATE_STRING_TYPE = 'literal_template_string'

export type TOKENS_TYPE = TOKENS_TYPES_DEFAULT | TEMPLATE_STRING_TYPE

interface TokenDefinitionDefault {
    type: TOKENS_TYPES_DEFAULT
    value: string
    index: number
}

interface TemplateStringTokenDefinition {
    type: TEMPLATE_STRING_TYPE
    value: string
    parts: {
        position: number
        tokens: TokenDefinition[]
    }[]
    index: number
}

export type TokenDefinition = TokenDefinitionDefault | TemplateStringTokenDefinition

export function isTokenTypeLiteral(type: TOKENS_TYPE): type is 'string' | 'float' | 'integer' | 'boolean' {
    return type === 'float' || type === 'integer' || type === 'string' || type === 'boolean'
}

function isValidIdentifier(word: string) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word)
}

function isInteger(word: string) {
    return /^[0-9]+$/.test(word)
}

function isFloat(word: string) {
    return /^[0-9]+\.[0-9]+$/.test(word)
}

function isBoolean(word: string) {
    return word === 'true' || word === 'false'
}

function _tokenize(lexels: string[]){
    const tokens: TokenDefinition[] = [];
    
    for(let i = 0; i < lexels.length; i++){
        const lexel = lexels[i];

        let token: TokenDefinition = {
            type: 'unknown',
            value: lexel,
            index: 0
        }

        if(isControlFlowKeyword(lexel)){
            if(i + 2 < lexels.length && lexel === 'else' && lexels[i + 1] === ' ' && lexels[i + 2] === 'if'){
                token.value = 'else if';
                i += 2;
            }

            token.type = 'control_flow_keyword';
        }else if(isModifierKeyword(lexel)){
            token.type = 'modifier_keyword';
        }else if(isDefinitionKeyword(lexel)){
            token.type = 'definition_keyword';
        }else if(isPrimitiveType(lexel)){
            token.type = 'type';
        }else if(isScopeOpenSymbol(lexel)){
            token.type = 'scope_open_symbol';
        }else if(isScopeCloseSymbol(lexel)){
            token.type = 'scope_close_symbol';
        }else if(isAssignmentOperator(lexel)){
            token.type = 'assignment_operator';
        }else if(isInteger(lexel)){
            token.type = 'integer';
        }else if(isFloat(lexel)){
            token.type = 'float';
        }else if(isBoolean(lexel)){
            token.type = 'boolean';
        }else if(isOtherSymbol(lexel)){
            token.type = getOtherSymbolTokenType(lexel);
        }else if(isArithmeticOperator(lexel)){
            token.type = 'arithmetic_operator';
        }else if(isAssignmentOperator(lexel)){
            token.type = 'assignment_operator';
        }else if(isCompareOperator(lexel)){
            token.type = 'compare_operator';
        }else if(isLogicalOperator(lexel)){
            token.type = 'logical_operator';
        }else if(isValidIdentifier(lexel)){
            token.type = 'identifier';
        }else if(lexel === ' '){
            token.type = 'whitespace';
        }else if(isPureString(lexel)){
            token.type = 'string';
        }else if(isTemplateString(lexel)){
            token = {
                type: 'literal_template_string',
                value: lexel,
                parts: [],
                index: 0
            }

            let pureString = ""

            for(let i = 0; i < lexel.length; i++){
                const char = lexel[i];

                if(char === '$' && lexel[i + 1] === '{'){
                    const closing = lexel.indexOf('}', i + 1);

                    if(closing === -1){
                        throw new Error(`Invalid template string: ${lexel}`);
                    }
                    
                    const expression = lexel.slice(i + 2, closing);
                    const expressionLexels = lexerize(expression);
                    const expressionTokens = _tokenize(expressionLexels);
                    token.parts.push({
                        position: pureString.length,
                        tokens: expressionTokens
                    })

                    i = closing;
                }else{
                    pureString += char;
                }
            }

            token.value = pureString;
        }

        if(token.type === 'unknown'){
            throw new Error(`Unknown lexel: ${lexel}`);
        }

        tokens.push(token)
    }

    return tokens
}

export function tokenize(lexels: string[]){
    const tokens = _tokenize(lexels);

    for(let i = 0; i < tokens.length; i++){
        tokens[i].index = i;
    }

    return tokens;
}
