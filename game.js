const BOARD_SIZE = 12;
const STARTING_BUDGET = 35;
const PLAYER_DEPLOY_START = 9;
const ENEMY_DEPLOY_END = 2;
const ACTION_THRESHOLD = 10;
const FILES = "ABCDEFGHIJKL";

const PIECES = {
  pawn: {
    label: "Pawn",
    symbols: { player: "♙", enemy: "♟" },
    cost: 1,
    hp: 1,
    damage: 1,
    speed: 2,
    role: "melee",
  },
  knight: {
    label: "Knight",
    symbols: { player: "♘", enemy: "♞" },
    cost: 3,
    hp: 3,
    damage: 2,
    speed: 3,
    role: "leaper",
  },
  bishop: {
    label: "Bishop",
    symbols: { player: "♗", enemy: "♝" },
    cost: 4,
    hp: 2,
    damage: 2,
    speed: 2,
    role: "ranged",
  },
  rook: {
    label: "Rook",
    symbols: { player: "♖", enemy: "♜" },
    cost: 5,
    hp: 4,
    damage: 2,
    speed: 1,
    role: "ranged",
  },
  queen: {
    label: "Queen",
    symbols: { player: "♕", enemy: "♛" },
    cost: 9,
    hp: 4,
    damage: 3,
    speed: 2,
    role: "ranged",
  },
  king: {
    label: "King",
    symbols: { player: "♔", enemy: "♚" },
    cost: 8,
    hp: 6,
    damage: 2,
    speed: 1,
    role: "melee",
  },
};

const SPEEDS = {
  slow: { loopDelay: 900, effect: 620 },
  normal: { loopDelay: 460, effect: 360 },
  fast: { loopDelay: 150, effect: 180 },
};

const boardEl = document.getElementById("board");
const effectLayer = document.getElementById("effectLayer");
const pieceShopEl = document.getElementById("pieceShop");
const actionLogEl = document.getElementById("actionLog");
const battleStateEl = document.getElementById("battleState");
const budgetValueEl = document.getElementById("budgetValue");
const playerCountEl = document.getElementById("playerCount");
const enemyCountEl = document.getElementById("enemyCount");
const placementHintEl = document.getElementById("placementHint");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const stepButton = document.getElementById("stepButton");
const resetButton = document.getElementById("resetButton");
const removeModeButton = document.getElementById("removeModeButton");
const speedSelect = document.getElementById("speedSelect");
const clearLogButton = document.getElementById("clearLogButton");

const state = {
  pieces: [],
  budget: STARTING_BUDGET,
  selectedType: "pawn",
  removeMode: false,
  phase: "setup",
  result: null,
  speed: "normal",
  activeId: null,
  destination: null,
  actionBusy: false,
  loopRunning: false,
  nextId: 1,
  actionNumber: 0,
  ticks: 0,
  log: [],
};

function createPiece(side, type, row, col) {
  const template = PIECES[type];
  return {
    id: state.nextId++,
    side,
    type,
    row,
    col,
    hp: template.hp,
    maxHp: template.hp,
    damage: template.damage,
    speed: template.speed,
    initiative: 0,
  };
}

function resetState() {
  state.pieces = [];
  state.budget = STARTING_BUDGET;
  state.selectedType = "pawn";
  state.removeMode = false;
  state.phase = "setup";
  state.result = null;
  state.activeId = null;
  state.destination = null;
  state.actionBusy = false;
  state.loopRunning = false;
  state.nextId = 1;
  state.actionNumber = 0;
  state.ticks = 0;
  state.log = [];
  placeEnemyArmy();
  addLog("Scenario ready: Black deploys 20 pawns and 10 knights. White has 35 points to spend.", "system");
  render();
}

function placeEnemyArmy() {
  for (let col = 1; col <= 10; col += 1) {
    state.pieces.push(createPiece("enemy", "knight", 0, col));
  }
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    state.pieces.push(createPiece("enemy", "pawn", 1, col));
  }
  for (let col = 2; col <= 9; col += 1) {
    state.pieces.push(createPiece("enemy", "pawn", 2, col));
  }
}

