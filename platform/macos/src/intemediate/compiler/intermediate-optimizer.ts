interface Variable {
    type: string;
    value?: string;
    initializedAt: number;
    accessedAt?: number;
    changedAt?: number;
}

class Scope{
    public parent: Scope | null;
    private variables: Record<string, Variable> = {};

    constructor(parent: Scope | null) {
        this.parent = parent;
    }

    private getVariable(name: string): Variable {
        if(name.startsWith('$')) {
            name = name.substr(1);
        }

        if(this.variables[name]) {
            return this.variables[name];
        }else if(this.parent) {
            return this.parent.getVariable(name);
        }

        throw new Error(`Variable ${name} not found`);
    }

    public variableUsed(name: string, instructionIndex: number) {
        if(name.startsWith('$')) {
            name = name.substr(1);
        }

        if(this.variables[name]) {
            this.variables[name].accessedAt = instructionIndex;
        }else if(this.parent) {
            this.parent.variableUsed(name, instructionIndex);
        }else{
            throw new Error(`Variable ${name} not found`);
        }
    }

    public variableChanged(name: string, instructionIndex: number) {
        if(name.startsWith('$')) {
            name = name.substr(1);
        }

        if(this.variables[name]) {
            this.variables[name].changedAt = instructionIndex;
        }else if(this.parent) {
            this.parent.variableChanged(name, instructionIndex);
        }else {
            throw new Error(`Variable ${name} not found`);
        }

    }

    public variableDefined(name: string, type: string, value: string, instructionIndex: number) {
        this.variables[name] = {
            type,
            value,
            initializedAt: instructionIndex
        }
    }

    public variableDeclared(name: string, type: string, instructionIndex: number) {
        this.variables[name] = {
            type,
            initializedAt: instructionIndex
        }
    }

    public lastAccessed(name: string) {
        const variable = this.getVariable(name);
        return variable.accessedAt
    }
    public lastChanged(name: string) {
        const variable = this.getVariable(name);
        return variable.changedAt
    }
}


export class IntermediateOptimizer {
    private instructions: string[];
    private index = 0;
    private scope: Scope;

    constructor(instructions: string) {
        this.scope = new Scope(null);
        this.instructions = instructions.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    private hasNext() {
        return this.index < this.instructions.length;
    }

    private next() {
        while(this.hasNext() && this.instructions[this.index].trim().length === 0) {
            this.index++;
        }

        return this.instructions[this.index++].trim();
    }

    optimize() {
        let optimizedInstructions: string[] = [];
        while(this.hasNext()) {
            let next = this.next();
            const split = next.split(' ');
            const instructionName = split[0];

            if(instructionName === 'function_head'){
                this.index--;
                optimizedInstructions.push(...this.optimizeFunctionScope('function_end'))
            }else {
                optimizedInstructions.push(next);
            }
        }

        return optimizedInstructions;
    }

    private optimizeFunctionScope(end: string): string[] {
        const scope = new Scope(this.scope);

        let instructionIndex = this.index;

        let next = this.next();

        if(!next.startsWith('function_head')) {
            throw new Error('Expected function_head');
        }

        // Handle pre-declared variables
        while(next !== 'function_body') {
            next = this.next();
            let split = next.split(' ');

            scope.variableDeclared(split[0], split[1], this.index);
        }

        // First, build the scope
        while(this.hasNext()) {
            const split = this.next().split(' ');
            const instructionName = split[0];

            if(instructionName === end){
                break;
            }

            if(instructionName === 'dynamic' || instructionName === 'const') {
                scope.variableDefined(split[1], split[2], split[3], this.index);
            }else if(instructionName === 'assign') {
                scope.variableChanged(split[1], this.index);
            }else {
                for(let i = 1; i < split.length; i++) {
                    if(split[i].startsWith('$')) {
                        scope.variableUsed(split[i], this.index);
                    }
                }
            }
        }

        // Then, optimize the instructions
        this.index = instructionIndex;
        let optimizedInstructions: string[] = [];

        optimizedInstructions.push(this.next());

        while(this.hasNext()) {
            let next = this.next();
            const split = next.split(' ');

            if(next === 'function_body') {
                optimizedInstructions.push(next);
                break;
            }

            const lastAccessed = scope.lastAccessed(split[0]);
            const lastChanged = scope.lastChanged(split[0]);

            if(lastAccessed === undefined) {
                optimizedInstructions.push('; ' + next);
            }else{
                optimizedInstructions.push(next + ' ; ' + lastAccessed + ' ' + (lastChanged ?? '-1'));
            }
        }

        while(this.hasNext()) {
            const raw = this.next();
            const split = raw.split(' ');
            const instructionName = split[0];

            if(instructionName === end){
                optimizedInstructions.push(raw);
                break;
            }

            if(instructionName === 'dynamic' || instructionName === 'const') {
                // If the variable is never used, remove it
                const lastAccessed = scope.lastAccessed(split[1]);
                const lastChanged = scope.lastChanged(split[1]);
                if(lastAccessed === undefined) {
                    optimizedInstructions.push('; ' + raw);
                }else{
                    optimizedInstructions.push(raw + ' ; ' + lastAccessed + ' ' + (lastChanged ?? '-1'));
                }
            }else if(instructionName === 'assign') {
                // If the variable is never used, remove it
                if(scope.lastAccessed(split[1]) === undefined) {
                    optimizedInstructions.push('; ' + raw);
                }else{
                    optimizedInstructions.push(raw);
                }
                if(split[2] === 'function_call'){
                    let next = this.next()
                    while(next !== 'function_call_end'){
                        optimizedInstructions.push(next);
                        next = this.next();
                    }
                    optimizedInstructions.push(next);
                }
            }else{
                optimizedInstructions.push(raw);
            }
        }

        return optimizedInstructions;
    }
}