import { ASTNode } from "../../parser/parser";
import { AArch64Wrapper } from "./aarch64-wrapper";
import { AArch64InstructionWrapper } from "./aarch64-low-level";
import { StackFrameState } from "../compiler/m2-compiler"
import { DataRegistry } from "./builtins"
import { AArch64Utilities, Register } from "./aarch64-registry";
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
type LabelElement = string & { __label: true }
type Label = {
    open: LabelElement,
    close: LabelElement
}
export function createLabel(id: number, name: string): Label {
    return {
        open: `${name}_${id}` as LabelElement,
        close: `${name}_${id}_end` as LabelElement
    }
}

export function generateVariableDeclaration(node: ASTNode, stackFrame: StackFrameState){
    if(!node.isVariableDefinition) throw new Error(`The node ${node.toString()} is not a variable declaration.`)
    const variable = stackFrame.getVariableDefinitionStrict(node.variableDefinitionName);
    stackFrame.declareVariable(variable);

    return '\n' + generateDirectAssignment(node, stackFrame);
}
function loadVariableToRegister(name: string, register: Register, stackFrame: StackFrameState){
    const variable = stackFrame.getVariableStrict(name);
    
    if(variable.register){
        return AArch64InstructionWrapper.loadRegisterInRegister(variable.register, register);
    }else if(variable.stackOffset !== undefined){
        return AArch64InstructionWrapper.loadStackToRegister(variable.stackOffset, register);
    }else{
        throw new Error(`The variable ${variable.name} has no register or stack offset.`);
    }
}
function loadNodeToRegister(node: ASTNode, register: Register, stackFrame: StackFrameState){
    if(node.isValueLiteral){
        return AArch64InstructionWrapper.loadLiteralInRegister(node.valueLiteralValue, register);
    }else if(node.isIdentifierVariable){
        return loadVariableToRegister(node.identifierVariableName, register, stackFrame);
    }else{
        throw new Error(`The node ${node.toString()} is not supported.`);
    }
}

export function generateDirectAssignment(node: ASTNode, stackFrame: StackFrameState){
    const value = node.variableDefinitionValue;
    const variable = stackFrame.getVariableStrict(node.variableDefinitionName);
    stackFrame.loadVariable(variable);

    if(value.isValueLiteral){
        if(variable.register){
            return AArch64InstructionWrapper.loadLiteralInRegister(value.valueLiteralValue, variable.register);
        }else if(variable.stackOffset !== undefined){
            return AArch64InstructionWrapper.storeLiteralOnStack(value.valueLiteralValue, variable.stackOffset, stackFrame.getFreeTemporaryRegister());
        }else{
            throw new Error(`The variable ${variable.name} has no register or stack offset.`);
        }
    }else if(value.isIdentifierVariable){
        const identifier = stackFrame.getVariableStrict(node.variableDefinitionValue.identifierVariableName);
        if(identifier.register){
            if(variable.register)
                return AArch64InstructionWrapper.loadRegisterInRegister(identifier.register, variable.register);
            if(variable.stackOffset !== undefined)
                return AArch64InstructionWrapper.storeRegisterOnStack(identifier.register, variable.stackOffset);
        }else if(identifier.stackOffset !== undefined){
            if(variable.register)
                return AArch64InstructionWrapper.loadStackToRegister(identifier.stackOffset, variable.register);
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
        AArch64InstructionWrapper.loadStackToRegister(target.stackOffset, stackFrame.getFreeTemporaryRegister());
    }

    throw new Error(`The variable ${target.name} has no register or stack offset.`);
}


export function generateDoWhileLoopStart(stackFrame: StackFrameState, label: Label){
    return `
    ${AArch64InstructionWrapper.allocateStackMemory(stackFrame.stackFrameSize)}
${label.open}:
`
}
export function generateDoWhileLoopEnd(stackFrame: StackFrameState, label: Label, left: ASTNode, right: ASTNode, operator: string){
    return `
    ${generateCondition(left, right, operator, label.open, stackFrame, false)}
${label.close}:
    ${AArch64InstructionWrapper.deallocateStackMemory(stackFrame.stackFrameSize)}
`
}
export function generateWhileLoopStart(stackFrame: StackFrameState, label: Label, left: ASTNode, right: ASTNode, operator: string){
    return `
    ${AArch64InstructionWrapper.allocateStackMemory(stackFrame.stackFrameSize)}
${label.open}:
    ${generateCondition(left, right, operator, label.close, stackFrame, true)}   
`
}
export function generateWhileLoopEnd(stackFrame: StackFrameState, label: Label){
    return `
    B ${label.open}
${label.close}:
    ${AArch64InstructionWrapper.deallocateStackMemory(stackFrame.stackFrameSize)}
`
}

export function generateIfStart(stackFrame: StackFrameState, label: Label, left: ASTNode, right: ASTNode, operator: string){
    return `
; If statement
    ${generateCondition(left, right, operator, label.close, stackFrame, true)}    
    ${AArch64InstructionWrapper.allocateStackMemory(stackFrame.stackFrameSize)}
`
}
export function generateIfEnd(stackFrame: StackFrameState, label: Label, chainEnd?: Label){
    return `
; End of if statement
    ${AArch64InstructionWrapper.deallocateStackMemory(stackFrame.stackFrameSize)}
    ${chainEnd ? `B ${chainEnd.close}` : ''}
${label.close}:
`
}

export function generateElseStart(stackFrame: StackFrameState){
    return `
; Else statement
    ${AArch64InstructionWrapper.allocateStackMemory(stackFrame.stackFrameSize)}
`
}

export function generateElseEnd(stackFrame: StackFrameState, chainLabel: Label){
    return `
    ${AArch64InstructionWrapper.deallocateStackMemory(stackFrame.stackFrameSize)}
${chainLabel.close}:
    `
}

export function generateIfChainEnd(stackFrame: StackFrameState, label: Label){
    return `
    ${label.close}:
    `
}


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

export function generateCondition(left: ASTNode, right: ASTNode, operator: string, targetLabel: string, stackFrame: StackFrameState, inverted: boolean = false){
    let condition = AArch64Utilities.getCondition(operator, inverted);

    const regs = stackFrame.getFreeTemporaryRegisters(2);

    const leftV = loadNodeToRegister(left, regs[0], stackFrame);
    const rightV = loadNodeToRegister(right, regs[1], stackFrame);

    return `
    ${leftV}
    ${rightV}
    CMP ${regs[0]}, ${regs[1]}
    ${condition} ${targetLabel}`
}