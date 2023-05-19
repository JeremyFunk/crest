import { ASTNode } from "../../parser/parser";
import { getVariableSize } from "../code-generator/builtins";

export const DefinitionMarker = Symbol('definition');
export interface VariableDefinition {
    name: string
    type: string
    size: number
    value?: ASTNode
    [DefinitionMarker]: true
}
export interface FunctionArgumentDefinition{
    name: string
    type: string
}
export interface Function {
    name: string
    arguments: FunctionArgumentDefinition[]
}


function getAlignedSize(size: number){
    if(size === 0) return 0;

    return size + 16 - (size % 16);
}


type VariableData = Omit<VariableDefinition, 'offset' | 'size' | typeof DefinitionMarker>;
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

    build(): StackFrameDefinition{
        
        const stackFrame = new StackFrameDefinition({
            node: this.node,
            children: this.children.map(child => child.build()),
            variables: this.variables,
            _arguments: this.arguments,
            functions: this.functions,
        });

        return stackFrame;
    }
}

export class StackFrameDefinition {
    private parent?: StackFrameDefinition

    public node: ASTNode
    public children: StackFrameDefinition[]

    // The size of arguments in bytes.
    private argumentsSize: number
    // The size of variables in bytes.
    private variablesSize: number

    get stackFrameSize(){
        const result = this.argumentsSize + this.variablesSize;
        return result < 16 ? 16 : result;
    }

    // All variables, arguments and functions this frame has access to.
    private _variables: VariableDefinition[]
    private _arguments: VariableDefinition[]
    private functions: Function[]
    
    constructor({ node, children, variables, _arguments, functions, parent }: { node: ASTNode; children: StackFrameDefinition[]; variables: VariableData[]; _arguments: VariableData[]; functions: Function[]; parent?: StackFrameDefinition }){
        this.node = node;
        this.parent = parent;
        this.functions = functions;
        this.argumentsSize = 0;
        this.variablesSize = 0;
        this._variables = [];
        this._arguments = [];
        this.children = children;

        for(const variable of variables){
            this.variablesSize += getVariableSize(variable.type);
        }
        this.variablesSize = getAlignedSize(this.variablesSize);

        for(const argument of _arguments){
            this.argumentsSize += getVariableSize(argument.type);
        }
        this.argumentsSize = getAlignedSize(this.argumentsSize);

        for(const variable of variables){
            const size = getVariableSize(variable.type);
            this._variables.push({
                ...variable,
                size,
                [DefinitionMarker]: true,
            })
        }

        for(const argument of _arguments){
            const size = getVariableSize(argument.type);
            this._arguments.push({
                ...argument,
                size,
                [DefinitionMarker]: true,
            })
        }

        for(const c of children){
            c.parent = this;
        }
    }

    getFunction(name: string): Function | undefined {
        const func = this.functions.find(func => func.name === name);
        if(func) return func;
        return this.parent?.getFunction(name);
    }

    getVariableDefinition(name: string): VariableDefinition | undefined {
        let variable = this._variables.find(variable => variable.name === name) ?? this._arguments.find(variable => variable.name === name);
        if(variable) return variable;

        variable = this.parent?.getVariableDefinition(name);
        if(variable) return variable;

        return undefined;
    }
    
    getVariableDefinitionStrict(name: string): VariableDefinition {
        const variable = this.getVariableDefinition(name);
        if(variable) return variable;

        throw new Error(`The variable ${name} is not defined.`)
    }

}
