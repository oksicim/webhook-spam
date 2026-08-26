const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  PermissionsBitField
} = require('discord.js');

module.exports = {
  name: 'logset',
  aliases: ['logchannel', 'setlog'],
  description: 'Log kanalini ayarlar',

  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Yetki Reddedildi\n` +
              `Bu komutu kullanmak icin Yonetici iznine ihtiyacin var.`
            )
          );

        await message.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container],
        });
        return;
      }

      const channel = message.mentions.channels.first();
      if (!channel) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `## Gecersiz Kanal\n` +
              `Lutfen gecerli bir metin kanali belirt.\n` +
              `Ornek: .logset #logs`
            )
          );

        await message.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container],
        });
        return;
      }

      client.logChannel = channel;
      
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Log Kanali Ayarlari\n` +
            `Log kanali ${channel} olarak ayarlandi.\n` +
            `Tum webhook aktiviteleri buraya loglanacak.`
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Webhook URL'leri loglarda gosterilmez.`
          )
        );

      await message.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
      
      // Log kanalina mesaj - ContainerBuilder
      const logContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Log Kanali Aktif\n` +
            `Log kanali webhook spam takibi icin aktive edildi.`
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# ${new Date().toLocaleString()}`
          )
        );

      await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [logContainer],
      });
      
    } catch (error) {
      console.error('Logset error:', error);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Hata Olustu\n` +
            `Log kanali ayarlarken bir hata olustu.`
          )
        );

      await message.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
    }
  }
};