function render() {
  renderShop();
  renderBoard();
  renderStatus();
  renderLog();
}

function renderShop() {
  pieceShopEl.innerHTML = "";
  Object.entries(PIECES).forEach(([type, piece]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `piece-button${state.selectedType === type ? " selected" : ""}`;
    button.disabled = state.phase !== "setup";
    button.dataset.type = type;

    const symbol = document.createElement("span");
    symbol.className = "symbol";
    symbol.textContent = piece.symbols.player;

    const label = document.createElement("span");
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = piece.label;
    const stats = document.createElement("span");
    stats.className = "stats";
    stats.textContent = `HP ${piece.hp}  DMG ${piece.damage}  SPD ${piece.speed}`;
    label.append(name, stats);

    const cost = document.createElement("span");
    cost.className = "cost";
    cost.textContent = piece.cost;

    button.append(symbol, label, cost);
    button.addEventListener("click", () => {
      state.selectedType = type;
      state.removeMode = false;
      render();
    });
    pieceShopEl.appendChild(button);
  });
}

function renderBoard() {
  boardEl.innerHTML = "";
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `cell ${(row + col) % 2 === 0 ? "light" : "dark"}`;
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", squareName(row, col));

      if (row >= PLAYER_DEPLOY_START) {
        cell.classList.add("player-zone");
      }
      if (row <= ENEMY_DEPLOY_END) {
        cell.classList.add("enemy-zone");
      }

      const occupyingPiece = pieceAt(row, col);
      if (state.phase === "setup" && row >= PLAYER_DEPLOY_START && !occupyingPiece && state.budget >= PIECES[state.selectedType].cost && !state.removeMode) {
        cell.classList.add("valid-deploy");
      }
      if (state.phase === "setup" && occupyingPiece?.side === "player") {
        cell.classList.add("remove-ready");
      }
      if (state.activeId && occupyingPiece?.id === state.activeId) {
        cell.classList.add("active-unit");
      }
      if (state.destination && state.destination.row === row && state.destination.col === col) {
        cell.classList.add("move-destination");
      }

      const coord = document.createElement("span");
      coord.className = "coord";
      coord.textContent = squareName(row, col);
      cell.appendChild(coord);

      if (occupyingPiece) {
        cell.appendChild(renderPiece(occupyingPiece));
      }

      cell.addEventListener("click", () => handleCellClick(row, col));
      cell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        removePlayerPiece(row, col);
      });
      boardEl.appendChild(cell);
    }
  }
}

function renderPiece(piece) {
  const template = PIECES[piece.type];
  const pieceEl = document.createElement("div");
  pieceEl.className = `piece ${piece.side} ${piece.type}`;
  pieceEl.title = `${sideName(piece.side)} ${template.label}: ${piece.hp}/${piece.maxHp} HP, ${piece.initiative} initiative`;

  const symbol = document.createElement("span");
  symbol.className = "piece-symbol";
  symbol.textContent = template.symbols[piece.side];

  const hpWrap = document.createElement("span");
  hpWrap.className = "hp-wrap";
  const hpText = document.createElement("span");
  hpText.className = "hp-text";
  hpText.textContent = `${piece.hp}/${piece.maxHp}`;
  const hpBar = document.createElement("span");
  hpBar.className = "hp-bar";
  const hpFill = document.createElement("span");
  hpFill.className = "hp-fill";
  hpFill.style.width = `${Math.max(0, (piece.hp / piece.maxHp) * 100)}%`;
  hpBar.appendChild(hpFill);
  hpWrap.append(hpText, hpBar);

  pieceEl.append(symbol, hpWrap);
  return pieceEl;
}

