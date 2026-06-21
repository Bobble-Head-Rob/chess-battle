const ACTION_THRESHOLD = 10;
const FILES = "ABCDEFGHIJKL";

const SCENARIOS = {
  variety: {
    label: "Variety Skirmish",
    boardSize: 10,
    budget: 50,
    summary: "10x10 board, 50 budget, 8 pawns, 4 knights, 2 bishops, 1 rook, 1 queen.",
    enemies: [
      { type: "bishop", row: 0, col: 2 },
      { type: "queen", row: 0, col: 4 },
      { type: "rook", row: 0, col: 5 },
      { type: "bishop", row: 0, col: 7 },
      { type: "knight", row: 1, col: 1 },
      { type: "knight", row: 1, col: 3 },
      { type: "knight", row: 1, col: 6 },
      { type: "knight", row: 1, col: 8 },
      { type: "pawn", row: 2, col: 1 },
      { type: "pawn", row: 2, col: 2 },
      { type: "pawn", row: 2, col: 3 },
      { type: "pawn", row: 2, col: 4 },
      { type: "pawn", row: 2, col: 5 },
      { type: "pawn", row: 2, col: 6 },
      { type: "pawn", row: 2, col: 7 },
      { type: "pawn", row: 2, col: 8 },
    ],
  },
  swarm: {
    label: "Pawn/Knight Swarm",
    boardSize: 12,
    budget: 55,
    summary: "12x12 board, 55 budget, 20 pawns and 10 knights.",
    enemies: [
      { type: "knight", row: 0, col: 1 },
      { type: "knight", row: 0, col: 2 },
      { type: "knight", row: 0, col: 3 },
      { type: "knight", row: 0, col: 4 },
      { type: "knight", row: 0, col: 5 },
      { type: "knight", row: 0, col: 6 },
      { type: "knight", row: 0, col: 7 },
      { type: "knight", row: 0, col: 8 },
      { type: "knight", row: 0, col: 9 },
      { type: "knight", row: 0, col: 10 },
      { type: "pawn", row: 1, col: 0 },
      { type: "pawn", row: 1, col: 1 },
      { type: "pawn", row: 1, col: 2 },
      { type: "pawn", row: 1, col: 3 },
      { type: "pawn", row: 1, col: 4 },
      { type: "pawn", row: 1, col: 5 },
      { type: "pawn", row: 1, col: 6 },
      { type: "pawn", row: 1, col: 7 },
      { type: "pawn", row: 1, col: 8 },
      { type: "pawn", row: 1, col: 9 },
      { type: "pawn", row: 1, col: 10 },
      { type: "pawn", row: 1, col: 11 },
      { type: "pawn", row: 2, col: 2 },
      { type: "pawn", row: 2, col: 3 },
      { type: "pawn", row: 2, col: 4 },
      { type: "pawn", row: 2, col: 5 },
      { type: "pawn", row: 2, col: 6 },
      { type: "pawn", row: 2, col: 7 },
      { type: "pawn", row: 2, col: 8 },
      { type: "pawn", row: 2, col: 9 },
    ],
  },
};

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

const MOVE_PROFILES = {
  pawn: { danger: 0.38, protection: 1.25, lane: 0 },
  knight: { danger: 0.76, protection: 0.8, lane: 0 },
  bishop: { danger: 1.08, protection: 0.9, lane: 4.8 },
  rook: { danger: 1.22, protection: 0.9, lane: 5.8 },
  queen: { danger: 2.1, protection: 1.0, lane: 4.6 },
  king: { danger: 1.45, protection: 1.2, lane: 0 },
};

const boardEl = document.getElementById("board");
const effectLayer = document.getElementById("effectLayer");
const pieceShopEl = document.getElementById("pieceShop");
const actionLogEl = document.getElementById("actionLog");
const battleStateEl = document.getElementById("battleState");
const budgetValueEl = document.getElementById("budgetValue");
const playerCountEl = document.getElementById("playerCount");
const enemyCountEl = document.getElementById("enemyCount");
const playerCompositionEl = document.getElementById("playerComposition");
const enemyCompositionEl = document.getElementById("enemyComposition");
const placementHintEl = document.getElementById("placementHint");
const scenarioSelectEl = document.getElementById("scenarioSelect");
const scenarioSummaryEl = document.getElementById("scenarioSummary");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const stepButton = document.getElementById("stepButton");
const resetButton = document.getElementById("resetButton");
const removeModeButton = document.getElementById("removeModeButton");
const speedSelect = document.getElementById("speedSelect");
const clearLogButton = document.getElementById("clearLogButton");

