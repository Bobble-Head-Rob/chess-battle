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
  state,
  createPiece,
  inspectPiece,
  clearHoverInspection,
  activeOverlayPiece,
  activeBoardInspection,
  placementPreviewPiece,
  canPreviewPlacement,
  buildBoardOverlays,
  renderBoard,
  legalMoves,
  chooseMove,
  decideAction,
  canAttack,
  canAttackFrom,
  canThreatenSquare,
  isBlockedSquare,
  placePlayerPiece,
  shouldPenalizeImmediateReturn,
  playSound,
  updateMasterVolume,
  prepareOpeningInitiative,
  captureScoreSnapshot,
  chooseNextActor,
  animateAttack,
  effectLayer,
  stepOneAction,
  togglePause,
  takeOneAction,
  renderScoreboard,
  renderInspectPanel,
  inspectHintEl,
  inspectDetailsEl,
  scoreboardEl,
  scoreboardTitleEl,
  scoreboardGradeEl,
  boardEl,
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
}

function addPiece(game, side, type, row, col) {
  const piece = game.createPiece(side, type, row, col);
  game.state.pieces.push(piece);
  return piece;
}

function coords(moves) {
  return Array.from(moves, (move) => `${move.row},${move.col}`);
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

test("rook prefers a move creating straight-line attack potential", () => {
  const game = loadGame();
  emptyBoard(game);
  const rook = addPiece(game, "player", "rook", 8, 1);
  const target = addPiece(game, "enemy", "bishop", 5, 3);

  const move = game.chooseMove(rook);

  assert.equal(game.canAttackFrom(rook, move.row, move.col, target), true);
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

for (const scenarioId of ["variety", "swarm", "brokenCenter"]) {
  test(`${scenarioId} scenario still resolves without hanging`, async () => {
    const game = loadGame();
    game.state.scenarioId = scenarioId;
    game.resetState();
    game.state.phase = "running";
    game.state.speed = "fast";
    addPiece(game, "player", "pawn", game.SCENARIOS[scenarioId].boardSize - 2, 4);
    game.prepareOpeningInitiative();

    for (let i = 0; i < 600 && game.state.phase !== "ended"; i += 1) {
      await game.takeOneAction();
    }

    assert.equal(game.state.phase, "ended");
    assert.match(game.state.result, /^(victory|defeat|stalemate)$/);
  });
}
