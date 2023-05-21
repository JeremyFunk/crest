/**
 * An identifier scope is a collection of all the variables, arguments and functions a scope has access to.
 * It is used to generate the IdentifierScopeDefinition, which is used during compilation to access identifiers.
 * 
 * This file knows nothing about the stack frames, it only knows about identifiers and their relations.
 * The following code has two stack frames but four scopes for example:
 * 
 * function foo(){     // Scope 1 of Stack Frame 1
 *     var a = 0;      // a now exists in Scope 1, and therefore also in Stack Frame 1
 * 
 *     while(a < 10){  // Scope 2 of Stack Frame 1
 *         var b = 1;  // b now exists in Scope 2. Scope 2 is a child of Scope 1, so it can access a.
 *         a += a + b; // a is in Scope 1, so it can be accessed from Scope 2.
 *     }               // Scope 2 ends here, so b is no longer accessible.
 * 
 *     var b = 2;      // b now exists in Scope 1, and therefore also in Stack Frame 1
 *     bar(b);         // bar is a function, so it has its own scope. This is Stack Frame 2, meaning that b won't be changed (pass by value).
 * }
 * 
 * function bar(b: int){     // Scope 1 of Stack Frame 2
 *     var c = 2;      // c now exists in Scope 1, and therefore also in Stack Frame 2
 *     a += c;         // a is not in Scope 1 of Stack Frame 2, so it cannot be accessed from Scope 1. This is a compile error.
 *     b += c;         // b is in Scope 1 of Stack Frame 2, so it can be accessed from Scope 1.
 * }
 */

import { ASTFunctionDefinition, ASTNode, ASTRoot, ASTVariableDefinition } from "../../parser/parser"


/* 
 * The IdentifierScopeDefinition is a tree of all pre-defined identifiers in a scope (global variables, arguments, functions).
 * The IdentifierScopeDefinition is created by the Indexer, and is used by the IntermediateTranspiler to generate the intermediate representation of the program.
 */
export class Scope{
    public static globalVariables: ASTVariableDefinition[] = []
    public static globalFunctions: ASTFunctionDefinition[] = []
    public static builtinFunctions: ASTFunctionDefinition[] = []
    public static main: ASTNode | null = null;
    public static scopes: Scope[] = []
    // Contains the index of the current full scope in the subScopes array.
    private static fullScopes: number[] = []
    private static names: {
        name: string,
        scope: Scope
    }[] = []

    private variables: ASTVariableDefinition[] = []
    private functions: ASTFunctionDefinition[] = []
    private killed = false;

    private constructor(private id: number, name: string, private parent?: Scope) {
        this.variables = []
        this.functions = []

        Scope.names.push({
            name: name,
            scope: this
        })

        Scope.scopes.push(this)
     }

    private ensureNotKilled() {
        if(this.killed){
            throw new Error("Scope is killed");
        }
    }

    private getVariable(name: string): ASTVariableDefinition {
        this.ensureNotKilled()
        for(let variable of this.variables){
            if(variable.name == name){
                return variable;
            }
        }

        if(this.parent){
            return this.parent.getVariable(name);
        }

        for(let variable of Scope.globalVariables){
            if(variable.name == name){
                return variable;
            }
        }

        throw new Error(`Variable ${name} does not exist`);
    }

    private getFunction(name: string): ASTFunctionDefinition {
        this.ensureNotKilled()
        for(let func of Scope.builtinFunctions){
            if(func.name == name){
                return func;
            }
        }

        for(let func of this.functions){
            if(func.name == name){
                return func;
            }
        }

        if(this.parent){
            return this.parent.getFunction(name);
        }

        for(let func of Scope.globalFunctions){
            if(func.name == name){
                return func;
            }
        }

        throw new Error(`Function ${name} does not exist`);
    }

    private getIdentifier(name: string): ASTVariableDefinition | ASTFunctionDefinition | undefined {
        this.ensureNotKilled()

        try{
            return this.getVariable(name) || this.getFunction(name);
        }catch{}
    }

    private pushVariable(variable: ASTVariableDefinition){
        this.ensureNotKilled()

        if(this.getIdentifier(variable.name)){
            throw new Error(`Variable ${variable.name} already exists in this scope`);
        }
        this.variables.push(variable);
    }

    private pushFunctionDefinition(func: ASTFunctionDefinition): void {
        this.ensureNotKilled()

        if(func.name == 'main'){
            if(Scope.main){
                throw new Error(`Main function already exists in this scope`);
            }
            Scope.main = func;
        }else {
            this.functions.push(func);
        }
    }

