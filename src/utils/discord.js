require('dotenv').config();
const axios = require('axios');

// Sends a discord webhook message if any channels are configured here
async function sendWebhookMessage(message) {
  const webhookUrls = process.env.DISCORD_NOTIFICATION_WEBHOOKS?.split(',');
  if (webhookUrls) {
    let prefix = process.env.DISCORD_NOTIFICATION_TAGS ? process.env.DISCORD_NOTIFICATION_TAGS + '\n' : '';
    await Promise.all(
      webhookUrls.map(async (url) => {
        await axios.post(url, {
          // avatar_url: '',
          username: 'Beanstalk API',
          content: `${prefix}[${process.env.ENV}] - ${message}`
        });
      })
    );
  }
}

module.exports = {
  sendWebhookMessage
};
