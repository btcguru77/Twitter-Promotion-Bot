const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  contents:[{
    tweet: {
      type: String,
    }
  }],
  schedule: {
    type: Date,
    default: () => new Date(Date.now() + 1 * 60 * 60 * 1000)
  },
  done: {
    type: Boolean,
    default: false
  }
});

const ScheduleModel = mongoose.model("schedule", ScheduleSchema);

module.exports = ScheduleModel;
