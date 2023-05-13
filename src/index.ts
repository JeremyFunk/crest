import * as fs from 'fs';
import { lexerize } from './lexer/lexer';
import { tokenize } from './tokenizer/tokenizer';
import { ASTParser } from './parser/parser';
import { M2Compiler } from './platform/macos/m2/m2-compiler';
import { execSync } from 'child_process';

const file = fs.readFileSync('./most-basic.cst', 'utf8');
const lexels = lexerize(file);
const tokens = tokenize(lexels)

// console.log(lexels);
// console.log(tokens);

const parser = new ASTParser(tokens);
const ast = parser.parse();

const m2 = new M2Compiler(ast);
const assembly = m2.compile();

fs.writeFileSync('./example.s', assembly, 'utf8');

const result = execSync('fish build.fish && ./executable ');
console.log(result.toString());