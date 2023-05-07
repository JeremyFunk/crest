#include "inline-print.h"

char* get_print_format(Primitive p){
    switch(p){
        case PRIMITIVE_INT8:
            return "format_int8";
        case PRIMITIVE_INT16:
            return "format_int16";
        case PRIMITIVE_INT32:
            return "format_int32";
        case PRIMITIVE_INT64:
            return "format_int64";
        default:
            fprintf(stderr, "Error: Unknown primitive type %d\n", p);
            return "format_int64";
    }
}

void emit_print(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    char* format = get_print_format(node->left->primitive);
    fprintf(out_file, "lea rcx, [%s]\n", format); // Load the address of the format string into RCX

    PrimitiveData prim = get_primitive_data(node->left->primitive);

    fprintf(out_file, "%s edx, %s [rsp + %d]\n", prim.move_to_64, prim.directive, find_symbol_offset(symbol_table, node->left->value));
    
    fprintf(out_file, "mov rax, 0\n"); // Clear the RAX register (required for variadic functions)
    fprintf(out_file, "call printf\n");
}