    private static getTopSubScope(): Scope {
        if(Scope.scopes.length === 0){
            throw new Error(`No scope exists`);
        }

        return Scope.scopes[Scope.scopes.length - 1]
    }

    static getVariable(name: string): ASTVariableDefinition {
        return Scope.getTopSubScope().getVariable(name);
    }

    static getFunction(name: string): ASTFunctionDefinition {
        return Scope.getTopSubScope().getFunction(name);
    }

    static getIdentifier(name: string): ASTVariableDefinition | ASTFunctionDefinition | undefined {
        return Scope.getTopSubScope().getIdentifier(name);
    }

    static pushVariable(variable: ASTVariableDefinition){
        Scope.getTopSubScope().pushVariable(variable);
    }

    static pushFunctionDefinition(func: ASTFunctionDefinition): void {
        Scope.getTopSubScope().pushFunctionDefinition(func);
    }

    private static getId(name: string): number {
        for(let i = Scope.names.length - 1; i >= 0; i--){
            if(Scope.names[i].name == name){
                return Scope.names[i].scope.id;
            }
        }

        throw new Error(`Scope ${name} does not exist`);
    }

    static pushSubScope(id: number, name: string): Scope {
        const scope = new Scope(id, name, Scope.getTopSubScope());
        return scope;
    }

    static popSubScope(name: string): number {
        if(Scope.scopes.length === 0){
            throw new Error(`Cannot pop scope ${name} because it does not exist`);
        }

        const scope = Scope.scopes.pop()!;
        scope.killed = true;

        if(scope.id !== Scope.getId(name)){
            throw new Error(`Scope ${name} does not match the current scope`);
        }

        return scope.id;
    }
     
    static pushFullScope(id: number, name: string): Scope {
        const scope = new Scope(id, name);
        Scope.fullScopes.push(Scope.scopes.length - 1);
        return scope;
    }

    static popFullScope(name: string): number {
        if(Scope.fullScopes.length === 0){
            throw new Error(`Cannot pop scope ${name} because it does not exist`);
        }
        
        const id = Scope.getId(name);
        const topSope = Scope.fullScopes.pop()!
        const scope = Scope.scopes[topSope];

        if(id !== scope.id){
            throw new Error(`Scope ${name} does not match the current scope`);
        }

        // Pop all scopes until the top scope is reached.
        while(Scope.scopes.length > topSope){
            const scope = Scope.scopes.pop()!;
            scope.killed = true;
        }

        return id;
    }
}

// // This is an identifier scope at a specific point in the program.
// export class IdentifierScopeFrame {
//     private variables: ASTVariableDefinition[]
//     private functions: ASTFunctionDefinition[]

//     constructor(scope: IdentifierScopeDefinition, public node: ASTNode, private parent: IdentifierScopeFrame | null){
//         this.variables = scope.variables;
//         this.functions = scope.functions;
//     }

//     getVariable(name: string): ASTVariableDefinition {
//         for(let variable of this.variables){
//             if(variable.name == name){
//                 return variable;
//             }
//         }

//         if(this.parent){
//             return this.parent.getVariable(name);
//         }

//         throw new Error(`Variable ${name} does not exist in this scope`);
//     }

//     getFunction(name: string): ASTFunctionDefinition {
//         for(let func of this.functions){
//             if(func.name == name){
//                 return func;
//             }
//         }

//         if(this.parent){
//             return this.parent.getFunction(name);
//         }

//         throw new Error(`Function ${name} does not exist in this scope`);
//     }

//     getIdentifier(name: string): ASTVariableDefinition | ASTFunctionDefinition {
//         return this.getVariable(name) || this.getFunction(name);
//     }
// }


export function buildGlobals(root: ASTRoot) {
    // First we can read all the global variables and functions.
    // Global variables are defined in the global scope, and are accessible from everywhere.
    // Functions are also defined in the global scope, and are accessible from everywhere.
    root.body.forEach(node => {
        switch (node.nodeType) {
            case 'variable_definition':
                indexVariableDefinition(node)
                break;
            case 'function_definition':
                indexFunctionDefinition(node)
                break;
        }
    })

    Scope.builtinFunctions.push({
        nodeType: 'function_definition',
        name: 'print',
        arguments: [],
        body: [],
        returnType: 'void',
    })
}

function indexVariableDefinition(node: ASTVariableDefinition) {
    Scope.globalVariables.push(node)
}

function indexFunctionDefinition(node: ASTFunctionDefinition) {
    if(node.name == 'main'){
        Scope.main = node;
    }else {
        Scope.globalFunctions.push(node)
    }
}