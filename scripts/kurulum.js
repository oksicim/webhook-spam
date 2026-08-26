const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline/promises");

const kok = path.resolve(__dirname, "..");
const configYolu = path.join(kok, "config.json");
const sadeceConfigKontrol = process.argv.includes("--config-kontrol");

function bosVeyaOrnek(deger) {
  if (typeof deger !== "string" || !deger.trim()) return true;
  return /(BURAYA|TOKENI|TOKENINI|TOKENİNİ|CLIENT.?ID|UYGULAMA_ID|BOTUN|your-|change-this)/i.test(deger);
}

function tokenGecerli(token) {
  return typeof token === "string" && token.trim().length >= 20 && !bosVeyaOrnek(token);
}

function idGecerli(id) {
  return /^\d{17,20}$/.test(String(id || ""));
}

function ayarlariDogrula(config) {
  const hatalar = [];
  if (!tokenGecerli(config?.token)) hatalar.push("Discord bot tokeni eksik");
  if (!idGecerli(config?.clientId)) hatalar.push("Discord uygulama ID'si eksik");
  return hatalar;
}

function mevcutConfigOku() {
  if (!fs.existsSync(configYolu)) return null;

  try {
    return JSON.parse(fs.readFileSync(configYolu, "utf8"));
  } catch (error) {
    return { __okumaHatasi: error.message };
  }
}

function bottanUygulamaId(token) {
  try {
    const id = Buffer.from(token.split(".")[0], "base64url").toString("utf8");
    return idGecerli(id) ? id : "";
  } catch {
    return "";
  }
}

async function sor(rl, metin, kontrol, hataMetni, varsayilan = "") {
  while (true) {
    const ek = varsayilan ? ` [${varsayilan}]` : "";
    const cevap = (await rl.question(`${metin}${ek}: `)).trim() || varsayilan;
    if (kontrol(cevap)) return cevap;
    console.log(`  HATA: ${hataMetni}`);
  }
}

function configYedekle() {
  if (!fs.existsSync(configYolu)) return;

  const tarih = new Date().toISOString().replace(/[:.]/g, "-");
  const yedekKlasoru = path.join(os.homedir(), "Desktop", "WebhookPanel-Yedekler");
  fs.mkdirSync(yedekKlasoru, { recursive: true });
  const yedekYolu = path.join(yedekKlasoru, `config.json.backup-${tarih}`);
  fs.copyFileSync(configYolu, yedekYolu);
  console.log(`Eski ayarlar masaustune yedeklendi: ${yedekYolu}`);
}

async function main() {
  const mevcut = mevcutConfigOku();

  if (sadeceConfigKontrol) {
    const gecerli = mevcut && !mevcut.__okumaHatasi && ayarlariDogrula(mevcut).length === 0;
    if (!gecerli) process.exitCode = 2;
    return;
  }

  console.log("\n========================================");
  console.log(" Webhook Panel - Ayar Sihirbazi");
  console.log("========================================\n");

  if (mevcut && !mevcut.__okumaHatasi) {
    const hatalar = ayarlariDogrula(mevcut);
    if (hatalar.length === 0) {
      console.log("Gecerli config.json bulundu; mevcut token ve ayarlara dokunulmadi.");
      return;
    }

    console.log("config.json bulundu fakat tamamlanmamis:");
    hatalar.forEach((hata) => console.log(`  - ${hata}`));
  } else if (mevcut?.__okumaHatasi) {
    console.log(`config.json okunamadi: ${mevcut.__okumaHatasi}`);
  }

  console.log("Discord botu otomatik olusturulmaz.");
  console.log("Developer Portal'da olusturdugun botun tokenini asagiya yapistir.");
  console.log("Yazdiklarin yalnizca bu bilgisayardaki config.json dosyasina kaydedilir.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", () => {
    console.log("\nKurulum iptal edildi.");
    rl.close();
    process.exit(130);
  });

  try {
    let token = tokenGecerli(mevcut?.token) ? mevcut.token.trim() : "";
    if (!token) {
      token = await sor(
        rl,
        "Discord bot tokeni",
        tokenGecerli,
        "Developer Portal > Bot > Reset Token alanindan aldigin tokeni gir.",
      );
    } else {
      console.log("Mevcut bot tokeni korunacak.");
    }

    const tokenId = bottanUygulamaId(token);
    let clientId = idGecerli(mevcut?.clientId) ? String(mevcut.clientId) : tokenId;

    if (clientId) {
      console.log(`Discord uygulama ID'si token uzerinden bulundu: ${clientId}`);
    } else {
      clientId = await sor(
        rl,
        "Discord Application ID",
        idGecerli,
        "Developer Portal > General Information > Application ID degerini gir.",
      );
    }

    configYedekle();
    fs.writeFileSync(
      configYolu,
      `${JSON.stringify({ token, clientId }, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );

    console.log("\nconfig.json olusturuldu.");
    console.log("Bot tokenini kimseyle paylasma ve bu dosyayi Git'e ekleme.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("\nAyar sihirbazi tamamlanamadi:", error.message);
  process.exit(1);
});
