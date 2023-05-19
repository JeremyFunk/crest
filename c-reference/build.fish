set mode $argv[1]


if [ "$mode" = "c" ]
    gcc -fno-asynchronous-unwind-tables -fno-exceptions -fno-rtti -fverbose-asm \
        -Wall -Wextra  main.c -O3 -S -o main.asm
end
as -o object.o main.asm
ld -macosx_version_min 13.0.0 -o executable object.o -lSystem -syslibroot $(xcrun -sdk macosx --show-sdk-path) -arch arm64
./executable