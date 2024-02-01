const canvas = document.getElementById("canvas");
canvas.addEventListener("click", canvas_click, false);
const ctx = canvas.getContext("2d");

const img = document.getElementById("img");
img.addEventListener("load", update_img, false);
const input_img = document.getElementById("input_img");
input_img.addEventListener("change", file_upload, false);
const reader = new FileReader();
reader.addEventListener(
  "load",
  function () {
    img.src = reader.result;
  },
  false
);
addEventListener("resize", window_resize, false);

let tile_row_n = 3;
let tile_col_n = 3;

const input_rows = document.getElementById("input_rows");
input_rows.value = tile_row_n;
input_rows.addEventListener("input", input_val_change, false);
const input_cols = document.getElementById("input_cols");
input_cols.value = tile_col_n;
input_cols.addEventListener("input", input_val_change, false);
const rows_val = document.getElementById("rows_val");
const cols_val = document.getElementById("cols_val");
rows_val.textContent = tile_row_n;
cols_val.textContent = tile_col_n;
const button_reset = document.getElementById("button_reset");
button_reset.addEventListener("click", reset, false);
const button_shuffle = document.getElementById("button_shuffle");
button_shuffle.addEventListener("click", shuffle, false);
const button_original = document.getElementById("button_original");
button_original.addEventListener("click", show_original, false);
const button_check = document.getElementById("button_check");
button_check.addEventListener("click", check, false);

const tile_border_size = 1;
const tile_border_color = "rgba(255, 255, 255, 1)";
const tile_selection_color = "rgba(0, 255, 0, 1)";

// to acount for tile's border
let total_border_size = {
  x: tile_border_size * tile_col_n * 2,
  y: tile_border_size * tile_row_n * 2,
};
// free space between tiles (border not included)
let tile_offset = 1;
let total_tile_offset = {
  x: tile_offset * (tile_col_n - 1),
  y: tile_offset * (tile_row_n - 1),
};
// tile width and height
let tile_size = {
  width: Math.floor(
    (canvas.width - total_border_size.x - total_tile_offset.x) / tile_col_n
  ),
  height: Math.floor(
    (canvas.height - total_border_size.y - total_tile_offset.y) / tile_row_n
  ),
};
// offset to center image
// width and height of the image can wary because of the integer bitmap math
let total_img_offset = {
  x:
    canvas.width -
    (tile_size.width * tile_col_n + total_border_size.x + total_tile_offset.x),
  y:
    canvas.height -
    (tile_size.height * tile_row_n + total_border_size.y + total_tile_offset.y),
};

// check clicked tile
let clicked_tile_index = null;
// restrain check function access when check result is in progress (promise duration)
let check_status = true;

class Tile {
  constructor(pixel_arr, row, col) {
    this.pixel_arr = new Uint8ClampedArray(pixel_arr);
    this.row = row;
    this.col = col;
    this.width = tile_size.width;
    this.height = tile_size.height;
    this.border_color = tile_border_color;
    this.selection = false;
    // to check puzzle completion
    this.row_original = row;
    this.col_original = col;
  }
  draw(ctx) {
    let img_data = new ImageData(this.pixel_arr, this.width, this.height);
    let offset_x =
      this.col * this.width +
      this.col * tile_border_size * 2 +
      this.col * tile_offset +
      total_img_offset_x / 2;
    let offset_y =
      this.row * this.height +
      this.row * tile_border_size * 2 +
      this.row * tile_offset +
      total_img_offset_y / 2;
    ctx.putImageData(
      img_data,
      offset_x + tile_border_size,
      offset_y + tile_border_size
    );
    // border or selection
    if (this.selection) {
      ctx.strokeStyle = tile_selection_color;
    } else {
      ctx.strokeStyle = this.border_color;
    }
    ctx.lineWidth = tile_border_size;
    ctx.strokeRect(
      offset_x,
      offset_y,
      this.width + tile_border_size * 2,
      this.height + tile_border_size * 2
    );
  }
  copy() {
    let temp = new Tile(
      this.pixel_arr,
      this.row,
      this.col,
      this.width,
      this.height
    );
    temp.row_original = this.row_original;
    temp.col_original = this.col_original;
    temp.selection = this.selection;
    return temp;
  }
}

