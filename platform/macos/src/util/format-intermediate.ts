const indentators = [
    'program_start',
    'function_head',
    'function_body',
    'function_call',
    'if'
]

const dedentators = [
    'program_end',
    'function_body',
    'function_end',
    'function_call_end',
    'if_end'
]

export function formatIntermediate(intermediate: string): string{
    let indent = 0;
    return intermediate.split("\n").map(line => {
        line = line.trim();

        const split = line.split(' ');
        const instruction = split[0];

        if(dedentators.includes(instruction)){
            indent--;
        }
        
        let result = '    '.repeat(indent);

        result += line;

        if(indentators.includes(instruction) || line.includes(' function_call ')){
            indent++;
        }

        return result;
    }).join('\n');
}