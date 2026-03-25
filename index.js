const rowSizes = [12, 14, 14, 12];
// TODO: fetch from database
const puzzleData = [
  { "puzzle": "airplane", "category": "in the sky" },
  { "puzzle": "perfectly popped popcorn kernels", "category": "food" },
  { "puzzle": "perfect pop popcorn", "category": "thing" },
];

let tileElements = [];

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
      const newLength = lineLength + (lineLength > 0 ? 1 : 0) + words[idx].length;
      if (newLength > width) break;
      lineWords.push(words[idx]);
      lineLength = newLength;
      idx++;
    }

    const line = lineWords.join(" ");
    const padding = Math.floor((width - line.length) / 2);
    for (let i = 0; i < line.length; i++) {
      board[currentRow][1 + padding + i] = (line[i] !== " ") ? line[i] : "";
    }

    currentRow++;
  }
  return board;
};

function render(puzzle) {
  const board = document.getElementById('board');
  board.innerHTML = "";
  tileElements = [];

  for (let row = 0; row < rowSizes.length; row++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    const tileRow = [];

    for (let col = 0; col < rowSizes[row]; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      const letter = puzzle[row][col];

      if (letter === "") {
        tile.classList.add("hidden");
      } else {
        tile.textContent = " ";
        tile.dataset.letter = letter;
      }

      rowDiv.appendChild(tile);
      tileRow.push(tile);
    }
    board.appendChild(rowDiv);
    tileElements.push(tileRow);
  }
  console.log(tileElements);
}

function buildHiddenList(board) {
  const hiddenList = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const ch = board[row][col];
      if (ch !== "") hiddenList.push([row, col, ch]);
    }
  }
  return hiddenList;
}

function reveal(hiddenList) {
  if (hiddenList.length === 0) return;
  for (let i = hiddenList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hiddenList[i], hiddenList[j]] = [hiddenList[j], hiddenList[i]];
  }

  let index = 0;
  const intervalId = setInterval(() => {
    if (index >= hiddenList.length) {
      clearInterval(intervalId);
      alert("try again next time");
      return;
    }
    const [row, col, ch] = hiddenList[index];
    const tile = tileElements[row][col];
    if (tile) tile.textContent = ch;
    index++;
  }, 1000);
}

// **** INIT
const { puzzle, category } = puzzleData[Math.floor(Math.random() * puzzleData.length)];
const categoryText = document.getElementById('category-text');
categoryText.textContent = category.toUpperCase();
const grid = getBoard(puzzle);
render(grid);
const hiddenList = buildHiddenList(grid);
reveal(hiddenList);

