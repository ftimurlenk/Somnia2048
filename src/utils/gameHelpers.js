// src/utils/gameHelpers.js

// Rastgele boş bir hücre seç ve 2 ya da 4 yerleştir
export function addRandomTile(grid) {
  const emptyCells = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 0) {
        emptyCells.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  if (emptyCells.length === 0) return grid;

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = [...grid.map((r) => [...r])];
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

// Oyun bitmiş mi kontrolü (hiç hamle kalmamışsa)
export function isGameOver(grid) {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === 0) return false;
      if (col < 3 && grid[row][col] === grid[row][col + 1]) return false;
      if (row < 3 && grid[row][col] === grid[row + 1][col]) return false;
    }
  }
  return true;
}

// Skoru hesapla (tüm hücreleri topla)
export function calculateScore(grid) {
  return grid.flat().reduce((sum, val) => sum + val, 0);
}
