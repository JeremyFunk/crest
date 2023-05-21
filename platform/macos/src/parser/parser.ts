import { isDefinitionKeyword } from "../language/keywords/definition";
import { isModifierKeyword } from "../language/keywords/modifier";
import { PrimitiveType, isPrimitiveType, toPrimitiveType } from "../language/keywords/primitive-type";
import { ARITHMETIC_OPERATORS, getArithmeticOperator } from "../language/operator/arithmetic-operator";
import { ASSIGNMENT_OPERATORS, getAssignmentOperator, isAssignmentOperator } from "../language/operator/assignment-operator";
import { COMPARE_OPERATORS, getCompareOperator } from "../language/operator/compare-operator";
import { LOGICAL_OPERATORS, getLogicalOperator } from "../language/operator/logical-operator";
import {
    TOKENS_TYPE,
    TokenDefinition,
    isTokenTypeLiteral,
} from "../tokenizer/tokenizer";

export type ASTNodeType =
    'function_definition' |
    'function_call' |
    'identifier_variable' |
    'variable_definition' |
    'variable_assignment' |
    'root' |
    'literal_int' |
    'literal_float' |
    'literal_string' |
    'literal_boolean' |
    'literal_template_string' |
    'operator_compare' |
    'operator_arithmetic' |
    'operator_logical' |
    'argument_definition' |
    'return_statement' |
    'if_statement' |
    'else_if_statement' |
    'else_statement' |
    'while_statement' |
    'do_while_statement' |
    'for_statement' |
    'assert_statement' |
    'unknown' 

export type ASTNodeBase = {
    nodeType: ASTNodeType;
}

export interface ASTFunctionDefinition extends ASTNodeBase {
    nodeType: 'function_definition'
    name: string
    arguments: ASTArgumentDefinition[]
    returnType: PrimitiveType
    body: ASTNode[]
}

export interface ASTFunctionCall extends ASTNodeBase {
    nodeType: 'function_call'
    name: string
    arguments: ASTNode[]
}

export interface ASTVariableDefinition extends ASTNodeBase {
    nodeType: 'variable_definition'
    name: string
    type: PrimitiveType
    constant: boolean
    value: ASTNode | null
}

export interface ASTVariableAssignment extends ASTNodeBase {
    nodeType: 'variable_assignment'
    operator: ASSIGNMENT_OPERATORS
    name: string
    value: ASTNode
}

export interface ASTRoot extends ASTNodeBase {
    nodeType: 'root'
    body: ASTNode[]
}

export interface ASTIdentifierVariable extends ASTNodeBase {
    nodeType: 'identifier_variable'
    name: string
}

export interface ASTLiteralInt extends ASTNodeBase {
    nodeType: 'literal_int'
    value: number
}
export interface ASTLiteralFloat extends ASTNodeBase {
    nodeType: 'literal_float'
    value: number
}
export interface ASTLiteralBoolean extends ASTNodeBase {
    nodeType: 'literal_boolean'
    value: boolean
}
export interface ASTLiteralString extends ASTNodeBase {
    nodeType: 'literal_string'
    value: string
}
export interface ASTLiteralTemplateString extends ASTNodeBase {
    nodeType: 'literal_template_string'
    value: string
    parts: ASTNode[]
}

export interface ASTOperatorComparison extends ASTNodeBase {
    nodeType: 'operator_compare'
    operator: COMPARE_OPERATORS
    left: ASTNode
    right: ASTNode
}

export interface ASTOperatorArithmetic extends ASTNodeBase {
    nodeType: 'operator_arithmetic'
    operator: ARITHMETIC_OPERATORS
    left: ASTNode
    right: ASTNode
}

export interface ASTOperatorLogical extends ASTNodeBase {
    nodeType: 'operator_logical'
    operator: LOGICAL_OPERATORS
    left: ASTNode
    right: ASTNode
}

export interface ASTArgumentDefinition extends ASTNodeBase {
    nodeType: 'argument_definition'
    name: string
    type: PrimitiveType
}

export interface ASTReturnStatement extends ASTNodeBase {
    nodeType: 'return_statement'
    value: ASTNode | null
}

export interface ASTIfStatement extends ASTNodeBase {
    nodeType: 'if_statement'
    condition: ASTCondition
    body: ASTNode[]
    chain?: ASTElseIfStatement | ASTElseStatement
}

export interface ASTElseIfStatement extends ASTNodeBase {
    nodeType: 'else_if_statement'
    condition: ASTCondition
    body: ASTNode[]
    chain?: ASTElseIfStatement | ASTElseStatement
}

