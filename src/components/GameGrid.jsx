import React from 'react';

const getTileClass = (value) => {
  return `tile tile-${value}`;
};

const GameGrid = ({ grid }) => {
  return (
    <div className="grid-container">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={getTileClass(cell)}
          >
            {cell !== 0 ? cell : ''}
          </div>
        ))
      )}
    </div>
  );
};

export default GameGrid;
