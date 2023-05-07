#ifndef GENERATOR_WIN_H
#define GENERATOR_WIN_H

#include "win-helpers.h"
#include "generator.h"

typedef struct PrimitiveData {
    Primitive primitive;
    int size;
    char *accumulator1, *accumulator2, *accumulator3, *accumulator4;
    char* directive;

    // The operation to move a value to a 64-bit register
    char* move_to_64;

} PrimitiveData;
PrimitiveData get_primitive_data(Primitive p);

void emit_declare(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_store(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_inline_function(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);

char* value_or_stack_reference(AstNode *node, SymbolTableEntry **symbol_table);

#endif