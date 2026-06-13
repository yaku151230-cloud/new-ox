class TicTacToe {
    constructor() {
        this.boardSize = 6; 
        this.maxCells = 36;
        
        this.board = Array(36).fill('');
        this.currentPlayer = 'o';
        this.gameActive = true;
        this.gravityUsed = { o: false, x: false };
        this.lastGravityDirection = null; 
        
        this.isCpuMode = false;
        this.cpuPlayer = 'x'; 
        this.humanPlayer = 'o'; 
        this.initialStartingPlayer = 'o';
        
        // 🏆 CPU戦用の内部選択状態（確定ボタンを押すまでこれを保持）
        this.selectedCpuOrder = 'human'; // 'human', 'cpu', 'random'
        
        this.targetWins = 1;      
        this.scores = { o: 0, x: 0 }; 
        this.isMatchOver = false;  
        
        this.currentTheme = 'default';
        this.difficulty = 'easy';
        this.isGuideMode = true; 
        
        this.previewInterval = null;
        this.previewState = 'actual'; 
        this.activeHoldDirection = null; 
        
        this.historyStack = [];
        
        this.initializeGame();
    }

    initializeGame() {
        this.bindEvents();
        this.updateStatus();
        this.updateGravityButton();
        this.hideWinnerModal(); 
    }
    
    bindEvents() {
        document.getElementById('play-2p-btn').addEventListener('click', () => this.showSetupScreen(false));
        document.getElementById('play-cpu-btn').addEventListener('click', () => this.showSetupScreen(true));
        
        document.getElementById('board-6x6-btn').addEventListener('click', () => this.setBoardSizeSetting(6));
        document.getElementById('board-7x7-btn').classList.toggle('active', false);
        document.getElementById('board-7x7-btn').addEventListener('click', () => this.setBoardSizeSetting(7));
        
        document.getElementById('match-1-btn').addEventListener('click', () => this.setMatchTargetSetting(1));
        document.getElementById('match-2-btn').addEventListener('click', () => this.setMatchTargetSetting(2));
        document.getElementById('match-3-btn').addEventListener('click', () => this.setMatchTargetSetting(3));
        
        // 🏆 共通の最終確定スタートボタンイベント
        document.getElementById('game-start-final-btn').addEventListener('click', () => this.processFinalStart());
        
        // 🏆 CPUの先手・後手・ランダムのトグル選択（即開始せず、クラスの付け替えのみ）
        document.getElementById('cpu-first-btn').addEventListener('click', () => this.setCpuOrderSetting('human'));
        document.getElementById('cpu-second-btn').addEventListener('click', () => this.setCpuOrderSetting('cpu'));
        document.getElementById('cpu-random-btn').addEventListener('click', () => this.setCpuOrderSetting('random'));
        
        document.getElementById('back-to-main-from-cpu-btn').addEventListener('click', () => this.showMainScreen());
        
        document.getElementById('diff-easy-btn').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('diff-normal-btn').addEventListener('click', () => this.setDifficulty('normal'));
        document.getElementById('diff-hard-btn').addEventListener('click', () => this.setDifficulty('hard'));
        
        const backToMainFromGameBtn = document.getElementById('back-to-main-from-game-btn');
        if (backToMainFromGameBtn) {
            backToMainFromGameBtn.addEventListener('click', () => this.showMainScreen());
        }
        
        document.getElementById('help-btn').addEventListener('click', () => this.showHelpModal());
        document.getElementById('help-btn-game').addEventListener('click', () => this.showHelpModal());
        document.getElementById('close-help-btn').addEventListener('click', () => this.hideHelpModal());
        
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('settings-btn-game').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('close-settings-btn').addEventListener('click', () => this.hideSettingsModal());
        
        document.getElementById('theme-default-btn').addEventListener('click', () => this.setTheme('default'));
        document.getElementById('theme-dark-btn').addEventListener('click', () => this.setTheme('dark'));
        document.getElementById('guide-on-btn').addEventListener('click', () => this.setGuideMode(true));
        document.getElementById('guide-off-btn').addEventListener('click', () => this.setGuideMode(false));
        
        document.getElementById('help-modal').addEventListener('click', (e) => { if (e.target.id === 'help-modal') this.hideHelpModal(); });
        document.getElementById('settings-modal').addEventListener('click', (e) => { if (e.target.id === 'settings-modal') this.hideSettingsModal(); });
        
        document.getElementById('gravity-btn').addEventListener('click', () => {
            if (this.gravityUsed[this.currentPlayer]) return;
            const directions = document.getElementById('gravity-directions');
            if (directions.style.display === 'flex') { directions.style.display = 'none'; this.stopGravityPreview(); } 
            else { directions.style.display = 'flex'; }
        });
        
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => this.handleDirectionTouchStart(e), { passive: false });
            btn.addEventListener('touchend', (e) => this.handleDirectionTouchEnd(e), { passive: false });
            btn.addEventListener('touchmove', (e) => this.handleDirectionTouchMove(e), { passive: false });
            
            btn.addEventListener('mouseenter', (e) => { if (window.matchMedia('(hover: hover)').matches) this.startGravityPreview(e.target.dataset.direction); });
            btn.addEventListener('mouseleave', () => { if (window.matchMedia('(hover: hover)').matches) this.stopGravityPreview(); });
            btn.addEventListener('click', (e) => { if (window.matchMedia('(hover: hover)').matches) this.useGravity(e.target.dataset.direction); });
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => this.undoLastMove());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetMatchScoresAndGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('back-to-main-btn').addEventListener('click', () => { this.hideWinnerModal(); this.showMainScreen(); });
    }

    setBoardSizeSetting(size) {
        this.boardSize = size;
        this.maxCells = size * size;
        document.getElementById('board-6x6-btn').classList.toggle('active', size === 6);
        document.getElementById('board-7x7-btn').classList.toggle('active', size === 7);
    }

    setMatchTargetSetting(wins) {
        this.targetWins = wins;
        document.getElementById('match-1-btn').classList.toggle('active', wins === 1);
        document.getElementById('match-2-btn').classList.toggle('active', wins === 2);
        document.getElementById('match-3-btn').classList.toggle('active', wins === 3);
    }

    // 🏆 CPU戦用の先手手番のトグル選択表示同期
    setCpuOrderSetting(order) {
        this.selectedCpuOrder = order;
        document.getElementById('cpu-first-btn').classList.toggle('active', order === 'human');
        document.getElementById('cpu-second-btn').classList.toggle('active', order === 'cpu');
        document.getElementById('cpu-random-btn').classList.toggle('active', order === 'random');
    }

    showSetupScreen(isCpu) {
        this.isCpuMode = isCpu;
        this.hideWinnerModal();
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('cpu-selection-screen').style.display = 'flex';
        
        const cpuOptionsArea = document.getElementById('cpu-only-setup-options');
        const p2OptionsArea = document.getElementById('p2-only-setup-options');
        const setupTitle = document.getElementById('setup-screen-title');

        if (isCpu) {
            setupTitle.textContent = "CPU対戦モード設定";
            cpuOptionsArea.style.display = 'block';
            p2OptionsArea.style.display = 'none';
            this.setCpuOrderSetting(this.selectedCpuOrder); // 現在の選択状態にクラスを付与
        } else {
            setupTitle.textContent = "友達と対戦モード設定";
            cpuOptionsArea.style.display = 'none';
            p2OptionsArea.style.display = 'block';
        }
    }

    // 🏆 一番下の確定ボタンが押された時の共通処理ハブ
    processFinalStart() {
        if (this.isCpuMode) {
            this.startSelectedGame(this.selectedCpuOrder);
        } else {
            this.startSelectedGame('p2');
        }
    }

    startSelectedGame(mode) {
        document.getElementById('cpu-selection-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        
        const boardContainer = document.getElementById('game-board');
        boardContainer.innerHTML = '';
        boardContainer.className = `game-board size-${this.boardSize}x${this.boardSize}`;
        
        for (let i = 0; i < this.maxCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', (e) => this.handleCellClick(e));
            boardContainer.appendChild(cell);
        }

        this.scores = { o: 0, x: 0 };
        this.isMatchOver = false;

        if (mode === 'p2') {
            this.currentPlayer = 'o';
            this.initialStartingPlayer = 'o';
            document.getElementById('match-scoreboard').style.display = 'flex';
            document.getElementById('match-target-text').textContent = `（${this.targetWins}本先取）`;
            this.updateScoreboardDisplay();
        } else {
            document.getElementById('match-scoreboard').style.display = 'none';
            this.targetWins = 1; 
            if (mode === 'random') mode = Math.random() < 0.5 ? 'human' : 'cpu';
            if (mode === 'cpu') {
                this.currentPlayer = 'x'; this.cpuPlayer = 'x'; this.humanPlayer = 'o';
                this.initialStartingPlayer = 'x';
            } else {
                this.currentPlayer = 'o'; this.cpuPlayer = 'x'; this.humanPlayer = 'o';
                this.initialStartingPlayer = 'o';
            }
        }
        
        this.resetGame();
        this.updateStatus();
        
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer && this.gameActive) {
            setTimeout(() => this.makeCpuMove(), 500);
        }
    }

    updateScoreboardDisplay() {
        document.getElementById('score-o-display').textContent = this.scores.o;
        document.getElementById('score-x-display').textContent = this.scores.x;
    }

    resetMatchScoresAndGame() {
        this.scores = { o: 0, x: 0 };
        this.isMatchOver = false;
        this.updateScoreboardDisplay();
        this.resetGame();
    }

    saveSnapshotToHistory() {
        const snapshot = { board: [...this.board], currentPlayer: this.currentPlayer, gravityUsed: { ...this.gravityUsed }, lastGravityDirection: this.lastGravityDirection };
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
            this.board = previousState.board; this.currentPlayer = previousState.currentPlayer; this.gravityUsed = previousState.gravityUsed; this.lastGravityDirection = previousState.lastGravityDirection;
        }
        this.renderActualFrame(); this.updateStatus(); this.updateGravityButton(); this.updateUndoButtonState(); this.scanAndRenderDangerZones(); 
        document.getElementById('gravity-directions').style.display = 'none';
    }

    updateUndoButtonState() { document.getElementById('undo-btn').disabled = (this.historyStack.length === 0); }
    showMainScreen() { this.hideWinnerModal(); document.getElementById('game-screen').style.display = 'none'; document.getElementById('cpu-selection-screen').style.display = 'none'; document.getElementById('main-screen').style.display = 'flex'; this.gameActive = false; }
    showHelpModal() { document.getElementById('help-modal').style.display = 'flex'; }
    hideHelpModal() { document.getElementById('help-modal').style.display = 'none'; }
    showSettingsModal() { document.getElementById('settings-modal').style.display = 'flex'; }
    hideSettingsModal() { document.getElementById('settings-modal').style.display = 'none'; }
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.getElementById('theme-default-btn').classList.toggle('active', theme === 'default');
        document.getElementById('theme-dark-btn').classList.toggle('active', theme === 'dark');
        document.body.classList.toggle('dark-theme', theme === 'dark');
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        document.getElementById('diff-easy-btn').classList.toggle('active', difficulty === 'easy');
        document.getElementById('diff-normal-btn').classList.toggle('active', difficulty === 'normal');
        document.getElementById('diff-hard-btn').classList.toggle('active', difficulty === 'hard');
    }

    setGuideMode(isOn) { this.isGuideMode = isOn; document.getElementById('guide-on-btn').classList.toggle('active', isOn); document.getElementById('guide-off-btn').classList.toggle('active', !isOn); this.stopGravityPreview(); this.scanAndRenderDangerZones(); }

    scanAndRenderDangerZones() {
        if (!this.gameActive || !this.isGuideMode) { document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('danger-border')); return; }
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return; 
        for (let i = 0; i < this.maxCells; i++) {
            const targetCell = document.querySelector(`[data-index="${i}"]`); if (!targetCell) continue;
            if (this.board[i] === '') {
                this.board[i] = this.currentPlayer; const isDanger = this.wouldCpuLosePieces(i); this.board[i] = '';
                if (isDanger) targetCell.classList.add('danger-border'); else targetCell.classList.remove('danger-border');
            } else { targetCell.classList.remove('danger-border'); }
        }
    }

    handleDirectionTouchStart(e) {
        if (!this.gameActive || !this.isGuideMode) return; if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return; e.preventDefault(); 
        const btn = e.target.closest('.direction-btn'); const direction = btn.dataset.direction; this.activeHoldDirection = direction; btn.classList.add('preview-active'); this.startGravityPreview(direction);
    }

    handleDirectionTouchEnd(e) {
        if (!this.activeHoldDirection) return; e.preventDefault(); const dir = this.activeHoldDirection; const btn = document.querySelector(`.direction-btn[data-direction="${dir}"]`); if (btn) btn.classList.remove('preview-active'); this.activeHoldDirection = null; this.stopGravityPreview();
        const touch = e.changedTouches[0]; const targetElement = document.elementFromPoint(touch.clientX, touch.clientY); if (targetElement && targetElement.closest(`.direction-btn[data-direction="${dir}"]`)) this.useGravity(dir);
    }

    handleDirectionTouchMove(e) {
        if (!this.activeHoldDirection) return; e.preventDefault(); const dir = this.activeHoldDirection; const touch = e.touches[0]; const targetElement = document.elementFromPoint(touch.clientX, touch.clientY); const btn = document.querySelector(`.direction-btn[data-direction="${dir}"]`);
        if (!targetElement || !targetElement.closest(`.direction-btn[data-direction="${dir}"]`)) { if (btn) btn.classList.remove('preview-active'); this.stopGravityPreview(); } 
        else { if (btn && !btn.classList.contains('preview-active')) { btn.classList.add('preview-active'); this.startGravityPreview(dir); } }
    }

    startGravityPreview(direction) {
        if (!this.gameActive || !this.isGuideMode) return; if (this.previewInterval) clearInterval(this.previewInterval); const simulatedBoard = this.simulateGravity(direction); this.previewState = 'future'; this.renderPreviewFrame(simulatedBoard);
        this.previewInterval = setInterval(() => { if (this.previewState === 'future') { this.previewState = 'actual'; this.renderActualFrame(); } else { this.previewState = 'future'; this.renderPreviewFrame(simulatedBoard); } }, 1000);
    }

    stopGravityPreview() { if (this.previewInterval) { clearInterval(this.previewInterval); this.previewInterval = null; } this.renderActualFrame(); this.scanAndRenderDangerZones(); }
    renderPreviewFrame(simulatedBoard) { const cells = document.querySelectorAll('.cell'); cells.forEach((cell, index) => { const value = simulatedBoard[index]; if (value !== '') { if (value === 'o') { cell.className = 'cell preview-o'; cell.textContent = '〇'; } else { cell.className = 'cell preview-x'; cell.textContent = '✕'; } } else { cell.className = 'cell'; cell.textContent = ''; } }); }
    renderActualFrame() { const cells = document.querySelectorAll('.cell'); cells.forEach((cell, index) => { const actualValue = this.board[index]; if (actualValue !== '') { cell.className = `cell ${actualValue}`; cell.textContent = actualValue === 'o' ? '〇' : '✕'; } else { cell.className = 'cell'; cell.textContent = ''; } }); }
    
    async handleCellClick(e) {
        if (!this.gameActive) return; if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return;
        const cell = e.target; const index = parseInt(cell.dataset.index); if (this.board[index] !== '') return;
        this.saveSnapshotToHistory(); await this.makeMove(index);
        if (this.gameActive) { this.switchPlayer(); this.updateStatus(); this.updateGravityButton(); this.scanAndRenderDangerZones(); if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) setTimeout(() => this.makeCpuMove(), 500); }
    }
    
    async makeCpuMove() {
        if (!this.gameActive || this.currentPlayer !== this.cpuPlayer) return; const cells = document.querySelectorAll('.cell'); cells.forEach(cell => cell.classList.remove('danger-border'));
        this.saveSnapshotToHistory(); const move = this.getCpuMove(); if (move === 'gravity') return;
        else if (move !== -1) { await this.makeMove(move); if (this.gameActive) { setTimeout(() => { this.switchPlayer(); this.updateStatus(); this.updateGravityButton(); this.scanAndRenderDangerZones(); }, 500); } }
    }
    
    getCpuMove() {
        for (let i = 0; i < this.maxCells; i++) { if (this.board[i] === '') { this.board[i] = this.cpuPlayer; const isWin = this.checkWinnerForPlayer(this.cpuPlayer); const isErased = this.wouldCpuLosePieces(i); this.board[i] = ''; if (isWin) { if (this.difficulty === 'easy' || !isErased) return i; } } }
        if (this.difficulty !== 'easy' && !this.gravityUsed[this.cpuPlayer]) { for (const dir of ['up', 'down', 'left', 'right']) { if (this.checkWinnerForSimulatedBoard(this.simulateGravity(dir), this.cpuPlayer)) { this.useGravity(dir); return 'gravity'; } } }
        let opponentReachIndex = -1;
        for (let i = 0; i < this.maxCells; i++) { if (this.board[i] === '') { this.board[i] = this.humanPlayer; const oppWin = this.checkWinnerForPlayer(this.humanPlayer); this.board[i] = ''; if (oppWin) { opponentReachIndex = i; break; } } }
        if (opponentReachIndex !== -1) {
            this.board[opponentReachIndex] = this.cpuPlayer; const willSelfDestruct = this.wouldCpuLosePieces(opponentReachIndex); this.board[opponentReachIndex] = '';
            if (!willSelfDestruct) return opponentReachIndex;
            else { if (this.difficulty !== 'easy' && !this.gravityUsed[this.cpuPlayer]) { const defensiveDir = this.findDefensiveGravityMove(); if (defensiveDir) { this.useGravity(defensiveDir); return 'gravity'; } } return opponentReachIndex; }
        }
        const emptyCells = []; for (let i = 0; i < this.maxCells; i++) { if (this.board[i] === '') emptyCells.push(i); }
        let finalCandidateCells = [...emptyCells];
        if (this.difficulty === 'hard') {
            const safeCells = [];
            for (const moveIndex of emptyCells) {
                this.board[moveIndex] = this.cpuPlayer; if (this.wouldCpuLosePieces(moveIndex)) { this.board[moveIndex] = ''; continue; }
                let isDangerous = false; if (!this.gravityUsed[this.humanPlayer]) { for (const dir of ['up', 'down', 'left', 'right']) { if (this.checkWinnerForSimulatedBoard(this.simulateGravity(dir), this.humanPlayer)) isDangerous = true; } }
                for (let h = 0; h < this.maxCells; h++) { if (this.board[h] === '') { this.board[h] = this.humanPlayer; if (this.checkWinnerForPlayer(this.humanPlayer)) isDangerous = true; this.board[h] = ''; } }
                this.board[moveIndex] = ''; if (!isDangerous) safeCells.push(moveIndex);
            }
            if (safeCells.length > 0) finalCandidateCells = safeCells;
        }
        if (this.difficulty !== 'easy') {
            for (const i of finalCandidateCells) { this.board[i] = this.cpuPlayer; let success = false; for (const d of ['up', 'down', 'left', 'right']) { if (this.checkWinnerForSimulatedBoard(this.simulateGravity(d), this.cpuPlayer)) success = true; } this.board[i] = ''; if (success) return i; }
            for (const i of finalCandidateCells) { this.board[i] = this.cpuPlayer; let patterns = 0; for (let n = 0; n < this.maxCells; n++) { if (this.board[n] === '') { this.board[n] = this.cpuPlayer; if (this.checkWinnerForPlayer(this.cpuPlayer) && !this.wouldCpuLosePieces(n)) patterns++; this.board[n] = ''; } } this.board[i] = ''; if (patterns >= 2) return i; }
        }
        const centralMyStrategic = []; const centralOpponentStrategic = []; const myStrategic = []; const opponentStrategic = []; const centralCells = []; const size = this.boardSize;
        for (const i of finalCandidateCells) {
            if (this.difficulty === 'hard' && this.wouldCpuLosePieces(i)) continue;
            const isNearMe = this.isNearPlayer(i, this.cpuPlayer); const isNearOpponent = this.isNearPlayer(i, this.humanPlayer); const row = Math.floor(i / size); const col = i % size; const isCentral = (row >= 1 && row <= (size-2) && col >= 1 && col <= (size-2));
            if (isCentral) { centralCells.push(i); if (isNearMe) centralMyStrategic.push(i); if (isNearOpponent) centralOpponentStrategic.push(i); }
            if (isNearMe) myStrategic.push(i); else if (isNearOpponent) opponentStrategic.push(i);
        }
        if (centralMyStrategic.length > 0) return centralMyStrategic[Math.floor(Math.random() * centralMyStrategic.length)]; if (centralOpponentStrategic.length > 0) return centralOpponentStrategic[Math.floor(Math.random() * centralOpponentStrategic.length)]; if (myStrategic.length > 0) return myStrategic[Math.floor(Math.random() * myStrategic.length)]; if (opponentStrategic.length > 0) return opponentStrategic[Math.floor(Math.random() * opponentStrategic.length)]; if (centralCells.length > 0) return centralCells[Math.floor(Math.random() * centralCells.length)]; if (finalCandidateCells.length > 0) return finalCandidateCells[Math.floor(Math.random() * finalCandidateCells.length)]; return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    wouldCpuLosePieces(moveIndex) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const size = this.boardSize; const row = Math.floor(moveIndex / size); const col = moveIndex % size; const targetPlayer = this.board[moveIndex]; if (targetPlayer === '') return false;
        for (let [dx, dy] of directions) {
            let count = 1; let x = col + dx; let y = row + dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (this.board[y * size + x] === targetPlayer) { count++; x += dx; y += dy; } else break; }
            x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (this.board[y * size + x] === targetPlayer) { count++; x -= dx; y -= dy; } else break; }
            if (count === 3) return true;
        }
        return false;
    }
    
    simulateGravity(direction) {
        const size = this.boardSize; const currentBoard = [...this.board]; const newBoard = Array(this.maxCells).fill('');
        if (direction === 'up') { for (let col = 0; col < size; col++) { let w = col; for (let row = 0; row < size; row++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w += size; } } } } 
        else if (direction === 'down') { for (let col = 0; col < size; col++) { let w = (size * (size - 1)) + col; for (let row = (size - 1); row >= 0; row--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w -= size; } } } } 
        else if (direction === 'left') { for (let row = 0; row < size; row++) { let w = row * size; for (let col = 0; col < size; col++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w++; } } } } 
        else if (direction === 'right') { for (let row = 0; row < size; row++) { let w = row * size + (size - 1); for (let col = (size - 1); col >= 0; col--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w--; } } } }
        return newBoard;
    }
    
    isNearPlayer(index, player) { const size = this.boardSize; const row = Math.floor(index / size); const col = index % size; const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]; for (let [dy, dx] of directions) { const newRow = row + dy; const newCol = col + dx; if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) { if (this.board[newRow * size + newCol] === player) return true; } } return false; }
    async makeMove(index) { this.board[index] = this.currentPlayer; this.updateCell(index); if (this.checkWinner()) { this.endGame(); return; } await this.checkAndRemoveThrees(); if (this.checkDraw()) { this.endGame(true); return; } }
    async useGravity(direction) { if (this.gravityUsed[this.currentPlayer]) return; this.saveSnapshotToHistory(); this.gravityUsed[this.currentPlayer] = true; this.lastGravityDirection = direction; document.getElementById('gravity-directions').style.display = 'none'; this.stopGravityPreview(); await this.sleep(300); await this.applyGravity(direction); }
    
    async applyGravity(direction) {
        this.showLoadingIndicator(); const size = this.boardSize; const currentBoard = [...this.board]; const newBoard = Array(this.maxCells).fill(''); const moves = [];
        if (direction === 'up') { for (let col = 0; col < size; col++) { let w = col; for (let row = 0; row < size; row++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w += size; } } } } 
        else if (direction === 'down') { for (let col = 0; col < size; col++) { let w = (size * (size - 1)) + col; for (let row = (size - 1); row >= 0; row--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w -= size; } } } } 
        else if (direction === 'left') { for (let row = 0; row < size; row++) { let w = row * size; for (let col = 0; col < size; col++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w++; } } } } 
        else if (direction === 'right') { for (let row = 0; row < size; row++) { let w = row * size + (size - 1); for (let col = (size - 1); col >= 0; col--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w--; } } } }
        this.board = newBoard; if (moves.length > 0) await this.animateGravityMoves(moves); else this.updateBoardDisplay(); await this.afterGravityCheck();
    }
    
    async animateGravityMoves(moves) { if (moves.length === 0) return; const maxDistance = Math.max(...moves.map(move => Math.abs(move.to - move.from))); for (let step = 1; step <= maxDistance; step++) { await this.animateAllMovesOneStep(moves, step); if (step < maxDistance) await this.sleep(120); } this.updateBoardDisplay(); }
    async animateAllMovesOneStep(moves, step) { return new Promise((resolve) => { const cellsToUpdate = new Set(); moves.forEach(move => { const distance = Math.abs(move.to - move.from); if (step <= distance) { const c = this.calculateCurrentPosition(move, step); const p = this.calculateCurrentPosition(move, step - 1); if (c !== p) cellsToUpdate.add({ from: p, to: c, value: move.value }); } }); cellsToUpdate.forEach(update => { const fromCell = document.querySelector(`[data-index="${update.from}"]`); const toCell = document.querySelector(`[data-index="${update.to}"]`); if (fromCell && toCell) { fromCell.textContent = ''; fromCell.classList.remove('o', 'x'); toCell.textContent = update.value === 'o' ? '〇' : '✕'; toCell.classList.add(update.value, 'moving'); } }); setTimeout(() => { cellsToUpdate.forEach(update => { const toCell = document.querySelector(`[data-index="${update.to}"]`); if (toCell) toCell.classList.remove('moving'); }); resolve(); }, 100); }); }
    calculateCurrentPosition(move, step) { const direction = this.lastGravityDirection; const size = this.boardSize; const fromRow = Math.floor(move.from / size); const fromCol = move.from % size; const toRow = Math.floor(move.to / size); const toCol = move.to % size; let currentRow, currentCol; if (direction === 'up') { currentRow = fromRow - Math.min(step, fromRow - toRow); currentCol = fromCol; } else if (direction === 'down') { currentRow = fromRow + Math.min(step, toRow - fromRow); currentCol = fromCol; } else if (direction === 'left') { currentRow = fromRow; currentCol = fromCol - Math.min(step, fromCol - toCol); } else if (direction === 'right') { currentRow = fromRow; currentCol = fromCol + Math.min(step, toCol - fromCol); } return currentRow * size + currentCol; }
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    async updateBoardDisplay() { const cells = document.querySelectorAll('.cell'); const animationPromises = []; cells.forEach((cell, index) => { const value = this.board[index]; if (value !== '') { cell.textContent = value === 'o' ? '〇' : '✕'; cell.className = `cell ${value} moving`; animationPromises.push(new Promise(resolve => { setTimeout(() => { cell.classList.remove('moving'); resolve(); }, 400); })); } else { cell.textContent = ''; cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = ''; cell.style.border = ''; cell.style.transform = ''; } }); if (animationPromises.length > 0) await Promise.all(animationPromises); }
    async afterGravityCheck() { const oWins = this.checkWinnerForPlayer('o'); const xWins = this.checkWinnerForPlayer('x'); if (oWins && xWins) { this.hideLoadingIndicator(); this.endGame(true); return; } else if (oWins) { this.endGame(false, '〇がこの試合を制しました！', true); return; } else if (xWins) { this.endGame(false, '✕がこの試合を制しました！', true); return; } await this.checkAndRemoveThreesWithChainGravity(); this.hideLoadingIndicator(); if (this.gameActive) { setTimeout(() => { this.switchPlayer(); this.updateStatus(); this.updateGravityButton(); this.scanAndRenderDangerZones(); if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) setTimeout(() => this.makeCpuMove(), 500); }, 1000); } }
    async checkAndRemoveThreesWithChainGravity() { await this.processChainGravity(0); }
    async processChainGravity(chainCount) { if (chainCount >= 10) return; const hasRemovals = await this.checkAndRemoveThrees(); if (hasRemovals) { return new Promise(resolve => { setTimeout(async () => { try { await this.fillEmptySpacesWithDirection(this.lastGravityDirection); const oWins = this.checkWinnerForPlayer('o'); const xWins = this.checkWinnerForPlayer('x'); if (oWins && xWins) { this.hideLoadingIndicator(); this.endGame(true); resolve(); return; } else if (oWins) { this.endGame(false, '〇がこの試合を制しました！', true); resolve(); return; } else if (xWins) { this.endGame(false, '✕がこの試合を制しました！', true); resolve(); return; } await new Promise(resolveInner => setTimeout(() => { this.processChainGravity(chainCount + 1).then(resolveInner); }, 500)); } catch (e) { console.error(e); } finally { resolve(); } }, 300); }); } }
    
    async fillEmptySpacesWithDirection(direction) {
        const size = this.boardSize; const currentBoard = [...this.board]; const newBoard = Array(this.maxCells).fill('');
        if (direction === 'up') { for (let col = 0; col < size; col++) { let w = col; for (let row = 0; row < size; row++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w += size; } } } } 
        else if (direction === 'down') { for (let col = 0; col < size; col++) { let w = (size * (size - 1)) + col; for (let row = (size - 1); row >= 0; row--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w -= size; } } } } 
        else if (direction === 'left') { for (let row = 0; row < size; row++) { let w = row * size; for (let col = 0; col < size; col++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w++; } } } } 
        else if (direction === 'right') { for (let row = 0; row < size; row++) { let w = row * size + (size - 1); for (let col = (size - 1); col >= 0; col--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; w--; } } } }
        this.board = newBoard; this.updateBoardDisplay();
    }
    
    updateCell(index) { const cell = document.querySelector(`[data-index="${index}"]`); if (!cell) return; cell.textContent = this.currentPlayer === 'o' ? '〇' : '✕'; cell.classList.add(this.currentPlayer); cell.style.transform = 'scale(0.8)'; setTimeout(() => { cell.style.transform = 'scale(1)'; }, 100); }
    
    checkWinner() {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const size = this.boardSize;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const index = row * size + col; if (this.board[index] === '') continue; const player = this.board[index];
                for (let [dx, dy] of directions) {
                    let count = 1; let x = col + dx; let y = row + dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (this.board[y * size + x] === player) { count++; x += dx; y += dy; } else break; }
                    x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (this.board[y * size + x] === player) { count++; x -= dx; y -= dy; } else break; }
                    if (count >= 4) return true;
                }
            }
        }
        return false;
    }
    
    async removeCells(indices) { indices.forEach(index => { this.board[index] = ''; }); return new Promise(resolve => { indices.forEach(index => { const cell = document.querySelector(`[data-index="${index}"]`); if (cell) cell.classList.add('removing'); }); setTimeout(() => { indices.forEach(index => { const cell = document.querySelector(`[data-index="${index}"]`); if (cell) { cell.textContent = ''; cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = ''; } }); this.updateBoardDisplay(); resolve(); }, 600); }); }
    checkDraw() { return this.board.every(cell => cell !== ''); }
    switchPlayer() { this.currentPlayer = this.currentPlayer === 'o' ? 'x' : 'o'; }
    updateStatus() { document.getElementById('status').textContent = `${this.currentPlayer === 'o' ? '〇' : '✕'}の番です`; }
    updateGravityButton() { document.getElementById('gravity-btn').disabled = this.gravityUsed[this.currentPlayer]; }
    
    endGame(isDraw = false, customMessage = '', showImmediately = false) {
        this.gameActive = false; const modalBtn = document.getElementById('play-again-btn');
        if (isDraw) { modalBtn.textContent = "この試合を再戦"; if (showImmediately) { this.hideLoadingIndicator(); this.showWinnerModal('引き分けです！'); } else { setTimeout(() => { this.showWinnerModal('引き分けです！'); }, 500); } return; }
        const roundWinner = this.currentPlayer; this.highlightWinningLine(); this.scores[roundWinner]++; this.updateScoreboardDisplay();
        if (this.scores[roundWinner] >= this.targetWins) { this.isMatchOver = true; modalBtn.textContent = "もう一度最初から"; const msg = roundWinner === 'o' ? '〇の完全勝利！おめでとう！' : '✕の完全勝利！おめでとう！'; if (showImmediately) { this.hideLoadingIndicator(); this.showWinnerModal(msg); } else { setTimeout(() => { this.showWinnerModal(msg); }, 500); } } 
        else { this.isMatchOver = false; modalBtn.textContent = "次の試合（ラウンド）へ"; const msg = customMessage || (roundWinner === 'o' ? '〇が1勝を獲得！' : '✕が1勝を獲得！'); if (showImmediately) { this.hideLoadingIndicator(); this.showWinnerModal(msg); } else { setTimeout(() => { this.showWinnerModal(msg); }, 500); } }
    }
    
    showWinnerModal(message) { document.getElementById('winner-text').textContent = message; document.getElementById('winner-modal').style.display = 'flex'; }
    hideWinnerModal() { document.getElementById('winner-modal').style.display = 'none'; }
    
    highlightWinningLine() {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const size = this.boardSize;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const index = row * size + col; if (this.board[index] === '') continue; const player = this.board[index];
                for (let [dx, dy] of directions) {
                    let count = 1; let positions = [index]; let x = col + dx; let y = row + dy;
                    while (x >= 0 && x < size && y >= 0 && y < size) { if (this.board[y * size + x] === player) { count++; positions.push(y * size + x); x += dx; y += dy; } else break; }
                    x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (this.board[y * size + x] === player) { count++; positions.push(y * size + x); x -= dx; y -= dy; } else break; }
                    if (count >= 4) { positions.forEach(pos => { const cell = document.querySelector(`[data-index="${pos}"]`); if (cell) { cell.style.background = 'linear-gradient(145deg, #ff6b9d, #c44569)'; cell.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.8)'; cell.style.border = '3px solid #c44569'; cell.style.transform = 'scale(1.05)'; cell.classList.add('winning-cell'); } }); return; }
                }
            }
        }
    }
    
    resetGame() { this.board = Array(this.maxCells).fill(''); this.gameActive = true; this.gravityUsed = { o: false, x: false }; this.lastGravityDirection = null; this.currentPlayer = this.initialStartingPlayer || 'o'; this.historyStack = []; this.clearBoard(); this.updateStatus(); this.updateGravityButton(); this.hideWinnerModal(); document.getElementById('gravity-directions').style.display = 'none'; this.scanAndRenderDangerZones(); this.updateUndoButtonState(); }
    playAgain() { if (this.isMatchOver) { this.resetMatchScoresAndGame(); } else { this.resetGame(); } if (this.isCpuMode && this.currentPlayer === this.cpuPlayer && this.gameActive) { setTimeout(() => this.makeCpuMove(), 500); } }
    clearBoard() { document.querySelectorAll('.cell').forEach(cell => { cell.textContent = ''; cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = ''; cell.style.border = ''; cell.style.transform = ''; }); }
    checkWinnerForSimulatedBoard(board, player) { const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const size = this.boardSize; for (let row = 0; row < size; row++) { for (let col = 0; col < size; col++) { const index = row * size + col; if (index >= board.length || board[index] !== player) continue; for (let [dx, dy] of directions) { let count = 1; let x = col + dx; let y = row + dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (board[y * size + x] === player) { count++; x += dx; y += dy; } else break; } x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (board[y * size + x] === player) { count++; x -= dx; y -= dy; } else break; } if (count >= 4) return true; } } } return false; }
    findDefensiveGravityMove() { const directions = ['up', 'down', 'left', 'right']; for (const dir of directions) { const simulatedBoard = this.simulateGravity(dir); let isSafe = true; for (let i = 0; i < this.maxCells; i++) { if (simulatedBoard[i] === '') { simulatedBoard[i] = this.humanPlayer; if (this.checkWinnerForSimulatedBoard(simulatedBoard, this.humanPlayer)) isSafe = false; simulatedBoard[i] = ''; } } if (isSafe) return dir; } return directions[Math.floor(Math.random() * directions.length)]; }
    
    async checkAndRemoveThrees() {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const cellsToRemove = new Set(); const size = this.boardSize;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const index = row * size + col; if (this.board[index] === '') continue;
                for (let [dx, dy] of directions) {
                    let count = 1; let positions = [index]; let x = col + dx; let y = row + dy; while (x >= 0 && x < size && y >= 0 && y < size) { const nextIndex = y * size + x; if (this.board[nextIndex] === this.board[index] && this.board[index] !== '') { count++; positions.push(nextIndex); x += dx; y += dy; } else break; }
                    let negCount = 0; let negPositions = []; x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { const nextIndex = y * size + x; if (this.board[nextIndex] === this.board[index] && this.board[index] !== '') { negCount++; negPositions.push(nextIndex); x -= dx; y -= dy; } else break; }
                    if (count + negCount === 3) [...positions, ...negPositions].forEach(pos => cellsToRemove.add(pos));
                }
            }
        }
        if (cellsToRemove.size > 0) { cellsToRemove.forEach(index => { const cell = document.querySelector(`[data-index="${index}"]`); if (cell) cell.classList.add('highlight-for-removal'); }); await this.sleep(500); await this.removeCells(Array.from(cellsToRemove)); return true; }
        return false;
    }
    showLoadingIndicator() { document.getElementById('loading-indicator').style.display = 'flex'; }
    hideLoadingIndicator() { document.getElementById('loading-indicator').style.display = 'none'; }
}

document.addEventListener('DOMContentLoaded', () => { new TicTacToe(); });