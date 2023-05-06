#include "../parser/parser.h"
#include "windows-data.h"

typedef struct SymbolTableEntry {
    char *name;
    int offset;
    int size;
    struct SymbolTableEntry *next;
} SymbolTableEntry;

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

// Forward declarations
void emit_int(AstNode *node, FILE *out_file);
void emit_identifier(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_declare(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_load_int32(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_store(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_multiply(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);
void emit_print(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file);

char* get_register_type(Primitive p){
    switch(p){
        case PRIMITIVE_INT8:
            return "al";
        case PRIMITIVE_INT16:
            return "ax";
        case PRIMITIVE_INT32:
            return "eax";
        case PRIMITIVE_INT64:
            return "rax";
        default:
            fprintf(stderr, "Error: Unknown primitive type %d\n", p);
            return "rax";
    }
}

char* get_word_type(Primitive p){
    switch(p){
        case PRIMITIVE_INT8:
            return "byte";
        case PRIMITIVE_INT16:
            return "word";
        case PRIMITIVE_INT32:
            return "dword";
        case PRIMITIVE_INT64:
            return "qword";
        default:
            fprintf(stderr, "Error: Unknown primitive type %d\n", p);
            return "qword";
    }
}

char* get_mov_type(Primitive p){
    switch(p){
        case PRIMITIVE_INT8:
            return "movzx";
        case PRIMITIVE_INT16:
            return "movzx";
        case PRIMITIVE_INT32:
        case PRIMITIVE_INT64:
            return "mov";
        default:
            fprintf(stderr, "Error: Unknown primitive type %d\n", p);
            return "mov";
    }
}

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


void emit_int(AstNode *node, FILE *out_file) {
    fprintf(out_file, "push %s\n", node->value);
}

void emit_identifier(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    int offset = find_symbol_offset(symbol_table, node->value);
    if (offset != -1) {
        char* register_type = get_register_type(node->primitive);
        char* word = get_word_type(node->primitive);

        fprintf(out_file, "mov %s, %s [rsp + %d]\n", word, register_type, offset); // Load the 32-bit value into the EAX register
        // fprintf(out_file, "push rax\n"); // Push the 64-bit RAX register onto the stack
    } else {
        fprintf(stderr, "Error: Undefined variable '%s'\n", node->value);
    }
}


void emit_declare(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    int size = int_size(node);

    add_symbol(symbol_table, node->value, size);
}

void emit_load_int32(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    emit_int(node->left, out_file);
}

char* dword_or_value(AstNode *node, SymbolTableEntry **symbol_table){
    static char buffer[64];
    if(node->type == NODE_VALUE_INT){
        return node->value;
    }else{
        int offset = find_symbol_offset(symbol_table, node->value);
        char* word = get_word_type(node->primitive);

        snprintf(buffer, sizeof(buffer), "%s [rsp + %d]", word, offset);
        return buffer;
    }
}

void emit_store(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    int offset = find_symbol_offset(symbol_table, node->left->value);

    char* register_type = get_register_type(node->left->primitive);
    char* word = get_word_type(node->left->primitive);

    if(node->right->type == NODE_ADD){
        emit_add(node->right, symbol_table, out_file);
        fprintf(out_file, "mov %s [rsp + %d], %s\n", word, offset, register_type);
    }else if(node->right->type == NODE_MUL){
        emit_multiply(node->right, symbol_table, out_file);
        fprintf(out_file, "mov %s [rsp + %d], %s\n", word, offset, register_type);
    }else{
        fprintf(out_file, "mov %s [rsp + %d], %s\n", word, offset, dword_or_value(node->right, symbol_table));
    }
}


void emit_add(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    char* register_name = get_register_type(node->left->primitive);

    fprintf(out_file, "mov %s, %s\n", register_name, dword_or_value(node->left, symbol_table));
    fprintf(out_file, "add %s, %s\n", register_name, dword_or_value(node->right, symbol_table));
}

void emit_multiply(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    char* register_name = get_register_type(node->left->primitive);

    fprintf(out_file, "mov %s, %s\n", register_name, dword_or_value(node->left, symbol_table));
    fprintf(out_file, "imul %s, %s\n", register_name, dword_or_value(node->right, symbol_table));
}

void emit_print(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    char* format = get_print_format(node->left->primitive);
    fprintf(out_file, "lea rcx, [%s]\n", format); // Load the address of the format string into RCX
    //emit_identifier(node->left, symbol_table, out_file, "edx"); // Push the value to print onto the stack

    char* word = get_word_type(node->left->primitive);
    char* mov_type = get_mov_type(node->left->primitive);

    fprintf(out_file, "%s edx, %s [rsp + %d]\n", mov_type, word, find_symbol_offset(symbol_table, node->left->value));
    
    fprintf(out_file, "mov rax, 0\n"); // Clear the RAX register (required for variadic functions)
    fprintf(out_file, "call printf\n");
}

void emit_halt(AstNode *node, FILE *out_file) {
    fprintf(out_file, "halt\n");
}

void emit_code(AstNode *node, SymbolTableEntry **symbol_table, FILE *out_file) {
    if (!node) return;

    switch (node->type) {
        // case NODE_VALUE_INT:
        //     emit_int(node, out_file);
        //     break;
        case NODE_DECLARE:
            emit_declare(node, symbol_table, out_file);
            break;
        // case NODE_IDENTIFIER:
        //     emit_identifier(node, symbol_table, out_file);
        //     break;
        case NODE_STORE:
            emit_store(node, symbol_table, out_file);
            break;
        // case NODE_ADD:
        //     emit_add(node, symbol_table, out_file);
        //     break;
        // case NODE_MUL:
        //     emit_multiply(node, symbol_table, out_file);
        //     break;
        case NODE_PRINT:
            emit_print(node, symbol_table, out_file);
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
    fprintf(out_file, "\nret\n");
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
