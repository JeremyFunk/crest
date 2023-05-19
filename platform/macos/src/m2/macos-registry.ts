import { ASTNode } from "../parser/parser"
import { loadVariable } from "./code-generator"
import { StackFrame, Variable } from "./m2-compiler"

export const DataRegistry = [
    'printFormat1Long: .asciz "%ld\\n"',
    'printFormat1Int: .asciz "%d\\n"'
]

export interface IntegratedFunction {
    name: INTEGRATED_FUNCTION
    variableArguments: boolean
    arguments: {
        name: string
        type: string
    }[]
    compile(args: ASTNode[], stackFrame: StackFrame): string
    returnType?: string
}

export type INTEGRATED_FUNCTION = 
    'print'

function buildParameter(node: ASTNode, variable: Variable, argPos: number, offset: number): string {
    if(node.isValueLiteral){
        return  `
    LDR X${argPos}, [SP, ${variable.offset}]
    STR X${argPos}, [SP, #${offset}]
`
    }else if(node.isIdentifierVariable){
        return `
    LDR X${argPos}, [SP, #${variable.offset}]
    STR X${argPos}, [SP, #${offset}]
`
    }

    throw new Error(`The variable ${node.toString()} is not supported.`)
}

function compilePrint(args: ASTNode[], stackFrame: StackFrame){
    let offset = 0;
    return `
    ${args.map((arg, i) => {
        const variable = stackFrame.getVariableStrict(arg.identifierVariableName);
        const params = buildParameter(arg, variable, i + 1, offset);

        offset += variable.size;

        return params;
    }).join('\n')}

    ADRP X0, printFormat1Long@PAGE // printf format str
    ADD X0, X0, printFormat1Long@PAGEOFF

    BL _printf
`
}

export const INTEGRATED_FUNCTIONS: IntegratedFunction[] = [
    {
        name: 'print',
        variableArguments: true,
        arguments: [],
        compile: compilePrint
    }
]

export function isIntegratedFunction(name: string): name is INTEGRATED_FUNCTION {
    return INTEGRATED_FUNCTIONS.some(func => func.name === name)
}

export function generateIntegratedFunction(name: INTEGRATED_FUNCTION, args: ASTNode[], stackFrame: StackFrame): string {
    const func = INTEGRATED_FUNCTIONS.find(func => func.name === name);
    if(!func) throw new Error(`The integrated function ${name} is not defined.`)

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