(function () {
  const BOARD_SIZE = 6;
  const EMPTY = null;
  const PLAYER_X = 'X';
  const PLAYER_O = 'O';

  const DIRECTIONS = [
    { dr: 0, dc: 1 },  // →
    { dr: 1, dc: 0 },  // ↓
    { dr: 1, dc: 1 },  // ↘
    { dr: 1, dc: -1 }, // ↙
  ];

  const boardEl = document.getElementById('board');
  const turnInfoEl = document.getElementById('turn-info');
  const messageEl = document.getElementById('message');
  const resetBtn = document.getElementById('btn-reset');
  const gravUpBtn = document.getElementById('g-up');
  const gravDownBtn = document.getElementById('g-down');
  const gravLeftBtn = document.getElementById('g-left');
  const gravRightBtn = document.getElementById('g-right');

  /** @typedef {'up' | 'down' | 'left' | 'right'} GravityDirection */

  /** @type {{ board: (('X'|'O'|null)[])[]; currentPlayer: 'X'|'O'; gameOver: boolean; winner: null|'X'|'O'|'draw'; turn: number; }} */
  const state = {
    board: createEmptyBoard(),
    currentPlayer: PLAYER_X,
    gameOver: false,
    winner: null,
    turn: 1,
  };

  function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
  }

  function resetGame() {
    state.board = createEmptyBoard();
    state.currentPlayer = PLAYER_X;
    state.gameOver = false;
    state.winner = null;
    state.turn = 1;
    messageEl.textContent = '';
    render();
  }

  function switchPlayer() {
    state.currentPlayer = state.currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    state.turn += 1;
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `r${r + 1} c${c + 1}`);
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        const v = state.board[r][c];
        cell.textContent = v ? v : '';
        if (v === PLAYER_X) cell.classList.add('x');
        if (v === PLAYER_O) cell.classList.add('o');
        if (!state.gameOver) {
          cell.addEventListener('click', onCellClick);
        } else {
          cell.disabled = true;
        }
        boardEl.appendChild(cell);
      }
    }

    const playerName = state.currentPlayer === PLAYER_X ? 'X' : 'O';
    turnInfoEl.textContent = state.gameOver
      ? ''
      : `手番: ${playerName}（ターン ${state.turn}） — 「マスをクリックして置く」または「重力」を選択`;

    resetBtn.disabled = false;
    [gravUpBtn, gravDownBtn, gravLeftBtn, gravRightBtn].forEach((b) => {
      b.disabled = state.gameOver;
    });

    if (state.gameOver) {
      if (state.winner === 'draw') {
        messageEl.textContent = '同時に4列以上が発生しました。引き分けです。';
        messageEl.className = 'message draw';
      } else if (state.winner) {
        messageEl.textContent = `${state.winner} の勝ち！`;
        messageEl.className = 'message winner';
      }
    } else {
      messageEl.className = 'message';
    }
  }

  function onCellClick(e) {
    const target = e.currentTarget;
    const r = Number(target.dataset.r);
    const c = Number(target.dataset.c);
    if (state.gameOver) return;
    if (state.board[r][c] !== EMPTY) {
      flashMessage('そのマスには置けません', 1000);
      return;
    }
    state.board[r][c] = state.currentPlayer;

    // First check immediate wins (4+ in a line)
    const { winners, tripleCells } = scanBoard(state.board);
    if (winners.size > 0) {
      endWithWinners(winners);
      render();
      return;
    }

    // Remove exact triples (for both players) — no cascade on placement
    if (tripleCells.size > 0) {
      removeCells(state.board, tripleCells);
    }

    switchPlayer();
    render();
  }

  function endWithWinners(winnersSet) {
    state.gameOver = true;
    if (winnersSet.size >= 2) {
      state.winner = 'draw';
    } else {
      state.winner = [...winnersSet][0];
    }
  }

  function scanBoard(board) {
    /** @type {Set<'X'|'O'>} */
    const winners = new Set();
    /** @type {Set<string>} */
    const tripleCells = new Set();

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const symbol = board[r][c];
        if (!symbol) continue;
        for (const { dr, dc } of DIRECTIONS) {
          const prevR = r - dr;
          const prevC = c - dc;
          if (inBounds(prevR, prevC) && board[prevR][prevC] === symbol) {
            continue; // not a run start
          }
          let len = 0;
          /** @type {[number, number][]} */
          const cells = [];
          let rr = r;
          let cc = c;
          while (inBounds(rr, cc) && board[rr][cc] === symbol) {
            len++;
            cells.push([rr, cc]);
            rr += dr;
            cc += dc;
          }
          if (len >= 4) {
            winners.add(symbol);
          } else if (len === 3) {
            for (const [cr, cc2] of cells) tripleCells.add(key(cr, cc2));
          }
        }
      }
    }
    return { winners, tripleCells };
  }

  function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  function key(r, c) { return `${r},${c}`; }

  function removeCells(board, cellsSet) {
    for (const pos of cellsSet) {
      const [r, c] = pos.split(',').map(Number);
      board[r][c] = EMPTY;
    }
  }

  /**
   * Apply one gravity compression in-place.
   * @param {('up'|'down'|'left'|'right')} dir
   */
  function applyGravityOnce(board, dir) {
    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < BOARD_SIZE; r++) {
        const row = board[r];
        const vals = row.filter(Boolean);
        const empties = Array(BOARD_SIZE - vals.length).fill(EMPTY);
        if (dir === 'left') {
          board[r] = [...vals, ...empties];
        } else {
          board[r] = [...empties, ...vals];
        }
      }
    } else {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const vals = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          const v = board[r][c];
          if (v) vals.push(v);
        }
        const empties = Array(BOARD_SIZE - vals.length).fill(EMPTY);
        if (dir === 'up') {
          for (let r = 0; r < BOARD_SIZE; r++) {
            board[r][c] = r < vals.length ? vals[r] : EMPTY;
          }
        } else {
          let idx = 0;
          for (let r = 0; r < BOARD_SIZE; r++) {
            const targetR = BOARD_SIZE - vals.length + r;
            board[r][c] = EMPTY;
            if (targetR >= 0 && targetR < BOARD_SIZE && r < vals.length) {
              // fill bottom-aligned
            }
          }
          // Simpler: write bottom-up
          for (let r = 0; r < BOARD_SIZE; r++) board[r][c] = EMPTY;
          for (let i = 0; i < vals.length; i++) {
            const rr = BOARD_SIZE - vals.length + i;
            board[rr][c] = vals[i];
          }
        }
      }
    }
  }

  /**
   * Full gravity turn with cascade logic.
   * - Compress once
   * - If 4+ anywhere: win (owner wins)
   * - If exact triples exist: remove all, compress again, and repeat
   * Stops when no triples and no winners are found after a compression.
   * @param {GravityDirection} dir
   */
  function performGravityCascade(dir) {
    if (state.gameOver) return;

    // First compression
    applyGravityOnce(state.board, dir);

    while (true) {
      // Check for winners immediately after a compression
      let { winners, tripleCells } = scanBoard(state.board);
      if (winners.size > 0) {
        endWithWinners(winners);
        return;
      }

      if (tripleCells.size === 0) {
        break; // No more events
      }

      // Remove all triples simultaneously
      removeCells(state.board, tripleCells);
      // Compress again in the same direction to fill gaps
      applyGravityOnce(state.board, dir);

      // Loop to re-check winners/triples
    }
  }

  function onGravity(dir) {
    if (state.gameOver) return;
    performGravityCascade(dir);
    if (!state.gameOver) {
      switchPlayer();
    }
    render();
  }

  function flashMessage(text, ms) {
    const prev = messageEl.textContent;
    messageEl.textContent = text;
    messageEl.className = 'message';
    if (ms) setTimeout(() => { if (!state.gameOver) { messageEl.textContent = prev || ''; } }, ms);
  }

  resetBtn.addEventListener('click', resetGame);
  gravUpBtn.addEventListener('click', () => onGravity('up'));
  gravDownBtn.addEventListener('click', () => onGravity('down'));
  gravLeftBtn.addEventListener('click', () => onGravity('left'));
  gravRightBtn.addEventListener('click', () => onGravity('right'));

  // Initial mount
  render();
})();

