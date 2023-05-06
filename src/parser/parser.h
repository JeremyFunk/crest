#include "../common.h"
#include "../lexer/lexer.h"

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

    PRIMITIVE_VOID = 2998,
    PRIMITIVE_UNKNOWN = 2999,
} Primitive;

bool is_primitive(Primitive primitive) {
    return primitive >= PRIMITIVE_INT8 && primitive <= PRIMITIVE_UNKNOWN;
}

bool is_primitive_int(Primitive primitive) {
    return primitive >= PRIMITIVE_INT8 && primitive <= PRIMITIVE_INT64;
}


char* get_primitive_name(Primitive primitive) {
    if(primitive > PRIMITIVE_UNKNOWN) return "Unknown primitive type. Primitive type is greater than last primitive type.";

    switch (primitive) {
        case PRIMITIVE_INT8:
            return "int8";
        case PRIMITIVE_INT16:
            return "int16";
        case PRIMITIVE_INT32:
            return "int32";
        case PRIMITIVE_INT64:
            return "int64";
        default:
            return "Unknown primitive";
    }
}

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


Token token; // Global variable to store the current token
IdentifierDeclaration *identifier_declarations = NULL;

// Get the name of a node type
const char *get_node_type_name(NodeType type) {
    if (type > NODE_UNKNOWN) return "Unknown node type. Node type is greater than last node type.";

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
        default:
            return "Unknown node type";
    }
}

Primitive parse_primitive_type(AstNode* from, AstNode* to) {
    if(from->type == NODE_IDENTIFIER && to->type == NODE_IDENTIFIER) {
        if(from->primitive == to->primitive) {
            return from->primitive;
        }
        return PRIMITIVE_UNKNOWN;
    }

    if (from->type == NODE_VALUE_INT && to->type == NODE_IDENTIFIER && is_primitive_int(to->primitive)) {
        return to->primitive;
    }

    if (from->type == NODE_IDENTIFIER && is_primitive_int(from->primitive) && to->type == NODE_VALUE_INT) {
        return from->primitive;
    }

    return PRIMITIVE_UNKNOWN;
}

long begin_parse(FILE *file) {
    return ftell(file);
}

void restore_parse(FILE *file, long pos) {
    fseek(file, pos, SEEK_SET);
}

AstNode *create_ast_node(NodeType type, AstNode *left, AstNode *right, char *value, Primitive primitive) {
    AstNode *node = malloc(sizeof(AstNode));
    node->type = type;
    node->left = left;
    node->right = right;
    node->value = value;
    node->primitive = primitive;
    return node;
}

AstNode *declare_ast_identifier(AstNode *left, AstNode *right, char *value, Primitive primitive) {
    AstNode *node = malloc(sizeof(AstNode));
    node->type = NODE_DECLARE;
    node->left = left;
    node->right = right;
    node->value = value;
    node->primitive = primitive;

    // Add the identifier to the list of declarations
    IdentifierDeclaration *declaration = malloc(sizeof(IdentifierDeclaration));
    declaration->name = strdup(value);
    declaration->type = primitive;

    if(identifier_declarations == NULL) {
        declaration->prev = NULL;
    }else{
        declaration->prev = identifier_declarations;
    }

    identifier_declarations = declaration;

    return node;
}



void consume_next_token(FILE *file) {
    token = get_next_token(file);
}

// Forward declarations
AstNode *parse_identifier(FILE *file);
AstNode *parse_int_value(FILE *file);
AstNode *parse_identifier_or_value(FILE *file);
AstNode *parse_identifier_declaration(FILE *file);
AstNode *parse_add(FILE *file);
AstNode *parse_mul(FILE *file);
AstNode *parse_operation(FILE *file);
AstNode *parse_instruction(FILE *file);
AstNode *parse_declare(FILE *file);
AstNode *parse_print_int(FILE *file);
AstNode *parse_halt(FILE *file);


AstNode *parse_int_value(FILE *file) {
    if (token.type == TOKEN_VALUE_INT) {
        char *value = strdup(token.value);
        consume_next_token(file);
        return create_ast_node(NODE_VALUE_INT, NULL, NULL, value, PRIMITIVE_UNKNOWN);
    }
    return NULL;
}

AstNode *parse_identifier_declaration(FILE *file) {
    if(token.type == TOKEN_IDENTIFIER) {
        char *value = strdup(token.value);

        Primitive type = PRIMITIVE_UNKNOWN;
        consume_next_token(file); // Consume comma
        consume_next_token(file);
        
        if (token.type == TOKEN_TYPE_INT8) {
            type = PRIMITIVE_INT8;
        } else if (token.type == TOKEN_TYPE_INT16) {
            type = PRIMITIVE_INT16;
        } else if (token.type == TOKEN_TYPE_INT32) {
            type = PRIMITIVE_INT32;
        } else if (token.type == TOKEN_TYPE_INT64) {
            type = PRIMITIVE_INT64;
        }

        if (type != PRIMITIVE_UNKNOWN) {
            consume_next_token(file);
            return declare_ast_identifier(NULL, NULL, value, type);
        }

        fprintf(stderr, "Error: Expected type after identifier\n");
        return declare_ast_identifier(NULL, NULL, value, type);
    }

    return NULL;
}

