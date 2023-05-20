import { ASTNode } from "../../parser/parser"
import { ArgumentRegisters, CallerSavedRegisters, Register } from "../code-generator/aarch64-registry"
import { generateAssignment, generateCondition, generateDataSection, generateElseEnd, generateElseStart, generateFunctionCall, generateFunctionDefinition, generateIfEnd, generateIfStart, generateProgram, generateVariableDeclaration, generateDoWhileLoopEnd, generateDoWhileLoopStart, createLabel, generateIfChainEnd, generateWhileLoopEnd, generateWhileLoopStart, generateUtilities, generateAssertStatement } from "../code-generator/code-generator"
import { generateBuiltinFunction, isBuiltinFunction } from "../code-generator/builtins"
import { DefinitionMarker, StackFrameDefinition, VariableDefinition, Function } from "./preparation"
import { M2StackBuilder } from "./stack-builder"
import { AArch64InstructionWrapper } from "../code-generator/aarch64-low-level"

type VariableBaseState = Omit<VariableDefinition, typeof DefinitionMarker> & {
    isArgument: boolean         // Whether the variable is a function argument.
    [DefinitionMarker]: false
}
type VariableStateRegister = VariableBaseState & {
    register: Register      // The register the variable is in. Can be undefined if the variable is exclusively on the stack.
    stackOffset?: undefined
    lastStackOffset?: number // The last stack offset the variable was in. This is used to keep track of the stack offset when the variable is moved back to the stack, to avoid fragmenting the stack.
    assigned: true          // Whether the variable has been assigned. This has no relation to the real state of the variable, it is only used to keep track of the state of the variable for compiler optimizations.
}
type VariableStateStack = VariableBaseState & {
    stackOffset: number     // The offset from the stack pointer. Can be undefined if the variable is exclusively in a register.
    register?: undefined    
    assigned: true
}
type VariableStateUnassigned = VariableBaseState & {
    stackOffset?: undefined // The variable is assigned and not used anymore.
    register?: undefined
    assigned: false
}
type VariableState = VariableStateRegister | VariableStateStack | VariableStateUnassigned
/**
 * The moving data of the stack frame.
 * This is used to keep track of the dynamic state of the stack frame.
 */
export class StackFrameState {
    public parent?: StackFrameState
    private children: StackFrameState[]
    private stackFrame: StackFrameDefinition
    public variables: VariableState[]
    public args: VariableState[]
    public stackPointer: number
    public stackFrameSize: number
    public globals: Set<string>

    // Stack frames are not always breaking frames. For example, an if statement is not a new scope, but a function is.
    private callerSavedRegisters: Register[]
    private temporaryRegisters: Register[][] = []

    public get globalState(): StackFrameState {
        if(!this.parent) return this;
        return this.parent.globalState;
    }

    constructor(stackFrame: StackFrameDefinition, parent: StackFrameState | undefined){
        this.stackFrame = stackFrame;
        this.parent = parent;
        this.variables = [];
        this.args = [];
        this.children = [];
        this.globals = new Set();
        this.callerSavedRegisters = [...CallerSavedRegisters].reverse()
        this.stackPointer = 0;
        this.stackFrameSize = stackFrame.stackFrameSize;
    }

    /**
     * Temporary registers are maintained within an instruction.
     */
    pushInstruction() {
        this.temporaryRegisters.push([]);
    }

    popInstruction() {
        this.temporaryRegisters.pop();
    }
 
    private moveVariableToStack(variable: VariableStateRegister): VariableStateStack {
        if(!variable.assigned) throw new Error(`Cannot move deleted variable ${variable.name} to stack.`)
        if(variable.stackOffset !== undefined) throw new Error(`Variable ${variable.name} is already on the stack.`)
        if(variable.register){
            if(variable.lastStackOffset){ // The variable was already on the stack, so we can just move it back.
                (variable as any).stackOffset = variable.lastStackOffset;
                variable.lastStackOffset = undefined;
                (variable as any).register = undefined;
                return variable as any as VariableStateStack;
            }
    
            // The variable was in a register, so we need to move it to the stack.
            (variable.stackOffset as any) = this.allocateStackMemory(variable.size);
            (variable as any).register = undefined;
        }
        return variable as any as VariableStateStack;
    }

    // TODO: This really shouldn't live here
    functionCalled(): string {
        let compiled = '';
        for(let variable of this.variables){
            if(variable.register){
                const register = variable.register;
                variable = this.moveVariableToStack(variable);
                compiled += `
                    ${AArch64InstructionWrapper.storeRegisterOnStack(register, variable.stackOffset)}
                `
            }
        }

        return compiled;
    }

