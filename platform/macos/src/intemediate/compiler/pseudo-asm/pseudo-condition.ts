import { Scope } from "../scopes";
import { ASTCondition, ASTElseIfStatement, ASTElseStatement, ASTIfStatement, ASTOperatorComparison } from "../../../parser/parser";
import { getPseudoValue } from "./pseudo-functions";

export function getPseudoCondition(node: ASTCondition){
    if(node.nodeType === "literal_boolean"){
        if(typeof node.value !== "boolean"){
            throw new Error("Invalid literal type for condition");
        }

        return getPseudoValue(node);
    }

    if(node.nodeType === "identifier_variable" || node.nodeType === "function_call"){
        return getPseudoValue(node);
    }
    
    let left = getPseudoValue(node.left);
    let right = getPseudoValue(node.right);
    let rightHand = `${left} ${right}`
    
    switch(node.operator){
        case '==':
            return `cmp_equal ${rightHand}`;
        case '!=':
            return `cmp_not_equal ${rightHand}`;
        case '>':
            return `cmp_greater ${rightHand}`;
        case '<':
            return `cmp_less ${rightHand}`;
        case '>=':
            return `cmp_greater_equal ${rightHand}`;
        case '<=':
            return `cmp_less_equal ${rightHand}`;
        default:
            throw new Error(`Invalid operator ${node.operator}`);
    }
}

let ifCount = 0;
export function getPseudoIfStatementStart(node: ASTIfStatement){
    const condition = getPseudoCondition(node.condition);
    Scope.pushSubScope(ifCount, 'if');
    return `
    if ${condition} ${ifCount++}`;
}

export function getPseudoIfStatementEnd(node: ASTIfStatement){
    Scope.popSubScope('if');
    return `if_end
    `;
}

let elseIfCount = 0;
export function getPseudoElseIfStatementStart(node: ASTElseIfStatement){
    const condition = getPseudoCondition(node.condition);
    Scope.pushSubScope(elseIfCount, 'else-if');
    return `
    else_if ${condition} ${elseIfCount++}`;
}

export function getPseudoElseIfStatementEnd(node: ASTElseIfStatement){
    Scope.popSubScope('else-if');
    return `else_if_end
    `;
}

let elseCount = 0;
export function getPseudoElseStatementStart(node: ASTElseStatement){
    Scope.pushSubScope(elseCount, 'else');
    return `
    else ${elseCount++}`;
}

export function getPseudoElseStatementEnd(node: ASTElseStatement){
    Scope.popSubScope('else');
    return `else_end
    `;
}