class Puzzle {
  constructor(tiles) {
    this.tiles = tiles;
  }
  draw(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < this.tiles.length; ++i) {
      this.tiles[i].draw(ctx);
    }
  }
  check() {
    for (let i = 0; i < this.tiles.length; ++i) {
      if (
        this.tiles[i].row_original !== this.tiles[i].row ||
        this.tiles[i].col_original !== this.tiles[i].col
      ) {
        return false;
      }
    }
    return true;
  }
  swap(i, j, forced = false) {
    // check for forced swap
    if (
      !forced &&
      Math.abs(this.tiles[i].row - this.tiles[j].row) +
        Math.abs(this.tiles[i].col - this.tiles[j].col) >
        1
    ) {
      show_swap_wrong(i, j);
      return false;
    }
    let temp = this.tiles[i].copy();
    temp.row = this.tiles[j].row;
    temp.col = this.tiles[j].col;
    this.tiles[j].row = this.tiles[i].row;
    this.tiles[j].col = this.tiles[i].col;
    this.tiles[i] = this.tiles[j];
    this.tiles[j] = temp;
    return true;
  }
  reset() {
    for (let i = 0; i < this.tiles.length; ++i) {
      this.tiles[i].row = this.tiles[i].row_original;
      this.tiles[i].col = this.tiles[i].col_original;
    }
  }
  shuffle() {
    let n_swaps = gen_int(
      this.tiles.length,
      this.tiles.length * this.tiles.length + 1
    );
    for (let n = 0; n < n_swaps; ++n) {
      let i = gen_int(0, this.tiles.length);
      let j = gen_int(0, this.tiles.length);
      while (i === j) {
        j = gen_int(0, this.tiles.length);
      }
      puzzle.swap(i, j, true);
    }
  }
}

function gen_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  // [min, max)
  return Math.floor(Math.random() * (max - min) + min);
}

function input_val_change() {
  if (this.id === "input_rows") {
    tile_row_n = parseInt(this.value);
    rows_val.textContent = this.value;
  } else if (this.id === "input_cols") {
    tile_col_n = parseFloat(this.value);
    cols_val.textContent = this.value;
  }
  total_border_size.x = tile_border_size * tile_col_n * 2;
  total_border_size.y = tile_border_size * tile_row_n * 2;
  total_tile_offset.x = tile_offset * (tile_col_n - 1);
  total_tile_offset.y = tile_offset * (tile_row_n - 1);
  tile_size.width = Math.floor(
    (canvas.width - total_border_size.x - total_tile_offset.x) / tile_col_n
  );
  tile_size.height = Math.floor(
    (canvas.height - total_border_size.y - total_tile_offset.y) / tile_row_n
  );
  total_img_offset_x =
    canvas.width -
    (tile_size.width * tile_col_n + total_border_size.x + total_tile_offset.x);
  total_img_offset_y =
    canvas.height -
    (tile_size.height * tile_row_n + total_border_size.y + total_tile_offset.y);
  update_canvas();
}

function reset() {
  puzzle.reset();
  puzzle.draw(ctx);
}

function shuffle() {
  puzzle.shuffle();
  puzzle.draw(ctx);
}

async function show_swap_wrong(i, j) {
  puzzle.tiles[i].border_color = "rgba(255, 0, 0, 1)";
  puzzle.tiles[j].border_color = "rgba(255, 0, 0, 1)";
  puzzle.draw(ctx);
  await new Promise((r) => setTimeout(r, 300));
  puzzle.tiles[i].border_color = tile_border_color;
  puzzle.tiles[j].border_color = tile_border_color;
  puzzle.draw(ctx);
}

async function show_original() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  await new Promise((r) => setTimeout(r, 2000));
  puzzle.draw(ctx);
}

async function check() {
  if (!check_status) {
    return;
  }
  check_status = false;
  let canvas_border_color = canvas.style.borderColor;
  if (puzzle.check()) {
    canvas.style.borderColor = "rgba(0, 255, 0, 1)";
  } else {
    canvas.style.borderColor = "rgba(255, 0, 0, 1)";
  }
  await new Promise((r) => setTimeout(r, 1000));
  canvas.style.borderColor = canvas_border_color;
  check_status = true;
}

function canvas_click(event) {
  const rect = this.getBoundingClientRect();
  const click_x = event.clientX - rect.left,
    click_y = event.clientY - rect.top;
  let temp = -1;
  for (let n = 0; n < puzzle.tiles.length; ++n) {
    let tile = puzzle.tiles[n];
    if (
      click_x >= tile.col * tile.width &&
      click_x < (tile.col + 1) * tile.width &&
      click_y >= tile.row * tile.height &&
      click_y < (tile.row + 1) * tile.height
    ) {
      temp = n;
      break;
    }
  }
  if (puzzle.tiles[temp].selection) {
    puzzle.tiles[temp].selection = false;
  } else {
    puzzle.tiles[temp].selection = true;
  }
  if (clicked_tile_index === null) {
    clicked_tile_index = temp;
    puzzle.draw(ctx);
    return;
  }
  if (temp === clicked_tile_index) {
    clicked_tile_index = null;
    puzzle.draw(ctx);
    return;
  }
  puzzle.tiles[clicked_tile_index].selection = false;
  puzzle.tiles[temp].selection = false;
  puzzle.swap(clicked_tile_index, temp);
  clicked_tile_index = null;
  puzzle.draw(ctx);
}

