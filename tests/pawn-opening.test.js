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

function loadGame(options = {}) {
  const { stubAnimations = true, holdSleep = false } = options;
  const elements = new Map();
  const timers = [];
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
    window: {
      setTimeout(callback, ms) {
        timers.push({ callback, ms });
        return timers.length;
      },
    },
  };
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
  placementPreviewPiece,
  buildBoardOverlays,
  legalMoves,
  chooseMove,
  decideAction,
  canAttack,
  canThreatenSquare,
  prepareOpeningInitiative,
  chooseNextActor,
  animateAttack,
  effectLayer,
  stepOneAction,
  togglePause,
  takeOneAction,
  renderScoreboard,
  scoreboardEl,
  scoreboardTitleEl,
  squareKey,
  resetState,
  timers: globalThis.__timers,
  runTimers: () => globalThis.__timers.splice(0).forEach((timer) => timer.callback()),
  finishSleep: () => globalThis.__finishSleep && globalThis.__finishSleep(),
};
`, context);
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

for (const scenarioId of ["variety", "swarm"]) {
  test(`${scenarioId} scenario still progresses to win/loss`, async () => {
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
    assert.match(game.state.result, /^(victory|defeat)$/);
  });
}
