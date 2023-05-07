#ifndef PARSER_LANG_H
#define PARSER_LANG_H
#include "../../common.h"
typedef enum {
    // Infered types
    NODE_VALUE_INT = 1000,

    // Keywords
    NODE_DECLARE,
    NODE_STORE,

    // Operators
    NODE_ADD,
    NODE_MUL,

    // Functions
    NODE_PRINT,


    // Symbols
    NODE_HALT,
    NODE_IDENTIFIER,
    NODE_UNKNOWN = 1999,
} NodeType;

typedef enum {
    PRIMITIVE_INT8 = 2000,
    PRIMITIVE_INT16,
    PRIMITIVE_INT32,
    PRIMITIVE_INT64,
    // Used when the type is not yet resolved. E.g. 3 + 4
    PRIMITIVE_UNRESOLVED_INT,

    PRIMITIVE_VOID = 2997,
    PRIMITIVE_MISMATCH = 2998,
    PRIMITIVE_UNKNOWN = 2999,
} Primitive;

typedef struct AstNode {
    NodeType type;
    struct AstNode *left;
    struct AstNode *right;
    char *value;
    Primitive primitive;
} AstNode;

typedef struct IdentifierDeclaration {
    char *name;
    Primitive type;
    struct IdentifierDeclaration *prev;
} IdentifierDeclaration;

AstNode *create_ast_node(NodeType type, AstNode *left, AstNode *right, char *value, Primitive primitive);

bool is_primitive(Primitive primitive);
bool is_primitive_int(Primitive primitive);

char* get_primitive_name(Primitive primitive);
char* get_node_type_name(NodeType type);

#endif