const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  name: "webhookpnl",
  aliases: ["webhookpanel", "whpnl"],
  description: "Webhook spam panelini açar",

  async execute(message, args, client) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## Baby Webhook Spammer\n" +
          "> Webhook spam sistemini aşağıdaki butonları kullanarak yönetebilirsin."
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "**Nasıl Çalışır?**\n" +
          "1. Webhook Spam Başlat butonuna tıkla.\n" +
          "2. Webhook URL, mesaj ve sayıyı gir (maks. 5000).\n" +
          "3. Sistem anında spam yapmaya başlar ve rate-limit korumalıdır.\n" +
          "4. Bittiğinde sonuç DM + log kanalına düşer."
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "**Özellikler**\n" +
          "Sınırsız kullanım | Tamamen ücretsiz | Hızlı spam | Rate-limit koruması | DM bildirimi"
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "🟢 **Sistem Durumu:** Aktif\n" +
          "-# Aşağıdaki butonlardan birini seçerek devam edebilirsin."
        )
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("webhook_panel")
            .setLabel("Webhook Spam Başlat")
            .setEmoji("🔗")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("webhook_liste")
            .setLabel("Oturumları Göster")
            .setEmoji("📋")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("webhook_durdur")
            .setLabel("Spam'ı Durdur")
            .setEmoji("🛑")
            .setStyle(ButtonStyle.Danger)
        )
      );

    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
