const canvas = document.getElementById('canvas');
canvas.addEventListener('click', canvas_click, false);
const ctx = canvas.getContext('2d');

const img = document.getElementById("img");
img.addEventListener("load", update_pic, false);
const input_img = document.getElementById("input_img");
input_img.addEventListener("change", file_upload, false);
const reader = new FileReader();
reader.addEventListener("load", function () {
    img.src = reader.result;
}, false);

let tile_row_num = 3;
let tile_col_num = 3;
let tile_num = tile_col_num * tile_row_num;
const input_rows = document.getElementById("input_rows");
input_rows.value = tile_row_num;
input_rows.addEventListener("input", input_val_change, false);
const input_cols = document.getElementById("input_cols");
input_cols.value = tile_col_num;
input_cols.addEventListener("input", input_val_change, false);
const rows_val = document.getElementById("rows_val");
const cols_val = document.getElementById("cols_val");
rows_val.textContent = tile_row_num;
cols_val.textContent = tile_col_num;
const button_shuffle = document.getElementById("button_shuffle");
button_shuffle.addEventListener("click", shuffle, false);
const button_original = document.getElementById("button_original");
button_original.addEventListener("click", show_original, false);
const button_check = document.getElementById("button_check");
button_check.addEventListener("click", check, false);

let tile_width = Math.floor(canvas.width / tile_col_num);
let tile_height = Math.floor(canvas.height / tile_row_num);

const tile_border_size = 1;
const tile_border_color = 'rgba(255, 255, 255, 255)';
const tile_selection_color = "green";
let tiles = [];
let clicked_tile_index = null;
let check_status = true;

class Tile {
    constructor(pixel_arr, row, col, width, height) {
        this.pixel_arr = pixel_arr;
        this.true_row = row;
        this.true_col = col;
        this.row = row;
        this.col = col;
        this.width = width;
        this.height = height;
        this.selection = false;
    }
    draw(ctx) {
        let img_data = ctx.getImageData(this.col * this.width, this.row * this.height, this.width, this.height);
        img_data.data.set(this.pixel_arr);
        ctx.putImageData(img_data, this.col * this.width, this.row * this.height);
    }
    copy() {
        let temp = new Tile(this.pixel_arr, this.row, this.col, this.width, this.height);
        temp.true_row = this.true_row;
        temp.true_col = this.true_col;
        temp.selection = this.selection;
        return temp;
    }
}

