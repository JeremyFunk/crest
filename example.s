
.global _start
.align 4

_start:
    STP X29, LR, [SP, #-32]!    ; Save LR, FR

    BL main                     ; Call main

    MOV	X0, #0                  ; Return 0
    LDP	X29, LR, [SP], #32      ; Restore FR, LR
    RET

main:
    STP X29, LR, [SP, #-16]!    ; Save LR, FR
    

    MOV X0, #0
    STR X0, [SP, #0]
    
    SUB SP, SP, #16
loop:
    
    LDR X1, [SP, #16]
    STR X1, [SP, #0]


    ADRP X0, printFormat1Long@PAGE // printf format str
    ADD X0, X0, printFormat1Long@PAGEOFF

    BL _printf

    LDR X0, [SP, #16]
    ADD X0, X0, #1
    STR X0, [SP, #16]

    
    LDR X0, [SP, #16]
    
    MOV X1, #100
    CMP X0, X1
    BNE loop

loopEnd:
    ADD SP, SP, #16

    LDP	X29, LR, [SP], #16      ; Restore FR, LR
    RET

.data
printFormat1Long: .asciz "%ld\n"
printFormat1Int: .asciz "%d\n"
.align 4
.text
