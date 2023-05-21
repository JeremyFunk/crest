import { Scope } from "../scopes";
import { ASTVariableAssignment, ASTVariableDefinition } from "../../../parser/parser";
import { getPseudoValue } from "./pseudo-functions";

export function getPseudoVariableDefinition(node: ASTVariableDefinition){
    return `${node.constant ? 'constant' : 'dynamic'} ${node.name} ${node.type} ${getPseudoValue(node.value)}`;
}

export function getPseudoVariableAssignment(node: ASTVariableAssignment){
    let operator = '';

    switch(node.operator){
        case '=':
            operator = 'assign';
            break;
        case '+=':
            operator = 'assign_add';
            break;
        case '-=':
            operator = 'assign_subtract';
            break;
        case '*=':
            operator = 'assign_multiply';
            break;
        case '/=':
            operator = 'assign_divide';
            break;
        case '%=':
            operator = 'assign_modulo';
            break;
        default:
            throw new Error(`Invalid operator ${node.operator}`);
    }

    return `${operator} ${node.name} ${getPseudoValue(node.value)}`;
}