    getRegisterForVariableOrThrow(variable: VariableDefinition): Register {
        const register = this.getRegisterForVariable(variable);
        if(register) return register;

        throw new Error(`The variable ${variable.name} is not active.`);
    }

    declareVariable(variable: VariableDefinition): VariableState {
        if(this.getVariable(variable.name)) throw new Error(`The variable ${variable.name} is already defined in this stack frame.`);

        const state: VariableState = {
            ...variable,
            assigned: false,
            isArgument: false,
            [DefinitionMarker]: false
        }
        this.variables.push(state)
        return state
    }

    declareArgument(variable: VariableDefinition): VariableState {
        if(this.getVariable(variable.name)) throw new Error(`The variable ${variable.name} is already defined in this stack frame.`);

        this.stackPointer += variable.size;
        const state: VariableState = {
            ...variable,
            assigned: false,
            isArgument: true,
            [DefinitionMarker]: false
        }
        this.args.push(state)
        return state
    }

    private findVariable(name: string): VariableState | undefined {
        const index = this.variables.findIndex(variableState => variableState.name === name);
        if(index === -1 && this.parent) return this.parent.findVariable(name);
        if(index === -1) return undefined;
        return this.variables[index];
    }

    getRegisterForVariable(variable: VariableDefinition): Register | undefined {
        const variableState = this.findVariable(variable.name);
        if(!variableState) throw new Error(`The variable ${variable.name} is not defined in this stack frame.`);
        if(variableState.register) return variableState.register;
        return undefined;
    }

    setVariableToRegister(variable: VariableState, register: Register): void {
        if(!CallerSavedRegisters.includes(register)) throw new Error(`The register ${register} is not a caller saved register.`);

        if(!this.isRegisterFree(register)) throw new Error(`The register ${register} is not free.`)
        
        const variableState = this.findVariable(variable.name);
        if(!variableState) throw new Error(`The variable ${variable.name} is not defined in this stack frame.`);
        if(variableState.assigned) variableState.register = register;
    }

    setVariableToFreeRegister(variable: VariableState) {
        const register = this.getFreeRegister();
        if(!register) throw new Error(`There are no free registers.`);

        this.setVariableToRegister(variable, register);
    }



    getFreeRegister(): Register | undefined {
        for(const register of this.callerSavedRegisters){
            if(this.isRegisterFree(register)){
                return register;
            }
        }
        return undefined;
    }

    getFreeRegisterStrict(): Register {
        const register = this.getFreeRegister();
        if(!register) throw new Error(`There are no free registers.`);
        return register;
    }
    getFreeRegisters(count: number = 1): Register[] {
        const registers: Register[] = []
        for(const register of this.callerSavedRegisters){
            if(this.isRegisterFree(register)){
                registers.push(register);
                if(registers.length === count) return registers;
            }
        }
        return registers;
    }
    getFreeRegistersStrict(count: number = 1): Register[] {
        const registers = this.getFreeRegisters(count);
        if(!registers || registers.length !== count) throw new Error(`There are not enough free registers.`);
        return registers;
    }

    getFreeArgumentRegisters(): Register[] {
        const registers: Register[] = []
        for(const register of ArgumentRegisters){
            if(!this.variables.some(variableState => variableState.register === register && !variableState.deleted)){
                registers.push(register);
            }
        }
        return registers;
    }

    getFreeTemporaryRegister(allowNoInstruction = false): Register {
        let register = this.getFreeRegister();
        if(!register) throw new Error(`There are no free registers.`);

        if(this.temporaryRegisters.length === 0 && !allowNoInstruction) throw new Error(`There is no instruction to allocate a temporary register for.`);
        if(!allowNoInstruction)
            this.temporaryRegisters[this.temporaryRegisters.length - 1].push(register);

        return register;
    }
    getFreeTemporaryRegisters(count: number): Register[] {
        const register = this.getFreeRegisters(count);        
        if(!register || register.length !== count) throw new Error(`There are no free registers.`);
        return register;
    }

    deleteVariable(variable: VariableDefinition): void {
        const variableState = this.findVariable(variable.name);
        if(!variableState) throw new Error(`The variable ${variable.name} is not defined in this stack frame.`);

        variableState.deleted = true;
        variableState.register = undefined;
    }

    isVariableDeleted(variable: VariableDefinition): boolean {
        const variableState = this.findVariable(variable.name);
        if(!variableState) throw new Error(`The variable ${variable.name} is not defined in this stack frame.`);

        return variableState.deleted;
    }

