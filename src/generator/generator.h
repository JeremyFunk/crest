#ifndef GENERATOR_H
#define GENERATOR_H

#include "../parser/parser.h"

typedef struct SymbolTableEntry {
    char *name;
    int offset;
    int size;
    struct SymbolTableEntry *next;
} SymbolTableEntry;

void emit_code(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_prefix(SymbolTableEntry **symbol_table, FILE *out_file);
void emit_suffix(FILE *out_file);
void optimize(SymbolTableEntry **symbol_table, const char *out_filename);
#endif