#ifndef ADD_H
#define ADD_H
#include "operator.h"

void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);

#endif