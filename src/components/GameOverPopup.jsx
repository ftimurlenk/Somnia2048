import React from 'react';

const GameOverPopup = ({ score, onRestart }) => {
  return (
    <div className="gameover-overlay">
      <div className="gameover-popup">
        <h2>Game Over!</h2>
        <p>Score: <strong>{score}</strong></p>
		<p>Your score has been submitted.</p>
        <button onClick={onRestart}>Restart Game</button>
      </div>
    </div>
  );
};

export default GameOverPopup;
