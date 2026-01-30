// バスケットボール フリースローゲーム
class BasketballGame {
    constructor() {
        this.canvas = document.getElementById('basketball-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameContainer = document.getElementById('basketball-game-container');
        this.scoreElement = document.getElementById('basketball-game-score');
        this.shotsElement = document.getElementById('basketball-shots');
        this.gameOverScreen = document.getElementById('basketball-game-over-screen');
        this.finalScoreElement = document.getElementById('basketball-final-score');

        this.isRunning = false;
        this.animationId = null;

        this.bindEvents();
    }

    init() {
        // ゲーム状態
        this.score = 0;
        this.shots = 10; // 残りシュート数
        this.maxShots = 10;

        // ボール
        this.ball = {
            x: 250,
            y: 350,
            radius: 20,
            vx: 0,
            vy: 0,
            shooting: false,
            landed: false
        };

        // ゴール
        this.hoop = {
            x: 250,
            y: 100,
            width: 80,
            rimY: 110,
            netHeight: 40
        };

        // パワーゲージ
        this.power = 0;
        this.powerDirection = 1;
        this.powerSpeed = 2;
        this.maxPower = 100;
        this.charging = false;

        // 角度ゲージ
        this.angle = 80; // 度
        this.angleDirection = 1;
        this.angleSpeed = 1.5;
        this.minAngle = 60;
        this.maxAngle = 100;
        this.angleLocked = false;

        // 結果表示
        this.resultText = '';
        this.resultTimer = 0;

        // エフェクト
        this.particles = [];

        // チュートリアル
        this.tutorialActive = false;
        this.phase = 'angle'; // 'angle', 'power', 'shooting'
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.tutorialActive && e.code === 'Space') {
                e.preventDefault();
                this.tutorialActive = false;
                this.isRunning = true;
                this.gameLoop();
                return;
            }

            if (this.isRunning && !this.ball.shooting && this.shots > 0) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.handleInput();
                }
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.tutorialActive) {
                this.handleTutorialClick(x, y);
                return;
            }

            if (this.isRunning && !this.ball.shooting && this.shots > 0) {
                this.handleInput();
            }
        });

        // タッチ対応
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.tutorialActive) {
                this.tutorialActive = false;
                this.isRunning = true;
                this.gameLoop();
                return;
            }
            if (this.isRunning && !this.ball.shooting && this.shots > 0) {
                this.handleInput();
            }
        });

        // ゲーム操作ボタン
        document.getElementById('basketball-close-btn')?.addEventListener('click', () => this.close());
        document.getElementById('basketball-restart-btn')?.addEventListener('click', () => this.restart());
        document.getElementById('play-basketball-btn')?.addEventListener('click', () => this.start());
    }

    handleInput() {
        if (this.phase === 'angle') {
            // 角度を固定
            this.angleLocked = true;
            this.phase = 'power';
        } else if (this.phase === 'power') {
            // シュート発射
            this.shoot();
        }
    }

    start() {
        document.getElementById('celebration-cat').classList.remove('active');
        document.getElementById('play-game-btn').classList.remove('visible');
        document.getElementById('play-neon-game-btn')?.classList.remove('visible');
        document.getElementById('play-baseball-btn')?.classList.remove('visible');
        document.getElementById('play-basketball-btn')?.classList.remove('visible');

        this.gameContainer.classList.add('active');
        this.gameOverScreen.classList.remove('active');

        this.init();
        this.updateUI();
        this.showTutorial();
    }

    showTutorial() {
        this.tutorialActive = true;
        this.drawTutorial();
    }

    drawTutorial() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, 500, 450);

        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('フリースローゲーム', 250, 50);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('〜 遊び方 〜', 250, 80);

        ctx.textAlign = 'left';
        ctx.font = '15px Arial';
        const rules = [
            { icon: '1️⃣', title: '角度を決める', desc: 'スペース/クリックでゲージを止める' },
            { icon: '2️⃣', title: 'パワーを決める', desc: 'もう一度スペース/クリック' },
            { icon: '🏀', title: 'シュート！', desc: 'ナイスシュートを決めよう！' },
        ];

        let y = 120;
        rules.forEach(rule => {
            ctx.fillStyle = '#ff8c00';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(rule.icon, 50, y);
            ctx.fillStyle = '#0ff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(rule.title, 90, y);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(rule.desc, 90, y + 22);
            y += 60;
        });

        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('〜 スコア 〜', 250, 300);

        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const scores = [
            { text: 'スウィッシュ（ネットのみ）→ 3点', color: '#ff0' },
            { text: 'ナイスシュート → 2点', color: '#0f0' },
            { text: 'リング当たり → 1点', color: '#0ff' },
        ];

        y = 330;
        scores.forEach(s => {
            ctx.fillStyle = s.color;
            ctx.fillText('●', 100, y);
            ctx.fillStyle = '#fff';
            ctx.fillText(s.text, 120, y);
            y += 25;
        });

        ctx.fillStyle = '#888';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('10回のシュートで高得点を目指そう！', 250, 410);

        ctx.fillStyle = '#ff8c00';
        ctx.fillRect(175, 420, 150, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('ゲームスタート！', 250, 447);

        this.startButtonArea = { x: 175, y: 420, w: 150, h: 40 };
    }

    handleTutorialClick(x, y) {
        if (this.startButtonArea &&
            x >= this.startButtonArea.x && x <= this.startButtonArea.x + this.startButtonArea.w &&
            y >= this.startButtonArea.y && y <= this.startButtonArea.y + this.startButtonArea.h) {
            this.tutorialActive = false;
            this.isRunning = true;
            this.gameLoop();
        }
    }

    close() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
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
        this.ball.shooting = true;
        this.phase = 'shooting';

        // 角度とパワーからベロシティを計算
        const radians = (this.angle * Math.PI) / 180;
        const powerFactor = this.power / 100;
        const speed = 12 + powerFactor * 8; // 12〜20

        this.ball.vx = Math.cos(radians) * speed * (this.ball.x < 250 ? 1 : -1) * 0.3;
        this.ball.vy = -Math.sin(radians) * speed;

        this.shots--;
    }

    update() {
        // 角度ゲージ更新
        if (!this.angleLocked && this.phase === 'angle') {
            this.angle += this.angleDirection * this.angleSpeed;
            if (this.angle >= this.maxAngle || this.angle <= this.minAngle) {
                this.angleDirection *= -1;
            }
        }

        // パワーゲージ更新
        if (this.phase === 'power') {
            this.power += this.powerDirection * this.powerSpeed;
            if (this.power >= this.maxPower || this.power <= 0) {
                this.powerDirection *= -1;
            }
        }

        // ボール物理演算
        if (this.ball.shooting && !this.ball.landed) {
            this.ball.vy += 0.4; // 重力
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;

            // ゴール判定
            this.checkGoal();

            // 地面判定
            if (this.ball.y > 400) {
                this.ball.landed = true;
                if (!this.resultText) {
                    this.showResult('ミス...', '#f44');
                }
                setTimeout(() => this.resetBall(), 1000);
            }

            // 壁反射
            if (this.ball.x < this.ball.radius || this.ball.x > 500 - this.ball.radius) {
                this.ball.vx *= -0.5;
            }
        }

        // パーティクル更新
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });

        // 結果表示タイマー
        if (this.resultTimer > 0) {
            this.resultTimer--;
        }

        this.updateUI();
    }

    checkGoal() {
        const hoopLeft = this.hoop.x - this.hoop.width / 2;
        const hoopRight = this.hoop.x + this.hoop.width / 2;
        const rimY = this.hoop.rimY;

        // ボールがリムの高さを通過
        if (this.ball.y >= rimY - 10 && this.ball.y <= rimY + 30) {
            const ballLeft = this.ball.x - this.ball.radius;
            const ballRight = this.ball.x + this.ball.radius;

            // スウィッシュ判定（リムに触れずに通過）
            if (ballLeft > hoopLeft + 10 && ballRight < hoopRight - 10 && this.ball.vy > 0) {
                if (!this.ball.scored) {
                    this.ball.scored = true;
                    this.score += 3;
                    this.showResult('スウィッシュ！ +3', '#ff0', true);
                    this.createParticles(this.ball.x, this.ball.y, '#ff0', 30);
                }
            }
            // リムに当たった場合
            else if ((Math.abs(this.ball.x - hoopLeft) < 15 || Math.abs(this.ball.x - hoopRight) < 15)) {
                // リムバウンド
                this.ball.vy *= -0.6;
                this.ball.vx += (this.ball.x < this.hoop.x ? -2 : 2);

                if (!this.ball.hitRim) {
                    this.ball.hitRim = true;
                }
            }
        }

        // リムに当たった後のゴール判定
        if (this.ball.hitRim && !this.ball.scored && this.ball.y > rimY + 20 && this.ball.y < rimY + 60) {
            const ballCenter = this.ball.x;
            if (ballCenter > hoopLeft + 5 && ballCenter < hoopRight - 5) {
                this.ball.scored = true;
                if (Math.random() > 0.5) {
                    this.score += 2;
                    this.showResult('ナイスシュート！ +2', '#0f0');
                    this.createParticles(this.ball.x, this.ball.y, '#0f0', 20);
                } else {
                    this.score += 1;
                    this.showResult('リング！ +1', '#0ff');
                    this.createParticles(this.ball.x, this.ball.y, '#0ff', 15);
                }
            }
        }
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                color: color,
                life: 60
            });
        }
    }

    showResult(text, color, big = false) {
        this.resultText = text;
        this.resultColor = color;
        this.resultBig = big;
        this.resultTimer = 60;
    }

    resetBall() {
        this.ball.x = 250;
        this.ball.y = 350;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.shooting = false;
        this.ball.landed = false;
        this.ball.scored = false;
        this.ball.hitRim = false;

        this.power = 0;
        this.powerDirection = 1;
        this.angleLocked = false;
        this.angle = 80;
        this.phase = 'angle';
        this.resultText = '';

        if (this.shots <= 0) {
            this.gameOver();
        }
    }

    draw() {
        const ctx = this.ctx;

        // 背景（体育館）
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 450);
        bgGrad.addColorStop(0, '#2c1810');
        bgGrad.addColorStop(1, '#1a0f0a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 500, 450);

        // 床（木目調）
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(0, 380, 500, 70);
        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = '#6b4423';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(i * 50, 380);
            ctx.lineTo(i * 50, 450);
            ctx.stroke();
        }

        // バックボード
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(this.hoop.x - 60, 50, 120, 80);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.hoop.x - 60, 50, 120, 80);

        // バックボードの四角
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.hoop.x - 30, 70, 60, 45);

        // リム
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.hoop.x - this.hoop.width / 2, this.hoop.rimY);
        ctx.lineTo(this.hoop.x + this.hoop.width / 2, this.hoop.rimY);
        ctx.stroke();

        // ネット
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        const netSegments = 8;
        for (let i = 0; i <= netSegments; i++) {
            const x = this.hoop.x - this.hoop.width / 2 + (this.hoop.width / netSegments) * i;
            ctx.beginPath();
            ctx.moveTo(x, this.hoop.rimY);
            const wave = Math.sin(Date.now() / 200 + i) * 3;
            ctx.quadraticCurveTo(x + wave, this.hoop.rimY + 20, this.hoop.x, this.hoop.rimY + this.hoop.netHeight);
            ctx.stroke();
        }

        // 角度ガイド
        if (!this.ball.shooting) {
            ctx.save();
            ctx.translate(this.ball.x, this.ball.y);
            const radians = (this.angle * Math.PI) / 180;

            // 角度範囲表示
            ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 60, -(this.maxAngle * Math.PI / 180), -(this.minAngle * Math.PI / 180));
            ctx.stroke();

            // 現在の角度
            ctx.strokeStyle = '#ff8c00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(-radians) * 80, Math.sin(-radians) * 80);
            ctx.stroke();

            // 矢印
            const arrowX = Math.cos(-radians) * 80;
            const arrowY = Math.sin(-radians) * 80;
            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 10 * Math.cos(-radians - 0.3), arrowY - 10 * Math.sin(-radians - 0.3));
            ctx.lineTo(arrowX - 10 * Math.cos(-radians + 0.3), arrowY - 10 * Math.sin(-radians + 0.3));
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // ボール
        this.drawBall();

        // パーティクル
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 60;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // ゲージUI
        this.drawGauges();

        // 結果表示
        if (this.resultTimer > 0) {
            const alpha = Math.min(1, this.resultTimer / 20);
            ctx.font = this.resultBig ? 'bold 36px Arial' : 'bold 28px Arial';
            ctx.fillStyle = this.resultColor || '#fff';
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.fillText(this.resultText, 250, 220);
            ctx.globalAlpha = 1;
        }

        // 操作説明
        if (!this.ball.shooting) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.textAlign = 'center';
            if (this.phase === 'angle') {
                ctx.fillText('スペース / クリック で角度を決定', 250, 430);
            } else if (this.phase === 'power') {
                ctx.fillText('スペース / クリック でパワーを決定', 250, 430);
            }
        }
    }

    drawBall() {
        const ctx = this.ctx;
        const ball = this.ball;

        // ボールの影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ball.x, 395, ball.radius * 0.8, ball.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // ボール本体
        const gradient = ctx.createRadialGradient(
            ball.x - 5, ball.y - 5, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, '#ff8c00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#cc4400');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // ボールの線
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;

        // 横線
        ctx.beginPath();
        ctx.moveTo(ball.x - ball.radius, ball.y);
        ctx.lineTo(ball.x + ball.radius, ball.y);
        ctx.stroke();

        // 縦線
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // カーブ線
        ctx.beginPath();
        ctx.arc(ball.x - 8, ball.y, ball.radius * 0.7, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ball.x + 8, ball.y, ball.radius * 0.7, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
    }

    drawGauges() {
        const ctx = this.ctx;

        // パワーゲージ背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(430, 100, 30, 200);

        // パワーゲージ
        const powerHeight = (this.power / this.maxPower) * 200;
        const powerGrad = ctx.createLinearGradient(0, 300, 0, 100);
        powerGrad.addColorStop(0, '#00ff00');
        powerGrad.addColorStop(0.5, '#ffff00');
        powerGrad.addColorStop(1, '#ff0000');
        ctx.fillStyle = powerGrad;
        ctx.fillRect(430, 300 - powerHeight, 30, powerHeight);

        // ゲージ枠
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(430, 100, 30, 200);

        // ベストゾーン表示
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(430, 160, 30, 40);

        // ラベル
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POWER', 445, 320);

        // 角度表示
        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`角度: ${Math.round(this.angle)}°`, 20, 30);

        // フェーズ表示
        ctx.fillStyle = this.phase === 'angle' ? '#ff8c00' : (this.phase === 'power' ? '#0f0' : '#fff');
        ctx.font = 'bold 14px Arial';
        const phaseText = this.phase === 'angle' ? '▶ 角度を決めて！' : (this.phase === 'power' ? '▶ パワーを決めて！' : '');
        ctx.fillText(phaseText, 20, 55);
    }

    updateUI() {
        if (this.scoreElement) this.scoreElement.textContent = this.score;
        if (this.shotsElement) this.shotsElement.textContent = this.shots;
    }

    gameOver() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);

        let rank = '';
        const maxScore = this.maxShots * 3;
        const percentage = this.score / maxScore;

        if (percentage >= 0.9) rank = 'MVP！神業！';
        else if (percentage >= 0.7) rank = 'オールスター！';
        else if (percentage >= 0.5) rank = 'ナイスプレイ！';
        else if (percentage >= 0.3) rank = 'まずまず！';
        else rank = 'ドンマイ！';

        this.finalScoreElement.innerHTML = `
            ${this.score} 点<br>
            <span style="font-size: 0.7em; color: #ff8c00;">${rank}</span>
        `;
        this.gameOverScreen.classList.add('active');
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// 初期化
let basketballGame;
function initBasketballGame() {
    if (document.getElementById('basketball-canvas') && !basketballGame) {
        basketballGame = new BasketballGame();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBasketballGame);
} else {
    initBasketballGame();
}
