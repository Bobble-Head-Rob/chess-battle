# Totally Inaccurate Chess Simulator Design

## Public Design Snapshot

- Primary mode: Equal Budget Scramble
- Board: standard 8x8
- Budgets: 35 points for player and enemy
- Deployment: player in the bottom two rows, enemy in the top two rows
- Enemy army: randomly generated, rerollable before battle

## Combat Rules

- Initiative is tracked per piece.
- When a true top-priority tie happens, actions alternate player/enemy until that tie group is resolved.
- Ranged pieces attack from their current square.
- Pawns and kings are melee movers.
- Knights leap to attack and return if the target survives.
- Pawns promote automatically to queens on the back rank.
- Kings can punish pieces that move out of adjacency with opportunity attacks.

## UX Goals

- Keep battles readable.
- Let players inspect why units moved or attacked.
- Make randomness easy to understand through deployment, overlays, and the battle log.