function file_upload() {
  const file = this.files[0];
  reader.readAsDataURL(file);
}

function update_canvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    0,
    0,
    canvas.width - total_border_size.x - total_tile_offset.x,
    canvas.height - total_border_size.y - total_tile_offset.y
  );
  let cur_img = ctx.getImageData(
    0,
    0,
    canvas.width - total_border_size.x - total_tile_offset.x,
    canvas.height - total_border_size.y - total_tile_offset.y
  );
  let tiles = [];
  let row = 0,
    col = 0;
  for (let n = 0; n < tile_col_n * tile_row_n; ++n) {
    if (col === tile_col_n) {
      col = 0;
      ++row;
    }
    let cur_img_pixel_arr = [];
    for (
      let i = row * tile_size.height;
      i < (row + 1) * tile_size.height;
      ++i
    ) {
      for (
        let j = col * tile_size.width;
        j < (col + 1) * tile_size.width;
        ++j
      ) {
        let index = (i * cur_img.width + j) * 4;
        let r = cur_img.data[index + 0];
        let g = cur_img.data[index + 1];
        let b = cur_img.data[index + 2];
        let a = cur_img.data[index + 3];
        cur_img_pixel_arr.push(r);
        cur_img_pixel_arr.push(g);
        cur_img_pixel_arr.push(b);
        cur_img_pixel_arr.push(a);
      }
    }
    tiles.push(new Tile(cur_img_pixel_arr, row, col));
    ++col;
  }
  puzzle = new Puzzle(tiles);
  puzzle.draw(ctx);
}

function window_resize() {
  let subcol2 = document.getElementById("subcol2");
  let aspect_ratio = Math.min(
    subcol2.clientWidth / img.naturalWidth,
    subcol2.clientHeight / img.naturalHeight
  );
  canvas.width = Math.floor(img.naturalWidth * aspect_ratio);
  canvas.height = Math.floor(img.naturalHeight * aspect_ratio);
  update_vars();
  update_canvas();
}

function update_vars() {
  tile_size.width = Math.floor(
    (canvas.width - total_border_size.x - total_tile_offset.x) / tile_col_n
  );
  tile_size.height = Math.floor(
    (canvas.height - total_border_size.y - total_tile_offset.y) / tile_row_n
  );
  total_img_offset_x =
    canvas.width -
    (tile_size.width * tile_col_n + total_border_size.x + total_tile_offset.x);
  total_img_offset_y =
    canvas.height -
    (tile_size.height * tile_row_n + total_border_size.y + total_tile_offset.y);
}

function update_img() {
  window_resize();
  update_canvas();
}

function debug_info() {
  console.log(
    "DEBUG",
    "\n",
    "\tCANVAS_WIDTH: ",
    canvas.width,
    "\n",
    "\tCANVAS_HEIGHT: ",
    canvas.height,
    "\n",
    "\tN_ROWS: ",
    tile_row_n,
    "\n",
    "\tN_COLS: ",
    tile_col_n,
    "\n",
    "\tTOTAL_WIDTH: ",
    tile_size.width * tile_col_n + total_border_size.x + total_tile_offset.x,
    "\n",
    "\tTOTAL_HEIGHT: ",
    tile_size.height * tile_row_n + total_border_size.y + total_tile_offset.y,
    "\n",
    "\tTILE_WIDTH: ",
    tile_size.width,
    "\n",
    "\tTILE_HEIGHT: ",
    tile_size.height,
    "\n",
    "\tTOTAL_BORDER_SIZE_X: ",
    total_border_size.x,
    "\n",
    "\tTOTAL_BORDER_SIZE_Y: ",
    total_border_size.y,
    "\n",
    "\tTOTAL_TILE_OFFSET_X: ",
    total_tile_offset.x,
    "\n",
    "\tTOTAL_TILE_OFFSET_Y: ",
    total_tile_offset.y,
    "\n",
    "\tTOTAL_IMG_OFFSET_X: ",
    total_img_offset_x,
    "\n",
    "\tTOTAL_IMG_OFFSET_Y: ",
    total_img_offset_y
  );
}

img.src = "puzzle_img.jpg";
