// パワプロ風バッティングゲーム
class BaseballGame {
    constructor() {
        this.canvas = document.getElementById('baseball-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameContainer = document.getElementById('baseball-game-container');
        this.scoreElement = document.getElementById('baseball-score');
        this.inningElement = document.getElementById('baseball-inning');
        this.outElement = document.getElementById('baseball-out');
        this.gameOverScreen = document.getElementById('baseball-game-over-screen');
        this.finalScoreElement = document.getElementById('baseball-final-score');

        this.isRunning = false;
        this.animationId = null;

        this.bindEvents();
    }

    init() {
        // ゲーム状態
        this.score = 0;
        this.inning = 1;
        this.outs = 0;
        this.maxInnings = 3;

        // バッター
        this.batter = {
            x: 350,
            y: 320,
            swinging: false,
            swingFrame: 0,
            swingPower: 0
        };

        // ピッチャー
        this.pitcher = {
            x: 200,
            y: 150,
            throwing: false,
            windupFrame: 0
        };

        // ボール
        this.ball = {
            x: 200,
            y: 150,
            z: 0, // 奥行き（0=ピッチャー、100=キャッチャー）
            vx: 0,
            vy: 0,
            vz: 0,
            active: false,
            pitched: false,
            hit: false,
            type: 'straight', // straight, curve, slider, fork
            speed: 0
        };

        // 打球
        this.hitBall = {
            x: 0,
            y: 0,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            active: false,
            result: ''
        };

        // ストライクゾーン
        this.strikeZone = {
            x: 330,
            y: 280,
            width: 60,
            height: 80
        };

        // ミートカーソル
        this.cursor = {
            x: 360,
            y: 320
        };

        // 結果表示
        this.resultText = '';
        this.resultTimer = 0;

        // 投球待機
        this.waitingForPitch = true;
        this.pitchDelay = 60;

        // 球種リスト
        this.pitchTypes = [
            { name: 'ストレート', speed: 145, curve: 0, drop: 0.3 },
            { name: 'カーブ', speed: 115, curve: 2.5, drop: 1.2 },
            { name: 'スライダー', speed: 130, curve: -1.8, drop: 0.5 },
            { name: 'フォーク', speed: 135, curve: 0, drop: 2.0 },
            { name: 'シュート', speed: 138, curve: 1.5, drop: 0.4 }
        ];

        this.currentPitch = null;
        this.pitchDisplay = '';
        this.pitchDisplayTimer = 0;

        // キー状態
        this.keys = {};

        // ランナー
        this.runners = [false, false, false]; // 1塁、2塁、3塁

        // チュートリアル
        this.tutorialActive = false;
        this.startButtonArea = null;
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            // チュートリアル画面でスペースキーを押したらスタート
            if (this.tutorialActive && e.code === 'Space') {
                e.preventDefault();
                this.tutorialActive = false;
                this.isRunning = true;
                this.gameLoop();
                return;
            }

            if (this.isRunning) {
                this.keys[e.code] = true;

                // スイング
                if (e.code === 'Space' && !this.batter.swinging && this.ball.active && !this.ball.hit) {
                    e.preventDefault();
                    this.swing();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // マウス/タッチでカーソル移動
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isRunning) {
                const rect = this.canvas.getBoundingClientRect();
                this.cursor.x = Math.max(300, Math.min(420, e.clientX - rect.left));
                this.cursor.y = Math.max(240, Math.min(360, e.clientY - rect.top));
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // チュートリアル画面の場合
            if (this.tutorialActive) {
                this.handleTutorialClick(x, y);
                return;
            }

            if (this.isRunning && !this.batter.swinging && this.ball.active && !this.ball.hit) {
                this.swing();
            }
        });

        // ゲーム操作ボタン
        document.getElementById('baseball-close-btn')?.addEventListener('click', () => this.close());
        document.getElementById('baseball-restart-btn')?.addEventListener('click', () => this.restart());
        document.getElementById('play-baseball-btn')?.addEventListener('click', () => this.start());
    }

    start() {
        document.getElementById('celebration-cat').classList.remove('active');
        document.getElementById('play-game-btn').classList.remove('visible');
        document.getElementById('play-neon-game-btn')?.classList.remove('visible');
        document.getElementById('play-baseball-btn')?.classList.remove('visible');

        this.gameContainer.classList.add('active');
        this.gameOverScreen.classList.remove('active');

        this.init();
        this.updateUI();

        // チュートリアル画面を表示
        this.showTutorial();
    }

    showTutorial() {
        this.tutorialStep = 0;
        this.tutorialActive = true;
        this.drawTutorial();
    }

    drawTutorial() {
        const ctx = this.ctx;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, 500, 400);

        // タイトル
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('バッティングゲーム', 250, 40);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('〜 遊び方 〜', 250, 70);

        // ルール説明
        ctx.textAlign = 'left';
        ctx.font = '15px Arial';
        const rules = [
            { icon: '🎯', title: 'カーソルを動かす', desc: '矢印キー または マウス' },
            { icon: '⚾', title: 'スイングする', desc: 'スペースキー または クリック' },
            { icon: '💡', title: 'コツ', desc: 'ボールがカーソルに近づいたらスイング！' },
        ];

        let y = 110;
        rules.forEach(rule => {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(rule.icon, 40, y);
            ctx.fillStyle = '#0ff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(rule.title, 80, y);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(rule.desc, 80, y + 20);
            y += 55;
        });

        // 打球結果の説明
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('〜 打球の結果 〜', 250, 280);

        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const results = [
            { text: 'ジャストミート → ホームラン・長打', color: '#f0f' },
            { text: 'タイミング良 → ヒット', color: '#0f0' },
            { text: 'タイミング悪 → ファウル・アウト', color: '#f44' },
        ];

        y = 305;
        results.forEach(r => {
            ctx.fillStyle = r.color;
            ctx.fillText('●', 80, y);
            ctx.fillStyle = '#fff';
            ctx.fillText(r.text, 100, y);
            y += 22;
        });

        // ゲームルール
        ctx.fillStyle = '#888';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('3イニング制 / 3アウトで攻守交代', 250, 375);

        // スタートボタン
        ctx.fillStyle = '#0f0';
        ctx.fillRect(175, 385, 150, 40);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('ゲームスタート！', 250, 412);

        // クリック領域を記憶
        this.startButtonArea = { x: 175, y: 385, w: 150, h: 40 };
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

    startGame() {
        this.isRunning = true;
        this.gameLoop();
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
        // リスタート時はチュートリアルをスキップ
        this.isRunning = true;
        this.gameLoop();
    }

    swing() {
        this.batter.swinging = true;
        this.batter.swingFrame = 0;

        // ミート判定
        const ballScreenX = this.ball.x + (this.ball.z / 100) * (360 - this.ball.x);
        const ballScreenY = this.ball.y + (this.ball.z / 100) * (300 - this.ball.y);

        const dx = Math.abs(this.cursor.x - ballScreenX);
        const dy = Math.abs(this.cursor.y - ballScreenY);
        const dz = Math.abs(this.ball.z - 85); // 最適打点は85

        // タイミングと位置の判定
        if (dz < 12 && dx < 25 && dy < 30) {
            // ジャストミート！
            this.hitBall.active = true;
            this.ball.hit = true;
            this.ball.active = false;

            const power = 1 - (dx + dy) / 55;
            const timing = 1 - dz / 12;
            const totalPower = power * timing;

            this.hitBall.x = ballScreenX;
            this.hitBall.y = ballScreenY;
            this.hitBall.z = 0;

            // 打球方向（カーソル位置で左右）
            const angle = (this.cursor.x - 360) / 60;
            this.hitBall.vx = angle * 8 * totalPower;
            this.hitBall.vy = -12 * totalPower - 3;
            this.hitBall.vz = 15 * totalPower + 5;

            this.determineHitResult(totalPower);
        } else if (dz < 25 && dx < 40 && dy < 50) {
            // 当たったがファウルか凡打
            this.hitBall.active = true;
            this.ball.hit = true;
            this.ball.active = false;

            this.hitBall.x = ballScreenX;
            this.hitBall.y = ballScreenY;
            this.hitBall.z = 0;

            if (Math.random() > 0.5) {
                // ファウル
                this.hitBall.vx = (Math.random() - 0.5) * 15;
                this.hitBall.vy = -5;
                this.hitBall.vz = 3;
                this.hitBall.result = 'foul';
                this.showResult('ファウル！', '#ff0');
            } else {
                // 凡打
                this.hitBall.vx = (Math.random() - 0.5) * 5;
                this.hitBall.vy = -3;
                this.hitBall.vz = 8;
                this.hitBall.result = 'out';
                this.showResult('アウト！', '#f44');
                this.outs++;
            }
        }
        // 空振りは何もしない（ボールがキャッチャーまで到達してストライク判定）
    }

    determineHitResult(power) {
        // パワーに応じた結果
        const rand = Math.random();

        if (power > 0.85) {
            // ホームラン！
            this.hitBall.result = 'homerun';
            this.showResult('ホームラン！！', '#ff0', true);
            this.score += 1 + this.runners.filter(r => r).length;
            this.runners = [false, false, false];
        } else if (power > 0.65) {
            // 長打
            if (rand > 0.6) {
                this.hitBall.result = 'triple';
                this.showResult('スリーベース！', '#0ff');
                this.advanceRunners(3);
            } else {
                this.hitBall.result = 'double';
                this.showResult('ツーベース！', '#0f0');
                this.advanceRunners(2);
            }
        } else if (power > 0.4) {
            // シングルヒット
            this.hitBall.result = 'single';
            this.showResult('ヒット！', '#0f0');
            this.advanceRunners(1);
        } else {
            // 内野ゴロ
            if (rand > 0.3) {
                this.hitBall.result = 'out';
                this.showResult('アウト！', '#f44');
                this.outs++;
            } else {
                this.hitBall.result = 'single';
                this.showResult('内野安打！', '#0f0');
                this.advanceRunners(1);
            }
        }
    }

    advanceRunners(bases) {
        // ランナーを進める
        for (let i = 2; i >= 0; i--) {
            if (this.runners[i]) {
                const newBase = i + bases;
                if (newBase >= 3) {
                    this.score++;
                    this.runners[i] = false;
                } else {
                    this.runners[newBase] = true;
                    this.runners[i] = false;
                }
            }
        }
        // バッターが出塁
        if (bases >= 3) {
            // 3塁打以上はバッターも得点の可能性
        } else {
            this.runners[bases - 1] = true;
        }
    }

    showResult(text, color, big = false) {
        this.resultText = text;
        this.resultColor = color;
        this.resultBig = big;
        this.resultTimer = 90;
    }

    pitch() {
        // 球種をランダム選択
        this.currentPitch = this.pitchTypes[Math.floor(Math.random() * this.pitchTypes.length)];
        this.pitchDisplay = this.currentPitch.name + ' ' + this.currentPitch.speed + 'km/h';
        this.pitchDisplayTimer = 120;

        // ボール初期化
        this.ball.x = 200;
        this.ball.y = 150;
        this.ball.z = 0;
        this.ball.active = true;
        this.ball.pitched = true;
        this.ball.hit = false;

        // 投球の目標点（ストライクゾーン内でランダム）
        const targetX = this.strikeZone.x + Math.random() * this.strikeZone.width;
        const targetY = this.strikeZone.y + Math.random() * this.strikeZone.height;

        // 速度計算
        const speed = this.currentPitch.speed / 30;
        this.ball.vz = speed;
        this.ball.vx = (targetX - this.ball.x) / (100 / speed) + this.currentPitch.curve * 0.3;
        this.ball.vy = (targetY - this.ball.y) / (100 / speed);
        this.ball.curve = this.currentPitch.curve;
        this.ball.drop = this.currentPitch.drop;

        this.pitcher.throwing = true;
        this.pitcher.windupFrame = 0;
    }

    update() {
        // カーソル移動（キーボード）
        if (this.keys['ArrowLeft']) this.cursor.x = Math.max(300, this.cursor.x - 5);
        if (this.keys['ArrowRight']) this.cursor.x = Math.min(420, this.cursor.x + 5);
        if (this.keys['ArrowUp']) this.cursor.y = Math.max(240, this.cursor.y - 5);
        if (this.keys['ArrowDown']) this.cursor.y = Math.min(360, this.cursor.y + 5);

        // 投球待機
        if (this.waitingForPitch) {
            this.pitchDelay--;
            if (this.pitchDelay <= 0) {
                this.pitch();
                this.waitingForPitch = false;
            }
        }

        // ボール移動
        if (this.ball.active && !this.ball.hit) {
            this.ball.z += this.ball.vz;
            this.ball.x += this.ball.vx + this.ball.curve * (this.ball.z / 100) * 0.5;
            this.ball.y += this.ball.vy + this.ball.drop * (this.ball.z / 100) * 0.3;

            // キャッチャーミット到達
            if (this.ball.z >= 100) {
                this.ball.active = false;

                if (!this.batter.swinging) {
                    // 見逃し判定
                    const inZone = this.ball.x >= this.strikeZone.x &&
                                   this.ball.x <= this.strikeZone.x + this.strikeZone.width &&
                                   this.ball.y >= this.strikeZone.y &&
                                   this.ball.y <= this.strikeZone.y + this.strikeZone.height;

                    if (inZone) {
                        this.showResult('見逃しストライク！', '#f80');
                    } else {
                        this.showResult('ボール', '#88f');
                    }
                } else {
                    // 空振り
                    this.showResult('空振り！', '#f44');
                }

                this.nextPitch();
            }
        }

        // 打球移動
        if (this.hitBall.active) {
            this.hitBall.x += this.hitBall.vx;
            this.hitBall.y += this.hitBall.vy;
            this.hitBall.z += this.hitBall.vz;
            this.hitBall.vy += 0.3; // 重力

            if (this.hitBall.z > 200 || this.hitBall.y > 400) {
                this.hitBall.active = false;
                this.nextPitch();
            }
        }

        // バッタースイングアニメーション
        if (this.batter.swinging) {
            this.batter.swingFrame++;
            if (this.batter.swingFrame > 20) {
                this.batter.swinging = false;
                // 空振り判定
                if (!this.ball.hit && this.ball.active) {
                    // 空振りだがボールはまだ飛んでいる
                }
            }
        }

        // ピッチャーアニメーション
        if (this.pitcher.throwing) {
            this.pitcher.windupFrame++;
            if (this.pitcher.windupFrame > 30) {
                this.pitcher.throwing = false;
            }
        }

        // 結果表示タイマー
        if (this.resultTimer > 0) {
            this.resultTimer--;
        }

        if (this.pitchDisplayTimer > 0) {
            this.pitchDisplayTimer--;
        }

        // アウトチェック
        if (this.outs >= 3) {
            this.outs = 0;
            this.runners = [false, false, false];
            this.inning++;

            if (this.inning > this.maxInnings) {
                this.gameOver();
                return;
            }

            this.showResult(this.inning + '回表', '#fff');
        }

        this.updateUI();
    }

    nextPitch() {
        this.waitingForPitch = true;
        this.pitchDelay = 60;
        this.ball.pitched = false;
    }

    draw() {
        const ctx = this.ctx;

        // 背景（球場）
        // 空
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
        skyGrad.addColorStop(0, '#1a3a5c');
        skyGrad.addColorStop(1, '#4a7a9c');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 500, 200);

        // 外野（緑）
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.moveTo(0, 200);
        ctx.lineTo(250, 100);
        ctx.lineTo(500, 200);
        ctx.lineTo(500, 250);
        ctx.lineTo(0, 250);
        ctx.fill();

        // 内野（茶色）
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(150, 250);
        ctx.lineTo(250, 180);
        ctx.lineTo(350, 250);
        ctx.lineTo(360, 400);
        ctx.lineTo(140, 400);
        ctx.fill();

        // ダイヤモンド
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(250, 380); // ホーム
        ctx.lineTo(180, 280); // 3塁
        ctx.lineTo(250, 180); // 2塁
        ctx.lineTo(320, 280); // 1塁
        ctx.closePath();
        ctx.stroke();

        // ベース
        ctx.fillStyle = '#fff';
        // 1塁
        ctx.fillRect(315, 275, 12, 12);
        // 2塁
        ctx.save();
        ctx.translate(250, 180);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
        // 3塁
        ctx.fillRect(173, 275, 12, 12);
        // ホーム
        ctx.beginPath();
        ctx.moveTo(250, 385);
        ctx.lineTo(240, 375);
        ctx.lineTo(240, 365);
        ctx.lineTo(260, 365);
        ctx.lineTo(260, 375);
        ctx.closePath();
        ctx.fill();

        // ランナー表示
        ctx.fillStyle = '#ff0';
        if (this.runners[0]) ctx.beginPath(), ctx.arc(321, 281, 8, 0, Math.PI * 2), ctx.fill();
        if (this.runners[1]) ctx.beginPath(), ctx.arc(250, 180, 8, 0, Math.PI * 2), ctx.fill();
        if (this.runners[2]) ctx.beginPath(), ctx.arc(179, 281, 8, 0, Math.PI * 2), ctx.fill();

        // ピッチャー
        this.drawPitcher(ctx);

        // ストライクゾーン（半透明）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.strikeZone.x, this.strikeZone.y, this.strikeZone.width, this.strikeZone.height);

        // ミートカーソル
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.cursor.x, this.cursor.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.cursor.x - 20, this.cursor.y);
        ctx.lineTo(this.cursor.x + 20, this.cursor.y);
        ctx.moveTo(this.cursor.x, this.cursor.y - 20);
        ctx.lineTo(this.cursor.x, this.cursor.y + 20);
        ctx.stroke();

