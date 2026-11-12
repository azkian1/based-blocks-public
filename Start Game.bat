@echo off
title BASED BLOCKS
cd /d "%~dp0"
echo Starting BASED BLOCKS...
echo.
start http://localhost:3000
npm run dev
