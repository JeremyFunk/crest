import { Scope } from "../scopes";
import { ASTWhileStatement } from "../../../parser/parser";
import { getPseudoCondition } from "./pseudo-condition";
import { getPseudoValue } from "./pseudo-functions";

let whileCount = 0;
export function getPseudoWhileLoopStart(node: ASTWhileStatement) {
    Scope.pushSubScope(whileCount, 'while');
    return `
    while ${getPseudoCondition(node.condition)} ${whileCount++}`;
}

export function getPseudoWhileLoopEnd(node: ASTWhileStatement) {
    return `while_end
    `;
}

let doWhileCount = 0;
export function getPseudoDoWhileLoopStart(node: ASTWhileStatement) {
    Scope.pushSubScope(doWhileCount, 'do-while');
    return `
    do`;
}

export function getPseudoDoWhileLoopEnd(node: ASTWhileStatement) {
    const condition = getPseudoCondition(node.condition);
    return `while ${condition}
    `;
}