const express = require('express');
const { getQuestions } = require('../controllers/questionController');
const router = express.Router();

// Get a set of random questions
router.get('/', getQuestions);

module.exports = router;
