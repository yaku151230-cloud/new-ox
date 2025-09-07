class TicTacToe {
    constructor() {
        this.board = Array(36).fill('');
        this.currentPlayer = 'o';
        this.gameActive = true;
        this.gravityUsed = { o: false, x: false };
        this.lastGravityDirection = null; // 最後に使った重力の方向を保存
        
        // CPU対戦モード用の変数
        this.isCpuMode = false;
        this.cpuPlayer = 'x'; // CPUは✕として動作
        this.humanPlayer = 'o'; // プレイヤーは〇として動作
        
        this.hideWinnerModal(); // コンストラクタでモーダルを確実に非表示にする
        this.initializeGame();
    }

    initializeGame() {
        this.bindEvents();
        this.updateStatus();
        this.updateGravityButton();
        this.hideWinnerModal(); // ゲーム初期化時にもモーダルを確実に非表示にする
    }
    
    bindEvents() {
        // 画面切り替えのイベント
        document.getElementById('play-2p-btn').addEventListener('click', () => this.showGameScreen());
        document.getElementById('play-cpu-btn').addEventListener('click', () => this.showCpuSelectionScreen());
        // document.getElementById('back-to-main-btn').addEventListener('click', () => this.showMainScreen()); // winner-modalに移動
        
        // CPU選択画面のイベント
        document.getElementById('cpu-first-btn').addEventListener('click', () => this.startCpuGame('human'));
        document.getElementById('cpu-second-btn').addEventListener('click', () => this.startCpuGame('cpu'));
        document.getElementById('cpu-random-btn').addEventListener('click', () => this.startCpuGame('random'));
        document.getElementById('back-to-main-from-cpu-btn').addEventListener('click', () => this.showMainScreen());
        
        // ゲーム画面ヘッダーの「メインに戻る」ボタンのイベント
        const backToMainFromGameBtn = document.getElementById('back-to-main-from-game-btn');
        if (backToMainFromGameBtn) {
            backToMainFromGameBtn.addEventListener('click', () => {
                console.log('ゲーム画面からメインに戻るボタンがクリックされました');
                this.showMainScreen();
            });
        }
        
        // ヘルプモーダルのイベント
        document.getElementById('help-btn').addEventListener('click', () => this.showHelpModal());
        document.getElementById('close-help-btn').addEventListener('click', () => this.hideHelpModal());
        
        // ヘルプモーダルの外側クリックで閉じる
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                this.hideHelpModal();
            }
        });
        
        // セルのクリックイベント
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        
        // 重力ボタンのイベント
        document.getElementById('gravity-btn').addEventListener('click', () => this.showGravityDirections());
        
        // 方向ボタンのイベント
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.useGravity(e.target.dataset.direction));
        });
        
        // ボタンのイベント
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }
        
        // もう一度プレイボタンのイベントリスナーはwinner-modal内で設定
        // const playAgainBtn = document.getElementById('play-again-btn');
        // if (playAgainBtn) {
        //     playAgainBtn.addEventListener('click', () => this.playAgain());
        // }
        
        // モーダルの外側クリックで閉じる (削除)
        // const winnerModal = document.getElementById('winner-modal');
        // if (winnerModal) {
        //     winnerModal.addEventListener('click', (e) => {
        //         // modal-content内でのクリックは無視
        //         if (e.target.closest('.modal-content')) {
        //             return;
        //         }
        //         this.hideWinnerModal(); // モーダル外クリックでモーダルを隠す
        //         // メインに戻るボタンと同様の動作をさせる
        //         this.showMainScreen();
        //     });
        // }
        
        // winner-modalのイベント委譲
        const winnerModal = document.getElementById('winner-modal');
        if (winnerModal) {
            winnerModal.addEventListener('click', (e) => {
                console.log('Winner Modal Click Event - Target:', e.target, 'Target ID:', e.target.id); // 追加
                const playAgainBtn = e.target.closest('#play-again-btn');
                const backToMainBtn = e.target.closest('#back-to-main-btn');

                if (playAgainBtn) {
                    console.log('イベント委譲: もう一度プレイボタンがクリックされました');
                    this.playAgain();
                } else if (backToMainBtn) {
                    console.log('イベント委譲: メインに戻るボタンがクリックされました');
                    this.hideWinnerModal();
                    this.showMainScreen();
                }
            });
        }
    }
    
    // 画面切り替え機能
    showGameScreen() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        this.isCpuMode = false;
        // ゲームをリセットして開始
        this.resetGame();
    }
    
    showCpuSelectionScreen() {
        this.hideWinnerModal(); // モーダルが残っている場合を考慮して非表示にする
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('cpu-selection-screen').style.display = 'flex';
    }
    
    startCpuGame(mode) {
        console.log('=== startCpuGame START ===');
        console.log('startCpuGame called with mode:', mode);
        this.isCpuMode = true;
        document.getElementById('cpu-selection-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        
        // モードに応じて先手・後手を決定
        if (mode === 'random') {
            mode = Math.random() < 0.5 ? 'human' : 'cpu';
            console.log('Random mode selected:', mode);
        }
        
        let isCpuFirst = false;
        
        if (mode === 'cpu') {
            this.currentPlayer = 'x'; // CPUが先手
            this.cpuPlayer = 'x';
            this.humanPlayer = 'o';
            isCpuFirst = true;
            this.initialStartingPlayer = 'x'; // 初期先攻プレイヤーを記憶
            console.log('CPU goes first');
        } else {
            this.currentPlayer = 'o'; // プレイヤーが先手
            this.cpuPlayer = 'x';
            this.humanPlayer = 'o';
            isCpuFirst = false;
            this.initialStartingPlayer = 'o'; // 初期先攻プレイヤーを記憶
            console.log('Player goes first');
        }
        
        console.log('Before resetGame:', {
            currentPlayer: this.currentPlayer,
            cpuPlayer: this.cpuPlayer,
            humanPlayer: this.humanPlayer,
            isCpuFirst: isCpuFirst,
            gameActive: this.gameActive
        });
        
        this.resetGame();
        this.updateStatus();
        
        console.log('After resetGame:', {
            currentPlayer: this.currentPlayer,
            cpuPlayer: this.cpuPlayer,
            humanPlayer: this.humanPlayer,
            isCpuFirst: isCpuFirst,
            gameActive: this.gameActive
        });
        
        // CPUが先手の場合は、リセット後にCPUの手を実行
        if (isCpuFirst) {
            console.log('=== SCHEDULING CPU MOVE ===');
            console.log('isCpuFirst:', isCpuFirst);
            console.log('currentPlayer:', this.currentPlayer);
            console.log('cpuPlayer:', this.cpuPlayer);
            console.log('gameActive:', this.gameActive);
            
            setTimeout(() => {
                console.log('=== EXECUTING SCHEDULED CPU MOVE ===');
                console.log('setTimeout callback executed');
                console.log('currentPlayer:', this.currentPlayer);
                console.log('cpuPlayer:', this.cpuPlayer);
                console.log('gameActive:', this.gameActive);
                console.log('isCpuMode:', this.isCpuMode);
                this.makeCpuMove();
            }, 500);
        }
        
        console.log('=== startCpuGame END ===');
    }
    
    showMainScreen() {
        this.hideWinnerModal(); // モーダルが残っている場合を考慮して非表示にする
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('cpu-selection-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'flex';
        // ゲームを停止
        this.gameActive = false;
    }
    
    // ヘルプモーダル機能
    showHelpModal() {
        document.getElementById('help-modal').style.display = 'flex';
    }
    
    hideHelpModal() {
        document.getElementById('help-modal').style.display = 'none';
    }
    
    async handleCellClick(e) {
        if (!this.gameActive) return;
        
        // CPUモードでCPUの番の場合は無視
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) return;
        
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        
        if (this.board[index] !== '') return;
        
        await this.makeMove(index); // await を追加
        
        // makeMove完了後、ゲームがアクティブな場合のみ手番を切り替える
        if (this.gameActive) {
            this.switchPlayer();
            this.updateStatus();
            this.updateGravityButton();

            // CPUモードでCPUの手番になった場合、CPUの手を実行
            if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) {
                setTimeout(() => this.makeCpuMove(), 500); // CPUの手は0.5秒遅延
            }
        }
    }
    
    // CPUの手を実行
    async makeCpuMove() {
        console.log('=== makeCpuMove START ===');
        console.log('makeCpuMove called:', {
            gameActive: this.gameActive,
            currentPlayer: this.currentPlayer,
            cpuPlayer: this.cpuPlayer,
            isCpuMode: this.isCpuMode
        });
        
        if (!this.gameActive) {
            console.log('makeCpuMove early return: game not active');
            return;
        }
        
        if (this.currentPlayer !== this.cpuPlayer) {
            console.log('makeCpuMove early return: not CPU turn');
            console.log('currentPlayer:', this.currentPlayer, 'cpuPlayer:', this.cpuPlayer);
            return;
        }
        
        console.log('CPU turn confirmed, getting move...');
        const move = this.getCpuMove();
        console.log('CPU move decided:', move);
        
        if (move === 'gravity') {
            // 重力を使用した場合は何もしない（重力使用の処理で手番が変わる）
            console.log('CPU using gravity');
            return;
        } else if (move !== -1) {
            console.log('CPU placing piece at:', move);
            await this.makeMove(move);

            // makeMove完了後、ゲームがアクティブな場合のみ手番を切り替える
            if (this.gameActive) {
                setTimeout(() => {
                    this.switchPlayer();
                    this.updateStatus();
                    this.updateGravityButton();
                }, 500); // 0.5秒の遅延
            }
        } else {
            console.log('CPU no valid move found');
        }
        
        console.log('=== makeCpuMove END ===');
    }
    
    // CPUの手を決定
    getCpuMove() {
        console.log('=== getCpuMove START ===');
        console.log('getCpuMove called');
        
        // 1. 勝利できる手があるかチェック（コマを置くだけで勝利）
        const winningMove = this.findWinningMove(this.cpuPlayer);
        console.log('Winning move check:', winningMove);
        if (winningMove !== -1) {
            console.log('Winning move found, returning:', winningMove);
            return winningMove;
        }
        
        // 1.5. 勝利できる手がない理由を詳しく確認
        console.log('No direct winning move found, checking why...');
        const potentialWinningMoves = this.findPotentialWinningMoves(this.cpuPlayer);
        console.log('Potential winning moves (including self-destructive):', potentialWinningMoves);
        
        // 2. 重力を使って防御する場合（条件2：通常の防御でCPU自身のコマが消える場合のみ）
        // この条件を最優先でチェック（相手のリーチを防ぐため）
        if (!this.gravityUsed[this.cpuPlayer]) {
            console.log('Checking if gravity is needed for defense (opponent reach + CPU piece loss)...');
            const defensiveGravity = this.findDefensiveGravityMove();
            console.log('Defensive gravity check:', defensiveGravity);
            if (defensiveGravity) {
                console.log('Defensive gravity found:', defensiveGravity);
                console.log('Using gravity to avoid CPU piece loss while blocking opponent reach!');
                this.useGravity(defensiveGravity);
                return 'gravity';
            }
        }
        
        // 3. 重力を使って確実に勝利できる場合（条件1）
        if (!this.gravityUsed[this.cpuPlayer]) {
            console.log('Checking if gravity can provide a winning move...');
            const winningGravity = this.findWinningGravityMove();
            console.log('Winning gravity check:', winningGravity);
            if (winningGravity) {
                console.log('Winning gravity found:', winningGravity);
                this.useGravity(winningGravity);
                return 'gravity';
            }
        } else {
            console.log('Gravity already used by CPU');
        }
        
        // 4. 通常の防御手を探す（安全な防御のみ）
        const blockingMove = this.findBlockingMove();
        console.log('Blocking move check:', blockingMove);
        if (blockingMove !== -1) {
            console.log('Normal blocking move found:', blockingMove);
            return blockingMove;
        }
        
        // 5. 戦略的なランダムな手を選択
        const randomMove = this.getStrategicRandomMove();
        console.log('Random move selected:', randomMove);
        console.log('=== getCpuMove END ===');
        return randomMove;
    }
    
    // 勝利できる手を探す
    findWinningMove(player) {
        console.log(`=== FINDING WINNING MOVE FOR ${player} ===`);
        const potentialMoves = [];
        
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                // 一時的に手を置いて勝利判定
                this.board[i] = player;
                if (this.checkWinnerForPlayer(player)) {
                    // 勝利できる手を発見
                    const wouldLosePieces = this.wouldCpuLosePieces(i);
                    potentialMoves.push({
                        position: i,
                        wouldWin: true,
                        wouldLosePieces: wouldLosePieces
                    });
                    console.log(`Winning move found at position ${i}, wouldLosePieces: ${wouldLosePieces}`);
                    
                    // CPU自身のコマが消えない場合は即座に返す
                    if (!wouldLosePieces) {
                        console.log(`Safe winning move found at ${i}, returning immediately`);
                        this.board[i] = ''; // 元に戻す
                        return i;
                    }
                }
                this.board[i] = ''; // 元に戻す
            }
        }
        
        // 安全な勝利手がない場合
        if (potentialMoves.length > 0) {
            console.log(`Found ${potentialMoves.length} winning moves, but all would cause CPU pieces to disappear`);
            console.log('Potential moves:', potentialMoves);
            console.log('⚠️  WARNING: CPU has winning moves but they would cause self-destruction!');
            console.log('⚠️  This should trigger defensive gravity if opponent has reach!');
        } else {
            console.log('No winning moves found at all');
        }
        
        console.log('Returning -1 (no safe winning move)');
        return -1;
    }
    
    // CPUのコマが消えるかチェック
    wouldCpuLosePieces(moveIndex) {
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        const row = Math.floor(moveIndex / 6);
        const col = moveIndex % 6;
        
        for (let [dx, dy] of directions) {
            let count = 1;
            let positions = [moveIndex];
            
            // 正方向にカウント
            let x = col + dx;
            let y = row + dy;
            while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                const nextIndex = y * 6 + x;
                if (this.board[nextIndex] === this.cpuPlayer) {
                    count++;
                    positions.push(nextIndex);
                    x += dx;
                    y += dy;
                } else {
                    break;
                }
            }
            
            // 負方向にカウント
            x = col - dx;
            y = row - dy;
            while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                const nextIndex = y * 6 + x;
                if (this.board[nextIndex] === this.cpuPlayer) {
                    count++;
                    positions.push(nextIndex);
                    x -= dx;
                    y -= dy;
                } else {
                    break;
                }
            }
            
            // ちょうど3つ並ぶ場合は消える
            if (count === 3) {
                console.log(`CPU pieces would disappear at positions:`, positions);
                return true;
            }
        }
        return false;
    }
    
    // 通常の防御手を探す（相手のリーチを迷わず防ぐ）
    findBlockingMove() {
        console.log('=== CHECKING NORMAL BLOCKING MOVES ===');
        
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                // 一時的に手を置いてプレイヤーの勝利を防ぐかチェック
                this.board[i] = this.humanPlayer;
                const wouldWin = this.checkWinnerForPlayer(this.humanPlayer);
                this.board[i] = ''; // 元に戻す
                
                if (wouldWin) {
                    console.log(`Player would win at position ${i}, checking if CPU can safely block...`);
                    
                    // CPU自身のコマが消えるかチェック
                    this.board[i] = this.cpuPlayer;
                    const wouldLosePieces = this.wouldCpuLosePieces(i);
                    this.board[i] = ''; // 元に戻す
                    
                    if (wouldLosePieces) {
                        console.log(`CPU would lose pieces at position ${i}, cannot block safely`);
                        // CPU自身のコマが消える場合は防御しない（重力で対応）
                        continue;
                    } else {
                        console.log(`CPU can safely block at position ${i}`);
                        return i; // 安全に防御
                    }
                }
            }
        }
        
        console.log('No safe blocking moves found');
        return -1;
    }
    
    // 防御に最適な重力方向を決定（削除 - 使用されていない）
    // findBestGravityDirectionForDefense() {
    //     // この関数は削除
    // }
    

    
    // 重力のシミュレーション（findWinningGravityMoveで必要）
    simulateGravity(direction) {
        console.log(`=== SIMULATING GRAVITY: ${direction} ===`);
        console.log('Original board:', [...this.board]);
        
        // 現在の盤面をコピー
        const currentBoard = [...this.board];
        const newBoard = Array(36).fill('');
        
        // 元のコマ数をカウント
        const originalOCount = currentBoard.filter(cell => cell === 'o').length;
        const originalXCount = currentBoard.filter(cell => cell === 'x').length;
        console.log(`Original piece count - O: ${originalOCount}, X: ${originalXCount}`);
        
        if (direction === 'up') {
            console.log('Applying UP gravity');
            for (let col = 0; col < 6; col++) {
                let writeIndex = col;
                console.log(`Column ${col}: starting at writeIndex ${writeIndex}`);
                for (let row = 0; row < 6; row++) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex += 6;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        } else if (direction === 'down') {
            console.log('Applying DOWN gravity');
            for (let col = 0; col < 6; col++) {
                let writeIndex = 30 + col;
                console.log(`Column ${col}: starting at writeIndex ${writeIndex}`);
                for (let row = 5; row >= 0; row--) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex -= 6;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        } else if (direction === 'left') {
            console.log('Applying LEFT gravity');
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6;
                console.log(`Row ${row}: starting at writeIndex ${writeIndex}`);
                for (let col = 0; col < 6; col++) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex++;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        } else if (direction === 'right') {
            console.log('Applying RIGHT gravity');
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6 + 5;
                console.log(`Row ${row}: starting at writeIndex ${writeIndex}`);
                for (let col = 5; col >= 0; col--) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex--;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        }
        
        // シミュレーション後のコマ数をカウント
        const newOCount = newBoard.filter(cell => cell === 'o').length;
        const newXCount = newBoard.filter(cell => cell === 'x').length;
        console.log(`Simulated piece count - O: ${newOCount}, X: ${newXCount}`);
        
        // コマ数の整合性チェック
        if (originalOCount !== newOCount || originalXCount !== newXCount) {
            console.error(`GRAVITY SIMULATION ERROR: Piece count mismatch!`);
            console.error(`Original - O: ${originalOCount}, X: ${originalXCount}`);
            console.error(`Simulated - O: ${newOCount}, X: ${newXCount}`);
            console.error('Original board:', currentBoard);
            console.error('Simulated board:', newBoard);
            
            // エラーの場合は元の盤面を返す
            // この時点でエラーが発生しているため、ゲームの整合性を保つために例外をスローすることも検討
            throw new Error("Gravity simulation resulted in piece count mismatch.");
            // return [...currentBoard]; // 例外をスローするので不要
        }
        
        console.log('Simulated board after gravity:', newBoard);
        console.log(`=== GRAVITY SIMULATION COMPLETED: ${direction} ===`);
        
        return newBoard;
    }
    
    // ランダムな手を選択
    getRandomMove() {
        const emptyCells = [];
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                emptyCells.push(i);
            }
        }
        
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        return -1;
    }
    
    // 戦略的なランダムな手を選択
    getStrategicRandomMove() {
        console.log('=== getStrategicRandomMove START ===');
        console.log('getStrategicRandomMove called');
        const emptyCells = [];
        const strategicCells = [];
        const safeCells = [];
        
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                emptyCells.push(i);
                
                // CPU自身のコマが三つ揃って消える手は避ける
                if (this.wouldCpuLosePieces(i)) {
                    console.log('Avoiding move that would cause CPU pieces to disappear:', i);
                    continue;
                }
                
                // 戦略的な位置かチェック（既存のCPUコマの隣）
                if (this.isStrategicPosition(i)) {
                    strategicCells.push(i);
                }
                
                // 安全な手（CPU自身のコマが消えない）
                safeCells.push(i);
            }
        }
        
        console.log('Empty cells:', emptyCells.length, 'Strategic cells:', strategicCells.length, 'Safe cells:', safeCells.length);
        
        // 戦略的な位置がある場合はそこから選択
        if (strategicCells.length > 0) {
            const selected = strategicCells[Math.floor(Math.random() * strategicCells.length)];
            console.log('Selected strategic position:', selected);
            console.log('=== getStrategicRandomMove END (strategic) ===');
            return selected;
        }
        
        // 戦略的な位置がない場合は安全な手から選択
        if (safeCells.length > 0) {
            const selected = safeCells[Math.floor(Math.random() * safeCells.length)];
            console.log('Selected safe position:', selected);
            console.log('=== getStrategicRandomMove END (safe) ===');
            return selected;
        }
        
        // 安全な手がない場合は通常のランダム選択（緊急時）
        if (emptyCells.length > 0) {
            const selected = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            console.log('Selected random position (emergency):', selected);
            console.log('=== getStrategicRandomMove END (emergency) ===');
            return selected;
        }
        
        console.log('No valid moves found');
        console.log('=== getStrategicRandomMove END (no moves) ===');
        return -1;
    }
    
    // 戦略的な位置かチェック
    isStrategicPosition(index) {
        const row = Math.floor(index / 6);
        const col = index % 6;
        
        // 8方向をチェック
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (let [dy, dx] of directions) {
            const newRow = row + dy;
            const newCol = col + dx;
            
            if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 6) {
                const neighborIndex = newRow * 6 + newCol;
                if (this.board[neighborIndex] === this.cpuPlayer) {
                    console.log(`Strategic position found at ${index}, neighbor at ${neighborIndex} has CPU piece`);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    async makeMove(index) { // asyncを追加
        console.log(`=== MAKE MOVE START for ${this.currentPlayer} at index ${index} ===`); // デバッグログ追加
        console.log('Board before makeMove:', [...this.board]); // デバッグログ追加
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        // 勝利判定（四つ以上並んだ場合）
        if (this.checkWinner()) {
            this.endGame();
            return;
        }
        
        // 三つ並んだ場合の処理
        await this.checkAndRemoveThrees(); // awaitを追加
        
        // 引き分け判定
        if (this.checkDraw()) {
            this.endGame(true);
            return;
        }

        setTimeout(() => { /* do nothing */ }, 500); // 0.5秒の遅延
    }
    
    showGravityDirections() {
        if (this.gravityUsed[this.currentPlayer]) return;
        
        const directions = document.getElementById('gravity-directions');
        
        // 既に表示されている場合は隠す、表示されていない場合は表示
        if (directions.style.display === 'flex') {
            directions.style.display = 'none';
        } else {
            directions.style.display = 'flex';
        }
    }
    
    async useGravity(direction) {
        if (this.gravityUsed[this.currentPlayer]) return;
        
        console.log(`重力を使用: ${direction}方向`); // デバッグ用
        
        // 重力を使用済みにする
        this.gravityUsed[this.currentPlayer] = true;
        
        // 重力の方向を保存
        this.lastGravityDirection = direction;
        
        // 方向選択を隠す
        document.getElementById('gravity-directions').style.display = 'none';
        
        // 重力を適用（完了を待つ）
        await this.applyGravity(direction);
        
        // applyGravity内でafterGravityCheckが呼び出され、そこで手番変更とCPUの手実行を処理する
        // そのため、ここでは何もしない
    }
    
    async applyGravity(direction) {
        this.showLoadingIndicator(); // ローディングインジケーターを表示
        console.log(`=== APPLY GRAVITY START: ${direction}方向 ===`); // デバッグログ追加
        console.log('重力適用前のボード:', [...this.board]); // デバッグ用
        
        // 現在の盤面をコピー
        const currentBoard = [...this.board];
        const newBoard = Array(36).fill('');
        const moves = []; // 移動情報を格納
        
        // 元のコマ数をカウント
        const originalOCount = currentBoard.filter(cell => cell === 'o').length;
        const originalXCount = currentBoard.filter(cell => cell === 'x').length;
        console.log(`Original piece count - O: ${originalOCount}, X: ${originalXCount}`);
        
        if (direction === 'up') {
            // 上方向の重力（上から詰める）
            console.log('上方向の重力を適用');
            for (let col = 0; col < 6; col++) {
                let writeIndex = col;
                console.log(`Column ${col}: starting at writeIndex ${writeIndex}`);
                for (let row = 0; row < 6; row++) {
                    const readIndex = row * 6 + col;
                    console.log(`  ReadIndex: ${readIndex}, Value: ${currentBoard[readIndex]}`); // 追加
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`  Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: currentBoard[readIndex]
                            });
                            console.log(`  Added move: from ${readIndex} to ${writeIndex}, value ${currentBoard[readIndex]}`); // 追加
                        }
                        writeIndex += 6;
                        console.log(`  Next writeIndex: ${writeIndex}`);
                    }
                }
                console.log(`Processed column ${col}. Current newBoard:`, [...newBoard]); // 追加
            }
        } else if (direction === 'down') {
            // 下方向の重力（下から詰める）
            console.log('下方向の重力を適用');
            for (let col = 0; col < 6; col++) {
                let writeIndex = 30 + col;
                console.log(`Column ${col}: starting at writeIndex ${writeIndex}`);
                for (let row = 5; row >= 0; row--) {
                    const readIndex = row * 6 + col;
                    console.log(`  ReadIndex: ${readIndex}, Value: ${currentBoard[readIndex]}`); // 追加
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`  Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: currentBoard[readIndex]
                            });
                            console.log(`  Added move: from ${readIndex} to ${writeIndex}, value ${currentBoard[readIndex]}`); // 追加
                        }
                        writeIndex -= 6;
                        console.log(`  Next writeIndex: ${writeIndex}`);
                    }
                }
                console.log(`Processed column ${col}. Current newBoard:`, [...newBoard]); // 追加
            }
        } else if (direction === 'left') {
            // 左方向の重力（左から詰める）
            console.log('左方向の重力を適用');
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6;
                console.log(`Row ${row}: starting at writeIndex ${writeIndex}`);
                for (let col = 0; col < 6; col++) {
                    const readIndex = row * 6 + col;
                    console.log(`  ReadIndex: ${readIndex}, Value: ${currentBoard[readIndex]}`); // 追加
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`  Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: currentBoard[readIndex]
                            });
                            console.log(`  Added move: from ${readIndex} to ${writeIndex}, value ${currentBoard[readIndex]}`); // 追加
                        }
                        writeIndex++;
                        console.log(`  Next writeIndex: ${writeIndex}`);
                    }
                }
                console.log(`Processed row ${row}. Current newBoard:`, [...newBoard]); // 追加
            }
        } else if (direction === 'right') {
            // 右方向の重力（右から詰める）
            console.log('右方向の重力を適用');
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6 + 5;
                console.log(`Row ${row}: starting at writeIndex ${writeIndex}`);
                for (let col = 5; col >= 0; col--) {
                    const readIndex = row * 6 + col;
                    console.log(`  ReadIndex: ${readIndex}, Value: ${currentBoard[readIndex]}`); // 追加
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`  Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: currentBoard[readIndex]
                            });
                            console.log(`  Added move: from ${readIndex} to ${writeIndex}, value ${currentBoard[readIndex]}`); // 追加
                        }
                        writeIndex--;
                        console.log(`  Next writeIndex: ${writeIndex}`);
                    }
                }
                console.log(`Processed row ${row}. Current newBoard:`, [...newBoard]); // 追加
            }
        }
        
        // 重力適用後のボードの整合性チェック
        const originalPieceCount = currentBoard.filter(cell => cell !== '').length;
        const newPieceCount = newBoard.filter(cell => cell !== '').length;
        
        console.log('重力適用前のコマ数:', originalPieceCount);
        console.log('重力適用後のコマ数:', newPieceCount);
        console.log('重力適用後のボード:', newBoard);
        console.log('移動するコマの数:', moves.length);
        
        // コマ数が変わっていないことを確認
        if (originalPieceCount !== newPieceCount) {
            console.error('重力適用でコマ数が変更されました！');
            console.error('元のコマ数:', originalPieceCount, '新しいコマ数:', newPieceCount);
            console.error('元のボード:', currentBoard);
            console.error('新しいボード:', newBoard);
            // エラーの場合は処理を中止
            return;
        }
        
        // 各プレイヤーのコマ数もチェック
        const newOCount = newBoard.filter(cell => cell === 'o').length;
        const newXCount = newBoard.filter(cell => cell === 'x').length;
        
        console.log('重力適用前 - 〇:', originalOCount, '✕:', originalXCount);
        console.log('重力適用後 - 〇:', newOCount, '✕:', newXCount);
        
        if (originalOCount !== newOCount || originalXCount !== newXCount) {
            console.error('重力適用でプレイヤー別コマ数が変更されました！');
            console.error('〇: 元', originalOCount, '→ 新', newOCount);
            console.error('✕: 元', originalXCount, '→ 新', newXCount);
            console.error('元のボード:', currentBoard);
            console.error('新しいボード:', newBoard);
            // エラーの場合は処理を中止
            return;
        }
        
        // ボードを先に更新（アニメーション前に）
        this.board = newBoard;
        
        // 移動アニメーションを実行
        if (moves.length > 0) {
            await this.animateGravityMoves(moves);
        } else {
            // 移動がない場合は表示を更新
            this.updateBoardDisplay();
        }
        
        // 重力後の判定処理を開始
        await this.afterGravityCheck(); // setTimeoutを削除し、直接awaitで呼び出す
        console.log(`=== APPLY GRAVITY END: ${direction}方向 ===`); // デバッグログ追加
    }
    
    async animateGravityMoves(moves) {
        console.log('重力移動アニメーション開始');
        
        if (moves.length === 0) return;
        
        // 移動距離の最大値を計算
        const maxDistance = Math.max(...moves.map(move => Math.abs(move.to - move.from)));
        console.log(`最大移動距離: ${maxDistance}マス`);
        
        // 各ステップで全コマを同時に一マスずつ移動
        for (let step = 1; step <= maxDistance; step++) {
            console.log(`ステップ ${step}/${maxDistance}: 全コマを一マスずつ移動`);
            
            // 全コマを同時に一マスずつ移動
            await this.animateAllMovesOneStep(moves, step);
            
            // 次のステップまで少し待つ
            if (step < maxDistance) {
                await this.sleep(120); // 連鎖重力アニメーション速度を遅くする
            }
        }
        
        console.log('重力移動アニメーション完了');
        
        // アニメーション完了後、最終的なボード表示を更新
        this.updateBoardDisplay();
    }
    
    async animateAllMovesOneStep(moves, step) {
        return new Promise((resolve) => {
            const cellsToUpdate = new Set();
            
            moves.forEach(move => {
                const distance = Math.abs(move.to - move.from);
                if (step <= distance) {
                    // 現在のステップでの位置を計算
                    const currentPos = this.calculateCurrentPosition(move, step);
                    const prevPos = this.calculateCurrentPosition(move, step - 1);
                    
                    if (currentPos !== prevPos) {
                        cellsToUpdate.add({
                            from: prevPos,
                            to: currentPos,
                            value: move.value
                        });
                    }
                }
            });
            
            // 全セルを同時に更新
            cellsToUpdate.forEach(update => {
                const fromCell = document.querySelector(`[data-index="${update.from}"]`);
                const toCell = document.querySelector(`[data-index="${update.to}"]`);
                
                if (fromCell && toCell) {
                    // 移動元を空にする
                    fromCell.textContent = '';
                    fromCell.classList.remove('o', 'x');
                    
                    // 移動先にコマを表示
                    toCell.textContent = update.value === 'o' ? '〇' : '✕';
                    toCell.classList.add(update.value);
                    toCell.classList.add('moving');
                }
            });
            
            // 移動アニメーション完了後
            setTimeout(() => {
                cellsToUpdate.forEach(update => {
                    const toCell = document.querySelector(`[data-index="${update.to}"]`);
                    if (toCell) {
                        toCell.classList.remove('moving');
                    }
                });
                resolve();
            }, 100); // 元のアニメーション速度に戻す
        });
    }
    
    calculateCurrentPosition(move, step) {
        const direction = this.lastGravityDirection;
        const fromRow = Math.floor(move.from / 6);
        const fromCol = move.from % 6;
        const toRow = Math.floor(move.to / 6);
        const toCol = move.to % 6;
        
        let currentRow, currentCol;
        
        if (direction === 'up') {
            // 上方向：行番号が減少（上に移動）
            const totalDistance = fromRow - toRow;
            const currentDistance = Math.min(step, totalDistance);
            currentRow = fromRow - currentDistance;
            currentCol = fromCol;
        } else if (direction === 'down') {
            // 下方向：行番号が増加（下に移動）
            const totalDistance = toRow - fromRow;
            const currentDistance = Math.min(step, totalDistance);
            currentRow = fromRow + currentDistance;
            currentCol = fromCol;
        } else if (direction === 'left') {
            // 左方向：列番号が減少（左に移動）
            const totalDistance = fromCol - toCol;
            const currentDistance = Math.min(step, totalDistance);
            currentRow = fromRow;
            currentCol = fromCol - currentDistance;
        } else if (direction === 'right') {
            // 右方向：列番号が増加（右に移動）
            const totalDistance = toCol - fromCol;
            const currentDistance = Math.min(step, totalDistance);
            currentRow = fromRow;
            currentCol = fromCol + currentDistance;
        }
        
        return currentRow * 6 + currentCol;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        const animationPromises = [];

        cells.forEach((cell, index) => {
            const value = this.board[index];
            if (value !== '') {
                cell.textContent = value === 'o' ? '〇' : '✕';
                cell.classList.remove('o', 'x');
                cell.classList.add(value);
                cell.classList.add('moving');
                animationPromises.push(new Promise(resolve => {
                    setTimeout(() => {
                        cell.classList.remove('moving');
                        resolve();
                    }, 400); // もっともっともっともっとゆっくりに調整
                }));
            } else {
                cell.textContent = '';
                cell.classList.remove('o', 'x', 'moving');
                cell.style.background = '';
                cell.style.boxShadow = '';
            }
        });

        await Promise.all(animationPromises);
    }
    
    async afterGravityCheck() { // asyncを追加
        console.log('=== AFTER GRAVITY CHECK ===');
        console.log('Current board state:', [...this.board]);
        
        // 重力後の整合性チェック
        const currentOCount = this.board.filter(cell => cell === 'o').length;
        const currentXCount = this.board.filter(cell => cell === 'x').length;
        console.log(`Current piece count - O: ${currentOCount}, X: ${currentXCount}`);
        
        // 重力後の勝利判定
        const oWins = this.checkWinnerForPlayer('o');
        const xWins = this.checkWinnerForPlayer('x');
        
        console.log(`Win check results - O: ${oWins}, X: ${xWins}`);
        
        if (oWins && xWins) {
            // 両方とも四つ以上並んでいる場合、ドロー
            console.log('Both players win after gravity - DRAW');
            this.hideLoadingIndicator(); // ローディングインジケーターを非表示
            this.endGame(true);
            this.gameActive = false; // ゲームを終了
            return;
        } else if (oWins) {
            console.log('O wins after gravity');
            this.hideLoadingIndicator(); // ローディングインジケーターを非表示
            this.endGame(false);
            this.gameActive = false; // ゲームを終了
            return;
        } else if (xWins) {
            console.log('X wins after gravity');
            this.hideLoadingIndicator(); // ローディングインジケーターを非表示
            this.endGame(false);
            this.gameActive = false; // ゲームを終了
            return;
        }
        
        console.log('No immediate win after gravity, checking for three-in-a-row removals');
        
        // 三つ並びの処理（連鎖重力）
        await this.checkAndRemoveThreesWithChainGravity(); // awaitを追加

        this.hideLoadingIndicator(); // ローディングインジケーターを非表示

        // 重力による全ての処理が完了した後、ゲームがアクティブな場合のみ手番を切り替える
        // 1秒の遅延を入れてからターン切り替えとCPUの手を実行
        if (this.gameActive) {
            setTimeout(() => {
                this.switchPlayer();
                this.updateStatus();
                this.updateGravityButton();

                // CPUモードでCPUの手番になった場合、CPUの手を実行
                if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) {
                    setTimeout(() => this.makeCpuMove(), 500); // CPUの手はさらに0.5秒遅延
                }
            }, 1000); // 1秒の遅延
        }
    }
    
    checkWinnerForPlayer(player) {
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (this.board[index] !== player) continue;
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index]; // positionsを常に定義
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) {
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 負方向にカウント
                    x = col - dx;
                    y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) {
                            count++;
                            positions.push(nextIndex);
                            x -= dx;
                            y -= dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 四つ以上並んでいれば勝利
                    if (count >= 4) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    async checkAndRemoveThreesWithChainGravity() {
        console.log('=== CHAIN GRAVITY START ===');
        console.log('Current board before chain gravity:', [...this.board]);
        await this.processChainGravity(0);
    }
    
    async processChainGravity(chainCount) {
        if (chainCount >= 10) {
            console.log('Chain gravity limit reached (10 times)');
            return;
        }
        
        console.log(`連鎖重力処理 ${chainCount + 1}回目`); // デバッグ用
        console.log(`Board state at chain ${chainCount + 1}:`, [...this.board]);
        
        // 三つ並びをチェック
        const hasRemovals = await this.checkAndRemoveThrees();
        console.log(`Chain gravity ${chainCount + 1}: hasRemovals = ${hasRemovals}`); // デバッグログ追加
        
        if (hasRemovals) {
            console.log(`${chainCount + 1}回目: 三つ並びを検出、削除処理開始`); // デバッグ用
            
            // 削除アニメーション完了を待ってから連鎖重力を適用
            return new Promise(resolve => {
                setTimeout(async () => {
                    console.log(`${chainCount + 1}回目: 連鎖重力で空白を埋める（方向: ${this.lastGravityDirection}）`); // デバッグ用
                    console.log(`Chain gravity ${chainCount + 1}: lastGravityDirection before fillEmptySpaces = ${this.lastGravityDirection}`); // デバッグログ追加
                    
                    try {
                    // 連鎖重力で空白を埋める（重力を使った方向と同じ）
                        await this.fillEmptySpacesWithDirection(this.lastGravityDirection);
                        
                        // ボード表示を更新
                        
                        // 連鎖重力後の整合性チェック
                        const currentOCount = this.board.filter(cell => cell === 'o').length;
                        const currentXCount = this.board.filter(cell => cell === 'x').length;
                        console.log(`Chain gravity ${chainCount + 1} - Current piece count - O: ${currentOCount}, X: ${currentXCount}`);
                        
                        // ボードの整合性を再確認
                        if (this.board.some(cell => cell !== '' && cell !== 'o' && cell !== 'x')) {
                            console.error(`Chain gravity ${chainCount + 1} - Invalid board state detected!`);
                            console.error('Board contains invalid values:', this.board);
                            resolve(); // エラー時はresolveしてPromiseを終了
                            return;
                        }
                            
                            // 最優先で四つ以上並びの判定（勝利/ドロー）
                            const oWins = this.checkWinnerForPlayer('o');
                            const xWins = this.checkWinnerForPlayer('x');
                        
                        console.log(`Chain gravity ${chainCount + 1} - Win check results - O: ${oWins}, X: ${xWins}`);
                            
                            if (oWins && xWins) {
                                // 両方とも四つ以上並んでいる場合、ドロー
                                console.log('連鎖重力中にドローを検出');
                                this.hideLoadingIndicator(); // ローディングインジケーターを非表示
                                this.endGame(true);
                                this.gameActive = false; // ゲームを終了
                                resolve(); // ゲーム終了時はresolveしてPromiseを終了
                                return;
                            } else if (oWins) {
                                console.log('連鎖重力中に〇の勝利を検出');
                                this.hideLoadingIndicator(); // ローディングインジケーターを非表示
                                this.endGame(false);
                                this.gameActive = false; // ゲームを終了
                                resolve(); // ゲーム終了時はresolveしてPromiseを終了
                                return;
                            } else if (xWins) {
                                console.log('連鎖重力中に✕の勝利を検出');
                                this.hideLoadingIndicator(); // ローディングインジケーターを非表示
                                this.endGame(false);
                                this.gameActive = false; // ゲームを終了
                                resolve(); // ゲーム終了時はresolveしてPromiseを終了
                                return;
                            }
                            
                            // 四つ以上並びがない場合のみ、次の連鎖をチェック
                            console.log(`${chainCount + 1}回目: 四つ以上並びなし、次の連鎖をチェック`);
                            
                            // ここに0.5秒の遅延を入れる
                            await new Promise(resolveInner => setTimeout(() => { // await new Promiseでラップ
                                this.processChainGravity(chainCount + 1).then(resolveInner); // then(resolveInner)を追加
                            }, 500)); // 0.5秒の遅延
                        
                    } catch (error) {
                        console.error(`Chain gravity ${chainCount + 1} error:`, error);
                    } finally {
                        resolve(); // 処理完了後、Promiseを解決
                    }
                }, 300); // 重力後の連鎖重力は0.3秒の遅延に調整
            }); // PromiseでラップしたsetTimeoutの終わり
        } else {
            console.log(`連鎖重力終了: ${chainCount}回の処理を完了`); // デバッグ用
            console.log('Final board state:', [...this.board]);
            
            // ここから手番変更とCPUの手実行のロジックを削除します
            // if (this.gameActive) { // ゲームが終了していない場合のみ
            //     this.switchPlayer();
            //     this.updateStatus();
            //     this.updateGravityButton();
            //     
            //     if (this.isCpuMode && this.currentPlayer === this.cpuPlayer) {
            //         setTimeout(() => this.makeCpuMove(), 500);
            //     }
            // }
        }
    }
    
    async fillEmptySpacesWithDirection(direction) {
        console.log(`=== FILL EMPTY SPACES START: ${direction} ===`); // デバッグログ追加
        console.log(`空白を埋める重力を適用（方向: ${direction}）`); // デバッグ用
        
        // 現在の盤面をコピー
        const currentBoard = [...this.board];
        const newBoard = Array(36).fill('');
        const moves = []; // 移動情報を格納
        
        if (direction === 'up') {
            // 上方向の重力（上から詰める）
            for (let col = 0; col < 6; col++) {
                let writeIndex = col;
                console.log(`Column ${col}: starting at writeIndex ${writeIndex}`);
                for (let row = 0; row < 6; row++) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex += 6;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        } else if (direction === 'down') {
            // 下方向の重力（下から詰める）
            for (let col = 0; col < 6; col++) {
                let writeIndex = 30 + col;
                console.log(`Column ${col}: starting at writeIndex ${writeIndex}`);
                for (let row = 5; row >= 0; row--) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex -= 6;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        } else if (direction === 'left') {
            // 左方向の重力（左から詰める）
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6;
                console.log(`Row ${row}: starting at writeIndex ${writeIndex}`);
                for (let col = 0; col < 6; col++) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex++;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        } else if (direction === 'right') {
            // 右方向の重力（右から詰める）
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6 + 5;
                console.log(`Row ${row}: starting at writeIndex ${writeIndex}`);
                for (let col = 5; col >= 0; col--) {
                    const readIndex = row * 6 + col;
                    if (currentBoard[readIndex] !== '') {
                        newBoard[writeIndex] = currentBoard[readIndex];
                        console.log(`Moving piece from ${readIndex} to ${writeIndex}: ${currentBoard[readIndex]}`);
                        writeIndex--;
                        console.log(`Next writeIndex: ${writeIndex}`);
                    }
                }
            }
        }
        
        // 連鎖重力後のボードの整合性チェック
        const originalPieceCount = currentBoard.filter(cell => cell !== '').length;
        const newPieceCount = newBoard.filter(cell => cell !== '').length;
        
        console.log('空白埋め前のコマ数:', originalPieceCount);
        console.log('空白埋め後のコマ数:', newPieceCount);
        console.log('空白埋め前のボード:', currentBoard);
        console.log('空白埋め後のボード:', newBoard);
        console.log('連鎖重力で移動するコマの数:', moves.length);
        
        // コマ数が変わっていないことを確認
        if (originalPieceCount !== newPieceCount) {
            console.error('連鎖重力でコマ数が変更されました！');
            console.error('元のコマ数:', originalPieceCount, '新しいコマ数:', newPieceCount);
            console.error('元のボード:', currentBoard);
            console.error('新しいボード:', newBoard);
            // エラーの場合は処理を中止
            throw new Error("Chain gravity resulted in piece count mismatch (total pieces).");
            // return; // 例外をスローするので不要
        }
        
        // 各プレイヤーのコマ数もチェック
        const originalOCount = currentBoard.filter(cell => cell === 'o').length;
        const originalXCount = currentBoard.filter(cell => cell === 'x').length;
        const newOCount = newBoard.filter(cell => cell === 'o').length;
        const newXCount = newBoard.filter(cell => cell === 'x').length;
        
        console.log('連鎖重力前 - 〇:', originalOCount, '✕:', originalXCount);
        console.log('連鎖重力後 - 〇:', newOCount, '✕:', newXCount);
        
        if (originalOCount !== newOCount || originalXCount !== newXCount) {
            console.error('連鎖重力でプレイヤー別コマ数が変更されました！');
            console.error('〇: 元', originalOCount, '→ 新', newOCount);
            console.error('✕: 元', originalXCount, '→ 新', newXCount);
            // エラーの場合は処理を中止
            throw new Error("Chain gravity resulted in piece count mismatch (player pieces).");
            // return; // 例外をスローするので不要
        }
        
        // 移動アニメーションを実行
        if (moves.length > 0) {
            await this.animateGravityMoves(moves);
        }
        
        // ボードを更新（整合性チェック後に）
        this.board = newBoard;
        
        // 最終的な整合性チェック
        const finalOCount = this.board.filter(cell => cell === 'o').length;
        const finalXCount = this.board.filter(cell => cell === 'x').length;
        
        console.log('連鎖重力完了後 - 〇:', finalOCount, '✕:', finalXCount);
        
        // ボードの整合性を再確認
        if (this.board.some(cell => cell !== '' && cell !== 'o' && cell !== 'x')) {
            console.error('連鎖重力完了後に無効なボード状態を検出！');
            console.error('Board contains invalid values:', this.board);
            // エラーの場合は元のボードに戻す
            throw new Error("Chain gravity resulted in invalid board state after completion.");
            // this.board = [...currentBoard]; // 例外をスローするので不要
        }
        
        if (finalOCount !== originalOCount || finalXCount !== originalXCount) {
            console.error('連鎖重力完了後にプレイヤー別コマ数が変更されました！');
            console.error('〇: 元', originalOCount, '→ 最終', finalOCount);
            console.error('✕: 元', originalXCount, '→ 最終', finalXCount);
            // エラーの場合は元のボードに戻す
            throw new Error("Chain gravity resulted in piece count mismatch (player pieces) after completion.");
            // this.board = [...currentBoard]; // 例外をスローするので不要
        }
        
        console.log('連鎖重力完了 - ボード整合性確認完了');
        this.updateBoardDisplay(); // 連鎖重力処理の最後にUIを完全に更新
        console.log(`=== FILL EMPTY SPACES END: ${direction} ===`); // デバッグログ追加
    }
    
    updateCell(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = this.currentPlayer === 'o' ? '〇' : '✕';
        cell.classList.add(this.currentPlayer);
        
        // アニメーション効果
        cell.style.transform = 'scale(0.8)';
        setTimeout(() => {
            cell.style.transform = 'scale(1)';
        }, 100);
    }
    
    checkWinner() {
        console.log('=== CHECKING WINNER (2P Mode) ==='); // 2Pモードの勝利判定デバッグログを追加
        console.log('Current board state:', [...this.board]);
        // 四つ以上並んだ場合の勝利判定
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (this.board[index] === '') continue;
                const player = this.board[index]; // 勝利判定対象のプレイヤー
                console.log(`Checking index ${index} (${row}, ${col}) for player ${player}`); // 追加
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index]; // 勝利ラインのコマを追跡
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) { // 同じ種類のコマであることのみチェック
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 負方向にカウント（勝利判定には不要だが、debugWinningLineに合わせて追加）
                    x = col - dx;
                    y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) { // 同じ種類のコマであることのみチェック
                            count++;
                            positions.push(nextIndex);
                            x -= dx;
                            y -= dy;
                        } else {
                            break;
                        }
                    }

                    // 四つ以上並んでいれば勝利
                    if (count >= 4) {
                        console.log(`WINNING LINE DETECTED in 2P mode! Player: ${player}`);
                        console.log(`Direction: [${dx}, ${dy}]`);
                        console.log(`Count: ${count}`);
                        console.log(`Positions: ${positions}`);
                        console.log(`Starting position: row=${row}, col=${col}, index=${index}`);
                        return true;
                    }
                }
            }
        }
        console.log('No winning line found in 2P mode');
        return false;
    }
    
    async removeCells(indices) {
        console.log(`=== REMOVING CELLS ===`);
        console.log('Indices to remove:', indices);
        console.log('Board before removal:', [...this.board]);

        // 削除前のコマ数を記録
        const beforeOCount = this.board.filter(cell => cell === 'o').length;
        const beforeXCount = this.board.filter(cell => cell === 'x').length;
        console.log(`Before removal - O: ${beforeOCount}, X: ${beforeXCount}`);

        // 削除対象のコマの種類を記録
        const piecesToRemove = indices.map(index => this.board[index]);
        console.log('Pieces to remove:', piecesToRemove);

        // 即座にボードから削除（表示は後で更新）
        indices.forEach(index => {
            const piece = this.board[index];
            if (piece === 'o') {
                this.oPieces--;
            } else if (piece === 'x') {
                this.xPieces--;
            }
            this.board[index] = ''; // ここでボードの状態とピース数をすぐに更新
        });

        // 削除後のコマ数を確認
        const afterOCount = this.board.filter(cell => cell === 'o').length;
        const afterXCount = this.board.filter(cell => cell === 'x').length;
        console.log(`After removal - O: ${afterOCount}, X: ${afterXCount}`);

        // 削除されたコマ数が正しいかチェック
        const expectedOCount = beforeOCount - piecesToRemove.filter(piece => piece === 'o').length;
        const expectedXCount = beforeXCount - piecesToRemove.filter(piece => piece === 'x').length;

        if (afterOCount !== expectedOCount || afterXCount !== expectedXCount) {
            console.error('REMOVAL ERROR: Piece count mismatch after removal!');
            console.error('Expected - O:', expectedOCount, 'X:', expectedXCount);
            console.error('Actual - O:', afterOCount, 'X:', afterXCount);
            console.error('Board after removal:', [...this.board]);
        }

        return new Promise(resolve => {
            // アニメーション表示を更新
            indices.forEach(index => {
                const cell = document.querySelector(`[data-index="${index}"]`);
                if (cell) {
                    cell.classList.add('removing');
                }
            });

            // アニメーション完了を待ってからDOMを更新し、Promiseを解決
            setTimeout(() => {
                indices.forEach(index => {
                    const cell = document.querySelector(`[data-index="${index}"]`);
                    if (cell) {
                        cell.textContent = '';
                        cell.classList.remove('o', 'x', 'removing', 'highlight-for-removal'); // ハイライトもここで削除
                        cell.style.background = '';
                        cell.style.boxShadow = '';
                    }
                });
                this.updateBoardDisplay(); // コマが削除された後にUIを完全に更新
                console.log('=== CELL REMOVAL COMPLETED ===');
                resolve();
            }, 600); // 元のアニメーション速度に戻す
        });
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'o' ? 'x' : 'o';
    }
    
    updateStatus() {
        const status = document.getElementById('status');
        const playerSymbol = this.currentPlayer === 'o' ? '〇' : '✕';
        status.textContent = `${playerSymbol}の番です`;
    }
    
    updateGravityButton() {
        const gravityBtn = document.getElementById('gravity-btn');
        const canUseGravity = !this.gravityUsed[this.currentPlayer];
        
        if (canUseGravity) {
            gravityBtn.disabled = false;
            gravityBtn.textContent = '重力を使う';
        } else {
            gravityBtn.disabled = true;
            gravityBtn.textContent = '重力使用済み';
        }
    }
    
    endGame(isDraw = false, customMessage = '') {
        console.log('=== END GAME START ==='); // デバッグログ追加
        console.log('endGame called with isDraw:', isDraw, 'customMessage:', customMessage);
        this.gameActive = false;
        
        if (isDraw) {
            const message = customMessage || '引き分けです！';
            this.showWinnerModal(message);
        } else {
            const winner = this.currentPlayer === 'o' ? '〇' : '✕';
            const message = customMessage || `${winner}が勝ちました！`;
            
            // 勝利ラインをハイライト表示
            this.highlightWinningLine();
            
            this.showWinnerModal(message);
        }
        // ゲーム終了時にゲームボードのクリックを無効にし、「もう一度プレイ」ボタンを表示
        // document.getElementById('game-board').classList.add('disabled');
        // document.getElementById('game-end-controls').style.display = 'flex'; // もう一度プレイボタンを表示
    }
    
    showWinnerModal(message) {
        const modal = document.getElementById('winner-modal');
        const winnerText = document.getElementById('winner-text');
        
        console.log('showWinnerModal called with message:', message);
        if (!modal) {
            console.error('ERROR: winner-modal element not found!');
            return;
        }
        if (!winnerText) {
            console.error('ERROR: winner-text element not found!');
            return;
        }
        winnerText.textContent = message;
        modal.style.display = 'flex';
        console.log('winner-modal display set to flex. Current display:', modal.style.display);
    }
    
    hideWinnerModal() {
        document.getElementById('winner-modal').style.display = 'none';
    }
    
    highlightWinningLine() {
        console.log('=== HIGHLIGHTING WINNING LINE ===');
        console.log('Current board state:', [...this.board]);
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (this.board[index] === '') continue;
                const player = this.board[index]; // 勝利判定対象のプレイヤー
                console.log(`Highlight check at index ${index} (${row}, ${col}) for player ${player}`); // 追加
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index];
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) { // 同じ種類のコマであることのみチェック
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 負方向にカウント
                    x = col - dx;
                    y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) { // 同じ種類のコマであることのみチェック
                            count++;
                            positions.push(nextIndex);
                            x -= dx;
                            y -= dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 四つ以上並んでいる場合、ハイライト
                    if (count >= 4) {
                        console.log(`勝利ラインを発見（ハイライト）: ${player}が${count}個並んでいます`);
                        console.log('Highlight positions:', positions);
                        positions.forEach(pos => {
                            const cell = document.querySelector(`[data-index="${pos}"]`);
                            if (cell) {
                                // 勝利ラインを目立つようにハイライト（ピンク系に統一）
                                cell.style.background = 'linear-gradient(145deg, #ff6b9d, #c44569)';
                                cell.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.8)';
                                cell.style.border = '3px solid #c44569';
                                cell.style.transform = 'scale(1.05)';
                                
                                // 勝利アニメーション
                                cell.classList.add('winning-cell');
                            }
                        });
                        return; // 最初に見つかった勝利ラインのみハイライト
                    }
                }
            }
        }
        console.log('No winning line found for highlight'); // 追加
    }
    
    resetGame() {
        console.log('=== resetGame START ===');
        console.log('Before reset:', {
            currentPlayer: this.currentPlayer,
            isCpuMode: this.isCpuMode,
            cpuPlayer: this.cpuPlayer
        });
        
        this.board = Array(36).fill('');
        this.gameActive = true;
        this.gravityUsed = { o: false, x: false };
        this.lastGravityDirection = null; // 重力方向もリセット
        
        // CPUモードの場合は設定を維持
        if (this.isCpuMode) {
            // currentPlayerは既に設定済みなので変更しない
            this.currentPlayer = this.initialStartingPlayer || 'o'; // 初期先攻プレイヤーでリセット
            console.log('resetGame - CPU mode, currentPlayer:', this.currentPlayer);
        } else {
            // 2人対戦モードの場合は通常通り'o'に設定
            this.currentPlayer = 'o';
            console.log('resetGame - 2P mode, currentPlayer set to o');
        }
        
        this.clearBoard();
        this.updateStatus();
        this.updateGravityButton();
        this.hideWinnerModal(); // ゲームリセット時にもモーダルを確実に非表示にする
        document.getElementById('gravity-directions').style.display = 'none';
        
        // ゲームリセット時にゲームボードのクリックを有効にし、「もう一度プレイ」ボタンを隠す
        // document.getElementById('game-board').classList.remove('disabled');
        // document.getElementById('game-end-controls').style.display = 'none'; // もう一度プレイボタンを隠す
        
        // デバッグ用：リセット後の状態を確認
        console.log('resetGame completed:', {
            gameActive: this.gameActive,
            currentPlayer: this.currentPlayer,
            isCpuMode: this.isCpuMode,
            cpuPlayer: this.cpuPlayer
        });
        
        console.log('=== resetGame END ===');
    }
    
    playAgain() {
        // CPUモードでCPUが先行だった場合の処理 (resetGameで処理されるため削除)
        // if (this.isCpuMode && this.cpuPlayer === 'x') {
        //     this.currentPlayer = 'x'; // CPUを先手に設定
        //     console.log('CPU mode reset - CPU goes first');
        // }
        
        this.resetGame(); // ゲームをリセット
        
        // CPUが先行の場合は、リセット後にCPUの手を実行
        if (this.isCpuMode && this.currentPlayer === this.cpuPlayer && this.gameActive) {
            console.log('Scheduling CPU move after play again');
            setTimeout(() => this.makeCpuMove(), 500);
        }
    }
    
    clearBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('o', 'x', 'removing', 'moving', 'winning-cell');
            cell.style.background = '';
            cell.style.boxShadow = '';
            cell.style.border = '';
            cell.style.transform = '';
        });
    }

    // 重力使用で勝利が確定する方向を探す（条件1：確実に勝利できる場合）
    findWinningGravityMove() {
        console.log('=== CHECKING WINNING GRAVITY (Condition 1) ===');
        console.log('Current board state:', [...this.board]);
        
        // 簡単なテスト：重力が使えるかチェック
        if (this.gravityUsed[this.cpuPlayer]) {
            console.log('Gravity already used by CPU');
            return null;
        }
        
        console.log('Gravity available for CPU');
        const directions = ['up', 'down', 'left', 'right'];
        
        for (const direction of directions) {
            console.log(`Testing winning gravity: ${direction}`);
            
            // 重力をシミュレート
            const simulatedBoard = this.simulateGravity(direction);
            console.log('Gravity simulation completed');
            
            // 重力後の盤面でCPUが既に勝利しているかチェック（追加のコマは置かない）
            console.log('Checking if CPU already wins after gravity (no additional pieces)');
            const winResult = this.checkWinnerForSimulatedBoard(simulatedBoard, this.cpuPlayer);
            console.log(`Win check result after gravity ${direction}: ${winResult}`);
            
            if (winResult) {
                console.log(`WINNING GRAVITY FOUND! Direction: ${direction}`);
                console.log('CPU will win immediately after this gravity move!');
                
                // 勝利ラインの詳細を確認
                this.debugWinningLine(simulatedBoard, this.cpuPlayer);
                
                return direction;
            } else {
                console.log(`Direction ${direction}: No immediate win after gravity`);
            }
        }
        
        console.log('No winning gravity moves found');
        return null;
    }
    
    // 重力を使って防御する場合の重力方向を探す（条件2：通常の防御でCPU自身のコマが消える場合のみ）
    findDefensiveGravityMove() {
        console.log('=== CHECKING DEFENSIVE GRAVITY (Condition 2) ===');
        console.log('Current board state:', [...this.board]);
        console.log('This is the CRITICAL condition: opponent reach + CPU piece loss prevention');
        
        // 重力が既に使用されているかチェック
        if (this.gravityUsed[this.cpuPlayer]) {
            console.log('Gravity already used by CPU - cannot use defensive gravity');
            return null;
        }
        
        console.log('Gravity available for defensive use');
        
        // 相手がリーチかチェック
        const opponentReachMoves = [];
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.humanPlayer;
                if (this.checkWinnerForPlayer(this.humanPlayer)) {
                    opponentReachMoves.push(i);
                }
                this.board[i] = '';
            }
        }
        
        if (opponentReachMoves.length === 0) {
            console.log('No opponent reach - no need for defensive gravity');
            return null;
        }
        
        console.log('OPPONENT REACH DETECTED at positions:', opponentReachMoves);
        console.log('This is exactly the situation we need to handle!');
        
        // 通常の防御でCPU自身のコマが消えるかチェック
        // すべての相手のリーチ手でCPU自身のコマが消える場合のみ重力を使用
        let allMovesCauseLoss = true;
        const blockingAnalysis = [];
        
        console.log('=== ANALYZING EACH BLOCKING MOVE ===');
        
        for (const moveIndex of opponentReachMoves) {
            console.log(`\n--- Analyzing blocking move at position ${moveIndex} ---`);
            
            // 一時的にCPUコマを配置
            this.board[moveIndex] = this.cpuPlayer;
            console.log(`Temporarily placed CPU piece at ${moveIndex}`);
            console.log(`Board after placing CPU piece:`, [...this.board]);
            
            // CPU自身のコマが消えるかチェック
            const wouldLosePieces = this.wouldCpuLosePieces(moveIndex);
            console.log(`Would CPU lose pieces at ${moveIndex}? ${wouldLosePieces}`);
            
            // 元に戻す
            this.board[moveIndex] = '';
            console.log(`Restored board after analysis`);
            
            blockingAnalysis.push({
                position: moveIndex,
                wouldLosePieces: wouldLosePieces
            });
            
            if (wouldLosePieces) {
                console.log(`✓ Normal blocking at ${moveIndex} would cause CPU pieces to disappear`);
            } else {
                console.log(`✗ Normal blocking at ${moveIndex} is safe - no need for gravity`);
                allMovesCauseLoss = false;
                break; // 一つでも安全な防御手があれば重力は不要
            }
        }
        
        console.log('\n=== BLOCKING ANALYSIS SUMMARY ===');
        console.log('Blocking analysis:', blockingAnalysis);
        console.log(`All moves cause loss: ${allMovesCauseLoss}`);
        
        if (!allMovesCauseLoss) {
            console.log('Safe normal blocking is available - no need for gravity');
            return null;
        }
        
        console.log('CRITICAL SITUATION CONFIRMED: All normal blocking moves would cause CPU pieces to disappear');
        console.log('This is exactly the situation where gravity should be used for defense!');
        console.log('Gravity is the ONLY way to prevent opponent from winning!');
        
        // 重力を使って防御できる方向を探す（より多くの相手のコマが消える方向）
        const directions = ['up', 'down', 'left', 'right'];
        let bestDirection = null;
        let maxOpponentRemovals = 0;
        
        for (const direction of directions) {
            console.log(`Testing defensive gravity: ${direction}`);
            
            // 重力をシミュレート
            const simulatedBoard = this.simulateGravity(direction);
            
            // 重力後の盤面で相手のリーチが防げるかチェック
            let canBlockAll = true;
            for (const moveIndex of opponentReachMoves) {
                if (simulatedBoard[moveIndex] === '') {
                    simulatedBoard[moveIndex] = this.cpuPlayer;
                    const wouldWin = this.checkWinnerForSimulatedBoard(simulatedBoard, this.humanPlayer);
                    simulatedBoard[moveIndex] = '';
                    
                    if (wouldWin) {
                        console.log(`Gravity ${direction} cannot block opponent at ${moveIndex}`);
                        canBlockAll = false;
                        break;
                    }
                } else {
                    console.log(`Gravity ${direction} makes position ${moveIndex} unavailable`);
                    canBlockAll = false;
                    break;
                }
            }
            
            if (canBlockAll) {
                // 相手のコマがいくつ消えるかチェック
                const opponentRemovals = this.countOpponentRemovalsAfterGravity(direction);
                console.log(`Gravity ${direction} can block all and removes ${opponentRemovals} opponent pieces`);
                
                if (opponentRemovals > maxOpponentRemovals) {
                    maxOpponentRemovals = opponentRemovals;
                    bestDirection = direction;
                }
            }
        }
        
        if (bestDirection) {
            console.log(`SUCCESS: Best defensive gravity found: ${bestDirection} (removes ${maxOpponentRemovals} opponent pieces)`);
            console.log('This defensive gravity will be used to avoid CPU piece loss while blocking opponent!');
            console.log('GRAVITY DEFENSE SUCCESSFUL - opponent reach will be blocked!');
        } else {
            console.log('CRITICAL ERROR: No effective defensive gravity found');
            console.log('This means the opponent will win on their next turn!');
        }
        
        return bestDirection;
    }
    
    // シミュレーション用の勝利判定
    checkWinnerForSimulatedBoard(board, player) {
        console.log(`=== CHECKING WINNER FOR SIMULATED BOARD (${player}) ===`);
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (board[index] !== player) continue;
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index]; // positionsを常に定義
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (board[nextIndex] === player) {
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 負方向にカウント
                    x = col - dx;
                    y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (board[nextIndex] === player) {
                            count++;
                            positions.push(nextIndex);
                            x -= dx;
                            y -= dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 四つ以上並んでいる場合、詳細を表示
                    if (count >= 4) {
                        console.log(`WINNING LINE DETECTED!`);
                        console.log(`Direction: [${dx}, ${dy}]`);
                        console.log(`Count: ${count}`);
                        console.log(`Positions: ${positions}`);
                        console.log(`Starting position: row=${row}, col=${col}, index=${index}`);
                        return true;
                    } else if (count >= 3) {
                        console.log(`3-in-a-row found: count=${count}, positions=${positions}, direction=[${dx}, ${dy}]`);
                    }
                }
            }
        }
        console.log(`No winning line found for ${player}`);
        return false;
    }
    
    // 重力後の相手のコマ削除数をカウント
    countOpponentRemovalsAfterGravity(direction) {
        const simulatedBoard = this.simulateGravity(direction);
        let removalCount = 0;
        
        const directions = [
            [1, 0], [0, 1], [1, 1], [1, -1]
        ];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (simulatedBoard[index] === this.humanPlayer) {
                    for (let [dx, dy] of directions) {
                        let count = 1;
                        let x = col + dx;
                        let y = row + dy;
                        
                        while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                            const nextIndex = y * 6 + x;
                            if (simulatedBoard[nextIndex] === this.humanPlayer) {
                                count++;
                                x += dx;
                                y += dy;
                            } else {
                                break;
                            }
                        }
                        
                        if (count === 3) {
                            removalCount += 3;
                            break; // この方向は既にカウント済み
                        }
                    }
                }
            }
        }
        
        return removalCount;
    }
    
    // 勝利ラインの詳細をデバッグする関数
    debugWinningLine(board, player) {
        console.log(`=== DEBUGGING WINNING LINE FOR ${player} ===`);
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (board[index] !== player) continue;
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index];
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (board[nextIndex] === player) {
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 負方向にカウント
                    x = col - dx;
                    y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (board[nextIndex] === player) {
                            count++;
                            positions.push(nextIndex);
                            x -= dx;
                            y -= dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 四つ以上並んでいる場合、詳細を表示
                    if (count >= 4) {
                        console.log(`WINNING LINE FOUND!`);
                        console.log(`Direction: [${dx}, ${dy}]`);
                        console.log(`Count: ${count}`);
                        console.log(`Positions: ${positions}`);
                        console.log(`Starting position: row=${row}, col=${col}, index=${index}`);
                        
                        // 盤面の視覚的表示
                        let boardDisplay = '';
                        for (let r = 0; r < 6; r++) {
                            let rowStr = '';
                            for (let c = 0; c < 6; c++) {
                                const idx = r * 6 + c;
                                if (positions.includes(idx)) {
                                    rowStr += `[${board[idx]}]`;
                                } else {
                                    rowStr += ` ${board[idx] || '.'} `;
                                }
                            }
                            boardDisplay += rowStr + '\n';
                        }
                        console.log('Board with winning line highlighted:');
                        console.log(boardDisplay);
                        return;
                    }
                }
            }
        }
        console.log('No winning line found in debug function');
    }

    // 潜在的な勝利手を探す（CPU自身のコマが消える場合も含む）
    findPotentialWinningMoves(player) {
        const potentialMoves = [];
        
        for (let i = 0; i < 36; i++) {
            if (this.board[i] === '') {
                // 一時的に手を置いて勝利判定
                this.board[i] = player;
                if (this.checkWinnerForPlayer(player)) {
                    // 勝利できる手を発見
                    const wouldLosePieces = this.wouldCpuLosePieces(i);
                    potentialMoves.push({
                        position: i,
                        wouldWin: true,
                        wouldLosePieces: wouldLosePieces
                    });
                    console.log(`Potential winning move at ${i}: wouldLosePieces=${wouldLosePieces}`);
                }
                this.board[i] = ''; // 元に戻す
            }
        }
        
        return potentialMoves;
    }

    async checkAndRemoveThrees() {
        console.log('=== CHECKING AND REMOVING THREES ===');
        console.log('Board before three removal:', [...this.board]);
        
        const directions = [
            [1, 0],   // 右
            [0, 1],   // 下
            [1, 1],   // 右下
            [1, -1]   // 右上
        ];
        
        const cellsToRemove = new Set();
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const index = row * 6 + col;
                if (this.board[index] === '') continue;
                console.log(`Checking index ${index} (${row}, ${col}) for player ${this.board[index]}`); // 追加
                
                for (let [dx, dy] of directions) {
                    console.log(`  Direction: [${dx}, ${dy}]`); // 追加
                    let count = 1;
                    let positions = [index];
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index] && this.board[index] !== '') {
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    console.log(`    Positive count: ${count}, positions:`, positions); // 追加
                    
                    // 負方向にカウント
                    let negCount = 0; // 負方向のカウントを初期化
                    let negPositions = [];
                    x = col - dx;
                    y = row - dy;
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index] && this.board[index] !== '') {
                            negCount++;
                            negPositions.push(nextIndex);
                            x -= dx;
                            y -= dy;
                        } else {
                            break;
                        }
                    }
                    
                    console.log(`    Negative count: ${negCount}, negPositions:`, negPositions); // 追加
                    
                    // 合計でちょうど三つ並んでいる場合、削除対象に追加
                    // ただし、すでにpositionsに含まれているものは追加しない（重複防止）
                    const totalCount = count + negCount;
                    console.log(`    Total count: ${totalCount}`); // 追加
                    if (totalCount === 3) {
                        console.log(`Three-in-a-row found: ${this.board[index]} at positions:`, [...positions, ...negPositions]);
                        [...positions, ...negPositions].forEach(pos => cellsToRemove.add(pos));
                    }
                }
            }
        }
        
        // 三つ並んだセルを削除
        if (cellsToRemove.size > 0) {
            console.log(`Removing ${cellsToRemove.size} cells in three-in-a-row pattern`);
            console.log('Cells to remove:', Array.from(cellsToRemove));

            // 削除対象のセルをハイライト表示
            cellsToRemove.forEach(index => {
                const cell = document.querySelector(`[data-index="${index}"]`);
                if (cell) {
                    cell.classList.add('highlight-for-removal');
                }
            });

            // ハイライト表示後、少し待ってから削除処理を開始
            await this.sleep(500); // ハイライト表示の遅延（0.5秒に調整）

            await this.removeCells(Array.from(cellsToRemove)); // awaitを追加

            // 削除処理完了後の整合性チェック
            // removeCells内で既にPromiseが解決されるため、ここでは不要
            const afterOCount = this.board.filter(cell => cell === 'o').length;
            const afterXCount = this.board.filter(cell => cell === 'x').length;
            console.log(`After removal check - O: ${afterOCount}, X: ${afterXCount}`);

            // ボードの整合性を確認
            if (this.board.some(cell => cell !== '' && cell !== 'o' && cell !== 'x')) {
                console.error('Invalid board state after three removal!');
                console.error('Board contains invalid values:', this.board);
            }

            console.log('Board after three removal:', [...this.board]);

            return true;
        }

        console.log('No three-in-a-row patterns found');
        return false;
    }

    showLoadingIndicator() {
        document.getElementById('loading-indicator').style.display = 'flex';
    }

    hideLoadingIndicator() {
        document.getElementById('loading-indicator').style.display = 'none';
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
