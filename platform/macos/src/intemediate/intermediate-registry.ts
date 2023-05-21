import { AnyPrimitiveType, PrimitiveType } from "../language/keywords/primitive-type"

type ValueLike = AnyPrimitiveType | InstructionFunctionCall | (string & { __is_variable: true }) | InstructionCondition

export type InstructionCondition = {
    type: 'cmp_equal' | 'cmp_not_equal' | 'cmp_greater' | 'cmp_less' | 'cmp_greater_equal' | 'less_equal',
    left: ValueLike,
    right: ValueLike
}

export type InstructionFunctionCall = {
    start: 'function_call',
    end: 'function_call_end',
    primitive: PrimitiveType,
    name: string,
    args: ValueLike[]
}

export type SingleIntermediateInstructionType = 
    | { type: 'header' }
    | { type: 'data_section' }
    | { type: 'dynamic', name: string, primitive: PrimitiveType, value: ValueLike }
    | { type: 'constant', name: string, primitive: PrimitiveType, value: ValueLike }
    | { type: 'assign', name: string, value: ValueLike }
    | { type: 'assign_add', name: string, value: ValueLike }
    | { type: 'assign_subtract', name: string, value: ValueLike }
    | { type: 'assign_multiply', name: string, value: ValueLike }
    | { type: 'assign_divide', name: string, value: ValueLike }
    | { type: 'assign_modulo', name: string, value: ValueLike }
    | { type: 'assert', value: ValueLike, condition: InstructionCondition }
    | { type: 'return', value?: ValueLike }
    

export type IntermediateInstructionCombineType = 
    { type: 'function_head', name: string, args: string[] }