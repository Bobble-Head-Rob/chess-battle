const ACTION_THRESHOLD = 10;
const DEFAULT_ACTION_LIMIT = 500;
const FILES = "ABCDEFGHIJKL";

const SCENARIOS = {
  variety: {
    label: "Variety Skirmish",
    boardSize: 10,
    budget: 50,
    summary: "10x10 board · 50 budget",
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
    summary: "12x12 board · 55 budget",
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
  brokenCenter: {
    label: "Broken Center",
    boardSize: 8,
    budget: 34,
    playerDeployRows: 2,
    enemyDeployRows: 2,
    summary: "8x8 board · 34 budget · center four squares blocked · enemies: 4 pawns, 2 knights, 2 bishops, 1 rook",
    blockedSquares: [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
    enemies: [
      { type: "bishop", row: 0, col: 1 },
      { type: "rook", row: 0, col: 3 },
      { type: "bishop", row: 0, col: 6 },
      { type: "knight", row: 1, col: 1 },
      { type: "pawn", row: 1, col: 2 },
      { type: "pawn", row: 1, col: 3 },
      { type: "pawn", row: 1, col: 4 },
      { type: "pawn", row: 1, col: 5 },
      { type: "knight", row: 1, col: 6 },
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
    speed: 1.5,
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

const PIECE_ROLES = {
  pawn: "Opens with a two-square advance, then moves forward and attacks diagonally.",
  knight: "L-shape skirmisher; returns if target survives.",
  bishop: "Diagonal ranged attacker.",
  rook: "Straight-line ranged attacker.",
  queen: "Powerful ranged attacker.",
  king: "Slow melee bruiser.",
};

const SPEEDS = {
  slow: { loopDelay: 900, effect: 620 },
  normal: { loopDelay: 460, effect: 360 },
  fast: { loopDelay: 150, effect: 180 },
};

const FLOATING_FEEDBACK_DURATIONS = {
  slow: { damage: 1500, ko: 1800 },
  normal: { damage: 1050, ko: 1350 },
  fast: { damage: 760, ko: 980 },
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
const inspectHintEl = document.getElementById("inspectHint");
const inspectDetailsEl = document.getElementById("inspectDetails");
const overlayMovesEl = document.getElementById("overlayMoves");
const overlayAttacksEl = document.getElementById("overlayAttacks");
const overlayThreatEl = document.getElementById("overlayThreat");
const overlayProtectionEl = document.getElementById("overlayProtection");
const scenarioSelectEl = document.getElementById("scenarioSelect");
const scenarioSummaryEl = document.getElementById("scenarioSummary");
const scoreboardEl = document.getElementById("scoreboard");
const scoreboardTitleEl = document.getElementById("scoreboardTitle");
const scoreboardGradeEl = document.getElementById("scoreboardGrade");
const scoreboardStatsEl = document.getElementById("scoreboardStats");
const scoreboardResetButton = document.getElementById("scoreboardResetButton");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const stepButton = document.getElementById("stepButton");
const resetButton = document.getElementById("resetButton");
const speedSelect = document.getElementById("speedSelect");
const soundToggleEl = document.getElementById("soundToggle");
const soundVolumeEl = document.getElementById("soundVolume");
const clearLogButton = document.getElementById("clearLogButton");

let audioContext = null;
let masterGain = null;

const state = {
  pieces: [],
  scenarioId: "variety",
  budget: 0,
  selectedType: "pawn",
  phase: "setup",
  result: null,
  speed: "normal",
  soundEnabled: true,
  soundVolume: 0.3,
  activeId: null,
  hoverInspectPieceId: null,
  selectedInspectPieceId: null,
  previewPlacementSquare: null,
  overlays: {
    moves: true,
    attacks: true,
    threat: false,
    protection: false,
  },
  destination: null,
  actionBusy: false,
  loopRunning: false,
  nextId: 1,
  actionNumber: 0,
  ticks: 0,
  scoreSnapshot: null,
  log: [],
};

function currentScenario() {
  return SCENARIOS[state.scenarioId];
}

function boardSize() {
  return currentScenario().boardSize;
}

function playerDeployStart() {
  return boardSize() - playerDeployRows();
}

function enemyDeployEnd() {
  return enemyDeployRows() - 1;
}

function playerDeployRows() {
  return currentScenario().playerDeployRows || 3;
}

function enemyDeployRows() {
  return currentScenario().enemyDeployRows || 3;
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
    previousRow: null,
    previousCol: null,
    hasMoved: false,
    openingActionUsed: false,
  };
}

function resetState() {
  const scenario = currentScenario();
  state.pieces = [];
  state.budget = scenario.budget;
  state.selectedType = "pawn";
  state.phase = "setup";
  state.result = null;
  state.activeId = null;
  clearInspectState();
  state.previewPlacementSquare = null;
  state.destination = null;
  state.actionBusy = false;
  state.loopRunning = false;
  state.nextId = 1;
  state.actionNumber = 0;
  state.ticks = 0;
  state.scoreSnapshot = null;
  state.log = [];
  clearEffects();
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
  renderOverlayControls();
  renderInspectPanel();
  renderScoreboard();
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
      clearInspectState();
      state.previewPlacementSquare = null;
      render();
    });
    pieceShopEl.appendChild(button);
  });
}

function renderBoard() {
  const size = boardSize();
  const boardOverlays = buildBoardOverlays();
  const inspectedForBoard = activeBoardInspection();
  const previewPiece = placementPreviewPiece();
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
      const blocked = isBlockedSquare(row, col);
      if (blocked) {
        cell.classList.add("blocked-square");
        cell.disabled = true;
        cell.setAttribute("aria-label", `${squareName(row, col)} blocked`);
      }

      if (!blocked && row >= playerDeployStart()) {
        cell.classList.add("player-zone");
      }
      if (!blocked && row <= enemyDeployEnd()) {
        cell.classList.add("enemy-zone");
      }

      const occupyingPiece = pieceAt(row, col);
      const validPlacementPreview = canPreviewPlacement(row, col);
      if (validPlacementPreview) {
        cell.classList.add("valid-deploy");
      }
      if (state.phase === "setup" && occupyingPiece?.side === "player") {
        cell.classList.add("remove-ready");
      }
      if (previewPiece && previewPiece.row === row && previewPiece.col === col) {
        cell.classList.add("placement-preview");
      }
      if (state.activeId && occupyingPiece?.id === state.activeId) {
        cell.classList.add("active-unit");
      }
      if (inspectedForBoard && occupyingPiece?.id === inspectedForBoard.id) {
        cell.classList.add("inspected-unit");
      }
      if (state.destination && state.destination.row === row && state.destination.col === col) {
        cell.classList.add("move-destination");
      }

      const coord = document.createElement("span");
      coord.className = "coord";
      coord.textContent = squareName(row, col);
      cell.appendChild(coord);

      if (blocked) {
        const obstacle = document.createElement("span");
        obstacle.className = "obstacle-mark";
        obstacle.setAttribute("aria-hidden", "true");
        cell.appendChild(obstacle);
      }

      const overlays = boardOverlays.get(squareKey(row, col)) || [];
      overlays.forEach((type) => {
        const marker = document.createElement("span");
        marker.className = `overlay-marker overlay-${type}`;
        marker.setAttribute("aria-hidden", "true");
        cell.appendChild(marker);
      });

      if (previewPiece && previewPiece.row === row && previewPiece.col === col) {
        const ghost = document.createElement("span");
        ghost.className = "placement-ghost";
        ghost.setAttribute("aria-hidden", "true");
        ghost.textContent = PIECES[previewPiece.type].symbols.player;
        cell.appendChild(ghost);
      }

      if (occupyingPiece) {
        cell.dataset.pieceId = String(occupyingPiece.id);
        cell.appendChild(renderPiece(occupyingPiece));
        cell.addEventListener("mouseenter", () => inspectPiece(occupyingPiece.id, "hover"));
        cell.addEventListener("focus", () => inspectPiece(occupyingPiece.id, "hover"));
        cell.addEventListener("mouseleave", () => clearHoverInspection(occupyingPiece.id));
        cell.addEventListener("blur", () => clearHoverInspection(occupyingPiece.id));
      }

      if (validPlacementPreview) {
        cell.addEventListener("mouseenter", () => setPlacementPreview(row, col));
        cell.addEventListener("focus", () => setPlacementPreview(row, col));
        cell.addEventListener("mouseleave", () => clearPlacementPreview(row, col));
        cell.addEventListener("blur", () => clearPlacementPreview(row, col));
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
  hpText.className = `hp-text${piece.hp < piece.maxHp ? " damaged" : ""}`;
  const hpHeart = document.createElement("span");
  hpHeart.className = "hp-heart";
  hpHeart.setAttribute("aria-hidden", "true");
  hpHeart.textContent = "♥";
  const hpValue = document.createElement("span");
  hpValue.className = "hp-value";
  hpValue.textContent = `${piece.hp}/${piece.maxHp}`;
  hpText.append(hpHeart, hpValue);
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
  scenarioSummaryEl.textContent = scenario.summary;

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
  scenarioSelectEl.disabled = state.actionBusy;
  soundToggleEl.checked = state.soundEnabled;
  soundVolumeEl.value = String(state.soundVolume);

  if (state.phase === "setup") {
    const selected = PIECES[state.selectedType];
    placementHintEl.textContent = `Selected ${selected.label}. Click a blue square to place it for ${selected.cost}. Right-click player pieces to refund.`;
  } else {
    placementHintEl.textContent = "Deployment is locked until reset.";
  }
}

function renderOverlayControls() {
  const hasSelection = Boolean(activeOverlayPiece());
  overlayMovesEl.checked = state.overlays.moves;
  overlayAttacksEl.checked = state.overlays.attacks;
  overlayThreatEl.checked = state.overlays.threat;
  overlayProtectionEl.checked = state.overlays.protection;
  [overlayMovesEl, overlayAttacksEl, overlayThreatEl, overlayProtectionEl].forEach((input) => {
    input.disabled = !hasSelection;
  });
}

function renderInspectPanel() {
  pruneMissingInspectState();
  const piece = inspectedPiece();
  inspectDetailsEl.innerHTML = "";

  if (placementPreviewPiece()) {
    renderPlacementInspect();
    return;
  }

  if (!piece && state.phase === "setup") {
    renderPlacementInspect();
    return;
  }

  inspectHintEl.hidden = Boolean(piece);
  inspectDetailsEl.hidden = !piece;
  inspectDetailsEl.innerHTML = "";

  if (!piece) {
    inspectHintEl.textContent = "Hover or click a piece on the board to inspect its stats.";
    return;
  }

  renderBoardPieceInspect(piece);
}

function renderBoardPieceInspect(piece) {
  const template = PIECES[piece.type];
  const title = document.createElement("div");
  title.className = `inspect-title ${piece.side}`;
  const symbol = document.createElement("span");
  symbol.className = "inspect-symbol";
  symbol.textContent = template.symbols[piece.side];
  const name = document.createElement("span");
  name.textContent = `${sideName(piece.side)} ${template.label}`;
  title.append(symbol, name);

  const stats = document.createElement("div");
  stats.className = "inspect-stats";
  [
    ["Team", sideName(piece.side)],
    ["Type", template.label],
    ["HP", `${piece.hp}/${piece.maxHp}`],
    ["Damage", String(piece.damage)],
    ["Speed", String(piece.speed)],
    ["Initiative", String(piece.initiative)],
    ["Cost / Value", String(template.cost)],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    stats.appendChild(item);
  });

  const role = document.createElement("p");
  role.className = "inspect-role";
  role.textContent = PIECE_ROLES[piece.type];
  inspectDetailsEl.append(title, stats, role);
}

function renderPlacementInspect() {
  const template = PIECES[state.selectedType];
  inspectHintEl.hidden = true;
  inspectDetailsEl.hidden = false;

  const title = document.createElement("div");
  title.className = "inspect-title player placement";
  const symbol = document.createElement("span");
  symbol.className = "inspect-symbol";
  symbol.textContent = template.symbols.player;
  const name = document.createElement("span");
  name.textContent = `Placing: ${template.label}`;
  title.append(symbol, name);

  const stats = document.createElement("div");
  stats.className = "inspect-stats";
  [
    ["Team", "Player"],
    ["Cost", String(template.cost)],
    ["HP", String(template.hp)],
    ["Damage", String(template.damage)],
    ["Speed", String(template.speed)],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    stats.appendChild(item);
  });

  const role = document.createElement("p");
  role.className = "inspect-role";
  role.textContent = PIECE_ROLES[state.selectedType];

  const hint = document.createElement("p");
  hint.className = "inspect-hint-line";
  hint.textContent = "Click a blue deployment square to place.";
  inspectDetailsEl.append(title, stats, role, hint);
}

