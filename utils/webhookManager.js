const axios = require('axios');
const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder
} = require('discord.js');

module.exports = {
  async startSpam(userId, client) {
    const sessionId = `session_${userId}`;
    const session = client.activeSessions.get(sessionId);
    
    if (!session) return;

    const { webhookUrl, message, count } = session;
    let sent = 0;

    while (sent < count && client.activeSessions.has(sessionId)) {
      try {
        await axios.post(webhookUrl, {
          content: `${message} (${sent + 1}/${count})`
        });
        
        sent++;
        session.sent = sent;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 5;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else {
          console.error('Webhook error:', error.message);
          break;
        }
      }
    }

    if (client.activeSessions.has(sessionId)) {
      client.activeSessions.delete(sessionId);
      
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## Webhook Spam Tamamlandı\n` +
            `${sent} mesaj başarıyla gönderildi.`
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
        await client.logChannel.send(`${userId} kullanıcısı webhook spam tamamladı (${sent} mesaj gönderildi).`);
      }
    }
  }
};
