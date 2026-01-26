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
        if (priority === 'high') {
            // 高優先度の場合、両方のゲームボタンを表示
            playGameBtn.classList.add('visible');
            if (playNeonGameBtn) {
                playNeonGameBtn.classList.add('visible');
            }
            // 猫は消さない（ボタンがクリックされるまで）
        } else {
            playGameBtn.classList.remove('visible');
            if (playNeonGameBtn) {
                playNeonGameBtn.classList.remove('visible');
            }
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

    // 初期タスクを追加（タスクリスト_整理済み.mdより）
    if (app.tasks.length === 0) {
        const initialTasks = [
            // 創業アカデミー関連【期限あり】
            {
                id: Date.now().toString() + '1',
                title: '創業アカデミー実施報告書（完了報告書）の提出',
                description: '',
                dueDate: '2026-02-24',
                priority: 'high',
                category: 'work',
                tags: ['創業アカデミー', '期限あり'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '2',
                title: '請求書の発行依頼',
                description: '',
                dueDate: '2026-03-31',
                priority: 'high',
                category: 'work',
                tags: ['創業アカデミー', '経理'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '3',
                title: '注文請書の作成依頼（2025年8月5日付け）',
                description: '2月20日に依頼',
                dueDate: '2026-02-20',
                priority: 'high',
                category: 'work',
                tags: ['創業アカデミー', '経理'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '4',
                title: 'サイトの更新を行う',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業アカデミー', 'サイト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '5',
                title: 'セッション一覧を追加する',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業アカデミー', 'サイト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // Zoomミーティング関連タスク
            {
                id: Date.now().toString() + '6',
                title: '少年院の情報共有',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['Zoom', '情報共有'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '7',
                title: '申込者への一斉メール送信',
                description: '',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['Zoom', 'メール'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '8',
                title: '夕方の会議への参加',
                description: '',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['Zoom', '会議'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '9',
                title: 'サムネイル作成',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['Zoom', 'デザイン'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '10',
                title: 'メッセンジャーで目指したいゴールを共有する',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['Zoom', '共有'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '11',
                title: 'カリーファンド対応',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['Zoom'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '12',
                title: 'マイプロ作成',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['Zoom'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // モデレーター関連
            {
                id: Date.now().toString() + '13',
                title: '渋谷さん：持ち帰り対応',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['モデレーター'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '14',
                title: '山城さん：後日共有',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['モデレーター'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '15',
                title: '松栄さん・大岩さん：共有済み確認',
                description: '',
                dueDate: '',
                priority: 'low',
                category: 'work',
                tags: ['モデレーター'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '16',
                title: 'はるなさん：後継セッション取り組み',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['モデレーター'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '17',
                title: '平井さんへSNS用画像の依頼',
                description: 'ワークショップの「楽しさ」「ワクワク感」が伝わる別パターン画像を数枚依頼',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['SNS', 'デザイン'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // ツアー・ワークショップ確認事項
            {
                id: Date.now().toString() + '18',
                title: '比嘉さん：通常営業で違うコースを出してもらえるか確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ツアー', '確認'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '19',
                title: '王妃：広報共有',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ツアー', '広報'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '20',
                title: 'じょりーさん：一名でも実施するか確認（なくす方向）',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ツアー', '確認'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '21',
                title: '那覇：申し込み状況確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ツアー', '確認'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '22',
                title: 'エンカレッジ：命の授業についてクローズドで実施',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ツアー'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // ステージング・会場関連【2/13-14】
            {
                id: Date.now().toString() + '23',
                title: 'スタッフがどこまで動けるか確認',
                description: '',
                dueDate: '2026-02-13',
                priority: 'high',
                category: 'work',
                tags: ['ステージング', '会場'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '24',
                title: '現在の構成でスピーカー出力に問題ないか確認',
                description: '',
                dueDate: '2026-02-13',
                priority: 'high',
                category: 'work',
                tags: ['ステージング', '機材'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '25',
                title: '請求書バージョン2を受領する',
                description: '',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ステージング', '経理'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '26',
                title: '前金での振り込み対応',
                description: '',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ステージング', '経理'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // サイト・イベント準備関連
            {
                id: Date.now().toString() + '27',
                title: 'キャスト一覧作成（名前、所属、ハッシュタグ）',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['イベント', 'サイト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '28',
                title: '登壇者一覧作成（名前、肩書、詳細）',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['イベント', 'サイト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '29',
                title: 'セッション詳細ページ作成',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['イベント', 'サイト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '30',
                title: '委任状作成（議案を取り扱う）',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['イベント'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '31',
                title: '2分程度のプログラム作成',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['イベント'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '32',
                title: '写真準備',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['イベント'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // 写真収集・映像制作
            {
                id: Date.now().toString() + '33',
                title: '写真をスライドにする',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['映像', '写真'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '34',
                title: 'SAKURA：2分の歌にする',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['SAKURA', '映像'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '35',
                title: 'SAKURA：sonoで編集する',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['SAKURA', '映像'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '36',
                title: 'SAKURA：学生に編集を依頼する',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['SAKURA', '映像'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '37',
                title: '歌担当を決める',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['映像', '担当'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '38',
                title: '映像担当を決める',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['映像', '担当'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // 片山ひできさん・デッキーさん関連【司会】
            {
                id: Date.now().toString() + '39',
                title: 'デッキーさんに事前にどのような方か情報共有',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['司会', '準備'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '40',
                title: '当日少し早めにお話しするか、事前に読み合わせを行う',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['司会', '準備'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '41',
                title: 'オープニング・クロージングの担当範囲を確定',
                description: '',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['司会'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '42',
                title: '関わっている役者の方への依頼',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['司会'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '43',
                title: 'ボランティア：昼食の提供有無を確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ボランティア'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '44',
                title: 'ボランティア：駐車場の案内',
                description: '',
                dueDate: '',
                priority: 'low',
                category: 'work',
                tags: ['ボランティア'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '45',
                title: 'ボランティア：服装の指定',
                description: '',
                dueDate: '',
                priority: 'low',
                category: 'work',
                tags: ['ボランティア'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // 創業支援事業・公募関連
            {
                id: Date.now().toString() + '46',
                title: 'プログラムの載せ替え可否確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援', '公募'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '47',
                title: '起業支援金でプログラムを見られるか確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援', '公募'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '48',
                title: '補助金で事務経費に充当可能か確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援', '公募'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '49',
                title: '事務経費への組み替え可否確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援', '公募'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '50',
                title: '創業支援事業委託と起業支援金公募のパッケージ公募調整',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援', '公募'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '51',
                title: 'STの中身について確認',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '52',
                title: 'ミールラウンドのモニター検証',
                description: '',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['創業支援'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            // ミチシルベ2026「100億インパクト企業への挑戦」セッション関連
            {
                id: Date.now().toString() + '53',
                title: '田中氏（モデレーター）との事前打ち合わせ',
                description: '各社のリアルな経験や想いを引き出す進行について確認',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '54',
                title: '大岩氏への事前情報共有・確認',
                description: '100億達成企業としての経験、M&A、次の価値観について',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション', 'パネリスト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '55',
                title: '松栄氏への事前情報共有・確認',
                description: '100億シンクタンク、M&Aアドバイザリー経験について',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション', 'パネリスト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '56',
                title: '山城氏への事前情報共有',
                description: '海ぶどう養殖・海外15カ国展開の後継ぎ経営者として',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション', 'パネリスト'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '57',
                title: '渋谷氏の構成案を最終確認',
                description: '導入部分、市場の壁、人・組織の壁、意思決定と覚悟の壁の4構成',
                dueDate: '',
                priority: 'high',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '58',
                title: 'セッション登壇者のプロフィール準備',
                description: '田中氏、大岩氏、松栄氏、山城氏の紹介資料作成',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '59',
                title: 'セッションのゴール・メッセージの最終確認',
                description: '後継ぎ経営者の目線を上げ「自分たちも目指してみよう」と思わせる内容に',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション'],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now().toString() + '60',
                title: '「ぶっつけ本番」形式の進行確認',
                description: 'カッチリした台本ではなく、登壇者の本音が出る形式で進行',
                dueDate: '',
                priority: 'medium',
                category: 'work',
                tags: ['ミチシルベ2026', '100億セッション'],
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];

        app.tasks = initialTasks;
        app.saveTasks();
        app.render();
    }
});