AstNode* parse_identifier(FILE *file) {
    if (token.type == TOKEN_IDENTIFIER) {
        char *value = strdup(token.value);

        // Check if the identifier has been declared
        IdentifierDeclaration *declaration = identifier_declarations;
        while (declaration != NULL) {
            if (strcmp(declaration->name, value) == 0) {
                consume_next_token(file);
                AstNode* n = create_ast_node(NODE_IDENTIFIER, NULL, NULL, value, declaration->type);
                return n;
            }
            declaration = declaration->prev;
        }
        
        fprintf(stderr, "Error: Identifier '%s' has not been declared\n", value);

        consume_next_token(file);
        return create_ast_node(NODE_IDENTIFIER, NULL, NULL, value, PRIMITIVE_UNKNOWN);
    }
    return NULL;
}

AstNode *parse_identifier_or_value(FILE *file) {
    AstNode* identifier = parse_identifier(file);
    if (identifier) {
        return identifier;
    } else if (token.type == TOKEN_VALUE_INT) {
        return parse_int_value(file);
    }
    return NULL;
}

AstNode *parse_add(FILE *file) {
    if (token.type == TOKEN_ADD) {
        consume_next_token(file);
        
        AstNode *left = parse_identifier_or_value(file);
        
        if (!left) {
            fprintf(stderr, "Error: Expected identifier after 'add'\n");
            return NULL;
        }
        consume_next_token(file); // Consume comma

        AstNode *right = parse_identifier_or_value(file);
        if (!right) {
            fprintf(stderr, "Error: Expected identifier after comma in 'add'\n");
            return NULL;
        }
        
        Primitive p = parse_primitive_type(left, right);

        if (p == PRIMITIVE_UNKNOWN){
            fprintf(stderr, "Error: Incompatible types in 'add': %s, %s\n", get_node_type_name(left->type), get_node_type_name(right->type));
            return NULL;
        }

        return create_ast_node(NODE_ADD, left, right, NULL, p);
    }
    return NULL;
}

AstNode *parse_mul(FILE *file) {
    if (token.type == TOKEN_MUL) {
        consume_next_token(file);
        AstNode *left = parse_identifier_or_value(file);
        if (!left) {
            fprintf(stderr, "Error: Expected identifier after 'mul'\n");
            return NULL;
        }
        consume_next_token(file); // Consume comma
        AstNode *right = parse_identifier_or_value(file);
        if (!right) {
            fprintf(stderr, "Error: Expected identifier after comma in 'mul'\n");
            return NULL;
        }

        Primitive p = parse_primitive_type(left, right);

        if (p == PRIMITIVE_UNKNOWN){
            fprintf(stderr, "Error: Incompatible types in 'mul': %s, %s\n", get_node_type_name(left->type), get_node_type_name(right->type));
            return NULL;
        }

        return create_ast_node(NODE_MUL, left, right, NULL, p);
    }
    return NULL;
}

AstNode *parse_operation(FILE *file) {
    AstNode *node = parse_add(file);
    if (node) {
        return node;
    }
    node = parse_mul(file);
    if (node) {
        return node;
    }
    return NULL;
}


AstNode *parse_declare(FILE *file) { 
    if (token.type == TOKEN_DECLARE) {
        consume_next_token(file);
        AstNode *identifier = parse_identifier_declaration(file);
        if (!identifier) {
            fprintf(stderr, "Error: Expected identifier after 'declare'\n");
            return NULL;
        }
        return identifier;
    }
    return NULL;
}

AstNode *parse_store(FILE *file) {
    if (token.type == TOKEN_STORE) {
        consume_next_token(file);

        AstNode *identifier = parse_identifier(file);
        if (!identifier) {
            fprintf(stderr, "Error: Expected identifier after 'store'\n");
            return NULL;
        }
        consume_next_token(file); // Consume comma
        
        AstNode *value = parse_int_value(file);
        if (!value) {
            value = parse_operation(file);
            if (!value) {
                fprintf(stderr, "Error: Expected int32 value or operation after 'store'\n");
                return NULL;
            }
        }

        return create_ast_node(NODE_STORE, identifier, value, NULL, PRIMITIVE_VOID);
    }
    return NULL;
}

AstNode *parse_print_int(FILE *file) {
    if (token.type == TOKEN_PRINT) {
        consume_next_token(file);
        AstNode *identifier = parse_identifier(file);
        if (!identifier) {
            fprintf(stderr, "Error: Expected identifier after 'print'\n");
            return NULL;
        }
        return create_ast_node(NODE_PRINT, identifier, NULL, NULL, PRIMITIVE_VOID);
    }
    return NULL;
}

AstNode *parse_halt(FILE *file) {
    if (token.type == TOKEN_HALT) {
        consume_next_token(file);
        return create_ast_node(NODE_HALT, NULL, NULL, NULL, PRIMITIVE_VOID);
    }
    return NULL;
}


// ... Add more parsing functions for other instructions

AstNode *parse_instruction(FILE *file) {
    AstNode *instruction = parse_declare(file);
    if (instruction) return instruction;

    instruction = parse_store(file);
    if (instruction) return instruction;

    instruction = parse_add(file);
    if (instruction) return instruction;

    instruction = parse_mul(file);
    if (instruction) return instruction;

    instruction = parse_print_int(file);
    if (instruction) return instruction;

    instruction = parse_halt(file);
    if (instruction) return instruction;

    return NULL;
}

AstNode *parse_expression(FILE *file) {
    // fprintf(stderr, "Parsing...\n");

    AstNode *node = parse_instruction(file);
    if (!node) {
        fprintf(stderr, "Error: Unexpected token '%s'\n", get_node_type_name(token.type));
        return NULL;
    }
    return node;
}

