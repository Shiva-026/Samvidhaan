import React from 'react';
import { themes } from '../data/questions';
import './Wheel.css';

const Wheel = ({ onSpin, isSpinning, setIsSpinning }) => {
  const themeNames = Object.keys(themes);

  const spinWheel = () => {
    if (isSpinning) return; // Prevent further spins if already spinning

    setIsSpinning(true); // Set spinning state to true

    const selectedTheme = themeNames[Math.floor(Math.random() * themeNames.length)];
    const questions = themes[selectedTheme];
    const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];

    setTimeout(() => {
      onSpin(selectedTheme, selectedQuestion);
    }, 3000); // Duration of the spin animation
  };

  return (
    <div className="wheel-container">
      <div className={`wheel ${isSpinning ? 'spin' : ''}`}>
        {themeNames.map((theme, index) => (
          <div key={index} className="wheel-segment">
            <span>{theme}</span>
          </div>
        ))}
      </div>
      <button onClick={spinWheel} disabled={isSpinning}>Spin the Wheel</button>
    </div>
  );
};

export default Wheel;
