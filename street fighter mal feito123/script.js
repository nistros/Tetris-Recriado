// ------------------------------
// FUNÇÃO PARA ESPELHAR SPRITE
// ------------------------------
function drawFighter(ctx, img, x, y, width, height, facingLeft) {
    ctx.save();
    if (facingLeft) {
        ctx.scale(-1, 1);
        ctx.drawImage(img, -x - width, y, width, height);
    } else {
        ctx.drawImage(img, x, y, width, height);
    }
    ctx.restore();
}

// ------------------------------
// CARREGAR CENÁRIO REALISTA
// ------------------------------
const background = new Image();
background.src = "stages/stage1.png";

// ------------------------------
// PERSONAGENS REAIS
// ------------------------------
const characters = {
    Ryu: {
        speed: 5,
        jump: 14,
        light: 10,
        heavy: 18,
        spriteIdle: "sprites/Ryu/idle.png",
        spriteAttack: "sprites/Ryu/attack.png"
    },
    ChunLi: {
        speed: 7,
        jump: 15,
        light: 8,
        heavy: 20,
        spriteIdle: "sprites/ChunLi/idle.png",
        spriteAttack: "sprites/ChunLi/attack.png"
    }
};

// preencher selects
const p1Sel = document.getElementById("p1-select");
const p2Sel = document.getElementById("p2-select");

for (const c in characters) {
    p1Sel.innerHTML += `<option>${c}</option>`;
    p2Sel.innerHTML += `<option>${c}</option>`;
}

// ------------------------------
// ENGINE
// ------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

class Fighter {
    constructor(x, controls, data) {
        this.x = x;
        this.y = 350;
        this.width = 120;
        this.height = 140;

        this.speed = data.speed;
        this.jumpPower = data.jump;
        this.lightDamage = data.light;
        this.heavyDamage = data.heavy;

        this.velY = 0;
        this.health = 100;

        this.spriteIdle = new Image();
        this.spriteIdle.src = data.spriteIdle;
        this.spriteAttack = new Image();
        this.spriteAttack.src = data.spriteAttack;

        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackType = "idle";

        this.controls = controls;
        this.keys = { left: false, right: false, up: false };

        this.facingLeft = false;
    }

    updateFacing(enemy) {
        this.facingLeft = enemy.x < this.x;
    }

    move() {
        if (this.keys.left) this.x -= this.speed;
        if (this.keys.right) this.x += this.speed;

        this.y += this.velY;
        this.velY += 0.7;

        if (this.y >= 350) {
            this.y = 350;
            this.velY = 0;
        }
    }

    jump() {
        if (this.keys.up && this.y >= 350) {
            this.velY = -this.jumpPower;
        }
    }

    startAttack(type) {
        if (!this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 20;
            this.attackType = type;
        }
    }

    attack(enemy) {
        if (!this.isAttacking) return;
        const damage = this.attackType === "light" ? this.lightDamage : this.heavyDamage;
        const range = this.attackType === "light" ? 50 : 80;

        const hit = this.x < enemy.x + enemy.width + range && this.x + this.width + range > enemy.x;

        if (hit && !enemy.wasHit) {
            enemy.health -= damage;
            enemy.wasHit = true;
        }

        this.attackTimer--;
        if (this.attackTimer <= 0) {
            this.isAttacking = false;
            enemy.wasHit = false;
        }
    }

    draw() {
        let img = this.isAttacking ? this.spriteAttack : this.spriteIdle;
        drawFighter(ctx, img, this.x, this.y - 40, this.width, this.height, this.facingLeft);

        ctx.fillStyle = this.health > 40 ? "lime" : "red";
        ctx.fillRect(this.x, this.y - 20, this.health, 6);
    }
}

// ------------------------------
// CRIAR PERSONAGENS
// ------------------------------
let player1, player2;

function createPlayers() {
    player1 = new Fighter(
        100,
        { left: "a", right: "d", up: "w", light: "s", heavy: "f" },
        characters[p1Sel.value]
    );

    player2 = new Fighter(
        650,
        { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", light: "ArrowDown", heavy: "/" },
        characters[p2Sel.value]
    );
}

createPlayers();
p1Sel.onchange = createPlayers;
p2Sel.onchange = createPlayers;

// ------------------------------
// INPUT
// ------------------------------
document.addEventListener("keydown", e => {
    for (const p of [player1, player2]) {
        if (e.key === p.controls.left) p.keys.left = true;
        if (e.key === p.controls.right) p.keys.right = true;
        if (e.key === p.controls.up) p.keys.up = true;

        if (e.key === p.controls.light) p.startAttack("light");
        if (e.key === p.controls.heavy) p.startAttack("heavy");
    }
});

document.addEventListener("keyup", e => {
    for (const p of [player1, player2]) {
        if (e.key === p.controls.left) p.keys.left = false;
        if (e.key === p.controls.right) p.keys.right = false;
        if (e.key === p.controls.up) p.keys.up = false;
    }
});

// ------------------------------
// LOOP DE JOGO
// ------------------------------
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    player1.jump();
    player2.jump();

    player1.move();
    player2.move();

    player1.updateFacing(player2);
    player2.updateFacing(player1);

    player1.attack(player2);
    player2.attack(player1);

    player1.draw();
    player2.draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();