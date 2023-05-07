#include "generator-win.h"
#include "inline-functions/inline-print.h"
#include "operators/add.h"
#include "operators/mul.h"

const PrimitiveData PRIMITIVE_DATA[] = {
    {PRIMITIVE_INT8, 1, "al", "bl", "cl", "dl", "byte", "movsx"},
    {PRIMITIVE_INT16, 2, "ax", "bx", "cx", "dx", "word", "movzx"},
    {PRIMITIVE_INT32, 4, "eax", "ebx", "ecx", "edx", "dword", "mov"},
    {PRIMITIVE_INT64, 8, "rax", "rbx", "rcx", "rdx", "qword", "mov"},
};

PrimitiveData get_primitive_data(Primitive p) {
    for (int i = 0; i < sizeof(PRIMITIVE_DATA) / sizeof(PrimitiveData); i++) {
        if (PRIMITIVE_DATA[i].primitive == p) {
            return PRIMITIVE_DATA[i];
        }
    }

    fprintf(stderr, "Error: Unknown primitive type %d\n", p);
    exit(1);
}

// ------------------------------
//   Symbol table functions
// ------------------------------

SymbolTableEntry *add_symbol(SymbolTableEntry **symbol_table, const char *name, int size) {
    // fprintf(stderr, "Adding symbol '%s' with offset %d\n", name, offset);
    int offset = 0;
    if (*symbol_table != NULL) {
        offset = (*symbol_table)->offset + (*symbol_table)->size;
    }

    SymbolTableEntry *new_entry = (SymbolTableEntry *)malloc(sizeof(SymbolTableEntry));
    new_entry->name = strdup(name);
    new_entry->offset = offset;
    new_entry->size = size;
    new_entry->next = *symbol_table;
    *symbol_table = new_entry;
    return new_entry;
}
int find_symbol_offset(SymbolTableEntry **symbol_table, const char *name) {
    SymbolTableEntry *entry = *symbol_table;
    while (entry != NULL) {
        if (strcmp(entry->name, name) == 0) {
            return entry->offset;
        }
        entry = entry->next;
    }

    fprintf(stderr, "Error: Undefined variable '%s'\n", name);
    return 0;
}

// ------------------------------
//   Helper functions
// ------------------------------

char* value_or_stack_reference(AstNode *node, SymbolTableEntry **symbol_table){
    static char buffer[64];
    if(node->type == NODE_VALUE_INT){
        return node->value;
    }else{
        int offset = find_symbol_offset(symbol_table, node->value);
        PrimitiveData prim = get_primitive_data(node->primitive);

        snprintf(buffer, sizeof(buffer), "%s [rsp + %d]", prim.directive, offset);
        return buffer;
    }
}


// ------------------------------
//   Emitting predefines
// ------------------------------

void emit_inline_function(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
   if(node->type == NODE_PRINT){
        emit_print(node, symbol_table, out_file);
        return; 
    }

    fprintf(stderr, "Error: Unknown function '%s'\n", node->value);
    exit(1);
}

void emit_operator(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    if (node->type == NODE_ADD) {
        emit_add(node, symbol_table, out_file);
        return;
    }

    if (node->type == NODE_MUL){
        emit_mul(node, symbol_table, out_file);
        return;
    }
}

// ------------------------------
// Emitting instructions
// ------------------------------

void emit_declare(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    int size = get_primitive_data(node->primitive).size;
    add_symbol(symbol_table, node->value, size);
}

void emit_store(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    int offset = find_symbol_offset(symbol_table, node->left->value);

    PrimitiveData prim = get_primitive_data(node->left->primitive);

    if(is_operator(node->right->type)){
        emit_operator(node->right, symbol_table, out_file);
        fprintf(out_file, "mov %s [rsp + %d], %s\n", prim.directive, offset, prim.accumulator1);
    }else{
        fprintf(out_file, "mov %s [rsp + %d], %s\n", prim.directive, offset, value_or_stack_reference(node->right, symbol_table));
    }
}

void emit_halt(AstNode *node, FILE *out_file) {
    fprintf(out_file, "ret\n");
}

// ------------------------------
//   High-level emit functions
// ------------------------------

void emit_code(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    if (!node) return;

    if(is_inline_function(node->type)){
        emit_inline_function(node, symbol_table, out_file);
        return;
    }


    switch (node->type) {
        case NODE_DECLARE:
            emit_declare(node, symbol_table, out_file);
            break;
        case NODE_STORE:
            emit_store(node, symbol_table, out_file);
            break;
        case NODE_HALT:
            emit_halt(node, out_file);
            break;
    }
}

void emit_prefix(SymbolTableEntry **symbol_table, FILE *out_file) {
    fprintf(out_file, "section .data\n");
    fprintf(out_file, "format_int8 db \"%%hhd\", 10, 0\n");
    fprintf(out_file, "format_int16 db \"%%hd\", 10, 0\n");
    fprintf(out_file, "format_int32 db \"%%d\", 10, 0\n");
    fprintf(out_file, "format_int64 db \"%%ld\", 10, 0\n\n");


    fprintf(out_file, "section .text\n");
    fprintf(out_file, "global main\n");
    fprintf(out_file, "extern printf\n\n");
    fprintf(out_file, "main:\n\n");

    // Allocate space for local variables
    if (*symbol_table != NULL) {
        fprintf(out_file, "sub rsp, %d ; Calculated stack size\n\n", (*symbol_table)->offset + (*symbol_table)->size);
    }
}

void emit_suffix(FILE *out_file) {
    // fprintf(out_file, "\nret\n");
}

// Read out_file
// Write optimized code to out_file    
void optimize(SymbolTableEntry **symbol_table, const char *out_filename) {
    FILE *out_file = fopen(out_filename, "rb");
    fseek(out_file, 0, SEEK_END); 
    long fileSize = ftell(out_file);
    fseek (out_file, 0, SEEK_SET);
    char* wholeFile = (char*)malloc(fileSize);
    
    fread(wholeFile, 1, fileSize, out_file);
    fclose(out_file);


    out_file = fopen(out_filename, "wb");
    // Emit the prefix
    emit_prefix(symbol_table, out_file);

    // Write the original code
    fwrite(wholeFile, 1, fileSize, out_file);

    // Emit the suffix
    emit_suffix(out_file);

    fclose(out_file);
}