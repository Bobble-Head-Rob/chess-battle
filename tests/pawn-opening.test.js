const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class FakeClassList {
  constructor() {
    this.items = new Set();
  }

  add(...names) {
    names.forEach((name) => this.items.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.items.delete(name));
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.items.has(name) : Boolean(force);
    if (enabled) {
      this.items.add(name);
    } else {
      this.items.delete(name);
    }
    return enabled;
  }

  contains(name) {
    return this.items.has(name);
  }
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.classList = new FakeClassList();
    this.attributes = {};
    this._innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.parentNode = null;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children.forEach((child) => {
      child.parentNode = null;
    });
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  removeChild(child) {
    this.children = this.children.filter((item) => item !== child);
    child.parentNode = null;
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  addEventListener() {}

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  querySelector(selector) {
    const match = selector.match(/\[data-row="(\d+)"\]\[data-col="(\d+)"\]/);
    if (!match) {
      return null;
    }
    const [, row, col] = match;
    return this.children.find((child) => child.dataset.row === row && child.dataset.col === col) || null;
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 40, height: 40 };
  }
}

class FakeAudioParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }

  setValueAtTime(value, time) {
    this.value = value;
    this.events.push(["set", value, time]);
  }

  linearRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push(["linear", value, time]);
  }

  exponentialRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push(["exponential", value, time]);
  }
}

class FakeAudioNode {
  constructor() {
    this.connections = [];
  }

  connect(node) {
    this.connections.push(node);
    return node;
  }
}

class FakeGainNode extends FakeAudioNode {
  constructor() {
    super();
    this.gain = new FakeAudioParam(1);
  }
}

class FakeOscillatorNode extends FakeAudioNode {
  constructor() {
    super();
    this.frequency = new FakeAudioParam(440);
    this.type = "sine";
    this.started = false;
    this.stopped = false;
  }

  start(time) {
    this.started = time;
  }

  stop(time) {
    this.stopped = time;
  }
}

function createFakeAudioContextClass(instances) {
  return class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = new FakeAudioNode();
      this.state = "running";
      this.gains = [];
      this.oscillators = [];
      instances.push(this);
    }

    createGain() {
      const gain = new FakeGainNode();
      this.gains.push(gain);
      return gain;
    }

    createOscillator() {
      const oscillator = new FakeOscillatorNode();
      this.oscillators.push(oscillator);
      return oscillator;
    }

    resume() {
      this.state = "running";
      return Promise.resolve();
    }
  };
}

function loadGame(options = {}) {
  const { stubAnimations = true, holdSleep = false, audio = false } = options;
  const elements = new Map();
  const timers = [];
  const audioInstances = [];
  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, new FakeElement());
      }
      return elements.get(id);
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createTextNode(text) {
      const node = new FakeElement("#text");
      node.textContent = text;
      return node;
    },
  };
  const context = {
    console,
    document,
    __timers: timers,
    __audioInstances: audioInstances,
    window: {
      setTimeout(callback, ms) {
        timers.push({ callback, ms });
        return timers.length;
      },
    },
  };
  if (audio) {
    context.window.AudioContext = createFakeAudioContextClass(audioInstances);
  }
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
  const sleepStub = holdSleep
    ? "sleep = () => new Promise((resolve) => { globalThis.__finishSleep = resolve; });"
    : "sleep = () => Promise.resolve();";
  const animationStub = stubAnimations
    ? "animateMove = () => Promise.resolve();\nanimateAttack = () => Promise.resolve();"
    : "";
  vm.runInContext(`${source}
${sleepStub}
${animationStub}
render = () => {};
globalThis.__game = {
  ACTION_THRESHOLD,
  SCENARIOS,
  PIECES,
  state,
  boardRows,
  boardCols,
  createPiece,
  inspectPiece,
  clearHoverInspection,
  activeOverlayPiece,
  activeBoardInspection,
  placementPreviewPiece,
  canPreviewPlacement,
  buildBoardOverlays,
  renderBoard,
  renderPiece,
  legalMoves,
  chooseMove,
  decideAction,
  resolveMove,
  resolveAttack,
  canAttack,
  canAttackFrom,
  canThreatenSquare,
  isBlockedSquare,
  placePlayerPiece,
  initiativeReadinessPercent,
  shouldPenalizeImmediateReturn,
  playSound,
  updateMasterVolume,
  prepareOpeningInitiative,
  captureScoreSnapshot,
  chooseNextActor,
  armyCost,
  generateEqualBudgetScrambleArmy,
  refreshScenarioEnemyArmy,
  rerollEnemyArmy,
  animateAttack,
  effectLayer,
  stepOneAction,
  togglePause,
  takeOneAction,
  renderScoreboard,
  renderStatus,
  renderInspectPanel,
  inspectHintEl,
  inspectDetailsEl,
  scoreboardEl,
  scoreboardTitleEl,
  scoreboardGradeEl,
  boardEl,
  budgetValueEl,
  enemyBudgetUsedEl,
  rerollEnemyButton,
  soundToggleEl,
  soundVolumeEl,
  squareKey,
  resetState,
  timers: globalThis.__timers,
  audioInstances: globalThis.__audioInstances,
  runTimers: () => globalThis.__timers.splice(0).forEach((timer) => timer.callback()),
  finishSleep: () => globalThis.__finishSleep && globalThis.__finishSleep(),
};
`, context);
  context.__game.audioInstances = audioInstances;
  return context.__game;
}

