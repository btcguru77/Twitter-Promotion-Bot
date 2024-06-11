const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  screen_name: {
    type: String
  },
  user_id: {
    type: String
  },
  total_score: { type: Number, default: 0 },
  state: {
    follow: {
        type: Boolean,
        default: false
    },
    tweeted: {
        type: Boolean,
        default: false
    }
  },
  role: { type: Number, enum: [0, 1], default: 1 }, //admin: 0, user: 1,
  tweets: {
    type: [{
      tweet_id: String
    }],
    default: []
  }
});

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
