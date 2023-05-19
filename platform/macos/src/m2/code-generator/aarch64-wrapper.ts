import { AArch64InstructionWrapper } from "./aarch64-low-level"
import { StackFrameState, VariableState } from "../compiler/m2-compiler"

export class AArch64Wrapper {
    static generateProgram(stack: StackFrameState){
        if(stack.stackFrameSize % 16 !== 0) throw new Error(`Program stack size should be 16-byte aligned ${stack.stackFrameSize}`)

        return `
    .global _start
    .align 4
    
    _start:
        ${AArch64InstructionWrapper.allocateStackMemory(stack.stackFrameSize)} ; Allocate stack frame
        ${AArch64InstructionWrapper.persistRegisters(stack.stackFrameSize - 16, ['X29', 'X30'], stack.stackFrameSize)} ; Persist the frame pointer and link register

        BL main                                              ; Call main function

        LDP X29, X30, [SP, #${stack.stackFrameSize - 16}]    ; Restore LR, FR, deallocate stack frame
        ADD SP, SP, #${stack.stackFrameSize}                 ; Deallocate stack frame
        MOV X0, #0                                           ; Set exit code
        RET
    `
    }

    static generateFunctionDefinitionStart(name: string, args: number, stack: StackFrameState){
        if(args > 8) {
            throw new Error(`The AArch64 architecture only supports 8 arguments. ${args} were requested. Stack arguments are not supported yet.`)
        }

        return `
            ${name}:
            ${AArch64InstructionWrapper.allocateStackMemory(stack.stackFrameSize)} ; Allocate stack frame
            ${AArch64InstructionWrapper.persistRegisters(stack.stackFrameSize - 16, ['X29', 'X30'], stack.stackFrameSize)} ; Persist the frame pointer and link register`
        
        // const registers = InternalUtilities.getRegisters(0, args - 1)
        // allocation += AArch64InstructionWrapper.persistRegisters(16, registers, stackFrameSize)
    }

    static generateFunctionDefinitionEnd(name: string, args: number, stack: StackFrameState, returnValue?: number){
        return `
            ${name}_end:
            ${returnValue !== undefined ? `MOV X0, #${returnValue} ; Set return value` : ''}
            ${AArch64InstructionWrapper.restoreRegisters(stack.stackFrameSize - 16, ['X29', 'X30'], stack.stackFrameSize)} ; Restore the frame pointer and link register
            ${AArch64InstructionWrapper.deallocateStackMemory(stack.stackFrameSize)} ; Deallocate stack frame
            RET`
    }

    static generateFunctionCall(name: string, args: (VariableState | number | string)[], stack: StackFrameState){
        if(args.length > 8) {
            throw new Error(`The AArch64 architecture only supports 8 arguments. ${args} were requested. Stack arguments are not supported yet.`)
        }

        const freeRegisters = stack.getFreeArgumentRegisters()
        if(freeRegisters.length < args.length) throw new Error(`Not enough registers available for function call ${name}. We don't support swapping registers for arguments yet.`)

        const registers = args.map((arg, index) => {
            if(typeof arg === 'number' || typeof arg === 'string'){
                return AArch64InstructionWrapper.storeLiteralInRegister(arg, freeRegisters[index])
            }

            if(arg.register)
                return AArch64InstructionWrapper.storeRegisterInRegister(arg.register, freeRegisters[index])
            if(arg.stackOffset)
                return AArch64InstructionWrapper.storeStackInRegister(arg.stackOffset, freeRegisters[index])
            throw new Error(`Invalid argument ${arg}`)
        })

        return `
            ${registers.join('\n')}
            BL ${name} ; Call function ${name}`
    }
}