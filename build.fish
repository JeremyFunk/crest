as -o object.o example.s
ld -macosx_version_min 13.0.0 -o executable object.o -lSystem -syslibroot $(xcrun -sdk macosx --show-sdk-path) -e _start -arch arm64 