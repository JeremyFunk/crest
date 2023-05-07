#ifndef LEXER_LANG_H
#define LEXER_LANG_H
#include "../../common.h"
typedef enum {
    // Special tokens
    TOKEN_UNKNOWN = 0,

    // Infered types
    TOKEN_VALUE_INT,
    TOKEN_IDENTIFIER,

    // Primitive types
    TOKEN_TYPE_INT8,
    TOKEN_TYPE_INT16,
    TOKEN_TYPE_INT32,
    TOKEN_TYPE_INT64,

    // Keywords
    TOKEN_DECLARE,
    TOKEN_STORE,

    // Operators
    TOKEN_ADD,
    TOKEN_SUB,
    TOKEN_MUL,
    TOKEN_DIV,

    // Inline Functions
    TOKEN_PRINT,
    
    // Symbols
    TOKEN_HALT,
    TOKEN_COMMA,
    TOKEN_EOF = 999
} TokenType;

typedef struct {
    TokenType type;
    char *value;
} Token;

Token get_null_token();
char* get_token_type_name(TokenType t);

#endif