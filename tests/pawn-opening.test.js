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
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
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

function loadGame() {
  const elements = new Map();
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
    window: {
      setTimeout(callback) {
        callback();
        return 0;
      },
    },
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
  vm.runInContext(`${source}
sleep = () => Promise.resolve();
animateMove = () => Promise.resolve();
animateAttack = () => Promise.resolve();
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
  takeOneAction,
  squareKey,
  resetState,
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
