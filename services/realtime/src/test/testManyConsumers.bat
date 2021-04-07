@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

set Token=MAIN_%RANDOM%_%CD%

set CHAT_ID=4e9db3cb-0ba1-4658-91c6-28146aacedbc
set CONFERENCE_SLUG=conf1
set USER_ID=user1
set ATTENDEE_ID=923c13db-89b8-4038-a4a7-90c4be102d11
SET MPS=10
SET SILENT_MODE=true

set WINDOW_TITLE=%Token%_Pub
echo Starting publisher
start cmd /C npm run test-publisher
timeout 10

set /a n=10

for /l %%x in (1, 1, %n%) do (
    echo Starting %%x
    set USER_ID=user%%x
    set WINDOW_TITLE=%Token%_%%x
    start cmd /C npm run test-consumer

    set /a t=%%x %% 5
    if !t! == 0 (
        timeout 10
    )
)

pause

taskkill /fi "WINDOWTITLE eq %Token%_Pub"
for /l %%x in (1, 1, %n%) do (
    taskkill /fi "WINDOWTITLE eq %Token%_%%x"
)

@echo on
