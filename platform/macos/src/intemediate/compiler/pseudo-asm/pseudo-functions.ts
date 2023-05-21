import { Scope } from "../scopes";
import { ASTAssertStatement, ASTNode, ASTReturnStatement } from "../../../parser/parser";
import { ASTFunctionCall, ASTFunctionDefinition } from "../../../parser/parser";
import { getPseudoCondition } from "./pseudo-condition";

export function getPseudoFunctionCallMain() {
    return `function_call main\nfunction_call_end`
}

export function getPseudoFunctionCall(node: ASTFunctionCall) {
    let compiled = `function_call ${Scope.getFunction(node.name).returnType} ${node.name}\n`

    for(let arg of node.arguments){
        compiled += getPseudoValue(arg) + '\n';
    }

    return `${compiled}function_call_end
    `;
}

let functionCount = 0;
export function getPseudoFunctionHead(node: ASTFunctionDefinition) {
    Scope.pushFullScope(functionCount, 'function');
    let compiled = `function_head ${node.returnType} ${node.name} ${functionCount++}\n`
    for(let arg of node.arguments){
        compiled += `${arg.name} ${arg.type}\n`;
    }
    compiled += 'function_body';

    return compiled;
}

export function getPseudoFunctionEnd(node: ASTFunctionDefinition) {
    Scope.popFullScope('function');
    return `function_end ${node.name}
    
    `
}

export function getReturnStatement(node: ASTReturnStatement) {
    return `return ${node.value == null ? "" : getPseudoValue(node.value)}`
}

export function getAssertStatement(node: ASTAssertStatement) {
    return `assert ${getPseudoCondition(node.condition)}`
}

export function getPseudoValue(node: ASTNode | null): string{
    if(node === null){
        return "null";
    }

    if(node.nodeType === "function_call"){
        return getPseudoFunctionCall(node);
    }

    if(node.nodeType === "literal_int"){
        return node.value.toString();
    }else if(node.nodeType === "literal_string"){
        return node.value;
    }else if(node.nodeType === "literal_float"){
        return node.value.toString();
    }else if(node.nodeType === "literal_boolean"){
        return node.value.toString();
    }else if(node.nodeType === "literal_template_string"){
        throw new Error("Template strings are not supported yet");
    }

    if(node.nodeType === "identifier_variable"){
        return `$${node.name}`;
    }

    if(node.nodeType === "operator_arithmetic"){
        const left = getPseudoValue(node.left);
        const right = getPseudoValue(node.right);
        return `${left} ${node.operator} ${right}`;
    }

    if(node.nodeType === "operator_compare"){
        const left = getPseudoValue(node.left);
        const right = getPseudoValue(node.right);
        return `${left} ${node.operator} ${right}`;
    }

    if(node.nodeType === "operator_logical"){
        const left = getPseudoValue(node.left);
        const right = getPseudoValue(node.right);
        return `${left} ${node.operator} ${right}`;
    }

    throw new Error(`Cannot compile node ${node.nodeType}`);
}
