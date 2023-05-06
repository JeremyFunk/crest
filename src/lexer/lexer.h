#include "../common.h"
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
    TOKEN_MUL,

    // Functions
    TOKEN_PRINT,
    
    // Symbols
    TOKEN_HALT,
    TOKEN_COMMA,
    TOKEN_EOF = 999
} TokenType;

char* get_token_type_name(TokenType t){
    if(t > TOKEN_EOF){
        return "Unknown token type. Token type is greater than last token type.";
    }

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
        default:
            return "Unknown token type";
    }
}

typedef struct {
    TokenType type;
    char *value;
} Token;

Token clone_token(Token token) {
    Token clone = {token.type, NULL};
    if (token.value != NULL) {
        clone.value = strdup(token.value);
    }
    return clone;
}

bool is_whitespace(char c) {
    return c == ' ' || c == '\t' || c == '\r' || c == '\n';
}

bool is_alpha(char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

bool is_digit(char c) {
    return c >= '0' && c <= '9';
}

Token get_next_token(FILE *file) {
    Token token = {TOKEN_UNKNOWN, NULL};
    int c;

    // Skip whitespace
    do {
        c = fgetc(file);
    } while (is_whitespace(c));


    // Check for EOF
    if (c == EOF) {
        token.type = TOKEN_EOF;
        // fprintf(stderr, "Next Token: EOF\n");
        return token;
    }

    // Parse identifier or keyword
    if (is_alpha(c)) {
        char buffer[128];
        int pos = 0;
        do {
            buffer[pos++] = (char)c;
            c = fgetc(file);
        } while (is_alpha(c) || is_digit(c) || c == '_');
        buffer[pos] = '\0';
        // Put back the last character if it is not EOF
        if (c != EOF) {
            ungetc(c, file);
        }

        // Check for keywords
        if (strcmp(buffer, "declare") == 0) {
            token.type = TOKEN_DECLARE;
        } else if (strcmp(buffer, "store") == 0) {
            token.type = TOKEN_STORE;
        } else if (strcmp(buffer, "add") == 0) {
            token.type = TOKEN_ADD;
        } else if (strcmp(buffer, "mul") == 0) {
            token.type = TOKEN_MUL;
        } else if (strcmp(buffer, "print") == 0) {
            token.type = TOKEN_PRINT;
        } else if (strcmp(buffer, "halt") == 0) {
            token.type = TOKEN_HALT;
        } else if (strcmp(buffer, "int8") == 0) {
            token.type = TOKEN_TYPE_INT8;
        } else if (strcmp(buffer, "int16") == 0) {
            token.type = TOKEN_TYPE_INT16;
        } else if (strcmp(buffer, "int32") == 0) {
            token.type = TOKEN_TYPE_INT32;
        } else if (strcmp(buffer, "int64") == 0) {
            token.type = TOKEN_TYPE_INT64;
        } else {
            token.type = TOKEN_IDENTIFIER;
            token.value = strdup(buffer);
        }

        // fprintf(stderr, "Next Token: %s\n", buffer);
    }
    // Parse integer literals
    else if (is_digit(c)) {
        char buffer[16];
        int pos = 0;
        do {
            buffer[pos++] = (char)c;
            c = fgetc(file);
        } while (is_digit(c));
        buffer[pos] = '\0';

        token.type = TOKEN_VALUE_INT;
        token.value = strdup(buffer);

        if (c != EOF) {
            ungetc(c, file);
        }

        // fprintf(stderr, "Next Token: %s\n", buffer);
    }
    // Parse special characters
    else if (c == ',') {
        token.type = TOKEN_COMMA;
        // fprintf(stderr, "Next Token: ,\n");
    }
    // Return the unknown token for unrecognized characters
    else {
        token.type = TOKEN_UNKNOWN;
        // fprintf(stderr, "Next Token: Unknown\n");
    }


    return token;
}
