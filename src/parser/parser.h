 #ifndef PARSER_H
#define PARSER_H

#include "../lexer/lexer.h"
#include "../lang/parser/parser-lang.h"

/*
* This function resolves the primitive type of the given identifiers.
* It can return the following values:
*
* If both are identifiers:
*   PRIMITIVE_MISMATCH: If the types of the identifiers are not the same
*   PRIMITIVE_INT8, PRIMITIVE_INT16, PRIMITIVE_INT32, PRIMITIVE_INT64: If the types of the identifiers are the same
*
* If one is an identifier and the other is an integer value or an unresolved integer:
*   PRIMITIVE_MISMATCH: If the identifier is not an integer
*   PRIMITIVE_INT8, PRIMITIVE_INT16, PRIMITIVE_INT32, PRIMITIVE_INT64, PRIMITIVE_UNRESOLVED_INT: If the identifier is an integer
*
* If both are integer values or unresolved integers:
*   PRIMITIVE_UNRESOLVED_INT: If both are unresolved integers
*
*  PRIMITIVE_UNKNOWN: If the types of the integers are not the same
*
*
*/
Primitive parse_primitive_type(AstNode* from, AstNode* to);

// Forward declarations
void setup_parser(FILE *file);

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

AstNode *parse_expression(FILE *file);

#endif