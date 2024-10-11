const axios = require('axios');
const EnvUtil = require('./env');

// Sends a discord webhook message if any channels are configured here
async function sendWebhookMessage(message) {
  const webhookUrls = EnvUtil.getDiscordWebhooks();
  if (webhookUrls) {
    let prefix = EnvUtil.getDiscordPrefix() !== '' ? EnvUtil.getDiscordPrefix() + '\n' : '';
    await Promise.all(
      webhookUrls.map(async (url) => {
        await axios.post(url, {
          // avatar_url: '',
          username: 'Beanstalk API',
          content: `${prefix}[${EnvUtil.getDeploymentEnv()}] - ${message}`
        });
      })
    );
  }
}

module.exports = {
  sendWebhookMessage
};
