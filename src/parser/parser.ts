import { isDefinitionKeyword } from "../language/keywords/definition";
import { isModifierKeyword } from "../language/keywords/modifier";
import { isPrimitiveType } from "../language/keywords/primitive-type";
import {
    TOKENS_TYPE,
    TokenDefinition,
    isTokenTypeLiteral,
} from "../tokenizer/tokenizer";

interface RootNodeRaw {
    node: "root";
    body: ASTNodeRaw[];
}

interface TypeNodeRaw {
    node: "type";
    type: string;
}

interface ValueLiteralNodeRaw {
    node: "value_literal";
    value: string;
    type: "string" | "integer" | "float";
}

interface FunctionArgumentDefinitionNodeRaw {
    node: "function_argument_definition";
    name: string;
    type: string;
}

interface IdentifierVariableNodeRaw {
    node: "identifier_variable";
    name: string;
}

interface IdentifierFunctionNodeRaw {
    node: "identifier_function";
    name: string;
}

interface FunctionDefinitionNodeRaw {
    node: "function_definition";
    name: string;
    arguments: ASTNodeRaw[];
    body: ASTNodeRaw[];
}

interface FunctionCallNodeRaw {
    node: "function_call";
    name: string;
    arguments: ASTNodeRaw[];
}

interface MainFunctionNodeRaw {
    node: "main_function";
    arguments: ASTNodeRaw[];
    body: ASTNodeRaw[];
}

interface VariableDefinitionNodeRaw {
    node: "variable_definition";
    name: string;
    type: string;
    value: ASTNodeRaw | null;
    constant: boolean;
}

interface ReturnStatementNodeRaw {
    node: "return_statement";
    value: ASTNodeRaw | null;
}

interface WhileLoopNodeRaw {
    node: "while_loop";
    condition: ASTNodeRaw;
    body: ASTNodeRaw[];
}

interface ComparisonNodeRaw {
    node: "comparison";
    operator: string;
    left: ASTNodeRaw;
    right: ASTNodeRaw;
}

interface ArithmeticOperatorNodeRaw {
    node: "arithmetic_operator";
    operator: string;
    left: ASTNodeRaw;
    right: ASTNodeRaw;
}

interface TemplateStringNodeRaw {
    node: "template_string";
    value: string;
    parts: ASTNodeRaw[];
}

type ASTNodeRaw =
    | TypeNodeRaw
    | FunctionArgumentDefinitionNodeRaw
    | IdentifierVariableNodeRaw
    | IdentifierFunctionNodeRaw
    | FunctionDefinitionNodeRaw
    | FunctionCallNodeRaw
    | MainFunctionNodeRaw
    | VariableDefinitionNodeRaw
    | ValueLiteralNodeRaw
    | ReturnStatementNodeRaw
    | WhileLoopNodeRaw
    | ComparisonNodeRaw
    | ArithmeticOperatorNodeRaw
    | TemplateStringNodeRaw
    | RootNodeRaw;


function isScopedASTNodeRaw(node: ASTNodeRaw): node is (RootNodeRaw | FunctionDefinitionNodeRaw | MainFunctionNodeRaw | WhileLoopNodeRaw) {
    return node.node === "root" || node.node === "function_definition" || node.node === "main_function" || node.node === "while_loop";
}

export class ASTNode {
    private nodeType: string | null = null;
    private index: number;
    private range: number;

    get id() { return this.index }

    private name: string | null = null;
    private valueNode: ASTNode | null = null;
    private valueLiteral: string | null | number = null;
    private type: string | null = null;
    private constant: boolean = false;
    private condition: ASTNode | null = null;
    private operator: string | null = null;
    private left: ASTNode | null = null;
    private right: ASTNode | null = null;
    private arguments: ASTNode[] = [];

    private _children: ASTNode[] = [];
    private _isScoped: boolean = false;

    get children() { return this._children }

    get isScoped() { return this._isScoped }
    get isExecutionOrderInsentive() { return this.nodeType === "root" }
    get isRoot() { return this.nodeType === "root" }
    get isMainFunction() { return this.nodeType === "main_function" }

