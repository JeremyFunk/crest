import * as fs from 'fs';
import { lexerize } from './lexer/lexer';
import { tokenize } from './tokenizer/tokenizer';
import { ASTParser } from './parser/parser';
import { execSync } from 'child_process';
import { M2Compiler } from './m2/compiler/m2-compiler';
import { formatASM } from './util/format-asm';

const file = fs.readFileSync('../../most-basic.cst', 'utf8');
const lexels = lexerize(file);
const tokens = tokenize(lexels)

// console.log(lexels);
// console.log(tokens);

const parser = new ASTParser(tokens);
const ast = parser.parse();

const m2 = new M2Compiler(ast);
const assembly = m2.compile();

fs.writeFileSync('../../res/bin/example.asm', formatASM(assembly), 'utf8');

console.log('Compilation successful. Executing...');
console.log('-'.repeat(80))
console.log('\n'.repeat(2));

try{
    execSync(
        'cd ../.. && fish build.fish && ./res/bin/executable ',
        {stdio: 'inherit'}
    );
}catch{
    console.log('\n'.repeat(3));
    console.log('-'.repeat(80))
    console.log('Execution failed.');
    process.exit(1);
}