const state = {
  pieces: [],
  scenarioId: "variety",
  budget: 0,
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

function currentScenario() {
  return SCENARIOS[state.scenarioId];
}

function boardSize() {
  return currentScenario().boardSize;
}

function playerDeployStart() {
  return boardSize() - 3;
}

function enemyDeployEnd() {
  return 2;
}

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
  const scenario = currentScenario();
  state.pieces = [];
  state.budget = scenario.budget;
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
  addLog(`Scenario ready: ${scenario.label}. Enemy deploys ${enemySummary(scenario)}. Player has ${scenario.budget} points to spend.`, "system");
  render();
}

function placeEnemyArmy() {
  currentScenario().enemies.forEach((enemy) => {
    state.pieces.push(createPiece("enemy", enemy.type, enemy.row, enemy.col));
  });
}

function enemySummary(scenario) {
  const counts = scenario.enemies.reduce((summary, enemy) => {
    summary[enemy.type] = (summary[enemy.type] || 0) + 1;
    return summary;
  }, {});
  return Object.keys(PIECES)
    .filter((type) => counts[type])
    .map((type) => `${counts[type]} ${counts[type] === 1 ? PIECES[type].label.toLowerCase() : `${PIECES[type].label.toLowerCase()}s`}`)
    .join(", ");
}

function render() {
  renderScenarioSelect();
  renderShop();
  renderBoard();
  renderStatus();
  renderLog();
}

function renderScenarioSelect() {
  if (scenarioSelectEl.children.length === Object.keys(SCENARIOS).length) {
    scenarioSelectEl.value = state.scenarioId;
    return;
  }
  scenarioSelectEl.innerHTML = "";
  Object.entries(SCENARIOS).forEach(([id, scenario]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = scenario.label;
    scenarioSelectEl.appendChild(option);
  });
  scenarioSelectEl.value = state.scenarioId;
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
  const size = boardSize();
  boardEl.innerHTML = "";
  boardEl.style.setProperty("--board-size", String(size));
  boardEl.setAttribute("aria-label", `${size} by ${size} battle board`);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `cell ${(row + col) % 2 === 0 ? "light" : "dark"}`;
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", squareName(row, col));

      if (row >= playerDeployStart()) {
        cell.classList.add("player-zone");
      }
      if (row <= enemyDeployEnd()) {
        cell.classList.add("enemy-zone");
      }

      const occupyingPiece = pieceAt(row, col);
      if (state.phase === "setup" && row >= playerDeployStart() && !occupyingPiece && state.budget >= PIECES[state.selectedType].cost && !state.removeMode) {
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
  const scenario = currentScenario();
  const playerCount = sidePieces("player").length;
  const enemyCount = sidePieces("enemy").length;
  budgetValueEl.textContent = String(state.budget);
  playerCountEl.textContent = `${playerCount} total`;
  enemyCountEl.textContent = `${enemyCount} total`;
  playerCompositionEl.textContent = armyComposition("player");
  enemyCompositionEl.textContent = armyComposition("enemy");
  scenarioSummaryEl.textContent = `${scenario.label}: ${scenario.summary}`;

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
  scenarioSelectEl.disabled = state.actionBusy;
  removeModeButton.classList.toggle("active", state.removeMode);

  if (state.phase === "setup") {
    const selected = PIECES[state.selectedType];
    placementHintEl.textContent = state.removeMode
      ? "Remove mode is active. Click a player piece to refund it."
      : `Selected ${selected.label}. Click a blue square to place it for ${selected.cost}. Right-click player pieces to refund.`;
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
  if (row < playerDeployStart()) {
    addLog(`Player can only deploy in the bottom 3 rows. ${squareName(row, col)} is outside the blue zone.`, "system");
    render();
    return;
  }
  if (pieceAt(row, col)) {
    addLog(`${squareName(row, col)} is already occupied.`, "system");
    render();
    return;
  }
  if (state.budget < template.cost) {
    addLog(`Not enough budget for a Player ${template.label}.`, "system");
    render();
    return;
  }
  state.budget -= template.cost;
  const piece = createPiece("player", state.selectedType, row, col);
  state.pieces.push(piece);
  addLog(`Player ${template.label} deployed on ${squareName(row, col)} for ${template.cost}.`, "system");
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
  addLog(`Player ${PIECES[piece.type].label} removed from ${squareName(row, col)}. Refunded ${PIECES[piece.type].cost}.`, "system");
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
  addLog("Place at least one player piece before starting battle.", "system");
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
  const coverage = buildMoveCoverage(actor);
  const currentSafety = scoreSquareSafety(actor, { row: actor.row, col: actor.col }, coverage);

  moves.forEach((move) => {
    const safety = scoreSquareSafety(actor, move, coverage);
    const safetyGain = currentSafety.penalty - safety.penalty;
    let moveScore = safety.score + Math.max(-30, Math.min(44, safetyGain * 0.38));
    let useful = false;
    let moveReason = "closing distance";

    if (safetyGain > 24) {
      useful = true;
      moveReason = "choosing a safer square";
    }

    let bestTargetScore = -Infinity;
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
      if (score > bestTargetScore) {
        bestTargetScore = score;
      }
    });

    if (bestTargetScore > 0) {
      moveScore += bestTargetScore;
    }

    if (PIECES[actor.type].role === "ranged") {
      if (hasAnyLineFrom(actor, move.row, move.col)) {
        moveScore += 28;
        useful = true;
        moveReason = "opening a firing line";
      }
      const laneBonus = openLineScore(actor, move.row, move.col) * MOVE_PROFILES[actor.type].lane;
      moveScore += safety.danger.attackers > 0 ? laneBonus * 0.35 : laneBonus;
      if (laneBonus > 0 && safety.danger.attackers === 0) {
        useful = true;
      }
    }

    if ((actor.type === "pawn" || actor.type === "king") && safety.protection.attackers > 0) {
      moveScore += actor.type === "pawn" ? 12 : 8;
      if (toForwardProgress(actor, move) > 0) {
        moveReason = "advancing under protection";
      }
    }

    if (safety.danger.attackers === 0 && currentSafety.danger.attackers > 0 && moveReason === "closing distance") {
      moveReason = "stepping out of danger";
    }

    if (useful && moveScore > bestScore) {
      bestScore = moveScore;
      best = { row: move.row, col: move.col, reason: safetyAwareReason(moveReason, safety) };
    }
  });

  return best;
}

