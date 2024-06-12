const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  access_token: {
    type: String,
    required: true,
  },
  access_token_secret: {
    type: String,
    required: true
  },
  user_id: {
    type: String
  }
});

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
