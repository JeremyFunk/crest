@echo off
setlocal enabledelayedexpansion
set "gcc_cmd=gcc"

for /R src %%f in (*.c) do (
    set "gcc_cmd=!gcc_cmd! "%%f""
)

%gcc_cmd% -o bin/compiler.exe
endlocal