export interface ASTElseStatement extends ASTNodeBase {
    nodeType: 'else_statement'
    body: ASTNode[]
}

export type ASTCondition = ASTOperatorComparison | ASTFunctionCall | ASTLiteralBoolean | ASTIdentifierVariable
function isCondition(node: ASTNode): node is ASTCondition {
    return node.nodeType === 'operator_compare' || node.nodeType === 'function_call' || node.nodeType === 'literal_boolean' || node.nodeType === 'identifier_variable'
}

export interface ASTWhileStatement extends ASTNodeBase {
    nodeType: 'while_statement' | 'do_while_statement'
    condition: ASTCondition
    body: ASTNode[]
}

export interface ASTForStatement extends ASTNodeBase {
    nodeType: 'for_statement'
    initializer: ASTNode | null
    condition: ASTCondition
    increment: ASTNode | null
    body: ASTNode[]
}

export interface ASTAssertStatement extends ASTNodeBase {
    nodeType: 'assert_statement'
    condition: ASTCondition
}


export type ASTNode =
    ASTFunctionDefinition |
    ASTFunctionCall |
    ASTIdentifierVariable |
    ASTVariableDefinition |
    ASTRoot |
    ASTLiteralInt |
    ASTLiteralFloat |
    ASTLiteralBoolean |
    ASTLiteralString |
    ASTLiteralTemplateString |
    ASTOperatorComparison |
    ASTOperatorArithmetic |
    ASTOperatorLogical |
    ASTArgumentDefinition |
    ASTVariableAssignment |
    ASTReturnStatement |
    ASTIfStatement |
    ASTElseStatement |
    ASTElseIfStatement |
    ASTWhileStatement |
    ASTForStatement |
    ASTAssertStatement

export class ASTParser {
    private index = 0;

    constructor(private tokens: TokenDefinition[]) { }

    skipWhitespace() {
        while (this.index < this.tokens.length && this.tokens[this.index].type === "whitespace") {
            this.index++;
        }
    }

    getNextToken(ignoreEOF = false): typeof ignoreEOF extends false ? TokenDefinition | undefined : TokenDefinition {
        this.skipWhitespace();

        if(ignoreEOF){
            return this.tokens[this.index++];
        }

        if (this.index >= this.tokens.length) {
            throw new Error("Unexpected end of file");
        }

        return this.tokens[this.index++];
    }

    skipNextToken() {
        this.skipWhitespace();
        this.index++;
    }

    reverse() {
        this.index--;
        while (this.tokens[this.index].type === "whitespace") {
            this.index--;
        }
    }

    peakNextToken(): TokenDefinition | undefined {
        this.skipWhitespace();
        if(this.index >= this.tokens.length){
            return;
        }
        return this.tokens[this.index];
    }

    peakNextTokenStrict(): TokenDefinition {
        this.skipWhitespace();
        if(this.index >= this.tokens.length){
            throw new Error("Unexpected end of file");
        }
        return this.tokens[this.index];
    }

    hasNextToken(): boolean {
        this.skipWhitespace();
        return this.index < this.tokens.length;
    }

    /**
     * Used to check if the next token is a specific token type. If it is not, an error will be thrown.
     * 
     * Consider the following code:
     * 
     * expectTokens(["identifier", "whitespace", ["assignment_operator", "comparison_operator"]])
     * 
     * This will check if the next token is an identifier, then a whitespace, then either an assignment operator or a comparison operator.
     */
    expectTokens(expected: ((TOKENS_TYPE | {v: string}) | (TOKENS_TYPE | {v: string})[])[]) {
        let internalIndex = this.index;
        for (let j = 0; j < expected.length; j++) {
            while (this.tokens[internalIndex].type === "whitespace") {
                internalIndex++;
            }

            const expectedToken = expected[j];
            const token = this.tokens[internalIndex];
            
            if(Array.isArray(expected[j])){
                if((expected[j] as (TOKENS_TYPE | {v: string})[]).some((e) => (typeof e === "object" ? e.v === token.value : e === token.type))){
                    internalIndex++;
                    continue;
                }
                throw new Error(
                    `Expected one of token types ${expectedToken} but got ${token.type} with value ${token.value}`
                );
            }

            if(typeof expectedToken === "object"){
                if((expectedToken as any).v !== token.value){
                    throw new Error(
                        `Expected token value ${(expectedToken as any).v} but got ${token.value}`
                    );
                }
            }else if (token.type !== expectedToken) {
                throw new Error(
                    `Expected token type ${expectedToken} but got ${token.type}`
                );
            }

            internalIndex++;
        }
    }
    expectTokenValues(expected: (string | string[])[]) {
        let internalIndex = this.index;
        for (let j = 0; j < expected.length; j++) {
            while (this.tokens[internalIndex].type === "whitespace") {
                internalIndex++;
            }

            const expectedToken = expected[j];
            const token = this.tokens[internalIndex];
            
            if(Array.isArray(expected[j])){
                if((expected[j] as string[]).some((e) => e === token.value)){
                    internalIndex++;
                    continue;
                }
                throw new Error(
                    `Expected one of token types ${expectedToken} but got ${token.type} with value ${token.value}`
                );
            }

            if(expectedToken !== token.value){
                throw new Error(
                    `Expected token value ${expectedToken} but got ${token.value}`
                );
            }

            internalIndex++;
        }
    }