function buildMoveCoverage(actor) {
  const ignoreIds = new Set([actor.id]);
  return {
    danger: buildCoverageMap(opponentSide(actor.side), ignoreIds),
    protection: buildCoverageMap(actor.side, ignoreIds),
  };
}

function buildCoverageMap(attackingSide, ignoreIds = new Set()) {
  const size = boardSize();
  const map = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      attackers: 0,
      damage: 0,
      maxDamage: 0,
      pieces: [],
    }))
  );

  sidePieces(attackingSide).forEach((attacker) => {
    if (ignoreIds.has(attacker.id)) {
      return;
    }
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (canThreatenSquare(attacker, row, col, ignoreIds)) {
          const coverage = map[row][col];
          coverage.attackers += 1;
          coverage.damage += attacker.damage;
          coverage.maxDamage = Math.max(coverage.maxDamage, attacker.damage);
          coverage.pieces.push(attacker);
        }
      }
    }
  });

  return map;
}

function scoreSquareSafety(actor, square, coverage) {
  const danger = coverage.danger[square.row][square.col];
  const protection = coverage.protection[square.row][square.col];
  const profile = MOVE_PROFILES[actor.type];
  const value = PIECES[actor.type].cost;
  const netDamage = Math.max(0, danger.damage - protection.damage * 0.55);
  const netAttackers = Math.max(0, danger.attackers - protection.attackers * 0.65);
  let penalty = profile.danger * (netDamage * (15 + value * 2.6) + netAttackers * (16 + value * 3.2));

  if (danger.damage >= actor.hp) {
    const survivalPenalty = actor.type === "pawn" ? 34 : 96;
    penalty += profile.danger * (survivalPenalty + value * 12);
    if (actor.type !== "pawn" && protection.attackers === 0) {
      penalty += profile.danger * (80 + value * 10);
    }
  }
  if (danger.attackers >= 2 && protection.attackers === 0) {
    penalty += profile.danger * (20 + value * 4);
  }
  if (actor.type === "queen" && danger.attackers > 0) {
    penalty += 90 + danger.attackers * 25;
  }

  let reward = profile.protection * (protection.attackers * 8 + protection.damage * 3);
  if (danger.attackers > 0 && protection.attackers > 0) {
    reward += profile.protection * protection.attackers * 7;
  }

  return {
    danger,
    protection,
    penalty,
    reward,
    score: reward - penalty,
  };
}

