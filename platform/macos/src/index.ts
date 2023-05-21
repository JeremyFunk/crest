import * as fs from 'fs';
import { lexerize } from './lexer/lexer';
import { tokenize } from './tokenizer/tokenizer';
import { ASTParser } from './parser/parser';
import { execSync } from 'child_process';
import { IntermediateCompiler } from './intemediate/compiler/intermediate-compiler';
import { formatASM } from './util/format-asm';
import { formatIntermediate } from './util/format-intermediate';
import { IntermediateOptimizer } from './intemediate/compiler/intermediate-optimizer';

const file = fs.readFileSync('../../most-basic.cst', 'utf8');
const lexels = lexerize(file);
const tokens = tokenize(lexels)

const parser = new ASTParser(tokens);
const ast = parser.parse();

// console.log(JSON.stringify(ast, null, 2));


const m2 = new IntermediateCompiler(ast as any);
const intermediate = m2.compile();

fs.writeFileSync('../../res/bin/example.csti', formatIntermediate(intermediate), 'utf8');

const optimizer = new IntermediateOptimizer(intermediate);

fs.writeFileSync('../../res/bin/example.csto', formatIntermediate(optimizer.optimize().join('\n')), 'utf8');


// fs.writeFileSync('../../res/bin/example.asm', formatASM(assembly), 'utf8');

// console.log('Compilation successful. Executing...');
// console.log('-'.repeat(80))
// console.log('\n'.repeat(2));

// try{
//     execSync(
//         'cd ../.. && fish build.fish && ./res/bin/executable ',
//         {stdio: 'inherit'}
//     );
// }catch{
//     console.log('\n'.repeat(3));
//     console.log('-'.repeat(80))
//     console.log('Execution failed.');
//     process.exit(1);
// }