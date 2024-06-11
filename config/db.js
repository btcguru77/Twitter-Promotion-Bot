/**
 * MongoDB Database Connection and Configuration
 *
 * This module handles the setup and configuration of the MongoDB database connection using the Mongoose library.
 * It also exports a function to establish the connection to the database and a constant for the application's port.
 */
var mongoose = require('mongoose');
var MONGO_URL = require('./config.js').MONGO_URL;

/**
 * Establishes a connection to the MongoDB database.
 *
 * This function sets up a connection to the MongoDB database using the provided `MONGO_URL` configuration.
 * It enforces strict query mode for safer database operations. Upon successful connection, it logs the
 * host of the connected database. In case of connection error, it logs the error message and exits the process.
 */
exports.connectMongoDB = function() {
  var isConnected = false;

  var connect = function() {
    try {
      if (MONGO_URL) {
        mongoose.connect(MONGO_URL).then(function(connection) {
          console.log('MONGODB CONNECTED');
          // console.log('MONGODB CONNECTED : ' + connection.connection.host);
          isConnected = true;
        }).catch(function(error) {
          // console.log('Error : ' + error.message);
          isConnected = false;
          // Attempt to reconnect
          setTimeout(connect, 1000); // Retry connection after 1 second
        });
      } else {
        console.log('No Mongo URL');
      }
    } catch (error) {
      // console.log('Error : ' + error.message);
      isConnected = false;
      // Attempt to reconnect
      setTimeout(connect, 1000); // Retry connection after 1 second
    }
  };

  connect();

  mongoose.connection.on('disconnected', function() {
    console.log('MONGODB DISCONNECTED');
    isConnected = false;
    // Attempt to reconnect
    setTimeout(connect, 1000); // Retry connection after 1 second
  });

  mongoose.connection.on('reconnected', function() {
    console.log('MONGODB RECONNECTED');
    isConnected = true;
  });
};
