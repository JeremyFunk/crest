import { ASTNode } from "../../parser/parser";
import { StackFrameState } from "./m2-compiler";
import { StackFrameBuilder, StackFrameDefinition } from "./preparation";

export class M2StackBuilder {
    private stackBuilder!: StackFrameBuilder
    // public stack!: StackFrameDefinition
    public stackStates!: StackFrameState

    constructor(private tree: ASTNode) {
        const mainFunction = tree.children.find(child => child.isMainFunction)
        if(!mainFunction) throw new Error('The main function is not defined.')

        this.constructStack();

        const stack = this.stackBuilder.build();
        this.stackStates = this.assembleStackState(stack);

    }

    private assembleStackState(stack: StackFrameDefinition, parent?: StackFrameState): StackFrameState {
        const stackFrame = new StackFrameState(stack, parent);

        if(parent){
            parent.addStackFrame(stackFrame);
        }

        for(const child of stack.children){
            this.assembleStackState(child, stackFrame);
        }

        return stackFrame;
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
