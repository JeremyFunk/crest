section .data
format_int8 db "%hhd", 10, 0
format_int16 db "%hd", 10, 0
format_int32 db "%d", 10, 0
format_int64 db "%ld", 10, 0

section .text
global main
extern printf

main:

sub rsp, 16 ; Calculated stack size

mov dword [rsp + 0], 3
mov dword [rsp + 4], 8
mov eax, dword [rsp + 0]
add eax, dword [rsp + 4]
mov dword [rsp + 8], eax
mov eax, dword [rsp + 8]
imul eax, 3
mov dword [rsp + 12], eax
lea rcx, [format_int32]
mov edx, dword [rsp + 12]
mov rax, 0
call printf
ret
