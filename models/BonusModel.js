const mongoose = require("mongoose");

const BonusSchema = new mongoose.Schema({
  winning_bonus: { type: Number, default: 0 },
  retweet_bonus: { type: Number, default: 0 },
});

const BonusModel = mongoose.model("bonus", BonusSchema);

module.exports = BonusModel;
