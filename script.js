class TicTacToe {
    constructor() {
        this.board = Array(36).fill('');
        this.currentPlayer = 'o';
        this.gameActive = true;
        this.gravityUsed = { o: false, x: false };
        this.lastGravityDirection = null; 
        
        // CPU対戦モード用の変数
        this.isCpuMode = false;
        this.cpuPlayer = 'x'; 
        this.humanPlayer = 'o'; 
        
        // 設定・難易度用変数
        this.animationSpeed = 'normal';
        this.currentTheme = 'default';
        this.difficulty = 'easy';
        this.isGuideMode = true; 
        
        // 重力プレビュー用のタイマー
        this.previewInterval = null;
        this.previewState = 'actual'; 
        this.activeHoldDirection = null; 
        
        // 1手戻る（Undo）履歴
        this.historyStack = [];
        
        this.initializeGame();
    }

    initializeGame() {
        this.bindEvents();
        this.updateStatus();
        this.updateGravityButton();
        this.hideWinnerModal(); 
        this.scanAndRenderDangerZones(); 
    }
    
    bindEvents() {
        document.getElementById('play-2p-btn').addEventListener('click', () => this.showGameScreen());
        document.getElementById('play-cpu-btn').addEventListener('click', () => this.showCpuSelectionScreen());
        
        document.getElementById('cpu-first-btn').addEventListener('click', () => this.startCpuGame('human'));
        document.getElementById('cpu-second-btn').addEventListener('click', () => this.startCpuGame('cpu'));
        document.getElementById('cpu-random-btn').addEventListener('click', () => this.startCpuGame('random'));
        document.getElementById('back-to-main-from-cpu-btn').addEventListener('click', () => this.showMainScreen());
        
        document.getElementById('diff-easy-btn').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('diff-normal-btn').addEventListener('click', () => this.setDifficulty('normal'));
        document.getElementById('diff-hard-btn').addEventListener('click', () => this.setDifficulty('hard'));
        
        const backToMainFromGameBtn = document.getElementById('back-to-main-from-game-btn');
        if (backToMainFromGameBtn) {
            backToMainFromGameBtn.addEventListener('click', () => this.showMainScreen());
        }
        
        document.getElementById('help-btn').addEventListener('click', () => this.showHelpModal());
        const helpBtnGame = document.getElementById('help-btn-game');
        if (helpBtnGame) helpBtnGame.addEventListener('click', () => this.showHelpModal());
        document.getElementById('close-help-btn').addEventListener('click', () => this.hideHelpModal());
        
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
        const settingsBtnGame = document.getElementById('settings-btn-game');
        if (settingsBtnGame) settingsBtnGame.addEventListener('click', () => this.showSettingsModal());
        document.getElementById('close-settings-btn').addEventListener('click', () => this.hideSettingsModal());
        
        document.getElementById('speed-normal-btn').addEventListener('click', () => this.setAnimationSpeed('normal'));
        document.getElementById('speed-fast-btn').addEventListener('click', () => this.setAnimationSpeed('fast'));
        document.getElementById('theme-default-btn').addEventListener('click', () => this.setTheme('default'));
        document.getElementById('theme-dark-btn').addEventListener('click', () => this.setTheme('dark'));
        document.getElementById('guide-on-btn').addEventListener('click', () => this.setGuideMode(true));
        document.getElementById('guide-off-btn').addEventListener('click', () => this.setGuideMode(false));
        
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') this.hideHelpModal();
        });
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') this.hideSettingsModal();
        });
        
        // セルのクリック
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        
        // 重力メニューボタンのトグル開閉
        document.getElementById('gravity-btn').addEventListener('click', () => {
            if (this.gravityUsed[this.currentPlayer]) return;
            const directions = document.getElementById('gravity-directions');
            if (directions.style.display === 'flex') {
                directions.style.display = 'none';
                this.stopGravityPreview(); 
            } else {
                directions.style.display = 'flex';
            }
        });
        
        // 💻📱 ハイブリッド：PCホバー ✕ スマホ長押しプレビューの完全共存
        document.querySelectorAll('.direction-btn').forEach(btn => {
            // モバイル長押し
            btn.addEventListener('touchstart', (e) => this.handleDirectionTouchStart(e), { passive: false });
            btn.addEventListener('touchend', (e) => this.handleDirectionTouchEnd(e), { passive: false });
            btn.addEventListener('touchmove', (e) => this.handleDirectionTouchMove(e), { passive: false });
            
            // パソコンマウス操作（乗せるだけでプレビュー、クリックで発動）
            btn.addEventListener('mouseenter', (e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                    this.startGravityPreview(e.target.dataset.direction);
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (window.matchMedia('(hover: hover)').matches) {
                    this.stopGravityPreview();
                }
            });
            btn.addEventListener('click', (e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                    this.useGravity(e.target.dataset.direction);
                }
            });
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => this.undoLastMove());
        
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());

        // 🟥 修正：勝者モーダルのボタンクリックイベントを確実に拾う設計
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            this.hideWinnerModal();
            this.showMainScreen();
        });
    }

    saveSnapshotToHistory() {
        const snapshot = {
            board: [...this.board],
            currentPlayer: this.currentPlayer,
            gravityUsed: { ...this.gravityUsed },
            lastGravityDirection: this.lastGravityDirection
        };
        this.historyStack.push(snapshot);
        this.updateUndoButtonState();
    }

    undoLastMove() {
        if (this.historyStack.length === 0 || !this.gameActive) return;
        
        this.stopGravityPreview();
        let undoCount = (this.isCpuMode) ? 2 : 1;
        if (this.isCpuMode && this.historyStack.length < 2) undoCount = 1;

        for (let i = 0; i < undoCount; i++) {
            if (this.historyStack.length === 0) break;
            const previousState = this.historyStack.pop();
            this.board = previousState.board;
            this.currentPlayer = previousState.currentPlayer;
            this.gravityUsed = previousState.gravityUsed;
            this.lastGravityDirection = previousState.lastGravityDirection;
        }

        this.renderActualFrame();
        this.updateStatus();
        this.updateGravityButton();
        this.updateUndoButtonState();
        this.scanAndRenderDangerZones(); 
        document.getElementById('gravity-directions').style.display = 'none';
    }

    updateUndoButtonState() {
        document.getElementById('undo-btn').disabled = (this.historyStack.length === 0);
    }
    
    showGameScreen() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        this.isCpuMode = false;
        this.resetGame();
    }
    
    showCpuSelectionScreen() {
        this.hideWinnerModal();
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('cpu-selection-screen').style.display = 'flex';
    }
    
    startCpuGame(mode) {
        this.isCpuMode = true;
        document.getElementById('cpu-selection-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        
        if (mode === 'random') mode = Math.random() < 0.5 ? 'human' : 'cpu';
        
        let isCpuFirst = false;
        if (mode === 'cpu') {
            this.currentPlayer = 'x'; this.cpuPlayer = 'x'; this.humanPlayer = 'o';
            isCpuFirst = true; this.initialStartingPlayer = 'x';
        } else {
            this.currentPlayer = 'o'; this.cpuPlayer = 'x'; this.humanPlayer = 'o';
            isCpuFirst = false; this.initialStartingPlayer = 'o';
        }
        
        this.resetGame();
        this.updateStatus();
        
        // 🤖 修正：後手(CPUが先)を選択時に、確実にCPUの初手が発動する修正
        if (isCpuFirst && this.gameActive) {
            setTimeout(() => this.makeCpuMove(), this.animationSpeed === 'normal' ? 600 : 150);
        }
    }
    
    showMainScreen() {
        this.hideWinnerModal();
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('cpu-selection-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'flex';
        this.gameActive = false;
    }
    
    showHelpModal() { document.getElementById('help-modal').style.display = 'flex'; }
    hideHelpModal() { document.getElementById('help-modal').style.display = 'none'; }
    showSettingsModal() { document.getElementById('settings-modal').style.display = 'flex'; }
    hideSettingsModal() { document.getElementById('settings-modal').style.display = 'none'; }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
        document.getElementById('speed-normal-btn').classList.toggle('active', speed === 'normal');
        document.getElementById('speed-fast-btn').classList.toggle('active', speed === 'fast');
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.getElementById('theme-default-btn').classList.toggle('active', theme === 'default');
        document.getElementById('theme-dark-btn').classList.toggle('active', theme === 'dark');
        document.body.classList.toggle('dark-theme', theme === 'dark');
    }

    scanAndRenderDangerZones() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('danger-border'));

        if (!this.gameActive || !this.isGuideMode) return;
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return; 

        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.currentPlayer;
                const isDanger = this.wouldCpuLosePieces(i);
                this.board[i] = '';

                if (isDanger) {
                    const targetCell = document.querySelector(`[data-index="${i}"]`);
                    if (targetCell) targetCell.classList.add('danger-border');
                }
            }
        }
    }

    // モバイルタッチ長押しプレビューロジック
    handleDirectionTouchStart(e) {
        if (!this.gameActive || !this.isGuideMode) return;
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return;
        e.preventDefault();

        const btn = e.target.closest('.direction-btn');
        const direction = btn.dataset.direction;
        
        this.activeHoldDirection = direction;
        btn.classList.add('preview-active');
        this.startGravityPreview(direction);
    }

    handleDirectionTouchEnd(e) {
        if (!this.activeHoldDirection) return;
        e.preventDefault();

        const dir = this.activeHoldDirection;
        const btn = document.querySelector(`.direction-btn[data-direction="${dir}"]`);
        if (btn) btn.classList.remove('preview-active');
        
        this.activeHoldDirection = null;
        this.stopGravityPreview();

        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetElement && targetElement.closest(`.direction-btn[data-direction="${dir}"]`)) {
            this.useGravity(dir);
        }
    }

    handleDirectionTouchMove(e) {
        if (!this.activeHoldDirection) return;
        e.preventDefault();

        const dir = this.activeHoldDirection;
        const touch = e.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

        const btn = document.querySelector(`.direction-btn[data-direction="${dir}"]`);
        if (!targetElement || !targetElement.closest(`.direction-btn[data-direction="${dir}"]`)) {
            if (btn) btn.classList.remove('preview-active');
            this.stopGravityPreview();
        } else {
            if (btn && !btn.classList.contains('preview-active')) {
                btn.classList.add('preview-active');
                this.startGravityPreview(dir);
            }
        }
    }

    startGravityPreview(direction) {
        if (!this.gameActive || !this.isGuideMode) return;
        if (this.previewInterval) clearInterval(this.previewInterval);
        
        const simulatedBoard = this.simulateGravity(direction);
        this.previewState = 'future';
        this.renderPreviewFrame(simulatedBoard);
        
        this.previewInterval = setInterval(() => {
            if (this.previewState === 'future') {
                this.previewState = 'actual';
                this.renderActualFrame();
            } else {
                this.previewState = 'future';
                this.renderPreviewFrame(simulatedBoard);
            }
        }, 1000);
    }

    stopGravityPreview() {
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
            this.previewInterval = null;
        }
        this.renderActualFrame();
        this.scanAndRenderDangerZones(); 
    }

    renderPreviewFrame(simulatedBoard) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.classList.remove('o', 'x', 'preview-o', 'preview-x', 'danger-border');
            const value = simulatedBoard[index];
            if (value !== '') {
                cell.classList.add(value === 'o' ? 'preview-o' : 'preview-x');
                cell.textContent = value === 'o' ? '〇' : '✕';
            } else {
                cell.textContent = '';
            }
        });
    }

    renderActualFrame() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.classList.remove('preview-o', 'preview-x', 'o', 'x');
            const actualValue = this.board[index];
            if (actualValue !== '') {
                cell.classList.add(actualValue);
                cell.textContent = actualValue === 'o' ? '〇' : '✕';
            } else {
                cell.textContent = '';
            }
        });
    }
    
    async handleCellClick(e) {
        if (!this.gameActive) return;
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return;
        
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        if (this.board[index] !== '') return;
        
        this.saveSnapshotToHistory();
        await this.makeMove(index);
        
        if (this.gameActive) {
            this.switchPlayer(); this.updateStatus(); this.updateGravityButton();
            this.scanAndRenderDangerZones(); 

            if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) {
                setTimeout(() => this.makeCpuMove(), this.animationSpeed === 'normal' ? 500 : 100);
            }
        }
    }
    
    async makeCpuMove() {
        if (!this.gameActive || this.currentPlayer !== this.cpuPlayer) return;
        
        this.saveSnapshotToHistory();
        const move = this.getCpuMove();
        if (move === 'gravity') return;
        else if (move !== -1) {
            await this.makeMove(move);
            if (this.gameActive) {
                setTimeout(() => { 
                    this.switchPlayer(); this.updateStatus(); this.updateGravityButton(); 
                    this.scanAndRenderDangerZones(); 
                }, this.animationSpeed === 'normal' ? 500 : 100);
            }
        }
    }
    
    getCpuMove() {
        if (this.difficulty !== 'easy' && !this.gravityUsed[this.cpuPlayer]) {
            for (const dir of ['up', 'down', 'left', 'right']) {
                if (this.checkWinnerForSimulatedBoard(this.simulateGravity(dir), this.cpuPlayer)) { this.useGravity(dir); return 'gravity'; }
            }
        }

        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.cpuPlayer;
                const isWin = this.checkWinnerForPlayer(this.cpuPlayer);
                const isErased = this.wouldCpuLosePieces(i);
                this.board[i] = '';
                if (isWin && !isErased) return i;
            }
        }

        let opponentReachIndex = -1;
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.humanPlayer;
                const oppWin = this.checkWinnerForPlayer(this.humanPlayer);
                this.board[i] = '';
                if (oppWin) { opponentReachIndex = i; break; }
            }
        }

        if (opponentReachIndex !== -1) {
            this.board[opponentReachIndex] = this.cpuPlayer;
            const willSelfDestruct = this.wouldCpuLosePieces(opponentReachIndex);
            this.board[opponentReachIndex] = '';

            if (!willSelfDestruct) return opponentReachIndex;
            else {
                if (this.difficulty !== 'easy' && !this.gravityUsed[this.cpuPlayer]) {
                    const defensiveDir = this.findDefensiveGravityMove();
                    if (defensiveDir) { this.useGravity(defensiveDir); return 'gravity'; }
                }
                return opponentReachIndex;
            }
        }

        const emptyCells = [];
        for (let i = 0; i < 36; i++) { if (this.board[i] === '') emptyCells.push(i); }

        let finalCandidateCells = [...emptyCells];
        if (this.difficulty === 'hard') {
            const safeCells = [];
            for (const moveIndex of emptyCells) {
                this.board[moveIndex] = this.cpuPlayer;
                if (this.wouldCpuLosePieces(moveIndex)) { this.board[moveIndex] = ''; continue; }
                let isDangerous = false;
                if (!this.gravityUsed[this.humanPlayer]) {
                    for (const dir of ['up', 'down', 'left', 'right']) {
                        if (this.checkWinnerForSimulatedBoard(this.simulateGravity(dir), this.humanPlayer)) isDangerous = true;
                    }
                }
                for (let h = 0; h < 36; h++) {
                    if (this.board[h] === '') {
                        this.board[h] = this.humanPlayer;
                        if (this.checkWinnerForPlayer(this.humanPlayer)) isDangerous = true;
                        this.board[h] = '';
                    }
                }
                this.board[moveIndex] = '';
                if (!isDangerous) safeCells.push(moveIndex);
            }
            if (safeCells.length > 0) finalCandidateCells = safeCells;
        }

        if (this.difficulty !== 'easy') {
            for (const i of finalCandidateCells) {
                this.board[i] = this.cpuPlayer;
                let success = false;
                for (const d of ['up', 'down', 'left', 'right']) {
                    if (this.checkWinnerForSimulatedBoard(this.simulateGravity(d), this.cpuPlayer)) success = true;
                }
                this.board[i] = ''; if (success) return i;
            }
            for (const i of finalCandidateCells) {
                this.board[i] = this.cpuPlayer;
                let patterns = 0;
                for (let n = 0; n < 36; n++) {
                    if (this.board[n] === '') {
                        this.board[n] = this.cpuPlayer;
                        if (this.checkWinnerForPlayer(this.cpuPlayer) && !this.wouldCpuLosePieces(n)) patterns++;
                        this.board[n] = '';
                    }
                }
                this.board[i] = ''; if (patterns >= 2) return i;
            }
        }

        const centralMyStrategic = []; const centralOpponentStrategic = [];
        const myStrategic = []; const opponentStrategic = []; const centralCells = [];

        for (const i of finalCandidateCells) {
            if (this.difficulty !== 'hard' && this.wouldCpuLosePieces(i)) continue;
            const isNearMe = this.isNearPlayer(i, this.cpuPlayer);
            const isNearOpponent = this.isNearPlayer(i, this.humanPlayer);
            const row = Math.floor(i / 6); const col = i % 6;
            const isCentral = (row >= 1 && row <= 4 && col >= 1 && col <= 4);

            if (isCentral) {
                centralCells.push(i);
                if (isNearMe) centralMyStrategic.push(i);
                if (isNearOpponent) centralOpponentStrategic.push(i);
            }
            if (isNearMe) myStrategic.push(i);
            else if (isNearOpponent) opponentStrategic.push(i);
        }

        if (centralMyStrategic.length > 0) return centralMyStrategic[Math.floor(Math.random() * centralMyStrategic.length)];
        if (centralOpponentStrategic.length > 0) return centralOpponentStrategic[Math.floor(Math.random() * centralOpponentStrategic.length)];
        if (myStrategic.length > 0) return myStrategic[Math.floor(Math.random() * myStrategic.length)];
        if (opponentStrategic.length > 0) return opponentStrategic[Math.floor(Math.random() * opponentStrategic.length)];
        if (centralCells.length > 0) return centralCells[Math.floor(Math.random() * centralCells.length)];
        if (finalCandidateCells.length > 0) return finalCandidateCells[Math.floor(Math.random() * finalCandidateCells.length)];
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    findWinningMove(player) { return -1; }
    findBlockingMove() { return -1; }
    getStrategicRandomMove() { return -1; }
    
    wouldCpuLosePieces(moveIndex) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const row = Math.floor(moveIndex / 6); const col = moveIndex % 6;
        const targetPlayer = this.board[moveIndex]; if (targetPlayer === '') return false;
        
        for (let [dx, dy] of directions) {
            let count = 1; let x = col + dx; let y = row + dy;
            while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                if (this.board[y * 6 + x] === targetPlayer) { count++; x += dx; y += dy; } else break;
            }
            x = col - dx; y = row - dy;
            while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                if (this.board[y * 6 + x] === targetPlayer) { count++; x -= dx; y -= dy; } else break;
            }
            if (count === 3) return true;
        }
        return false;
    }
    
    simulateGravity(direction) {
        const currentBoard = [...this.board]; const newBoard = Array(36).fill('');
        if (direction === 'up') {
            for (let col = 0; col < 6; col++) {
                let w = col; for (let row = 0; row < 6; row++) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w += 6; }
                }
            }
        } else if (direction === 'down') {
            for (let col = 0; col < 6; col++) {
                let w = 30 + col; for (let row = 5; row >= 0; row--) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w -= 6; }
                }
            }
        } else if (direction === 'left') {
            for (let row = 0; row < 6; row++) {
                let w = row * 6; for (let col = 0; col < 6; col++) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w++; }
                }
            }
        } else if (direction === 'right') {
            for (let row = 0; row < 6; row++) {
                let w = row * 6 + 5; for (let col = 5; col >= 0; col--) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w--; }
                }
            }
        }
        return newBoard;
    }
    
    isNearPlayer(index, player) {
        const row = Math.floor(index / 6); const col = index % 6;
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (let [dy, dx] of directions) {
            const newRow = row + dy; const newCol = col + dx;
            if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 6) {
                if (this.board[newRow * 6 + newCol] === player) return true;
            }
        }
        return false;
    }
    
    async makeMove(index) {
        this.board[index] = this.currentPlayer; this.updateCell(index);
        if (this.checkWinner()) { this.endGame(); return; }
        await this.checkAndRemoveThrees();
        if (this.checkDraw()) { this.endGame(true); return; }
    }
    
    async useGravity(direction) {
        if (this.gravityUsed[this.currentPlayer]) return;
        
        this.saveSnapshotToHistory();
        this.gravityUsed[this.currentPlayer] = true;
        this.lastGravityDirection = direction;
        document.getElementById('gravity-directions').style.display = 'none';
        
        this.stopGravityPreview(); 
        
        await this.sleep(300);
        await this.applyGravity(direction);
    }
    
    async applyGravity(direction) {
        this.showLoadingIndicator();
        const currentBoard = [...this.board]; const newBoard = Array(36).fill(''); const moves = [];
        
        if (direction === 'up') {
            for (let col = 0; col < 6; col++) {
                let w = col; for (let row = 0; row < 6; row++) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') {
                        newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w += 6;
                    }
                }
            }
        } else if (direction === 'down') {
            for (let col = 0; col < 6; col++) {
                let w = 30 + col; for (let row = 5; row >= 0; row--) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') {
                        newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w -= 6;
                    }
                }
            }
        } else if (direction === 'left') {
            for (let row = 0; row < 6; row++) {
                let w = row * 6; for (let col = 0; col < 6; col++) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') {
                        newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w++;
                    }
                }
            }
        } else if (direction === 'right') {
            for (let row = 0; row < 6; row++) {
                let w = row * 6 + 5; for (let col = 5; col >= 0; col--) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') {
                        newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w--;
                    }
                }
            }
        }
        
        this.board = newBoard;
        if (moves.length > 0 && this.animationSpeed === 'normal') await this.animateGravityMoves(moves);
        else this.updateBoardDisplay();
        await this.afterGravityCheck();
    }
    
    async animateGravityMoves(moves) {
        if (moves.length === 0) return;
        const maxDistance = Math.max(...moves.map(move => Math.abs(move.to - move.from)));
        for (let step = 1; step <= maxDistance; step++) {
            await this.animateAllMovesOneStep(moves, step);
            if (step < maxDistance) await this.sleep(120);
        }
        this.updateBoardDisplay();
    }
    
    async animateAllMovesOneStep(moves, step) {
        return new Promise((resolve) => {
            const cellsToUpdate = new Set();
            moves.forEach(move => {
                const distance = Math.abs(move.to - move.from);
                if (step <= distance) {
                    const c = this.calculateCurrentPosition(move, step);
                    const p = this.calculateCurrentPosition(move, step - 1);
                    if (c !== p) cellsToUpdate.add({ from: p, to: c, value: move.value });
                }
            });
            
            cellsToUpdate.forEach(update => {
                const fromCell = document.querySelector(`[data-index="${update.from}"]`);
                const toCell = document.querySelector(`[data-index="${update.to}"]`);
                if (fromCell && toCell) {
                    fromCell.textContent = ''; fromCell.classList.remove('o', 'x');
                    toCell.textContent = update.value === 'o' ? '〇' : '✕'; toCell.classList.add(update.value, 'moving');
                }
            });
            setTimeout(() => {
                cellsToUpdate.forEach(update => {
                    const toCell = document.querySelector(`[data-index="${update.to}"]`);
                    if (toCell) toCell.classList.remove('moving');
                });
                resolve();
            }, 100);
        });
    }
    
    calculateCurrentPosition(move, step) {
        const direction = this.lastGravityDirection;
        const fromRow = Math.floor(move.from / 6); const fromCol = move.from % 6;
        const toRow = Math.floor(move.to / 6); const toCol = move.to % 6;
        let currentRow, currentCol;
        
        if (direction === 'up') { currentRow = fromRow - Math.min(step, fromRow - toRow); currentCol = fromCol; }
        else if (direction === 'down') { currentRow = fromRow + Math.min(step, toRow - fromRow); currentCol = fromCol; }
        else if (direction === 'left') { currentRow = fromRow; currentCol = fromCol - Math.min(step, fromCol - toCol); }
        else if (direction === 'right') { currentRow = fromRow; currentCol = fromCol + Math.min(step, toCol - fromCol); }
        return currentRow * 6 + currentCol;
    }
    
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    async updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        const animationPromises = [];

        cells.forEach((cell, index) => {
            const value = this.board[index];
            if (value !== '') {
                cell.textContent = value === 'o' ? '〇' : '✕'; cell.classList.remove('o', 'x', 'preview-o', 'preview-x', 'danger-border'); cell.classList.add(value, 'moving');
                if (this.animationSpeed === 'normal') {
                    animationPromises.push(new Promise(resolve => { setTimeout(() => { cell.classList.remove('moving'); resolve(); }, 400); }));
                } else cell.classList.remove('moving');
            } else {
                cell.textContent = ''; cell.classList.remove('o', 'x', 'moving', 'preview-o', 'preview-x', 'danger-border');
                cell.style.background = ''; cell.style.boxShadow = '';
            }
        });
        if (animationPromises.length > 0) await Promise.all(animationPromises);
    }
    
    async afterGravityCheck() {
        const oWins = this.checkWinnerForPlayer('o'); const xWins = this.checkWinnerForPlayer('x');
        if (oWins && xWins) { this.hideLoadingIndicator(); this.endGame(true); return; }
        else if (oWins) { this.endGame(false, '〇が勝ちました！', true); return; }
        else if (xWins) { this.endGame(false, '✕が勝ちました！', true); return; }
        
        await this.checkAndRemoveThreesWithChainGravity();
        this.hideLoadingIndicator();

        if (this.gameActive) {
            setTimeout(() => {
                this.switchPlayer(); this.updateStatus(); this.updateGravityButton();
                this.scanAndRenderDangerZones(); 

                if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) {
                    setTimeout(() => this.makeCpuMove(), this.animationSpeed === 'normal' ? 500 : 100);
                }
            }, this.animationSpeed === 'normal' ? 1000 : 200);
        }
    }
    
    checkWinnerForPlayer(player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col; if (this.board[index] !== player) continue;
                for (let [dx, dy] of directions) {
                    let count = 1; let x = col + dx; let y = row + dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (this.board[y * 6 + x] === player) { count++; x += dx; y += dy; } else break;
                    }
                    x = col - dx; y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (this.board[y * 6 + x] === player) { count++; x -= dx; y -= dy; } else break;
                    }
                    if (count >= 4) return true;
                }
            }
        }
        return false;
    }
    
    async checkAndRemoveThreesWithChainGravity() { await this.processChainGravity(0); }
    
    async processChainGravity(chainCount) {
        if (chainCount >= 10) return;
        const hasRemovals = await this.checkAndRemoveThrees();
        if (hasRemovals) {
            return new Promise(resolve => {
                setTimeout(async () => {
                    try {
                        await this.fillEmptySpacesWithDirection(this.lastGravityDirection);
                        const oWins = this.checkWinnerForPlayer('o'); const xWins = this.checkWinnerForPlayer('x');
                        if (oWins && xWins) { this.hideLoadingIndicator(); this.endGame(true); resolve(); return; }
                        else if (oWins) { this.endGame(false, '〇が勝ちました！', true); resolve(); return; }
                        else if (xWins) { this.endGame(false, '✕が勝ちました！', true); resolve(); return; }
                        await new Promise(resolveInner => setTimeout(() => { this.processChainGravity(chainCount + 1).then(resolveInner); }, this.animationSpeed === 'normal' ? 500 : 100));
                    } catch (e) { console.error(e); } finally { resolve(); }
                }, this.animationSpeed === 'normal' ? 300 : 50);
            });
        }
    }
    
    async fillEmptySpacesWithDirection(direction) {
        const currentBoard = [...this.board]; const newBoard = Array(36).fill('');
        if (direction === 'up') {
            for (let col = 0; col < 6; col++) {
                let w = col; for (let row = 0; row < 6; row++) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w += 6; }
                }
            }
        } else if (direction === 'down') {
            for (let col = 0; col < 6; col++) {
                let w = 30 + col; for (let row = 5; row >= 0; row--) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w -= 6; }
                }
            }
        } else if (direction === 'left') {
            for (let row = 0; row < 6; row++) {
                let w = row * 6; for (let col = 0; col < 6; col++) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w++; }
                }
            }
        } else if (direction === 'right') {
            for (let row = 0; row < 6; row++) {
                let w = row * 6 + 5; for (let col = 5; col >= 0; col--) {
                    const r = row * 6 + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w--; }
                }
            }
        }
        this.board = newBoard; this.updateBoardDisplay();
    }
    
    updateCell(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = this.currentPlayer === 'o' ? '〇' : '✕'; cell.classList.add(this.currentPlayer);
        cell.style.transform = 'scale(0.8)'; setTimeout(() => { cell.style.transform = 'scale(1)'; }, 100);
    }
    
    checkWinner() {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col; if (this.board[index] === '') continue;
                const player = this.board[index];
                for (let [dx, dy] of directions) {
                    let count = 1; let x = col + dx; let y = row + dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (this.board[y * 6 + x] === player) { count++; x += dx; y += dy; } else break;
                    }
                    x = col - dx; y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (this.board[y * 6 + x] === player) { count++; x -= dx; y -= dy; } else break;
                    }
                    if (count >= 4) return true;
                }
            }
        }
        return false;
    }
    
    async removeCells(indices) {
        indices.forEach(index => { this.board[index] = ''; });
        return new Promise(resolve => {
            indices.forEach(index => {
                const cell = document.querySelector(`[data-index="${index}"]`); if (cell) cell.classList.add('removing');
            });
            setTimeout(() => {
                indices.forEach(index => {
                    const cell = document.querySelector(`[data-index="${index}"]`);
                    if (cell) { cell.textContent = ''; cell.classList.remove('o', 'x', 'removing', 'highlight-for-removal'); cell.style.background = ''; cell.style.boxShadow = ''; }
                });
                this.updateBoardDisplay(); resolve();
            }, this.animationSpeed === 'normal' ? 600 : 100);
        });
    }

    checkDraw() { return this.board.every(cell => cell !== ''); }
    switchPlayer() { this.currentPlayer = this.currentPlayer === 'o' ? 'x' : 'o'; }
    updateStatus() { document.getElementById('status').textContent = `${this.currentPlayer === 'o' ? '〇' : '✕'}の番です`; }
    updateGravityButton() { document.getElementById('gravity-btn').disabled = this.gravityUsed[this.currentPlayer]; }
    
    endGame(isDraw = false, customMessage = '', showImmediately = false) {
        this.gameActive = false;
        if (isDraw) this.showWinnerModal(customMessage || '引き分けです！');
        else {
            const winner = this.currentPlayer === 'o' ? '〇' : '✕'; this.highlightWinningLine();
            if (showImmediately || this.animationSpeed === 'fast') { this.hideLoadingIndicator(); this.showWinnerModal(customMessage || `${winner}が勝ちました！`); }
            else setTimeout(() => { this.showWinnerModal(customMessage || `${winner}が勝ちました！`); }, 500);
        }
    }
    
    showWinnerModal(message) { 
        document.getElementById('winner-text').textContent = message; 
        document.getElementById('winner-modal').style.display = 'flex'; 
    }
    hideWinnerModal() { 
        document.getElementById('winner-modal').style.display = 'none'; 
    }
    
    highlightWinningLine() {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col; if (this.board[index] === '') continue;
                const player = this.board[index];
                for (let [dx, dy] of directions) {
                    let count = 1; let positions = [index]; let x = col + dx; let y = row + dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (this.board[y * 6 + x] === player) { count++; positions.push(y * 6 + x); x += dx; y += dy; } else break;
                    }
                    x = col - dx; y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (this.board[y * 6 + x] === player) { count++; positions.push(y * 6 + x); x -= dx; y -= dy; } else break;
                    }
                    if (count >= 4) {
                        positions.forEach(pos => {
                            const cell = document.querySelector(`[data-index="${pos}"]`);
                            if (cell) {
                                cell.style.background = 'linear-gradient(145deg, #ff6b9d, #c44569)'; cell.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.8)';
                                cell.style.border = '3px solid #c44569'; cell.style.transform = 'scale(1.05)'; cell.classList.add('winning-cell');
                            }
                        });
                        return;
                    }
                }
            }
        }
    }
    
    resetGame() {
        this.board = Array(36).fill(''); this.gameActive = true; this.gravityUsed = { o: false, x: false }; this.lastGravityDirection = null;
        this.currentPlayer = this.isCpuMode ? (this.initialStartingPlayer || 'o') : 'o';
        this.historyStack = []; 
        this.clearBoard(); this.updateStatus(); this.updateGravityButton(); this.hideWinnerModal();
        document.getElementById('gravity-directions').style.display = 'none';
        this.scanAndRenderDangerZones(); 
        this.updateUndoButtonState();
    }
    
    playAgain() {
        this.resetGame();
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer && this.gameActive) {
            setTimeout(() => this.makeCpuMove(), this.animationSpeed === 'normal' ? 500 : 100);
        }
    }
    
    clearBoard() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = ''; cell.classList.remove('o', 'x', 'removing', 'moving', 'winning-cell', 'danger-warning', 'preview-o', 'preview-x', 'danger-border');
            cell.style.background = ''; cell.style.boxShadow = ''; cell.style.border = ''; cell.style.transform = '';
        });
    }

    checkWinnerForSimulatedBoard(board, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col; if (board[index] !== player) continue;
                for (let [dx, dy] of directions) {
                    let count = 1; let x = col + dx; let y = row + dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (board[y * 6 + x] === player) { count++; x += dx; y += dy; } else break;
                    }
                    x = col - dx; y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        if (board[y * 6 + x] === player) { count++; x -= dx; y -= dy; } else break;
                    }
                    if (count >= 4) return true;
                }
            }
        }
        return false;
    }
    
    findDefensiveGravityMove() {
        const directions = ['up', 'down', 'left', 'right'];
        for (const dir of directions) {
            const simulatedBoard = this.simulateGravity(dir); let isSafe = true;
            for (let i = 0; i < 36; i++) {
                if (simulatedBoard[i] === '') {
                    simulatedBoard[i] = this.humanPlayer;
                    if (this.checkWinnerForSimulatedBoard(simulatedBoard, this.humanPlayer)) isSafe = false;
                    simulatedBoard[i] = '';
                }
            }
            if (isSafe) return dir;
        }
        return directions[Math.floor(Math.random() * directions.length)];
    }
    
    async checkAndRemoveThrees() {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const cellsToRemove = new Set();
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col; if (this.board[index] === '') continue;
                for (let [dx, dy] of directions) {
                    let count = 1; let positions = [index]; let x = col + dx; let y = row + dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index] && this.board[index] !== '') { count++; positions.push(nextIndex); x += dx; y += dy; } else break;
                    }
                    let negCount = 0; let negPositions = []; x = col - dx; y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index] && this.board[index] !== '') { negCount++; negPositions.push(nextIndex); x -= dx; y -= dy; } else break;
                    }
                    if (count + negCount === 3) [...positions, ...negPositions].forEach(pos => cellsToRemove.add(pos));
                }
            }
        }
        
        if (cellsToRemove.size > 0) {
            cellsToRemove.forEach(index => {
                const cell = document.querySelector(`[data-index="${index}"]`); if (cell) cell.classList.add('highlight-for-removal');
            });
            await this.sleep(this.animationSpeed === 'normal' ? 500 : 50); await this.removeCells(Array.from(cellsToRemove));
            return true;
        }
        return false;
    }

    showLoadingIndicator() { document.getElementById('loading-indicator').style.display = 'flex'; }
    hideLoadingIndicator() { document.getElementById('loading-indicator').style.display = 'none'; }

    findMoveToBlockOpponentGravityWin() {
        if (this.gravityUsed[this.humanPlayer]) return -1;
        const emptyCells = []; for (let i = 0; i < 36; i++) { if (this.board[i] === '') emptyCells.push(i); }
        for (const blockMove of emptyCells) {
            this.board[blockMove] = this.cpuPlayer; let canBlockAllGravityWins = true;
            for (const direction of ['up', 'down', 'left', 'right']) {
                if (this.checkWinnerForSimulatedBoard(this.simulateGravity(direction), this.humanPlayer)) canBlockAllGravityWins = false;
            }
            this.board[blockMove] = ''; if (canBlockAllGravityWins) return blockMove;
        }
        return -1;
    }
}

document.addEventListener('DOMContentLoaded', () => { new TicTacToe(); });