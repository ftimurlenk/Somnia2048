import { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 4;

const getInitialGrid = () => {
  const grid = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
  addRandomTile(grid);
  addRandomTile(grid);
  return grid;
};

const addRandomTile = (grid) => {
  const emptyTiles = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 0) emptyTiles.push({ row: rowIndex, col: colIndex });
    });
  });

  if (emptyTiles.length === 0) return;

  const { row, col } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  grid[row][col] = Math.random() < 0.9 ? 2 : 4;
};

const cloneGrid = (grid) => grid.map((row) => [...row]);

const useGameLogic = () => {
  const [grid, setGrid] = useState(getInitialGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const move = useCallback((direction) => {
    if (gameOver || !gameStarted) return;

    const newGrid = cloneGrid(grid);
    let moved = false;
    let gainedScore = 0;

    const slide = (row) => {
      const newRow = row.filter((val) => val !== 0);
      for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
          newRow[i] *= 2;
          gainedScore += newRow[i];
          newRow[i + 1] = 0;
        }
      }
      return [...newRow.filter((val) => val !== 0), ...Array(GRID_SIZE - newRow.filter((val) => val !== 0).length).fill(0)];
    };

    const applyMove = (getRow, setRow) => {
      for (let i = 0; i < GRID_SIZE; i++) {
        const original = getRow(i);
        const slided = slide(original);
        if (JSON.stringify(original) !== JSON.stringify(slided)) {
          moved = true;
          setRow(i, slided);
        }
      }
    };

    switch (direction) {
      case 'left':
        applyMove(
          (i) => newGrid[i],
          (i, row) => newGrid[i] = row
        );
        break;
      case 'right':
        applyMove(
          (i) => [...newGrid[i]].reverse(),
          (i, row) => newGrid[i] = [...row].reverse()
        );
        break;
      case 'up':
        applyMove(
          (i) => newGrid.map((row) => row[i]),
          (i, col) => col.forEach((val, rowIdx) => newGrid[rowIdx][i] = val)
        );
        break;
      case 'down':
        applyMove(
          (i) => newGrid.map((row) => row[i]).reverse(),
          (i, col) => col.reverse().forEach((val, rowIdx) => newGrid[rowIdx][i] = val)
        );
        break;
      default:
        return;
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore((prev) => prev + gainedScore);
    } else if (isGameOver(newGrid)) {
      setGameOver(true);
    }
  }, [grid, gameOver, gameStarted]);

  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        move('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        move('right');
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        move('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        move('down');
        break;
      default:
        break;
    }
  }, [move]);

  const restartGame = () => {
    const newGrid = getInitialGrid();
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (gameStarted && isGameOver(grid)) {
      setGameOver(true);
    }
  }, [grid, gameStarted]);

  return {
    grid,
    score,
    gameOver,
    gameStarted,
    setGameStarted,
    handleKeyDown,
    restartGame,
  };
};

const isGameOver = (grid) => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) return false;
      if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return false;
      if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return false;
    }
  }
  return true;
};

export default useGameLogic;
