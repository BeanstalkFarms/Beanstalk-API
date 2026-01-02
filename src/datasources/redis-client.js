const { createClient } = require('redis');
const EnvUtil = require('../utils/env');

const redisClient = createClient({
  url: EnvUtil.getRedisUrl()
});
redisClient.connect();

module.exports = redisClient;