        // バッター
        this.drawBatter(ctx);

        // ボール
        if (this.ball.active) {
            const scale = 0.5 + (this.ball.z / 100) * 1.5;
            const screenX = this.ball.x + (this.ball.z / 100) * (360 - this.ball.x) * 0.8;
            const screenY = this.ball.y + (this.ball.z / 100) * (300 - this.ball.y) * 0.5;

            // ボールの影
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX, 380, 5 * scale, 2 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // ボール
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c00';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 打球
        if (this.hitBall.active) {
            const scale = Math.max(0.3, 1 - this.hitBall.z / 300);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.hitBall.x, this.hitBall.y, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // 球種表示
        if (this.pitchDisplayTimer > 0) {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = `rgba(255, 255, 0, ${Math.min(1, this.pitchDisplayTimer / 30)})`;
            ctx.textAlign = 'center';
            ctx.fillText(this.pitchDisplay, 250, 30);
        }

        // 結果表示
        if (this.resultTimer > 0) {
            const alpha = Math.min(1, this.resultTimer / 30);
            ctx.font = this.resultBig ? 'bold 48px Arial' : 'bold 32px Arial';
            ctx.fillStyle = this.resultColor || '#fff';
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.fillText(this.resultText, 250, 200);

            if (this.resultBig) {
                // ホームランエフェクト
                ctx.font = '24px Arial';
                ctx.fillText('🎆🎆🎆', 250, 240);
            }
            ctx.globalAlpha = 1;
        }

        // 操作説明
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('矢印キーまたはマウスでカーソル移動 / スペースまたはクリックでスイング', 250, 395);
    }

    drawPitcher(ctx) {
        const px = this.pitcher.x;
        const py = this.pitcher.y;

        // 体
        ctx.fillStyle = '#fff';
        ctx.fillRect(px - 8, py - 5, 16, 25);

        // 頭
        ctx.fillStyle = '#fdbf6f';
        ctx.beginPath();
        ctx.arc(px, py - 15, 12, 0, Math.PI * 2);
        ctx.fill();

        // 帽子
        ctx.fillStyle = '#1a1a8a';
        ctx.beginPath();
        ctx.arc(px, py - 20, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(px - 12, py - 20, 24, 5);

        // 腕（投球モーション）
        ctx.strokeStyle = '#fdbf6f';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        if (this.pitcher.throwing && this.pitcher.windupFrame < 15) {
            // 振りかぶり
            ctx.beginPath();
            ctx.moveTo(px + 8, py);
            ctx.lineTo(px + 20, py - 15);
            ctx.stroke();
        } else {
            // 通常
            ctx.beginPath();
            ctx.moveTo(px + 8, py);
            ctx.lineTo(px + 15, py + 10);
            ctx.stroke();
        }
    }

    drawBatter(ctx) {
        const bx = this.batter.x;
        const by = this.batter.y;

        // 体
        ctx.fillStyle = '#fff';
        ctx.fillRect(bx - 8, by - 5, 16, 30);

        // 頭
        ctx.fillStyle = '#fdbf6f';
        ctx.beginPath();
        ctx.arc(bx, by - 15, 12, 0, Math.PI * 2);
        ctx.fill();

        // ヘルメット
        ctx.fillStyle = '#1a1a8a';
        ctx.beginPath();
        ctx.arc(bx, by - 18, 11, Math.PI * 0.8, Math.PI * 0.2);
        ctx.fill();

        // バット
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        if (this.batter.swinging) {
            // スイング
            const swingAngle = Math.min(this.batter.swingFrame / 10, 1) * Math.PI * 0.8 - Math.PI * 0.3;
            ctx.beginPath();
            ctx.moveTo(bx - 10, by);
            ctx.lineTo(bx - 10 + Math.cos(swingAngle) * 40, by + Math.sin(swingAngle) * 40);
            ctx.stroke();
        } else {
            // 構え
            ctx.beginPath();
            ctx.moveTo(bx - 10, by);
            ctx.lineTo(bx - 35, by - 30);
            ctx.stroke();
        }
    }

    updateUI() {
        if (this.scoreElement) this.scoreElement.textContent = this.score;
        if (this.inningElement) this.inningElement.textContent = this.inning;
        if (this.outElement) this.outElement.textContent = this.outs;
    }

    gameOver() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);

        let rank = '';
        if (this.score >= 10) rank = 'MVP！最高の成績！';
        else if (this.score >= 7) rank = '素晴らしい！';
        else if (this.score >= 4) rank = 'なかなか！';
        else if (this.score >= 1) rank = 'もう少し！';
        else rank = 'ドンマイ！';

        this.finalScoreElement.innerHTML = `
            ${this.score} 点<br>
            <span style="font-size: 0.7em; color: #ff0;">${rank}</span>
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
let baseballGame;
function initBaseballGame() {
    if (document.getElementById('baseball-canvas') && !baseballGame) {
        baseballGame = new BaseballGame();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBaseballGame);
} else {
    initBaseballGame();
}
