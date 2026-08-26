const { Client, GatewayIntentBits, Partials, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Global değişkenler
client.commands = new Map();
client.activeSessions = new Map();
client.spamIntervals = new Map();
client.logChannel = null;

// Komutları yükle
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);

  for (const alias of command.aliases || []) {
    client.commands.set(alias, command);
  }

  console.log(`✅ Komut yüklendi: ${command.name}`);
}

// Ready event
client.once('ready', () => {
  console.log(`✅ Bot başlatıldı: ${client.user.tag}`);
  console.log(`✅ ${client.commands.size} komut yüklendi`);
});

// Message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('.')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error('❌ Komut hatası:', error);
    try {
      await message.reply({ 
        content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.', 
        flags: MessageFlags.Ephemeral 
      });
    } catch (e) {}
  }
});

// Interaction handler
const interactionHandler = require('./handlers/interactionHandler');
client.on('interactionCreate', async (interaction) => {
  try {
    await interactionHandler.handle(interaction, client);
  } catch (error) {
    console.error('❌ Interaction hatası:', error);
  }
});

// Global hata yakalama
process.on('unhandledRejection', (error) => {
  console.error('❌ Yakalanmamış hata:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Yakalanmamış exception:', error);
});

// Botu başlat
client.login(token);