function renderStatus() {
  const playerCount = sidePieces("player").length;
  const enemyCount = sidePieces("enemy").length;
  budgetValueEl.textContent = String(state.budget);
  playerCountEl.textContent = String(playerCount);
  enemyCountEl.textContent = String(enemyCount);

  const stateLabels = {
    setup: "Setup",
    running: "Running",
    paused: "Paused",
    ended: state.result === "victory" ? "Victory" : state.result === "defeat" ? "Defeat" : "Ended",
  };
  battleStateEl.textContent = stateLabels[state.phase];

  startButton.disabled = state.phase === "running" || state.phase === "ended" || state.actionBusy;
  pauseButton.disabled = state.phase === "setup" || state.phase === "ended" || state.actionBusy;
  pauseButton.textContent = state.phase === "paused" ? "Resume" : "Pause";
  stepButton.disabled = state.phase === "ended" || state.actionBusy;
  resetButton.disabled = state.actionBusy;
  removeModeButton.disabled = state.phase !== "setup";
  removeModeButton.classList.toggle("active", state.removeMode);

  if (state.phase === "setup") {
    const selected = PIECES[state.selectedType];
    placementHintEl.textContent = state.removeMode
      ? "Remove mode is active. Click a white piece to refund it."
      : `Selected ${selected.label}. Click a blue square to place it for ${selected.cost}. Right-click white pieces to refund.`;
  } else {
    placementHintEl.textContent = "Deployment is locked until reset.";
  }
}

function renderLog() {
  actionLogEl.innerHTML = "";
  state.log.slice(-120).forEach((entry) => {
    const line = document.createElement("div");
    line.className = `log-entry ${entry.kind || ""}`;
    if (entry.number) {
      const prefix = document.createElement("strong");
      prefix.textContent = `${entry.number}. `;
      line.append(prefix);
    }
    line.append(document.createTextNode(entry.text));
    actionLogEl.appendChild(line);
  });
  actionLogEl.scrollTop = actionLogEl.scrollHeight;
}

function handleCellClick(row, col) {
  if (state.phase !== "setup") {
    return;
  }
  if (state.removeMode) {
    removePlayerPiece(row, col);
    return;
  }
  placePlayerPiece(row, col);
}

function placePlayerPiece(row, col) {
  const template = PIECES[state.selectedType];
  if (row < PLAYER_DEPLOY_START) {
    addLog(`White can only deploy in the bottom 3 rows. ${squareName(row, col)} is outside the blue zone.`, "system");
    render();
    return;
  }
  if (pieceAt(row, col)) {
    addLog(`${squareName(row, col)} is already occupied.`, "system");
    render();
    return;
  }
  if (state.budget < template.cost) {
    addLog(`Not enough budget for a White ${template.label}.`, "system");
    render();
    return;
  }
  state.budget -= template.cost;
  const piece = createPiece("player", state.selectedType, row, col);
  state.pieces.push(piece);
  addLog(`White ${template.label} deployed on ${squareName(row, col)} for ${template.cost}.`, "system");
  render();
}

function removePlayerPiece(row, col) {
  if (state.phase !== "setup") {
    return;
  }
  const piece = pieceAt(row, col);
  if (!piece || piece.side !== "player") {
    return;
  }
  state.pieces = state.pieces.filter((item) => item.id !== piece.id);
  state.budget += PIECES[piece.type].cost;
  addLog(`White ${PIECES[piece.type].label} removed from ${squareName(row, col)}. Refunded ${PIECES[piece.type].cost}.`, "system");
  render();
}

function addLog(text, kind = "action", number = null) {
  state.log.push({ text, kind, number });
}

function addActionLog(text) {
  state.actionNumber += 1;
  addLog(text, "action", state.actionNumber);
}

function startBattle() {
  if (state.phase === "ended") {
    return;
  }
  if (!ensurePlayerArmy()) {
    return;
  }
  if (state.phase === "setup") {
    state.phase = "running";
    addLog("Battle begins. Initiative ticks until the first unit reaches 10.", "system");
  } else if (state.phase === "paused") {
    state.phase = "running";
    addLog("Battle resumes.", "system");
  }
  render();
  runLoop();
}

function togglePause() {
  if (state.phase === "running") {
    state.phase = "paused";
    addLog("Battle paused.", "system");
    render();
    return;
  }
  if (state.phase === "paused") {
    startBattle();
  }
}

