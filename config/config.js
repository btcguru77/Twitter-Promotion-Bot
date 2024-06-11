var dotenv = require('dotenv');
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

// export const MONGO_URL = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
var MONGO_URL = process.env.MONGO_URL;
var PORT = process.env.PORT || 9000;
var JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";

module.exports = {
  MONGO_URL: MONGO_URL,
  PORT: PORT,
  JWT_SECRET: JWT_SECRET
};
