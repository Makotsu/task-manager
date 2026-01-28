// タスク管理アプリ

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = {
            status: 'all',
            priority: 'all',
            category: 'all'
        };

        this.initElements();
        this.bindEvents();
        this.render();
        this.requestNotificationPermission();
    }

    // 通知許可をリクエスト
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // デスクトップ通知を送信
    sendNotification(title, body, priority) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const icons = {
                high: '🎉',
                medium: '✅',
                low: '👍'
            };
            const notification = new Notification(title, {
                body: body,
                icon: icons[priority] || '✅',
                badge: icons[priority] || '✅',
                tag: 'task-complete',
                requireInteraction: false
            });

            // 3秒後に自動的に閉じる
            setTimeout(() => {
                notification.close();
            }, 3000);
        }
    }

    // DOM要素の取得
    initElements() {
        // フォーム
        this.taskForm = document.getElementById('task-form');
        this.titleInput = document.getElementById('task-title');
        this.descriptionInput = document.getElementById('task-description');
        this.dueDateInput = document.getElementById('task-due-date');
        this.priorityInput = document.getElementById('task-priority');
        this.categoryInput = document.getElementById('task-category');
        this.tagsInput = document.getElementById('task-tags');

        // フィルター
        this.filterStatus = document.getElementById('filter-status');
        this.filterPriority = document.getElementById('filter-priority');
        this.filterCategory = document.getElementById('filter-category');

        // タスク一覧
        this.taskList = document.getElementById('task-list');
        this.taskCount = document.getElementById('task-count');

        // 編集モーダル
        this.editModal = document.getElementById('edit-modal');
        this.editForm = document.getElementById('edit-form');
        this.editTaskId = document.getElementById('edit-task-id');
        this.editTitle = document.getElementById('edit-title');
        this.editDescription = document.getElementById('edit-description');
        this.editDueDate = document.getElementById('edit-due-date');
        this.editPriority = document.getElementById('edit-priority');
        this.editCategory = document.getElementById('edit-category');
        this.editTags = document.getElementById('edit-tags');
        this.closeBtn = document.querySelector('.close-btn');
    }

    // イベントのバインド
    bindEvents() {
        // タスク追加
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // フィルター変更
        this.filterStatus.addEventListener('change', () => {
            this.currentFilter.status = this.filterStatus.value;
            this.render();
        });

        this.filterPriority.addEventListener('change', () => {
            this.currentFilter.priority = this.filterPriority.value;
            this.render();
        });

        this.filterCategory.addEventListener('change', () => {
            this.currentFilter.category = this.filterCategory.value;
            this.render();
        });

        // 編集フォーム送信
        this.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });

        // モーダルを閉じる
        this.closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
        });

        // Escキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    // ローカルストレージからタスクを読み込む
    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    // ローカルストレージにタスクを保存
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // タスクを追加
    addTask() {
        const task = {
            id: Date.now().toString(),
            title: this.titleInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            dueDate: this.dueDateInput.value,
            priority: this.priorityInput.value,
            category: this.categoryInput.value,
            tags: this.parseTags(this.tagsInput.value),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.resetForm();
        this.render();
    }

    // タグをパース
    parseTags(tagString) {
        if (!tagString.trim()) return [];
        return tagString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    // フォームをリセット
    resetForm() {
        this.taskForm.reset();
        this.priorityInput.value = 'medium';
    }

    // タスクを削除
    deleteTask(id) {
        if (confirm('このタスクを削除しますか？')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
        }
    }

    // タスクの完了状態を切り替え
    toggleComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            const wasCompleted = task.completed;
            task.completed = !task.completed;
            this.saveTasks();
            this.render();

            // 未完了→完了になった時に猫を表示（優先度を渡す）+ 通知
            if (!wasCompleted && task.completed) {
                this.showCelebrationCat(task.priority);
                this.sendNotification(
                    'タスク完了！',
                    `「${task.title}」を完了しました`,
                    task.priority
                );
            }
        }
    }

    // 喜ぶ猫を表示（優先度に応じて激しさを変える）
    showCelebrationCat(priority = 'medium') {
        const catContainer = document.getElementById('celebration-cat');
        const confettiContainer = document.getElementById('confetti');
        const celebrationText = document.getElementById('celebration-text');

        // 優先度に応じた設定
        const settings = {
            high: {
                messages: [
                    '超やったにゃー！！',
                    'すごすぎにゃ！！！',
                    '天才にゃ！！！',
                    '神にゃ！！！！',
                    '最高最高にゃ！！！',
                    'やばいにゃ！！！'
                ],
                confettiCount: 150,
                duration: 3500,
                intensity: 'high'
            },
            medium: {
                messages: [
                    'やったにゃ！',
                    'すごいにゃ！',
                    'えらいにゃ！',
                    '最高にゃ！',
                    'おめでとにゃ！'
                ],
                confettiCount: 50,
                duration: 2500,
                intensity: 'medium'
            },
            low: {
                messages: [
                    'にゃ',
                    'まあまあにゃ',
                    'ふーんにゃ',
                    'よきにゃ'
                ],
                confettiCount: 15,
                duration: 1500,
                intensity: 'low'
            }
        };

        const config = settings[priority] || settings.medium;

        // 以前のintensityクラスを削除
        catContainer.classList.remove('intensity-high', 'intensity-medium', 'intensity-low');
        catContainer.classList.add(`intensity-${config.intensity}`);

        // テキストをランダムに変更
        celebrationText.textContent = config.messages[Math.floor(Math.random() * config.messages.length)];

        // 紙吹雪を生成
        confettiContainer.innerHTML = '';
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];
        for (let i = 0; i < config.confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
            confettiContainer.appendChild(confetti);
        }

        // 猫を表示
        catContainer.classList.add('active');

        // ゲームボタンの表示/非表示
        const playGameBtn = document.getElementById('play-game-btn');
        const playNeonGameBtn = document.getElementById('play-neon-game-btn');
        const playBaseballBtn = document.getElementById('play-baseball-btn');
        if (priority === 'high') {
            // 高優先度の場合、全てのゲームボタンを表示
            playGameBtn.classList.add('visible');
            if (playNeonGameBtn) playNeonGameBtn.classList.add('visible');
            if (playBaseballBtn) playBaseballBtn.classList.add('visible');
            // 猫は消さない（ボタンがクリックされるまで）
        } else {
            playGameBtn.classList.remove('visible');
            if (playNeonGameBtn) playNeonGameBtn.classList.remove('visible');
            if (playBaseballBtn) playBaseballBtn.classList.remove('visible');
            // 設定した時間後に非表示
            setTimeout(() => {
                catContainer.classList.remove('active');
                catContainer.classList.remove(`intensity-${config.intensity}`);
            }, config.duration);
        }
    }

    // 編集モーダルを開く
    openEditModal(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        this.editTaskId.value = task.id;
        this.editTitle.value = task.title;
        this.editDescription.value = task.description;
        this.editDueDate.value = task.dueDate;
        this.editPriority.value = task.priority;
        this.editCategory.value = task.category;
        this.editTags.value = task.tags.join(', ');

        this.editModal.classList.add('active');
    }

    // モーダルを閉じる
    closeModal() {
        this.editModal.classList.remove('active');
    }

    // タスクを更新
    updateTask() {
        const id = this.editTaskId.value;
        const task = this.tasks.find(task => task.id === id);

        if (task) {
            task.title = this.editTitle.value.trim();
            task.description = this.editDescription.value.trim();
            task.dueDate = this.editDueDate.value;
            task.priority = this.editPriority.value;
            task.category = this.editCategory.value;
            task.tags = this.parseTags(this.editTags.value);

            this.saveTasks();
            this.closeModal();
            this.render();
        }
    }

    // フィルター済みタスクを取得
    getFilteredTasks() {
        return this.tasks.filter(task => {
            // ステータスフィルター
            if (this.currentFilter.status === 'pending' && task.completed) return false;
            if (this.currentFilter.status === 'completed' && !task.completed) return false;

            // 優先度フィルター
            if (this.currentFilter.priority !== 'all' && task.priority !== this.currentFilter.priority) {
                return false;
            }

            // カテゴリフィルター
            if (this.currentFilter.category !== 'all' && task.category !== this.currentFilter.category) {
                return false;
            }

            return true;
        });
    }

    // 期限が過ぎているかチェック
    isOverdue(dueDate) {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        return due < today;
    }

    // 日付をフォーマット
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // 優先度のラベルを取得
    getPriorityLabel(priority) {
        const labels = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return labels[priority] || priority;
    }

    // カテゴリのラベルを取得
    getCategoryLabel(category) {
        const labels = {
            work: '仕事',
            personal: 'プライベート',
            study: '勉強',
            health: '健康',
            other: 'その他'
        };
        return labels[category] || category;
    }

    // タスク要素を作成
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item priority-${task.priority}${task.completed ? ' completed' : ''}`;

        const isOverdue = !task.completed && this.isOverdue(task.dueDate);

        div.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.dueDate ? `<span class="task-meta-item${isOverdue ? ' overdue' : ''}">${isOverdue ? '期限切れ: ' : '期限: '}${this.formatDate(task.dueDate)}</span>` : ''}
                    <span class="task-meta-item">優先度: ${this.getPriorityLabel(task.priority)}</span>
                    ${task.category ? `<span class="task-meta-item category-badge category-${task.category}">${this.getCategoryLabel(task.category)}</span>` : ''}
                </div>
                ${task.tags.length > 0 ? `
                    <div class="task-tags">
                        ${task.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-edit">編集</button>
                <button class="btn-delete">削除</button>
            </div>
        `;

        // イベントリスナーを追加
        const checkbox = div.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => this.toggleComplete(task.id));

        const editBtn = div.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => this.openEditModal(task.id));

        const deleteBtn = div.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return div;
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 画面を描画
    render() {
        const filteredTasks = this.getFilteredTasks();

        // タスク数を更新
        this.taskCount.textContent = `(${filteredTasks.length})`;

        // タスク一覧をクリア
        this.taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = '<div class="empty-state">タスクがありません</div>';
            return;
        }

        // タスクを描画
        filteredTasks.forEach(task => {
            const element = this.createTaskElement(task);
            this.taskList.appendChild(element);
        });
    }
}

// アプリを初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new TaskManager();

    // 初期タスクを追加（ミチシルベ2026 タスク一覧 1/21-1/27より）
    if (app.tasks.length === 0) {
        const initialTasks = [
            // 緊急タスク
            {
                id: Date.now().toString() + '1',
                title: '山元淑乃さんへのブース出展条件返答（福原さんと連携）',
                description: '担当: 誠さん・福原さん',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['淑乃、Taichi、隆、海里', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '2',
                title: '登壇者プロフィール回答確認（大岩・松栄・山城さん）',
                description: '担当: 誠さん、期限: 1/28 12時',
                dueDate: '2026-01-28',
                priority: 'high',
                category: 'work',
                tags: ['100億インパクト企業への挑戦', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '3',
                title: '比屋根さんから「100億インパクト」の意義を聞いて登壇者へ共有',
                description: '担当: 誠さん・比屋根さん、打ち合わせ後',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['100億インパクト企業への挑戦', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '4',
                title: 'カリーファンドLPの皆さんへセミナー案内送信',
                description: '担当: 誠さん・Yuko Katoさん、本日〜明日',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['日テレの事例に学ぶ', '緊急'],
                completed: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '5',
                title: 'うむラボ主体のインパクト系イベント参加者へセミナー案内送信',
                description: '担当: 誠さん・Yuko Katoさん、本日〜明日',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['日テレの事例に学ぶ', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '6',
                title: '出資先・金融機関（公庫・琉銀）へセミナー案内送信',
                description: '担当: 誠さん・Yuko Katoさん、今週中',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['カリーファンド全体定例', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '7',
                title: '新井さんがマルシェ出店フォームに回答',
                description: '担当: 新井さん、期限: 1/30',
                dueDate: '2026-01-30',
                priority: 'high',
                category: 'work',
                tags: ['地球をドリップする', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '8',
                title: 'ミスト器などの郵送物を山川さん宛に送付',
                description: '担当: 新井さん、期限: 2/10',
                dueDate: '2026-02-10',
                priority: 'high',
                category: 'work',
                tags: ['地球をドリップする', '緊急'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // 今週中タスク
            {
                id: Date.now().toString() + '9',
                title: 'チャイルドサポート決裁書PDFをドライブに保管',
                description: '担当: 誠さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['カリーファンド事務局', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '10',
                title: 'チャイルドサポートへ北九州市面談可否確認',
                description: '担当: 誠さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['カリーファンド事務局', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '11',
                title: 'Ambiiへ北九州市面談可否確認',
                description: '担当: 誠さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['カリーファンド事務局', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '12',
                title: '平井さんの画像を広報チームと連携',
                description: '担当: 誠さん、今週中',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ピースワールドカフェ', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '13',
                title: '登壇者プロフィール回答リマインド',
                description: '担当: 誠さん→大平さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['こどもまんなか社会', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '14',
                title: 'パスリンク反映確認',
                description: '担当: 誠さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['サイト制作', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '15',
                title: 'サイト編集権限の検討（まこつさん・ユメさん）',
                description: '担当: 誠さん・日和さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['サイト制作', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '16',
                title: '主催者写真・プロフィール受け取り',
                description: '担当: 誠さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['UTAKIジャーニー', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '17',
                title: '保健所対応・営業許可取得・設備準備',
                description: '担当: 楓佳さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['Yorisoilce', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '18',
                title: '最終成果報告書作成（時系列スライド追加）',
                description: '担当: 永田さん、期限: 1/31',
                dueDate: '2026-01-31',
                priority: 'medium',
                category: 'work',
                tags: ['R7未来の教室', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '19',
                title: '確認書類対応',
                description: '担当: 比屋根さん、早急',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['うむさんラボ⇔eiicon', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '20',
                title: '申込期限2/10延長・上限50食で進行',
                description: '担当: Taichiさん、期限: 2/10',
                dueDate: '2026-02-10',
                priority: 'medium',
                category: 'work',
                tags: ['お弁当（のあの土）', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '21',
                title: '1/28撮影実施・1/30公開',
                description: '担当: 仲宗根さん・亜里沙さん、期限: 1/28',
                dueDate: '2026-01-28',
                priority: 'medium',
                category: 'work',
                tags: ['ショート動画撮影', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '22',
                title: '教室割当確認・サポーター参加調整',
                description: '担当: Taichiさん・平良さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['マイプロ×ミチシルベ', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '23',
                title: 'デザイン修正リクエスト管理・FIX',
                description: '担当: 山川さん・日和さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['パンフレット制作', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '24',
                title: '2/2 20:30事前ミーティング実施',
                description: '担当: 比屋根さん他、期限: 2/2',
                dueDate: '2026-02-02',
                priority: 'medium',
                category: 'work',
                tags: ['ワールドピースの鍵', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '25',
                title: '2/4 17-18時事前ミーティング実施',
                description: '担当: 比屋根さん他',
                dueDate: '2026-02-04',
                priority: 'medium',
                category: 'work',
                tags: ['おきなわ経営dialogue', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '26',
                title: 'キッチンカー配置確認・許可証確認',
                description: '担当: 山川さん・伊差川さん',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['スポフェス', '今週中'],
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];

        app.tasks = initialTasks;
        app.saveTasks();
        app.render();
    }
});