async function stepOneAction() {
  if (state.actionBusy || state.phase === "ended") {
    return;
  }
  if (!ensurePlayerArmy()) {
    return;
  }
  if (state.phase === "setup") {
    state.phase = "paused";
    addLog("Battle begins in step mode.", "system");
  } else if (state.phase === "running") {
    state.phase = "paused";
    addLog("Battle paused for step mode.", "system");
  }
  render();
  await takeOneAction();
}

function ensurePlayerArmy() {
  if (sidePieces("player").length > 0) {
    return true;
  }
  addLog("Place at least one white piece before starting battle.", "system");
  render();
  return false;
}

async function runLoop() {
  if (state.loopRunning) {
    return;
  }
  state.loopRunning = true;
  while (state.phase === "running" && !state.actionBusy) {
    await takeOneAction();
    if (state.phase !== "running") {
      break;
    }
    await sleep(SPEEDS[state.speed].loopDelay);
  }
  state.loopRunning = false;
}

async function takeOneAction() {
  if (state.actionBusy || state.phase === "ended") {
    return;
  }
  if (checkEndState()) {
    render();
    return;
  }

  state.actionBusy = true;
  const actor = chooseNextActor();
  if (!actor) {
    state.actionBusy = false;
    return;
  }

  state.activeId = actor.id;
  state.destination = null;
  render();
  await sleep(Math.min(140, SPEEDS[state.speed].effect / 3));

  const action = decideAction(actor);
  actor.initiative = Math.max(0, actor.initiative - ACTION_THRESHOLD);

  if (action.kind === "attack") {
    await resolveAttack(actor, action.target);
  } else if (action.kind === "move") {
    await resolveMove(actor, action.move, action.reason);
  } else {
    addActionLog(`${pieceName(actor)} from ${squareName(actor.row, actor.col)} holds. No useful move or attack is available.`);
  }

  state.activeId = null;
  state.destination = null;
  checkEndState();
  state.actionBusy = false;
  render();
}

function chooseNextActor() {
  let living = state.pieces.filter((piece) => piece.hp > 0);
  if (living.length === 0) {
    return null;
  }

  let ready = living.filter((piece) => piece.initiative >= ACTION_THRESHOLD);
  while (ready.length === 0) {
    living.forEach((piece) => {
      piece.initiative += piece.speed;
    });
    state.ticks += 1;
    ready = living.filter((piece) => piece.initiative >= ACTION_THRESHOLD);
  }

  return ready.sort(compareInitiative)[0];
}

function compareInitiative(a, b) {
  if (b.initiative !== a.initiative) {
    return b.initiative - a.initiative;
  }
  if (a.side !== b.side) {
    return a.side === "player" ? -1 : 1;
  }
  if (b.speed !== a.speed) {
    return b.speed - a.speed;
  }
  return a.id - b.id;
}

function decideAction(actor) {
  const target = chooseAttackTarget(actor);
  if (target) {
    return { kind: "attack", target };
  }
  const move = chooseMove(actor);
  if (move) {
    return { kind: "move", move: { row: move.row, col: move.col }, reason: move.reason };
  }
  return { kind: "hold" };
}

function chooseAttackTarget(actor) {
  const candidates = sidePieces(opponentSide(actor.side)).filter((target) => canAttack(actor, target));
  if (candidates.length === 0) {
    return null;
  }
  return candidates.sort((a, b) => targetScore(actor, b) - targetScore(actor, a) || a.hp - b.hp || distance(actor, a) - distance(actor, b))[0];
}

