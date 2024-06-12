const axios = require('axios');

// Sends a discord webhook message if any channels are configured here
async function sendWebhookMessage(message) {
  const webhookUrls = process.env.DISCORD_NOTIFICATION_WEBHOOKS?.split(',');
  if (webhookUrls) {
    await Promise.all(
      webhookUrls.map(async (url) => {
        await axios.post(url, {
          // avatar_url: '',
          username: 'Beanstalk API',
          content: `[${process.env.ENV}] - ${message}`
        });
      })
    );
  }
}

module.exports = {
  sendWebhookMessage
};
