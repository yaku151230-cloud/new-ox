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
        
        this.selectedCpuOrder = 'human'; 
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
        this.isAnimating = false;
        
        this.lastHumanMove = null; 
        
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
        document.getElementById('board-7x7-btn').addEventListener('click', () => this.setBoardSizeSetting(7));
        
        document.getElementById('match-1-btn').addEventListener('click', () => this.setMatchTargetSetting(1));
        document.getElementById('match-2-btn').addEventListener('click', () => this.setMatchTargetSetting(2));
        document.getElementById('match-3-btn').addEventListener('click', () => this.setMatchTargetSetting(3));
        
        document.getElementById('game-start-final-btn').addEventListener('click', () => this.processFinalStart());
        
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
        document.getElementById('guide-off-btn').classList.add('active'); // 初期値
        document.getElementById('guide-off-btn').addEventListener('click', () => this.setGuideMode(false));
        
        document.getElementById('help-modal').addEventListener('click', (e) => { if (e.target.id === 'help-modal') this.hideHelpModal(); });
        document.getElementById('settings-modal').addEventListener('click', (e) => { if (e.target.id === 'settings-modal') this.hideSettingsModal(); });
        
        document.getElementById('gravity-btn').addEventListener('click', () => {
            if (this.isAnimating || this.gravityUsed[this.currentPlayer]) return;
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
            setupTitle.textContent = "CPUと対戦";
            cpuOptionsArea.style.display = 'block';
            p2OptionsArea.style.display = 'none';
            this.setCpuOrderSetting(this.selectedCpuOrder); 
        } else {
            setupTitle.textContent = "友達と対戦";
            cpuOptionsArea.style.display = 'none';
            p2OptionsArea.style.display = 'block';
        }
    }

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
        this.isAnimating = false; 

        if (mode === 'p2') {
            this.isCpuMode = false; 
            this.initialStartingPlayer = 'o';
            document.getElementById('match-scoreboard').style.display = 'flex';
            document.getElementById('match-target-text').textContent = `（${this.targetWins}本先取）`;
            this.updateScoreboardDisplay();
        } else {
            this.isCpuMode = true; 
            document.getElementById('match-scoreboard').style.display = 'none';
            this.targetWins = 1; 
            if (mode === 'random') mode = Math.random() < 0.5 ? 'human' : 'cpu';
            if (mode === 'cpu') {
                this.cpuPlayer = 'x'; this.humanPlayer = 'o';
                this.initialStartingPlayer = 'x';
            } else {
                this.cpuPlayer = 'x'; this.humanPlayer = 'o';
                this.initialStartingPlayer = 'o';
            }
        }
        
        this.resetGame();
        this.currentPlayer = this.initialStartingPlayer; 
        this.updateStatus();
        this.updateGravityButton();
        this.updateUndoButtonState();
        
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer && this.gameActive) {
            setTimeout(() => this.makeCpuMove(), 500);
        }
    }

    updateScoreboardDisplay() {
        const oDisp = document.getElementById('score-o-display');
        const xDisp = document.getElementById('score-x-display');
        if (oDisp && xDisp) {
            oDisp.textContent = this.scores.o;
            xDisp.textContent = this.scores.x;
        }
    }

    resetMatchScoresAndGame() {
        if (this.isAnimating) return; 
        this.scores = { o: 0, x: 0 };
        this.isMatchOver = false;
        this.updateScoreboardDisplay();
        this.resetGame();
    }

    saveSnapshotToHistory() {
        const snapshot = { 
            board: Array.from(this.board), 
            currentPlayer: this.currentPlayer, 
            gravityUsed: Object.assign({}, this.gravityUsed), 
            lastGravityDirection: this.lastGravityDirection 
        };
        this.historyStack.push(snapshot);
        this.updateUndoButtonState();
    }

    undoLastMove() {
        if (this.isAnimating || this.historyStack.length === 0 || !this.gameActive) return;
        this.stopGravityPreview();
        
        let undoCount = (this.isCpuMode) ? 2 : 1; 
        if (this.isCpuMode && this.historyStack.length < 2) undoCount = 1;
        for (let i = 0; i < undoCount; i++) {
            if (this.historyStack.length === 0) break;
            const previousState = this.historyStack.pop();
            this.board = Array.from(previousState.board); 
            this.currentPlayer = previousState.currentPlayer; 
            this.gravityUsed = Object.assign({}, previousState.gravityUsed); 
            this.lastGravityDirection = previousState.lastGravityDirection;
        }
        this.renderActualFrame(); this.updateStatus(); this.updateGravityButton(); this.updateUndoButtonState(); this.scanAndRenderDangerZones(); 
        document.getElementById('gravity-directions').style.display = 'none';
        
        this.lastHumanMove = null;
    }

    updateUndoButtonState() { 
        document.getElementById('undo-btn').disabled = (this.historyStack.length === 0 || this.isAnimating); 
    }
    
    showMainScreen() { this.hideWinnerModal(); document.getElementById('game-screen').style.display = 'none'; document.getElementById('cpu-selection-screen').style.display = 'none'; document.getElementById('main-screen').style.display = 'flex'; this.gameActive = false; this.isAnimating = false; }
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
        if (!this.gameActive || !this.isGuideMode || this.isAnimating) { document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('danger-border')); return; }
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return; 
        for (let i = 0; i < this.maxCells; i++) {
            const targetCell = document.querySelector(`[data-index="${i}"]`); if (!targetCell) continue;
            if (this.board[i] === '') {
                const isDanger = this.wouldPlayerLosePiecesOnBoard(this.board, i, this.currentPlayer);
                if (isDanger) targetCell.classList.add('danger-border'); else targetCell.classList.remove('danger-border');
            } else { targetCell.classList.remove('danger-border'); }
        }
    }

    handleDirectionTouchStart(e) {
        if (!this.gameActive || !this.isGuideMode || this.isAnimating) return; if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return; e.preventDefault(); 
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
        if (!this.gameActive || !this.isGuideMode || this.isAnimating) return; if (this.previewInterval) clearInterval(this.previewInterval); const simulatedBoard = this.simulateGravity(direction); this.previewState = 'future'; this.renderPreviewFrame(simulatedBoard);
        this.previewInterval = setInterval(() => { if (this.previewState === 'future') { this.previewState = 'actual'; this.renderActualFrame(); } else { this.previewState = 'future'; this.renderPreviewFrame(simulatedBoard); } }, 1000);
    }

    stopGravityPreview() { if (this.previewInterval) { clearInterval(this.previewInterval); this.previewInterval = null; } this.renderActualFrame(); this.scanAndRenderDangerZones(); }
    renderPreviewFrame(simulatedBoard) { const cells = document.querySelectorAll('.cell'); cells.forEach((cell, index) => { const value = simulatedBoard[index]; if (value !== '') { if (value === 'o') { cell.className = 'cell preview-o'; cell.textContent = '〇'; } else { cell.className = 'cell preview-x'; cell.textContent = '✕'; } } else { cell.className = 'cell'; cell.textContent = ''; } }); }
    renderActualFrame() { const cells = document.querySelectorAll('.cell'); cells.forEach((cell, index) => { const actualValue = this.board[index]; if (actualValue !== '') { cell.className = `cell ${actualValue}`; cell.textContent = actualValue === 'o' ? '〇' : '✕'; } else { cell.className = 'cell'; cell.textContent = ''; } }); }
    
    async handleCellClick(e) {
        if (!this.gameActive || this.isAnimating) return; if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return;
        const cell = e.target; const index = parseInt(cell.dataset.index); if (this.board[index] !== '') return;
        
        if (this.isCpuMode) {
            this.lastHumanMove = index;
        }

        this.isAnimating = true; 
        this.saveSnapshotToHistory(); 
        await this.makeMove(index);
        
        if (this.gameActive) { 
            this.switchPlayer(); 
            this.updateStatus(); 
            this.isAnimating = false; 
            this.updateGravityButton(); 
            this.updateUndoButtonState();
            this.scanAndRenderDangerZones(); 
            if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) setTimeout(() => this.makeCpuMove(), 500); 
        } else {
            this.isAnimating = false;
            this.updateGravityButton();
            this.updateUndoButtonState();
        }
    }
    
    // ==========================================
    // CPU 思考ロジック（完全体Minimax搭載）
    // ==========================================
    
    async makeCpuMove() {
        if (!this.gameActive || this.currentPlayer !== this.cpuPlayer || this.isAnimating) return; 
        
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('danger-border'));
        this.isAnimating = true; 
        this.saveSnapshotToHistory(); 
        
        const move = this.getCpuMove(); 
        
        if (typeof move === 'string' && move.startsWith('gravity-')) {
            let dir = move.replace('gravity-', '');
            this.isAnimating = false; 
            await this.useGravity(dir);
            return;
        }
        
        if (move !== -1 && typeof move === 'number') { 
            await this.makeMove(move); 
            
            if (this.gameActive) { 
                this.switchPlayer(); 
                this.updateStatus(); 
                this.isAnimating = false; 
                this.updateGravityButton(); 
                this.updateUndoButtonState();
                this.scanAndRenderDangerZones(); 
            } else {
                this.isAnimating = false;
                this.updateGravityButton();
                this.updateUndoButtonState();
            }
        } else {
            this.isAnimating = false;
            this.updateGravityButton();
            this.updateUndoButtonState();
        }
    }
    
    // 盤面にある勝ち筋（通常手+重力）の数を数える関数（フォーク検知用）
    countWinningMoves(board, player) {
        let winCount = 0;
        for (let i = 0; i < this.maxCells; i++) {
            if (board[i] === '') {
                if (this.wouldPlayerLosePiecesOnBoard(board, i, player)) continue;
                let tb = [...board]; tb[i] = player;
                if (this.checkWinnerForSimulatedBoard(tb, player)) winCount++;
            }
        }
        if (!this.gravityUsed[player]) {
            for (let dir of ['up', 'down', 'left', 'right']) {
                let tb = this.simulateGravityAndChainBoardSync(board, dir);
                if (this.checkWinnerForSimulatedBoard(tb, player)) winCount++;
            }
        }
        return winCount;
    }

    // 相手がどう防御しても、自分の勝ち筋が1つ以上残るか（完全な詰み判定）
    isForcedWinHard(boardAfterCpu, cpuPlayer, humanPlayer) {
        // 相手の通常防衛をすべてシミュレーション
        for (let j = 0; j < this.maxCells; j++) {
            if (boardAfterCpu[j] === '') {
                if (this.wouldPlayerLosePiecesOnBoard(boardAfterCpu, j, humanPlayer)) continue;
                let hb = [...boardAfterCpu]; hb[j] = humanPlayer;
                if (this.checkWinnerForSimulatedBoard(hb, humanPlayer)) return false; // 相手に逆に勝たれるなら詰み失敗
                if (this.countWinningMoves(hb, cpuPlayer) === 0) return false; // 全て防がれたら詰み失敗
            }
        }
        // 相手の重力防衛をすべてシミュレーション
        if (!this.gravityUsed[humanPlayer]) {
            for (let dir of ['up', 'down', 'left', 'right']) {
                let hbg = this.simulateGravityAndChainBoardSync(boardAfterCpu, dir);
                if (this.checkWinnerForSimulatedBoard(hbg, humanPlayer)) return false;
                if (this.countWinningMoves(hbg, cpuPlayer) === 0) return false;
            }
        }
        return true; // 相手のすべての手に対して、自分に勝ち筋が残る！
    }

    getCpuMove() {
        let emptyCells = [];
        for(let i=0; i<this.maxCells; i++) { if(this.board[i] === '') emptyCells.push(i); }
        if(emptyCells.length === 0) return -1;
        
        // 1. 自分が1手で勝てるマス
        for(let i of emptyCells) {
            let tb = [...this.board]; tb[i] = this.cpuPlayer;
            if(this.checkWinnerForSimulatedBoard(tb, this.cpuPlayer) && !this.wouldPlayerLosePiecesOnBoard(tb, i, this.cpuPlayer)) return i;
        }

        // 2. 重力を使って1手で勝てる方向
        if(!this.gravityUsed[this.cpuPlayer]) {
            for(let dir of ['up', 'down', 'left', 'right']) {
                if(this.checkWinnerForSimulatedBoard(this.simulateGravityOnBoard(this.board, dir), this.cpuPlayer)) return 'gravity-' + dir;
            }
        }

        // 3. 連鎖重力勝利（ハードのみ）
        if(this.difficulty === 'hard' && !this.gravityUsed[this.cpuPlayer]) {
            for(let dir of ['up', 'down', 'left', 'right']) {
                let tb = this.simulateGravityAndChainBoardSync(this.board, dir);
                if(this.checkWinnerForSimulatedBoard(tb, this.cpuPlayer)) return 'gravity-' + dir;
            }
        }

        // --- ★ 超強化：3.5 自分が「詰み（必勝）」にできる手があれば打つ ---
        if(this.difficulty === 'hard') {
            for(let i of emptyCells) {
                let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
                if(this.wouldPlayerLosePiecesOnBoard(myTb, i, this.cpuPlayer)) continue;
                
                // 軽いチェック：自分がそこに打ったら勝ち筋が2つ以上（フォーク）できるか？
                if(this.countWinningMoves(myTb, this.cpuPlayer) >= 2) {
                    // フォークできるなら、相手が重力等で絶対に防ぎきれないか厳密チェック
                    if(this.isForcedWinHard(myTb, this.cpuPlayer, this.humanPlayer)) {
                        return i;
                    }
                }
            }
        }

        // 4. 相手の通常リーチ阻止（自爆時は重力で破壊を試みる）
        for(let i of emptyCells) {
            let tb = [...this.board]; tb[i] = this.humanPlayer;
            if(this.checkWinnerForSimulatedBoard(tb, this.humanPlayer)) {
                let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
                
                if(!this.wouldPlayerLosePiecesOnBoard(myTb, i, this.cpuPlayer)) {
                    return i;
                } else {
                    if ((this.difficulty === 'normal' || this.difficulty === 'hard') && !this.gravityUsed[this.cpuPlayer]) {
                        for (let dir of ['up', 'down', 'left', 'right']) {
                            let simFunc = this.difficulty === 'hard' ? this.simulateGravityAndChainBoardSync.bind(this) : this.simulateGravityOnBoard.bind(this);
                            let boardAfterGrav = simFunc(this.board, dir);
                            if (!this.checkWinnerForSimulatedBoard(boardAfterGrav, this.humanPlayer)) {
                                return 'gravity-' + dir;
                            }
                        }
                    }
                }
            }
        }

        // 5. 相手の重力リーチ阻止
        if(!this.gravityUsed[this.humanPlayer]) {
            for(let dir of ['up', 'down', 'left', 'right']) {
                let hg = this.simulateGravityOnBoard(this.board, dir);
                if(this.checkWinnerForSimulatedBoard(hg, this.humanPlayer)) {
                    for(let i of emptyCells) {
                        let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
                        if(!this.wouldPlayerLosePiecesOnBoard(myTb, i, this.cpuPlayer)) {
                            let afterG = this.simulateGravityOnBoard(myTb, dir);
                            if(!this.checkWinnerForSimulatedBoard(afterG, this.humanPlayer)) return i;
                        }
                    }
                }
            }
        }

        // --- ★ 超強化：5.5 相手の「詰み（必勝）」を事前に潰す ---
        if(this.difficulty === 'hard') {
            for(let i of emptyCells) {
                let hTb = [...this.board]; hTb[i] = this.humanPlayer;
                if(this.wouldPlayerLosePiecesOnBoard(hTb, i, this.humanPlayer)) continue;
                
                // 相手がここに打つとフォークが完成するか？
                if(this.countWinningMoves(hTb, this.humanPlayer) >= 2) {
                    // 相手のフォークが完成した場合、こちらがどう足掻いても負けるか？
                    if(this.isForcedWinHard(hTb, this.humanPlayer, this.cpuPlayer)) {
                        // 相手の必勝手を潰す（先手で自分がそこに置く）
                        let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
                        if(!this.wouldPlayerLosePiecesOnBoard(myTb, i, this.cpuPlayer)) {
                            return i;
                        } else if (!this.gravityUsed[this.cpuPlayer]) {
                            // 自爆するなら重力で盤面を破壊して防ぐ
                            for (let dir of ['up', 'down', 'left', 'right']) {
                                let simFunc = this.simulateGravityAndChainBoardSync.bind(this);
                                let boardAfterGrav = simFunc(this.board, dir);
                                if (!this.checkWinnerForSimulatedBoard(boardAfterGrav, this.humanPlayer)) {
                                    return 'gravity-' + dir;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 6. 安全マスの絞り込み（難易度別の先読みシミュレーション）
        let safeCells = [];
        if(this.difficulty === 'easy') {
            safeCells = emptyCells.filter(i => !this.wouldPlayerLosePiecesOnBoard([...this.board], i, this.cpuPlayer));
        } else {
            let turnCount = this.maxCells - emptyCells.length;
            for(let i of emptyCells) {
                let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
                if(this.wouldPlayerLosePiecesOnBoard(myTb, i, this.cpuPlayer)) continue; 
                
                let humanCanWin = false;
                for(let j of emptyCells) {
                    if(i === j) continue;
                    let hTb = [...myTb]; hTb[j] = this.humanPlayer;
                    if(this.checkWinnerForSimulatedBoard(hTb, this.humanPlayer)) { humanCanWin = true; break; }
                }
                if(!humanCanWin && !this.gravityUsed[this.humanPlayer]) {
                    for(let dir of ['up', 'down', 'left', 'right']) {
                        let simFunc = this.difficulty === 'hard' ? this.simulateGravityAndChainBoardSync.bind(this) : this.simulateGravityOnBoard.bind(this);
                        if(this.checkWinnerForSimulatedBoard(simFunc(myTb, dir), this.humanPlayer)) { humanCanWin = true; break; }
                    }
                }
                if(humanCanWin) continue; 

                if(this.difficulty === 'hard') {
                    if (turnCount >= 12) {
                        if(!this.isSafeMoveHard(myTb, this.cpuPlayer, this.humanPlayer)) continue;
                    } else {
                        if(!this.isSafeMoveHardEarly(myTb, this.cpuPlayer, this.humanPlayer)) continue;
                    }
                }

                safeCells.push(i);
            }
        }

        if(safeCells.length === 0) {
            safeCells = emptyCells.filter(i => !this.wouldPlayerLosePiecesOnBoard([...this.board], i, this.cpuPlayer));
        }
        if(safeCells.length === 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }

        // 7 & 8. 攻めの布石（多段リーチと重力罠の探索）
        let moveMultiReach = -1;
        let moveGravityTrap = -1;

        for(let i of safeCells) {
            let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
            let winRoutes = 0;
            for(let j=0; j<this.maxCells; j++) {
                if(myTb[j] === '') {
                    let tb2 = [...myTb]; tb2[j] = this.cpuPlayer;
                    if(this.checkWinnerForSimulatedBoard(tb2, this.cpuPlayer) && !this.wouldPlayerLosePiecesOnBoard(tb2, j, this.cpuPlayer)) winRoutes++;
                }
            }
            if(winRoutes >= 2) { moveMultiReach = i; break; }
        }

        if(!this.gravityUsed[this.cpuPlayer]) {
            for(let i of safeCells) {
                let myTb = [...this.board]; myTb[i] = this.cpuPlayer;
                let canWin = false;
                for(let dir of ['up', 'down', 'left', 'right']) {
                    let simFunc = this.difficulty === 'hard' ? this.simulateGravityAndChainBoardSync.bind(this) : this.simulateGravityOnBoard.bind(this);
                    if(this.checkWinnerForSimulatedBoard(simFunc(myTb, dir), this.cpuPlayer)) { canWin = true; break; }
                }
                if(canWin) { moveGravityTrap = i; break; }
            }
        }

        if (this.difficulty === 'hard') {
            if (moveGravityTrap !== -1) return moveGravityTrap;
            if (moveMultiReach !== -1) return moveMultiReach;
        } else {
            if (moveMultiReach !== -1) return moveMultiReach;
            if (moveGravityTrap !== -1) return moveGravityTrap;
        }

        // 9. フォールバック配置
        return this.getFallbackMove(safeCells, this.difficulty);
    }
    
    isSafeMoveHardEarly(boardAfterCpu, cpuPlayer, humanPlayer) {
        let directions = ['up', 'down', 'left', 'right'];
        for (let j = 0; j < this.maxCells; j++) {
            if (boardAfterCpu[j] === '') {
                if (this.wouldPlayerLosePiecesOnBoard(boardAfterCpu, j, humanPlayer)) continue;
                let hb = [...boardAfterCpu]; hb[j] = humanPlayer;
                
                let threats = 0; 
                
                for(let k=0; k<this.maxCells; k++) {
                    if(hb[k] === '') {
                        let hbk = [...hb]; hbk[k] = humanPlayer;
                        if(this.checkWinnerForSimulatedBoard(hbk, humanPlayer)) {
                            threats++;
                            if(threats >= 2) break; 
                        }
                    }
                }
                if(threats < 2 && !this.gravityUsed[humanPlayer]) {
                    for(let dir of directions) {
                        let hbg = this.simulateGravityAndChainBoardSync(hb, dir);
                        if(this.checkWinnerForSimulatedBoard(hbg, humanPlayer)) {
                            threats++;
                            if(threats >= 2) break;
                        }
                    }
                }
                if (threats >= 2) return false; 
            }
        }
        return true;
    }

    isSafeMoveHard(boardAfterCpu1, cpuPlayer, humanPlayer) {
        let directions = ['up', 'down', 'left', 'right'];
        for (let j = 0; j < this.maxCells; j++) {
            if (boardAfterCpu1[j] === '') {
                if (this.wouldPlayerLosePiecesOnBoard(boardAfterCpu1, j, humanPlayer)) continue; 
                let boardAfterHuman1 = [...boardAfterCpu1];
                boardAfterHuman1[j] = humanPlayer;
                if (this.checkWinnerForSimulatedBoard(boardAfterHuman1, humanPlayer)) return false;
                if (!this.canCpuSurvive(boardAfterHuman1, cpuPlayer, humanPlayer)) return false;
            }
        }
        if (!this.gravityUsed[humanPlayer]) {
            for (let dir of directions) {
                let boardAfterHumanGrav = this.simulateGravityAndChainBoardSync(boardAfterCpu1, dir);
                if (this.checkWinnerForSimulatedBoard(boardAfterHumanGrav, humanPlayer)) return false;
                if (!this.canCpuSurvive(boardAfterHumanGrav, cpuPlayer, humanPlayer)) return false;
            }
        }
        return true;
    }

    canCpuSurvive(board, cpuPlayer, humanPlayer) {
        let directions = ['up', 'down', 'left', 'right'];
        for (let i = 0; i < this.maxCells; i++) {
            if (board[i] === '') {
                if (this.wouldPlayerLosePiecesOnBoard(board, i, cpuPlayer)) continue;
                let testBoard = [...board]; testBoard[i] = cpuPlayer;
                
                let humanCanWin = false;
                for(let j=0; j<this.maxCells; j++) {
                    if(testBoard[j] === '') {
                        let hb = [...testBoard]; hb[j] = humanPlayer;
                        if(this.checkWinnerForSimulatedBoard(hb, humanPlayer)) { humanCanWin = true; break; }
                    }
                }
                if(!humanCanWin && !this.gravityUsed[humanPlayer]) {
                    for(let dir of directions) {
                         let hbg = this.simulateGravityAndChainBoardSync(testBoard, dir);
                         if(this.checkWinnerForSimulatedBoard(hbg, humanPlayer)) { humanCanWin = true; break; }
                    }
                }
                if(!humanCanWin) return true; 
            }
        }
        if(!this.gravityUsed[cpuPlayer]) {
            for(let dir of directions) {
                let testBoard = this.simulateGravityAndChainBoardSync(board, dir);
                if(this.checkWinnerForSimulatedBoard(testBoard, cpuPlayer)) return true; 
            }
        }
        return false;
    }

    getFallbackMove(safeCells, difficulty) {
        if (difficulty === 'hard') {
            return this.getHardScoredMove(safeCells);
        }

        let turnCount = this.board.filter(c => c !== '').length;
        let centralCells = this.getCentralCells();
        
        if (turnCount <= 1) { 
            let availableCentral = centralCells.filter(i => safeCells.includes(i));
            if (availableCentral.length > 0) return availableCentral[Math.floor(Math.random() * availableCentral.length)];
        }
        
        if (this.lastHumanMove !== null) {
            let adj = this.getAdjacentCells(this.lastHumanMove);
            let availableAdj = adj.filter(i => safeCells.includes(i));
            if (availableAdj.length > 0) {
                if (difficulty === 'easy') {
                    return availableAdj[Math.floor(Math.random() * availableAdj.length)];
                } else {
                    let bestScore = -1; let bestMoves = [];
                    for (let i of availableAdj) {
                        let score = 0;
                        if (this.checkLineExtension(i, this.cpuPlayer)) score += 2;
                        if (this.checkLineExtension(i, this.humanPlayer)) score += 1;
                        if (score > bestScore) { bestScore = score; bestMoves = [i]; } 
                        else if (score === bestScore) { bestMoves.push(i); }
                    }
                    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
                }
            }
        }
        return safeCells[Math.floor(Math.random() * safeCells.length)];
    }

    getHardScoredMove(safeCells) {
        let bestScore = -Infinity;
        let bestMoves = [];
        for (let i of safeCells) {
            let score = this.evaluateHardMoveScore(i);
            if (score > bestScore) { bestScore = score; bestMoves = [i]; }
            else if (score === bestScore) { bestMoves.push(i); }
        }
        if (bestMoves.length > 0) return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        return safeCells[Math.floor(Math.random() * safeCells.length)];
    }

    evaluateHardMoveScore(index) {
        let score = 0;
        let size = this.boardSize;
        let row = Math.floor(index / size);
        let col = index % size;
        let directions = [[1,0],[0,1],[1,1],[1,-1]];

        let centerR = size / 2 - 0.5;
        let dist = Math.max(Math.abs(row - centerR), Math.abs(col - centerR));
        score += (10 - dist * 2);

        for (let [dx, dy] of directions) {
            let r1 = row+dy, c1 = col+dx;
            let r2 = row-dy, c2 = col-dx;
            let val1 = (r1>=0&&r1<size&&c1>=0&&c1<size) ? this.board[r1*size+c1] : 'wall';
            let val2 = (r2>=0&&r2<size&&c2>=0&&c2<size) ? this.board[r2*size+c2] : 'wall';
            
            if (val1 === this.cpuPlayer) score += 5; 
            if (val2 === this.cpuPlayer) score += 5;
            if (val1 === this.humanPlayer) score += 4; 
            if (val2 === this.humanPlayer) score += 4;
            
            if (val1 === this.cpuPlayer && val2 === '') score += 3;
            if (val2 === this.cpuPlayer && val1 === '') score += 3;
        }
        
        if (this.lastHumanMove !== null) {
            let hRow = Math.floor(this.lastHumanMove / size);
            let hCol = this.lastHumanMove % size;
            let hDist = Math.max(Math.abs(row - hRow), Math.abs(col - hCol));
            if (hDist <= 1) score += 4; 
        }
        return score;
    }

    checkLineExtension(index, player) {
        let directions = [[1,0],[0,1],[1,1],[1,-1]];
        let size = this.boardSize; let row = Math.floor(index / size); let col = index % size;
        for (let [dx, dy] of directions) {
            let x1 = col + dx, y1 = row + dy; let x2 = col - dx, y2 = row - dy;
            let hasPlayer = false;
            if (x1 >= 0 && x1 < size && y1 >= 0 && y1 < size && this.board[y1 * size + x1] === player) hasPlayer = true;
            if (x2 >= 0 && x2 < size && y2 >= 0 && y2 < size && this.board[y2 * size + x2] === player) hasPlayer = true;
            if(hasPlayer) return true;
        }
        return false;
    }

    getCentralCells() {
        let cells = []; let size = this.boardSize;
        let start = size === 6 ? 1 : 2; let end = size === 6 ? 4 : 4;
        for (let r = start; r <= end; r++) { for (let c = start; c <= end; c++) { cells.push(r * size + c); } }
        return cells;
    }

    getAdjacentCells(index) {
        let cells = []; let size = this.boardSize;
        let row = Math.floor(index / size); let col = index % size;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                let r = row + dy, c = col + dx;
                if (r >= 0 && r < size && c >= 0 && c < size) { cells.push(r * size + c); }
            }
        }
        return cells;
    }

    // ==========================================
    // 基本システム・判定処理
    // ==========================================

    wouldPlayerLosePiecesOnBoard(targetBoard, moveIndex, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const size = this.boardSize; const row = Math.floor(moveIndex / size); const col = moveIndex % size;
        for (let [dx, dy] of directions) {
            let count = 1; let x = col + dx; let y = row + dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (targetBoard[y * size + x] === player) { count++; x += dx; y += dy; } else break; }
            x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (targetBoard[y * size + x] === player) { count++; x -= dx; y -= dy; } else break; }
            if (count === 3) return true;
        }
        return false;
    }
    
    simulateGravity(direction) { return this.simulateGravityOnBoard(this.board, direction); }

    simulateGravityOnBoard(targetBoard, direction) {
        const size = this.boardSize; const newBoard = Array(this.maxCells).fill('');
        if (direction === 'up') { for (let col = 0; col < size; col++) { let w = col; for (let row = 0; row < size; row++) { const r = row * size + col; if (targetBoard[r] !== '') { newBoard[w] = targetBoard[r]; w += size; } } } } 
        else if (direction === 'down') { for (let col = 0; col < size; col++) { let w = (size * (size - 1)) + col; for (let row = (size - 1); row >= 0; row--) { const r = row * size + col; if (targetBoard[r] !== '') { newBoard[w] = targetBoard[r]; w -= size; } } } } 
        else if (direction === 'left') { for (let row = 0; row < size; row++) { let w = row * size; for (let col = 0; col < size; col++) { const r = row * size + col; if (targetBoard[r] !== '') { newBoard[w] = targetBoard[r]; w++; } } } } 
        else if (direction === 'right') { for (let row = 0; row < size; row++) { let w = row * size + (size - 1); for (let col = (size - 1); col >= 0; col--) { const r = row * size + col; if (targetBoard[r] !== '') { newBoard[w] = targetBoard[r]; w--; } } } }
        return newBoard;
    }

    simulateGravityAndChainBoardSync(initialBoard, direction) {
        let board = [...initialBoard]; let changed = true; let loopCount = 0;
        board = this.simulateGravityOnBoard(board, direction);
        while(changed && loopCount < 10) {
            changed = false; loopCount++;
            let toRemove = this.getThreesToRemoveSync(board);
            if(toRemove.size > 0) {
                changed = true;
                for(let i of toRemove) board[i] = '';
                board = this.simulateGravityOnBoard(board, direction); 
            }
        }
        return board;
    }

    getThreesToRemoveSync(board) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const cellsToRemove = new Set(); const size = this.boardSize;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const index = row * size + col; if (board[index] === '') continue;
                for (let [dx, dy] of directions) {
                    let count = 1; let positions = [index]; let x = col + dx; let y = row + dy; 
                    while (x >= 0 && x < size && y >= 0 && y < size) { const nextIndex = y * size + x; if (board[nextIndex] === board[index] && board[index] !== '') { count++; positions.push(nextIndex); x += dx; y += dy; } else break; }
                    let negCount = 0; let negPositions = []; x = col - dx; y = row - dy; 
                    while (x >= 0 && x < size && y >= 0 && y < size) { const nextIndex = y * size + x; if (board[nextIndex] === board[index] && board[index] !== '') { negCount++; negPositions.push(nextIndex); x -= dx; y -= dy; } else break; }
                    if (count + negCount === 3) [...positions, ...negPositions].forEach(pos => cellsToRemove.add(pos));
                }
            }
        }
        return cellsToRemove;
    }
    
    isNearPlayer(index, player) { const size = this.boardSize; const row = Math.floor(index / size); const col = index % size; const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]; for (let [dy, dx] of directions) { const newRow = row + dy; const newCol = col + dx; if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) { if (this.board[newRow * size + newCol] === player) return true; } } return false; }
    
    async makeMove(index) { 
        this.board[index] = this.currentPlayer; 
        this.updateCell(index); 
        if (this.checkWinner()) { this.endGame(); return; } 
        await this.checkAndRemoveThrees(); 
        if (this.checkDraw()) { this.endGame(true); return; } 
    }

    async useGravity(direction) { 
        if (this.gravityUsed[this.currentPlayer]) return; 
        
        this.isAnimating = true; 
        this.saveSnapshotToHistory(); 
        this.gravityUsed[this.currentPlayer] = true; 
        this.lastGravityDirection = direction; 
        document.getElementById('gravity-directions').style.display = 'none'; 
        this.stopGravityPreview(); 
        await this.sleep(300); 
        await this.applyGravity(direction); 
    }
    
    async applyGravity(direction) {
        this.showLoadingIndicator(); const size = this.boardSize; const currentBoard = [...this.board]; const newBoard = Array(this.maxCells).fill(''); const moves = [];
        if (direction === 'up') { for (let col = 0; col < size; col++) { let w = col; for (let row = 0; row < size; row++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w += size; } } } } 
        else if (direction === 'down') { for (let col = 0; col < size; col++) { let w = (size * (size - 1)) + col; for (let row = (size - 1); row >= 0; row--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w -= size; } } } } 
        else if (direction === 'left') { for (let row = 0; row < size; row++) { let w = row * size; for (let col = 0; col < size; col++) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w++; } } } } 
        else if (direction === 'right') { for (let row = 0; row < size; row++) { let w = row * size + (size - 1); for (let col = (size - 1); col >= 0; col--) { const r = row * size + col; if (currentBoard[r] !== '') { newBoard[w] = currentBoard[r]; if (r !== w) moves.push({ from: r, to: w, value: currentBoard[r] }); w--; } } } }
        this.board = newBoard; if (moves.length > 0) await this.animateGravityMoves(moves); else this.updateBoardDisplay(); await this.afterGravityCheck();
    }
    
    async animateGravityMoves(moves) { if (moves.length === 0) return; const maxDistance = Math.min(this.boardSize, Math.max(...moves.map(move => Math.abs(move.to - move.from)))); for (let step = 1; step <= maxDistance; step++) { await this.animateAllMovesOneStep(moves, step); if (step < maxDistance) await this.sleep(120); } this.updateBoardDisplay(); }
    async animateAllMovesOneStep(moves, step) { return new Promise((resolve) => { const cellsToUpdate = new Set(); moves.forEach(move => { const distance = Math.abs(move.to - move.from); if (step <= distance) { const c = this.calculateCurrentPosition(move, step); const p = this.calculateCurrentPosition(move, step - 1); if (c !== p) cellsToUpdate.add({ from: p, to: c, value: move.value }); } }); cellsToUpdate.forEach(update => { const fromCell = document.querySelector(`[data-index="${update.from}"]`); const toCell = document.querySelector(`[data-index="${update.to}"]`); if (fromCell && toCell) { fromCell.textContent = ''; fromCell.classList.remove('o', 'x'); toCell.textContent = update.value === 'o' ? '〇' : '✕'; toCell.classList.add(update.value, 'moving'); } }); setTimeout(() => { cellsToUpdate.forEach(update => { const toCell = document.querySelector(`[data-index="${update.to}"]`); if (toCell) toCell.classList.remove('moving'); }); resolve(); }, 100); }); }
    calculateCurrentPosition(move, step) { const direction = this.lastGravityDirection; const size = this.boardSize; const fromRow = Math.floor(move.from / size); const fromCol = move.from % size; const toRow = Math.floor(move.to / size); const toCol = move.to % size; let currentRow, currentCol; if (direction === 'up') { currentRow = fromRow - Math.min(step, fromRow - toRow); currentCol = fromCol; } else if (direction === 'down') { currentRow = fromRow + Math.min(step, toRow - fromRow); currentCol = fromCol; } else if (direction === 'left') { currentRow = fromRow; currentCol = fromCol - Math.min(step, fromCol - toCol); } else if (direction === 'right') { currentRow = fromRow; currentCol = fromCol + Math.min(step, toCol - fromCol); } return currentRow * size + currentCol; }
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    async updateBoardDisplay() { const cells = document.querySelectorAll('.cell'); const animationPromises = []; cells.forEach((cell, index) => { const value = this.board[index]; if (value !== '') { cell.textContent = value === 'o' ? '〇' : '✕'; cell.className = `cell ${value} moving`; animationPromises.push(new Promise(resolve => { setTimeout(() => { cell.classList.remove('moving'); resolve(); }, 400); })); } else { cell.textContent = ''; cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = ''; cell.style.border = ''; cell.style.transform = ''; } }); if (animationPromises.length > 0) await Promise.all(animationPromises); }
    
    async afterGravityCheck() { 
        const oWins = this.checkWinnerForPlayer('o'); 
        const xWins = this.checkWinnerForPlayer('x'); 
        
        if (oWins && xWins) { 
            this.hideLoadingIndicator(); this.endGame(true); this.isAnimating = false; this.updateGravityButton(); this.updateUndoButtonState(); return; 
        } else if (oWins) { 
            this.endGame(false, '〇がこの試合を制しました！', true); this.isAnimating = false; this.updateGravityButton(); this.updateUndoButtonState(); return; 
        } else if (xWins) { 
            this.endGame(false, '✕がこの試合を制しました！', true); this.isAnimating = false; this.updateGravityButton(); this.updateUndoButtonState(); return; 
        } 
        
        await this.checkAndRemoveThreesWithChainGravity(); 
        this.hideLoadingIndicator(); 
        
        if (this.gameActive) { 
            setTimeout(() => { 
                this.switchPlayer(); this.updateStatus(); this.isAnimating = false; this.updateGravityButton(); this.updateUndoButtonState(); this.scanAndRenderDangerZones(); 
                if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) setTimeout(() => this.makeCpuMove(), 500); 
            }, 1000); 
        } else {
            this.isAnimating = false; this.updateGravityButton(); this.updateUndoButtonState();
        }
    }
    
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
    
    checkWinner() { return this.checkWinnerForSimulatedBoard(this.board, this.currentPlayer); }
    async removeCells(indices) { indices.forEach(index => { this.board[index] = ''; }); return new Promise(resolve => { indices.forEach(index => { const cell = document.querySelector(`[data-index="${index}"]`); if (cell) cell.classList.add('removing'); }); setTimeout(() => { indices.forEach(index => { const cell = document.querySelector(`[data-index="${index}"]`); if (cell) { cell.textContent = ''; cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = ''; } }); this.updateBoardDisplay(); resolve(); }, 600); }); }
    checkDraw() { return this.board.every(cell => cell !== ''); }
    switchPlayer() { this.currentPlayer = this.currentPlayer === 'o' ? 'x' : 'o'; }
    updateStatus() { document.getElementById('status').textContent = `${this.currentPlayer === 'o' ? '〇' : '✕'}の番です`; }
    updateGravityButton() { document.getElementById('gravity-btn').disabled = (this.gravityUsed[this.currentPlayer] || this.isAnimating); }
    
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
    
    resetGame() { this.board = Array(this.maxCells).fill(''); this.gameActive = true; this.gravityUsed = { o: false, x: false }; this.lastGravityDirection = null; this.currentPlayer = this.initialStartingPlayer || 'o'; this.historyStack = []; this.lastHumanMove = null; this.clearBoard(); this.updateStatus(); this.isAnimating = false; this.updateGravityButton(); this.hideWinnerModal(); document.getElementById('gravity-directions').style.display = 'none'; this.scanAndRenderDangerZones(); this.updateUndoButtonState(); }
    playAgain() { if (this.isMatchOver) { this.resetMatchScoresAndGame(); } else { this.resetGame(); this.currentPlayer = this.initialStartingPlayer; this.updateStatus(); this.updateGravityButton(); this.updateUndoButtonState(); } if (this.isCpuMode && this.currentPlayer === this.cpuPlayer && this.gameActive) { setTimeout(() => this.makeCpuMove(), 500); } }
    clearBoard() { document.querySelectorAll('.cell').forEach(cell => { cell.textContent = ''; cell.className = 'cell'; cell.style.background = ''; cell.style.boxShadow = ''; cell.style.border = ''; cell.style.transform = ''; }); }
    
    checkWinnerForPlayer(player) { return this.checkWinnerForSimulatedBoard(this.board, player); }
    
    checkWinnerForSimulatedBoard(board, player) { 
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; const size = this.boardSize; 
        for (let row = 0; row < size; row++) { 
            for (let col = 0; col < size; col++) { 
                const index = row * size + col; if (index >= board.length || board[index] !== player) continue; 
                for (let [dx, dy] of directions) { 
                    let count = 1; let x = col + dx; let y = row + dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (board[y * size + x] === player) { count++; x += dx; y += dy; } else break; } 
                    x = col - dx; y = row - dy; while (x >= 0 && x < size && y >= 0 && y < size) { if (board[y * size + x] === player) { count++; x -= dx; y -= dy; } else break; } 
                    if (count >= 4) return true; 
                } 
            } 
        } 
        return false; 
    }
    
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