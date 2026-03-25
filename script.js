const rowSizes = [12, 14, 14, 12];
// TODO: fetch from database
const puzzleData = [
  { "puzzle": "airplane", "category": "in the sky" },
  { "puzzle": "perfectly popped popcorn kernels", "category": "food" },
  { "puzzle": "perfect pop popcorn", "category": "thing" },
  { "puzzle": "rang de basanti", "category": "bollywood" },
];
const { puzzle, category } = puzzleData[Math.floor(Math.random() * puzzleData.length)];

let tileElements = [];
let hiddenList = [];
let revealIntervalId = null;

function getBoard(puzzleText) {
  const words = puzzleText.toUpperCase().split(" ");
  const board = rowSizes.map(size => Array(size).fill(""));

  let idx = 0;
  let currentRow = puzzleText.length <= 24 ? 1 : 0; // for centering short phrases

  while (idx < words.length && currentRow < rowSizes.length) {
    const width = rowSizes[currentRow] - 2;
    const lineWords = [];
    let lineLength = 0;

    while (idx < words.length) {
      const newLength = lineLength + (lineLength ? 1 : 0) + words[idx].length;
      if (newLength > width) break;
      lineWords.push(words[idx]);
      lineLength = newLength;
      idx++;
    }

    const line = lineWords.join(" ");
    const padding = Math.floor((width - line.length) / 2);
    for (let i = 0; i < line.length; i++) {
      board[currentRow][1 + padding + i] = line[i] !== " " ? line[i] : "";
    }
    currentRow++;
  }
  return board;
}

function render(boardData) {
  const board = document.querySelector(".board");
  board.innerHTML = "";
  tileElements = [];

  for (let row = 0; row < rowSizes.length; row++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    const tileRow = [];

    for (let col = 0; col < rowSizes[row]; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      if (boardData[row][col] === "") tile.classList.add("hidden");
      rowDiv.appendChild(tile);
      tileRow.push(tile);
    }
    board.appendChild(rowDiv);
    tileElements.push(tileRow);
  }
}

function buildHiddenList(board) {
  const list = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const ch = board[row][col];
      if (ch !== "") list.push([row, col, ch]);
    }
  }
  return list;
}

function reveal(hiddenList) {
  if (revealIntervalId) clearInterval(revealIntervalId);
  if (!hiddenList.length) return;
  const shuffled = [...hiddenList];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  let index = 0;
  revealIntervalId = setInterval(() => {
    if (index >= shuffled.length) {
      clearInterval(revealIntervalId);
      revealIntervalId = null;
      return;
    }
    const [row, col, ch] = shuffled[index];
    const tile = tileElements[row]?.[col];
    if (tile) tile.textContent = ch;
    index++;
  }, 1000);
}

document.querySelector(".solve-button").addEventListener('click', () => {
  let userGuess = prompt("Type your solution (the full phrase):");
  if (userGuess === null) return;
  userGuess = userGuess.trim().toUpperCase();
  if (userGuess === puzzle.toUpperCase()) {
    alert("Congratulations! You solved the puzzle!");
    if (revealIntervalId) {
      clearInterval(revealIntervalId);
      revealIntervalId = null;
    }
    for (const [row, col, ch] of hiddenList) {
      const tile = tileElements[row]?.[col];
      if (tile) tile.textContent = ch;
    }
  } else {
    alert(`Incorrect answer: "${userGuess}". Keep guessing!`);
  }
});

// **** INIT
document.querySelector(".category").textContent = category.toUpperCase();
const grid = getBoard(puzzle);
render(grid);
hiddenList = buildHiddenList(grid);
reveal(hiddenList);

