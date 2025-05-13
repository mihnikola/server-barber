const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
token: {
    type: String,
    required: true
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
}, { timestamps: true });

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