function emptyBoard(game, scenarioId = "variety") {
  game.state.scenarioId = scenarioId;
  game.state.pieces = [];
  game.state.nextId = 1;
  game.state.phase = "running";
  game.state.result = null;
  game.state.budget = 99;
  game.state.selectedType = "pawn";
  game.state.previewPlacementSquare = null;
  game.state.hoverInspectPieceId = null;
  game.state.selectedInspectPieceId = null;
  game.state.activeId = null;
  game.state.destination = null;
  game.state.actionBusy = false;
  game.state.loopRunning = false;
  game.state.actionNumber = 0;
  game.state.ticks = 0;
  game.state.scoreSnapshot = null;
  game.state.log = [];
  game.state.pendingTieGroup = null;
}

function addPiece(game, side, type, row, col) {
  const piece = game.createPiece(side, type, row, col);
  game.state.pieces.push(piece);
  return piece;
}

function coords(moves) {
  return Array.from(moves, (move) => `${move.row},${move.col}`);
}

function findByClass(root, className) {
  if ((root.className || "").split(/\s+/).includes(className)) {
    return root;
  }
  for (const child of root.children || []) {
    const found = findByClass(child, className);
    if (found) {
      return found;
    }
  }
  return null;
}

function playableSquareCount(game, scenario) {
  return (scenario.rows || scenario.boardSize) * (scenario.cols || scenario.boardSize) - (scenario.blockedSquares?.length || 0);
}

function uniqueSquareCount(squares) {
  return new Set(squares.map((square) => `${square.row},${square.col}`)).size;
}

function findBlockedLineTestSquare(game, scenario) {
  const rows = scenario.rows || scenario.boardSize;
  const cols = scenario.cols || scenario.boardSize;
  const blockedSet = new Set(scenario.blockedSquares.map((square) => `${square.row},${square.col}`));
  for (let row = 0; row < rows; row += 1) {
    for (let fromCol = 0; fromCol < cols - 2; fromCol += 1) {
      if (blockedSet.has(`${row},${fromCol}`)) {
        continue;
      }
      for (let toCol = fromCol + 2; toCol < cols; toCol += 1) {
        if (blockedSet.has(`${row},${toCol}`)) {
          continue;
        }
        const hasBlockedBetween = scenario.blockedSquares.some((square) => square.row === row && square.col > fromCol && square.col < toCol);
        if (hasBlockedBetween) {
          return { row, fromCol, toCol };
        }
      }
    }
  }
  return null;
}

function sequenceRandom(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

test("pawns can move two squares on their first action when both squares are clear", () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "player", "pawn", 8, 4);
  addPiece(game, "enemy", "king", 0, 4);

  assert.deepEqual(coords(game.legalMoves(pawn)), ["7,4", "6,4"]);
  const move = game.chooseMove(pawn);
  assert.equal(move.row, 6);
  assert.equal(move.col, 4);
});

test("pawns move only one square after their opening action is spent", () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "player", "pawn", 8, 4);
  pawn.hasMoved = true;
  pawn.openingActionUsed = true;

  assert.deepEqual(coords(game.legalMoves(pawn)), ["7,4"]);
});

test("pawns move one square on their opening action if only the first square is clear", () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "player", "pawn", 8, 4);
  addPiece(game, "player", "king", 6, 4);

  assert.deepEqual(coords(game.legalMoves(pawn)), ["7,4"]);
});

test("blocked pawns do not jump through blockers", () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "player", "pawn", 8, 4);
  addPiece(game, "player", "king", 7, 4);

  assert.deepEqual(coords(game.legalMoves(pawn)), []);
});

test("pawn diagonal attacks still work and forward squares are not threatened", () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "player", "pawn", 8, 4);
  const target = addPiece(game, "enemy", "pawn", 7, 5);

  assert.equal(game.canAttack(pawn, target), true);
  assert.equal(game.canThreatenSquare(pawn, 7, 5), true);
  assert.equal(game.canThreatenSquare(pawn, 7, 4), false);
  assert.equal(game.decideAction(pawn).kind, "attack");
});

test("white pawn promotes on the top row and gains queen behavior", async () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "player", "pawn", 1, 4);
  const target = addPiece(game, "enemy", "rook", 0, 7);

  await game.resolveMove(pawn, { row: 0, col: 4 }, "reaching promotion");

  assert.equal(pawn.type, "queen");
  assert.equal(pawn.hp, game.PIECES.queen.hp);
  assert.equal(pawn.maxHp, game.PIECES.queen.hp);
  assert.equal(pawn.damage, game.PIECES.queen.damage);
  assert.equal(pawn.speed, game.PIECES.queen.speed);
  assert.equal(game.canAttack(pawn, target), true);
  assert.equal(game.state.log.at(-1).text, "White pawn promoted to queen.");
});

test("black pawn promotes on the bottom row", async () => {
  const game = loadGame();
  emptyBoard(game);
  const pawn = addPiece(game, "enemy", "pawn", 8, 4);

  await game.resolveMove(pawn, { row: 9, col: 4 }, "reaching promotion");

  assert.equal(pawn.type, "queen");
  assert.equal(pawn.hp, game.PIECES.queen.hp);
  assert.equal(pawn.maxHp, game.PIECES.queen.hp);
  assert.equal(pawn.damage, game.PIECES.queen.damage);
  assert.equal(pawn.speed, game.PIECES.queen.speed);
  assert.equal(game.state.log.at(-1).text, "Black pawn promoted to queen.");
});

