import React, { useState } from 'react';

const Question = ({ questionData, onSubmit }) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const handleSubmit = () => {
    onSubmit(selectedAnswer);
  };

  return (
    <div>
      <h2>{questionData.question}</h2>
      <div>
        {questionData.options.map((option, index) => (
          <div key={index}>
            <input
              type="radio"
              id={`option-${index}`}
              name="question"
              value={option}
              checked={selectedAnswer === option}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
            <label htmlFor={`option-${index}`}>{option}</label>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit}>Submit Answer</button>
    </div>
  );
};

export default Question;
