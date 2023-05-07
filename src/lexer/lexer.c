#include "lexer.h"

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
    Token token = get_null_token();
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
        } else if (strcmp(buffer, "sub") == 0) {
            token.type = TOKEN_SUB;
        } else if (strcmp(buffer, "mul") == 0) {
            token.type = TOKEN_MUL;
        } else if (strcmp(buffer, "div") == 0) {
            token.type = TOKEN_DIV;
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