    get isVariableDefinition() { return this.nodeType === "variable_definition" }
    get variableDefinitionName() { return this.name! }
    get variableDefinitionType() { return this.type! }
    get variableDefinitionValue() { return this.valueNode! }

    get isFunctionDefinition() { return this.nodeType === "function_definition" }
    get functionDefinitionName() { return this.isMainFunction ? "main" : this.name!  }
    get functionDefinitionArguments() { return this.arguments }
    get functionDefinitionBody() { return this._children }

    get isValueLiteral() { return this.nodeType === "value_literal" }
    get valueLiteralValue() { return this.valueLiteral! }
    get valueLiteralType() { return this.type! }

    get isFunctionCall() { return this.nodeType === "function_call" }
    get functionCallName() { return this.name! }
    get functionCallArguments() { return this.arguments }

    get isIdentifierVariable() { return this.nodeType === "identifier_variable" }
    get identifierVariableName() { return this.name! }

    get isWhileLoop() { return this.nodeType === "while_loop" }
    get leftNode() { return this.left! }
    get rightNode() { return this.right! }
    get operatorValue() { return this.operator! }

    get conditionNode() { return this.condition! }


    constructor(raw: ASTNodeRaw, index: number) {
        this.nodeType = raw.node;
        this._isScoped = false;
        this.index = index;

        if(isScopedASTNodeRaw(raw)){
            this._isScoped = true;
            this._children = raw.body.map(node => {
                const result = new ASTNode(node, index + 1);
                index += result.range;
                return result;
            });
        }

        if(raw.node === "while_loop"){
            this.condition = new ASTNode((raw as WhileLoopNodeRaw).condition, index + 1);
            index += this.condition.range;
        }

        if((raw as any).value){
            if(typeof (raw as any).value === "object"){
                this.valueNode = new ASTNode((raw as any).value, index + 1);
                index += this.valueNode.range;
            }else {
                this.valueLiteral = (raw as any).value;
            }
        }

        if((raw as any).type){
            this.type = (raw as any).type;
        }

        if((raw as any).name){
            this.name = (raw as any).name;
        }

        if((raw as any).constant){
            this.constant = (raw as any).constant;
        }

        if((raw as any).arguments){
            this.arguments = (raw as any).arguments.map((node: ASTNodeRaw) => {
                const result = new ASTNode(node, index + 1)
                index += result.range;
                return result;
            });
        }

        if((raw as any).operator){
            this.operator = (raw as any).operator;
        }

        if((raw as any).left){
            this.left = new ASTNode((raw as any).left, index + 1);
            index += this.left.range;
        }

        if((raw as any).right){
            this.right = new ASTNode((raw as any).right, index + 1);
            index += this.right.range;
        }

        this.range = (index - this.index) + 1;
    }

