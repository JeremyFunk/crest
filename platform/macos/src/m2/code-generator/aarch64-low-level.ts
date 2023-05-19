import { Register } from "./aarch64-registry"

export class AArch64InstructionWrapper {
    static allocateStackMemory(offset: number){
        if(offset % 16 !== 0) throw new Error(`Stack allocations should only be performed with 16-byte aligned pointers ${offset}`)

        return `
            SUB SP, SP, #${offset} ; Allocate stack memory`
    }

    static deallocateStackMemory(offset: number){
        if(offset % 16 !== 0) throw new Error(`Stack allocations should only be performed with 16-byte aligned pointers ${offset}`)

        return `
            ADD SP, SP, #${offset} ; Deallocate stack memory`
    }

    /**
     * Persists the given registers on the stack.
     */
    static persistRegisters(offset: number, registers: Register[], stackFrameSize: number): string{
        if(registers.length * 8 >  stackFrameSize) throw new Error(`Stackoverflow detected. The stack frame size is ${stackFrameSize}, but ${registers.length * 8} were requested to store.`)

        if(offset % 16 !== 0) throw new Error(`Stack allocations should only be performed with 16-byte aligned pointers ${offset}`)

        if(registers.length === 0) return ''
        if(registers.length === 1) {
            console.warn(`Persisting a single register ${registers[0]} is slow. Using STP instead, whenever possible.`)

            return `STR ${registers[0]}, [SP, #${offset}] ; Persist register ${registers[0]}`
        }

        const twoRegisters =
            `STP ${registers[0]}, ${registers[1]}, [SP, #${offset}] ; Persist registers ${registers[0]} and ${registers[1]}`

        if(registers.length === 2) {
            return twoRegisters
        }

        return twoRegisters + AArch64InstructionWrapper.persistRegisters(offset + 16, registers.slice(2), stackFrameSize)
    }

    /**
     * Restores the given registers from the stack.
     */
    static restoreRegisters(offset: number, registers: Register[], stackFrameSize: number): string{
        if(offset % 16 !== 0) throw new Error(`Stack deallocations should only be performed with 16-byte aligned pointers ${offset}`)

        if(registers.length === 0) return ''

        if(registers.length === 1) {
            console.warn(`Restoring a single register ${registers[0]} is slow. Using LDP instead, whenever possible.`)

            return `LDR ${registers[0]}, [SP, #${offset}] ; Restore register ${registers[0]}`
        }

        const twoRegisters = `LDP ${registers[0]}, ${registers[1]}, [SP, #${offset}] ; Restore registers ${registers[0]} and ${registers[1]}`

        if(registers.length === 2) {
            return twoRegisters
        }

        return `${twoRegisters}
                ${AArch64InstructionWrapper.restoreRegisters(offset + 16, registers.slice(2), stackFrameSize)}`
    }


    static storeStackInRegister(offset: number, register: Register){
        return `
            LDR ${register}, [SP, #${offset}] ; Load variable ${register} from stack`
    }

    static storeStackOnStack(offset: number, destinationOffset: number, freeTempRegister: Register){
        if(offset % 16 !== 0) throw new Error(`Stack allocations should only be performed with 16-byte aligned pointers ${offset}`)

        return `
            LDR ${freeTempRegister}, [SP, #${offset}] ; Load variable from stack
            STR ${freeTempRegister}, [SP, #${destinationOffset}] ; Store variable on stack`
    }

    static storeRegisterInRegister(source: Register, destination: Register){
        return `
            MOV ${destination}, ${source} ; Store register ${source} in register ${destination}`
    }
    
    static storeRegisterOnStack(register: Register, offset: number){
        if(offset % 16 !== 0) throw new Error(`Stack allocations should only be performed with 16-byte aligned pointers ${offset}`)

        return `
            STR ${register}, [SP, #${offset}] ; Store register ${register} on stack`
    }

    static storeLiteralOnStack(literal: number | string, offset: number, freeTempRegister: Register){
        return `
            MOV ${freeTempRegister}, #${literal} ; Load literal ${literal} into register ${freeTempRegister}
            STR ${freeTempRegister}, [SP, #${offset}] ; Store literal ${literal} on stack`
    }

    static storeLiteralInRegister(literal: number | string, register: Register){
        return `
            MOV ${register}, #${literal} ; Store literal ${literal} in register ${register}`
    }
}
