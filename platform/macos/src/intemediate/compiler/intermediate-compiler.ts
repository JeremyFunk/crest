import { Scope, buildGlobals } from "./scopes";
import { ASTNode, ASTRoot } from "../../parser/parser";
import { getAssertStatement, getPseudoDoWhileLoopEnd, getPseudoDoWhileLoopStart, getPseudoElseIfStatementEnd, getPseudoElseIfStatementStart, getPseudoElseStatementEnd, getPseudoElseStatementStart, getPseudoFunctionCall, getPseudoFunctionCallMain, getPseudoFunctionEnd, getPseudoFunctionHead, getPseudoIfStatementEnd, getPseudoIfStatementStart, getPseudoMeta, getPseudoVariableAssignment, getPseudoVariableDefinition, getReturnStatement } from "./pseudo-asm";

export class IntermediateCompiler {
    private instructions: string[] = [];
    constructor(private ast: ASTRoot) {
        buildGlobals(ast);
        Scope.pushFullScope(0, 'root');
    }
    compile() {
        this.compileRoot(this.ast);
        return this.instructions.join("\n");
    }

    private compileRoot(node: ASTRoot) {
        this.instructions.push(getPseudoMeta("header"));
        this.instructions.push(getPseudoMeta("program_start"));
        this.instructions.push(getPseudoFunctionCallMain());
        this.instructions.push(getPseudoMeta("program_end"));

        this.compileScope(Scope.main!)

        for(let scope of Scope.globalFunctions) {
            this.compileScope(scope);
        }

        this.instructions.push(getPseudoMeta("data_section"));
        for(let scope of Scope.globalVariables) {
            this.instructions.push(getPseudoVariableDefinition(scope));
        }
    }

    private compileScope(node: ASTNode) {
        if(node.nodeType === "function_definition") {
            this.instructions.push(getPseudoFunctionHead(node));
            
            for(let child of node.body) {
                this.compileNode(child);
            }

            this.instructions.push(getPseudoFunctionEnd(node));
        }
    }


    private compileNode(node: ASTNode) {
        if(node.nodeType === "function_call") {
            this.instructions.push(getPseudoFunctionCall(node));
        }else if(node.nodeType === "variable_definition") {
            this.instructions.push(getPseudoVariableDefinition(node));
        }else if(node.nodeType === "do_while_statement") {
            this.instructions.push(getPseudoDoWhileLoopStart(node));

            for(let child of node.body) {
                this.compileNode(child);
            }

            this.instructions.push(getPseudoDoWhileLoopEnd(node));
        }else if(node.nodeType === "while_statement") {
            this.instructions.push(getPseudoDoWhileLoopStart(node));

            for(let child of node.body) {
                this.compileNode(child);
            }

            this.instructions.push(getPseudoDoWhileLoopEnd(node));
        }else if(node.nodeType === "if_statement") {
            this.instructions.push(getPseudoIfStatementStart(node));

            for(let child of node.body) {
                this.compileNode(child);
            }
            
            let chain = node.chain;
            while(chain) {
                this.compileNode(chain);
                chain = chain.nodeType === 'else_if_statement' ? chain.chain : undefined;
            }

            this.instructions.push(getPseudoIfStatementEnd(node));
        }else if(node.nodeType === "else_if_statement") {
            this.instructions.push(getPseudoElseIfStatementStart(node));

            for(let child of node.body) {
                this.compileNode(child);
            }
            this.instructions.push(getPseudoElseIfStatementEnd(node));
        }else if(node.nodeType === "else_statement") {
            this.instructions.push(getPseudoElseStatementStart(node));

            for(let child of node.body) {
                this.compileNode(child);
            }

            this.instructions.push(getPseudoElseStatementEnd(node));
        }else if(node.nodeType === "return_statement"){
            this.instructions.push(getReturnStatement(node));
        }else if(node.nodeType === "assert_statement"){
            this.instructions.push(getAssertStatement(node));   
        }else if(node.nodeType === "variable_assignment"){
            this.instructions.push(getPseudoVariableAssignment(node));
        }
        
        
        else{
            throw new Error(`Unknown node type ${node.nodeType}`);
        }

    }
}
