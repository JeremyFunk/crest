import { ASTNode } from "../../../parser/parser"
import { generateAssignment, generateCondition, generateExecutionStart, generateFunctionCall, generateFunctionDefinitionEnd, generateFunctionDefinitionStart, generateProgramEnd, generateProgramStart, generateVariableDeclaration, generateWhileLoopEnd, generateWhileLoopStart } from "./code-generator"
import { generateIntegratedFunction, getVariableSize, isIntegratedFunction } from "./macos-registry"

export interface Variable {
    name: string
    type: string
    size: number
    offset: number
    value?: ASTNode
}

export interface Function {
    name: string
    arguments: {
        name: string
        type: string
    }[]
}

function getAlignedSize(size: number){
    if(size === 0) return 0;

    return size + 16 - (size % 16);
}
type VariableData = Omit<Variable, 'offset' | 'size'>;
export class StackFrameBuilder{
    private arguments: VariableData[]
    private variables: VariableData[]
    private functions: Function[]
    private children: StackFrameBuilder[]
    private parent?: StackFrameBuilder

    public node: ASTNode

    constructor(node: ASTNode, parent?: StackFrameBuilder){
        this.node = node;
        this.arguments = [];
        this.variables = [];
        this.functions = [];
        this.children = [];
        this.parent = parent;
    }

    pushVariable(variable: VariableData){
        this.variables.push(variable);
    }

    pushArgument(argument: VariableData){
        this.arguments.push(argument);
    }

    pushFunction(func: Function): void {
        this.functions.push(func);
    }

    pushChild(child: StackFrameBuilder){
        this.children.push(child);
    }

    build(): StackFrame{
        const stackFrame = new StackFrame({
            node: this.node,
            children: this.children.map(child => child.build()),
            variables: this.variables,
            _arguments: this.arguments,
            functions: this.functions,
        });

        return stackFrame;
    }
}

export class StackFrame {
    private parent?: StackFrame
    private children: StackFrame[]
    public node: ASTNode
    private argumentsSize: number
    private variablesSize: number

    get stackFrameSize(){
        const result = this.argumentsSize + this.variablesSize;
        return result < 16 ? 16 : result;
    }

    private _variables: Variable[]
    private _arguments: Variable[]
    private functions: Function[]
    
    constructor({ node, children, variables, _arguments, functions, parent }: { node: ASTNode; children: StackFrame[]; variables: VariableData[]; _arguments: VariableData[]; functions: Function[]; parent?: StackFrame }){
        this.children = children;
        this.node = node;
        this.parent = parent;
        this.functions = functions;
        this.argumentsSize = 0;
        this.variablesSize = 0;
        this._variables = [];
        this._arguments = [];

        for(const variable of variables){
            this.variablesSize += getVariableSize(variable.type);
        }
        this.variablesSize = getAlignedSize(this.variablesSize);

        for(const argument of _arguments){
            this.argumentsSize += getVariableSize(argument.type);
        }
        this.argumentsSize = getAlignedSize(this.argumentsSize);

        let offset = 0
        for(const variable of variables){
            const size = getVariableSize(variable.type);
            this._variables.push({
                ...variable,
                offset,
                size
            })
            offset += size;
        }

        offset = this.variablesSize;
        for(const argument of _arguments){
            const size = getVariableSize(argument.type);
            this._arguments.push({
                ...argument,
                offset,
                size
            })
            offset += size;
        }

        for(const c of children){
            c.parent = this;
        }
    }

    getChildrenScope(node: ASTNode): StackFrame {
        for(const child of this.children){
            if(child.node.id === node.id){
                return child;
            }
        }
        throw new Error(`The node ${node} is not a child of ${this.node}`);
    }

    getFunction(name: string): Function | undefined {
        const func = this.functions.find(func => func.name === name);
        if(func) return func;
        return this.parent?.getFunction(name);
    }

    getVariable(name: string): Variable | undefined {
        let variable = this._variables.find(variable => variable.name === name) || this._arguments.find(variable => variable.name === name);
        if(variable) return variable;

        variable = this.parent?.getVariable(name);
        if(variable) return {
            ...variable,
            offset: variable.offset + this.parent!.stackFrameSize
        };

        return undefined;
    }
    
    getVariableStrict(name: string): Variable {
        let variable = this._variables.find(variable => variable.name === name) || this._arguments.find(variable => variable.name === name);
        if(variable) return variable;

        variable = this.parent?.getVariable(name);
        if(variable) return {
            ...variable,
            offset: variable.offset + this.parent!.stackFrameSize
        };

        throw new Error(`The variable ${name} is not defined.`)
    }
}

class M2StackBuilder {
    private stackBuilder!: StackFrameBuilder
    public stack!: StackFrame

    constructor(private tree: ASTNode) {
        const mainFunction = tree.children.find(child => child.isMainFunction)
        if(!mainFunction) throw new Error('The main function is not defined.')

        this.constructStack();

        this.stack = this.stackBuilder.build();
    }

    constructStack(): void {
        this.stackBuilder = this.prepareScope(this.tree);
        this.buildGlobalData(this.tree, this.stackBuilder);
        this.buildGlobalFunctions(this.tree, this.stackBuilder);
    }

    buildScope(stack: StackFrameBuilder): void {
        for(const child of stack.node.children){
            if(child.isVariableDefinition){
                stack.pushVariable({
                    name: child.variableDefinitionName,
                    type: child.variableDefinitionType,
                    value: child.variableDefinitionValue,
                });
            }else if(child.isWhileLoop){
                const whileLoopScope = this.prepareScope(child, stack);
                this.buildScope(whileLoopScope);
            }
        }
    }

