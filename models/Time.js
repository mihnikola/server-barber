const mongoose = require('mongoose');

const timeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
}, { timestamps: true });

const Time = mongoose.model('Time', timeSchema);

module.exports = Time;
