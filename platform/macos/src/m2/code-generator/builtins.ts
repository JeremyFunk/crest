import { ASTNode } from "../../parser/parser"
import { StackFrameState, VariableState } from "../compiler/m2-compiler"
import { AArch64InstructionWrapper } from "./aarch64-low-level"
import { Register } from "./aarch64-registry"

export const DataRegistry: string[] = [
]

export interface BuiltinFunction {
    name: BUILTIN_FUNCTION
    variableArguments: boolean
    arguments: {
        name: string
        type: string
    }[]
    compile(args: ASTNode[], stackFrame: StackFrameState): string
    getStackFrameRequirements(args: number): number
    returnType?: string
}

export type BUILTIN_FUNCTION = 
    'print'

function buildParameter(node: ASTNode, argPos: number, stackFrame: StackFrameState): string {
    if(node.isValueLiteral){
        return AArch64InstructionWrapper.loadLiteralInRegister(node.valueLiteralValue, `X${argPos}` as Register);
    }else if(node.isIdentifierVariable){
        const variable = stackFrame.getVariableStrict(node.identifierVariableName);
        if(variable.register)
            return AArch64InstructionWrapper.loadRegisterInRegister(variable.register, `X${argPos}` as Register)
        if(variable.stackOffset !== undefined)
            return AArch64InstructionWrapper.loadStackToRegister(variable.stackOffset, `X${argPos}` as Register);
    }

    throw new Error(`The variable ${node.toString()} is not supported.`)
}

// Functions like printf (so variadic functions), are implemented by storing the arguments on the stack, not in registers. Only the format pointer is stored in a register.
function buildVariadicStackOnly(node: ASTNode, argPos: number, stackFrame: StackFrameState): string {
    if(node.isValueLiteral){
        return AArch64InstructionWrapper.storeLiteralOnStack(node.valueLiteralValue, argPos * 8, stackFrame.getFreeTemporaryRegister());
    }else if(node.isIdentifierVariable){
        const variable = stackFrame.getVariableStrict(node.identifierVariableName);
        if(variable.register)
            return AArch64InstructionWrapper.storeRegisterOnStack(variable.register, argPos * 8)
        if(variable.stackOffset !== undefined)
            return AArch64InstructionWrapper.storeStackOnStack(variable.stackOffset, argPos * 8, stackFrame.getFreeTemporaryRegister());
    }

    throw new Error(`The variable ${node.toString()} is not supported.`)
}

// TODO: Optimize with multiple arguments with same instruction
function compilePrint(args: ASTNode[], stackFrame: StackFrameState){
    const formatName = `printFormat${args.length}Long`
    stackFrame.addGlobal(
        `${formatName}: .asciz "${args.map(arg => '%ld').join(' ')}\\n"`
    )

    return `
    ADRP X0, ${formatName}@PAGE
    ADD X0, X0, ${formatName}@PAGEOFF
    ${args.map((arg, i) => 
        buildVariadicStackOnly(arg, i, stackFrame)
    ).join('\n')}
    
    BL _printf`
}

export const BUILTINFUNCTIONS: BuiltinFunction[] = [
    {
        name: 'print',
        variableArguments: true,
        arguments: [],
        compile: compilePrint,
        getStackFrameRequirements: args => args * 8,
    }
]

export function isBuiltinFunction(name: string): name is BUILTIN_FUNCTION {
    return BUILTINFUNCTIONS.some(func => func.name === name)
}

export function getBuiltinCallStackRequirements(name: string, args: number): number {
    const func = BUILTINFUNCTIONS.find(func => func.name === name);
    if(!func) throw new Error(`The Builtin function ${name} is not defined.`)

    return func.getStackFrameRequirements(args);
}

export function generateBuiltinFunction(name: BUILTIN_FUNCTION, args: ASTNode[], stackFrame: StackFrameState): string {
    const func = BUILTINFUNCTIONS.find(func => func.name === name);
    if(!func) throw new Error(`The Builtin function ${name} is not defined.`)

    return func.compile(args, stackFrame);
}

export function getVariableSize(type: string){
    switch(type){
        case 'int':
            return 8;
        case 'long':
            return 8;
        default:
            throw new Error(`The type ${type} is not supported.`)
    }
}