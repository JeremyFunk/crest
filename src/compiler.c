#include "generator/generator.h"

int print_tokens(FILE *file) {
    Token token;
    do {
        token = get_next_token(file);
        switch (token.type) {
            case TOKEN_VALUE_INT:
                printf("Integer: %s\n", token.value);
                free(token.value);
                break;
            case TOKEN_TYPE_INT8:
                printf("Type: int8\n");
                break;
            case TOKEN_TYPE_INT16:
                printf("Type: int16\n");
                break;
            case TOKEN_TYPE_INT32:
                printf("Type: int32\n");
                break;
            case TOKEN_TYPE_INT64:
                printf("Type: int64\n");
                break;
            case TOKEN_DECLARE:
                printf("Keyword: declare\n");
                break;
            case TOKEN_STORE:
                printf("Keyword: store\n");
                break;
            case TOKEN_ADD:
                printf("Keyword: add\n");
                break;
            case TOKEN_MUL:
                printf("Keyword: multiply\n");
                break;
            case TOKEN_PRINT:
                printf("Keyword: print\n");
                break;
            case TOKEN_HALT:
                printf("Keyword: halt\n");
                break;
            case TOKEN_COMMA:
                printf("Symbol: ,\n");
                break;
            case TOKEN_UNKNOWN:
                printf("Unknown token\n");
                break;
            case TOKEN_EOF:
                printf("End of file\n");
                break;
            default:
                printf("Error: Unknown token type %d\n", token.type);
                break;
        }
    } while (token.type != TOKEN_EOF);

    fclose(file);
    return 0;
}

int print_full_ast(FILE *file){
    setup_parser(file);

    AstNode *ast = parse_expression(file);
    while (ast && ast->type != TOKEN_EOF) {
        // Process the AST or store it for later use
        // For now, just print the node type
        ast_to_pretty_string(ast, 0, stderr);

        // Free the AST nodes as you go
        if (ast->left) free(ast->left);
        if (ast->right) free(ast->right);
        if (ast->value) free(ast->value);
        free(ast);

        ast = parse_expression(file);
    }

    fclose(file);
    return 0;
}


int compile(FILE *file){
    const char *asm_file_name = "../assembled.asm";
    const char *obj_file_name = "temp_output.obj";
    FILE *out_file = fopen(asm_file_name, "wb");
    if (!out_file) {
        fprintf(stderr, "Error: Could not open output file '%s'\n", asm_file_name);
        return 1;
    }

    setup_parser(file);

    AstNode *ast = parse_expression(file);
    if (!out_file) {
        fprintf(stderr, "Error: Could not open output file 'output.asm'\n");
        return 1;
    }
    
    SymbolTableEntry *symbol_table = NULL;
    fprintf(stderr, "Compiling...\n");
    int line = 1;
    while (ast && ast->type != TOKEN_EOF) {
        fprintf(stderr, "Line %d - %s\n", line++, get_node_type_name(ast->type));

        emit_code(ast, &symbol_table, out_file);

        // Free the AST nodes as you go
        if (ast->left) free(ast->left);
        if (ast->right) free(ast->right);
        if (ast->value) free(ast->value);
        free(ast);

        ast = parse_expression(file);
    }

    fclose(out_file);

    optimize(&symbol_table, asm_file_name);

    SymbolTableEntry *entry = symbol_table;
    while (entry != NULL) {
        SymbolTableEntry *next = entry->next;
        free(entry->name);
        free(entry);
        entry= next;
    }


    char nasm_cmd[256];
    snprintf(nasm_cmd, sizeof(nasm_cmd), "nasm -f win64 %s -o %s", asm_file_name, obj_file_name);
    if (system(nasm_cmd) != 0) {
        fprintf(stderr, "Error: NASM assembly failed\n");
        return 1;
    }

    // Call GCC to link the object file with the C runtime library
    char gcc_cmd[256];
    snprintf(gcc_cmd, sizeof(gcc_cmd), "gcc %s -o output.exe", obj_file_name);
    if (system(gcc_cmd) != 0) {
        fprintf(stderr, "Error: GCC linking failed\n");
        return 1;
    }


    fclose(file);
    fclose(out_file);

    // Remove temporary files
    // remove(asm_file_name);
    remove(obj_file_name);

    return 0;
}

int main(int argc, char **argv) {
    // The first console argument defines whether to compile or print the AST
    if (argc != 2) {
        fprintf(stderr, "Usage: compiler [print=ast|tokens|compile-run|compile]\n");
        return 1;
    }

    const char *filename = "../example.il";
    
    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error: Could not open file '%s'\n", filename);
        return 1;
    }

    if (strcmp(argv[1], "print-ast") == 0) {
        return print_full_ast(file);
    } else if (strcmp(argv[1], "compile") == 0) {
        return compile(file);
    }else if (strcmp(argv[1], "tokens") == 0) {
        return print_tokens(file);
    } else if(strcmp(argv[1], "compile-run") == 0) {
        if (compile(file) != 0) {
            return 1;
        }
        fprintf(stderr, "\n\nRunning...\n");

        return system("output.exe");
    }
    fprintf(stderr, "Error: Unknown argument '%s'\n", argv[1]);
    return 1;
}