test("opening pawns get initiative before non-pawn pieces and player wins pawn ties", () => {
  const game = loadGame();
  emptyBoard(game);
  const playerPawn = addPiece(game, "player", "pawn", 8, 4);
  addPiece(game, "player", "knight", 9, 3);
  addPiece(game, "enemy", "pawn", 1, 4);

  game.prepareOpeningInitiative();

  assert.equal(playerPawn.initiative, game.ACTION_THRESHOLD);
  assert.equal(game.chooseNextActor(), playerPawn);
});

test("same-priority initiative ties alternate player and enemy by board order", () => {
  const game = loadGame();
  emptyBoard(game);
  const playerFront = addPiece(game, "player", "knight", 7, 1);
  const playerBack = addPiece(game, "player", "knight", 8, 6);
  const enemyFront = addPiece(game, "enemy", "knight", 1, 2);
  const enemyBack = addPiece(game, "enemy", "knight", 2, 5);

  [playerFront, playerBack, enemyFront, enemyBack].forEach((piece) => {
    piece.initiative = game.ACTION_THRESHOLD;
  });

  assert.equal(game.chooseNextActor(), playerFront);
  playerFront.initiative = 0;

  assert.equal(game.chooseNextActor(), enemyFront);
  enemyFront.initiative = 0;

  assert.equal(game.chooseNextActor(), playerBack);
  playerBack.initiative = 0;

  assert.equal(game.chooseNextActor(), enemyBack);
});

test("initiative readiness percentage is clamped", () => {
  const game = loadGame();
  emptyBoard(game);
  const piece = addPiece(game, "player", "rook", 8, 4);

  piece.initiative = -2;
  assert.equal(game.initiativeReadinessPercent(piece), 0);

  piece.initiative = 15;
  assert.equal(game.initiativeReadinessPercent(piece), 100);
});

test("initiative overflow is preserved after acting", async () => {
  const game = loadGame();
  emptyBoard(game);
  const knight = addPiece(game, "player", "knight", 8, 0);
  addPiece(game, "enemy", "king", 0, 7);

  await game.takeOneAction();

  assert.equal(knight.initiative, 2);
});

test("speed three initiative follows the expected overflow sequence", async () => {
  const game = loadGame();
  emptyBoard(game);
  const knight = addPiece(game, "player", "knight", 8, 0);
  addPiece(game, "enemy", "king", 0, 7);

  await game.takeOneAction();
  assert.equal(knight.initiative, 2);

  await game.takeOneAction();
  assert.equal(knight.initiative, 1);

  await game.takeOneAction();
  assert.equal(knight.initiative, 0);
});

test("fractional speed initiative accumulates and keeps overflow", async () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 0);
  addPiece(game, "enemy", "king", 0, 7);

  await game.takeOneAction();

  assert.equal(rook.speed, 1.5);
  assert.equal(rook.initiative, 0.5);
});

test("fractional initiative renders as a fractional bar fill", () => {
  const game = loadGame();
  emptyBoard(game);
  const piece = addPiece(game, "player", "rook", 8, 4);
  piece.initiative = 7.5;

  const pieceEl = game.renderPiece(piece);
  const fill = findByClass(pieceEl, "initiative-fill");

  assert.equal(game.initiativeReadinessPercent(piece), 75);
  assert.equal(fill.style.width, "75%");
});

test("ready pieces render a full initiative bar", () => {
  const game = loadGame();
  emptyBoard(game);
  const piece = addPiece(game, "enemy", "knight", 1, 4);
  piece.initiative = game.ACTION_THRESHOLD;

  const pieceEl = game.renderPiece(piece);
  const bar = findByClass(pieceEl, "initiative-bar");
  const fill = findByClass(pieceEl, "initiative-fill");

  assert.equal(bar.className.includes("ready"), true);
  assert.equal(fill.style.width, "100%");
});

test("dead pieces do not render initiative bars", () => {
  const game = loadGame();
  emptyBoard(game);
  const piece = addPiece(game, "enemy", "pawn", 1, 4);
  piece.hp = 0;
  piece.initiative = game.ACTION_THRESHOLD;

  const pieceEl = game.renderPiece(piece);

  assert.equal(findByClass(pieceEl, "initiative-bar"), null);
});

test("inspect panel shows initiative threshold and readiness", () => {
  const game = loadGame();
  emptyBoard(game);
  const piece = addPiece(game, "player", "rook", 8, 4);
  piece.initiative = 7.5;

  game.inspectPiece(piece.id, "selected", false);

  const stats = game.inspectDetailsEl.children[1];
  const values = Object.fromEntries(stats.children.map((item) => [item.children[0].textContent, item.children[1].textContent]));
  assert.equal(values.Initiative, "7.5 / 10");
  assert.equal(values.Readiness, "75%");
});

test("placement preview exposes the pawn opening move overlay", () => {
  const game = loadGame();
  emptyBoard(game);
  game.state.phase = "setup";
  game.state.previewPlacementSquare = { row: 8, col: 4 };

  const preview = game.placementPreviewPiece();
  const overlays = game.buildBoardOverlays();

  assert.deepEqual(coords(game.legalMoves(preview)), ["7,4", "6,4"]);
  assert.equal(overlays.get(game.squareKey(6, 4)).includes("move"), true);
});

