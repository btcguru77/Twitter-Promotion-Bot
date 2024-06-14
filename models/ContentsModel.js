const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  content: {
    type: String,
  }
});

const ContentModel = mongoose.model("content", ContentSchema);

module.exports = ContentModel;
