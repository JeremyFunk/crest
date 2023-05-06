section .data
format_int8 db "%hhd", 10, 0
format_int16 db "%hd", 10, 0
format_int32 db "%d", 10, 0
format_int64 db "%ld", 10, 0

section .text
global main
extern printf

main:

sub rsp, 4 ; Calculated stack size

mov byte [rsp + 0], 3
mov byte [rsp + 1], 8
mov al, byte [rsp + 0]
add al, byte [rsp + 1]
mov byte [rsp + 2], al
mov al, byte [rsp + 2]
imul al, 3
mov byte [rsp + 3], al
lea rcx, [format_int8]
movzx edx, byte [rsp + 3]
mov rax, 0
call printf

ret