function safetyAwareReason(reason, safety) {
  if (safety.danger.attackers === 0 && reason === "choosing a safer square") {
    return reason;
  }
  if (safety.danger.attackers > 0 && safety.protection.attackers > 0) {
    return `${reason} with support`;
  }
  return reason;
}

function toForwardProgress(actor, move) {
  const forward = actor.side === "player" ? -1 : 1;
  return (move.row - actor.row) * forward;
}

function openLineScore(actor, row, col) {
  return directionsFor(actor.type).reduce((score, [dr, dc]) => {
    let nextRow = row + dr;
    let nextCol = col + dc;
    let openSquares = 0;
    while (inBounds(nextRow, nextCol)) {
      const occupant = pieceAt(nextRow, nextCol, new Set([actor.id]));
      if (occupant) {
        if (occupant.side !== actor.side) {
          openSquares += 2;
        }
        break;
      }
      openSquares += 1;
      nextRow += dr;
      nextCol += dc;
    }
    return score + Math.min(openSquares, 5);
  }, 0);
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
  return canAttackGeometry(actor, row, col, target.row, target.col, new Set([actor.id]));
}

function canThreatenSquare(attacker, row, col, ignoreIds = new Set()) {
  return canAttackGeometry(attacker, attacker.row, attacker.col, row, col, ignoreIds);
}

function canAttackGeometry(actor, fromRow, fromCol, toRow, toCol, ignoreIds = new Set()) {
  if (!inBounds(toRow, toCol) || (fromRow === toRow && fromCol === toCol)) {
    return false;
  }
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  const ignore = new Set(ignoreIds);
  ignore.add(actor.id);

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
    return absR === absC && absR > 0 && isPathClear(fromRow, fromCol, toRow, toCol, ignore);
  }
  if (actor.type === "rook") {
    return (dr === 0 || dc === 0) && (absR + absC > 0) && isPathClear(fromRow, fromCol, toRow, toCol, ignore);
  }
  if (actor.type === "queen") {
    const straight = dr === 0 || dc === 0;
    const diagonal = absR === absC;
    return (straight || diagonal) && (absR + absC > 0) && isPathClear(fromRow, fromCol, toRow, toCol, ignore);
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
  return row >= 0 && row < boardSize() && col >= 0 && col < boardSize();
}

function pieceAt(row, col, ignoreIds = new Set()) {
  return state.pieces.find((piece) => piece.row === row && piece.col === col && !ignoreIds.has(piece.id)) || null;
}

function sidePieces(side) {
  return state.pieces.filter((piece) => piece.side === side && piece.hp > 0);
}

function armyComposition(side) {
  const pieces = sidePieces(side);
  if (pieces.length === 0) {
    return side === "player" && state.phase === "setup" ? "No units deployed" : "No units remaining";
  }
  const counts = pieces.reduce((summary, piece) => {
    summary[piece.type] = (summary[piece.type] || 0) + 1;
    return summary;
  }, {});
  return Object.keys(PIECES)
    .filter((type) => counts[type])
    .map((type) => `${PIECES[type].label} x${counts[type]}`)
    .join(", ");
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
    addLog("Victory! Player army wins the battle.", "victory");
  } else if (enemyCount > 0 && playerCount === 0) {
    state.result = "defeat";
    addLog("Defeat. Enemy army wins the battle.", "defeat");
  } else {
    state.result = "draw";
    addLog("Draw. No pieces remain.", "system");
  }
  return true;
}

function squareName(row, col) {
  return `${FILES[col]}${boardSize() - row}`;
}

function sideName(side) {
  return side === "player" ? "Player" : "Enemy";
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
scenarioSelectEl.addEventListener("change", () => {
  state.scenarioId = scenarioSelectEl.value;
  resetState();
});
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