    isRegisterFree(register: Register): boolean {
        const selfAssign = this.variables.some(variableState => variableState.register === register && !variableState.deleted);

        if(!selfAssign){
            if(!this.temporaryRegisters.every(temporaryRegisters => !temporaryRegisters.includes(register))){
                return false;
            }
        }

        if(!selfAssign && this.parent) return this.parent.isRegisterFree(register);
        return !selfAssign;
    }

    /**
     * Loads the variable into a register or onto the stack.
     * 
     * If a register is specified, the variable will be loaded into that register or an error will be thrown if the register is not free.
     */
    loadVariable(variable: VariableState, register?: Register) {
        if(variable.register || variable.stackOffset !== undefined) return

        if(register){
            this.setVariableToRegister(variable, register);
            return;
        }
        
        const freeRegister = this.getFreeRegister();
        if(freeRegister){
            this.setVariableToRegister(variable, freeRegister);
        }else{
            variable.stackOffset = this.allocateStackMemory(variable.size);
        }
    }
    allocateStackMemory(size: number): number {
        const stackPointer = this.stackPointer;
        this.stackPointer += size;

        if(size != 0){
            for(const variable of this.variables){
                if(variable.stackOffset !== undefined){
                    variable.stackOffset += size;
                }
            }
        }

        return stackPointer;
    }
    deallocateStackMemory(size: number): number {
        const stackPointer = this.stackPointer;
        this.stackPointer -= size;

        if(size != 0){
            for(const variable of this.variables){
                if(variable.stackOffset !== undefined){
                    variable.stackOffset -= size;
                }
            }
        }

        return stackPointer;
    }

    getVariable(name: string): VariableState | undefined {
        let variable = this.findVariable(name);
        if(variable?.deleted) throw new Error(`The variable ${name} is deleted.`)
        if(variable) return variable;

        variable = this.parent?.getVariable(name);
        if(variable) return {
            ...variable,
            stackOffset: this.parent!.stackFrame.stackFrameSize + (variable.stackOffset ?? 0)
        };

        return undefined;
    }
    
    getVariableStrict(name: string): VariableState {
        const variable = this.getVariable(name);
        if(variable) return variable;

        throw new Error(`The variable ${name} is not defined.`)
    }

    getVariableDefinition(name: string): VariableDefinition | undefined {
        return this.stackFrame.getVariableDefinition(name);
    }
    
    getVariableDefinitionStrict(name: string): VariableDefinition {
        const variable = this.getVariableDefinition(name);
        if(variable) return variable;

        throw new Error(`The variable ${name} is not defined.`)
    }

    getFunction(name: string): {function: Function, stack: StackFrameState} | undefined {
        const def = this.stackFrame.getFunction(name);
        if(def) return {function: def, stack: this};
        if(this.parent) return this.parent.getFunction(name);
        return undefined;
    }

    getFunctionStrict(name: string): {function: Function, stack: StackFrameState} {
        const func = this.getFunction(name);
        if(func) return func;

        throw new Error(`The function ${name} is not defined.`)
    }
    get node(){
        return this.stackFrame.node;
    }

    getChildStackFrame(node: ASTNode): StackFrameState {
        const stack = this.children.find(child => child.stackFrame.node.id === node.id);
        if(stack) return stack;

        throw new Error(`The stack frame for the node ${node.id} is not defined.`)        
    }

    addStackFrame(stackFrame: StackFrameState): void {
        this.children.push(stackFrame);
    }

    addGlobal(global: string): void {
        if(this.parent) return this.parent.addGlobal(global);

        this.globals.add(global);
    }
}


export class M2Compiler {
    private stack!: StackFrameState

    constructor(private tree: ASTNode) {
        const stackBuilder = new M2StackBuilder(tree);
        this.stack = stackBuilder.stackStates;
    }

    compile() {
        const program = generateProgram(this.stack);
        
        let compiled = '';
        for(const child of this.stack.node.children){
            if(child.isFunctionDefinition || child.isMainFunction){
                compiled += this.compileScope(this.stack.getChildStackFrame(child), child);
            }
        }

        return program + compiled + generateUtilities() + generateDataSection(this.stack);
    }

    compileGlobals(stack: StackFrameState): string {
        let compiled = '';
        for(const child of stack.node.children){
            if(child.isVariableDefinition){
                compiled += generateVariableDeclaration(child, stack);
            }
        }
        
        return compiled;
    }

