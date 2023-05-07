#include "basic.h"

void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    emit_any_operator(node, symbol_table, out_file);
    PrimitiveData prim = get_primitive_data(node->primitive);

    fprintf(out_file, "mov %s, %s\n", prim.accumulator1, value_or_stack_reference(node->left, symbol_table));
    fprintf(out_file, "add %s, %s\n", prim.accumulator1, value_or_stack_reference(node->right, symbol_table));
}

void emit_sub(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    emit_any_operator(node, symbol_table, out_file);
    PrimitiveData prim = get_primitive_data(node->primitive);

    fprintf(out_file, "mov %s, %s\n", prim.accumulator1, value_or_stack_reference(node->left, symbol_table));
    fprintf(out_file, "sub %s, %s\n", prim.accumulator1, value_or_stack_reference(node->right, symbol_table));
}

void emit_mul(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    emit_any_operator(node, symbol_table, out_file);
    PrimitiveData prim = get_primitive_data(node->primitive);
    
    if(node->primitive == PRIMITIVE_INT8) {
        PrimitiveData prim32 = get_primitive_data(PRIMITIVE_INT32);

        
        if(node->left->type == NODE_VALUE_INT){
            fprintf(out_file, "mov %s, %s\n", prim32.accumulator1, value_or_stack_reference(node->left, symbol_table));
        }else {
            fprintf(out_file, "movzx %s, %s\n", prim32.accumulator1, value_or_stack_reference(node->left, symbol_table));
        }

        if(node->right->type == NODE_VALUE_INT){
            fprintf(out_file, "mov %s, %s\n", prim32.accumulator2, value_or_stack_reference(node->right, symbol_table));
        }else {
            fprintf(out_file, "movzx %s, %s\n", prim32.accumulator2, value_or_stack_reference(node->right, symbol_table));
        }
        
        fprintf(out_file, "mul %s\n", prim32.accumulator2);
        return;
    }

    fprintf(out_file, "mov %s, %s\n", prim.accumulator1, value_or_stack_reference(node->left, symbol_table));
    fprintf(out_file, "imul %s, %s\n", prim.accumulator1, value_or_stack_reference(node->right, symbol_table));
}

void emit_div(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    emit_any_operator(node, symbol_table, out_file);
    PrimitiveData prim = get_primitive_data(node->primitive);

    if(node->primitive == PRIMITIVE_INT8) {
        fprintf(out_file, "xor ax, ax\n");
    }else{
        // zero out the upper 32 bits of the dividend
        fprintf(out_file, "xor %s, %s\n", prim.accumulator4, prim.accumulator4);
    }


    // move the dividend into the result register
    fprintf(out_file, "mov %s, %s\n", prim.accumulator1, value_or_stack_reference(node->left, symbol_table));
    fprintf(out_file, "div %s\n", value_or_stack_reference(node->right, symbol_table));
}