    expect(tokenType: TOKENS_TYPE, tokenValue?: string) {
        const token = this.peakNextTokenStrict();
        if (token.type !== tokenType) {
            throw new Error(
                `Expected token type ${tokenType} but got ${token.type}`
            );
        }

        if (tokenValue && token.value !== tokenValue) {
            throw new Error(
                `Expected token value ${tokenValue} but got ${token.value}`
            );
        }
    }

    parse(): ASTNode {
        try{
            const nodes: ASTNode[] = [];
            let id = 0

            while (this.hasNextToken()) {
                const token = this.getNextToken()!;
    
                if (token.type === "definition_keyword") {
                    if (token.value === "main") {
                        const mainFunc: ASTFunctionDefinition = {
                            nodeType: 'function_definition',
                            name: "main",
                            arguments: this.resolveFunctionArgumentsDefinition(),
                            body: this.resolveScopeBraces(),
                            returnType: 'void',
                        };
    
                        nodes.push(mainFunc);
                    }else if(token.value === "function") {
                        if(!this.hasNextToken()){
                            throw new Error("Unexpected end of file");
                        }

                        const func: ASTFunctionDefinition = {
                            nodeType: 'function_definition',
                            returnType: toPrimitiveType(this.getNextToken().value),
                            name: this.getNextToken().value,
                            arguments: this.resolveFunctionArgumentsDefinition(),
                            body: this.resolveScopeBraces(),
                        };
    
                        nodes.push(func);
                    }
                } else if(token.type === "modifier_keyword" || token.type === "type"){
                    this.reverse();
                    const variable = this.resolveVariableDeclaration();
                    nodes.push(variable);
                }
            }
    
            return {
                nodeType: 'root',
                body: nodes,
            } 
        }catch(error){
            console.log(`Error at token ${this.index} of type ${this.tokens[this.index].type} with value ${this.tokens[this.index].value}`);

            for(let i = -1; i < 2; i++){
                const token = this.tokens[this.index + i];
                if(token){
                    console.log(`Token ${i} of type ${token.type} with value ${token.value}`);
                }
            }

            throw error;
        }

    }

    resolveFunctionArgumentsDefinition(): ASTArgumentDefinition[] {
        const resolveFunctionArgumentDefinition =
            (): ASTArgumentDefinition => {
                this.expectTokens(["type", "identifier"]);

                // int a
                const type = this.getNextToken()!;
                const identifier = this.getNextToken()!;

                return {
                    nodeType: "argument_definition",
                    name: identifier.value,
                    type: toPrimitiveType(type.value),
                };
            };

        this.expect("scope_open_symbol", "(");
        this.skipNextToken();

        const args: ASTArgumentDefinition[] = [];

        while (this.peakNextTokenStrict().value !== ")") {
            args.push(resolveFunctionArgumentDefinition());
            
            if(this.peakNextTokenStrict().type === "comma"){
                this.skipNextToken();
                this.expectTokens(["type"])
            }else{
                this.expect('scope_close_symbol', ')');
            }
        }
        this.skipNextToken();

        return args;
    }

    resolveScopeBraces(): ASTNode[] {
        this.expectTokens([{v: "{"}]);
        this.skipNextToken();

        const nodes: ASTNode[] = [];

        while (this.peakNextTokenStrict().value !== "}") {
            nodes.push(this.resolveExpression());
        }

        return nodes;
    }

