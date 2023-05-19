import { ASTNode } from "../../parser/parser";
import { AArch64Wrapper } from "./aarch64-wrapper";
import { AArch64InstructionWrapper } from "./aarch64-low-level";
import { StackFrameState } from "../compiler/m2-compiler"
import { DataRegistry } from "./builtins"
import { AArch64Utilities } from "./aarch64-registry";
import { FunctionArgumentDefinition } from "../compiler/preparation";

export function generateProgram(stack: StackFrameState){ 
    return AArch64Wrapper.generateProgram(stack)
}

export function generateDataSection(stack: StackFrameState){
    return `
.data
${DataRegistry.join('\n')}
${[...stack.globals].join('\n')}
.align 4
.text
`
}

export function generateVariableDeclaration(node: ASTNode, stackFrame: StackFrameState){
    if(!node.isVariableDefinition) throw new Error(`The node ${node.toString()} is not a variable declaration.`)
    const variable = stackFrame.getVariableDefinitionStrict(node.variableDefinitionName);
    stackFrame.declareVariable(variable);

    return '\n' + generateDirectAssignment(node, stackFrame);
}

export function generateDirectAssignment(node: ASTNode, stackFrame: StackFrameState){
    const value = node.variableDefinitionValue;
    const variable = stackFrame.getVariableStrict(node.variableDefinitionName);
    stackFrame.allocateVariable(variable);

    if(value.isValueLiteral){
        if(variable.register){
            return AArch64InstructionWrapper.storeLiteralInRegister(value.valueLiteralValue, variable.register);
        }else if(variable.stackOffset !== undefined){
            return AArch64InstructionWrapper.storeLiteralOnStack(value.valueLiteralValue, variable.stackOffset, stackFrame.getFreeTemporaryRegister());
        }else{
            throw new Error(`The variable ${variable.name} has no register or stack offset.`);
        }
    }else if(value.isIdentifierVariable){
        const identifier = stackFrame.getVariableStrict(node.variableDefinitionValue.identifierVariableName);
        if(identifier.register){
            if(variable.register)
                return AArch64InstructionWrapper.storeRegisterInRegister(identifier.register, variable.register);
            if(variable.stackOffset !== undefined)
                return AArch64InstructionWrapper.storeRegisterOnStack(identifier.register, variable.stackOffset);
        }else if(identifier.stackOffset !== undefined){
            if(variable.register)
                return AArch64InstructionWrapper.storeStackInRegister(identifier.stackOffset, variable.register);
            if(variable.stackOffset !== undefined)
                return AArch64InstructionWrapper.storeStackOnStack(identifier.stackOffset, variable.stackOffset, stackFrame.getFreeTemporaryRegister());
        }
        throw new Error(`The variable ${identifier.name} or ${variable.name} has no register or stack offset.`);
    }

    throw new Error(`The variable ${value.toString()} is not supported.`)
}

export function generateAssignment(node: ASTNode, stackFrame: StackFrameState){
    if(!node.isVariableAssignment) throw new Error(`The node ${node.toString()} is not an assignment.`)

    const operator = AArch64Utilities.getOperator(node.operatorValue);

    const value = node.variableAssignmentValue
    let source = ''
    
    if(value.isValueLiteral){
        source = `#${value.valueLiteralValue}`
    }else if(value.isIdentifierVariable){
        const variable = stackFrame.getVariableStrict(value.identifierVariableName);
        source = `[SP, #${variable.stackOffset}]`
    }

    const target = stackFrame.getVariableStrict(node.variableAssignmentName);
    if(target.register)
        return `${operator} ${target.register}, ${target.register}, ${source} ; Perform the assignment operation`
    if(target.stackOffset !== undefined){
        stackFrame.setVariableToFreeRegister(target);
        AArch64InstructionWrapper.storeStackInRegister(target.stackOffset, stackFrame.getFreeTemporaryRegister());
    }

    throw new Error(`The variable ${target.name} has no register or stack offset.`);
}


// export function generateWhileLoopStart(stackFrame: StackFrame){
//     return `
//     SUB SP, SP, #${stackFrame.stackFrameSize}
// loop:`
// }
// export function generateWhileLoopEnd(stackFrame: StackFrame){
//     return `
// loopEnd:
//     ADD SP, SP, #${stackFrame.stackFrameSize}
// `
// }

export function generateFunctionCall(name: string, arguments_: ASTNode[], stackFrame: StackFrameState){
    const argStates = arguments_.map(arg => {
        if(arg.isValueLiteral)
            return arg.valueLiteralValue;
        return stackFrame.getVariableStrict(arg.identifierVariableName);
    })

    return AArch64Wrapper.generateFunctionCall(name, argStates, stackFrame);
}

export function generateFunctionDefinition(name: string, arguments_: FunctionArgumentDefinition[], stackFrame: StackFrameState){
    return {
        start: AArch64Wrapper.generateFunctionDefinitionStart(name, arguments_.length, stackFrame),
        end: AArch64Wrapper.generateFunctionDefinitionEnd(name, arguments_.length, stackFrame)
    }
}

// export function generateFunctionDefinitionStart(name: string, arguments_: ASTNode[], stackFrame: StackFrame){
//     const result = `
//     ${name}:
//         SUB SP, SP, #${stackFrame.stackFrameSize}                  ; Allocate stack frame
//         STP X30, X29, [SP, #${stackFrame.stackFrameSize - 16}]!    ; Save return address, frame pointer
// `

//     // Registers x0-x19 are callee-saved, so we need to save them

//     return `
//     ${arguments_.map((arg, i) => {
//         const variable = stackFrame.getVariableStrict(arg.identifierVariableName);
//         return `
//     STR X${i}, [SP, #${variable.offset}]`
//     }).join('\n')}
// `
// }

// export function generateFunctionDefinitionEnd(stackFrame: StackFrame){
//     return `
//     LDP	X29, LR, [SP], #${stackFrame.stackFrameSize}      ; Restore FR, LR
//     RET
// `
// }

// export function generateCondition(left: ASTNode, right: ASTNode, operator: string, targetLabel: string, stackFrame: StackFrame){
//     const leftV = loadVariable(left, 'X0', stackFrame);
//     const rightV = loadVariable(right, 'X1', stackFrame);

//     let condition = '';

//     switch(operator){
//         case '==':
//             condition = 'BEQ';
//             break;
//         case '!=':
//             condition = 'BNE';
//             break;
//         case '>':
//             condition = 'BGT';
//             break;
//         case '<':
//             condition = 'BLT';
//             break;
//         case '>=':
//             condition = 'BGE';
//             break;
//         case '<=':
//             condition = 'BLE';
//             break;
//         default:
//             throw new Error(`The operator ${operator} is not supported.`)
//     }

//     return `
//     ${leftV}
//     ${rightV}
//     CMP X0, X1
//     ${condition} ${targetLabel}
// `
// }