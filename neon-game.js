// ネオンバウンス - 革新的な重力反転ゲーム
class NeonBounceGame {
    constructor() {
        this.canvas = document.getElementById('neon-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameContainer = document.getElementById('neon-game-container');
        this.scoreElement = document.getElementById('neon-score');
        this.comboElement = document.getElementById('neon-combo');
        this.timeElement = document.getElementById('neon-time');
        this.gameOverScreen = document.getElementById('neon-game-over-screen');
        this.gameOverText = document.getElementById('neon-game-over-text');
        this.finalScoreElement = document.getElementById('neon-final-score');

        this.isRunning = false;
        this.animationId = null;

        this.bindEvents();
    }

    init() {
        // プレイヤー（光る球）
        this.player = {
            x: 80,
            y: this.canvas.height / 2,
            radius: 12,
            velocityY: 0,
            gravity: 0.4,
            gravityDirection: 1, // 1 = 下, -1 = 上
            trail: [],
            maxTrail: 15,
            hue: 180 // シアンから始まる
        };

        // 障害物
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 100; // フレーム

        // パーティクル（収集アイテム）
        this.particles = [];
        this.particleTimer = 0;

        // エフェクト
        this.effects = [];
        this.backgroundStars = this.createBackgroundStars();

        // ゲーム状態
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.gameTime = 120; // 2分 = 120秒
        this.frameCount = 0;
        this.speed = 3;
        this.difficulty = 1;

        // 画面シェイク
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;

        // パルス効果
        this.pulsePhase = 0;
    }

    createBackgroundStars() {
        const stars = [];
        for (let i = 0; i < 50; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.2,
                brightness: Math.random()
            });
        }
        return stars;
    }

    bindEvents() {
        // 重力反転
        const flipGravity = (e) => {
            if (this.isRunning) {
                if (e.code === 'Space' || e.type === 'touchstart') {
                    e.preventDefault();
                    this.player.gravityDirection *= -1;
                    this.player.velocityY = 0;
                    this.addFlipEffect();
                }
            }
        };

        document.addEventListener('keydown', flipGravity);
        this.canvas.addEventListener('touchstart', flipGravity);
        this.canvas.addEventListener('click', () => {
            if (this.isRunning) {
                this.player.gravityDirection *= -1;
                this.player.velocityY = 0;
                this.addFlipEffect();
            }
        });

        // ゲームを閉じる
        document.getElementById('neon-close-btn')?.addEventListener('click', () => {
            this.close();
        });

        // リスタート
        document.getElementById('neon-restart-btn')?.addEventListener('click', () => {
            this.restart();
        });

        // ゲームで遊ぶボタン（ネオンゲーム用）
        document.getElementById('play-neon-game-btn')?.addEventListener('click', () => {
            this.start();
        });
    }

    addFlipEffect() {
        // 反転時のパルスエフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.effects.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1,
                decay: 0.03,
                hue: this.player.hue,
                type: 'flip'
            });
        }
    }

    start() {
        // 猫を非表示
        document.getElementById('celebration-cat').classList.remove('active');
        document.getElementById('play-game-btn').classList.remove('visible');
        document.getElementById('play-neon-game-btn')?.classList.remove('visible');

        // ゲーム画面を表示
        this.gameContainer.classList.add('active');
        this.gameOverScreen.classList.remove('active');

        // 初期化
        this.init();
        this.updateUI();

        // ゲーム開始
        this.isRunning = true;
        this.lastTime = performance.now();
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
        this.lastTime = performance.now();
        this.gameLoop();
    }

    update() {
        this.frameCount++;
        this.pulsePhase += 0.05;

        // 時間減少（60FPSで1秒に1減少）
        if (this.frameCount % 60 === 0) {
            this.gameTime--;
            if (this.gameTime <= 0) {
                this.gameOver(true); // 時間切れ = クリア
                return;
            }
        }

        // 難易度上昇
        this.difficulty = 1 + (120 - this.gameTime) * 0.01;
        this.speed = 3 + (120 - this.gameTime) * 0.02;

        // プレイヤー物理
        this.player.velocityY += this.player.gravity * this.player.gravityDirection;
        this.player.velocityY = Math.max(-10, Math.min(10, this.player.velocityY));
        this.player.y += this.player.velocityY;

        // 色のサイクル
        this.player.hue = (this.player.hue + 0.5) % 360;

        // 軌跡
        this.player.trail.unshift({ x: this.player.x, y: this.player.y, hue: this.player.hue });
        if (this.player.trail.length > this.player.maxTrail) {
            this.player.trail.pop();
        }

        // 壁との衝突
        if (this.player.y - this.player.radius < 0) {
            this.player.y = this.player.radius;
            this.player.velocityY = 0;
            this.shakeAmount = 5;
        }
        if (this.player.y + this.player.radius > this.canvas.height) {
            this.player.y = this.canvas.height - this.player.radius;
            this.player.velocityY = 0;
            this.shakeAmount = 5;
        }

        // 障害物生成
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.obstacleInterval / this.difficulty) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
        }

        // パーティクル生成
        this.particleTimer++;
        if (this.particleTimer >= 40) {
            this.spawnParticle();
            this.particleTimer = 0;
        }

        // 障害物更新
        this.obstacles = this.obstacles.filter(obs => {
            obs.x -= this.speed;

            // 衝突判定
            if (this.checkCollision(this.player, obs)) {
                this.combo = 0;
                this.shakeAmount = 15;
                this.score = Math.max(0, this.score - 50);
                this.addHitEffect(obs);
                return false;
            }

            return obs.x + obs.width > -50;
        });

        // パーティクル更新
        this.particles = this.particles.filter(p => {
            p.x -= this.speed * 0.8;
            p.angle += 0.05;

            // 収集判定
            const dx = this.player.x - p.x;
            const dy = this.player.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + p.radius) {
                this.combo++;
                this.maxCombo = Math.max(this.maxCombo, this.combo);
                const bonus = 10 * (1 + Math.floor(this.combo / 5) * 0.5);
                this.score += Math.floor(bonus);
                this.addCollectEffect(p);
                return false;
            }

            return p.x > -20;
        });

        // エフェクト更新
        this.effects = this.effects.filter(e => {
            e.x += e.vx || 0;
            e.y += e.vy || 0;
            e.life -= e.decay;
            return e.life > 0;
        });

        // 背景星更新
        this.backgroundStars.forEach(star => {
            star.x -= star.speed * this.speed;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
            star.brightness = 0.5 + Math.sin(this.frameCount * 0.1 + star.x) * 0.5;
        });

        // 画面シェイク減衰
        this.shakeAmount *= this.shakeDecay;

        this.updateUI();
    }

    spawnObstacle() {
        const types = ['top', 'bottom', 'middle', 'moving'];
        const type = types[Math.floor(Math.random() * types.length)];

        let obstacle = {
            x: this.canvas.width + 50,
            width: 30 + Math.random() * 20,
            type: type,
            hue: Math.random() * 360
        };

        switch (type) {
            case 'top':
                obstacle.y = 0;
                obstacle.height = 60 + Math.random() * 80;
                break;
            case 'bottom':
                obstacle.height = 60 + Math.random() * 80;
                obstacle.y = this.canvas.height - obstacle.height;
                break;
            case 'middle':
                obstacle.height = 40 + Math.random() * 40;
                obstacle.y = 100 + Math.random() * (this.canvas.height - 200 - obstacle.height);
                break;
            case 'moving':
                obstacle.height = 50;
                obstacle.y = this.canvas.height / 2;
                obstacle.originalY = obstacle.y;
                obstacle.amplitude = 80;
                obstacle.speed = 0.03 + Math.random() * 0.02;
                obstacle.phase = Math.random() * Math.PI * 2;
                break;
        }

        this.obstacles.push(obstacle);
    }

    spawnParticle() {
        this.particles.push({
            x: this.canvas.width + 20,
            y: 50 + Math.random() * (this.canvas.height - 100),
            radius: 8,
            angle: 0,
            hue: Math.random() * 360
        });
    }

    checkCollision(player, obstacle) {
        // 動く障害物の位置更新
        if (obstacle.type === 'moving') {
            obstacle.y = obstacle.originalY + Math.sin(this.frameCount * obstacle.speed + obstacle.phase) * obstacle.amplitude;
        }

        // 円と矩形の衝突判定
        const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
        const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));

        const dx = player.x - closestX;
        const dy = player.y - closestY;

        return (dx * dx + dy * dy) < (player.radius * player.radius);
    }

    addCollectEffect(particle) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            this.effects.push({
                x: particle.x,
                y: particle.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                life: 1,
                decay: 0.05,
                hue: particle.hue,
                type: 'collect'
            });
        }
    }

    addHitEffect(obstacle) {
        for (let i = 0; i < 20; i++) {
            this.effects.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                decay: 0.03,
                hue: 0, // 赤
                type: 'hit'
            });
        }
    }

    draw() {
        const ctx = this.ctx;

        // 画面シェイク
        ctx.save();
        if (this.shakeAmount > 0.5) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakeAmount,
                (Math.random() - 0.5) * this.shakeAmount
            );
        }

        // 背景グラデーション
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGrad.addColorStop(0, '#0a0a1a');
        bgGrad.addColorStop(0.5, '#1a0a2a');
        bgGrad.addColorStop(1, '#0a1a2a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッドライン（サイバーパンク風）
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let y = 0; y < this.canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // 背景星
        this.backgroundStars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.8})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // 障害物描画
        this.obstacles.forEach(obs => {
            // グロー効果
            const glowGrad = ctx.createRadialGradient(
                obs.x + obs.width / 2, obs.y + obs.height / 2, 0,
                obs.x + obs.width / 2, obs.y + obs.height / 2, Math.max(obs.width, obs.height)
            );
            glowGrad.addColorStop(0, `hsla(${obs.hue}, 100%, 50%, 0.3)`);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(obs.x - 20, obs.y - 20, obs.width + 40, obs.height + 40);

            // 本体
            ctx.fillStyle = `hsl(${obs.hue}, 100%, 40%)`;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            // ボーダー
            ctx.strokeStyle = `hsl(${obs.hue}, 100%, 60%)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        });

        // パーティクル描画
        this.particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            // グロー
            const pGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 3);
            pGlow.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 0.8)`);
            pGlow.addColorStop(0.5, `hsla(${p.hue}, 100%, 50%, 0.3)`);
            pGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = pGlow;
            ctx.fillRect(-p.radius * 3, -p.radius * 3, p.radius * 6, p.radius * 6);

            // 星形
            ctx.fillStyle = `hsl(${p.hue}, 100%, 80%)`;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const innerAngle = angle + Math.PI / 5;
                if (i === 0) {
                    ctx.moveTo(Math.cos(angle) * p.radius, Math.sin(angle) * p.radius);
                } else {
                    ctx.lineTo(Math.cos(angle) * p.radius, Math.sin(angle) * p.radius);
                }
                ctx.lineTo(Math.cos(innerAngle) * p.radius * 0.4, Math.sin(innerAngle) * p.radius * 0.4);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        });

        // プレイヤー軌跡描画
        this.player.trail.forEach((pos, i) => {
            const alpha = (1 - i / this.player.trail.length) * 0.5;
            const size = this.player.radius * (1 - i / this.player.trail.length * 0.5);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${pos.hue}, 100%, 60%, ${alpha})`;
            ctx.fill();
        });

        // プレイヤー描画
        // グロー
        const playerGlow = ctx.createRadialGradient(
            this.player.x, this.player.y, 0,
            this.player.x, this.player.y, this.player.radius * 4
        );
        playerGlow.addColorStop(0, `hsla(${this.player.hue}, 100%, 70%, 0.8)`);
        playerGlow.addColorStop(0.3, `hsla(${this.player.hue}, 100%, 50%, 0.4)`);
        playerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = playerGlow;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // 本体
        const playerGrad = ctx.createRadialGradient(
            this.player.x - 3, this.player.y - 3, 0,
            this.player.x, this.player.y, this.player.radius
        );
        playerGrad.addColorStop(0, `hsl(${this.player.hue}, 100%, 90%)`);
        playerGrad.addColorStop(0.5, `hsl(${this.player.hue}, 100%, 60%)`);
        playerGrad.addColorStop(1, `hsl(${this.player.hue}, 100%, 40%)`);
        ctx.fillStyle = playerGrad;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        ctx.fill();

        // 重力方向インジケーター
        const arrowY = this.player.y + this.player.gravityDirection * 25;
        ctx.fillStyle = `hsla(${this.player.hue}, 100%, 80%, 0.8)`;
        ctx.beginPath();
        ctx.moveTo(this.player.x, arrowY);
        ctx.lineTo(this.player.x - 8, arrowY - this.player.gravityDirection * 10);
        ctx.lineTo(this.player.x + 8, arrowY - this.player.gravityDirection * 10);
        ctx.closePath();
        ctx.fill();

        // エフェクト描画
        this.effects.forEach(e => {
            ctx.beginPath();
            ctx.arc(e.x, e.y, 4 * e.life, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${e.hue}, 100%, 60%, ${e.life})`;
            ctx.fill();
        });

        // コンボ表示（大きく）
        if (this.combo >= 5) {
            const comboSize = 30 + Math.sin(this.pulsePhase * 2) * 5;
            ctx.font = `bold ${comboSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = `hsla(${(this.combo * 30) % 360}, 100%, 60%, 0.8)`;
            ctx.fillText(`${this.combo} COMBO!`, this.canvas.width / 2, 60);
        }

        ctx.restore();
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.comboElement.textContent = this.combo;
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        this.timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    gameOver(survived) {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const bonusScore = this.maxCombo * 20;
        this.score += bonusScore;

        this.gameOverText.textContent = survived ? 'タイムアップ！' : 'ゲームオーバー';
        this.gameOverText.style.color = survived ? '#0ff' : '#f00';
        this.finalScoreElement.innerHTML = `
            スコア: ${this.score}<br>
            <span style="font-size: 0.8em; color: #888;">最大コンボ: ${this.maxCombo} (+${bonusScore})</span>
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

// ゲームインスタンスを作成
let neonGame;

// DOMContentLoadedまたは即時実行
function initNeonGame() {
    if (document.getElementById('neon-canvas') && !neonGame) {
        neonGame = new NeonBounceGame();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNeonGame);
} else {
    initNeonGame();
}
