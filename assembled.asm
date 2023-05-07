section .data
format_int8 db "%hhu", 10, 0
format_int16 db "%hd", 10, 0
format_int32 db "%d", 10, 0
format_int64 db "%ld", 10, 0

section .text
global main
extern printf

main:

sub rsp, 11 ; Calculated stack size


; a: int(24)
mov byte [rsp + 0], 24

; b: int(6)
mov byte [rsp + 1], 6

; c: int8(a / b)
xor ax, ax
mov al, byte [rsp + 0]
div byte [rsp + 1]
mov byte [rsp + 2], al

; print c
lea rcx, [format_int8]
xor dx, dx
mov dl, byte [rsp + 2]
mov rax, 0
call printf
