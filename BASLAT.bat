@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Webhook Panel - Baslat
cd /d "%~dp0"
set "TEST_MODU="
set "KONTROL_MODU="
if /I "%~1"=="--test" (
  set "TEST_MODU=1"
  set "KONTROL_MODU=--offline"
)

echo.
echo ========================================================
echo                    WEBHOOK PANEL
echo ========================================================

where node >nul 2>&1
if errorlevel 1 goto :kurulum
if not exist config.json goto :kurulum
if not exist node_modules\discord.js\package.json goto :kurulum

node scripts\sistem-kontrol.js %KONTROL_MODU%
if errorlevel 1 goto :kontrol_hatasi

if defined TEST_MODU (
  echo BASLAT.bat testi basarili.
  exit /b 0
)

echo.
echo Bot baslatiliyor. Durdurmak icin CTRL+C tuslarina bas.
echo.
call npm start
set "CIKIS_KODU=%errorlevel%"

echo.
echo Bot kapandi.
pause
exit /b %CIKIS_KODU%

:kurulum
echo Kurulum eksik veya bozuk.
echo Once KURULUM.bat dosyasina cift tikla.
pause
exit /b 1

:kontrol_hatasi
echo.
echo Sistem kontrolu basarisiz. KURULUM.bat dosyasini tekrar calistir.
pause
exit /b 1