function chooseMove(actor) {
  const moves = legalMoves(actor);
  if (moves.length === 0) {
    return null;
  }

  let best = null;
  let bestScore = -Infinity;
  const targets = sidePieces(opponentSide(actor.side));
  moves.forEach((move) => {
    let moveScore = -Infinity;
    let useful = false;
    let moveReason = "closing distance";
    targets.forEach((target) => {
      const fromDistance = distance(actor, target);
      const toDistance = distance(move, target);
      const attacksAfterMove = canAttackFrom(actor, move.row, move.col, target);
      let score = targetScore(actor, target) - toDistance * 3;

      if (attacksAfterMove) {
        score += PIECES[actor.type].role === "ranged" ? 180 : 120;
        useful = true;
        moveReason = PIECES[actor.type].role === "ranged" ? "creating a line of attack" : "setting up an attack";
      }
      if (toDistance < fromDistance) {
        score += (fromDistance - toDistance) * 16;
        useful = true;
      }
      if (PIECES[actor.type].role === "ranged" && hasAnyLineFrom(actor, move.row, move.col)) {
        score += 28;
        useful = true;
        moveReason = "opening a firing line";
      }
      if (score > moveScore) {
        moveScore = score;
      }
    });

    if (useful && moveScore > bestScore) {
      bestScore = moveScore;
      best = { row: move.row, col: move.col, reason: moveReason };
    }
  });

  return best;
}

async function resolveAttack(actor, target) {
  const from = { row: actor.row, col: actor.col };
  const to = { row: target.row, col: target.col };
  const targetStartHp = target.hp;
  const willKill = target.hp <= actor.damage;
  await animateAttack(actor, target, willKill);

  target.hp -= actor.damage;
  const targetLabel = pieceName(target);
  const actorLabel = pieceName(actor);
  const verb = attackVerb(actor);
  let message = `${actorLabel} from ${squareName(from.row, from.col)} ${verb} ${targetLabel} on ${squareName(to.row, to.col)} for ${actor.damage} damage.`;

  if (target.hp <= 0) {
    state.pieces = state.pieces.filter((piece) => piece.id !== target.id);
    message += ` ${targetLabel} destroyed.`;
    if (shouldMoveIntoTarget(actor)) {
      actor.row = to.row;
      actor.col = to.col;
      message += ` ${PIECES[actor.type].label} moves to ${squareName(to.row, to.col)}.`;
    } else {
      message += ` ${PIECES[actor.type].label} holds ${squareName(from.row, from.col)}.`;
    }
  } else {
    message += ` ${targetLabel} survives with ${target.hp}/${target.maxHp} HP.`;
    if (actor.type === "knight") {
      message += ` Knight returns to ${squareName(from.row, from.col)}.`;
    } else if (!shouldMoveIntoTarget(actor)) {
      message += ` ${PIECES[actor.type].label} stays on ${squareName(from.row, from.col)}.`;
    } else {
      message += ` ${PIECES[actor.type].label} stays on ${squareName(from.row, from.col)}.`;
    }
  }

  if (targetStartHp !== target.hp || willKill) {
    addActionLog(message);
  }
}

async function resolveMove(actor, move, reason) {
  const from = { row: actor.row, col: actor.col };
  state.destination = { row: move.row, col: move.col };
  render();
  await animateMove(actor, move);
  actor.row = move.row;
  actor.col = move.col;
  addActionLog(`${pieceName(actor)} from ${squareName(from.row, from.col)} moves to ${squareName(move.row, move.col)}, ${reason}.`);
}

function shouldMoveIntoTarget(actor) {
  return actor.type === "pawn" || actor.type === "king" || actor.type === "knight";
}

function attackVerb(actor) {
  if (actor.type === "knight") {
    return "leaps at";
  }
  if (PIECES[actor.type].role === "ranged") {
    return "fires at";
  }
  return "strikes";
}

function canAttack(actor, target) {
  return canAttackFrom(actor, actor.row, actor.col, target);
}

function canAttackFrom(actor, row, col, target) {
  if (actor.side === target.side) {
    return false;
  }
  const dr = target.row - row;
  const dc = target.col - col;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  const ignore = new Set([actor.id]);

  if (actor.type === "pawn") {
    const forward = actor.side === "player" ? -1 : 1;
    return dr === forward && absC <= 1;
  }
  if (actor.type === "king") {
    return Math.max(absR, absC) === 1;
  }
  if (actor.type === "knight") {
    return (absR === 2 && absC === 1) || (absR === 1 && absC === 2);
  }
  if (actor.type === "bishop") {
    return absR === absC && absR > 0 && isPathClear(row, col, target.row, target.col, ignore);
  }
  if (actor.type === "rook") {
    return (dr === 0 || dc === 0) && (absR + absC > 0) && isPathClear(row, col, target.row, target.col, ignore);
  }
  if (actor.type === "queen") {
    const straight = dr === 0 || dc === 0;
    const diagonal = absR === absC;
    return (straight || diagonal) && (absR + absC > 0) && isPathClear(row, col, target.row, target.col, ignore);
  }
  return false;
}

