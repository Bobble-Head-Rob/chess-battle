# Chess Battle Sim Design

## v0 Combat Rules

Ranged pieces:
- Bishop, rook, queen.
- Attack from current square.
- Always remain on original square.
- Visual attack beam/pulse.
- Counterattack targets their original square.

Melee pieces:
- Pawn and king.
- If attack kills target, move into target square.
- If attack does not kill target, stay in original square for v0.

Knight:
- Short-ranged leaping striker.
- Attacks using L-shape range.
- If target dies, knight moves into target square.
- If target survives, knight returns to original square.
- Visual: hop/strike/return.

## Initiative

- Initiative is per piece, not per side.
- Each piece has speed.
- Each tick adds speed to initiative.
- At 10 initiative, a piece acts.
- After acting, subtract 10 initiative.
- White wins ties.
- Guard/hold can cost less initiative later.

Starter speeds:
- Pawn: 2
- Knight: 3
- Bishop: 2
- Rook: 1
- Queen: 2
- King: 1

## v0 Board

- Scenario selector resets the board, budget, log, and battle state.
- Default scenario: Variety Skirmish.
- Variety Skirmish board: 10x10.
- Variety Skirmish player budget: 50.
- Variety Skirmish enemy army: 8 pawns, 4 knights, 2 bishops, 1 rook, 1 queen.
- Alternate scenario: Pawn/Knight Swarm.
- Pawn/Knight Swarm board: 12x12.
- Pawn/Knight Swarm player budget: 55.
- Pawn/Knight Swarm enemy army: 20 pawns and 10 knights.
- Player deploys in bottom 3 rows.
- Enemy deploys in top 3 rows.

## v0 UI

- Browser-based.
- Piece placement toolbar.
- Budget display.
- Start / pause / step / reset.
- Speed control.
- Animated attacks.
- Battle log.
- Win/loss state.
