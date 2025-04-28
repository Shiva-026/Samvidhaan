const User = require('../models/User');

const submitAnswer = async (req, res) => {
  const { username, question, selectedAnswer, correctAnswer } = req.body;

  try {
    let user = await User.findOne({ username });

    if (!user) {
      user = new User({ username });
    }

    const isCorrect = selectedAnswer === correctAnswer;
    user.score += isCorrect ? 1 : 0;

    user.gameHistory.push({
      question,
      selectedAnswer,
      correctAnswer,
    });

    await user.save();

    res.json({ success: true, score: user.score });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

module.exports = { submitAnswer };