test("hover inspection shows and clears overlays when leaving a piece", () => {
  const game = loadGame();
  emptyBoard(game);
  const piece = addPiece(game, "player", "knight", 8, 4);

  game.inspectPiece(piece.id, "hover", false);

  assert.equal(game.state.hoverInspectPieceId, piece.id);
  assert.equal(game.activeOverlayPiece(), piece);
  assert.equal(game.activeBoardInspection(), piece);
  assert.equal(game.inspectHintEl.hidden, true);

  game.clearHoverInspection(piece.id, false);

  assert.equal(game.state.hoverInspectPieceId, null);
  assert.equal(game.activeOverlayPiece(), null);
  assert.equal(game.activeBoardInspection(), null);
  assert.equal(game.inspectHintEl.hidden, false);
});

test("setup hover clear falls back to selected shop piece info", () => {
  const game = loadGame();
  emptyBoard(game);
  game.state.phase = "setup";
  game.state.selectedType = "knight";
  const piece = addPiece(game, "enemy", "pawn", 1, 4);

  game.inspectPiece(piece.id, "hover", false);
  game.clearHoverInspection(piece.id, false);

  const title = game.inspectDetailsEl.children[0];
  assert.equal(game.inspectHintEl.hidden, true);
  assert.equal(title.children[1].textContent, "Placing: Knight");
});

test("clicked inspection remains selected after hover leaves another piece", () => {
  const game = loadGame();
  emptyBoard(game);
  const selected = addPiece(game, "player", "king", 8, 4);
  const hovered = addPiece(game, "enemy", "pawn", 1, 4);

  game.inspectPiece(selected.id, "selected", false);
  game.inspectPiece(hovered.id, "hover", false);
  game.clearHoverInspection(hovered.id, false);

  assert.equal(game.state.selectedInspectPieceId, selected.id);
  assert.equal(game.activeOverlayPiece(), selected);
  assert.equal(game.activeBoardInspection(), selected);
});

test("immediate return moves are penalized when alternatives exist", () => {
  const game = loadGame();
  const actor = { previousRow: 4, previousCol: 4, hp: 2 };
  const returnMove = { row: 4, col: 4 };
  const safe = { danger: { damage: 0, maxDamage: 0 } };
  const lethal = { danger: { damage: 2, maxDamage: 2 } };

  assert.equal(game.shouldPenalizeImmediateReturn(actor, returnMove, safe, safe, false, 2), true);
  assert.equal(game.shouldPenalizeImmediateReturn(actor, returnMove, safe, safe, true, 2), false);
  assert.equal(game.shouldPenalizeImmediateReturn(actor, returnMove, safe, safe, false, 1), false);
  assert.equal(game.shouldPenalizeImmediateReturn(actor, returnMove, safe, lethal, false, 2), false);
});

test("bishop prefers a move creating diagonal attack potential", () => {
  const game = loadGame();
  emptyBoard(game);
  const bishop = addPiece(game, "player", "bishop", 8, 1);
  addPiece(game, "enemy", "rook", 5, 0);

  const move = game.chooseMove(bishop);

  assert.equal(move.row, 7);
  assert.equal(move.col, 2);
});

test("bishop attacks a clean visible diagonal target instead of moving", () => {
  const game = loadGame();
  emptyBoard(game);
  const bishop = addPiece(game, "player", "bishop", 8, 1);
  const target = addPiece(game, "enemy", "rook", 5, 4);

  const action = game.decideAction(bishop);

  assert.equal(action.kind, "attack");
  assert.equal(action.target, target);
});

test("bishop holds a useful safe diagonal instead of shuffling", () => {
  const game = loadGame();
  emptyBoard(game);
  const bishop = addPiece(game, "player", "bishop", 5, 4);
  bishop.previousRow = 6;
  bishop.previousCol = 3;

  assert.equal(game.chooseMove(bishop), null);
});

