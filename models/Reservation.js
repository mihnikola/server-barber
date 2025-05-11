const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, 
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customer:{
    type: String,
  },
  status:{
    type: Number,    
  }
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