    resolveValue(): ASTNode {
        const _resolveValue = (): ASTNode => {
            const token = this.getNextToken();
            if(token.type === "eof"){
                throw new Error("Unexpected end of file");
            }

            if (token.type === "identifier") {
                if (this.hasNextToken() && this.peakNextTokenStrict().value === "(") {
                    return this.resolveFunctionCall(token.value);
                } else {
                    return {
                        name: token.value,
                        nodeType: "identifier_variable",
                    } 
                }
            }

            if (isTokenTypeLiteral(token.type)) {
                if(token.type === "boolean"){
                    return {
                        nodeType: "literal_boolean",
                        value: token.value === "true",
                    }
                }else if(token.type === "string"){
                    return {
                        nodeType: "literal_string",
                        value: token.value,
                    }
                }else if(token.type === "float"){
                    return {
                        nodeType: "literal_float",
                        value: Number(token.value),
                    }
                }else if(token.type === "integer"){
                    return {
                        nodeType: "literal_int",
                        value: Number(token.value),
                    }
                }

                throw new Error(`Unexpected token type ${token.type}`);
            }

            if(token.type === "literal_template_string"){
                const node: ASTLiteralTemplateString = {
                    nodeType: "literal_template_string",
                    value: token.value,
                    parts: []
                };

                for(let i = 0; i < token.parts.length; i++){
                    const parser = new ASTParser(token.parts[i].tokens);
                    try{
                        const value = parser.resolveValue();
                        node.parts.push(value);
                    } catch(error){
                        console.log(`Error at token ${parser.index}`);
                        throw error;
                    }

                    // Insert %s into the template string
                    node.value = node.value.slice(0, token.parts[i].position + i * 2) + "%s" + node.value.slice(token.parts[i].position + i * 2);
                }

                return node;
            }

            throw new Error(`Unexpected token type ${token.type}`);
        }

        const _resolveOperator = (left: ASTNode, nextToken: TokenDefinition): ASTNode => {
            if (nextToken.type === "compare_operator") {
                this.skipNextToken();
                return {
                    nodeType: 'operator_compare',
                    operator: getCompareOperator(nextToken.value), 
                    left,
                    right: this.resolveValue(),
                } 
            } 
            
            if(nextToken.type === "logical_operator"){
                this.skipNextToken();
                return {
                    nodeType: "operator_logical",
                    operator: getLogicalOperator(nextToken.value),
                    left,
                    right: this.resolveValue(),
                }
            }

            throw new Error(`Unexpected token type ${nextToken.type}`);
        }

        

        let value = _resolveValue();
        let nextToken = this.peakNextTokenStrict();

        if(nextToken.type === "arithmetic_operator"){
            this.skipNextToken();
            value = {
                nodeType: "operator_arithmetic",
                operator: getArithmeticOperator(nextToken.value),
                left: value,
                right: _resolveValue(),
            }

            nextToken = this.peakNextTokenStrict();
        }

        if(nextToken.type === "compare_operator" || nextToken.type === "logical_operator"){
            return _resolveOperator(value, nextToken);
        }

        return value
    }

    resolveFunctionCall(name: string): ASTNode {
        this.expect("scope_open_symbol", "(")
        this.skipNextToken();

        const node: ASTFunctionCall = {
            nodeType: "function_call",
            name,
            arguments: [],
        };

        while (this.peakNextTokenStrict().value !== ")") {
            node.arguments.push(this.resolveValue());

            if (this.peakNextTokenStrict().type === "comma") {
                this.skipNextToken();
                const peak = this.peakNextTokenStrict();
                if(peak.type !== "identifier" && isPrimitiveType(peak.type)){
                    throw new Error(`Unexpected token type ${peak.type}`);
                }
            }else {
                this.expect("scope_close_symbol", ")");
            }
        }
        
        this.skipNextToken();

        return node;
    }

    resolveVariableDeclaration(): ASTNode {
        this.expectTokens([["modifier_keyword", "type"]]);
        let token = this.getNextToken();

        let constant = false;
        if(token.type === "modifier_keyword"){
            if(token.value === "const"){
                constant = true;
                this.expectTokens(["type"]);
                token = this.getNextToken();
            }else{
                throw new Error(`Unexpected token type ${token.type}`);
            }
        }
        
        const type = token;

        this.expectTokens(["identifier"]);
        const identifier = this.getNextToken();
        
        this.expect("assignment_operator", "=");
        this.skipNextToken();

        const value = this.resolveValue();

        this.expect("semicolon")
        this.skipNextToken();

        return {
            nodeType: "variable_definition",
            name: identifier.value,
            type: toPrimitiveType(type.value),
            value,
            constant,
        };
    }
    
