
export type Register = 
    | 'X0'
    | 'X1'
    | 'X2'
    | 'X3'
    | 'X4'
    | 'X5'
    | 'X6'
    | 'X7'
    | 'X8'
    | 'X9'
    | 'X10'
    | 'X11'
    | 'X12'
    | 'X13'
    | 'X14'
    | 'X15'
    | 'X16'
    | 'X17'
    | 'X18'
    | 'X19'
    | 'X20'
    | 'X21'
    | 'X22'
    | 'X23'
    | 'X24'
    | 'X25'
    | 'X26'
    | 'X27'
    | 'X28'
    | 'X29'
    | 'X30'

export class AArch64Utilities {
    static getRegisters(start: number, end: number){
        const registers: Register[] = []

        for(let i = start; i <= end; i++){
            registers.push(`X${i}` as Register)
        }

        return registers
    }

    static getOperator(operator: string){
        switch(operator){
            case '+=':
                return 'ADD';
            case '-=':
                return 'SUB';
            case '*=':
                return 'MUL';
            case '/=':
                return 'DIV';
            case '%=':
                return 'MOD';
            default:
                throw new Error(`The operator ${operator} is not supported.`)
        }
    }

    static getCondition(operator: string, inverted: boolean = false){
        if(inverted){
            switch(operator){
                case '==':
                    return 'BNE';
                case '!=':
                    return 'BEQ';
                case '>':
                    return 'BLE';
                case '<':
                    return 'BGE';
                case '>=':
                    return 'BLT';
                case '<=':
                    return 'BGT';
                default:
                    throw new Error(`The operator ${operator} is not supported.`)
            }
        }

        switch(operator){
            case '==':
                return 'BEQ';
            case '!=':
                return 'BNE';
            case '>':
                return 'BGT';
            case '<':
                return 'BLT';
            case '>=':
                return 'BGE';
            case '<=':
                return 'BLE';
            default:
                throw new Error(`The operator ${operator} is not supported.`)
        }
    }
}


export const Registers = AArch64Utilities.getRegisters(0, 28);
export const ArgumentRegisters = AArch64Utilities.getRegisters(0, 7);
export const CalleeSavedRegisters = AArch64Utilities.getRegisters(19, 28);
export const CallerSavedRegisters = AArch64Utilities.getRegisters(0, 18);

