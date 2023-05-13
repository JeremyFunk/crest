// Source: https://github.com/below/HelloSilicon/blob/main/Chapter%2009/test.s


.global _start	            // Provide program starting address
.align 4

_start:	
	stp	x29, LR, [sp, #-16]!     ; Save LR, FR

        sub SP, SP, #32	// Allocate stack space
        mov X0, #0
        str X0, [SP, #-32]!
        mov X0, #1
        str X0, [SP, #8]
loop:
        ldr X4, [SP, #8]
        mov X5, #2
        mul X3, X4, X5
        str X3, [SP]

        adrp X0, ptfStr@PAGE // printf format str
	add X0, X0, ptfStr@PAGEOFF

	bl _printf	// call printf
        
        ldr X4, [SP, #8]
        add X4, X4, #1
        str X4, [SP, #8]
        cmp X4, #100
        bne loop

loopEnd:

        mov X1, X4

        bl printCompleted

        add SP, SP, #32	// Clean up stack
	MOV	X0, #0		// return code
	ldp	x29, LR, [sp], #16     ; Restore FR, LR
	RET


printCompleted:
        adrp X0, constantValue@PAGE // printf format str
        add	X0, X0, constantValue@PAGEOFF
        str X1, [SP]

        bl	    _printf	// call printf

        RET
.data
ptfStr: .asciz	"Hello World %ld\n"
constantValue: .asciz "This was \"completed\" with a loop with %ld iterations.\n"
.align 4
.text