function legalMoves(piece) {
  if (piece.type === "pawn") {
    const forward = piece.side === "player" ? -1 : 1;
    return [
      { row: piece.row + forward, col: piece.col },
      { row: piece.row + forward, col: piece.col - 1 },
      { row: piece.row + forward, col: piece.col + 1 },
    ].filter((move) => isOpen(move.row, move.col));
  }
  if (piece.type === "king") {
    return surroundingDirections().map(([dr, dc]) => ({ row: piece.row + dr, col: piece.col + dc })).filter((move) => isOpen(move.row, move.col));
  }
  if (piece.type === "knight") {
    return [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ].map(([dr, dc]) => ({ row: piece.row + dr, col: piece.col + dc })).filter((move) => isOpen(move.row, move.col));
  }

  const directions = directionsFor(piece.type);
  const moves = [];
  directions.forEach(([dr, dc]) => {
    let row = piece.row + dr;
    let col = piece.col + dc;
    while (inBounds(row, col)) {
      if (pieceAt(row, col)) {
        break;
      }
      moves.push({ row, col });
      row += dr;
      col += dc;
    }
  });
  return moves;
}

function hasAnyLineFrom(actor, row, col) {
  return sidePieces(opponentSide(actor.side)).some((target) => canAttackFrom(actor, row, col, target));
}

function directionsFor(type) {
  const diagonals = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  const straights = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  if (type === "bishop") {
    return diagonals;
  }
  if (type === "rook") {
    return straights;
  }
  if (type === "queen") {
    return diagonals.concat(straights);
  }
  return [];
}