    compileControlFlow(node: ASTNode, stack: StackFrameState): string {
        let compiled = '';
        if(node.isDoWhileLoop){
            const doWhileLoopScope = stack.getChildStackFrame(node);
            const label = createLabel(node.id, 'do_while_loop');

            compiled += generateDoWhileLoopStart(doWhileLoopScope, label);
            
            for(const child of doWhileLoopScope.node.children){
                compiled += this.compileNode(child, doWhileLoopScope);
            }
            compiled += generateDoWhileLoopEnd(doWhileLoopScope, label, node.conditionNode.leftNode, node.conditionNode.rightNode, node.conditionNode.operatorValue);
        }
        else if(node.isWhileLoop){
            const whileLoopScope = stack.getChildStackFrame(node);
            const label = createLabel(node.id, 'while_loop');
            
            compiled += generateWhileLoopStart(whileLoopScope, label, node.conditionNode.leftNode, node.conditionNode.rightNode, node.conditionNode.operatorValue);
            
            for(const child of whileLoopScope.node.children){
                compiled += this.compileNode(child, whileLoopScope);
            }
            compiled += generateWhileLoopEnd(whileLoopScope, label);
        }
        else if(node.isIfStatement){
            const ifScope = stack.getChildStackFrame(node);
            const ifLabel = createLabel(node.id, 'if_statement');

            compiled += generateIfStart(ifScope, ifLabel, node.conditionNode.leftNode, node.conditionNode.rightNode, node.conditionNode.operatorValue);

            for(const child of ifScope.node.children){
                compiled += this.compileNode(child, ifScope);
            }
            if(node.isIfChain){
                const chainLabel = createLabel(node.getLastElseNode().id, 'if_chain');
                compiled += generateIfEnd(ifScope, ifLabel, chainLabel);
                compiled += this.compileControlFlow(node.elseNode, stack);
            }else{
                compiled += generateIfEnd(ifScope, ifLabel);
            }
        } else if(node.isElseStatement){
            const elseScope = stack.getChildStackFrame(node);
            const chainLabel = createLabel(node.getLastElseNode().id, 'if_chain');

            compiled += generateElseStart(elseScope);

            for(const child of elseScope.node.children){
                compiled += this.compileNode(child, elseScope);
            }

            compiled += generateElseEnd(elseScope, chainLabel);
        } else if(node.isAssertStatement){
            const asserLabel = createLabel(node.id, 'assert_statement');
            compiled += generateAssertStatement(node.conditionNode.leftNode, node.conditionNode.rightNode, node.conditionNode.operatorValue, asserLabel, stack);

        }

        return compiled;
    }

    compileNode(node: ASTNode, stack: StackFrameState): string {
        let compiled = '';

        if(node.isVariableDefinition){
            return generateVariableDeclaration(node, stack);
        }else if (node.isVariableAssignment){
            return generateAssignment(node, stack);
        } 
        if(node.isControlFlow){
            return this.compileControlFlow(node, stack);
        }
        else if(node.isFunctionCall){
            const func = stack.getFunction(node.functionCallName);

            if(func){
                if(func.function.arguments.length !== node.functionCallArguments.length) throw new Error(`The function ${node.functionCallName} expects ${func.function.arguments.length} arguments but ${node.functionCallArguments.length} were given.`)
                compiled += generateFunctionCall(node.functionCallName, node.functionCallArguments, stack);
            }else if(isBuiltinFunction(node.functionCallName)){
                compiled += generateBuiltinFunction(node.functionCallName, node.functionCallArguments, stack);
            }else {
                throw new Error(`The function ${node.functionCallName} is not defined.`)
            }
        }else if(node.isScoped){
            return this.compileScope(stack, node);
        }else{
            throw new Error(`The node ${node.toString()} is not implemented.`)
        }

        return compiled;   
    }

    compileScope(stack: StackFrameState, node: ASTNode): string {
        let compiled = '';

        if(!node.isScoped) throw new Error('The node is not scoped.')

        if(node.isMainFunction) {
            const definition = generateFunctionDefinition('main', [], stack);

            for(const child of node.children){
                compiled += this.compileNode(child, stack) + '\n';
            }

            return definition.start + compiled + definition.end;
        }else if(node.isFunctionDefinition){
            const func = stack.getFunction(node.functionDefinitionName);

            if(func){
                const definition = generateFunctionDefinition(func.function.name, func.function.arguments, stack);
                
                for(const child of node.children){
                    compiled += this.compileNode(child, stack) + '\n';
                }

                return definition.start + compiled + definition.end;
            }else{
                throw new Error(`The function ${node.functionDefinitionName} is not defined.`)
            }
        }

        console.warn('Compiling scope without function definition or main function.')        

        return compiled;
    }

}