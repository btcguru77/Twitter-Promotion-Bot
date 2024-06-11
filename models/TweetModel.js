const mongoose = require("mongoose");

const TweetSchema = new mongoose.Schema({
  tweet_id: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
});

const TweetModel = mongoose.model("tweet", TweetSchema);

module.exports = TweetModel;