function surroundingDirections() {
  return [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
}

function isPathClear(fromRow, fromCol, toRow, toCol, ignoreIds = new Set()) {
  const stepRow = Math.sign(toRow - fromRow);
  const stepCol = Math.sign(toCol - fromCol);
  let row = fromRow + stepRow;
  let col = fromCol + stepCol;
  while (row !== toRow || col !== toCol) {
    if (pieceAt(row, col, ignoreIds)) {
      return false;
    }
    row += stepRow;
    col += stepCol;
  }
  return true;
}

function isOpen(row, col) {
  return inBounds(row, col) && !pieceAt(row, col);
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function pieceAt(row, col, ignoreIds = new Set()) {
  return state.pieces.find((piece) => piece.row === row && piece.col === col && !ignoreIds.has(piece.id)) || null;
}

function sidePieces(side) {
  return state.pieces.filter((piece) => piece.side === side && piece.hp > 0);
}

function opponentSide(side) {
  return side === "player" ? "enemy" : "player";
}

function targetScore(actor, target) {
  const value = PIECES[target.type].cost;
  const missingHp = target.maxHp - target.hp;
  const killBonus = target.hp <= actor.damage ? 55 : 0;
  return value * 12 + missingHp * 6 + killBonus + (target.maxHp - target.hp + 1);
}

function distance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

async function animateAttack(actor, target, willKill) {
  const duration = SPEEDS[state.speed].effect;
  if (actor.type === "knight") {
    await animateKnight(actor, target, willKill, duration);
    return;
  }
  const from = centerFor(actor.row, actor.col);
  const to = centerFor(target.row, target.col);
  if (!from || !to) {
    await sleep(duration);
    return;
  }

  if (PIECES[actor.type].role === "ranged") {
    const beam = document.createElement("div");
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    beam.className = `attack-beam ${actor.side}`;
    beam.style.left = `${from.x}px`;
    beam.style.top = `${from.y}px`;
    beam.style.width = `${length}px`;
    beam.style.setProperty("--beam-angle", `${angle}rad`);
    beam.style.setProperty("--effect-duration", `${duration}ms`);
    effectLayer.appendChild(beam);
  }

  const pulse = makePulse(to.x, to.y, actor.side, duration, "hit-pulse");
  effectLayer.appendChild(pulse);
  await sleep(duration);
  clearEffects();
}

async function animateKnight(actor, target, willKill, duration) {
  const from = centerFor(actor.row, actor.col);
  const to = centerFor(target.row, target.col);
  if (!from || !to) {
    await sleep(duration);
    return;
  }

  const token = document.createElement("div");
  token.className = `hop-token ${actor.side}`;
  token.textContent = PIECES[actor.type].symbols[actor.side];
  token.style.left = `${from.x}px`;
  token.style.top = `${from.y}px`;
  token.style.transform = "translate(-50%, -50%)";
  effectLayer.appendChild(token);
  effectLayer.appendChild(makePulse(to.x, to.y, actor.side, duration, "hit-pulse"));

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const arc = Math.min(-34, -Math.abs(dx + dy) / 8);
  const frames = willKill
    ? [
        { transform: "translate(-50%, -50%) scale(1)" },
        { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 + arc}px)) scale(1.16)` },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)` },
      ]
    : [
        { transform: "translate(-50%, -50%) scale(1)" },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.16)` },
        { transform: "translate(-50%, -50%) scale(1)" },
      ];

  const animation = token.animate(frames, {
    duration,
    easing: "cubic-bezier(.2,.8,.2,1)",
    fill: "forwards",
  });
  await animation.finished.catch(() => undefined);
  clearEffects();
}

async function animateMove(actor, move) {
  const duration = Math.max(160, SPEEDS[state.speed].effect * 0.8);
  const from = centerFor(actor.row, actor.col);
  const to = centerFor(move.row, move.col);
  if (!from || !to) {
    await sleep(duration);
    return;
  }
  const pulse = makePulse(to.x, to.y, actor.side, duration, "move-pulse");
  effectLayer.appendChild(pulse);
  await sleep(duration);
  clearEffects();
}

function makePulse(x, y, side, duration, className) {
  const pulse = document.createElement("div");
  pulse.className = `${className} ${side}`;
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.style.setProperty("--effect-duration", `${duration}ms`);
  return pulse;
}

function clearEffects() {
  effectLayer.innerHTML = "";
}

function centerFor(row, col) {
  const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) {
    return null;
  }
  const boardRect = boardEl.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  return {
    x: cellRect.left - boardRect.left + cellRect.width / 2,
    y: cellRect.top - boardRect.top + cellRect.height / 2,
  };
}

function checkEndState() {
  if (state.phase === "ended") {
    return true;
  }
  const playerCount = sidePieces("player").length;
  const enemyCount = sidePieces("enemy").length;
  if (playerCount > 0 && enemyCount > 0) {
    return false;
  }
  state.phase = "ended";
  state.activeId = null;
  state.destination = null;
  if (playerCount > 0 && enemyCount === 0) {
    state.result = "victory";
    addLog("Victory! White army wins the battle.", "victory");
  } else if (enemyCount > 0 && playerCount === 0) {
    state.result = "defeat";
    addLog("Defeat. Black army wins the battle.", "defeat");
  } else {
    state.result = "draw";
    addLog("Draw. No pieces remain.", "system");
  }
  return true;
}

function squareName(row, col) {
  return `${FILES[col]}${BOARD_SIZE - row}`;
}

function sideName(side) {
  return side === "player" ? "White" : "Black";
}

function pieceName(piece) {
  return `${sideName(piece.side)} ${PIECES[piece.type].label}`;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

startButton.addEventListener("click", startBattle);
pauseButton.addEventListener("click", togglePause);
stepButton.addEventListener("click", stepOneAction);
resetButton.addEventListener("click", resetState);
removeModeButton.addEventListener("click", () => {
  if (state.phase !== "setup") {
    return;
  }
  state.removeMode = !state.removeMode;
  render();
});
speedSelect.addEventListener("change", () => {
  state.speed = speedSelect.value;
});
clearLogButton.addEventListener("click", () => {
  state.log = [];
  renderLog();
});

resetState();