test("bishop avoids pawn diagonal threat when safe diagonal options exist", () => {
  const game = loadGame();
  emptyBoard(game);
  const bishop = addPiece(game, "player", "bishop", 8, 4);
  const pawn = addPiece(game, "enemy", "pawn", 5, 1);
  addPiece(game, "enemy", "rook", 4, 4);

  const move = game.chooseMove(bishop);

  assert.notEqual(move, null);
  assert.equal(game.canAttackFrom(pawn, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("bishop avoids knight attack range when safe diagonal options exist", () => {
  const game = loadGame();
  emptyBoard(game);
  const bishop = addPiece(game, "player", "bishop", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 4, 3);
  addPiece(game, "enemy", "rook", 4, 4);

  const move = game.chooseMove(bishop);

  assert.notEqual(move, null);
  assert.equal(game.canAttackFrom(knight, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("blocked terrain stops bishop diagonal line of sight", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  const bishop = addPiece(game, "player", "bishop", 6, 1);
  const target = addPiece(game, "enemy", "rook", 2, 5);

  assert.equal(game.canAttack(bishop, target), false);
});

test("rook prefers a move creating straight-line attack potential", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 1);
  const target = addPiece(game, "enemy", "bishop", 5, 3);

  const move = game.chooseMove(rook);

  assert.equal(game.canAttackFrom(rook, move.row, move.col, target), true);
});

test("rook speed is tuned upward for more active lane control", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 4);

  assert.equal(rook.speed, 1.5);
});

test("rook attacks a clean visible lane target instead of moving", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 4);
  const target = addPiece(game, "enemy", "bishop", 8, 8);

  const action = game.decideAction(rook);

  assert.equal(action.kind, "attack");
  assert.equal(action.target, target);
});

test("rook avoids pawn diagonal threat when safe lane options exist", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 4);
  const pawn = addPiece(game, "enemy", "pawn", 5, 3);
  addPiece(game, "enemy", "bishop", 6, 7);

  const move = game.chooseMove(rook);

  assert.notEqual(move, null);
  assert.equal(game.canAttackFrom(pawn, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("rook avoids knight attack range when safe lane options exist", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 4, 5);
  addPiece(game, "enemy", "bishop", 6, 7);

  const move = game.chooseMove(rook);

  assert.notEqual(move, null);
  assert.equal(game.canAttackFrom(knight, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("rook holds a useful safe lane instead of wandering", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 5, 4);

  assert.equal(game.chooseMove(rook), null);
});

test("knight prefers a move creating useful L-shape target pressure", () => {
  const game = loadGame();
  emptyBoard(game);
  const knight = addPiece(game, "player", "knight", 8, 4);
  addPiece(game, "enemy", "queen", 5, 5);

  const move = game.chooseMove(knight);

  assert.equal(move.row, 6);
  assert.equal(move.col, 3);
});

test("queen avoids dangerous future-attack square when safer strong square exists", () => {
  const game = loadGame();
  emptyBoard(game);
  const queen = addPiece(game, "player", "queen", 8, 4);
  const target = addPiece(game, "enemy", "king", 5, 6);
  const guard = addPiece(game, "enemy", "pawn", 4, 3);

  const move = game.chooseMove(queen);

  assert.equal(game.canAttackFrom(queen, move.row, move.col, target), true);
  assert.notDeepEqual([move.row, move.col], [5, 4]);
  assert.equal(game.canAttackFrom(guard, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("queen attacks a clean visible target before moving", () => {
  const game = loadGame();
  emptyBoard(game);
  const queen = addPiece(game, "player", "queen", 8, 4);
  const target = addPiece(game, "enemy", "rook", 8, 8);

  const action = game.decideAction(queen);

  assert.equal(action.kind, "attack");
  assert.equal(action.target, target);
});

test("queen prefers a safe multi-line pressure square", () => {
  const game = loadGame();
  emptyBoard(game);
  const queen = addPiece(game, "player", "queen", 8, 4);
  const sideTarget = addPiece(game, "enemy", "bishop", 6, 1);
  const diagonalTarget = addPiece(game, "enemy", "rook", 3, 7);

  const move = game.chooseMove(queen);
  const pressuredTargets = [sideTarget, diagonalTarget].filter((target) => game.canAttackFrom(queen, move.row, move.col, target));

  assert.deepEqual([move.row, move.col], [6, 4]);
  assert.equal(pressuredTargets.length, 2);
});

test("queen avoids knight attack range when no strong payoff exists", () => {
  const game = loadGame();
  emptyBoard(game);
  const queen = addPiece(game, "player", "queen", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 4, 5);
  addPiece(game, "enemy", "bishop", 6, 1);
  addPiece(game, "enemy", "rook", 3, 7);

  const move = game.chooseMove(queen);

  assert.notEqual(move, null);
  assert.equal(game.canAttackFrom(knight, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("queen repositions around blocked terrain to create a useful lane", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  const queen = addPiece(game, "player", "queen", 6, 1);
  const target = addPiece(game, "enemy", "king", 2, 5);

  assert.equal(game.canAttack(queen, target), false);

  const move = game.chooseMove(queen);

  assert.notEqual(move, null);
  assert.equal(game.canAttackFrom(queen, move.row, move.col, target), true);
});

test("king prefers a protected advance over an isolated advance", () => {
  const game = loadGame();
  emptyBoard(game);
  const king = addPiece(game, "player", "king", 8, 4);
  const guards = [addPiece(game, "player", "pawn", 8, 2), addPiece(game, "player", "pawn", 8, 6)];
  addPiece(game, "enemy", "rook", 5, 4);

  const move = game.chooseMove(king);

  assert.notEqual(move, null);
  assert.equal(
    guards.some((guard) => game.canAttackFrom(guard, move.row, move.col, { side: "enemy", row: move.row, col: move.col }) || Math.max(Math.abs(guard.row - move.row), Math.abs(guard.col - move.col)) <= 1),
    true
  );
});

test("king avoids moving into multiple enemy threats", () => {
  const game = loadGame();
  emptyBoard(game);
  const king = addPiece(game, "player", "king", 8, 4);
  const pawnA = addPiece(game, "enemy", "pawn", 6, 3);
  const pawnB = addPiece(game, "enemy", "pawn", 6, 5);
  addPiece(game, "enemy", "rook", 5, 4);

  const move = game.chooseMove(king);

  assert.notDeepEqual([move.row, move.col], [7, 4]);
  assert.equal(game.canAttackFrom(pawnA, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
  assert.equal(game.canAttackFrom(pawnB, move.row, move.col, { side: "player", row: move.row, col: move.col }), false);
});

test("king moves toward a weak nearby enemy when protected", () => {
  const game = loadGame();
  emptyBoard(game);
  const king = addPiece(game, "player", "king", 8, 4);
  addPiece(game, "player", "pawn", 8, 3);
  const target = addPiece(game, "enemy", "pawn", 6, 4);

  const move = game.chooseMove(king);

  assert.deepEqual([move.row, move.col], [7, 4]);
  assert.equal(game.canAttackFrom(king, move.row, move.col, target), true);
});

test("king attacks an adjacent target before wandering", () => {
  const game = loadGame();
  emptyBoard(game);
  const king = addPiece(game, "player", "king", 8, 4);
  const target = addPiece(game, "enemy", "pawn", 7, 4);

  const action = game.decideAction(king);

  assert.equal(action.kind, "attack");
  assert.equal(action.target, target);
});

test("king does not freeze when a safe protected approach exists", () => {
  const game = loadGame();
  emptyBoard(game);
  const king = addPiece(game, "player", "king", 8, 4);
  const guards = [addPiece(game, "player", "pawn", 8, 3), addPiece(game, "player", "pawn", 8, 6)];
  addPiece(game, "enemy", "bishop", 4, 7);

  const move = game.chooseMove(king);

  assert.notEqual(move, null);
  assert.equal(
    guards.some((guard) => game.canAttackFrom(guard, move.row, move.col, { side: "enemy", row: move.row, col: move.col }) || Math.max(Math.abs(guard.row - move.row), Math.abs(guard.col - move.col)) <= 1),
    true
  );
});

test("enemy moving out of king adjacency takes opportunity damage", async () => {
  const game = loadGame();
  emptyBoard(game);
  addPiece(game, "player", "king", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 7, 5);

  await game.resolveMove(knight, { row: 5, col: 6 }, "testing disengage");

  assert.equal(knight.hp, 1);
  assert.match(game.state.log.at(-1).text, /punishes retreating Enemy Knight for 2 damage/);
});

test("enemy staying adjacent to a king does not trigger opportunity damage", async () => {
  const game = loadGame();
  emptyBoard(game);
  addPiece(game, "player", "king", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 7, 5);

  await game.resolveMove(knight, { row: 8, col: 5 }, "testing close move");

  assert.equal(knight.hp, 3);
  assert.equal(game.state.log.some((entry) => entry.text.includes("punishes retreating")), false);
});

test("enemy moving while outside king adjacency does not trigger opportunity damage", async () => {
  const game = loadGame();
  emptyBoard(game);
  addPiece(game, "player", "king", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 5, 5);

  await game.resolveMove(knight, { row: 4, col: 7 }, "testing distant move");

  assert.equal(knight.hp, 3);
  assert.equal(game.state.log.some((entry) => entry.text.includes("punishes retreating")), false);
});

test("king opportunity damage can destroy a retreating enemy", async () => {
  const game = loadGame();
  emptyBoard(game);
  addPiece(game, "player", "king", 8, 4);
  const pawn = addPiece(game, "enemy", "pawn", 7, 5);

  await game.resolveMove(pawn, { row: 6, col: 5 }, "testing lethal disengage");

  assert.equal(game.state.pieces.includes(pawn), false);
  assert.match(game.state.log.at(-1).text, /Enemy Pawn destroyed/);
});

test("knight disengage from king adjacency triggers opportunity damage", async () => {
  const game = loadGame();
  emptyBoard(game);
  addPiece(game, "player", "king", 8, 4);
  const knight = addPiece(game, "enemy", "knight", 7, 3);

  await game.resolveMove(knight, { row: 5, col: 2 }, "testing knight disengage");

  assert.equal(knight.hp, 1);
});

test("king stats remain unchanged by opportunity attack tuning", () => {
  const game = loadGame();

  assert.equal(game.PIECES.king.speed, 1);
  assert.equal(game.PIECES.king.hp, 6);
  assert.equal(game.PIECES.king.damage, 2);
  assert.equal(game.PIECES.king.cost, 8);
});

test("broken center blocked squares render as unusable cells", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");

  game.renderBoard();

  const blockedCells = game.boardEl.children.filter((cell) => cell.classList.contains("blocked-square"));
  assert.equal(blockedCells.length, 4);
  assert.deepEqual(
    blockedCells.map((cell) => `${cell.dataset.row},${cell.dataset.col}`).sort(),
    ["3,3", "3,4", "4,3", "4,4"]
  );
});

for (const scenarioId of ["pillarGarden", "twinCauseways", "fortressRing"]) {
  test(`${scenarioId} has exactly 64 playable squares`, () => {
    const game = loadGame();
    const scenario = game.SCENARIOS[scenarioId];
    const rows = scenario.rows || scenario.boardSize;
    const cols = scenario.cols || scenario.boardSize;

    assert.equal(playableSquareCount(game, scenario), 64);
    assert.equal(uniqueSquareCount(scenario.blockedSquares), scenario.blockedSquares.length);
    scenario.blockedSquares.forEach((square) => {
      assert.equal(square.row >= 0 && square.row < rows, true);
      assert.equal(square.col >= 0 && square.col < cols, true);
    });
  });

  test(`${scenarioId} renders blocked tiles and keeps overlays off them`, () => {
    const game = loadGame();
    emptyBoard(game, scenarioId);
    const scenario = game.SCENARIOS[scenarioId];
    const scout = addPiece(game, "player", "queen", game.boardRows() - 2, Math.min(3, game.boardCols() - 1));
    game.state.selectedInspectPieceId = scout.id;
    game.state.overlays = { moves: true, attacks: true, threat: true, protection: true };

    game.renderBoard();

    const blockedCells = game.boardEl.children.filter((cell) => cell.classList.contains("blocked-square"));
    const overlays = game.buildBoardOverlays();

    assert.equal(blockedCells.length, scenario.blockedSquares.length);
    scenario.blockedSquares.forEach((square) => {
      assert.equal(game.isBlockedSquare(square.row, square.col), true);
      assert.equal(game.canPreviewPlacement(square.row, square.col), false);
      assert.equal(overlays.has(game.squareKey(square.row, square.col)), false);
    });
  });

  test(`${scenarioId} blocked tiles stop ranged line attacks`, () => {
    const game = loadGame();
    emptyBoard(game, scenarioId);
    const scenario = game.SCENARIOS[scenarioId];
    const blocked = findBlockedLineTestSquare(game, scenario);

    assert.ok(blocked);
    const rook = addPiece(game, "player", "rook", blocked.row, blocked.fromCol);
    const target = addPiece(game, "enemy", "king", blocked.row, blocked.toCol);

    assert.equal(game.canAttack(rook, target), false);
  });
}

test("player cannot place on blocked squares", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  game.state.phase = "setup";
  game.SCENARIOS.brokenCenter.blockedSquares.push({ row: 6, col: 4 });

  game.placePlayerPiece(6, 4);

  assert.equal(game.canPreviewPlacement(6, 4), false);
  assert.equal(game.state.pieces.length, 0);
  assert.equal(game.state.budget, 99);
  assert.match(game.state.log.at(-1).text, /blocked/);
});

test("pieces cannot move into blocked squares", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  const king = addPiece(game, "player", "king", 5, 3);

  assert.equal(game.isBlockedSquare(4, 3), true);
  assert.equal(coords(game.legalMoves(king)).includes("4,3"), false);
});

test("ranged attacks do not pass through blocked squares", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  const rook = addPiece(game, "player", "rook", 6, 3);
  const target = addPiece(game, "enemy", "king", 2, 3);

  assert.equal(game.canAttack(rook, target), false);
});

test("knights jump over blocked squares but cannot land on or target them", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  const knight = addPiece(game, "player", "knight", 5, 2);
  const target = addPiece(game, "enemy", "pawn", 3, 1);

  assert.equal(game.canAttack(knight, target), true);
  assert.equal(game.canAttackFrom(knight, 5, 2, { side: "enemy", row: 3, col: 3 }), false);
  assert.equal(coords(game.legalMoves(knight)).includes("3,3"), false);
});

test("placement preview and overlays respect blocked center squares", () => {
  const game = loadGame();
  emptyBoard(game, "brokenCenter");
  game.state.phase = "setup";
  game.state.selectedType = "rook";
  game.SCENARIOS.brokenCenter.blockedSquares.push({ row: 6, col: 4 });
  game.state.previewPlacementSquare = { row: 6, col: 4 };

  assert.equal(game.placementPreviewPiece(), null);
  assert.equal(game.buildBoardOverlays().has(game.squareKey(6, 4)), false);
});

test("reset clears stale hover and selected inspection state", () => {
  const game = loadGame();
  emptyBoard(game);
  const selected = addPiece(game, "player", "king", 8, 4);
  const hovered = addPiece(game, "enemy", "pawn", 1, 4);
  game.state.selectedInspectPieceId = selected.id;
  game.state.hoverInspectPieceId = hovered.id;

  game.resetState();

  assert.equal(game.state.selectedInspectPieceId, null);
  assert.equal(game.state.hoverInspectPieceId, null);
});

test("pawn mirror reaches stalemate action cap and scoreboard shows stalemate", async () => {
  const game = loadGame();
  emptyBoard(game);
  game.SCENARIOS.variety.actionLimit = 40;
  game.state.phase = "running";
  for (let col = 2; col <= 7; col += 1) {
    addPiece(game, "player", "pawn", 8, col);
    addPiece(game, "enemy", "pawn", 1, col);
  }
  game.captureScoreSnapshot();
  game.prepareOpeningInitiative();

  for (let i = 0; i < 80 && game.state.phase !== "ended"; i += 1) {
    await game.takeOneAction();
  }
  game.renderScoreboard();

  assert.equal(game.state.phase, "ended");
  assert.equal(game.state.result, "stalemate");
  assert.equal(game.state.actionNumber, 40);
  assert.equal(game.state.log.at(-1).text, "Stalemate: action limit reached.");
  assert.equal(game.scoreboardEl.hidden, false);
  assert.equal(game.scoreboardTitleEl.textContent, "Stalemate");
  assert.equal(game.scoreboardGradeEl.textContent, "D");
});

test("sound toggle and volume control generated sound calls", () => {
  const game = loadGame({ audio: true });

  assert.equal(game.state.soundEnabled, true);
  assert.equal(game.state.soundVolume, 0.3);
  assert.equal(game.playSound("place"), true);
  assert.equal(game.audioInstances.length, 1);
  assert.equal(game.audioInstances[0].oscillators.length, 2);
  assert.equal(game.audioInstances[0].gains[0].gain.value, 0.3);

  game.state.soundEnabled = false;
  game.updateMasterVolume();
  const oscillatorCount = game.audioInstances[0].oscillators.length;

  assert.equal(game.playSound("move"), false);
  assert.equal(game.audioInstances[0].oscillators.length, oscillatorCount);
  assert.equal(game.audioInstances[0].gains[0].gain.value, 0);

  game.state.soundEnabled = true;
  game.state.soundVolume = 0.2;
  game.updateMasterVolume();

  assert.equal(game.playSound("ko"), true);
  assert.equal(game.audioInstances[0].gains[0].gain.value, 0.2);
});

test("attack animation creates damage and kill effect nodes", async () => {
  const game = loadGame({ stubAnimations: false, holdSleep: true });
  emptyBoard(game);
  const actor = addPiece(game, "player", "pawn", 8, 4);
  const target = addPiece(game, "enemy", "pawn", 7, 5);

  const animation = game.animateAttack(actor, target, true);
  await Promise.resolve();

  const classes = Array.from(game.effectLayer.children, (child) => child.className);
  const damage = game.effectLayer.children.find((child) => child.className === "damage-number");
  const ko = game.effectLayer.children.find((child) => child.className === "ko-burst");

  assert.equal(classes.some((className) => className.includes("hit-pulse")), true);
  assert.equal(classes.includes("damage-number"), true);
  assert.equal(classes.includes("ko-burst"), true);
  assert.equal(damage.textContent, "-1");
  assert.equal(damage.style["--effect-duration"], "1050ms");
  assert.equal(ko.style["--effect-duration"], "1350ms");

  game.finishSleep();
  await animation;

  assert.deepEqual(Array.from(game.effectLayer.children, (child) => child.className), ["damage-number", "ko-burst"]);
  assert.deepEqual(game.timers.map((timer) => timer.ms), [1050, 1350]);

  game.runTimers();

  assert.equal(game.effectLayer.children.length, 0);
});

test("step, pause, resolve, and scoreboard states still work", async () => {
  const game = loadGame();
  emptyBoard(game);
  game.state.phase = "setup";
  game.state.scoreSnapshot = null;
  addPiece(game, "player", "pawn", 8, 4);
  addPiece(game, "enemy", "pawn", 1, 4);

  await game.stepOneAction();

  assert.match(game.state.phase, /^(paused|ended)$/);

  game.state.phase = "running";
  game.togglePause();
  assert.equal(game.state.phase, "paused");

  game.state.phase = "ended";
  game.state.result = "victory";
  game.state.scoreSnapshot = {
    scenarioName: "Harness",
    startingBudget: 1,
    budgetRemaining: 0,
    budgetSpent: 1,
    startActionNumber: 0,
    playerArmy: [{ type: "pawn", side: "player" }],
    enemyArmy: [{ type: "pawn", side: "enemy" }],
    playerCounts: { pawn: 1 },
    enemyCounts: { pawn: 1 },
  };
  game.state.actionNumber = 2;
  game.state.pieces = [game.createPiece("player", "pawn", 7, 4)];
  game.renderScoreboard();

  assert.equal(game.scoreboardEl.hidden, false);
  assert.equal(game.scoreboardTitleEl.textContent, "Victory");
});

test("equal budget scramble generator respects budget, limits, and deployment zone", () => {
  const game = loadGame();
  const generated = game.generateEqualBudgetScrambleArmy(
    { budget: 35, rows: 8, cols: 8, enemyDeployRows: 2 },
    sequenceRandom([0.12, 0.82, 0.34, 0.64, 0.18, 0.91, 0.47, 0.73, 0.28, 0.56])
  );

  const counts = generated.enemies.reduce((summary, piece) => {
    summary[piece.type] = (summary[piece.type] || 0) + 1;
    return summary;
  }, {});
  const frontlineCount = (counts.pawn || 0) + (counts.knight || 0) + (counts.king || 0);
  const usedSquares = new Set(generated.enemies.map((piece) => `${piece.row},${piece.col}`));

  assert.ok(generated.budgetUsed <= 35);
  assert.ok(generated.budgetUsed >= 30);
  assert.equal(generated.budgetUsed, game.armyCost(generated.enemies));
  assert.ok((counts.queen || 0) <= 1);
  assert.ok((counts.rook || 0) <= 2);
  assert.ok(frontlineCount >= 3);
  assert.ok(generated.enemies.length >= 5);
  assert.equal(usedSquares.size, generated.enemies.length);
  generated.enemies.forEach((piece) => {
    assert.ok(piece.row >= 0 && piece.row <= 1);
    assert.ok(piece.col >= 0 && piece.col <= 7);
  });
});

test("equal budget scramble reset populates random enemy army and updates scenario controls", () => {
  const game = loadGame();
  game.state.scenarioId = "equalBudgetScramble";
  game.resetState();
  game.renderStatus();

  const enemies = game.state.pieces.filter((piece) => piece.side === "enemy");

  assert.equal(game.SCENARIOS.equalBudgetScramble.budget, 35);
  assert.equal(game.boardRows(), 8);
  assert.equal(game.boardCols(), 8);
  assert.equal(game.state.budget, 35);
  assert.equal(game.state.phase, "setup");
  assert.equal(game.state.scenarioEnemyArmy.length, enemies.length);
  assert.equal(game.state.enemyBudgetUsed, game.armyCost(game.state.scenarioEnemyArmy));
  assert.ok(game.state.enemyBudgetUsed >= 30);
  assert.match(game.enemyBudgetUsedEl.textContent, /Enemy budget used: \d+ \/ 35/);
  assert.equal(game.budgetValueEl.textContent, "35");
  assert.equal(game.enemyBudgetUsedEl.hidden, false);
  assert.equal(game.rerollEnemyButton.hidden, false);
  assert.equal(game.rerollEnemyButton.disabled, false);
  enemies.forEach((piece) => {
    assert.ok(piece.row >= 0 && piece.row <= 1);
    assert.ok(piece.col >= 0 && piece.col <= 7);
  });
});

for (const scenarioId of ["variety", "swarm", "brokenCenter", "pillarGarden", "twinCauseways", "fortressRing", "equalBudgetScramble"]) {
  test(`${scenarioId} scenario still resolves without hanging`, async () => {
    const game = loadGame();
    game.state.scenarioId = scenarioId;
    game.resetState();
    game.state.phase = "running";
    game.state.speed = "fast";
    addPiece(game, "player", "pawn", game.boardRows() - 2, Math.min(4, game.boardCols() - 1));
    game.prepareOpeningInitiative();

    for (let i = 0; i < 600 && game.state.phase !== "ended"; i += 1) {
      await game.takeOneAction();
    }

    assert.equal(game.state.phase, "ended");
    assert.match(game.state.result, /^(victory|defeat|stalemate)$/);
  });
}
