const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const axios = require('axios');

module.exports = {
  async handle(interaction, client) {
    try {
      if (interaction.isButton()) {
        await handleButton(interaction, client);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction, client);
      }
    } catch (error) {
      console.error('Handler error:', error);
      if (!interaction.replied && !interaction.deferred) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Hata Olustu\n` +
              `Bir hata olustu. Lutfen tekrar deneyin.`
            )
          );

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container],
        });
      }
    }
  }
};

async function handleButton(interaction, client) {
  const customId = interaction.customId;

  if (customId === 'webhook_panel') {
    const modal = new ModalBuilder()
      .setCustomId('webhook_modal')
      .setTitle('Webhook Spam Paneli');

    const webhookInput = new TextInputBuilder()
      .setCustomId('webhook_url')
      .setLabel('Webhook URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://discord.com/api/webhooks/...')
      .setRequired(true);

    const messageInput = new TextInputBuilder()
      .setCustomId('message_content')
      .setLabel('Gonderilecek Mesaj')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Spam mesajini girin...')
      .setRequired(true);

    const countInput = new TextInputBuilder()
      .setCustomId('send_count')
      .setLabel('Spam Sayisi (max 5000)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('100')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(webhookInput),
      new ActionRowBuilder().addComponents(messageInput),
      new ActionRowBuilder().addComponents(countInput)
    );

    await interaction.showModal(modal);
  }

  else if (customId === 'webhook_liste') {
    const sessions = Array.from(client.activeSessions.keys());
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Aktif Webhook Oturumlari\n` +
          `${sessions.length > 0 ? 
            sessions.map((id, i) => `${i+1}. Oturum ID: ${id.slice(0, 8)}`).join('\n') :
            'Aktif webhook oturumu bulunmuyor.'}`
        )
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Toplam Oturum: ${sessions.length}`
        )
      );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [container],
    });
  }

  else if (customId === 'webhook_durdur') {
    const userId = interaction.user.id;
    const sessionId = `session_${userId}`;
    
    if (client.activeSessions.has(sessionId)) {
      client.activeSessions.delete(sessionId);
      
      if (client.spamIntervals && client.spamIntervals.has(userId)) {
        clearInterval(client.spamIntervals.get(userId));
        client.spamIntervals.delete(userId);
      }
      
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Webhook Spam Durduruldu\n` +
            `Webhook spam oturumunuz durduruldu.`
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Tekrar baslatmak icin .webhookpnl komutunu kullanabilirsin.`
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
      
      const dmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Webhook Spam Durduruldu\n` +
            `Webhook spam oturumunuz durduruldu.`
          )
        );

      try {
        await interaction.user.send({
          flags: MessageFlags.IsComponentsV2,
          components: [dmContainer],
        });
      } catch (e) {}
      
      if (client.logChannel) {
        const logContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Log Bilgisi\n` +
              `${interaction.user.tag} kullanicisi webhook spam oturumunu durdurdu.`
            )
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# ${new Date().toLocaleString()}`
            )
          );

        await client.logChannel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [logContainer],
        });
      }
    } else {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Aktif Oturum Yok\n` +
            `Herhangi bir aktif webhook spam oturumunuz bulunmuyor.`
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
    }
  }

  else if (customId.startsWith('stop_session_')) {
    const userId = customId.split('_')[2];
    if (interaction.user.id !== userId) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Yetkisiz Erisim\n` +
            `Bu durdur butonu sizin oturumunuz icin degil.`
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
      return;
    }

    const sessionId = `session_${userId}`;
    if (client.activeSessions.has(sessionId)) {
      client.activeSessions.delete(sessionId);
      
      if (client.spamIntervals && client.spamIntervals.has(userId)) {
        clearInterval(client.spamIntervals.get(userId));
        client.spamIntervals.delete(userId);
      }
      
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Spam Durduruldu\n` +
            `Webhook spam basariyla durduruldu.`
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });

      const dmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Webhook Spam Durduruldu\n` +
            `Webhook spam oturumunuz durduruldu.`
          )
        );

      try {
        await interaction.user.send({
          flags: MessageFlags.IsComponentsV2,
          components: [dmContainer],
        });
      } catch (e) {}

      if (client.logChannel) {
        const logContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Log Bilgisi\n` +
              `${interaction.user.tag} kullanicisi webhook spam oturumunu durdurdu.`
            )
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# ${new Date().toLocaleString()}`
            )
          );

        await client.logChannel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [logContainer],
        });
      }
    }
  }
}

