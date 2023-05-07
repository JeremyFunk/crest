#ifndef LEXER_H
#define LEXER_H

#include "../common.h"
#include "../lang/lexer/lexer-lang.h"

bool is_whitespace(char c);
bool is_alpha(char c);
bool is_digit(char c);

/*
*
*   This function is used to get the next token from the file.
*
*/
Token get_next_token(FILE *file);

#endif