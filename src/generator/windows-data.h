

int int_size(AstNode* node){
    switch(node->primitive){
        case PRIMITIVE_INT8:
            return 1;
        case PRIMITIVE_INT16:
            return 2;
        case PRIMITIVE_INT32:
            return 4;
        case PRIMITIVE_INT64:
            return 8;
    }
}