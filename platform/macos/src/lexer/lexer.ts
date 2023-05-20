import { isCompoundOperator } from "../language/operator/operator";
import { isAnySymbol } from "../language/registry";
import { isStringSymbol } from "../language/symbol/string-symbols";


export function lexerize(text: string) {
    const tokens = [];
    let token = '';
    let lastWasWhitespace = false;
    let stringSymbol = '';
    let comment = false;
    let multilineComment = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if(multilineComment){
            if(char === '*' && text[i + 1] === '/'){
                multilineComment = false;
                i++;
            }
            continue
        }

        if(comment){
            if(char === '\n'){
                comment = false;
            }
            continue
        }

        if(char === '/' && text[i + 1] === '/'){
            comment = true;
            continue
        }else if(char === '/' && text[i + 1] === '*'){
            multilineComment = true;
            continue
        }


        if(stringSymbol !== ''){
            if(char === stringSymbol){
                token += char;
                tokens.push(token);
                token = '';
                stringSymbol = '';
                continue
            }

            token += char;
            continue
        }

        if(isStringSymbol(char)){
            if (token) {
                tokens.push(token);
            }
            stringSymbol = char;
            token = char;
            lastWasWhitespace = false;
            continue
        }

        // If char is alphanumeric, add it to the token
        if (isAlphanumeric(char) || char === '_') {
            token += char;
            lastWasWhitespace = false;
            continue
        }

        // If char is a whitespace, add the token to the tokens array and reset the token
        if(isWhitespace(char)) {
            if (token) {
                tokens.push(token);
                token = '';
            }
            
            if(!lastWasWhitespace){
                tokens.push(' ');
                lastWasWhitespace = true;
            }
            continue
        }

        if(isAnySymbol(char)) {
            if (token) {
                tokens.push(token);
                token = '';
            }
            tokens.push(char);
            lastWasWhitespace = false;
            continue
        }   

        throw new Error(`Unexpected character: ${char}`);
    }

    if (token) {
        tokens.push(token);
    }

    return combineLexels(tokens);
}

function isAlphanumeric(char: string) {
    return char.match(/[a-z0-9]/i);
}

function isNumber(text: string) {
    return text.match(/[0-9]/i);
}

// Returns true if the token is a whitespace. New lines are considered as a whitespace.
function isWhitespace(text: string) {
    return text === ' ' || text === '\n' || text === '\t'
}


function combineLexels(lexels: string[]){
    const resulingLexels = []
    for(let i = 0; i < lexels.length; i++){
        const isLastLexer = i === lexels.length - 1;

        const lexel = lexels[i];
        if(!isLastLexer){
            const nextLexel = lexels[i + 1];
            if(isCompoundOperator(lexel, nextLexel)){
                resulingLexels.push(lexel + nextLexel);
                i++;
                continue
            }

            if(isNumber(lexel) && nextLexel === '.'){
                if(i < lexels.length - 2 && isNumber(lexels[i + 2])){
                    resulingLexels.push(lexel + nextLexel + lexels[i + 2]);
                    i += 2;
                    continue
                }
                resulingLexels.push(lexel + nextLexel + '0');
                i++;
                continue
            }

        }
        resulingLexels.push(lexel);
    }

    return resulingLexels;
}

