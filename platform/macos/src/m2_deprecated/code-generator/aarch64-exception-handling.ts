import { AArch64InstructionWrapper } from "./aarch64-low-level"

const ErrorClasses = 
{
    "assertion": {
        defaultMessage: "Assertion failed.",
        errors: {
            'equals': {
                errorCode: 1025,
                message: "Assertion failed, expected %ld to be %ld."
            },
            'not_equals': {
                errorCode: 1026,
                message: "Assertion failed, expected %ld to not be %ld."
            },
            'less_than': {
                errorCode: 1027,
                message: "Assertion failed, expected %ld to be less than %ld."
            },
            'less_than_equals': {
                errorCode: 1028,
                message: "Assertion failed, expected %ld to be less than or equal to %ld."
            },
            'greater_than': {
                errorCode: 1029,
                message: "Assertion failed, expected %ld to be greater than %ld."
            },
            'greater_than_equals': {
                errorCode: 1030,
                message: "Assertion failed, expected %ld to be greater than or equal to %ld."
            },
        }
    }
} as const;

const ErrorHandlers = Object.entries(ErrorClasses).map(errorClass => 
    Object.entries(errorClass[1].errors).map(error => `error_handler_${error[1]}_${error[0]})`)
)

type ErrorClassShortCode =  keyof typeof ErrorClasses;
type ErrorShortCode<T extends ErrorClassShortCode> = keyof typeof ErrorClasses[T]['errors']

export function getErrorCodeForOperator(operator: string){
    switch(operator){
        case '==': return 'equals';
        case '!=': return 'not_equals';
        case '<': return 'less_than';
        case '<=': return 'less_than_equals';
        case '>': return 'greater_than';
        case '>=': return 'greater_than_equals';
        default: throw new Error(`The operator ${operator} is not supported.`);
    }
}

export function getErrorCode(errorClass: ErrorClassShortCode, error: ErrorShortCode<typeof errorClass>){
    const errorClassObject = ErrorClasses[errorClass];
    if(!errorClassObject) throw new Error(`The error class ${errorClass} does not exist.`);

    const errorObject = errorClassObject.errors[error];
    if(!errorObject) throw new Error(`The error ${error} does not exist in the error class ${errorClass}.`);

    return errorObject.errorCode;

}

export function generateErrorDataSection(){
    return `
    error_unknown: .asciz "An unknown error with code %ld occurred."
    ${
        Object.values(ErrorClasses['assertion'].errors).map(error => `error_${error.errorCode}: .asciz "${error.message}"`)
        .join('\n')
    }
`
}

export function generateErrorHandlers() {
    return `
    
    ; This is the error handler. It is called when an error occurs.
    ; The error code is passed in X0.
    _error:
        ${
            Object.entries(ErrorClasses).map(errorClass =>
                Object.entries(errorClass[1].errors).map(error => {
                    return `
                        CMP X0, #${error[1].errorCode}
                        B.EQ _error_handler_${errorClass[0]}_${error[0]}
                    `
                }).join('\n')
            ).join('\n')
        }
        BL _error_handler_default

    ${defaultErrorHandler()}
    ${assertionErrorHandler()}
    `
}

function defaultErrorHandler() {
    return `
    _error_handler_default:
        ${AArch64InstructionWrapper.loadRegisterInRegister('X0', 'X1')} ; Move the error code to X1 for printing

        ADRP X0, error_unknown@PAGE
        ADD X0, X0, error_unknown@PAGEOFF
        BL _printf

        ${AArch64InstructionWrapper.loadLiteralInRegister(1, 'X0')}
        RET
    `
}
function assertionErrorHandler() {
    const handlers = []
    const errorClass = ErrorClasses['assertion'];
    for(const error of Object.entries(errorClass.errors)){
        if('handler' in error[1] && error[1].handler) continue;

        handlers.push(`
        _error_handler_assertion_${error[0]}:

            ADRP X0, error_${error[1].errorCode}@PAGE
            ADD X0, X0, error_${error[1].errorCode}@PAGEOFF
            STP X1, X2, [SP, #-16]!
            BL _printf

            ${AArch64InstructionWrapper.loadLiteralInRegister(1, 'X0')}
            BL _exit
        `)
    }

    return handlers.join('\n')
}