function inspectPiece(pieceId, source = "hover", refreshBoard = true) {
  const alreadyInspected = activeBoardInspection()?.id === pieceId;
  state.previewPlacementSquare = null;
  if (source === "selected") {
    state.selectedInspectPieceId = pieceId;
    state.hoverInspectPieceId = null;
  } else if (!selectedInspectPiece()) {
    state.hoverInspectPieceId = pieceId;
  }
  renderOverlayControls();
  renderInspectPanel();
  if (refreshBoard && !alreadyInspected) {
    renderBoard();
  } else {
    markInspectedCell();
  }
}

function clearHoverInspection(pieceId = null, refreshBoard = true) {
  if (!state.hoverInspectPieceId || (pieceId !== null && state.hoverInspectPieceId !== pieceId)) {
    return;
  }
  const hadBoardInspection = Boolean(activeBoardInspection());
  state.hoverInspectPieceId = null;
  renderOverlayControls();
  renderInspectPanel();
  if (refreshBoard && hadBoardInspection && !activeBoardInspection()) {
    renderBoard();
  } else {
    markInspectedCell();
  }
}

function markInspectedCell() {
  const inspectedForBoard = activeBoardInspection();
  Array.from(boardEl.children).forEach((cell) => {
    cell.classList.toggle("inspected-unit", Boolean(inspectedForBoard) && Number(cell.dataset.pieceId) === inspectedForBoard.id);
  });
}

function setPlacementPreview(row, col) {
  if (!canPreviewPlacement(row, col)) {
    return;
  }
  if (state.previewPlacementSquare?.row === row && state.previewPlacementSquare?.col === col && !inspectedPiece()) {
    return;
  }
  state.previewPlacementSquare = { row, col };
  state.hoverInspectPieceId = null;
  render();
}

function clearPlacementPreview(row, col) {
  if (!state.previewPlacementSquare || state.previewPlacementSquare.row !== row || state.previewPlacementSquare.col !== col) {
    return;
  }
  state.previewPlacementSquare = null;
  render();
}

function canPreviewPlacement(row, col) {
  return (
    state.phase === "setup" &&
    inBounds(row, col) &&
    !isBlockedSquare(row, col) &&
    row >= playerDeployStart() &&
    !pieceAt(row, col) &&
    state.budget >= PIECES[state.selectedType].cost
  );
}

function placementPreviewPiece() {
  if (!state.previewPlacementSquare || !canPreviewPlacement(state.previewPlacementSquare.row, state.previewPlacementSquare.col)) {
    return null;
  }
  return createVirtualPiece("player", state.selectedType, state.previewPlacementSquare.row, state.previewPlacementSquare.col);
}

function createVirtualPiece(side, type, row, col) {
  const template = PIECES[type];
  return {
    id: "placement-preview",
    side,
    type,
    row,
    col,
    hp: template.hp,
    maxHp: template.hp,
    damage: template.damage,
    speed: template.speed,
    initiative: 0,
    previousRow: null,
    previousCol: null,
    hasMoved: false,
    openingActionUsed: false,
  };
}

function inspectedPiece() {
  return selectedInspectPiece() || hoverInspectPiece();
}

function selectedInspectPiece() {
  return state.selectedInspectPieceId ? state.pieces.find((item) => item.id === state.selectedInspectPieceId) || null : null;
}

function hoverInspectPiece() {
  return state.hoverInspectPieceId ? state.pieces.find((item) => item.id === state.hoverInspectPieceId) || null : null;
}

