const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  gameHistory: [
    {
      question: String,
      selectedAnswer: String,
      correctAnswer: String,
    },
  ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
