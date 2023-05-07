#include "lexer-lang.h"


Token get_null_token(){
    Token token;
    token.type = TOKEN_UNKNOWN;
    token.value = NULL;
    return token;
}


char* get_token_type_name(TokenType t){
    switch(t){
        case TOKEN_UNKNOWN:
            return "TOKEN_UNKNOWN";
        case TOKEN_VALUE_INT:
            return "TOKEN_VALUE_INT";
        case TOKEN_IDENTIFIER:
            return "TOKEN_IDENTIFIER";
        case TOKEN_TYPE_INT8:
            return "TOKEN_TYPE_INT8";
        case TOKEN_TYPE_INT16:
            return "TOKEN_TYPE_INT16";
        case TOKEN_TYPE_INT32:
            return "TOKEN_TYPE_INT32";
        case TOKEN_TYPE_INT64:
            return "TOKEN_TYPE_INT64";
        case TOKEN_DECLARE:
            return "TOKEN_DECLARE";
        case TOKEN_STORE:
            return "TOKEN_STORE";
        case TOKEN_ADD:
            return "TOKEN_ADD";
        case TOKEN_MUL:
            return "TOKEN_MUL";
        case TOKEN_PRINT:
            return "TOKEN_PRINT";
        case TOKEN_HALT:
            return "TOKEN_HALT";
        case TOKEN_COMMA:
            return "TOKEN_COMMA";
        case TOKEN_EOF:
            return "TOKEN_EOF";
        default: ;
            char* buffer = (char*)malloc(64);
            sprintf(buffer, "Unknown token type: %d", t);
            return buffer;
    }
}