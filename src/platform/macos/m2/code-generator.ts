import { ASTNode } from "../../../parser/parser"
import { StackFrame } from "./m2-compiler"
import { DataRegistry } from "./macos-registry"

export function generateProgramStart(stack: StackFrame){ 
    const size = stack.stackFrameSize < 32 ? 32 : stack.stackFrameSize;

    return `
.global _start
.align 4

_start:
    STP X29, LR, [SP, #-${size}]!    ; Save LR, FR
`
}

export function generateExecutionStart(stack: StackFrame){
    const size = stack.stackFrameSize < 32 ? 32 : stack.stackFrameSize;

    return `
    BL main                     ; Call main

    MOV	X0, #0                  ; Return 0
    LDP	X29, LR, [SP], #${size}      ; Restore FR, LR
    RET
`
}

// export function generateGlobalVariableDeclaration(name: string, type: string, value: ASTNode){
//     if(value.isValueLiteral){
//         return `
//     .global ${name}
//     .align 4
//     `
//     }
// }

    

export function generateProgramEnd(){
    return `
.data
${DataRegistry.join('\n')}
.align 4
.text
`
}


export function generateVariableDeclaration(node: ASTNode, stackFrame: StackFrame){
    if(!node.isVariableDefinition) throw new Error(`The node ${node.toString()} is not a variable declaration.`)
    const value = node.variableDefinitionValue;
    const variable = stackFrame.getVariableStrict(node.variableDefinitionName);

    if(value.isValueLiteral){
        return `
    MOV X0, #${value.valueLiteralValue}
    STR X0, [SP, #${variable?.offset}]
    `
    }else if(value.isIdentifierVariable){
        const identifier = stackFrame.getVariableStrict(node.variableDefinitionValue.identifierVariableName);
        return `
    LDR X0, [SP, #${identifier.offset}]
    STR X0, [SP, #${variable.offset}]
    `
    }

    throw new Error(`The variable ${value.toString()} is not supported.`)
}
export function generateWhileLoopStart(){
    return `
loop:`
}
export function generateWhileLoopEnd(){
    return `
loopEnd:
`
}

export function loadVariable(v: ASTNode, targetRegistry: string, stackFrame: StackFrame){
    if(v.isValueLiteral){
        return `
    MOV ${targetRegistry}, #${v.valueLiteralValue}`
    }

    if(v.isIdentifierVariable){
        const variable = stackFrame.getVariableStrict(v.identifierVariableName);
        return `
    LDR ${targetRegistry}, [SP, #${variable.offset}]`
    }

    throw new Error(`The variable ${v.toString()} is not supported.`)
}

export function generateFunctionCall(name: string, arguments_: ASTNode[], stackFrame: StackFrame){
    let args = '';

    for(let i = 0; i < arguments_.length; i++){
        const arg = arguments_[i];
        const argV = loadVariable(arg, `X${i}`, stackFrame);
        args += argV;
    }

    return `
    ${args}
    BL ${name}
`
}

export function generateFunctionDefinitionStart(name: string, arguments_: ASTNode[], stackFrame: StackFrame){
    return `
${name}:
    STP X29, LR, [SP, #-${stackFrame.stackFrameSize}]!    ; Save LR, FR
    ${arguments_.map((arg, i) => {
        const variable = stackFrame.getVariableStrict(arg.identifierVariableName);
        return `
    STR X${i}, [SP, #${variable.offset}]`
    }).join('\n')}
`
}

export function generateFunctionDefinitionEnd(stackFrame: StackFrame){
    return `
    LDP	X29, LR, [SP], #${stackFrame.stackFrameSize}      ; Restore FR, LR
    RET
`
}

export function generateCondition(left: ASTNode, right: ASTNode, operator: string, targetLabel: string, stackFrame: StackFrame){
    const leftV = loadVariable(left, 'X0', stackFrame);
    const rightV = loadVariable(right, 'X1', stackFrame);

    let condition = '';

    switch(operator){
        case '==':
            condition = 'BEQ';
            break;
        case '!=':
            condition = 'BNE';
            break;
        case '>':
            condition = 'BGT';
            break;
        case '<':
            condition = 'BLT';
            break;
        case '>=':
            condition = 'BGE';
            break;
        case '<=':
            condition = 'BLE';
            break;
        default:
            throw new Error(`The operator ${operator} is not supported.`)
    }

    return `
    ${leftV}
    ${rightV}
    CMP X0, X1
    ${condition} ${targetLabel}
`
}