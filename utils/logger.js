const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder
} = require('discord.js');

module.exports = {
  async log(client, content, type = 'info') {
    if (!client.logChannel) return;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ${type.charAt(0).toUpperCase() + type.slice(1)}\n` +
          `${content}`
        )
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# ${new Date().toLocaleString()}`
        )
      );

    try {
      await client.logChannel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });
    } catch (error) {
      console.error('Log error:', error);
    }
  }
};
