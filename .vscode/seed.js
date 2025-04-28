const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const seedQuestions = async () => {
  const questions = [
    {
      question: "What is the fundamental right to equality?",
      options: ["Right to Equality", "Right to Freedom", "Right to Education", "Right to Property"],
      correctAnswer: "Right to Equality",
      category: "Fundamental Rights"
    },
    {
      question: "Which article deals with the right to constitutional remedies?",
      options: ["Article 19", "Article 21", "Article 32", "Article 44"],
      correctAnswer: "Article 32",
      category: "Constitutional Remedies"
    },
    // Add more questions as needed
  ];

  try {
    await Question.insertMany(questions);
    console.log('Data successfully seeded!');
  } catch (error) {
    console.log('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedQuestions();