    buildGlobalFunctions(node: ASTNode, stack: StackFrameBuilder) {
        if(!node.isScoped) throw new Error('The node is not scoped.')

        if(!node.isExecutionOrderInsentive) throw new Error('The node is not execution order insentive.')

        for(const child of node.children){
            if(child.isFunctionDefinition || child.isMainFunction){
                const functionScope = this.prepareScope(child, stack);
                this.buildScope(functionScope);
            }
        }
    }

    prepareScope(node: ASTNode, parent?: StackFrameBuilder): StackFrameBuilder {
        const scope = new StackFrameBuilder(node, parent);
        parent?.pushChild(scope);

        if(node.isFunctionDefinition || node.isMainFunction){
            for(const arg of node.functionDefinitionArguments){
                scope.pushArgument({
                    name: arg.variableDefinitionName,
                    type: arg.variableDefinitionType
                })
            }
        }

        return scope;
    }


    buildGlobalData(node: ASTNode, stack: StackFrameBuilder) {
        if(!node.isScoped) throw new Error('The node is not scoped.')

        for(const child of node.children){
            if(child.isVariableDefinition){
                stack.pushVariable({
                    name: child.variableDefinitionName,
                    type: child.variableDefinitionType,
                    value: child.variableDefinitionValue,
                })
            }else if(child.isFunctionDefinition){
                const args = child.functionDefinitionArguments.map(arg => ({
                    name: arg.variableDefinitionName,
                    type: arg.variableDefinitionType
                }))

                stack.pushFunction({
                    name: child.functionDefinitionName,
                    arguments: args
                })
                
                const functionScope = this.prepareScope(child, stack);

                this.buildScope(functionScope);
            }
        }
    }
}

export class M2Compiler {
    private stack!: StackFrame

    constructor(private tree: ASTNode) {
        const stackBuilder = new M2StackBuilder(tree);
        this.stack = stackBuilder.stack;
    }

    compile() {
        let compiled = generateProgramStart(this.stack);

        compiled += this.compileGlobals(this.stack);

        compiled += generateExecutionStart(this.stack);
        

        for(const child of this.stack.node.children){
            if(child.isFunctionDefinition || child.isMainFunction){
                compiled += this.compileScope(this.stack.getChildrenScope(child), child);
            }
        }


        compiled += generateProgramEnd();

        return compiled;
    }

    compileGlobals(stack: StackFrame): string {
        let compiled = '';
        for(const child of stack.node.children){
            if(child.isVariableDefinition){
                compiled += generateVariableDeclaration(child, stack);
            }
        }
        
        return compiled;
    }

    compileNode(node: ASTNode, stack: StackFrame): string {
        let compiled = '';


        if(node.isVariableDefinition){
            return generateVariableDeclaration(node, stack);
        }else if (node.isVariableAssignment){
            return generateAssignment(node, stack);
        } if(node.isWhileLoop){
            const whileLoopScope = stack.getChildrenScope(node);

            compiled += generateWhileLoopStart(whileLoopScope);
            
            for(const child of whileLoopScope.node.children){
                compiled += this.compileNode(child, whileLoopScope);
            }
            compiled += generateCondition(node.conditionNode.leftNode, node.conditionNode.rightNode, node.conditionNode.operatorValue, 'loop', whileLoopScope);
            compiled += generateWhileLoopEnd(whileLoopScope);
        }else if(node.isFunctionCall){
            const func = stack.getFunction(node.functionCallName);

            if(func){
                if(func.arguments.length !== node.functionCallArguments.length) throw new Error(`The function ${node.functionCallName} expects ${func.arguments.length} arguments but ${node.functionCallArguments.length} were given.`)
                compiled += generateFunctionCall(node.functionCallName, node.functionCallArguments, stack);
            }else if(isIntegratedFunction(node.functionCallName)){
                compiled += generateIntegratedFunction(node.functionCallName, node.functionCallArguments, stack);
            }else {
                throw new Error(`The function ${node.functionCallName} is not defined.`)
            }
        }else if(node.isFunctionDefinition ){
            const func = stack.getFunction(node.functionDefinitionName);

            if(func){
                compiled += generateFunctionDefinitionStart(func.name, node.functionDefinitionArguments, stack);
            }else{
                throw new Error(`The function ${node.functionDefinitionName} is not defined.`)
            }
        }else if(node.isScoped){
            return this.compileScope(stack, node);
        }else{
            throw new Error(`The node ${node.toString()} is not implemented.`)
        }

        return compiled;   
    }

    compileScope(stack: StackFrame, node: ASTNode): string {
        let compiled = '';

        if(!node.isScoped) throw new Error('The node is not scoped.')

        if(node.isMainFunction) {
            compiled += generateFunctionDefinitionStart('main', [], stack);

            for(const child of node.children){
                compiled += this.compileNode(child, stack);
            }

            compiled += generateFunctionDefinitionEnd(stack);
        }else if(node.isFunctionDefinition){
            const func = stack.getFunction(node.functionDefinitionName);

            if(func){
                compiled += generateFunctionDefinitionStart(func.name, node.functionDefinitionArguments, stack);
                
                for(const child of node.children){
                    compiled += this.compileNode(child, stack);
                }

                compiled += generateFunctionDefinitionEnd(stack);
            }else{
                throw new Error(`The function ${node.functionDefinitionName} is not defined.`)
            }
        }

        

        return compiled;
    }

}