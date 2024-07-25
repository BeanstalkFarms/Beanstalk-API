module.exports = {
  local: {
    username: 'api_user',
    password: 'beanstalk',
    database: 'beanstalk_api',
    host: 'localhost',
    dialect: 'postgres'
    // logging: console.log
  },
  'local-docker': {
    username: 'api_user',
    password: 'beanstalk',
    database: 'beanstalk_api',
    host: 'postgres',
    dialect: 'postgres'
    // logging: console.log
  }
};
