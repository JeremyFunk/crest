#ifndef MUL_H
#define MUL_H
#include "operator.h"

void emit_mul(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);

#endif