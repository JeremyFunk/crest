# Things to consider

## Registers 
x0-x19 are voiltile, meaning fully temprary (also called, caller-saved registers). They can do anything, there is no need to preserve them.
x19-x29 are non-volitle, meaning function invocation will not change their content (also called callee-saved registers). They need to be restored before a function returns.

x29 holds the frame pointer, and is saved between function calls.
x30 is the procedure call link register (LR) is preserved between function calls. It holds the return address when a function is called.

For performance reasons it is helpful to make use of folded spills. These are single instructions that allow two registers to be saved at once:

STP x30, x29 [sp, #48] ; Total stack size of function is 64, so the two registers take up bytes 48-64 (16 bytes, as each x-register is 8 bytes.)


x0-x7 hold function arguments. If a function receives more arguments, the arguments are allocated on the stack. The first argument is in x0, second in x1 and so on.
All further function arguments are written to the stack. Arguments 9 and 10 for example would be passed as:
ADD sp, sp, #16
STP x9, x10, [sp]

x0-x1 hold return values. If a function returns more than 16 bytes, x8 will hold a hidden argument that get's passed to the callee. The callee will write to the memory address, and the caller is responsible for managing the memory.

## Alignment
AArch64 requires 16 byte aligned stack pointer addresses for all function calls and some instructions like LDP and STP. It is also faster (execution time) when handling 16-byte aligned data.
It is a valid strategy to always keep the stack pointer 16-byte aligned.