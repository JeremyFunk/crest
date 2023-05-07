#include "add.h"

void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    PrimitiveData prim = get_primitive_data(node->primitive);

    fprintf(out_file, "mov %s, %s\n", prim.accumulator1, value_or_stack_reference(node->left, symbol_table));
    fprintf(out_file, "add %s, %s\n", prim.accumulator1, value_or_stack_reference(node->right, symbol_table));
}