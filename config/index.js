const config = require('./config.js');
const db = require('./db.js');

module.exports = {
  PORT: config.PORT,
  JWT_SECRET: config.JWT_SECRET,
  connectMongoDB: db.connectMongoDB
};
