# Greg's Totally Inaccurate Chess Simulator

A playful browser-based chess battle simulator where you buy a small army, deploy it in the blue zone, and watch the fight resolve through initiative, movement, attacks, and a very chatty battle log.

The current default mode is **Equal Budget Scramble**:
- Standard 8x8 board
- 35-point budget for both sides
- Randomly generated enemy army
- `Reroll Enemy` button for fresh matchups before the battle starts

## Play Online

Live game:

https://bobble-head-rob.github.io/chess-battle/

## What You Do

- Spend your 35-point budget on chess-inspired units.
- Deploy your army in the blue starting zone at the bottom of the board.
- Inspect both sides before the fight begins.
- Start the battle and watch the turn order unfold by initiative.

## Main Features

- Chess-inspired piece roster with distinct movement and attack behavior
- Equal Budget Scramble as the primary/default mode
- Random enemy army generation with rerolls before battle
- Initiative-driven combat with tie alternation for clearer action order
- Automatic pawn promotion to queens
- Inspect panel for piece stats and readiness
- Board overlays for moves, attacks, threat, and protection
- Detailed battle log for readable combat outcomes
- Pause and step controls for slow, inspectable battles
- Optional browser-generated sound with volume control

## Run Locally

This project is a small static site with no backend.

1. Clone the repo.
2. Start a local static server from the project folder.

Example with Python:

```bash
python3 -m http.server 18999
```

Then open:

http://127.0.0.1:18999/

## Project Notes

- The public UI is focused on Equal Budget Scramble.
- Older scenario architecture is still kept in code for future expansion and testing.
