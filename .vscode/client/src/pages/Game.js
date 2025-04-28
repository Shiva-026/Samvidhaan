import React, { useState } from 'react';
import Wheel from '../components/Wheel';
import Question from '../components/Question';
import './Game.css';  // Import the CSS file for styling

const Game = () => {
  const [theme, setTheme] = useState('');
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');  // New state for correct answer
  const [isCorrect, setIsCorrect] = useState(false);  // New state to track if the answer is correct
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = (selectedTheme, selectedQuestion) => {
    setTheme(selectedTheme);
    setQuestion(selectedQuestion);
    setResult(''); // Clear any previous result
    setCorrectAnswer(''); // Clear previous correct answer
    setIsSpinning(false); // Stop the wheel from spinning after question is displayed
  };

  const handleAnswerSubmit = (selectedAnswer) => {
    if (question) {
      const correct = selectedAnswer === question.answer;
      setIsCorrect(correct);  // Update the correct state
      if (correct) {
        setScore((prevScore) => prevScore + 1);
        setResult('Correct! 🎉');
        setCorrectAnswer('');  // No need to show the correct answer if the user is correct
      } else {
        setResult('Incorrect!');
        setCorrectAnswer(`The correct answer was: ${question.answer}`);
      }
      
      // Reset for the next spin
      setQuestion(null);
      setTheme('');
    }
  };

  return (
    <div>
      <Wheel onSpin={handleSpin} isSpinning={isSpinning} setIsSpinning={setIsSpinning} />
      {question && (
        <Question
          questionData={question}
          onSubmit={handleAnswerSubmit}
        />
      )}
      <div>Theme: {theme}</div>
      <div>Score: {score}</div>
      {result && (
        <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
          {result}
          {correctAnswer && <div className="correct-answer">{correctAnswer}</div>}
        </div>
      )}
    </div>
  );
};

export default Game;
