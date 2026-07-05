@echo off
REM ============================================================
REM  Elira Living - edit the website by just talking to Claude.
REM  Double-click this file, then type what you want in plain
REM  English (e.g. "change the toner price to 32 euros").
REM  Claude edits, rebuilds and publishes the live site for you.
REM ============================================================
cd /d "C:\Claude Code\elira-living"
echo.
echo   Starting Claude Code for Elira Living...
echo   Type what you want changed in plain English, then press Enter.
echo   When you are done, type  /exit
echo.
claude
pause