function pruneMissingInspectState() {
  if (state.selectedInspectPieceId && !selectedInspectPiece()) {
    state.selectedInspectPieceId = null;
  }
  if (state.hoverInspectPieceId && !hoverInspectPiece()) {
    state.hoverInspectPieceId = null;
  }
}

function clearInspectState() {
  state.hoverInspectPieceId = null;
  state.selectedInspectPieceId = null;
}

function activeBoardInspection() {
  if (placementPreviewPiece()) {
    return null;
  }
  return inspectedPiece();
}

function activeOverlayPiece() {
  return placementPreviewPiece() || inspectedPiece();
}

function buildBoardOverlays() {
  const overlays = new Map();
  const piece = activeOverlayPiece();
  if (!piece) {
    return overlays;
  }

  if (state.overlays.threat) {
    addCoverageOverlays(overlays, buildCoverageMap(opponentSide(piece.side)), "threat");
  }
  if (state.overlays.protection) {
    addCoverageOverlays(overlays, buildCoverageMap(piece.side, new Set(), piece.id === "placement-preview" ? [piece] : []), "protection");
  }
  if (state.overlays.moves) {
    legalMoves(piece).forEach((move) => addOverlay(overlays, move.row, move.col, "move"));
  }
  if (state.overlays.attacks) {
    attackRangeSquares(piece).forEach((square) => addOverlay(overlays, square.row, square.col, "attack"));
  }

  return overlays;
}

function addCoverageOverlays(overlays, coverageMap, type) {
  coverageMap.forEach((row, rowIndex) => {
    row.forEach((coverage, colIndex) => {
      if (coverage.attackers > 0) {
        addOverlay(overlays, rowIndex, colIndex, type);
      }
    });
  });
}

function addOverlay(overlays, row, col, type) {
  if (!inBounds(row, col) || isBlockedSquare(row, col)) {
    return;
  }
  const key = squareKey(row, col);
  if (!overlays.has(key)) {
    overlays.set(key, []);
  }
  const types = overlays.get(key);
  if (!types.includes(type)) {
    types.push(type);
  }
}

function attackRangeSquares(piece) {
  if (piece.type === "pawn") {
    const forward = pawnForward(piece.side);
    return [-1, 1]
      .map((dc) => ({ row: piece.row + forward, col: piece.col + dc }))
      .filter((square) => {
        const occupant = pieceAt(square.row, square.col);
        return inBounds(square.row, square.col) && !isBlockedSquare(square.row, square.col) && occupant && occupant.side !== piece.side;
      });
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
    ]
      .map(([dr, dc]) => ({ row: piece.row + dr, col: piece.col + dc }))
      .filter((square) => isOpenOrEnemy(piece, square.row, square.col));
  }

  if (piece.type === "king") {
    return surroundingDirections()
      .map(([dr, dc]) => ({ row: piece.row + dr, col: piece.col + dc }))
      .filter((square) => isOpenOrEnemy(piece, square.row, square.col));
  }

  const squares = [];
  directionsFor(piece.type).forEach(([dr, dc]) => {
    let row = piece.row + dr;
    let col = piece.col + dc;
    while (inBounds(row, col)) {
      if (isBlockedSquare(row, col)) {
        break;
      }
      const occupant = pieceAt(row, col);
      if (occupant) {
        if (occupant.side !== piece.side) {
          squares.push({ row, col });
        }
        break;
      }
      squares.push({ row, col });
      row += dr;
      col += dc;
    }
  });
  return squares;
}

function isOpenOrEnemy(piece, row, col) {
  if (!inBounds(row, col) || isBlockedSquare(row, col)) {
    return false;
  }
  const occupant = pieceAt(row, col);
  return !occupant || occupant.side !== piece.side;
}

function renderLog() {
  actionLogEl.innerHTML = "";
  state.log.slice(-120).forEach((entry) => {
    const line = document.createElement("div");
    line.className = `log-entry ${entry.kind || ""}${entry.text.includes("destroyed") ? " kill" : ""}`;
    if (entry.number) {
      const prefix = document.createElement("strong");
      prefix.textContent = `${entry.number}. `;
      line.append(prefix);
    }
    appendLogText(line, entry.text);
    actionLogEl.appendChild(line);
  });
  actionLogEl.scrollTop = actionLogEl.scrollHeight;
}

function appendLogText(line, text) {
  text.split(/\b(Player|Enemy|destroyed)\b/g).forEach((part) => {
    if (!part) {
      return;
    }
    if (part === "Player" || part === "Enemy") {
      const side = document.createElement("span");
      side.className = `log-side ${part.toLowerCase()}`;
      side.textContent = part;
      line.append(side);
      return;
    }
    if (part === "destroyed") {
      const destroyed = document.createElement("span");
      destroyed.className = "log-destroyed";
      destroyed.textContent = part;
      line.append(destroyed);
      return;
    }
    line.append(document.createTextNode(part));
  });
}

function handleCellClick(row, col) {
  ensureAudioContext();
  const occupyingPiece = pieceAt(row, col);
  if (occupyingPiece) {
    inspectPiece(occupyingPiece.id, "selected");
    return;
  }
  if (state.phase !== "setup") {
    return;
  }
  placePlayerPiece(row, col);
}

