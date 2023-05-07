section .data
format_int8 db "%hhd", 10, 0
format_int16 db "%hd", 10, 0
format_int32 db "%d", 10, 0
format_int64 db "%ld", 10, 0

section .text
global main
extern printf

main:

sub rsp, 8 ; Calculated stack size

mov word [rsp + 0], 12
mov word [rsp + 2], 23
mov ax, word [rsp + 0]
add ax, word [rsp + 2]
mov word [rsp + 4], ax
mov ax, word [rsp + 4]
imul ax, 3
mov word [rsp + 6], ax
lea rcx, [format_int16]
movzx edx, word [rsp + 6]
mov rax, 0
call printf