async function handleModal(interaction, client) {
  if (interaction.customId === 'webhook_modal') {
    try {
      const webhookUrl = interaction.fields.getTextInputValue('webhook_url');
      const message = interaction.fields.getTextInputValue('message_content');
      const count = parseInt(interaction.fields.getTextInputValue('send_count'));

      if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks/')) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Gecersiz Webhook URL\n` +
              `Lutfen gecerli bir Discord webhook URL'si girin.`
            )
          );

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container],
        });
        return;
      }

      if (isNaN(count) || count < 1 || count > 5000) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Gecersiz Sayi\n` +
              `Lutfen 1 ile 5000 arasinda bir sayi girin.`
            )
          );

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container],
        });
        return;
      }

      const userId = interaction.user.id;
      const sessionId = `session_${userId}`;
      
      if (client.activeSessions.has(sessionId)) {
        client.activeSessions.delete(sessionId);
        if (client.spamIntervals && client.spamIntervals.has(userId)) {
          clearInterval(client.spamIntervals.get(userId));
          client.spamIntervals.delete(userId);
        }
      }

      client.activeSessions.set(sessionId, { 
        webhookUrl, 
        message, 
        count,
        userId: userId,
        sent: 0,
        running: true,
        rateLimited: false
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Webhook Spam Baslatildi\n` +
            `${count} mesaj webhook'a gonderiliyor...`
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Durdurmak icin asagidaki butonu kullanin.`
          )
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`stop_session_${userId}`)
              .setLabel("Spam'i Durdur")
              .setEmoji("🛑")
              .setStyle(ButtonStyle.Danger)
          )
        );

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });

      const dmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Webhook Spam Baslatildi\n` +
            `${count} mesaj gonderiliyor.`
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Durdurmak icin panelden durdur butonunu kullan.`
          )
        );

      try {
        await interaction.user.send({
          flags: MessageFlags.IsComponentsV2,
          components: [dmContainer],
        });
      } catch (e) {}

      if (client.logChannel) {
        const logContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Log Bilgisi\n` +
              `${interaction.user.tag} kullanicisi webhook spam baslatti (${count} mesaj).`
            )
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `-# ${new Date().toLocaleString()}`
            )
          );

        await client.logChannel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [logContainer],
        });
      }

      await startSpam(userId, client);

    } catch (error) {
      console.error('Modal error:', error);
      if (!interaction.replied && !interaction.deferred) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Hata Olustu\n` +
              `Bir hata olustu. Lutfen tekrar deneyin.`
            )
          );

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container],
        });
      }
    }
  }
}

async function startSpam(userId, client) {
  const sessionId = `session_${userId}`;
  
  if (client.spamIntervals && client.spamIntervals.has(userId)) {
    clearInterval(client.spamIntervals.get(userId));
    client.spamIntervals.delete(userId);
  }

  if (!client.spamIntervals) {
    client.spamIntervals = new Map();
  }

  let isRateLimited = false;
  let retryCount = 0;

  const interval = setInterval(async () => {
    try {
      const session = client.activeSessions.get(sessionId);
      
      if (!session || !session.running) {
        clearInterval(interval);
        client.spamIntervals.delete(userId);
        return;
      }

      if (session.sent >= session.count) {
        clearInterval(interval);
        client.spamIntervals.delete(userId);
        session.running = false;
        client.activeSessions.delete(sessionId);
        
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Webhook Spam Tamamlandi\n` +
              `${session.sent} mesaj basariyla gonderildi.`
            )
          );

        try {
          const user = await client.users.fetch(userId);
          await user.send({
            flags: MessageFlags.IsComponentsV2,
            components: [container],
          });
        } catch (e) {}

        if (client.logChannel) {
          const logContainer = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `## Log Bilgisi\n` +
                `${userId} kullanicisi webhook spam tamamladi (${session.sent} mesaj gonderildi).`
              )
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `-# ${new Date().toLocaleString()}`
              )
            );

          await client.logChannel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [logContainer],
          });
        }
        return;
      }

      // Rate-limit kontrolu
      if (isRateLimited) {
        return;
      }

      try {
        await axios.post(session.webhookUrl, {
          content: `${session.message}`
        }, {
          timeout: 10000
        });
        
        session.sent++;
        retryCount = 0;
        console.log(`✅ Mesaj gonderildi: ${session.sent}/${session.count}`);
        
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Rate-limit yedik - interval'i durdur ve yeniden baslat
          isRateLimited = true;
          const retryAfter = parseInt(error.response.headers['retry-after']) || 5;
          console.log(`⏳ Rate-limit yendi! ${retryAfter} saniye bekleniyor...`);
          
          clearInterval(interval);
          
          setTimeout(() => {
            isRateLimited = false;
            if (client.activeSessions.has(sessionId)) {
              console.log(`🔄 Rate-limit sona erdi, spam devam ediyor...`);
              startSpam(userId, client);
            }
          }, (retryAfter + 1) * 1000);
          
          return;
        } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          // Connection reset - yeniden dene
          retryCount++;
          console.log(`⚠️ Baglanti hatasi (${retryCount}), tekrar deneniyor...`);
          
          if (retryCount < 3) {
            // 3 kere dene
            setTimeout(() => {
              if (client.activeSessions.has(sessionId)) {
                startSpam(userId, client);
              }
            }, 2000);
          } else {
            console.log(`❌ Baglanti hatasi fazla, spam durduruluyor...`);
            clearInterval(interval);
            client.spamIntervals.delete(userId);
            client.activeSessions.delete(sessionId);
            
            const container = new ContainerBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `## Hata Olustu\n` +
                  `Baglanti hatasi nedeniyle spam durduruldu.`
                )
              );

            try {
              const user = await client.users.fetch(userId);
              await user.send({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
              });
            } catch (e) {}
          }
          return;
        } else {
          console.error('Webhook hatasi:', error.message);
        }
      }

    } catch (error) {
      console.error('Spam interval hatasi:', error);
    }
  }, 3000); // 3 saniyede 1 mesaj

  client.spamIntervals.set(userId, interval);
}