function placePlayerPiece(row, col) {
  const template = PIECES[state.selectedType];
  if (row < playerDeployStart()) {
    addLog(`Player can only deploy in the bottom ${playerDeployRows()} rows. ${squareName(row, col)} is outside the blue zone.`, "system");
    render();
    return;
  }
  if (isBlockedSquare(row, col)) {
    addLog(`${squareName(row, col)} is blocked and cannot be used for deployment.`, "system");
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
  clearInspectState();
  state.previewPlacementSquare = null;
  playSound("place");
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
  pruneMissingInspectState();
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
    captureScoreSnapshot();
    prepareOpeningInitiative();
    state.phase = "running";
    state.previewPlacementSquare = null;
    clearInspectState();
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
    captureScoreSnapshot();
    prepareOpeningInitiative();
    state.phase = "paused";
    state.previewPlacementSquare = null;
    clearInspectState();
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

  const actionStart = { row: actor.row, col: actor.col };
  const openingAction = isPawnOpeningAction(actor);
  const action = decideAction(actor);
  actor.initiative = Math.max(0, actor.initiative - ACTION_THRESHOLD);

  if (action.kind === "attack") {
    await resolveAttack(actor, action.target);
  } else if (action.kind === "move") {
    await resolveMove(actor, action.move, action.reason);
  } else {
    addActionLog(`${pieceName(actor)} from ${squareName(actor.row, actor.col)} holds. No useful move or attack is available.`);
  }
  markActionUsed(actor, actionStart, openingAction);

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

function prepareOpeningInitiative() {
  state.pieces.forEach((piece) => {
    if (isPawnOpeningAction(piece)) {
      piece.initiative = Math.max(piece.initiative, ACTION_THRESHOLD);
    }
  });
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
  const currentLaneScore = scoreLanePotential(actor, actor.row, actor.col, targets);
  const currentFutureAttack = scoreFutureAttackPotential(actor, actor.row, actor.col, targets);
  const currentRookAnchorScore = actor.type === "rook" ? scoreRookAnchor(actor, currentSafety, currentLaneScore, currentFutureAttack) : 0;
  const currentBishopAnchorScore = actor.type === "bishop" ? scoreBishopAnchor(actor, currentSafety, currentLaneScore, currentFutureAttack) : 0;
  const legalMoveCount = moves.length;

  moves.forEach((move) => {
    const safety = scoreMoveSafety(actor, move, coverage);
    const safetyGain = currentSafety.penalty - safety.penalty;
    let moveScore = safety.score + Math.max(-30, Math.min(44, safetyGain * 0.38));
    let useful = false;
    let createsAttack = false;
    let moveReason = "closing distance";

    if (safetyGain > 24) {
      useful = true;
      moveReason = "choosing a safer square";
    }

    // One-turn lookahead: reward what this unit can threaten from the destination
    // without simulating a full enemy reply. Values stay below hard attack scores.
    const futureAttack = scoreFutureAttackPotential(actor, move.row, move.col, targets);
    createsAttack = futureAttack.hasAttack;
    moveScore += futureAttack.score;
    if (futureAttack.hasAttack) {
      useful = true;
      moveReason = PIECES[actor.type].role === "ranged" ? "creating a line of attack" : "setting up an attack";
    }

    // Ranged pieces get a compact lane-quality bonus; melee/leapers mostly use
    // future attack potential and safety to avoid becoming passive.
    const laneScore = scoreLanePotential(actor, move.row, move.col, targets);
    moveScore += laneScore;
    if (laneScore > 0 && safety.danger.attackers === 0 && isUsefulLaneMove(actor, laneScore, currentLaneScore, futureAttack)) {
      useful = true;
      if (!futureAttack.hasAttack && PIECES[actor.type].role === "ranged") {
        moveReason = "opening a firing line";
      }
    }

    moveScore += scoreTeamworkAndBlocking(actor, move.row, move.col, safety);
    moveScore += scoreRookLaneDiscipline(actor, safety, futureAttack, laneScore, currentLaneScore);
    moveScore += scoreBishopDiagonalDiscipline(actor, safety, futureAttack, laneScore, currentLaneScore);
    moveScore += scoreQueenFlexiblePressure(actor, move, safety, futureAttack, laneScore, currentLaneScore);
    moveScore += scoreKingProtectedAdvance(actor, move, safety, futureAttack, targets);

    let bestTargetScore = -Infinity;
    targets.forEach((target) => {
      const fromDistance = distance(actor, target);
      const toDistance = distance(move, target);
      let score = targetScore(actor, target) - toDistance * 3;

      if (toDistance < fromDistance) {
        score += (fromDistance - toDistance) * 16;
        if (actor.type !== "rook" && actor.type !== "bishop" && actor.type !== "queen") {
          useful = true;
        }
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
        useful = true;
        moveReason = "opening a firing line";
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

    if (shouldPenalizeImmediateReturn(actor, move, safety, currentSafety, createsAttack, legalMoveCount)) {
      moveScore -= 46;
      if (moveReason === "closing distance") {
        moveReason = "avoiding a repetitive route";
      }
    }

    if (useful && moveScore > bestScore) {
      bestScore = moveScore;
      best = { row: move.row, col: move.col, reason: safetyAwareReason(moveReason, safety) };
    }
  });

  if (actor.type === "rook" && shouldRookHoldLane(currentSafety, currentRookAnchorScore, bestScore)) {
    return null;
  }
  if (actor.type === "bishop" && shouldBishopHoldDiagonal(currentSafety, currentBishopAnchorScore, bestScore)) {
    return null;
  }

  return best;
}

function buildMoveCoverage(actor) {
  const ignoreIds = new Set([actor.id]);
  return {
    danger: buildCoverageMap(opponentSide(actor.side), ignoreIds),
    protection: buildCoverageMap(actor.side, ignoreIds),
  };
}

function buildCoverageMap(attackingSide, ignoreIds = new Set(), extraAttackers = []) {
  const size = boardSize();
  const map = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      attackers: 0,
      damage: 0,
      maxDamage: 0,
      pieces: [],
    }))
  );

  sidePieces(attackingSide).concat(extraAttackers.filter((attacker) => attacker.side === attackingSide)).forEach((attacker) => {
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

function scoreMoveSafety(actor, move, coverage) {
  const safety = scoreSquareSafety(actor, move, coverage);
  if (actor.type !== "rook" && actor.type !== "bishop" && actor.type !== "queen") {
    return safety;
  }

  // Rooks, bishops, and queens are valuable lane controllers, so pawn and knight
  // coverage should matter more than it does for disposable front-line pieces.
  const controllerPenalty = scoreLaneControllerDangerPenalty(actor, move, safety);
  return {
    ...safety,
    penalty: safety.penalty + controllerPenalty,
    score: safety.score - controllerPenalty,
  };
}

function scoreFutureAttackPotential(actor, row, col, targets) {
  let best = 0;
  let total = 0;
  let hasAttack = false;

  targets.forEach((target) => {
    if (!canAttackFrom(actor, row, col, target)) {
      return;
    }
    hasAttack = true;
    const canFinish = target.hp <= actor.damage;
    const roleBonus = futureAttackRoleBonus(actor);
    const score = targetScore(actor, target) * 0.85 + roleBonus + (canFinish ? 34 : 0) + Math.max(0, target.maxHp - target.hp) * 4;
    best = Math.max(best, score);
    total += score * 0.18;
  });

  return { hasAttack, score: best + total };
}

function futureAttackRoleBonus(actor) {
  if (actor.type === "queen") return 155;
  if (PIECES[actor.type].role === "ranged") return 120;
  if (actor.type === "knight") return 104;
  if (actor.type === "king") return 82;
  if (actor.type === "pawn") return 58;
  return 70;
}

function scoreLanePotential(actor, row, col, targets) {
  if (PIECES[actor.type].role !== "ranged") {
    return actor.type === "pawn" ? scorePawnForwardPressure(actor, row, col, targets) : 0;
  }
  if (actor.type === "rook") {
    return scoreRookLanePotential(actor, row, col, targets);
  }
  if (actor.type === "bishop") {
    return scoreBishopDiagonalPotential(actor, row, col, targets);
  }
  if (actor.type === "queen") {
    return scoreQueenLanePotential(actor, row, col, targets);
  }

  const openLine = openLineScore(actor, row, col) * MOVE_PROFILES[actor.type].lane * 0.75;
  const visibleTargetScore = visibleLineTargets(actor, row, col).reduce((score, target) => score + targetScore(actor, target) * 0.28, 0);
  const multiLineBonus = actor.type === "queen" ? Math.min(30, visibleLineTargets(actor, row, col).length * 10) : 0;
  return openLine + visibleTargetScore + multiLineBonus;
}

function isUsefulLaneMove(actor, laneScore, currentLaneScore, futureAttack) {
  if (actor.type === "rook") {
    return isRookLaneImprovement(laneScore, currentLaneScore, futureAttack);
  }
  if (actor.type === "bishop") {
    return isBishopDiagonalImprovement(laneScore, currentLaneScore, futureAttack);
  }
  if (actor.type === "queen") {
    return isQueenLaneImprovement(laneScore, currentLaneScore, futureAttack);
  }
  return true;
}

function scoreLaneControllerDangerPenalty(actor, move, safety) {
  if (actor.type === "rook") {
    return scoreRookDangerPenalty(actor, move, safety);
  }
  if (actor.type === "bishop") {
    return scoreBishopDangerPenalty(actor, move, safety);
  }
  if (actor.type === "queen") {
    return scoreQueenDangerPenalty(actor, move, safety);
  }
  return 0;
}

function scoreRookLanePotential(actor, row, col, targets) {
  const visibleTargets = visibleLineTargets(actor, row, col);
  const openLine = openLineScore(actor, row, col) * MOVE_PROFILES.rook.lane * 0.45;
  const visibleTargetScore = visibleTargets.reduce((score, target) => score + targetScore(actor, target) * 0.42, 0);
  const laneContactBonus = visibleTargets.length > 0 ? 48 : 0;
  return openLine + visibleTargetScore + laneContactBonus;
}

function isRookLaneImprovement(laneScore, currentLaneScore, futureAttack) {
  return futureAttack.hasAttack || laneScore >= currentLaneScore + 12 || laneScore >= 72;
}

function scoreRookLaneDiscipline(actor, safety, futureAttack, laneScore, currentLaneScore) {
  if (actor.type !== "rook") {
    return 0;
  }
  let score = 0;

  // Discourage drifting into ordinary open squares. Rooks should relocate when
  // the move makes a lane materially better, creates an attack, or gets safer.
  if (!futureAttack.hasAttack && laneScore < currentLaneScore + 12) {
    score -= 34;
  }
  if (safety.protection.attackers > 0) {
    score += 16 + safety.protection.attackers * 6;
  }
  if (safety.danger.attackers > 0 && !futureAttack.hasAttack) {
    score -= 46;
  }
  return score;
}

function scoreRookAnchor(actor, safety, laneScore, futureAttack) {
  if (safety.danger.attackers > 0) {
    return -Infinity;
  }
  let score = laneScore + futureAttack.score;
  if (laneScore >= 44) {
    score += 42;
  }
  if (safety.protection.attackers > 0) {
    score += 14;
  }
  return score;
}

function shouldRookHoldLane(currentSafety, currentRookAnchorScore, bestMoveScore) {
  return currentSafety.danger.attackers === 0 && currentRookAnchorScore >= 86 && bestMoveScore < currentRookAnchorScore + 26;
}

function scoreRookDangerPenalty(actor, move, safety) {
  let penalty = 0;
  safety.danger.pieces.forEach((attacker) => {
    if (attacker.type === "pawn") {
      penalty += 138;
    } else if (attacker.type === "knight") {
      penalty += 122;
    } else {
      penalty += 26 + PIECES[attacker.type].cost * 5;
    }
  });
  if (safety.danger.damage >= actor.hp) {
    penalty += 130;
  } else if (safety.danger.damage >= Math.ceil(actor.hp / 2)) {
    penalty += 58;
  }
  if (isAdjacentToEnemyPawn(actor, move.row, move.col)) {
    penalty += 54;
  }
  if (safety.protection.attackers > 0) {
    penalty = Math.max(0, penalty - Math.min(42, safety.protection.attackers * 14 + safety.protection.damage * 4));
  }
  return penalty;
}

function scoreBishopDiagonalPotential(actor, row, col, targets) {
  const visibleTargets = visibleLineTargets(actor, row, col);
  const openDiagonal = openLineScore(actor, row, col) * MOVE_PROFILES.bishop.lane * 0.52;
  const visibleTargetScore = visibleTargets.reduce((score, target) => score + targetScore(actor, target) * 0.38, 0);
  const diagonalContactBonus = visibleTargets.length > 0 ? 42 : 0;
  return openDiagonal + visibleTargetScore + diagonalContactBonus;
}

function isBishopDiagonalImprovement(laneScore, currentLaneScore, futureAttack) {
  return futureAttack.hasAttack || laneScore >= currentLaneScore + 10 || laneScore >= 62;
}

function scoreBishopDiagonalDiscipline(actor, safety, futureAttack, laneScore, currentLaneScore) {
  if (actor.type !== "bishop") {
    return 0;
  }
  let score = 0;

  // Bishops should act like diagonal snipers: relocate for materially better
  // diagonals or clear shots, not just to shuffle along an equivalent lane.
  if (!futureAttack.hasAttack && laneScore < currentLaneScore + 10) {
    score -= 30;
  }
  if (safety.protection.attackers > 0) {
    score += 12 + safety.protection.attackers * 5;
  }
  if (safety.danger.attackers > 0 && !futureAttack.hasAttack) {
    score -= 38;
  }
  return score;
}

function scoreBishopAnchor(actor, safety, laneScore, futureAttack) {
  if (safety.danger.attackers > 0) {
    return -Infinity;
  }
  let score = laneScore + futureAttack.score;
  if (laneScore >= 38) {
    score += 38;
  }
  if (safety.protection.attackers > 0) {
    score += 12;
  }
  return score;
}

function shouldBishopHoldDiagonal(currentSafety, currentBishopAnchorScore, bestMoveScore) {
  return currentSafety.danger.attackers === 0 && currentBishopAnchorScore >= 74 && bestMoveScore < currentBishopAnchorScore + 24;
}

function scoreBishopDangerPenalty(actor, move, safety) {
  let penalty = 0;
  safety.danger.pieces.forEach((attacker) => {
    if (attacker.type === "pawn") {
      penalty += 120;
    } else if (attacker.type === "knight") {
      penalty += 110;
    } else {
      penalty += 22 + PIECES[attacker.type].cost * 4;
    }
  });
  if (safety.danger.damage >= actor.hp) {
    penalty += 118;
  } else if (safety.danger.damage >= Math.ceil(actor.hp / 2)) {
    penalty += 46;
  }
  if (isAdjacentToEnemyPawn(actor, move.row, move.col)) {
    penalty += 34;
  }
  if (safety.protection.attackers > 0) {
    penalty = Math.max(0, penalty - Math.min(36, safety.protection.attackers * 12 + safety.protection.damage * 3));
  }
  return penalty;
}

function scoreQueenLanePotential(actor, row, col, targets) {
  const visibleTargets = visibleLineTargets(actor, row, col);
  const lineCount = countUsefulLineDirections(actor, row, col);
  const openFlex = openLineScore(actor, row, col) * MOVE_PROFILES.queen.lane * 0.48;
  const visibleTargetScore = visibleTargets.reduce((score, target) => score + targetScore(actor, target) * 0.34, 0);
  const multiLineBonus = Math.min(58, Math.max(0, lineCount - 1) * 14 + visibleTargets.length * 8);
  return openFlex + visibleTargetScore + multiLineBonus;
}

function isQueenLaneImprovement(laneScore, currentLaneScore, futureAttack) {
  return futureAttack.hasAttack || laneScore >= currentLaneScore + 8 || laneScore >= 82;
}

function scoreQueenFlexiblePressure(actor, move, safety, futureAttack, laneScore, currentLaneScore) {
  if (actor.type !== "queen") {
    return 0;
  }
  let score = 0;
  const lineCount = countUsefulLineDirections(actor, move.row, move.col);

  // Queens should feel flexible and dangerous from safe squares with several
  // lines, but should not get melee-style credit for simply drifting closer.
  if (safety.danger.attackers === 0) {
    score += Math.min(48, lineCount * 9);
    if (isCentralSquare(move.row, move.col)) {
      score += 14;
    }
  }
  if (!futureAttack.hasAttack && laneScore < currentLaneScore + 8) {
    score -= 24;
  }
  if (safety.danger.attackers > 0 && !futureAttack.hasAttack) {
    score -= 64;
  }
  if (futureAttack.hasAttack && safety.danger.attackers === 0) {
    score += 32;
  }
  return score;
}

function scoreQueenDangerPenalty(actor, move, safety) {
  let penalty = 0;
  safety.danger.pieces.forEach((attacker) => {
    if (attacker.type === "pawn") {
      penalty += 150;
    } else if (attacker.type === "knight") {
      penalty += 138;
    } else {
      penalty += 34 + PIECES[attacker.type].cost * 7;
    }
  });
  if (safety.danger.damage >= actor.hp) {
    penalty += 190;
  } else if (safety.danger.damage >= Math.ceil(actor.hp / 2)) {
    penalty += 82;
  }
  if (isAdjacentToEnemyPawn(actor, move.row, move.col)) {
    penalty += 76;
  }
  if (safety.protection.attackers > 0) {
    penalty = Math.max(0, penalty - Math.min(52, safety.protection.attackers * 15 + safety.protection.damage * 4));
  }
  return penalty;
}

function countUsefulLineDirections(actor, row, col) {
  return directionsFor(actor.type).reduce((count, [dr, dc]) => {
    let nextRow = row + dr;
    let nextCol = col + dc;
    let openSquares = 0;
    while (inBounds(nextRow, nextCol)) {
      if (isBlockedSquare(nextRow, nextCol)) {
        break;
      }
      const occupant = pieceAt(nextRow, nextCol, new Set([actor.id]));
      if (occupant) {
        return count + (occupant.side !== actor.side || openSquares >= 2 ? 1 : 0);
      }
      openSquares += 1;
      nextRow += dr;
      nextCol += dc;
    }
    return count + (openSquares >= 2 ? 1 : 0);
  }, 0);
}

function isCentralSquare(row, col) {
  const center = (boardSize() - 1) / 2;
  return Math.abs(row - center) <= 2 && Math.abs(col - center) <= 2;
}

function scoreKingProtectedAdvance(actor, move, safety, futureAttack, targets) {
  if (actor.type !== "king") {
    return 0;
  }

  let score = 0;
  const friendlySupport = countNearbyPieces(actor.side, move.row, move.col, 1, actor.id);
  const enemyAdjacent = countNearbyPieces(opponentSide(actor.side), move.row, move.col, 1);
  const closestEnemy = closestTarget(move, targets);
  const currentClosestEnemy = closestTarget(actor, targets);

  // Kings should feel like protected bruisers: strong near friends and under
  // cover, but poor when stepping alone into several enemy threats.
  score += safety.protection.attackers * 24 + safety.protection.damage * 5;
  score += friendlySupport * 14;

  if (futureAttack.hasAttack) {
    score += 44;
  }
  if (closestEnemy && currentClosestEnemy && distance(move, closestEnemy) < distance(actor, currentClosestEnemy)) {
    score += safety.danger.attackers === 0 || safety.protection.attackers > 0 ? 22 : 6;
  }
  if (closestEnemy && closestEnemy.hp <= actor.damage && distance(move, closestEnemy) <= 1) {
    score += 48;
  }
  if (closestEnemy && closestEnemy.hp <= actor.damage && distance(move, closestEnemy) < distance(actor, closestEnemy) && safety.protection.attackers > 0) {
    score += 22;
  }

  if (safety.danger.attackers >= 2) {
    score -= safety.protection.attackers > 0 ? 62 : 132;
  } else if (safety.danger.attackers === 1 && safety.protection.attackers === 0) {
    score -= 44;
  }
  if (enemyAdjacent >= 2) {
    score -= safety.protection.attackers > 0 ? 36 : 86;
  } else if (enemyAdjacent === 1 && friendlySupport === 0 && !futureAttack.hasAttack) {
    score -= 28;
  }
  if (friendlySupport === 0 && safety.protection.attackers === 0 && closestEnemy && distance(move, closestEnemy) <= 2) {
    score -= 36;
  }

  return score;
}

function countNearbyPieces(side, row, col, radius, ignoreId = null) {
  return sidePieces(side).filter((piece) => piece.id !== ignoreId && Math.max(Math.abs(piece.row - row), Math.abs(piece.col - col)) <= radius).length;
}

function closestTarget(square, targets) {
  if (targets.length === 0) {
    return null;
  }
  return targets.reduce((closest, target) => (distance(square, target) < distance(square, closest) ? target : closest), targets[0]);
}

function visibleLineTargets(actor, row, col) {
  const targets = [];
  directionsFor(actor.type).forEach(([dr, dc]) => {
    let nextRow = row + dr;
    let nextCol = col + dc;
    while (inBounds(nextRow, nextCol)) {
      if (isBlockedSquare(nextRow, nextCol)) {
        break;
      }
      const occupant = pieceAt(nextRow, nextCol, new Set([actor.id]));
      if (occupant) {
        if (occupant.side !== actor.side && canAttackFrom(actor, row, col, occupant)) {
          targets.push(occupant);
        }
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  });
  return targets;
}

function scorePawnForwardPressure(actor, row, col, targets) {
  const forward = pawnForward(actor.side);
  return targets.some((target) => target.row === row + forward && Math.abs(target.col - col) === 1) ? 18 : 0;
}

function isAdjacentToEnemyPawn(actor, row, col) {
  return sidePieces(opponentSide(actor.side)).some((piece) => piece.type === "pawn" && Math.max(Math.abs(piece.row - row), Math.abs(piece.col - col)) === 1);
}

function scoreTeamworkAndBlocking(actor, row, col, safety) {
  const support = Math.min(18, safety.protection.attackers * 4 + safety.protection.damage * 2);
  const blockingPenalty = blocksFriendlyRangedLane(actor, row, col) ? 14 : 0;
  return support - blockingPenalty;
}

function blocksFriendlyRangedLane(actor, row, col) {
  return sidePieces(actor.side).some((friend) => {
    if (friend.id === actor.id || PIECES[friend.type].role !== "ranged") {
      return false;
    }
    return sidePieces(opponentSide(actor.side)).some((target) => canAttack(friend, target) && squareLiesBetween(friend.row, friend.col, target.row, target.col, row, col));
  });
}

function squareLiesBetween(fromRow, fromCol, toRow, toCol, row, col) {
  const stepRow = Math.sign(toRow - fromRow);
  const stepCol = Math.sign(toCol - fromCol);
  if (stepRow !== Math.sign(row - fromRow) && row !== fromRow) {
    return false;
  }
  if (stepCol !== Math.sign(col - fromCol) && col !== fromCol) {
    return false;
  }
  let nextRow = fromRow + stepRow;
  let nextCol = fromCol + stepCol;
  while (nextRow !== toRow || nextCol !== toCol) {
    if (nextRow === row && nextCol === col) {
      return true;
    }
    nextRow += stepRow;
    nextCol += stepCol;
  }
  return false;
}

function shouldPenalizeImmediateReturn(actor, move, safety, currentSafety, createsAttack, legalMoveCount) {
  if (!isImmediateReturn(actor, move) || legalMoveCount <= 1 || createsAttack) {
    return false;
  }
  return !(isLethalDanger(actor, currentSafety) && !isLethalDanger(actor, safety));
}

function isImmediateReturn(actor, move) {
  return actor.previousRow === move.row && actor.previousCol === move.col;
}

function isLethalDanger(actor, safety) {
  return safety.danger.damage >= actor.hp || safety.danger.maxDamage >= actor.hp;
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
      if (isBlockedSquare(nextRow, nextCol)) {
        break;
      }
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
  playAttackSound(actor, willKill);
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
      actor.previousRow = from.row;
      actor.previousCol = from.col;
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
  if (target.hp <= 0 && shouldMoveIntoTarget(actor)) {
    await resolveOpportunityAttack(actor, from, to);
  }
}

async function resolveMove(actor, move, reason) {
  const from = { row: actor.row, col: actor.col };
  playSound("move");
  state.destination = { row: move.row, col: move.col };
  render();
  await animateMove(actor, move);
  actor.previousRow = from.row;
  actor.previousCol = from.col;
  actor.row = move.row;
  actor.col = move.col;
  if (actor.type === "pawn" && isPawnOpeningAction(actor)) {
    const squares = Math.abs(move.row - from.row);
    addActionLog(`${pieceName(actor)} from ${squareName(from.row, from.col)} advances ${squares === 2 ? "two squares" : "one square"} to ${squareName(move.row, move.col)}.`);
    await resolveOpportunityAttack(actor, from, move);
    return;
  }
  addActionLog(`${pieceName(actor)} from ${squareName(from.row, from.col)} moves to ${squareName(move.row, move.col)}, ${reason}.`);
  await resolveOpportunityAttack(actor, from, move);
}

async function resolveOpportunityAttack(actor, from, to) {
  if (actor.hp <= 0 || from.row === to.row && from.col === to.col) {
    return false;
  }
  const king = sidePieces(opponentSide(actor.side))
    .filter((piece) => piece.type === "king" && isAdjacentSquare(piece, from.row, from.col) && !isAdjacentSquare(piece, to.row, to.col))
    .sort((a, b) => distance(a, actor) - distance(b, actor) || a.id - b.id)[0];
  if (!king) {
    return false;
  }

  const damage = king.damage;
  const willKill = actor.hp <= damage;
  playAttackSound(king, willKill);
  await animateAttack(king, actor, willKill);

  actor.hp -= damage;
  let message = `${pieceName(king)} punishes retreating ${pieceName(actor)} for ${damage} damage.`;
  if (actor.hp <= 0) {
    state.pieces = state.pieces.filter((piece) => piece.id !== actor.id);
    message += ` ${pieceName(actor)} destroyed.`;
  } else {
    message += ` ${pieceName(actor)} survives with ${actor.hp}/${actor.maxHp} HP.`;
  }
  addActionLog(message);
  return true;
}

function isAdjacentSquare(piece, row, col) {
  return Math.max(Math.abs(piece.row - row), Math.abs(piece.col - col)) === 1;
}

function markActionUsed(actor, actionStart, openingAction) {
  if (actor.type !== "pawn") {
    return;
  }
  if (actor.row !== actionStart.row || actor.col !== actionStart.col) {
    actor.hasMoved = true;
  }
  if (openingAction) {
    actor.openingActionUsed = true;
  }
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
  if (!inBounds(toRow, toCol) || isBlockedSquare(toRow, toCol) || (fromRow === toRow && fromCol === toCol)) {
    return false;
  }
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  const ignore = new Set(ignoreIds);
  ignore.add(actor.id);

  if (actor.type === "pawn") {
    return dr === pawnForward(actor.side) && absC === 1;
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
    return pawnLegalMoves(piece);
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
      if (isBlockedSquare(row, col)) {
        break;
      }
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

function pawnLegalMoves(piece) {
  const forward = pawnForward(piece.side);
  const first = { row: piece.row + forward, col: piece.col };
  if (!isOpen(first.row, first.col)) {
    return [];
  }

  const moves = [first];
  if (isPawnOpeningAction(piece)) {
    const second = { row: piece.row + forward * 2, col: piece.col };
    if (isOpen(second.row, second.col)) {
      moves.push(second);
    }
  }
  return moves;
}

function isPawnOpeningAction(piece) {
  return piece.type === "pawn" && !piece.hasMoved && !piece.openingActionUsed;
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

function pawnForward(side) {
  return side === "player" ? -1 : 1;
}

function isPathClear(fromRow, fromCol, toRow, toCol, ignoreIds = new Set()) {
  const stepRow = Math.sign(toRow - fromRow);
  const stepCol = Math.sign(toCol - fromCol);
  let row = fromRow + stepRow;
  let col = fromCol + stepCol;
  while (row !== toRow || col !== toCol) {
    if (isBlockedSquare(row, col) || pieceAt(row, col, ignoreIds)) {
      return false;
    }
    row += stepRow;
    col += stepCol;
  }
  return true;
}

function isOpen(row, col) {
  return inBounds(row, col) && !isBlockedSquare(row, col) && !pieceAt(row, col);
}

function inBounds(row, col) {
  return row >= 0 && row < boardSize() && col >= 0 && col < boardSize();
}

function isBlockedSquare(row, col) {
  return Boolean(currentScenario().blockedSquares?.some((square) => square.row === row && square.col === col));
}

function pieceAt(row, col, ignoreIds = new Set()) {
  return state.pieces.find((piece) => piece.row === row && piece.col === col && !ignoreIds.has(piece.id)) || null;
}

function sidePieces(side) {
  return state.pieces.filter((piece) => piece.side === side && piece.hp > 0);
}

function armyComposition(side) {
  return compositionFromPieces(sidePieces(side), side === "player" && state.phase === "setup" ? "No units deployed" : "No units remaining");
}

function compositionFromPieces(pieces, emptyText = "None") {
  if (pieces.length === 0) {
    return emptyText;
  }
  return compositionFromCounts(pieceCounts(pieces), emptyText);
}

function compositionFromCounts(counts, emptyText = "None") {
  const entries = Object.keys(PIECES).filter((type) => counts[type] > 0);
  if (entries.length === 0) {
    return emptyText;
  }
  return entries.map((type) => `${PIECES[type].label} x${counts[type]}`).join(", ");
}

function pieceCounts(pieces) {
  return pieces.reduce((summary, piece) => {
    summary[piece.type] = (summary[piece.type] || 0) + 1;
    return summary;
  }, {});
}

function subtractCounts(startCounts, endCounts) {
  return Object.keys(PIECES).reduce((lost, type) => {
    lost[type] = Math.max(0, (startCounts[type] || 0) - (endCounts[type] || 0));
    return lost;
  }, {});
}

function countTotal(counts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function captureScoreSnapshot() {
  if (state.scoreSnapshot) {
    return;
  }
  const scenario = currentScenario();
  const playerArmy = sidePieces("player").map(snapshotPiece);
  const enemyArmy = sidePieces("enemy").map(snapshotPiece);
  state.scoreSnapshot = {
    scenarioName: scenario.label,
    startingBudget: scenario.budget,
    budgetRemaining: state.budget,
    budgetSpent: scenario.budget - state.budget,
    startActionNumber: state.actionNumber,
    playerArmy,
    enemyArmy,
    playerCounts: pieceCounts(playerArmy),
    enemyCounts: pieceCounts(enemyArmy),
  };
}

function snapshotPiece(piece) {
  return { type: piece.type, side: piece.side };
}

function renderScoreboard() {
  const summary = battleSummary();
  if (!summary) {
    scoreboardEl.hidden = true;
    scoreboardEl.classList.remove("victory", "defeat", "stalemate");
    scoreboardStatsEl.innerHTML = "";
    return;
  }

  scoreboardEl.hidden = false;
  scoreboardEl.classList.toggle("victory", summary.result === "Victory");
  scoreboardEl.classList.toggle("defeat", summary.result === "Defeat");
  scoreboardEl.classList.toggle("stalemate", summary.result === "Stalemate");
  scoreboardTitleEl.textContent = summary.result;
  scoreboardGradeEl.textContent = summary.grade;
  scoreboardStatsEl.innerHTML = "";

  [
    ["Scenario", summary.scenarioName],
    ["Actions / Turns", String(summary.actionsTaken)],
    ["Starting Budget", String(summary.startingBudget)],
    ["Budget Spent", String(summary.budgetSpent)],
    ["Budget Remaining", String(summary.budgetRemaining)],
    ["Starting Player Army", summary.startingPlayerComposition],
    ["Surviving Player Army", summary.survivingPlayerComposition],
    ["Player Pieces Lost", `${summary.playerLostCount} (${summary.playerLostComposition})`],
    ["Enemy Pieces Destroyed", `${summary.enemyDestroyedCount} (${summary.enemyDestroyedComposition})`],
  ].forEach(([label, value]) => {
    const stat = document.createElement("div");
    stat.className = "scoreboard-stat";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    stat.append(labelEl, valueEl);
    scoreboardStatsEl.appendChild(stat);
  });
}

function battleSummary() {
  if (state.phase !== "ended" || !["victory", "defeat", "stalemate", "draw"].includes(state.result) || !state.scoreSnapshot) {
    return null;
  }
  const snapshot = state.scoreSnapshot;
  const survivingPlayer = sidePieces("player").map(snapshotPiece);
  const survivingEnemy = sidePieces("enemy").map(snapshotPiece);
  const playerLostCounts = subtractCounts(snapshot.playerCounts, pieceCounts(survivingPlayer));
  const enemyDestroyedCounts = subtractCounts(snapshot.enemyCounts, pieceCounts(survivingEnemy));
  const summary = {
    result: resultLabel(state.result),
    scenarioName: snapshot.scenarioName,
    actionsTaken: state.actionNumber - snapshot.startActionNumber,
    startingBudget: snapshot.startingBudget,
    budgetSpent: snapshot.budgetSpent,
    budgetRemaining: snapshot.budgetRemaining,
    startingPlayerComposition: compositionFromPieces(snapshot.playerArmy, "No units deployed"),
    survivingPlayerComposition: compositionFromPieces(survivingPlayer, "No units remaining"),
    playerLostCount: countTotal(playerLostCounts),
    playerLostComposition: compositionFromCounts(playerLostCounts, "None"),
    enemyDestroyedCount: countTotal(enemyDestroyedCounts),
    enemyDestroyedComposition: compositionFromCounts(enemyDestroyedCounts, "None"),
    startingPlayerCount: snapshot.playerArmy.length,
  };
  summary.grade = gradeBattle(summary);
  return summary;
}

function gradeBattle(summary) {
  if (summary.result === "Stalemate") {
    return "D";
  }
  if (summary.result === "Draw") {
    return "D";
  }
  if (summary.result !== "Victory") {
    return "F";
  }

  // Simple v0 heuristic: start from a perfect run and subtract for long battles,
  // heavy spending, and lost pieces. Thresholds are intentionally broad so the
  // grade reads like a post-battle flavor score instead of a strict simulation.
  let score = 100;
  const actionPar = 18 + summary.enemyDestroyedCount * 4 + summary.startingPlayerCount * 2;
  const budgetRatio = summary.startingBudget > 0 ? summary.budgetSpent / summary.startingBudget : 1;
  const lossRatio = summary.startingPlayerCount > 0 ? summary.playerLostCount / summary.startingPlayerCount : 1;
  score -= Math.max(0, summary.actionsTaken - actionPar) * 0.7;
  score -= budgetRatio * 18;
  score -= lossRatio * 40;
  if (summary.playerLostCount === 0) {
    score += 8;
  }
  if (summary.budgetRemaining <= 2) {
    score -= 6;
  }

  if (score >= 88) return "S";
  if (score >= 74) return "A";
  if (score >= 58) return "B";
  if (score >= 42) return "C";
  return "D";
}

function resultLabel(result) {
  if (result === "victory") return "Victory";
  if (result === "defeat") return "Defeat";
  if (result === "stalemate") return "Stalemate";
  return "Draw";
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
  const floatingDurations = floatingFeedbackDurations();
  appendTemporaryEffect(makeDamageNumber(to.x, to.y, actor.damage, floatingDurations.damage), floatingDurations.damage);
  if (willKill) {
    appendTemporaryEffect(makeKoBurst(to.x, to.y, floatingDurations.ko), floatingDurations.ko);
  }
  await sleep(duration);
  clearTransientEffects();
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
  const floatingDurations = floatingFeedbackDurations();
  appendTemporaryEffect(makeDamageNumber(to.x, to.y, actor.damage, floatingDurations.damage), floatingDurations.damage);
  if (willKill) {
    appendTemporaryEffect(makeKoBurst(to.x, to.y, floatingDurations.ko), floatingDurations.ko);
  }

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
  clearTransientEffects();
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
  clearTransientEffects();
}

function makePulse(x, y, side, duration, className) {
  const pulse = document.createElement("div");
  pulse.className = `${className} ${side}`;
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.style.setProperty("--effect-duration", `${duration}ms`);
  return pulse;
}

function makeDamageNumber(x, y, damage, duration) {
  const number = document.createElement("div");
  number.className = "damage-number";
  number.textContent = `-${damage}`;
  number.style.left = `${x}px`;
  number.style.top = `${y}px`;
  number.style.setProperty("--effect-duration", `${Math.max(220, duration)}ms`);
  return number;
}

function makeKoBurst(x, y, duration) {
  const burst = document.createElement("div");
  burst.className = "ko-burst";
  burst.textContent = "KO";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  burst.style.setProperty("--effect-duration", `${Math.max(240, duration)}ms`);
  return burst;
}

function floatingFeedbackDurations() {
  return FLOATING_FEEDBACK_DURATIONS[state.speed] || FLOATING_FEEDBACK_DURATIONS.normal;
}

function appendTemporaryEffect(effect, duration) {
  effectLayer.appendChild(effect);
  window.setTimeout(() => removeEffectNode(effect), duration);
}

function clearTransientEffects() {
  Array.from(effectLayer.children).forEach((effect) => {
    if (isTransientEffect(effect)) {
      removeEffectNode(effect);
    }
  });
}

function isTransientEffect(effect) {
  const className = effect.className || "";
  return ["attack-beam", "hit-pulse", "move-pulse", "hop-token"].some((name) => className.includes(name));
}

function removeEffectNode(effect) {
  if (effect.parentNode) {
    effect.parentNode.removeChild(effect);
    return;
  }
  if (typeof effect.remove === "function") {
    effect.remove();
  }
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
    if (state.actionNumber >= battleActionLimit()) {
      state.phase = "ended";
      state.result = "stalemate";
      state.activeId = null;
      state.destination = null;
      addLog("Stalemate: action limit reached.", "system");
      return true;
    }
    return false;
  }
  state.phase = "ended";
  state.activeId = null;
  state.destination = null;
  if (playerCount > 0 && enemyCount === 0) {
    state.result = "victory";
    playSound("victory");
    addLog("Victory! Player army wins the battle.", "victory");
  } else if (enemyCount > 0 && playerCount === 0) {
    state.result = "defeat";
    playSound("defeat");
    addLog("Defeat. Enemy army wins the battle.", "defeat");
  } else {
    state.result = "draw";
    addLog("Draw. No pieces remain.", "system");
  }
  return true;
}

function battleActionLimit() {
  return currentScenario().actionLimit || DEFAULT_ACTION_LIMIT;
}

function squareName(row, col) {
  return `${FILES[col]}${boardSize() - row}`;
}

function squareKey(row, col) {
  return `${row},${col}`;
}

function sideName(side) {
  return side === "player" ? "Player" : "Enemy";
}

function pieceName(piece) {
  return `${sideName(piece.side)} ${PIECES[piece.type].label}`;
}

function ensureAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }
  if (!audioContext) {
    audioContext = new AudioContextCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = state.soundVolume;
    masterGain.connect(audioContext.destination);
  }
  updateMasterVolume();
  if (audioContext.state === "suspended" && typeof audioContext.resume === "function") {
    audioContext.resume();
  }
  return audioContext;
}

function updateMasterVolume() {
  if (masterGain) {
    masterGain.gain.value = state.soundEnabled ? state.soundVolume : 0;
  }
}

function playSound(name) {
  const context = ensureAudioContext();
  if (!context || !masterGain) {
    return false;
  }

  const now = context.currentTime;
  if (name === "place") {
    playTone(520, 0.045, { type: "triangle", gain: 0.16, start: now });
    playTone(760, 0.035, { type: "sine", gain: 0.08, start: now + 0.035 });
    return true;
  }
  if (name === "move") {
    playTone(330, 0.08, { type: "triangle", gain: 0.11, endFrequency: 250, start: now });
    return true;
  }
  if (name === "melee") {
    playTone(140, 0.1, { type: "triangle", gain: 0.18, endFrequency: 86, start: now });
    return true;
  }
  if (name === "ranged") {
    playTone(620, 0.11, { type: "sawtooth", gain: 0.09, endFrequency: 1120, start: now });
    playTone(1240, 0.06, { type: "sine", gain: 0.04, start: now + 0.035 });
    return true;
  }
  if (name === "knight") {
    playTone(420, 0.07, { type: "square", gain: 0.08, start: now });
    playTone(180, 0.08, { type: "triangle", gain: 0.13, start: now + 0.055 });
    return true;
  }
  if (name === "ko") {
    playTone(96, 0.16, { type: "triangle", gain: 0.22, endFrequency: 48, start: now });
    playTone(52, 0.12, { type: "sine", gain: 0.12, start: now + 0.04 });
    return true;
  }
  if (name === "victory") {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      playTone(frequency, 0.34, { type: "sine", gain: 0.08, start: now + index * 0.035 });
    });
    return true;
  }
  if (name === "defeat") {
    [220, 185, 146.83].forEach((frequency, index) => {
      playTone(frequency, 0.38, { type: "triangle", gain: 0.09, start: now + index * 0.045 });
    });
    return true;
  }
  return false;
}

function playAttackSound(actor, willKill) {
  if (actor.type === "knight") {
    playSound("knight");
  } else if (PIECES[actor.type].role === "ranged") {
    playSound("ranged");
  } else {
    playSound("melee");
  }
  if (willKill) {
    playSound("ko");
  }
}

function playTone(frequency, duration, options = {}) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = options.start ?? audioContext.currentTime;
  const end = start + duration;
  const peakGain = options.gain ?? 0.1;

  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), end);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + Math.min(0.025, duration * 0.35));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

startButton.addEventListener("click", () => {
  ensureAudioContext();
  startBattle();
});
pauseButton.addEventListener("click", () => {
  ensureAudioContext();
  togglePause();
});
stepButton.addEventListener("click", () => {
  ensureAudioContext();
  stepOneAction();
});
resetButton.addEventListener("click", resetState);
scoreboardResetButton.addEventListener("click", resetState);
scenarioSelectEl.addEventListener("change", () => {
  state.scenarioId = scenarioSelectEl.value;
  resetState();
});
speedSelect.addEventListener("change", () => {
  state.speed = speedSelect.value;
});
soundToggleEl.addEventListener("change", () => {
  state.soundEnabled = soundToggleEl.checked;
  if (state.soundEnabled) {
    ensureAudioContext();
  }
  updateMasterVolume();
});
soundVolumeEl.addEventListener("input", () => {
  state.soundVolume = Number(soundVolumeEl.value);
  updateMasterVolume();
});
overlayMovesEl.addEventListener("change", () => {
  state.overlays.moves = overlayMovesEl.checked;
  renderBoard();
});
overlayAttacksEl.addEventListener("change", () => {
  state.overlays.attacks = overlayAttacksEl.checked;
  renderBoard();
});
overlayThreatEl.addEventListener("change", () => {
  state.overlays.threat = overlayThreatEl.checked;
  renderBoard();
});
overlayProtectionEl.addEventListener("change", () => {
  state.overlays.protection = overlayProtectionEl.checked;
  renderBoard();
});
clearLogButton.addEventListener("click", () => {
  state.log = [];
  renderLog();
});

resetState();
