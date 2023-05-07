#include "parser-lang.h"

AstNode *create_ast_node(NodeType type, AstNode *left, AstNode *right, char *value, Primitive primitive) {
    AstNode *node = malloc(sizeof(AstNode));
    node->type = type;
    node->left = left;
    node->right = right;
    node->value = value;
    node->primitive = primitive;
    return node;
}

bool is_primitive(Primitive primitive) {
    return primitive >= PRIMITIVE_INT8 && primitive <= PRIMITIVE_UNKNOWN;
}

bool is_primitive_int(Primitive primitive) {
    return primitive >= PRIMITIVE_INT8 && primitive <= PRIMITIVE_INT64;
}
bool is_inline_function(NodeType type){
    return type == NODE_PRINT;
}
bool is_operator(NodeType type){
    return type == NODE_ADD || type == NODE_SUB || type == NODE_MUL || type == NODE_DIV;
}

char* get_primitive_name(Primitive primitive) {
    switch (primitive) {
        case PRIMITIVE_INT8:
            return "int8";
        case PRIMITIVE_INT16:
            return "int16";
        case PRIMITIVE_INT32:
            return "int32";
        case PRIMITIVE_INT64:
            return "int64";
        case PRIMITIVE_VOID:
            return "void";
        case PRIMITIVE_MISMATCH:
            return "mismatch";
        case PRIMITIVE_UNKNOWN:
            return "unknown";
        default: ;
            char* buffer = (char*)malloc(64);
            sprintf(buffer, "Unknown primitive: %d", primitive);
            return buffer;
    }
}


char* get_node_type_name(NodeType type) {
    switch (type) {
        case NODE_VALUE_INT:
            return "NODE_VALUE_INT";
        case NODE_IDENTIFIER:
            return "NODE_IDENTIFIER";
        case NODE_DECLARE:
            return "NODE_DECLARE";
        case NODE_STORE:
            return "NODE_STORE";
        case NODE_ADD:
            return "NODE_ADD";
        case NODE_SUB:
            return "NODE_SUB";
        case NODE_MUL:
            return "NODE_MUL";
        case NODE_DIV:
            return "NODE_DIV";
        case NODE_PRINT:
            return "NODE_PRINT";
        case NODE_HALT:
            return "NODE_HALT";
        case NODE_UNKNOWN:
            return "NODE_UNKNOWN";
        default: ;
            char* buffer = (char*)malloc(64);
            sprintf(buffer, "Unknown node type: %d", type);
            return buffer;
    }
}

void ast_to_string(AstNode* ast, int level, FILE* file){
    if (!ast) return;
    for (int i = 0; i < level; i++) {
        fprintf(file, "%s", "  ");
    }

    if(ast->type == NODE_IDENTIFIER){
        fprintf(file, "%s: %s %s\n", get_node_type_name(ast->type), get_primitive_name(ast->primitive), ast->value);
        return;
    }

    if(ast->type == NODE_DECLARE){
        fprintf(file, "%s: %s %s\n", get_node_type_name(ast->type), get_primitive_name(ast->primitive), ast->value);
        return;
    }

    fprintf(file, "%s: %s\n", get_node_type_name(ast->type), ast->value);
    ast_to_string(ast->left, level + 1, file);
    ast_to_string(ast->right, level + 1, file);
}

void ast_to_pretty_string(AstNode* ast, int level, FILE* file){
    if (!ast) return;
    for (int i = 0; i < level; i++) {
        fprintf(file, "%s", "  ");
    }

    switch(ast->type){
        case NODE_VALUE_INT:
            fprintf(file, "int(%s)", ast->value);
            break;
        case NODE_DECLARE:
            fprintf(file, "%s %s\n", ast->value, get_primitive_name(ast->primitive));
            break;
        case NODE_STORE:
            fprintf(file, "%s: ", ast->left->value);
            ast_to_pretty_string(ast->right, level, file); 
            fprintf(file, "%s", "\n");
            break;
        case NODE_ADD:
        case NODE_SUB:
        case NODE_MUL:
        case NODE_DIV:
            fprintf(file, "%s(", get_primitive_name(ast->primitive));
            ast_to_pretty_string(ast->left, level, file);

            if(ast->type == NODE_ADD)
                fprintf(file, "%s", " + ");
            else if(ast->type == NODE_SUB)
                fprintf(file, "%s", " - ");
            else if(ast->type == NODE_MUL)
                fprintf(file, "%s", " * ");
            else if(ast->type == NODE_DIV)
                fprintf(file, "%s", " / ");

            ast_to_pretty_string(ast->right, level, file);
            fprintf(file, "%s", ")");
            break;
        case NODE_IDENTIFIER:
            fprintf(file, "%s", ast->value);
            break;
        case NODE_PRINT:
            fprintf(file, "%s", "print ");
            ast_to_pretty_string(ast->left, level, file);
            fprintf(file, "%s", "\n");
            break;
        default:
            ast_to_string(ast, level, file);
    }
}