    toString() {
        return this.nodeType
    }
}
    

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

    expectTokens(expected: TOKENS_TYPE[]) {
        let internalIndex = this.index;
        for (let j = 0; j < expected.length; j++) {
            while (this.tokens[internalIndex].type === "whitespace") {
                internalIndex++;
            }

            const expectedToken = expected[j];
            const token = this.tokens[internalIndex];

            if (token.type !== expectedToken) {
                throw new Error(
                    `Expected token type ${expectedToken} but got ${token.type}`
                );
            }

            internalIndex++;
        }
    }

    isTokens(expected: TOKENS_TYPE[]) {
        let internalIndex = this.index;
        for (let j = 0; j < expected.length; j++) {
            while (this.tokens[internalIndex].type === "whitespace") {
                internalIndex++;
            }

            const expectedToken = expected[j];
            const token = this.tokens[internalIndex];

            if (token.type !== expectedToken) {
                return false;
            }

            internalIndex++;
        }

        return true;
    }

    expectTokensValue(expected: string[]) {
        let internalIndex = this.index;
        for (let j = 0; j < expected.length; j++) {
            while (this.tokens[internalIndex].type === "whitespace") {
                internalIndex++;
            }

            const expectedToken = expected[j];
            const token = this.tokens[internalIndex];
            if(!token){
                throw new Error(
                    `Expected token type ${expectedToken} but got no token`
                );
            }
            if(token.type === "eof"){
                throw new Error(
                    `Expected token type ${expectedToken} but got eof`
                );
            }

            if (token.value !== expectedToken) {
                throw new Error(
                    `Expected token type ${expectedToken} but got ${token.value}`
                );
            }

            internalIndex++;
        }
    }

    isTokensValue(expected: string[]) {
        let internalIndex = this.index;
        for (let j = 0; j < expected.length; j++) {
            while (this.tokens[internalIndex].type === "whitespace") {
                internalIndex++;
            }

            const expectedToken = expected[j];
            const token = this.tokens[internalIndex];
            if(!token){
                throw new Error(
                    `Expected token type ${expectedToken} but got no token`
                );
            }
            if(token.type === "eof"){
                throw new Error(
                    `Expected token type ${expectedToken} but got eof`
                );
            }


            if (token.value !== expectedToken) {
                return false;
            }

            internalIndex++;
        }

        return true;
    }

    parse(): ASTNode {
        try{
            const nodes: ASTNodeRaw[] = [];
            let id = 0

            while (this.hasNextToken()) {
                const token = this.getNextToken()!;
    
                if (token.type === "definition_keyword") {
                    if (token.value === "main") {
                        const mainFunc: MainFunctionNodeRaw = {
                            node: "main_function",
                            arguments: this.resolveFunctionArgumentsDefinition(),
                            body: this.resolveScopeBraces(),
                        };
    
                        nodes.push(mainFunc);
                    }else if(token.value === "function") {
                        if(!this.hasNextToken()){
                            throw new Error("Unexpected end of file");
                        }

                        const func: FunctionDefinitionNodeRaw = {
                            node: "function_definition",
                            name: this.getNextToken().value,
                            arguments: this.resolveFunctionArgumentsDefinition(),
                            body: this.resolveScopeBraces(),
                        };
    
                        nodes.push(func);
                    }
                } else if(token.type === "modifier_keyword"){
                    this.index--;
                    const variable = this.resolveVariableDefinition();
                    nodes.push(variable);
                }
            }
    
            return new ASTNode({
                node: "root",
                body: nodes,
            }, id);
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

    resolveFunctionArgumentsDefinition(): ASTNodeRaw[] {
        const resolveFunctionArgumentDefinition =
            (): FunctionArgumentDefinitionNodeRaw => {
                this.expectTokens(["identifier", "colon", "type"]);

                // a : int
                const identifier = this.getNextToken()!;
                this.skipNextToken();
                const type = this.getNextToken()!;

                return {
                    node: "function_argument_definition",
                    name: identifier.value,
                    type: type.value,
                };
            };

        this.expectTokensValue(["("]);
        this.skipNextToken();

        const args: ASTNodeRaw[] = [];

        while (this.peakNextTokenStrict().value !== ")") {
            args.push(resolveFunctionArgumentDefinition());
            
            if(this.peakNextTokenStrict().type === "comma"){
                this.skipNextToken();
                this.expectTokens(["identifier"])
            }else{
                this.expectTokensValue([")"]);
            }
        }
        this.skipNextToken();

        return args;
    }

    resolveScopeBraces(): ASTNodeRaw[] {
        this.expectTokensValue(["{"]);
        this.skipNextToken();

        const nodes: ASTNodeRaw[] = [];

        while (this.peakNextTokenStrict().value !== "}") {
            nodes.push(this.resolveExpression());
        }

        return nodes;
    }

    resolveValue(): ASTNodeRaw {
        const token = this.getNextToken();
        if(token.type === "eof"){
            throw new Error("Unexpected end of file");
        }

        const result: ASTNodeRaw | undefined = (() => {
            if (token.type === "identifier") {
                if (this.hasNextToken() && this.peakNextTokenStrict().value === "(") {
                    return this.resolveFunctionCall(token.value);
                } else {
                    return {
                        node: "identifier_variable",
                        name: token.value,
                    };
                }
            }

            if (isTokenTypeLiteral(token.type)) {
                return {
                    node: "value_literal",
                    type: token.type,
                    value: token.value,
                };
            }

            if(token.type === "template_string"){

                const node: ASTNodeRaw = {
                    node: "template_string",
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
        })();

        if (result) {
            const nextToken = this.peakNextToken();
            if(!nextToken){
                return result;
            }

            if (nextToken.type === "compare_operator") {
                this.skipNextToken();
                return {
                    node: "comparison",
                    operator: nextToken.value,
                    left: result,
                    right: this.resolveValue(),
                };
            }else if(nextToken.type === "arithmetic_operator"){
                this.skipNextToken();
                return {
                    node: "arithmetic_operator",
                    operator: nextToken.value,
                    left: result,
                    right: this.resolveValue(),
                };
            }
            return result;
        }

        throw new Error(`Unexpected token type ${token.type}`);
    }

    resolveFunctionCall(name: string): ASTNodeRaw {
        this.expectTokensValue(["("]);
        this.skipNextToken();

        const node: ASTNodeRaw = {
            node: "function_call",
            name,
            arguments: [],
        };

        while (this.peakNextTokenStrict().value !== ")") {
            node.arguments.push(this.resolveValue());

            if (this.peakNextTokenStrict().type === "comma") {
                this.skipNextToken();
                this.expectTokens(["identifier"]);
            }else {
                this.expectTokensValue([")"]);
            }
        }
        
        this.skipNextToken();

        return node;
    }

    resolveVariableDefinition(): ASTNodeRaw {
        this.expectTokens(["modifier_keyword"]);
        let token = this.getNextToken();
        const modifier = token.value;
        this.expectTokens(["identifier"]);
        const identifier = this.getNextToken();
        this.expectTokensValue([":"]);
        this.skipNextToken();
        this.expectTokens(["type"]);
        const type = this.getNextToken();
        token = this.peakNextTokenStrict();

        if (token.type === "colon") {
            this.skipNextToken();
            return {
                node: "variable_definition",
                name: identifier.value,
                type: type.value,
                value: null,
                constant: modifier === "const",
            };
        }

        this.expectTokensValue(["="]);
        this.skipNextToken();

        const value = this.resolveValue();

        this.expectTokensValue([";"]);
        this.skipNextToken();

        return {
            node: "variable_definition",
            name: identifier.value,
            type: type.value,
            value,
            constant: modifier === "const",
        };
    }

    resolveExpression(): ASTNodeRaw {
        let token = this.getNextToken();

        if (token.type === "identifier") {
            const call = this.resolveFunctionCall(token.value);
            this.expectTokensValue([";"]);
            this.skipNextToken();
            return call;
        } else if (isModifierKeyword(token.value)) {
            this.index -= 1;
            return this.resolveVariableDefinition();
        } else if (token.type === "control_flow_keyword") {
            if (token.value === "return") {
                if(!this.hasNextToken()){
                    return {
                        node: "return_statement",
                        value: null,
                    };
                }

                token = this.peakNextTokenStrict();
                if (token.type === "semicolon") {
                    this.skipNextToken();
                    return {
                        node: "return_statement",
                        value: null,
                    };
                }

                const value = this.resolveValue();
                this.expectTokensValue([";"]);
                this.skipNextToken();

                return {
                    node: "return_statement",
                    value,
                };
            } else if (token.value === "while") {
                this.expectTokensValue(["("]);
                this.skipNextToken();
                const condition = this.resolveValue();
                this.expectTokensValue([")"]);
                this.skipNextToken();
                const body = this.resolveScopeBraces();

                return {
                    node: "while_loop",
                    condition,
                    body,
                };
            }
        }
        throw new Error(`Unexpected token type ${token.type}`);
    }
}




