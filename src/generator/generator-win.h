#ifndef GENERATOR_WIN_H
#define GENERATOR_WIN_H

#include "generator.h"

typedef struct PrimitiveData {
    Primitive primitive;
    int size;
    char *accumulator1, *accumulator2, *accumulator3, *accumulator4;
    char* directive;

    // The operation to move a value to a 64-bit register
    char* move_to_64;

} PrimitiveData;

void emit_int(AstNode *node, FILE *out_file);
void emit_identifier(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_declare(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_load_int32(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_store(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_multiply(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_print(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);

#endif