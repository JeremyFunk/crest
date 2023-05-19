import { ASTNode } from "../../parser/parser"
import { StackFrameState, VariableState } from "../compiler/m2-compiler"
import { AArch64InstructionWrapper } from "./aarch64-low-level"

export const DataRegistry = [
    'printFormat1Long: .asciz "%ld\\n"',
    'printFormat1Int: .asciz "%d\\n"'
]

export interface BuiltinFunction {
    name: BUILTIN_FUNCTION
    variableArguments: boolean
    arguments: {
        name: string
        type: string
    }[]
    compile(args: ASTNode[], stackFrame: StackFrameState): string
    returnType?: string
}

export type BUILTIN_FUNCTION = 
    'print'

function buildParameter(node: ASTNode, argPos: number, stackFrame: StackFrameState): string {
    if(node.isValueLiteral){
        return AArch64InstructionWrapper.storeLiteralInRegister(node.valueLiteralValue, `X${argPos}` as any);
    }else if(node.isIdentifierVariable){
        const variable = stackFrame.getVariableStrict(node.identifierVariableName);
        if(variable.register)
            return AArch64InstructionWrapper.storeRegisterInRegister(variable.register, `X${argPos}` as any)
        if(variable.stackOffset !== undefined)
            return AArch64InstructionWrapper.storeStackInRegister(variable.stackOffset, `X${argPos}` as any);
    }

    throw new Error(`The variable ${node.toString()} is not supported.`)
}

// Functions like printf (so variadic functions), are implemented by storing the arguments on the stack, not in registers. Only the format pointer is stored in a register.
// function buildVariadicStackOnly(node: ASTNode, argPos: number, stackFrame: StackFrameState): string {
//     if(node.isValueLiteral){
//         return AArch64InstructionWrapper.storeLiteralInRegister(node.valueLiteralValue, `X${argPos}` as any);
//     }else if(node.isIdentifierVariable){
//         const variable = stackFrame.getVariableStrict(node.identifierVariableName);
//         if(variable.register)
//             return AArch64InstructionWrapper.storeRegisterInRegister(variable.register, `X${argPos}` as any)
//         if(variable.stackOffset !== undefined)
//             return AArch64InstructionWrapper.storeStackInRegister(variable.stackOffset, `X${argPos}` as any);
//     }

//     throw new Error(`The variable ${node.toString()} is not supported.`)
// }

// TODO: Optimize with multiple arguments with same instruction
function compilePrint(args: ASTNode[], stackFrame: StackFrameState){
    return `

    ADRP X0, printFormat1Long@PAGE ; printf format str
    ADD X0, X0, printFormat1Long@PAGEOFF
    ${args.map((arg, i) => 
        buildParameter(arg, i + 1, stackFrame)
    ).join('\n')}
    
    BL _printf
`
}

export const BUILTINFUNCTIONS: BuiltinFunction[] = [
    {
        name: 'print',
        variableArguments: true,
        arguments: [],
        compile: compilePrint
    }
]

export function isBuiltinFunction(name: string): name is BUILTIN_FUNCTION {
    return BUILTINFUNCTIONS.some(func => func.name === name)
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