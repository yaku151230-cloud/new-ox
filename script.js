
class TicTacToe {
    constructor() {
        this.board = Array(36).fill('');
        this.currentPlayer = 'o';
        this.gameActive = true;
        this.scores = { o: 0, x: 0 };
        this.gravityUsed = { o: false, x: false };
        this.lastGravityDirection = null; // 最後に使った重力の方向を保存
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.bindEvents();
        this.updateStatus();
        this.updateScores();
        this.updateGravityButton();
    }
    
    bindEvents() {
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
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        
        // モーダルの外側クリックで閉じる
        document.getElementById('winner-modal').addEventListener('click', (e) => {
            if (e.target.id === 'winner-modal') {
                this.hideWinnerModal();
            }
        });
    }
    
    handleCellClick(e) {
        if (!this.gameActive) return;
        
        const cell = e.target;
        const index = parseInt(cell.dataset.index);
        
        if (this.board[index] !== '') return;
        
        this.makeMove(index);
    }
    
    makeMove(index) {
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        // 勝利判定（四つ以上並んだ場合）
        if (this.checkWinner()) {
            this.endGame();
            return;
        }
        
        // 三つ並んだ場合の処理
        this.checkAndRemoveThrees();
        
        // 引き分け判定
        if (this.checkDraw()) {
            this.endGame(true);
            return;
        }
        
        this.switchPlayer();
        this.updateStatus();
        this.updateGravityButton();
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
    
    useGravity(direction) {
        if (this.gravityUsed[this.currentPlayer]) return;
        
        console.log(`重力を使用: ${direction}方向`); // デバッグ用
        
        // 重力を使用済みにする
        this.gravityUsed[this.currentPlayer] = true;
        
        // 重力の方向を保存
        this.lastGravityDirection = direction;
        
        // 重力を適用（アニメーション完了を待たない）
        this.applyGravity(direction);
        
        // 方向選択を隠す
        document.getElementById('gravity-directions').style.display = 'none';
        
        // 重力後の判定（少し待ってから開始）
        setTimeout(() => {
            this.afterGravityCheck();
        }, 700);
        
        // 手番を変更
        this.switchPlayer();
        this.updateStatus();
        this.updateGravityButton();
    }
    
    async applyGravity(direction) {
        console.log(`重力適用開始: ${direction}方向`); // デバッグ用
        
        const newBoard = Array(36).fill('');
        const moves = []; // 移動情報を格納
        
        if (direction === 'up') {
            // 上方向の重力（上から詰める）
            console.log('上方向の重力を適用');
            for (let col = 0; col < 6; col++) {
                let writeIndex = col;
                for (let row = 0; row < 6; row++) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex += 6;
                    }
                }
            }
        } else if (direction === 'down') {
            // 下方向の重力（下から詰める）
            console.log('下方向の重力を適用');
            for (let col = 0; col < 6; col++) {
                let writeIndex = 30 + col; // 一番下の行
                for (let row = 5; row >= 0; row--) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex -= 6;
                    }
                }
            }
        } else if (direction === 'left') {
            // 左方向の重力（左から詰める）
            console.log('左方向の重力を適用');
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6;
                for (let col = 0; col < 6; col++) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex++;
                    }
                }
            }
        } else if (direction === 'right') {
            // 右方向の重力（右から詰める）
            console.log('右方向の重力を適用');
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6 + 5; // 一番右の列
                for (let col = 5; col >= 0; col--) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex--;
                    }
                }
            }
        }
        
        console.log('重力適用前のボード:', this.board);
        console.log('重力適用後のボード:', newBoard);
        console.log('移動するコマの数:', moves.length);
        
        // ボードを先に更新（判定処理を並行実行するため）
        this.board = newBoard;
        
        // 移動アニメーションと判定処理を並行実行
        if (moves.length > 0) {
            // アニメーションを開始（完了を待たない）
            this.animateGravityMoves(moves);
            
            // 少し待ってから判定処理を開始（アニメーションと並行）
            setTimeout(() => {
                this.updateBoardDisplay();
            }, 700);
        } else {
            this.updateBoardDisplay();
        }
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
            
            // 次のステップまで少し待つ（速度アップ）
            if (step < maxDistance) {
                await this.sleep(60); // 100ms → 60ms に短縮
            }
        }
        
        console.log('重力移動アニメーション完了');
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
            }, 50);
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
            // 上方向：行番号が減少
            currentRow = Math.max(toRow, fromRow - step);
            currentCol = fromCol;
        } else if (direction === 'down') {
            // 下方向：行番号が増加
            currentRow = Math.min(toRow, fromRow + step);
            currentCol = fromCol;
        } else if (direction === 'left') {
            // 左方向：列番号が減少
            currentRow = fromRow;
            currentCol = Math.max(toCol, fromCol - step);
        } else if (direction === 'right') {
            // 右方向：列番号が増加
            currentRow = fromRow;
            currentCol = Math.min(toCol, fromCol + step);
        }
        
        return currentRow * 6 + currentCol;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const value = this.board[index];
            if (value !== '') {
                cell.textContent = value === 'o' ? '〇' : '✕';
                cell.classList.remove('o', 'x');
                cell.classList.add(value);
                cell.classList.add('moving');
                setTimeout(() => {
                    cell.classList.remove('moving');
                }, 300);
            } else {
                cell.textContent = '';
                cell.classList.remove('o', 'x', 'moving');
                cell.style.background = '';
                cell.style.boxShadow = '';
            }
        });
    }
    
    afterGravityCheck() {
        // 重力後の勝利判定
        const oWins = this.checkWinnerForPlayer('o');
        const xWins = this.checkWinnerForPlayer('x');
        
        if (oWins && xWins) {
            // 両方とも四つ以上並んでいる場合、ドロー
            this.endGame(true, '重力で両者とも四つ以上並んだため、引き分けです！');
            return;
        } else if (oWins) {
            this.endGame(false, '〇が重力で四つ以上並んで勝ちました！');
            return;
        } else if (xWins) {
            this.endGame(false, '✕が重力で四つ以上並んで勝ちました！');
            return;
        }
        
        // 三つ並びの処理（連鎖重力）
        this.checkAndRemoveThreesWithChainGravity();
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
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === player) {
                            count++;
                            x += dx;
                            y += dy;
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
    
    checkAndRemoveThreesWithChainGravity() {
        this.processChainGravity(0);
    }
    
    processChainGravity(chainCount) {
        if (chainCount >= 10) return; // 最大10回まで
        
        console.log(`連鎖重力処理 ${chainCount + 1}回目`); // デバッグ用
        
        // 三つ並びをチェック
        const hasRemovals = this.checkAndRemoveThrees();
        
        if (hasRemovals) {
            console.log(`${chainCount + 1}回目: 三つ並びを検出、削除処理開始`); // デバッグ用
            
            // 少し待ってから連鎖重力を適用
            setTimeout(() => {
                console.log(`${chainCount + 1}回目: 連鎖重力で空白を埋める（方向: ${this.lastGravityDirection}）`); // デバッグ用
                
                // 連鎖重力で空白を埋める（重力を使った方向と同じ）
                this.fillEmptySpacesWithDirection(this.lastGravityDirection).then(() => {
                    this.updateBoardDisplay();
                    
                    // 空白を埋めた後、最優先で四つ以上並びの判定
                    setTimeout(() => {
                        console.log(`${chainCount + 1}回目: 四つ以上並びの判定を実行`); // デバッグ用
                        
                        // 最優先で四つ以上並びの判定（勝利/ドロー）
                        const oWins = this.checkWinnerForPlayer('o');
                        const xWins = this.checkWinnerForPlayer('x');
                        
                        if (oWins && xWins) {
                            // 両方とも四つ以上並んでいる場合、ドロー
                            console.log('連鎖重力中にドローを検出');
                            this.endGame(true, '重力で両者とも四つ以上並んだため、引き分けです！');
                            return;
                        } else if (oWins) {
                            console.log('連鎖重力中に〇の勝利を検出');
                            this.endGame(false, '〇が重力で四つ以上並んで勝ちました！');
                            return;
                        } else if (xWins) {
                            console.log('連鎖重力中に✕の勝利を検出');
                            this.endGame(false, '✕が重力で四つ以上並んで勝ちました！');
                            return;
                        }
                        
                        // 四つ以上並びがない場合のみ、次の連鎖をチェック
                        console.log(`${chainCount + 1}回目: 四つ以上並びなし、次の連鎖をチェック`);
                        this.processChainGravity(chainCount + 1);
                    }, 500);
                });
            }, 500); // 削除アニメーション完了後
        } else {
            console.log(`連鎖重力終了: ${chainCount}回の処理を完了`); // デバッグ用
        }
    }
    
    async fillEmptySpacesWithDirection(direction) {
        console.log(`空白を埋める重力を適用（方向: ${direction}）`); // デバッグ用
        
        const newBoard = Array(36).fill('');
        const moves = []; // 移動情報を格納
        
        if (direction === 'up') {
            // 上方向の重力（上から詰める）
            for (let col = 0; col < 6; col++) {
                let writeIndex = col;
                for (let row = 0; row < 6; row++) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex += 6;
                    }
                }
            }
        } else if (direction === 'down') {
            // 下方向の重力（下から詰める）
            for (let col = 0; col < 6; col++) {
                let writeIndex = 30 + col; // 一番下の行
                for (let row = 5; row >= 0; row--) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex -= 6;
                    }
                }
            }
        } else if (direction === 'left') {
            // 左方向の重力（左から詰める）
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6;
                for (let col = 0; col < 6; col++) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex++;
                    }
                }
            }
        } else if (direction === 'right') {
            // 右方向の重力（右から詰める）
            for (let row = 0; row < 6; row++) {
                let writeIndex = row * 6 + 5; // 一番右の列
                for (let col = 5; col >= 0; col--) {
                    const readIndex = row * 6 + col;
                    if (this.board[readIndex] !== '') {
                        newBoard[writeIndex] = this.board[readIndex];
                        if (readIndex !== writeIndex) {
                            moves.push({
                                from: readIndex,
                                to: writeIndex,
                                value: this.board[readIndex]
                            });
                        }
                        writeIndex--;
                    }
                }
            }
        }
        
        console.log('空白埋め前のボード:', this.board);
        console.log('空白埋め後のボード:', newBoard);
        console.log('連鎖重力で移動するコマの数:', moves.length);
        
        // 移動アニメーションを実行
        if (moves.length > 0) {
            await this.animateGravityMoves(moves);
        }
        
        this.board = newBoard;
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
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index]) {
                            count++;
                            x += dx;
                            y += dy;
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
    
    checkAndRemoveThrees() {
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
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index];
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index]) {
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // ちょうど三つ並んでいる場合、削除対象に追加
                    if (count === 3) {
                        positions.forEach(pos => cellsToRemove.add(pos));
                    }
                }
            }
        }
        
        // 三つ並んだセルを削除
        if (cellsToRemove.size > 0) {
            this.removeCells(Array.from(cellsToRemove));
            return true;
        }
        
        return false;
    }
    
    removeCells(indices) {
        indices.forEach(index => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('removing');
            
            setTimeout(() => {
                this.board[index] = '';
                cell.textContent = '';
                cell.classList.remove('o', 'x', 'removing');
                cell.style.background = '';
                cell.style.boxShadow = '';
            }, 500);
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
    
    updateScores() {
        document.getElementById('score-o').textContent = this.scores.o;
        document.getElementById('score-x').textContent = this.scores.x;
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
        this.gameActive = false;
        
        if (isDraw) {
            const message = customMessage || '引き分けです！';
            this.showWinnerModal(message);
        } else {
            const winner = this.currentPlayer === 'o' ? '〇' : '✕';
            this.scores[this.currentPlayer]++;
            this.updateScores();
            const message = customMessage || `${winner}が勝ちました！`;
            this.showWinnerModal(message);
        }
    }
    
    showWinnerModal(message) {
        const modal = document.getElementById('winner-modal');
        const winnerText = document.getElementById('winner-text');
        
        winnerText.textContent = message;
        modal.style.display = 'flex';
        
        const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        // 既存のイベントリスナーを削除
        playAgainBtn.replaceWith(playAgainBtn.cloneNode(true));
        
        // 新しいイベントリスナーを設定
        document.getElementById('play-again-btn').addEventListener('click', () => {
            console.log('もう一度プレイボタンがクリックされました');
            this.playAgain();
        });
    }
}
    
    hideWinnerModal() {
        document.getElementById('winner-modal').style.display = 'none';
    }
    
    highlightWinningLine() {
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
                
                for (let [dx, dy] of directions) {
                    let count = 1;
                    let positions = [index];
                    let x = col + dx;
                    let y = row + dy;
                    
                    // 正方向にカウント
                    while (x >= 0 && x < 6 && y >= 0 && y < 6) {
                        const nextIndex = y * 6 + x;
                        if (this.board[nextIndex] === this.board[index]) {
                            count++;
                            positions.push(nextIndex);
                            x += dx;
                            y += dy;
                        } else {
                            break;
                        }
                    }
                    
                    // 四つ以上並んでいる場合、ハイライト
                    if (count >= 4) {
                        positions.forEach(pos => {
                            const cell = document.querySelector(`[data-index="${pos}"]`);
                            cell.style.background = 'linear-gradient(145deg, #ffd700, #ffed4e)';
                            cell.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
                        });
                        return;
                    }
                }
            }
        }
    }
    
    resetGame() {
        this.board = Array(36).fill('');
        this.currentPlayer = 'o';
        this.gameActive = true;
        this.gravityUsed = { o: false, x: false };
        this.lastGravityDirection = null; // 重力方向もリセット
        
        this.clearBoard();
        this.updateStatus();
        this.updateScores();
        this.updateGravityButton();
        this.hideWinnerModal();
        document.getElementById('gravity-directions').style.display = 'none';
    }
    
    
    playAgain() {
        this.resetGame(); // ゲームをリセット
    }
    
    clearBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('o', 'x', 'removing', 'moving');
            cell.style.background = '';
            cell.style.boxShadow = '';
        });
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
