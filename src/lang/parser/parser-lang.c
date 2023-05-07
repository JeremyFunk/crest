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
        case NODE_MUL:
            return "NODE_MUL";
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