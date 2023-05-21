export type PrimitiveType =
    'byte' |
    'short' |
    'int' |
    'long' |
    'float' |
    'double' |
    'char' |
    'bool' |
    'void'

export const PrimitiveTypes: { [key in PrimitiveType]: key } = {
    'byte': 'byte',
    'short': 'short',
    'int': 'int',
    'long': 'long',
    'float': 'float',
    'double': 'double',
    'char': 'char',
    'bool': 'bool',
    'void': 'void'
}

export type AnyPrimitiveType = number | string | boolean

export function isPrimitiveType(word: string): word is PrimitiveType {
    return word in PrimitiveTypes
}

export function toPrimitiveType(word: string): PrimitiveType {
    const result = PrimitiveTypes[word as PrimitiveType]
    if(!result){
        throw new Error('Invalid primitive type: ' + word)
    }

    return result
}



export type PRIMITIVE_TYPE_KEYWORDS = PrimitiveType
export const PRIMITIVE_TYPE_KEYWORDS = PrimitiveTypes