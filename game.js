// インベーダーゲーム
class InvaderGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameContainer = document.getElementById('game-container');
        this.scoreElement = document.getElementById('game-score');
        this.livesElement = document.getElementById('game-lives');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.gameOverText = document.getElementById('game-over-text');
        this.finalScoreElement = document.getElementById('final-score');

        this.isRunning = false;
        this.animationId = null;

        this.init();
        this.bindEvents();
    }

    init() {
        // プレイヤー
        this.player = {
            x: this.canvas.width / 2 - 20,
            y: this.canvas.height - 50,
            width: 40,
            height: 20,
            speed: 8,  // 6→8 移動速度アップ
            color: '#0f0'
        };

        // 弾
        this.bullets = [];
        this.bulletSpeed = 10;  // 8→10 弾速アップ

        // 敵
        this.enemies = [];
        this.enemyRows = 3;     // 4→3 敵の行数を減少
        this.enemyCols = 5;     // 8→5 敵の列数を減少
        this.enemyWidth = 30;
        this.enemyHeight = 20;
        this.enemyPadding = 15; // 10→15 敵の間隔を広げる
        this.enemySpeed = 0.6;  // 1→0.6 敵の移動速度ダウン
        this.enemyDirection = 1;
        this.enemyDropAmount = 15;  // 20→15 敵の降下量を減少

        // 敵の弾
        this.enemyBullets = [];
        this.enemyBulletSpeed = 2.5;  // 4→2.5 敵弾速度ダウン
        this.enemyShootChance = 0.002;  // 0.005→0.002 発射確率ダウン

        // ゲーム状態
        this.score = 0;
        this.lives = 5;  // 3→5 ライフ増加
        this.keys = {};

        // 敵を生成
        this.createEnemies();
    }

    createEnemies() {
        this.enemies = [];
        const startX = 30;
        const startY = 50;

        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                this.enemies.push({
                    x: startX + col * (this.enemyWidth + this.enemyPadding),
                    y: startY + row * (this.enemyHeight + this.enemyPadding),
                    width: this.enemyWidth,
                    height: this.enemyHeight,
                    alive: true,
                    type: row // 行によって敵の種類を変える
                });
            }
        }
    }

    bindEvents() {
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (this.isRunning) {
                this.keys[e.code] = true;
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.shoot();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // ゲームを閉じる
        document.getElementById('game-close-btn').addEventListener('click', () => {
            this.close();
        });

        // リスタート
        document.getElementById('game-restart-btn').addEventListener('click', () => {
            this.restart();
        });

        // ゲームで遊ぶボタン
        document.getElementById('play-game-btn').addEventListener('click', () => {
            this.start();
        });
    }

    start() {
        // 猫を非表示
        document.getElementById('celebration-cat').classList.remove('active');
        document.getElementById('play-game-btn').classList.remove('visible');

        // ゲーム画面を表示
        this.gameContainer.classList.add('active');
        this.gameOverScreen.classList.remove('active');

        // 初期化
        this.init();
        this.updateUI();

        // ゲーム開始
        this.isRunning = true;
        this.gameLoop();
    }

    close() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.gameContainer.classList.remove('active');
    }

    restart() {
        this.gameOverScreen.classList.remove('active');
        this.init();
        this.updateUI();
        this.isRunning = true;
        this.gameLoop();
    }

    shoot() {
        // 連射制限（緩和: 3→5発まで）
        if (this.bullets.length < 5) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 10
            });
        }
    }

    update() {
        // プレイヤー移動
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }

        // 弾の移動
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= this.bulletSpeed;
            return bullet.y > 0;
        });

        // 敵の弾の移動
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += this.enemyBulletSpeed;
            return bullet.y < this.canvas.height;
        });

        // 敵の移動
        let shouldDrop = false;
        let leftMost = this.canvas.width;
        let rightMost = 0;

        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                if (enemy.x < leftMost) leftMost = enemy.x;
                if (enemy.x + enemy.width > rightMost) rightMost = enemy.x + enemy.width;
            }
        });

        if (rightMost >= this.canvas.width - 10 || leftMost <= 10) {
            this.enemyDirection *= -1;
            shouldDrop = true;
        }

        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.x += this.enemySpeed * this.enemyDirection;
                if (shouldDrop) {
                    enemy.y += this.enemyDropAmount;
                }

                // 敵がプレイヤーの位置まで来たらゲームオーバー
                if (enemy.y + enemy.height >= this.player.y) {
                    this.gameOver(false);
                }

                // 敵の発射
                if (Math.random() < this.enemyShootChance) {
                    this.enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 2,
                        y: enemy.y + enemy.height,
                        width: 4,
                        height: 10
                    });
                }
            }
        });

        // 衝突判定: 弾と敵
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach(enemy => {
                if (enemy.alive && this.isColliding(bullet, enemy)) {
                    enemy.alive = false;
                    this.bullets.splice(bulletIndex, 1);
                    this.score += (4 - enemy.type) * 10; // 上の敵ほど高得点
                    this.updateUI();
                }
            });
        });

        // 衝突判定: 敵の弾とプレイヤー
        this.enemyBullets.forEach((bullet, index) => {
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(index, 1);
                this.lives--;
                this.updateUI();
                if (this.lives <= 0) {
                    this.gameOver(false);
                }
            }
        });

        // 全敵を倒したかチェック
        if (this.enemies.every(enemy => !enemy.alive)) {
            this.gameOver(true);
        }
    }

    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    draw() {
        // 背景クリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // プレイヤー描画（宇宙船風）
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();

        // 弾描画
        this.ctx.fillStyle = '#0ff';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // 敵の弾描画
        this.ctx.fillStyle = '#f00';
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // 敵描画（インベーダー風）
        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                const colors = ['#f0f', '#ff0', '#0ff', '#f80'];
                this.ctx.fillStyle = colors[enemy.type];

                // シンプルなインベーダー風のドット絵
                const px = 3; // ピクセルサイズ
                const ex = enemy.x;
                const ey = enemy.y;

                // 体
                this.ctx.fillRect(ex + px * 2, ey, px * 6, px * 2);
                this.ctx.fillRect(ex, ey + px * 2, px * 10, px * 2);
                this.ctx.fillRect(ex + px, ey + px * 4, px * 8, px * 2);

                // 目
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(ex + px * 2, ey + px * 2, px, px);
                this.ctx.fillRect(ex + px * 7, ey + px * 2, px, px);
            }
        });
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
    }

    gameOver(won) {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.gameOverText.textContent = won ? 'クリア！' : 'ゲームオーバー';
        this.gameOverText.style.color = won ? '#0f0' : '#f00';
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.add('active');
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲームインスタンスを作成
const invaderGame = new InvaderGame();
