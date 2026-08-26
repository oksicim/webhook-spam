const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const testModu = process.argv.includes("--test");
const kok = path.resolve(__dirname, "..");

function uygulamaIdOku() {
  if (testModu) return "123456789012345678";
  const config = JSON.parse(fs.readFileSync(path.join(kok, "config.json"), "utf8"));
  return String(config.clientId || "");
}

const uygulamaId = uygulamaIdOku();
if (!/^\d{17,20}$/.test(uygulamaId)) {
  console.error("[HATA] Bot davet baglantisi icin gecerli Application ID bulunamadi.");
  process.exit(1);
}

const davetLinki =
  `https://discord.com/oauth2/authorize?client_id=${uygulamaId}` +
  "&permissions=68608&scope=bot";

if (testModu) {
  console.log("[OK] Kurulum sonu davet baglantisi ve Windows mesaji hazir.");
  process.exit(0);
}

const baslik = "Webhook Panel - Kurulum Tamamlandi";
const mesaj = [
  "KURULUM TAMAMLANDI!",
  "",
  "Bot davet baglantisi panoya kopyalandi.",
  "",
  "Tamam'a bastiginda Discord davet sayfasi acilacak:",
  "1. Botu eklemek istedigin sunucuyu sec.",
  "2. Yetkilendir / Davet Et adimini tamamla.",
  "3. Developer Portal'da Message Content Intent'i ac.",
  "4. Ardindan BASLAT.bat dosyasina cift tikla.",
].join("\r\n");

const powershellKomutu = [
  "$ErrorActionPreference = 'Stop'",
  "Add-Type -AssemblyName PresentationFramework",
  "Set-Clipboard -Value $env:WEBHOOK_PANEL_DAVET_LINKI",
  "[System.Windows.MessageBox]::Show($env:WEBHOOK_PANEL_KURULUM_MESAJI, $env:WEBHOOK_PANEL_KURULUM_BASLIK, [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Information) | Out-Null",
  "Start-Process -FilePath $env:WEBHOOK_PANEL_DAVET_LINKI",
].join("; ");

const sonuc = spawnSync(
  "powershell.exe",
  ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-Command", powershellKomutu],
  {
    encoding: "utf8",
    windowsHide: true,
    env: {
      ...process.env,
      WEBHOOK_PANEL_DAVET_LINKI: davetLinki,
      WEBHOOK_PANEL_KURULUM_MESAJI: mesaj,
      WEBHOOK_PANEL_KURULUM_BASLIK: baslik,
    },
  },
);

if (sonuc.status !== 0) {
  console.log("Windows bilgi penceresi acilamadi. Bot davet baglantisi:");
  console.log(davetLinki);
  process.exit(0);
}

console.log("Bot davet baglantisi panoya kopyalandi ve tarayicida acildi.");
