const mongoose = require("mongoose");

const TweetSchema = new mongoose.Schema({
  tweet_id: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true
  },
  liked: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const TweetModel = mongoose.model("tweet", TweetSchema);

module.exports = TweetModel;
