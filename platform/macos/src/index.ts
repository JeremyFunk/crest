import * as fs from 'fs';
import { lexerize } from './lexer/lexer';
import { tokenize } from './tokenizer/tokenizer';
import { ASTParser } from './parser/parser';
import { execSync } from 'child_process';
import { M2Compiler } from './m2/m2-compiler';

const file = fs.readFileSync('../../most-basic.cst', 'utf8');
const lexels = lexerize(file);
const tokens = tokenize(lexels)

// console.log(lexels);
// console.log(tokens);

const parser = new ASTParser(tokens);
const ast = parser.parse();

const m2 = new M2Compiler(ast);
const assembly = m2.compile();

fs.writeFileSync('../../res/bin/example.s', assembly, 'utf8');

const result = execSync('cd ../../ && fish build.fish && res/bin/executable ');
console.log(result.toString());