// Source: https://smist08.wordpress.com/2021/01/08/apple-m1-assembly-language-hello-world/

.global _start
.align 2 // Align on 64 bit boundary

// Setup the parameters to print hello world
// and then call Linux to do it.

_start: mov X0, #1     // 1 = StdOut
        adr X1, helloworld // string to print
        mov X2, #13     // length of our string
        mov X16, #4     // MacOS write system call
        svc 0     // Call linux to output the string


        mov     X0, #0      // Use 0 return code
        mov     X16, #1     // Service command code 1 terminates this program
        svc     0           // Call MacOS to terminate the program

helloworld:      .ascii  "Hello World!\n"

