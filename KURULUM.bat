@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
set "TEST_MODU="
if /I "%~1"=="--test" set "TEST_MODU=1"

rem Node.js kurulumu gerekirse yonetici yetkisi kullanilir.
if not defined TEST_MODU (
  powershell -NoProfile -Command "if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 0 } else { exit 1 }" >nul 2>&1
  if errorlevel 1 (
    echo Kurulum yonetici izni istiyor. Acilan pencerede Evet'e bas.
    set "WEBHOOK_PANEL_KURULUM=%~f0"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:WEBHOOK_PANEL_KURULUM -Verb RunAs"
    if errorlevel 1 (
      echo [HATA] Yonetici izni alinamadi.
      pause
    )
    exit /b
  )
)

title Webhook Panel - Tam Kurulum
set "KONTROL_MODU="
if /I "%~1"=="--offline" set "KONTROL_MODU=--offline"

echo.
echo ========================================================
echo              WEBHOOK PANEL TAM KURULUM
echo ========================================================
echo Node.js ve npm paketleri otomatik kontrol edilir.
echo Eksik olanlar otomatik yuklenir. Bu pencereyi kapatma.
echo Discord botunu Developer Portal'da sen olusturacaksin.
echo.

if defined TEST_MODU goto :test_modu

call :node_kontrol
if errorlevel 1 goto :hata

echo.
echo [2/5] npm paketleri kontrol ediliyor...
if exist package-lock.json (
  call npm ci --no-audit --no-fund
) else (
  call npm install --no-audit --no-fund
)
if errorlevel 1 (
  echo [HATA] npm paketleri yuklenemedi.
  echo Internet baglantini kontrol edip KURULUM.bat dosyasini tekrar ac.
  goto :hata
)
echo       npm paketleri hazir.

echo.
echo [3/5] Discord bot tokeni ve ayarlar hazirlaniyor...
node scripts\kurulum.js
if errorlevel 1 goto :hata

echo.
echo [4/5] Dosyalar ve Discord baglantisi test ediliyor...
node scripts\sistem-kontrol.js %KONTROL_MODU%
if errorlevel 1 (
  echo Ayarlari duzelttikten sonra KURULUM.bat dosyasini tekrar ac.
  goto :hata
)

echo.
echo [5/5] KURULUM TAMAMLANDI.
echo.
node scripts\kurulum-tamamlandi.js
if errorlevel 1 (
  echo [UYARI] Bot davet penceresi acilamadi.
  echo Discord Developer Portal uzerinden OAuth2 davet linkini olusturabilirsin.
)
echo.
echo Bundan sonra sistemi acmak icin BASLAT.bat dosyasina cift tikla.
echo Kurulumu tekrar yapman gerekmez.
pause
exit /b 0

:test_modu
echo [TEST] Dosyalar ve yerel on kosullar kontrol ediliyor...
where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi.
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)"
if errorlevel 1 (
  echo [HATA] Node.js 18 veya daha yeni bir surum gerekli.
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [HATA] npm bulunamadi.
  exit /b 1
)
if exist "node_modules\discord.js\package.json" (
  echo       npm paketleri hazir.
) else (
  echo       npm paketleri temiz repoda yok; gercek kurulumda otomatik yuklenecek.
)
node --check index.js
if errorlevel 1 exit /b 1
node --check scripts\kurulum.js
if errorlevel 1 exit /b 1
node --check scripts\sistem-kontrol.js
if errorlevel 1 exit /b 1
node --check scripts\kurulum-tamamlandi.js
if errorlevel 1 exit /b 1
node -e "JSON.parse(require('fs').readFileSync('config.example.json','utf8'))"
if errorlevel 1 exit /b 1
node scripts\kurulum-tamamlandi.js --test
if errorlevel 1 exit /b 1
echo [OK] KURULUM.bat testi basarili. Kurulum veya Discord islemi yapilmadi.
exit /b 0

:node_kontrol
echo [1/5] Node.js ve npm kontrol ediliyor...
where node >nul 2>&1
if errorlevel 1 goto :node_kur

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)"
if errorlevel 1 goto :node_guncelle
where npm >nul 2>&1
if errorlevel 1 goto :node_guncelle
for /f "delims=" %%V in ('node --version') do echo       Node.js %%V hazir.
exit /b 0

:node_kur
echo       Node.js bulunamadi. Guncel LTS surumu yuklenecek...
call :winget_kontrol
if errorlevel 1 exit /b 1
winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  echo [HATA] Node.js yuklenemedi.
  exit /b 1
)
goto :node_dogrula

:node_guncelle
echo       Node.js eski veya npm eksik. Guncel LTS surumu yuklenecek...
call :winget_kontrol
if errorlevel 1 exit /b 1
winget upgrade --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
)
if errorlevel 1 (
  echo [HATA] Node.js guncellenemedi.
  exit /b 1
)

:node_dogrula
set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo [HATA] Node.js kuruldu fakat bu pencere goremedi.
  echo Bilgisayari yeniden baslatip KURULUM.bat dosyasini tekrar ac.
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [HATA] npm bulunamadi. Bilgisayari yeniden baslatip kurulumu tekrarla.
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)"
if errorlevel 1 (
  echo [HATA] Node.js 18 veya daha yeni bir surum gerekli.
  exit /b 1
)
for /f "delims=" %%V in ('node --version') do echo       Node.js %%V kuruldu.
exit /b 0

:winget_kontrol
where winget >nul 2>&1
if not errorlevel 1 exit /b 0
echo [HATA] Windows Paket Yoneticisi bulunamadi.
echo Microsoft Store'dan App Installer uygulamasini yukle ve tekrar dene.
start "" "ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1"
exit /b 1

:hata
echo.
echo ========================================================
echo KURULUM TAMAMLANAMADI
echo Yukaridaki hata mesajini kontrol edip kurulumu tekrar ac.
echo ========================================================
if defined TEST_MODU exit /b 1
pause
exit /b 1
