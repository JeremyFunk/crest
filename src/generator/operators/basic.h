#ifndef OPERATORS_BASIC_H
#define OPERATORS_BASIC_H
#include "operator.h"

void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_sub(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_mul(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_div(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
#endif
