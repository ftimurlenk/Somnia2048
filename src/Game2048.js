import React, { useState, useEffect, useCallback } from 'react';
import './Game2048.css';

const Game2048 = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Yeni bir oyun başlat
  const resetGame = () => {
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    addRandomNumber(newBoard);
  };

  // Boş bir oyun tahtası oluştur
  const createEmptyBoard = () => {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  };

  // Rastgele bir sayı (2 ya da 4) ekle
  const addRandomNumber = (board) => {
    const emptyCells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const randomValue = Math.random() < 0.9 ? 2 : 4;
      board[randomCell.row][randomCell.col] = randomValue;
      setBoard([...board]);
    }
  };

  // Hücrelerin kayması
  const moveLeft = (board) => {
    let newBoard = board.map(row => row.slice());
    for (let i = 0; i < 4; i++) {
      let row = newBoard[i].filter(val => val !== 0);
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          setScore(prevScore => prevScore + row[j]);
          row.splice(j + 1, 1);
        }
      }
      while (row.length < 4) {
        row.push(0);
      }
      newBoard[i] = row;
    }
    setBoard(newBoard);
    addRandomNumber(newBoard);
  };

  const moveRight = (board) => {
    let newBoard = board.map(row => row.slice().reverse());
    moveLeft(newBoard);
    newBoard = newBoard.map(row => row.reverse());
    setBoard(newBoard);
  };

  const moveUp = (board) => {
    let newBoard = transpose(board);
    moveLeft(newBoard);
    newBoard = transpose(newBoard);
    setBoard(newBoard);
  };

  const moveDown = (board) => {
    let newBoard = transpose(board);
    moveRight(newBoard);
    newBoard = transpose(newBoard);
    setBoard(newBoard);
  };

  const transpose = (board) => {
    return board[0].map((_, index) => board.map(row => row[index]));
  };

  // Oyun bitti mi kontrol et
  const checkGameOver = (board) => {
    // Tahtada boş hücre var mı?
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (board[row][col] === 0) return false;
      }
    }

    // Aynı sayılar birleşebilir mi?
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (
          (row < 3 && board[row][col] === board[row + 1][col]) || 
          (col < 3 && board[row][col] === board[row][col + 1])
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Ok tuşlarına basıldığında doğru hareketi yapacak fonksiyon
  const handleKeyPress = useCallback((event) => {
    if (gameOver) return; // Eğer oyun bitmişse hareket etmeyi engelle

    switch (event.key) {
      case 'ArrowLeft':
        moveLeft(board);
        break;
      case 'ArrowRight':
        moveRight(board);
        break;
      case 'ArrowUp':
        moveUp(board);
        break;
      case 'ArrowDown':
        moveDown(board);
        break;
      default:
        break;
    }

    // Oyun bitmiş mi kontrol et
    if (checkGameOver(board)) {
      setGameOver(true);
    }
  }, [board, gameOver]);

  // useEffect hook'u ile keydown olayını dinleyerek hamleler yapıyoruz
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="game-container">
      <h1>2048</h1>
      <div className="score-board">
        <span>Score: {score}</span>
        <button onClick={resetGame}>Yeniden Başla</button>
      </div>
      <div className="game-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell cell-${cell === 0 ? 'empty' : cell}`}
            >
              {cell !== 0 ? cell : ''}
            </div>
          ))
        )}
      </div>
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Yeniden başlamak için butona tıklayın</p>
        </div>
      )}
    </div>
  );
};

export default Game2048;