    resolveAssignment(): ASTNode {
        this.expectTokens(["identifier"]);
        const identifier = this.getNextToken();

        if(!isAssignmentOperator(this.peakNextTokenStrict().value)){
            throw new Error(`Unexpected token ${this.peakNextTokenStrict().value}`);
        }

        const operator = this.getNextToken();
        const value = this.resolveValue();
        this.expect("semicolon")
        this.skipNextToken();

        return {
            nodeType: "variable_assignment",
            operator: getAssignmentOperator(operator.value),
            name: identifier.value,
            value,
        };
    }

    resolveExpression(): ASTNode {
        let token = this.getNextToken();

        if (token.type === "identifier") {
            if(this.hasNextToken() && this.peakNextTokenStrict().value === "("){
                const call = this.resolveFunctionCall(token.value);
                this.expect("semicolon")
                this.skipNextToken();
                return call;
            }else if(isAssignmentOperator(this.peakNextTokenStrict().value)){
                this.reverse();
                return this.resolveAssignment();
            }
        } else if (isModifierKeyword(token.value) || token.type === "type") {
            this.reverse();
            return this.resolveVariableDeclaration();
        } else if (token.type === "control_flow_keyword") {
            if (token.value === "return") {
                if(!this.hasNextToken()){
                    return {
                        nodeType: "return_statement",
                        value: null,
                    };
                }

                token = this.peakNextTokenStrict();
                if (token.type === "semicolon") {
                    this.skipNextToken();
                    return {
                        nodeType: "return_statement",
                        value: null,
                    };
                }

                const value = this.resolveValue();
                this.expect("semicolon")
                this.skipNextToken();

                return {
                    nodeType: "return_statement",
                    value,
                };
            } else if (token.value === "while") {
                this.expect("scope_open_symbol", "(")
                this.skipNextToken();
                const condition = this.resolveValue();

                if(!isCondition(condition)){
                    throw new Error(`Unexpected token type ${condition.nodeType}`);
                }

                this.expect("scope_close_symbol", ")")
                this.skipNextToken();
                const body = this.resolveScopeBraces();
                this.expect("scope_close_symbol", "}")
                this.skipNextToken();

                return {
                    nodeType: 'while_statement',
                    condition,
                    body,
                };
            }
            else if (token.value === "do") {
                const body = this.resolveScopeBraces();
                this.expect("scope_close_symbol", "}")
                this.skipNextToken();
                this.expectTokenValues(["while", "("]);
                this.skipNextToken();this.skipNextToken();
                const condition = this.resolveValue();
                this.expectTokenValues([")", ";"]);
                this.skipNextToken();this.skipNextToken();



                if(!isCondition(condition)){
                    throw new Error(`Unexpected token type ${condition.nodeType}`);
                }


                return {
                    nodeType: 'do_while_statement',
                    condition,
                    body,
                };
            }else if(token.value === "if" || token.value === "else if"){
                this.expect("scope_open_symbol", "(")
                this.skipNextToken();
                const condition = this.resolveValue();
                this.expect("scope_close_symbol", ")")
                this.skipNextToken();
                const body = this.resolveScopeBraces();
                this.expect("scope_close_symbol", "}")
                this.skipNextToken();


                if(!isCondition(condition)){
                    throw new Error(`Unexpected token type ${condition.nodeType}`);
                }

                const ifStatement: ASTIfStatement | ASTElseIfStatement = {
                    nodeType: token.value === "if" ? "if_statement" : "else_if_statement",
                    condition,
                    body,
                };


                if(this.hasNextToken() && this.peakNextTokenStrict().value.startsWith("else")){
                    const elseStatement = this.resolveExpression();
                    if(!(elseStatement.nodeType === "else_statement" || elseStatement.nodeType === "else_if_statement"))
                        throw new Error(`Unexpected token type ${elseStatement.nodeType}. Expected else statement`);

                    ifStatement.chain = elseStatement;
                }

                return ifStatement;
            }else if(token.value === "else"){
                const body = this.resolveScopeBraces();
                this.expect("scope_close_symbol", "}")
                this.skipNextToken();

                return {
                    nodeType: 'else_statement',
                    body,
                };
            }else if (token.value === "assert") {
                this.expect("scope_open_symbol", "(")
                this.skipNextToken();
                const condition = this.resolveValue();


                if(!isCondition(condition)){
                    throw new Error(`Unexpected token type ${condition.nodeType}`);
                }

                this.expect("scope_close_symbol", ")")
                this.skipNextToken();
                this.expect("semicolon")
                this.skipNextToken();

                return {
                    nodeType: 'assert_statement',
                    condition,
                };
            }
        }
        throw new Error(`Unexpected token type ${token.type}`);
    }
}





