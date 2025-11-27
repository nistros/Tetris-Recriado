window.onload = () => {
    const
        background = document.getElementById("background"),
        scoreLbl = document.getElementById("score"),
        linesLbl = document.getElementById("lines"),
        feverBarFill = document.getElementById("fever-bar-fill"),
        canvas = document.getElementById("game-canvas"),
        ctx = canvas.getContext("2d");

    class Tetromino {
        static COLORS = ["blue", "green", "yellow", "red", "orange", "light-blue", "purple"];
        static BLOCK_SIZE = 28;
        static DELAY = 400;
        static DELAY_INCREASED = 5;

        constructor(xs, ys, color = null) {
            this.x = xs;
            this.y = ys;
            this.length = xs.length;
            if (color !== null) {
                this.color = color;
                this.img = new Image();
                this.img.src = `resources/${Tetromino.COLORS[color]}.jpg`;
            }
        }

        update(updFunc) {
            for (let i = 0; i < this.length; ++i) {
                ctx.clearRect(
                    this.x[i] * Tetromino.BLOCK_SIZE,
                    this.y[i] * Tetromino.BLOCK_SIZE,
                    Tetromino.BLOCK_SIZE,
                    Tetromino.BLOCK_SIZE
                );

                updFunc(i);
            }
            this.draw();
        }

        draw() {
            if (!this.img.complete) {
                this.img.onload = () => this.draw();
                return;
            }
            // Print the current tetromino
            for (let i = 0; i < this.length; ++i) {
                ctx.drawImage(
                    this.img,
                    this.x[i] * Tetromino.BLOCK_SIZE,
                    this.y[i] * Tetromino.BLOCK_SIZE,
                    Tetromino.BLOCK_SIZE,
                    Tetromino.BLOCK_SIZE
                );
            }
        }

        collides(checkFunc) {
            for (let i = 0; i < this.length; ++i) {
                const { x, y } = checkFunc(i);
                if (x < 0 || x >= FIELD_WIDTH || y < 0 || y >= FIELD_HEIGHT || FIELD[y][x] !== false)
                    return true;
            }
            return false;
        }

        merge() {
            for (let i = 0; i < this.length; ++i) {
                FIELD[this.y[i]][this.x[i]] = this.color;
            }
        }

        rotate() {
            const
                maxX = Math.max(...this.x),
                minX = Math.min(...this.x),
                minY = Math.min(...this.y),
                nx = [],
                ny = [];

            if (!this.collides(i => {
                nx.push(maxX + minY - this.y[i]);
                ny.push(this.x[i] - minX + minY);
                return { x: nx[i], y: ny[i] };
            })) {
                this.update(i => {
                    this.x[i] = nx[i];
                    this.y[i] = ny[i];
                });
            }
        }
    }

    const
        FIELD_WIDTH = 10,
        FIELD_HEIGHT = 20,
        FIELD = Array.from({ length: FIELD_HEIGHT }),
        MIN_VALID_ROW = 4,
        TETROMINOES = [
            new Tetromino([0, 0, 0, 0], [0, 1, 2, 3]),
            new Tetromino([0, 0, 1, 1], [0, 1, 0, 1]),
            new Tetromino([0, 1, 1, 1], [0, 0, 1, 2]),
            new Tetromino([0, 0, 0, 1], [0, 1, 2, 0]),
            new Tetromino([0, 1, 1, 2], [0, 0, 1, 1]),
            new Tetromino([0, 1, 1, 2], [1, 1, 0, 1]),
            new Tetromino([0, 1, 1, 2], [1, 1, 0, 0])
        ];

    let tetromino = null,
        delay,
        score,
        lines;

    // --- FEVER variables ---
    let feverBar = 0;
    let feverActive = false;
    let feverMultiplier = 1;
    let piecesSinceLastLine = 0;

    (function setup() {
        canvas.style.top = Tetromino.BLOCK_SIZE + "px";
        canvas.style.left = Tetromino.BLOCK_SIZE + "px";

        ctx.canvas.width = FIELD_WIDTH * Tetromino.BLOCK_SIZE;
        ctx.canvas.height = FIELD_HEIGHT * Tetromino.BLOCK_SIZE;

        // Scale background
        const scale = Tetromino.BLOCK_SIZE / 13.83333333333;
        background.style.width = scale * 166 + "px";
        background.style.height = scale * 304 + "px";

        // Offset each block to the middle of the table width
        const middle = Math.floor(FIELD_WIDTH / 2);
        for (const t of TETROMINOES) t.x = t.x.map(x => x + middle);

        reset();
        draw();
    })();

    function reset() {
        // Make false all blocks
        FIELD.forEach((_, y) => FIELD[y] = Array.from({ length: FIELD_WIDTH }).map(_ => false));

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        delay = Tetromino.DELAY;
        score = 0;
        lines = 0;

        feverBar = 0;
        feverActive = false;
        feverMultiplier = 1;
        piecesSinceLastLine = 0;
    }

    function draw() {
        if (tetromino) {

            // Collision?
            if (tetromino.collides(i => ({ x: tetromino.x[i], y: tetromino.y[i] + 1 }))) {
                tetromino.merge();
                // Prepare for new tetromino
                tetromino = null;

                // Check for completed rows
                let completedRows = 0;
                for (let y = FIELD_HEIGHT - 1; y >= MIN_VALID_ROW; --y) {
                    if (FIELD[y].every(e => e !== false)) {
                        for (let ay = y; ay >= MIN_VALID_ROW; --ay)
                            FIELD[ay] = [...FIELD[ay - 1]];

                        ++completedRows;
                        ++y; // keep same row after shift
                    }
                }

                if (completedRows) {
                    // Reset error count
                    piecesSinceLastLine = 0;

                    // Increase fever bar
                    feverBar = Math.min(100, feverBar + completedRows * 25);

                    if (feverBar >= 100 && !feverActive) {
                        feverActive = true;
                        document.body.classList.add("flash");
                        setTimeout(() => document.body.classList.remove("flash"), 600);
                    }

                    feverMultiplier = feverActive ? 2 : 1;

                    // Increase score
                    score += ([40, 100, 300, 1200][completedRows - 1]) * feverMultiplier;
                    lines += completedRows;

                    // Redraw field
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    for (let y = MIN_VALID_ROW; y < FIELD_HEIGHT; ++y)
                        for (let x = 0; x < FIELD_WIDTH; ++x)
                            if (FIELD[y][x] !== false)
                                new Tetromino([x], [y], FIELD[y][x]).draw();

                } else {
                    // No lines completed: increment errors
                    piecesSinceLastLine++;

                    if (piecesSinceLastLine >= 5) {
                        feverBar = Math.max(0, feverBar - 20);
                        piecesSinceLastLine = 0;

                        if (feverBar <= 0) {
                            feverActive = false;
                            feverMultiplier = 1;
                        }
                    }

                    // Check for game over
                    if (FIELD[MIN_VALID_ROW - 1].some(block => block !== false)) {
                        alert("You have lost!");
                        reset();
                    }
                }

            } else {
                tetromino.update(i => ++tetromino.y[i]);
            }
        }
        // No active tetromino: create new one
        else {
            scoreLbl.innerText = score;
            linesLbl.innerText = lines;

            // Update fever bar UI
            feverBarFill.style.width = feverBar + "%";

            // Create random tetromino
            tetromino = (({ x, y }, color) =>
                new Tetromino([...x], [...y], color)
            )(
                TETROMINOES[Math.floor(Math.random() * (TETROMINOES.length - 1))],
                Math.floor(Math.random() * (Tetromino.COLORS.length - 1))
            );

            tetromino.draw();
        }

        setTimeout(draw, delay);
    }

    // Move controls
    window.onkeydown = event => {
        switch (event.key) {

            // Move left
            case "ArrowLeft":
                if (!tetromino.collides(i => ({ x: tetromino.x[i] - 1, y: tetromino.y[i] })))
                    tetromino.update(i => --tetromino.x[i]);
                break;

            // Move right
            case "ArrowRight":
                if (!tetromino.collides(i => ({ x: tetromino.x[i] + 1, y: tetromino.y[i] })))
                    tetromino.update(i => ++tetromino.x[i]);
                break;

            // Soft drop (faster down)
            case "ArrowDown":
                delay = Tetromino.DELAY / Tetromino.DELAY_INCREASED;
                break;

            // Rotate piece
            case "ArrowUp":
                tetromino.rotate();
                break;

            // Hard drop (space) — drop immediately
            case " ":
                while (!tetromino.collides(i => ({
                    x: tetromino.x[i],
                    y: tetromino.y[i] + 1
                }))) {
                    tetromino.update(i => ++tetromino.y[i]);
                }
                break;
        }
    };

    window.onkeyup = event => {
        if (event.key === "ArrowDown")
            delay = Tetromino.DELAY;
    }
};
