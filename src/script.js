import './style.css';

const row_sizes = [12, 14, 14, 12];
// TODO: fetch from database
const puzzle_data = [
  { puzzle: "airplane", category: "in the sky" },
  { puzzle: "perfectly popped popcorn kernels", category: "food" },
  { puzzle: "perfect pop popcorn", category: "thing" },
  { puzzle: "rang de basanti", category: "bollywood" },
];

let tile_elements = [];
let hidden_list = [];
let reveal_interval_id = null;
let revealed = new Set();
let solve_mode = false;
let active_tile_ref = null; // {row, col, tile, handler, original_text, has_changed}
let user_edited = new Set();

function get_board(puzzle_text) {
  const words = puzzle_text.toUpperCase().split(" ");
  const board = row_sizes.map((size) => Array(size).fill(""));
  const start_row = puzzle_text.length <= 24 ? 1 : 0; // for centering short phrases

  let idx = 0;
  for (let row = start_row; row < row_sizes.length && idx < words.length; row++) {
    const width = row_sizes[row] - 2;
    const line_words = [];
    let line_length = 0;

    while (idx < words.length) {
      const new_length = line_length + (line_length ? 1 : 0) + words[idx].length;
      if (new_length > width) break;
      line_words.push(words[idx]);
      line_length = new_length;
      idx++;
    }

    const line = line_words.join(" ");
    const padding = Math.floor((width - line.length) / 2);
    for (let i = 0; i < line.length; i++) {
      board[row][1 + padding + i] = line[i] === " " ? "" : line[i];
    }
  }

  return board;
}

function render(board_data) {
  const board = document.querySelector(".board");
  board.innerHTML = "";
  tile_elements = [];

  row_sizes.forEach((size, row) => {
    const row_div = document.createElement("div");
    row_div.className = "row";

    const tile_row = Array.from({ length: size }, (_, col) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = row;
      tile.dataset.col = col;
      if (board_data[row][col] === "") tile.classList.add("hidden");
      row_div.appendChild(tile);
      return tile;
    });

    board.appendChild(row_div);
    tile_elements.push(tile_row);
  });
}

function build_hidden_list(grid) {
  return grid.flatMap((row, rid) => row.flatMap((ch, cid) => ch !== "" ? [[rid, cid, ch]] : []));
}

function stop_reveal() {
  if (reveal_interval_id) clearInterval(reveal_interval_id);
  reveal_interval_id = null;
}

function start_reveal(reveal_list = hidden_list) {
  stop_reveal();
  if (!reveal_list.length) return;

  const shuffled = [...reveal_list];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  let index = 0;
  reveal_interval_id = setInterval(() => {
    if (index >= shuffled.length) return stop_reveal();

    const [row, col, ch] = shuffled[index];
    const tile = tile_elements[row]?.[col];
    if (tile?.textContent.trim() === "") {
      tile.textContent = ch;
      revealed.add(`${row},${col}`);
    }
    index++;
  }, 1000);
}

function check_full_puzzle() {
  const correct = hidden_list.every(([row, col, expected]) => tile_elements[row][col].textContent === expected);
  if (correct) {
    alert("CORRECT!");
  } else {
    alert("INCORRECT! Keep guessing!");
    for (const coord of user_edited) {
      const [row, col] = coord.split(",").map(Number);
      tile_elements[row][col].textContent = "";
    }
    user_edited.clear();
    const unrevealed_list = hidden_list.filter(([row, col]) => !revealed.has(`${row},${col}`));
    start_reveal(unrevealed_list);
  }
  exit_solve_mode();
}

function get_empty_editable_tile() {
  for (const [row, col] of hidden_list) {
    if (!revealed.has(`${row},${col}`) && tile_elements[row][col].textContent.trim() === "") return { row, col };
  }
  return null;
}

function deactivate_active_tile() {
  if (!active_tile_ref) return;

  const { tile, key_handler, original_text, has_changed } = active_tile_ref;

  tile.removeEventListener("keydown", key_handler);

  if (!has_changed && original_text !== "" && tile.textContent.trim() === "") {
    tile.textContent = original_text;
  }

  tile.removeAttribute("contenteditable");
  tile.classList.remove("editing");

  active_tile_ref = null;
}

function activate_tile(row, col) {
  if (!solve_mode) return;
  if (revealed.has(`${row},${col}`)) return;

  const tile = tile_elements[row][col];
  if (!tile) return;

  if (active_tile_ref && active_tile_ref.row === row && active_tile_ref.col === col) {
    tile.textContent = "";
    tile.focus();
    return;
  }

  const previous_text = tile.textContent.trim();

  deactivate_active_tile();

  tile.setAttribute("contenteditable", "true");
  tile.classList.add("editing");

  if (previous_text !== "") tile.textContent = "";

  tile.focus();

  const key_handler = (e) => {
    if (!solve_mode) return;

    if (e.key === "Enter") {
      e.preventDefault();
      deactivate_active_tile();
      check_full_puzzle();
      return;
    }

    if (/^[a-zA-Z]$/i.test(e.key)) {
      e.preventDefault();
      tile.textContent = e.key.toUpperCase();
      if (active_tile_ref) {
        active_tile_ref.has_changed = true;
        user_edited.add(`${row},${col}`);
      }

      const next = get_empty_editable_tile();
      if (next) {
        activate_tile(next.row, next.col);
      } else {
        deactivate_active_tile();
        check_full_puzzle();
      }
    }
  };

  tile.addEventListener("keydown", key_handler);
  active_tile_ref = { row, col, tile, key_handler, original_text: previous_text, has_changed: false, };
}

function exit_solve_mode() {
  if (!solve_mode) return;
  solve_mode = false;
  deactivate_active_tile();
  user_edited.clear();
}

document.querySelector(".board").addEventListener("click", (e) => {
  if (!solve_mode) return;
  const tile = e.target.closest(".tile");
  const { row, col } = tile?.dataset ?? {};
  if (!tile || !row || !col || revealed.has(`${row},${col}`)) return;
  activate_tile(Number(row), Number(col));
});

document.querySelector(".solve-button").addEventListener("click", () => {
  if (solve_mode) return;

  solve_mode = true;
  stop_reveal();

  const first = get_empty_editable_tile();
  if (first) {
    activate_tile(first.row, first.col);
  } else {
    alert("There are no editable tiles left.");
    solve_mode = false;
  }
});

// **** INIT
exit_solve_mode();
stop_reveal();

const { puzzle, category } = puzzle_data[Math.floor(Math.random() * puzzle_data.length)];
document.querySelector(".category").textContent = category.toUpperCase();

const grid = get_board(puzzle);
render(grid);

hidden_list = build_hidden_list(grid);
revealed.clear();
active_tile_ref = null;

start_reveal(hidden_list);

