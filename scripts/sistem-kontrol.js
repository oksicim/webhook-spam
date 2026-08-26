const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const kok = path.resolve(__dirname, "..");
const cevrimdisi = process.argv.includes("--offline");
let hataSayisi = 0;

function basarili(metin) {
  console.log(`OK    ${metin}`);
}

function hatali(metin) {
  hataSayisi += 1;
  console.error(`HATA  ${metin}`);
}

function guvenliHata(error, config = {}) {
  let metin = String(error?.message || error || "Bilinmeyen hata");
  if (config.token) metin = metin.split(config.token).join("[GIZLENDI]");
  return metin.slice(0, 350);
}

function bosVeyaOrnek(deger) {
  if (typeof deger !== "string" || !deger.trim()) return true;
  return /(BURAYA|TOKENI|TOKENINI|TOKENİNİ|CLIENT.?ID|UYGULAMA_ID|BOTUN|your-|change-this)/i.test(deger);
}

function javascriptDosyalari(klasor) {
  const dosyalar = [];

  for (const oge of fs.readdirSync(klasor, { withFileTypes: true })) {
    if (oge.name === "node_modules") continue;
    const tamYol = path.join(klasor, oge.name);

    if (oge.isDirectory()) dosyalar.push(...javascriptDosyalari(tamYol));
    else if (oge.isFile() && oge.name.endsWith(".js")) dosyalar.push(tamYol);
  }

  return dosyalar;
}

function temelKontroller(config) {
  const [major] = process.versions.node.split(".").map(Number);
  if (major >= 18) basarili(`Node.js ${process.versions.node}`);
  else hatali("Node.js 18 veya daha yeni bir surum gerekli.");

  for (const paket of ["discord.js", "axios"]) {
    try {
      require.resolve(paket, { paths: [kok] });
      basarili(`${paket} yuklu`);
    } catch {
      hatali(`${paket} yuklu degil; KURULUM.bat dosyasini tekrar ac.`);
    }
  }

  if (bosVeyaOrnek(config.token) || config.token.length < 20) {
    hatali("Discord bot tokeni eksik veya ornek degerde.");
  } else {
    basarili("Bot tokeni ayarlanmis (deger gosterilmedi)");
  }

  if (!/^\d{17,20}$/.test(String(config.clientId || ""))) {
    hatali("Discord uygulama ID'si gecersiz.");
  } else {
    basarili("Discord uygulama ID'si ayarlanmis");
  }

  for (const dosya of javascriptDosyalari(kok)) {
    const sonuc = spawnSync(process.execPath, ["--check", dosya], {
      encoding: "utf8",
      windowsHide: true,
    });

    if (sonuc.status !== 0) {
      hatali(`${path.relative(kok, dosya)} soz dizimi gecersiz.`);
      const ayrinti = (sonuc.stderr || sonuc.stdout || "").trim();
      if (ayrinti) console.error(ayrinti);
    }
  }

  if (hataSayisi === 0) basarili("JavaScript dosyalari gecerli");
}

async function discordKontrol(config) {
  try {
    const cevap = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${config.token}` },
      signal: AbortSignal.timeout(12_000),
    });

    if (!cevap.ok) {
      if (cevap.status === 401) hatali("Discord bot tokeni gecersiz.");
      else hatali(`Discord baglantisi reddedildi. HTTP ${cevap.status}`);
      return;
    }

    const bot = await cevap.json();
    if (String(bot.id) !== String(config.clientId)) {
      hatali("Bot tokeni ile Discord uygulama ID'si birbiriyle eslesmiyor.");
      return;
    }

    basarili(`Discord baglantisi: ${bot.username}`);
  } catch (error) {
    hatali(`Discord'a ulasilamadi: ${guvenliHata(error, config)}`);
  }
}

async function main() {
  console.log("\n========================================");
  console.log(" Webhook Panel - Sistem Kontrolu");
  console.log("========================================\n");

  let config = {};
  const configYolu = path.join(kok, "config.json");

  try {
    config = JSON.parse(fs.readFileSync(configYolu, "utf8"));
  } catch (error) {
    hatali(`config.json okunamadi: ${guvenliHata(error)}`);
  }

  temelKontroller(config);

  if (!cevrimdisi && hataSayisi === 0) {
    await discordKontrol(config);
  } else if (cevrimdisi) {
    console.log("BILGI Cevrimdisi kontrol: Discord baglantisi denenmedi.");
  }

  console.log("");
  if (hataSayisi === 0) {
    console.log("Tum kontroller basarili.");
  } else {
    console.error(`${hataSayisi} kontrol basarisiz. README.md icindeki Sorun Giderme bolumune bak.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Kontrol sirasinda beklenmeyen hata:", guvenliHata(error));
  process.exit(1);
});