class Puzzle {
    constructor(tiles, tiles_in_row, border_size, border_color, selection_color) {
        this.tiles = tiles;
        this.tiles_in_row = tiles_in_row;
        this.border_size = border_size;
        this.border_color = border_color;
        this.selection_color = selection_color;
    }
    draw(ctx) {
        for (let i = 0; i < this.tiles.length; ++i) {
            this.tiles[i].draw(ctx);
        }
        // border
        ctx.strokeStyle = this.border_color;
        ctx.lineWidth = this.border_size;
        let tile_width = this.tiles[0].width;
        let tile_height = this.tiles[0].height;
        let puzzle_width = tile_width * this.tiles_in_row;
        let puzzle_height = tile_height * (this.tiles.length / this.tiles_in_row);
        for (let i = 0; i < this.tiles_in_row; ++i) {
            ctx.beginPath();
            ctx.moveTo(i * tile_width, 0);
            ctx.lineTo(i * tile_width, puzzle_height);
            ctx.stroke();
        }
        for (let i = 0; i < (this.tiles.length / this.tiles_in_row); ++i) {
            ctx.beginPath();
            ctx.moveTo(0, i * tile_height);
            ctx.lineTo(puzzle_width, i * tile_height);
            ctx.stroke();
        }
        // selection
        ctx.strokeStyle = this.selection_color;
        for (let i = 0; i < this.tiles.length; ++i) {
            if (this.tiles[i].selection) {
                ctx.strokeRect(this.tiles[i].col * tile_width, this.tiles[i].row * tile_height, tile_width, tile_height);
                break;
            }
        }
    }
    check() {
        let row = 0,
            col = 0;
        for (let i = 0; i < this.tiles.length; ++i) {
            if (col === this.tiles_in_row) {
                col = 0;
                ++row;
            }
            if (this.tiles[i].true_row !== row || this.tiles[i].true_col !== col) {
                return false;
            }
            ++col;
        }
        return true;
    }
    swap(i, j, check) {
        if (check && Math.abs(this.tiles[i].row - this.tiles[j].row) + Math.abs(this.tiles[i].col - this.tiles[j].col) > 1) {
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
    shuffle() {
        for (let n = 0; n < gen_int(tiles.length, tiles.length * tiles.length + 1); ++n) {
            let i = gen_int(0, tiles.length);
            let j = gen_int(0, tiles.length);
            while (i == j) {
                j = gen_int(0, tiles.length);
            }
            puzzle.swap(i, j, false)
        }
    }
}

function gen_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function input_val_change() {
    if (this.id === "input_rows") {
        tile_row_num = parseInt(this.value);
        rows_val.textContent = this.value;
    } else {
        tile_col_num = parseFloat(this.value);
        cols_val.textContent = this.value;
    }
    tile_num = tile_col_num * tile_row_num;
    tile_width = Math.floor(canvas.width / tile_col_num);
    tile_height = Math.floor(canvas.height / tile_row_num);
    update_pic();
}

function shuffle() {
    puzzle.shuffle();
    puzzle.draw(ctx);
}

async function show_original(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    await new Promise(r => setTimeout(r, 2000));
    puzzle.draw(ctx);
}

async function check() {
    if (!check_status) {
        return;
    }
    check_status = false;
    let temp = canvas.style.borderColor;
    if (puzzle.check()) {
        canvas.style.borderColor = 'green';
    } else {
        canvas.style.borderColor = 'red';
    }
    await new Promise(r => setTimeout(r, 2000));
    canvas.style.borderColor = temp;
    check_status = true;
}

function canvas_click(event) {
    const rect = this.getBoundingClientRect();
    const click_x = event.clientX - rect.left,
        click_y = event.clientY - rect.top;
    let temp = -1;
    for (let n = 0; n < puzzle.tiles.length; ++n) {
        let tile = puzzle.tiles[n];
        if ((click_x >= tile.col * tile.width && click_x < (tile.col + 1) * tile.width) &&
            (click_y >= tile.row * tile.height && click_y < (tile.row + 1) * tile.height)) {
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
    puzzle.swap(clicked_tile_index, temp, true);
    clicked_tile_index = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puzzle.draw(ctx);
}

function file_upload() {
    const file = this.files[0];
    reader.readAsDataURL(file);
}

function gen_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function update_pic() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
    tiles = [];
    let row = 0,
        col = 0;
    for (let n = 0; n < tile_num; ++n) {
        if (col === tile_col_num) {
            col = 0;
            ++row;
        }
        let temp_pixel_arr = [];
        for (let i = row * tile_height; i < (row + 1) * tile_height; ++i) {
            for (let j = col * tile_width; j < (col + 1) * tile_width; ++j) {
                let index = (i * temp.height + j) * 4;
                let r = temp.data[index + 0];
                let g = temp.data[index + 1];
                let b = temp.data[index + 2];
                let a = temp.data[index + 3];
                temp_pixel_arr.push(r)
                temp_pixel_arr.push(g)
                temp_pixel_arr.push(b)
                temp_pixel_arr.push(a)
            }
        }
        tiles.push(new Tile(temp_pixel_arr, row, col, tile_width, tile_height));
        ++col;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puzzle = new Puzzle(tiles, tile_col_num, tile_border_size, tile_border_color, tile_selection_color);
    puzzle.draw(ctx);
}

img.src = "test_img.jpg";