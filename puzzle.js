const canvas = document.getElementById('canvas');
canvas.addEventListener('click', canvas_click, false);
const ctx = canvas.getContext('2d');

const img = document.getElementById("img");
img.addEventListener("load", update_pic, false);
const input = document.getElementById("input");
input.addEventListener("change", file_upload, false);
const reader = new FileReader();
reader.addEventListener("load", function () {
    img.src = reader.result;
}, false);
const button_shuffle = document.getElementById("button_shuffle");
button_shuffle.addEventListener("click", shuffle, false);
const button_check = document.getElementById("button_check");
button_check.addEventListener("click", check, false);

const tile_num = 9;
const tile_row_num = 3;
const tile_col_num = 3;
const tile_width = Math.floor(canvas.width / tile_row_num);
const tile_height = Math.floor(canvas.height / tile_col_num);
const tile_border_size = 1;
const tile_border_color = 'rgba(255, 255, 255, 255)';
const tile_selection_size = 1;
const tile_selection_color = "green";
let tiles = [];
let clicked_tile_index = null;
let check_status = true;

class Tile {
    constructor(pixel_arr, row, col, width, height, border_size, border_color, selection_size, selection_color) {
        this.pixel_arr = pixel_arr;
        this.true_row = row;
        this.true_col = col;
        this.row = row;
        this.col = col;
        this.width = width;
        this.height = height;
        this.border_size = border_size;
        this.border_color = border_color;
        this.selection = false;
        this.selection_size = selection_size;
        this.selection_color = selection_color;
    }
    draw(ctx) {
        for (let i = 0 + this.border_size; i < this.width - this.border_size; ++i) {
            for (let j = 0 + this.border_size; j < this.height - this.border_size; ++j) {
                let index = (i * this.height + j) * 4;
                let r = this.pixel_arr[index + 0];
                let g = this.pixel_arr[index + 1];
                let b = this.pixel_arr[index + 2];
                let a = this.pixel_arr[index + 3];
                ctx.fillStyle = 'rgba(' + r.toString() + ', ' + g.toString() + ', ' + b.toString() + ', ' + a.toString() + ')';
                ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
            }
        }
        // border
        ctx.fillStyle = this.border_color;
        for (let i = 0; i < this.border_size; ++i) {
            for (let j = 0; j < this.height; ++j) {

                ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
            }
        }
        for (let i = this.width - this.border_size; i < this.width; ++i) {
            for (let j = 0; j < this.height; ++j) {
                ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
            }
        }
        for (let i = 0; i < this.width; ++i) {
            for (let j = 0; j < this.border_size; ++j) {

                ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
            }
        }
        for (let i = 0; i < this.width; ++i) {
            for (let j = this.height - this.border_size; j < this.height; ++j) {
                ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
            }
        }
        // selection
        if (this.selection) {
            ctx.fillStyle = this.selection_color;
            for (let i = 0; i < this.selection_size; ++i) {
                for (let j = 0; j < this.height; ++j) {
                    ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
                }
            }
            for (let i = this.width - this.selection_size; i < this.width; ++i) {
                for (let j = 0; j < this.height; ++j) {
                    ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
                }
            }
            for (let i = 0; i < this.width; ++i) {
                for (let j = 0; j < this.selection_size; ++j) {
                    ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
                }
            }
            for (let i = 0; i < this.width; ++i) {
                for (let j = this.height - this.selection_size; j < this.height; ++j) {
                    ctx.fillRect(this.col * this.width + i, this.row * this.height + j, 1, 1);
                }
            }
        }
    }
    copy() {
        let temp = new Tile(this.pixel_arr, this.row, this.col, this.width, this.height, this.border_size, this.border_color, this.selection_size, this.selection_color);
        temp.true_row = this.true_row;
        temp.true_col = this.true_col;
        temp.selection = this.selection;
        return temp;
    }
}

class Puzzle {
    constructor(tiles, tiles_in_row, tiles_in_col) {
        this.tiles = tiles;
        this.tiles_in_row = tiles_in_row;
        this.tiles_in_col = tiles_in_col;
    }
    draw(ctx) {
        for (let i = 0; i < this.tiles.length; ++i) {
            this.tiles[i].draw(ctx);
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

function shuffle() {
    puzzle.shuffle();
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
        if (col === tile_row_num) {
            col = 0;
            ++row;
        }
        let temp_pixel_arr = [];
        for (let i = col * tile_width; i < (col + 1) * tile_width; ++i) {
            for (let j = row * tile_height; j < (row + 1) * tile_height; ++j) {
                let index = (j * temp.width + i) * 4;
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
        tiles.push(new Tile(temp_pixel_arr, row, col, tile_width, tile_height, tile_border_size, tile_border_color, tile_selection_size, tile_selection_color));
        ++col;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puzzle = new Puzzle(tiles, tile_row_num, tile_col_num);
    puzzle.draw(ctx);
}

img.src = "test_img.jpg";