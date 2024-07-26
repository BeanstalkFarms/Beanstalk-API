module.exports = {
  local: {
    username: 'api_user',
    password: 'beanstalk',
    database: 'beanstalk_api',
    host: 'localhost',
    dialect: 'postgres',
    logging: false
  },
  'local-docker': {
    username: 'api_user',
    password: 'beanstalk',
    database: 'beanstalk_api',
    host: 'postgres',
    dialect: 'postgres'
    // logging: false
  }
};
