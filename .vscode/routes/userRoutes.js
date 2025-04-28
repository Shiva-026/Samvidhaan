const express = require('express');
const { submitAnswer } = require('../controllers/userController');
const router = express.Router();

// Submit user's answer and update score
router.post('/submit-answer', submitAnswer);

module.exports = router;
